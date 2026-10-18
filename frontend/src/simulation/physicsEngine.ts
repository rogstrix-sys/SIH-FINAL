/**
 * Pure physics and math calculation engine for Desludge Digital Twin.
 * Completely decoupled from Three.js rendering loops.
 */

import { SimulationParameters, TelemetryState, EventLogItem } from '../types/digitalTwin';
import { solveFluidDynamics } from '../utils/engineering';

export interface SimulationStepResult {
  nextTelemetry: TelemetryState;
  newEvents: EventLogItem[];
  isCompleted: boolean;
  hasAlarm: boolean;
}

export function createInitialTelemetry(params: SimulationParameters): TelemetryState {
  return {
    elapsedTimeSeconds: 0,
    volumeExtractedLiters: 0,
    volumeRemainingLiters: params.containmentVolumeLiters,
    sludgeLevelM: params.initialSludgeDepthM,
    extractionRateM3H: 0,
    suctionPressureKpa: 0,
    dischargePressureBar: 0.1,
    cavitationIndex: 0.05,
    motorPowerKw: 0,
    motorCurrentAmps: 0,
    slurryTemperatureC: Math.max(10, params.ambientTempC + 2.0),
    h2sConcentrationPpm: 2.1,
    ch4ConcentrationPct: 0.15,
    coConcentrationPpm: 1.2,
    vibrationRmsMmS: 0.2,
    reynoldsNumber: 0,
    headLossM: 0,
    systemEfficiencyPct: 82.5,
    estimatedCompletionMinutes: 0
  };
}

/**
 * Step the simulation by deltaSeconds using deterministic physical equations.
 */
