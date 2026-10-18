/**
 * Deterministic Simulation Engine for Desludge Digital Twin
 * 
 * Implements strict conservation of mass, explicit engineering equations,
 * fixed-timestep integration, state sequencing, safety interlocks, and alarms.
 * Completely independent of 3D rendering.
 */

import {
  EngineState,
  EngineParameters,
  AlarmLimits,
  OperatingState,
  SimulationEvent,
  SludgeConsistency
} from '../types/simulationEngine';

export const DEFAULT_ENGINE_PARAMS: EngineParameters = {
  pumpRatedFlowLpm: 500.0,       // 500 L/min (~30 m³/h nominal displacement)
  pumpMaxRpm: 3000.0,
  pumpRpm: 2100.0,
  pumpEfficiency: 0.75,
  motorEfficiency: 0.88,

  hoseDiameterMm: 100.0,         // 4 inch (0.100 m)
  hoseLengthM: 35.0,
  pipeRoughnessMm: 0.045,        // Commercial steel / smooth composite
  elevationDifferenceM: 2.5,     // 2.5 m static lift between septic vault floor and pump inlet

  sludgeConsistency: 'viscous',
  sludgeViscosityCp: 450.0,      // 450 cP
  sludgeDensityKgM3: 1180.0,     // 1,180 kg/m³

  sourceTankCapacityL: 4200.0,
  initialSourceVolumeL: 3800.0,  // 3,800 L initial septage in vault
  collectionTankCapacityL: 2400.0,// 2,400 L on-chassis tank
  receiverTankCapacityL: 10000.0,// 10,000 L external disposal tanker
  targetExtractionVolumeL: 2400.0,// 1 batch = 2,400 L

  waterJettingEnabled: true,
  waterJetPressureBar: 140.0,
  cutterHeadEnabled: true,
  cutterHeadSpeedRpm: 240.0,
  dischargeRateLpm: 750.0        // Discharge transfer rate
};

export const DEFAULT_ALARM_LIMITS: AlarmLimits = {
  lowSourceLevelL: 150.0,        // Alarm when source has <= 150 L
  collectionTankFullPct: 95.0,   // Alarm when collection tank >= 95%
  maxVacuumKpa: 84.0,            // Alarm when suction vacuum >= 84 kPa
  maxMotorPowerKw: 14.5          // Alarm when motor power >= 14.5 kW
};

/**
 * Physical Assumptions & Documented Limitations of Simplified Hydraulic Model:
 * 1. Fluid Rheology: Uses Darcy-Weisbach friction approximation with Swamee-Jain explicit turbulent factor
 *    and Hagen-Poiseuille laminar law. Real septage / faecal sludge exhibits non-Newtonian shear-thinning
 *    Bingham plastic or Herschel-Bulkley behavior with yield stress (tau_0) and thixotropic breakdown under shear.
 * 2. Homogeneous Density: Assumes uniform slurry density (rho = 1,180 kg/m³), neglecting vertical density
 *    stratification (heavy sand/grit sedimentation at bottom vs. floating buoyant scum at top).
 * 3. Lumped Minor Losses: Minor loss coefficient K_minor = 2.5 aggregates entry strainer head loss, 90-deg bends,
 *    quick-camlock couplings, and suction check valve without transient vortex analysis.
 * 4. Hydro-Jetting Assist: Modeled via an empirical shear-thinning dilution factor (up to 55% effective viscosity reduction)
 *    rather than two-phase computational fluid dynamics (CFD).
 * 5. Isothermal Flow: Neglects viscous dissipation heating and temperature-dependent thermal convection along the umbilical hose.
 */
export const HYDRAULIC_MODEL_LIMITATIONS: readonly string[] = [
  'Darcy-Weisbach assumes Newtonian continuum; real faecal sludge is non-Newtonian Bingham plastic with yield stress (tau_0).',
  'Slurry density is modeled as uniform (1,180 kg/m³), ignoring gravitational grit/scum stratification.',
  'Turbulent friction factor calculated via Swamee-Jain approximation without acoustic wave or transient water-hammer modeling.',
  'Lumped minor losses (K=2.5) aggregate hose coil bends, quick-camlock couplings, and suction check valve.',
  'Hydro-jetting sludge fluidization is approximated by empirical shear reduction factor, not multi-phase CFD.',
  'Isothermal assumption: does not compute viscous shear thermal dissipation into the fluid stream.'
] as const;

/**
 * Format simulation seconds into MM:SS display
 */
export function formatSimTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Factory to create fresh, deterministic initial engine state
 */
