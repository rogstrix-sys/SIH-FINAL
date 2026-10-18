import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Gauge,
  Lock,
  Unlock,
  Play,
  RotateCcw,
  Pause,
  AlertTriangle,
  Droplets,
  Layers,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export const SludgeCompactorController: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const compaction = useSimulationStore((s) => s.compactionTelemetry);
  const compactionParams = useSimulationStore((s) => s.compactionParams);
  const extendPiston = useSimulationStore((s) => s.extendCompactionPiston);
  const retractPiston = useSimulationStore((s) => s.retractCompactionPiston);
  const holdPiston = useSimulationStore((s) => s.holdCompactionPiston);
  const lockTransport = useSimulationStore((s) => s.lockTransportPosition);
  const unlockTransport = useSimulationStore((s) => s.unlockTransportPosition);
  const resetOverpressure = useSimulationStore((s) => s.resetCompactionOverpressure);
  const collectionVolumeL = useSimulationStore((s) => s.materialBalance.collectionVolumeL);

  const isLocked = compaction.isTransportLocked;
  const isExtending = compaction.pistonState === 'EXTENDING';
  const isRetracting = compaction.pistonState === 'RETRACTING';
  const isHolding = compaction.pistonState === 'HOLD';
  const isHome = compaction.pistonState === 'HOME' || (compaction.pistonState === 'LOCKED' && compaction.strokeMm === 0);

  // Pressure bar ratio (0 to 210 bar)
  const pressureRatio = Math.min(1.0, compaction.appliedPressureBar / compactionParams.overpressureTripBar);
  const isReliefActive = compaction.reliefValveOpen;
  const isTripped = compaction.overpressureTrip;

  return (
    <div className="bg-graphite-950/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-3 w-80 text-white font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-100">
            Sludge Compactor
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
              isTripped
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                : isLocked
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : isExtending
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                : isRetracting
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {compaction.pistonState}
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-graphite-800 transition-colors"
            title="Toggle panel"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-3">
          {/* Interlock Warning Banner if active */}
          {compaction.interlockBlocked && compaction.interlockBlockReason && (
            <div className="bg-rose-950/70 border border-rose-800/80 rounded-lg p-2 text-[10px] text-rose-200 flex items-start gap-1.5 leading-tight">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>{compaction.interlockBlockReason}</span>
            </div>
          )}

          {/* Overpressure Trip Alert */}
          {isTripped && (
            <div className="bg-rose-950/90 border border-rose-600 rounded-lg p-2 text-[10px] text-rose-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>OVERPRESSURE TRIP ({compaction.appliedPressureBar} bar)</span>
              </div>
              <button
                onClick={resetOverpressure}
                className="px-2 py-0.5 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded text-[10px]"
              >
                RESET
              </button>
            </div>
          )}

          {/* Live Gauges: Stroke & Pressure */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {/* Position */}
            <div className="bg-graphite-900/90 border border-slate-800 rounded-lg p-2">
              <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                <span>STROKE DEPTH</span>
                <span className="text-cyan-400 font-bold">{compaction.strokePct}%</span>
              </div>
              <div className="text-sm font-bold text-white mb-1">
                {compaction.strokeMm} <span className="text-[10px] text-slate-400 font-normal">/ {compactionParams.strokeMaxMm} mm</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-graphite-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-500 h-full transition-all duration-100"
                  style={{ width: `${compaction.strokePct}%` }}
                />
              </div>
            </div>

            {/* Cylinder Pressure */}
            <div className="bg-graphite-900/90 border border-slate-800 rounded-lg p-2">
              <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                <span>HYD PRESSURE</span>
                <span className={isReliefActive ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                  {compaction.compactionForceKn} kN
                </span>
              </div>
              <div className="text-sm font-bold text-white mb-1 flex items-baseline gap-1">
                <span className={isReliefActive ? 'text-amber-400' : 'text-white'}>
                  {compaction.appliedPressureBar}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">bar</span>
                {isReliefActive && (
                  <span className="text-[9px] text-amber-400 font-bold ml-auto animate-pulse">
                    RELIEF 180b
                  </span>
                )}
              </div>
              {/* Pressure meter bar */}
              <div className="w-full bg-graphite-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-100 ${
                    pressureRatio > 0.85
                      ? 'bg-rose-500'
                      : pressureRatio > 0.6
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${pressureRatio * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Dewatering Telemetry & Mass Balance */}
          <div className="bg-graphite-900/90 border border-slate-800 rounded-lg p-2 space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-slate-400">
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-400" />
                MASS-BALANCE DEWATERING
              </span>
              <span className="text-emerald-400 font-bold">
                CR: {compaction.compactionRatio.toFixed(2)}x (-{compaction.volumeReductionPct}%)
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Compressed Cake:</span>
              <span className="text-amber-300 font-bold">{compaction.cakeVolumeL} L</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Separated Filtrate:</span>
              <span className="text-cyan-300 font-bold">{compaction.filtrateVolumeL} L</span>
            </div>

            <div className="flex justify-between items-center text-[9px] text-slate-500 pt-0.5 border-t border-slate-800/60">
              <span>Bed Contact: {compaction.platenContact ? 'ENGAGED' : 'AWAITING SURFACE'}</span>
              <span>Tank Vent: ACTIVE PVRV</span>
            </div>
          </div>

          {/* Operator Action Buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              onClick={extendPiston}
              disabled={isLocked || isExtending || isTripped}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                isLocked || isExtending || isTripped
                  ? 'bg-graphite-800 text-slate-600 cursor-not-allowed border border-slate-800'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md hover:shadow-cyan-500/20 active:scale-95'
              }`}
              title="Drive porous platen downward into sludge bed"
            >
              <Play className="w-3 h-3 fill-current" />
              COMPRESS
            </button>

            <button
              onClick={retractPiston}
              disabled={isLocked || isRetracting || isHome || isTripped}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                isLocked || isRetracting || isHome || isTripped
                  ? 'bg-graphite-800 text-slate-600 cursor-not-allowed border border-slate-800'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md active:scale-95'
              }`}
              title="Retract platen upward toward home position"
            >
              <RotateCcw className="w-3 h-3" />
              RETRACT
            </button>

            <button
              onClick={holdPiston}
              disabled={isLocked || isHolding}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                isLocked || isHolding
                  ? 'bg-graphite-800 text-slate-600 cursor-not-allowed border border-slate-800'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-95'
              }`}
              title="Close hydraulic valves and lock position"
            >
              <Pause className="w-3 h-3 fill-current" />
              HOLD
            </button>
          </div>

          {/* Mechanical Transport Lock Controls */}
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 flex items-center gap-1">
              {isLocked ? (
                <Lock className="w-3 h-3 text-amber-400" />
              ) : (
                <Unlock className="w-3 h-3 text-emerald-400" />
              )}
              Lock Pin:
            </span>

            {isLocked ? (
              <button
                onClick={unlockTransport}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all"
                title="Disengage transport lock pins to arm compaction"
              >
                UNLOCK PIN
              </button>
            ) : (
              <button
                onClick={lockTransport}
                disabled={compaction.strokeMm > 5}
                className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                  compaction.strokeMm > 5
                    ? 'bg-graphite-800 text-slate-600 cursor-not-allowed border border-slate-800'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-95'
                }`}
                title={compaction.strokeMm > 5 ? 'Retract to top home position before locking' : 'Engage mechanical pins for vehicle travel'}
              >
                LOCK FOR TRAVEL
              </button>
            )}
          </div>

          {/* Conceptual Disclaimer Badge */}
          <div className="text-[9px] text-slate-500 leading-tight pt-1 border-t border-slate-800/60 flex items-start gap-1">
            <Info className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
            <span>Simulated conceptual model. Dewatering ratios (1.2x–1.8x) are theoretical estimates not validated in physical field trials.</span>
          </div>
        </div>
      )}
    </div>
  );
};
