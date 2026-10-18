/**
 * Terrain Physics & Kinematic Clamping Utilities
 * Evaluates continuous terrain elevation, surface normal, pitch/roll inclination,
 * and simplified Coulomb traction for the tracked engineering vehicle.
 */

import * as THREE from 'three';
import { TerrainScenarioId, TerrainParameters } from '../types/terrainScenarios';
import { VehicleMobilityParameters } from '../types/vehicleMobility';

export interface TerrainSurfacePoint {
  groundY: number;                // Ground elevation at (x, z)
  surfaceNormal: THREE.Vector3;   // Normalized unit vector perpendicular to ground
  pitchDeg: number;               // Vehicle pitch along current heading
  rollDeg: number;                // Vehicle roll across lateral track gauge
  mudSinkageM: number;            // Vertical sinkage into soft soil/mud
  soilFrictionCoeff: number;      // Effective Coulomb traction coefficient
  clearanceConflict: boolean;     // True if vehicle footprint exceeds access corridor
  groundClearanceWarning: boolean;// True if high ground point risks striking underbody
}

/**
 * Calculates continuous ground elevation y at coordinate (x, z)
 */
export function getTerrainHeightAt(
  x: number,
  z: number,
  scenario: TerrainScenarioId,
  params: TerrainParameters
): number {
  const slopeRad = (params.slopeDeg * Math.PI) / 180.0;
  const roughness = params.surfaceRoughness;

  switch (scenario) {
    case 'level_paved': {
      // Flat paved staging pad with micro-texture
      return roughness * 0.04 * Math.sin(x * 3.2) * Math.cos(z * 2.8);
    }

    case 'hilly_sloped': {
      // Continuous downhill grade along negative X axis: y = -x * tan(slope)
      const slopeElevation = -x * Math.tan(slopeRad);
      // Natural undulations and rock outcrops
      const rockUndulation =
        roughness * 0.18 * (Math.sin(x * 1.4) * Math.cos(z * 1.8) + 0.4 * Math.sin(x * 3.5));
      return slopeElevation + rockUndulation;
    }

    case 'uneven_muddy': {
      // Uneven saturated soil with vehicle wheel ruts and spoil berms
      const mudBerms =
        roughness * 0.22 * (Math.sin(x * 1.1) * Math.cos(z * 1.3) + 0.5 * Math.sin(z * 2.5));
      // Channel rut depression along travel path
      const inRut = Math.abs(z) > 0.65 && Math.abs(z) < 1.05 && x > -3.0 && x < 2.0;
      const rutDepth = inRut ? -0.04 : 0.0;
      return mudBerms + rutDepth;
    }

    case 'narrow_restricted': {
      // Cobblestone alleyway with slight drainage crown in center
      const alleyCrown = 0.02 * (1.0 - Math.pow(Math.min(1.0, Math.abs(z) / 1.0), 2));
      return alleyCrown + roughness * 0.03 * Math.sin(x * 4.0);
    }

    case 'heavy_rain': {
      // Water-saturated ground with drainage puddles
      const wetUndulation = roughness * 0.08 * (Math.sin(x * 1.6) * Math.cos(z * 1.5));
      return wetUndulation;
    }

    case 'cold_high_altitude': {
      // Alpine scree slope with frozen icy crust
      const alpineSlope = -x * Math.tan(slopeRad * 0.65);
      const screeRubble = roughness * 0.14 * (Math.sin(x * 2.2) * Math.cos(z * 2.6));
      return alpineSlope + screeRubble;
    }

    default:
      return 0.0;
  }
}

/**
 * Evaluates complete surface orientation, normal vector, and contact physics at vehicle center
 */
