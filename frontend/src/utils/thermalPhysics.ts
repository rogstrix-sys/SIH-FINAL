/**
 * Thermal Management & Non-Newtonian Rheology Physics Engine
 * SIH 26258 | Adaptive Mechanized Desludging Digital Twin
 *
 * Implements:
 * 1. Ambient sub-zero freezing viscosity spike (Arrhenius / Andrade relation):
 *    mu_unheated = 1200 * exp(-0.06 * (T_ambient - 15)) + (T_ambient < 0 ? |T_ambient| * 150 : 0)
 * 2. Active PTC thermal boundary layer heating:
 *    T_effective = heaterEnabled ? max(16, T_ambient + 22) : T_ambient
 * 3. Coupled thermal-shear thinning viscosity (PTC Heated Intake):
 *    gamma_dot = max(10, cutterRpm * 0.8)
 *    factor = (gamma_dot / 100)^(-0.62)
 *    mu_heated = [1200 * exp(-0.05 * (T_effective - 15))] * factor
 * 4. Progressive cavity pump volumetric flow compensation:
 *    Q = (cutterRpm > 200 || isPumping) ? 12.4 * (1 - mu / 8000) : 0 [m³/h]
 * 5. Freezing hazard and lipid crystallization alarm logic.
 */

import {
  ThermalManagementParameters,
  ThermalManagementTelemetry,
  DEFAULT_THERMAL_PARAMS
} from '../types/thermalManagement';

export function calculateThermalPhysics(
  heaterEnabled: boolean,
  ambientTempC: number,
  targetTempC: number = 18.0,
  cutterRpm: number = 1450,
  isPumping: boolean = true,
  params: ThermalManagementParameters = DEFAULT_THERMAL_PARAMS
): ThermalManagementTelemetry {
  const clampedAmbient = Math.max(-15.0, Math.min(35.0, ambientTempC));

  // 1. Unheated viscosity with cold-climate lipid freezing spike
  let unheatedVisc = 1200.0 * Math.exp(-0.06 * (clampedAmbient - 15.0));
  if (clampedAmbient < 0) {
    unheatedVisc += Math.abs(clampedAmbient) * 150.0;
  }
  const unheatedViscosityCp = Math.min(3500, Math.max(120, Math.round(unheatedVisc)));

  // 2. Effective boundary layer temperature under PTC heating
  let effectiveTempC = clampedAmbient;
  if (heaterEnabled) {
    effectiveTempC = Math.min(38.0, Math.max(16.0, clampedAmbient + params.temperatureBoostC));
  }

  // 3. Heated viscosity with shear-thinning reduction
  const shearRate = Math.max(10.0, cutterRpm * 0.8);
  const shearThinningFactor = Math.pow(shearRate / 100.0, -0.62);
  const rawHeatedVisc = 1200.0 * Math.exp(-0.05 * (effectiveTempC - 15.0)) * shearThinningFactor;
  const heatedViscosityCp = Math.max(80, Math.min(3200, Math.round(rawHeatedVisc)));

  // 4. Current operating viscosity
  const currentViscosityCp = heaterEnabled ? heatedViscosityCp : unheatedViscosityCp;

  // 5. Viscosity-compensated pump flow rate (m³/h)
  const flowActive = cutterRpm > 200 || isPumping;
  const rawFlow = flowActive ? Math.max(0, 12.4 * (1.0 - currentViscosityCp / 8000.0)) : 0.0;
  const compensatedFlowRateM3h = parseFloat(rawFlow.toFixed(1));

  // 6. Sub-zero freeze hazard warning
  const freezeWarning = clampedAmbient < params.freezeThresholdC && !heaterEnabled;

  // 7. Thermal liquefaction efficiency
  const efficiency =
    unheatedViscosityCp > 0
      ? Math.max(0, Math.min(100, ((unheatedViscosityCp - currentViscosityCp) / unheatedViscosityCp) * 100.0))
      : 0;

  return {
    heaterEnabled,
    ambientTempC: clampedAmbient,
    targetTempC,
    effectiveTempC: parseFloat(effectiveTempC.toFixed(1)),
    heatingPowerKw: heaterEnabled ? params.heaterRatedPowerKw : 0.0,
    unheatedViscosityCp,
    heatedViscosityCp,
    currentViscosityCp,
    compensatedFlowRateM3h,
    freezeWarning,
    liquefactionEfficiencyPct: parseFloat(efficiency.toFixed(1)),
    thermalOverheatTrip: effectiveTempC > 65.0
  };
}