export function createInitialEngineState(
  customParams?: Partial<EngineParameters>,
  customLimits?: Partial<AlarmLimits>
): EngineState {
  const parameters: EngineParameters = { ...DEFAULT_ENGINE_PARAMS, ...customParams };
  const alarmLimits: AlarmLimits = { ...DEFAULT_ALARM_LIMITS, ...customLimits };

  const initialSource = parameters.initialSourceVolumeL;
  const initialCollection = 0.0;
  const initialReceiver = 0.0;
  const totalInitial = initialSource + initialCollection + initialReceiver;

  const initialEvents: SimulationEvent[] = [
    {
      id: 'evt-init-0',
      simTimeSec: 0,
      formattedTime: '00:00',
      state: 'IDLE',
      level: 'info',
      source: 'ENGINE_CORE',
      message: 'Simulation engine initialized. Machine stationary in IDLE state.'
    }
  ];

  return {
    operatingState: 'IDLE',
    previousState: 'IDLE',
    simulatedTimeSec: 0.0,
    fixedTimestepSec: 0.05,
    isPaused: false,
    simSpeedMultiplier: 1.0,

    parameters,
    alarmLimits,

    materialBalance: {
      sourceVolumeL: initialSource,
      sourceLevelM: (initialSource / parameters.sourceTankCapacityL) * 1.85,
      collectionVolumeL: initialCollection,
      collectionFillPct: 0.0,
      receiverVolumeL: initialReceiver,
      totalInitialVolumeL: totalInitial,
      massBalanceDiscrepancyL: 0.0,
      cycleExtractedL: 0.0,
      cycleDischargedL: 0.0
    },

    kinematics: {
      deployProgress: 0.0,
      stabilizerExtension: 0.0,
      boomSlewAngleRad: 0.0,
      boomElevationRad: 0.2,
      jibFlexAngleRad: -0.2,
      hoseReelAngleRad: 0.0,
      hoseReelRpm: 0.0,
      pumpShaftAngleRad: 0.0,
      pumpShaftRpm: 0.0,
      materialFlowVelocityMs: 0.0,
      isMaterialFlowing: false
    },

    telemetry: {
      simulatedTimeSec: 0.0,
      operatingState: 'IDLE',
      flowRateLpm: 0.0,
      flowRateM3H: 0.0,
      suctionPressureKpa: 0.0,
      dischargePressureKpa: 0.0,
      staticLiftKpa: 0.0,
      frictionHeadKpa: 0.0,
      cavitationIndex: 0.0,
      motorPowerKw: 0.0,
      cumulativeEnergyKwh: 0.0,
      specificEnergyKwhM3: 0.0,
      estimatedRemainingTimeSec: 0,
      hydraulicModelLimitations: HYDRAULIC_MODEL_LIMITATIONS
    },

    alarms: {
      lowSourceLevel: false,
      collectionTankFull: false,
      receiverTankFull: false,
      excessiveVacuum: false,
      motorOverload: false,
      emergencyStopActive: false
    },

    interlocks: {
      isDeployed: false,
      isPrimed: false,
      preventExtractNotDeployed: false,
      preventExtractNotPrimed: false,
      preventExtractTankFull: false,
      preventExtractSourceEmpty: false,
      preventDischargeNoDestination: false,
      emergencyStopLatched: false
    },

    deployTimerSec: 0.0,
    primeTimerSec: 0.0,
    events: initialEvents,
    recentEvents: []
  };
}

/**
 * Calculates effective viscosity considering non-Newtonian shear thinning & hydro-jetting assist
 */
export function calculateEffectiveViscosity(
  baseViscosityCp: number,
  waterJetEnabled: boolean,
  waterJetPressureBar: number
): number {
  if (!waterJetEnabled || waterJetPressureBar <= 10) {
    return baseViscosityCp;
  }
  // High-pressure jetting shears and dilutes sludge boundary layer up to 55%
  const jetFactor = Math.min(0.55, (waterJetPressureBar / 250.0) * 0.55);
  return baseViscosityCp * (1.0 - jetFactor);
}

/**
 * Calculates instantaneous fluid dynamics and pump power
 */
