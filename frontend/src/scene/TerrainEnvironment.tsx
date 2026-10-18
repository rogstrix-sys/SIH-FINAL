import React from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const TerrainEnvironment: React.FC = () => {
  const showGrid = useSimulationStore((s) => s.displayOptions.showGrid);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);

  // Safety cone positions around machine and open septic tank
  const safetyCones = [
    { x: -1.8, z: 1.4 },
    { x: 1.8, z: 1.4 },
    { x: 4.2, z: -0.6 },
    { x: 4.2, z: -2.6 },
    { x: 1.8, z: -2.6 }
  ];

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Main Compact Earth / Gravel Staging Pad */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[11.0, 0.1, 8.5]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.95}
          metalness={0.05}
          wireframe={wireframe}
        />
      </mesh>

      {/* 2. Concrete Access Roadway / Pathway Approach */}
      <mesh position={[-1.2, -0.04, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.11, 2.4]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.88}
          metalness={0.1}
          wireframe={wireframe}
        />
      </mesh>

      {/* Access Pathway Perimeter Hazard Curb Line */}
      <mesh position={[-1.2, 0.02, 1.22]}>
        <boxGeometry args={[4.2, 0.04, 0.06]} />
        <meshStandardMaterial color="#eab308" roughness={0.5} />
      </mesh>
      <mesh position={[-1.2, 0.02, -1.22]}>
        <boxGeometry args={[4.2, 0.04, 0.06]} />
        <meshStandardMaterial color="#eab308" roughness={0.5} />
      </mesh>

      {/* 3. Safety Hazard Perimeter Traffic Cones */}
      {safetyCones.map((cone, idx) => (
        <group key={`cone-${idx}`} position={[cone.x, 0, cone.z]}>
          {/* Weighted Square Black Rubber Base */}
          <mesh position={[0, 0.015, 0]} receiveShadow>
            <boxGeometry args={[0.24, 0.03, 0.24]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>

          {/* Fluorescent Safety-Orange Cone Body */}
          <mesh position={[0, 0.26, 0]} castShadow>
            <coneGeometry args={[0.09, 0.5, 16]} />
            <meshStandardMaterial color="#f97316" roughness={0.4} />
          </mesh>

          {/* High-Intensity Silver Reflective Collar */}
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.052, 0.068, 0.12, 16]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* 4. Engineering Coordinate Ground Grid (Toggleable via showGrid) */}
      {showGrid && (
        <gridHelper
          args={[16, 16, '#f97316', '#334155']}
          position={[0, 0.005, 0]}
        />
      )}
    </group>
  );
};