export function evaluateTerrainSurface(
  x: number,
  z: number,
  headingRad: number,
  scenario: TerrainScenarioId,
  terrainParams: TerrainParameters,
  mobilityParams: VehicleMobilityParameters
): TerrainSurfacePoint {
  const L = mobilityParams.trackContactLengthM;
  const W = mobilityParams.trackGaugeWidthM;

  // Track orientation vectors: Forward unit vector along machine heading
  const cosH = Math.cos(headingRad);
  const sinH = Math.sin(headingRad);

  // Front and rear contact centers
  const frontX = x + (L / 2) * cosH;
  const frontZ = z + (L / 2) * sinH;
  const rearX = x - (L / 2) * cosH;
  const rearZ = z - (L / 2) * sinH;

  // Left and right track centers
  // Perpendicular vector: [-sinH, cosH]
  const leftX = x - (W / 2) * sinH;
  const leftZ = z + (W / 2) * cosH;
  const rightX = x + (W / 2) * sinH;
  const rightZ = z - (W / 2) * cosH;

  // Sample elevations at the 4 track contact quadrants
  const yCenter = getTerrainHeightAt(x, z, scenario, terrainParams);
  const yFront = getTerrainHeightAt(frontX, frontZ, scenario, terrainParams);
  const yRear = getTerrainHeightAt(rearX, rearZ, scenario, terrainParams);
  const yLeft = getTerrainHeightAt(leftX, leftZ, scenario, terrainParams);
  const yRight = getTerrainHeightAt(rightX, rightZ, scenario, terrainParams);

  // Mean ground level under tracks
  const groundY = (yFront + yRear + yLeft + yRight) / 4.0;

  // Incline Pitch angle: rise over run along vehicle travel axis
  const deltaYPitch = yFront - yRear;
  const pitchRad = Math.atan2(deltaYPitch, L);
  const pitchDeg = pitchRad * (180.0 / Math.PI);

  // Lateral Roll angle: rise over run across left and right tracks
  const deltaYRoll = yLeft - yRight;
  const rollRad = Math.atan2(deltaYRoll, W);
  const rollDeg = rollRad * (180.0 / Math.PI);

  // Approximate surface normal vector from pitch and roll
  const normal = new THREE.Vector3(-Math.sin(pitchRad), 1.0, Math.sin(rollRad)).normalize();

  // Mud sinkage calculation: Bekker semi-empirical soil sinkage approximation
  let mudSinkageM = 0.0;
  let soilFrictionCoeff = 0.65; // Baseline rubber on dry firm earth

  if (scenario === 'uneven_muddy') {
    mudSinkageM = Math.min(0.08, 0.03 + terrainParams.surfaceRoughness * 0.05);
    soilFrictionCoeff = 0.42;
  } else if (scenario === 'heavy_rain') {
    const rainFactor = Math.min(1.0, (terrainParams.rainfallIntensityMmH || 40) / 100);
    mudSinkageM = 0.02 * rainFactor;
    soilFrictionCoeff = 0.38 - 0.12 * rainFactor;
  } else if (scenario === 'cold_high_altitude') {
    soilFrictionCoeff = 0.28; // Slick ice / packed frozen scree
  } else if (scenario === 'level_paved') {
    soilFrictionCoeff = 0.85; // High traction concrete/asphalt
  }

  // Access clearance checking for narrow restricted scenario
  let clearanceConflict = false;
  if (scenario === 'narrow_restricted') {
    const pathHalfWidth = Math.max(0.7, terrainParams.pathWidthM / 2.0);
    const vehicleHalfWidth = (W + mobilityParams.trackBeltWidthM) / 2.0;
    // Conflict if either side breaches alleyway wall
    if (Math.abs(z) + vehicleHalfWidth > pathHalfWidth) {
      clearanceConflict = true;
    }
  }

  // Ground clearance risk (belly contact with tall mound or boulder)
  const centerMound = yCenter - groundY;
  const groundClearanceWarning = centerMound > mobilityParams.nominalGroundClearanceM * 0.75;

  return {
    groundY,
    surfaceNormal: normal,
    pitchDeg,
    rollDeg,
    mudSinkageM,
    soilFrictionCoeff,
    clearanceConflict,
    groundClearanceWarning
  };
}

/**
 * Calculates simplified crawler traction & gradeability parameters
 */
