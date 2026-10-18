import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useSimulationStore } from '../store/useSimulationStore';
import { CameraPreset } from '../types/digitalTwin';
import { MachineDigitalTwinScene } from './MachineDigitalTwinScene';

interface CameraTargetDef {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

const PRESET_CONFIGS: Record<CameraPreset, CameraTargetDef> = {
  reset: {
    position: new THREE.Vector3(6.5, 4.5, 5.5),
    target: new THREE.Vector3(0.8, 0.6, -0.6)
  },
  iso: {
    position: new THREE.Vector3(5.8, 3.8, 4.8),
    target: new THREE.Vector3(0.8, 0.6, -0.6)
  },
  top: {
    position: new THREE.Vector3(0.8, 8.8, -0.6),
    target: new THREE.Vector3(0.8, 0.2, -0.6)
  },
  side: {
    position: new THREE.Vector3(0.8, 1.5, 7.2),
    target: new THREE.Vector3(0.8, 0.8, 0)
  },
  boom: {
    position: new THREE.Vector3(2.2, 3.2, 1.2),
    target: new THREE.Vector3(1.2, 1.8, -0.8)
  },
  nozzle: {
    position: new THREE.Vector3(4.4, 0.8, -0.8),
    target: new THREE.Vector3(2.9, -0.8, -1.6)
  },
  cutaway: {
    position: new THREE.Vector3(2.9, -0.4, 3.2),
    target: new THREE.Vector3(2.9, -0.6, -1.6)
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
      minDistance={1.2}
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
    // Clamp delta to prevent simulation spiral of death during tab switch
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
      className={`relative w-full h-full min-h-[360px] bg-graphite-950 overflow-hidden ${className}`}
      onClick={() => setSelectedComponent(null)}
    >
      <Canvas
        shadows
        camera={{ position: [5.8, 3.8, 4.8], fov: 42, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedComponent(null);
          }
        }}
      >
        <color attach="background" args={['#0b0f17']} />
        <fog attach="fog" args={['#0b0f17', 16, 32]} />

        {/* Global Industrial Control-Room Lighting */}
        <ambientLight intensity={0.5} color="#94a3b8" />
        
        {/* Main Directional Daylight / Solar Fill */}
        <directionalLight
          position={[14, 18, 12]}
          intensity={1.35}
          color="#f8fafc"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={45}
          shadow-camera-left={-9}
          shadow-camera-right={9}
          shadow-camera-top={9}
          shadow-camera-bottom={-9}
        />

        {/* Secondary Warm Under-Chassis Fill Light */}
        <directionalLight position={[-10, 6, -8]} intensity={0.4} color="#fed7aa" />

        {/* Spotlight shining down the Septic Tank Access Chimney */}
        {godRays && (
          <spotLight
            position={[2.9, 4.5, -1.6]}
            target-position={[2.9, -1.5, -1.6]}
            angle={0.24}
            penumbra={0.5}
            intensity={4.5}
            color="#bae6fd"
            castShadow
          />
        )}

        {/* Subterranean Cyan Worklight for Septic Vault */}
        <pointLight position={[2.9, -0.6, -1.6]} intensity={1.5} distance={5} color="#06b6d4" />

        {/* Complete Plausible Mechanized Desludging Unit & Scene */}
        <MachineDigitalTwinScene />

        {/* Camera and Simulation Physics Driver */}
        <CameraPresetController />
        <SimulationLoopDriver />
      </Canvas>
    </div>
  );
};
