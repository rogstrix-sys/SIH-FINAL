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
import { Compass } from 'lucide-react';

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
      <AnnotationOverlays />
    </group>
  );
};
