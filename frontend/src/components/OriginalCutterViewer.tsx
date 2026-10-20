import React, { useEffect, useRef, useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { TERRAIN_SCENARIOS } from '../simulation/terrainFeasibilityModel';

interface OriginalCutterViewerProps {
  className?: string;
}

/**
 * Original Bhavyam Cutter & Progressive Cavity Pump Visualizer
 * Faithful port of origin/bhavyam19:dashboard/index.html (lines 589-605, 2390-2640)
 */
export const OriginalCutterViewer: React.FC<OriginalCutterViewerProps> = ({
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rightCanvasMode, setRightCanvasMode] = useState<'macerator' | 'pcp'>('macerator');

  const cutterTelemetry = useSimulationStore((s) => s.cutterTelemetry);
  const thermalTelemetry = useSimulationStore((s) => s.thermalTelemetry);
  const selectedScenario = useSimulationStore((s) => s.selectedScenario);
  const alarms = useSimulationStore((s) => s.alarms);

  const altitude = TERRAIN_SCENARIOS[selectedScenario]?.defaultAltitudeM || 2100;

  // Animation frame accumulator derived directly from simulated RPM
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    let animId: number;

    const render = () => {
      const now = performance.now();
      const deltaMs = Math.min(100, now - lastTimeRef.current);
      lastTimeRef.current = now;

      // Real-time synchronization: motion advances only when cutter is running and unblocked
      const isBlocked = alarms.emergencyStopActive || cutterTelemetry.interlockBlocked || cutterTelemetry.overloadTrip;
      const isRunning = cutterTelemetry.enabled && !isBlocked && cutterTelemetry.rpm > 0;

      if (isRunning) {
        // Advances proportionally to actual simulated RPM
        const speedMultiplier = (cutterTelemetry.rpm / 1450) * 1.5;
        animFrameRef.current += (deltaMs / 16.67) * speedMultiplier;
      }

      const animFrame = animFrameRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (rightCanvasMode === 'macerator') {
        // ============================================================
        // 1. MACERATOR CUTTER (origin/bhavyam19 lines 2392-2490)
        // ============================================================
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Stainless Steel Conduit Walls (Top & Bottom)
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(10, 30);
        ctx.lineTo(w - 10, 30);
        ctx.moveTo(10, h - 30);
        ctx.lineTo(w - 10, h - 30);
        ctx.stroke();

        // PTC Thermal Jacket Active Border
        if (thermalTelemetry.heaterEnabled) {
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.5 + Math.sin(animFrame * 0.1) * 0.25})`;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(15, 20);
          ctx.lineTo(w - 15, 20);
          ctx.moveTo(15, h - 20);
          ctx.lineTo(w - 15, h - 20);
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.font = '10px monospace';
          ctx.fillText('PTC THERMAL JACKET ACTIVE (+18°C HEATED BOUNDARY LAYER)', 35, 16);
        }

        const bladeX = 140;
        const bladeY = h / 2;
        // Direction and speed directly driven by simulated state
        const bladeRad = animFrame * (cutterTelemetry.rpm / 200) * (cutterTelemetry.isReversed ? -1 : 1) * 0.05;

        // Central Spindle Hub
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(bladeX, bladeY, 14, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Twin-Arm High-Shear Cutter Blades
        ctx.save();
        ctx.translate(bladeX, bladeY);
        ctx.rotate(bladeRad);

        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 2;

        // Upper Blade
        ctx.beginPath();
        ctx.moveTo(-6, -45);
        ctx.lineTo(6, -45);
        ctx.lineTo(12, 0);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lower Blade
        ctx.beginPath();
        ctx.moveTo(-6, 45);
        ctx.lineTo(6, 45);
        ctx.lineTo(12, 0);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Counter-Shear Stationary Anvil Bar
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bladeX + 18, 35);
        ctx.lineTo(bladeX + 18, h - 35);
        ctx.stroke();

        // Sludge Rheology Flow Particles (active when running > 200 RPM)
        const flowActive = isRunning && cutterTelemetry.rpm > 200;
        if (flowActive) {
          // Raw waste chunks (>100mm solid aggregates entering from left)
          ctx.fillStyle = '#a16207';
          for (let i = 0; i < 4; i++) {
            const px = ((animFrame * 2 + i * 35) % 110) + 15;
            const py = 45 + ((i * 27) % (h - 90));
            ctx.beginPath();
            ctx.arc(px, py, 9, 0, Math.PI * 2);
            ctx.fill();
          }

          // Sheared fine micro-slurry droplets (<6mm entering suction pump)
          // Heated: emerald/turquoise (lower viscosity); Unheated: cyan
          ctx.fillStyle = thermalTelemetry.heaterEnabled ? '#14b8a6' : '#0284c7';
          for (let j = 0; j < 24; j++) {
            const px = bladeX + 25 + ((animFrame * 4 + j * 16) % (w - bladeX - 40));
            const py = 38 + ((j * 17) % (h - 76));
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Intake & Output Annotations
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText('Raw Waste / Solids Intake ➔', 18, h - 38);
        ctx.fillText('➔ Homogenized Slurry Output', bladeX + 35, h - 38);
      } else {
        // ============================================================
        // 2. PCP SCREW PUMP (origin/bhavyam19 lines 2562-2640)
        // ============================================================
        ctx.fillStyle = '#0b1120';
        ctx.fillRect(0, 0, w, h);

        const pAtm = (101.3 * Math.exp(-altitude / 8500)).toFixed(1);
        const isCavitationZone = altitude >= 2200;

        // Header Bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, w, 22);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9.5px monospace';
        ctx.fillText('PROGRESSIVE CAVITY SCREW PUMP (PCP)', 10, 15);

        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'right';
        ctx.fillText(`Alt: ${altitude}m MSL | P_atm: ${pAtm} kPa`, w - 10, 15);
        ctx.textAlign = 'start';

        // Pump Cutaway Chamber Boundaries
        const pumpLeft = 32;
        const pumpRight = w - 32;
        const pumpWidth = pumpRight - pumpLeft;
        const pumpCenterY = 66;
        const statorRadius = 26;

        // Outer Steel Pump Casing
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(pumpLeft - 10, pumpCenterY - statorRadius - 5, pumpWidth + 20, (statorRadius + 5) * 2, 8);
        } else {
          ctx.rect(pumpLeft - 10, pumpCenterY - statorRadius - 5, pumpWidth + 20, (statorRadius + 5) * 2);
        }
        ctx.fill();
        ctx.stroke();

        // Rubber Elastomeric Stator
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.rect(pumpLeft, pumpCenterY - statorRadius, pumpWidth, statorRadius * 2);
        ctx.fill();

        // Moving Sludge Pockets (Progressive Cavities)
        const flowOffset = (animFrame * 1.6) % 60;
        ctx.fillStyle = '#78350f';
        for (let x = pumpLeft + 5; x < pumpRight - 10; x += 28) {
          const pocketX = x + (flowOffset % 28);
          if (pocketX >= pumpLeft && pocketX <= pumpRight - 12) {
            const wavePhase = (pocketX * 0.08) - (animFrame * 0.1);
            const py = pumpCenterY + Math.sin(wavePhase) * 11;
            ctx.beginPath();
            ctx.arc(pocketX, py, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Eccentric Corkscrew Rotor
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#94a3b8';
        ctx.beginPath();
        for (let x = pumpLeft; x <= pumpRight; x += 4) {
          const wave = Math.sin((x * 0.07) - (animFrame * 0.08)) * 12;
          const ry = pumpCenterY + wave;
          if (x === pumpLeft) ctx.moveTo(x, ry);
          else ctx.lineTo(x, ry);
        }
        ctx.stroke();

        // Chrome Highlight Edge
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#f8fafc';
        ctx.beginPath();
        for (let x = pumpLeft; x <= pumpRight; x += 4) {
          const wave = Math.sin((x * 0.07) - (animFrame * 0.08)) * 12;
          const ry = pumpCenterY + wave - 2.5;
          if (x === pumpLeft) ctx.moveTo(x, ry);
          else ctx.lineTo(x, ry);
        }
        ctx.stroke();

        // Suction & Discharge Ports
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 8.5px monospace';
        ctx.fillText('➔ INTAKE (Thick Sludge)', 10, pumpCenterY + statorRadius + 14);

        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'right';
        ctx.fillText('➔ 4.0 BAR OUTLET', pumpRight, pumpCenterY + statorRadius + 14);
        ctx.textAlign = 'start';

        // Cavitation Diagnostic Warning
        const diagY = 126;
        ctx.fillStyle = isCavitationZone ? '#ef4444' : '#10b981';
        ctx.font = 'bold 9px monospace';
        if (isCavitationZone) {
          ctx.fillText(`[NPSHa RISK: VACUUM TRUCKS FAIL AT ${altitude}m MSL]`, pumpLeft, diagY);
        } else {
          ctx.fillText(`[NPSHa OK: NORMAL ATMOSPHERIC HEAD AT ${altitude}m MSL]`, pumpLeft, diagY);
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = '8.5px monospace';
        ctx.fillText('Positive Displacement: Constant 12.4 m³/h maintained regardless of barometric drop.', pumpLeft, diagY + 14);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cutterTelemetry.enabled, cutterTelemetry.rpm, cutterTelemetry.isReversed, cutterTelemetry.interlockBlocked, cutterTelemetry.overloadTrip, thermalTelemetry.heaterEnabled, altitude, alarms.emergencyStopActive, rightCanvasMode]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Top Header Strip with Dual-Mode Segmented Toggle */}
      <div className="flex items-center justify-between gap-3 bg-graphite-950 px-3 py-2 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-bold text-slate-200 truncate">
            {rightCanvasMode === 'macerator' ? 'INLINE ROTARY MACERATOR' : 'PROGRESSIVE CAVITY SCREW PUMP'}
          </span>
          {thermalTelemetry.heaterEnabled && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              HEATER ON (+18°C)
            </span>
          )}
        </div>

        {/* Original Bhavyam Segmented View Toggle Buttons */}
        <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px] font-mono shrink-0">
          <button
            type="button"
            onClick={() => setRightCanvasMode('macerator')}
            className={`px-2.5 py-1 rounded transition font-bold ${
              rightCanvasMode === 'macerator'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔪 Macerator
          </button>
          <button
            type="button"
            onClick={() => setRightCanvasMode('pcp')}
            className={`px-2.5 py-1 rounded transition font-bold ${
              rightCanvasMode === 'pcp'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚙️ PCP Screw Pump
          </button>
        </div>
      </div>

      {/* Canvas Viewport (Original 480x180 aspect ratio container) */}
      <div className="relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner p-1">
        <canvas
          ref={canvasRef}
          width={520}
          height={180}
          className="w-full h-[180px] sm:h-[200px] block"
        />

        {/* Dynamic Caption matching original Bhavyam dashboard */}
        <div className="absolute bottom-2 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded text-[10px] text-slate-300 font-mono border border-slate-700">
          {rightCanvasMode === 'macerator' ? (
            <span>
              Particle Size Reduction: 120mm Trash ➔{' '}
              <span className="text-emerald-400 font-bold">&lt;6mm Slurry</span>
            </span>
          ) : (
            <span>
              Positive Displacement:{' '}
              <span className="text-emerald-400 font-bold">
                Tool-Steel Rotor inside Rubber Stator (Zero Altitude Loss)
              </span>
            </span>
          )}
        </div>

        {/* Live Drive RPM Badge */}
        <div className="absolute top-2 right-3 font-mono text-[10px] bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700">
          {cutterTelemetry.enabled ? (
            <span className="text-emerald-400 font-bold">
              {cutterTelemetry.rpm} RPM {cutterTelemetry.isReversed ? '↺ REV' : '↻ FWD'}
            </span>
          ) : (
            <span className="text-slate-500 font-bold">STANDBY (0 RPM)</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OriginalCutterViewer;
