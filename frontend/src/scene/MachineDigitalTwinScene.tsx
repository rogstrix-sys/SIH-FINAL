import React from 'react';
import { Html } from '@react-three/drei';
import { useSimulationStore } from '../store/useSimulationStore';
import { MobileChassis } from './MobileChassis';
import { MotorPumpAssembly } from './MotorPumpAssembly';
import { CollectionTank } from './CollectionTank';
import { HoseReel } from './HoseReel';
import { ArticulatedBoom } from './ArticulatedBoom';
import { ExtractionHose } from './ExtractionHose';
import { HoseNozzle } from './HoseNozzle';
import { DemonstrationSepticTank } from './DemonstrationSepticTank';
import { TerrainEnvironment } from './TerrainEnvironment';
import { Gauge, Activity, Droplets, Cpu, Box, Radio } from 'lucide-react';

export const MachineDigitalTwinScene: React.FC = () => {
  const showAnnotations = useSimulationStore((s) => s.displayOptions.showAnnotations);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const telemetry = useSimulationStore((s) => s.telemetry);
  const params = useSimulationStore((s) => s.parameters);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Surrounding Terrain & Safety Environment */}
      <TerrainEnvironment />

      {/* 2. Heavy-Duty Mobile Chassis Platform */}
      <MobileChassis />

      {/* 3. Motor & Vacuum Pump Core Assembly */}
      <MotorPumpAssembly />

      {/* 4. On-Chassis Sludge Collection Vessel with Sight Glass */}
      <CollectionTank />

      {/* 5. Powered Rotating Hydraulic Hose Reel */}
      <HoseReel />

      {/* 6. Dual-Joint Articulated Support Crane Boom */}
      <ArticulatedBoom />

      {/* 7. Flexible Umbilical Suction Hose Spline */}
      <ExtractionHose />

      {/* 8. Submerged Hydro-Jetting & Cutter Suction Nozzle */}
      <HoseNozzle />

      {/* 9. Demonstration Dual-Compartment Septic Tank (Cutaway) */}
      <DemonstrationSepticTank />

      {/* ========================================================== */}
      {/* COMPACT SENSOR & COMPONENT OVERLAYS (When enabled)         */}
      {/* ========================================================== */}
      {showAnnotations && (
        <group>
          {/* Chassis Tag */}
          <Html position={[0, 0.9, 0.9]} center style={{ pointerEvents: 'auto' }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent('chassis');
              }}
              className="bg-graphite-950/90 hover:bg-graphite-900 border border-slate-700 hover:border-safety-500 rounded px-2 py-0.5 shadow-md text-[9px] font-mono backdrop-blur cursor-pointer transition select-none flex items-center gap-1 text-slate-300 whitespace-nowrap"
            >
              <Box className="w-2.5 h-2.5 text-safety-400" />
              <span>CHASSIS (4×4)</span>
            </div>
          </Html>

          {/* Vacuum Pump Tag */}
          <Html position={[0.7, 1.4, 0]} center style={{ pointerEvents: 'auto' }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent('pump');
              }}
              className="bg-graphite-950/90 hover:bg-graphite-900 border border-slate-700 hover:border-safety-500 rounded px-2 py-0.5 shadow-md text-[9px] font-mono backdrop-blur cursor-pointer transition select-none flex items-center gap-1 text-slate-300 whitespace-nowrap"
            >
              <Gauge className="w-2.5 h-2.5 text-safety-400" />
              <span>VACUUM: {telemetry.suctionPressureKpa.toFixed(1)} kPa</span>
            </div>
          </Html>

          {/* Collection Tank Tag */}
          <Html position={[-0.45, 1.6, 0.6]} center style={{ pointerEvents: 'auto' }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent('tank');
              }}
              className="bg-graphite-950/90 hover:bg-graphite-900 border border-slate-700 hover:border-cyan-500 rounded px-2 py-0.5 shadow-md text-[9px] font-mono backdrop-blur cursor-pointer transition select-none flex items-center gap-1 text-cyan-300 whitespace-nowrap"
            >
              <Droplets className="w-2.5 h-2.5 text-cyan-400" />
              <span>TANK: {Math.round(telemetry.volumeExtractedLiters)} L</span>
            </div>
          </Html>

          {/* Articulated Boom Tag */}
          <Html position={[1.8, 2.7, -1.2]} center style={{ pointerEvents: 'auto' }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent('boom');
              }}
              className="bg-graphite-950/90 hover:bg-graphite-900 border border-slate-700 hover:border-amber-500 rounded px-2 py-0.5 shadow-md text-[9px] font-mono backdrop-blur cursor-pointer transition select-none flex items-center gap-1 text-amber-300 whitespace-nowrap"
            >
              <Cpu className="w-2.5 h-2.5 text-amber-400" />
              <span>BOOM: 4.2m REACH</span>
            </div>
          </Html>

          {/* Submerged Nozzle Tag */}
          <Html position={[2.9, -0.9, -1.6]} center style={{ pointerEvents: 'auto' }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent('nozzle');
              }}
              className="bg-graphite-950/90 hover:bg-graphite-900 border border-slate-700 hover:border-emerald-500 rounded px-2 py-0.5 shadow-md text-[9px] font-mono backdrop-blur cursor-pointer transition select-none flex items-center gap-1 text-emerald-300 whitespace-nowrap"
            >
              <Activity className="w-2.5 h-2.5 text-emerald-400" />
              <span>FLOW: {telemetry.extractionRateM3H.toFixed(1)} m³/h</span>
            </div>
          </Html>

          {/* Demonstration Septic Tank Tag */}
          <Html position={[2.9, 0.8, -0.6]} center style={{ pointerEvents: 'auto' }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent('septictank');
              }}
              className="bg-graphite-950/90 hover:bg-graphite-900 border border-slate-700 hover:border-safety-500 rounded px-2 py-0.5 shadow-md text-[9px] font-mono backdrop-blur cursor-pointer transition select-none flex items-center gap-1 text-slate-300 whitespace-nowrap"
            >
              <Radio className="w-2.5 h-2.5 text-safety-400" />
              <span>VAULT: H2S {telemetry.h2sConcentrationPpm.toFixed(1)} ppm</span>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};
