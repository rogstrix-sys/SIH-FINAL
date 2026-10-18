import React, { useState } from 'react';
import {
  Mountain,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Scale,
  Ruler,
  Gauge,
  Compass,
  Layers,
  Thermometer,
  Clock,
  Zap,
  Split,
  TableProperties,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { TerrainScenarioId } from '../types/terrainScenarios';
import {
  evaluateAllScenariosComparison,
  compareDesludgingTasks,
  TERRAIN_SCENARIOS
} from '../simulation/terrainFeasibilityModel';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export interface TerrainComparisonPanelProps {
  onClose?: () => void;
}

export const TerrainComparisonPanel: React.FC<TerrainComparisonPanelProps> = ({ onClose }) => {
  const selectedScenario = useSimulationStore((s) => s.selectedScenario);
  const setTerrainScenario = useSimulationStore((s) => s.setTerrainScenario);
  const stabilizerExtension = useSimulationStore((s) => s.kinematics.stabilizerExtension);
  const parameters = useSimulationStore((s) => s.parameters);
  const engineParams = useSimulationStore((s) => s.engine.parameters);

  // Tab mode: 'pair' for Baseline vs Comparison, 'matrix' for All 6 Scenarios
  const [panelMode, setPanelMode] = useState<'pair' | 'matrix'>('pair');

  // Baseline and Comparison selection
  const [baselineId, setBaselineId] = useState<TerrainScenarioId>('level_paved');
  const [comparisonId, setComparisonId] = useState<TerrainScenarioId>(
    selectedScenario !== 'level_paved' ? selectedScenario : 'hilly_sloped'
  );

  // Evaluate baseline vs comparison under consistent task constraints
  const dualComparison = compareDesludgingTasks(baselineId, comparisonId, {
    taskVolumeL: engineParams.targetExtractionVolumeL,
    initialVaultVolumeL: engineParams.initialSourceVolumeL,
    pumpRpm: parameters.pumpRpm,
    hoseDiameterMm: parameters.hoseDiameterMm,
    slurryDensityKgM3: parameters.slurryDensityKgM3,
    baseViscosityCp: parameters.slurryViscosityCp,
    stabilizerExtension
  });

  // Evaluate matrix across all 6 scenarios
  const comparisonItems = evaluateAllScenariosComparison(
    stabilizerExtension,
    parameters.hoseLengthM,
    parameters.slurryDensityKgM3,
    parameters.slurryViscosityCp,
    parameters.hoseDiameterMm
  );

  const scenarioOptions: { id: TerrainScenarioId; label: string }[] = [
    { id: 'level_paved', label: '1. Level Paved Access' },
    { id: 'hilly_sloped', label: '2. Hilly & Sloped (14°)' },
    { id: 'uneven_muddy', label: '3. Uneven Muddy Terrain' },
    { id: 'narrow_restricted', label: '4. Narrow Alley Access (1.6m)' },
    { id: 'heavy_rain', label: '5. Heavy Rain & Pit Inundation' },
    { id: 'cold_high_altitude', label: '6. High Altitude Alpine (-8°C)' }
  ];

  const ratingBadge = (rating: 'FEASIBLE' | 'CONDITIONAL' | 'HIGH_RISK') => {
    switch (rating) {
      case 'FEASIBLE':
        return 'border-emerald-600 bg-emerald-950/40 text-emerald-400';
      case 'CONDITIONAL':
        return 'border-amber-600 bg-amber-950/40 text-amber-300';
      case 'HIGH_RISK':
        return 'border-rose-600 bg-rose-950/40 text-rose-300 animate-pulse';
    }
  };

  return (
    <div className="bg-graphite-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 text-xs select-none">
      {/* 1. Header & View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Mountain className="w-5 h-5 text-safety-500" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Operating Scenario Engineering Comparison
              </h3>
              <Badge variant="cyan" size="sm">
                PHYSICS COMPARATOR
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Side-by-side comparative analysis of access feasibility, duration, power demand, and hose routing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-graphite-950 p-0.5 rounded-lg border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setPanelMode('pair')}
              className={`px-3 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition ${
                panelMode === 'pair'
                  ? 'bg-safety-500 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              Baseline vs Comparison Pair
            </button>
            <button
              onClick={() => setPanelMode('matrix')}
              className={`px-3 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition ${
                panelMode === 'matrix'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              All 6 Environments Matrix
            </button>
          </div>

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white text-xs">
              ✕ Close
            </Button>
          )}
        </div>
      </div>

      {/* 2. Common Starting Conditions & Consistent Task Ribbon */}
      <div className="bg-graphite-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-safety-400 font-bold uppercase">Standardized Desludging Task:</span>
          <span>Target Batch: <strong className="text-white">{dualComparison.taskVolumeL} L</strong></span>
          <span className="text-slate-600">|</span>
          <span>Vault Initial: <strong className="text-white">{dualComparison.initialVaultVolumeL} L</strong></span>
          <span className="text-slate-600">|</span>
          <span>Slurry Density: <strong className="text-white">{dualComparison.sludgeDensityKgM3} kg/m³</strong></span>
          <span className="text-slate-600">|</span>
          <span>Hose Conduit: <strong className="text-white">Ø{parameters.hoseDiameterMm}mm</strong></span>
        </div>
        <div className="text-[10px] text-slate-400 italic">
          * Equations enforce identical mass balance and Swamee-Jain friction approximations
        </div>
      </div>

      {panelMode === 'pair' ? (
        /* ========================================================================= */
        /* TAB 1: BASELINE VS COMPARISON DETAILED COMPARATIVE BREAKDOWN               */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Selectors Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Baseline Selector */}
            <div className="bg-graphite-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center justify-between">
                <span>Configuration A: Baseline Operating Scenario</span>
                <span className="text-emerald-400">REFERENCE DATUM</span>
              </label>
              <select
                value={baselineId}
                onChange={(e) => setBaselineId(e.target.value as TerrainScenarioId)}
                className="bg-graphite-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-safety-500 focus:outline-none"
              >
                {scenarioOptions.map((opt) => (
                  <option key={`base-${opt.id}`} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Comparison Selector */}
            <div className="bg-graphite-950 p-3 rounded-xl border border-safety-500/40 flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-safety-400 font-mono flex items-center justify-between">
                <span>Configuration B: Challenging Field Scenario</span>
                <span className="text-safety-400">PROPOSED VARIANT</span>
              </label>
              <select
                value={comparisonId}
                onChange={(e) => setComparisonId(e.target.value as TerrainScenarioId)}
                className="bg-graphite-900 border border-safety-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-safety-500 focus:outline-none"
              >
                {scenarioOptions.map((opt) => (
                  <option key={`comp-${opt.id}`} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparative Metrics Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left font-mono text-[11px] border-collapse">
              <thead>
                <tr className="bg-graphite-950 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="p-2.5 w-1/3">Engineering Dimension / Metric</th>
                  <th className="p-2.5 w-1/4 text-emerald-300">Baseline ({dualComparison.baseline.scenarioName})</th>
                  <th className="p-2.5 w-1/4 text-safety-300">Comparison ({dualComparison.comparison.scenarioName})</th>
                  <th className="p-2.5 w-1/6 text-right">Variance / Delta (Δ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-graphite-900/60">
                {/* Section 1: Access Feasibility & Stability */}
                <tr className="bg-graphite-950/80 font-bold text-slate-200">
                  <td colSpan={4} className="p-2 text-[10px] uppercase tracking-wider text-safety-400">
                    1. Site Accessibility & Chassis Stability
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">Terrain Slope Angle</td>
                  <td className="p-2.5">{dualComparison.baseline.slopeDeg.toFixed(1)}°</td>
                  <td className="p-2.5">{dualComparison.comparison.slopeDeg.toFixed(1)}°</td>
                  <td className="p-2.5 text-right font-bold text-slate-300">
                    {dualComparison.comparison.slopeDeg >= dualComparison.baseline.slopeDeg ? '+' : ''}
                    {(dualComparison.comparison.slopeDeg - dualComparison.baseline.slopeDeg).toFixed(1)}°
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">Compensated Chassis Tilt</td>
                  <td className="p-2.5">{dualComparison.baseline.effectiveTiltDeg.toFixed(1)}°</td>
                  <td className="p-2.5">
                    <span className={dualComparison.comparison.effectiveTiltDeg >= 15 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                      {dualComparison.comparison.effectiveTiltDeg.toFixed(1)}°
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    {(dualComparison.comparison.effectiveTiltDeg - dualComparison.baseline.effectiveTiltDeg).toFixed(1)}°
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">Corridor Width / Clearance</td>
                  <td className="p-2.5">{dualComparison.baseline.pathWidthM.toFixed(2)} m ({dualComparison.baseline.lateralClearanceMarginM.toFixed(2)}m/side)</td>
                  <td className="p-2.5">{dualComparison.comparison.pathWidthM.toFixed(2)} m ({dualComparison.comparison.lateralClearanceMarginM.toFixed(2)}m/side)</td>
                  <td className="p-2.5 text-right">
                    {(dualComparison.comparison.lateralClearanceMarginM - dualComparison.baseline.lateralClearanceMarginM).toFixed(2)} m
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">Access Feasibility Rating</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${ratingBadge(dualComparison.baseline.feasibilityRating)}`}>
                      {dualComparison.baseline.feasibilityRating}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${ratingBadge(dualComparison.comparison.feasibilityRating)}`}>
                      {dualComparison.comparison.feasibilityRating}
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    {dualComparison.comparison.feasibilityRating === dualComparison.baseline.feasibilityRating ? (
                      <span className="text-slate-400">Equivalent</span>
                    ) : (
                      <span className="text-amber-400 font-bold">Derated</span>
                    )}
                  </td>
                </tr>

                {/* Section 2: Flow & Duration */}
                <tr className="bg-graphite-950/80 font-bold text-slate-200">
                  <td colSpan={4} className="p-2 text-[10px] uppercase tracking-wider text-cyan-400">
                    2. Hydraulic Flow Rate & Batch Extraction Duration
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">Effective Rheology / Viscosity</td>
                  <td className="p-2.5">{dualComparison.baseline.effectiveViscosityCp.toFixed(0)} cP</td>
                  <td className="p-2.5">{dualComparison.comparison.effectiveViscosityCp.toFixed(0)} cP</td>
                  <td className="p-2.5 text-right">
                    {dualComparison.comparison.effectiveViscosityCp >= dualComparison.baseline.effectiveViscosityCp ? '+' : ''}
                    {(dualComparison.comparison.effectiveViscosityCp - dualComparison.baseline.effectiveViscosityCp).toFixed(0)} cP
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">Operating Flow Rate</td>
                  <td className="p-2.5 font-bold text-white">{dualComparison.baseline.flowRateLpm.toFixed(1)} L/min</td>
                  <td className="p-2.5 font-bold text-white">{dualComparison.comparison.flowRateLpm.toFixed(1)} L/min</td>
                  <td className="p-2.5 text-right font-bold">
                    <span className={dualComparison.comparison.flowRateLpm < dualComparison.baseline.flowRateLpm ? 'text-amber-400' : 'text-emerald-400'}>
                      {(dualComparison.comparison.flowRateLpm - dualComparison.baseline.flowRateLpm).toFixed(1)} L/min
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">Estimated Extraction Duration</td>
                  <td className="p-2.5 font-bold text-emerald-400">{dualComparison.baseline.extractionDurationFormatted}</td>
                  <td className="p-2.5 font-bold text-safety-400">{dualComparison.comparison.extractionDurationFormatted}</td>
                  <td className="p-2.5 text-right font-bold">
                    <span className={dualComparison.deltaDurationSec > 0 ? 'text-rose-400 flex items-center justify-end gap-1' : 'text-emerald-400'}>
                      {dualComparison.deltaDurationSec > 0 && <ArrowUpRight className="w-3.5 h-3.5 inline" />}
                      {dualComparison.deltaDurationFormatted}
                    </span>
                  </td>
                </tr>

                {/* Section 3: Power & Energy Demand */}
                <tr className="bg-graphite-950/80 font-bold text-slate-200">
                  <td colSpan={4} className="p-2 text-[10px] uppercase tracking-wider text-yellow-400">
                    3. Power Demand & Cumulative Energy Consumption
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">Total Piping Routing Loss</td>
                  <td className="p-2.5">{dualComparison.baseline.totalRoutingLossKpa.toFixed(1)} kPa</td>
                  <td className="p-2.5">{dualComparison.comparison.totalRoutingLossKpa.toFixed(1)} kPa</td>
                  <td className="p-2.5 text-right font-bold">
                    {dualComparison.deltaLossKpa >= 0 ? `+${dualComparison.deltaLossKpa}` : dualComparison.deltaLossKpa} kPa
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">Total Energy Consumption</td>
                  <td className="p-2.5 font-bold text-white">{dualComparison.baseline.estimatedEnergyKwh.toFixed(3)} kWh</td>
                  <td className="p-2.5 font-bold text-white">{dualComparison.comparison.estimatedEnergyKwh.toFixed(3)} kWh</td>
                  <td className="p-2.5 text-right font-bold">
                    <span className={dualComparison.deltaEnergyKwh > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {dualComparison.deltaEnergyKwh >= 0 ? '+' : ''}{dualComparison.deltaEnergyKwh} kWh ({dualComparison.deltaEnergyPct >= 0 ? '+' : ''}{dualComparison.deltaEnergyPct}%)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">Specific Energy Demand</td>
                  <td className="p-2.5">{dualComparison.baseline.specificEnergyKwhM3.toFixed(2)} kWh/m³</td>
                  <td className="p-2.5">{dualComparison.comparison.specificEnergyKwhM3.toFixed(2)} kWh/m³</td>
                  <td className="p-2.5 text-right">
                    {(dualComparison.comparison.specificEnergyKwhM3 - dualComparison.baseline.specificEnergyKwhM3).toFixed(2)} kWh/m³
                  </td>
                </tr>

                {/* Section 4: Hose Conduit Requirements */}
                <tr className="bg-graphite-950/80 font-bold text-slate-200">
                  <td colSpan={4} className="p-2 text-[10px] uppercase tracking-wider text-purple-400">
                    4. Hose Conduit & Routing Requirements
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">Required Hose Routing Length</td>
                  <td className="p-2.5">{dualComparison.baseline.requiredHoseM} m</td>
                  <td className="p-2.5">{dualComparison.comparison.requiredHoseM} m</td>
                  <td className="p-2.5 text-right">
                    {dualComparison.comparison.requiredHoseM - dualComparison.baseline.requiredHoseM} m
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">Static Suction Lift Head</td>
                  <td className="p-2.5">{dualComparison.baseline.elevationDiffM.toFixed(1)} m</td>
                  <td className="p-2.5">{dualComparison.comparison.elevationDiffM.toFixed(1)} m</td>
                  <td className="p-2.5 text-right">
                    {(dualComparison.comparison.elevationDiffM - dualComparison.baseline.elevationDiffM).toFixed(1)} m
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Warnings & Model Assumptions Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Active Warnings in Comparison Variant */}
            <div className="bg-graphite-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] font-mono uppercase">
                <AlertTriangle className="w-3.5 h-3.5" />
                Active Engineering Warnings ({dualComparison.comparison.scenarioName})
              </div>
              {dualComparison.comparison.warnings.length === 0 ? (
                <div className="text-slate-400 text-[10px] font-mono italic">
                  No active stability or hydraulic limit warnings for this scenario.
                </div>
              ) : (
                <ul className="space-y-1 text-[10px] font-mono text-amber-200/90 list-disc list-inside">
                  {dualComparison.comparison.warnings.map((w, idx) => (
                    <li key={`comp-warn-${idx}`}>{w}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Documented Hydraulic & Geotechnical Assumptions */}
            <div className="bg-graphite-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px] font-mono uppercase">
                <ShieldAlert className="w-3.5 h-3.5" />
                Documented Model Assumptions & Limitations
              </div>
              <ul className="space-y-1 text-[10px] font-mono text-slate-400 list-disc list-inside">
                {dualComparison.documentedAssumptions.slice(0, 4).map((lim, idx) => (
                  <li key={`lim-${idx}`}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Apply Action Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setTerrainScenario(comparisonId);
                if (onClose) onClose();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Load Comparison Scenario ({dualComparison.comparison.scenarioName}) in 3D Scene
            </Button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAB 2: ALL 6 SCENARIOS OVERVIEW MATRIX                                    */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {comparisonItems.map((item) => {
            const isCurrent = selectedScenario === item.id;
            const config = TERRAIN_SCENARIOS[item.id];

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-graphite-950 border-safety-500 shadow-lg shadow-safety-500/10 ring-1 ring-safety-500/30'
                    : 'bg-graphite-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs font-mono uppercase tracking-wide">
                      {item.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${ratingBadge(item.feasibilityRating)}`}>
                      {item.feasibilityRating}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-3 leading-snug">
                    {config.description}
                  </p>

                  <div className="space-y-1.5 font-mono text-[11px] bg-graphite-900/90 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-cyan-400" />
                        Terrain Slope:
                      </span>
                      <span className="font-semibold">{item.slopeDeg.toFixed(1)}°</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Ruler className="w-3 h-3 text-amber-400" />
                        Corridor Width:
                      </span>
                      <span className="font-semibold">{item.pathWidthM.toFixed(2)} m</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Scale className="w-3 h-3 text-purple-400" />
                        Effective Tilt:
                      </span>
                      <span className={`font-semibold ${item.effectiveTiltDeg >= 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.effectiveTiltDeg.toFixed(1)}°
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-sky-400" />
                        Hose Required:
                      </span>
                      <span className="font-semibold">{item.requiredHoseM} m</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-rose-400" />
                        Patm / Vacuum Limit:
                      </span>
                      <span className="font-semibold">{item.atmosphericPressureKpa} kPa</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-cyan-400" />
                        Viscosity:
                      </span>
                      <span className="font-semibold">{item.effectiveSlurryViscosityCp.toFixed(0)} cP</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[10px] font-mono mb-3">
                    <div>
                      <span className="text-slate-400 block uppercase">Primary Constraint:</span>
                      <span className="text-slate-200">{item.keyConstraint}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase">Engineering Mitigation:</span>
                      <span className="text-safety-400">{item.mitigationRecommendation}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant={isCurrent ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTerrainScenario(item.id)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  {isCurrent ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active In 3D Scene
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5" />
                      Select & Load Environment
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
