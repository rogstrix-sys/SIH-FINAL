/**
 * Simplified Engineering Feasibility & Terrain Feasibility Model
 * 
 * Mathematical Equations & Documented Assumptions:
 * 1. Barometric Altitude & Atmospheric Pressure (ISO 2533 Standard Atmosphere):
 *    - P_atm = 101.325 * (1.0 - 2.25577e-5 * altitudeM)^5.25588 (kPa)
 *    - DeltaP_vac_max = 0.85 * P_atm (rotary lobe achievable vacuum limit)
 *    - h_suction_max = (DeltaP_vac_max * 1000) / (rho * g) - h_friction (m)
 * 
 * 2. Sludge Dynamic Viscosity Temperature Dependence (Andrade Empirical Model):
 *    - mu(T) = mu_ref * exp(0.035 * (20.0 - T_ambient)) (cP)
 * 
 * 3. Rainfall, Mud Sinkage & Saturated Soil Traction:
 *    - mu_traction = mu_dry * (1.0 - 0.45 * (rain_intensity / 100))
 *    - d_sinkage = min(0.09, (rain_intensity / 100) * 0.08 + (roughness > 0.7 ? 0.03 : 0.0)) (m)
 *    - Effective Ground Clearance: h_gc_eff = h_gc_nom - (roughness * 0.22) - d_sinkage (m)
 * 
 * 4. Chassis Tilt & Kinematic Orientation:
 *    - pitch = slopeDeg * cos(headingRad)
 *    - roll  = slopeDeg * sin(headingRad)
 *    - effectiveTilt = max(0, slopeDeg - stabilizerMaxComp * stabilizerDeployFactor)
 * 
 * 5. Umbilical Hose Routing:
 *    - L_req = sqrt(setback^2 + delta_y^2) + vault_depth (1.85m) + bend_slack (2.0m)
 * 
 * 6. Static & Dynamic Routing Losses:
 *    - Static lift: DeltaP_static = (rho * g * Delta_h) / 1000 (kPa)
 *    - Darcy friction loss: h_f = (f * (L / D) + K_minor) * v^2 / (2g)
 * 
 * DISCLAIMER:
 * PRELIMINARY ENGINEERING ESTIMATE:
 * This model provides simplified kinematic, barometric, and hydraulic estimates for operational
 * planning. It is NOT a certified geotechnical, structural, or heavy-equipment rollover safety certification.
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
    tagline: 'Standard Municipal Highway & Concrete Staging',
    description: 'Wide, level paved approach (1.5° slope). Ample 3.8m lateral access width, nominal 5.5m hose run, and dry asphalt traction.',
    defaultSlopeDeg: 1.5,
    defaultRoughness: 0.05,
    defaultPathWidthM: 3.8,
    defaultSetbackM: 5.5,
    defaultHeadingDeg: 0,
    defaultRainfallIntensityMmH: 0,
    defaultAmbientTempC: 22,
    defaultAltitudeM: 150,
    groundClearanceNominalM: 0.32,
    environmentType: 'urban_paved'
  },
  hilly_sloped: {
    id: 'hilly_sloped',
    name: '2. Sloped & Uneven Hilly Terrain',
    tagline: 'Mountain Gradient & Loose Rocky Scree',
    description: '14.0° hillside grade with unpaved surface roughness (0.65). Requires stabilizer outrigger leveling, cribbing, and extended hose line.',
    defaultSlopeDeg: 14.0,
    defaultRoughness: 0.65,
    defaultPathWidthM: 2.8,
    defaultSetbackM: 11.5,
    defaultHeadingDeg: 25,
    defaultRainfallIntensityMmH: 0,
    defaultAmbientTempC: 18,
    defaultAltitudeM: 1200,
    groundClearanceNominalM: 0.32,
    environmentType: 'unpaved_mountain'
  },
  uneven_muddy: {
    id: 'uneven_muddy',
    name: '3. Uneven & Muddy Terrain',
    tagline: 'Saturated Soil, Wheel Rutting & Heavy Mud Sinkage',
    description: 'Unpaved rutted terrain with deep mud depressions and 0.85 roughness. Mud sinkage reduces belly-pan clearance and increases track rolling resistance.',
    defaultSlopeDeg: 6.0,
    defaultRoughness: 0.85,
    defaultPathWidthM: 2.4,
    defaultSetbackM: 8.0,
    defaultHeadingDeg: 10,
    defaultRainfallIntensityMmH: 30,
    defaultAmbientTempC: 16,
    defaultAltitudeM: 600,
    groundClearanceNominalM: 0.32,
    environmentType: 'wet_muddy'
  },
  narrow_restricted: {
    id: 'narrow_restricted',
    name: '4. Narrow Access Sanitation Site',
    tagline: 'Confined Historic Corridor & Flanking Masonry Walls',
    description: 'Ultra-narrow 1.65m alleyway flanked by structural building walls. Strict clearance margin (0.15m per side) and remote suction hose routing.',
    defaultSlopeDeg: 3.5,
    defaultRoughness: 0.35,
    defaultPathWidthM: 1.65,
    defaultSetbackM: 16.0,
    defaultHeadingDeg: 0,
    defaultRainfallIntensityMmH: 0,
    defaultAmbientTempC: 24,
    defaultAltitudeM: 250,
    groundClearanceNominalM: 0.32,
    environmentType: 'restricted_alley'
  },
  heavy_rain: {
    id: 'heavy_rain',
    name: '5. Heavy Rain & Flooding Conditions',
    tagline: 'Tropical Monsoon Storm & Ground Liquefaction Hazard',
    description: '75 mm/h torrential rainfall leading to surface water pooling, reduced soil adhesion, stormwater ingress, and soil bearing capacity degradation.',
    defaultSlopeDeg: 5.0,
    defaultRoughness: 0.40,
    defaultPathWidthM: 3.0,
    defaultSetbackM: 9.0,
    defaultHeadingDeg: 15,
    defaultRainfallIntensityMmH: 75,
    defaultAmbientTempC: 20,
    defaultAltitudeM: 300,
    groundClearanceNominalM: 0.32,
    environmentType: 'heavy_precipitation'
  },
  cold_high_altitude: {
    id: 'cold_high_altitude',
    name: '6. Cold & High-Altitude Alpine Zone',
    tagline: 'Himalayan Sub-Zero Freezing & Barometric Pressure Drop',
    description: '3,200m altitude and -8°C freezing air. Barometric pressure loss severely limits vacuum suction lift, while sub-zero temperature thickens septage viscosity.',
    defaultSlopeDeg: 8.0,
    defaultRoughness: 0.50,
    defaultPathWidthM: 2.2,
    defaultSetbackM: 12.0,
    defaultHeadingDeg: 0,
    defaultRainfallIntensityMmH: 0,
    defaultAmbientTempC: -8,
    defaultAltitudeM: 3200,
    groundClearanceNominalM: 0.32,
    environmentType: 'alpine_snow'
  }
};

export const DEFAULT_TERRAIN_PARAMS: TerrainParameters = {
  slopeDeg: 1.5,
  surfaceRoughness: 0.05,
  pathWidthM: 3.8,
  machineSetbackM: 5.5,
  machineHeadingDeg: 0,
  groundClearanceNominalM: 0.32,
  soilFrictionCoeff: 0.85,
  rainfallIntensityMmH: 0,
  ambientTempC: 22,
  altitudeM: 150,
  configuredHoseLengthM: 35
};

export const DEFAULT_STABILITY_THRESHOLDS: StabilityThresholds = {
  maxChassisTiltDeg: 15.0,
  criticalRolloverDeg: 22.0,
  stabilizerMaxCompensationDeg: 8.0,
  minGroundClearanceM: 0.12,
  minPassageClearanceM: 0.15
};

export const PRELIMINARY_ESTIMATE_DISCLAIMER =
  'PRELIMINARY ENGINEERING ESTIMATE: This model calculates simplified geometric, barometric, and hydraulic estimates for operational planning. It does not replace certified site geotechnical, structural, or heavy-equipment rollover safety certification.';

/**
 * Returns baseline calibrated parameters for any specified scenario ID.
 */
