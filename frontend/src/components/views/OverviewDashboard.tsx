import React from 'react';
import {
  Droplets,
  Activity,
  Gauge,
  Zap,
  ShieldAlert,
  Flame,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Maximize2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip
} from 'recharts';
import { useSimulationStore, INSPECTABLE_COMPONENTS } from '../../store/useSimulationStore';
import { DigitalTwinCanvas } from '../../scene/DigitalTwinCanvas';
import { Card } from '../ui/Card';
import { KpiCard } from '../ui/KpiCard';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { Badge } from '../ui/Badge';
import { CameraPreset } from '../../types/digitalTwin';
import {
  formatVolume,
  formatFlowRate,
  formatPressureKpa,
  formatPower,
  formatPpm,
  formatPercent,
  formatVibration
} from '../../utils/units';

export const OverviewDashboard: React.FC = () => {
  const telemetry = useSimulationStore((s) => s.telemetry);
  const parameters = useSimulationStore((s) => s.parameters);
  const history = useSimulationStore((s) => s.telemetryHistory);
  const eventLog = useSimulationStore((s) => s.eventLog);
  const status = useSimulationStore((s) => s.status);
  
  const cameraPreset = useSimulationStore((s) => s.cameraPreset);
  const setCameraPreset = useSimulationStore((s) => s.setCameraPreset);
  const displayOptions = useSimulationStore((s) => s.displayOptions);
  const toggleDisplayOption = useSimulationStore((s) => s.toggleDisplayOption);
  
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const updateParameter = useSimulationStore((s) => s.updateParameter);
  const setActiveView = useSimulationStore((s) => s.setActiveView);

  const selectedData = selectedComponentId ? INSPECTABLE_COMPONENTS[selectedComponentId] : null;

  // Camera presets list
  const presets: { id: CameraPreset; label: string }[] = [
    { id: 'iso', label: 'Isometric' },
    { id: 'cutaway', label: 'Section Cut' },
    { id: 'crawler', label: 'ROV Crawler' },
    { id: 'pump', label: 'Vacuum Skid' },
    { id: 'top', label: 'Plan View' }
  ];

  const gasStatus = telemetry.h2sConcentrationPpm >= 15 || telemetry.ch4ConcentrationPct >= 1.5
    ? 'alert'
    : telemetry.h2sConcentrationPpm >= 10 || telemetry.ch4ConcentrationPct >= 1.0
    ? 'warning'
    : 'nominal';

  const cavitationStatus = telemetry.cavitationIndex >= 0.75
    ? 'alert'
    : telemetry.cavitationIndex >= 0.55
    ? 'warning'
    : 'nominal';

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
      {/* 1. Industrial Live KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Volume Extraction */}
        <KpiCard
          label="Volume Evacuated"
          value={Math.round(telemetry.volumeExtractedLiters)}
          unit={`/ ${parameters.containmentVolumeLiters} L`}
          icon={<Droplets className="w-4 h-4 text-cyan-400" />}
          status="nominal"
          progress={{
            current: telemetry.volumeExtractedLiters,
            max: parameters.containmentVolumeLiters
          }}
          tooltip={`Remaining: ${formatVolume(telemetry.volumeRemainingLiters)}`}
        />

        {/* Slurry Flow Rate */}
        <KpiCard
          label="Extraction Flow"
          value={telemetry.extractionRateM3H.toFixed(1)}
          unit="m³/h"
          icon={<Activity className="w-4 h-4 text-safety-400" />}
          trend={{
            value: status === 'running' ? `${(telemetry.systemEfficiencyPct).toFixed(0)}% eff` : 'IDLE',
            isPositive: telemetry.extractionRateM3H > 10,
            neutral: status !== 'running'
          }}
          status={status === 'running' ? 'nominal' : 'neutral'}
        />

        {/* Suction Vacuum */}
        <KpiCard
          label="Suction Vacuum"
          value={telemetry.suctionPressureKpa.toFixed(1)}
          unit="kPa"
          icon={<Gauge className="w-4 h-4 text-emerald-400" />}
          status={cavitationStatus}
          progress={{
            current: Math.abs(telemetry.suctionPressureKpa),
            max: 90
          }}
          tooltip={`Target: ${parameters.targetVacuumKpa} kPa | Cavitation Index: ${(telemetry.cavitationIndex * 100).toFixed(0)}%`}
        />

        {/* Toxic H2S Gas */}
        <KpiCard
          label="Atmosphere H2S"
          value={telemetry.h2sConcentrationPpm.toFixed(1)}
          unit="ppm"
          icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
          status={gasStatus}
          trend={{
            value: telemetry.h2sConcentrationPpm >= 10 ? 'PEL LIMIT' : 'OSHA SAFE',
            isPositive: telemetry.h2sConcentrationPpm < 10
          }}
          tooltip="OSHA Permissible Exposure Limit: 10 ppm ceiling"
        />

        {/* Motor Power */}
        <KpiCard
          label="Motor Power"
          value={telemetry.motorPowerKw.toFixed(1)}
          unit="kW"
          icon={<Zap className="w-4 h-4 text-yellow-400" />}
          status="neutral"
          tooltip={`Current Draw: ${telemetry.motorCurrentAmps.toFixed(1)} A @ 400V`}
        />

        {/* Sludge Level Depth */}
        <KpiCard
          label="Sludge Head Depth"
          value={telemetry.sludgeLevelM.toFixed(2)}
          unit="m"
          icon={<Flame className="w-4 h-4 text-rose-400" />}
          status="neutral"
          progress={{
            current: telemetry.sludgeLevelM,
            max: parameters.initialSludgeDepthM
          }}
          tooltip={`Initial Depth: ${parameters.initialSludgeDepthM} m`}
        />
      </div>

      {/* 2. Main Center Grid: 3D Viewport (Left) + Quick Controls & Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[460px]">
        {/* Large 3D Viewport Column */}
        <div className="lg:col-span-8 flex flex-col relative rounded-xl overflow-hidden border border-slate-800 bg-graphite-950 shadow-2xl">
          {/* Viewport Floating Header Bar */}
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Camera Presets Selector */}
            <div className="flex items-center gap-1 bg-graphite-950/80 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setCameraPreset(p.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                    cameraPreset === p.id
                      ? 'bg-safety-500 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-graphite-850'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Display Layer Toggles */}
            <div className="flex items-center gap-1.5 bg-graphite-950/80 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto">
              <Button
                variant={displayOptions.cutaway ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => toggleDisplayOption('cutaway')}
                title="Toggle Architectural Cutaway Section"
                className="text-[10px] py-1 px-2"
              >
                Cutaway
              </Button>
              <Button
                variant={displayOptions.showAnnotations ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => toggleDisplayOption('showAnnotations')}
                title="Toggle 3D Sensor Tags"
                className="text-[10px] py-1 px-2"
              >
                <Eye className="w-3 h-3" />
              </Button>
              <Button
                variant={displayOptions.wireframe ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => toggleDisplayOption('wireframe')}
                title="Toggle Wireframe Mode"
                className="text-[10px] py-1 px-2"
              >
                Mesh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView('simulation3d')}
                title="Expand to Fullscreen View"
                className="text-[10px] py-1 px-2"
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* R3F 3D Canvas */}
          <div className="flex-1 w-full h-full min-h-[420px]">
            <DigitalTwinCanvas />
          </div>

          {/* Component Inspection Flyout (When user clicks 3D model) */}
          {selectedData && (
            <div className="absolute bottom-3 left-3 right-3 md:right-auto md:w-96 z-10 bg-graphite-950/95 border border-safety-500/50 rounded-xl p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-safety-500 animate-pulse" />
                    {selectedData.name}
                  </h4>
                  <p className="text-[10px] text-slate-400">{selectedData.type}</p>
                </div>
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded border border-slate-800"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                {selectedData.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-graphite-900/80 p-2 rounded-lg border border-slate-800 mb-2">
                {Object.entries(selectedData.specifications).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-slate-400 block">{key}</span>
                    <span className="text-slate-200 font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Real-Time Operating Controls & Quick Parameters */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card
            title="Operating Controls"
            subtitle="Real-time actuator overrides"
            icon={<Sliders className="w-4 h-4 text-safety-500" />}
            className="flex-1"
          >
            <div className="space-y-4">
              {/* Pump RPM Slider */}
              <Slider
                id="ctrl-pump-rpm"
                label="Pump Speed (RPM)"
                value={parameters.pumpRpm}
                min={0}
                max={3600}
                step={50}
                unit="RPM"
                onChange={(val) => updateParameter('pumpRpm', val)}
                dangerThreshold={3200}
                description="Controls positive displacement lobe cycle frequency."
              />

              {/* Target Vacuum Slider */}
              <Slider
                id="ctrl-vacuum-target"
                label="Target Suction Vacuum"
                value={parameters.targetVacuumKpa}
                min={-88}
                max={0}
                step={1}
                unit="kPa"
                onChange={(val) => updateParameter('targetVacuumKpa', val)}
                dangerThreshold={-82}
                description="Deep vacuum below -82 kPa triggers cavitation."
              />

              {/* Water Jet Pressure */}
              <Slider
                id="ctrl-water-jet"
                label="Hydro-Jetting Assist"
                value={parameters.waterJetPressureBar}
                min={0}
                max={250}
                step={5}
                unit="bar"
                onChange={(val) => updateParameter('waterJetPressureBar', val)}
                description="High-pressure jetting shears and liquifies sludge crust."
              />

              {/* Quick Toggle Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <Button
                  variant={parameters.waterJetEnabled ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => updateParameter('waterJetEnabled', !parameters.waterJetEnabled)}
                >
                  Jetting: {parameters.waterJetEnabled ? 'ON' : 'OFF'}
                </Button>
                <Button
                  variant={parameters.cutterHeadEnabled ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => updateParameter('cutterHeadEnabled', !parameters.cutterHeadEnabled)}
                >
                  Cutter: {parameters.cutterHeadEnabled ? 'ON' : 'OFF'}
                </Button>
              </div>

              {/* Process Summary Quick Stats */}
              <div className="bg-graphite-950 p-3 rounded-lg border border-slate-800/80 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Cycle Completion:</span>
                  <span className="text-emerald-400 font-semibold">
                    {telemetry.estimatedCompletionMinutes > 0
                      ? `~${telemetry.estimatedCompletionMinutes} min`
                      : telemetry.volumeRemainingLiters <= 5
                      ? 'COMPLETED'
                      : 'CALCULATING'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Hydraulic Head Loss:</span>
                  <span className="text-slate-200">{telemetry.headLossM.toFixed(1)} m</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Flow Regime:</span>
                  <span className="text-safety-400 font-semibold">
                    Re: {telemetry.reynoldsNumber}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 3. Bottom Grid: Real-time Telemetry Charts + Chronological Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Trend Charts: Flow Rate & Vacuum */}
        <div className="lg:col-span-7">
          <Card
            title="Extraction Dynamics"
            subtitle="Flow rate (m³/h) and suction vacuum (kPa)"
            icon={<Activity className="w-4 h-4 text-safety-500" />}
            headerAction={
              <Badge variant="cyan" size="sm">
                60s BUFFER
              </Badge>
            }
          >
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="vacGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: '#0b0f17',
                      borderColor: '#334155',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="flowRate"
                    stroke="#f97316"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#flowGrad)"
                    name="Flow Rate (m³/h)"
                  />
                  <Area
                    type="monotone"
                    dataKey="vacuum"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#vacGrad)"
                    name="Vacuum (|kPa|)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Industrial Event & Hazard Log */}
        <div className="lg:col-span-5">
          <Card
            title="System Event Log"
            subtitle="Chronological audit stream & safety alarms"
            icon={<ShieldAlert className="w-4 h-4 text-safety-500" />}
            headerAction={
              <span className="text-[11px] font-mono text-slate-400">
                {eventLog.length} events
              </span>
            }
          >
            <div className="h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {eventLog.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                  No active events logged
                </div>
              ) : (
                eventLog.map((evt) => {
                  const levelBadge = {
                    critical: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
                    warning: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
                    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
                    info: 'bg-slate-800 text-slate-300 border-slate-700'
                  }[evt.level];

                  return (
                    <div
                      key={evt.id}
                      className="p-2 rounded-lg bg-graphite-950 border border-slate-800 text-xs font-mono flex items-start gap-2"
                    >
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${levelBadge}`}
                      >
                        {evt.level}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="text-safety-400 font-semibold">{evt.source}</span>
                          <span>{evt.timestamp}</span>
                        </div>
                        <p className="text-slate-200 text-[11px] leading-tight break-words">
                          {evt.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
