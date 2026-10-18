import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const ArticulatedBoom: React.FC = () => {
  const turretRef = useRef<THREE.Group>(null);
  const mainBoomRef = useRef<THREE.Group>(null);
  const jibRef = useRef<THREE.Group>(null);
  const liftPistonRef = useRef<THREE.Mesh>(null);
  const jibPistonRef = useRef<THREE.Mesh>(null);

  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const kinematics = useSimulationStore((s) => s.kinematics);
  const operatingState = useSimulationStore((s) => s.operatingState);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);

  const isSelected = selectedComponentId === 'boom';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (turretRef.current && mainBoomRef.current && jibRef.current) {
      const isFlowing = kinematics.isMaterialFlowing;
      const breathe = isFlowing ? Math.sin(t * 1.5) * 0.02 : 0;

      // Base angles from kinematics with breathing during vacuum extraction
      const slew = kinematics.boomSlewAngleRad;
      const elevation = kinematics.boomElevationRad + breathe;
      const flex = kinematics.jibFlexAngleRad + breathe * 0.8;

      turretRef.current.rotation.y = slew;
      mainBoomRef.current.rotation.z = elevation;
      jibRef.current.rotation.z = flex;

      // Animate telescoping chrome cylinder rods proportionally
      if (liftPistonRef.current) {
        liftPistonRef.current.position.y = 0.20 + kinematics.deployProgress * 0.09 + breathe * 0.5;
      }
      if (jibPistonRef.current) {
        jibPistonRef.current.position.x = 0.16 + kinematics.deployProgress * 0.07 + breathe * 0.5;
      }
    }
  });

  return (
    <group
      position={[0.35, 0.95, -0.45]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('boom');
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <mesh position={[1.2, 1.2, 0]}>
          <boxGeometry args={[3.2, 2.6, 1.6]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.6} transparent />
        </mesh>
      )}

      {/* Heavy Base Slew Ring Bearing Pedestal (Welded to Chassis Frame) */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.18, 24]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <torusGeometry args={[0.22, 0.02, 12, 32]} />
        <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 1. TURRET SWIVEL BASE (Rotates around Y axis) */}
      <group ref={turretRef} position={[0, 0.12, 0]}>
        {/* Turret Swivel Body Frame */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.34, 0.22, 0.36]} />
          <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.35} wireframe={wireframe} />
        </mesh>

        {/* Upright Pivot Towers (Twin Heavy Steel Cheek Plates) */}
        {[-0.14, 0.14].map((tz, i) => (
          <mesh key={`tower-${i}`} position={[0, 0.38, tz]} castShadow>
            <boxGeometry args={[0.28, 0.35, 0.06]} />
            <meshStandardMaterial color="#c2410c" metalness={0.6} roughness={0.3} wireframe={wireframe} />
          </mesh>
        ))}

        {/* Lower Main Lift Hydraulic Cylinder Barrel */}
        <group position={[-0.15, 0.28, 0]}>
          <mesh rotation={[0, 0, -0.55]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.55, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* Chrome Telescoping Piston Rod */}
          <mesh ref={liftPistonRef} position={[0, 0.28, 0]} rotation={[0, 0, -0.55]}>
            <cylinderGeometry args={[0.028, 0.028, 0.38, 16]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>

        {/* 2. MAIN BOOM ARM HIERARCHY (Pivots around horizontal Z axis at [0, 0.52, 0]) */}
        <group ref={mainBoomRef} position={[0, 0.52, 0]}>
          {/* Main Boom Pivot Pin */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.42, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Main Tapered Box Beam (Extends ~1.75m along +X) */}
          <mesh position={[0.85, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.75, 0.16, 0.18]} />
            <meshStandardMaterial color="#f97316" metalness={0.5} roughness={0.35} wireframe={wireframe} />
          </mesh>

          {/* Hose Guide Troughs / Saddle Loops on Main Boom */}
          {[0.4, 0.9, 1.4].map((hx, idx) => (
            <mesh key={`saddle-main-${idx}`} position={[hx, 0.14, 0]}>
              <torusGeometry args={[0.1, 0.018, 10, 18, Math.PI]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}

          {/* Jib Articulation Hydraulic Cylinder on Main Boom Top */}
          <group position={[1.1, 0.16, 0]}>
            <mesh rotation={[0, 0, 0.15]} castShadow>
              <cylinderGeometry args={[0.038, 0.038, 0.45, 16]} />
              <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.25} />
            </mesh>
            <mesh ref={jibPistonRef} position={[0.22, 0, 0]} rotation={[0, 0, 0.15]}>
              <cylinderGeometry args={[0.024, 0.024, 0.3, 16]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
            </mesh>
          </group>

          {/* 3. JIB ARM KNUCKLE HIERARCHY (Pivots at main boom tip [1.75, 0, 0]) */}
          <group ref={jibRef} position={[1.75, 0, 0]}>
            {/* Knuckle Hinge Pin */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.32, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Jib Arm Box Beam (Extends ~1.45m along +X) */}
            <mesh position={[0.72, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.45, 0.12, 0.14]} />
              <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.35} wireframe={wireframe} />
            </mesh>

            {/* Jib Guide Saddles */}
            {[0.45, 0.95].map((jx, idx) => (
              <mesh key={`saddle-jib-${idx}`} position={[jx, 0.12, 0]}>
                <torusGeometry args={[0.09, 0.016, 10, 18, Math.PI]} />
                <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
              </mesh>
            ))}

            {/* Tip Fairlead Swivel Head at Boom Reach End [1.45, 0, 0] */}
            <group position={[1.45, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.16, 0.22, 0.22]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
              </mesh>
              {/* Downward Swivel Fairlead Roller for Vertical Drop into Septic Tank */}
              <mesh position={[0, -0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.04, 0.04, 0.18, 16]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
              </mesh>

              {/* High-Intensity LED Worklight illuminating tank access manhole */}
              <group position={[0.08, -0.05, 0.14]}>
                <mesh>
                  <boxGeometry args={[0.06, 0.06, 0.06]} />
                  <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={3.0}
                  />
                </mesh>
                <spotLight
                  position={[0, 0, 0]}
                  target-position={[0, -3.5, 0]}
                  angle={Math.PI / 5}
                  penumbra={0.4}
                  intensity={4.0}
                  color="#fffbeb"
                  distance={8}
                  castShadow
                />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
