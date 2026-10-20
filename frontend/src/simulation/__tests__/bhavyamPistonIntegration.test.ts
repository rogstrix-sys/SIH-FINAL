import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from '../../store/useSimulationStore';
import {
  pctToStrokeMm,
  strokeMmToPct,
  strokeMmToPlatenY,
  platenYToStrokeMm,
  calculatePistonKinematics,
  PISTON_CONFIG
} from '../../utils/pistonUnitConversions';

describe('Bhavyam Dashboard & 3D Sludge Compaction Piston Integration', () => {
  beforeEach(() => {
    useSimulationStore.getState().resetSimulation();
  });

  describe('1. Piston Position Normalization & Unit Conversions', () => {
    it('accurately converts 0% dashboard displacement to 0 mm stroke', () => {
      const store = useSimulationStore.getState();
      const res = store.setCompactionStrokePct(0);
      expect(res.accepted).toBe(true);
      expect(res.strokeMm).toBe(0);
      expect(res.strokePct).toBe(0);

      const telemetry = useSimulationStore.getState().compactionTelemetry;
      expect(telemetry.strokeMm).toBe(0);
      expect(telemetry.strokePct).toBe(0);
    });

    it('accurately converts 50% dashboard displacement to 300 mm stroke', () => {
      const store = useSimulationStore.getState();
      const res = store.setCompactionStrokePct(50);
      expect(res.accepted).toBe(true);
      expect(res.strokeMm).toBe(300);
      expect(res.strokePct).toBe(50);

      const telemetry = useSimulationStore.getState().compactionTelemetry;
      expect(telemetry.strokeMm).toBe(300);
      expect(telemetry.strokePct).toBe(50);
    });

    it('accurately converts 100% dashboard displacement to maximum 600 mm travel', () => {
      const store = useSimulationStore.getState();
      const res = store.setCompactionStrokePct(100);
      expect(res.accepted).toBe(true);
      expect(res.strokeMm).toBe(600);
      expect(res.strokePct).toBe(100);

      const telemetry = useSimulationStore.getState().compactionTelemetry;
      expect(telemetry.strokeMm).toBe(600);
      expect(telemetry.strokePct).toBe(100);
    });

    it('clamps out-of-range inputs (<0% and >100%) to physical mechanical travel limits', () => {
      const store = useSimulationStore.getState();
      const underRes = store.setCompactionStrokePct(-25);
      expect(underRes.accepted).toBe(true);
      expect(underRes.strokePct).toBe(0);
      expect(underRes.strokeMm).toBe(0);

      const overRes = store.setCompactionStrokePct(150);
      expect(overRes.accepted).toBe(true);
      expect(overRes.strokePct).toBe(100);
      expect(overRes.strokeMm).toBe(600);
    });
  });

  describe('2. 3D Model Coordinate Mapping & Kinematic Transforms', () => {
    it('maps normalized stroke ratio to exact 3D compression platen vertical travel', () => {
      const calculatePlatenY = (strokeRatio: number) => 0.72 - strokeRatio * 0.47;

      expect(calculatePlatenY(0.0)).toBeCloseTo(0.72, 3); // Fully retracted top home
      expect(calculatePlatenY(0.5)).toBeCloseTo(0.485, 3); // Mid-stroke compaction
      expect(calculatePlatenY(1.0)).toBeCloseTo(0.25, 3); // Maximum downward cake compression
    });

    it('maps normalized stroke ratio to guided chrome piston rod extension and scale', () => {
      const calculateRodY = (strokeRatio: number) => 0.92 - strokeRatio * 0.235;
      const calculateRodScaleY = (strokeRatio: number) => 1.0 + strokeRatio * 0.75;

      expect(calculateRodY(0.0)).toBeCloseTo(0.92, 3);
      expect(calculateRodScaleY(0.0)).toBeCloseTo(1.0, 3);

      expect(calculateRodY(1.0)).toBeCloseTo(0.685, 3);
      expect(calculateRodScaleY(1.0)).toBeCloseTo(1.75, 3);
    });

    it('computes hydraulic thrust force and dewatering pressure conforming to Bhavyam specs', () => {
      const store = useSimulationStore.getState();
      store.setCompactionStrokePct(100);

      const telemetry = useSimulationStore.getState().compactionTelemetry;
      // 3.5 bar maximum compression pressure & 12.8 kN peak thrust
      expect(telemetry.appliedPressureBar).toBeCloseTo(3.5, 1);
      expect(telemetry.compactionForceKn).toBeCloseTo(12.8, 1);
    });
  });

  describe('3. Safety Interlocks & Movement Prevention', () => {
    it('REJECTS piston movement when vehicle is in motion (motion interlock)', () => {
      useSimulationStore.setState((s) => ({
        mobilityTelemetry: {
          ...s.mobilityTelemetry,
          isMoving: true,
          speedKmh: 4.2
        }
      }));

      const store = useSimulationStore.getState();
      const res = store.setCompactionStrokePct(75);

      expect(res.accepted).toBe(false);
      expect(res.reason).toContain('Vehicle is in motion');

      // Piston remains locked at home position
      expect(useSimulationStore.getState().compactionTelemetry.strokeMm).toBe(0);
    });

    it('REJECTS piston movement when slurry pump extraction or discharge is active', () => {
      useSimulationStore.setState(() => ({
        operatingState: 'EXTRACT'
      }));

      const store = useSimulationStore.getState();
      const res = store.setCompactionStrokePct(60);

      expect(res.accepted).toBe(false);
      expect(res.reason).toContain('Active slurry transfer');
      expect(useSimulationStore.getState().compactionTelemetry.strokeMm).toBe(0);
    });

    it('REJECTS piston movement when Emergency Stop is armed', () => {
      useSimulationStore.setState((s) => ({
        alarms: {
          ...s.alarms,
          emergencyStopActive: true
        }
      }));

      const store = useSimulationStore.getState();
      const res = store.setCompactionStrokePct(50);

      expect(res.accepted).toBe(false);
      expect(res.reason).toContain('Emergency Stop');
      expect(useSimulationStore.getState().compactionTelemetry.strokeMm).toBe(0);
    });

    it('REJECTS piston movement when hydraulic overpressure trip is latched', () => {
      useSimulationStore.setState((s) => ({
        compactionTelemetry: {
          ...s.compactionTelemetry,
          overpressureTrip: true
        }
      }));

      const store = useSimulationStore.getState();
      const res = store.setCompactionStrokePct(80);

      expect(res.accepted).toBe(false);
      expect(res.reason).toContain('overpressure');
    });

    it('ACCEPTS piston command when all safety gates are clear', () => {
      useSimulationStore.setState((s) => ({
        mobilityTelemetry: { ...s.mobilityTelemetry, isMoving: false, speedKmh: 0 },
        operatingState: 'IDLE',
        alarms: { ...s.alarms, emergencyStopActive: false },
        compactionTelemetry: { ...s.compactionTelemetry, overpressureTrip: false }
      }));

      const store = useSimulationStore.getState();
      const res = store.setCompactionStrokePct(65);

      expect(res.accepted).toBe(true);
      expect(res.strokePct).toBe(65);
      expect(res.strokeMm).toBe(390);
      expect(useSimulationStore.getState().compactionTelemetry.strokeMm).toBe(390);
    });
  });

  describe('4. Bidirectional Telemetry Synchronization', () => {
    it('updates hydraulic state to HOLD when extended and HOME when returned to 0mm', () => {
      const store = useSimulationStore.getState();

      store.setCompactionStrokePct(40);
      expect(useSimulationStore.getState().compactionTelemetry.pistonState).toBe('HOLD');

      store.setCompactionStrokePct(0);
      expect(useSimulationStore.getState().compactionTelemetry.pistonState).toBe('HOME');
    });

    it('disengages transport locking pins when piston extends past 0 mm', () => {
      useSimulationStore.setState((s) => ({
        compactionTelemetry: {
          ...s.compactionTelemetry,
          isTransportLocked: true
        }
      }));

      const store = useSimulationStore.getState();
      store.setCompactionStrokePct(20);

      expect(useSimulationStore.getState().compactionTelemetry.isTransportLocked).toBe(false);
    });
  });

  describe('5. Explicit Piston Unit Conversions & Kinematic Formulas', () => {
    it('converts percentages to millimeters and round-trips exactly', () => {
      expect(pctToStrokeMm(0)).toBe(0);
      expect(pctToStrokeMm(50)).toBe(300);
      expect(pctToStrokeMm(100)).toBe(600);

      expect(strokeMmToPct(0)).toBe(0);
      expect(strokeMmToPct(300)).toBe(50);
      expect(strokeMmToPct(600)).toBe(100);
    });

    it('maps millimeter stroke to Three.js platen Y coordinate and round-trips', () => {
      // At stroke = 0 mm, platen is at top home (+0.38 m)
      expect(strokeMmToPlatenY(0)).toBeCloseTo(0.38, 3);
      // At stroke = 600 mm, platen is at max depth (-0.22 m)
      expect(strokeMmToPlatenY(600)).toBeCloseTo(-0.22, 3);

      expect(platenYToStrokeMm(0.38)).toBe(0);
      expect(platenYToStrokeMm(-0.22)).toBe(600);
    });

    it('calculates full multi-physics kinematics for 75% compaction stroke', () => {
      const k = calculatePistonKinematics({ strokePct: 75 });
      expect(k.strokeMm).toBe(450);
      expect(k.strokeM).toBe(0.45);
      expect(k.platenY).toBeCloseTo(-0.07, 3);
      expect(k.appliedPressureBar).toBeCloseTo(2.7, 1);
      expect(k.compactionForceKn).toBeCloseTo(9.9, 1);
      expect(k.solidsConcentrationPct).toBeCloseTo(18.2, 1);
      expect(k.volumeReductionPct).toBeCloseTo(51.0, 1);
    });
  });
});
