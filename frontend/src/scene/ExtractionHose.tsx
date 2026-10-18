import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const ExtractionHose: React.FC = () => {
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const parameters = useSimulationStore((s) => s.parameters);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);

  const isSelected = selectedComponentId === 'hose';

  // 3D Spline route connecting Hose Reel -> Boom Fairleads -> Septic Tank Manhole -> Submerged Nozzle
  const { tubeGeometry, couplingPositions, curve } = useMemo(() => {
    const hoseRadius = (parameters.hoseDiameterMm / 1000.0) / 2.0;

    const splineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.05, 2.1, 0.0),    // Exiting Hose Reel Drum
      new THREE.Vector3(0.25, 1.7, -0.25),   // Approaching Turret Base
      new THREE.Vector3(0.65, 1.85, -0.55),  // Entering Main Boom Guide Saddle
      new THREE.Vector3(1.35, 2.32, -0.92),  // Mid-span on Main Boom
      new THREE.Vector3(2.05, 2.65, -1.25),  // Articulated Knuckle Elbow Joint
      new THREE.Vector3(2.55, 2.25, -1.48),  // Mid-span on Jib Arm
      new THREE.Vector3(2.9, 1.7, -1.6),     // Jib Tip Fairlead Roller
      new THREE.Vector3(2.9, 0.95, -1.6),    // Vertical Drop through air
      new THREE.Vector3(2.9, 0.25, -1.6),    // Entering Manhole Chimney
      new THREE.Vector3(2.9, -0.5, -1.6),    // Submerged in Supernatant Liquid
      new THREE.Vector3(2.9, -1.15, -1.6)    // Bottom Sludge Layer at Nozzle Flange
    ]);

    const geo = new THREE.TubeGeometry(splineCurve, 64, hoseRadius, 16, false);

    const couplings = [
      new THREE.Vector3(-0.05, 2.1, 0.0),
      new THREE.Vector3(2.9, 1.7, -1.6),
      new THREE.Vector3(2.9, -1.15, -1.6)
    ];

    return { tubeGeometry: geo, couplingPositions: couplings, curve: splineCurve };
  }, [parameters.hoseDiameterMm]);

  const isMaterialFlowing = useSimulationStore((s) => s.kinematics.isMaterialFlowing);
  const flowVelocity = useSimulationStore((s) => s.kinematics.materialFlowVelocityMs);
  const flowMarkersRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (flowMarkersRef.current && isMaterialFlowing) {
      const tSec = state.clock.getElapsedTime();
      const speed = Math.max(0.3, flowVelocity * 0.2);
      flowMarkersRef.current.children.forEach((child, i) => {
        // Material moves from nozzle (t=1.0) up to reel/tank (t=0.0)
        const phase = (1.0 - ((tSec * speed + i * 0.12) % 1.0));
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
          <meshBasicMaterial color="#f97316" wireframe opacity={0.6} transparent />
        </mesh>
      )}

      {/* Main Spiral Reinforced Rubber / Composite Vacuum Hose */}
      <mesh geometry={tubeGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={isMaterialFlowing ? '#1e293b' : '#0f172a'}
          roughness={0.75}
          metalness={0.2}
          wireframe={wireframe}
        />
      </mesh>

      {/* Visible Moving Slurry Material Flow Markers (When active) */}
      {isMaterialFlowing && (
        <group ref={flowMarkersRef}>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={`flow-marker-${i}`}>
              <sphereGeometry args={[((parameters.hoseDiameterMm / 1000) / 2) * 0.75, 8, 8]} />
              <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.6} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}

      {/* Heavy Anodized Aluminum / Brass Camlock Couplings */}
      {couplingPositions.map((pos, idx) => (
        <mesh key={`hose-coupling-${idx}`} position={pos}>
          <cylinderGeometry
            args={[
              (parameters.hoseDiameterMm / 1000) / 2 + 0.02,
              (parameters.hoseDiameterMm / 1000) / 2 + 0.02,
              0.08,
              16
            ]}
          />
          <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
};