export function calculateFluidDynamics(
  flowLpm: number,
  params: EngineParameters,
  effectiveViscosityCp: number,
  suctionLiftM: number
): {
  velocityMs: number;
  reynolds: number;
  frictionHeadKpa: number;
  staticLiftKpa: number;
  suctionVacuumKpa: number;
  motorPowerKw: number;
  cavitationRisk: number;
} {
  const dM = params.hoseDiameterMm / 1000.0;
  const areaM2 = (Math.PI * Math.pow(dM, 2)) / 4.0;
  const flowM3S = (flowLpm / 60000.0); // m³/s
  const velocityMs = areaM2 > 0 ? flowM3S / areaM2 : 0.0;

  // Reynolds number: Re = (rho * v * D) / mu (1 cP = 0.001 Pa.s)
  const dynamicViscosityPaS = Math.max(0.0008, effectiveViscosityCp * 0.001);
  const reynolds = (params.sludgeDensityKgM3 * velocityMs * dM) / dynamicViscosityPaS;

  // Darcy friction factor
  let f = 0.035;
  if (reynolds > 10) {
    if (reynolds <= 2300) {
      f = 64.0 / reynolds;
    } else {
      const epsOverD = params.pipeRoughnessMm / params.hoseDiameterMm;
      f = 0.25 / Math.pow(Math.log10(epsOverD / 3.7 + 5.74 / Math.pow(reynolds, 0.9)), 2);
    }
  }

  // Darcy-Weisbach head loss in metres: hf = (f * L/D + K_minor) * v^2 / (2g)
  const g = 9.80665;
  const velocityHeadM = Math.pow(velocityMs, 2) / (2.0 * g);
  const headLossM = (f * (params.hoseLengthM / dM) + 2.5) * velocityHeadM;
  const frictionHeadKpa = (params.sludgeDensityKgM3 * g * headLossM) / 1000.0;

  // Suction Vacuum: Static elevation lift head + Friction head + Inlet acceleration
  const effectiveLiftM = Math.max(0.5, suctionLiftM);
  const staticLiftKpa = (params.sludgeDensityKgM3 * g * effectiveLiftM) / 1000.0;
  const suctionVacuumKpa = flowLpm > 5.0 ? staticLiftKpa + frictionHeadKpa : 0.0;

  // Hydraulic & Motor Power: P = (deltaP * Q) / 1000 (kW)
  const totalDeltaPKpa = suctionVacuumKpa + 60.0; // 60 kPa tank pressure differential
  const hydraulicPowerKw = (totalDeltaPKpa * (flowLpm / 60.0)) / 1000.0;
  const idlePowerKw = flowLpm > 0 ? 0.85 * (params.pumpRpm / params.pumpMaxRpm) : 0.0;
  const motorPowerKw = hydraulicPowerKw / Math.max(0.2, params.pumpEfficiency * params.motorEfficiency) + idlePowerKw;

  // Cavitation risk assessment
  const cavitationRisk = Math.min(1.0, Math.max(0.0, (suctionVacuumKpa / 85.0) * 0.75 + (velocityMs / 4.0) * 0.25));

  return {
    velocityMs,
    reynolds: Math.round(reynolds),
    frictionHeadKpa,
    staticLiftKpa,
    suctionVacuumKpa,
    motorPowerKw,
    cavitationRisk
  };
}

/**
 * Step the deterministic simulation engine by fixed timestep dt.
 * All state mutations are deterministic, strictly preserving mass balance.
 */
