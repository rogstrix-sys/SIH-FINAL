/**
 * Cutter & Rotary Macerator System Types
 * SIH 26258 | Adaptive Mechanized Desludging Digital Twin
 */

export type CutterOperatingMode = 'standby' | 'continuous' | 'anti_jam' | 'shredding';

export interface CutterSystemParameters {
  /** Rated maximum speed in RPM (nominal 1800 RPM) */
  maxRpm: number;
  /** Nominal operating speed in RPM (nominal 1450 RPM) */
  nominalRpm: number;
  /** Tungsten carbide blade count */
  bladeCount: number;
  /** Maximum motor torque before overload trip in Nm (nominal 35 Nm) */
  maxTorqueNm: number;
  /** Motor rated power in kW (nominal 3.5 kW PMAC motor) */
  ratedPowerKw: number;
  /** Automatic reverse pulse duration in milliseconds */
  autoReverseDurationMs: number;
}

export interface CutterSystemTelemetry {
  /** Active system power switch */
  enabled: boolean;
  /** Current rotational speed in RPM (0 to 1800 RPM) */
  rpm: number;
  /** Reverse rotation state (anti-jam mode) */
  isReversed: boolean;
  /** Active operating mode */
  mode: CutterOperatingMode;
  /** Current mechanical torque in Nm */
  torqueNm: number;
  /** Electrical power consumption in kW */
  powerKw: number;
  /** Slurry shear rate in s^-1 */
  shearRateS: number;
  /** Non-Newtonian shear-thinning reduction factor */
  shearThinningFactor: number;
  /** Nominal shredded particle size in mm (<6mm) */
  particleSizeMm: number;
  /** Mechanical blockage / fibrous stall indicator */
  isJammed: boolean;
  /** Overload safety trip status */
  overloadTrip: boolean;
  /** Interlock block state */
  interlockBlocked: boolean;
  /** Reason for interlock block if any */
  interlockReason: string | null;
}

export const DEFAULT_CUTTER_PARAMS: CutterSystemParameters = {
  maxRpm: 1800,
  nominalRpm: 1450,
  bladeCount: 8,
  maxTorqueNm: 35.0,
  ratedPowerKw: 3.5,
  autoReverseDurationMs: 400
};

export const INITIAL_CUTTER_TELEMETRY: CutterSystemTelemetry = {
  enabled: true,
  rpm: 1450,
  isReversed: false,
  mode: 'continuous',
  torqueNm: 18.5,
  powerKw: 2.81,
  shearRateS: 1160,
  shearThinningFactor: 0.218,
  particleSizeMm: 4.5,
  isJammed: false,
  overloadTrip: false,
  interlockBlocked: false,
  interlockReason: null
};
