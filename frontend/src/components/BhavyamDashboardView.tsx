import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import {
  Activity,
  Layers,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export interface BhavyamDashboardViewProps {
  onPistonChangeFrom3D?: (strokePct: number) => void;
  className?: string;
  isCompact?: boolean;
}

/**
 * BhavyamDashboardView: Integrates the Bharat-Jal SCADA Mk-IV multi-physics simulation
 * dashboard with the live 3D Mountain Terrain Desludging Unit.
 *
 * Primary Synchronization Requirement:
 * Single Source of Truth for Piston Position:
 * - Dashboard: 0% to 100% displacement
 * - 3D Mechanical Compaction Cylinder: 0 mm to 600 mm travel
 * - Direct bidirectional interlock-safe synchronization
 */
export const BhavyamDashboardView: React.FC<BhavyamDashboardViewProps> = ({
  className = '',
  isCompact = false
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);
  const [interlockNotice, setInterlockNotice] = useState<string | null>(null);

  // Store telemetry subscriptions
  const compactionTelemetry = useSimulationStore((s) => s.compactionTelemetry);
  const compactionParams = useSimulationStore((s) => s.compactionParams);
  const setCompactionStrokePct = useSimulationStore((s) => s.setCompactionStrokePct);
  const mobilityTelemetry = useSimulationStore((s) => s.mobilityTelemetry);
  const materialBalance = useSimulationStore((s) => s.materialBalance);
  const alarms = useSimulationStore((s) => s.alarms);
  const operatingState = useSimulationStore((s) => s.operatingState);

  // Derive normalized values
  const maxStrokeMm = compactionParams?.strokeMaxMm || 600;
  const currentStrokeMm = compactionTelemetry?.strokeMm || 0;
  const currentStrokePct =
    compactionTelemetry?.strokePct ?? Math.round((currentStrokeMm / maxStrokeMm) * 100);

  // Sync to iframe whenever store piston stroke changes from other sources (e.g., 3D sim, auto workflow)
  const syncToIframe = useCallback(
    (strokePct: number, interlockWarning?: string) => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      // 1. Attempt postMessage
      iframe.contentWindow.postMessage(
        {
          type: 'SYNC_FROM_3D_PISTON',
          stroke: strokePct,
          pistonOn: true
        },
        '*'
      );

      // 2. Direct DOM fallback if same-origin
      try {
        const cw = iframe.contentWindow as any;
        if (cw.__BHAVYAM_DASHBOARD__) {
          cw.__BHAVYAM_DASHBOARD__.setPistonStroke(strokePct);
          if (interlockWarning) {
            cw.__BHAVYAM_DASHBOARD__.logMessage(`⚠️ INTERLOCK: ${interlockWarning}`);
          }
        }
      } catch (e) {
        // Cross-origin fallback handled by postMessage
      }
    },
    []
  );

  // Sync environmental & vehicle telemetry from 3D scene into dashboard
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow || !isIframeLoaded) return;

    const pitchDeg = Math.round(mobilityTelemetry?.pitchDeg || 0);
    const rollDeg = Math.round(mobilityTelemetry?.rollDeg || 0);
    const payloadL = Math.round(materialBalance?.collectionVolumeL || 280);

    iframe.contentWindow.postMessage(
      {
        type: 'SYNC_FROM_3D_VEHICLE',
        pitch: pitchDeg,
        roll: rollDeg,
        payloadL: payloadL,
        isMoving: mobilityTelemetry?.isMoving || false,
        speedKmh: mobilityTelemetry?.speedKmh || 0
      },
      '*'
    );

    try {
      const cw = iframe.contentWindow as any;
      if (cw.__BHAVYAM_DASHBOARD__) {
        cw.__BHAVYAM_DASHBOARD__.setVehicleState(pitchDeg, rollDeg, payloadL);
      }
    } catch (e) {
      // Ignored
    }
  }, [
    isIframeLoaded,
    mobilityTelemetry?.pitchDeg,
    mobilityTelemetry?.rollDeg,
    mobilityTelemetry?.isMoving,
    mobilityTelemetry?.speedKmh,
    materialBalance?.collectionVolumeL
  ]);

  // Sync store piston stroke to iframe when store changes
  useEffect(() => {
    if (!isIframeLoaded) return;
    syncToIframe(currentStrokePct);
  }, [currentStrokePct, isIframeLoaded, syncToIframe]);

  // Listen for piston inputs originating inside Bhavyam dashboard
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'BHAVYAM_PISTON_INPUT') {
        const requestedPct = typeof data.stroke === 'number' ? data.stroke : 60;

        // Execute through store action with safety interlocks
        const result = setCompactionStrokePct(requestedPct);

        if (!result.accepted) {
          const warningText = result.reason || 'Safety interlock active';
          setInterlockNotice(warningText);

          // Reject command and snap dashboard back to true simulated position
          syncToIframe(currentStrokePct, warningText);

          setTimeout(() => {
            setInterlockNotice((cur) => (cur === warningText ? null : cur));
          }, 3500);
        } else {
          setInterlockNotice(null);
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [setCompactionStrokePct, syncToIframe, currentStrokePct]);

  return (
    <div
      className={`flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl ${className}`}
    >
      {/* Synchronization Status & Interlock Strip */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Bharat-Jal SCADA Mk-IV Telemetry Bridge
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-teal-300 font-semibold">
            Piston: {currentStrokePct}% ({currentStrokeMm}mm / {maxStrokeMm}mm)
          </span>
        </div>

        {/* Real-time Interlock Status Indicator */}
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          {alarms?.emergencyStopActive ||
          mobilityTelemetry?.isMoving ||
          operatingState === 'EXTRACT' ? (
            <span className="flex items-center space-x-1 text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {alarms?.emergencyStopActive
                  ? 'INTERLOCK: E-STOP ACTIVE'
                  : mobilityTelemetry?.isMoving
                  ? 'INTERLOCK: VEHICLE IN MOTION'
                  : 'INTERLOCK: SLURRY PUMP ACTIVE'}
              </span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>INTERLOCKS CLEAR (DEWATERING READY)</span>
            </span>
          )}

          <a
            href="/dashboard.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
            title="Open standalone Bhavyam Dashboard in new browser window"
          >
            <span>Popout</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Interlock Warning Alert Toast */}
      {interlockNotice && (
        <div className="bg-rose-950/95 border-b border-rose-600 px-4 py-2 flex items-center justify-between text-xs text-rose-200 font-mono animate-bounce">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-bold">COMMAND REJECTED: {interlockNotice}</span>
          </div>
          <button
            onClick={() => setInterlockNotice(null)}
            className="px-2 py-0.5 rounded bg-rose-900 text-rose-100 hover:bg-rose-800 text-[10px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Embedded Bhavyam SCADA Mk-IV Dashboard Frame */}
      <div className={`w-full relative ${isCompact ? 'h-[640px]' : 'h-[1400px] min-h-[1000px]'}`}>
        <iframe
          ref={iframeRef}
          src="/dashboard.html"
          title="Bhavyam Multi-Physics Desludging Dashboard"
          className="w-full h-full border-0 block"
          onLoad={() => {
            setIsIframeLoaded(true);
            syncToIframe(currentStrokePct);
          }}
        />
      </div>
    </div>
  );
};
export default BhavyamDashboardView;