export function calculateTrackTraction(
  totalMassKg: number,
  soilFrictionCoeff: number,
  slopePitchDeg: number,
  mobilityParams: VehicleMobilityParameters
) {
  const g = 9.80665;
  const slopeRad = (Math.abs(slopePitchDeg) * Math.PI) / 180.0;

  // Track contact area: 2 tracks * Length * Width
  const contactAreaM2 = 2.0 * mobilityParams.trackContactLengthM * mobilityParams.trackBeltWidthM;
  // Mean ground pressure (kPa)
  const groundPressureKpa = contactAreaM2 > 0 ? (totalMassKg * g) / contactAreaM2 / 1000.0 : 38.0;

  // Maximum tractive limit before slip: F_trac = mu * NormalForce
  const normalForceKn = (totalMassKg * g * Math.cos(slopeRad)) / 1000.0;
  const maxTractionKn = soilFrictionCoeff * normalForceKn;

  // Grade resistance: F_grade = Mass * g * sin(slope)
  const gradeResistanceKn = (totalMassKg * g * Math.sin(slopeRad)) / 1000.0;

  // Rolling resistance: F_roll = Crr * NormalForce (rubber tracks ~ 0.08)
  const crr = 0.08;
  const motionResistanceKn = crr * normalForceKn + gradeResistanceKn;

  // Gradeability limit angle (degrees)
  const maxGradeRad = Math.atan(Math.max(0, soilFrictionCoeff - crr));
  const gradeabilityMaxDeg = (maxGradeRad * 180.0) / Math.PI;

  return {
    groundPressureKpa,
    maxTractionKn,
    gradeResistanceKn,
    motionResistanceKn,
    gradeabilityMaxDeg
  };
}

import {
  VehicleMobilityTelemetry,
  MobilityInputState
} from '../types/vehicleMobility';

/**
 * Steps the tracked crawler vehicle physics by timestep dt.
 * Handles forward/reverse acceleration, braking, differential steering, spin-turns,
 * terrain surface clamping, track belt UV distances, and sprocket rotations.
 */
