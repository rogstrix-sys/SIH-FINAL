/**
 * Confined-Space Vault Physics & Hydraulic Fluidization Engine
 * Rigorous calculations for FSSM robotics, suction cavitation, and OSHA gas dispersion.
 */

export interface VaultPhysicalState {
  // Vault geometry & fluid volumes
  vaultLengthM: number;
  vaultWidthM: number;
  vaultDepthM: number;
  totalVolumeLiters: number;
  currentLiquidDepthM: number;
  currentSludgeVolumeLiters: number;
  crustThicknessM: number;
  crustLiquefiedPct: number;

  // Sludge Rheology
  solidsConcentrationPct: number; // TS%
  temperatureC: number;
  apparentViscosityCp: number; // centipoise (mPa*s)
  yieldStressPa: number; // Bingham plastic yield stress

  // Fluidization & Jetting
  jetPressureBar: number;
  jetFlowLpm: number;
  jetErosionRateM3h: number;
  maceratorRpm: number;
  maceratorTorqueNm: number;

  // Hydraulics & Suction Lift
  elevationM: number;
  suctionHoseLengthM: number;
  suctionHoseDiameterMm: number;
  suctionFlowM3h: number;
  verticalLiftM: number;
  frictionHeadLossM: number;
  totalDynamicHeadM: number;
  hydraulicPowerKw: number;
  npshaM: number; // Net Positive Suction Head Available
  npshrM: number; // Net Positive Suction Head Required
  isCavitating: boolean;

  // 4-Gas Atmospheric Telemetry (OSHA 1910.146)
  h2sPpm: number; // Hydrogen Sulfide (PEL 20, IDLH 100)
  ch4VolPct: number; // Methane (LEL 5%, UEL 15%)
  coPpm: number; // Carbon Monoxide (PEL 50)
  o2VolPct: number; // Oxygen (Normal 20.9%, Hypoxia < 19.5%)
  ventilationFanCfm: number; // CFM of blower fan
  isVentilationActive: boolean;
  gasHazardLevel: 'SAFE' | 'CAUTION' | 'CRITICAL_ALARM';
  gasAlarmMessage: string;
}

export const OSHA_THRESHOLDS = {
  H2S: {
    SAFE_MAX: 10,
    PEL_LIMIT: 20,
    IDLH_DEADLY: 100
  },
  CH4: {
    SAFE_MAX: 1.0,
    WARNING_LEL: 2.5,
    EXPLOSIVE_LEL: 5.0
  },
  CO: {
    SAFE_MAX: 25,
    PEL_LIMIT: 50,
    IDLH_LIMIT: 200
  },
  O2: {
    MIN_BREATHABLE: 19.5,
    NORMAL: 20.9,
    FATAL_HYPOXIA: 14.0
  }
};

/**
 * Calculates sludge Bingham plastic apparent viscosity & yield stress
 * Based on solids concentration (TS%) and temperature.
 */
export function calculateSludgeRheology(tsPct: number, tempC: number): {
  viscosityCp: number;
  yieldStressPa: number;
} {
  // Exponential yield stress increase with solids concentration
  // Bingham yield stress: tau_0 = 0.05 * exp(0.28 * TS%)
  const clampedTs = Math.max(1, Math.min(30, tsPct));
  const yieldStress = 0.08 * Math.exp(0.26 * clampedTs);

  // Viscosity: base water ~1 cP, sludge increases sharply with solids and sub-zero cold
  // Arrhenius temperature correction
  const tempCorrection = Math.exp(1200 / (tempC + 273.15) - 1200 / 293.15);
  const baseViscosity = 1.0 + 3.2 * Math.pow(clampedTs, 1.85);
  const viscosityCp = Math.max(1.0, baseViscosity * tempCorrection);

  return {
    viscosityCp: Math.round(viscosityCp),
    yieldStressPa: parseFloat(yieldStress.toFixed(2))
  };
}

/**
 * Calculates high-pressure water jet cutting & liquefaction
 */
