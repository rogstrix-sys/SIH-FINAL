import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useSimulationStore } from '../store/useSimulationStore';
import { CameraPreset } from '../types/digitalTwin';
import { VaultChamberMesh } from './VaultChamberMesh';
import { CrawlerRovMesh } from './CrawlerRovMesh';
import { SludgeFluidMesh } from './SludgeFluidMesh';
import { SurfacePumpUnitMesh } from './SurfacePumpUnitMesh';
import { HoseMesh } from './HoseMesh';
import { AnnotationOverlays } from './AnnotationOverlays';

interface CameraTargetDef {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

const PRESET_CONFIGS: Record<CameraPreset, CameraTargetDef> = {
  iso: {
    position: new THREE.Vector3(6.5, 4.2, 6.5),
    target: new THREE.Vector3(0.5, -1.2, 0)
  },
  cutaway: {
    position: new THREE.Vector3(0.2, -0.9, 7.5),
    target: new THREE.Vector3(0.2, -1.4, 0)
  },
  crawler: {
    position: new THREE.Vector3(2.6, -1.2, 2.8),
    target: new THREE.Vector3(0.6, -2.4, 0.4)
  },
  pump: {
    position: new THREE.Vector3(4.5, 2.2, 3.2),
    target: new THREE.Vector3(2.4, 0.5, 1.2)
  },
  top: {
    position: new THREE.Vector3(0.5, 9.5, 0.5),
    target: new THREE.Vector3(0.5, 0, 0)
  }
};

/**
 * Smoothly interpolates camera and orbit control target towards active preset on change,
 * then yields complete control to user OrbitControls.
 */
const CameraPresetController: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const preset = useSimulationStore((s) => s.cameraPreset);
  const targetConfig = PRESET_CONFIGS[preset] || PRESET_CONFIGS.iso;
  const isTransitioningRef = useRef(true);

  useEffect(() => {
    isTransitioningRef.current = true;
  }, [preset]);

  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    const handleStart = () => {
      isTransitioningRef.current = false;
    };
    ctrl.addEventListener('start', handleStart);
    return () => {
      ctrl.removeEventListener('start', handleStart);
    };
  }, []);

  useFrame((_, delta) => {
    if (!isTransitioningRef.current) return;

    const lerpFactor = Math.min(1.0, delta * 4.5);
    camera.position.lerp(targetConfig.position, lerpFactor);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetConfig.target, lerpFactor);
      controlsRef.current.update();

      const distCam = camera.position.distanceTo(targetConfig.position);
      const distTarget = controlsRef.current.target.distanceTo(targetConfig.target);
      if (distCam < 0.04 && distTarget < 0.04) {
        isTransitioningRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={1.5}
      maxDistance={25.0}
      maxPolarAngle={Math.PI / 2 + 0.15}
    />
  );
};

/**
 * Runs physics engine tick inside the requestAnimationFrame loop
 */
const SimulationLoopDriver: React.FC = () => {
  const tickSimulation = useSimulationStore((s) => s.tickSimulation);

  useFrame((_, delta) => {
    // Clamp delta to prevent spiral of death during tab switch
    const clampedDelta = Math.min(0.08, delta);
    tickSimulation(clampedDelta);
  });

  return null;
};

export interface DigitalTwinCanvasProps {
  className?: string;
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({ className = '' }) => {
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);
  const godRays = useSimulationStore((s) => s.displayOptions.godRays);

  return (
    <div
      className={`relative w-full h-full bg-graphite-950 overflow-hidden ${className}`}
      onClick={() => setSelectedComponent(null)}
    >
      <Canvas
        shadows
        camera={{ position: [6.5, 4.2, 6.5], fov: 42, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onPointerDown={(e) => {
          // Deselect on ground click
          if (e.target === e.currentTarget) {
            setSelectedComponent(null);
          }
        }}
      >
        <color attach="background" args={['#0b0f17']} />
        <fog attach="fog" args={['#0b0f17', 14, 30]} />

        {/* Global Industrial Control-Room Lighting */}
        <ambientLight intensity={0.45} color="#94a3b8" />
        
        {/* Directional Daylight / Solar Fill */}
        <directionalLight
          position={[12, 16, 10]}
          intensity={1.2}
          color="#f8fafc"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={40}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />

        {/* Secondary Warm Fill Light */}
        <directionalLight position={[-8, 6, -6]} intensity={0.35} color="#fed7aa" />

        {/* Manhole Shaft God-Ray Spotlight */}
        {godRays && (
          <spotLight
            position={[0.6, 5.0, 0.4]}
            target-position={[0.6, -2.8, 0.4]}
            angle={0.28}
            penumbra={0.6}
            intensity={4.5}
            color="#bae6fd"
            castShadow
          />
        )}

        {/* Subterranean Cyan Worklight */}
        <pointLight position={[0.2, -1.2, 0]} intensity={1.8} distance={8} color="#06b6d4" />

        {/* 3D Simulation Elements */}
        <VaultChamberMesh />
        <CrawlerRovMesh />
        <SludgeFluidMesh />
        <SurfacePumpUnitMesh />
        <HoseMesh />
        <AnnotationOverlays />

        {/* Camera and Animation Controllers */}
        <CameraPresetController />
        <SimulationLoopDriver />
      </Canvas>
    </div>
  );
};
