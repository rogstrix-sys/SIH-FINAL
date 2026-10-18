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
import { ReceiverTank } from './ReceiverTank';
import { TerrainEnvironment } from './TerrainEnvironment';
import { Gauge, Activity, Droplets, Cpu, Box, Radio, Truck, Compass, ShieldAlert, AlertTriangle } from 'lucide-react';

export const MachineDigitalTwinScene: React.FC = () => {
  const showAnnotations = useSimulationStore((s) => s.displayOptions.showAnnotations);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const telemetry = useSimulationStore((s) => s.telemetry);
  const materialBalance = useSimulationStore((s) => s.materialBalance);
  const selectedScenario = useSimulationStore((s) => s.selectedScenario);
  const terrainParams = useSimulationStore((s) => s.terrainParams);
  const feasibility = useSimulationStore((s) => s.feasibility);
  const stabilizerExtension = useSimulationStore((s) => s.kinematics.stabilizerExtension);

  // Dynamic chassis inclination angles based on slope and heading
  const levelFactor = Math.max(0.15, 1.0 - stabilizerExtension * 0.65);
  const machinePitchRad =
    selectedScenario === 'hilly_sloped'
      ? (feasibility.chassisPitchDeg * (Math.PI / 180.0)) * levelFactor
      : 0;
  const machineRollRad =
    selectedScenario === 'hilly_sloped'
      ? (feasibility.chassisRollDeg * (Math.PI / 180.0)) * levelFactor
      : 0;

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Surrounding Terrain & Environmental Obstacles */}
      <TerrainEnvironment />

      {/* 2. Mechanized Desludging Mobile Unit (Chassis + Pump + Tank + Reel + Boom) */}
      <group
        position={[0, selectedScenario === 'hilly_sloped' ? 0.08 : 0, 0]}
        rotation={[machinePitchRad, 0, machineRollRad]}
      >
        {/* Chassis, Wheels & Outrigger Stabilizers */}
        <MobileChassis />

        {/* Vacuum Pump & Hydraulic Drive Assembly */}
        <MotorPumpAssembly />

        {/* On-Board Sludge Containment Vessel */}
        <CollectionTank />

        {/* Powered Hydraulic Hose Reel */}
        <HoseReel />

        {/* Dual-Joint Articulated Crane Arm */}
        <ArticulatedBoom />

        {/* 3D Chassis Inclinometer Bubble Widget (Hovering above chassis) */}
        {selectedScenario === 'hilly_sloped' && (
          <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono shadow-2xl backdrop-blur flex items-center gap-1.5 whitespace-nowrap ${
              feasibility.stabilityStatus === 'critical_unstable'
                ? 'bg-rose-950/95 text-rose-300 border-rose-600 animate-pulse font-bold'
                : feasibility.stabilityStatus === 'caution'
                ? 'bg-amber-950/90 text-amber-300 border-amber-600'
                : 'bg-graphite-950/90 text-emerald-300 border-emerald-600'
            }`}>
              <Compass className="w-3.5 h-3.5" />
              <span>
                CHASSIS TILT: {feasibility.effectiveTiltDeg.toFixed(1)}° (PITCH {feasibility.chassisPitchDeg.toFixed(1)}° | ROLL {feasibility.chassisRollDeg.toFixed(1)}°)
              </span>
            </div>
          </Html>
        )}

        {/* Lateral Clearance Warning Planes (When in narrow restricted access) */}
        {selectedScenario === 'narrow_restricted' && feasibility.clearanceConflictDetected && (
          <group position={[0, 0.45, 0]}>
            {/* Left red collision proximity indicator */}
            <mesh position={[0, 0, 0.85]}>
              <boxGeometry args={[3.2, 0.6, 0.04]} />
              <meshBasicMaterial color="#e11d48" opacity={0.35} transparent wireframe />
            </mesh>
            {/* Right red collision proximity indicator */}
            <mesh position={[0, 0, -0.85]}>
              <boxGeometry args={[3.2, 0.6, 0.04]} />
              <meshBasicMaterial color="#e11d48" opacity={0.35} transparent wireframe />
            </mesh>
          </group>
        )}
      </group>

      {/* 3. External Waste Receiving Disposal Tanker */}
      <ReceiverTank />

      {/* 4. Flexible Umbilical Suction Hose Spline */}
      <ExtractionHose />

      {/* 5. Submerged Hydro-Jetting & Cutter Suction Nozzle */}
      <HoseNozzle />

      {/* 6. Demonstration Dual-Compartment Septic Vault (Cutaway) */}
      <DemonstrationSepticTank />

      {/* ========================================================== */}
      {/* SENSOR & COMPONENT OVERLAYS (When enabled)                 */}
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
              <span>CHASSIS ({feasibility.effectiveGroundClearanceM}m GC)</span>
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

          {/* External Receiver Tanker Tag */}
          <Html position={[-3.3, 1.4, 0.6]} center style={{ pointerEvents: 'auto' }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent('receiver');
              }}
              className="bg-graphite-950/90 hover:bg-graphite-900 border border-slate-700 hover:border-sky-500 rounded px-2 py-0.5 shadow-md text-[9px] font-mono backdrop-blur cursor-pointer transition select-none flex items-center gap-1 text-sky-300 whitespace-nowrap"
            >
              <Truck className="w-2.5 h-2.5 text-sky-400" />
              <span>RECEIVER: {Math.round(materialBalance.receiverVolumeL)} L</span>
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