export function stepSimulationEngine(state: EngineState, dtSeconds: number): EngineState {
  if (state.isPaused || state.operatingState === 'PAUSED') {
    return state;
  }

  const dt = Math.max(0.001, Math.min(0.2, dtSeconds)) * state.simSpeedMultiplier;
  const newSimTime = state.simulatedTimeSec + dt;
  const formattedTime = formatSimTime(newSimTime);

  // Clone state structures for immutability
  let nextState: OperatingState = state.operatingState;
  const newEvents: SimulationEvent[] = [];

  const mat = { ...state.materialBalance };
  const kin = { ...state.kinematics };
  const tel = { ...state.telemetry };
  const alm = { ...state.alarms };
  const itl = { ...state.interlocks };
  const params = { ...state.parameters };
  const limits = { ...state.alarmLimits };

  let deployTimer = state.deployTimerSec;
  let primeTimer = state.primeTimerSec;

  // Deterministic helper to append simulation events
  let eventSeq = state.events.length;
  const addEvt = (level: SimulationEvent['level'], source: string, message: string) => {
    eventSeq++;
    newEvents.push({
      id: `evt-${Math.round(newSimTime * 1000)}-${eventSeq}`,
      simTimeSec: newSimTime,
      formattedTime,
      state: nextState,
      level,
      source,
      message
    });
  };

  // =========================================================================
  // 1. STATE SEQUENCING & LOGIC
  // =========================================================================

  switch (state.operatingState) {
    case 'IDLE': {
      // Machine stationary, pump off, actuators in resting position
      tel.flowRateLpm = 0.0;
      tel.flowRateM3H = 0.0;
      tel.suctionPressureKpa = 0.0;
      tel.staticLiftKpa = 0.0;
      tel.frictionHeadKpa = 0.0;
      tel.motorPowerKw = 0.0;
      kin.isMaterialFlowing = false;
      kin.materialFlowVelocityMs = 0.0;
      kin.hoseReelRpm = 0.0;
      kin.pumpShaftRpm = 0.0;
      break;
    }

    case 'DEPLOY':
    case 'DEPLOYMENT': {
      // Stabilizers extend to ground and boom pivots over septic tank
      deployTimer += dt;
      const DEPLOY_DURATION = 3.5; // seconds
      const progress = Math.min(1.0, deployTimer / DEPLOY_DURATION);

      kin.deployProgress = progress;
      kin.stabilizerExtension = progress; // Outriggers contact ground
      kin.boomSlewAngleRad = THREE_Lerp(0.0, -0.45, progress);
      kin.boomElevationRad = THREE_Lerp(0.2, 0.65, progress);
      kin.jibFlexAngleRad = THREE_Lerp(-0.2, -0.85, progress);

      if (progress >= 1.0 && !itl.isDeployed) {
        itl.isDeployed = true;
        addEvt('info', 'AUTOMATION_SEQ', 'Deployment complete: Stabilizers planted, articulated boom deployed over septic tank.');
        nextState = state.operatingState === 'DEPLOYMENT' ? 'PRIMING' : 'PRIME';
        primeTimer = 0.0;
      }
      break;
    }

    case 'PRIME':
    case 'PRIMING': {
      // Pump priming and suction line integrity check
      primeTimer += dt;
      const PRIME_DURATION = 2.5; // seconds
      const progress = Math.min(1.0, primeTimer / PRIME_DURATION);

      // Pump rotates at prime speed, small negative vacuum builds
      kin.pumpShaftRpm = 800.0;
      tel.suctionPressureKpa = THREE_Lerp(0.0, 18.0, progress);
      tel.motorPowerKw = 1.2;

      if (progress >= 1.0 && !itl.isPrimed) {
        itl.isPrimed = true;
        addEvt('info', 'AUTOMATION_SEQ', 'Suction line primed and sealed: Vacuum integrity verified.');
        nextState = state.operatingState === 'PRIMING' ? 'EXTRACTION' : 'EXTRACT';
      }
      break;
    }

    case 'EXTRACT':
    case 'EXTRACTION': {
      // Interlock checks
      if (!itl.isDeployed) {
        itl.preventExtractNotDeployed = true;
        nextState = 'FAULT';
        addEvt('critical', 'INTERLOCK_VIOLATION', 'Extraction blocked: Stabilizers or boom not deployed.');
        break;
      }
      if (!itl.isPrimed) {
        itl.preventExtractNotPrimed = true;
        nextState = 'FAULT';
        addEvt('critical', 'INTERLOCK_VIOLATION', 'Extraction blocked: Pump not primed.');
        break;
      }

      // Check Collection Tank Capacity Interlock
      if (mat.collectionVolumeL >= params.collectionTankCapacityL) {
        itl.preventExtractTankFull = true;
        alm.collectionTankFull = true;
        addEvt('warning', 'CAPACITY_LIMIT', `Collection tank full (${params.collectionTankCapacityL} L). Auto-transitioning to DISCHARGE.`);
        nextState = 'DISCHARGE';
        break;
      }

      // Check Source Tank Empty Interlock
      if (mat.sourceVolumeL <= 5.0) {
        itl.preventExtractSourceEmpty = true;
        addEvt('info', 'SOURCE_DEPLETED', 'Source septic tank fully evacuated. Transitioning to DISCHARGE.');
        nextState = 'DISCHARGE';
        break;
      }

      // Sludge extraction calculation
      const effVisc = calculateEffectiveViscosity(
        params.sludgeViscosityCp,
        params.waterJettingEnabled,
        params.waterJetPressureBar
      );

      // Flow rate in L/min
      const rpmFraction = params.pumpRpm / params.pumpMaxRpm;
      const viscPenalty = Math.max(0.25, 1.0 - (effVisc / 6000.0));
      const diaFactor = Math.pow(params.hoseDiameterMm / 100.0, 1.6);
      const targetFlowLpm = params.pumpRatedFlowLpm * rpmFraction * viscPenalty * diaFactor;

      tel.flowRateLpm = targetFlowLpm;
      tel.flowRateM3H = targetFlowLpm * 0.06;

      // Integrated material transfer volume: deltaV = Q (L/min) * dt(s) / 60
      const deltaL = targetFlowLpm * (dt / 60.0);

      // Clamp transfer volume to available source material and remaining collection capacity
      const spaceInCollection = params.collectionTankCapacityL - mat.collectionVolumeL;
      const actualTransferL = Math.min(deltaL, mat.sourceVolumeL, spaceInCollection);

      // Apply material transfer (Mass conservation)
      mat.sourceVolumeL = Math.max(0.0, mat.sourceVolumeL - actualTransferL);
      mat.collectionVolumeL = Math.min(params.collectionTankCapacityL, mat.collectionVolumeL + actualTransferL);
      mat.cycleExtractedL += actualTransferL;

      // Update fluid depth in source tank
      mat.sourceLevelM = (mat.sourceVolumeL / params.sourceTankCapacityL) * 1.85;
      mat.collectionFillPct = (mat.collectionVolumeL / params.collectionTankCapacityL) * 100.0;

      // Kinematics updates
      kin.isMaterialFlowing = actualTransferL > 0.001;
      kin.pumpShaftRpm = params.pumpRpm;
      kin.hoseReelRpm = (params.pumpRpm / params.pumpMaxRpm) * 8.0;

      // Fluid dynamics solution
      const drawdownM = Math.max(0.0, 1.85 - mat.sourceLevelM);
      const suctionLiftM = Math.max(0.5, (params.elevationDifferenceM ?? 2.5) + drawdownM);
      const fd = calculateFluidDynamics(targetFlowLpm, params, effVisc, suctionLiftM);
      tel.suctionPressureKpa = fd.suctionVacuumKpa;
      tel.staticLiftKpa = fd.staticLiftKpa;
      tel.frictionHeadKpa = fd.frictionHeadKpa;
      tel.dischargePressureKpa = 45.0;
      tel.motorPowerKw = fd.motorPowerKw;
      tel.cavitationIndex = fd.cavitationRisk;
      kin.materialFlowVelocityMs = fd.velocityMs;

      // Accumulate energy (kWh = kW * hours)
      tel.cumulativeEnergyKwh += tel.motorPowerKw * (dt / 3600.0);
      const m3Evac = mat.cycleExtractedL / 1000.0;
      tel.specificEnergyKwhM3 = m3Evac > 0.01 ? tel.cumulativeEnergyKwh / m3Evac : 0.0;

      // Alarms verification
      if (mat.sourceVolumeL <= limits.lowSourceLevelL && !alm.lowSourceLevel) {
        alm.lowSourceLevel = true;
        addEvt('warning', 'LEVEL_MONITOR', `Low source tank volume: ${mat.sourceVolumeL.toFixed(0)} L remaining.`);
      }

      if (mat.collectionFillPct >= limits.collectionTankFullPct && !alm.collectionTankFull) {
        alm.collectionTankFull = true;
        addEvt('warning', 'CAPACITY_MONITOR', `Collection tank approaching capacity: ${mat.collectionFillPct.toFixed(1)}%.`);
      }

      if (tel.suctionPressureKpa >= limits.maxVacuumKpa) {
        alm.excessiveVacuum = true;
        nextState = 'FAULT';
        addEvt('critical', 'PRESSURE_INTERLOCK', `Excessive suction vacuum: ${tel.suctionPressureKpa.toFixed(1)} kPa exceeds ${limits.maxVacuumKpa} kPa trip limit.`);
      }

      if (tel.motorPowerKw >= limits.maxMotorPowerKw) {
        alm.motorOverload = true;
        nextState = 'FAULT';
        addEvt('critical', 'THERMAL_OVERLOAD', `Pump motor overload: ${tel.motorPowerKw.toFixed(1)} kW exceeds ${limits.maxMotorPowerKw} kW threshold.`);
      }

      // Check if target extraction volume reached
      if (mat.cycleExtractedL >= params.targetExtractionVolumeL) {
        addEvt('success', 'BATCH_TARGET', `Target batch extraction volume (${params.targetExtractionVolumeL} L) achieved. Transitioning to DISCHARGE.`);
        nextState = 'DISCHARGE';
      }
      break;
    }

    case 'DISCHARGE': {
      // Interlock: check receiving destination validity & capacity
      if (params.receiverTankCapacityL <= 0 || mat.receiverVolumeL >= params.receiverTankCapacityL) {
        itl.preventDischargeNoDestination = true;
        alm.receiverTankFull = true;
        nextState = 'FAULT';
        addEvt('critical', 'INTERLOCK_VIOLATION', `Discharge blocked: Receiving destination full or invalid (${mat.receiverVolumeL.toFixed(0)} / ${params.receiverTankCapacityL} L).`);
        break;
      }

      // Transfer material from mobile collection tank to receiver disposal tanker
      const dischargeRate = params.dischargeRateLpm;
      const deltaL = dischargeRate * (dt / 60.0);
      const remainingReceiverCapacity = params.receiverTankCapacityL - mat.receiverVolumeL;
      const actualDischargeL = Math.min(deltaL, mat.collectionVolumeL, remainingReceiverCapacity);

      mat.collectionVolumeL = Math.max(0.0, mat.collectionVolumeL - actualDischargeL);
      mat.receiverVolumeL = Math.min(params.receiverTankCapacityL, mat.receiverVolumeL + actualDischargeL);
      mat.collectionFillPct = (mat.collectionVolumeL / params.collectionTankCapacityL) * 100.0;
      mat.cycleDischargedL += actualDischargeL;

      if (mat.collectionVolumeL <= 0.0001) {
        mat.collectionVolumeL = 0.0;
        mat.collectionFillPct = 0.0;
        tel.flowRateLpm = 0.0;
        tel.flowRateM3H = 0.0;
        kin.isMaterialFlowing = false;
        kin.pumpShaftRpm = 0.0;
        tel.motorPowerKw = 0.0;
        addEvt('success', 'CYCLE_COMPLETE', 'Discharge complete: Collection tank evacuated. Entire desludging cycle finished.');
        nextState = 'COMPLETE';
        break;
      }

      // If receiver filled up to maximum during discharge
      if (mat.receiverVolumeL >= params.receiverTankCapacityL) {
        itl.preventDischargeNoDestination = true;
        alm.receiverTankFull = true;
        nextState = 'FAULT';
        addEvt('critical', 'CAPACITY_LIMIT', `Discharge interrupted: Receiving tanker filled to maximum capacity (${params.receiverTankCapacityL} L).`);
        break;
      }

      tel.flowRateLpm = dischargeRate;
      tel.flowRateM3H = dischargeRate * 0.06;
      kin.isMaterialFlowing = true;
      kin.pumpShaftRpm = 1400.0;
      tel.motorPowerKw = 3.5;
      tel.cumulativeEnergyKwh += tel.motorPowerKw * (dt / 3600.0);
      break;
    }

    case 'COMPLETE': {
      // Operation successfully completed
      tel.flowRateLpm = 0.0;
      tel.flowRateM3H = 0.0;
      tel.suctionPressureKpa = 0.0;
      tel.motorPowerKw = 0.0;
      kin.isMaterialFlowing = false;
      kin.pumpShaftRpm = 0.0;
      break;
    }

    case 'FAULT': {
      // Fault / Emergency Stop active: all actuators instantly de-energized
      tel.flowRateLpm = 0.0;
      tel.flowRateM3H = 0.0;
      tel.suctionPressureKpa = 0.0;
      tel.motorPowerKw = 0.0;
      kin.isMaterialFlowing = false;
      kin.pumpShaftRpm = 0.0;
      kin.hoseReelRpm = 0.0;
      break;
    }
  }

  // =========================================================================
  // 2. CONSERVATION OF MASS INVARIANT CHECK
  // =========================================================================
  // Total mass = source + collection + receiver must equal initial volume!
  const currentTotal = mat.sourceVolumeL + mat.collectionVolumeL + mat.receiverVolumeL;
  mat.massBalanceDiscrepancyL = Math.abs(currentTotal - mat.totalInitialVolumeL);

  // Time remaining estimate (seconds)
  if (nextState === 'EXTRACT' && tel.flowRateLpm > 10.0) {
    const remainingL = Math.min(mat.sourceVolumeL, params.targetExtractionVolumeL - mat.cycleExtractedL);
    tel.estimatedRemainingTimeSec = Math.round((remainingL / tel.flowRateLpm) * 60.0);
  } else if (nextState === 'DISCHARGE' && params.dischargeRateLpm > 0) {
    tel.estimatedRemainingTimeSec = Math.round((mat.collectionVolumeL / params.dischargeRateLpm) * 60.0);
  } else {
    tel.estimatedRemainingTimeSec = 0;
  }

  // Accumulate rotation angles for 3D visual fidelity
  kin.pumpShaftAngleRad += (kin.pumpShaftRpm / 60.0) * Math.PI * 2 * dt;
  kin.hoseReelAngleRad += (kin.hoseReelRpm / 60.0) * Math.PI * 2 * dt;

  tel.simulatedTimeSec = newSimTime;
  tel.operatingState = nextState;

  // Append new events if any
  const events = newEvents.length > 0 ? [...newEvents, ...state.events].slice(0, 150) : state.events;

  return {
    ...state,
    operatingState: nextState,
    previousState: state.operatingState,
    simulatedTimeSec: newSimTime,
    materialBalance: mat,
    kinematics: kin,
    telemetry: tel,
    alarms: alm,
    interlocks: itl,
    deployTimerSec: deployTimer,
    primeTimerSec: primeTimer,
    events
  };
}

