import React, { useState } from 'react';
import {
  Mountain,
  Compass,
  AlertTriangle,
  CheckCircle2,
  TableProperties,
  ShieldAlert,
  Ruler,
  Gauge,
  Thermometer,
  CloudRain,
  Snowflake,
  Sun,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { TerrainScenarioId } from '../../types/terrainScenarios';
import { TERRAIN_SCENARIOS, PRELIMINARY_ESTIMATE_DISCLAIMER } from '../../simulation/terrainFeasibilityModel';
import { DigitalTwinCanvas } from '../../scene/DigitalTwinCanvas';
import { TerrainComparisonPanel } from '../TerrainComparisonPanel';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const TerrainScenariosView: React.FC = () => {
  const selectedScenario = useSimulationStore((s) => s.selectedScenario);
  const setTerrainScenario = useSimulationStore((s) => s.setTerrainScenario);
  const terrainParams = useSimulationStore((s) => s.terrainParams);
  const feasibility = useSimulationStore((s) => s.feasibility);
  const kinematics = useSimulationStore((s) => s.kinematics);
  const parameters = useSimulationStore((s) => s.parameters);
  const [showComparison, setShowComparison] = useState(false);

  // Climatic zone state overlay
  const [activeClimateZone, setActiveClimateZone] = useState<'himalayan' | 'western_ghats' | 'arid' | 'standard'>('standard');

  const climatePresets = [
    {
      id: 'standard',
      name: 'Standard Temperate',
      temp: '18°C',
      viscosity: '450 cP',
      icon: Sun,
      color: 'text-amber-400',
      desc: 'Baseline municipal condition with standard septage consistency.'
    },
    {
      id: 'himalayan',
      name: 'Himalayan Cold Zone',
      temp: '-6°C',
      viscosity: '1,450 cP',
      icon: Snowflake,
      color: 'text-cyan-300',
      desc: 'Freezing mountain altitude, stiffened boundary layer, requires auxiliary jetting heat.'
    },
    {
      id: 'western_ghats',
      name: 'High-Rainfall Coastal',
      temp: '26°C',
      viscosity: '280 cP',
      icon: CloudRain,
      color: 'text-blue-400',
      desc: 'Monsoon saturated soil, lower sludge viscosity, high ground slip and liquefaction risk.'
    },
    {
      id: 'arid',
      name: 'Arid High Heat Zone',
      temp: '44°C',
      viscosity: '820 cP',
      icon: Thermometer,
      color: 'text-rose-400',
      desc: 'Extreme desert ambient, rapid crusting, high explosive gas (CH4/H2S) volatilization.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 gap-5 overflow-y-auto select-none bg-graphite-950">
      {/* Top Banner: SIH 26258 Problem Statement Context */}
      <div className="bg-graphite-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Mountain className="w-5 h-5 text-safety-500" />
            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-mono">
              Climatic Zones & Hilly Terrain Feasibility Model
            </h2>
            <Badge variant="safety" size="sm">
              SIH 26258
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Real-time evaluation of machine stability, ground clearance, required umbilical hose routing,
            and hydraulic head losses across steep mountain slopes, tight alleyways, and extreme weather regimes.
          </p>
        </div>

        <Button
          variant={showComparison ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowComparison(!showComparison)}
          className="font-mono text-xs flex items-center gap-1.5 shrink-0"
        >
          <TableProperties className="w-4 h-4" />
          {showComparison ? 'Hide Comparison Matrix' : 'Compare 3 Operating Terrains'}
        </Button>
      </div>

      {/* Comparison Drawer Modal when opened */}
      {showComparison && (
        <TerrainComparisonPanel onClose={() => setShowComparison(false)} />
      )}

      {/* Terrain Scenario Selector Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(
          [
            {
              id: 'level_paved',
              title: '1. Level Paved Access',
              grade: '1.5° Slope',
              clearance: '3.8m Path Width',
              desc: 'Standard urban street and paved driveway. Wide clearance, nominal hose run.'
            },
            {
              id: 'hilly_sloped',
              title: '2. Sloped & Uneven Hilly',
              grade: '14.0° Mountain Grade',
              clearance: '2.8m Rough Ground',
              desc: 'Steep hill approach with loose rocky scree. Outrigger cribbing and stabilization mandatory.'
            },
            {
              id: 'narrow_restricted',
              title: '3. Narrow Access Alley',
              grade: '3.5° Restricted Alley',
              clearance: '1.65m Confined Corridor',
              desc: 'Historic dense urban corridor with flanking building walls. Minimum 0.15m side clearance.'
            }
          ] as const
        ).map((t) => {
          const isSelected = selectedScenario === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTerrainScenario(t.id as TerrainScenarioId)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-graphite-850 border-safety-500 shadow-md ring-1 ring-safety-500/40 text-white'
                  : 'bg-graphite-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs font-bold ${isSelected ? 'text-safety-400' : 'text-slate-300'}`}>
                  {t.title}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-safety-500 animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-graphite-950 border border-slate-800 text-slate-300">
                  {t.grade}
                </span>
                <span className="px-2 py-0.5 rounded bg-graphite-950 border border-slate-800 text-slate-300">
                  {t.clearance}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                {t.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Content Grid: 3D Terrain Viewport + Live Feasibility Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 3D Digital Twin Terrain Viewport (7 Cols) */}
        <div className="lg:col-span-7 bg-graphite-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[520px]">
          <div className="bg-graphite-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 text-slate-300 font-bold">
              <Compass className="w-4 h-4 text-safety-500" />
              Interactive 3D Ground & Staging Simulation
            </span>
            <span className="text-[11px] text-slate-400">
              Scenario: <strong className="text-safety-400 uppercase">{selectedScenario.replace('_', ' ')}</strong>
            </span>
          </div>

          <div className="flex-1 relative bg-graphite-950">
            <DigitalTwinCanvas />
            {/* Overlay pill indicator */}
            <div className="absolute bottom-3 left-3 bg-graphite-900/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Chassis Tilt: {feasibility.effectiveTiltDeg.toFixed(1)}° | Stabilizers: {(kinematics.stabilizerExtension * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mathematical Feasibility & Safety Indicators (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Engineering Feasibility Status Card */}
          <Card title="Live Kinematic Feasibility Estimates">
            <div className="space-y-3 font-mono text-xs">
              {/* Warnings Box if limits triggered */}
              {feasibility.warnings.length > 0 ? (
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-600/50 text-amber-300 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 uppercase text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Operational Limits Alert ({feasibility.warnings.length})
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 pl-1">
                    {feasibility.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Staging parameters within preliminary safety envelopes.</span>
                </div>
              )}

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Effective Tilt</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {feasibility.effectiveTiltDeg.toFixed(1)}°
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Roll: {feasibility.chassisRollDeg.toFixed(1)}° | Pitch: {feasibility.chassisPitchDeg.toFixed(1)}°
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Hose Route Required</div>
                  <div className="text-base font-bold text-cyan-400 mt-0.5">
                    {feasibility.requiredHoseLengthM.toFixed(1)} m
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Configured: {parameters.hoseLengthM} m
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Static Lift Head</div>
                  <div className="text-base font-bold text-amber-400 mt-0.5">
                    {feasibility.staticHeadLossKpa.toFixed(1)} kPa
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Elev Diff: {feasibility.verticalElevationDiffM.toFixed(1)} m
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Lateral Margin</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {feasibility.lateralClearanceMarginM.toFixed(2)} m
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Per Side Clearance
                  </div>
                </div>
              </div>

              {/* Total Head Loss Summary */}
              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Total Routing Friction + Static Head:</span>
                  <div className="text-sm font-bold text-white">
                    {feasibility.totalRoutingLossKpa.toFixed(1)} kPa
                  </div>
                </div>
                <Badge variant={feasibility.totalRoutingLossKpa > 50 ? 'warning' : 'success'} size="sm">
                  {feasibility.totalRoutingLossKpa > 50 ? 'HIGH VACUUM DEMAND' : 'NOMINAL HEAD'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Climatic Zone Profiles Selector */}
          <Card title="SIH Varied Climatic Zones Simulation">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {climatePresets.map((cz) => {
                  const Icon = cz.icon;
                  const isActive = activeClimateZone === cz.id;
                  return (
                    <button
                      key={cz.id}
                      onClick={() => setActiveClimateZone(cz.id as any)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        isActive
                          ? 'bg-graphite-850 border-cyan-500 shadow-sm text-white'
                          : 'bg-graphite-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${cz.color}`} />
                        <span className="font-mono text-xs font-bold truncate">{cz.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                        <span>{cz.temp}</span>
                        <span>{cz.viscosity}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800 text-[11px] text-slate-300 font-mono">
                <span className="text-safety-400 font-bold uppercase">Selected Regime: </span>
                {climatePresets.find((c) => c.id === activeClimateZone)?.desc}
              </div>
            </div>
          </Card>

          {/* Pending Field Trials Notice Card */}
          <div className="p-3 rounded-xl bg-graphite-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 uppercase">Field Testing Milestone (Pending Validation):</span>
              <p className="mt-0.5 text-slate-400">
                Kinematic simulation model calibrated against laboratory tilt table. On-site field deployment trials across
                Shimla/Darjeeling municipal hilly wards scheduled post-prototype assembly (TRL 6).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