export function stepVehicleMobility(
  prev: VehicleMobilityTelemetry,
  inputs: MobilityInputState,
  params: VehicleMobilityParameters,
  scenario: TerrainScenarioId,
  terrainParams: TerrainParameters,
  isInterlockBlocked: boolean,
  interlockBlockReason: string | null,
  collectionVolumeL: number,
  dtSeconds: number
): VehicleMobilityTelemetry {
  const dt = Math.max(0.001, Math.min(0.1, dtSeconds));

  let speedMs = prev.speedMs;
  let steerRate = prev.steerRateRadS;

  const maxSpd = params.maxTravelSpeedMs;
  const accel = params.accelerationMs2;
  const decel = params.brakingDecelMs2;
  const W = params.trackGaugeWidthM;
  const maxSteerRate = 1.35 * params.steerSensitivity;

  if (isInterlockBlocked) {
    // Interlock active: decelerate immediately to 0
    if (speedMs > 0) speedMs = Math.max(0, speedMs - decel * dt * 2.0);
    else if (speedMs < 0) speedMs = Math.min(0, speedMs + decel * dt * 2.0);
    steerRate = THREE.MathUtils.lerp(steerRate, 0, Math.min(1.0, dt * 10.0));
  } else {
    // Determine target speed from inputs
    let targetSpeed = 0;
    if (inputs.forward) {
      targetSpeed = maxSpd;
    } else if (inputs.reverse) {
      targetSpeed = -maxSpd * 0.72; // Reverse crawler ratio
    }

    if (inputs.brake) {
      // Direct service brake
      if (speedMs > 0) speedMs = Math.max(0, speedMs - decel * dt);
      else if (speedMs < 0) speedMs = Math.min(0, speedMs + decel * dt);
      steerRate = THREE.MathUtils.lerp(steerRate, 0, Math.min(1.0, dt * 8.0));
    } else if (targetSpeed !== 0) {
      if (targetSpeed > speedMs) {
        speedMs = Math.min(targetSpeed, speedMs + accel * dt);
      } else {
        speedMs = Math.max(targetSpeed, speedMs - decel * dt);
      }
    } else {
      // Natural rolling coastdown
      if (speedMs > 0) speedMs = Math.max(0, speedMs - decel * 0.45 * dt);
      else if (speedMs < 0) speedMs = Math.min(0, speedMs + decel * 0.45 * dt);
      if (Math.abs(speedMs) < 0.005) speedMs = 0;
    }

    // Steering & Counter-Rotating Pivot Spin-Turns
    if (inputs.pivotLeft) {
      // Spin turn counter-clockwise in place
      speedMs = THREE.MathUtils.lerp(speedMs, 0, Math.min(1.0, dt * 6.0));
      steerRate = maxSteerRate;
    } else if (inputs.pivotRight) {
      // Spin turn clockwise in place
      speedMs = THREE.MathUtils.lerp(speedMs, 0, Math.min(1.0, dt * 6.0));
      steerRate = -maxSteerRate;
    } else if (inputs.steerLeft) {
      steerRate = maxSteerRate * 0.75;
    } else if (inputs.steerRight) {
      steerRate = -maxSteerRate * 0.75;
    } else {
      steerRate = THREE.MathUtils.lerp(steerRate, 0, Math.min(1.0, dt * 8.0));
      if (Math.abs(steerRate) < 0.005) steerRate = 0;
    }
  }

  // Heading yaw integration (radians)
  let headingRad = prev.headingRad + steerRate * dt;
  while (headingRad > Math.PI) headingRad -= 2 * Math.PI;
  while (headingRad < -Math.PI) headingRad += 2 * Math.PI;
  const headingDeg = (headingRad * 180.0) / Math.PI;

  // Track differential linear speeds (m/s)
  // Left: v - omega * (W / 2); Right: v + omega * (W / 2)
  const leftTrackSpeedMs = speedMs - steerRate * (W / 2.0);
  const rightTrackSpeedMs = speedMs + steerRate * (W / 2.0);

  // Position integration: +X is along heading 0; forward travel projects onto X and Z
  const cosH = Math.cos(headingRad);
  const sinH = Math.sin(headingRad);
  const deltaDistance = speedMs * dt;

  let nextX = prev.position[0] + deltaDistance * cosH;
  let nextZ = prev.position[2] + deltaDistance * sinH;

  // Clamp within scene operational grounds (-8.5m to +8.5m X, -5.5m to +5.5m Z)
  nextX = Math.max(-8.5, Math.min(8.5, nextX));
  nextZ = Math.max(-5.5, Math.min(5.5, nextZ));

  // Clamping to terrain surface
  const surface = evaluateTerrainSurface(
    nextX,
    nextZ,
    headingRad,
    scenario,
    terrainParams,
    params
  );

  // Combined vehicle mass: chassis tare 2,850 kg + collection volume * 1.18 kg/L
  const totalMassKg = 2850 + collectionVolumeL * 1.18;
  const traction = calculateTrackTraction(
    totalMassKg,
    surface.soilFrictionCoeff,
    surface.pitchDeg,
    params
  );

  // Sprocket angular delta and cumulative distance
  const sprocketRadiusM = 0.26;
  const leftSprocketDelta = (leftTrackSpeedMs / sprocketRadiusM) * dt;
  const rightSprocketDelta = (rightTrackSpeedMs / sprocketRadiusM) * dt;

  const leftTrackDistanceM = prev.leftTrackDistanceM + leftTrackSpeedMs * dt;
  const rightTrackDistanceM = prev.rightTrackDistanceM + rightTrackSpeedMs * dt;
  const leftSprocketAngleRad = prev.leftSprocketAngleRad + leftSprocketDelta;
  const rightSprocketAngleRad = prev.rightSprocketAngleRad + rightSprocketDelta;

  const isMoving = Math.abs(speedMs) > 0.01 || Math.abs(steerRate) > 0.02;
  const effectiveTiltDeg = Math.sqrt(Math.pow(surface.pitchDeg, 2) + Math.pow(surface.rollDeg, 2));

  // Tractive effort in kN
  const tractiveEffortKn = isMoving
    ? Math.min(traction.maxTractionKn, traction.motionResistanceKn + Math.abs(speedMs) * 1.5)
    : 0.0;
  const isSlipping = Math.abs(surface.pitchDeg) > traction.gradeabilityMaxDeg;

  return {
    position: [nextX, surface.groundY, nextZ],
    headingDeg,
    headingRad,
    pitchDeg: surface.pitchDeg,
    rollDeg: surface.rollDeg,
    effectiveTiltDeg,
    speedMs,
    speedKmh: speedMs * 3.6,
    steerRateRadS: steerRate,
    leftTrackSpeedMs,
    rightTrackSpeedMs,
    leftTrackDistanceM,
    rightTrackDistanceM,
    leftSprocketAngleRad,
    rightSprocketAngleRad,
    groundPressureKpa: traction.groundPressureKpa,
    gradeabilityMaxDeg: traction.gradeabilityMaxDeg,
    currentTractionCoeff: surface.soilFrictionCoeff,
    tractiveEffortKn,
    motionResistanceKn: traction.motionResistanceKn,
    isSlipping,
    isMoving,
    isInterlockBlocked,
    interlockBlockReason
  };
}
