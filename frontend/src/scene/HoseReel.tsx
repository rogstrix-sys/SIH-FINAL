import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const HoseReel: React.FC = () => {
  const drumRef = useRef<THREE.Group>(null);

  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const isRunning = useSimulationStore((s) => s.status === 'running');
  const pumpRpm = useSimulationStore((s) => s.parameters.pumpRpm);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);

  const isSelected = selectedComponentId === 'hosereel';

  useFrame((_, delta) => {
    // Slowly rotate hose reel drum during extraction cycle
    if (drumRef.current && isRunning) {
      drumRef.current.rotation.z += (pumpRpm / 3000) * 0.45 * delta;
    }
  });

  return (
    <group
      position={[-0.45, 1.82, 0]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('hosereel');
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[1.05, 1.1, 1.1]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.6} transparent />
        </mesh>
      )}

      {/* Structural Support Pedestal Stanchions (Fixed to Tank Top Saddles) */}
      {[-0.32, 0.32].map((pz, i) => (
        <group key={`stanchion-${i}`} position={[0, -0.15, pz]}>
          <mesh castShadow>
            <boxGeometry args={[0.35, 0.35, 0.06]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} wireframe={wireframe} />
          </mesh>
          {/* Main Bearing Housing Block */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <boxGeometry args={[0.16, 0.14, 0.08]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Rotating Drum & Spooled Hose Coils */}
      <group ref={drumRef} position={[0, 0.03, 0]}>
        {/* Horizontal Drum Core Shaft (Along Z axis) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.58, 24]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} wireframe={wireframe} />
        </mesh>

        {/* Outer Circular Steel Reel Flange Discs */}
        {[-0.28, 0.28].map((fz, i) => (
          <group key={`flange-${i}`} position={[0, 0, fz]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.44, 0.44, 0.02, 32]} />
              <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.35} wireframe={wireframe} />
            </mesh>
            {/* Structural Reinforcing Radial Spokes */}
            {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((ang, j) => (
              <mesh key={`spoke-${j}`} rotation={[0, 0, ang]}>
                <boxGeometry args={[0.82, 0.04, 0.025]} />
                <meshStandardMaterial color="#c2410c" metalness={0.6} roughness={0.3} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Multi-Layer Spooled Spiral Extraction Hose Coils */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.52, 24]} />
          <meshStandardMaterial color="#0b0f17" roughness={0.85} metalness={0.15} wireframe={wireframe} />
        </mesh>

        {/* Decorative Concentric Hose Rings */}
        {[-0.18, -0.06, 0.06, 0.18].map((rz, i) => (
          <mesh key={`ring-${i}`} position={[0, 0, rz]}>
            <torusGeometry args={[0.34, 0.045, 12, 32]} />
            <meshStandardMaterial color="#172554" roughness={0.7} metalness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Hydraulic Drive Motor & High-Vacuum Rotary Swivel Union */}
      <group position={[0, 0.03, 0.36]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.16, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Twin Hydraulic Feed Tubes */}
        {[-0.04, 0.04].map((hy, i) => (
          <mesh key={`hyd-${i}`} position={[0, hy, 0.1]}>
            <cylinderGeometry args={[0.012, 0.012, 0.08, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Four-Roller Fairlead Hose Guide Head */}
      <group position={[0.42, 0.28, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.06, 0.22, 0.32]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} wireframe={wireframe} />
        </mesh>
        {/* Horizontal Guide Rollers */}
        {[-0.08, 0.08].map((ry, i) => (
          <mesh key={`hroller-${i}`} position={[0, ry, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.26, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {/* Vertical Guide Rollers */}
        {[-0.12, 0.12].map((rz, i) => (
          <mesh key={`vroller-${i}`} position={[0, 0, rz]}>
            <cylinderGeometry args={[0.02, 0.02, 0.16, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
