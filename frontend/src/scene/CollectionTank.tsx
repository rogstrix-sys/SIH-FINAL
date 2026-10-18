import React from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const CollectionTank: React.FC = () => {
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const volumeExtracted = useSimulationStore((s) => s.telemetry.volumeExtractedLiters);
  const totalVolume = useSimulationStore((s) => s.parameters.containmentVolumeLiters);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);

  const isSelected = selectedComponentId === 'tank';

  // Fill ratio of collection vessel (0.0 to 1.0)
  const fillRatio = Math.min(1.0, Math.max(0.02, volumeExtracted / Math.max(1, totalVolume)));
  // Sight glass height: max 0.65m tube
  const sightFluidHeight = 0.65 * fillRatio;

  return (
    <group
      position={[-0.45, 0.95, 0]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('tank');
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[1.9, 1.4, 1.3]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.6} transparent />
        </mesh>
      )}

      {/* Tank Saddle Mounting Brackets */}
      {[-0.6, 0.6].map((sx, i) => (
        <mesh key={`saddle-${i}`} position={[sx, -0.28, 0]} castShadow>
          <boxGeometry args={[0.16, 0.24, 1.04]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} wireframe={wireframe} />
        </mesh>
      ))}

      {/* Main Cylindrical Pressure/Vacuum Shell (Cylinder along X axis, length 1.4m, radius 0.48m) */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.48, 0.48, 1.4, 32]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.7}
          roughness={0.3}
          wireframe={wireframe}
        />
      </mesh>

      {/* Front Torispherical Dished Head (Facing Motor/Pump at +X) */}
      <mesh position={[0.7, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <sphereGeometry args={[0.48, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} wireframe={wireframe} />
      </mesh>

      {/* Rear Hydraulic Full-Opening Cleanout Door (Facing -X) */}
      <group position={[-0.7, 0, 0]}>
        {/* Dished Door Shell */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <sphereGeometry args={[0.48, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} wireframe={wireframe} />
        </mesh>

        {/* Heavy Locking Ring Flange & Clamping Wedges */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.04, 0, 0]}>
          <torusGeometry args={[0.49, 0.035, 12, 32]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Heavy Top Hinge Lug */}
        <mesh position={[0, 0.52, 0]} castShadow>
          <boxGeometry args={[0.12, 0.14, 0.18]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Bottom 4-Inch Discharge Gate Valve with Camlock Cap */}
        <group position={[-0.22, -0.32, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.22, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Manual Gate Valve Handwheel */}
          <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.09, 0.015, 12, 20]} />
            <meshStandardMaterial color="#dc2626" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* Top Inspection Manhole Dome with Clamp Bolts */}
      <group position={[0.2, 0.48, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.12, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.04, 24]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Hinge & Swing Clamps */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, idx) => (
          <mesh
            key={`bolt-${idx}`}
            position={[Math.cos(ang) * 0.24, 0.06, Math.sin(ang) * 0.24]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.08, 10]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* External Borosilicate Glass Sight Gauge Tube (Visible Fill Level) */}
      <group position={[0, 0, 0.52]}>
        {/* Brass Upper & Lower Isolation Valves */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Clear Glass Sight Tube */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.7, 16]} />
          <meshPhysicalMaterial
            color="#bae6fd"
            transmission={0.92}
            opacity={1.0}
            transparent
            roughness={0.05}
            ior={1.48}
          />
        </mesh>

        {/* Live Sludge Column Inside Sight Glass (Rises with extracted volume) */}
        <mesh
          position={[0, -0.35 + sightFluidHeight / 2, 0]}
        >
          <cylinderGeometry args={[0.022, 0.022, sightFluidHeight, 16]} />
          <meshStandardMaterial color="#1c1007" roughness={0.2} />
        </mesh>

        {/* Calibrated Level Scale Ticks */}
        <mesh position={[0.04, 0, 0]}>
          <boxGeometry args={[0.015, 0.7, 0.02]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* Top Cyclone Moisture / Sludge Trap Canister */}
      <group position={[-0.45, 0.65, 0.18]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.38, 20]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <coneGeometry args={[0.12, 0.08, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* Dual Safety Pressure / Vacuum Relief Vent Valve (PVRV) */}
      <group position={[0.45, 0.58, -0.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.22, 16]} />
          <meshStandardMaterial color="#dc2626" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
          <meshStandardMaterial color="#b91c1c" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};
