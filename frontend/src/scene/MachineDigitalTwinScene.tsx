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
import { AnnotationOverlays } from './AnnotationOverlays';
import { Compass, AlertTriangle } from 'lucide-react';

export const MachineDigitalTwinScene: React.FC = () => {
  const showAnnotations = useSimulationStore((s) => s.displayOptions.showAnnotations);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const telemetry = useSimulationStore((s) => s.telemetry);
  const materialBalance = useSimulationStore((s) => s.materialBalance);
  const selectedScenario = useSimulationStore((s) => s.selectedScenario);
  const terrainParams = useSimulationStore((s) => s.terrainParams);
  const feasibility = useSimulationStore((s) => s.feasibility);
  const stabilizerExtension = useSimulationStore((s) => s.kinematics.stabilizerExtension);

  const mobility = useSimulationStore((s) => s.mobilityTelemetry);

  // Dynamic chassis inclination angles based on slope and heading
  const levelFactor = Math.max(0.12, 1.0 - stabilizerExtension * 0.70);
  const machinePitchRad = (mobility.pitchDeg * (Math.PI / 180.0)) * levelFactor;
  const machineRollRad = (mobility.rollDeg * (Math.PI / 180.0)) * levelFactor;
  const machineHeadingRad = mobility.headingRad;

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Surrounding Terrain & Environmental Obstacles */}
      <TerrainEnvironment />

      {/* 2. Self-Propelled Tracked Engineering Vehicle Group (Chassis + Pump + Tank + Reel + Boom + Hose) */}
      <group
        position={[mobility.position[0], mobility.position[1], mobility.position[2]]}
        rotation={[machinePitchRad, machineHeadingRad, machineRollRad]}
      >
        {/* Continuous Rubber Track Chassis, Drive Sprockets & Outriggers */}
        <MobileChassis />

        {/* Vacuum Pump & Hydraulic Drive Assembly */}
        <MotorPumpAssembly />

        {/* On-Board Sludge Containment Vessel */}
        <CollectionTank />

        {/* Powered Hydraulic Hose Reel */}
        <HoseReel />

        {/* Dual-Joint Articulated Crane Arm */}
        <ArticulatedBoom />

        {/* Flexible Umbilical Suction Hose Spline */}
        <ExtractionHose />

        {/* Submerged Hydro-Jetting & Cutter Suction Nozzle */}
        <HoseNozzle />

        {/* 3D Chassis Inclinometer Bubble Widget (Hovering above chassis) */}
        {mobility.effectiveTiltDeg > 1.5 && (
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
                CRAWLER TILT: {mobility.effectiveTiltDeg.toFixed(1)}° (PITCH {mobility.pitchDeg.toFixed(1)}° | ROLL {mobility.rollDeg.toFixed(1)}°)
              </span>
            </div>
          </Html>
        )}

        {/* Lateral Clearance Warning Planes (When path width margin violates threshold) */}
        {feasibility.clearanceConflictDetected && (
          <group position={[0, 0.45, 0]}>
            <mesh position={[0, 0, 0.85]}>
              <boxGeometry args={[3.2, 0.6, 0.04]} />
              <meshBasicMaterial color="#e11d48" opacity={0.35} transparent wireframe />
            </mesh>
            <mesh position={[0, 0, -0.85]}>
              <boxGeometry args={[3.2, 0.6, 0.04]} />
              <meshBasicMaterial color="#e11d48" opacity={0.35} transparent wireframe />
            </mesh>
          </group>
        )}

        {/* Underbody Ground Clearance Strike Warning Plane */}
        {feasibility.groundClearanceRisk && (
          <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.6, 1.2]} />
            <meshBasicMaterial color="#f59e0b" opacity={0.45} transparent />
          </mesh>
        )}
      </group>

      {/* 3. External Waste Receiving Disposal Tanker */}
      <ReceiverTank />

      {/* 4. Demonstration Dual-Compartment Septic Vault (Cutaway) */}
      <DemonstrationSepticTank />

      {/* ========================================================== */}
      {/* SENSOR & COMPONENT OVERLAYS (When enabled)                 */}
      {/* ========================================================== */}
      <AnnotationOverlays />
    </group>
  );
};
