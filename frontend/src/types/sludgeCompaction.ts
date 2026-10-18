/**
 * SIH 26258: Sludge-Compaction Piston & Dewatering Types
 * 
 * Defines data structures, parameters, and telemetry for the articulated,
 * hydraulically actuated vertical compaction cylinder and porous platen
 * inside the desludging vehicle's collection tank.
 *
 * NOTE: Dewatering efficiencies and compaction ratios are empirical approximations
 * for conceptual modeling and have not been validated on physical test benches.
 */

export type PistonOperatingMode = 'HOME' | 'EXTENDING' | 'RETRACTING' | 'HOLD' | 'LOCKED';

export interface SludgeCompactionParameters {
  /** Cylinder bore diameter in mm (nominal 120 mm) */
  boreDiameterMm: number;
  /** Cylinder rod diameter in mm (nominal 60 mm) */
  rodDiameterMm: number;
  /** Maximum vertical piston travel in mm (nominal 600 mm) */
  strokeMaxMm: number;
  /** Compaction platen contact area in m² (nominal 0.72 m²) */
  platenAreaM2: number;
  /** Hydraulic safety relief valve cracking pressure in bar (nominal 180 bar) */
  reliefPressureBar: number;
  /** Hydraulic overpressure emergency trip pressure in bar (nominal 210 bar) */
  overpressureTripBar: number;
  /** Empirical sludge dewaterability factor (0.20 to 0.45; nominal 0.35 = max 35% filtrate expulsion) */
  dewaterabilityFactor: number;
  /** Piston extension (pressing) speed in mm/s (nominal 15 mm/s) */
  extensionSpeedMmS: number;
  /** Piston retraction speed in mm/s (nominal 30 mm/s) */
  retractionSpeedMmS: number;
}

export interface SludgeCompactionTelemetry {
  /** Active operating state of the compaction cylinder */
  pistonState: PistonOperatingMode;
  /** Current vertical piston travel in mm (0 = top home, strokeMax = fully extended) */
  strokeMm: number;
  /** Current travel as a percentage (0% to 100%) */
  strokePct: number;
  /** Simulated hydraulic pressure at cylinder head in bar */
  appliedPressureBar: number;
  /** Compaction force exerted by platen in kN */
  compactionForceKn: number;
  /** Whether the platen has made physical contact with the sludge bed */
  platenContact: boolean;
  /** Stroke depth in mm where contact with sludge surface occurred */
  contactStrokeMm: number;
  /** Captured initial sludge volume at compaction start in Liters */
  initialSludgeVolumeL: number;
  /** Volume of compressed dewatered sludge cake in Liters */
  cakeVolumeL: number;
  /** Volume of separated liquid/filtrate in Liters */
  filtrateVolumeL: number;
  /** Volume reduction ratio (Initial / Cake; nominal 1.00x to 1.75x) */
  compactionRatio: number;
  /** Volume reduction percentage (0% to ~43%) */
  volumeReductionPct: number;
  /** Hydraulic pressure relief valve open status */
  reliefValveOpen: boolean;
  /** Overpressure emergency shutdown latched status */
  overpressureTrip: boolean;
  /** Mechanical transport lock pin engagement status */
  isTransportLocked: boolean;
  /** Safety interlock block flag */
  interlockBlocked: boolean;
  /** Safety interlock explanation if blocked */
  interlockBlockReason: string | null;
  /** Atmospheric venting / PVRV status */
  isTankVented: boolean;
  /** Explicit conceptual disclaimer string */
  conceptualDisclaimer: string;
}

export const DEFAULT_COMPACTION_PARAMS: SludgeCompactionParameters = {
  boreDiameterMm: 120,
  rodDiameterMm: 60,
  strokeMaxMm: 600,
  platenAreaM2: 0.72,
  reliefPressureBar: 180.0,
  overpressureTripBar: 210.0,
  dewaterabilityFactor: 0.35,
  extensionSpeedMmS: 15.0,
  retractionSpeedMmS: 30.0
};

export const INITIAL_COMPACTION_TELEMETRY: SludgeCompactionTelemetry = {
  pistonState: 'LOCKED',
  strokeMm: 0,
  strokePct: 0,
  appliedPressureBar: 0,
  compactionForceKn: 0,
  platenContact: false,
  contactStrokeMm: 0,
  initialSludgeVolumeL: 0,
  cakeVolumeL: 0,
  filtrateVolumeL: 0,
  compactionRatio: 1.0,
  volumeReductionPct: 0,
  reliefValveOpen: false,
  overpressureTrip: false,
  isTransportLocked: true,
  interlockBlocked: false,
  interlockBlockReason: null,
  isTankVented: true,
  conceptualDisclaimer: 'SIMULATED APPROXIMATION — NOT FIELD-VALIDATED PHYSICAL PERFORMANCE'
};
