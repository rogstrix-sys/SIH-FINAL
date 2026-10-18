import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from '../../store/useSimulationStore';
import {
  evaluateTerrainSurface,
  calculateTrackTraction,
  stepVehicleMobility
} from '../../utils/terrainPhysics';
import {
  DEFAULT_MOBILITY_PARAMS,
  INITIAL_MOBILITY_TELEMETRY,
  MobilityInputState
} from '../../types/vehicleMobility';
import { DEFAULT_TERRAIN_PARAMS } from '../terrainFeasibilityModel';

describe('Tracked Engineering Vehicle Mobility & Drive Dynamics (SIH 26258)', () => {
  const defaultInputs: MobilityInputState = {
    forward: false,
    reverse: false,
    steerLeft: false,
    steerRight: false,
    pivotLeft: false,
    pivotRight: false,
    brake: false
  };

  beforeEach(() => {
    const store = useSimulationStore.getState();
    store.stopGuidedDemo();
    store.resetSimulation();
    store.resetVehiclePosition();
  });

  it('1. Accelerates forward and reverse to crawler speed limits', () => {
    let telemetry = { ...INITIAL_MOBILITY_TELEMETRY };
    const inputs = { ...defaultInputs, forward: true };

    // Step forward acceleration for 10 steps (1.0 sec total)
    for (let i = 0; i < 10; i++) {
      telemetry = stepVehicleMobility(
        telemetry,
        inputs,
        DEFAULT_MOBILITY_PARAMS,
        'level_paved',
        DEFAULT_TERRAIN_PARAMS,
        false,
        null,
        0,
        0.1
      );
    }

    expect(telemetry.speedMs).toBeGreaterThan(0.8);
    expect(telemetry.speedMs).toBeLessThanOrEqual(DEFAULT_MOBILITY_PARAMS.maxTravelSpeedMs);
    expect(telemetry.position[0]).toBeGreaterThan(0); // Displaced forward along X
    expect(telemetry.leftSprocketAngleRad).toBeGreaterThan(0);
    expect(telemetry.leftTrackDistanceM).toBeGreaterThan(0);

    // Test Reverse
    const revInputs = { ...defaultInputs, reverse: true };
    for (let i = 0; i < 20; i++) {
      telemetry = stepVehicleMobility(
        telemetry,
        revInputs,
        DEFAULT_MOBILITY_PARAMS,
        'level_paved',
        DEFAULT_TERRAIN_PARAMS,
        false,
        null,
        0,
        0.1
      );
    }
    expect(telemetry.speedMs).toBeLessThan(0); // Negative reverse velocity
  });

  it('2. Executes 360-degree counter-rotating spin turn in place (Zero Turning Radius)', () => {
    let telemetry = { ...INITIAL_MOBILITY_TELEMETRY };
    const pivotInputs = { ...defaultInputs, pivotLeft: true };

    // Step pivot left for 15 steps
    for (let i = 0; i < 15; i++) {
      telemetry = stepVehicleMobility(
        telemetry,
        pivotInputs,
        DEFAULT_MOBILITY_PARAMS,
        'level_paved',
        DEFAULT_TERRAIN_PARAMS,
        false,
        null,
        0,
        0.1
      );
    }

    // Linear velocity must remain approximately zero during in-place pivot
    expect(Math.abs(telemetry.speedMs)).toBeLessThan(0.05);
    // Yaw rate is strongly positive (turning left)
    expect(telemetry.steerRateRadS).toBeGreaterThan(1.0);
    // Counter-rotating track speeds: Left track drives backward, Right track drives forward
    expect(telemetry.leftTrackSpeedMs).toBeLessThan(0);
    expect(telemetry.rightTrackSpeedMs).toBeGreaterThan(0);
    // Heading angle changed
    expect(telemetry.headingRad).not.toBe(0);
  });

  it('3. Enforces safety interlocks: Blocks driving when stabilizers deployed or extracting', () => {
    let telemetry = { ...INITIAL_MOBILITY_TELEMETRY };
    const fwdInputs = { ...defaultInputs, forward: true };

    // Step with interlock blocked (e.g. stabilizers extended)
    const blockedTelemetry = stepVehicleMobility(
      telemetry,
      fwdInputs,
      DEFAULT_MOBILITY_PARAMS,
      'level_paved',
      DEFAULT_TERRAIN_PARAMS,
      true,
      'STABILIZERS EXTENDED — Retract hydraulic outriggers to travel',
      0,
      0.1
    );

    expect(blockedTelemetry.isInterlockBlocked).toBe(true);
    expect(blockedTelemetry.speedMs).toBe(0);
    expect(blockedTelemetry.interlockBlockReason).toContain('STABILIZERS EXTENDED');
    expect(blockedTelemetry.position[0]).toBe(0); // Zero movement
  });

  it('4. Clamps vehicle elevation and orientation continuously to sloped terrain', () => {
    const slopeParams = { ...DEFAULT_TERRAIN_PARAMS, slopeDeg: 14.0 };
    let telemetry = { ...INITIAL_MOBILITY_TELEMETRY, position: [3.5, 0, 0] as [number, number, number] };
    const fwdInputs = { ...defaultInputs, forward: true };

    telemetry = stepVehicleMobility(
      telemetry,
      fwdInputs,
      DEFAULT_MOBILITY_PARAMS,
      'hilly_sloped',
      slopeParams,
      false,
      null,
      1200,
      0.1
    );

    // Height y must match negative slope downhill elevation: y = -x * tan(14°)
    const expectedSlopeY = -telemetry.position[0] * Math.tan((14.0 * Math.PI) / 180.0);
    expect(telemetry.position[1]).toBeCloseTo(expectedSlopeY, 0.5);
    // Pitch inclination reflects slope grade
    expect(Math.abs(telemetry.pitchDeg)).toBeGreaterThan(10.0);
    // Low crawler ground contact pressure maintained
    expect(telemetry.groundPressureKpa).toBeLessThan(55.0);
  });

  it('5. Resets crawler to origin dock coordinates [0, 0, 0] cleanly', () => {
    const store = useSimulationStore.getState();

    // Drive forward
    store.setMobilityInput('forward', true);
    for (let i = 0; i < 10; i++) {
      store.tickSimulation(0.1);
    }
    expect(useSimulationStore.getState().mobilityTelemetry.position[0]).toBeGreaterThan(0);

    // Reset position
    store.resetVehiclePosition();
    const resetTelem = useSimulationStore.getState().mobilityTelemetry;
    expect(resetTelem.position[0]).toBe(0);
    expect(resetTelem.speedMs).toBe(0);
    expect(resetTelem.headingDeg).toBe(0);
  });
});
