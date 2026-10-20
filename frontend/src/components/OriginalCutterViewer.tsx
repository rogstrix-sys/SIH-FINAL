import React, { useEffect, useRef, useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { TERRAIN_SCENARIOS } from '../simulation/terrainFeasibilityModel';

interface OriginalCutterViewerProps {
  className?: string;
}

/**
 * Original Bhavyam Cutter & Progressive Cavity Pump Visualizer
 * High-DPI Subpixel Sharp Port of origin/bhavyam19:dashboard/index.html (lines 589-605, 2390-2800)
 */
export const OriginalCutterViewer: React.FC<OriginalCutterViewerProps> = ({
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  // Render loop with high-DPI canvas buffer tracking
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
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      // High-DPI Resolution Sizing: Match container client dimensions * devicePixelRatio
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const cssWidth = Math.max(480, Math.floor(rect.width));
      const cssHeight = 210;

      const physicalWidth = Math.round(cssWidth * dpr);
      const physicalHeight = Math.round(cssHeight * dpr);

      if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
        canvas.width = physicalWidth;
        canvas.height = physicalHeight;
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
      }

      ctx.save();
      // Scale coordinates so all drawing commands use logical CSS pixel units
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const w = cssWidth;
      const h = cssHeight;

      if (rightCanvasMode === 'macerator') {
        // ============================================================
        // 1. MACERATOR CUTTER (origin/bhavyam19 lines 2392-2490)
        // ============================================================
        // Background
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        // Header Sub-Bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, w, 24);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText('INLINE ROTARY MACERATOR & DE-AGGLOMERATION THROAT', 12, 12);

        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'right';
        ctx.fillText(
          `Shear: ${cutterTelemetry.enabled ? `${cutterTelemetry.rpm} RPM` : 'STANDBY'} · Fragment: <${cutterTelemetry.particleSizeMm}mm`,
          w - 12,
          12
        );
        ctx.textAlign = 'left';

        // Stainless Steel Conduit Walls (Top & Bottom)
        const wallYTop = 38;
        const wallYBottom = h - 34;

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(12, wallYTop);
        ctx.lineTo(w - 12, wallYTop);
        ctx.moveTo(12, wallYBottom);
        ctx.lineTo(w - 12, wallYBottom);
        ctx.stroke();

        // Inner Conduit Wall Accent Lines
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(12, wallYTop + 4);
        ctx.lineTo(w - 12, wallYTop + 4);
        ctx.moveTo(12, wallYBottom - 4);
        ctx.lineTo(w - 12, wallYBottom - 4);
        ctx.stroke();

        // PTC Thermal Jacket Active Glow (When heater enabled)
        if (thermalTelemetry.heaterEnabled) {
          const pulse = 0.5 + Math.sin(animFrame * 0.1) * 0.3;
          ctx.strokeStyle = `rgba(245, 158, 11, ${pulse})`;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(16, wallYTop - 6);
          ctx.lineTo(w - 16, wallYTop - 6);
          ctx.moveTo(16, wallYBottom + 6);
          ctx.lineTo(w - 16, wallYBottom + 6);
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 9.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          ctx.fillText('PTC THERMAL JACKET ACTIVE (+18°C HEATED BOUNDARY LAYER · LIQUEFACTION RESTORED)', 24, wallYTop - 7);
        }

        const bladeX = Math.min(180, Math.round(w * 0.28));
        const bladeY = Math.round((wallYTop + wallYBottom) / 2);
        const bladeRad = animFrame * (cutterTelemetry.rpm / 200) * (cutterTelemetry.isReversed ? -1 : 1) * 0.05;

        // Central Spindle Hub
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(bladeX, bladeY, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rotating Twin-Arm High-Shear Cutter Blades
        ctx.save();
        ctx.translate(bladeX, bladeY);
        ctx.rotate(bladeRad);

        // Blade Arm 1
        ctx.fillStyle = cutterTelemetry.isReversed ? '#f59e0b' : '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(-7, -46);
        ctx.lineTo(7, -46);
        ctx.lineTo(13, 0);
        ctx.lineTo(-13, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Carbide Tip Insert 1
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.rect(-7, -46, 14, 12);
        ctx.fill();

        // Blade Arm 2
        ctx.fillStyle = cutterTelemetry.isReversed ? '#f59e0b' : '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-7, 46);
        ctx.lineTo(7, 46);
        ctx.lineTo(13, 0);
        ctx.lineTo(-13, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Carbide Tip Insert 2
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.rect(-7, 34, 14, 12);
        ctx.fill();

        ctx.restore();

        // Counter-Shear Stationary Anvil Bar
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bladeX + 22, wallYTop + 6);
        ctx.lineTo(bladeX + 22, wallYBottom - 6);
        ctx.stroke();

        // Anvil Counter-Teeth
        ctx.fillStyle = '#cbd5e1';
        for (let s = wallYTop + 14; s < wallYBottom - 14; s += 20) {
          ctx.beginPath();
          ctx.moveTo(bladeX + 22, s);
          ctx.lineTo(bladeX + 15, s + 7);
          ctx.lineTo(bladeX + 22, s + 14);
          ctx.fill();
        }

        // Sludge Rheology Flow Particles (active when running > 200 RPM)
        const flowActive = isRunning && cutterTelemetry.rpm > 200;
        if (flowActive) {
          // Raw waste chunks (>100mm solid aggregates entering from left)
          ctx.fillStyle = '#a16207';
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 4; i++) {
            const px = ((animFrame * 2 + i * 38) % (bladeX - 35)) + 18;
            const py = wallYTop + 18 + ((i * 26) % (wallYBottom - wallYTop - 36));
            ctx.beginPath();
            ctx.arc(px, py, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Sheared fine micro-slurry droplets (<6mm entering progressive cavity pump)
          // Heated: emerald/turquoise (lower viscosity); Unheated: cyan
          ctx.fillStyle = thermalTelemetry.heaterEnabled ? '#14b8a6' : '#0284c7';
          for (let j = 0; j < 26; j++) {
            const px = bladeX + 30 + ((animFrame * 4 + j * 16) % (w - bladeX - 48));
            const py = wallYTop + 12 + ((j * 15) % (wallYBottom - wallYTop - 24));
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Intake & Output Text Labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText('➔ Raw Septage & Fibrous Waste (>100mm)', 16, wallYBottom + 16);

        ctx.textAlign = 'right';
        ctx.fillStyle = thermalTelemetry.heaterEnabled ? '#14b8a6' : '#38bdf8';
        ctx.fillText('➔ Homogenized Slurry (<6mm) to Progressive Cavity Pump', w - 16, wallYBottom + 16);
        ctx.textAlign = 'left';

      } else {
        // ============================================================
        // 2. PCP SCREW PUMP (origin/bhavyam19 lines 2562-2800)
        // ============================================================
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        const pAtm = (101.3 * Math.exp(-altitude / 8500)).toFixed(1);
        const isCavitationZone = altitude >= 2200;

        // Top Header Bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, w, 24);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText('PROGRESSIVE CAVITY SCREW PUMP (PCP)', 12, 12);

        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'right';
        ctx.fillText(`Alt: ${altitude}m MSL | P_atm: ${pAtm} kPa`, w - 12, 12);
        ctx.textAlign = 'left';

        // Pump Cutaway Chamber Boundaries
        const pumpLeft = 36;
        const pumpRight = w - 36;
        const pumpWidth = pumpRight - pumpLeft;
        const pumpCenterY = 64;
        const statorRadius = 24;

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
        ctx.fillStyle = '#78350f'; // Rich warm sludge
        for (let x = pumpLeft + 5; x < pumpRight - 10; x += 28) {
          const pocketX = x + (flowOffset % 28);
          if (pocketX >= pumpLeft && pocketX <= pumpRight - 12) {
            const wavePhase = (pocketX * 0.08) - (animFrame * 0.1);
            const py = pumpCenterY + Math.sin(wavePhase) * 10;
            ctx.beginPath();
            ctx.arc(pocketX, py, 9.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Tool-Steel Eccentric Corkscrew Rotor (Moving Stainless Steel Screw)
        ctx.lineWidth = 11;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#94a3b8'; // Stainless Steel
        ctx.beginPath();
        for (let x = pumpLeft; x <= pumpRight; x += 4) {
          const wave = Math.sin((x * 0.07) - (animFrame * 0.08)) * 11;
          const ry = pumpCenterY + wave;
          if (x === pumpLeft) ctx.moveTo(x, ry);
          else ctx.lineTo(x, ry);
        }
        ctx.stroke();

        // Chrome Highlight Line along the screw edge (High-Contrast 3D Metallic Edge)
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        for (let x = pumpLeft; x <= pumpRight; x += 4) {
          const wave = Math.sin((x * 0.07) - (animFrame * 0.08)) * 11;
          const ry = pumpCenterY + wave - 2.5;
          if (x === pumpLeft) ctx.moveTo(x, ry);
          else ctx.lineTo(x, ry);
        }
        ctx.stroke();

        // Rotating Drive Shaft at left
        ctx.fillStyle = '#64748b';
        ctx.fillRect(pumpLeft - 18, pumpCenterY - 4, 10, 8);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(pumpLeft - 13, pumpCenterY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Ports & Directional Annotations
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText('➔ INTAKE: Septage Suction', pumpLeft, pumpCenterY + statorRadius + 15);

        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'right';
        ctx.fillText('➔ 4.0 BAR OUTLET: Pressurized Discharge', pumpRight, pumpCenterY + statorRadius + 15);
        ctx.textAlign = 'left';

        // ============================================================
        // SIDE-BY-SIDE ALTITUDE CAVITATION COMPARISON (BOTTOM BOXES)
        // ============================================================
        const botY = 126;
        const boxHeight = 72;
        const boxGap = 12;
        const boxWidth = Math.floor((w - 24 - boxGap) / 2);

        // 1. Conventional Vacuum Truck Pump Box (Left)
        if (isCavitationZone) {
          // Cavitation Failure State
          ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(12, botY, boxWidth, boxHeight, 6);
          } else {
            ctx.rect(12, botY, boxWidth, boxHeight);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 9.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          ctx.fillText('❌ CONVENTIONAL VACUUM TRUCK', 20, botY + 16);

          ctx.fillStyle = '#fecdd3';
          ctx.font = '8.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          ctx.fillText(`CAVITATION FAILURE • 0 L/min`, 20, botY + 32);
          ctx.fillText(`Thin air (${pAtm} kPa) creates boiling vapor`, 20, botY + 46);
          ctx.fillStyle = '#fb7185';
          ctx.fillText(`Vapor bubbles collapse & destroy impellers!`, 20, botY + 60);

          // Animated red vapor bubbles
          ctx.fillStyle = '#f43f5e';
          for (let b = 0; b < 3; b++) {
            const bx = boxWidth - 36 + ((animFrame * 1.5 + b * 16) % 28);
            const by = botY + 54 - ((animFrame * 1.8 + b * 12) % 36);
            ctx.beginPath();
            ctx.arc(bx, by, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Low Altitude Marginal State
          ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(12, botY, boxWidth, boxHeight, 6);
          } else {
            ctx.rect(12, botY, boxWidth, boxHeight);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 9.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          ctx.fillText('⚠️ CONVENTIONAL VACUUM TRUCK', 20, botY + 16);

          ctx.fillStyle = '#fed7aa';
          ctx.font = '8.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          const vacFlow = Math.max(30, Math.round(180 * (1 - altitude / 3200)));
          ctx.fillText(`Atmospheric Suction: ${vacFlow} L/min`, 20, botY + 32);
          ctx.fillText(`Marginal lift (NPSH dropping with altitude)`, 20, botY + 46);
          ctx.fillText(`Vulnerable to vacuum boiling above 2,200m`, 20, botY + 60);
        }

        // 2. Progressive Cavity Pump (TERRA-VAC 450) Box (Right)
        const rightBoxX = 12 + boxWidth + boxGap;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(rightBoxX, botY, boxWidth, boxHeight, 6);
        } else {
          ctx.rect(rightBoxX, botY, boxWidth, boxHeight);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 9.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.fillText('✅ POSITIVE DISPLACEMENT (PCP)', rightBoxX + 10, botY + 16);

        ctx.fillStyle = '#a7f3d0';
        ctx.font = '8.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.fillText('100% SUCTION MAINTAINED • 200 L/min', rightBoxX + 10, botY + 32);
        ctx.fillText('Zero reliance on ambient barometric pressure', rightBoxX + 10, botY + 46);
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText('Tool-steel rotor displacement immune to altitude drop', rightBoxX + 10, botY + 60);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cutterTelemetry.enabled, cutterTelemetry.rpm, cutterTelemetry.isReversed, cutterTelemetry.interlockBlocked, cutterTelemetry.overloadTrip, cutterTelemetry.particleSizeMm, thermalTelemetry.heaterEnabled, altitude, alarms.emergencyStopActive, rightCanvasMode]);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Top Header Strip with Subsystem Readout & Mode Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-graphite-950 px-3.5 py-2 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-xs font-bold text-slate-200 truncate">
            {rightCanvasMode === 'macerator' ? 'INLINE ROTARY MACERATOR' : 'PROGRESSIVE CAVITY SCREW PUMP'}
          </span>
          {thermalTelemetry.heaterEnabled && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              HEATER ON (+18°C)
            </span>
          )}
        </div>

        {/* Live Drive RPM Badge in Header (Clean separation - never overlaps diagram) */}
        <div className="flex items-center gap-2">
          <div className="font-mono text-[11px] bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700/80">
            {cutterTelemetry.enabled ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{cutterTelemetry.rpm} RPM</span>
                <span className="text-slate-400 text-[10px]">{cutterTelemetry.isReversed ? '↺ REV' : '↻ FWD'}</span>
              </span>
            ) : (
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>STANDBY (0 RPM)</span>
              </span>
            )}
          </div>

          {/* Original Bhavyam Segmented View Toggle Buttons */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px] font-mono shrink-0">
            <button
              type="button"
              onClick={() => setRightCanvasMode('macerator')}
              className={`px-3 py-1 rounded-md transition font-bold ${
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
              className={`px-3 py-1 rounded-md transition font-bold ${
                rightCanvasMode === 'pcp'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚙️ PCP Screw Pump
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Viewport Container (Dynamic Width, High-DPI Razor Sharp Rendering) */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner flex flex-col"
      >
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: '210px' }}
        />

        {/* Dedicated Unobstructed Caption Bar (Below canvas, clean separation) */}
        <div className="px-3.5 py-2 bg-slate-900/90 border-t border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2 truncate">
            {rightCanvasMode === 'macerator' ? (
              <span>
                Particle Size Reduction: 120mm Trash ➔{' '}
                <span className="text-emerald-400 font-bold">&lt;6mm Homogenized Slurry</span>
              </span>
            ) : (
              <span>
                Positive Displacement:{' '}
                <span className="text-emerald-400 font-bold">
                  Tool-Steel Rotor inside Rubber Stator (Zero High-Altitude Loss)
                </span>
              </span>
            )}
          </div>

          <div className="text-[10px] text-cyan-400 shrink-0 font-bold">
            {rightCanvasMode === 'macerator' ? 'NON-NEWTONIAN DE-AGGLOMERATION' : 'NPSHa CAVITATION PROOF'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OriginalCutterViewer;
