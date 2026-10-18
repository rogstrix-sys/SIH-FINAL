import React from 'react';
import { Html } from '@react-three/drei';
import { useSimulationStore } from '../store/useSimulationStore';
import { Activity, Gauge, Cpu, Droplets, Compass, Zap, Truck } from 'lucide-react';

export const AnnotationOverlays: React.FC = () => {
  const showAnnotations = useSimulationStore((s) => s.displayOptions.showAnnotations);
  const telemetry = useSimulationStore((s) => s.telemetry);
  const materialBalance = useSimulationStore((s) => s.materialBalance);
  const feasibility = useSimulationStore((s) => s.feasibility);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);

  if (!showAnnotations) return null;

  return (
    <group>
      {/* S1: Vacuum Pump Inlet Transducer */}
      <Html position={[-0.35, 1.45, 0]} center style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('pump');
          }}
          className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono shadow-xl backdrop-blur-md cursor-pointer transition-all select-none whitespace-nowrap flex items-center gap-1.5 ${
            selectedComponentId === 'pump'
              ? 'bg-safety-950/95 border-safety-400 text-safety-300 ring-2 ring-safety-500/40'
              : 'bg-graphite-950/90 hover:bg-graphite-900 border-slate-700 text-slate-200 hover:border-safety-500'
          }`}
        >
          <Gauge className="w-3 h-3 text-safety-400" />
          <span>S1 VACUUM: {Math.abs(telemetry.suctionPressureKpa).toFixed(1)} kPa</span>
        </div>
      </Html>

      {/* S2: Optical Sludge Interface Detector at Submerged Nozzle */}
      <Html position={[2.9, -0.85, -1.6]} center style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('nozzle');
          }}
          className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono shadow-xl backdrop-blur-md cursor-pointer transition-all select-none whitespace-nowrap flex items-center gap-1.5 ${
            selectedComponentId === 'nozzle'
              ? 'bg-amber-950/95 border-amber-400 text-amber-300 ring-2 ring-amber-500/40'
              : 'bg-graphite-950/90 hover:bg-graphite-900 border-slate-700 text-slate-200 hover:border-amber-500'
          }`}
        >
          <Droplets className="w-3 h-3 text-amber-400" />
          <span>S2 NOZZLE: {telemetry.sludgeLevelM.toFixed(2)}m (1,180 kg/m³)</span>
        </div>
      </Html>

      {/* S3: Hydrostatic Level Transmitter on Collection Tank */}
      <Html position={[-0.45, 1.7, 0.52]} center style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('tank');
          }}
          className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono shadow-xl backdrop-blur-md cursor-pointer transition-all select-none whitespace-nowrap flex items-center gap-1.5 ${
            selectedComponentId === 'tank'
              ? 'bg-cyan-950/95 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/40'
              : 'bg-graphite-950/90 hover:bg-graphite-900 border-slate-700 text-slate-200 hover:border-cyan-500'
          }`}
        >
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>S3 VESSEL: {Math.round(materialBalance.collectionVolumeL)} L ({materialBalance.collectionFillPct.toFixed(0)}%)</span>
        </div>
      </Html>

      {/* S4: Chassis Dual-Axis Inclinometer */}
      <Html position={[0, 0.85, 0]} center style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('chassis');
          }}
          className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono shadow-xl backdrop-blur-md cursor-pointer transition-all select-none whitespace-nowrap flex items-center gap-1.5 ${
            selectedComponentId === 'chassis'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/40'
              : 'bg-graphite-950/90 hover:bg-graphite-900 border-slate-700 text-slate-200 hover:border-emerald-500'
          }`}
        >
          <Compass className="w-3 h-3 text-emerald-400" />
          <span>S4 TILT: {feasibility.effectiveTiltDeg.toFixed(1)}° (P {feasibility.chassisPitchDeg.toFixed(1)}° | R {feasibility.chassisRollDeg.toFixed(1)}°)</span>
        </div>
      </Html>

      {/* S5: Drive Motor Current CT Sensor */}
      <Html position={[0.96, 1.35, 0]} center style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('pump');
          }}
          className="px-2.5 py-1 rounded-lg border border-slate-700 bg-graphite-950/90 hover:bg-graphite-900 text-slate-200 hover:border-yellow-500 text-[10px] font-mono shadow-xl backdrop-blur-md cursor-pointer transition-all select-none whitespace-nowrap flex items-center gap-1.5"
        >
          <Zap className="w-3 h-3 text-yellow-400" />
          <span>S5 MOTOR: {telemetry.motorPowerKw.toFixed(1)} kW ({telemetry.motorCurrentAmps.toFixed(1)} A)</span>
        </div>
      </Html>

      {/* S6: External Waste Disposal Receiving Tanker */}
      <Html position={[-3.2, 1.75, -1.2]} center style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('receiver');
          }}
          className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono shadow-xl backdrop-blur-md cursor-pointer transition-all select-none whitespace-nowrap flex items-center gap-1.5 ${
            selectedComponentId === 'receiver'
              ? 'bg-sky-950/95 border-sky-400 text-sky-300 ring-2 ring-sky-500/40'
              : 'bg-graphite-950/90 hover:bg-graphite-900 border-slate-700 text-slate-200 hover:border-sky-500'
          }`}
        >
          <Truck className="w-3 h-3 text-sky-400" />
          <span>S6 TANKER: {Math.round(materialBalance.receiverVolumeL)} L transferred</span>
        </div>
      </Html>
    </group>
  );
};
