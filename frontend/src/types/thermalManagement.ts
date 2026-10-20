/**
 * Thermal Management System Types
 * SIH 26258 | Adaptive Mechanized Desludging Digital Twin
 */

export interface ThermalManagementParameters {
  /** Rated PTC heater power in kW (nominal 3.2 kW) */
  heaterRatedPowerKw: number;
  /** Thermal boundary layer heat transfer coefficient in W/(m²·K) */
  heatTransferCoeff: number;
  /** Effective heating jacket surface area in m² */
  jacketAreaM2: number;
  /** Target sludge liquefaction setpoint in °C (nominal +18°C) */
  targetCoreTempC: number;
  /** Thermal boundary layer temperature boost in °C (nominal +22°C above ambient) */
  temperatureBoostC: number;
  /** Reference ambient freezing threshold in °C */
  freezeThresholdC: number;
}

export interface ThermalManagementTelemetry {
  /** Master PTC heating jacket power state */
  heaterEnabled: boolean;
  /** Ambient environmental temperature in °C (-15°C to +35°C) */
  ambientTempC: number;
  /** Target core temperature setpoint in °C */
  targetTempC: number;
  /** Current effective sludge boundary layer temperature in °C */
  effectiveTempC: number;
  /** Active thermal power consumption in kW */
  heatingPowerKw: number;
  /** Apparent unheated viscosity in cP */
  unheatedViscosityCp: number;
  /** Apparent heated viscosity in cP */
  heatedViscosityCp: number;
  /** Current operating sludge viscosity in cP */
  currentViscosityCp: number;
  /** Viscosity-compensated pump flow rate in m³/h */
  compensatedFlowRateM3h: number;
  /** Sub-zero lipid crystallization / freeze hazard warning */
  freezeWarning: boolean;
  /** Thermal liquefaction efficiency percentage */
  liquefactionEfficiencyPct: number;
  /** High temperature thermal cut-off trip status */
  thermalOverheatTrip: boolean;
}

export const DEFAULT_THERMAL_PARAMS: ThermalManagementParameters = {
  heaterRatedPowerKw: 3.2,
  heatTransferCoeff: 45.0,
  jacketAreaM2: 0.85,
  targetCoreTempC: 18.0,
  temperatureBoostC: 22.0,
  freezeThresholdC: 0.0
};

export const INITIAL_THERMAL_TELEMETRY: ThermalManagementTelemetry = {
  heaterEnabled: true,
  ambientTempC: -4.0,
  targetTempC: 18.0,
  effectiveTempC: 18.0,
  heatingPowerKw: 3.2,
  unheatedViscosityCp: 2840,
  heatedViscosityCp: 320,
  currentViscosityCp: 320,
  compensatedFlowRateM3h: 11.9,
  freezeWarning: false,
  liquefactionEfficiencyPct: 94.2,
  thermalOverheatTrip: false
};
