import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const HoseNozzle: React.FC = () => {
  const cutterRef = useRef<THREE.Mesh>(null);

  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const operatingState = useSimulationStore((s) => s.operatingState);
  const isExtracting = operatingState === 'EXTRACT';
  const cutterEnabled = useSimulationStore((s) => s.parameters.cutterHeadEnabled);
  const cutterRpm = useSimulationStore((s) => s.parameters.cutterHeadSpeedRpm);
  const waterJetEnabled = useSimulationStore((s) => s.parameters.waterJetEnabled);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);

  const deployProgress = useSimulationStore((s) => s.kinematics.deployProgress);
  const isSelected = selectedComponentId === 'nozzle';

  const p = Math.max(0.05, Math.min(1.0, deployProgress));
  const nozzleX = THREE.MathUtils.lerp(0.95, 2.9, p);
  const nozzleY = THREE.MathUtils.lerp(0.85, -1.25, p);
  const nozzleZ = THREE.MathUtils.lerp(-0.45, -1.6, p);

  useFrame((_, delta) => {
    // Spin internal cutter blades if enabled during extraction
    if (cutterRef.current && isExtracting && cutterEnabled) {
      cutterRef.current.rotation.y += (cutterRpm / 60) * Math.PI * 2 * delta;
    }
  });

  return (
    <group
      position={[nozzleX, nozzleY, nozzleZ]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('nozzle');
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.42, 0.45, 0.42]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.6} transparent />
        </mesh>
      )}

      {/* Camlock Coupling Collar at Top of Nozzle */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.08, 16]} />
        <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Flared Heavy Steel Suction Bell Cowl */}
      <mesh position={[0, -0.04, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.13, 0.22, 20]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.85}
          roughness={0.2}
          wireframe={wireframe}
        />
      </mesh>

      {/* Bottom Intake Lip Ring */}
      <mesh position={[0, -0.15, 0]}>
        <torusGeometry args={[0.13, 0.016, 12, 24]} />
        <meshStandardMaterial color="#ea580c" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Rotating Shredder Cutter Blades Inside Suction Throat */}
      <mesh ref={cutterRef} position={[0, -0.08, 0]}>
        <boxGeometry args={[0.18, 0.025, 0.025]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Peripheral High-Pressure Hydro-Jetting Manifold Ring */}
      <group position={[0, -0.12, 0]}>
        <mesh>
          <torusGeometry args={[0.14, 0.014, 10, 24]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* 6 Peripheral Jetting Orifices */}
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const angle = (idx * Math.PI * 2) / 6;
          const jx = Math.cos(angle) * 0.14;
          const jz = Math.sin(angle) * 0.14;
          return (
            <group key={`jet-${idx}`} position={[jx, 0, jz]} rotation={[0.4, angle, 0]}>
              <mesh>
                <cylinderGeometry args={[0.008, 0.008, 0.03, 8]} />
                <meshStandardMaterial color="#38bdf8" metalness={0.9} />
              </mesh>

              {/* Hydro-jet fluid spray cones when water jetting is active */}
              {waterJetEnabled && isExtracting && (
                <mesh position={[0, -0.08, 0]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.04, 0.14, 12, 1, true]} />
                  <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} wireframe />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
};
