import { describe, it, expect } from 'vitest';
import {
  calculateTerrainFeasibility,
  evaluateAllScenariosComparison,
  TERRAIN_SCENARIOS,
  DEFAULT_TERRAIN_PARAMS,
  DEFAULT_STABILITY_THRESHOLDS,
  PRELIMINARY_ESTIMATE_DISCLAIMER
} from '../terrainFeasibilityModel';

describe('Terrain Feasibility & Challenging Operating Environment Model', () => {
  it('1. Calculates nominal feasibility for level paved access scenario', () => {
    const params = {
      slopeDeg: TERRAIN_SCENARIOS.level_paved.defaultSlopeDeg,
      surfaceRoughness: TERRAIN_SCENARIOS.level_paved.defaultRoughness,
      pathWidthM: TERRAIN_SCENARIOS.level_paved.defaultPathWidthM,
      machineSetbackM: TERRAIN_SCENARIOS.level_paved.defaultSetbackM,
      machineHeadingDeg: TERRAIN_SCENARIOS.level_paved.defaultHeadingDeg,
      groundClearanceNominalM: 0.32,
      soilFrictionCoeff: 0.85
    };

    const est = calculateTerrainFeasibility(
      params,
      0.0, // stabilizer not deployed
      15.0, // 15m configured hose
      1180,
      450,
      100,
      DEFAULT_STABILITY_THRESHOLDS
    );

    expect(est.terrainSlopeDeg).toBe(1.5);
    expect(est.stabilityStatus).toBe('nominal');
    expect(est.effectiveTiltDeg).toBe(1.5);
    expect(est.clearanceConflictDetected).toBe(false);
    expect(est.groundClearanceRisk).toBe(false);
    expect(est.hoseLengthAdequate).toBe(true);
    expect(est.requiredHoseLengthM).toBeGreaterThan(5.0);
    expect(est.disclaimer).toBe(PRELIMINARY_ESTIMATE_DISCLAIMER);
  });

  it('2. Compensates tilt dynamically with stabilizer outriggers on steep hill', () => {
    const params = {
      slopeDeg: 14.0,
      surfaceRoughness: 0.65,
      pathWidthM: 2.8,
      machineSetbackM: 11.5,
      machineHeadingDeg: 0,
      groundClearanceNominalM: 0.32,
      soilFrictionCoeff: 0.55
    };

    // Staging without stabilizers
    const unlevelled = calculateTerrainFeasibility(
      params,
      0.0,
      25.0,
      1180,
      450,
      100,
      DEFAULT_STABILITY_THRESHOLDS
    );

    expect(unlevelled.rawChassisTiltDeg).toBe(14.0);
    expect(unlevelled.effectiveTiltDeg).toBe(14.0);
    expect(unlevelled.stabilizerLevelingActive).toBe(false);

    // Staging with full stabilizer deployment (compensating up to 8°)
    const levelled = calculateTerrainFeasibility(
      params,
      1.0,
      25.0,
      1180,
      450,
      100,
      DEFAULT_STABILITY_THRESHOLDS
    );

    expect(levelled.stabilizerLevelingActive).toBe(true);
    expect(levelled.effectiveTiltDeg).toBe(6.0); // 14° - 8°
    expect(levelled.stabilityStatus).toBe('nominal');
  });

  it('3. Triggers caution and critical rollover warnings at elevated slopes', () => {
    const cautionParams = {
      ...DEFAULT_TERRAIN_PARAMS,
      slopeDeg: 16.0
    };

    const cautionEst = calculateTerrainFeasibility(
      cautionParams,
      0.0,
      20.0,
      1180,
      450,
      100,
      DEFAULT_STABILITY_THRESHOLDS
    );

    expect(cautionEst.stabilityStatus).toBe('caution');
    expect(cautionEst.warnings.some(w => w.includes('exceeds 15° limit'))).toBe(true);

    const rolloverParams = {
      ...DEFAULT_TERRAIN_PARAMS,
      slopeDeg: 24.0
    };

    const rolloverEst = calculateTerrainFeasibility(
      rolloverParams,
      0.0,
      20.0,
      1180,
      450,
      100,
      DEFAULT_STABILITY_THRESHOLDS
    );

    expect(rolloverEst.stabilityStatus).toBe('critical_unstable');
    expect(rolloverEst.warnings.some(w => w.includes('CRITICAL INSTABILITY'))).toBe(true);
  });

  it('4. Detects lateral clearance conflicts in narrow access paths', () => {
    const narrowParams = {
      slopeDeg: 2.0,
      surfaceRoughness: 0.2,
      pathWidthM: 1.55, // Tight path
      machineSetbackM: 12.0,
      machineHeadingDeg: 0,
      groundClearanceNominalM: 0.32,
      soilFrictionCoeff: 0.75
    };

    // Stowed machine width is 1.35m -> lateral margin = (1.55 - 1.35)/2 = 0.10m (< 0.15m min threshold)
    const tightEst = calculateTerrainFeasibility(
      narrowParams,
      0.0,
      20.0,
      1180,
      450,
      100,
      DEFAULT_STABILITY_THRESHOLDS
    );

    expect(tightEst.lateralClearanceMarginM).toBe(0.10);
    expect(tightEst.clearanceConflictDetected).toBe(true);
    expect(tightEst.warnings.some(w => w.includes('Restricted clearance alert'))).toBe(true);
  });

  it('5. Computes required umbilical length and flags insufficient hose deficits', () => {
    const distantParams = {
      slopeDeg: 10.0,
      surfaceRoughness: 0.3,
      pathWidthM: 3.0,
      machineSetbackM: 15.0,
      machineHeadingDeg: 0,
      groundClearanceNominalM: 0.32,
      soilFrictionCoeff: 0.75
    };

    // Short hose of 10m
    const deficitEst = calculateTerrainFeasibility(
      distantParams,
      0.5,
      10.0,
      1180,
      450,
      100,
      DEFAULT_STABILITY_THRESHOLDS
    );

    expect(deficitEst.hoseLengthAdequate).toBe(false);
    expect(deficitEst.hoseLengthDeficitM).toBeGreaterThan(0);
    expect(deficitEst.warnings.some(w => w.includes('Insufficient hose length'))).toBe(true);

    // Ample hose of 30m
    const ampleEst = calculateTerrainFeasibility(
      distantParams,
      0.5,
      30.0,
      1180,
      450,
      100,
      DEFAULT_STABILITY_THRESHOLDS
    );

    expect(ampleEst.hoseLengthAdequate).toBe(true);
    expect(ampleEst.hoseLengthDeficitM).toBe(0);
  });

  it('6. Evaluates all three standard scenarios in side-by-side comparison', () => {
    const comparison = evaluateAllScenariosComparison(0.8, 20.0, DEFAULT_STABILITY_THRESHOLDS);

    expect(comparison).toHaveLength(3);
    const [level, hilly, narrow] = comparison;

    expect(level.id).toBe('level_paved');
    expect(level.feasibilityRating).toBe('FEASIBLE');

    expect(hilly.id).toBe('hilly_sloped');
    expect(hilly.slopeDeg).toBe(14.0);

    expect(narrow.id).toBe('narrow_restricted');
    expect(narrow.pathWidthM).toBe(1.65);
  });
});
