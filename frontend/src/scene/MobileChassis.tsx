import React from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const MobileChassis: React.FC = () => {
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);
  const operatingState = useSimulationStore((s) => s.operatingState);

  const isSelected = selectedComponentId === 'chassis';
  const stabilizerExtension = useSimulationStore((s) => s.kinematics.stabilizerExtension);

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

  // Jack extension offset: 0.0 is fully retracted up by 0.18m, 1.0 is planted on ground
  const jackDrop = 0.18 * stabilizerExtension;
  const rodY = -0.22 - jackDrop * 0.5;
  const footY = -0.29 - jackDrop;

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
          <meshBasicMaterial color="#f97316" wireframe opacity={0.7} transparent />
        </mesh>
      )}

      {/* Main Longitudinal I-Beam Rails (Twin Box Section Frame) */}
      {[-0.52, 0.52].map((railZ, i) => (
        <mesh key={`rail-${i}`} position={[0, 0.45, railZ]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.18, 0.1]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.88}
            roughness={0.25}
            wireframe={wireframe}
          />
        </mesh>
      ))}

      {/* Cross-member Structural Bracing */}
      {[-1.1, -0.4, 0.4, 1.1].map((cx, i) => (
        <mesh key={`cross-${i}`} position={[cx, 0.45, 0]} castShadow>
          <boxGeometry args={[0.12, 0.16, 1.04]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.3} wireframe={wireframe} />
        </mesh>
      ))}

      {/* Steel Deck Skid Plating (Safety Diamond Texture Plate) */}
      <mesh position={[-0.2, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.04, 1.25]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.75}
          roughness={0.35}
          wireframe={wireframe}
        />
      </mesh>

      {/* Front and Rear Solid Steel Axle Tubes */}
      {[1.05, -1.05].map((axleX, i) => (
        <mesh key={`axle-${i}`} position={[axleX, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.64, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.18} />
        </mesh>
      ))}

      {/* 4 Rugged Agricultural Lug Wheels & Heavy Hubs */}
      {wheels.map((w, i) => (
        <group key={`wheel-${i}`} position={[w.x, 0.35, w.z]}>
          {/* Heavy Vulcanized Rubber Tire with Directional Cleats */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.26, 24]} />
            <meshStandardMaterial color="#111827" roughness={0.94} metalness={0.06} wireframe={wireframe} />
          </mesh>

          {/* Steel Beadlock Rim */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.27, 20]} />
            <meshStandardMaterial color="#eab308" metalness={0.65} roughness={0.3} wireframe={wireframe} />
          </mesh>

          {/* Center Hub Grease Cap */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, w.z > 0 ? 0.14 : -0.14]}>
            <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.18} />
          </mesh>

          {/* 6 Chrome Lug Nuts on Rim */}
          {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map((ang, j) => (
            <mesh
              key={`lug-${j}`}
              position={[Math.cos(ang) * 0.14, Math.sin(ang) * 0.14, w.z > 0 ? 0.14 : -0.14]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.014, 0.014, 0.02, 6]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.1} />
            </mesh>
          ))}

          {/* Molded Steel Wheel Fender Arch */}
          <mesh position={[0, 0.26, w.z > 0 ? -0.04 : 0.04]} castShadow>
            <boxGeometry args={[0.78, 0.04, 0.3]} />
            <meshStandardMaterial color="#ea580c" metalness={0.45} roughness={0.35} wireframe={wireframe} />
          </mesh>
        </group>
      ))}

      {/* 4 Hydraulic Outrigger Stabilizer Legs & Ground Footpads */}
      {stabilizers.map((s, i) => (
        <group key={`stab-${i}`} position={[s.x, 0.45, s.z]}>
          {/* Diagonal Outrigger Arm */}
          <mesh rotation={[0, s.z > 0 ? 0.3 : -0.3, 0]} castShadow>
            <boxGeometry args={[0.16, 0.14, 0.28]} />
            <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.3} wireframe={wireframe} />
          </mesh>

          {/* Vertical Hydraulic Cylinder Jack Housing */}
          <mesh position={[0, -0.16, s.z > 0 ? 0.12 : -0.12]} castShadow>
            <cylinderGeometry args={[0.042, 0.042, 0.32, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.25} />
          </mesh>

          {/* Telescoping Chrome Jack Piston Rod (Animated) */}
          <mesh position={[0, rodY, s.z > 0 ? 0.12 : -0.12]}>
            <cylinderGeometry args={[0.026, 0.026, 0.24, 16]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.08} />
          </mesh>

          {/* Swivel Ground Footpad Resting Firmly on Terrain (Animated) */}
          <mesh position={[0, footY, s.z > 0 ? 0.12 : -0.12]} receiveShadow>
            <cylinderGeometry args={[0.11, 0.13, 0.03, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* Machine Side Control Panel Enclosure (NEMA 4X / IP66) */}
      <group position={[0.25, 0.68, 0.58]}>
        {/* Steel Cabinet Body */}
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.26, 0.1]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} wireframe={wireframe} />
        </mesh>
        {/* Door Bezel & Rubber Seal */}
        <mesh position={[0, 0, 0.052]}>
          <boxGeometry args={[0.32, 0.24, 0.01]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Emergency Stop Mushroom Button */}
        <group position={[-0.09, 0.04, 0.065]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.018, 12]} />
            <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.012, 16]} />
            <meshStandardMaterial color="#dc2626" metalness={0.5} roughness={0.2} />
          </mesh>
        </group>
        {/* Pilot Status LEDs */}
        <mesh position={[0.04, 0.05, 0.06]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial
            color={operatingState === 'EXTRACT' ? '#22c55e' : '#64748b'}
            emissive={operatingState === 'EXTRACT' ? '#22c55e' : '#000000'}
            emissiveIntensity={0.8}
          />
        </mesh>
        <mesh position={[0.08, 0.05, 0.06]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial
            color={operatingState === 'FAULT' ? '#ef4444' : '#64748b'}
            emissive={operatingState === 'FAULT' ? '#ef4444' : '#000000'}
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>

      {/* Front Safety Hazard Striped Bumper & Tow Eyelet */}
      <group position={[1.42, 0.42, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.14, 1.6]} />
          <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.35} wireframe={wireframe} />
        </mesh>
        {/* Diagonal Warning Stripe Plate */}
        <mesh position={[0.042, 0, 0]}>
          <boxGeometry args={[0.005, 0.12, 1.5]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
        {/* Heavy Steel Tow Eyelet */}
        <mesh position={[0.08, -0.02, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.075, 0.022, 12, 24]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Rear Heavy Bumper Bar with Hazard Chevron Stripes */}
      <group position={[-1.42, 0.42, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.14, 1.6]} />
          <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.35} wireframe={wireframe} />
        </mesh>
        <mesh position={[-0.042, 0, 0]}>
          <boxGeometry args={[0.005, 0.12, 1.5]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};
