import { describe, it, expect, beforeEach } from 'vitest';
import { generateTelemetryCsvString, generateEventsCsvString } from '../../utils/csvExport';
import { compareDesludgingTasks } from '../terrainFeasibilityModel';
import { useSimulationStore } from '../../store/useSimulationStore';
import { TelemetryPoint, EventLogItem } from '../../types/digitalTwin';

describe('Dashboard Telemetry & CSV Export Suite', () => {
  it('generates telemetry CSV with required headers, cumulative energy column, and fidelity tags', () => {
    const mockHistory: TelemetryPoint[] = [
      {
        time: '00:00',
        timestamp: 0.0,
        flowRate: 0.0,
        flowRateLpm: 0.0,
        vacuum: 0.0,
        power: 0.0,
        energyKwh: 0.0,
        motorLoadPct: 0.0,
        h2s: 0.0,
        ch4: 0.0,
        sludgeLevel: 1.8,
        sourceVolumeL: 3800,
        collectionVolumeL: 0,
        receiverVolumeL: 0,
        vibration: 0.0
      },
      {
        time: '01:30',
        timestamp: 90.0,
        flowRate: 28.5,
        flowRateLpm: 475.0,
        vacuum: 68.4,
        power: 11.2,
        energyKwh: 0.280,
        motorLoadPct: 74.7,
        h2s: 4.2,
        ch4: 0.6,
        sludgeLevel: 1.45,
        sourceVolumeL: 3087.5,
        collectionVolumeL: 712.5,
        receiverVolumeL: 0,
        vibration: 0.45
      }
    ];

    const csv = generateTelemetryCsvString(mockHistory);
    expect(csv).toBeDefined();

    const lines = csv.split('\r\n');
    expect(lines.length).toBe(3); // Header + 2 data rows

    const header = lines[0];
    expect(header).toContain('Simulation Time (s)');
    expect(header).toContain('Extraction Flow (L/min)');
    expect(header).toContain('Inlet Vacuum (kPa)');
    expect(header).toContain('Motor Power (kW)');
    expect(header).toContain('Cumulative Energy (kWh)');
    expect(header).toContain('Motor Load (%)');
    expect(header).toContain('Data Fidelity');

    const row1 = lines[2];
    expect(row1).toContain('90.00');
    expect(row1).toContain('475.0');
    expect(row1).toContain('68.4');
    expect(row1).toContain('11.20');
    expect(row1).toContain('0.280');
    expect(row1).toContain('"SIMULATED_ENGINE_TWIN"');
  });

  it('generates event log CSV with severity levels and escapes quotes in messages', () => {
    const mockEvents: EventLogItem[] = [
      {
        id: 'evt-1',
        timestamp: '12:00:00',
        timeSec: 0,
        level: 'info',
        source: 'INITIALIZATION',
        message: 'System powered on.'
      },
      {
        id: 'evt-2',
        timestamp: '12:01:30',
        timeSec: 90,
        level: 'warning',
        source: 'VACUUM_SENSOR',
        message: 'High vacuum reached: "Cavitation Risk" caution threshold.'
      }
    ];

    const csv = generateEventsCsvString(mockEvents);
    const lines = csv.split('\r\n');
    expect(lines.length).toBe(3);

    const header = lines[0];
    expect(header).toContain('Timestamp,Sim Time (s),Severity,Source,Message,Data Fidelity');

    const warningRow = lines[2];
    expect(warningRow).toContain('"WARNING"');
    expect(warningRow).toContain('"VACUUM_SENSOR"');
    expect(warningRow).toContain('""Cavitation Risk""');
    expect(warningRow).toContain('"SIMULATED_EVENT_STREAM"');
  });
});

