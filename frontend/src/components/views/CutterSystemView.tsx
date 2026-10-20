import React from 'react';
import {
  Zap,
  RotateCw,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Play,
  Square,
  Activity,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Layers,
  Flame,
  ArrowRight
} from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Slider } from '../ui/Slider';
import { CutterOperatingMode } from '../../types/cutterSystem';
import { OriginalCutterViewer } from '../OriginalCutterViewer';

export const CutterSystemView: React.FC = () => {
  const cutterTelemetry = useSimulationStore((s) => s.cutterTelemetry);
  const cutterParams = useSimulationStore((s) => s.cutterParams);
  const setCutterEnabled = useSimulationStore((s) => s.setCutterEnabled);
  const setCutterRpm = useSimulationStore((s) => s.setCutterRpm);
  const toggleCutterReverse = useSimulationStore((s) => s.toggleCutterReverse);
  const setCutterMode = useSimulationStore((s) => s.setCutterMode);
  const resetCutterJam = useSimulationStore((s) => s.resetCutterJam);

  const alarms = useSimulationStore((s) => s.alarms);
  const operatingState = useSimulationStore((s) => s.operatingState);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);

  const modes: { id: CutterOperatingMode; label: string; desc: string }[] = [
    { id: 'standby', label: 'Standby', desc: '0 RPM - Cutter isolated for travel or maintenance' },
    { id: 'continuous', label: 'Continuous', desc: '1,450 RPM - Standard high-shear municipal maceration' },
    { id: 'anti_jam', label: 'Anti-Jam Pulse', desc: '950 RPM Reverse - Fibrous blockage clearance' },
    { id: 'shredding', label: 'Max Shredding', desc: '1,800 RPM - Heavy consolidated sludge & textile cake' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-graphite-950 p-4 sm:p-6 space-y-6">
      {/* Title & System Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Tungsten-Carbide Rotary Macerator & Cutter System
            </h2>
            <Badge variant={cutterTelemetry.enabled ? 'safety' : 'slate'} size="sm">
              {cutterTelemetry.enabled ? 'ARMED' : 'STANDBY'}
            </Badge>
            {cutterTelemetry.isReversed && (
              <Badge variant="warning" size="sm">
                REVERSE ANTI-JAM
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            High-torque inline rotary maceration shredding non-biodegradable municipal debris to &lt;6mm prior to progressive cavity suction.
          </p>
        </div>

        {/* Global Safety Interlock Status */}
        <div className="flex items-center gap-3">
          {cutterTelemetry.interlockBlocked || alarms.emergencyStopActive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-700/80 text-rose-300 text-xs font-mono font-bold animate-pulse">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>SAFETY INTERLOCK ACTIVE: CUTTER ISOLATED</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>INTERLOCKS CLEAR (SHEAR CORE OPERATIONAL)</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedComponent('macerator')}
            className="text-xs font-mono"
          >
            Inspect CAD Specs
          </Button>
        </div>
      </div>

      {/* Main Grid: Control Console & Real-Time Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Direct Operator Controls */}
        <div className="lg:col-span-5 space-y-5">
          <Card
            title="Macerator Drive Controls"
            subtitle="Closed-loop brushless PMAC motor velocity and directional control"
            icon={<Sliders className="w-4 h-4 text-amber-400" />}
          >
            <div className="space-y-4 pt-1">
              {/* Power Toggle & Reverse Button */}
              <div className="flex items-center gap-3">
                <Button
                  variant={cutterTelemetry.enabled ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => setCutterEnabled(!cutterTelemetry.enabled)}
                  className="flex-1 font-mono text-xs"
                >
                  {cutterTelemetry.enabled ? (
                    <>
                      <Square className="w-3.5 h-3.5 mr-1.5 fill-current" /> Stop Cutter
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Start Cutter
                    </>
                  )}
                </Button>

                <Button
                  variant={cutterTelemetry.isReversed ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={toggleCutterReverse}
                  disabled={!cutterTelemetry.enabled}
                  className={`flex-1 font-mono text-xs ${
                    cutterTelemetry.isReversed ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400' : ''
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  {cutterTelemetry.isReversed ? 'Return Forward' : 'Reverse Anti-Jam'}
                </Button>
              </div>

              {/* Speed Slider (0 - 1800 RPM) */}
              <div className="bg-graphite-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Rotary Speed (RPM):</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {cutterTelemetry.rpm} RPM
                  </span>
                </div>
                <Slider
                  id="cutter-rpm-slider"
                  label="Rotary Macerator Speed (RPM)"
                  min={0}
                  max={cutterParams.maxRpm || 1800}
                  step={50}
                  value={cutterTelemetry.rpm}
                  disabled={!cutterTelemetry.enabled}
                  onChange={(val) => setCutterRpm(val)}
                  unit=" RPM"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 RPM (Halt)</span>
                  <span>1,450 RPM (Nominal)</span>
                  <span>1,800 RPM (Peak)</span>
                </div>
              </div>

              {/* Operating Mode Buttons */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Cutter Operating Presets:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {modes.map((m) => {
                    const isSelected = cutterTelemetry.mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setCutterMode(m.id)}
                        className={`p-2.5 rounded-lg text-left transition border text-xs font-mono flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-950/70 border-amber-500/80 text-amber-200 shadow-sm'
                            : 'bg-graphite-900 hover:bg-graphite-850 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="font-bold">{m.label}</span>
                        <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{m.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Automatic Jam Recovery Button */}
              {cutterTelemetry.overloadTrip && (
                <div className="p-3 rounded-lg bg-rose-950/90 border border-rose-700 space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>OVERLOAD TORQUE CUTOFF TRIP (&gt;35 Nm)</span>
                  </div>
                  <p className="text-[11px] text-rose-200">
                    Fibrous blockage jammed rotary teeth. Execute electronic auto-reverse clearance to free cutter drum.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetCutterJam}
                    className="w-full text-xs font-mono bg-rose-900/60 hover:bg-rose-800 text-white border-rose-500"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Clear Overload & Reset Cutter
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Dynamic Visualizer & Multi-Physics Telemetry */}
        <div className="lg:col-span-7 space-y-5">
          {/* Original Bhavyam Cutter & Progressive Cavity Pump Assembly */}
          <Card
            title="Cold-Climate & High-Altitude Pumping"
            subtitle="Inline Cutter Rheology & Progressive Cavity Screw Pump"
            icon={<Activity className="w-4 h-4 text-cyan-400" />}
          >
            <div className="space-y-4 pt-1">
              <OriginalCutterViewer />

              {/* Primary Telemetry Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="bg-graphite-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Motor Torque</span>
                  <span className="text-base font-bold text-amber-400 mt-0.5 block">
                    {cutterTelemetry.torqueNm} Nm
                  </span>
                  <span className="text-[10px] text-slate-400">Limit: 35.0 Nm</span>
                </div>

                <div className="bg-graphite-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Electrical Draw</span>
                  <span className="text-base font-bold text-cyan-400 mt-0.5 block">
                    {cutterTelemetry.powerKw} kW
                  </span>
                  <span className="text-[10px] text-slate-400">Rated: 3.5 kW</span>
                </div>

                <div className="bg-graphite-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Slurry Shear Rate</span>
                  <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                    {cutterTelemetry.shearRateS} s⁻¹
                  </span>
                  <span className="text-[10px] text-slate-400">Factor: {cutterTelemetry.shearThinningFactor}x</span>
                </div>

                <div className="bg-graphite-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Max Fragment Size</span>
                  <span className="text-base font-bold text-indigo-400 mt-0.5 block">
                    &lt; {cutterTelemetry.particleSizeMm} mm
                  </span>
                  <span className="text-[10px] text-emerald-400">Safe for PCP</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Rheological Coupling Information Card */}
          <div className="bg-graphite-900 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              <span>Multi-Physics Coupling: Shear Thinning & Progressive Cavity Protection</span>
            </h4>
            <p className="text-slate-300 text-xs font-sans leading-relaxed">
              Septic sludge exhibits pseudoplastic (shear-thinning) Non-Newtonian behavior governed by the Ostwald-de Waele power law. 
              The 1,450 RPM rotary macerator generates a localized shear strain rate of <strong>{cutterTelemetry.shearRateS} s⁻¹</strong>, 
              lowering the dynamic viscosity factor by <strong>{(cutterTelemetry.shearThinningFactor * 100).toFixed(0)}%</strong>. 
              Concurrently, shredding fibrous rags to &lt;6mm prevents stator wrapping and eliminates NPSH cavitation in the progressive cavity pump.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CutterSystemView;
