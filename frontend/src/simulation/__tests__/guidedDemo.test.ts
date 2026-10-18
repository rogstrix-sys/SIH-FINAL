import { describe, it, expect, beforeEach } from 'vitest';
import { DEMO_STAGES } from '../guidedDemoData';
import { DemoStageId } from '../../types/digitalTwin';
import { useSimulationStore } from '../../store/useSimulationStore';

describe('12-Stage Guided Demonstration Tour Suite (SIH 26258)', () => {
  beforeEach(() => {
    const store = useSimulationStore.getState();
    store.stopGuidedDemo();
    store.resetSimulation();
  });

  const EXPECTED_STAGE_IDS: DemoStageId[] = [
    'project_objective',
    'component_inspection',
    'scenario_selection',
    'feasibility_assessment',
    'deployment_positioning',
    'priming_extraction',
    'live_dashboard',
    'alarm_estop_demo',
    'discharge_mass_balance',
    'scenario_comparison',
    'hardware_bom_test_plan',
    'report_export'
  ];

  it('contains exactly 12 required sequential stages in precise engineering order', () => {
    expect(DEMO_STAGES).toHaveLength(12);

    DEMO_STAGES.forEach((stage, idx) => {
      expect(stage.stepNumber).toBe(idx + 1);
      expect(stage.id).toBe(EXPECTED_STAGE_IDS[idx]);
      expect(stage.title).toBeTruthy();
      expect(stage.subtitle).toBeTruthy();
      expect(stage.overview).toBeTruthy();
      expect(stage.engineeringContext).toBeTruthy();
      expect(stage.durationSec).toBeGreaterThan(0);
      expect(stage.keyMetrics.length).toBeGreaterThanOrEqual(2);
      expect(stage.sensors.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('correctly maps target views and camera presets across all 12 stages', () => {
    const stageMap = new Map(DEMO_STAGES.map((s) => [s.id, s]));

    // Stage 1 & 2: Overview & 3D component inspection
    expect(stageMap.get('project_objective')?.activeViewTarget).toBe('overview');
    expect(stageMap.get('component_inspection')?.activeViewTarget).toBe('simulation3d');
    expect(stageMap.get('component_inspection')?.selectedComponent).toBe('pump');

    // Stage 3 & 4: Hilly terrain scenario and feasibility model
    expect(stageMap.get('scenario_selection')?.scenarioTarget).toBe('hilly_sloped');
    expect(stageMap.get('scenario_selection')?.activeViewTarget).toBe('terrain');
    expect(stageMap.get('feasibility_assessment')?.activeViewTarget).toBe('terrain');

    // Stage 5 & 6: Deployment and Priming/Extraction
    expect(stageMap.get('deployment_positioning')?.operatingStateTarget).toBe('DEPLOY');
    expect(stageMap.get('priming_extraction')?.operatingStateTarget).toBe('EXTRACT');

    // Stage 8: Alarm and Emergency Stop Demonstration
    expect(stageMap.get('alarm_estop_demo')?.operatingStateTarget).toBe('FAULT');

    // Stage 9: Discharge & Mass Balance
    expect(stageMap.get('discharge_mass_balance')?.operatingStateTarget).toBe('DISCHARGE');

    // Stage 10: Scenario Comparison Analytics
    expect(stageMap.get('scenario_comparison')?.activeViewTarget).toBe('analysis');

    // Stage 11: Hardware BOM & Physical Test Plan
    expect(stageMap.get('hardware_bom_test_plan')?.activeViewTarget).toBe('prototype');

    // Stage 12: Performance Report Export
    expect(stageMap.get('report_export')?.activeViewTarget).toBe('reports');
  });

  it('initializes, toggles auto-advance, and exits guided demo tour via store controls', () => {
    const store = useSimulationStore.getState();

    expect(store.guidedDemo.isActive).toBe(false);

    // Start Demo
    store.startGuidedDemo();
    const afterStart = useSimulationStore.getState();
    expect(afterStart.guidedDemo.isActive).toBe(true);
    expect(afterStart.guidedDemo.currentStageIndex).toBe(0);
    expect(afterStart.guidedDemo.isAutoAdvancing).toBe(true);

    // Toggle Auto Advance (Pause auto timer)
    store.toggleDemoAutoAdvance();
    expect(useSimulationStore.getState().guidedDemo.isAutoAdvancing).toBe(false);

    // Toggle back
    store.toggleDemoAutoAdvance();
    expect(useSimulationStore.getState().guidedDemo.isAutoAdvancing).toBe(true);

    // Stop Demo
    store.stopGuidedDemo();
    expect(useSimulationStore.getState().guidedDemo.isActive).toBe(false);
  });

  it('steps sequentially forward through all 12 stages without skipping', () => {
    const store = useSimulationStore.getState();
    store.startGuidedDemo();

    for (let i = 0; i < 11; i++) {
      expect(useSimulationStore.getState().guidedDemo.currentStageIndex).toBe(i);
      store.nextDemoStage();
    }

    // At stage 11 (the 12th stage), calling nextDemoStage completes/stops the tour
    expect(useSimulationStore.getState().guidedDemo.currentStageIndex).toBe(11);
    store.nextDemoStage();
    expect(useSimulationStore.getState().guidedDemo.isActive).toBe(false);
  });

  it('steps sequentially backward without dropping below index 0', () => {
    const store = useSimulationStore.getState();
    store.startGuidedDemo();

    // Advance to stage index 5
    for (let i = 0; i < 5; i++) {
      store.nextDemoStage();
    }
    expect(useSimulationStore.getState().guidedDemo.currentStageIndex).toBe(5);

    // Step back to 0
    for (let i = 5; i > 0; i--) {
      store.prevDemoStage();
    }
    expect(useSimulationStore.getState().guidedDemo.currentStageIndex).toBe(0);

    // Cannot step below 0
    store.prevDemoStage();
    expect(useSimulationStore.getState().guidedDemo.currentStageIndex).toBe(0);
  });

  it('enforces physical state machine and interlocks when setting demo stages', () => {
    const store = useSimulationStore.getState();
    store.startGuidedDemo();

    // Stage Index 2 (scenario_selection): updates terrain scenario to hilly_sloped and active view to terrain
    store.setDemoStage(2);
    expect(useSimulationStore.getState().selectedScenario).toBe('hilly_sloped');
    expect(useSimulationStore.getState().activeView).toBe('terrain');

    // Stage Index 4 (deployment_positioning): deploys stabilizer legs
    store.setDemoStage(4);
    expect(useSimulationStore.getState().operatingState).toBe('DEPLOY');
    // Step simulation across 3.5s deployment duration
    for (let i = 0; i < 25; i++) {
      useSimulationStore.getState().stepSimulation(0.2);
    }
    expect(useSimulationStore.getState().interlocks.isDeployed).toBe(true);

    // Stage Index 5 (priming_extraction): initiates pump priming
    store.setDemoStage(5);
    expect(useSimulationStore.getState().operatingState).toBe('PRIME');

    // Stage Index 7 (alarm_estop_demo): demonstrates emergency stop fault latch
    store.setDemoStage(7);
    expect(useSimulationStore.getState().operatingState).toBe('FAULT');
    expect(useSimulationStore.getState().interlocks.emergencyStopLatched).toBe(true);

    // Stage Index 8 (discharge_mass_balance): clears fault latch and initiates discharge
    store.setDemoStage(8);
    expect(useSimulationStore.getState().interlocks.emergencyStopLatched).toBe(false);
    expect(useSimulationStore.getState().operatingState).toBe('DISCHARGE');

    // Stage Index 9 (scenario_comparison): switches view to analysis
    store.setDemoStage(9);
    expect(useSimulationStore.getState().activeView).toBe('analysis');

    // Stage Index 10 (hardware_bom_test_plan): switches view to prototype
    store.setDemoStage(10);
    expect(useSimulationStore.getState().activeView).toBe('prototype');

    // Stage Index 11 (report_export): switches view to reports
    store.setDemoStage(11);
    expect(useSimulationStore.getState().activeView).toBe('reports');
  });

  it('preserves material balance invariance throughout demo operations', () => {
    const store = useSimulationStore.getState();
    store.startGuidedDemo();

    store.setDemoStage(4); // deployment
    store.setDemoStage(5); // priming

    // Step simulation
    for (let i = 0; i < 5; i++) {
      useSimulationStore.getState().stepSimulation(1.0);
    }

    const matBal = useSimulationStore.getState().materialBalance;
    expect(Math.abs(matBal.massBalanceDiscrepancyL)).toBeLessThan(0.001);
  });
});
