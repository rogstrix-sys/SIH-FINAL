/**
 * Engineering fluid mechanics and thermodynamic formulas
 */

export interface FluidDynamicsOutput {
  reynoldsNumber: number;
  flowRegime: 'laminar' | 'transitional' | 'turbulent';
  velocityMs: number;
  darcyFrictionFactor: number;
  frictionHeadLossM: number;
  totalDynamicHeadM: number;
  hydraulicPowerKw: number;
  motorPowerKw: number;
  cavitationRisk: number; // 0.0 to 1.0
}

/**
 * Calculates flow velocity (m/s) in pipe: v = Q / A
 * @param flowM3H Flow rate in m3/h
 * @param diameterMm Pipe inner diameter in mm
 */
export function calculateVelocity(flowM3H: number, diameterMm: number): number {
  const dM = diameterMm / 1000.0;
  const areaM2 = (Math.PI * Math.pow(dM, 2)) / 4.0;
  const flowM3S = flowM3H / 3600.0;
  return flowM3S / Math.max(0.0001, areaM2);
}

/**
 * Calculates Reynolds number: Re = (rho * v * D) / mu
 * @param densityKgM3 Slurry density (kg/m3)
 * @param velocityMs Flow velocity (m/s)
 * @param diameterMm Pipe diameter (mm)
 * @param viscosityCp Viscosity in centipoise (1 cP = 0.001 Pa.s)
 */
export function calculateReynoldsNumber(
  densityKgM3: number,
  velocityMs: number,
  diameterMm: number,
  viscosityCp: number
): number {
  const dM = diameterMm / 1000.0;
  const dynamicViscosityPaS = Math.max(0.0005, viscosityCp * 0.001);
  return (densityKgM3 * velocityMs * dM) / dynamicViscosityPaS;
}

/**
 * Calculates Darcy friction factor using Swamee-Jain equation for turbulent flow
 * and 64/Re for laminar flow.
 */
export function calculateFrictionFactor(
  reynolds: number,
  roughnessMm: number,
  diameterMm: number
): number {
  if (reynolds <= 2300) {
    return reynolds > 10 ? 64 / reynolds : 0.064;
  }
  // Swamee-Jain approximation for Colebrook-White
  const epsilonOverD = roughnessMm / diameterMm;
  const term = Math.log10(epsilonOverD / 3.7 + 5.74 / Math.pow(reynolds, 0.9));
  return 0.25 / Math.pow(term, 2);
}

/**
 * Full fluid dynamics solve for slurry extraction line
 */
export function solveFluidDynamics(params: {
  flowM3H: number;
  hoseDiameterMm: number;
  hoseLengthM: number;
  pipeRoughnessMm: number;
  slurryDensityKgM3: number;
  slurryViscosityCp: number;
  verticalLiftM: number;
  pumpEfficiency: number;
  motorEfficiency: number;
  vacuumKpa: number;
  vaporPressureKpa?: number;
}): FluidDynamicsOutput {
  const {
    flowM3H,
    hoseDiameterMm,
    hoseLengthM,
    pipeRoughnessMm,
    slurryDensityKgM3,
    slurryViscosityCp,
    verticalLiftM,
    pumpEfficiency = 0.72,
    motorEfficiency = 0.88,
    vacuumKpa,
    vaporPressureKpa = 2.34 // Water at 20 C
  } = params;

  const velocityMs = calculateVelocity(flowM3H, hoseDiameterMm);
  const reynoldsNumber = calculateReynoldsNumber(
    slurryDensityKgM3,
    velocityMs,
    hoseDiameterMm,
    slurryViscosityCp
  );

  let flowRegime: 'laminar' | 'transitional' | 'turbulent' = 'turbulent';
  if (reynoldsNumber < 2000) flowRegime = 'laminar';
  else if (reynoldsNumber <= 4000) flowRegime = 'transitional';

  const darcyFrictionFactor = calculateFrictionFactor(
    reynoldsNumber,
    pipeRoughnessMm,
    hoseDiameterMm
  );

  const g = 9.80665;
  const dM = hoseDiameterMm / 1000.0;
  
  // Minor losses (fittings, valves, entrance loss K ~ 2.5)
  const minorLossK = 2.5;
  const velocityHead = Math.pow(velocityMs, 2) / (2 * g);
  const frictionHeadLossM =
    (darcyFrictionFactor * (hoseLengthM / dM) + minorLossK) * velocityHead;

  const totalDynamicHeadM = verticalLiftM + frictionHeadLossM;

  // Power required (kW): P = (rho * g * Q * H) / (eta_pump * 1000)
  const flowM3S = flowM3H / 3600.0;
  const hydraulicPowerKw = (slurryDensityKgM3 * g * flowM3S * totalDynamicHeadM) / 1000.0;
  const motorPowerKw = hydraulicPowerKw / Math.max(0.1, pumpEfficiency * motorEfficiency);

  // Cavitation risk assessment (Net Positive Suction Head Margin)
  // NPSHa = (P_atm - P_loss - P_vapor) / (rho * g) - Lift
  // If vacuum increases towards vapor pressure, cavitation risk climbs to 1.0
  const maxSafeVacuumKpa = -82.0;
  const vacuumRatio = Math.abs(vacuumKpa) / Math.abs(maxSafeVacuumKpa);
  const velocityFactor = Math.min(1.0, velocityMs / 4.5);
  const cavitationRisk = Math.min(1.0, Math.max(0.0, vacuumRatio * 0.7 + velocityFactor * 0.3));

  return {
    reynoldsNumber: Math.round(reynoldsNumber),
    flowRegime,
    velocityMs,
    darcyFrictionFactor,
    frictionHeadLossM,
    totalDynamicHeadM,
    hydraulicPowerKw,
    motorPowerKw,
    cavitationRisk
  };
}
