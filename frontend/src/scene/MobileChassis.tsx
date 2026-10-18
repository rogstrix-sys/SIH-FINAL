import React from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const MobileChassis: React.FC = () => {
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);
  const mobilityMode = useSimulationStore((s) => s.displayOptions.mobilityMode || 'wheels');
  const operatingState = useSimulationStore((s) => s.operatingState);

  const isSelected = selectedComponentId === 'chassis';
  const stabilizerExtension = useSimulationStore((s) => s.kinematics.stabilizerExtension);

  // Wheel positions: Front Axle at X = 1.05, Rear Axle at X = -1.05; Z = ±0.82
  const wheels = [
    { x: 1.05, z: 0.82 },
    { x: 1.05, z: -0.82 },
    { x: -1.05, z: 0.82 },
    { x: -1.05, z: -0.82 }
  ];

  // Continuous Crawler Track Left and Right Sides: Z = ±0.82
  const trackSides = [0.82, -0.82];
  const roadRollerX = [-0.68, -0.23, 0.23, 0.68];
  const carrierRollerX = [-0.35, 0.35];

  // Stabilizer leg positions at the 4 frame corners
  const stabilizers = [
    { x: 1.35, z: 0.75 },
    { x: 1.35, z: -0.75 },
    { x: -1.35, z: 0.75 },
    { x: -1.35, z: -0.75 }
  ];

  // Jack extension offset: 0.0 is fully retracted up by 0.18m, 1.0 is planted on ground
  const jackDrop = 0.18 * stabilizerExtension;
  const rodY = -0.22 - jackDrop * 0.5;
  const footY = -0.29 - jackDrop;

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('chassis');
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[3.15, 0.95, 1.95]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.7} transparent />
        </mesh>
      )}

      {/* Main Longitudinal I-Beam Rails (Twin Box Section Frame) */}
      {[-0.52, 0.52].map((railZ, i) => (
        <mesh key={`rail-${i}`} position={[0, 0.45, railZ]} castShadow receiveShadow>
          <boxGeometry args={[2.85, 0.18, 0.1]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.88}
            roughness={0.25}
            wireframe={wireframe}
          />
        </mesh>
      ))}

      {/* Cross-member Structural Bracing */}
      {[-1.15, -0.4, 0.4, 1.15].map((cx, i) => (
        <mesh key={`cross-${i}`} position={[cx, 0.45, 0]} castShadow>
          <boxGeometry args={[0.12, 0.16, 1.04]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.3} wireframe={wireframe} />
        </mesh>
      ))}

      {/* Steel Deck Skid Plating (Safety Diamond Texture Plate) */}
      <mesh position={[-0.2, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.04, 1.25]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.75}
          roughness={0.35}
          wireframe={wireframe}
        />
      </mesh>

      {/* Front and Rear Solid Steel Axle Tubes */}
      {[1.05, -1.05].map((axleX, i) => (
        <mesh key={`axle-${i}`} position={[axleX, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.64, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.18} />
        </mesh>
      ))}

      {/* ============================================================== */}
      {/* MOBILITY GEAR OPTION 1: 4 RUGGED WHEELS (When mode is 'wheels')*/}
      {/* ============================================================== */}
      {mobilityMode === 'wheels' &&
        wheels.map((w, i) => (
          <group key={`wheel-${i}`} position={[w.x, 0.35, w.z]}>
            {/* Heavy Vulcanized Rubber Tire with Directional Cleats */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.35, 0.35, 0.26, 24]} />
              <meshStandardMaterial color="#111827" roughness={0.94} metalness={0.06} wireframe={wireframe} />
            </mesh>

            {/* Steel Beadlock Rim */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.27, 20]} />
              <meshStandardMaterial color="#eab308" metalness={0.65} roughness={0.3} wireframe={wireframe} />
            </mesh>

            {/* Center Hub Grease Cap */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, w.z > 0 ? 0.14 : -0.14]}>
              <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.18} />
            </mesh>

            {/* 6 Chrome Lug Nuts on Rim */}
            {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map((ang, j) => (
              <mesh
                key={`lug-${j}`}
                position={[Math.cos(ang) * 0.14, Math.sin(ang) * 0.14, w.z > 0 ? 0.14 : -0.14]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.014, 0.014, 0.02, 6]} />
                <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.1} />
              </mesh>
            ))}

            {/* Molded Steel Wheel Fender Arch */}
            <mesh position={[0, 0.26, w.z > 0 ? -0.04 : 0.04]} castShadow>
              <boxGeometry args={[0.78, 0.04, 0.3]} />
              <meshStandardMaterial color="#ea580c" metalness={0.45} roughness={0.35} wireframe={wireframe} />
            </mesh>
          </group>
        ))}

      {/* ============================================================== */}
      {/* MOBILITY GEAR OPTION 2: DUAL RUBBER CONTINUOUS CRAWLER TRACKS  */}
      {/* ============================================================== */}
      {mobilityMode === 'tracks' &&
        trackSides.map((trackZ, sIdx) => {
          const isRight = trackZ > 0;
          return (
            <group key={`track-assembly-${sIdx}`} position={[0, 0, trackZ]}>
              {/* Heavy Longitudinal Bogie Side Frame */}
              <mesh position={[0, 0.24, 0]} castShadow>
                <boxGeometry args={[2.15, 0.14, 0.14]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} wireframe={wireframe} />
              </mesh>

              {/* Rear Toothed Drive Sprocket (with Hydraulic Travel Motor) */}
              <group position={[-1.02, 0.28, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.26, 0.26, 0.22, 20]} />
                  <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.28} />
                </mesh>
                {/* 10 Drive Sprocket Teeth */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((tIdx) => {
                  const tAngle = (tIdx * Math.PI * 2) / 10;
                  return (
                    <mesh
                      key={`sprocket-tooth-${tIdx}`}
                      position={[Math.cos(tAngle) * 0.26, Math.sin(tAngle) * 0.26, 0]}
                      rotation={[0, 0, tAngle]}
                    >
                      <boxGeometry args={[0.04, 0.06, 0.2]} />
                      <meshStandardMaterial color="#ca8a04" metalness={0.8} roughness={0.25} />
                    </mesh>
                  );
                })}
                {/* Travel Motor Planetary Hub Cover */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, isRight ? 0.12 : -0.12]}>
                  <cylinderGeometry args={[0.13, 0.13, 0.04, 16]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.15} />
                </mesh>
              </group>

              {/* Front Tensioner Idler Wheel (with Recoil Spring Buffer) */}
              <group position={[1.02, 0.28, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.26, 0.26, 0.22, 24]} />
                  <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} />
                </mesh>
                {/* Grease Tensioning Cylinder / Buffer Housing */}
                <mesh position={[-0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.28, 12]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>

              {/* 4 Dual Bottom Road Rollers */}
              {roadRollerX.map((rx, rIdx) => (
                <group key={`road-roller-${rIdx}`} position={[rx, 0.15, 0]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.12, 0.12, 0.24, 16]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
                  </mesh>
                  {/* Flange Edge Lips */}
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.135, 0.135, 0.04, 16]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
                  </mesh>
                </group>
              ))}

              {/* 2 Upper Carrier Return Rollers */}
              {carrierRollerX.map((cx, cIdx) => (
                <mesh key={`carrier-roller-${cIdx}`} position={[cx, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.07, 0.07, 0.22, 16]} />
                  <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
                </mesh>
              ))}

              {/* Heavy Reinforced Continuous Rubber Track Belt Profile */}
              {/* Top Belt Run */}
              <mesh position={[0, 0.52, 0]} castShadow>
                <boxGeometry args={[2.08, 0.04, 0.26]} />
                <meshStandardMaterial color="#111827" roughness={0.94} metalness={0.06} wireframe={wireframe} />
              </mesh>
              {/* Bottom Ground-Contact Belt Run */}
              <mesh position={[0, 0.035, 0]} receiveShadow>
                <boxGeometry args={[2.04, 0.05, 0.26]} />
                <meshStandardMaterial color="#0f172a" roughness={0.96} metalness={0.04} wireframe={wireframe} />
              </mesh>
              {/* Front Curved Belt Wrap */}
              <mesh position={[1.02, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.285, 0.285, 0.26, 20, 1, false, -Math.PI / 2, Math.PI]} />
                <meshStandardMaterial color="#111827" roughness={0.94} metalness={0.06} />
              </mesh>
              {/* Rear Curved Belt Wrap */}
              <mesh position={[-1.02, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.285, 0.285, 0.26, 20, 1, false, Math.PI / 2, Math.PI]} />
                <meshStandardMaterial color="#111827" roughness={0.94} metalness={0.06} />
              </mesh>

              {/* Chevron Traction Cleats on Ground Contact Run */}
              {[-0.8, -0.5, -0.2, 0.1, 0.4, 0.7].map((cleatX, k) => (
                <mesh key={`cleat-${k}`} position={[cleatX, 0.015, 0]}>
                  <boxGeometry args={[0.05, 0.02, 0.24]} />
                  <meshStandardMaterial color="#030712" roughness={0.98} />
                </mesh>
              ))}

              {/* Full-Length Heavy Steel Mud Shield / Rock Guard */}
              <mesh position={[0, 0.56, 0]} castShadow>
                <boxGeometry args={[2.22, 0.03, 0.3]} />
                <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.35} wireframe={wireframe} />
              </mesh>
            </group>
          );
        })}

      {/* ============================================================== */}
      {/* 4 HYDRAULIC OUTRIGGER STABILIZER LEGS & ARTICULATED DETAILS   */}
      {/* ============================================================== */}
      {stabilizers.map((s, i) => (
        <group key={`stab-${i}`} position={[s.x, 0.45, s.z]}>
          {/* Diagonal Outrigger Arm */}
          <mesh rotation={[0, s.z > 0 ? 0.3 : -0.3, 0]} castShadow>
            <boxGeometry args={[0.16, 0.14, 0.28]} />
            <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.3} wireframe={wireframe} />
          </mesh>

          {/* Heavy Steel Clevis Pivot Pin & Cotter Clips */}
          <mesh position={[0, 0.06, s.z > 0 ? 0.08 : -0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.14, 12]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.1} />
          </mesh>

          {/* Vertical Hydraulic Cylinder Jack Housing */}
          <mesh position={[0, -0.16, s.z > 0 ? 0.12 : -0.12]} castShadow>
            <cylinderGeometry args={[0.042, 0.042, 0.32, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.25} />
          </mesh>

          {/* Hydraulic Banjo Elbow Fitting (Brass) at cylinder port */}
          <mesh position={[0.03, -0.08, s.z > 0 ? 0.12 : -0.12]}>
            <boxGeometry args={[0.024, 0.024, 0.024]} />
            <meshStandardMaterial color="#d97706" metalness={0.88} roughness={0.2} />
          </mesh>
          {/* Flexible Black Hydraulic Hose line running back to chassis */}
          <mesh position={[0.06, -0.02, s.z > 0 ? 0.06 : -0.06]} rotation={[0.4, 0, -0.5]}>
            <cylinderGeometry args={[0.007, 0.007, 0.16, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.85} />
          </mesh>

          {/* Telescoping Chrome Jack Piston Rod (Animated) */}
          <mesh position={[0, rodY, s.z > 0 ? 0.12 : -0.12]}>
            <cylinderGeometry args={[0.026, 0.026, 0.24, 16]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.08} />
          </mesh>

          {/* Swivel Ground Footpad Resting Firmly on Terrain (Animated) */}
          <mesh position={[0, footY, s.z > 0 ? 0.12 : -0.12]} receiveShadow>
            <cylinderGeometry args={[0.11, 0.13, 0.03, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* ============================================================== */}
      {/* RIGID INTERCONNECTING SUCTION PIPE (Pump Intake to Tank Inlet) */}
      {/* ============================================================== */}
      <group position={[0.3, 1.05, 0]}>
        {/* Horizontal Vacuum Suction Pipe Run */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.065, 0.065, 0.35, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* 4-Bolt Pipe Flange at Tank Connection */}
        <mesh position={[-0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.11, 0.11, 0.025, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.18} />
        </mesh>
        {/* 4-Bolt Pipe Flange at Pump Connection */}
        <mesh position={[0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.11, 0.11, 0.025, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.18} />
        </mesh>
        {/* Isolation Ball Valve Body & Safety Yellow Handle */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.09, 0.09, 0.09]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.07, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.02, 0.08, 0.015]} />
          <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* STATIC EARTH BONDING GROUNDING REEL (Sewer Atmosphere Safety) */}
      {/* ============================================================== */}
      <group position={[-0.85, 0.48, 0.58]}>
        {/* Brass/Bronze Spring Drum */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Coiled Yellow/Green Grounding Cable */}
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
          <meshStandardMaterial color="#84cc16" roughness={0.5} />
        </mesh>
        {/* Heavy Bronze Earth Ground Clamp */}
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.03, 0.05, 0.02]} />
          <meshStandardMaterial color="#b45309" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Machine Side Control Panel Enclosure (NEMA 4X / IP66) */}
      <group position={[0.25, 0.68, 0.58]}>
        {/* Steel Cabinet Body */}
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.26, 0.1]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} wireframe={wireframe} />
        </mesh>
        {/* Door Bezel & Rubber Seal */}
        <mesh position={[0, 0, 0.052]}>
          <boxGeometry args={[0.32, 0.24, 0.01]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Emergency Stop Mushroom Button */}
        <group position={[-0.09, 0.04, 0.065]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.018, 12]} />
            <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.012, 16]} />
            <meshStandardMaterial color="#dc2626" metalness={0.5} roughness={0.2} />
          </mesh>
        </group>
        {/* Pilot Status LEDs */}
        <mesh position={[0.04, 0.05, 0.06]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial
            color={operatingState === 'EXTRACT' ? '#22c55e' : '#64748b'}
            emissive={operatingState === 'EXTRACT' ? '#22c55e' : '#000000'}
            emissiveIntensity={0.8}
          />
        </mesh>
        <mesh position={[0.08, 0.05, 0.06]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial
            color={operatingState === 'FAULT' ? '#ef4444' : '#64748b'}
            emissive={operatingState === 'FAULT' ? '#ef4444' : '#000000'}
            emissiveIntensity={0.8}
          />
        </mesh>

        {/* Flexible Liquidtight Conduit to Motor */}
        <mesh position={[0.14, -0.08, 0]} rotation={[0, 0, -0.6]}>
          <cylinderGeometry args={[0.012, 0.012, 0.2, 10]} />
          <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>

      {/* Chassis Specification & Hazard Decal Plate */}
      <mesh position={[-0.1, 0.45, 0.575]}>
        <boxGeometry args={[0.5, 0.1, 0.01]} />
        <meshStandardMaterial color="#0284c7" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Front Safety Hazard Striped Bumper & Tow Eyelet */}
      <group position={[1.44, 0.42, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.14, 1.6]} />
          <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.35} wireframe={wireframe} />
        </mesh>
        {/* Diagonal Warning Stripe Plate */}
        <mesh position={[0.042, 0, 0]}>
          <boxGeometry args={[0.005, 0.12, 1.5]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
        {/* Heavy Steel Tow Eyelet */}
        <mesh position={[0.08, -0.02, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.075, 0.022, 12, 24]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Rear Heavy Bumper Bar with Hazard Chevron Stripes */}
      <group position={[-1.44, 0.42, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.14, 1.6]} />
          <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.35} wireframe={wireframe} />
        </mesh>
        <mesh position={[-0.042, 0, 0]}>
          <boxGeometry args={[0.005, 0.12, 1.5]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};
