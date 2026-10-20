import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from '../../store/useSimulationStore';
import {
  pctToStrokeMm,
  strokeMmToPct,
  strokeMmToPlatenX,
  platenXToStrokeMm,
  calculatePistonKinematics,
  PISTON_CONFIG
} from '../../utils/pistonUnitConversions';
import {
  calculateDewateringState,
  calculateCylinderForceKn,
  calculateBoreAreaM2
} from '../../utils/sludgeCompactionModel';
import { DEFAULT_COMPACTION_PARAMS } from '../../types/sludgeCompaction';
import { stepVehicleMobility } from '../../utils/terrainPhysics';
import { DEFAULT_MOBILITY_PARAMS, INITIAL_MOBILITY_TELEMETRY } from '../../types/vehicleMobility';
import { DEFAULT_TERRAIN_PARAMS } from '../terrainFeasibilityModel';
import { CameraPreset } from '../../types/digitalTwin';

describe('FINAL REGRESSION TEST — Bhavyam SCADA & Desludge Digital Twin Integration', () => {
  beforeEach(() => {
    useSimulationStore.getState().resetSimulation();
  });

  describe('Check 1: Original Bhavyam Dashboard Controls & State Variables Present', () => {
    it('verifies all multi-physics telemetry variables are mapped in store', () => {
      const state = useSimulationStore.getState();

      // Sludge compaction & dewatering variables
      expect(state.compactionTelemetry).toBeDefined();
      expect(state.compactionTelemetry.strokeMm).toBe(0);
      expect(state.compactionTelemetry.strokePct).toBe(0);
      expect(typeof state.compactionTelemetry.appliedPressureBar).toBe('number');
      expect(typeof state.compactionTelemetry.compactionForceKn).toBe('number');
      expect(state.compactionTelemetry.volumeReductionPct).toBe(0);
      const kin = calculatePistonKinematics({ strokePct: state.compactionTelemetry.strokePct });
      expect(kin.solidsConcentrationPct).toBe(4.2);

      // Vehicle mobility & terrain physics variables
      expect(state.mobilityTelemetry).toBeDefined();
      expect(typeof state.mobilityTelemetry.pitchDeg).toBe('number');
      expect(typeof state.mobilityTelemetry.rollDeg).toBe('number');
      expect(typeof state.mobilityTelemetry.speedKmh).toBe('number');

      // Material balance & payload variables
      expect(state.materialBalance).toBeDefined();
      expect(typeof state.materialBalance.collectionVolumeL).toBe('number');

      // Safety alarms & interlocks
      expect(state.alarms).toBeDefined();
      expect(state.interlocks).toBeDefined();
      expect(state.eventLog).toBeDefined();
    });
  });

  describe('Check 2: Piston-Position Control Moves Actual Horizontal Piston', () => {
    it('translates 0% -> 50% -> 100% displacement to horizontal coordinate travel', () => {
      const store = useSimulationStore.getState();

      // 0% displacement (Retracted Home)
      store.setCompactionStrokePct(0);
      let t = useSimulationStore.getState().compactionTelemetry;
      expect(t.strokePct).toBe(0);
      expect(t.strokeMm).toBe(0);
      expect(strokeMmToPlatenX(t.strokeMm)).toBeCloseTo(-0.50, 3); // Rear home position

      // 50% displacement (Mid-Stroke Compaction)
      store.setCompactionStrokePct(50);
      t = useSimulationStore.getState().compactionTelemetry;
      expect(t.strokePct).toBe(50);
      expect(t.strokeMm).toBe(300);
      expect(strokeMmToPlatenX(t.strokeMm)).toBeCloseTo(-0.20, 3); // Displaced +300mm forward

      // 100% displacement (Full Dewatering Consolidation)
      store.setCompactionStrokePct(100);
      t = useSimulationStore.getState().compactionTelemetry;
      expect(t.strokePct).toBe(100);
      expect(t.strokeMm).toBe(600);
      expect(strokeMmToPlatenX(t.strokeMm)).toBeCloseTo(0.10, 3); // Displaced +600mm forward
    });
  });

  describe('Check 3: Piston Rod and Connected Mechanism Follow Correct Longitudinal Axis', () => {
    it('verifies horizontal rod extension and cake compression along cylinder axis', () => {
      const kHome = calculatePistonKinematics({ strokePct: 0 });
      const kFull = calculatePistonKinematics({ strokePct: 100 });

      // Platen moves purely along longitudinal axis
      expect(kHome.platenX).toBeCloseTo(-0.50, 3);
      expect(kFull.platenX).toBeCloseTo(0.10, 3);

      // Rod extends horizontally from rear gland seal (-0.68m)
      expect(kHome.rodLengthM).toBeCloseTo(0.16, 2);
      expect(kFull.rodLengthM).toBeCloseTo(0.76, 2);
      expect(kFull.rodCenterX).toBeGreaterThan(kHome.rodCenterX);

      // Sludge cake consolidates horizontally against screen (+0.22m)
      expect(kHome.cakeLengthM).toBeCloseTo(0.695, 2);
      expect(kFull.cakeLengthM).toBeCloseTo(0.095, 2);
    });
  });

  describe('Check 4: Dashboard Position and Actual Simulated Position Remain Synchronized', () => {
    it('round-trips percentage to stroke millimeters and Three.js coordinate without drift', () => {
      const testPercentages = [0, 10, 25, 50, 75, 90, 100];

      testPercentages.forEach((pct) => {
        const mm = pctToStrokeMm(pct);
        const backToPct = strokeMmToPct(mm);
        expect(backToPct).toBe(pct);

        const x = strokeMmToPlatenX(mm);
        const backToMm = platenXToStrokeMm(x);
        expect(backToMm).toBe(mm);
      });
    });
  });

  describe('Check 5: Cylinder Body Remains Mounted Correctly', () => {
    it('validates cylinder mounting geometry specifications', () => {
      expect(PISTON_CONFIG.cylinderMountX).toBe(-0.92);
      expect(PISTON_CONFIG.cylinderGlandX).toBe(-0.68);
      expect(PISTON_CONFIG.wedgeWireScreenX).toBe(0.22);
      expect(PISTON_CONFIG.boreDiameterMm).toBe(120);
      expect(PISTON_CONFIG.rodDiameterMm).toBe(60);
      expect(PISTON_CONFIG.reliefPressureBar).toBe(180);
    });
  });

  describe('Check 6: Safety Interlocks Still Enforce All Invariants', () => {
    it('blocks piston movement when crawler tracks are moving', () => {
      useSimulationStore.setState((s) => ({
        mobilityTelemetry: { ...s.mobilityTelemetry, isMoving: true, speedKmh: 3.5 }
      }));

      const res = useSimulationStore.getState().setCompactionStrokePct(40);
      expect(res.accepted).toBe(false);
      expect(res.reason).toContain('Vehicle is in motion');
    });

    it('blocks piston movement during active slurry extraction', () => {
      useSimulationStore.setState(() => ({ operatingState: 'EXTRACT' }));

      const res = useSimulationStore.getState().setCompactionStrokePct(40);
      expect(res.accepted).toBe(false);
      expect(res.reason).toContain('Active slurry transfer');
    });

    it('blocks piston movement when emergency stop is triggered', () => {
      useSimulationStore.setState((s) => ({
        alarms: { ...s.alarms, emergencyStopActive: true }
      }));

      const res = useSimulationStore.getState().setCompactionStrokePct(40);
      expect(res.accepted).toBe(false);
      expect(res.reason).toContain('Emergency Stop');
    });

    it('blocks piston movement when overpressure fault occurs', () => {
      useSimulationStore.setState((s) => ({
        compactionTelemetry: { ...s.compactionTelemetry, overpressureTrip: true }
      }));

      const res = useSimulationStore.getState().setCompactionStrokePct(40);
      expect(res.accepted).toBe(false);
      expect(res.reason).toContain('overpressure');
    });
  });

  describe('Check 7: Tracked Vehicle Mobility & Turning', () => {
    it('accelerates forward and performs zero-radius counter-rotating spin turns', () => {
      let tel = { ...INITIAL_MOBILITY_TELEMETRY };

      // Forward drive
      tel = stepVehicleMobility(
        tel,
        { forward: true, reverse: false, steerLeft: false, steerRight: false, pivotLeft: false, pivotRight: false, brake: false },
        DEFAULT_MOBILITY_PARAMS,
        'level_paved',
        DEFAULT_TERRAIN_PARAMS,
        false,
        null,
        0,
        0.5
      );
      expect(tel.speedMs).toBeGreaterThan(0);

      // Pivot turn in place
      tel = stepVehicleMobility(
        tel,
        { forward: false, reverse: false, steerLeft: false, steerRight: false, pivotLeft: true, pivotRight: false, brake: false },
        DEFAULT_MOBILITY_PARAMS,
        'level_paved',
        DEFAULT_TERRAIN_PARAMS,
        false,
        null,
        0,
        0.5
      );
      expect(tel.steerRateRadS).toBeGreaterThan(0);
      expect(tel.leftTrackSpeedMs).toBeLessThan(0); // Counter-rotating tracks
    });
  });

  describe('Check 8: Camera Presets & Terrain Scenarios', () => {
    it('verifies camera presets and terrain scenarios are selectable', () => {
      const store = useSimulationStore.getState();

      // Camera presets
      const validPresets: CameraPreset[] = ['iso', 'side', 'top', 'tank', 'cutaway', 'reset'];
      validPresets.forEach((preset) => {
        store.setCameraPreset(preset);
        expect(useSimulationStore.getState().cameraPreset).toBe(preset);
      });

      // Terrain scenario switching
      store.setTerrainScenario('hilly_sloped');
      expect(useSimulationStore.getState().selectedScenario).toBe('hilly_sloped');
      expect(useSimulationStore.getState().terrainParams.slopeDeg).toBe(14);
    });
  });

  describe('Check 9: Telemetry Charts, Alarms, and Event Log', () => {
    it('logs events chronologically and updates alarms', () => {
      const store = useSimulationStore.getState();
      const initialLogsCount = store.eventLog.length;

      // Trigger E-stop
      store.triggerEmergencyStop();
      expect(useSimulationStore.getState().alarms.emergencyStopActive).toBe(true);
      expect(useSimulationStore.getState().eventLog.length).toBeGreaterThan(initialLogsCount);
      expect(useSimulationStore.getState().eventLog[0].level).toBe('critical');

      // Resolve fault
      store.triggerResolveFault();
      expect(useSimulationStore.getState().alarms.emergencyStopActive).toBe(false);
    });
  });

  describe('Check 10: Strict Conservation of Mass & Dewatering Physics', () => {
    it('strictly satisfies mass balance V_cake + V_filtrate = V_initial across all stroke depths', () => {
      const initialVolumeL = 400;
      const strokesToTest = [0, 50, 150, 300, 450, 600];

      strokesToTest.forEach((stroke) => {
        const result = calculateDewateringState(stroke, 0, initialVolumeL, DEFAULT_COMPACTION_PARAMS);
        expect(Math.round(result.cakeVolumeL + result.filtrateVolumeL)).toBe(initialVolumeL);
        expect(result.compactionRatio).toBeGreaterThanOrEqual(1.0);
        expect(result.compactionRatio).toBeLessThanOrEqual(2.0);
      });
    });
  });
});
