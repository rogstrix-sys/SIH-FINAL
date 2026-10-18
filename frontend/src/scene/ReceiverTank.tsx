import React from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const ReceiverTank: React.FC = () => {
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const receiverVolumeL = useSimulationStore((s) => s.materialBalance.receiverVolumeL);
  const receiverCapacityL = useSimulationStore((s) => s.engine.parameters.receiverTankCapacityL);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);
  const operatingState = useSimulationStore((s) => s.operatingState);

  const isSelected = selectedComponentId === 'receiver';

  // Fill ratio of external receiving tanker (0.0 to 1.0)
  const fillRatio = Math.min(1.0, Math.max(0.01, receiverVolumeL / Math.max(1, receiverCapacityL)));
  const fluidHeight = 0.95 * fillRatio;

  return (
    <group
      position={[-3.3, 0.45, 0]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('receiver');
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[2.5, 1.8, 1.6]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.6} transparent />
        </mesh>
      )}

      {/* Heavy-Duty Transport Trailer Skid Chassis */}
      <mesh position={[0, -0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.3, 0.14, 1.35]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} wireframe={wireframe} />
      </mesh>

      {/* Trailer Support Outriggers / Wheels */}
      {[-0.8, 0.8].map((wx, i) =>
        [-0.72, 0.72].map((wz, j) => (
          <group key={`rec-wheel-${i}-${j}`} position={[wx, -0.32, wz]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.26, 0.26, 0.16, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.9} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.17, 12]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))
      )}

      {/* Main Receiving Containment Tank Vessel (Cylindrical body along X) */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 1.9, 32]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.7}
          roughness={0.35}
          wireframe={wireframe}
        />
      </mesh>

      {/* Front Dished Head */}
      <mesh position={[0.95, 0.4, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <sphereGeometry args={[0.55, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} wireframe={wireframe} />
      </mesh>

      {/* Rear Dished Head */}
      <mesh position={[-0.95, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <sphereGeometry args={[0.55, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} wireframe={wireframe} />
      </mesh>

      {/* Top Inspection Hatch & Breather Vent */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.12, 20]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 20]} />
        <meshStandardMaterial color="#0284c7" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Translucent Inspection Sight Window / Fluid Column */}
      <group position={[0.4, 0.4, 0.56]}>
        {/* Frame */}
        <mesh>
          <boxGeometry args={[0.22, 1.02, 0.04]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Glass backing */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.15, 0.95, 0.02]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            roughness={0.1}
            transmission={0.85}
            thickness={0.03}
          />
        </mesh>
        {/* Rising Fluid Column */}
        {fluidHeight > 0.01 && (
          <mesh position={[0, -0.475 + fluidHeight / 2, 0.02]}>
            <boxGeometry args={[0.13, fluidHeight, 0.03]} />
            <meshStandardMaterial color="#451a03" roughness={0.5} metalness={0.2} />
          </mesh>
        )}
      </group>

      {/* Inlet Manifold Coupler (Connecting to mobile machine discharge outlet) */}
      <mesh position={[1.05, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.22, 16]} />
        <meshStandardMaterial color="#f97316" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Flexible Discharge Transfer Conduit (Machine to Receiver) */}
      <mesh position={[1.5, 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 16]} />
        <meshStandardMaterial
          color={operatingState === 'DISCHARGE' ? '#0284c7' : '#1e293b'}
          roughness={0.7}
        />
      </mesh>

      {/* Receiver Tank Labels */}
      <mesh position={[0, 0.4, 0.57]}>
        <boxGeometry args={[0.8, 0.2, 0.01]} />
        <meshStandardMaterial color="#0284c7" roughness={0.4} />
      </mesh>
    </group>
  );
};
