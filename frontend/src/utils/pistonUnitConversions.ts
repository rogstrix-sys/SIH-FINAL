/**
 * Explicit Piston Unit Conversions & Coordinate Mapping
 * Bridges the Bhavyam SCADA Dashboard with the 3D Desludging Digital Twin
 *
 * Single Source of Truth:
 * - Normalized range: 0.0 to 1.0
 * - Dashboard range: 0% to 100%
 * - Cylinder stroke: 0 mm (retracted/transport home) to 600 mm (max extension)
 * - Three.js platen coordinate: +0.38 m (top home) down to -0.22 m (full stroke)
 */

export interface PistonKinematics {
  strokeNormalized: number;  // 0.0 to 1.0
  strokePct: number;         // 0 to 100%
  strokeMm: number;          // 0 to strokeMaxMm
  strokeM: number;           // 0 to strokeMaxMm / 1000
  platenY: number;           // +0.38m to -0.22m (Three.js local tank Y)
  rodLengthM: number;        // Dynamic rod length in meters
  rodCenterY: number;        // Three.js local Y center for rod mesh
  appliedPressureBar: number;// Hydraulic pressure in bar (0.2 to 3.5 bar normal)
  compactionForceKn: number; // Compaction thrust in kN (1.2 to 12.8 kN normal, 203.6 kN relief)
  solidsConcentrationPct: number; // Total solids % (4.2% raw to 22.8% cake)
  volumeReductionPct: number;     // Liquid reduction % (0% to 68%)
}

export const PISTON_CONFIG = {
  strokeMinMm: 0,
  strokeMaxMm: 600,
  platenHomeY: 0.38,         // Tank coordinate when stroke = 0 mm
  cylinderBaseY: 0.54,       // Bottom flange of hydraulic cylinder barrel
  platenThicknessM: 0.05,    // 50 mm plate + sieve
  boreDiameterMm: 120,       // 120 mm hydraulic bore
  rodDiameterMm: 60,         // 60 mm hard chrome rod
  reliefPressureBar: 180,    // Main hydraulic relief valve trip point
  nominalRawSolidsPct: 4.2,  // Raw septic sludge total solids %
  maxCompactedSolidsPct: 22.8,// Consolidated cake total solids %
  maxFiltrateExpulsionPct: 68 // % water expressed at full stroke
};

/**
 * Clamp a number between min and max bounds.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Convert dashboard percentage (0-100%) to normalized displacement (0.0-1.0).
 */
export function pctToNormalized(pct: number): number {
  return clamp(pct, 0, 100) / 100;
}

/**
 * Convert normalized displacement (0.0-1.0) to dashboard percentage (0-100%).
 */
export function normalizedToPct(norm: number): number {
  return clamp(norm, 0, 1) * 100;
}

/**
 * Convert dashboard percentage (0-100%) to physical cylinder stroke (mm).
 */
export function pctToStrokeMm(pct: number, maxStrokeMm = PISTON_CONFIG.strokeMaxMm): number {
  const norm = pctToNormalized(pct);
  return Math.round(norm * maxStrokeMm);
}

/**
 * Convert physical cylinder stroke (mm) to dashboard percentage (0-100%).
 */
export function strokeMmToPct(strokeMm: number, maxStrokeMm = PISTON_CONFIG.strokeMaxMm): number {
  if (maxStrokeMm <= 0) return 0;
  const ratio = clamp(strokeMm, 0, maxStrokeMm) / maxStrokeMm;
  return Math.round(ratio * 100);
}

/**
 * Convert cylinder stroke (mm) to Three.js platen Y position in meters.
 */
export function strokeMmToPlatenY(strokeMm: number, maxStrokeMm = PISTON_CONFIG.strokeMaxMm): number {
  const clampedMm = clamp(strokeMm, 0, maxStrokeMm);
  const strokeM = clampedMm / 1000;
  return PISTON_CONFIG.platenHomeY - strokeM;
}

/**
 * Convert Three.js platen Y position back to cylinder stroke (mm).
 */
export function platenYToStrokeMm(platenY: number, maxStrokeMm = PISTON_CONFIG.strokeMaxMm): number {
  const strokeM = PISTON_CONFIG.platenHomeY - platenY;
  const strokeMm = strokeM * 1000;
  return Math.round(clamp(strokeMm, 0, maxStrokeMm));
}

/**
 * Derive full kinematics and hydraulic metrics for a given stroke (mm or %).
 */
export function calculatePistonKinematics(
  strokeInput: { strokeMm?: number; strokePct?: number },
  maxStrokeMm = PISTON_CONFIG.strokeMaxMm
): PistonKinematics {
  let strokeMm = 0;
  let strokePct = 0;

  if (typeof strokeInput.strokeMm === 'number') {
    strokeMm = clamp(strokeInput.strokeMm, 0, maxStrokeMm);
    strokePct = strokeMmToPct(strokeMm, maxStrokeMm);
  } else if (typeof strokeInput.strokePct === 'number') {
    strokePct = clamp(strokeInput.strokePct, 0, 100);
    strokeMm = pctToStrokeMm(strokePct, maxStrokeMm);
  }

  const strokeNormalized = strokePct / 100;
  const strokeM = strokeMm / 1000;
  const platenY = PISTON_CONFIG.platenHomeY - strokeM;

  const platenTopY = platenY + 0.025;
  const rodLengthM = Math.max(0.03, PISTON_CONFIG.cylinderBaseY - platenTopY);
  const rodCenterY = PISTON_CONFIG.cylinderBaseY - rodLengthM / 2;

  // Multi-physics hydraulic pressures & forces (calibrated with Bhavyam SCADA)
  const appliedPressureBar = Number((0.2 + strokeNormalized * 3.3).toFixed(1));
  const compactionForceKn = Number((1.2 + strokeNormalized * 11.6).toFixed(1));

  // Sludge dewatering consolidation metrics
  const solidsConcentrationPct = Number(
    (PISTON_CONFIG.nominalRawSolidsPct + strokeNormalized * (PISTON_CONFIG.maxCompactedSolidsPct - PISTON_CONFIG.nominalRawSolidsPct)).toFixed(1)
  );
  const volumeReductionPct = Number((strokeNormalized * PISTON_CONFIG.maxFiltrateExpulsionPct).toFixed(1));

  return {
    strokeNormalized,
    strokePct,
    strokeMm,
    strokeM,
    platenY,
    rodLengthM,
    rodCenterY,
    appliedPressureBar,
    compactionForceKn,
    solidsConcentrationPct,
    volumeReductionPct
  };
}
