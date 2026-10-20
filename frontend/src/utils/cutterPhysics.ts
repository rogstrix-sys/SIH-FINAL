/**
 * Rotary Macerator & Cutter Physics Engine
 * SIH 26258 | Adaptive Mechanized Desludging Digital Twin
 *
 * Implements:
 * 1. Macerator mechanical torque as a function of speed and sludge total solids (TS%):
 *    tau = (RPM / 1450) * 18.5 * (1 + TS / 15) [Nm]
 * 2. Electrical PMAC power draw:
 *    P = tau * omega = tau * (RPM * 2 * pi / 60) / 1000 [kW]
 * 3. High-shear rheological thinning (Ostwald-de Waele model):
 *    gamma_dot = max(10, RPM * 0.8) [s^-1]
 *    factor = (gamma_dot / 100)^(-0.62)
 * 4. Fibrous particle size reduction:
 *    d_p = max(2.5, 12.0 * (1450 / max(100, RPM))^0.5) [mm]
 * 5. Automatic reverse anti-jamming logic & overload cutoff (>35 Nm).
 */

import {
  CutterSystemParameters,
  CutterSystemTelemetry,
  DEFAULT_CUTTER_PARAMS
} from '../types/cutterSystem';

export function calculateCutterPhysics(
  enabled: boolean,
  rpm: number,
  isReversed: boolean,
  solidsPct: number = 8.5,
  params: CutterSystemParameters = DEFAULT_CUTTER_PARAMS
): Omit<CutterSystemTelemetry, 'mode' | 'isJammed' | 'overloadTrip' | 'interlockBlocked' | 'interlockReason'> {
  if (!enabled || rpm <= 0) {
    return {
      enabled: false,
      rpm: 0,
      isReversed,
      torqueNm: 0,
      powerKw: 0,
      shearRateS: 0,
      shearThinningFactor: 1.0,
      particleSizeMm: 25.0
    };
  }

  const clampedRpm = Math.max(0, Math.min(params.maxRpm, rpm));
  const effectiveTs = Math.max(1, Math.min(25, solidsPct));

  // Mechanical torque calculation
  const baseTorque = (clampedRpm / params.nominalRpm) * 18.5 * (1 + effectiveTs / 15.0);
  const torqueNm = parseFloat(baseTorque.toFixed(2));

  // Electrical power draw in kW
  const omegaRadS = (clampedRpm * 2 * Math.PI) / 60.0;
  const mechanicalWatts = torqueNm * omegaRadS;
  const motorEfficiency = 0.88;
  const powerKw = parseFloat((mechanicalWatts / (1000 * motorEfficiency)).toFixed(2));

  // Shear rate in s^-1
  const shearRateS = Math.round(Math.max(10, clampedRpm * 0.8));

  // Ostwald-de Waele shear thinning factor
  const shearThinningFactor = parseFloat(Math.pow(shearRateS / 100.0, -0.62).toFixed(3));

  // Particle size reduction (trash fragment size in mm, <6mm at nominal speed)
  const particleSizeMm = parseFloat(
    Math.max(2.5, 4.5 * Math.pow(params.nominalRpm / Math.max(100, clampedRpm), 0.5)).toFixed(1)
  );

  return {
    enabled: true,
    rpm: clampedRpm,
    isReversed,
    torqueNm,
    powerKw,
    shearRateS,
    shearThinningFactor,
    particleSizeMm
  };
}