describe('Scenario Comparison Engine Suite', () => {
  it('compares baseline paved vs alpine terrain with identical task volume and derives physical deltas', () => {
    const comparison = compareDesludgingTasks('level_paved', 'cold_high_altitude', {
      taskVolumeL: 2400,
      initialVaultVolumeL: 3800,
      pumpRpm: 2100,
      slurryDensityKgM3: 1180,
      baseViscosityCp: 450
    });

    expect(comparison.taskVolumeL).toBe(2400);
    expect(comparison.initialVaultVolumeL).toBe(3800);
    expect(comparison.sludgeDensityKgM3).toBe(1180);

    // Baseline checks (Level Paved)
    expect(comparison.baseline.scenarioId).toBe('level_paved');
    expect(comparison.baseline.feasibilityRating).toBe('FEASIBLE');
    expect(comparison.baseline.flowRateLpm).toBeGreaterThan(0);
    expect(comparison.baseline.extractionDurationSec).toBeGreaterThan(0);
    expect(comparison.baseline.estimatedEnergyKwh).toBeGreaterThan(0);

    // Comparison checks (Alpine cold high altitude)
    expect(comparison.comparison.scenarioId).toBe('cold_high_altitude');
    // Alpine has high altitude and subzero temperature, causing viscosity increase and slower flow
    expect(comparison.comparison.effectiveViscosityCp).toBeGreaterThan(comparison.baseline.effectiveViscosityCp);
    expect(comparison.comparison.extractionDurationSec).toBeGreaterThan(comparison.baseline.extractionDurationSec);
    expect(comparison.comparison.estimatedEnergyKwh).toBeGreaterThan(comparison.baseline.estimatedEnergyKwh);

    // Delta checks
    expect(comparison.deltaDurationSec).toBeGreaterThan(0);
    expect(comparison.deltaEnergyKwh).toBeGreaterThan(0);
    expect(comparison.deltaEnergyPct).toBeGreaterThan(0);
    expect(comparison.deltaDurationFormatted).toMatch(/^\+\d+m \d{2}s$/);
    expect(comparison.documentedAssumptions.length).toBeGreaterThan(0);
  });

  it('compares baseline paved vs narrow alley scenario detecting clearance and setback constraints', () => {
    const comparison = compareDesludgingTasks('level_paved', 'narrow_restricted');

    expect(comparison.baseline.clearanceConflict).toBe(false);
    expect(comparison.comparison.lateralClearanceMarginM).toBeLessThan(comparison.baseline.lateralClearanceMarginM);
    // Narrow restricted has 1.6m corridor width vs 2.1m machine track, causing clearance warning
    expect(comparison.comparison.warnings.length).toBeGreaterThan(0);
  });
});

describe('Simulation Store Interlocks and State Invariants Suite', () => {
  beforeEach(() => {
    useSimulationStore.getState().resetSimulation();
  });

  it('starts in IDLE state with 0 volume extracted', () => {
    const state = useSimulationStore.getState();
    expect(state.operatingState).toBe('IDLE');
    expect(state.materialBalance.collectionVolumeL).toBe(0);
    expect(state.materialBalance.sourceVolumeL).toBe(3800);
    expect(state.telemetry.extractionRateM3H).toBe(0);
  });

  it('blocks extraction if machine is not deployed and primed', () => {
    const store = useSimulationStore.getState();
    // Try triggering extract directly without deploy or prime
    store.triggerExtract();
    const updated = useSimulationStore.getState();
    expect(updated.operatingState).toBe('IDLE'); // Blocked: remains in IDLE, cannot extract
    expect(updated.engine.events[0].level).toBe('critical');
    expect(updated.engine.events[0].source).toBe('INTERLOCK_BLOCK');
  });

  it('pauses simulation freezing material balance updates', () => {
    const store = useSimulationStore.getState();
    store.startSimulation();
    expect(useSimulationStore.getState().status).toBe('running');

    store.pauseSimulation();
    expect(useSimulationStore.getState().status).toBe('paused');

    const sourceBefore = useSimulationStore.getState().materialBalance.sourceVolumeL;
    // Tick while paused
    useSimulationStore.getState().tickSimulation(1.0);
    const sourceAfter = useSimulationStore.getState().materialBalance.sourceVolumeL;

    expect(sourceAfter).toBe(sourceBefore);
  });

  it('triggers emergency stop, latches interlock, and halts immediately', () => {
    const store = useSimulationStore.getState();
    store.startSimulation();
    store.triggerEmergencyStop();

    const state = useSimulationStore.getState();
    expect(state.operatingState).toBe('FAULT');
    expect(state.status).toBe('alarm');
    expect(state.alarms.emergencyStopActive).toBe(true);
    expect(state.interlocks.emergencyStopLatched).toBe(true);

    // Further operation blocked while E-STOP latched
    store.startSimulation();
    expect(useSimulationStore.getState().operatingState).toBe('FAULT');

    // Operator clear fault
    store.triggerResolveFault();
    expect(useSimulationStore.getState().operatingState).toBe('IDLE');
    expect(useSimulationStore.getState().alarms.emergencyStopActive).toBe(false);
  });

  it('resets machine restoring mass balance and clearing telemetry history', () => {
    const store = useSimulationStore.getState();
    store.startSimulation();
    store.tickSimulation(5.0);

    store.resetSimulation();
    const state = useSimulationStore.getState();
    expect(state.operatingState).toBe('IDLE');
    expect(state.status).toBe('idle');
    expect(state.materialBalance.collectionVolumeL).toBe(0);
    expect(state.materialBalance.sourceVolumeL).toBe(3800);
    expect(state.telemetryHistory.length).toBe(1);
    expect(state.telemetryHistory[0].collectionVolumeL).toBe(0);
  });
});