/**
 * Linear interpolation helper
 */
function THREE_Lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1.0, Math.max(0.0, t));
}

// ===========================================================================
// OPERATOR CONTROL ACTIONS
// ===========================================================================

export function triggerStart(state: EngineState): EngineState {
  if (state.operatingState === 'FAULT') {
    return state; // Cannot start while in FAULT
  }
  if (state.isPaused) {
    return { ...state, isPaused: false };
  }
  if (state.operatingState === 'IDLE') {
    const next = {
      ...state,
      operatingState: 'DEPLOY' as OperatingState,
      isPaused: false,
      deployTimerSec: 0.0
    };
    return appendEvent(next, 'info', 'OPERATOR_CMD', 'Start command issued: Initiating DEPLOY sequence.');
  }
  return state;
}

export function triggerPause(state: EngineState): EngineState {
  if (state.isPaused || state.operatingState === 'PAUSED' || state.operatingState === 'IDLE' || state.operatingState === 'COMPLETE' || state.operatingState === 'FAULT') {
    return state;
  }
  const next: EngineState = {
    ...state,
    isPaused: true,
    previousState: state.operatingState,
    operatingState: 'PAUSED'
  };
  return appendEvent(next, 'warning', 'OPERATOR_CMD', 'Simulation paused by operator.');
}