export function calculateJetFluidization(
  jetPressureBar: number,
  maceratorRpm: number,
  solidsPct: number,
  crustThicknessM: number
): {
  erosionRateM3h: number;
  torqueNm: number;
  liquefactionSpeedPctPerSec: number;
} {
  if (jetPressureBar <= 5) {
    return { erosionRateM3h: 0, torqueNm: 0, liquefactionSpeedPctPerSec: 0 };
  }

  // Jet power = Pressure (Pa) * Flow (m^3/s)
  // At 50 bar with dual 1.8mm nozzles, flow is ~22 L/min
  const jetFlowM3s = (22 / 60) * 0.001 * Math.sqrt(jetPressureBar / 50);
  const jetPressurePa = jetPressureBar * 1e5;
  const hydraulicWatts = jetPressurePa * jetFlowM3s;

  // Specific energy for sludge cake erosion (~15 kJ/m^3)
  const specificEnergyJm3 = 18000 * (1 + solidsPct / 20);
  const erosionRateM3h = (hydraulicWatts / specificEnergyJm3) * 3600;

  // Macerator torque load
  const torqueNm = (maceratorRpm / 1450) * 18.5 * (1 + solidsPct / 15);

  // Liquefaction speed in percent per second
  const liquefactionSpeedPctPerSec = (erosionRateM3h / (crustThicknessM * 8.0)) * 1.8;

  return {
    erosionRateM3h: parseFloat(erosionRateM3h.toFixed(2)),
    torqueNm: parseFloat(torqueNm.toFixed(1)),
    liquefactionSpeedPctPerSec: parseFloat(liquefactionSpeedPctPerSec.toFixed(2))
  };
}

/**
 * Calculates vacuum pump suction hydraulics, head loss, and cavitation (NPSHa vs NPSHr)
 */
export function calculateSuctionHydraulics(
  verticalLiftM: number,
  hoseLengthM: number,
  hoseDiameterMm: number,
  flowM3h: number,
  sludgeViscosityCp: number,
  elevationM: number,
  temperatureC: number
): {
  frictionHeadM: number;
  totalDynamicHeadM: number;
  hydraulicPowerKw: number;
  npshaM: number;
  npshrM: number;
  isCavitating: boolean;
} {
  // Atmospheric barometric pressure vs elevation (barometric formula)
  const pAtmPa = 101325 * Math.pow(1 - (0.0065 * elevationM) / 288.15, 5.255);
  const pAtmHeadM = pAtmPa / (1050 * 9.81); // Sludge density ~1050 kg/m^3

  // Water vapor pressure head at temperature
  const pVaporPa = 610.78 * Math.exp((17.27 * temperatureC) / (temperatureC + 237.3));
  const pVaporHeadM = pVaporPa / (1050 * 9.81);

  // Velocity in suction hose
  const hoseRadiusM = (hoseDiameterMm / 2) / 1000;
  const hoseAreaM2 = Math.PI * hoseRadiusM * hoseRadiusM;
  const flowM3s = flowM3h / 3600;
  const velocityMps = flowM3s / hoseAreaM2;

  // Sludge dynamic viscosity & Reynolds number
  const densityKgM3 = 1050;
  const muPaS = sludgeViscosityCp * 0.001;
  const reynolds = (densityKgM3 * velocityMps * (hoseDiameterMm / 1000)) / Math.max(0.001, muPaS);

  // Friction factor
  let f = 0.04;
  if (reynolds < 2300) {
    f = 64 / Math.max(1, reynolds);
  } else {
    f = 0.316 / Math.pow(reynolds, 0.25);
  }
  // Corrugated hose roughness factor
  f = Math.min(0.25, Math.max(0.035, f * 1.6));

  // Darcy-Weisbach head loss
  const frictionHeadM = (f * (hoseLengthM / (hoseDiameterMm / 1000)) * (velocityMps * velocityMps)) / (2 * 9.81);
  const velocityHeadM = (velocityMps * velocityMps) / (2 * 9.81);
  const totalDynamicHeadM = verticalLiftM + frictionHeadM + velocityHeadM;

  // Hydraulic power (kW)
  const hydraulicPowerKw = (densityKgM3 * 9.81 * flowM3s * totalDynamicHeadM) / (1000 * 0.72); // 72% pump eff

  // NPSHa = Atmospheric Head - Vapor Head - Vertical Suction Lift - Suction Friction
  const npshaM = Math.max(0, pAtmHeadM - pVaporHeadM - verticalLiftM - frictionHeadM);
  // Vacuum pump NPSHr typical requirement ~2.2m
  const npshrM = 2.2 + 0.15 * Math.pow(flowM3h / 20, 1.5);
  const isCavitating = npshaM < npshrM;

  return {
    frictionHeadM: parseFloat(frictionHeadM.toFixed(2)),
    totalDynamicHeadM: parseFloat(totalDynamicHeadM.toFixed(2)),
    hydraulicPowerKw: parseFloat(hydraulicPowerKw.toFixed(2)),
    npshaM: parseFloat(npshaM.toFixed(2)),
    npshrM: parseFloat(npshrM.toFixed(2)),
    isCavitating
  };
}

