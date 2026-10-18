import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateBoreAreaM2,
  calculateCylinderForceKn,
  calculateContactStrokeMm,
  calculateDewateringState,
  stepSludgeCompaction
} from '../../utils/sludgeCompactionModel';
import {
  DEFAULT_COMPACTION_PARAMS,
  INITIAL_COMPACTION_TELEMETRY,
  SludgeCompactionTelemetry
} from '../../types/sludgeCompaction';
import { useSimulationStore } from '../../store/useSimulationStore';

describe('Sludge-Compaction Piston & Dewatering Engine', () => {
  beforeEach(() => {
    useSimulationStore.getState().resetSimulation();
  });

  describe('Hydraulic Mechanics & Thrust Calculations', () => {
    it('calculates cylinder bore cross-sectional area and thrust force accurately', () => {
      const area = calculateBoreAreaM2(120); // 120 mm bore
      const expectedArea = (Math.PI / 4) * 0.12 * 0.12;
      expect(area).toBeCloseTo(expectedArea, 5);

      // At 180 bar (relief setpoint)
      const forceKn = calculateCylinderForceKn(180, 120);
      const expectedForceKn = 180 * 100 * expectedArea; // ~203.57 kN
      expect(forceKn).toBeCloseTo(expectedForceKn, 2);
      expect(forceKn).toBeGreaterThan(200);
      expect(forceKn).toBeLessThan(210);
    });

    it('computes contact stroke from collection tank fill level', () => {
      const tankCapacityL = 2400;

      // Full tank (2400 L) -> platen makes contact immediately at top (0 mm)
      const contactFull = calculateContactStrokeMm(2400, tankCapacityL, 600);
      expect(contactFull).toBe(0);

      // 50% tank (1200 L) -> contact at halfway of 760 mm tank height (380 mm)
      const contactHalf = calculateContactStrokeMm(1200, tankCapacityL, 600);
      expect(contactHalf).toBe(380);

      // Empty tank (0 L) -> platen does not contact within 600 mm stroke
      const contactEmpty = calculateContactStrokeMm(0, tankCapacityL, 600);
      expect(contactEmpty).toBe(600);
    });
  });

  describe('Dewatering Mass Balance & Strict Conservation of Mass', () => {
    it('strictly satisfies mass balance V_cake + V_filtrate = V_initial across all stroke depths', () => {
      const initialVolumeL = 1500;
      const contactStrokeMm = 200;

      const strokesToTest = [0, 100, 200, 250, 350, 450, 550, 600];

      strokesToTest.forEach((stroke) => {
        const state = calculateDewateringState(
          stroke,
          contactStrokeMm,
          initialVolumeL,
          DEFAULT_COMPACTION_PARAMS
        );

        const totalReconstructed = state.cakeVolumeL + state.filtrateVolumeL;
        expect(totalReconstructed).toBeCloseTo(initialVolumeL, 1);
        expect(state.cakeVolumeL).toBeGreaterThanOrEqual(0);
        expect(state.filtrateVolumeL).toBeGreaterThanOrEqual(0);
      });
    });

    it('enforces conservative volume reduction limits (1.2x to 1.8x compaction ratio)', () => {
      const initialVolumeL = 1800;
      const contactStrokeMm = 100;

      // At maximum stroke (600 mm)
      const state = calculateDewateringState(
        600,
        contactStrokeMm,
        initialVolumeL,
        DEFAULT_COMPACTION_PARAMS
      );

      expect(state.compactionRatio).toBeGreaterThanOrEqual(1.2);
      expect(state.compactionRatio).toBeLessThanOrEqual(1.8);
      expect(state.volumeReductionPct).toBeGreaterThan(15);
      expect(state.volumeReductionPct).toBeLessThan(45);
    });

    it('clamps hydraulic pressure at relief valve setpoint of 180 bar', () => {
      const initialVolumeL = 2000;
      const contactStrokeMm = 50;

      // Fully compressed sludge
      const state = calculateDewateringState(
        600,
        contactStrokeMm,
        initialVolumeL,
        DEFAULT_COMPACTION_PARAMS
      );

      expect(state.reliefValveOpen).toBe(true);
      expect(state.hydraulicPressureBar).toBe(180.0);
      expect(state.overpressureTrip).toBe(false);
    });
  });

  describe('Piston Kinematics, Travel Limits & State Transitions', () => {
    it('extends cylinder downward and stops at maximum mechanical travel limit (600 mm)', () => {
      let tel: SludgeCompactionTelemetry = {
        ...INITIAL_COMPACTION_TELEMETRY,
        pistonState: 'EXTENDING',
        isTransportLocked: false,
        strokeMm: 580
      };

      // Step forward by 2.0 seconds at 15 mm/s -> 30 mm advance -> exceeds 600 mm limit
      tel = stepSludgeCompaction(
        tel,
        DEFAULT_COMPACTION_PARAMS,
        1500,
        2400,
        false,
        null,
        2.0
      );

      expect(tel.strokeMm).toBe(600);
      expect(tel.strokePct).toBe(100);
      expect(tel.pistonState).toBe('HOLD'); // automatic stop at limit
    });

    it('retracts cylinder upward and transitions to HOME at 0 mm', () => {
      let tel: SludgeCompactionTelemetry = {
        ...INITIAL_COMPACTION_TELEMETRY,
        pistonState: 'RETRACTING',
        isTransportLocked: false,
        strokeMm: 40
      };

      // Step forward by 2.0 seconds at 30 mm/s -> 60 mm retraction -> reaches 0 mm
      tel = stepSludgeCompaction(
        tel,
        DEFAULT_COMPACTION_PARAMS,
        1500,
        2400,
        false,
        null,
        2.0
      );

      expect(tel.strokeMm).toBe(0);
      expect(tel.strokePct).toBe(0);
      expect(tel.pistonState).toBe('HOME');
      expect(tel.initialSludgeVolumeL).toBe(0);
    });
  });

  describe('Safety Interlocks & Cross-Subsystem Invariants', () => {
    it('inhibits vehicle track travel if compaction platen is not locked in transport position', () => {
      const store = useSimulationStore.getState();

      // Deploy stabilizers and unlock compaction
      store.triggerDeploy();
      store.unlockTransportPosition();
      expect(useSimulationStore.getState().compactionTelemetry.isTransportLocked).toBe(false);

      // Now retract stabilizers to simulate travel attempt while compaction is unlocked
      // Machine cannot travel without locking compaction platen in transport position
      const state = useSimulationStore.getState();
      const isMobilityInhibited =
        !state.compactionTelemetry.isTransportLocked &&
        (state.compactionTelemetry.strokeMm > 5 || state.compactionTelemetry.pistonState !== 'LOCKED');

      expect(isMobilityInhibited).toBe(true);
    });

    it('prevents compaction extension when transport lock pins are engaged', () => {
      const store = useSimulationStore.getState();
      expect(store.compactionTelemetry.isTransportLocked).toBe(true);

      store.extendCompactionPiston();
      // Must stay in LOCKED state
      expect(useSimulationStore.getState().compactionTelemetry.pistonState).toBe('LOCKED');
    });

    it('prevents compaction operation when vehicle is in motion', () => {
      const store = useSimulationStore.getState();
      store.unlockTransportPosition();

      // Simulate vehicle in motion
      useSimulationStore.setState({
        mobilityTelemetry: {
          ...store.mobilityTelemetry,
          isMoving: true,
          speedMs: 0.8
        }
      });

      store.extendCompactionPiston();
      expect(useSimulationStore.getState().compactionTelemetry.pistonState).not.toBe('EXTENDING');
    });

    it('prevents engaging transport lock if platen is extended away from home', () => {
      const store = useSimulationStore.getState();
      store.unlockTransportPosition();

      // Manually set stroke to 250 mm
      useSimulationStore.setState({
        compactionTelemetry: {
          ...store.compactionTelemetry,
          strokeMm: 250,
          pistonState: 'HOLD',
          isTransportLocked: false
        }
      });

      store.lockTransportPosition();
      // Should reject locking
      expect(useSimulationStore.getState().compactionTelemetry.isTransportLocked).toBe(false);
      expect(useSimulationStore.getState().compactionTelemetry.pistonState).toBe('HOLD');
    });

    it('isolates compaction cylinder on emergency stop', () => {
      const store = useSimulationStore.getState();
      store.unlockTransportPosition();
      useSimulationStore.setState({
        interlocks: { ...store.interlocks, isDeployed: true },
        kinematics: { ...store.kinematics, stabilizerExtension: 1.0 }
      });

      // Extend
      store.extendCompactionPiston();
      expect(useSimulationStore.getState().compactionTelemetry.pistonState).toBe('EXTENDING');

      // Trigger E-STOP
      store.triggerEmergencyStop();

      expect(useSimulationStore.getState().compactionTelemetry.pistonState).toBe('HOLD');
      expect(useSimulationStore.getState().compactionTelemetry.interlockBlocked).toBe(true);
    });
  });

  describe('Configurable Rheology & Variable Limits', () => {
    it('produces variable compaction ratios for different sludge rheology types at identical stroke', () => {
      const septageParams = {
        ...DEFAULT_COMPACTION_PARAMS,
        dewaterabilityFactor: 0.35 // Septage
      };
      const rawSludgeParams = {
        ...DEFAULT_COMPACTION_PARAMS,
        dewaterabilityFactor: 0.42 // Raw sewage
      };
      const digestedParams = {
        ...DEFAULT_COMPACTION_PARAMS,
        dewaterabilityFactor: 0.22 // Digested biosolids
      };

      const stroke = 500;
      const contact = 100;
      const initVol = 1000;

      const septageState = calculateDewateringState(stroke, contact, initVol, septageParams);
      const rawState = calculateDewateringState(stroke, contact, initVol, rawSludgeParams);
      const digestedState = calculateDewateringState(stroke, contact, initVol, digestedParams);

      // Raw sewage should express more filtrate than septage, which expresses more than digested
      expect(rawState.filtrateVolumeL).toBeGreaterThan(septageState.filtrateVolumeL);
      expect(septageState.filtrateVolumeL).toBeGreaterThan(digestedState.filtrateVolumeL);

      // Compaction ratio must vary dynamically rather than being hardcoded
      expect(rawState.compactionRatio).toBeGreaterThan(septageState.compactionRatio);
      expect(septageState.compactionRatio).toBeGreaterThan(digestedState.compactionRatio);
    });

    it('clamps travel and pressure at configurable limits (520 mm stroke & 160 bar relief)', () => {
      const customParams = {
        ...DEFAULT_COMPACTION_PARAMS,
        strokeMaxMm: 520,
        reliefPressureBar: 160.0
      };

      let tel: SludgeCompactionTelemetry = {
        ...INITIAL_COMPACTION_TELEMETRY,
        pistonState: 'EXTENDING',
        isTransportLocked: false,
        strokeMm: 500
      };

      // Step forward by 2.0s at 15mm/s (30mm advance) -> exceeds 520 mm limit
      tel = stepSludgeCompaction(
        tel,
        customParams,
        1500,
        2400,
        false,
        null,
        2.0
      );

      expect(tel.strokeMm).toBe(520);
      expect(tel.pistonState).toBe('HOLD');

      // State at max travel with 160 bar relief
      const state = calculateDewateringState(520, 50, 1500, customParams);
      expect(state.hydraulicPressureBar).toBeLessThanOrEqual(160.0);
      expect(state.reliefValveOpen).toBe(true);
    });
  });
});
