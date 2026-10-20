import React, { useEffect, useRef } from 'react';
import {
  Flame,
  Thermometer,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Activity,
  Sliders,
  Droplets,
  Layers,
  MapPin,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Slider } from '../ui/Slider';

export const ThermalManagementView: React.FC = () => {
  const thermalTelemetry = useSimulationStore((s) => s.thermalTelemetry);
  const thermalParams = useSimulationStore((s) => s.thermalParams);
  const setHeaterEnabled = useSimulationStore((s) => s.setHeaterEnabled);
  const setAmbientTempC = useSimulationStore((s) => s.setAmbientTempC);
  const setTargetTempC = useSimulationStore((s) => s.setTargetTempC);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Quick Regional Climate Presets from Bhavyam Geographical Test Matrix
  const climatePresets = [
    { name: 'Shimla (HP)', alt: '2,200m MSL', temp: -4, desc: 'Heavy fibrous septage, sub-zero alley chill' },
    { name: 'Leh (Ladakh)', alt: '3,500m MSL', temp: -12, desc: 'Extreme high-altitude permafrost freeze' },
    { name: 'Kedarnath (UK)', alt: '3,100m MSL', temp: 1, desc: 'Steep pilgrim trail, high humidity & frost' },
    { name: 'Tawang (Arunachal)', alt: '3,000m MSL', temp: -8, desc: 'Sub-zero Himalayan snowpack & lipid crust' },
    { name: 'Standard Urban', alt: '500m MSL', temp: 22, desc: 'Nominal municipal ambient conditions' }
  ];

  // Render Graph 4: Thermal Dissolution Curve (Viscosity vs. Temperature)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Dark grid background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Grid lines & Axis labels
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';

    // Horizontal grid lines (Viscosity from 0 to 3500 cP)
    const viscSteps = [0, 1000, 2000, 3000];
    viscSteps.forEach((visc) => {
      const y = h - 35 - (visc / 3500) * (h - 60);
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
      ctx.fillText(`${visc} cP`, 6, y + 3);
    });

    // Vertical grid lines (Temperature from -15°C to +35°C)
    const tempSteps = [-15, -5, 5, 15, 25, 35];
    tempSteps.forEach((t) => {
      const x = 50 + ((t + 15) / 50) * (w - 70);
      ctx.beginPath();
      ctx.moveTo(x, 25);
      ctx.lineTo(x, h - 35);
      ctx.stroke();
      ctx.fillText(`${t}°C`, x - 10, h - 18);
    });

    // Axis titles
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('Ambient Temperature (°C)', w / 2 - 60, h - 4);
    ctx.save();
    ctx.translate(14, h / 2 + 50);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Apparent Viscosity (cP)', 0, 0);
    ctx.restore();

    // Plot Line 1: PTC Heated Curve (Teal #14b8a6) — Flat line at low viscosity (~320 cP)
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t = -15; t <= 35; t += 2) {
      const x = 50 + ((t + 15) / 50) * (w - 70);
      const eff = Math.min(38, Math.max(16, t + 22));
      const visc = 1200 * Math.exp(-0.05 * (eff - 15)) * 0.22;
      const y = h - 35 - (visc / 3500) * (h - 60);
      if (t === -15) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Plot Line 2: Unheated Freezing Sludge (Rose/Slate dashed line) — Exponential spike below 5°C
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (let t = -15; t <= 35; t += 1) {
      const x = 50 + ((t + 15) / 50) * (w - 70);
      let visc = 1200 * Math.exp(-0.06 * (t - 15));
      if (t < 0) visc += Math.abs(t) * 150;
      visc = Math.min(3400, visc);
      const y = h - 35 - (visc / 3500) * (h - 60);
      if (t === -15) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Active Operating Point Marker
    const activeT = thermalTelemetry.ambientTempC;
    const activeX = 50 + ((activeT + 15) / 50) * (w - 70);
    const activeVisc = thermalTelemetry.currentViscosityCp;
    const activeY = h - 35 - (activeVisc / 3500) * (h - 60);

    // Glowing halo
    ctx.fillStyle = thermalTelemetry.heaterEnabled ? 'rgba(20, 184, 166, 0.3)' : 'rgba(244, 63, 94, 0.3)';
    ctx.beginPath();
    ctx.arc(activeX, activeY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Core point
    ctx.fillStyle = thermalTelemetry.heaterEnabled ? '#2dd4bf' : '#fb7185';
    ctx.beginPath();
    ctx.arc(activeX, activeY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Text callout
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    const label = `${activeT}°C : ${activeVisc} cP (${thermalTelemetry.heaterEnabled ? 'Heated' : 'Freeze'})`;
    ctx.fillText(label, Math.min(w - 170, Math.max(60, activeX - 45)), Math.max(35, activeY - 14));
  }, [thermalTelemetry.ambientTempC, thermalTelemetry.currentViscosityCp, thermalTelemetry.heaterEnabled]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-graphite-950 p-4 sm:p-6 space-y-6">
      {/* Title & System Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              PTC Thermal Management & Sludge Liquefaction System
            </h2>
            <Badge variant={thermalTelemetry.heaterEnabled ? 'cyan' : 'slate'} size="sm">
              {thermalTelemetry.heaterEnabled ? 'PTC ACTIVE (+18°C CORE)' : 'HEATER STANDBY'}
            </Badge>
            {thermalTelemetry.freezeWarning && (
              <Badge variant="danger" size="sm">
                FREEZE HAZARD
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Cold-climate thermal jacket preventing lipid freezing down to -15°C, reducing apparent viscosity from 2,840 cP to 320 cP.
          </p>
        </div>

        {/* Global Thermal Status Indicator */}
        <div className="flex items-center gap-3">
          {thermalTelemetry.freezeWarning ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-700/80 text-rose-300 text-xs font-mono font-bold animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>SUB-ZERO FREEZING: SLUDGE SOLIDIFICATION HAZARD</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-950/60 border border-teal-800/80 text-teal-300 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>THERMAL BOUNDARY LIQUEFIED ({thermalTelemetry.effectiveTempC}°C)</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedComponent('heater')}
            className="text-xs font-mono"
          >
            Inspect Thermal Specs
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Operator Controls & Presets */}
        <div className="lg:col-span-5 space-y-5">
          <Card
            title="Thermal Jacket Controls"
            subtitle="Ceramic self-limiting PTC electric element and ambient temperature setpoint"
            icon={<Sliders className="w-4 h-4 text-teal-400" />}
          >
            <div className="space-y-4 pt-1">
              {/* Master Power Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-graphite-900 border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white block">PTC Heating Jacket</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    3.2 kW rated intake heating element
                  </span>
                </div>
                <Button
                  variant={thermalTelemetry.heaterEnabled ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setHeaterEnabled(!thermalTelemetry.heaterEnabled)}
                  className={`font-mono text-xs ${
                    thermalTelemetry.heaterEnabled
                      ? 'bg-teal-600 hover:bg-teal-500 text-white'
                      : 'text-slate-400'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 mr-1.5" />
                  {thermalTelemetry.heaterEnabled ? 'ENGAGED' : 'DISENGAGED'}
                </Button>
              </div>

              {/* Ambient Environmental Temperature Slider */}
              <div className="bg-graphite-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Ambient Temperature:</span>
                  <span
                    className={`font-bold text-sm ${
                      thermalTelemetry.ambientTempC < 0 ? 'text-cyan-400' : 'text-amber-400'
                    }`}
                  >
                    {thermalTelemetry.ambientTempC}°C
                  </span>
                </div>
                <Slider
                  id="ambient-temp-slider"
                  label="Ambient Temperature (°C)"
                  min={-15}
                  max={35}
                  step={1}
                  value={thermalTelemetry.ambientTempC}
                  onChange={(val) => setAmbientTempC(val)}
                  unit="°C"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>-15°C (Extreme Cold)</span>
                  <span>0°C (Freeze Point)</span>
                  <span>+35°C (Warm Summer)</span>
                </div>
              </div>

              {/* Geographical Test Matrix Presets */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Regional Climate Presets:
                </span>
                <div className="space-y-1.5">
                  {climatePresets.map((p) => {
                    const isSelected = thermalTelemetry.ambientTempC === p.temp;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setAmbientTempC(p.temp)}
                        className={`w-full p-2.5 rounded-lg text-left transition border text-xs font-mono flex items-center justify-between ${
                          isSelected
                            ? 'bg-teal-950/70 border-teal-500/80 text-teal-200 shadow-sm'
                            : 'bg-graphite-900 hover:bg-graphite-850 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <div>
                            <span className="font-bold">{p.name}</span>
                            <span className="text-[10px] text-slate-400 block font-sans">{p.desc}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold block text-teal-300">{p.temp}°C</span>
                          <span className="text-[10px] text-slate-500">{p.alt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Thermal CFD Chart & Metrics */}
        <div className="lg:col-span-7 space-y-5">
          <Card
            title="Graph: Thermal Dissolution Curve (Viscosity vs. Temperature)"
            subtitle="CFD model demonstrating 88.7% apparent viscosity drop under PTC heating jacket"
            icon={<Activity className="w-4 h-4 text-teal-400" />}
          >
            <div className="space-y-4 pt-1">
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex justify-center items-center shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={260}
                  className="w-full h-[240px] sm:h-[260px] block"
                />
              </div>

              {/* Legend & Active Point Readout */}
              <div className="flex flex-wrap items-center justify-between text-xs font-mono gap-3 pt-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-teal-400 font-bold">
                    <span className="w-3 h-3 rounded-full bg-teal-400" /> PTC Heated (+18°C Intake)
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <span className="w-3 h-3 rounded-full bg-rose-400" /> Unheated Freezing Sludge
                  </span>
                </div>
                <span className="text-teal-300 font-bold bg-teal-950 px-2 py-0.5 rounded border border-teal-700/60">
                  Active: {thermalTelemetry.ambientTempC}°C ➔ {thermalTelemetry.currentViscosityCp} cP
                </span>
              </div>

              {/* Telemetry Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="bg-graphite-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sludge Boundary</span>
                  <span className="text-base font-bold text-teal-400 mt-0.5 block">
                    {thermalTelemetry.effectiveTempC}°C
                  </span>
                  <span className="text-[10px] text-slate-400">Target: +18°C</span>
                </div>

                <div className="bg-graphite-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Operating Viscosity</span>
                  <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                    {thermalTelemetry.currentViscosityCp} cP
                  </span>
                  <span className="text-[10px] text-slate-400">Raw: {thermalTelemetry.unheatedViscosityCp} cP</span>
                </div>

                <div className="bg-graphite-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">PCP Suction Flow</span>
                  <span className="text-base font-bold text-cyan-400 mt-0.5 block">
                    {thermalTelemetry.compensatedFlowRateM3h} m³/h
                  </span>
                  <span className="text-[10px] text-emerald-400">Zero Cavitation</span>
                </div>

                <div className="bg-graphite-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Thermal Power</span>
                  <span className="text-base font-bold text-amber-400 mt-0.5 block">
                    {thermalTelemetry.heatingPowerKw} kW
                  </span>
                  <span className="text-[10px] text-slate-400">Eff: {thermalTelemetry.liquefactionEfficiencyPct}%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Physical Engineering Summary */}
          <div className="bg-graphite-900 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <span>Cold-Climate Rheological Liquefaction Mechanism</span>
            </h4>
            <p className="text-slate-300 text-xs font-sans leading-relaxed">
              At temperatures below 5°C, high concentrations of lipids and long-chain fatty acids solidify, spiking 
              sludge viscosity from 800 cP up to <strong>3,400 cP</strong> at -12°C. Traditional vacuum trucks suffer total vacuum loss. 
              The 3.2 kW PTC ceramic heating jacket forms a thin thermal boundary layer at the progressive cavity suction port, 
              maintaining an effective core temperature of <strong>{thermalTelemetry.effectiveTempC}°C</strong> and lowering apparent viscosity 
              by <strong>{thermalTelemetry.liquefactionEfficiencyPct}%</strong> to guarantee smooth positive-displacement suction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalManagementView;