/**
 * Step simulation for 4-Gas atmospheric concentration inside confined vault
 * Dynamic differential equation with forced ventilation dilution.
 */
export function stepGasAtmosphere(
  prev: { h2s: number; ch4: number; co: number; o2: number },
  isVentilating: boolean,
  ventCfm: number,
  deltaSec: number,
  isAgitated: boolean
): {
  h2s: number;
  ch4: number;
  co: number;
  o2: number;
  hazardLevel: 'SAFE' | 'CAUTION' | 'CRITICAL_ALARM';
  alarmMessage: string;
} {
  const vaultVolM3 = 24.0; // 4.2m x 2.4m x 2.4m vault
  const ventM3s = isVentilating ? (ventCfm * 0.0004719) : 0;
  const dilutionFraction = Math.min(0.95, (ventM3s / vaultVolM3) * deltaSec);

  // Emission generation rates (agitation by water jet increases gas release by 3.5x!)
  const agitationMultiplier = isAgitated ? 3.5 : 1.0;
  const h2sGenRate = 0.45 * agitationMultiplier; // ppm/s
  const ch4GenRate = 0.025 * agitationMultiplier; // %/s
  const coGenRate = 0.2 * agitationMultiplier; // ppm/s
  const o2DepletionRate = 0.015 * agitationMultiplier; // %/s

  let newH2s = prev.h2s + h2sGenRate * deltaSec;
  let newCh4 = prev.ch4 + ch4GenRate * deltaSec;
  let newCo = prev.co + coGenRate * deltaSec;
  let newO2 = prev.o2 - o2DepletionRate * deltaSec;

  // Apply ventilation dilution toward ambient clean air:
  // Ambient: H2S = 0, CH4 = 0, CO = 0, O2 = 20.9%
  if (isVentilating && dilutionFraction > 0) {
    newH2s = newH2s * (1 - dilutionFraction);
    newCh4 = newCh4 * (1 - dilutionFraction);
    newCo = newCo * (1 - dilutionFraction);
    newO2 = newO2 + (20.9 - newO2) * dilutionFraction;
  }

  // Clamps
  newH2s = Math.max(0, Math.min(150, newH2s));
  newCh4 = Math.max(0, Math.min(15.0, newCh4));
  newCo = Math.max(0, Math.min(250, newCo));
  newO2 = Math.max(12.0, Math.min(20.9, newO2));

  // Determine OSHA Hazard Level
  let hazardLevel: 'SAFE' | 'CAUTION' | 'CRITICAL_ALARM' = 'SAFE';
  let alarmMessage = 'ATMOSPHERE NORMAL - CONFINED SPACE PROTOCOL ACTIVE';

  if (
    newH2s >= OSHA_THRESHOLDS.H2S.PEL_LIMIT ||
    newCh4 >= OSHA_THRESHOLDS.CH4.WARNING_LEL ||
    newCo >= OSHA_THRESHOLDS.CO.PEL_LIMIT ||
    newO2 < OSHA_THRESHOLDS.O2.MIN_BREATHABLE
  ) {
    hazardLevel = 'CAUTION';
    alarmMessage = 'WARNING: GAS LEVELS APPROACHING OSHA EXPOSURE LIMIT';
  }

  if (
    newH2s >= OSHA_THRESHOLDS.H2S.IDLH_DEADLY ||
    newCh4 >= OSHA_THRESHOLDS.CH4.EXPLOSIVE_LEL ||
    newCo >= OSHA_THRESHOLDS.CO.IDLH_LIMIT ||
    newO2 <= OSHA_THRESHOLDS.O2.FATAL_HYPOXIA
  ) {
    hazardLevel = 'CRITICAL_ALARM';
    alarmMessage = 'DANGER: EVACUATE IMMEDIATELY! TOXIC/EXPLOSIVE HAZARD';
  }

  return {
    h2s: parseFloat(newH2s.toFixed(1)),
    ch4: parseFloat(newCh4.toFixed(2)),
    co: parseFloat(newCo.toFixed(1)),
    o2: parseFloat(newO2.toFixed(1)),
    hazardLevel,
    alarmMessage
  };
}
