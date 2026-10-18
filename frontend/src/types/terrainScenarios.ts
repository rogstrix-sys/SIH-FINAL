/**
 * Types and interfaces for Challenging Terrain Environments & Simplified Engineering Feasibility.
 * 
 * Strict physical units:
 * - Angles: Degrees (°)
 * - Lengths/Distances: Metres (m)
 * - Clearances: Metres (m)
 * - Pressures: Kilopascals (kPa)
 * - Roughness: Dimensionless scalar (0.0 to 1.0)
 * - Rainfall: Millimetres per hour (mm/h)
 * - Temperature: Degrees Celsius (°C)
 * - Altitude: Metres above mean sea level (m MSL)
 */

export type TerrainScenarioId =
  | 'level_paved'
  | 'hilly_sloped'
  | 'uneven_muddy'
  | 'narrow_restricted'
  | 'heavy_rain'
  | 'cold_high_altitude';

export interface TerrainScenarioConfig {
  id: TerrainScenarioId;
  name: string;
  tagline: string;
  description: string;
  defaultSlopeDeg: number;
  defaultRoughness: number;
  defaultPathWidthM: number;
  defaultSetbackM: number;
  defaultHeadingDeg: number;
  defaultRainfallIntensityMmH: number;
  defaultAmbientTempC: number;
  defaultAltitudeM: number;
  groundClearanceNominalM: number;
  environmentType:
    | 'urban_paved'
    | 'unpaved_mountain'
    | 'restricted_alley'
    | 'wet_muddy'
    | 'heavy_precipitation'
    | 'alpine_snow';
}

export interface TerrainParameters {
  slopeDeg: number;                // Ground slope angle (0° - 30°)
  surfaceRoughness: number;        // 0.0 (mirror smooth) to 1.0 (heavy boulders/loose rock)
  pathWidthM: number;              // Available pathway / corridor width (1.2m - 6.0m)
  machineSetbackM: number;         // Staging distance from machine chassis to vault (3m - 30m)
  machineHeadingDeg: number;       // Machine angle relative to fall line: 0° nose up-slope, 90° cross-slope
  groundClearanceNominalM: number; // Machine chassis baseline ground clearance (0.32m)
  soilFrictionCoeff: number;       // Baseline dry soil-tire/track adhesion coefficient (0.30 - 0.95)
  rainfallIntensityMmH: number;    // Precipitation intensity (0 - 100 mm/h)
  ambientTempC: number;            // Site ambient air temperature (-20°C to +45°C)
  altitudeM: number;               // Ground elevation above mean sea level (0 - 4500m)
  configuredHoseLengthM: number;   // Total available extraction hose on machine drum (10 - 60m)
}

export interface StabilityThresholds {
  maxChassisTiltDeg: number;          // Nominal operating threshold (default 15.0°)
  criticalRolloverDeg: number;        // Critical rollover threshold (default 22.0°)
  stabilizerMaxCompensationDeg: number;// Max angle stabilizers can level out (default 8.0°)
  minGroundClearanceM: number;        // Minimum safe belly pan clearance (default 0.12m)
  minPassageClearanceM: number;       // Minimum lateral clearance per side (default 0.15m)
}

export type StabilityStatus = 'nominal' | 'caution' | 'critical_unstable';

export interface EngineeringFeasibilityEstimate {
  // Kinematics & Orientation
  terrainSlopeDeg: number;
  machineHeadingDeg: number;
  chassisPitchDeg: number;
  chassisRollDeg: number;
  rawChassisTiltDeg: number;
  effectiveTiltDeg: number;           // Residual tilt with stabilizer auto-leveling
  stabilizerLevelingActive: boolean;

  // Umbilical Hose Routing
  euclideanDistanceM: number;
  requiredHoseLengthM: number;         // 3D routing distance + vault depth + bend slack
  configuredHoseLengthM: number;
  hoseLengthAdequate: boolean;
  hoseLengthDeficitM: number;

