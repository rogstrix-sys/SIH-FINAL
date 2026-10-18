import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const MotorPumpAssembly: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const fanRef = useRef<THREE.Mesh>(null);
  const vacuumNeedleRef = useRef<THREE.Mesh>(null);
  const pressureNeedleRef = useRef<THREE.Mesh>(null);

  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const shaftRpm = useSimulationStore((s) => s.kinematics.pumpShaftRpm);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);
  const telemetry = useSimulationStore((s) => s.telemetry);

  const isSelected = selectedComponentId === 'pump';

  useFrame((state, delta) => {
    // Spin cooling fan at exact pump shaft RPM
    if (fanRef.current && shaftRpm > 0) {
      fanRef.current.rotation.x += (shaftRpm / 60) * Math.PI * 2 * delta;
    }

    // Micro-vibration jitter proportional to load and RPM
    if (groupRef.current && shaftRpm > 0) {
      const vib = (shaftRpm / 3000) * 0.002;
      groupRef.current.position.y = 0.58 + Math.sin(state.clock.elapsedTime * 48) * vib;
    }

    // Dynamic rotation of analog gauge needle pointers
    if (vacuumNeedleRef.current) {
      // Suction vacuum ranges from 0 to -90 kPa -> angle sweeps from -Math.PI*0.75 to +Math.PI*0.75
      const vacRatio = Math.min(1.0, Math.max(0.0, Math.abs(telemetry.suctionPressureKpa) / 90.0));
      vacuumNeedleRef.current.rotation.z = -Math.PI * 0.75 + vacRatio * (Math.PI * 1.5);
    }
    if (pressureNeedleRef.current) {
      const pRatio = Math.min(1.0, Math.max(0.0, telemetry.dischargePressureBar / 6.0));
      pressureNeedleRef.current.rotation.z = -Math.PI * 0.75 + pRatio * (Math.PI * 1.5);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0.7, 0.58, 0]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('pump');
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[1.3, 0.95, 0.95]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.7} transparent />
        </mesh>
      )}

      {/* Sub-Base Equipment Skid Plate */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.06, 0.85]} />
        <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Vibration Damping Neoprene Mounts */}
      {[-0.45, 0.45].map((bx, i) =>
        [-0.32, 0.32].map((bz, j) => (
          <mesh key={`mount-${i}-${j}`} position={[bx, 0.04, bz]}>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
            <meshStandardMaterial color="#111827" roughness={0.92} />
          </mesh>
        ))
      )}

      {/* TEFC Heavy Industrial Electric Drive Motor */}
      <group position={[0.26, 0.32, 0]}>
        {/* Motor Stator Body with Longitudinal Cooling Fins */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.48, 20]} />
          <meshStandardMaterial color="#0284c7" metalness={0.5} roughness={0.3} wireframe={wireframe} />
        </mesh>

        {/* 6 Longitudinal Cooling Rib Fins */}
        {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map((ang, i) => (
          <mesh
            key={`fin-${i}`}
            position={[0, Math.cos(ang) * 0.19, Math.sin(ang) * 0.19]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <boxGeometry args={[0.02, 0.46, 0.015]} />
            <meshStandardMaterial color="#0369a1" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}

        {/* Fan Shroud Cowl at Drive Motor Rear */}
        <mesh position={[0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.19, 0.19, 0.08, 20]} />
          <meshStandardMaterial color="#0369a1" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Spinning Internal Fan Impeller */}
        <mesh ref={fanRef} position={[0.26, 0, 0]}>
          <boxGeometry args={[0.02, 0.28, 0.28]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* IP66 Cast Terminal Box on Top with Conduit Gland */}
        <mesh position={[0.05, 0.19, 0]} castShadow>
          <boxGeometry args={[0.14, 0.1, 0.12]} />
          <meshStandardMaterial color="#0c4a6e" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Electrical Conduit Pipe */}
        <mesh position={[0.05, 0.26, 0.04]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.08, 10]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Cast Bell Housing Intermediate Shaft Coupler */}
      <mesh position={[-0.08, 0.32, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.16, 0.17, 0.18, 20]} />
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Rotary Lobe Vacuum Pump Housing */}
      <group position={[-0.35, 0.34, 0]}>
        {/* Cast Steel Tri-Lobe Pump Casing */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.38, 0.42, 0.36]} />
          <meshStandardMaterial color="#334155" metalness={0.88} roughness={0.22} wireframe={wireframe} />
        </mesh>

        {/* Side Bearing End Cover Flanges with Hex Fasteners */}
        <mesh position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.2} />
        </mesh>

        {/* Gear Case Oil Level Sight Glass */}
        <mesh position={[-0.205, -0.06, 0.08]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.01, 12]} />
          <meshStandardMaterial color="#eab308" metalness={0.4} roughness={0.1} />
        </mesh>

        {/* 4-Inch Vacuum Suction Flange (Runs towards collection tank) */}
        <mesh position={[0, 0.23, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.12, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.29, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.03, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
        </mesh>

        {/* Silenced Exhaust Discharge Chimney */}
        <mesh position={[-0.1, 0.42, -0.1]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.32, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* Hydraulic Power Unit (HPU) Valve Manifold Block */}
      <group position={[0.15, 0.18, -0.32]}>
        <mesh castShadow>
          <boxGeometry args={[0.32, 0.2, 0.14]} />
          <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.28} wireframe={wireframe} />
        </mesh>
        {/* Solenoid Coils with Status LEDs */}
        {[-0.08, 0.08].map((sx, i) => (
          <mesh key={`sol-${i}`} position={[sx, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.08, 12]} />
            <meshStandardMaterial
              color="#0f172a"
              emissive={shaftRpm > 0 ? '#22c55e' : '#64748b'}
              emissiveIntensity={shaftRpm > 0 ? 1.2 : 0.1}
            />
          </mesh>
        ))}
      </group>

      {/* Oil Cooler Radiator & Protective Grill */}
      <group position={[0.15, 0.22, 0.32]}>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.28, 0.08]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[0.32, 0.24]} />
          <meshStandardMaterial color="#64748b" wireframe />
        </mesh>
      </group>

      {/* Dual Precision Analog Dial Gauges on Machine Manifold */}
      <group position={[-0.32, 0.58, 0.14]}>
        {/* Vacuum Compound Gauge (0 to -100 kPa) */}
        <group position={[0, 0, 0]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.048, 0.048, 0.024, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0.013, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.042, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Animated Red Vacuum Needle */}
          <group position={[0.015, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh ref={vacuumNeedleRef} position={[0, 0.014, 0]}>
              <boxGeometry args={[0.003, 0.032, 0.002]} />
              <meshBasicMaterial color="#dc2626" />
            </mesh>
          </group>
        </group>

        {/* Discharge Pressure Gauge (0 to 10 bar) */}
        <group position={[0, 0, -0.12]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.044, 0.044, 0.024, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0.013, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.038, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Animated Pressure Needle */}
          <group position={[0.015, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh ref={pressureNeedleRef} position={[0, 0.012, 0]}>
              <boxGeometry args={[0.003, 0.028, 0.002]} />
              <meshBasicMaterial color="#0284c7" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