export function getScenarioDefaultParams(id: TerrainScenarioId): TerrainParameters {
  const cfg = TERRAIN_SCENARIOS[id] || TERRAIN_SCENARIOS.level_paved;
  return {
    slopeDeg: cfg.defaultSlopeDeg,
    surfaceRoughness: cfg.defaultRoughness,
    pathWidthM: cfg.defaultPathWidthM,
    machineSetbackM: cfg.defaultSetbackM,
    machineHeadingDeg: cfg.defaultHeadingDeg,
    groundClearanceNominalM: cfg.groundClearanceNominalM,
    soilFrictionCoeff: id === 'uneven_muddy' ? 0.55 : id === 'heavy_rain' ? 0.45 : 0.85,
    rainfallIntensityMmH: cfg.defaultRainfallIntensityMmH,
    ambientTempC: cfg.defaultAmbientTempC,
    altitudeM: cfg.defaultAltitudeM,
    configuredHoseLengthM: 35
  };
}

/**
 * Calculates atmospheric pressure (kPa) based on elevation (m MSL) using ISO 2533 Barometric Formula.
 */
export function calculateBarometricPressureKpa(altitudeM: number): number {
  const h = Math.max(0, altitudeM);
  // P = P0 * (1 - L * h / T0)^(g * M / (R * L)) = 101.325 * (1 - 2.25577e-5 * h)^5.25588
  const base = Math.max(0.1, 1.0 - 2.25577e-5 * h);
  return parseFloat((101.325 * Math.pow(base, 5.25588)).toFixed(2));
}

