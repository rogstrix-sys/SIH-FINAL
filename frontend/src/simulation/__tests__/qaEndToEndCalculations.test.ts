import { describe, it, expect } from 'vitest';
import {
  createInitialEngineState,
  stepSimulationEngine,
  triggerStart,
  triggerPause,
  triggerResume,
  triggerReset,
  triggerEmergencyStop,
  triggerResolveFault,
  calculateEffectiveViscosity,
  calculateFluidDynamics
} from '../deterministicEngine';
import {
  calculateTerrainFeasibility,
  DEFAULT_TERRAIN_PARAMS,
  DEFAULT_STABILITY_THRESHOLDS
} from '../terrainFeasibilityModel';

describe('QA Engine Physics & Hydro-Mechanical Calculations', () => {
  it('correctly calculates Reynolds number and fluid velocity for given flow rate', () => {
    const params = {
      ...createInitialEngineState().parameters,
      hoseDiameterMm: 100, // 0.1 m
      sludgeDensityKgM3: 1180,
      sludgeViscosityCp: 450
    };

    const flowLpm = 450; // 450 L/min
    const result = calculateFluidDynamics(flowLpm, params, 450, 2.5);

    // Cross-sectional area = pi * (0.1)^2 / 4 = 0.00785398 m2
    // Velocity = (450 / 60000) / 0.00785398 = 0.9549 m/s
    expect(result.velocityMs).toBeGreaterThan(0.9);
    expect(result.velocityMs).toBeLessThan(1.0);

    // Re = (1180 * 0.955 * 0.1) / (450 * 0.001) = ~250.4 (Laminar flow, Re < 2000)
    expect(result.reynolds).toBeGreaterThan(200);
    expect(result.reynolds).toBeLessThan(350);
  });

  it('verifies non-Newtonian shear-thinning reduction from high-pressure water jetting', () => {
    const baseViscosity = 500; // cP
    const unassisted = calculateEffectiveViscosity(baseViscosity, false, 0);
    expect(unassisted).toBe(500);

    const assisted140Bar = calculateEffectiveViscosity(baseViscosity, true, 140);
    // 140 bar reduces viscosity significantly
    expect(assisted140Bar).toBeLessThan(baseViscosity);
    expect(assisted140Bar).toBeGreaterThan(200);

    const assisted250Bar = calculateEffectiveViscosity(baseViscosity, true, 250);
    // At maximum 250 bar, 55% reduction (45% remaining)
    expect(assisted250Bar).toBeCloseTo(baseViscosity * 0.45, 1);
  });

  it('validates Darcy-Weisbach head loss scales with hose length and inversely with diameter', () => {
    const baseParams = createInitialEngineState().parameters;

    const shortHose = calculateFluidDynamics(400, { ...baseParams, hoseLengthM: 10 }, 400, 2.0);
    const longHose = calculateFluidDynamics(400, { ...baseParams, hoseLengthM: 40 }, 400, 2.0);
    expect(longHose.frictionHeadKpa).toBeGreaterThan(shortHose.frictionHeadKpa * 3.5);

    // Constricting diameter increases friction dramatically
    const wideHose = calculateFluidDynamics(400, { ...baseParams, hoseDiameterMm: 120 }, 400, 2.0);
    const narrowHose = calculateFluidDynamics(400, { ...baseParams, hoseDiameterMm: 75 }, 400, 2.0);
    expect(narrowHose.frictionHeadKpa).toBeGreaterThan(wideHose.frictionHeadKpa * 2.0);
  });

  it('confirms motor power demand increases with higher viscosity and higher suction lift', () => {
    const baseParams = createInitialEngineState().parameters;

    const lowVisc = calculateFluidDynamics(450, baseParams, 100, 1.5);
    const highVisc = calculateFluidDynamics(450, baseParams, 800, 1.5);
    expect(highVisc.motorPowerKw).toBeGreaterThan(lowVisc.motorPowerKw);

    const deepLift = calculateFluidDynamics(450, baseParams, 400, 4.5);
    const shallowLift = calculateFluidDynamics(450, baseParams, 400, 1.0);
    expect(deepLift.suctionVacuumKpa).toBeGreaterThan(shallowLift.suctionVacuumKpa);
    expect(deepLift.cavitationRisk).toBeGreaterThan(shallowLift.cavitationRisk);
  });
});

