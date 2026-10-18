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
  const feasibility = useSimulationStore((s) => s.feasibility);

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

      {/* Right Details / Component Inspector Panel */}
      <aside className="w-full md:w-80 bg-graphite-900 border-l border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
            <Info className="w-4 h-4 text-safety-500" />
            <span>Digital Twin Inspector</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Click any 3D asset in the viewport to inspect mechanical specifications and live transducer readings.
          </p>
        </div>

        {selectedData ? (
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
              <p className="text-slate-300 text-xs leading-relaxed font-sans">
                {selectedData.description}
              </p>

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
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded-xl text-center">
            <Box className="w-8 h-8 text-slate-600 mb-2" />
            <span className="text-xs font-mono text-slate-400">No Component Selected</span>
            <span className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              Click machine chassis, pump, tank, boom, nozzle, or septic vault in 3D scene.
            </span>
          </div>
        )}
      </aside>
    </div>
  );
};