/**
 * Calculates temperature-adjusted dynamic viscosity of septage slurry using Andrade empirical relation.
 */
export function calculateTemperatureAdjustedViscosityCp(
  baseViscosityCp: number,
  ambientTempC: number
): number {
  // Viscosity increases exponentially as temperature drops
  const tempDelta = 20.0 - ambientTempC;
  const factor = Math.exp(0.035 * tempDelta);
  return parseFloat((baseViscosityCp * factor).toFixed(1));
}

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
  const verticalGradeM = Math.tan(slopeRad) * params.machineSetbackM;
  const euclideanDistanceM = Math.sqrt(
    Math.pow(params.machineSetbackM, 2) + Math.pow(verticalGradeM, 2)
  );

  const vaultDepthM = 1.85; // Standard municipal vault internal floor drop
  const bendSlackM = 2.0;   // Allowance for boom arc and entry bend radius
  const requiredHoseLengthM = parseFloat((euclideanDistanceM + vaultDepthM + bendSlackM).toFixed(1));
  const effectiveConfiguredHose = configuredHoseLengthM || params.configuredHoseLengthM || 35;
  const hoseLengthAdequate = effectiveConfiguredHose >= requiredHoseLengthM;
  const hoseLengthDeficitM = parseFloat(Math.max(0.0, requiredHoseLengthM - effectiveConfiguredHose).toFixed(1));

  if (!hoseLengthAdequate) {
    warnings.push(
      `Insufficient hose length: Route requires ${requiredHoseLengthM}m, but only ${effectiveConfiguredHose}m configured (${hoseLengthDeficitM}m deficit).`
    );
  }

  // 3. Elevation & Routing Head Losses
  const machineInletHeightM = 1.4; // Height of suction manifold inlet on mobile chassis
  const verticalElevationDiffM = parseFloat(
    Math.max(0.8, verticalGradeM + vaultDepthM + machineInletHeightM).toFixed(2)
  );

  const g = 9.80665;
  const staticHeadLossKpa = parseFloat(
    ((slurryDensityKgM3 * g * verticalElevationDiffM) / 1000.0).toFixed(1)
  );

  // 4. Climate & Atmospheric Pressure Adjustments
  const atmosphericPressureKpa = calculateBarometricPressureKpa(params.altitudeM);
  const effectiveSlurryViscosityCp = calculateTemperatureAdjustedViscosityCp(
    slurryViscosityCp,
    params.ambientTempC
  );

  // Dynamic routing friction estimate with surface roughness and viscosity penalty
  const dM = hoseDiameterMm / 1000.0;
  const flowLpm = 450.0; // Nominal design suction rate
  const flowM3S = flowLpm / 60000.0;
  const areaM2 = (Math.PI * Math.pow(dM, 2)) / 4.0;
  const velMs = areaM2 > 0 ? flowM3S / areaM2 : 0;
  const roughnessMultiplier = 1.0 + params.surfaceRoughness * 0.45;
  const viscosityRatio = effectiveSlurryViscosityCp / 450.0;
  const baseFrictionFactor = 0.038 * roughnessMultiplier * Math.sqrt(viscosityRatio);
  const frictionHeadM = (baseFrictionFactor * (requiredHoseLengthM / dM) + 3.0) * (Math.pow(velMs, 2) / (2.0 * g));
  const estimatedFrictionLossKpa = parseFloat(
    ((slurryDensityKgM3 * g * frictionHeadM) / 1000.0).toFixed(1)
  );
  const totalRoutingLossKpa = parseFloat((staticHeadLossKpa + estimatedFrictionLossKpa).toFixed(1));

  // Maximum achievable suction lift based on atmospheric pressure and rotary lobe vacuum limit
  const maxVacDifferentialKpa = 0.85 * atmosphericPressureKpa;
  const theoreticalStaticLiftM = (maxVacDifferentialKpa * 1000.0) / (slurryDensityKgM3 * g);
  const maxAchievableSuctionLiftM = parseFloat(
    Math.max(0.5, theoreticalStaticLiftM - frictionHeadM).toFixed(2)
  );

  // Check if elevation difference exceeds achievable suction lift
  const isAltitudeDerated = verticalElevationDiffM > maxAchievableSuctionLiftM;
  if (isAltitudeDerated) {
    warnings.push(
      `Atmospheric lift deficit: At ${params.altitudeM}m altitude (Patm = ${atmosphericPressureKpa} kPa), max suction lift is ${maxAchievableSuctionLiftM}m. Required elevation is ${verticalElevationDiffM}m. Vacuum cavitation / suction failure imminent!`
    );
  }

  // Temperature warnings
  const isTemperatureCritical = params.ambientTempC <= 0;
  if (params.ambientTempC <= 0) {
    warnings.push(
      `Sub-zero thermal alert: Ambient ${params.ambientTempC}°C increases slurry viscosity to ${effectiveSlurryViscosityCp.toFixed(0)} cP. Slurry freezing and conduit gelatinization hazard!`
    );
  } else if (params.ambientTempC >= 40) {
    warnings.push(
      `Extreme heat warning: Ambient ${params.ambientTempC}°C accelerates sewer gas (CH4/H2S) volatilization and surface crust hardening.`
    );
  }

  // 5. Rainfall, Saturated Soil Adhesion & Mud Sinkage
  const rainNorm = Math.min(1.0, Math.max(0.0, params.rainfallIntensityMmH / 100.0));
  const soilTractionCoeff = parseFloat(
    (params.soilFrictionCoeff * (1.0 - 0.45 * rainNorm)).toFixed(2)
  );
  const mudSinkageM = parseFloat(
    Math.min(
      0.09,
      rainNorm * 0.07 + (params.surfaceRoughness > 0.7 ? 0.025 : 0.0)
    ).toFixed(3)
  );

  // Check traction slide on slope
  const tanSlope = Math.tan(slopeRad);
  const isTractionSlipRisk = tanSlope > soilTractionCoeff;
  if (isTractionSlipRisk) {
    warnings.push(
      `Slope traction slip hazard: Saturated soil traction coefficient (${soilTractionCoeff}) is lower than slope tangent (${tanSlope.toFixed(2)}). Machine uncontrolled slide hazard on ${params.slopeDeg}° grade!`
    );
  }

  if (params.rainfallIntensityMmH >= 50) {
    warnings.push(
      `Torrential precipitation alert (${params.rainfallIntensityMmH} mm/h): Excessive runoff flooding into open pit. Soil bearing loss under outriggers.`
    );
  }

  // 6. Physical Clearance Conflicts
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

  // Ground Clearance Risk over rough/boulder terrain and muddy sinkage
  const obstacleAmplitudeM = params.surfaceRoughness * 0.22;
  const effectiveGroundClearanceM = parseFloat(
    Math.max(0.01, params.groundClearanceNominalM - obstacleAmplitudeM - mudSinkageM).toFixed(2)
  );
  const groundClearanceRisk = effectiveGroundClearanceM < thresholds.minGroundClearanceM;

  if (groundClearanceRisk) {
    warnings.push(
      `Underbody strike hazard: Effective ground clearance reduced to ${effectiveGroundClearanceM}m due to surface roughness (${(obstacleAmplitudeM * 100).toFixed(0)}cm obstacles) and mud sinkage (${(mudSinkageM * 100).toFixed(1)}cm).`
    );
  }

  // 7. Stability & Tip-Over Risk
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
    configuredHoseLengthM: effectiveConfiguredHose,
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
    atmosphericPressureKpa,
    maxAchievableSuctionLiftM,
    effectiveSlurryViscosityCp,
    soilTractionCoeff,
    mudSinkageM,
    isAltitudeDerated,
    isTemperatureCritical,
    isTractionSlipRisk,
    stabilityStatus,
    stabilityMarginPct,
    warnings,
    disclaimer: PRELIMINARY_ESTIMATE_DISCLAIMER
  };
}

