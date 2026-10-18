import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const ExtractionHose: React.FC = () => {
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const parameters = useSimulationStore((s) => s.parameters);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);
  const kinematics = useSimulationStore((s) => s.kinematics);
  const isMaterialFlowing = useSimulationStore((s) => s.kinematics.isMaterialFlowing);
  const flowVelocity = useSimulationStore((s) => s.kinematics.materialFlowVelocityMs);

  const isSelected = selectedComponentId === 'hose';
  const flowMarkersRef = useRef<THREE.Group>(null);

  // Dynamic spline route adapting to articulated boom kinematics deployment
  const { tubeGeometry, couplingPositions, curve } = useMemo(() => {
    const hoseRadius = (parameters.hoseDiameterMm / 1000.0) / 2.0;
    const p = Math.max(0.05, Math.min(1.0, kinematics.deployProgress));

    // Dynamic keyway points tracking articulated crane arm
    const midX = THREE.MathUtils.lerp(0.65, 1.95, p);
    const midY = THREE.MathUtils.lerp(2.1, 2.55, p);
    const midZ = THREE.MathUtils.lerp(-0.35, -1.2, p);

    const tipX = THREE.MathUtils.lerp(0.95, 2.9, p);
    const tipY = THREE.MathUtils.lerp(2.2, 1.7, p);
    const tipZ = THREE.MathUtils.lerp(-0.45, -1.6, p);

    const dropX = THREE.MathUtils.lerp(0.95, 2.9, p);
    const dropY = THREE.MathUtils.lerp(1.4, 0.45, p);
    const dropZ = THREE.MathUtils.lerp(-0.45, -1.6, p);

    const nozzleX = THREE.MathUtils.lerp(0.95, 2.9, p);
    const nozzleY = THREE.MathUtils.lerp(0.85, -1.15, p);
    const nozzleZ = THREE.MathUtils.lerp(-0.45, -1.6, p);

    const splineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.05, 2.1, 0.0),    // Exiting Hose Reel Drum
      new THREE.Vector3(0.25, 1.7, -0.25),   // Approaching Turret Base
      new THREE.Vector3(midX * 0.6, midY * 0.85, midZ * 0.6), // Main Boom Guide Saddle
      new THREE.Vector3(midX, midY, midZ),   // Articulated Knuckle Elbow Joint
      new THREE.Vector3(tipX, tipY, tipZ),   // Jib Tip Fairlead Roller
      new THREE.Vector3(dropX, dropY, dropZ), // Vertical Drop into Septic Vault
      new THREE.Vector3(nozzleX, nozzleY, nozzleZ) // Submerged Nozzle Suction Flange
    ]);

    const geo = new THREE.TubeGeometry(splineCurve, 54, hoseRadius, 14, false);

    const couplings = [
      new THREE.Vector3(-0.05, 2.1, 0.0),
      new THREE.Vector3(tipX, tipY, tipZ),
      new THREE.Vector3(nozzleX, nozzleY, nozzleZ)
    ];

    return { tubeGeometry: geo, couplingPositions: couplings, curve: splineCurve };
  }, [parameters.hoseDiameterMm, kinematics.deployProgress]);

  useFrame((state) => {
    if (flowMarkersRef.current && isMaterialFlowing) {
      const tSec = state.clock.getElapsedTime();
      const speed = Math.max(0.4, flowVelocity * 0.22);
      flowMarkersRef.current.children.forEach((child, i) => {
        // Material moves from nozzle (t=1.0) upward to reel/tank (t=0.0)
        const phase = (1.0 - ((tSec * speed + i * 0.11) % 1.0));
        const pt = curve.getPointAt(Math.max(0, Math.min(1, phase)));
        child.position.copy(pt);
      });
    }
  });

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('hose');
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <mesh geometry={tubeGeometry}>
          <meshBasicMaterial color="#f97316" wireframe opacity={0.7} transparent />
        </mesh>
      )}

      {/* Main Spiral Reinforced Rubber / Composite Vacuum Hose */}
      <mesh geometry={tubeGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={isMaterialFlowing ? '#1e293b' : '#0f172a'}
          roughness={0.88}
          metalness={0.12}
          wireframe={wireframe}
        />
      </mesh>

      {/* Visible Moving Slurry Material Flow Markers (When active) */}
      {isMaterialFlowing && (
        <group ref={flowMarkersRef}>
          {Array.from({ length: 9 }).map((_, i) => (
            <mesh key={`flow-marker-${i}`}>
              <sphereGeometry args={[((parameters.hoseDiameterMm / 1000) / 2) * 0.85, 8, 8]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#d97706"
                emissiveIntensity={0.65}
                roughness={0.3}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Heavy Anodized Aluminum / Brass Quick-Disconnect Camlock Couplings */}
      {couplingPositions.map((pos, idx) => (
        <mesh key={`hose-coupling-${idx}`} position={pos}>
          <cylinderGeometry
            args={[
              ((parameters.hoseDiameterMm / 1000) / 2) * 1.35,
              ((parameters.hoseDiameterMm / 1000) / 2) * 1.35,
              0.14,
              16
            ]}
          />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};