  // Hydrostatic & Hydrodynamic Elevation Head
  verticalElevationDiffM: number;      // Height difference between vault suction and machine inlet
  staticHeadLossKpa: number;           // deltaP = rho * g * delta_h (kPa)
  estimatedFrictionLossKpa: number;    // Darcy friction head loss based on routing distance & roughness
  totalRoutingLossKpa: number;         // static + friction penalty

  // Physical Clearance Conflicts
  availablePathWidthM: number;
  machineWidthM: number;               // 1.35m chassis (or 1.85m with stabilizers deployed)
  lateralClearanceMarginM: number;     // (pathWidth - machineWidth) / 2
  clearanceConflictDetected: boolean;
  effectiveGroundClearanceM: number;   // nominal clearance minus roughness obstacle amplitude and mud sinkage
  groundClearanceRisk: boolean;

  // Environmental & Climate Adjustments
  atmosphericPressureKpa: number;      // Barometric pressure at altitude: 101.325 * (1 - 2.25577e-5 * h)^5.25588
  maxAchievableSuctionLiftM: number;   // Theoretical barometric lift ceiling minus friction loss
  effectiveSlurryViscosityCp: number;  // Dynamic viscosity adjusted for temperature: mu0 * exp(0.035 * (20 - T))
  soilTractionCoeff: number;          // Soil-tire friction adjusted for wetness/rain
  mudSinkageM: number;                // Ground penetration depth under load in saturated soil
  isAltitudeDerated: boolean;         // True if elevation difference approaches atmospheric barometric limit
  isTemperatureCritical: boolean;     // True if sub-zero freezing or extreme viscosity surge detected
  isTractionSlipRisk: boolean;        // True if tan(slope) > soilTractionCoeff

  // Overall Stability
  stabilityStatus: StabilityStatus;
  stabilityMarginPct: number;          // Margin remaining before critical tip-over angle
  warnings: string[];
  disclaimer: string;
}

export interface ScenarioComparisonItem {
  id: TerrainScenarioId;
  name: string;
  slopeDeg: number;
  pathWidthM: number;
  effectiveTiltDeg: number;
  requiredHoseM: number;
  totalRoutingLossKpa: number;
  clearanceMarginM: number;
  atmosphericPressureKpa: number;
  maxAchievableSuctionLiftM: number;
  effectiveSlurryViscosityCp: number;
  stabilityStatus: StabilityStatus;
  feasibilityRating: 'FEASIBLE' | 'CONDITIONAL' | 'HIGH_RISK';
  keyConstraint: string;
  mitigationRecommendation: string;
}

export interface TaskComparisonResult {
  scenarioId: TerrainScenarioId;
  scenarioName: string;
  slopeDeg: number;
  effectiveTiltDeg: number;
  pathWidthM: number;
  lateralClearanceMarginM: number;
  groundClearanceRisk: boolean;
  clearanceConflict: boolean;
  requiredHoseM: number;
  hoseAdequate: boolean;
  elevationDiffM: number;
  totalRoutingLossKpa: number;
  effectiveViscosityCp: number;
  flowRateLpm: number;
  extractionDurationSec: number;
  extractionDurationFormatted: string;
  estimatedEnergyKwh: number;
  specificEnergyKwhM3: number;
  feasibilityRating: 'FEASIBLE' | 'CONDITIONAL' | 'HIGH_RISK';
  stabilityStatus: StabilityStatus;
  warnings: string[];
}

export interface DualScenarioComparison {
  taskVolumeL: number;
  initialVaultVolumeL: number;
  sludgeDensityKgM3: number;
  baseline: TaskComparisonResult;
  comparison: TaskComparisonResult;
  deltaDurationSec: number;
  deltaDurationFormatted: string;
  deltaEnergyKwh: number;
  deltaEnergyPct: number;
  deltaLossKpa: number;
  documentedAssumptions: readonly string[];
}
