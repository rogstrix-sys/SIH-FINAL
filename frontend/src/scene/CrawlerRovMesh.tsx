import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const CrawlerRovMesh: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const cutterDrumRef = useRef<THREE.Mesh>(null);
  const lidarRef = useRef<THREE.Mesh>(null);

  const isRunning = useSimulationStore((s) => s.status === 'running');
  const cutterSpeed = useSimulationStore((s) => s.parameters.cutterHeadSpeedRpm);
  const cutterEnabled = useSimulationStore((s) => s.parameters.cutterHeadEnabled);
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);

  const isSelected = selectedComponentId === 'crawler';

  useFrame((state, delta) => {
    // Spin cutter head drum
    if (cutterDrumRef.current && isRunning && cutterEnabled) {
      const rotSpeed = (cutterSpeed / 60) * Math.PI * 2;
      cutterDrumRef.current.rotation.x += rotSpeed * delta;
    }

    // Spin LiDAR turret
    if (lidarRef.current) {
      lidarRef.current.rotation.y += delta * 6.0;
    }

    // Subtle robot vibration based on status
    if (groupRef.current && isRunning) {
      groupRef.current.position.y = -2.7 + Math.sin(state.clock.elapsedTime * 24) * 0.004;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0.6, -2.7, 0.4]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('crawler');
      }}
    >
      {/* Selection Halo */}
      {isSelected && (
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.5, 0.9, 1.1]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.6} transparent />
        </mesh>
      )}

      {/* Main Chassis Pod (Safety Yellow / Hazard Orange) */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.95, 0.35, 0.65]} />
        <meshStandardMaterial
          color="#f59e0b"
          metalness={0.4}
          roughness={0.35}
          wireframe={wireframe}
        />
      </mesh>

      {/* Sealed Instrumentation Enclosure */}
      <mesh position={[0, 0.52, -0.05]} castShadow>
        <boxGeometry args={[0.65, 0.22, 0.45]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.8}
          roughness={0.2}
          wireframe={wireframe}
        />
      </mesh>

      {/* Rotating LiDAR Turret */}
      <group position={[0, 0.72, -0.05]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh ref={lidarRef} position={[0, 0.08, 0]}>
          <boxGeometry args={[0.18, 0.06, 0.1]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={1.5}
          />
        </mesh>
      </group>

      {/* Twin Heavy Rubber Traction Tracks */}
      {[-0.38, 0.38].map((trackZ, i) => (
        <group key={i} position={[0, 0.18, trackZ]}>
          {/* Main Track Loop */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.15, 0.32, 0.18]} />
            <meshStandardMaterial color="#111827" roughness={0.9} wireframe={wireframe} />
          </mesh>
          {/* Track Drive Sprockets */}
          {[-0.45, 0, 0.45].map((wheelX, wi) => (
            <mesh key={wi} position={[wheelX, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.19, 14]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Front Cutter Head & Intake Cowl */}
      <group position={[0.62, 0.2, 0]}>
        {/* Suction Bell Cowl */}
        <mesh rotation={[0, 0, -Math.PI / 2]} castShadow>
          <coneGeometry args={[0.26, 0.32, 16, 1, true]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} wireframe={wireframe} />
        </mesh>

        {/* Rotating Cutter Head Drum with Cleats */}
        <mesh ref={cutterDrumRef} position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.48, 16]} />
          <meshStandardMaterial color="#ea580c" metalness={0.8} roughness={0.2} wireframe={wireframe} />
        </mesh>
      </group>

      {/* High-Intensity Submersible LED Worklights */}
      {[-0.22, 0.22].map((lightZ, li) => (
        <group key={li} position={[0.48, 0.42, lightZ]}>
          <mesh>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={3.0}
            />
          </mesh>
          <spotLight
            position={[0.1, 0, 0]}
            target-position={[3.0, -1.0, lightZ]}
            angle={Math.PI / 4}
            penumbra={0.4}
            intensity={3.5}
            color="#fef08a"
            distance={10}
            castShadow
          />
        </group>
      ))}
    </group>
  );
};
