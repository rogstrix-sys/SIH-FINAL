import React, { useEffect, useRef } from 'react';
import { Flame, Waves, ShieldCheck } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

interface CutterConduitCutawayViewerProps {
  className?: string;
}

export const CutterConduitCutawayViewer: React.FC<CutterConduitCutawayViewerProps> = ({
  className = 'h-[360px] sm:h-[400px]'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cutterTelemetry = useSimulationStore((s) => s.cutterTelemetry);
  const thermalTelemetry = useSimulationStore((s) => s.thermalTelemetry);
  const thermalParams = useSimulationStore((s) => s.thermalParams);

  // Animated cutaway reproducing origin/bhavyam19:dashboard/index.html lines 2392-2490
  useEffect(() => {
    let animId: number;
    let animFrame = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // 1. Dark Conduit Throat Chamber
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // 2. Stainless Steel Conduit Outer Walls (Top & Bottom)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(10, 42);
      ctx.lineTo(w - 10, 42);
      ctx.moveTo(10, h - 42);
      ctx.lineTo(w - 10, h - 42);
      ctx.stroke();

      // Inner Conduit Wall Liners
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, 49);
      ctx.lineTo(w - 10, 49);
      ctx.moveTo(10, h - 49);
      ctx.lineTo(w - 10, h - 49);
      ctx.stroke();

      // 3. PTC Thermal Jacket Heating Glow (When heater is active)
      if (thermalTelemetry.heaterEnabled) {
        const pulse = 0.5 + Math.sin(animFrame * 0.08) * 0.25;
        ctx.strokeStyle = `rgba(245, 158, 11, ${pulse})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(15, 28);
        ctx.lineTo(w - 15, 28);
        ctx.moveTo(15, h - 28);
        ctx.lineTo(w - 15, h - 28);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(
          `PTC CERAMIC HEATING JACKET ACTIVE (+18°C BOUNDARY LAYER · ${thermalTelemetry.effectiveTempC.toFixed(1)}°C)`,
          35,
          24
        );
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText('PTC THERMAL JACKET: STANDBY (COLD AMBIENT WALLS)', 35, 24);
      }

      // 4. Center Rotary Cutter Spindle & Blades
      const bladeX = w * 0.32;
      const bladeY = h / 2;
      const isSpinning = cutterTelemetry.enabled && cutterTelemetry.rpm > 0;

      if (isSpinning) {
        animFrame += (cutterTelemetry.rpm / 250) * (cutterTelemetry.isReversed ? -1 : 1);
      }
      const bladeRad = animFrame * 0.05;

      // Stationary Counter-Shear Anvil Bar (Right behind blade tip)
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(bladeX + 24, 52);
      ctx.lineTo(bladeX + 24, h - 52);
      ctx.stroke();

      // Anvil Shear Teeth Callout
      ctx.fillStyle = '#cbd5e1';
      for (let s = 60; s < h - 60; s += 24) {
        ctx.beginPath();
        ctx.moveTo(bladeX + 24, s);
        ctx.lineTo(bladeX + 16, s + 10);
        ctx.lineTo(bladeX + 24, s + 20);
        ctx.fill();
      }

      // Drive Shaft Core
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(bladeX, bladeY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rotating Twin-Arm Shear Blades
      ctx.save();
      ctx.translate(bladeX, bladeY);
      ctx.rotate(bladeRad);

      // Blade Arm 1
      ctx.fillStyle = cutterTelemetry.isReversed ? '#f59e0b' : '#38bdf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-9, -65);
      ctx.lineTo(9, -65);
      ctx.lineTo(16, 0);
      ctx.lineTo(-16, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tungsten Carbide Tip 1
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.rect(-9, -65, 18, 14);
      ctx.fill();

      // Blade Arm 2
      ctx.fillStyle = cutterTelemetry.isReversed ? '#f59e0b' : '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-9, 65);
      ctx.lineTo(9, 65);
      ctx.lineTo(16, 0);
      ctx.lineTo(-16, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tungsten Carbide Tip 2
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.rect(-9, 51, 18, 14);
      ctx.fill();

      ctx.restore();

      // 5. Solid Sludge Lumps Entering from Left (Up to 120mm solid aggregates)
      if (isSpinning) {
        ctx.fillStyle = '#92400e'; // dark municipal sludge chunk
        for (let i = 0; i < 5; i++) {
          const px = ((animFrame * 2.2 + i * 50) % (bladeX - 35)) + 20;
          const py = 75 + ((i * 38) % (h - 150));
          ctx.beginPath();
          ctx.arc(px, py, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // 6. Pulverized / Sheared Micro-Slurry Droplets (<6mm) streaming into Pump
        // Heated: emerald/turquoise (lower viscosity); Cold: cyan
        ctx.fillStyle = thermalTelemetry.heaterEnabled ? '#14b8a6' : '#0284c7';
        for (let j = 0; j < 36; j++) {
          const px = bladeX + 32 + ((animFrame * 4.5 + j * 20) % (w - bladeX - 60));
          const py = 60 + ((j * 23) % (h - 120));
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 7. Explanatory Labels & Mechanical Annotations
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('INLET: CONSOLIDATED SLUDGE & TEXTILES (>100mm)', 20, h - 18);
      ctx.fillText('DISCHARGE: SHEARED SLURRY (<6mm) ➔ PROGRESSIVE CAVITY PUMP', bladeX + 36, h - 18);

      // Shear zone vertical divider marker
      ctx.strokeStyle = '#06b6d4';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(bladeX + 2, 50);
      ctx.lineTo(bladeX + 2, h - 50);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#06b6d4';
      ctx.fillText('1.5mm SHEAR GAP', bladeX - 42, 64);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cutterTelemetry.enabled, cutterTelemetry.rpm, cutterTelemetry.isReversed, thermalTelemetry.heaterEnabled, thermalTelemetry.effectiveTempC]);

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col justify-center items-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={720}
        height={380}
        className="w-full h-full block"
      />

      {/* Top Left: Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-lg pointer-events-none">
        <Waves className="w-4 h-4 text-cyan-400" />
        <span className="font-mono text-xs font-bold text-slate-200">
          CONDUIT THROAT & SLURRY RHEOLOGY
        </span>
        {thermalTelemetry.heaterEnabled && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/60">
            <Flame className="w-3 h-3 text-amber-400" /> PTC HEATED
          </span>
        )}
      </div>

      {/* Bottom Right: Status */}
      <div className="absolute bottom-3 right-3 font-mono text-[11px] text-cyan-300 bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-cyan-500/40">
        ROTARY DRIVE: {cutterTelemetry.enabled ? `${cutterTelemetry.rpm} RPM` : 'STANDBY'} · {cutterTelemetry.isReversed ? 'ANTI-JAM REV' : 'FORWARD'}
      </div>
    </div>
  );
};

export default CutterConduitCutawayViewer;
