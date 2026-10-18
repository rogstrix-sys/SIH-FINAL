import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_BOM_ITEMS,
  DEFAULT_MACHINE_CONFIG,
  DEFAULT_SENSOR_PLAN,
  DEFAULT_PHYSICAL_TEST_PLAN,
  calculatePrototypeBudget,
  BomCategory
} from '../../types/prototypePlanning';
import {
  generateBomCsvString,
  generateSensorPlanCsvString,
  generateTestPlanCsvString
} from '../../utils/csvExport';
import { useSimulationStore } from '../../store/useSimulationStore';

describe('Hardware Prototype Planning — Bill of Materials (BOM) Suite', () => {
  it('covers all 11 required mechanical and electrical categories', () => {
    const requiredCategories: BomCategory[] = [
      'Chassis',
      'Mobility',
      'Pump',
      'Motor',
      'Hose',
      'Reel',
      'Tank',
      'Plumbing',
      'Electrical Controls',
      'Instrumentation',
      'Safety Equipment'
    ];

    const presentCategories = new Set(DEFAULT_BOM_ITEMS.map((item) => item.category));
    for (const cat of requiredCategories) {
      expect(presentCategories.has(cat)).toBe(true);
    }
  });

  it('contains valid quantities, positive prices, and realistic subtotals', () => {
    expect(DEFAULT_BOM_ITEMS.length).toBeGreaterThanOrEqual(15);

    for (const item of DEFAULT_BOM_ITEMS) {
      expect(item.qty).toBeGreaterThan(0);
      expect(item.unitPriceInr).toBeGreaterThan(0);
      expect(item.subtotalInr).toBe(item.qty * item.unitPriceInr);
      expect(item.function.length).toBeGreaterThan(10);
      expect(item.proposedSpec.length).toBeGreaterThan(10);
      expect(item.compatibilityNotes.length).toBeGreaterThan(5);
    }
  });

  it('calculates prototype budget separating direct costs, labour, test cell, logistics, and 15% contingency', () => {
    const budget = calculatePrototypeBudget(DEFAULT_BOM_ITEMS);

    expect(budget.hardwareDirectCostInr).toBeGreaterThan(500000);
    expect(budget.fabricationLabourInr).toBe(120000);
    expect(budget.sensorInstrumentationInr).toBe(45000);
    expect(budget.labBenchTestingInr).toBe(65000);
    expect(budget.logisticsTransportInr).toBe(35000);

    const subtotal =
      budget.hardwareDirectCostInr +
      budget.fabricationLabourInr +
      budget.sensorInstrumentationInr +
      budget.labBenchTestingInr +
      budget.logisticsTransportInr;

    expect(budget.contingencyInr).toBe(Math.round(subtotal * 0.15));
    expect(budget.totalPrototypeBudgetInr).toBe(subtotal + budget.contingencyInr);
  });
});

describe('Hardware Prototype Planning — Machine Configuration & Propagation Suite', () => {
  beforeEach(() => {
    useSimulationStore.getState().resetSimulation();
  });

  it('validates default preliminary dimensions and GVW mass balance', () => {
    const config = DEFAULT_MACHINE_CONFIG;

    expect(config.overallLengthM).toBe(3.85);
    expect(config.overallWidthM).toBeLessThanOrEqual(1.60); // Must fit inside 1.6m pedestrian alley
    expect(config.trackWidthM).toBe(1.35);
    expect(config.groundClearanceMm).toBeGreaterThanOrEqual(200);

    const sludgeMass = Math.round(config.collectionTankCapacityL * 1.18);
    const calculatedGvw = config.chassisTareMassKg + config.equipmentPayloadMassKg + sludgeMass;
    expect(calculatedGvw).toBe(config.grossVehicleWeightKg);
  });

  it('propagates hardware prototype dimensions into active simulation engine', () => {
    const store = useSimulationStore.getState();

    // Custom prototype sizing
    const customTankCapacity = 2600;
    const customHoseLength = 45;
    const customHoseDia = 100;
    const customPumpFlow = 550;
    const customPumpRpm = 2200;

    store.updateEngineParameter('collectionTankCapacityL', customTankCapacity);
    store.updateEngineParameter('pumpRatedFlowLpm', customPumpFlow);
    store.updateParameter('hoseLengthM', customHoseLength);
    store.updateParameter('hoseDiameterMm', customHoseDia);
    store.updateParameter('pumpRpm', customPumpRpm);

    const updated = useSimulationStore.getState();
    expect(updated.engine.parameters.collectionTankCapacityL).toBe(customTankCapacity);
    expect(updated.engine.parameters.pumpRatedFlowLpm).toBe(customPumpFlow);
    expect(updated.parameters.hoseLengthM).toBe(customHoseLength);
    expect(updated.parameters.hoseDiameterMm).toBe(customHoseDia);
    expect(updated.parameters.pumpRpm).toBe(customPumpRpm);
  });
});