describe('QA Deterministic Mass Balance & State Sequencing', () => {
  it('strictly preserves total mass invariant across complete multi-step extraction cycle', () => {
    let state = createInitialEngineState({
      initialSourceVolumeL: 2000,
      targetExtractionVolumeL: 500
    });
    const totalInitial = state.materialBalance.totalInitialVolumeL;

    // Fast-track into EXTRACT
    state.operatingState = 'EXTRACT';
    state.interlocks.isDeployed = true;
    state.interlocks.isPrimed = true;

    // Run 200 steps (10 seconds simulated)
    for (let i = 0; i < 200; i++) {
      state = stepSimulationEngine(state, 0.05);
      const currentTotal =
        state.materialBalance.sourceVolumeL +
        state.materialBalance.collectionVolumeL +
        state.materialBalance.receiverVolumeL;

      expect(Math.abs(currentTotal - totalInitial)).toBeLessThan(1e-4);
      expect(Math.abs(state.materialBalance.massBalanceDiscrepancyL)).toBeLessThan(1e-4);
    }

    // Material has transferred from source to collection tank
    expect(state.materialBalance.collectionVolumeL).toBeGreaterThan(30);
    expect(state.materialBalance.sourceVolumeL).toBeLessThan(2000);
  });

  it('triggers emergency stop, disables material transfer immediately, and unlatches upon fault resolution', () => {
    let state = createInitialEngineState();
    state = triggerStart(state);
    state.operatingState = 'EXTRACT';
    state.interlocks.isDeployed = true;
    state.interlocks.isPrimed = true;

    state = stepSimulationEngine(state, 0.05);
    expect(state.telemetry.flowRateLpm).toBeGreaterThan(0);

    // Hit E-STOP
    state = triggerEmergencyStop(state);
    expect(state.operatingState).toBe('FAULT');
    expect(state.alarms.emergencyStopActive).toBe(true);
    expect(state.interlocks.emergencyStopLatched).toBe(true);

    // Advance while fault is latched - material must freeze
    const frozenVolume = state.materialBalance.collectionVolumeL;
    state = stepSimulationEngine(state, 0.1);
    expect(state.telemetry.flowRateLpm).toBe(0);
    expect(state.materialBalance.collectionVolumeL).toBe(frozenVolume);

    // Operator acknowledges & clears fault
    state = triggerResolveFault(state);
    expect(state.operatingState).toBe('IDLE');
    expect(state.interlocks.emergencyStopLatched).toBe(false);
    expect(state.alarms.emergencyStopActive).toBe(false);
  });

  it('pauses and resumes without losing accumulated volume or advancing simulation time', () => {
    let state = createInitialEngineState();
    state.operatingState = 'EXTRACT';
    state.interlocks.isDeployed = true;
    state.interlocks.isPrimed = true;

    // Run 40 steps
    for (let i = 0; i < 40; i++) {
      state = stepSimulationEngine(state, 0.05);
    }
    const capturedTime = state.simulatedTimeSec;
    const capturedVolume = state.materialBalance.collectionVolumeL;

    // Pause simulation
    state = triggerPause(state);
    expect(state.isPaused).toBe(true);

    // Step while paused
    state = stepSimulationEngine(state, 0.05);
    expect(state.simulatedTimeSec).toBe(capturedTime);
    expect(state.materialBalance.collectionVolumeL).toBe(capturedVolume);

    // Resume simulation
    state = triggerResume(state);
    expect(state.isPaused).toBe(false);
    state = stepSimulationEngine(state, 0.05);
    expect(state.simulatedTimeSec).toBeGreaterThan(capturedTime);
  });

  it('resets all state, charts, kinematics, and material balance to clean baseline', () => {
    let state = createInitialEngineState();
    state.operatingState = 'EXTRACT';
    state.materialBalance.collectionVolumeL = 800;
    state.simulatedTimeSec = 45;

    state = triggerReset(state);
    expect(state.operatingState).toBe('IDLE');
    expect(state.simulatedTimeSec).toBe(0);
    expect(state.materialBalance.collectionVolumeL).toBe(0);
    expect(state.telemetry.flowRateLpm).toBe(0);
    expect(state.kinematics.deployProgress).toBe(0);
    expect(state.events.length).toBeGreaterThanOrEqual(1);
  });

  it('enforces collection tank full limit interlock and auto-transitions to discharge', () => {
    let state = createInitialEngineState({
      collectionTankCapacityL: 500,
      initialSourceVolumeL: 2000
    });
    state.operatingState = 'EXTRACT';
    state.interlocks.isDeployed = true;
    state.interlocks.isPrimed = true;
    // Set collection tank to 100% capacity (500L)
    state.materialBalance.collectionVolumeL = 500;
    state.materialBalance.collectionFillPct = 100.0;

    state = stepSimulationEngine(state, 0.05);
    expect(state.alarms.collectionTankFull).toBe(true);
    expect(state.interlocks.preventExtractTankFull).toBe(true);
    expect(state.operatingState).toBe('DISCHARGE');
  });
});

