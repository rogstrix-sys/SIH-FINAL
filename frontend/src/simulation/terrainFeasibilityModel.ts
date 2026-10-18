/**
 * Simplified Engineering Feasibility & Terrain Feasibility Model
 * 
 * Mathematical Equations & Assumptions:
 * 1. Chassis Tilt Calculation:
 *    - pitch = slopeDeg * cos(headingRad)
 *    - roll  = slopeDeg * sin(headingRad)
 *    - tilt  = slopeDeg
 *    - effectiveTilt = max(0, tilt - stabilizerMaxComp * stabilizerDeployFactor)
 * 
 * 2. Hose Length Calculation:
 *    - 3D Euclidean staging distance + vertical vault drop + bend slack allowance
 *    - L_req = sqrt(setback^2 + delta_y^2) + vault_depth (1.8m) + bend_slack (2.0m)
 * 
 * 3. Static & Dynamic Routing Losses:
 *    - Static lift: DeltaP_static = (rho * g * Delta_h) / 1000 (kPa)
 *    - Darcy friction loss with surface roughness penalty:
 *      hf = (f * (L_route / D) + K_minor) * v^2 / (2g)
 * 
 * 4. Clearance Conflicts:
 *    - Lateral margin = (pathWidth - effectiveMachineWidth) / 2
 *    - Effective ground clearance = nominalGC - (surfaceRoughness * 0.22m)
 * 
 * 5. Stability Threshold:
 *    - Nominal threshold: 15.0°
 *    - Critical rollover threshold: 22.0°
 * 
 * DISCLAIMER:
 * PRELIMINARY ENGINEERING ESTIMATE:
 * This model provides simplified kinematic and hydrostatic estimates for planning
 * and feasibility comparison. It is NOT a certified structural, geotechnical,
 * or rollover stability certification.
 */

import {
  TerrainScenarioId,
  TerrainScenarioConfig,
  TerrainParameters,
  StabilityThresholds,
  EngineeringFeasibilityEstimate,
  ScenarioComparisonItem
} from '../types/terrainScenarios';

export const TERRAIN_SCENARIOS: Record<TerrainScenarioId, TerrainScenarioConfig> = {
  level_paved: {
    id: 'level_paved',
    name: '1. Level Paved Access',
    tagline: 'Standard Municipal Highway & Asphalt Staging',
    description: 'Wide, paved approach with 0° - 3° slope. Ample 4.0m lateral clearance and direct suction umbilical run.',
    defaultSlopeDeg: 1.5,
    defaultRoughness: 0.05,
    defaultPathWidthM: 3.8,
    defaultSetbackM: 5.5,
    defaultHeadingDeg: 0,
    groundClearanceNominalM: 0.32,
    environmentType: 'urban_paved'
  },
  hilly_sloped: {
    id: 'hilly_sloped',
    name: '2. Sloped & Uneven Hilly Terrain',
    tagline: 'Mountain Gradient & Loose Rocky Ground',
    description: '14° hillside grade with unpaved surface roughness (0.65). Requires stabilizer outrigger leveling and extended suction hose.',
    defaultSlopeDeg: 14.0,
    defaultRoughness: 0.65,
    defaultPathWidthM: 2.8,
    defaultSetbackM: 11.5,
    defaultHeadingDeg: 25,
    groundClearanceNominalM: 0.32,
    environmentType: 'unpaved_mountain'
  },
  narrow_restricted: {
    id: 'narrow_restricted',
    name: '3. Narrow Access Path (Restricted)',
    tagline: 'Confined Historic Corridor & Flanking Masonry Walls',
    description: 'Ultra-narrow 1.6m pathway with flanking building walls. Tight machine clearance (chassis width 1.35m) and remote hose line.',
    defaultSlopeDeg: 3.5,
    defaultRoughness: 0.35,
    defaultPathWidthM: 1.65,
    defaultSetbackM: 16.0,
    defaultHeadingDeg: 0,
    groundClearanceNominalM: 0.32,
    environmentType: 'restricted_alley'
  }
};

export const DEFAULT_TERRAIN_PARAMS: TerrainParameters = {
  slopeDeg: 1.5,
  surfaceRoughness: 0.05,
  pathWidthM: 3.8,
  machineSetbackM: 5.5,
  machineHeadingDeg: 0,
  groundClearanceNominalM: 0.32,
  soilFrictionCoeff: 0.85
};

export const DEFAULT_STABILITY_THRESHOLDS: StabilityThresholds = {
  maxChassisTiltDeg: 15.0,
  criticalRolloverDeg: 22.0,
  stabilizerMaxCompensationDeg: 8.0,
  minGroundClearanceM: 0.12,
  minPassageClearanceM: 0.15
};