export function triggerResume(state: EngineState): EngineState {
  if (!state.isPaused && state.operatingState !== 'PAUSED') return state;
  const resumedState: OperatingState = state.previousState && state.previousState !== 'PAUSED'
    ? state.previousState
    : 'EXTRACT';
  const next: EngineState = {
    ...state,
    isPaused: false,
    operatingState: resumedState
  };
  return appendEvent(next, 'info', 'OPERATOR_CMD', `Simulation resumed: Returning to ${resumedState} state.`);
}

export function triggerEmergencyStop(state: EngineState): EngineState {
  const next: EngineState = {
    ...state,
    operatingState: 'FAULT',
    isPaused: false,
    alarms: {
      ...state.alarms,
      emergencyStopActive: true
    },
    interlocks: {
      ...state.interlocks,
      emergencyStopLatched: true
    },
    telemetry: {
      ...state.telemetry,
      flowRateLpm: 0.0,
      flowRateM3H: 0.0,
      suctionPressureKpa: 0.0,
      staticLiftKpa: 0.0,
      frictionHeadKpa: 0.0,
      motorPowerKw: 0.0
    },
    kinematics: {
      ...state.kinematics,
      isMaterialFlowing: false,
      pumpShaftRpm: 0.0,
      hoseReelRpm: 0.0
    }
  };
  return appendEvent(next, 'critical', 'E_STOP', 'EMERGENCY STOP ACTIVATED: All actuators and material transfer immediately halted.');
}

