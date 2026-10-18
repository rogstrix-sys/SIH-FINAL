import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';

export const VaultChamberMesh: React.FC = () => {
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const cutaway = useSimulationStore((s) => s.displayOptions.cutaway);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);

  const isSelected = selectedComponentId === 'vault';

  return (
    <group
      position={[0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('vault');
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, -1.8, 0]}>
          <boxGeometry args={[5.6, 2.8, 4.0]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.4} transparent />
        </mesh>
      )}

      {/* Concrete Vault Floor Slab */}
      <mesh position={[0, -2.9, 0]} receiveShadow>
        <boxGeometry args={[5.4, 0.25, 3.8]} />
        <meshStandardMaterial color="#475569" roughness={0.85} metalness={0.1} wireframe={wireframe} />
      </mesh>

      {/* Concrete Vault Roof Ceiling Slab */}
      <mesh position={[0, -0.65, 0]} receiveShadow castShadow>
        <boxGeometry args={[5.4, 0.22, 3.8]} />
        <meshStandardMaterial color="#334155" roughness={0.8} metalness={0.15} wireframe={wireframe} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, -1.75, -1.85]} receiveShadow>
        <boxGeometry args={[5.4, 2.1, 0.2]} />
        <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.1} wireframe={wireframe} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-2.6, -1.75, 0]} receiveShadow>
        <boxGeometry args={[0.2, 2.1, 3.8]} />
        <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.1} wireframe={wireframe} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[2.6, -1.75, 0]} receiveShadow>
        <boxGeometry args={[0.2, 2.1, 3.8]} />
        <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.1} wireframe={wireframe} />
      </mesh>

      {/* Front Wall: Only rendered if cutaway is FALSE */}
      {!cutaway && (
        <mesh position={[0, -1.75, 1.85]} receiveShadow>
          <boxGeometry args={[5.4, 2.1, 0.2]} />
          <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.1} wireframe={wireframe} />
        </mesh>
      )}

      {/* Interior Concrete Baffle Dividing Wall with Pass-through Opening */}
      <group position={[0.2, -1.75, 0]}>
        {/* Upper wall portion */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.16, 0.9, 3.6]} />
          <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.1} wireframe={wireframe} />
        </mesh>
        {/* Pass-through slot on bottom floor for crawler */}
        <mesh position={[0, -0.75, -1.1]}>
          <boxGeometry args={[0.16, 0.6, 1.4]} />
          <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.1} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, -0.75, 1.1]}>
          <boxGeometry args={[0.16, 0.6, 1.4]} />
          <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.1} wireframe={wireframe} />
        </mesh>
      </group>

      {/* Exposed Architectural Section Cut Edges with Safety Orange / Hazard Hatch Line */}
      {cutaway && (
        <group position={[0, -1.75, 1.89]}>
          {/* Bottom slab cut edge */}
          <mesh position={[0, -1.1, 0]}>
            <boxGeometry args={[5.42, 0.08, 0.04]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.6} />
          </mesh>
          {/* Top slab cut edge */}
          <mesh position={[0, 1.05, 0]}>
            <boxGeometry args={[5.42, 0.08, 0.04]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.6} />
          </mesh>
          {/* Left wall cut edge */}
          <mesh position={[-2.6, 0, 0]}>
            <boxGeometry args={[0.08, 2.15, 0.04]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.6} />
          </mesh>
          {/* Right wall cut edge */}
          <mesh position={[2.6, 0, 0]}>
            <boxGeometry args={[0.08, 2.15, 0.04]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {/* Surface Ground Stratified Soil Cut */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[7.2, 0.25, 5.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.95} metalness={0.05} wireframe={wireframe} />
      </mesh>

      {/* Manhole Access Chimney */}
      <group position={[0.6, 0.25, 0.4]}>
        {/* Concrete Riser Ring */}
        <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.7, 24, 1, true]} />
          <meshStandardMaterial color="#475569" roughness={0.8} metalness={0.15} wireframe={wireframe} />
        </mesh>
        {/* Cast-Iron Frame & Rim */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.46, 0.46, 0.08, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} wireframe={wireframe} />
        </mesh>
        {/* Heavy Inspection Ladder Rungs */}
        {[-0.45, -0.25, -0.05, 0.15].map((stepY, i) => (
          <mesh key={i} position={[-0.32, stepY, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 0.22, 10]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* PVC Inflow / Outflow Drop Tees */}
      <group position={[-2.4, -1.0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
        <mesh position={[0.2, -0.3, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};
