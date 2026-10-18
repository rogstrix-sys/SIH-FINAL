import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from '../../store/useSimulationStore';
import { calculateVelocity, calculateReynoldsNumber, solveFluidDynamics } from '../../utils/engineering';

describe('Engineering Assumptions & Verification Test Scenarios (SIH 26258)', () => {
  beforeEach(() => {
    const store = useSimulationStore.getState();
    store.stopGuidedDemo();
    store.resetSimulation();
  });

  it('1. Test Scenario 1: Complete operating sequence transitions and mass balance', () => {
    const store = useSimulationStore.getState();

    // Trigger Complete Cycle Scenario
    store.runCompleteCycleScenario();
    expect(useSimulationStore.getState().operatingState).toBe('DEPLOY');

    // Step across DEPLOY and PRIME duration into EXTRACT
    for (let i = 0; i < 35; i++) {
      useSimulationStore.getState().stepSimulation(0.2);
    }
    // Automated sequence reaches EXTRACT
    expect(useSimulationStore.getState().interlocks.isDeployed).toBe(true);
    expect(useSimulationStore.getState().interlocks.isPrimed).toBe(true);
    expect(useSimulationStore.getState().operatingState).toBe('EXTRACT');

    // Step through extraction
    for (let i = 0; i < 20; i++) {
      useSimulationStore.getState().stepSimulation(0.5);
    }
    const matBal = useSimulationStore.getState().materialBalance;
    expect(matBal.collectionVolumeL).toBeGreaterThan(0);
    expect(matBal.sourceVolumeL).toBeLessThan(matBal.totalInitialVolumeL);
    expect(Math.abs(matBal.massBalanceDiscrepancyL)).toBeLessThan(0.001);

    // Trigger Discharge
    store.triggerDischarge();
    expect(useSimulationStore.getState().operatingState).toBe('DISCHARGE');

    for (let i = 0; i < 20; i++) {
      useSimulationStore.getState().stepSimulation(0.5);
    }
    const matBalDischarge = useSimulationStore.getState().materialBalance;
    expect(matBalDischarge.receiverVolumeL).toBeGreaterThan(0);
    expect(Math.abs(matBalDischarge.massBalanceDiscrepancyL)).toBeLessThan(0.001);
  });

  it('2. Test Scenario 2: Overfill protection interlock trips at 100% capacity', () => {
    const store = useSimulationStore.getState();

    // Trigger Tank-Full Scenario (collection prefilled to 2390 L out of 2400 L)
    store.triggerTankFullScenario();
    const statePre = useSimulationStore.getState();

    expect(statePre.materialBalance.collectionVolumeL).toBeGreaterThanOrEqual(2390);
    expect(statePre.operatingState).toBe('EXTRACT');

    // Step simulation until 2400 L capacity is reached
    for (let i = 0; i < 15; i++) {
      useSimulationStore.getState().stepSimulation(0.2);
    }
    const statePost = useSimulationStore.getState();

    // Verification: Tank-full interlock is tripped
    expect(statePost.alarms.collectionTankFull).toBe(true);
    expect(statePost.interlocks.preventExtractTankFull).toBe(true);
    // Auto-transfers to DISCHARGE
    expect(statePost.operatingState).toBe('DISCHARGE');
    // Volume cannot exceed physical geometric limit
    expect(statePost.materialBalance.collectionVolumeL).toBeLessThanOrEqual(2400.001);
    // Mass conservation maintained strictly
    expect(Math.abs(statePost.materialBalance.massBalanceDiscrepancyL)).toBeLessThan(0.001);
  });

  it('3. Darcy-Weisbach head loss drops significantly with larger conduit diameter', () => {
    const flowM3H = 30.0;
    const lengthM = 35.0;
    const viscosityCp = 500;
    const densityKgM3 = 1180;
    const roughnessMm = 0.045;

    // Head loss with 75mm hose
    const dynamics75mm = solveFluidDynamics({
      flowM3H,
      hoseDiameterMm: 75,
      hoseLengthM: lengthM,
      pipeRoughnessMm: roughnessMm,
      slurryDensityKgM3: densityKgM3,
      slurryViscosityCp: viscosityCp,
      verticalLiftM: 2.5,
      pumpEfficiency: 0.72,
      motorEfficiency: 0.88,
      vacuumKpa: -60
    });

    // Head loss with 100mm hose
    const dynamics100mm = solveFluidDynamics({
      flowM3H,
      hoseDiameterMm: 100,
      hoseLengthM: lengthM,
      pipeRoughnessMm: roughnessMm,
      slurryDensityKgM3: densityKgM3,
      slurryViscosityCp: viscosityCp,
      verticalLiftM: 2.5,
      pumpEfficiency: 0.72,
      motorEfficiency: 0.88,
      vacuumKpa: -60
    });

    expect(dynamics75mm.frictionHeadLossM).toBeGreaterThan(dynamics100mm.frictionHeadLossM);
    // Head loss scales inversely with approximately D^4 to D^5
    expect(dynamics75mm.frictionHeadLossM / dynamics100mm.frictionHeadLossM).toBeGreaterThan(2.0);
  });

  it('4. Reynolds number correctly indicates laminar vs turbulent regimes', () => {
    const densityKgM3 = 1180;

    // High viscosity slurry (1200 cP) at 15 m3/h in 100mm hose
    const vLaminar = calculateVelocity(15.0, 100);
    const reLaminar = calculateReynoldsNumber(densityKgM3, vLaminar, 100, 1200);
    expect(reLaminar).toBeLessThan(2000);

    // Water-like low viscosity (1 cP) at 45 m3/h in 100mm hose
    const vTurbulent = calculateVelocity(45.0, 100);
    const reTurbulent = calculateReynoldsNumber(densityKgM3, vTurbulent, 100, 1);
    expect(reTurbulent).toBeGreaterThan(4000);
  });

  it('5. Terrain feasibility model correctly identifies slope inclination and warnings', () => {
    const store = useSimulationStore.getState();

    // Level Paved Scenario
    store.setTerrainScenario('level_paved');
    expect(useSimulationStore.getState().feasibility.stabilityStatus).toBe('nominal');
    expect(useSimulationStore.getState().feasibility.chassisPitchDeg).toBeLessThan(3.0);

    // Hilly Sloped Scenario (14° slope)
    store.setTerrainScenario('hilly_sloped');
    const hillyFeasibility = useSimulationStore.getState().feasibility;
    expect(hillyFeasibility.terrainSlopeDeg).toBe(14);
    expect(hillyFeasibility.chassisPitchDeg).toBeGreaterThan(5.0);
    expect(hillyFeasibility.effectiveSlurryViscosityCp).toBeGreaterThan(0);
  });
});
