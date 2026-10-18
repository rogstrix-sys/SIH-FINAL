import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useSimulationStore } from '../store/useSimulationStore';
import {
  Mountain,
  ShieldAlert,
  CheckCircle2,
  CloudRain,
  Snowflake,
  Compass,
  AlertTriangle,
  Waves
} from 'lucide-react';

export const TerrainEnvironment: React.FC = () => {
  const showGrid = useSimulationStore((s) => s.displayOptions.showGrid);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);
  const selectedScenario = useSimulationStore((s) => s.selectedScenario);
  const terrainParams = useSimulationStore((s) => s.terrainParams);
  const feasibility = useSimulationStore((s) => s.feasibility);

  const rainGroupRef = useRef<THREE.Group>(null);
  const slopeRad = (terrainParams.slopeDeg * Math.PI) / 180.0;
  const pathHalfWidth = Math.max(0.7, terrainParams.pathWidthM / 2.0);

  // Safety cone positions for level paved scenario
  const safetyCones = [
    { x: -1.8, z: 1.4 },
    { x: 1.8, z: 1.4 },
    { x: 4.2, z: -0.6 },
    { x: 4.2, z: -2.6 },
    { x: 1.8, z: -2.6 }
  ];

  // Natural rock boulders for hilly sloped & alpine terrain
  const boulders = [
    { pos: [-3.2, 0.25, 2.2], scale: [0.65, 0.45, 0.55], rot: [0.2, 0.5, 0.1] },
    { pos: [-2.1, 0.4, -2.4], scale: [0.85, 0.55, 0.75], rot: [0.3, 0.8, -0.2] },
    { pos: [1.2, 0.3, 2.8], scale: [0.7, 0.5, 0.6], rot: [-0.1, 0.3, 0.4] },
    { pos: [3.8, 0.35, 1.9], scale: [0.9, 0.6, 0.8], rot: [0.4, -0.5, 0.2] },
    { pos: [-4.5, 0.5, -1.2], scale: [1.1, 0.7, 0.9], rot: [0.1, 1.2, -0.3] }
  ];

  // Rain streaks for heavy_rain scenario
  const rainStreaks = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => ({
      x: (Math.sin(i * 99) * 7.5),
      z: (Math.cos(i * 37) * 5.5),
      speed: 8.0 + (i % 5) * 2.2,
      offset: (i * 0.23) % 4.0
    }));
  }, []);

  // Animate rain streaks falling vertically
  useFrame((state, delta) => {
    if (rainGroupRef.current && selectedScenario === 'heavy_rain') {
      const t = state.clock.getElapsedTime();
      rainGroupRef.current.children.forEach((streak, idx) => {
        const item = rainStreaks[idx];
        if (item) {
          const y = 5.0 - ((t * item.speed + item.offset) % 5.5);
          streak.position.set(item.x, y, item.z);
        }
      });
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ============================================================== */}
      {/* 1. LEVEL PAVED ACCESS SCENARIO                                */}
      {/* ============================================================== */}
      {selectedScenario === 'level_paved' && (
        <group>
          {/* Main Compact Earth / Gravel Staging Pad */}
          <mesh position={[0, -0.05, 0]} receiveShadow>
            <boxGeometry args={[12.0, 0.1, 9.0]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.92}
              metalness={0.08}
              wireframe={wireframe}
            />
          </mesh>

          {/* Concrete Access Roadway Approach */}
          <mesh position={[-1.2, -0.04, 0]} receiveShadow>
            <boxGeometry args={[4.6, 0.11, 2.6]} />
            <meshStandardMaterial
              color="#334155"
              roughness={0.85}
              metalness={0.12}
              wireframe={wireframe}
            />
          </mesh>

          {/* Pathway Perimeter Hazard Curb Line */}
          <mesh position={[-1.2, 0.02, 1.32]}>
            <boxGeometry args={[4.6, 0.04, 0.06]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
          <mesh position={[-1.2, 0.02, -1.32]}>
            <boxGeometry args={[4.6, 0.04, 0.06]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>

          {/* Safety Cones */}
          {safetyCones.map((cone, idx) => (
            <group key={`paved-cone-${idx}`} position={[cone.x, 0, cone.z]}>
              <mesh position={[0, 0.015, 0]} receiveShadow>
                <boxGeometry args={[0.24, 0.03, 0.24]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.26, 0]} castShadow>
                <coneGeometry args={[0.09, 0.5, 16]} />
                <meshStandardMaterial color="#f97316" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.28, 0]}>
                <cylinderGeometry args={[0.052, 0.068, 0.12, 16]} />
                <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* ============================================================== */}
      {/* 2. SLOPED & UNEVEN HILLY TERRAIN SCENARIO                     */}
      {/* ============================================================== */}
      {selectedScenario === 'hilly_sloped' && (
        <group>
          {/* Sloped Hillside Ground Plane */}
          <group rotation={[0, 0, slopeRad]}>
            <mesh position={[0, -0.15, 0]} receiveShadow>
              <boxGeometry args={[14.0, 0.3, 10.0]} />
              <meshStandardMaterial
                color="#283344"
                roughness={0.98}
                metalness={0.04}
                wireframe={wireframe}
              />
            </mesh>

            {/* Uneven Earth / Subsurface Rock Texture Layers */}
            <mesh position={[-1.5, -0.01, 0]} receiveShadow>
              <boxGeometry args={[6.5, 0.05, 5.0]} />
              <meshStandardMaterial
                color="#1b2432"
                roughness={1.0}
                wireframe={wireframe}
              />
            </mesh>

            {/* Hillside Elevation Contour Stripe Lines */}
            {[-3.0, -1.0, 1.0, 3.0, 5.0].map((cx, i) => (
              <mesh key={`contour-${i}`} position={[cx, 0.01, 0]}>
                <boxGeometry args={[0.05, 0.02, 9.6]} />
                <meshStandardMaterial color="#475569" roughness={0.8} opacity={0.6} transparent />
              </mesh>
            ))}

            {/* Natural Rock Boulders across Slope */}
            {boulders.map((b, idx) => (
              <mesh
                key={`boulder-${idx}`}
                position={b.pos as [number, number, number]}
                rotation={b.rot as [number, number, number]}
                scale={b.scale as [number, number, number]}
                castShadow
                receiveShadow
              >
                <dodecahedronGeometry args={[0.7, 1]} />
                <meshStandardMaterial color="#334155" roughness={0.95} metalness={0.1} />
              </mesh>
            ))}
          </group>

          {/* Hillside Gradient Slope Callout Pill in 3D */}
          <Html position={[-3.2, 1.8, 2.5]} center style={{ pointerEvents: 'none' }}>
            <div className="bg-graphite-950/90 border border-amber-500/80 rounded-lg px-2.5 py-1 text-[10px] font-mono text-amber-300 shadow-xl backdrop-blur flex items-center gap-1.5 whitespace-nowrap">
              <Mountain className="w-3.5 h-3.5 text-amber-400" />
              <span>GRADE: {terrainParams.slopeDeg.toFixed(1)}° | TILT: {feasibility.effectiveTiltDeg.toFixed(1)}°</span>
            </div>
          </Html>
        </group>
      )}

      {/* ============================================================== */}
      {/* 3. UNEVEN & MUDDY TERRAIN SCENARIO                            */}
      {/* ============================================================== */}
      {selectedScenario === 'uneven_muddy' && (
        <group>
          {/* Saturated Earth Mud Plane */}
          <mesh position={[0, -0.1, 0]} receiveShadow>
            <boxGeometry args={[13.0, 0.2, 9.5]} />
            <meshStandardMaterial
              color="#2a1810"
              roughness={0.92}
              metalness={0.08}
              wireframe={wireframe}
            />
          </mesh>

          {/* Wheel / Track Rut Channels (Depressions in soft mud) */}
          {[-0.82, 0.82].map((rz, i) => (
            <mesh key={`rut-${i}`} position={[-0.8, -0.015, rz]} receiveShadow>
              <boxGeometry args={[4.2, 0.03, 0.32]} />
              <meshStandardMaterial color="#1a0d08" roughness={0.98} />
            </mesh>
          ))}

          {/* Saturated Mud Mounds / Spoil Berms */}
          {[-2.2, -0.5, 1.4].map((mx, idx) => (
            <mesh key={`berm-${idx}`} position={[mx, 0.03, 1.6]} castShadow>
              <sphereGeometry args={[0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#382218" roughness={0.95} />
            </mesh>
          ))}

          {/* Reflective Surface Water Puddles */}
          {[
            { x: -0.4, z: 0, sx: 1.8, sz: 1.2 },
            { x: 1.6, z: -1.2, sx: 2.2, sz: 1.4 },
            { x: -2.4, z: -1.8, sx: 1.5, sz: 1.1 }
          ].map((pud, idx) => (
            <mesh key={`puddle-${idx}`} position={[pud.x, 0.005, pud.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[pud.sx * 0.45, 16]} />
              <meshStandardMaterial
                color="#172554"
                roughness={0.08}
                metalness={0.65}
                opacity={0.88}
                transparent
              />
            </mesh>
          ))}

          {/* Mud Sinkage & Ground Clearance Warning Tag in 3D */}
          <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="bg-graphite-950/90 border border-amber-500/80 rounded-lg px-2.5 py-1 text-[10px] font-mono text-amber-300 shadow-xl backdrop-blur flex items-center gap-1.5 whitespace-nowrap">
              <Waves className="w-3.5 h-3.5 text-amber-400" />
              <span>
                MUD SINKAGE: {(feasibility.mudSinkageM * 100).toFixed(1)}cm | EFF CLEARANCE: {feasibility.effectiveGroundClearanceM.toFixed(2)}m
              </span>
            </div>
          </Html>
        </group>
      )}

      {/* ============================================================== */}
      {/* 4. NARROW ACCESS SANITATION SITE                               */}
      {/* ============================================================== */}
      {selectedScenario === 'narrow_restricted' && (
        <group>
          {/* Narrow Alleyway Cobblestone Ground Strip */}
          <mesh position={[0, -0.05, 0]} receiveShadow>
            <boxGeometry args={[13.0, 0.1, terrainParams.pathWidthM]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.92}
              metalness={0.08}
              wireframe={wireframe}
            />
          </mesh>

          {/* Left Flanking Architectural Masonry Wall */}
          <group position={[0, 1.4, pathHalfWidth + 0.15]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[13.0, 3.0, 0.3]} />
              <meshStandardMaterial
                color="#334155"
                roughness={0.9}
                metalness={0.1}
                wireframe={wireframe}
              />
            </mesh>

            {/* High-Visibility Diagonal Hazard Clearance Stripes at base */}
            <mesh position={[0, -1.25, -0.155]}>
              <boxGeometry args={[12.8, 0.35, 0.02]} />
              <meshStandardMaterial color="#facc15" roughness={0.4} />
            </mesh>
          </group>

          {/* Right Flanking Architectural Masonry Wall */}
          <group position={[0, 1.4, -(pathHalfWidth + 0.15)]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[13.0, 3.0, 0.3]} />
              <meshStandardMaterial
                color="#334155"
                roughness={0.9}
                metalness={0.1}
                wireframe={wireframe}
              />
            </mesh>

            {/* High-Visibility Diagonal Hazard Clearance Stripes at base */}
            <mesh position={[0, -1.25, 0.155]}>
              <boxGeometry args={[12.8, 0.35, 0.02]} />
              <meshStandardMaterial color="#facc15" roughness={0.4} />
            </mesh>
          </group>

          {/* Overhead Clearance Utility Pipe spanning the narrow alleyway */}
          <mesh position={[-1.2, 2.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, terrainParams.pathWidthM + 0.6, 16]} />
            <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
          </mesh>

          {/* Pathway Clearance Tag in 3D */}
          <Html position={[0, 2.8, 0]} center style={{ pointerEvents: 'none' }}>
            <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono shadow-xl backdrop-blur flex items-center gap-1.5 whitespace-nowrap ${
              feasibility.clearanceConflictDetected
                ? 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse'
                : 'bg-graphite-950/90 text-slate-200 border-slate-700'
            }`}>
              {feasibility.clearanceConflictDetected ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>
                WIDTH: {terrainParams.pathWidthM.toFixed(2)}m | MARGIN: {feasibility.lateralClearanceMarginM.toFixed(2)}m/side
              </span>
            </div>
          </Html>
        </group>
      )}

      {/* ============================================================== */}
      {/* 5. HEAVY RAIN CONDITIONS SCENARIO                             */}
      {/* ============================================================== */}
      {selectedScenario === 'heavy_rain' && (
        <group>
          {/* Dark Glistening Wet Ground Pad */}
          <mesh position={[0, -0.05, 0]} receiveShadow>
            <boxGeometry args={[13.0, 0.1, 9.5]} />
            <meshStandardMaterial
              color="#0f172a"
              roughness={0.2}
              metalness={0.4}
              wireframe={wireframe}
            />
          </mesh>

          {/* Surface Water Sheen Layer with Water Puddles */}
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[12.6, 9.0]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.06}
              metalness={0.7}
              opacity={0.85}
              transparent
            />
          </mesh>

          {/* Animated Falling Rain Streaks (Visual Effect) */}
          <group ref={rainGroupRef}>
            {rainStreaks.map((s, idx) => (
              <mesh key={`rain-${idx}`} position={[s.x, 2.5, s.z]}>
                <cylinderGeometry args={[0.006, 0.006, 0.45, 4]} />
                <meshBasicMaterial color="#93c5fd" opacity={0.65} transparent />
              </mesh>
            ))}
          </group>

          {/* Heavy Rain Storm Callout Tag */}
          <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="bg-blue-950/90 border border-blue-500/80 rounded-lg px-2.5 py-1 text-[10px] font-mono text-blue-200 shadow-xl backdrop-blur flex items-center gap-1.5 whitespace-nowrap">
              <CloudRain className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
              <span>
                RAIN: {terrainParams.rainfallIntensityMmH} mm/h | SOIL TRACTION: {feasibility.soilTractionCoeff.toFixed(2)}
              </span>
            </div>
          </Html>
        </group>
      )}

      {/* ============================================================== */}
      {/* 6. COLD & HIGH-ALTITUDE CONDITIONS                            */}
      {/* ============================================================== */}
      {selectedScenario === 'cold_high_altitude' && (
        <group>
          {/* Snow / Frozen Scree Ground Layer */}
          <mesh position={[0, -0.08, 0]} receiveShadow>
            <boxGeometry args={[13.0, 0.16, 9.5]} />
            <meshStandardMaterial
              color="#cbd5e1"
              roughness={0.85}
              metalness={0.15}
              wireframe={wireframe}
            />
          </mesh>

          {/* Icy Frost Patches with Specular Gloss */}
          {[-1.8, 1.2, -0.2].map((ix, idx) => (
            <mesh key={`ice-${idx}`} position={[ix, 0.005, idx % 2 === 0 ? 0.8 : -0.8]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[1.2, 16]} />
              <meshStandardMaterial
                color="#e2e8f0"
                roughness={0.1}
                metalness={0.6}
                opacity={0.9}
                transparent
              />
            </mesh>
          ))}

          {/* Frost-Covered Boulders */}
          {boulders.slice(0, 4).map((b, idx) => (
            <group key={`cold-boulder-${idx}`} position={b.pos as [number, number, number]}>
              <mesh
                rotation={b.rot as [number, number, number]}
                scale={b.scale as [number, number, number]}
                castShadow
                receiveShadow
              >
                <dodecahedronGeometry args={[0.7, 1]} />
                <meshStandardMaterial color="#64748b" roughness={0.9} />
              </mesh>
              {/* White Snow Cap on Top of Boulder */}
              <mesh position={[0, 0.28, 0]} scale={[0.8, 0.25, 0.8]}>
                <sphereGeometry args={[0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.95} />
              </mesh>
            </group>
          ))}

          {/* Cold High Altitude Environmental Callout in 3D */}
          <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="bg-cyan-950/90 border border-cyan-400/80 rounded-lg px-2.5 py-1 text-[10px] font-mono text-cyan-200 shadow-xl backdrop-blur flex items-center gap-1.5 whitespace-nowrap">
              <Snowflake className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
              <span>
                ALT: {terrainParams.altitudeM}m (Patm {feasibility.atmosphericPressureKpa} kPa) | TEMP: {terrainParams.ambientTempC}°C (Viscosity {feasibility.effectiveSlurryViscosityCp.toFixed(0)} cP)
              </span>
            </div>
          </Html>
        </group>
      )}

      {/* Engineering Ground Grid (Toggleable via showGrid) */}
      {showGrid && (
        <gridHelper
          args={[16, 16, '#f97316', '#334155']}
          position={[0, 0.005, 0]}
        />
      )}
    </group>
  );
};
