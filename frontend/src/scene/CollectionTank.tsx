import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';

export const CollectionTank: React.FC = () => {
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const collectionVolumeL = useSimulationStore((s) => s.materialBalance.collectionVolumeL);
  const collectionCapacityL = useSimulationStore((s) => s.engine.parameters.collectionTankCapacityL);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);
  const cutaway = useSimulationStore((s) => s.displayOptions.cutaway);
  const isMaterialFlowing = useSimulationStore((s) => s.kinematics.isMaterialFlowing);

  // Hydraulic Sludge-Compaction Piston & Dewatering Telemetry
  const compaction = useSimulationStore((s) => s.compactionTelemetry);
  const compactionParams = useSimulationStore((s) => s.compactionParams);

  const internalSludgeRef = useRef<THREE.Mesh>(null);
  const isTankSelected = selectedComponentId === 'tank';
  const isCompactorSelected = selectedComponentId === 'compactor';

  // Fill ratio of on-chassis collection vessel (0.0 to 1.0)
  const fillRatio = Math.min(1.0, Math.max(0.01, collectionVolumeL / Math.max(1, collectionCapacityL)));
  // Sight glass height: max 0.65m tube
  const sightFluidHeight = 0.65 * fillRatio;
  // Internal tank fluid height: max 0.76m
  const internalFluidHeight = Math.max(0.02, 0.76 * fillRatio);

  // Platen kinematics: strokeMm (0 to 600 mm) maps to vertical downward travel
  const pistonStrokeM = Math.min(compactionParams.strokeMaxMm / 1000, Math.max(0, compaction.strokeMm / 1000));
  // Platen Y in tank coordinate space: Top home = +0.38m; Max travel = -0.22m
  const platenY = 0.38 - pistonStrokeM;

  // Hydraulic Cylinder rod kinematics
  const cylinderBaseY = 0.54; // bottom flange of cylinder body
  const platenTopY = platenY + 0.025;
  const rodLength = Math.max(0.03, cylinderBaseY - platenTopY);
  const rodCenterY = cylinderBaseY - rodLength / 2;

  useFrame((state) => {
    if (internalSludgeRef.current && isMaterialFlowing) {
      const t = state.clock.getElapsedTime();
      // Churning surface undulation when slurry is actively entering the vessel
      internalSludgeRef.current.position.y =
        -0.38 + internalFluidHeight / 2 + Math.sin(t * 9.0) * 0.008;
    } else if (internalSludgeRef.current) {
      internalSludgeRef.current.position.y = -0.38 + internalFluidHeight / 2;
    }
  });

  return (
    <group
      position={[-0.45, 0.95, 0]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent('tank');
      }}
    >
      {/* Tank Selection outline */}
      {isTankSelected && (
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[1.9, 1.4, 1.3]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.7} transparent />
        </mesh>
      )}

      {/* Compactor Selection outline */}
      {isCompactorSelected && (
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[1.3, 0.95, 0.85]} />
          <meshBasicMaterial color="#38bdf8" wireframe opacity={0.8} transparent />
        </mesh>
      )}

      {/* Tank Saddle Mounting Brackets */}
      {[-0.6, 0.6].map((sx, i) => (
        <mesh key={`saddle-${i}`} position={[sx, -0.28, 0]} castShadow>
          <boxGeometry args={[0.16, 0.24, 1.04]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} wireframe={wireframe} />
        </mesh>
      ))}

      {/* Main Cylindrical Pressure/Vacuum Shell */}
      {!cutaway ? (
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.48, 0.48, 1.4, 32]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.75}
            roughness={0.28}
            wireframe={wireframe}
          />
        </mesh>
      ) : (
        /* CUTAWAY MODE: 240° cylindrical shell leaving 120° front/top view cutaway */
        <group>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry
              args={[0.48, 0.48, 1.4, 32, 1, false, Math.PI / 6, (4 * Math.PI) / 3]}
            />
            <meshStandardMaterial
              color="#334155"
              metalness={0.75}
              roughness={0.28}
              side={THREE.DoubleSide}
              wireframe={wireframe}
            />
          </mesh>

          {/* Safety Orange Rebar Cut Border Edges */}
          <mesh position={[0, 0.44, 0.24]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 1.42, 8]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0, -0.24, 0.44]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 1.42, 8]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.6} />
          </mesh>

          {/* Internal Anti-Slosh Transverse Baffle Plates */}
          {[-0.42, 0.42].map((bx, idx) => (
            <group key={`baffle-${idx}`} position={[bx, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.46, 0.46, 0.02, 24]} />
                <meshStandardMaterial
                  color="#475569"
                  metalness={0.8}
                  roughness={0.3}
                  wireframe={wireframe}
                />
              </mesh>
              {/* Central fluid flow passage hole in baffle */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.15, 0.15, 0.03, 16]} />
                <meshBasicMaterial color="#0f172a" />
              </mesh>
            </group>
          ))}

          {/* INTERNAL SLUDGE & DEWATERING VISUALIZATION */}
          {!compaction.platenContact ? (
            /* Uncompacted Sludge Fluid Volume (Rises with extracted volume) */
            <group>
              <mesh
                ref={internalSludgeRef}
                position={[0, -0.38 + internalFluidHeight / 2, 0]}
              >
                <boxGeometry args={[1.36, internalFluidHeight, 0.78]} />
                <meshStandardMaterial
                  color="#1a0f05"
                  roughness={0.3}
                  metalness={0.1}
                  wireframe={wireframe}
                />
              </mesh>
              {/* Top Sludge Surface Foam/Scum Layer inside Cutaway */}
              <mesh position={[0, -0.38 + internalFluidHeight, 0]}>
                <boxGeometry args={[1.35, 0.02, 0.76]} />
                <meshStandardMaterial
                  color="#2a1608"
                  roughness={0.7}
                  metalness={0.05}
                />
              </mesh>
            </group>
          ) : (
            /* ACTIVE COMPACTION PHASE: Distinct Cake Layer below Platen + Separated Filtrate above Platen */
            <group>
              {/* Dense Compacted Sludge Cake Layer underneath Platen */}
              {(() => {
                const cakeHeight = Math.max(0.02, (platenY - 0.025) - (-0.38));
                return (
                  <mesh position={[0, -0.38 + cakeHeight / 2, 0]}>
                    <boxGeometry args={[1.06, cakeHeight, 0.64]} />
                    <meshStandardMaterial
                      color="#0c0703"
                      roughness={0.9}
                      metalness={0.05}
                      wireframe={wireframe}
                    />
                  </mesh>
                );
              })()}

              {/* Separated Liquid Filtrate pooling on top of the Porous Sieve Platen */}
              {compaction.filtrateVolumeL > 0 && (() => {
                const maxFiltrateHeight = 0.14;
                const filtrateHeight = Math.min(
                  maxFiltrateHeight,
                  Math.max(0.015, (compaction.filtrateVolumeL / 800) * maxFiltrateHeight)
                );
                return (
                  <group position={[0, platenY + 0.025 + filtrateHeight / 2, 0]}>
                    <mesh>
                      <boxGeometry args={[1.02, filtrateHeight, 0.60]} />
                      <meshPhysicalMaterial
                        color="#38bdf8"
                        transparent
                        opacity={0.65}
                        roughness={0.1}
                        transmission={0.8}
                        ior={1.33}
                      />
                    </mesh>
                    {/* Filtrate surface meniscus sheen */}
                    <mesh position={[0, filtrateHeight / 2, 0]}>
                      <boxGeometry args={[1.01, 0.005, 0.59]} />
                      <meshStandardMaterial
                        color="#7dd3fc"
                        roughness={0.05}
                        metalness={0.2}
                        transparent
                        opacity={0.8}
                      />
                    </mesh>
                  </group>
                );
              })()}
            </group>
          )}

          {/* GUIDED COMPACTION PLATEN INSIDE TANK CUTAWAY */}
          <group position={[0, platenY, 0]}>
            {/* Rigid Reinforced Structural Platen Plate */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.08, 0.045, 0.66]} />
              <meshStandardMaterial
                color="#e2e8f0"
                metalness={0.85}
                roughness={0.2}
                wireframe={wireframe}
              />
            </mesh>

            {/* Sieve Drainage Screen Face (Bottom Perforated Surface) */}
            <mesh position={[0, -0.024, 0]}>
              <boxGeometry args={[1.06, 0.004, 0.64]} />
              <meshStandardMaterial
                color="#0284c7"
                metalness={0.9}
                roughness={0.3}
              />
            </mesh>

            {/* Perforated Filter Mesh Slots Indicator Bars */}
            {[-0.4, -0.2, 0.0, 0.2, 0.4].map((slotX, sIdx) => (
              <mesh key={`slot-${sIdx}`} position={[slotX, -0.026, 0]}>
                <boxGeometry args={[0.08, 0.003, 0.52]} />
                <meshBasicMaterial color="#0f172a" />
              </mesh>
            ))}

            {/* Perimeter Polyurethane / Nitrile Wiper Seal Lip */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.09, 0.02, 0.67]} />
              <meshStandardMaterial
                color="#ea580c"
                roughness={0.6}
                metalness={0.1}
                wireframe={wireframe}
              />
            </mesh>

            {/* Platen Stiffening Ribs & Central Clevis Boss */}
            <mesh position={[0, 0.035, 0]}>
              <boxGeometry args={[0.22, 0.03, 0.22]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
            </mesh>
            <mesh position={[-0.32, 0.03, 0]}>
              <boxGeometry args={[0.12, 0.025, 0.12]} />
              <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0.32, 0.03, 0]}>
              <boxGeometry args={[0.12, 0.025, 0.12]} />
              <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
            </mesh>

            {/* Platen Bronze Anti-Tilt Guide Bushings riding on guide columns */}
            {[-0.32, 0.32].map((gx, gIdx) => (
              <mesh key={`bushing-${gIdx}`} position={[gx, 0.035, 0]}>
                <cylinderGeometry args={[0.026, 0.026, 0.06, 16]} />
                <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.25} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* OVERHEAD STRUCTURAL GANTRY & COMPACTION HYDRAULIC CYLINDER ASSEMBLY */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent('compactor');
        }}
      >
        {/* Overhead Gantry Welded Box-Section Uprights Bolted to Tank Shell */}
        {[-0.22, 0.22].map((ux, uIdx) => (
          <group key={`gantry-upright-${uIdx}`} position={[ux, 0.65, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.07, 0.40, 0.10]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} wireframe={wireframe} />
            </mesh>
            {/* Mounting Gusset Brackets at Tank Base */}
            <mesh position={[0, -0.16, 0.06]}>
              <boxGeometry args={[0.06, 0.08, 0.04]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Overhead Transverse Bridge Cross-Beam */}
        <mesh position={[0, 0.84, 0]} castShadow>
          <boxGeometry args={[0.54, 0.08, 0.12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} wireframe={wireframe} />
        </mesh>

        {/* Heavy-Duty Cylinder Upper Trunnion Mount & Pin */}
        <mesh position={[0, 0.81, 0]}>
          <boxGeometry args={[0.16, 0.06, 0.16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.81, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.18, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* DUAL PARALLEL CHROME ANTI-TILT GUIDE COLUMNS */}
        {[-0.32, 0.32].map((gx, gIdx) => (
          <group key={`column-${gIdx}`} position={[gx, 0.35, 0]}>
            <mesh>
              <cylinderGeometry args={[0.018, 0.018, 0.95, 16]} />
              <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.12} />
            </mesh>
            {/* Top Anchor Socket on Bridge */}
            <mesh position={[0, 0.48, 0]}>
              <cylinderGeometry args={[0.026, 0.026, 0.04, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
            </mesh>
            {/* Bottom Flange Anchor on Tank Saddle */}
            <mesh position={[0, -0.48, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 0.04, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Magnetostrictive LVDT Piston Position Sensor Mounted on Right Guide Column */}
        <group position={[0.34, 0.45, 0.03]}>
          <mesh>
            <boxGeometry args={[0.015, 0.65, 0.015]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Signal Transmitter Head at Top */}
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.06, 14]} />
            <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>

        {/* VERTICAL HYDRAULIC COMPACTION CYLINDER BARREL */}
        <group position={[0, 0.67, 0]}>
          {/* Outer Cylinder Body */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.065, 0.065, 0.26, 24]} />
            <meshStandardMaterial
              color="#0284c7"
              metalness={0.8}
              roughness={0.25}
              wireframe={wireframe}
            />
          </mesh>

          {/* Structural Tie Rods (4x high-tensile steel tie bolts) */}
          {[
            [0.05, 0.05],
            [-0.05, 0.05],
            [0.05, -0.05],
            [-0.05, -0.05]
          ].map(([tx, tz], tIdx) => (
            <mesh key={`tie-${tIdx}`} position={[tx, 0, tz]}>
              <cylinderGeometry args={[0.007, 0.007, 0.28, 10]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
            </mesh>
          ))}

          {/* Top Cylinder Head Cap */}
          <mesh position={[0, 0.135, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.03, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
          </mesh>

          {/* Bottom Gland Cap */}
          <mesh position={[0, -0.135, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.03, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
          </mesh>

          {/* Integrated Hydraulic Pressure Transducer & 180 Bar Relief Valve Manifold Block */}
          <group position={[0.08, 0.02, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.06, 0.11, 0.06]} />
              <meshStandardMaterial color="#dc2626" metalness={0.75} roughness={0.3} />
            </mesh>
            {/* Stainless Digital Pressure Sensor Transmitter */}
            <mesh position={[0.035, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.016, 0.016, 0.04, 14]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
            </mesh>
            {/* Relief Valve Adjusting Knob / Spool */}
            <mesh position={[0, -0.065, 0]}>
              <cylinderGeometry args={[0.014, 0.014, 0.03, 14]} />
              <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>

          {/* Flexible High-Pressure Braided Hydraulic Lines (A-Port & B-Port) */}
          <mesh position={[-0.07, 0.06, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.009, 0.009, 0.12, 10]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
          <mesh position={[-0.07, -0.06, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.009, 0.009, 0.12, 10]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
        </group>

        {/* PRECISION HARD CHROME HYDRAULIC PISTON ROD */}
        <mesh position={[0, rodCenterY, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, rodLength, 20]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.98}
            roughness={0.06}
          />
        </mesh>

        {/* Tank Entry Stuffing Box Gland Seal with Polyurethane Wiper Ring */}
        <group position={[0, 0.48, 0]}>
          <mesh>
            <cylinderGeometry args={[0.048, 0.048, 0.045, 20]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.024, 0]}>
            <torusGeometry args={[0.032, 0.006, 8, 20]} />
            <meshStandardMaterial color="#ea580c" roughness={0.4} />
          </mesh>
        </group>

        {/* MECHANICAL TRANSPORT LOCK MECHANISM */}
        <group position={[0, 0.58, 0]}>
          {/* Lock Pin Guide Sleeve Bracket */}
          <mesh>
            <boxGeometry args={[0.16, 0.035, 0.04]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Dual Red Transport Lock Pins (Slide inward when locked, outward when armed) */}
          {[-1, 1].map((dir, pIdx) => {
            const isLocked = compaction.isTransportLocked;
            const pinOffset = isLocked ? dir * 0.045 : dir * 0.11;
            return (
              <group key={`pin-${pIdx}`} position={[pinOffset, 0, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.07, 14]} />
                  <meshStandardMaterial color="#dc2626" metalness={0.6} roughness={0.3} />
                </mesh>
                {/* Red T-Handle Pull Ring */}
                <mesh position={[dir * 0.035, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <torusGeometry args={[0.018, 0.004, 8, 16]} />
                  <meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.3} />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* Structural Circumferential Stiffener T-Rings */}
      {[-0.45, 0.0, 0.45].map((rx, idx) => (
        <mesh key={`ring-${idx}`} position={[rx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.485, 0.016, 8, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}

      {/* Front Torispherical Dished Head (Facing Motor/Pump at +X) */}
      <mesh position={[0.7, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <sphereGeometry args={[0.48, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.28} wireframe={wireframe} />
      </mesh>

      {/* Rear Hydraulic Full-Opening Cleanout Door (Facing -X) */}
      <group position={[-0.7, 0, 0]}>
        {/* Dished Door Shell */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <sphereGeometry args={[0.48, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} wireframe={wireframe} />
        </mesh>

        {/* Heavy Locking Ring Flange & Clamping Wedges */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.04, 0, 0]}>
          <torusGeometry args={[0.49, 0.035, 12, 32]} />
          <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Hazard Warning Chevron Stripe Decal Plate on Door */}
        <mesh position={[-0.22, 0.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[0.42, 0.16, 0.01]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>

        {/* Heavy Top Hinge Lug */}
        <mesh position={[0, 0.52, 0]} castShadow>
          <boxGeometry args={[0.12, 0.14, 0.18]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Bottom 4-Inch Discharge Gate Valve with Camlock Cap */}
        <group position={[-0.22, -0.32, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.22, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Manual Gate Valve Handwheel */}
          <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.09, 0.015, 12, 20]} />
            <meshStandardMaterial color="#dc2626" metalness={0.6} roughness={0.35} />
          </mesh>
        </group>
      </group>

      {/* Top Inspection Manhole Dome with Clamp Wing Bolts */}
      <group position={[0.48, 0.48, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.10, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.28} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.20, 0.20, 0.03, 24]} />
          <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.28} />
        </mesh>
        {/* Clamp Bolts around perimeter */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, idx) => (
          <mesh
            key={`bolt-${idx}`}
            position={[Math.cos(ang) * 0.18, 0.05, Math.sin(ang) * 0.18]}
          >
            <cylinderGeometry args={[0.015, 0.015, 0.06, 10]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* External Borosilicate Glass Sight Gauge Tube (Calibrated Optical Fill Level) */}
      <group position={[0, 0, 0.52]}>
        {/* Brass Upper & Lower Isolation Valves */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Clear Borosilicate Glass Sight Tube */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.7, 16]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            transmission={0.94}
            opacity={1.0}
            transparent
            roughness={0.04}
            ior={1.52}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>

        {/* Live Sludge Column Inside Sight Glass (Rises with extracted volume) */}
        <mesh position={[0, -0.35 + sightFluidHeight / 2, 0]}>
          <cylinderGeometry args={[0.022, 0.022, sightFluidHeight, 16]} />
          <meshStandardMaterial color="#1a0f05" roughness={0.2} metalness={0.1} />
        </mesh>

        {/* Calibrated Level Scale Ticks */}
        <mesh position={[0.04, 0, 0]}>
          <boxGeometry args={[0.015, 0.7, 0.02]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Etched level indicator tick bars */}
        {[-0.26, -0.13, 0.0, 0.13, 0.26].map((ty, i) => (
          <mesh key={`tick-${i}`} position={[0.035, ty, 0.012]}>
            <boxGeometry args={[0.018, 0.006, 0.005]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        ))}
      </group>

      {/* Top Cyclone Moisture / Sludge Trap Canister */}
      <group position={[-0.45, 0.65, 0.18]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.10, 0.10, 0.34, 20]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, 0.19, 0]}>
          <coneGeometry args={[0.10, 0.07, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.18} />
        </mesh>
      </group>

      {/* Dual Safety Pressure / Vacuum Relief Vent Valve (PVRV) */}
      <group position={[0.52, 0.58, -0.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.20, 16]} />
          <meshStandardMaterial color="#dc2626" metalness={0.65} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.035, 16]} />
          <meshStandardMaterial color="#b91c1c" metalness={0.65} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};
