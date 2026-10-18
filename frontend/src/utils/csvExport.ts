/**
 * Utility for exporting simulated telemetry and event logs to CSV format.
 * Strictly distinguishes simulated computational output from future physical field sensors.
 */

import { TelemetryPoint, EventLogItem } from '../types/digitalTwin';
import { BomItem, ProposedSensorItem, PhysicalTestProcedure } from '../types/prototypePlanning';

export function generateTelemetryCsvString(history: TelemetryPoint[]): string {
  const headers = [
    'Simulation Time (s)',
    'Clock (MM:SS)',
    'Extraction Flow (L/min)',
    'Extraction Flow (m3/h)',
    'Inlet Vacuum (kPa)',
    'Motor Power (kW)',
    'Cumulative Energy (kWh)',
    'Motor Load (%)',
    'Source Volume (L)',
    'Collection Volume (L)',
    'Receiver Volume (L)',
    'Sludge Depth (m)',
    'Atmosphere H2S (ppm)',
    'Combustible CH4 (%)',
    'Vibration RMS (mm/s)',
    'Data Fidelity'
  ];

  const rows = history.map((pt) => [
    pt.timestamp.toFixed(2),
    pt.time,
    pt.flowRateLpm?.toFixed(1) ?? (pt.flowRate * (1000 / 60)).toFixed(1),
    pt.flowRate.toFixed(2),
    pt.vacuum.toFixed(1),
    pt.power.toFixed(2),
    (pt.energyKwh ?? 0).toFixed(3),
    pt.motorLoadPct?.toFixed(1) ?? ((pt.power / 15.0) * 100).toFixed(1),
    pt.sourceVolumeL ?? 0,
    pt.collectionVolumeL ?? 0,
    pt.receiverVolumeL ?? 0,
    pt.sludgeLevel.toFixed(2),
    pt.h2s.toFixed(1),
    pt.ch4.toFixed(2),
    pt.vibration.toFixed(2),
    '"SIMULATED_ENGINE_TWIN"'
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function generateEventsCsvString(events: EventLogItem[]): string {
  const headers = ['Timestamp', 'Sim Time (s)', 'Severity', 'Source', 'Message', 'Data Fidelity'];
  const rows = events.map((e) => [
    `"${e.timestamp}"`,
    e.timeSec,
    `"${e.level.toUpperCase()}"`,
    `"${e.source}"`,
    `"${e.message.replace(/"/g, '""')}"`,
    '"SIMULATED_EVENT_STREAM"'
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function downloadTelemetryCsv(history: TelemetryPoint[], filename = 'desludge_telemetry.csv'): void {
  const csvContent = generateTelemetryCsvString(history);
  triggerBrowserDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function downloadEventsCsv(events: EventLogItem[], filename = 'desludge_events.csv'): void {
  const csvContent = generateEventsCsvString(events);
  triggerBrowserDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

function triggerBrowserDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateBomCsvString(items: BomItem[]): string {
  const headers = [
    'Item ID',
    'Category',
    'Component Name',
    'Quantity',
    'Function',
    'Proposed Specification',
    'Unit Price (INR)',
    'Subtotal (INR)',
    'Compatibility Notes',
    'Verification Status',
    'Cost Status'
  ];
  const rows = items.map((item) => [
    `"${item.id}"`,
    `"${item.category}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    item.qty,
    `"${item.function.replace(/"/g, '""')}"`,
    `"${item.proposedSpec.replace(/"/g, '""')}"`,
    item.unitPriceInr,
    item.subtotalInr,
    `"${item.compatibilityNotes.replace(/"/g, '""')}"`,
    `"${item.verificationStatus}"`,
    '"BUDGETARY_ESTIMATE"'
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function generateSensorPlanCsvString(sensors: ProposedSensorItem[]): string {
  const headers = [
    'Sensor ID',
    'Measurement',
    'Candidate Sensor Type',
    'Measurement Range',
    'Interface Signal',
    'Installation Location',
    'Purpose',
    'Calibration / Validation Requirement',
    'Status',
    'Data Fidelity'
  ];
  const rows = sensors.map((s) => [
    `"${s.id}"`,
    `"${s.measurement.replace(/"/g, '""')}"`,
    `"${s.candidateSensorType.replace(/"/g, '""')}"`,
    `"${s.measurementRange.replace(/"/g, '""')}"`,
    `"${s.interfaceSignal.replace(/"/g, '""')}"`,
    `"${s.installationLocation.replace(/"/g, '""')}"`,
    `"${s.purpose.replace(/"/g, '""')}"`,
    `"${s.calibrationRequirement.replace(/"/g, '""')}"`,
    `"${s.status}"`,
    '"PROPOSED_CANDIDATE_TRANSDUCER"'
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function generateTestPlanCsvString(tests: PhysicalTestProcedure[]): string {
  const headers = [
    'Test ID',
    'Procedure Name',
    'Category',
    'Purpose',
    'Acceptance Criteria',
    'Acceptance Limit',
    'Verification Method',
    'Status',
    'Preliminary Notes',
    'Data Fidelity'
  ];
  const rows = tests.map((t) => [
    `"${t.id}"`,
    `"${t.name.replace(/"/g, '""')}"`,
    `"${t.category.replace(/"/g, '""')}"`,
    `"${t.purpose.replace(/"/g, '""')}"`,
    `"${t.acceptanceCriteria.replace(/"/g, '""')}"`,
    `"${t.acceptanceLimit.replace(/"/g, '""')}"`,
    `"${t.verificationMethod.replace(/"/g, '""')}"`,
    `"${t.status}"`,
    `"${t.preliminaryNotes.replace(/"/g, '""')}"`,
    '"PHYSICAL_TEST_CRITERIA_PENDING_BENCH_EXECUTION"'
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function downloadBomCsv(items: BomItem[], filename = 'desludge_prototype_bom.csv'): void {
  const csvContent = generateBomCsvString(items);
  triggerBrowserDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function downloadSensorPlanCsv(sensors: ProposedSensorItem[], filename = 'desludge_sensor_plan.csv'): void {
  const csvContent = generateSensorPlanCsvString(sensors);
  triggerBrowserDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function downloadTestPlanCsv(tests: PhysicalTestProcedure[], filename = 'desludge_physical_test_plan.csv'): void {
  const csvContent = generateTestPlanCsvString(tests);
  triggerBrowserDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}
