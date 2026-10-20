import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import {
  Sliders,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Play,
  RotateCcw,
  Lock,
  Unlock,
  ExternalLink,
  Layers,
  Cpu,
  ChevronDown,
  ChevronUp,
  Activity,
  Droplets,
  Gauge,
  Zap,
  CheckCircle2
} from 'lucide-react';
import {
  calculatePistonKinematics,
  PISTON_CONFIG
} from '../utils/pistonUnitConversions';

export interface BhavyamSCADAPanelProps {
  className?: string;
  compact?: boolean;
}

export const BhavyamSCADAPanel: React.FC<BhavyamSCADAPanelProps> = ({
  className = '',
  compact = false
}) => {
  // Store subscriptions
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
  const displayOptions = useSimulationStore((s) => s.displayOptions);
  const toggleDisplayOption = useSimulationStore((s) => s.toggleDisplayOption);

  // Local state
  const [interlockNotice, setInterlockNotice] = useState<string | null>(null);
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(false);
  const [showFullScadaLab, setShowFullScadaLab] = useState<boolean>(false);
  const [bafflesEnabled, setBafflesEnabled] = useState<boolean>(true);
  const [lowChassisEnabled, setLowChassisEnabled] = useState<boolean>(true);

  // iframe reference for embedded full SCADA engine
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isIframeReady, setIsIframeReady] = useState<boolean>(false);

  // Authoritative kinematics derived from store state
  const maxStrokeMm = compactionParams?.strokeMaxMm || PISTON_CONFIG.strokeMaxMm;
  const currentStrokeMm = compactionTelemetry?.strokeMm || 0;
  const currentStrokePct =
    compactionTelemetry?.strokePct ?? Math.round((currentStrokeMm / maxStrokeMm) * 100);

  const kinematics = calculatePistonKinematics(
    { strokeMm: currentStrokeMm, strokePct: currentStrokePct },
    maxStrokeMm
  );

  // Check active safety interlocks
  const isVehicleMoving = Boolean(mobilityTelemetry?.isMoving);
  const isPumping =
    operatingState === 'EXTRACT' ||
    operatingState === 'DISCHARGE';
  const isEmergencyStop =
    Boolean(alarms?.emergencyStopActive) || Boolean(interlocks?.emergencyStopLatched);
  const isOverpressure = Boolean(compactionTelemetry?.overpressureTrip);

  const hasInterlockBlock =
    isVehicleMoving || isPumping || isEmergencyStop || isOverpressure;

  const interlockReason = isVehicleMoving
    ? 'Vehicle in motion: Stop crawler tracks before operating compaction ram.'
    : isPumping
    ? 'Slurry transfer active: Stop pump before piston dewatering.'
    : isEmergencyStop
    ? 'Emergency stop active: Reset safety E-Stop before actuating hydraulic cylinder.'
    : isOverpressure
    ? 'Hydraulic overpressure trip latched: Clear fault on relief valve before proceeding.'
    : null;

  // Handle user manual slider movement
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetPct = parseFloat(e.target.value);
    const result = setCompactionStrokePct(targetPct);

    if (!result.accepted) {
      const reason = result.reason || 'Safety interlock blocked movement';
      setInterlockNotice(reason);
      // Snap slider back
      e.target.value = String(currentStrokePct);
      setTimeout(() => {
        setInterlockNotice((cur) => (cur === reason ? null : cur));
      }, 3500);
    } else {
      setInterlockNotice(null);
      syncToIframe(targetPct);
    }
  };

  // 1-Click Automated Dewatering Cycle
  const handleRunAutoCycle = useCallback(async () => {
    if (hasInterlockBlock) {
      setInterlockNotice(interlockReason || 'Interlock active: Cannot start auto cycle.');
      return;
    }
    if (isAutoCycling) return;

    setIsAutoCycling(true);
    setInterlockNotice(null);

    // Sequence: Advance (35%) -> Compact (75%) -> High Pressure Consolidation (95%) -> Return (0%)
    const steps = [
      { pct: 20, delay: 400 },
      { pct: 50, delay: 600 },
      { pct: 80, delay: 800 },
      { pct: 95, delay: 1000 },
      { pct: 80, delay: 500 },
      { pct: 30, delay: 500 },
      { pct: 0, delay: 400 }
    ];

    for (const step of steps) {
      // Re-verify interlocks at each stage
      const store = useSimulationStore.getState();
      if (
        store.mobilityTelemetry.isMoving ||
        store.alarms.emergencyStopActive ||
        store.operatingState === 'EXTRACT'
      ) {
        setInterlockNotice('Auto cycle aborted: Interlock triggered during stroke.');
        break;
      }
      setCompactionStrokePct(step.pct);
      syncToIframe(step.pct);
      await new Promise((r) => setTimeout(r, step.delay));
    }

    setIsAutoCycling(false);
  }, [hasInterlockBlock, interlockReason, isAutoCycling, setCompactionStrokePct]);

  // Sync to iframe whenever store piston position changes
  const syncToIframe = useCallback((strokePct: number) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    iframe.contentWindow.postMessage(
      {
        type: 'SYNC_FROM_3D_PISTON',
        stroke: strokePct,
        pistonOn: true
      },
      '*'
    );

    try {
      const cw = iframe.contentWindow as any;
      if (cw.__BHAVYAM_DASHBOARD__) {
        cw.__BHAVYAM_DASHBOARD__.setPistonStroke(strokePct);
      }
    } catch {
      // Ignored
    }
  }, []);

  // Listen for piston inputs originating from iframe if loaded
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'BHAVYAM_PISTON_INPUT') {
        const req = typeof data.stroke === 'number' ? data.stroke : 60;
        const res = setCompactionStrokePct(req);
        if (!res.accepted) {
          const reason = res.reason || 'Safety interlock active';
          setInterlockNotice(reason);
          syncToIframe(currentStrokePct);
          setTimeout(() => {
            setInterlockNotice((c) => (c === reason ? null : c));
          }, 3500);
        } else {
          setInterlockNotice(null);
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [setCompactionStrokePct, currentStrokePct, syncToIframe]);

  // Sync vehicle parameters to iframe whenever they update
  useEffect(() => {
    if (!isIframeReady) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const pitch = Math.round(mobilityTelemetry?.pitchDeg || 0);
    const roll = Math.round(mobilityTelemetry?.rollDeg || 0);
    const payload = Math.round(materialBalance?.collectionVolumeL || 280);

    iframe.contentWindow.postMessage(
      {
        type: 'SYNC_FROM_3D_VEHICLE',
        pitch,
        roll,
        payloadL: payload,
        isMoving: mobilityTelemetry?.isMoving || false,
        speedKmh: mobilityTelemetry?.speedKmh || 0
      },
      '*'
    );
  }, [
    isIframeReady,
    mobilityTelemetry?.pitchDeg,
    mobilityTelemetry?.rollDeg,
    mobilityTelemetry?.isMoving,
    materialBalance?.collectionVolumeL
  ]);

  return (
    <div className={`space-y-3.5 text-xs font-sans ${className}`}>
      {/* 1. Header Bar: Subsystem ID & Interlock Status */}
      <div className="bg-graphite-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-sm font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-white font-bold uppercase tracking-wider text-[11px]">
            Hydraulic Compaction & Dewatering Ram
          </span>
        </div>

        {/* Real-Time Safety Interlock Badge */}
        {hasInterlockBlock ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-700/80 text-rose-300 text-[10px] font-bold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span className="truncate max-w-[200px]">INTERLOCK: {interlockReason}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-[10px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>INTERLOCKS CLEAR (DEWATERING ARMED)</span>
          </div>
        )}
      </div>

      {/* Interlock Warning Alert Toast */}
      {interlockNotice && (
        <div className="bg-rose-950 border border-rose-600 p-2.5 rounded-xl flex items-center justify-between text-xs text-rose-200 font-mono animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-bold">COMMAND REJECTED: {interlockNotice}</span>
          </div>
          <button
            onClick={() => setInterlockNotice(null)}
            className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-[10px] font-semibold text-rose-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Interactive Piston Compression Stroke Slider & 1-Click Auto Cycle */}
      <div className="bg-graphite-950/90 p-4 rounded-xl border border-teal-500/40 shadow-xl space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <label
            htmlFor="piston-stroke-slider"
            className="text-teal-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            Hydraulic Compaction Piston Displacement
          </label>
          <span className="text-teal-300 font-bold text-xs bg-teal-950/80 px-2.5 py-0.5 rounded border border-teal-500/40">
            {currentStrokePct}% ({currentStrokeMm} mm • {kinematics.appliedPressureBar} bar)
          </span>
        </div>

        {/* Master Piston Stroke Slider */}
        <div className="space-y-1">
          <input
            id="piston-stroke-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            value={currentStrokePct}
            onChange={handleSliderChange}
            disabled={hasInterlockBlock || isAutoCycling}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>0% (Raw Slurry / Home)</span>
            <span className="text-teal-400 font-semibold">50% Compaction</span>
            <span className="text-emerald-400 font-bold">100% (Dense Cake: 600 mm)</span>
          </div>
        </div>

        {/* Visual Progress Bar for Physical Stroke */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex border border-slate-700/60">
          <div
            className={`h-full transition-all duration-300 ${
              currentStrokePct > 70
                ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                : currentStrokePct > 30
                ? 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]'
                : 'bg-cyan-400'
            }`}
            style={{ width: `${currentStrokePct}%` }}
          />
        </div>

        {/* Multi-Physics Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
          <div className="bg-graphite-900 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block uppercase">Compaction Force</span>
            <span className="text-amber-300 font-bold text-xs">
              {kinematics.compactionForceKn} kN
            </span>
          </div>

          <div className="bg-graphite-900 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block uppercase">Chamber Pressure</span>
            <span className="text-cyan-300 font-bold text-xs">
              {kinematics.appliedPressureBar} bar
            </span>
          </div>

          <div className="bg-graphite-900 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block uppercase">Cake Total Solids</span>
            <span className="text-emerald-400 font-bold text-xs">
              {kinematics.solidsConcentrationPct}% TS
            </span>
          </div>

          <div className="bg-graphite-900 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block uppercase">Filtrate Expressed</span>
            <span className="text-teal-300 font-bold text-xs">
              {kinematics.volumeReductionPct}% (Gain: {(1 + (currentStrokePct / 100) * 2.2).toFixed(1)}x)
            </span>
          </div>
        </div>

        {/* Action Controls: 1-Click Auto Cycle & Home Retract */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleRunAutoCycle}
            disabled={hasInterlockBlock || isAutoCycling}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-bold transition shadow-sm ${
              isAutoCycling
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/50 active:scale-95'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Play className={`w-3.5 h-3.5 ${isAutoCycling ? 'animate-spin' : ''}`} />
            <span>{isAutoCycling ? 'Compacting Cycle Active...' : '▶ Run Dewater Cycle (Auto)'}</span>
          </button>

          <button
            type="button"
            onClick={retractCompactionPiston}
            disabled={hasInterlockBlock || isAutoCycling || currentStrokeMm <= 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono bg-graphite-900 hover:bg-graphite-850 text-slate-300 border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Retract compaction platen to 0 mm top home position"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Home (0 mm)</span>
          </button>

          {compactionTelemetry.isTransportLocked ? (
            <button
              type="button"
              onClick={unlockTransportPosition}
              disabled={isAutoCycling}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition"
              title="Disengage mechanical retention pins"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pins Engaged</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={lockTransportPosition}
              disabled={hasInterlockBlock || currentStrokeMm > 5 || isAutoCycling}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono bg-graphite-900 hover:bg-graphite-850 text-slate-400 border border-slate-700 transition disabled:opacity-40"
              title="Engage dual mechanical retention pins for safe transport"
            >
              <Unlock className="w-3.5 h-3.5 text-slate-500" />
              <span>Lock Transport</span>
            </button>
          )}

          {isOverpressure && (
            <button
              type="button"
              onClick={resetCompactionOverpressure}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-rose-950 text-rose-300 border border-rose-700 animate-pulse"
            >
              Reset Relief
            </button>
          )}
        </div>
      </div>

      {/* 3. Subsystem Physical Toggles */}
      <div className="bg-graphite-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800 pb-1">
          <span>Active Stability & Fluid Physics Options</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bafflesEnabled}
              onChange={(e) => {
                setBafflesEnabled(e.target.checked);
                toggleDisplayOption('cutaway');
              }}
              className="rounded bg-slate-900 border-slate-700 text-teal-400 accent-teal-500"
            />
            <span className="text-slate-300">Dual Longitudinal Anti-Slosh Baffles</span>
            <span className="text-[10px] text-amber-400 font-bold">(Damps Surge 68%)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lowChassisEnabled}
              onChange={(e) => setLowChassisEnabled(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-teal-400 accent-teal-500"
            />
            <span className="text-slate-300">Low-Slung Battery Chassis (CoM: 0.42m)</span>
          </label>
        </div>
      </div>

      {/* 4. Subsystem CAD Specifications Card */}
      <div className="bg-graphite-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="text-white font-bold flex items-center gap-1.5 text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            TERRA-VAC 450 Compaction Ram Specifications
          </span>
          <span className="text-[10px] text-teal-400 font-semibold">TRL-7 Validated</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-slate-400 block">Hydraulic Cylinder Bore:</span>
            <span className="text-slate-200 font-semibold">Ø120 mm Heavy-Duty Tie-Rod</span>
          </div>
          <div>
            <span className="text-slate-400 block">Precision Piston Rod:</span>
            <span className="text-slate-200 font-semibold">Ø60 mm Hard Chrome Steel</span>
          </div>
          <div>
            <span className="text-slate-400 block">Max Guided Stroke Travel:</span>
            <span className="text-slate-200 font-semibold">{maxStrokeMm} mm Vertical</span>
          </div>
          <div>
            <span className="text-slate-400 block">Hydraulic Thrust @ 180 bar:</span>
            <span className="text-slate-200 font-semibold">203.6 kN Peak Thrust</span>
          </div>
          <div>
            <span className="text-slate-400 block">Consolidation Sieve Platen:</span>
            <span className="text-slate-200 font-semibold">1.1m x 0.65m Reinforced Sieve</span>
          </div>
          <div>
            <span className="text-slate-400 block">Transport Interlock:</span>
            <span className="text-slate-200 font-semibold">Dual Pin Position Interlock</span>
          </div>
        </div>
      </div>

      {/* 5. Collapsible Full Multi-Physics Laboratory Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowFullScadaLab(!showFullScadaLab)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-graphite-950 hover:bg-graphite-900 border border-teal-500/30 text-teal-300 font-mono text-xs transition group"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400 group-hover:rotate-12 transition-transform" />
            <span className="font-bold">
              {showFullScadaLab ? 'Collapse Multi-Physics Laboratory' : 'Expand Integrated Multi-Physics Laboratory'}
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

        {/* Embedded Full SCADA Lab Dock */}
        {showFullScadaLab && (
          <div className="mt-3 rounded-xl overflow-hidden border border-teal-500/40 bg-slate-950 shadow-2xl animate-in fade-in slide-in-from-top-2">
            <div className="h-[750px] w-full">
              <iframe
                ref={iframeRef}
                src="/dashboard.html"
                title="Integrated Multi-Physics SCADA Laboratory"
                className="w-full h-full border-0 block"
                onLoad={() => {
                  setIsIframeReady(true);
                  syncToIframe(currentStrokePct);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BhavyamSCADAPanel;
