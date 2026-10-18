/**
 * Types and interfaces for Challenging Terrain Environments & Simplified Engineering Feasibility.
 * 
 * Strict physical units:
 * - Angles: Degrees (°)
 * - Lengths/Distances: Metres (m)
 * - Clearances: Metres (m)
 * - Pressures: Kilopascals (kPa)
 * - Roughness: Dimensionless scalar (0.0 to 1.0)
 */

export type TerrainScenarioId = 'level_paved' | 'hilly_sloped' | 'narrow_restricted';

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
  groundClearanceNominalM: number;
  environmentType: 'urban_paved' | 'unpaved_mountain' | 'restricted_alley';
}

export interface TerrainParameters {
  slopeDeg: number;                // Ground slope angle (0° - 30°)
  surfaceRoughness: number;        // 0.0 (mirror smooth) to 1.0 (heavy boulders/loose rock)
  pathWidthM: number;              // Available pathway / corridor width (1.2m - 6.0m)
  machineSetbackM: number;         // Staging distance from machine chassis to vault (3m - 30m)
  machineHeadingDeg: number;       // Machine angle relative to fall line: 0° nose up-slope, 90° cross-slope
  groundClearanceNominalM: number; // Machine chassis baseline ground clearance (0.32m)
  soilFrictionCoeff: number;       // Soil-tire adhesion coefficient (0.30 - 0.95)
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
  effectiveGroundClearanceM: number;   // nominal clearance minus roughness obstacle amplitude
  groundClearanceRisk: boolean;

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
  stabilityStatus: StabilityStatus;
  feasibilityRating: 'FEASIBLE' | 'CONDITIONAL' | 'HIGH_RISK';
  keyConstraint: string;
  mitigationRecommendation: string;
}