export function stepPhysicsSimulation(
  params: SimulationParameters,
  current: TelemetryState,
  deltaSeconds: number
): SimulationStepResult {
  const newEvents: EventLogItem[] = [];
  let isCompleted = false;
  let hasAlarm = false;

  const dt = Math.max(0.001, Math.min(0.2, deltaSeconds));
  const newElapsed = current.elapsedTimeSeconds + dt;

  // 1. Water jetting viscosity reduction effect
  let effectiveViscosityCp = params.slurryViscosityCp;
  if (params.waterJetEnabled && params.waterJetPressureBar > 20) {
    // High-pressure hydro-jetting shears non-Newtonian bonds
    const shearReductionFactor = Math.min(0.65, (params.waterJetPressureBar / 250) * 0.6);
    effectiveViscosityCp = params.slurryViscosityCp * (1.0 - shearReductionFactor);
  }

  // 2. Mechanical Cutter Agitation effect
  let agitationBonus = 1.0;
  if (params.cutterHeadEnabled && params.cutterHeadSpeedRpm > 50) {
    agitationBonus = 1.0 + Math.min(0.25, params.cutterHeadSpeedRpm / 1200);
  }

  // 3. Volumetric Flow Rate Calculation
  // Positive-displacement lobe vacuum extraction pump model
  // Max displacement ~ 36 m3/h at 3000 RPM nominal
  const rpmRatio = params.pumpRpm / 3000.0;
  const hoseDiameterRatio = Math.pow(params.hoseDiameterMm / 100.0, 1.8);
  const viscosityPenalty = Math.max(0.25, 1.0 - (effectiveViscosityCp / 5000.0));
  
  // Theoretical displacement flow rate
  const maxRatedM3H = 36.0 * hoseDiameterRatio;
  let targetFlowM3H = maxRatedM3H * rpmRatio * viscosityPenalty * agitationBonus;

  // If no remaining sludge, pump pulls air
  if (current.volumeRemainingLiters <= 5) {
    targetFlowM3H = 0;
  }

  // First-order lag response for pump acceleration
  const flowFilter = 1.0 - Math.exp(-dt / 0.8);
  const extractionRateM3H = current.extractionRateM3H + (targetFlowM3H - current.extractionRateM3H) * flowFilter;

  // 4. Volume Depletion
  const extractedDeltaL = (extractionRateM3H / 3600.0) * dt * 1000.0;
  const newVolumeExtracted = Math.min(params.containmentVolumeLiters, current.volumeExtractedLiters + extractedDeltaL);
  const newVolumeRemaining = Math.max(0, params.containmentVolumeLiters - newVolumeExtracted);

  // Depth in vault proportional to remaining volume
  const volumeFraction = newVolumeRemaining / Math.max(1, params.containmentVolumeLiters);
  const newSludgeLevel = params.initialSludgeDepthM * volumeFraction;

  // 5. Suction Vacuum Dynamics
  // Vacuum pulls down towards targetVacuumKpa when running with sludge
  const targetVacuum = params.pumpRpm > 100 && newVolumeRemaining > 5
    ? params.targetVacuumKpa * Math.min(1.0, params.pumpRpm / 1800.0)
    : -2.0; // Ambient residual
  
  const vacuumFilter = 1.0 - Math.exp(-dt / 1.1);
  const suctionPressureKpa = current.suctionPressureKpa + (targetVacuum - current.suctionPressureKpa) * vacuumFilter;

  // 6. Fluid Dynamics Solution (Head loss, Reynolds, Cavitation)
  const verticalLiftM = Math.max(1.0, 3.5 - newSludgeLevel);
  const fluidOutput = solveFluidDynamics({
    flowM3H: extractionRateM3H,
    hoseDiameterMm: params.hoseDiameterMm,
    hoseLengthM: params.hoseLengthM,
    pipeRoughnessMm: params.pipeRoughnessMm,
    slurryDensityKgM3: params.slurryDensityKgM3,
    slurryViscosityCp: effectiveViscosityCp,
    verticalLiftM,
    pumpEfficiency: 0.74,
    motorEfficiency: 0.89,
    vacuumKpa: suctionPressureKpa
  });

  // 7. Motor Power and Current
  const idlePowerKw = params.pumpRpm > 50 ? 1.2 * (params.pumpRpm / 3000.0) : 0;
  const motorPowerKw = extractionRateM3H > 0.1 ? fluidOutput.motorPowerKw + idlePowerKw : idlePowerKw;
  // 400V 3-phase: I = P / (sqrt(3) * V * PF * eff)
  const motorCurrentAmps = motorPowerKw > 0.05
    ? (motorPowerKw * 1000.0) / (1.732 * 400 * 0.85 * 0.90)
    : 0;

  // 8. Gas Release & Hazardous Atmosphere Model
  // Disturbance from cutter head + jetting + extraction agitation releases entrapped H2S & CH4
  const agitationIntensity = (params.cutterHeadEnabled ? params.cutterHeadSpeedRpm / 300 : 0) +
    (params.waterJetEnabled ? params.waterJetPressureBar / 100 : 0) +
    (extractionRateM3H / 15.0);

  // Dissipation rate constant
  const gasDecay = Math.exp(-dt / 25.0);
  const targetH2s = 2.0 + agitationIntensity * 4.8;
  const newH2s = Math.max(0, current.h2sConcentrationPpm * gasDecay + targetH2s * (1 - gasDecay));

  const targetCh4 = 0.15 + agitationIntensity * 0.45;
  const newCh4 = Math.max(0, current.ch4ConcentrationPct * gasDecay + targetCh4 * (1 - gasDecay));

  const targetCo = 1.0 + (params.pumpRpm / 3000) * 1.8;
  const newCo = Math.max(0, current.coConcentrationPpm * gasDecay + targetCo * (1 - gasDecay));

  // 9. Vibration Dynamics (ISO 10816 standards)
  const baseVib = (params.pumpRpm / 3000.0) * 1.8;
  const cavVib = fluidOutput.cavitationRisk * 4.2;
  const cutterVib = params.cutterHeadEnabled ? (params.cutterHeadSpeedRpm / 600) * 1.4 : 0;
  const vibrationRmsMmS = Math.max(0.1, baseVib + cavVib + cutterVib + (Math.sin(newElapsed * 14) * 0.15));

  // 10. Thermal Model
  const targetTemp = params.ambientTempC + (motorPowerKw / 18.0) * 12.0 + 2.5;
  const tempFilter = 1.0 - Math.exp(-dt / 45.0);
  const slurryTemperatureC = current.slurryTemperatureC + (targetTemp - current.slurryTemperatureC) * tempFilter;

  // 11. Estimated Completion Time
  let estimatedCompletionMinutes = 0;
  if (extractionRateM3H > 0.5 && newVolumeRemaining > 0) {
    const remainingHours = (newVolumeRemaining / 1000.0) / extractionRateM3H;
    estimatedCompletionMinutes = Math.round(remainingHours * 60.0);
  }

  // 12. Completion Check
  if (newVolumeRemaining <= 1.0 && current.volumeRemainingLiters > 1.0) {
    isCompleted = true;
    newEvents.push({
      id: `evt-${Date.now()}-comp`,
      timestamp: new Date().toLocaleTimeString(),
      timeSec: Math.round(newElapsed),
      level: 'success',
      source: 'PROCESS_LOG',
      message: `Desludging operation completed: ${Math.round(newVolumeExtracted)} L evacuated.`
    });
  }

  // 13. Safety Threshold Alarms
  if (newH2s >= 15.0 && current.h2sConcentrationPpm < 15.0) {
    hasAlarm = true;
    newEvents.push({
      id: `evt-${Date.now()}-h2s`,
      timestamp: new Date().toLocaleTimeString(),
      timeSec: Math.round(newElapsed),
      level: 'critical',
      source: 'GAS_DETECTOR_A2',
      message: `H2S gas concentration alarm: ${newH2s.toFixed(1)} ppm exceeds OSHA 10 ppm PEL limit.`
    });
  } else if (newH2s >= 10.0 && current.h2sConcentrationPpm < 10.0) {
    newEvents.push({
      id: `evt-${Date.now()}-h2s-warn`,
      timestamp: new Date().toLocaleTimeString(),
      timeSec: Math.round(newElapsed),
      level: 'warning',
      source: 'GAS_DETECTOR_A2',
      message: `H2S approaching safety threshold: ${newH2s.toFixed(1)} ppm.`
    });
  }

  if (fluidOutput.cavitationRisk >= 0.75 && current.cavitationIndex < 0.75) {
    hasAlarm = true;
    newEvents.push({
      id: `evt-${Date.now()}-cav`,
      timestamp: new Date().toLocaleTimeString(),
      timeSec: Math.round(newElapsed),
      level: 'critical',
      source: 'ACOUSTIC_NPSH',
      message: `Severe pump cavitation detected (${(fluidOutput.cavitationRisk * 100).toFixed(0)}%). Reduce pump RPM or increase hose diameter.`
    });
  }

  if (vibrationRmsMmS >= 5.5 && current.vibrationRmsMmS < 5.5) {
    newEvents.push({
      id: `evt-${Date.now()}-vib`,
      timestamp: new Date().toLocaleTimeString(),
      timeSec: Math.round(newElapsed),
      level: 'warning',
      source: 'BEARING_ACCEL',
      message: `Pump vibration elevated: ${vibrationRmsMmS.toFixed(2)} mm/s RMS (Zone B/C boundary).`
    });
  }

  const nextTelemetry: TelemetryState = {
    elapsedTimeSeconds: newElapsed,
    volumeExtractedLiters: newVolumeExtracted,
    volumeRemainingLiters: newVolumeRemaining,
    sludgeLevelM: newSludgeLevel,
    extractionRateM3H: Math.max(0, extractionRateM3H),
    suctionPressureKpa,
    dischargePressureBar: Math.max(0.1, 0.2 + (fluidOutput.totalDynamicHeadM / 10.2)),
    cavitationIndex: fluidOutput.cavitationRisk,
    motorPowerKw: Math.max(0, motorPowerKw),
    motorCurrentAmps: Math.max(0, motorCurrentAmps),
    slurryTemperatureC,
    h2sConcentrationPpm: newH2s,
    ch4ConcentrationPct: newCh4,
    coConcentrationPpm: newCo,
    vibrationRmsMmS,
    reynoldsNumber: fluidOutput.reynoldsNumber,
    headLossM: fluidOutput.frictionHeadLossM,
    systemEfficiencyPct: Math.min(95, Math.max(45, 84 - fluidOutput.cavitationRisk * 25)),
    estimatedCompletionMinutes
  };

  return {
    nextTelemetry,
    newEvents,
    isCompleted,
    hasAlarm
  };
}
