import { describe, it, expect } from 'vitest';
import {
  calculateTerrainFeasibility,
  evaluateAllScenariosComparison,
  getScenarioDefaultParams,
  calculateBarometricPressureKpa,
  calculateTemperatureAdjustedViscosityCp,
  TERRAIN_SCENARIOS,
  DEFAULT_TERRAIN_PARAMS,
  DEFAULT_STABILITY_THRESHOLDS,
  PRELIMINARY_ESTIMATE_DISCLAIMER
} from '../terrainFeasibilityModel';

describe('Terrain Feasibility & Challenging Operating Environment Model', () => {
  it('1. Calculates nominal feasibility for level paved access scenario', () => {
    const params = getScenarioDefaultParams('level_paved');

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
    const params = getScenarioDefaultParams('hilly_sloped');

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
    expect(cautionEst.warnings.some((w) => w.includes('exceeds 15° limit'))).toBe(true);

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
    expect(rolloverEst.warnings.some((w) => w.includes('CRITICAL INSTABILITY'))).toBe(true);
  });

  it('4. Detects lateral clearance conflicts in narrow access paths', () => {
    const narrowParams = {
      ...getScenarioDefaultParams('narrow_restricted'),
      pathWidthM: 1.55 // Tight path (machine width is 1.35m -> margin is 0.10m < 0.15m min)
    };

    const tightEst = calculateTerrainFeasibility(
      narrowParams,
      0.0,
      20.0,
      1180,
      450,
      100,
      DEFAULT_STABILITY_THRESHOLDS
    );

    expect(tightEst.lateralClearanceMarginM).toBe(0.1);
    expect(tightEst.clearanceConflictDetected).toBe(true);
    expect(tightEst.warnings.some((w) => w.includes('Restricted clearance alert'))).toBe(true);
  });

  it('5. Computes required umbilical length and flags insufficient hose deficits', () => {
    const distantParams = {
      ...DEFAULT_TERRAIN_PARAMS,
      slopeDeg: 10.0,
      surfaceRoughness: 0.3,
      pathWidthM: 3.0,
      machineSetbackM: 15.0
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
    expect(deficitEst.warnings.some((w) => w.includes('Insufficient hose length'))).toBe(true);

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

  it('6. Evaluates barometric pressure drop and vacuum suction lift limit at high altitude', () => {
    // Sea level pressure
    const pSea = calculateBarometricPressureKpa(0);
    expect(pSea).toBeCloseTo(101.3, 0);

    // Ladakh / Himalayan alpine altitude: 3500m MSL
    const pAlpine = calculateBarometricPressureKpa(3500);
    expect(pAlpine).toBeLessThan(70.0);
    expect(pAlpine).toBeGreaterThan(60.0);

    const alpineParams = {
      ...getScenarioDefaultParams('cold_high_altitude'),
      altitudeM: 3500,
      machineSetbackM: 18.0, // High setback on slope causes elevation diff to exceed achievable lift
      slopeDeg: 15.0
    };

    const alpineEst = calculateTerrainFeasibility(
      alpineParams,
      0.5,
      35.0,
      1180,
      450,
      100,
      DEFAULT_STABILITY_THRESHOLDS
    );

    expect(alpineEst.atmosphericPressureKpa).toBe(pAlpine);
    expect(alpineEst.isAltitudeDerated).toBe(true);
    expect(alpineEst.warnings.some((w) => w.includes('Atmospheric lift deficit'))).toBe(true);
  });

  it('7. Calculates temperature-adjusted viscosity and sub-zero thermal alerts', () => {
    // Normal temperature (20°C): baseline viscosity
    const viscNorm = calculateTemperatureAdjustedViscosityCp(450, 20);
    expect(viscNorm).toBe(450);

    // Sub-zero freezing temperature (-10°C): viscosity significantly elevated
    const viscCold = calculateTemperatureAdjustedViscosityCp(450, -10);
    expect(viscCold).toBeGreaterThan(1000);

    const coldParams = {
      ...getScenarioDefaultParams('cold_high_altitude'),
      ambientTempC: -10
    };

    const coldEst = calculateTerrainFeasibility(
      coldParams,
      0.0,
      30.0,
      1180,
      450,
      100,
      DEFAULT_STABILITY_THRESHOLDS
    );

    expect(coldEst.isTemperatureCritical).toBe(true);
    expect(coldEst.effectiveSlurryViscosityCp).toBeGreaterThan(1000);
    expect(coldEst.warnings.some((w) => w.includes('Sub-zero thermal alert'))).toBe(true);
  });

  it('8. Models rainfall intensity, mud sinkage, and saturated soil traction slide risk', () => {
    const muddyParams = {
      ...getScenarioDefaultParams('uneven_muddy'),
      rainfallIntensityMmH: 60,
      slopeDeg: 25.0 // Steep slope with saturated soil triggers traction slide risk
    };

    const muddyEst = calculateTerrainFeasibility(
      muddyParams,
      0.0,
      25.0,
      1180,
      450,
      100,
      DEFAULT_STABILITY_THRESHOLDS
    );

    expect(muddyEst.mudSinkageM).toBeGreaterThan(0.04);
    expect(muddyEst.soilTractionCoeff).toBeLessThanOrEqual(0.40);
    expect(muddyEst.isTractionSlipRisk).toBe(true);
    expect(muddyEst.warnings.some((w) => w.includes('Slope traction slip hazard'))).toBe(true);
  });

  it('9. Evaluates all six standard scenarios in side-by-side comparison', () => {
    const comparison = evaluateAllScenariosComparison(0.8, 25.0);

    expect(comparison).toHaveLength(6);
    const [paved, hilly, muddy, narrow, rain, alpine] = comparison;

    expect(paved.id).toBe('level_paved');
    expect(paved.feasibilityRating).toBe('FEASIBLE');

    expect(hilly.id).toBe('hilly_sloped');
    expect(hilly.slopeDeg).toBe(14.0);

    expect(muddy.id).toBe('uneven_muddy');
    expect(muddy.id).toBe('uneven_muddy');

    expect(narrow.id).toBe('narrow_restricted');
    expect(narrow.pathWidthM).toBe(1.65);

    expect(rain.id).toBe('heavy_rain');

    expect(alpine.id).toBe('cold_high_altitude');
    expect(alpine.atmosphericPressureKpa).toBeLessThan(75.0);
  });
});