describe('QA Terrain Engineering Feasibility Model', () => {
  it('correctly calculates roll and pitch angles based on terrain orientation and grade', () => {
    const params = {
      ...DEFAULT_TERRAIN_PARAMS,
      slopeDeg: 18.0,
      machineHeadingDeg: 90.0 // Across slope (causes pure roll)
    };

    const estimate = calculateTerrainFeasibility(params, 0.0, 35.0, 1180, 450, 100, DEFAULT_STABILITY_THRESHOLDS);
    expect(estimate.effectiveTiltDeg).toBeCloseTo(18.0, 1);
    expect(Math.abs(estimate.chassisRollDeg)).toBeGreaterThan(16.0);
    expect(Math.abs(estimate.chassisPitchDeg)).toBeLessThan(2.0);
  });

  it('triggers critical stability warning when terrain slope exceeds safe threshold', () => {
    const params = {
      ...DEFAULT_TERRAIN_PARAMS,
      slopeDeg: 26.0
    };
    const thresholds = {
      ...DEFAULT_STABILITY_THRESHOLDS,
      maxChassisTiltDeg: 15.0,
      criticalRolloverDeg: 25.0
    };

    const estimate = calculateTerrainFeasibility(params, 0.0, 35.0, 1180, 450, 100, thresholds);
    expect(estimate.stabilityStatus).toBe('critical_unstable');
    expect(estimate.warnings.some((w) => w.includes('CRITICAL INSTABILITY'))).toBe(true);
  });

  it('triggers narrow passage clearance warning when access width is restricted', () => {
    const params = {
      ...DEFAULT_TERRAIN_PARAMS,
      pathWidthM: 1.4 // Machine width: 1.35m => lateral margin = 0.025m < 0.15m safe margin
    };

    const estimate = calculateTerrainFeasibility(params, 0.0, 35.0, 1180, 450, 100, DEFAULT_STABILITY_THRESHOLDS);
    expect(estimate.clearanceConflictDetected).toBe(true);
    expect(estimate.warnings.some((w) => w.includes('Restricted clearance alert'))).toBe(true);
  });

  it('detects insufficient hose length for selected terrain routing', () => {
    const params = {
      ...DEFAULT_TERRAIN_PARAMS,
      machineSetbackM: 40.0
    };
    // Configured hose length 20m is much less than needed for 40m setback
    const estimate = calculateTerrainFeasibility(params, 0.0, 20.0, 1180, 450, 100, DEFAULT_STABILITY_THRESHOLDS);
    expect(estimate.hoseLengthAdequate).toBe(false);
    expect(estimate.warnings.some((w) => w.includes('Insufficient hose length'))).toBe(true);
    expect(estimate.requiredHoseLengthM).toBeGreaterThan(20.0);
  });
});
