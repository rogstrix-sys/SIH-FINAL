import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const HoseMesh: React.FC = () => {
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);

  const isSelected = selectedComponentId === 'hose';

  // Generate 3D Catmull-Rom spline curve from crawler intake to surface vacuum pump
  const tubeGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.65, -2.5, 0.4),  // Crawler suction cowl
      new THREE.Vector3(0.55, -1.8, 0.35), // Rising through sludge
      new THREE.Vector3(0.6, -0.6, 0.38),  // Subsurface neck
      new THREE.Vector3(0.6, 0.45, 0.4),   // Passing through manhole rim
      new THREE.Vector3(1.1, 0.52, 0.65),  // Gentle ground bend
      new THREE.Vector3(1.7, 0.45, 0.95),  // Approaching pump skid
      new THREE.Vector3(2.25, 0.38, 1.2)   // Pump inlet flange
    ]);

    return new THREE.TubeGeometry(curve, 48, 0.065, 12, false);
  }, []);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('hose');
      }}
    >
      {isSelected && (
        <mesh geometry={tubeGeometry}>
          <meshBasicMaterial color="#f97316" wireframe opacity={0.6} transparent />
        </mesh>
      )}

      {/* Main Reinforced Suction Hose Tube */}
      <mesh geometry={tubeGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.7}
          metalness={0.2}
          wireframe={wireframe}
        />
      </mesh>

      {/* Camlock Coupling Collars */}
      {[
        [0.65, -2.5, 0.4],
        [0.6, 0.45, 0.4],
        [2.25, 0.38, 1.2]
      ].map((pos, idx) => (
        <mesh key={idx} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.085, 0.085, 0.08, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
};
