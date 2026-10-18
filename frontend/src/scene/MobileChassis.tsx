import React from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const MobileChassis: React.FC = () => {
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);

  const isSelected = selectedComponentId === 'chassis';

  // Wheel positions: Front Axle at X = 1.05, Rear Axle at X = -1.05; Z = ±0.82
  const wheels = [
    { x: 1.05, z: 0.82 },
    { x: 1.05, z: -0.82 },
    { x: -1.05, z: 0.82 },
    { x: -1.05, z: -0.82 }
  ];

  // Stabilizer leg positions at the 4 frame corners
  const stabilizers = [
    { x: 1.35, z: 0.75 },
    { x: 1.35, z: -0.75 },
    { x: -1.35, z: 0.75 },
    { x: -1.35, z: -0.75 }
  ];

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('chassis');
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[3.1, 0.9, 1.9]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.6} transparent />
        </mesh>
      )}

      {/* Main Longitudinal I-Beam Rails (Twin Box Section Frame) */}
      {[-0.52, 0.52].map((railZ, i) => (
        <mesh key={`rail-${i}`} position={[0, 0.45, railZ]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.18, 0.1]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.85}
            roughness={0.25}
            wireframe={wireframe}
          />
        </mesh>
      ))}

      {/* Cross-member Structural Bracing */}
      {[-1.1, -0.4, 0.4, 1.1].map((cx, i) => (
        <mesh key={`cross-${i}`} position={[cx, 0.45, 0]} castShadow>
          <boxGeometry args={[0.12, 0.16, 1.04]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} wireframe={wireframe} />
        </mesh>
      ))}

      {/* Steel Deck Skid Plating (Safety Diamond Texture Plate) */}
      <mesh position={[-0.2, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.04, 1.25]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.7}
          roughness={0.35}
          wireframe={wireframe}
        />
      </mesh>

      {/* Front and Rear Solid Steel Axle Tubes */}
      {[1.05, -1.05].map((axleX, i) => (
        <mesh key={`axle-${i}`} position={[axleX, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.64, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* 4 Rugged Agricultural Lug Wheels & Heavy Hubs */}
      {wheels.map((w, i) => (
        <group key={`wheel-${i}`} position={[w.x, 0.35, w.z]}>
          {/* Heavy Rubber Tire with Lug Cleats */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.26, 24]} />
            <meshStandardMaterial color="#111827" roughness={0.9} metalness={0.1} wireframe={wireframe} />
          </mesh>

          {/* Steel Beadlock Rim */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.27, 20]} />
            <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} wireframe={wireframe} />
          </mesh>

          {/* Center Hub & 6 Lug Bolts */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, w.z > 0 ? 0.14 : -0.14]}>
            <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Molded Steel Wheel Fender Arch */}
          <mesh position={[0, 0.26, w.z > 0 ? -0.04 : 0.04]} castShadow>
            <boxGeometry args={[0.78, 0.04, 0.3]} />
            <meshStandardMaterial color="#ea580c" metalness={0.4} roughness={0.4} wireframe={wireframe} />
          </mesh>
        </group>
      ))}

      {/* 4 Hydraulic Outrigger Stabilizer Legs & Ground Footpads */}
      {stabilizers.map((s, i) => (
        <group key={`stab-${i}`} position={[s.x, 0.45, s.z]}>
          {/* Diagonal Outrigger Arm */}
          <mesh rotation={[0, s.z > 0 ? 0.3 : -0.3, 0]} castShadow>
            <boxGeometry args={[0.16, 0.14, 0.28]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} wireframe={wireframe} />
          </mesh>

          {/* Vertical Chrome Hydraulic Cylinder Jack */}
          <mesh position={[0, -0.22, s.z > 0 ? 0.12 : -0.12]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.44, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.36, s.z > 0 ? 0.12 : -0.12]}>
            <cylinderGeometry args={[0.025, 0.025, 0.25, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
          </mesh>

          {/* Swivel Ground Footpad Resting Firmly on Terrain */}
          <mesh position={[0, -0.47, s.z > 0 ? 0.12 : -0.12]} receiveShadow>
            <cylinderGeometry args={[0.11, 0.13, 0.03, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Front Tow Hitch Eyelet & Rear Bumper Bar */}
      <mesh position={[1.45, 0.38, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.08, 0.025, 12, 24]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-1.42, 0.42, 0]} castShadow>
        <boxGeometry args={[0.08, 0.14, 1.6]} />
        <meshStandardMaterial color="#f97316" metalness={0.5} roughness={0.3} wireframe={wireframe} />
      </mesh>
    </group>
  );
};
