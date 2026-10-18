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
  triggerManualDischarge,
  triggerDeploy,
  triggerPrime,
  triggerExtract,
  triggerDischarge,
  calculateEffectiveViscosity,
  calculateFluidDynamics
} from '../deterministicEngine';

describe('Deterministic Simulation Engine', () => {
  it('1. Initializes cleanly in IDLE with perfect initial mass balance', () => {
    const state = createInitialEngineState();
    expect(state.operatingState).toBe('IDLE');
    expect(state.simulatedTimeSec).toBe(0);
    expect(state.isPaused).toBe(false);
    expect(state.materialBalance.sourceVolumeL).toBe(3800);
    expect(state.materialBalance.collectionVolumeL).toBe(0);
    expect(state.materialBalance.receiverVolumeL).toBe(0);
    expect(state.materialBalance.totalInitialVolumeL).toBe(3800);
    expect(state.materialBalance.massBalanceDiscrepancyL).toBe(0);
    expect(state.interlocks.isDeployed).toBe(false);
    expect(state.interlocks.isPrimed).toBe(false);
  });

  it('2. Advances through DEPLOY and PRIME to EXTRACT', () => {
    let state = createInitialEngineState();
    state = triggerStart(state);
    expect(state.operatingState).toBe('DEPLOY');

    // Step through DEPLOY (duration 3.5s)
    for (let i = 0; i < 75; i++) {
      state = stepSimulationEngine(state, 0.05);
    }
    // Should have transitioned to PRIME
    expect(state.interlocks.isDeployed).toBe(true);
    expect(state.kinematics.deployProgress).toBeGreaterThanOrEqual(1.0);
    expect(state.operatingState).toBe('PRIME');

    // Step through PRIME (duration 2.5s)
    for (let i = 0; i < 55; i++) {
      state = stepSimulationEngine(state, 0.05);
    }
    // Should have transitioned to EXTRACT
    expect(state.interlocks.isPrimed).toBe(true);
    expect(state.operatingState).toBe('EXTRACT');
    state = stepSimulationEngine(state, 0.05);
    expect(state.telemetry.flowRateLpm).toBeGreaterThan(0);
  });

  it('3. Preserves Mass Balance Invariant strictly during EXTRACT and DISCHARGE', () => {
    let state = createInitialEngineState({
      initialSourceVolumeL: 1200,
      collectionTankCapacityL: 800,
      targetExtractionVolumeL: 800
    });
    state = triggerStart(state);

    // Fast-forward through DEPLOY and PRIME to EXTRACT
    while (state.operatingState !== 'EXTRACT') {
      state = stepSimulationEngine(state, 0.1);
    }

    const initialTotal = state.materialBalance.totalInitialVolumeL;

    // Run extraction steps
    for (let i = 0; i < 150; i++) {
      state = stepSimulationEngine(state, 0.1);
      const currentSum =
        state.materialBalance.sourceVolumeL +
        state.materialBalance.collectionVolumeL +
        state.materialBalance.receiverVolumeL;

      expect(Math.abs(currentSum - initialTotal)).toBeLessThan(1e-4);
      expect(state.materialBalance.massBalanceDiscrepancyL).toBeLessThan(1e-4);
    }

    // Trigger DISCHARGE and verify conservation of mass
    state = triggerManualDischarge(state);
    expect(state.operatingState).toBe('DISCHARGE');

    for (let i = 0; i < 100; i++) {
      state = stepSimulationEngine(state, 0.1);
      const currentSum =
        state.materialBalance.sourceVolumeL +
        state.materialBalance.collectionVolumeL +
        state.materialBalance.receiverVolumeL;

      expect(Math.abs(currentSum - initialTotal)).toBeLessThan(1e-4);
      expect(state.materialBalance.massBalanceDiscrepancyL).toBeLessThan(1e-4);
    }
  });

  it('4. Enforces collection tank capacity limit and auto-transitions', () => {
    let state = createInitialEngineState({
      initialSourceVolumeL: 3000,
      collectionTankCapacityL: 80, // Small capacity to hit limit quickly
      targetExtractionVolumeL: 1000
    });

    state = triggerStart(state);
    while (state.operatingState !== 'EXTRACT') {
      state = stepSimulationEngine(state, 0.1);
    }

    // Run until collection tank hits capacity
    let iterations = 0;
    while (state.operatingState === 'EXTRACT' && iterations < 300) {
      state = stepSimulationEngine(state, 0.1);
      iterations++;
    }

    // Must transition to DISCHARGE and collection volume must not exceed capacity
    expect(state.materialBalance.collectionVolumeL).toBeLessThanOrEqual(80.0);
    expect(state.operatingState).toBe('DISCHARGE');
  });

  it('5. Triggers low source level alarm when source volume drops below limit', () => {
    let state = createInitialEngineState({
      initialSourceVolumeL: 200,
      collectionTankCapacityL: 1000
    }, {
      lowSourceLevelL: 150
    });

    state = triggerStart(state);
    while (state.operatingState !== 'EXTRACT') {
      state = stepSimulationEngine(state, 0.1);
    }

    expect(state.alarms.lowSourceLevel).toBe(false);

    // Run until source drops below 150 L
    while (state.materialBalance.sourceVolumeL > 140 && state.operatingState === 'EXTRACT') {
      state = stepSimulationEngine(state, 0.05);
    }

    expect(state.alarms.lowSourceLevel).toBe(true);
  });

  it('6. Triggers Emergency Stop immediately, halts machinery, and recovers via resolveFault', () => {
    let state = createInitialEngineState();
    state = triggerStart(state);

    while (state.operatingState !== 'EXTRACT') {
      state = stepSimulationEngine(state, 0.1);
    }
    state = stepSimulationEngine(state, 0.1);

    expect(state.telemetry.flowRateLpm).toBeGreaterThan(0);

    // Hit E-STOP
    state = triggerEmergencyStop(state);
    expect(state.operatingState).toBe('FAULT');
    expect(state.alarms.emergencyStopActive).toBe(true);
    expect(state.interlocks.emergencyStopLatched).toBe(true);
    expect(state.telemetry.flowRateLpm).toBe(0);
    expect(state.kinematics.isMaterialFlowing).toBe(false);
    expect(state.kinematics.pumpShaftRpm).toBe(0);

    // Stepping in FAULT state does not advance material transfer
    const savedSource = state.materialBalance.sourceVolumeL;
    state = stepSimulationEngine(state, 0.1);
    expect(state.materialBalance.sourceVolumeL).toBe(savedSource);

    // Resolve fault
    state = triggerResolveFault(state);
    expect(state.operatingState).toBe('IDLE');
    expect(state.alarms.emergencyStopActive).toBe(false);
    expect(state.interlocks.emergencyStopLatched).toBe(false);
  });

  it('7. Pauses and resumes simulation without volume jumps', () => {
    let state = createInitialEngineState();
    state = triggerStart(state);

    while (state.operatingState !== 'EXTRACT') {
      state = stepSimulationEngine(state, 0.1);
    }

    state = triggerPause(state);
    expect(state.isPaused).toBe(true);

    const pausedSource = state.materialBalance.sourceVolumeL;
    const pausedTime = state.simulatedTimeSec;

    // Stepping while paused does nothing
    state = stepSimulationEngine(state, 0.5);
    expect(state.materialBalance.sourceVolumeL).toBe(pausedSource);
    expect(state.simulatedTimeSec).toBe(pausedTime);

    // Resume
    state = triggerResume(state);
    expect(state.isPaused).toBe(false);
    state = stepSimulationEngine(state, 0.1);
    expect(state.simulatedTimeSec).toBeGreaterThan(pausedTime);
  });

  it('8. Hydro-jetting reduces effective viscosity according to physical shear model', () => {
    const rawViscosity = 1000;
    const unjetted = calculateEffectiveViscosity(rawViscosity, false, 0);
    expect(unjetted).toBe(1000);

    const jetted = calculateEffectiveViscosity(rawViscosity, true, 200);
    expect(jetted).toBeLessThan(rawViscosity);
    expect(jetted).toBeCloseTo(560, 0); // ~44% reduction
  });

  it('9. Enforces discrete operator trigger interlocks (Deploy -> Prime -> Extract -> Discharge)', () => {
    let state = createInitialEngineState();
    expect(state.operatingState).toBe('IDLE');

    // Trigger extract directly before deploy & prime should be blocked by interlock
    state = triggerExtract(state);
    expect(state.operatingState).toBe('IDLE');
    expect(state.events[0].source).toBe('INTERLOCK_BLOCK');

    // Trigger deploy
    state = triggerDeploy(state);
    expect(state.operatingState).toBe('DEPLOY');

    // Step through deploy sequence
    while (state.kinematics.deployProgress < 1.0) {
      state = stepSimulationEngine(state, 0.1);
    }
    expect(state.interlocks.isDeployed).toBe(true);

    // Trigger prime
    state = triggerPrime(state);
    expect(state.operatingState).toBe('PRIME');

    // Step through prime sequence
    while (!state.interlocks.isPrimed) {
      state = stepSimulationEngine(state, 0.1);
    }
    expect(state.interlocks.isPrimed).toBe(true);

    // Trigger extract
    state = triggerExtract(state);
    expect(state.operatingState).toBe('EXTRACT');

    // Step extraction until some material is collected
    state = stepSimulationEngine(state, 1.0);
    expect(state.materialBalance.collectionVolumeL).toBeGreaterThan(0);

    // Trigger discharge
    state = triggerDischarge(state);
    expect(state.operatingState).toBe('DISCHARGE');
  });

  it('10. Reset resets model, kinematics, and tanks cleanly to IDLE baseline', () => {
    let state = createInitialEngineState();
    state = triggerStart(state);
    for (let i = 0; i < 20; i++) {
      state = stepSimulationEngine(state, 0.2);
    }

    const resetState = triggerReset(state);
    expect(resetState.operatingState).toBe('IDLE');
    expect(resetState.isPaused).toBe(false);
    expect(resetState.simulatedTimeSec).toBe(0);
    expect(resetState.materialBalance.collectionVolumeL).toBe(0);
    expect(resetState.materialBalance.receiverVolumeL).toBe(0);
    expect(resetState.kinematics.deployProgress).toBe(0);
    expect(resetState.kinematics.stabilizerExtension).toBe(0);
    expect(resetState.alarms.emergencyStopActive).toBe(false);
  });
});