export function triggerResolveFault(state: EngineState): EngineState {
  if (state.operatingState !== 'FAULT') return state;

  const next: EngineState = {
    ...state,
    operatingState: 'IDLE',
    alarms: {
      ...state.alarms,
      emergencyStopActive: false,
      excessiveVacuum: false,
      motorOverload: false,
      receiverTankFull: false
    },
    interlocks: {
      ...state.interlocks,
      emergencyStopLatched: false,
      preventExtractNotDeployed: false,
      preventExtractNotPrimed: false,
      preventDischargeNoDestination: false
    }
  };
  return appendEvent(next, 'info', 'FAULT_RESET', 'Fault acknowledged and reset by operator. Machine restored to IDLE.');
}

export function triggerDeploy(state: EngineState): EngineState {
  if (state.operatingState === 'FAULT') return state;
  if (state.operatingState !== 'IDLE') return state;
  const next: EngineState = {
    ...state,
    operatingState: 'DEPLOY',
    isPaused: false,
    deployTimerSec: 0.0
  };
  return appendEvent(next, 'info', 'OPERATOR_CMD', 'Manual DEPLOY sequence initiated: Extending stabilizers and positioning boom.');
}

export function triggerPrime(state: EngineState): EngineState {
  if (state.operatingState === 'FAULT') return state;
  if (!state.interlocks.isDeployed && state.kinematics.deployProgress < 0.95) {
    const next = {
      ...state,
      interlocks: { ...state.interlocks, preventExtractNotDeployed: true }
    };
    return appendEvent(next, 'warning', 'INTERLOCK_BLOCK', 'Cannot PRIME: Machine stabilizers and boom must be fully deployed first.');
  }
  const next: EngineState = {
    ...state,
    operatingState: 'PRIME',
    isPaused: false,
    primeTimerSec: 0.0
  };
  return appendEvent(next, 'info', 'OPERATOR_CMD', 'Manual PRIME sequence initiated: Priming pump suction chamber.');
}

