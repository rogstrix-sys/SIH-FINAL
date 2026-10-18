import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const DemonstrationSepticTank: React.FC = () => {
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const cutaway = useSimulationStore((s) => s.displayOptions.cutaway);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);
  const sourceLevelM = useSimulationStore((s) => s.materialBalance.sourceLevelM);
  const sourceVolumeL = useSimulationStore((s) => s.materialBalance.sourceVolumeL);
  const initialVolumeL = useSimulationStore((s) => s.materialBalance.totalInitialVolumeL);
  const isMaterialFlowing = useSimulationStore((s) => s.kinematics.isMaterialFlowing);

  const liquidMeshRef = useRef<THREE.Mesh>(null);
  const particlesGroupRef = useRef<THREE.Group>(null);
  const isSelected = selectedComponentId === 'septictank';

  // Sludge depth in demonstration tank: tank internal floor is at Y = -1.5, ceiling at Y = 0.1 (total depth 1.6m)
  const sludgeDepthRatio = Math.max(0.04, Math.min(1.0, sourceVolumeL / Math.max(1, initialVolumeL)));
  const sludgeHeight = 0.75 * sludgeDepthRatio;
  const liquidHeight = 0.55 * Math.max(0.05, sourceLevelM / 1.85);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Liquid surface gentle oscillation during extraction / jetting
    if (liquidMeshRef.current) {
      if (isMaterialFlowing) {
        liquidMeshRef.current.position.y =
          -0.84 + sludgeHeight + liquidHeight / 2 + Math.sin(t * 5.0) * 0.006;
      } else {
        liquidMeshRef.current.position.y = -0.84 + sludgeHeight + liquidHeight / 2;
      }
    }

    // Dynamic suction slurry cavitation particles streaming into the nozzle aperture
    if (particlesGroupRef.current && isMaterialFlowing) {
      particlesGroupRef.current.children.forEach((p, idx) => {
        const speed = 1.2 + (idx % 3) * 0.4;
        const progress = ((t * speed + idx * 0.25) % 1.0);
        // Particles move from vault floor toward suction nozzle center at [0, -0.5, 0]
        const angle = (idx / 8) * Math.PI * 2 + t * 0.5;
        const radius = (1.0 - progress) * 0.45;
        p.position.x = Math.cos(angle) * radius;
        p.position.z = Math.sin(angle) * radius;
        p.position.y = -0.84 + sludgeHeight * (1.0 - progress * 0.85);
        p.scale.setScalar(Math.max(0.2, 1.0 - progress * 0.5));
      });
    }
  });

  return (
    <group
      position={[2.9, -0.65, -1.6]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('septictank');
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[2.4, 1.9, 1.8]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.7} transparent />
        </mesh>
      )}

      {/* Concrete Vault Floor Slab */}
      <mesh position={[0, -0.92, 0]} receiveShadow>
        <boxGeometry args={[2.2, 0.16, 1.6]} />
        <meshStandardMaterial color="#475569" roughness={0.92} metalness={0.08} wireframe={wireframe} />
      </mesh>

      {/* Concrete Vault Roof Ceiling Slab */}
      <mesh position={[0, 0.42, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.2, 0.14, 1.6]} />
        <meshStandardMaterial color="#334155" roughness={0.88} metalness={0.1} wireframe={wireframe} />
      </mesh>

      {/* Back Concrete Wall */}
      <mesh position={[0, -0.25, -0.75]} receiveShadow>
        <boxGeometry args={[2.2, 1.25, 0.14]} />
        <meshStandardMaterial color="#475569" roughness={0.92} metalness={0.08} wireframe={wireframe} />
      </mesh>

      {/* Left Concrete Wall */}
      <mesh position={[-1.05, -0.25, 0]} receiveShadow>
        <boxGeometry args={[0.14, 1.25, 1.6]} />
        <meshStandardMaterial color="#475569" roughness={0.92} metalness={0.08} wireframe={wireframe} />
      </mesh>

      {/* Right Concrete Wall */}
      <mesh position={[1.05, -0.25, 0]} receiveShadow>
        <boxGeometry args={[0.14, 1.25, 1.6]} />
        <meshStandardMaterial color="#475569" roughness={0.92} metalness={0.08} wireframe={wireframe} />
      </mesh>

      {/* Front Concrete Wall: Solid when cutaway is FALSE */}
      {!cutaway && (
        <mesh position={[0, -0.25, 0.75]} receiveShadow>
          <boxGeometry args={[2.2, 1.25, 0.14]} />
          <meshStandardMaterial color="#475569" roughness={0.92} metalness={0.08} wireframe={wireframe} />
        </mesh>
      )}

      {/* Exposed Section Cut Edges with Safety Orange Rebar Profile when Cutaway is TRUE */}
      {cutaway && (
        <group position={[0, -0.25, 0.79]}>
          {/* Bottom cut edge */}
          <mesh position={[0, -0.62, 0]}>
            <boxGeometry args={[2.22, 0.05, 0.02]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.65} />
          </mesh>
          {/* Top cut edge */}
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[2.22, 0.05, 0.02]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.65} />
          </mesh>
          {/* Left cut edge */}
          <mesh position={[-1.05, 0, 0]}>
            <boxGeometry args={[0.05, 1.26, 0.02]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.65} />
          </mesh>
          {/* Right cut edge */}
          <mesh position={[1.05, 0, 0]}>
            <boxGeometry args={[0.05, 1.26, 0.02]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.65} />
          </mesh>
        </group>
      )}

      {/* Concrete Interior Baffle Dividing Weir Wall */}
      <group position={[0.2, -0.25, 0]}>
        {/* Upper baffle portion */}
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.1, 0.7, 1.5]} />
          <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.1} wireframe={wireframe} />
        </mesh>
        {/* Submerged Pass-Through Flow Slots at Mid-Depth */}
        <mesh position={[0, -0.45, 0.45]}>
          <boxGeometry args={[0.1, 0.45, 0.55]} />
          <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.45, -0.45]}>
          <boxGeometry args={[0.1, 0.45, 0.55]} />
          <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.1} />
        </mesh>
      </group>

      {/* ==================================================== */}
      {/* INTERNAL STRATIFIED FLUID LAYERS                     */}
      {/* ==================================================== */}

      {/* 1. Settled Bottom Sludge Layer (Dense Black-Brown Organic Septage) */}
      <mesh position={[0, -0.84 + sludgeHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[2.0, sludgeHeight, 1.4]} />
        <meshStandardMaterial
          color="#1a0f05"
          roughness={0.35}
          metalness={0.08}
          wireframe={wireframe}
        />
      </mesh>

      {/* 2. Supernatant Liquid Effluent Layer (Translucent Amber/Effluent with PBR Transmission) */}
      <mesh
        ref={liquidMeshRef}
        position={[0, -0.84 + sludgeHeight + liquidHeight / 2, 0]}
      >
        <boxGeometry args={[2.0, liquidHeight, 1.4]} />
        <meshPhysicalMaterial
          color="#38371a"
          transmission={0.76}
          opacity={0.85}
          transparent
          roughness={0.12}
          ior={1.34}
          clearcoat={0.6}
        />
      </mesh>

      {/* 3. Top Scum Blanket Crust */}
      <mesh position={[0, -0.84 + sludgeHeight + liquidHeight, 0]}>
        <boxGeometry args={[1.98, 0.04, 1.38]} />
        <meshStandardMaterial
          color="#2a180a"
          roughness={0.9}
          metalness={0.05}
          wireframe={wireframe}
        />
      </mesh>

      {/* 4. Active Suction Stream Cavitation Particles (Moving into nozzle during EXTRACT) */}
      {isMaterialFlowing && (
        <group ref={particlesGroupRef}>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={`slurry-vortex-particle-${i}`}>
              <sphereGeometry args={[0.024, 8, 8]} />
              <meshStandardMaterial
                color="#eab308"
                emissive="#ca8a04"
                emissiveIntensity={0.6}
                roughness={0.3}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* ==================================================== */}
      {/* TOP ACCESS MANHOLE CHIMNEY & COVER                  */}
      {/* ==================================================== */}
      <group position={[0, 0.42, 0]}>
        {/* Concrete Riser Chimney */}
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.44, 24, 1, true]} />
          <meshStandardMaterial color="#475569" roughness={0.85} metalness={0.12} wireframe={wireframe} />
        </mesh>

        {/* Cast-Iron Manhole Ring Frame */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.06, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.88} roughness={0.25} wireframe={wireframe} />
        </mesh>

        {/* Removed Cast-Iron Manhole Cover Resting Safely Beside Opening */}
        <mesh position={[0.65, 0.44, 0.35]} rotation={[0.15, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.04, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.28} />
        </mesh>

        {/* Heavy Inspection Step Rungs */}
        {[-0.2, 0.0, 0.2].map((sy, idx) => (
          <mesh key={`rung-${idx}`} position={[-0.28, sy, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.18, 10]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* Sanitary PVC Inlet & Outlet Drop Tees */}
      <group position={[-0.95, 0.15, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.35, 16]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.25} metalness={0.1} />
        </mesh>
        <mesh position={[0.12, -0.22, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.44, 16]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.25} metalness={0.1} />
        </mesh>
      </group>
    </group>
  );
};
