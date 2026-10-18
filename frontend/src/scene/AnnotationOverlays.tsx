import React from 'react';
import { Html } from '@react-three/drei';
import { useSimulationStore } from '../store/useSimulationStore';
import { Activity, Gauge, Cpu, Droplets } from 'lucide-react';

export const AnnotationOverlays: React.FC = () => {
  const showAnnotations = useSimulationStore((s) => s.displayOptions.showAnnotations);
  const telemetry = useSimulationStore((s) => s.telemetry);
  const params = useSimulationStore((s) => s.parameters);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);

  if (!showAnnotations) return null;

  return (
    <group>
      {/* 1. Surface Vacuum Skid Tag */}
      <Html position={[2.4, 1.2, 1.2]} center style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('pump');
          }}
          className="bg-graphite-950/90 hover:bg-graphite-900 border border-slate-700/80 hover:border-safety-500 rounded-md px-2 py-1 shadow-lg text-[10px] font-mono backdrop-blur cursor-pointer transition-all select-none whitespace-nowrap"
        >
          <div className="flex items-center gap-1 text-safety-400 font-bold">
            <Gauge className="w-2.5 h-2.5" />
            <span>PUMP: {telemetry.extractionRateM3H.toFixed(1)} m³/h</span>
          </div>
        </div>
      </Html>

      {/* 2. Subsurface Crawler ROV Tag */}
      <Html position={[0.6, -1.9, 0.4]} center style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('crawler');
          }}
          className="bg-graphite-950/90 hover:bg-graphite-900 border border-slate-700/80 hover:border-amber-500 rounded-md px-2 py-1 shadow-lg text-[10px] font-mono backdrop-blur cursor-pointer transition-all select-none whitespace-nowrap"
        >
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Cpu className="w-2.5 h-2.5" />
            <span>ROV: {params.cutterHeadEnabled ? `${params.cutterHeadSpeedRpm} RPM` : 'STANDBY'}</span>
          </div>
        </div>
      </Html>

      {/* 3. Sludge Level Tag */}
      <Html position={[-1.6, -0.9, 0]} center style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('vault');
          }}
          className="bg-graphite-950/90 hover:bg-graphite-900 border border-slate-700/80 hover:border-cyan-500 rounded-md px-2 py-1 shadow-lg text-[10px] font-mono backdrop-blur cursor-pointer transition-all select-none whitespace-nowrap"
        >
          <div className="flex items-center gap-1 text-cyan-400 font-bold">
            <Droplets className="w-2.5 h-2.5" />
            <span>LEVEL: {telemetry.sludgeLevelM.toFixed(2)}m ({Math.round(telemetry.volumeRemainingLiters)}L)</span>
          </div>
        </div>
      </Html>

      {/* 4. Suction Hose Tag */}
      <Html position={[1.3, 0.6, 0.7]} center style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('hose');
          }}
          className="bg-graphite-950/90 hover:bg-graphite-900 border border-slate-700/80 hover:border-safety-500 rounded-md px-2 py-1 shadow-lg text-[10px] font-mono backdrop-blur cursor-pointer transition-all select-none whitespace-nowrap"
        >
          <div className="flex items-center gap-1 text-slate-300 font-bold">
            <Activity className="w-2.5 h-2.5 text-safety-400" />
            <span>HOSE: Ø{params.hoseDiameterMm}mm</span>
          </div>
        </div>
      </Html>
    </group>
  );
};
