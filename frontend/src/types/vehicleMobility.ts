/**
 * Tracked Engineering Vehicle Mobility & Drive Dynamics Types
 * Smart India Hackathon SIH 26258
 */

export type DriveConcept = 'hydraulic' | 'electric';

export interface MobilityInputState {
  forward: boolean;
  reverse: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  pivotLeft: boolean;
  pivotRight: boolean;
  brake: boolean;
}

export interface VehicleMobilityParameters {
  maxTravelSpeedMs: number;       // Maximum forward/reverse speed (m/s), default 1.2 m/s
  accelerationMs2: number;        // Linear acceleration (m/s²), default 1.6 m/s²
  brakingDecelMs2: number;        // Service brake deceleration (m/s²), default 3.5 m/s²
  steerSensitivity: number;       // Steering yaw rate multiplier, default 1.0
  trackGaugeWidthM: number;       // Lateral distance between track centers (m), default 1.64 m
  trackContactLengthM: number;    // Effective ground contact length (m), default 1.85 m
  trackBeltWidthM: number;        // Width of continuous rubber track belt (m), default 0.28 m
  nominalGroundClearanceM: number;// Belly clearance height above ground (m), default 0.28 m
  driveConcept: DriveConcept;     // Hydrostatic dual-pump or dual electric motors
  motorDisplacementCc: number;    // Hydraulic motor displacement (cc/rev) or electric kW rating
}

export interface VehicleMobilityTelemetry {
  // World space kinematics
  position: [number, number, number]; // [X, Y, Z] in meters
  headingDeg: number;                 // Yaw heading angle (0 = forward +X)
  headingRad: number;
  pitchDeg: number;                   // Incline pitch angle along travel axis
  rollDeg: number;                    // Lateral tilt roll angle across tracks
  effectiveTiltDeg: number;           // Total vector inclination
  speedMs: number;                    // Current linear travel speed (m/s)
  speedKmh: number;                   // Speed in km/h
  steerRateRadS: number;              // Current yaw rotational speed (rad/s)

  // Track belt & sprocket animation telemetry
  leftTrackSpeedMs: number;           // Linear speed of left track belt
  rightTrackSpeedMs: number;          // Linear speed of right track belt
  leftTrackDistanceM: number;         // Cumulative travel distance for UV / cleat scrolling
  rightTrackDistanceM: number;
  leftSprocketAngleRad: number;       // Cumulative rotation of drive sprocket
  rightSprocketAngleRad: number;

  // Traction and mobility physics
  groundPressureKpa: number;          // Mean crawler ground contact pressure (kPa)
  gradeabilityMaxDeg: number;         // Maximum climbable slope angle on current terrain
  currentTractionCoeff: number;       // Available soil-track Coulomb friction
  tractiveEffortKn: number;           // Total tractive force delivered (kN)
  motionResistanceKn: number;         // Track rolling + grade resistance force (kN)
  isSlipping: boolean;                // Traction slip detection flag
  isMoving: boolean;                  // True if linear or angular motion is non-zero

  // Operational Interlocks
  isInterlockBlocked: boolean;        // True if machine operating state prevents driving
  interlockBlockReason: string | null;// Description of blocking safety interlock
}

export const DEFAULT_MOBILITY_PARAMS: VehicleMobilityParameters = {
  maxTravelSpeedMs: 1.2,          // 4.3 km/h safe crawler crawl speed
  accelerationMs2: 1.6,
  brakingDecelMs2: 3.5,
  steerSensitivity: 1.0,
  trackGaugeWidthM: 1.64,
  trackContactLengthM: 1.85,
  trackBeltWidthM: 0.28,
  nominalGroundClearanceM: 0.28,
  driveConcept: 'hydraulic',
  motorDisplacementCc: 45.0
};

export const INITIAL_MOBILITY_TELEMETRY: VehicleMobilityTelemetry = {
  position: [0.0, 0.0, 0.0],
  headingDeg: 0.0,
  headingRad: 0.0,
  pitchDeg: 0.0,
  rollDeg: 0.0,
  effectiveTiltDeg: 0.0,
  speedMs: 0.0,
  speedKmh: 0.0,
  steerRateRadS: 0.0,
  leftTrackSpeedMs: 0.0,
  rightTrackSpeedMs: 0.0,
  leftTrackDistanceM: 0.0,
  rightTrackDistanceM: 0.0,
  leftSprocketAngleRad: 0.0,
  rightSprocketAngleRad: 0.0,
  groundPressureKpa: 38.5,
  gradeabilityMaxDeg: 28.5,
  currentTractionCoeff: 0.65,
  tractiveEffortKn: 0.0,
  motionResistanceKn: 2.1,
  isSlipping: false,
  isMoving: false,
  isInterlockBlocked: false,
  interlockBlockReason: null
};

export const INITIAL_MOBILITY_INPUTS: MobilityInputState = {
  forward: false,
  reverse: false,
  steerLeft: false,
  steerRight: false,
  pivotLeft: false,
  pivotRight: false,
  brake: false
};

