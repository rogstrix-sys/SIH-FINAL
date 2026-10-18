/**
 * SIH 26258: Sludge-Compaction Piston & Dewatering Kinematic Engine
 * 
 * Implements deterministic hydraulic mechanics, porous platen motion,
 * empirical sludge dewatering equations, and interlock safety logic.
 *
 * NOTE: Dewatering volumes and compaction ratios are empirical approximations
 * for conceptual modeling and have not been validated on physical test benches.
 */

import {
  PistonOperatingMode,
  SludgeCompactionParameters,
  SludgeCompactionTelemetry,
  DEFAULT_COMPACTION_PARAMS
} from '../types/sludgeCompaction';

/**
 * Calculates effective platen bore cross-sectional area (m²)
 */
export function calculateBoreAreaM2(boreDiameterMm: number): number {
  const dM = boreDiameterMm / 1000;
  return (Math.PI / 4) * dM * dM;
}

/**
 * Calculates hydraulic thrust force in kN given pressure (bar) and bore diameter (mm)
 */
export function calculateCylinderForceKn(pressureBar: number, boreDiameterMm: number): number {
  const areaM2 = calculateBoreAreaM2(boreDiameterMm);
  // 1 bar = 100,000 Pa = 100 kN/m²
  return pressureBar * 100 * areaM2;
}

/**
 * Computes stroke depth where platen makes contact with the sludge bed
 * inside horizontal cylindrical tank (0 to strokeMaxMm)
 */
export function calculateContactStrokeMm(
  collectionVolumeL: number,
  tankCapacityL: number,
  strokeMaxMm: number = DEFAULT_COMPACTION_PARAMS.strokeMaxMm
): number {
  if (tankCapacityL <= 0 || collectionVolumeL <= 0) {
    return strokeMaxMm; // Empty tank: platen will not reach sludge
  }

  const fillRatio = Math.min(1.0, Math.max(0, collectionVolumeL / tankCapacityL));
  // Total tank vertical height span is 760 mm
  // Piston stroke covers top 600 mm of the tank
  const surfaceHeightFromTopMm = 760 * (1 - fillRatio);
  return Math.min(strokeMaxMm, Math.max(0, surfaceHeightFromTopMm));
}

/**
 * Computes sludge dewatering mass-balance and resistance pressure.
 * 
 * Strict conservation of mass:
 * V_cake + V_filtrate = V_initial
 */
export function calculateDewateringState(
  strokeMm: number,
  contactStrokeMm: number,
  initialSludgeVolumeL: number,
  params: SludgeCompactionParameters
): {
  platenContact: boolean;
  cakeVolumeL: number;
  filtrateVolumeL: number;
  compactionRatio: number;
  volumeReductionPct: number;
  hydraulicPressureBar: number;
  reliefValveOpen: boolean;
  overpressureTrip: boolean;
} {
  if (initialSludgeVolumeL <= 0 || strokeMm <= contactStrokeMm) {
    // Platen has not reached the sludge bed yet (free travel)
    return {
      platenContact: false,
      cakeVolumeL: initialSludgeVolumeL,
      filtrateVolumeL: 0,
      compactionRatio: 1.0,
      volumeReductionPct: 0,
      hydraulicPressureBar: strokeMm > 0 ? 8.0 : 0.0, // Tare cylinder seal friction during extension
      reliefValveOpen: false,
      overpressureTrip: false
    };
  }

  // Active compression into the sludge bed
  const travelBeyondContactMm = strokeMm - contactStrokeMm;
  const maxCompressionSpanMm = Math.max(1, params.strokeMaxMm - contactStrokeMm);
  const compressionRatioRaw = Math.min(1.0, Math.max(0, travelBeyondContactMm / maxCompressionSpanMm));

  // Non-linear consolidation exponent representing pore resistance in sewage solids
  const consolidationProgress = Math.pow(compressionRatioRaw, 1.4);

  // Maximum expressible liquid fraction governed by dewaterabilityFactor (nominal 0.35)
  const maxDewaterFraction = Math.min(0.45, Math.max(0.15, params.dewaterabilityFactor));
  const filtrateVolumeL = initialSludgeVolumeL * maxDewaterFraction * consolidationProgress;
  
  // Strict mass balance: V_cake = V_initial - V_filtrate
  const cakeVolumeL = Math.max(0, initialSludgeVolumeL - filtrateVolumeL);

  const compactionRatio = cakeVolumeL > 0
    ? initialSludgeVolumeL / cakeVolumeL
    : 1.0;

  const volumeReductionPct = initialSludgeVolumeL > 0
    ? (filtrateVolumeL / initialSludgeVolumeL) * 100
    : 0;

  // Resistance pressure modeling exponential mechanical resistance of packed sludge cake
  const beddingPressureBar = 15.0;
  const peakTargetBar = params.reliefPressureBar;
  const pressureCurve = beddingPressureBar + (peakTargetBar - beddingPressureBar) * Math.pow(compressionRatioRaw, 2.2);

  const reliefValveOpen = pressureCurve >= params.reliefPressureBar;
  const clampedPressureBar = reliefValveOpen ? params.reliefPressureBar : pressureCurve;
  const overpressureTrip = clampedPressureBar >= params.overpressureTripBar;

  return {
    platenContact: true,
    cakeVolumeL: parseFloat(cakeVolumeL.toFixed(1)),
    filtrateVolumeL: parseFloat(filtrateVolumeL.toFixed(1)),
    compactionRatio: parseFloat(compactionRatio.toFixed(2)),
    volumeReductionPct: parseFloat(volumeReductionPct.toFixed(1)),
    hydraulicPressureBar: parseFloat(clampedPressureBar.toFixed(1)),
    reliefValveOpen,
    overpressureTrip
  };
}

