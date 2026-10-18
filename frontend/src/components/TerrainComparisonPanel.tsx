import React from 'react';
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
  CloudRain
} from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { TerrainScenarioId } from '../types/terrainScenarios';
import { evaluateAllScenariosComparison, TERRAIN_SCENARIOS } from '../simulation/terrainFeasibilityModel';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export interface TerrainComparisonPanelProps {
  onClose?: () => void;
}

export const TerrainComparisonPanel: React.FC<TerrainComparisonPanelProps> = ({ onClose }) => {
  const selectedScenario = useSimulationStore((s) => s.selectedScenario);
  const setTerrainScenario = useSimulationStore((s) => s.setTerrainScenario);
  const stabilizerExtension = useSimulationStore((s) => s.kinematics.stabilizerExtension);
  const hoseLengthM = useSimulationStore((s) => s.parameters.hoseLengthM);

  // Evaluate comparison matrix across all 6 scenarios
  const comparisonItems = evaluateAllScenariosComparison(
    stabilizerExtension,
    hoseLengthM
  );

  return (
    <div className="bg-graphite-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 text-xs select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-safety-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Operating Environment Comparison & Engineering Feasibility
            </h3>
            <Badge variant="cyan" size="sm">
              6 SCENARIOS
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Comparative kinematic feasibility, barometric vacuum lift limits, temperature deratings, and stability limits.
          </p>
        </div>

        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
            ✕ Close Panel
          </Button>
        )}
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="bg-graphite-950 p-2.5 rounded-lg border border-amber-800/40 text-[10px] font-mono text-amber-300/90 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-amber-300 uppercase">Preliminary Engineering Estimate:</strong> This feasibility model provides simplified hydrostatic, barometric, and kinematic calculations for planning. It is not a certified tip-over, structural, hydraulic, or field-safety geotechnical analysis. All limits are preliminary estimates.
        </p>
      </div>

      {/* 6 Scenarios Side-By-Side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {comparisonItems.map((item) => {
          const isCurrent = selectedScenario === item.id;
          const config = TERRAIN_SCENARIOS[item.id];

          const ratingBadge = {
            FEASIBLE: 'border-emerald-600 bg-emerald-950/40 text-emerald-400',
            CONDITIONAL: 'border-amber-600 bg-amber-950/40 text-amber-300',
            HIGH_RISK: 'border-rose-600 bg-rose-950/40 text-rose-300 animate-pulse'
          }[item.feasibilityRating];

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
                {/* Title & Active Marker */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-xs font-mono uppercase tracking-wide">
                    {item.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${ratingBadge}`}>
                    {item.feasibilityRating}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mb-3 leading-snug">
                  {config.description}
                </p>

                {/* Key Metrics Matrix */}
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
                      Patm / Lift Limit:
                    </span>
                    <span className="font-semibold">{item.atmosphericPressureKpa} kPa ({item.maxAchievableSuctionLiftM}m)</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-cyan-400" />
                      Viscosity:
                    </span>
                    <span className="font-semibold">{item.effectiveSlurryViscosityCp.toFixed(0)} cP</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-yellow-400" />
                      Side Clearance:
                    </span>
                    <span className={`font-semibold ${item.clearanceMarginM < 0.2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {item.clearanceMarginM.toFixed(2)} m/side
                    </span>
                  </div>
                </div>

                {/* Constraints & Mitigations */}
                <div className="space-y-1.5 text-[10px] font-mono mb-3">
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

              {/* Action Button */}
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
    </div>
  );
};
