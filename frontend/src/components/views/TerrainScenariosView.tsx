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
  ArrowRight,
  RotateCcw,
  Sliders,
  Waves,
  Eye,
  Info,
  Maximize2
} from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { TerrainScenarioId } from '../../types/terrainScenarios';
import { TERRAIN_SCENARIOS, PRELIMINARY_ESTIMATE_DISCLAIMER } from '../../simulation/terrainFeasibilityModel';
import { DigitalTwinCanvas } from '../../scene/DigitalTwinCanvas';
import { TerrainComparisonPanel } from '../TerrainComparisonPanel';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';

export const TerrainScenariosView: React.FC = () => {
  const selectedScenario = useSimulationStore((s) => s.selectedScenario);
  const setTerrainScenario = useSimulationStore((s) => s.setTerrainScenario);
  const terrainParams = useSimulationStore((s) => s.terrainParams);
  const updateTerrainParams = useSimulationStore((s) => s.updateTerrainParams);
  const resetTerrainToDefault = useSimulationStore((s) => s.resetTerrainToDefault);
  const feasibility = useSimulationStore((s) => s.feasibility);
  const kinematics = useSimulationStore((s) => s.kinematics);
  const parameters = useSimulationStore((s) => s.parameters);
  const updateParameter = useSimulationStore((s) => s.updateParameter);
  const displayOptions = useSimulationStore((s) => s.displayOptions);
  const toggleDisplayOption = useSimulationStore((s) => s.toggleDisplayOption);
  const setMobilityMode = useSimulationStore((s) => s.setMobilityMode);

  const [showComparison, setShowComparison] = useState(false);
  const [showAssumptionsModal, setShowAssumptionsModal] = useState(false);

  const scenarioCards: {
    id: TerrainScenarioId;
    title: string;
    grade: string;
    highlight: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'level_paved',
      title: '1. Level Paved Access',
      grade: '1.5° Grade',
      highlight: '3.8m Path | Dry Asphalt',
      desc: 'Standard urban paved road staging. Ample clearance and direct suction umbilical run.',
      icon: Sun
    },
    {
      id: 'hilly_sloped',
      title: '2. Sloped Hilly Ground',
      grade: '14.0° Mountain Slope',
      highlight: '2.8m Width | 0.65 Scree',
      desc: 'Steep hillside gradient with loose rocky scree. Stabilizer cribbing and leveling required.',
      icon: Mountain
    },
    {
      id: 'uneven_muddy',
      title: '3. Uneven & Muddy Terrain',
      grade: '6.0° Rutted Soil',
      highlight: '0.85 Roughness | Mud Ruts',
      desc: 'Saturated mud depressions and track ruts. High sinkage and underbody ground strike risk.',
      icon: Waves
    },
    {
      id: 'narrow_restricted',
      title: '4. Narrow Access Site',
      grade: '3.5° Confined Alley',
      highlight: '1.65m Width | Masonry Walls',
      desc: 'Constrained historic building corridor. Ultra-tight 0.15m lateral margin per side.',
      icon: Ruler
    },
    {
      id: 'heavy_rain',
      title: '5. Heavy Rain Storm',
      grade: '5.0° Saturated Slope',
      highlight: '75 mm/h Rain | Wet Slick',
      desc: 'Torrential downpour with surface puddling, reduced soil adhesion, and pit runoff.',
      icon: CloudRain
    },
    {
      id: 'cold_high_altitude',
      title: '6. Cold High-Altitude',
      grade: '8.0° Alpine Grade',
      highlight: '3,200m MSL | -8°C Freezing',
      desc: 'Barometric vacuum lift drop at high altitude combined with sub-zero slurry thickening.',
      icon: Snowflake
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
              SIH 26258 | Functional Terrain & Environmental Scenario System
            </h2>
            <Badge variant="safety" size="sm">
              6 SCENARIOS
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Deterministic evaluation of machine stability, ground-clearance checks, access-width margins,
            barometric altitude lift limits, temperature-adjusted viscosity, and saturated soil traction.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAssumptionsModal(!showAssumptionsModal)}
            className="text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <Info className="w-4 h-4 text-cyan-400" />
            Model Assumptions
          </Button>

          <Button
            variant={showComparison ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-1.5"
          >
            <TableProperties className="w-4 h-4" />
            {showComparison ? 'Hide Comparison Matrix' : 'Compare 6 Environments'}
          </Button>
        </div>
      </div>

      {/* Assumptions Documentation Modal */}
      {showAssumptionsModal && (
        <div className="bg-graphite-900 border border-cyan-500/50 rounded-xl p-4 shadow-xl text-xs font-mono text-slate-300 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-400 uppercase flex items-center gap-2">
              <Info className="w-4 h-4" />
              Documented Engineering Model Equations & Uncertainty
            </span>
            <button
              onClick={() => setShowAssumptionsModal(false)}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-700"
            >
              ✕ Close
            </button>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {PRELIMINARY_ESTIMATE_DISCLAIMER}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-[11px]">
            <div className="bg-graphite-950 p-2.5 rounded border border-slate-800">
              <strong className="text-white block mb-1">1. Barometric Lift Model</strong>
              P_atm = 101.325 · (1 - 2.25577e-5 · h)^5.25588 kPa. Achievable rotary lobe vacuum = 85% of local P_atm. Max static suction lift = (0.85 · P_atm) / (ρ · g) - h_f.
            </div>
            <div className="bg-graphite-950 p-2.5 rounded border border-slate-800">
              <strong className="text-white block mb-1">2. Thermal Viscosity Model</strong>
              Andrade relation: μ(T) = μ_ref · exp(0.035 · (20 - T)). Viscosity doubles near 0°C. Purely thermodynamic estimate for non-Newtonian septage.
            </div>
            <div className="bg-graphite-950 p-2.5 rounded border border-slate-800">
              <strong className="text-white block mb-1">3. Soil Adhesion & Sinkage</strong>
              μ_traction = μ_dry · (1 - 0.45 · rain/100). Mud sinkage d_sink = min(9cm, (rain/100) · 8cm + roughness penalty). Effective clearance = nominal - obstacles - d_sink.
            </div>
          </div>
        </div>
      )}

      {/* Comparison Drawer Modal when opened */}
      {showComparison && (
        <TerrainComparisonPanel onClose={() => setShowComparison(false)} />
      )}

      {/* 6 Scenario Selectors Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {scenarioCards.map((sc) => {
          const isSelected = selectedScenario === sc.id;
          const Icon = sc.icon;
          return (
            <button
              key={sc.id}
              onClick={() => setTerrainScenario(sc.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-graphite-850 border-safety-500 shadow-md ring-1 ring-safety-500/40 text-white'
                  : 'bg-graphite-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-safety-400' : 'text-slate-400'}`} />
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-safety-500 animate-pulse" />
                  )}
                </div>
                <h4 className={`font-mono text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {sc.title}
                </h4>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  <span className="text-cyan-400 font-semibold">{sc.grade}</span>
                </div>
              </div>
              <div className="mt-2 text-[9px] font-mono text-slate-400 truncate">
                {sc.highlight}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Layout: Left (3D Canvas + Controls) & Right (Calculated Info Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 cols): 3D Viewport + Interactive Slider Inputs */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* 3D Viewport Card */}
          <div className="bg-graphite-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[480px] relative">
            {/* Viewport Top Bar */}
            <div className="bg-graphite-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs font-mono z-10">
              <span className="flex items-center gap-2 text-slate-300 font-bold">
                <Compass className="w-4 h-4 text-safety-500" />
                3D Terrain & Machine Staging View
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant={displayOptions.cutaway ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => toggleDisplayOption('cutaway')}
                  className="text-[10px] py-0.5 px-2"
                >
                  Cutaway
                </Button>
                <Button
                  variant={displayOptions.showGrid ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => toggleDisplayOption('showGrid')}
                  className="text-[10px] py-0.5 px-2"
                >
                  Grid
                </Button>
                <Button
                  variant={displayOptions.mobilityMode === 'tracks' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setMobilityMode(displayOptions.mobilityMode === 'tracks' ? 'wheels' : 'tracks')}
                  className="text-[10px] py-0.5 px-2 font-mono"
                >
                  {displayOptions.mobilityMode === 'tracks' ? 'Tracks' : 'Wheels'}
                </Button>
              </div>
            </div>

            {/* 3D Canvas */}
            <div className="flex-1 relative bg-graphite-950">
              <DigitalTwinCanvas />
              {/* Bottom HUD */}
              <div className="absolute bottom-3 left-3 bg-graphite-900/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-300 flex items-center gap-2 z-10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Tilt: {feasibility.effectiveTiltDeg.toFixed(1)}° (P {feasibility.chassisPitchDeg.toFixed(1)}° | R {feasibility.chassisRollDeg.toFixed(1)}°) | Mud: {(feasibility.mudSinkageM * 100).toFixed(1)}cm
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Terrain Parameters Sliders */}
          <Card
            title="User-Adjustable Terrain & Environmental Inputs"
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                onClick={resetTerrainToDefault}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 py-1"
                title="Reset parameters to calibrated defaults for the active scenario"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </Button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 font-mono text-xs">
              {/* 1. Slope Angle */}
              <Slider
                id="terrain-slope"
                label="Ground Slope Angle"
                value={terrainParams.slopeDeg}
                min={0}
                max={30}
                step={0.5}
                unit="°"
                onChange={(val) => updateTerrainParams({ slopeDeg: val })}
              />

              {/* 2. Ground Roughness */}
              <Slider
                id="terrain-roughness"
                label="Surface Roughness / Boulders"
                value={terrainParams.surfaceRoughness}
                min={0.0}
                max={1.0}
                step={0.05}
                unit=""
                onChange={(val) => updateTerrainParams({ surfaceRoughness: val })}
              />

              {/* 3. Access Path Width */}
              <Slider
                id="terrain-path-width"
                label="Access Corridor Width"
                value={terrainParams.pathWidthM}
                min={1.2}
                max={6.0}
                step={0.05}
                unit=" m"
                onChange={(val) => updateTerrainParams({ pathWidthM: val })}
              />

              {/* 4. Machine Ground Clearance */}
              <Slider
                id="terrain-ground-clearance"
                label="Chassis Baseline Ground Clearance"
                value={terrainParams.groundClearanceNominalM}
                min={0.15}
                max={0.5}
                step={0.01}
                unit=" m"
                onChange={(val) => updateTerrainParams({ groundClearanceNominalM: val })}
              />

              {/* 5. Machine Setback Distance */}
              <Slider
                id="terrain-setback"
                label="Machine Staging Setback Distance"
                value={terrainParams.machineSetbackM}
                min={3.0}
                max={30.0}
                step={0.5}
                unit=" m"
                onChange={(val) => updateTerrainParams({ machineSetbackM: val })}
              />

              {/* 6. Configured Hose Length */}
              <Slider
                id="terrain-hose-length"
                label="Available Hose Drum Length"
                value={parameters.hoseLengthM}
                min={10}
                max={60}
                step={1}
                unit=" m"
                onChange={(val) => {
                  updateParameter('hoseLengthM', val);
                  updateTerrainParams({ configuredHoseLengthM: val });
                }}
              />

              {/* 7. Rainfall Intensity */}
              <Slider
                id="terrain-rainfall"
                label="Rainfall Precipitation Rate"
                value={terrainParams.rainfallIntensityMmH}
                min={0}
                max={100}
                step={5}
                unit=" mm/h"
                onChange={(val) => updateTerrainParams({ rainfallIntensityMmH: val })}
              />

              {/* 8. Ambient Temperature */}
              <Slider
                id="terrain-temperature"
                label="Ambient Air Temperature"
                value={terrainParams.ambientTempC}
                min={-20}
                max={45}
                step={1}
                unit=" °C"
                onChange={(val) => updateTerrainParams({ ambientTempC: val })}
              />

              {/* 9. Ground Altitude MSL */}
              <div className="md:col-span-2">
                <Slider
                  id="terrain-altitude"
                  label="Altitude Above Sea Level (MSL)"
                  value={terrainParams.altitudeM}
                  min={0}
                  max={4500}
                  step={50}
                  unit=" m"
                  onChange={(val) => updateTerrainParams({ altitudeM: val })}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Live Calculations & Operational Limits Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Active Warnings Box */}
          {feasibility.warnings.length > 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-600/70 text-amber-300 text-xs font-mono space-y-2 shadow-lg animate-in fade-in">
              <div className="font-bold flex items-center justify-between text-amber-400 uppercase">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Active Environmental & Limit Alerts
                </span>
                <Badge variant="warning" size="sm">
                  {feasibility.warnings.length} Active
                </Badge>
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-200/90 pl-1 text-[11px] leading-relaxed">
                {feasibility.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All current terrain inputs within preliminary safe operating envelopes.</span>
            </div>
          )}

          {/* 1. Barometric & Altitude Feasibility Card */}
          <Card title="Barometric Pressure & Vacuum Suction Limits">
            <div className="space-y-2.5 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Atmospheric Pressure (Patm)</div>
                  <div className="text-base font-bold text-cyan-300 mt-0.5">
                    {feasibility.atmosphericPressureKpa.toFixed(1)} kPa
                  </div>
                  <div className="text-[10px] text-slate-400">
                    At {terrainParams.altitudeM} m MSL
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Max Achievable Suction Lift</div>
                  <div className={`text-base font-bold mt-0.5 ${feasibility.isAltitudeDerated ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {feasibility.maxAchievableSuctionLiftM.toFixed(2)} m
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Required: {feasibility.verticalElevationDiffM.toFixed(2)} m
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-graphite-950 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Static Head + Darcy Loss:</span>
                <span className="font-bold text-white">
                  {feasibility.staticHeadLossKpa.toFixed(1)} kPa + {feasibility.estimatedFrictionLossKpa.toFixed(1)} kPa = {feasibility.totalRoutingLossKpa.toFixed(1)} kPa
                </span>
              </div>
            </div>
          </Card>

          {/* 2. Sludge Viscosity & Soil Adhesion Card */}
          <Card title="Climate Deratings & Soil Bearing Adhesion">
            <div className="space-y-2.5 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Slurry Dynamic Viscosity</div>
                  <div className={`text-base font-bold mt-0.5 ${feasibility.isTemperatureCritical ? 'text-amber-300' : 'text-white'}`}>
                    {feasibility.effectiveSlurryViscosityCp.toFixed(0)} cP
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Base: 450 cP @ 20°C
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Wet Soil Traction Adhesion</div>
                  <div className={`text-base font-bold mt-0.5 ${feasibility.isTractionSlipRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {feasibility.soilTractionCoeff.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Tan(Slope): {Math.tan((terrainParams.slopeDeg * Math.PI) / 180).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Mud Sinkage Depth</div>
                  <div className="text-sm font-bold text-amber-300">
                    {(feasibility.mudSinkageM * 100).toFixed(1)} cm
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Effective Belly Clearance</div>
                  <div className={`text-sm font-bold ${feasibility.groundClearanceRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {feasibility.effectiveGroundClearanceM.toFixed(2)} m
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 3. Hose Routing & Passage Clearance Card */}
          <Card title="Hose Routing & Passage Clearances">
            <div className="space-y-2.5 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Hose Route Required</div>
                  <div className={`text-base font-bold mt-0.5 ${!feasibility.hoseLengthAdequate ? 'text-rose-400' : 'text-cyan-300'}`}>
                    {feasibility.requiredHoseLengthM.toFixed(1)} m
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Configured: {parameters.hoseLengthM} m
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Lateral Margin Per Side</div>
                  <div className={`text-base font-bold mt-0.5 ${feasibility.clearanceConflictDetected ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {feasibility.lateralClearanceMarginM.toFixed(2)} m
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Machine: {feasibility.machineWidthM}m | Path: {feasibility.availablePathWidthM}m
                  </div>
                </div>
              </div>

              {/* Stability Margin */}
              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Chassis Stability Margin:</span>
                  <div className="text-sm font-bold text-white">
                    {feasibility.stabilityMarginPct.toFixed(1)}% remaining
                  </div>
                </div>
                <Badge
                  variant={
                    feasibility.stabilityStatus === 'critical_unstable'
                      ? 'danger'
                      : feasibility.stabilityStatus === 'caution'
                      ? 'warning'
                      : 'success'
                  }
                  size="sm"
                >
                  {feasibility.stabilityStatus.toUpperCase()}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