/**
 * Step compaction simulation state forward by deltaSeconds (dt)
 */
export function stepSludgeCompaction(
  prev: SludgeCompactionTelemetry,
  params: SludgeCompactionParameters,
  collectionVolumeL: number,
  tankCapacityL: number,
  isBlockedByInterlock: boolean,
  interlockReason: string | null,
  dt: number
): SludgeCompactionTelemetry {
  // If emergency trip or latched overpressure
  if (prev.overpressureTrip) {
    return {
      ...prev,
      pistonState: 'HOLD',
      interlockBlocked: true,
      interlockBlockReason: 'HYDRAULIC OVERPRESSURE TRIP (>210 bar) — Safety shutdown latched'
    };
  }

  // If safety interlock is active, stop motion
  if (isBlockedByInterlock) {
    return {
      ...prev,
      pistonState: prev.pistonState === 'EXTENDING' || prev.pistonState === 'RETRACTING'
        ? 'HOLD'
        : prev.pistonState,
      interlockBlocked: true,
      interlockBlockReason: interlockReason
    };
  }

  let nextState: PistonOperatingMode = prev.pistonState;
  let nextStrokeMm = prev.strokeMm;
  let initialSludgeVol = prev.initialSludgeVolumeL;

  // If we just started extending from home, capture initial sludge volume
  if (prev.pistonState === 'EXTENDING' && prev.strokeMm <= 5 && initialSludgeVol <= 0) {
    initialSludgeVol = collectionVolumeL;
  }

  if (prev.pistonState === 'EXTENDING') {
    // Check if mechanical transport lock is still engaged
    if (prev.isTransportLocked) {
      return {
        ...prev,
        pistonState: 'LOCKED',
        interlockBlocked: true,
        interlockBlockReason: 'TRANSPORT LOCK PIN ENGAGED — Disengage lock pin before extending'
      };
    }

    const travelDelta = params.extensionSpeedMmS * dt;
    nextStrokeMm = Math.min(params.strokeMaxMm, prev.strokeMm + travelDelta);

    // If bottom mechanical limit reached, stop and hold
    if (nextStrokeMm >= params.strokeMaxMm) {
      nextStrokeMm = params.strokeMaxMm;
      nextState = 'HOLD';
    }
  } else if (prev.pistonState === 'RETRACTING') {
    const travelDelta = params.retractionSpeedMmS * dt;
    nextStrokeMm = Math.max(0, prev.strokeMm - travelDelta);

    // If top home mechanical limit reached
    if (nextStrokeMm <= 0) {
      nextStrokeMm = 0;
      nextState = 'HOME';
      initialSludgeVol = 0; // reset for next cycle
    }
  }

  const strokePct = parseFloat(((nextStrokeMm / params.strokeMaxMm) * 100).toFixed(1));
  const contactStrokeMm = calculateContactStrokeMm(
    initialSludgeVol > 0 ? initialSludgeVol : collectionVolumeL,
    tankCapacityL,
    params.strokeMaxMm
  );

  const dewatering = calculateDewateringState(
    nextStrokeMm,
    contactStrokeMm,
    initialSludgeVol > 0 ? initialSludgeVol : collectionVolumeL,
    params
  );

  const appliedPressureBar = dewatering.hydraulicPressureBar;
  const compactionForceKn = parseFloat(
    calculateCylinderForceKn(appliedPressureBar, params.boreDiameterMm).toFixed(1)
  );

  // If relief valve opened during extension, hold at limit pressure
  if (dewatering.reliefValveOpen && nextState === 'EXTENDING') {
    nextState = 'HOLD';
  }

  return {
    pistonState: nextState,
    strokeMm: parseFloat(nextStrokeMm.toFixed(1)),
    strokePct,
    appliedPressureBar,
    compactionForceKn,
    platenContact: dewatering.platenContact,
    contactStrokeMm: parseFloat(contactStrokeMm.toFixed(1)),
    initialSludgeVolumeL: initialSludgeVol,
    cakeVolumeL: dewatering.cakeVolumeL,
    filtrateVolumeL: dewatering.filtrateVolumeL,
    compactionRatio: dewatering.compactionRatio,
    volumeReductionPct: dewatering.volumeReductionPct,
    reliefValveOpen: dewatering.reliefValveOpen,
    overpressureTrip: dewatering.overpressureTrip,
    isTransportLocked: prev.isTransportLocked,
    interlockBlocked: false,
    interlockBlockReason: null,
    isTankVented: true,
    conceptualDisclaimer: 'SIMULATED APPROXIMATION — NOT FIELD-VALIDATED PHYSICAL PERFORMANCE'
  };
}
