import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const SludgeFluidMesh: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const sludgeLevelM = useSimulationStore((s) => s.telemetry.sludgeLevelM);
  const pumpRpm = useSimulationStore((s) => s.parameters.pumpRpm);
  const isRunning = useSimulationStore((s) => s.status === 'running');
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);

  // Map 0 - 2.2m vault depth to 3D Y coordinates (chamber floor is at Y = -2.8, full is Y = -0.7)
  const targetY = -2.8 + (sludgeLevelM / 2.2) * 2.1;

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    // Smoothly interpolate fluid surface elevation
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.08);

    // Dynamic wave perturbation if running
    if (isRunning && meshRef.current.geometry) {
      const time = state.clock.getElapsedTime() * (pumpRpm / 600.0);
      meshRef.current.rotation.y = Math.sin(time * 0.4) * 0.005;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, -1.2, 0]}
      receiveShadow
      castShadow
    >
      {/* 5.2m x 3.6m surface geometry for dual-compartment chamber */}
      <boxGeometry args={[5.2, 0.12, 3.6]} />
      <meshStandardMaterial
        color="#2c1a0e"
        roughness={0.22}
        metalness={0.15}
        wireframe={wireframe}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
};
