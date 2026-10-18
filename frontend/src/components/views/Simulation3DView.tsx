import React, { useState } from 'react';
import {
  Box,
  Eye,
  Sliders,
  RotateCcw,
  Sparkles,
  Sun,
  Layers,
  Info,
  Maximize2,
  Mountain,
  Compass,
  TableProperties,
  AlertTriangle,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { useSimulationStore, INSPECTABLE_COMPONENTS } from '../../store/useSimulationStore';
import { DigitalTwinCanvas } from '../../scene/DigitalTwinCanvas';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CameraPreset } from '../../types/digitalTwin';
import { TerrainScenarioId } from '../../types/terrainScenarios';
import { TERRAIN_SCENARIOS } from '../../simulation/terrainFeasibilityModel';
import { TerrainComparisonPanel } from '../TerrainComparisonPanel';

export const Simulation3DView: React.FC = () => {
  const cameraPreset = useSimulationStore((s) => s.cameraPreset);
  const setCameraPreset = useSimulationStore((s) => s.setCameraPreset);
  const displayOptions = useSimulationStore((s) => s.displayOptions);
  const toggleDisplayOption = useSimulationStore((s) => s.toggleDisplayOption);
  const setMobilityMode = useSimulationStore((s) => s.setMobilityMode);
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const telemetry = useSimulationStore((s) => s.telemetry);
  const parameters = useSimulationStore((s) => s.parameters);
  const startGuidedDemo = useSimulationStore((s) => s.startGuidedDemo);

  const selectedScenario = useSimulationStore((s) => s.selectedScenario);
  const setTerrainScenario = useSimulationStore((s) => s.setTerrainScenario);
  const terrainParams = useSimulationStore((s) => s.terrainParams);
  const updateTerrainParams = useSimulationStore((s) => s.updateTerrainParams);
  const updateParameter = useSimulationStore((s) => s.updateParameter);
  const feasibility = useSimulationStore((s) => s.feasibility);
  const operatingState = useSimulationStore((s) => s.operatingState);
  const runCompleteCycleScenario = useSimulationStore((s) => s.runCompleteCycleScenario);
  const triggerTankFullScenario = useSimulationStore((s) => s.triggerTankFullScenario);

  const [showComparison, setShowComparison] = useState(false);

  const presets: { id: CameraPreset; label: string; desc: string }[] = [
    { id: 'reset', label: 'Reset', desc: 'Standard machine overview perspective' },
    { id: 'iso', label: 'Isometric', desc: '45° engineering axonometric angle' },
    { id: 'top', label: 'Top', desc: 'Orthographic plant layout view' },
    { id: 'side', label: 'Side', desc: 'Direct elevation profile view' },
    { id: 'boom', label: 'Boom', desc: 'Close-up on crane arm and hose reel' },
    { id: 'nozzle', label: 'Nozzle', desc: 'Focused on submerged nozzle and slurry fluid' },
    { id: 'cutaway', label: 'Cutaway', desc: 'Front elevation view into septic vault interior' }
  ];

  const selectedData = selectedComponentId ? INSPECTABLE_COMPONENTS[selectedComponentId] : null;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-graphite-950 relative select-none">
      {/* Main Large Viewport Area */}
      <div className="flex-1 relative flex flex-col h-full">
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 bg-graphite-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => setCameraPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  cameraPreset === p.id
                    ? 'bg-safety-500 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-graphite-850'
                }`}
                title={p.desc}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Operating Environment Quick Switcher */}
          <div className="flex items-center gap-1.5 bg-graphite-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl pointer-events-auto font-mono text-xs">
            <Mountain className="w-3.5 h-3.5 text-safety-500 ml-1" />
            {(
              [
                { id: 'level_paved', label: 'Paved' },
                { id: 'hilly_sloped', label: 'Hilly (14°)' },
                { id: 'uneven_muddy', label: 'Muddy' },
                { id: 'narrow_restricted', label: 'Alley (1.6m)' },
                { id: 'heavy_rain', label: 'Rain (75mm/h)' },
                { id: 'cold_high_altitude', label: 'Alpine (-8°C)' }
              ] as const
            ).map((env) => (
              <button
                key={env.id}
                onClick={() => setTerrainScenario(env.id as TerrainScenarioId)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                  selectedScenario === env.id
                    ? 'bg-safety-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {env.label}
              </button>
            ))}
            <button
              onClick={() => setShowComparison(!showComparison)}
              title="Compare all 3 operating environments"
              className="text-cyan-400 hover:text-cyan-300 px-1.5 py-1 text-[11px] flex items-center gap-1 border-l border-slate-800 pl-2"
            >
              <TableProperties className="w-3 h-3" />
              Compare
            </button>
            <button
              onClick={startGuidedDemo}
              title="Launch step-by-step interactive guided demonstration tour"
              className="text-amber-400 hover:text-amber-300 px-1.5 py-1 text-[11px] flex items-center gap-1 border-l border-slate-800 pl-2 font-semibold"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              Demo Tour
            </button>
          </div>

          {/* Layer and Shader Toggles */}
          <div className="flex items-center gap-2 bg-graphite-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
            <Button
              variant={displayOptions.cutaway ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => toggleDisplayOption('cutaway')}
              icon={<Layers className="w-3.5 h-3.5" />}
              title="Toggle Architectural Cutaway Profile"
            >
              Cutaway
            </Button>
            <Button
              variant={displayOptions.showAnnotations ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleDisplayOption('showAnnotations')}
              icon={<Eye className="w-3.5 h-3.5" />}
              title="Toggle 3D Sensor Callouts"
            >
              Tags
            </Button>
            <Button
              variant={displayOptions.showGrid ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleDisplayOption('showGrid')}
              title="Toggle Ground Grid"
            >
              Grid
            </Button>
            <Button
              variant={displayOptions.mobilityMode === 'tracks' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMobilityMode(displayOptions.mobilityMode === 'tracks' ? 'wheels' : 'tracks')}
              icon={<Truck className="w-3.5 h-3.5" />}
              title="Switch between 4-Wheel and Crawler Track Mobility Gear"
            >
              {displayOptions.mobilityMode === 'tracks' ? 'Tracks' : 'Wheels'}
            </Button>
            <Button
              variant={displayOptions.wireframe ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleDisplayOption('wireframe')}
              icon={<Box className="w-3.5 h-3.5" />}
              title="Toggle Wireframe Geometry"
            >
              Wireframe
            </Button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 w-full h-full">
          <DigitalTwinCanvas />
        </div>

        {/* Viewport Bottom Telemetry & Terrain HUD Ribbon */}
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
          <div className="bg-graphite-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-4 pointer-events-auto">
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">ENVIRONMENT</span>
                <span className="text-safety-400 font-bold uppercase truncate max-w-[140px] block">
                  {TERRAIN_SCENARIOS[selectedScenario].name}
                </span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-slate-400 block text-[10px]">CHASSIS TILT</span>
                <span className={`font-bold ${feasibility.effectiveTiltDeg >= 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {feasibility.effectiveTiltDeg.toFixed(1)}°
                </span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-slate-400 block text-[10px]">ROUTING HEAD LOSS</span>
                <span className="text-cyan-400 font-bold">
                  {feasibility.totalRoutingLossKpa.toFixed(1)} kPa
                </span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-slate-400 block text-[10px]">SIDE CLEARANCE</span>
                <span className={`font-bold ${feasibility.clearanceConflictDetected ? 'text-rose-400' : 'text-slate-200'}`}>
                  {feasibility.lateralClearanceMarginM.toFixed(2)} m
                </span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-slate-400 block text-[10px]">STABILITY</span>
                <span className={`font-bold uppercase ${
                  feasibility.stabilityStatus === 'critical_unstable'
                    ? 'text-rose-400'
                    : feasibility.stabilityStatus === 'caution'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {feasibility.stabilityStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Hose Req: {feasibility.requiredHoseLengthM}m (Configured: {parameters.hoseLengthM}m)</span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] text-slate-500 italic">Preliminary Estimate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Modal Overlay */}
      {showComparison && (
        <div className="absolute inset-4 z-40 flex items-center justify-center p-4 bg-graphite-950/80 backdrop-blur-md overflow-y-auto">
          <div className="max-w-4xl w-full">
            <TerrainComparisonPanel onClose={() => setShowComparison(false)} />
          </div>
        </div>
      )}

      {/* Right Details / Component Inspector & Configuration Panel */}
      <aside className="w-full md:w-96 bg-graphite-900 border-l border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 select-none">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              <Info className="w-4 h-4 text-safety-500" />
              <span>Component Inspector & Config</span>
            </h2>
            <Badge variant="cyan" size="sm">
              STATE: {operatingState}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">
            Click 3D components in the viewport to inspect geometry, tweak configurable parameters, or trigger test scenarios.
          </p>
        </div>

        {/* Demonstration Test Scenarios Card */}
        <div className="p-3 rounded-xl bg-graphite-950 border border-slate-800 space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-safety-500" />
              <span>Demonstration Test Scenarios</span>
            </span>
            <Badge variant="safety" size="sm">VERIFICATION</Badge>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={runCompleteCycleScenario}
              className="w-full text-left p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 hover:bg-emerald-900/40 text-emerald-300 transition text-[11px]"
            >
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Scenario 1: Complete Operating Cycle</span>
              </div>
              <p className="text-[10px] text-emerald-400/80 font-sans mt-0.5">
                Runs IDLE → DEPLOY → PRIME → EXTRACT → DISCHARGE → COMPLETE with mass conservation check.
              </p>
            </button>

            <button
              onClick={triggerTankFullScenario}
              className="w-full text-left p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 hover:bg-amber-900/40 text-amber-300 transition text-[11px]"
            >
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Scenario 2: Overfill Protection Interlock</span>
              </div>
              <p className="text-[10px] text-amber-400/80 font-sans mt-0.5">
                Pre-fills tank to 99.6% and attempts extraction; verifies automated cutoff and alarm trip.
              </p>
            </button>
          </div>
        </div>

        {/* Selected Component Inspection & Configuration */}
        {selectedData ? (
          <div className="space-y-4">
            <Card
              title={selectedData.name}
              subtitle={selectedData.type}
              icon={<Box className="w-4 h-4 text-safety-500" />}
              headerAction={
                <Badge variant="safety" size="sm">
                  SELECTED
                </Badge>
              }
            >
              <div className="space-y-3 font-mono text-xs">
                {/* Truth-in-engineering assumption disclaimer tag */}
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] leading-snug">
                  <strong>CONCEPTUAL DESIGN ASSUMPTION:</strong> Dimensions, mass, and specifications represent preliminary engineering baselines pending physical fabrication.
                </div>

                <p className="text-slate-300 text-xs leading-relaxed font-sans">
                  {selectedData.description}
                </p>

                {/* Transducer Readout */}
                <div className="grid grid-cols-3 gap-2 bg-graphite-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">TEMP</span>
                    <span className="text-slate-200 font-bold">{selectedData.temperatureC}°C</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">PRESS</span>
                    <span className="text-slate-200 font-bold">{selectedData.pressureBar} bar</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">VIBE</span>
                    <span className="text-slate-200 font-bold">{selectedData.vibrationMmS} mm/s</span>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="space-y-1.5 bg-graphite-950 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block mb-1">
                    Technical Specifications
                  </span>
                  {Object.entries(selectedData.specifications).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-baseline gap-2">
                      <span className="text-slate-400">{key}:</span>
                      <span className="text-slate-200 font-semibold text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Interactive Component Configuration Panel */}
            <Card
              title="Component Configuration"
              subtitle="Modify physical & operating parameters"
              icon={<Sliders className="w-4 h-4 text-cyan-400" />}
            >
              <div className="space-y-3 font-mono text-xs">
                {/* Chassis Configuration */}
                {selectedComponentId === 'chassis' && (
                  <>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Mobility Running Gear:</span>
                        <span className="text-safety-400 font-bold uppercase">{displayOptions.mobilityMode || 'wheels'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setMobilityMode('wheels')}
                          className={`p-2 rounded text-xs font-bold border transition ${
                            displayOptions.mobilityMode !== 'tracks'
                              ? 'bg-safety-500 text-white border-safety-400'
                              : 'bg-graphite-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          4WD Lug Wheels
                        </button>
                        <button
                          onClick={() => setMobilityMode('tracks')}
                          className={`p-2 rounded text-xs font-bold border transition ${
                            displayOptions.mobilityMode === 'tracks'
                              ? 'bg-safety-500 text-white border-safety-400'
                              : 'bg-graphite-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          Rubber Crawler Tracks
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Ground Clearance:</span>
                        <span className="text-white font-bold">{Math.round(terrainParams.groundClearanceNominalM * 1000)} mm</span>
                      </div>
                      <input
                        type="range"
                        min="0.20"
                        max="0.45"
                        step="0.01"
                        value={terrainParams.groundClearanceNominalM}
                        onChange={(e) => updateTerrainParams({ groundClearanceNominalM: Number(e.target.value) })}
                        className="w-full accent-safety-500"
                      />
                    </div>
                  </>
                )}

                {/* Pump Configuration */}
                {selectedComponentId === 'pump' && (
                  <>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Pump Speed:</span>
                        <span className="text-white font-bold">{parameters.pumpRpm} RPM</span>
                      </div>
                      <input
                        type="range"
                        min="600"
                        max="3000"
                        step="50"
                        value={parameters.pumpRpm}
                        onChange={(e) => updateParameter('pumpRpm', Number(e.target.value))}
                        className="w-full accent-safety-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-graphite-950 border border-slate-800">
                      <span className="text-slate-300">Water-Jetting Ring Assist:</span>
                      <button
                        onClick={() => updateParameter('waterJetEnabled', !parameters.waterJetEnabled)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                          parameters.waterJetEnabled
                            ? 'bg-cyan-500 text-white'
                            : 'bg-graphite-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {parameters.waterJetEnabled ? 'ENABLED (180 bar)' : 'OFF'}
                      </button>
                    </div>
                  </>
                )}

                {/* Tank Configuration */}
                {selectedComponentId === 'tank' && (
                  <>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Target Vacuum Rating:</span>
                        <span className="text-white font-bold">{parameters.targetVacuumKpa} kPa</span>
                      </div>
                      <input
                        type="range"
                        min="-85"
                        max="-40"
                        step="5"
                        value={parameters.targetVacuumKpa}
                        onChange={(e) => updateParameter('targetVacuumKpa', Number(e.target.value))}
                        className="w-full accent-safety-500"
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 italic">
                      Geometric tank shell capacity: 2,400 L (SA 516 Gr 70 boiler plate).
                    </div>
                  </>
                )}

                {/* Hose & Reel Configuration */}
                {(selectedComponentId === 'hosereel' || selectedComponentId === 'hose') && (
                  <>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Hose Diameter:</span>
                        <span className="text-white font-bold">Ø{parameters.hoseDiameterMm} mm</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[50, 75, 100, 150].map((dia) => (
                          <button
                            key={dia}
                            onClick={() => updateParameter('hoseDiameterMm', dia)}
                            className={`p-1.5 rounded text-xs font-bold border transition ${
                              parameters.hoseDiameterMm === dia
                                ? 'bg-safety-500 text-white border-safety-400'
                                : 'bg-graphite-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            Ø{dia}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Deployed Hose Length:</span>
                        <span className="text-white font-bold">{parameters.hoseLengthM} m</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="60"
                        step="5"
                        value={parameters.hoseLengthM}
                        onChange={(e) => updateParameter('hoseLengthM', Number(e.target.value))}
                        className="w-full accent-safety-500"
                      />
                    </div>
                  </>
                )}

                {/* Septic Vault Configuration */}
                {selectedComponentId === 'septictank' && (
                  <>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Sludge Viscosity:</span>
                        <span className="text-white font-bold">{parameters.slurryViscosityCp} cP</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="2500"
                        step="50"
                        value={parameters.slurryViscosityCp}
                        onChange={(e) => updateParameter('slurryViscosityCp', Number(e.target.value))}
                        className="w-full accent-safety-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Initial Sludge Depth:</span>
                        <span className="text-white font-bold">{parameters.initialSludgeDepthM} m</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={parameters.initialSludgeDepthM}
                        onChange={(e) => updateParameter('initialSludgeDepthM', Number(e.target.value))}
                        className="w-full accent-safety-500"
                      />
                    </div>
                  </>
                )}

                {/* Receiver Tank */}
                {selectedComponentId === 'receiver' && (
                  <div className="text-[11px] text-slate-400 p-2 rounded bg-graphite-950 border border-slate-800">
                    Municipal disposal tanker: 10,000 L rated transfer capacity. Quick-acting DN100 Camlock coupler with double-ear clamp.
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded-xl text-center">
            <Box className="w-8 h-8 text-slate-600 mb-2" />
            <span className="text-xs font-mono text-slate-400 font-bold">No Component Selected</span>
            <span className="text-[11px] text-slate-500 mt-1 max-w-[220px] font-sans">
              Click machine chassis, pump, tank, boom, nozzle, or septic vault in 3D scene to inspect and tune parameters.
            </span>
          </div>
        )}
      </aside>
    </div>
  );
};
