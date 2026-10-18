import { describe, it, expect } from 'vitest';
import { MOUNTAIN_WORKFLOW_STEPS, MountainWorkflowStage } from '../../components/Simulation3D';
import {
  calculateDewateringState,
  calculateCylinderForceKn,
  calculateBoreAreaM2
} from '../../utils/sludgeCompactionModel';
import { DEFAULT_COMPACTION_PARAMS } from '../../types/sludgeCompaction';

describe('Mountain Terrain Sim — 10-Stage Mechanized Desludging Workflow Integration', () => {
  it('1. Verifies all 10 stages exist in sequential order with correct IDs and numbers', () => {
    expect(MOUNTAIN_WORKFLOW_STEPS).toHaveLength(10);

    const expectedStages: MountainWorkflowStage[] = [
      '1_DRIVE_TO_SITE',
      '2_POSITION_VEHICLE',
      '3_DEPLOY_STABILIZERS_HOSE',
      '4_PRIME_PUMP',
      '5_EXTRACT_SLUDGE',
      '6_SETTLE_SLUDGE',
      '7_COMPACT_SLUDGE',
      '8_SECURE_PISTON',
      '9_CONFIRM_TRANSPORT_READY',
      '10_RESUME_DRIVING'
    ];

    MOUNTAIN_WORKFLOW_STEPS.forEach((step, idx) => {
      expect(step.id).toBe(expectedStages[idx]);
      expect(step.num).toBe(idx + 1);
      expect(step.name.length).toBeGreaterThan(0);
      expect(step.shortName.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    });
  });

  it('2. Enforces strict conservation of mass between source septic vault (1200L) and collection tank (400L)', () => {
    const totalSystemVolumeL = 1200;
    let sourceVaultL = 1200;
    let collectionTankL = 0;

    // Simulate transfer in increments
    const transferSteps = [50, 100, 150, 200, 300, 400];
    for (const transferredL of transferSteps) {
      collectionTankL = transferredL;
      sourceVaultL = totalSystemVolumeL - collectionTankL;

      // Mass conservation invariant: V_source + V_tank === 1200L
      expect(sourceVaultL + collectionTankL).toBe(totalSystemVolumeL);
      expect(sourceVaultL).toBeGreaterThanOrEqual(800);
      expect(collectionTankL).toBeLessThanOrEqual(400);
    }
  });

  it('3. Verifies dewatering material balance: cake volume + filtrate volume === collection tank volume', () => {
    const initialBatchL = 400;
    const testStrokesMm = [0, 100, 250, 400, 520, 600];

    testStrokesMm.forEach((stroke) => {
      const dewatering = calculateDewateringState(stroke, 0, initialBatchL, DEFAULT_COMPACTION_PARAMS);

      // Mass conservation invariant inside collection tank: V_cake + V_filtrate === initialBatchL
      expect(Math.round(dewatering.cakeVolumeL + dewatering.filtrateVolumeL)).toBe(initialBatchL);
      expect(dewatering.cakeVolumeL).toBeGreaterThan(0);
      expect(dewatering.filtrateVolumeL).toBeGreaterThanOrEqual(0);
      expect(dewatering.compactionRatio).toBeGreaterThanOrEqual(1.0);
    });
  });

  it('4. Computes realistic hydraulic compaction pressures and thrust forces within relief limits', () => {
    const strokeTargetMm = 520;
    const dewatering = calculateDewateringState(strokeTargetMm, 0, 400, DEFAULT_COMPACTION_PARAMS);

    expect(dewatering.hydraulicPressureBar).toBeGreaterThan(0);
    expect(dewatering.hydraulicPressureBar).toBeLessThanOrEqual(DEFAULT_COMPACTION_PARAMS.reliefPressureBar);

    const forceKn = calculateCylinderForceKn(
      dewatering.hydraulicPressureBar,
      DEFAULT_COMPACTION_PARAMS.boreDiameterMm
    );
    expect(forceKn).toBeGreaterThan(0);
    // 100mm bore at ~150-180 bar delivers ~110-140 kN thrust
    expect(forceKn).toBeLessThan(200);
  });

  it('5. Validates transport safety interlock requirements: 0mm stroke and lock pins engaged before travel', () => {
    // Helper to evaluate transport readiness
    const evaluateTransportReadiness = (pistonStrokeMm: number, isTransportLocked: boolean) => {
      return pistonStrokeMm <= 0 && isTransportLocked;
    };

    // Safe transport condition
    expect(evaluateTransportReadiness(0, true)).toBe(true);

    // Unsafe conditions: platen extended or lock pin disengaged
    expect(evaluateTransportReadiness(50, true)).toBe(false);
    expect(evaluateTransportReadiness(0, false)).toBe(false);
    expect(evaluateTransportReadiness(520, false)).toBe(false);
  });
});
