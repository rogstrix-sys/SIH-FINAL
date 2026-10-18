import React from 'react';
import {
  Box,
  Eye,
  Sliders,
  RotateCcw,
  Sparkles,
  Sun,
  Layers,
  Info,
  Maximize2
} from 'lucide-react';
import { useSimulationStore, INSPECTABLE_COMPONENTS } from '../../store/useSimulationStore';
import { DigitalTwinCanvas } from '../../scene/DigitalTwinCanvas';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CameraPreset } from '../../types/digitalTwin';

export const Simulation3DView: React.FC = () => {
  const cameraPreset = useSimulationStore((s) => s.cameraPreset);
  const setCameraPreset = useSimulationStore((s) => s.setCameraPreset);
  const displayOptions = useSimulationStore((s) => s.displayOptions);
  const toggleDisplayOption = useSimulationStore((s) => s.toggleDisplayOption);
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const telemetry = useSimulationStore((s) => s.telemetry);
  const parameters = useSimulationStore((s) => s.parameters);

  const presets: { id: CameraPreset; label: string; desc: string }[] = [
    { id: 'iso', label: 'Isometric Overview', desc: 'Standard 45° engineering perspective' },
    { id: 'cutaway', label: 'Section Cutout', desc: 'Direct elevation view into vault rebar interior' },
    { id: 'crawler', label: 'Bandicoot ROV Focus', desc: 'Tracking close-up of crawler cutter & intake' },
    { id: 'pump', label: 'Surface Skid Unit', desc: 'Close-up of vacuum pump and drive motor' },
    { id: 'top', label: 'Top-down Plan View', desc: 'Orthographic plant layout view' }
  ];

  const selectedData = selectedComponentId ? INSPECTABLE_COMPONENTS[selectedComponentId] : null;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-graphite-950">
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
              variant={displayOptions.godRays ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleDisplayOption('godRays')}
              icon={<Sun className="w-3.5 h-3.5" />}
              title="Toggle Volumetric Shaft Light"
            >
              Lighting
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

        {/* Viewport Bottom Telemetry HUD Ribbon */}
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
          <div className="bg-graphite-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-4 pointer-events-auto">
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">VACUUM CORE</span>
                <span className="text-safety-400 font-bold">
                  {telemetry.suctionPressureKpa.toFixed(1)} kPa
                </span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-slate-400 block text-[10px]">EXTRACTION RATE</span>
                <span className="text-emerald-400 font-bold">
                  {telemetry.extractionRateM3H.toFixed(1)} m³/h
                </span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-slate-400 block text-[10px]">SLUDGE DEPTH</span>
                <span className="text-cyan-400 font-bold">
                  {telemetry.sludgeLevelM.toFixed(2)} m
                </span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-slate-400 block text-[10px]">VIBRATION RMS</span>
                <span className="text-slate-200 font-bold">
                  {telemetry.vibrationRmsMmS.toFixed(2)} mm/s
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Hose: Ø{parameters.hoseDiameterMm}mm × {parameters.hoseLengthM}m</span>
              <span className="text-slate-600">•</span>
              <span>Slurry: {parameters.slurryDensityKgM3} kg/m³</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Details / Component Inspector Panel */}
      <aside className="w-full md:w-80 bg-graphite-900 border-l border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
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
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedData.description}
              </p>

              <div className="space-y-2 bg-graphite-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
                <div className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-1">
                  Specifications
                </div>
                {Object.entries(selectedData.specifications).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-0.5">
                    <span className="text-slate-400">{key}:</span>
                    <span className="text-slate-200 font-semibold">{val}</span>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedComponent(null)}
                className="w-full"
              >
                Clear Selection
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded-xl text-center text-slate-400 space-y-2">
            <Box className="w-8 h-8 text-slate-600 animate-pulse" />
            <p className="text-xs font-mono">No component currently selected.</p>
            <p className="text-[11px] text-slate-400">
              Click the Vacuum Pump, Crawler ROV, Suction Hose, or Concrete Vault in the 3D scene.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};
