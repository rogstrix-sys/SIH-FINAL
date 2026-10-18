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

  const internalSludgeRef = useRef<THREE.Mesh>(null);
  const isSelected = selectedComponentId === 'tank';

  // Fill ratio of on-chassis collection vessel (0.0 to 1.0)
  const fillRatio = Math.min(1.0, Math.max(0.01, collectionVolumeL / Math.max(1, collectionCapacityL)));
  // Sight glass height: max 0.65m tube
  const sightFluidHeight = 0.65 * fillRatio;
  // Internal tank fluid height: max 0.76m
  const internalFluidHeight = Math.max(0.02, 0.76 * fillRatio);

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
      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[1.9, 1.4, 1.3]} />
          <meshBasicMaterial color="#f97316" wireframe opacity={0.7} transparent />
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
          {[-0.25, 0.25].map((bx, idx) => (
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

          {/* Internal Contained Sludge Fluid Volume (Rises with extracted volume) */}
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
      )}

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
      <group position={[0.2, 0.48, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.12, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.28} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.04, 24]} />
          <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.28} />
        </mesh>
        {/* Clamp Bolts around perimeter */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, idx) => (
          <mesh
            key={`bolt-${idx}`}
            position={[Math.cos(ang) * 0.24, 0.06, Math.sin(ang) * 0.24]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.08, 10]} />
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
          <cylinderGeometry args={[0.12, 0.12, 0.38, 20]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <coneGeometry args={[0.12, 0.08, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.18} />
        </mesh>
      </group>

      {/* Dual Safety Pressure / Vacuum Relief Vent Valve (PVRV) */}
      <group position={[0.45, 0.58, -0.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.22, 16]} />
          <meshStandardMaterial color="#dc2626" metalness={0.65} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
          <meshStandardMaterial color="#b91c1c" metalness={0.65} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};
