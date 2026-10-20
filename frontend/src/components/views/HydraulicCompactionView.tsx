import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Play,
  RotateCcw,
  Lock,
  Unlock,
  Layers,
  Cpu,
  Activity,
  Droplets,
  Gauge,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Slider } from '../ui/Slider';
import {
  calculatePistonKinematics,
  strokeMmToPlatenX,
  PISTON_CONFIG
} from '../../utils/pistonUnitConversions';
import { calculateDewateringState } from '../../utils/sludgeCompactionModel';
import { DEFAULT_COMPACTION_PARAMS } from '../../types/sludgeCompaction';

export const HydraulicCompactionView: React.FC = () => {
  const compactionTelemetry = useSimulationStore((s) => s.compactionTelemetry);
  const compactionParams = useSimulationStore((s) => s.compactionParams);
  const setCompactionStrokePct = useSimulationStore((s) => s.setCompactionStrokePct);
  const retractCompactionPiston = useSimulationStore((s) => s.retractCompactionPiston);
  const lockTransportPosition = useSimulationStore((s) => s.lockTransportPosition);
  const unlockTransportPosition = useSimulationStore((s) => s.unlockTransportPosition);
  const resetCompactionOverpressure = useSimulationStore((s) => s.resetCompactionOverpressure);

  const mobilityTelemetry = useSimulationStore((s) => s.mobilityTelemetry);
  const materialBalance = useSimulationStore((s) => s.materialBalance);
  const alarms = useSimulationStore((s) => s.alarms);
  const interlocks = useSimulationStore((s) => s.interlocks);
  const operatingState = useSimulationStore((s) => s.operatingState);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);

  const [interlockNotice, setInterlockNotice] = useState<string | null>(null);
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(false);
  const [showFullScadaLab, setShowFullScadaLab] = useState<boolean>(false);

  const maxStrokeMm = compactionParams?.strokeMaxMm || PISTON_CONFIG.strokeMaxMm;
  const currentStrokeMm = compactionTelemetry?.strokeMm || 0;
  const currentStrokePct =
    compactionTelemetry?.strokePct ?? Math.round((currentStrokeMm / maxStrokeMm) * 100);

  const kinematics = calculatePistonKinematics(
    { strokeMm: currentStrokeMm, strokePct: currentStrokePct },
    maxStrokeMm
  );

  const initialVolumeL = compactionTelemetry?.initialSludgeVolumeL || 400;
  const dewatering = calculateDewateringState(
    currentStrokeMm,
    0,
    initialVolumeL,
    compactionParams || DEFAULT_COMPACTION_PARAMS
  );

  const isVehicleMoving = Boolean(mobilityTelemetry?.isMoving);
  const isPumping = operatingState === 'EXTRACT' || operatingState === 'DISCHARGE';
  const isEmergencyStop =
    Boolean(alarms?.emergencyStopActive) || Boolean(interlocks?.emergencyStopLatched);
  const isOverpressure = Boolean(compactionTelemetry?.overpressureTrip);

  const hasInterlockBlock = isVehicleMoving || isPumping || isEmergencyStop || isOverpressure;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetPct = parseFloat(e.target.value);
    const result = setCompactionStrokePct(targetPct);
    if (!result.accepted) {
      setInterlockNotice(result.reason || 'Safety interlock active.');
      setTimeout(() => setInterlockNotice(null), 3500);
    } else {
      setInterlockNotice(null);
    }
  };

  const handleAutoCycle = () => {
    if (isAutoCycling || hasInterlockBlock) return;
    setIsAutoCycling(true);
    let step = currentStrokePct;
    const interval = setInterval(() => {
      step += 4;
      if (step >= 100) {
        setCompactionStrokePct(100);
        clearInterval(interval);
        setTimeout(() => {
          let retractStep = 100;
          const retractInterval = setInterval(() => {
            retractStep -= 6;
            if (retractStep <= 0) {
              setCompactionStrokePct(0);
              clearInterval(retractInterval);
              setIsAutoCycling(false);
            } else {
              setCompactionStrokePct(retractStep);
            }
          }, 80);
        }, 800);
      } else {
        setCompactionStrokePct(step);
      }
    }, 80);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-graphite-950 p-4 sm:p-6 space-y-6">
      {/* Title & System Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Horizontal Hydraulic Dewatering & Compaction Ram
            </h2>
            <Badge variant="cyan" size="sm">
              {compactionTelemetry.pistonState}
            </Badge>
            {compactionTelemetry.isTransportLocked && (
              <Badge variant="warning" size="sm">
                TRANSPORT LOCKED
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Axial hydraulic cylinder along vehicle X-axis compressing sludge against forward wedge-wire screen (203.6 kN peak thrust at 180 bar).
          </p>
        </div>

        {/* Global Safety Interlock Indicator */}
        <div className="flex items-center gap-3">
          {hasInterlockBlock ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-700/80 text-rose-300 text-xs font-mono font-bold animate-pulse">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>
                {isEmergencyStop
                  ? 'INTERLOCK: E-STOP ACTIVE'
                  : isVehicleMoving
                  ? 'INTERLOCK: VEHICLE IN MOTION'
                  : isPumping
                  ? 'INTERLOCK: PUMP ACTIVE'
                  : 'INTERLOCK: OVERPRESSURE TRIP'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>INTERLOCKS CLEAR (RAM READY)</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedComponent('compactor')}
            className="text-xs font-mono"
          >
            Inspect Ram Specs
          </Button>
        </div>
      </div>

      {interlockNotice && (
        <div className="bg-rose-950/95 border border-rose-600 p-3 rounded-xl flex items-center justify-between text-xs text-rose-200 font-mono animate-bounce">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-bold">COMMAND INHIBITED: {interlockNotice}</span>
          </div>
          <button
            onClick={() => setInterlockNotice(null)}
            className="px-2 py-0.5 rounded bg-rose-900 text-rose-100 hover:bg-rose-800 text-[10px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Primary Travel Controls */}
        <div className="lg:col-span-5 space-y-5">
          <Card
            title="Hydraulic Displacement Controls"
            subtitle="Dual double-acting hydraulic ram displacement along longitudinal tank axis"
            icon={<Sliders className="w-4 h-4 text-teal-400" />}
          >
            <div className="space-y-4 pt-1">
              {/* Stroke Travel Slider */}
              <div className="bg-graphite-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Platen Stroke Position:</span>
                  <span className="text-teal-300 font-bold text-sm">
                    {currentStrokePct}% ({currentStrokeMm} mm / {maxStrokeMm} mm)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={currentStrokePct}
                  disabled={hasInterlockBlock || isAutoCycling}
                  onChange={handleSliderChange}
                  className="w-full accent-teal-400 cursor-pointer disabled:opacity-50 h-2 bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0% (Home / -0.50m)</span>
                  <span>50% (Mid / -0.20m)</span>
                  <span>100% (Consolidated / +0.10m)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompactionStrokePct(0)}
                  disabled={hasInterlockBlock || isAutoCycling}
                  className="text-xs font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retract Home
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompactionStrokePct(100)}
                  disabled={hasInterlockBlock || isAutoCycling}
                  className="text-xs font-mono"
                >
                  Full Stroke
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAutoCycle}
                  disabled={hasInterlockBlock || isAutoCycling}
                  className="text-xs font-mono bg-teal-600 hover:bg-teal-500 text-white"
                >
                  <Play className="w-3.5 h-3.5 mr-1 fill-current" /> Auto Dewater
                </Button>
              </div>

              {/* Transport Lock & Overpressure Clear Controls */}
              <div className="flex items-center gap-3 pt-1">
                {compactionTelemetry.isTransportLocked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={unlockTransportPosition}
                    className="flex-1 text-xs font-mono border-amber-500/60 text-amber-300 hover:bg-amber-950/40"
                  >
                    <Unlock className="w-3.5 h-3.5 mr-1.5" /> Disengage Transport Lock
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={lockTransportPosition}
                    disabled={currentStrokeMm > 5}
                    className="flex-1 text-xs font-mono border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5" /> Engage Transport Lock Pin
                  </Button>
                )}

                {compactionTelemetry.overpressureTrip && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={resetCompactionOverpressure}
                    className="flex-1 text-xs font-mono"
                  >
                    Reset Overpressure Trip
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Kinematic Geometry Table */}
          <div className="bg-graphite-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-400" />
              <span>3D Kinematic Coordinates (Tank X-Axis)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-400 block">Platen 3D X:</span>
                <span className="text-teal-300 font-bold">{kinematics.platenX.toFixed(3)} m</span>
              </div>
              <div>
                <span className="text-slate-400 block">Rod Extension Length:</span>
                <span className="text-slate-200 font-bold">{kinematics.rodLengthM.toFixed(3)} m</span>
              </div>
              <div>
                <span className="text-slate-400 block">Cake Bed Length:</span>
                <span className="text-amber-300 font-bold">{kinematics.cakeLengthM.toFixed(3)} m</span>
              </div>
              <div>
                <span className="text-slate-400 block">Screen Partition:</span>
                <span className="text-slate-400 font-bold">X = +0.220 m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dewatering Telemetry & Multi-Physics Laboratory */}
        <div className="lg:col-span-7 space-y-5">
          {/* Multi-Physics Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="bg-graphite-900 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Hydraulic Thrust</span>
              <span className="text-base font-bold text-teal-400 mt-0.5 block">
                {compactionTelemetry.compactionForceKn} kN
              </span>
              <span className="text-[10px] text-slate-400">Peak: 203.6 kN</span>
            </div>

            <div className="bg-graphite-900 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Fluid Pressure</span>
              <span className="text-base font-bold text-cyan-400 mt-0.5 block">
                {compactionTelemetry.appliedPressureBar} bar
              </span>
              <span className="text-[10px] text-slate-400">Relief: 180 bar</span>
            </div>

            <div className="bg-graphite-900 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Volume Reduction</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                {kinematics.volumeReductionPct}%
              </span>
              <span className="text-[10px] text-slate-400">Ratio: {dewatering.compactionRatio.toFixed(2)}x</span>
            </div>

            <div className="bg-graphite-900 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cake Total Solids</span>
              <span className="text-base font-bold text-amber-400 mt-0.5 block">
                {kinematics.solidsConcentrationPct}% TS
              </span>
              <span className="text-[10px] text-emerald-400">Initial: 4.2%</span>
            </div>
          </div>

          {/* Mass Conservation Balance Panel */}
          <Card
            title="Conservation of Mass & Dewatering Equilibrium"
            subtitle="Real-time phase separation between compressed cake bed and expressed filtrate"
            icon={<Droplets className="w-4 h-4 text-cyan-400" />}
          >
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-graphite-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Captured Sludge</span>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {initialVolumeL} L
                  </span>
                  <span className="text-[10px] text-slate-400">Raw Chamber Charge</span>
                </div>

                <div className="p-3 rounded-lg bg-graphite-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Consolidated Cake</span>
                  <span className="text-sm font-bold text-amber-400 mt-1 block">
                    {Math.round(dewatering.cakeVolumeL)} L
                  </span>
                  <span className="text-[10px] text-amber-300">Retained Sludge Solids</span>
                </div>

                <div className="p-3 rounded-lg bg-graphite-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Expelled Filtrate</span>
                  <span className="text-sm font-bold text-emerald-400 mt-1 block">
                    {Math.round(dewatering.filtrateVolumeL)} L
                  </span>
                  <span className="text-[10px] text-emerald-300">Filtered Free Water</span>
                </div>
              </div>

              {/* Visual Phase Ratio Bar */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-400">Dewatered Cake ({Math.round((dewatering.cakeVolumeL / initialVolumeL) * 100)}%)</span>
                  <span className="text-emerald-400">Expressed Water ({Math.round((dewatering.filtrateVolumeL / initialVolumeL) * 100)}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${(dewatering.cakeVolumeL / initialVolumeL) * 100}%` }}
                  />
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(dewatering.filtrateVolumeL / initialVolumeL) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Collapsible Full Multi-Physics SCADA Laboratory */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowFullScadaLab(!showFullScadaLab)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-graphite-900 hover:bg-graphite-850 border border-teal-500/30 text-teal-300 font-mono text-xs transition group shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400 group-hover:rotate-12 transition-transform" />
                <span className="font-bold">
                  {showFullScadaLab ? 'Collapse Multi-Physics Laboratory' : 'Expand Integrated Multi-Physics SCADA Laboratory'}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Slope Stability, Macerator & Altitude PCP Cavitation)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/dashboard.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 flex items-center gap-1"
                  title="Open Integrated SCADA Dashboard in new browser tab"
                >
                  <span>Popout</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                {showFullScadaLab ? (
                  <ChevronUp className="w-4 h-4 text-teal-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-teal-400" />
                )}
              </div>
            </button>

            {showFullScadaLab && (
              <div className="mt-3 rounded-xl overflow-hidden border border-teal-500/40 bg-slate-950 shadow-2xl animate-in fade-in slide-in-from-top-2">
                <div className="h-[750px] w-full">
                  <iframe
                    src="/dashboard.html"
                    title="Integrated Multi-Physics SCADA Laboratory"
                    className="w-full h-full border-0 block"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HydraulicCompactionView;
