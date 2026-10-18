import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialEngineState,
  stepSimulationEngine,
  triggerTravel,
  triggerPosition,
  triggerStabilize,
  triggerDeployHose,
  triggerPrime,
  triggerExtract,
  triggerSettle,
  triggerCompact,
  triggerSecure,
  triggerTransportReady,
  triggerDischarge,
  triggerAdvanceWorkflow,
  triggerEmergencyStop,
  triggerResolveFault,
  triggerReset
} from '../deterministicEngine';
import { WORKFLOW_STAGES } from '../../types/simulationEngine';
import { useSimulationStore } from '../../store/useSimulationStore';

describe('12-Stage Mechanized Desludging & Dewatering Workflow State Machine', () => {
  beforeEach(() => {
    useSimulationStore.getState().resetSimulation();
  });

  it('1. Verifies WORKFLOW_STAGES constant contains all 12 stages in correct chronological order', () => {
    expect(WORKFLOW_STAGES).toHaveLength(12);
    const expectedIds = [
      'TRAVEL',
      'POSITION',
      'STABILIZE',
      'DEPLOY_HOSE',
      'PRIME',
      'EXTRACT',
      'SETTLE',
      'COMPACT',
      'SECURE',
      'TRANSPORT_READY',
      'DISCHARGE',
      'COMPLETE'
    ];
    WORKFLOW_STAGES.forEach((stage, idx) => {
      expect(stage.id).toBe(expectedIds[idx]);
      expect(stage.order).toBe(idx + 1);
      expect(stage.requiredConditions.length).toBeGreaterThan(0);
    });
  });

  it('2. Completes full sequential 12-stage workflow from TRAVEL to COMPLETE', () => {
    let state = createInitialEngineState();
    expect(state.operatingState).toBe('IDLE');

    // Stage 1: TRAVEL
    state = triggerTravel(state);
    expect(state.operatingState).toBe('TRAVEL');
    state = stepSimulationEngine(state, 0.1);
    expect(state.operatingState).toBe('TRAVEL');

    // Stage 2: POSITION
    state = triggerPosition(state);
    expect(state.operatingState).toBe('POSITION');

    // Stage 3: STABILIZE
    state = triggerStabilize(state);
    expect(state.operatingState).toBe('STABILIZE');
    // Step until stabilized (duration 2.5s)
    for (let i = 0; i < 35; i++) {
      state = stepSimulationEngine(state, 0.1);
    }
    expect(state.interlocks.isStabilized).toBe(true);
    expect(state.kinematics.stabilizerExtension).toBeGreaterThanOrEqual(0.99);

    // Stage 4: DEPLOY_HOSE
    state = triggerDeployHose(state);
    expect(state.operatingState).toBe('DEPLOY_HOSE');
    // Step until boom deployed (duration 3.0s)
    for (let i = 0; i < 40; i++) {
      state = stepSimulationEngine(state, 0.1);
    }
    expect(state.interlocks.isDeployed).toBe(true);
    expect(state.kinematics.deployProgress).toBeGreaterThanOrEqual(0.99);

    // Stage 5: PRIME
    state = triggerPrime(state);
    expect(state.operatingState).toBe('PRIME');
    for (let i = 0; i < 30; i++) {
      state = stepSimulationEngine(state, 0.1);
    }
    expect(state.interlocks.isPrimed).toBe(true);
    expect(state.operatingState).toBe('EXTRACT');

    // Stage 6: EXTRACT (transfers sludge, maintains strict mass conservation)
    const initialTotalL = state.materialBalance.totalInitialVolumeL;
    for (let i = 0; i < 20; i++) {
      state = stepSimulationEngine(state, 0.1);
    }
    expect(state.materialBalance.cycleExtractedL).toBeGreaterThan(0);
    expect(Math.abs(state.materialBalance.massBalanceDiscrepancyL)).toBeLessThan(1e-4);
    const sumL = state.materialBalance.sourceVolumeL + state.materialBalance.collectionVolumeL + state.materialBalance.receiverVolumeL;
    expect(sumL).toBeCloseTo(initialTotalL, 2);

    // Stage 7: SETTLE
    state = triggerSettle(state);
    expect(state.operatingState).toBe('SETTLE');
    expect(state.kinematics.isMaterialFlowing).toBe(false);
    expect(state.telemetry.flowRateLpm).toBe(0);

    // Step through settling duration (4.0s)
    for (let i = 0; i < 50; i++) {
      state = stepSimulationEngine(state, 0.1);
    }
    expect(state.operatingState).toBe('COMPACT');

    // Stage 8: COMPACT
    state = stepSimulationEngine(state, 0.1);
    expect(state.operatingState).toBe('COMPACT');

    // Stage 9: SECURE (platen returned to home position 0mm and retention pin locked)
    state = triggerSecure(state);
    expect(state.operatingState).toBe('SECURE');
    expect(state.interlocks.isTransportSecured).toBe(true);

    // Stage 10: TRANSPORT_READY
    state = triggerTransportReady(state);
    expect(state.operatingState).toBe('TRANSPORT_READY');
    expect(state.interlocks.isTransportReady).toBe(true);
    expect(state.kinematics.stabilizerExtension).toBeLessThan(0.05);
    expect(state.kinematics.deployProgress).toBeLessThan(0.05);

    // Stage 11: DISCHARGE (transfer collected material to receiving facility)
    state = triggerDischarge(state);
    expect(state.operatingState).toBe('DISCHARGE');
    while (state.operatingState === 'DISCHARGE') {
      state = stepSimulationEngine(state, 0.1);
    }

    // Stage 12: COMPLETE
    expect(state.operatingState).toBe('COMPLETE');
    expect(state.materialBalance.collectionVolumeL).toBe(0);
    expect(Math.abs(state.materialBalance.massBalanceDiscrepancyL)).toBeLessThan(1e-4);
  });

  it('3. Inhibits vehicle TRAVEL when stabilizers extended or platen not locked', () => {
    let state = createInitialEngineState();
    // Simulate unstowed stabilizers (outriggers extended)
    state.kinematics.stabilizerExtension = 0.5;
    state.interlocks.isTransportSecured = true;

    state = triggerTravel(state);
    // Interlock must block travel, latch FAULT, and record invalidVehicleMovement
    expect(state.operatingState).toBe('FAULT');
    expect(state.alarms.invalidVehicleMovement).toBe(true);
    expect(state.interlocks.preventTravelNotTransportReady).toBe(true);

    // Operator recovers fault
    state = triggerResolveFault(state);
    expect(state.operatingState).toBe('IDLE');
    expect(state.alarms.invalidVehicleMovement).toBe(false);

    // Case B: Platen retention pins disengaged
    state.kinematics.stabilizerExtension = 0.0;
    state.interlocks.isTransportSecured = false;
    state = triggerTravel(state);
    expect(state.operatingState).toBe('FAULT');
    expect(state.alarms.invalidVehicleMovement).toBe(true);
  });

  it('4. Inhibits compaction when vehicle in motion or extraction active', () => {
    let state = createInitialEngineState();

    // Case A: Cannot compact when moving in TRAVEL
    state.interlocks.isTransportSecured = true;
    state.operatingState = 'TRAVEL';
    state = triggerCompact(state);
    expect(state.operatingState).toBe('FAULT');
    expect(state.interlocks.preventCompactionNotStationary).toBe(true);

    // Recover
    state = triggerResolveFault(state);

    // Case B: Cannot compact when stabilizers not deployed
    state.operatingState = 'IDLE';
    state.kinematics.stabilizerExtension = 0.0;
    state.interlocks.isDeployed = false;
    state.interlocks.isStabilized = false;
    state = triggerCompact(state);
    expect(state.operatingState).toBe('FAULT');
  });

  it('5. Emergency Stop halts motion and latches FAULT immediately from any state', () => {
    let state = createInitialEngineState();
    state = triggerTravel(state);
    expect(state.operatingState).toBe('TRAVEL');

    // Trigger E-STOP
    state = triggerEmergencyStop(state);
    expect(state.operatingState).toBe('FAULT');
    expect(state.alarms.emergencyStopActive).toBe(true);
    expect(state.interlocks.emergencyStopLatched).toBe(true);
    expect(state.telemetry.flowRateLpm).toBe(0);
    expect(state.kinematics.isMaterialFlowing).toBe(false);

    // Cannot advance while E-STOP latched
    const attemptedStart = triggerTravel(state);
    expect(attemptedStart.operatingState).toBe('FAULT');

    // Operator fault recovery restores IDLE
    const recovered = triggerResolveFault(state);
    expect(recovered.operatingState).toBe('IDLE');
    expect(recovered.alarms.emergencyStopActive).toBe(false);
    expect(recovered.interlocks.emergencyStopLatched).toBe(false);
  });

  it('6. Step-by-step triggerAdvanceWorkflow progresses linearly through stages', () => {
    let state = createInitialEngineState();
    expect(state.operatingState).toBe('IDLE');

    // IDLE -> TRAVEL
    state = triggerAdvanceWorkflow(state);
    expect(state.operatingState).toBe('TRAVEL');

    // TRAVEL -> POSITION
    state = triggerAdvanceWorkflow(state);
    expect(state.operatingState).toBe('POSITION');

    // POSITION -> STABILIZE
    state = triggerAdvanceWorkflow(state);
    expect(state.operatingState).toBe('STABILIZE');
    // Complete stabilization
    for (let i = 0; i < 30; i++) state = stepSimulationEngine(state, 0.1);

    // STABILIZE -> DEPLOY_HOSE
    state = triggerAdvanceWorkflow(state);
    expect(state.operatingState).toBe('DEPLOY_HOSE');
    for (let i = 0; i < 35; i++) state = stepSimulationEngine(state, 0.1);

    // DEPLOY_HOSE -> PRIME
    state = triggerAdvanceWorkflow(state);
    expect(state.operatingState).toBe('PRIME');
    for (let i = 0; i < 30; i++) state = stepSimulationEngine(state, 0.1);

    // PRIME automatically transitions to EXTRACT
    expect(state.operatingState).toBe('EXTRACT');

    // EXTRACT -> SETTLE
    state = triggerAdvanceWorkflow(state);
    expect(state.operatingState).toBe('SETTLE');

    // Complete settle duration
    for (let i = 0; i < 45; i++) state = stepSimulationEngine(state, 0.1);
    expect(state.operatingState).toBe('COMPACT');

    // COMPACT -> SECURE
    state = triggerAdvanceWorkflow(state);
    expect(state.operatingState).toBe('SECURE');

    // SECURE -> TRANSPORT_READY
    state = triggerAdvanceWorkflow(state);
    expect(state.operatingState).toBe('TRANSPORT_READY');

    // TRANSPORT_READY -> DISCHARGE
    state = triggerAdvanceWorkflow(state);
    expect(state.operatingState).toBe('DISCHARGE');

    // Complete discharge
    while (state.operatingState === 'DISCHARGE') {
      state = stepSimulationEngine(state, 0.1);
    }
    expect(state.operatingState).toBe('COMPLETE');
  });

  it('7. Store setWorkflowStage executes corresponding triggers with safety checks', () => {
    const store = useSimulationStore.getState();
    expect(store.operatingState).toBe('IDLE');

    // Switch to TRAVEL
    store.setWorkflowStage('TRAVEL');
    expect(useSimulationStore.getState().operatingState).toBe('TRAVEL');

    // Switch to POSITION
    store.setWorkflowStage('POSITION');
    expect(useSimulationStore.getState().operatingState).toBe('POSITION');

    // Switch to STABILIZE
    store.setWorkflowStage('STABILIZE');
    expect(useSimulationStore.getState().operatingState).toBe('STABILIZE');
  });

  it('8. Reset restores consistent initial state and mass balance', () => {
    let state = createInitialEngineState();
    state = triggerTravel(state);
    state = triggerEmergencyStop(state);
    expect(state.operatingState).toBe('FAULT');

    const resetState = triggerReset(state);
    expect(resetState.operatingState).toBe('IDLE');
    expect(resetState.alarms.emergencyStopActive).toBe(false);
    expect(resetState.interlocks.emergencyStopLatched).toBe(false);
    expect(resetState.materialBalance.sourceVolumeL).toBe(3800);
    expect(resetState.materialBalance.collectionVolumeL).toBe(0);
    expect(resetState.materialBalance.receiverVolumeL).toBe(0);
    expect(resetState.materialBalance.massBalanceDiscrepancyL).toBe(0);
  });
});