export const PRELIMINARY_ESTIMATE_DISCLAIMER =
  'PRELIMINARY ENGINEERING ESTIMATE: This model calculates simplified geometric and hydraulic estimates for operational planning. It does not replace certified site geotechnical, structural, or heavy-equipment rollover safety certification.';

/**
 * Calculates preliminary engineering feasibility estimates for a given terrain scenario and configuration.
 */
export function calculateTerrainFeasibility(
  params: TerrainParameters,
  stabilizerExtension: number, // 0.0 to 1.0
  configuredHoseLengthM: number,
  slurryDensityKgM3 = 1180,
  slurryViscosityCp = 450,
  hoseDiameterMm = 100,
  thresholds: StabilityThresholds = DEFAULT_STABILITY_THRESHOLDS
): EngineeringFeasibilityEstimate {
  const warnings: string[] = [];

  // 1. Orientation & Chassis Tilt
  const slopeRad = (params.slopeDeg * Math.PI) / 180.0;
  const headingRad = (params.machineHeadingDeg * Math.PI) / 180.0;

  // Pitch (nose up/down) and Roll (side tilt)
  const chassisPitchDeg = params.slopeDeg * Math.cos(headingRad);
  const chassisRollDeg = params.slopeDeg * Math.sin(headingRad);
  const rawChassisTiltDeg = params.slopeDeg;

  // Stabilizer auto-leveling compensation
  const maxComp = thresholds.stabilizerMaxCompensationDeg * Math.min(1.0, Math.max(0.0, stabilizerExtension));
  const effectiveTiltDeg = Math.max(0.0, rawChassisTiltDeg - maxComp);
  const stabilizerLevelingActive = maxComp > 0.5;

  // 2. Umbilical Hose Routing
  // Vault opening elevation relative to machine base
  const verticalGradeM = Math.tan(slopeRad) * params.machineSetbackM;
  const euclideanDistanceM = Math.sqrt(
    Math.pow(params.machineSetbackM, 2) + Math.pow(verticalGradeM, 2)
  );

  const vaultDepthM = 1.85; // Standard municipal vault internal floor drop
  const bendSlackM = 2.0;   // Allowance for boom arc and entry bend radius
  const requiredHoseLengthM = parseFloat((euclideanDistanceM + vaultDepthM + bendSlackM).toFixed(1));
  const hoseLengthAdequate = configuredHoseLengthM >= requiredHoseLengthM;
  const hoseLengthDeficitM = parseFloat(Math.max(0.0, requiredHoseLengthM - configuredHoseLengthM).toFixed(1));

  if (!hoseLengthAdequate) {
    warnings.push(
      `Insufficient hose length: Route requires ${requiredHoseLengthM}m, but only ${configuredHoseLengthM}m configured (${hoseLengthDeficitM}m deficit).`
    );
  }

  // 3. Elevation & Routing Head Losses
  // Machine collection tank is at +1.4m on chassis; vault suction point is at -1.85m depth
  const machineInletHeightM = 1.4;
  const verticalElevationDiffM = parseFloat(
    Math.max(0.8, verticalGradeM + vaultDepthM + machineInletHeightM).toFixed(2)
  );

  const g = 9.80665;
  const staticHeadLossKpa = parseFloat(
    ((slurryDensityKgM3 * g * verticalElevationDiffM) / 1000.0).toFixed(1)
  );

  // Dynamic routing friction estimate with surface roughness penalty
  const dM = hoseDiameterMm / 1000.0;
  const flowLpm = 450.0; // Nominal design suction rate
  const flowM3S = flowLpm / 60000.0;
  const areaM2 = (Math.PI * Math.pow(dM, 2)) / 4.0;
  const velMs = areaM2 > 0 ? flowM3S / areaM2 : 0;
  const roughnessMultiplier = 1.0 + params.surfaceRoughness * 0.45;
  const baseFrictionFactor = 0.038 * roughnessMultiplier;
  const frictionHeadM = (baseFrictionFactor * (requiredHoseLengthM / dM) + 3.0) * (Math.pow(velMs, 2) / (2.0 * g));
  const estimatedFrictionLossKpa = parseFloat(
    ((slurryDensityKgM3 * g * frictionHeadM) / 1000.0).toFixed(1)
  );
  const totalRoutingLossKpa = parseFloat((staticHeadLossKpa + estimatedFrictionLossKpa).toFixed(1));

  // 4. Physical Clearance Conflicts
  // Machine width: 1.35m chassis; 1.85m with outriggers extended
  const machineWidthM = stabilizerExtension > 0.2 ? 1.85 : 1.35;
  const lateralClearanceMarginM = parseFloat(
    Math.max(0.0, (params.pathWidthM - machineWidthM) / 2.0).toFixed(2)
  );
  const clearanceConflictDetected = lateralClearanceMarginM < thresholds.minPassageClearanceM;

  if (clearanceConflictDetected) {
    warnings.push(
      `Restricted clearance alert: Lateral margin is only ${lateralClearanceMarginM}m per side (minimum safe margin: ${thresholds.minPassageClearanceM}m).`
    );
  }

  // Ground Clearance Risk over rough/boulder terrain
  const obstacleAmplitudeM = params.surfaceRoughness * 0.22;
  const effectiveGroundClearanceM = parseFloat(
    Math.max(0.02, params.groundClearanceNominalM - obstacleAmplitudeM).toFixed(2)
  );
  const groundClearanceRisk = effectiveGroundClearanceM < thresholds.minGroundClearanceM;

  if (groundClearanceRisk) {
    warnings.push(
      `Underbody strike hazard: Effective ground clearance reduced to ${effectiveGroundClearanceM}m due to surface roughness.`
    );
  }

  // 5. Stability & Tip-Over Risk
  let stabilityStatus: 'nominal' | 'caution' | 'critical_unstable' = 'nominal';
  if (effectiveTiltDeg >= thresholds.criticalRolloverDeg) {
    stabilityStatus = 'critical_unstable';
    warnings.push(
      `CRITICAL INSTABILITY: Chassis tilt (${effectiveTiltDeg.toFixed(1)}°) exceeds rollover threshold (${thresholds.criticalRolloverDeg}°)! Machine staging unsafe.`
    );
  } else if (effectiveTiltDeg >= thresholds.maxChassisTiltDeg) {
    stabilityStatus = 'caution';
    warnings.push(
      `Chassis tilt warning: Effective tilt (${effectiveTiltDeg.toFixed(1)}°) exceeds ${thresholds.maxChassisTiltDeg}° limit. Full outrigger cribbing mandatory.`
    );
  }

  const stabilityMarginPct = parseFloat(
    Math.max(0.0, 100.0 - (effectiveTiltDeg / thresholds.criticalRolloverDeg) * 100.0).toFixed(1)
  );

  return {
    terrainSlopeDeg: parseFloat(params.slopeDeg.toFixed(1)),
    machineHeadingDeg: parseFloat(params.machineHeadingDeg.toFixed(1)),
    chassisPitchDeg: parseFloat(chassisPitchDeg.toFixed(1)),
    chassisRollDeg: parseFloat(chassisRollDeg.toFixed(1)),
    rawChassisTiltDeg: parseFloat(rawChassisTiltDeg.toFixed(1)),
    effectiveTiltDeg: parseFloat(effectiveTiltDeg.toFixed(1)),
    stabilizerLevelingActive,
    euclideanDistanceM: parseFloat(euclideanDistanceM.toFixed(1)),
    requiredHoseLengthM,
    configuredHoseLengthM,
    hoseLengthAdequate,
    hoseLengthDeficitM,
    verticalElevationDiffM,
    staticHeadLossKpa,
    estimatedFrictionLossKpa,
    totalRoutingLossKpa,
    availablePathWidthM: parseFloat(params.pathWidthM.toFixed(2)),
    machineWidthM,
    lateralClearanceMarginM,
    clearanceConflictDetected,
    effectiveGroundClearanceM,
    groundClearanceRisk,
    stabilityStatus,
    stabilityMarginPct,
    warnings,
    disclaimer: PRELIMINARY_ESTIMATE_DISCLAIMER
  };
}