describe('Hardware Prototype Planning — Candidate Sensor Instrumentation Suite', () => {
  it('covers all critical process parameters without claiming physical validation', () => {
    const requiredMeasurements = [
      'flow',
      'level',
      'vacuum',
      'current',
      'tilt',
      'temperature',
      'gas',
      'vibration'
    ];

    expect(DEFAULT_SENSOR_PLAN.length).toBe(8);

    for (const sensor of DEFAULT_SENSOR_PLAN) {
      expect(sensor.id).toMatch(/^SEN-\d{2}$/);
      expect(sensor.candidateSensorType.length).toBeGreaterThan(5);
      expect(sensor.measurementRange.length).toBeGreaterThan(3);
      expect(sensor.interfaceSignal.length).toBeGreaterThan(3);
      expect(sensor.installationLocation.length).toBeGreaterThan(5);
      expect(sensor.calibrationRequirement.length).toBeGreaterThan(10);
      expect(sensor.status).toBe('PROPOSED_CANDIDATE');
    }

    const sensorText = DEFAULT_SENSOR_PLAN.map((s) => s.measurement.toLowerCase()).join(' ');
    for (const keyword of requiredMeasurements) {
      expect(sensorText).toContain(keyword);
    }
  });
});

describe('Hardware Prototype Planning — Physical Acceptance Test Plan Suite', () => {
  it('defines 8 required pre-commissioning test procedures with explicit acceptance criteria', () => {
    expect(DEFAULT_PHYSICAL_TEST_PLAN.length).toBe(8);

    const requiredTests = [
      'priming',
      'flow rate',
      'tank',
      'power',
      'hose routing',
      'access-width',
      'slope',
      'emergency stop'
    ];

    const testNamesLower = DEFAULT_PHYSICAL_TEST_PLAN.map((t) => t.name.toLowerCase()).join(' ');
    for (const req of requiredTests) {
      expect(testNamesLower).toContain(req);
    }

    for (const test of DEFAULT_PHYSICAL_TEST_PLAN) {
      expect(test.id).toMatch(/^TEST-\d{2}$/);
      expect(test.procedureSteps.length).toBeGreaterThanOrEqual(3);
      expect(test.acceptanceCriteria.length).toBeGreaterThan(15);
      expect(test.acceptanceLimit.length).toBeGreaterThan(5);
      expect(test.verificationMethod.length).toBeGreaterThan(5);
      expect(test.status).toBe('PROCEDURE_READY'); // Truth in engineering: not marked passed without hardware
    }
  });
});

describe('Hardware Prototype Planning — CSV Export Generation Suite', () => {
  it('generates BOM CSV with itemized lines and budgetary estimate headers', () => {
    const csv = generateBomCsvString(DEFAULT_BOM_ITEMS);
    expect(csv).toBeDefined();

    const lines = csv.split('\r\n');
    expect(lines.length).toBe(DEFAULT_BOM_ITEMS.length + 1);

    const header = lines[0];
    expect(header).toContain('Item ID,Category,Component Name,Quantity,Function,Proposed Specification,Unit Price (INR),Subtotal (INR),Compatibility Notes,Verification Status,Cost Status');

    const firstRow = lines[1];
    expect(firstRow).toContain('"BOM-01"');
    expect(firstRow).toContain('"Chassis"');
    expect(firstRow).toContain('"BUDGETARY_ESTIMATE"');
  });

  it('generates Candidate Sensor Plan CSV with calibration requirements and candidate transducer tag', () => {
    const csv = generateSensorPlanCsvString(DEFAULT_SENSOR_PLAN);
    expect(csv).toBeDefined();

    const lines = csv.split('\r\n');
    expect(lines.length).toBe(DEFAULT_SENSOR_PLAN.length + 1);

    const header = lines[0];
    expect(header).toContain('Sensor ID,Measurement,Candidate Sensor Type,Measurement Range,Interface Signal,Installation Location,Purpose,Calibration / Validation Requirement,Status,Data Fidelity');

    const firstRow = lines[1];
    expect(firstRow).toContain('"SEN-01"');
    expect(firstRow).toContain('"PROPOSED_CANDIDATE_TRANSDUCER"');
  });

  it('generates Physical Test Plan CSV with procedure acceptance limits', () => {
    const csv = generateTestPlanCsvString(DEFAULT_PHYSICAL_TEST_PLAN);
    expect(csv).toBeDefined();

    const lines = csv.split('\r\n');
    expect(lines.length).toBe(DEFAULT_PHYSICAL_TEST_PLAN.length + 1);

    const header = lines[0];
    expect(header).toContain('Test ID,Procedure Name,Category,Purpose,Acceptance Criteria,Acceptance Limit,Verification Method,Status,Preliminary Notes,Data Fidelity');

    const firstRow = lines[1];
    expect(firstRow).toContain('"TEST-01"');
    expect(firstRow).toContain('"PHYSICAL_TEST_CRITERIA_PENDING_BENCH_EXECUTION"');
  });
});
