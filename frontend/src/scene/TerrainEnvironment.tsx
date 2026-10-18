import React from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useSimulationStore } from '../store/useSimulationStore';
import { AlertTriangle, Mountain, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const TerrainEnvironment: React.FC = () => {
  const showGrid = useSimulationStore((s) => s.displayOptions.showGrid);
  const wireframe = useSimulationStore((s) => s.displayOptions.wireframe);
  const selectedScenario = useSimulationStore((s) => s.selectedScenario);
  const terrainParams = useSimulationStore((s) => s.terrainParams);
  const feasibility = useSimulationStore((s) => s.feasibility);

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

  // Natural rock boulders for hilly sloped terrain
  const boulders = [
    { pos: [-3.2, 0.25, 2.2], scale: [0.65, 0.45, 0.55], rot: [0.2, 0.5, 0.1] },
    { pos: [-2.1, 0.4, -2.4], scale: [0.85, 0.55, 0.75], rot: [0.3, 0.8, -0.2] },
    { pos: [1.2, 0.3, 2.8], scale: [0.7, 0.5, 0.6], rot: [-0.1, 0.3, 0.4] },
    { pos: [3.8, 0.35, 1.9], scale: [0.9, 0.6, 0.8], rot: [0.4, -0.5, 0.2] },
    { pos: [-4.5, 0.5, -1.2], scale: [1.1, 0.7, 0.9], rot: [0.1, 1.2, -0.3] }
  ];

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
      {/* 3. NARROW ACCESS PATH WITH RESTRICTED MACHINE CLEARANCE        */}
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
              <meshStandardMaterial
                color="#facc15"
                roughness={0.4}
              />
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
              <meshStandardMaterial
                color="#facc15"
                roughness={0.4}
              />
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