export function triggerExtract(state: EngineState): EngineState {
  if (state.operatingState === 'FAULT') return state;
  if (!state.interlocks.isDeployed) {
    return appendEvent(state, 'critical', 'INTERLOCK_BLOCK', 'Extraction interlock tripped: Machine is not deployed.');
  }
  if (!state.interlocks.isPrimed) {
    return appendEvent(state, 'critical', 'INTERLOCK_BLOCK', 'Extraction interlock tripped: Pump chamber is not primed.');
  }
  if (state.materialBalance.collectionFillPct >= 100) {
    return appendEvent(state, 'warning', 'CAPACITY_BLOCK', 'Cannot EXTRACT: Collection tank is already at 100% capacity.');
  }
  if (state.materialBalance.sourceVolumeL <= 10) {
    return appendEvent(state, 'warning', 'LEVEL_BLOCK', 'Cannot EXTRACT: Source tank is empty.');
  }
  const next: EngineState = {
    ...state,
    operatingState: 'EXTRACT',
    isPaused: false
  };
  return appendEvent(next, 'info', 'OPERATOR_CMD', 'Manual EXTRACT initiated: Starting slurry vacuum suction.');
}

export function triggerDischarge(state: EngineState): EngineState {
  if (state.operatingState === 'FAULT') return state;
  if (!state.parameters.receiverTankCapacityL || state.parameters.receiverTankCapacityL <= 0) {
    const next = {
      ...state,
      interlocks: { ...state.interlocks, preventDischargeNoDestination: true }
    };
    return appendEvent(next, 'critical', 'INTERLOCK_BLOCK', 'Cannot DISCHARGE: No valid receiving destination configured (receiver capacity <= 0).');
  }
  if (state.materialBalance.receiverVolumeL >= state.parameters.receiverTankCapacityL) {
    const next = {
      ...state,
      interlocks: { ...state.interlocks, preventDischargeNoDestination: true },
      alarms: { ...state.alarms, receiverTankFull: true }
    };
    return appendEvent(next, 'critical', 'INTERLOCK_BLOCK', `Cannot DISCHARGE: Receiving tanker destination is full (${state.parameters.receiverTankCapacityL} L).`);
  }
  if (state.materialBalance.collectionVolumeL <= 0.5) {
    return appendEvent(state, 'warning', 'DISCHARGE_BLOCK', 'Cannot DISCHARGE: Collection tank has no material to transfer.');
  }
  const next: EngineState = {
    ...state,
    operatingState: 'DISCHARGE',
    isPaused: false,
    interlocks: { ...state.interlocks, preventDischargeNoDestination: false }
  };
  return appendEvent(next, 'info', 'OPERATOR_CMD', 'DISCHARGE initiated: Evacuating collection tank to external receiver.');
}

export function triggerManualDischarge(state: EngineState): EngineState {
  return triggerDischarge(state);
}

export function triggerReset(state: EngineState): EngineState {
  return createInitialEngineState(state.parameters, state.alarmLimits);
}

function appendEvent(
  state: EngineState,
  level: SimulationEvent['level'],
  source: string,
  message: string
): EngineState {
  const newEvt: SimulationEvent = {
    id: `evt-${Math.round(state.simulatedTimeSec * 1000)}-${state.events.length + 1}`,
    simTimeSec: state.simulatedTimeSec,
    formattedTime: formatSimTime(state.simulatedTimeSec),
    state: state.operatingState,
    level,
    source,
    message
  };
  return {
    ...state,
    events: [newEvt, ...state.events].slice(0, 150)
  };
}
