import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Camera,
  Maximize2,
  Minimize2,
  Layers,
  Activity,
  AlertTriangle,
  Wind,
  Droplets,
  Zap,
  Gauge,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowDown,
  ArrowUp,
  Compass,
  Eye,
  RefreshCw,
  Mountain,
  Box
} from 'lucide-react';
import { SiteConditions, EquipmentRecommendation } from '../../types';
import { buildVaultEnvironment, VaultMeshes } from './vaultGeometry';
import { VaultParticleEngine } from './vaultParticles';
import { VaultAudioEngine } from './vaultAudio';
import {
  calculateSludgeRheology,
  calculateJetFluidization,
  calculateSuctionHydraulics,
  stepGasAtmosphere,
  OSHA_THRESHOLDS
} from './vaultPhysics';

interface SubsurfaceVaultSim3DProps {
  site: SiteConditions;
  setSite?: React.Dispatch<React.SetStateAction<SiteConditions>>;
  topChoice?: EquipmentRecommendation;
  onSwitchToMountainSim?: () => void;
  onSwitchToCanyonSim?: () => void;
}

export const SubsurfaceVaultSim3D: React.FC<SubsurfaceVaultSim3DProps> = ({
  site,
  setSite,
  topChoice,
  onSwitchToMountainSim
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulation execution state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [cutawayOpacity, setCutawayOpacity] = useState<number>(0.28);
  const [isXRayMode, setIsXRayMode] = useState<boolean>(false);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);

  // Camera presets
  type CameraPreset = 'isometric' | 'manhole_top' | 'cutaway_side' | 'robot_close' | 'gas_plume' | 'operator';
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');

  // Operation Stage State Machine
  type OperationStage = 'pre_entry_check' | 'winch_descent' | 'jet_fluidizing' | 'suction_extraction' | 'completed';
  const [opStage, setOpStage] = useState<OperationStage>('jet_fluidizing');

  // Live controllable parameters
  const [jetPressureBar, setJetPressureBar] = useState<number>(55); // 0 - 70 bar
  const [maceratorRpm, setMaceratorRpm] = useState<number>(1150); // 0 - 1450 rpm
  const [suctionFlowM3h, setSuctionFlowM3h] = useState<number>(24); // 0 - 40 m3/h
  const [ventilationCfm, setVentilationCfm] = useState<number>(1200); // 0 - 2000 cfm
  const [isJetActive, setIsJetActive] = useState<boolean>(true);
  const [isSuctionActive, setIsSuctionActive] = useState<boolean>(true);
  const [isVentActive, setIsVentActive] = useState<boolean>(true);
  const [isMaceratorActive, setIsMaceratorActive] = useState<boolean>(true);

  // Telemetry state
  const [robotDepthM, setRobotDepthM] = useState<number>(1.85); // depth below surface
  const [vaultLiquidVolL, setVaultLiquidVolL] = useState<number>(3200);
  const [pumpedSlurryVolL, setPumpedSlurryVolL] = useState<number>(680);
  const [crustLiquefiedPct, setCrustLiquefiedPct] = useState<number>(42);

  // 4-Gas telemetry
  const [gasData, setGasData] = useState<{
    h2s: number;
    ch4: number;
    co: number;
    o2: number;
    hazardLevel: 'SAFE' | 'CAUTION' | 'CRITICAL_ALARM';
    alarmMessage: string;
  }>({
    h2s: 14.5,
    ch4: 1.8,
    co: 18.0,
    o2: 19.8,
    hazardLevel: 'CAUTION',
    alarmMessage: 'WARNING: CONFINED SPACE VENTILATION MANDATED'
  });

  // Hydraulics telemetry
  const [hydraulics, setHydraulics] = useState({
    tdhM: 5.8,
    npshaM: 4.2,
    npshrM: 2.5,
    isCavitating: false,
    powerKw: 3.4,
    viscosityCp: 185
  });

  // Three.js instances & references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const meshesRef = useRef<VaultMeshes | null>(null);
  const particleEngineRef = useRef<VaultParticleEngine | null>(null);
  const audioEngineRef = useRef<VaultAudioEngine | null>(null);

  // Synchronized refs for render loop
  const isPlayingRef = useRef(isPlaying);
  const simSpeedRef = useRef(simSpeed);
  const isJetActiveRef = useRef(isJetActive);
  const isSuctionActiveRef = useRef(isSuctionActive);
  const isVentActiveRef = useRef(isVentActive);
  const isMaceratorActiveRef = useRef(isMaceratorActive);
  const jetPressureBarRef = useRef(jetPressureBar);
  const maceratorRpmRef = useRef(maceratorRpm);
  const suctionFlowM3hRef = useRef(suctionFlowM3h);
  const ventilationCfmRef = useRef(ventilationCfm);
  const robotDepthRef = useRef(robotDepthM);
  const vaultLiquidVolRef = useRef(vaultLiquidVolL);
  const pumpedSlurryVolRef = useRef(pumpedSlurryVolL);
  const crustLiquefiedPctRef = useRef(crustLiquefiedPct);
  const opStageRef = useRef(opStage);

  isPlayingRef.current = isPlaying;
  simSpeedRef.current = simSpeed;
  isJetActiveRef.current = isJetActive;
  isSuctionActiveRef.current = isSuctionActive;
  isVentActiveRef.current = isVentActive;
  isMaceratorActiveRef.current = isMaceratorActive;
  jetPressureBarRef.current = jetPressureBar;
  maceratorRpmRef.current = maceratorRpm;
  suctionFlowM3hRef.current = suctionFlowM3h;
  ventilationCfmRef.current = ventilationCfm;
  robotDepthRef.current = robotDepthM;
  vaultLiquidVolRef.current = vaultLiquidVolL;
  pumpedSlurryVolRef.current = pumpedSlurryVolL;
  crustLiquefiedPctRef.current = crustLiquefiedPct;
  opStageRef.current = opStage;

  // Initialize Audio Engine
  useEffect(() => {
    const audio = new VaultAudioEngine();
    audioEngineRef.current = audio;
    return () => {
      audio.dispose();
    };
  }, []);

  const toggleAudio = () => {
    if (!audioEngineRef.current) return;
    if (isAudioMuted) {
      audioEngineRef.current.init();
      audioEngineRef.current.setMute(false);
      setIsAudioMuted(false);
    } else {
      audioEngineRef.current.setMute(true);
      setIsAudioMuted(true);
    }
  };

  // Switch camera preset
  const setCameraView = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (!cameraRef.current || !controlsRef.current) return;

    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    switch (preset) {
      case 'isometric':
        cam.position.set(-3.4, 2.6, 4.2);
        ctrl.target.set(0.0, -1.2, 0);
        break;
      case 'manhole_top':
        cam.position.set(-0.8, 3.8, 0.05);
        ctrl.target.set(-0.8, -1.8, 0);
        break;
      case 'cutaway_side':
        cam.position.set(0.0, -1.2, 4.4);
        ctrl.target.set(0.0, -1.2, 0);
        break;
      case 'robot_close':
        cam.position.set(-0.35, -1.45, 1.4);
        ctrl.target.set(-0.6, -1.8, 0);
        break;
      case 'gas_plume':
        cam.position.set(1.8, 1.2, 3.5);
        ctrl.target.set(0.2, -0.6, 0);
        break;
      case 'operator':
        cam.position.set(-2.8, 1.4, 2.2);
        ctrl.target.set(-0.8, 0.4, 0);
        break;
    }
    ctrl.update();
  };

  // E-STOP / Reset
  const handleReset = () => {
    setRobotDepthM(1.85);
    setVaultLiquidVolL(3200);
    setPumpedSlurryVolL(0);
    setCrustLiquefiedPct(0);
    setOpStage('pre_entry_check');
    setIsPlaying(false);
    if (audioEngineRef.current) {
      audioEngineRef.current.stopGasAlarm();
    }
  };

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.04);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camera.position.set(-3.8, 3.2, 4.6);
    cameraRef.current = camera;

    // WebGL Renderer with Shadow Map
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 25;
    controls.minDistance = 0.8;
    controls.target.set(-0.4, -1.2, 0);
    controlsRef.current = controls;

    // Architectural Lighting Setup
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.75);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Warm Golden Sun angling down into the open manhole throat
    const sunLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    sunLight.position.set(-1.8, 14, 5.0);
    sunLight.target.position.set(-0.8, -1.8, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 28;
    sunLight.shadow.camera.left = -5;
    sunLight.shadow.camera.right = 5;
    sunLight.shadow.camera.top = 5;
    sunLight.shadow.camera.bottom = -5;
    scene.add(sunLight);
    scene.add(sunLight.target);

    // Subterranean Inspection Cyan Worklight inside Chamber 1
    const vaultWorkLight = new THREE.PointLight(0x38bdf8, 2.4, 7.5, 1.2);
    vaultWorkLight.position.set(-0.8, -0.6, 0.2);
    scene.add(vaultWorkLight);

    // Chamber 2 Warm Ambient Illumination
    const chamber2Light = new THREE.PointLight(0xf59e0b, 1.8, 6.0, 1.4);
    chamber2Light.position.set(1.5, -0.8, 0);
    scene.add(chamber2Light);

    // Volumetric Sunlight Shaft down through the Manhole
    const godRayGeo = new THREE.CylinderGeometry(0.38, 0.85, 2.2, 24, 1, true);
    const godRayMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const godRayMesh = new THREE.Mesh(godRayGeo, godRayMat);
    godRayMesh.position.set(-0.8, -1.0, 0);
    scene.add(godRayMesh);

    // Build Vault Environment & Meshes
    const vaultMeshes = buildVaultEnvironment();
    meshesRef.current = vaultMeshes;
    scene.add(vaultMeshes.rootGroup);

    // Build Particle Engine
    const particles = new VaultParticleEngine();
    particleEngineRef.current = particles;
    scene.add(particles.jetParticles);
    scene.add(particles.slurryParticles);
    scene.add(particles.gasParticles);
    scene.add(particles.ventParticles);
    scene.add(particles.sonarPulseMesh);

    // Resize Observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Render loop state
    const clock = new THREE.Clock();
    let gasUpdateAccumulator = 0;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = Math.min(0.1, clock.getDelta()) * simSpeedRef.current;
      controls.update();

      if (isPlayingRef.current) {
        // 1. Robot Kinematics & Descent
        const currentDepth = robotDepthRef.current;
        const robotGrp = vaultMeshes.robotGroup;
        const targetY = -currentDepth;
        robotGrp.position.y += (targetY - robotGrp.position.y) * 0.1;

        // Update Winch Cable line geometry
        const cableGeo = vaultMeshes.winchCableMesh.geometry as THREE.BufferGeometry;
        const cablePosAttr = cableGeo.attributes.position as THREE.BufferAttribute;
        cablePosAttr.setXYZ(1, 0, robotGrp.position.y, 0);
        cablePosAttr.needsUpdate = true;

        // 2. Macerator Drum Spin Animation
        if (isMaceratorActiveRef.current && maceratorRpmRef.current > 0) {
          const rotationSpeed = (maceratorRpmRef.current / 60) * Math.PI * 2 * delta;
          vaultMeshes.maceratorDrumMesh.rotation.z += rotationSpeed;
        }

        // 3. Robotic Arm Oscillating Sweep for Fluidization
        if (isJetActiveRef.current) {
          const time = clock.getElapsedTime() * 1.5;
          vaultMeshes.robotArmGroup.rotation.y = Math.sin(time) * 0.28;
          vaultMeshes.robotArmGroup.rotation.z = Math.sin(time * 0.7) * 0.08;
        }

        // 4. LiDAR Turret Continuous Spin & Guide Laser Pulse
        if (vaultMeshes.lidarTurretMesh) {
          vaultMeshes.lidarTurretMesh.rotation.y += delta * 6.0;
        }
        if (vaultMeshes.laserBeamMesh) {
          const pulse = 0.45 + Math.sin(clock.getElapsedTime() * 7.5) * 0.25;
          (vaultMeshes.laserBeamMesh.material as THREE.MeshBasicMaterial).opacity = pulse;
        }

        // 5. Sludge Level & Liquefaction Progression
        if (isSuctionActiveRef.current && vaultLiquidVolRef.current > 100) {
          // Flow: m^3/h to Liters/s
          const flowLps = (suctionFlowM3hRef.current * 1000) / 3600;
          const extractedDeltaL = flowLps * delta * 2.5;

          const newVaultVol = Math.max(80, vaultLiquidVolRef.current - extractedDeltaL);
          const newPumpedVol = pumpedSlurryVolRef.current + extractedDeltaL;
          vaultLiquidVolRef.current = newVaultVol;
          pumpedSlurryVolRef.current = newPumpedVol;

          // Animate liquid mesh descending
          const volFraction = newVaultVol / 3200;
          const liquidY = -2.4 + volFraction * 1.0;
          vaultMeshes.liquidSupernatantMesh.position.y = liquidY;
          vaultMeshes.liquidSupernatantMesh.scale.y = Math.max(0.05, volFraction);

          // Crust liquefaction progress
          if (isJetActiveRef.current && crustLiquefiedPctRef.current < 100) {
            const { liquefactionSpeedPctPerSec } = calculateJetFluidization(
              jetPressureBarRef.current,
              maceratorRpmRef.current,
              site.solids_concentration_pct,
              0.22
            );
            const newCrustPct = Math.min(100, crustLiquefiedPctRef.current + liquefactionSpeedPctPerSec * delta);
            crustLiquefiedPctRef.current = newCrustPct;

            // Fade out scum crust as it breaks down
            (vaultMeshes.sludgeCrustMesh.material as THREE.MeshStandardMaterial).opacity = Math.max(
              0.1,
              0.96 * (1 - newCrustPct / 100)
            );
          }

          // Periodic state sync to React HUD (every 200ms)
          gasUpdateAccumulator += delta;
          if (gasUpdateAccumulator >= 0.2) {
            setVaultLiquidVolL(Math.round(newVaultVol));
            setPumpedSlurryVolL(Math.round(newPumpedVol));
            setCrustLiquefiedPct(Math.round(crustLiquefiedPctRef.current));

            // Calculate Sludge Rheology & Hydraulics
            const rheology = calculateSludgeRheology(
              site.solids_concentration_pct * (1 - crustLiquefiedPctRef.current / 200),
              site.temperature_c
            );

            const suctionHyd = calculateSuctionHydraulics(
              currentDepth + 1.2,
              site.pumping_distance_m || 25,
              75, // 3-inch hose
              suctionFlowM3hRef.current,
              rheology.viscosityCp,
              site.elevation_m || 1500,
              site.temperature_c
            );

            setHydraulics({
              tdhM: suctionHyd.totalDynamicHeadM,
              npshaM: suctionHyd.npshaM,
              npshrM: suctionHyd.npshrM,
              isCavitating: suctionHyd.isCavitating,
              powerKw: suctionHyd.hydraulicPowerKw,
              viscosityCp: rheology.viscosityCp
            });

            // Step 4-Gas Differential Equation
            setGasData((prevGas) => {
              const updated = stepGasAtmosphere(
                prevGas,
                isVentActiveRef.current,
                ventilationCfmRef.current,
                gasUpdateAccumulator,
                isJetActiveRef.current
              );
              if (audioEngineRef.current) {
                audioEngineRef.current.triggerGasAlarm(updated.hazardLevel);
              }
              return updated;
            });

            gasUpdateAccumulator = 0;
          }
        }

        // 5. Update Web Audio Synthesizer
        if (audioEngineRef.current && !audioEngineRef.current.getMuted()) {
          audioEngineRef.current.setJet(isJetActiveRef.current ? jetPressureBarRef.current : 0);
          audioEngineRef.current.setPump(
            isSuctionActiveRef.current ? suctionFlowM3hRef.current : 0,
            hydraulics.isCavitating
          );
          audioEngineRef.current.setVentilation(isVentActiveRef.current, ventilationCfmRef.current);
        }

        // 6. Update Particle Systems
        const leftNozzleWorld = new THREE.Vector3();
        const rightNozzleWorld = new THREE.Vector3();
        const intakeWorld = new THREE.Vector3();
        const ventDuctMouthWorld = new THREE.Vector3();

        vaultMeshes.leftNozzleWorldMesh.getWorldPosition(leftNozzleWorld);
        vaultMeshes.rightNozzleWorldMesh.getWorldPosition(rightNozzleWorld);
        vaultMeshes.suctionIntakeWorldMesh.getWorldPosition(intakeWorld);
        vaultMeshes.ventDuctMouthMesh.getWorldPosition(ventDuctMouthWorld);

        particles.update(
          delta,
          robotGrp.position,
          leftNozzleWorld,
          rightNozzleWorld,
          intakeWorld,
          isJetActiveRef.current,
          jetPressureBarRef.current,
          isSuctionActiveRef.current,
          isVentActiveRef.current,
          ventDuctMouthWorld,
          gasData.hazardLevel,
          vaultMeshes.liquidSupernatantMesh.position.y + 0.1
        );
      }

      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      particles.dispose();
      vaultMeshes.materialsToDispose.forEach((m) => m.dispose());
      vaultMeshes.geometriesToDispose.forEach((g) => g.dispose());
    };
  }, []);

  // Toggle X-Ray Wireframe across concrete vault meshes
  useEffect(() => {
    if (!meshesRef.current) return;
    meshesRef.current.concreteVaultGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.wireframe = isXRayMode;
          mat.needsUpdate = true;
        }
      }
    });
  }, [isXRayMode]);

  return (
    <div className="relative w-full bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col font-sans select-none">
      {/* Top Header & Environment Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur z-20 gap-3">
        {/* Title & Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Subsurface Vault & Robotic Fluidization Sim
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/50 uppercase font-semibold">
                Environment 2 · Digital Twin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Confined Space 4-Gas Dynamics · Bingham Rheology · Jet Cutter · NPSHa Hydraulics
            </p>
          </div>
        </div>

        {/* Action Buttons: Environment Switcher + Audio + Presets + Run */}
        <div className="flex items-center space-x-2.5">
          {/* Switch to Mountain Simulation Environment Button */}
          {onSwitchToMountainSim && (
            <button
              onClick={onSwitchToMountainSim}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 text-xs font-medium transition shadow-sm"
              title="Switch to Mountain Slope & Traverse Simulation"
            >
              <Mountain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch to Mountain Sim</span>
            </button>
          )}

          {/* Audio Synthesizer Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-lg border text-xs transition flex items-center space-x-1.5 ${
              isAudioMuted
                ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                : 'bg-amber-600 text-white border-amber-500 shadow-md animate-pulse'
            }`}
            title={isAudioMuted ? 'Unmute Procedural Audio' : 'Mute Procedural Audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Resume'}</span>
          </button>

          {/* Speed Multiplier */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-[11px]">
            {[0.5, 1.0, 2.0, 5.0].map((s) => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-2 py-1 rounded font-mono ${
                  simSpeed === s ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area with Overlays */}
      <div ref={containerRef} className="relative w-full h-[620px] bg-slate-950 cursor-grab active:cursor-grabbing">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Camera Preset Toolbar (Top-Left Floating) */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5 bg-slate-900/85 p-1.5 rounded-xl border border-slate-700/60 backdrop-blur shadow-xl">
          {[
            { id: 'isometric', label: 'Overview', icon: Camera },
            { id: 'cutaway_side', label: 'Cutaway Side', icon: Layers },
            { id: 'manhole_top', label: 'Manhole Throat', icon: Eye },
            { id: 'robot_close', label: 'Robot Cutter', icon: Zap },
            { id: 'gas_plume', label: 'Gas Plume', icon: Wind },
            { id: 'operator', label: 'Operator Station', icon: Compass }
          ].map((preset) => {
            const IconComponent = preset.icon;
            return (
              <button
                key={preset.id}
                onClick={() => setCameraView(preset.id as CameraPreset)}
                className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  cameraPreset === preset.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* OSHA 4-Gas Confined Space Detector HUD (Top-Right Floating) */}
        <div className="absolute top-4 right-4 z-10 w-72 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Confined Space 4-Gas
              </span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                gasData.hazardLevel === 'SAFE'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                  : gasData.hazardLevel === 'CAUTION'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700/60 animate-pulse'
                  : 'bg-rose-950 text-rose-300 border border-rose-700/60 animate-bounce'
              }`}
            >
              {gasData.hazardLevel}
            </span>
          </div>

          {/* Gas Progress Bars */}
          <div className="space-y-2 text-xs">
            {/* H2S */}
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">H₂S (Hydrogen Sulfide)</span>
                <span className={gasData.h2s >= OSHA_THRESHOLDS.H2S.PEL_LIMIT ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                  {gasData.h2s} ppm <span className="text-[9px] text-slate-500">/ PEL 20</span>
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    gasData.h2s >= OSHA_THRESHOLDS.H2S.PEL_LIMIT ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (gasData.h2s / 50) * 100)}%` }}
                />
              </div>
            </div>

            {/* CH4 */}
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">CH₄ (Methane LEL)</span>
                <span className={gasData.ch4 >= OSHA_THRESHOLDS.CH4.WARNING_LEL ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                  {gasData.ch4}% vol <span className="text-[9px] text-slate-500">/ LEL 5%</span>
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    gasData.ch4 >= OSHA_THRESHOLDS.CH4.WARNING_LEL ? 'bg-rose-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.min(100, (gasData.ch4 / 5.0) * 100)}%` }}
                />
              </div>
            </div>

            {/* CO */}
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">CO (Carbon Monoxide)</span>
                <span className={gasData.co >= OSHA_THRESHOLDS.CO.PEL_LIMIT ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                  {gasData.co} ppm <span className="text-[9px] text-slate-500">/ PEL 50</span>
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (gasData.co / 100) * 100)}%` }}
                />
              </div>
            </div>

            {/* O2 */}
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">O₂ (Oxygen)</span>
                <span className={gasData.o2 < OSHA_THRESHOLDS.O2.MIN_BREATHABLE ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {gasData.o2}% <span className="text-[9px] text-slate-500">/ Min 19.5%</span>
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    gasData.o2 < OSHA_THRESHOLDS.O2.MIN_BREATHABLE ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (gasData.o2 / 21) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Forced Ventilation Blower Status */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
            <span className="text-slate-400 flex items-center space-x-1">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Forced Blower</span>
            </span>
            <button
              onClick={() => setIsVentActive(!isVentActive)}
              className={`px-2 py-0.5 rounded font-mono font-medium transition ${
                isVentActive
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isVentActive ? `${ventilationCfm} CFM ON` : 'OFF'}
            </button>
          </div>
        </div>

        {/* Live Subsurface Hydraulic & Sludge Telemetry (Bottom-Left Floating) */}
        <div className="absolute bottom-4 left-4 z-10 w-80 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Hydraulics & Rheology
              </span>
            </div>
            {hydraulics.isCavitating ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 font-bold animate-pulse">
                CAVITATION ALERT
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                NPSH SAFE
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/40">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Suction Lift</div>
              <div className="text-sm font-bold text-white font-mono">
                {(robotDepthM + 0.35).toFixed(2)} m
              </div>
            </div>

            <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/40">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Flow Rate</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {isSuctionActive ? `${suctionFlowM3h} m³/h` : '0.0 m³/h'}
              </div>
            </div>

            <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/40">
              <div className="text-[10px] text-slate-400 uppercase font-mono">NPSHa vs NPSHr</div>
              <div className={`text-sm font-bold font-mono ${hydraulics.isCavitating ? 'text-rose-400' : 'text-cyan-300'}`}>
                {hydraulics.npshaM}m <span className="text-[10px] text-slate-400">/ {hydraulics.npshrM}m</span>
              </div>
            </div>

            <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/40">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Apparent Viscosity</div>
              <div className="text-sm font-bold text-amber-300 font-mono">
                {hydraulics.viscosityCp} cP
              </div>
            </div>
          </div>

          {/* Volume Extraction Meter */}
          <div>
            <div className="flex justify-between font-mono text-[11px] mb-1">
              <span className="text-slate-400">Sludge Extracted</span>
              <span className="text-white font-bold">
                {pumpedSlurryVolL} L <span className="text-[10px] text-slate-500">/ 3200 L</span>
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (pumpedSlurryVolL / 3200) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Live Submersible Optical Inspection Camera Mini-PIP (Bottom-Right Floating) */}
        <div className="absolute bottom-4 right-4 z-10 w-64 bg-slate-900/95 border border-slate-700/70 rounded-xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800">
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider">
                ROV CAM 1 · IP68 HD
              </span>
            </div>
            <span className="text-[9px] font-mono text-cyan-400">LIVE FEED</span>
          </div>

          <div className="relative h-32 bg-slate-950 flex items-center justify-center overflow-hidden">
            {/* Camera Simulated Crosshairs & Scanlines */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:8px_8px] opacity-40 pointer-events-none" />
            <div className="absolute inset-0 border border-cyan-500/20 m-2 pointer-events-none" />

            {/* Target Reticle */}
            <div className="w-12 h-12 border border-cyan-400/40 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
            </div>

            {/* Live Data Stamp */}
            <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-300/80 space-y-0.5">
              <div>DEPTH: -{robotDepthM.toFixed(2)}m</div>
              <div>CUTTER: {isMaceratorActive ? `${maceratorRpm} RPM` : 'STANDBY'}</div>
              <div>JET: {isJetActive ? `${jetPressureBar} BAR` : 'OFF'}</div>
            </div>

            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-emerald-400/80">
              CRUST BREAKDOWN: {crustLiquefiedPct}%
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Engineering Control Deck */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-5 py-4 z-20 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Winch Cable Descent Control */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center space-x-1.5">
                <ArrowDown className="w-4 h-4 text-amber-400" />
                <span>Hoist Depth</span>
              </span>
              <span className="font-mono text-amber-400 font-bold">{robotDepthM.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.3"
              step="0.05"
              value={robotDepthM}
              onChange={(e) => setRobotDepthM(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.5m (Surface)</span>
              <span>2.3m (Sump Bed)</span>
            </div>
          </div>

          {/* High-Pressure Hydro-Jet Pressure Control */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>Hydro-Jet Pressure</span>
              </span>
              <button
                onClick={() => setIsJetActive(!isJetActive)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold transition ${
                  isJetActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isJetActive ? `${jetPressureBar} BAR` : 'MUTED'}
              </button>
            </div>
            <input
              type="range"
              min="10"
              max="70"
              step="5"
              disabled={!isJetActive}
              value={jetPressureBar}
              onChange={(e) => setJetPressureBar(parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>10 Bar (Dilution)</span>
              <span>70 Bar (Crust Shear)</span>
            </div>
          </div>

          {/* Macerator Cutter RPM */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Macerator Cutter</span>
              </span>
              <button
                onClick={() => setIsMaceratorActive(!isMaceratorActive)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold transition ${
                  isMaceratorActive ? 'bg-amber-950 text-amber-300 border border-amber-700/60' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isMaceratorActive ? `${maceratorRpm} RPM` : 'STOPPED'}
              </button>
            </div>
            <input
              type="range"
              min="300"
              max="1450"
              step="50"
              disabled={!isMaceratorActive}
              value={maceratorRpm}
              onChange={(e) => setMaceratorRpm(parseInt(e.target.value))}
              className="w-full accent-yellow-500 cursor-pointer disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>300 RPM (Low Shear)</span>
              <span>1450 RPM (De-ragging)</span>
            </div>
          </div>

          {/* Vacuum Suction Flow & Pump Control */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Vacuum Suction</span>
              </span>
              <button
                onClick={() => setIsSuctionActive(!isSuctionActive)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold transition ${
                  isSuctionActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isSuctionActive ? `${suctionFlowM3h} m³/h` : 'STOPPED'}
              </button>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="1"
              disabled={!isSuctionActive}
              value={suctionFlowM3h}
              onChange={(e) => setSuctionFlowM3h(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>5 m³/h</span>
              <span>40 m³/h</span>
            </div>
          </div>
        </div>

        {/* Bottom Utility Controls: Cutaway Opacity Slider & X-Ray Toggle */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-slate-400">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Cutaway Wall Transparency:</span>
              <input
                type="range"
                min="0.05"
                max="0.9"
                step="0.05"
                value={cutawayOpacity}
                onChange={(e) => setCutawayOpacity(parseFloat(e.target.value))}
                className="w-28 accent-amber-500 cursor-pointer"
              />
              <span className="font-mono text-slate-300">{(cutawayOpacity * 100).toFixed(0)}%</span>
            </div>

            <button
              onClick={() => setIsXRayMode(!isXRayMode)}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                isXRayMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {isXRayMode ? 'X-Ray Wireframe: ON' : 'X-Ray Wireframe: OFF'}
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Compliant with ISO 21876 · ISO 24521 · OSHA 1910.146 Confined Space Standard
          </div>
        </div>
      </div>
    </div>
  );
};