/**
 * Evaluates all 3 operating environments for side-by-side engineering comparison.
 */
export function evaluateAllScenariosComparison(
  stabilizerExtension: number,
  configuredHoseM: number,
  thresholds: StabilityThresholds = DEFAULT_STABILITY_THRESHOLDS
): ScenarioComparisonItem[] {
  return [
    // 1. Level Paved
    (() => {
      const p: TerrainParameters = {
        slopeDeg: TERRAIN_SCENARIOS.level_paved.defaultSlopeDeg,
        surfaceRoughness: TERRAIN_SCENARIOS.level_paved.defaultRoughness,
        pathWidthM: TERRAIN_SCENARIOS.level_paved.defaultPathWidthM,
        machineSetbackM: TERRAIN_SCENARIOS.level_paved.defaultSetbackM,
        machineHeadingDeg: TERRAIN_SCENARIOS.level_paved.defaultHeadingDeg,
        groundClearanceNominalM: 0.32,
        soilFrictionCoeff: 0.85
      };
      const est = calculateTerrainFeasibility(p, stabilizerExtension, configuredHoseM, 1180, 450, 100, thresholds);
      return {
        id: 'level_paved' as TerrainScenarioId,
        name: 'Level Paved Access',
        slopeDeg: p.slopeDeg,
        pathWidthM: p.pathWidthM,
        effectiveTiltDeg: est.effectiveTiltDeg,
        requiredHoseM: est.requiredHoseLengthM,
        totalRoutingLossKpa: est.totalRoutingLossKpa,
        clearanceMarginM: est.lateralClearanceMarginM,
        stabilityStatus: est.stabilityStatus,
        feasibilityRating: 'FEASIBLE',
        keyConstraint: 'None (Optimal urban conditions)',
        mitigationRecommendation: 'Standard wheel chocks and baseline stabilizer deployment.'
      };
    })(),

    // 2. Sloped Hilly
    (() => {
      const p: TerrainParameters = {
        slopeDeg: TERRAIN_SCENARIOS.hilly_sloped.defaultSlopeDeg,
        surfaceRoughness: TERRAIN_SCENARIOS.hilly_sloped.defaultRoughness,
        pathWidthM: TERRAIN_SCENARIOS.hilly_sloped.defaultPathWidthM,
        machineSetbackM: TERRAIN_SCENARIOS.hilly_sloped.defaultSetbackM,
        machineHeadingDeg: TERRAIN_SCENARIOS.hilly_sloped.defaultHeadingDeg,
        groundClearanceNominalM: 0.32,
        soilFrictionCoeff: 0.55
      };
      const est = calculateTerrainFeasibility(p, stabilizerExtension, configuredHoseM, 1180, 450, 100, thresholds);
      const isOk = est.stabilityStatus !== 'critical_unstable' && est.hoseLengthAdequate;
      return {
        id: 'hilly_sloped' as TerrainScenarioId,
        name: 'Sloped & Uneven Hilly',
        slopeDeg: p.slopeDeg,
        pathWidthM: p.pathWidthM,
        effectiveTiltDeg: est.effectiveTiltDeg,
        requiredHoseM: est.requiredHoseLengthM,
        totalRoutingLossKpa: est.totalRoutingLossKpa,
        clearanceMarginM: est.lateralClearanceMarginM,
        stabilityStatus: est.stabilityStatus,
        feasibilityRating: isOk ? 'CONDITIONAL' : 'HIGH_RISK',
        keyConstraint: `14° hillside grade (+${est.staticHeadLossKpa} kPa static head penalty)`,
        mitigationRecommendation: 'Extend stabilizers fully with leveling cribbing pads; stage nose up-slope.'
      };
    })(),

    // 3. Narrow Restricted
    (() => {
      const p: TerrainParameters = {
        slopeDeg: TERRAIN_SCENARIOS.narrow_restricted.defaultSlopeDeg,
        surfaceRoughness: TERRAIN_SCENARIOS.narrow_restricted.defaultRoughness,
        pathWidthM: TERRAIN_SCENARIOS.narrow_restricted.defaultPathWidthM,
        machineSetbackM: TERRAIN_SCENARIOS.narrow_restricted.defaultSetbackM,
        machineHeadingDeg: TERRAIN_SCENARIOS.narrow_restricted.defaultHeadingDeg,
        groundClearanceNominalM: 0.32,
        soilFrictionCoeff: 0.70
      };
      const est = calculateTerrainFeasibility(p, stabilizerExtension, configuredHoseM, 1180, 450, 100, thresholds);
      const isOk = est.hoseLengthAdequate;
      return {
        id: 'narrow_restricted' as TerrainScenarioId,
        name: 'Narrow Restricted Path',
        slopeDeg: p.slopeDeg,
        pathWidthM: p.pathWidthM,
        effectiveTiltDeg: est.effectiveTiltDeg,
        requiredHoseM: est.requiredHoseLengthM,
        totalRoutingLossKpa: est.totalRoutingLossKpa,
        clearanceMarginM: est.lateralClearanceMarginM,
        stabilityStatus: est.stabilityStatus,
        feasibilityRating: isOk ? 'CONDITIONAL' : 'HIGH_RISK',
        keyConstraint: `1.65m corridor width (only ${est.lateralClearanceMarginM}m side clearance)`,
        mitigationRecommendation: 'Stage machine at alley entrance and spool extended suction umbilical.'
      };
    })()
  ];
}
