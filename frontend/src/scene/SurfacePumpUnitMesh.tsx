import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const SurfacePumpUnitMesh: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const pulleyRef = useRef<THREE.Mesh>(null);

  const isRunning = useSimulationStore((s) => s.status === 'running');
  const pumpRpm = useSimulationStore((s) => s.parameters.pumpRpm);
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);

  const isSelected = selectedComponentId === 'pump';

  useFrame((state, delta) => {
    // Spin drive pulley if pump running
    if (pulleyRef.current && isRunning) {
      const rotSpeed = (pumpRpm / 60) * Math.PI * 2;
      pulleyRef.current.rotation.x += rotSpeed * delta;
    }

    // High frequency mechanical vibration jitter
    if (groupRef.current && isRunning) {
      const vib = (pumpRpm / 3000) * 0.003;
      groupRef.current.position.y = 0.22 + Math.sin(state.clock.elapsedTime * 45) * vib;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[2.4, 0.22, 1.2]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('pump');
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[1.8, 1.3, 1.2]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.6} transparent />
        </mesh>
      )}

      {/* Structural Steel Skid Base Frame */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.12, 0.9]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} wireframe={wireframe} />
      </mesh>

      {/* Vibration Isolator Mounts */}
      {[-0.65, 0.65].map((mx, mi) =>
        [-0.35, 0.35].map((mz, zi) => (
          <mesh key={`${mi}-${zi}`} position={[mx, 0.04, mz]}>
            <cylinderGeometry args={[0.05, 0.05, 0.08, 12]} />
            <meshStandardMaterial color="#111827" roughness={0.9} />
          </mesh>
        ))
      )}

      {/* Electric Drive Motor (TEFC Industrial Motor) */}
      <group position={[-0.45, 0.42, 0]}>
        {/* Motor Stator Body */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.55, 20]} />
          <meshStandardMaterial color="#0284c7" metalness={0.4} roughness={0.4} wireframe={wireframe} />
        </mesh>
        {/* Motor Cooling Fan Shroud */}
        <mesh position={[-0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.23, 0.23, 0.1, 20]} />
          <meshStandardMaterial color="#0369a1" metalness={0.6} roughness={0.3} wireframe={wireframe} />
        </mesh>
        {/* Terminal Box */}
        <mesh position={[0, 0.24, 0]} castShadow>
          <boxGeometry args={[0.16, 0.12, 0.14]} />
          <meshStandardMaterial color="#0c4a6e" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {/* Rotary Lobe Vacuum Pump Housing */}
      <group position={[0.35, 0.45, 0]}>
        {/* Cast Iron Pump Body */}
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.48, 0.46]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} wireframe={wireframe} />
        </mesh>

        {/* Suction Inlet Flange (Facing downward to vault) */}
        <mesh position={[-0.15, -0.25, 0]} rotation={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.14, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Discharge Silencer / Oil Separator Canister */}
        <group position={[0.15, 0.48, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.14, 0.14, 0.5, 20]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} wireframe={wireframe} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <coneGeometry args={[0.12, 0.1, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* Analog Vacuum / Pressure Gauges */}
        <group position={[0.29, 0.15, 0.12]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.04, 20]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0.025, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.06, 20]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* Belt Drive Guard & Pulley */}
      <group position={[-0.05, 0.44, 0.28]}>
        {/* Yellow Safety Belt Guard */}
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.38, 0.12]} />
          <meshStandardMaterial color="#eab308" metalness={0.3} roughness={0.4} wireframe={wireframe} />
        </mesh>
        {/* Spinning Drive Pulley */}
        <mesh ref={pulleyRef} position={[0, 0, 0.07]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};