/**
 * Evaluates all 6 operating environments for side-by-side engineering comparison.
 */
export function evaluateAllScenariosComparison(
  stabilizerExtension: number,
  configuredHoseM: number,
  slurryDensityKgM3 = 1180,
  slurryViscosityCp = 450,
  hoseDiameterMm = 100
): ScenarioComparisonItem[] {
  const scenarioIds: TerrainScenarioId[] = [
    'level_paved',
    'hilly_sloped',
    'uneven_muddy',
    'narrow_restricted',
    'heavy_rain',
    'cold_high_altitude'
  ];

  return scenarioIds.map((id) => {
    const defaultParams = getScenarioDefaultParams(id);
    const estimate = calculateTerrainFeasibility(
      defaultParams,
      stabilizerExtension,
      configuredHoseM,
      slurryDensityKgM3,
      slurryViscosityCp,
      hoseDiameterMm
    );

    let feasibilityRating: 'FEASIBLE' | 'CONDITIONAL' | 'HIGH_RISK' = 'FEASIBLE';
    if (estimate.stabilityStatus === 'critical_unstable' || estimate.isAltitudeDerated) {
      feasibilityRating = 'HIGH_RISK';
    } else if (
      estimate.stabilityStatus === 'caution' ||
      estimate.clearanceConflictDetected ||
      !estimate.hoseLengthAdequate ||
      estimate.groundClearanceRisk ||
      estimate.isTemperatureCritical ||
      estimate.isTractionSlipRisk
    ) {
      feasibilityRating = 'CONDITIONAL';
    }

    let keyConstraint = 'None (Standard municipal operating conditions)';
    let mitigationRecommendation = 'Standard deployment procedures';

    switch (id) {
      case 'level_paved':
        keyConstraint = 'Routine traffic management';
        mitigationRecommendation = 'Deploy standard safety cones and wheel chocks.';
        break;
      case 'hilly_sloped':
        keyConstraint = `High chassis inclination (${estimate.effectiveTiltDeg.toFixed(1)}°) & static lift (${estimate.staticHeadLossKpa.toFixed(1)} kPa)`;
        mitigationRecommendation = 'Deploy full outriggers with timber cribbing; keep machine heading up-slope.';
        break;
      case 'uneven_muddy':
        keyConstraint = `Mud sinkage (${(estimate.mudSinkageM * 100).toFixed(1)} cm) & underbody ground clearance risk (${estimate.effectiveGroundClearanceM} m)`;
        mitigationRecommendation = 'Select crawler tracks mode and place heavy composite outrigger pads.';
        break;
      case 'narrow_restricted':
        keyConstraint = `Restricted lateral clearance margin (${estimate.lateralClearanceMarginM.toFixed(2)} m/side)`;
        mitigationRecommendation = 'Retract outrigger extensions during transit; spotter guided maneuvering.';
        break;
      case 'heavy_rain':
        keyConstraint = `Saturated soil slip risk (friction ${estimate.soilTractionCoeff.toFixed(2)}) & pit runoff flooding`;
        mitigationRecommendation = 'Erect pit perimeter coffer ring; engage crawler track cleats.';
        break;
      case 'cold_high_altitude':
        keyConstraint = `Barometric vacuum derating (Patm ${estimate.atmosphericPressureKpa} kPa) & viscous freezing (${estimate.effectiveSlurryViscosityCp.toFixed(0)} cP)`;
        mitigationRecommendation = 'Position machine close to vault to minimize elevation lift; activate hot-water backwash.';
        break;
    }

    return {
      id,
      name: TERRAIN_SCENARIOS[id].name,
      slopeDeg: defaultParams.slopeDeg,
      pathWidthM: defaultParams.pathWidthM,
      effectiveTiltDeg: estimate.effectiveTiltDeg,
      requiredHoseM: estimate.requiredHoseLengthM,
      totalRoutingLossKpa: estimate.totalRoutingLossKpa,
      clearanceMarginM: estimate.lateralClearanceMarginM,
      atmosphericPressureKpa: estimate.atmosphericPressureKpa,
      maxAchievableSuctionLiftM: estimate.maxAchievableSuctionLiftM,
      effectiveSlurryViscosityCp: estimate.effectiveSlurryViscosityCp,
      stabilityStatus: estimate.stabilityStatus,
      feasibilityRating,
      keyConstraint,
      mitigationRecommendation
    };
  });
}
