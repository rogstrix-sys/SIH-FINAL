import React from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const MobileChassis: React.FC = () => {
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);
  const operatingState = useSimulationStore((s) => s.operatingState);
  const stabilizerExtension = useSimulationStore((s) => s.kinematics.stabilizerExtension);
  const mobility = useSimulationStore((s) => s.mobilityTelemetry);
  const mobilityParams = useSimulationStore((s) => s.mobilityParams);

  const isSelected = selectedComponentId === 'chassis';

  // Continuous Crawler Track Left (Z = +0.82) and Right (Z = -0.82) Sides
  const trackSides = [0.82, -0.82];
  // 5 Bottom road rollers per side on articulated bogie frame
  const roadRollerX = [-0.72, -0.36, 0.0, 0.36, 0.72];
  // 2 Upper carrier return rollers per side
  const carrierRollerX = [-0.4, 0.4];

  // 4 Outrigger stabilizer leg mounts at frame corners
  const stabilizers = [
    { x: 1.38, z: 0.75 },
    { x: 1.38, z: -0.75 },
    { x: -1.38, z: 0.75 },
    { x: -1.38, z: -0.75 }
  ];

  // Jack extension offset: 0.0 retracted (+0.18m clearance), 1.0 planted on ground
  const jackDrop = 0.18 * stabilizerExtension;
  const rodY = -0.22 - jackDrop * 0.5;
  const footY = -0.29 - jackDrop;

  // Track cleat spacing for ground contact animation (12 cleats per track run)
  const cleatCount = 12;
  const cleatSpan = 1.95; // Length of flat ground contact run
  const cleatSpacing = cleatSpan / cleatCount;

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
          <boxGeometry args={[3.25, 0.98, 2.05]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.7} transparent />
        </mesh>
      )}

      {/* ============================================================== */}
      {/* 1. MAIN LONGITUDINAL TWIN BOX-SECTION STEEL FRAME RAILS       */}
      {/* ============================================================== */}
      {[-0.52, 0.52].map((railZ, i) => (
        <mesh key={`frame-rail-${i}`} position={[0, 0.45, railZ]} castShadow receiveShadow>
          <boxGeometry args={[2.92, 0.18, 0.12]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.9}
            roughness={0.22}
            wireframe={wireframe}
          />
        </mesh>
      ))}

      {/* Heavy Tubular Torsion Cross-Members */}
      {[-1.25, -0.45, 0.45, 1.25].map((cx, i) => (
        <mesh key={`torsion-cross-${i}`} position={[cx, 0.45, 0]} castShadow>
          <boxGeometry args={[0.14, 0.16, 1.04]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.28} wireframe={wireframe} />
        </mesh>
      ))}

      {/* Heavy-Duty Underbody Belly Rock Skid Plate (Full Length) */}
      <mesh position={[0, 0.32, 0]} receiveShadow>
        <boxGeometry args={[2.7, 0.03, 1.08]} />
        <meshStandardMaterial color="#0b1120" metalness={0.92} roughness={0.35} />
      </mesh>

      {/* Low-Slung Equipment Cradle Deck (Diamond Plate) */}
      <mesh position={[-0.15, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.55, 0.04, 1.28]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.78}
          roughness={0.32}
          wireframe={wireframe}
        />
      </mesh>

      {/* Low-Center-of-Gravity Battery & Auxiliary Hydraulic Power Pack (Under Tank) */}
      <mesh position={[-0.2, 0.42, 0]} castShadow>
        <boxGeometry args={[1.4, 0.18, 0.92]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* ============================================================== */}
      {/* 2. FOUR HEAVY RIGGING CRANE LIFTING LUGS (SWL 2.5T Markings)   */}
      {/* ============================================================== */}
      {[
        { x: 1.35, z: 0.54 },
        { x: 1.35, z: -0.54 },
        { x: -1.35, z: 0.54 },
        { x: -1.35, z: -0.54 }
      ].map((lug, idx) => (
        <group key={`lift-lug-${idx}`} position={[lug.x, 0.56, lug.z]}>
          {/* Welded Gusset Plate */}
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.08, 0.12, 0.03]} />
            <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Forged Steel Eyelet Ring */}
          <mesh position={[0, 0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.04, 0.012, 12, 20]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.12} />
          </mesh>
        </group>
      ))}

      {/* ============================================================== */}
      {/* 3. DUAL CONTINUOUS RUBBER CRAWLER TRACK ASSEMBLIES            */}
      {/* ============================================================== */}
      {trackSides.map((trackZ, sIdx) => {
        const isLeft = trackZ > 0;
        const trackDistance = isLeft ? mobility.leftTrackDistanceM : mobility.rightTrackDistanceM;
        const sprocketAngle = isLeft ? mobility.leftSprocketAngleRad : mobility.rightSprocketAngleRad;

        return (
          <group key={`track-system-${sIdx}`} position={[0, 0, trackZ]}>
            {/* Rigid Track Longitudinal Box Beam (Track Frame) */}
            <mesh position={[0, 0.25, 0]} castShadow>
              <boxGeometry args={[2.22, 0.15, 0.14]} />
              <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.2} wireframe={wireframe} />
            </mesh>

            {/* Transverse Cross Axle Sockets to Chassis */}
            {[-0.65, 0.65].map((ax, aIdx) => (
              <mesh
                key={`transverse-mount-${aIdx}`}
                position={[ax, 0.25, isLeft ? -0.16 : 0.16]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.055, 0.055, 0.22, 16]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.25} />
              </mesh>
            ))}

            {/* -------------------------------------------------------- */}
            {/* REAR TOOTHED DRIVE SPROCKET + HYDRAULIC TRAVEL MOTOR     */}
            {/* -------------------------------------------------------- */}
            <group position={[-1.02, 0.28, 0]}>
              {/* Rotating Sprocket Drum */}
              <group rotation={[sprocketAngle, 0, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.26, 0.26, 0.22, 24]} />
                  <meshStandardMaterial color="#ca8a04" metalness={0.8} roughness={0.25} />
                </mesh>
                {/* 10 Precision Drive Sprocket Teeth */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((tIdx) => {
                  const tAngle = (tIdx * Math.PI * 2) / 10;
                  return (
                    <mesh
                      key={`sprocket-tooth-${tIdx}`}
                      position={[Math.cos(tAngle) * 0.26, Math.sin(tAngle) * 0.26, 0]}
                      rotation={[0, 0, tAngle]}
                    >
                      <boxGeometry args={[0.045, 0.065, 0.2]} />
                      <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.2} />
                    </mesh>
                  );
                })}
              </group>

              {/* Planetary Reduction Final Drive Hub */}
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, isLeft ? 0.125 : -0.125]}>
                <cylinderGeometry args={[0.14, 0.14, 0.05, 20]} />
                <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.15} />
              </mesh>

              {/* Hydraulic / Electric Drive Motor Casing (Inboard) */}
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, isLeft ? -0.13 : 0.13]}>
                <cylinderGeometry args={[0.12, 0.12, 0.12, 16]} />
                <meshStandardMaterial color="#0284c7" metalness={0.88} roughness={0.22} />
              </mesh>
              {/* Dual High-Pressure Hydraulic Supply/Return Hoses */}
              <mesh position={[0.08, 0.08, isLeft ? -0.14 : 0.14]} rotation={[0.4, 0, 0.8]}>
                <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
                <meshStandardMaterial color="#020617" roughness={0.8} />
              </mesh>
            </group>

            {/* -------------------------------------------------------- */}
            {/* FRONT TENSIONING IDLER WHEEL + RECOIL BUFFER SPRING     */}
            {/* -------------------------------------------------------- */}
            <group position={[1.02, 0.28, 0]}>
              {/* Rotating Idler Wheel Drum */}
              <group rotation={[sprocketAngle, 0, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.26, 0.26, 0.22, 24]} />
                  <meshStandardMaterial color="#475569" metalness={0.82} roughness={0.25} />
                </mesh>
                {/* Center Flange Guide Ring */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.285, 0.285, 0.035, 24]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>

              {/* Grease Tensioning Cylinder Body */}
              <mesh position={[-0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.055, 0.055, 0.28, 16]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Chrome Tensioner Piston Rod */}
              <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.032, 0.032, 0.12, 16]} />
                <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.08} />
              </mesh>
              {/* Heavy Coil Recoil Spring Representation */}
              <mesh position={[-0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.065, 0.065, 0.18, 12]} />
                <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} wireframe={true} />
              </mesh>
            </group>

            {/* -------------------------------------------------------- */}
            {/* 5 DUAL-FLANGED BOTTOM ROAD ROLLERS ON BOGIE FRAMES       */}
            {/* -------------------------------------------------------- */}
            {roadRollerX.map((rx, rIdx) => {
              // Road roller rotation speed: omega = v / r_roller (radius = 0.12m)
              const rollerAngle = (trackDistance / 0.12);
              return (
                <group key={`road-roller-${rIdx}`} position={[rx, 0.145, 0]}>
                  {/* Rotating Roller Wheel */}
                  <group rotation={[rollerAngle, 0, 0]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                      <cylinderGeometry args={[0.12, 0.12, 0.24, 16]} />
                      <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.25} />
                    </mesh>
                    {/* Dual Retention Guide Flanges (Keep track belt centered) */}
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.145, 0.145, 0.04, 16]} />
                      <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.15} />
                    </mesh>
                  </group>
                  {/* Roller Axle Pin & Grease Nipple */}
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.024, 0.024, 0.26, 10]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.18} />
                  </mesh>
                </group>
              );
            })}

            {/* -------------------------------------------------------- */}
            {/* 2 UPPER CARRIER RETURN ROLLERS                           */}
            {/* -------------------------------------------------------- */}
            {carrierRollerX.map((cx, cIdx) => (
              <mesh
                key={`carrier-roller-${cIdx}`}
                position={[cx, 0.44, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.075, 0.075, 0.22, 16]} />
                <meshStandardMaterial color="#334155" metalness={0.88} roughness={0.22} />
              </mesh>
            ))}

            {/* -------------------------------------------------------- */}
            {/* CONTINUOUS REINFORCED VULCANIZED RUBBER TRACK BELT       */}
            {/* -------------------------------------------------------- */}
            {/* Top Return Belt Run */}
            <mesh position={[0, 0.54, 0]} castShadow>
              <boxGeometry args={[2.08, 0.04, 0.28]} />
              <meshStandardMaterial color="#111827" roughness={0.92} metalness={0.08} wireframe={wireframe} />
            </mesh>
            {/* Bottom Ground Contact Belt Run */}
            <mesh position={[0, 0.028, 0]} receiveShadow>
              <boxGeometry args={[2.04, 0.045, 0.28]} />
              <meshStandardMaterial color="#030712" roughness={0.95} metalness={0.05} wireframe={wireframe} />
            </mesh>
            {/* Front Curved Belt Wrap Around Idler */}
            <mesh position={[1.02, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.285, 0.285, 0.28, 24, 1, false, -Math.PI / 2, Math.PI]} />
              <meshStandardMaterial color="#111827" roughness={0.92} metalness={0.08} />
            </mesh>
            {/* Rear Curved Belt Wrap Around Drive Sprocket */}
            <mesh position={[-1.02, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.285, 0.285, 0.28, 24, 1, false, Math.PI / 2, Math.PI]} />
              <meshStandardMaterial color="#111827" roughness={0.92} metalness={0.08} />
            </mesh>

            {/* -------------------------------------------------------- */}
            {/* ANIMATED GROUND TRACTION CHEVRON CLEATS (GROUSERS)       */}
            {/* -------------------------------------------------------- */}
            {Array.from({ length: cleatCount }).map((_, cIdx) => {
              // Wrap cleats continuously based on track linear distance
              const rawX = (cIdx * cleatSpacing - (trackDistance % cleatSpan));
              const normalizedX = ((rawX + cleatSpan * 1.5) % cleatSpan) - cleatSpan / 2;

              return (
                <group key={`cleat-group-${cIdx}`} position={[normalizedX, 0.012, 0]}>
                  {/* Left chevron angled bar */}
                  <mesh position={[0, 0, 0.065]} rotation={[0, 0.28, 0]}>
                    <boxGeometry args={[0.045, 0.022, 0.12]} />
                    <meshStandardMaterial color="#000000" roughness={0.98} />
                  </mesh>
                  {/* Right chevron angled bar */}
                  <mesh position={[0, 0, -0.065]} rotation={[0, -0.28, 0]}>
                    <boxGeometry args={[0.045, 0.022, 0.12]} />
                    <meshStandardMaterial color="#000000" roughness={0.98} />
                  </mesh>
                </group>
              );
            })}

            {/* Full-Length Heavy Steel Mud Shield / Rock Guard Fender */}
            <mesh position={[0, 0.58, 0]} castShadow>
              <boxGeometry args={[2.24, 0.03, 0.32]} />
              <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.32} wireframe={wireframe} />
            </mesh>
            {/* Fender Reinforcing Stiffeners */}
            {[-0.8, -0.2, 0.4, 0.9].map((fx, fIdx) => (
              <mesh key={`fender-rib-${fIdx}`} position={[fx, 0.605, 0]} castShadow>
                <boxGeometry args={[0.04, 0.02, 0.3]} />
                <meshStandardMaterial color="#ca8a04" metalness={0.6} roughness={0.3} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* ============================================================== */}
      {/* 4. FOUR HYDRAULIC OUTRIGGER STABILIZER LEGS                   */}
      {/* ============================================================== */}
      {stabilizers.map((s, i) => (
        <group key={`stab-${i}`} position={[s.x, 0.45, s.z]}>
          {/* Diagonal Outrigger Arm */}
          <mesh rotation={[0, s.z > 0 ? 0.32 : -0.32, 0]} castShadow>
            <boxGeometry args={[0.18, 0.15, 0.3]} />
            <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.3} wireframe={wireframe} />
          </mesh>

          {/* Heavy Steel Clevis Pivot Pin */}
          <mesh position={[0, 0.06, s.z > 0 ? 0.09 : -0.09]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.16, 12]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.1} />
          </mesh>

          {/* Vertical Hydraulic Cylinder Jack Housing */}
          <mesh position={[0, -0.16, s.z > 0 ? 0.13 : -0.13]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.34, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.82} roughness={0.24} />
          </mesh>

          {/* Banjo Elbow Fitting (Brass) */}
          <mesh position={[0.035, -0.08, s.z > 0 ? 0.13 : -0.13]}>
            <boxGeometry args={[0.026, 0.026, 0.026]} />
            <meshStandardMaterial color="#d97706" metalness={0.88} roughness={0.2} />
          </mesh>

          {/* Telescoping Chrome Jack Piston Rod (Animated) */}
          <mesh position={[0, rodY, s.z > 0 ? 0.13 : -0.13]}>
            <cylinderGeometry args={[0.028, 0.028, 0.26, 16]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.06} />
          </mesh>

          {/* Swivel Ground Footpad Resting on Terrain (Animated) */}
          <mesh position={[0, footY, s.z > 0 ? 0.13 : -0.13]} receiveShadow>
            <cylinderGeometry args={[0.12, 0.14, 0.035, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.88} roughness={0.32} />
          </mesh>
        </group>
      ))}

      {/* ============================================================== */}
      {/* 5. SERVICE ACCESS DOORS & MAINTENANCE PANELS                   */}
      {/* ============================================================== */}
      {/* Side Hydraulic Filter & Valve Manifold Inspection Hatch */}
      <group position={[-0.7, 0.56, 0.585]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.22, 0.02]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Dual Quarter-Turn Slam Latches */}
        {[-0.2, 0.2].map((lx, lIdx) => (
          <mesh key={`latch-${lIdx}`} position={[lx, 0, 0.012]}>
            <cylinderGeometry args={[0.014, 0.014, 0.01, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* ============================================================== */}
      {/* 6. OPERATOR CONTROL CONSOLE (IP66 NEMA 4X Sealed Enclosure)    */}
      {/* ============================================================== */}
      <group position={[0.25, 0.72, 0.585]}>
        {/* Enclosure Body */}
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.3, 0.12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.82} roughness={0.22} wireframe={wireframe} />
        </mesh>
        {/* Sealed Door Face */}
        <mesh position={[0, 0, 0.062]}>
          <boxGeometry args={[0.35, 0.27, 0.01]} />
          <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.28} />
        </mesh>

        {/* Emergency Stop Palm Mushroom Button */}
        <group position={[-0.11, 0.05, 0.075]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.02, 16]} />
            <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.014]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.014, 16]} />
            <meshStandardMaterial color="#dc2626" metalness={0.5} roughness={0.2} />
          </mesh>
        </group>

        {/* Twin Pilot Travel Joysticks (Left & Right Track Proportional Control) */}
        {[-0.03, 0.04].map((jx, jIdx) => (
          <group key={`joystick-${jIdx}`} position={[jx, -0.04, 0.072]}>
            <mesh rotation={[0.2, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.04, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0.024, -0.006]}>
              <sphereGeometry args={[0.012, 10, 10]} />
              <meshStandardMaterial color="#0f172a" roughness={0.6} />
            </mesh>
          </group>
        ))}

        {/* Diagnostic LCD Screen */}
        <mesh position={[0.06, 0.05, 0.068]}>
          <boxGeometry args={[0.11, 0.07, 0.005]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive={operatingState === 'FAULT' ? '#ef4444' : '#0284c7'}
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 7. RIGID SUCTION CROSSOVER MANIFOLD & BALL VALVE               */}
      {/* ============================================================== */}
      <group position={[0.3, 1.05, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.065, 0.065, 0.35, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.22} />
        </mesh>
        {/* Flanges */}
        {[-0.17, 0.17].map((fx, i) => (
          <mesh key={`flange-${i}`} position={[fx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.11, 0.11, 0.025, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
          </mesh>
        ))}
        {/* Isolation Ball Valve Body & Handle */}
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
      {/* 8. FRONT & REAR IMPACT BUMPERS & TOWING PINTLES                */}
      {/* ============================================================== */}
      {/* Front Bumper */}
      <group position={[1.48, 0.42, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.09, 0.16, 1.64]} />
          <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.32} wireframe={wireframe} />
        </mesh>
        {/* Hazard Caution Warning Stripe Inlay */}
        <mesh position={[0.047, 0, 0]}>
          <boxGeometry args={[0.005, 0.13, 1.54]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
        {/* Central Steel Recovery Pintle Tow Hook */}
        <mesh position={[0.09, -0.02, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.075, 0.022, 12, 24]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.12} />
        </mesh>
      </group>

      {/* Rear Bumper */}
      <group position={[-1.48, 0.42, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.09, 0.16, 1.64]} />
          <meshStandardMaterial color="#ea580c" metalness={0.5} roughness={0.32} wireframe={wireframe} />
        </mesh>
        <mesh position={[-0.047, 0, 0]}>
          <boxGeometry args={[0.005, 0.13, 1.54]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};
