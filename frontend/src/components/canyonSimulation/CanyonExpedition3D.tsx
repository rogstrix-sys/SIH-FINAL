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
  Zap,
  Gauge,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  Mountain,
  Eye,
  Flag,
  Navigation,
  Crosshair,
  Radio,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { SiteConditions, EquipmentRecommendation } from '../../types';
import { buildCanyonLandscape, CanyonLandscapeMeshes } from './canyonLandscape';
import { buildCanyonVehicle, CanyonVehicleMeshes } from './canyonVehicle';
import { CanyonParticleEngine } from './canyonParticles';
import { CanyonAudioEngine } from './canyonAudio';

interface CanyonExpedition3DProps {
  site: SiteConditions;
  setSite?: React.Dispatch<React.SetStateAction<SiteConditions>>;
  topChoice?: EquipmentRecommendation;
  onSwitchToMountainSim?: () => void;
}

export const CanyonExpedition3D: React.FC<CanyonExpedition3DProps> = ({
  site,
  setSite,
  topChoice,
  onSwitchToMountainSim
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drive Mode & Execution
  const [driveMode, setDriveMode] = useState<'auto_tour' | 'manual'>('auto_tour');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [activeWeather, setActiveWeather] = useState<'clear' | 'snow' | 'rain'>('clear');
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [isTurboActive, setIsTurboActive] = useState<boolean>(false);

  // Camera Presets
  type CamView = 'chase' | 'cockpit' | 'bridge_fixed' | 'waterfall_gorge' | 'wheel_cam' | 'free';
  const [cameraView, setCameraView] = useState<CamView>('chase');

  // Live Telemetry
  const [speedKmh, setSpeedKmh] = useState<number>(24);
  const [rpm, setRpm] = useState<number>(1450);
  const [gear, setGear] = useState<string>('3');
  const [inclinePitchDeg, setInclinePitchDeg] = useState<number>(18.5);
  const [lateralRollDeg, setLateralRollDeg] = useState<number>(2.4);
  const [elevationM, setElevationM] = useState<number>(1950);
  const [currentZoneName, setCurrentZoneName] = useState<string>('Suspension Bridge Approach');

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const landscapeRef = useRef<CanyonLandscapeMeshes | null>(null);
  const vehicleRef = useRef<CanyonVehicleMeshes | null>(null);
  const particlesRef = useRef<CanyonParticleEngine | null>(null);
  const audioRef = useRef<CanyonAudioEngine | null>(null);

  // Keyboard driving inputs
  const keysRef = useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turbo: boolean;
    brake: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    turbo: false,
    brake: false
  });

  // Vehicle kinematic physical simulation refs
  const vehiclePosRef = useRef<THREE.Vector3>(new THREE.Vector3(-15, 12.0, -18));
  const vehicleHeadingRef = useRef<number>(0);
  const vehicleSpeedRef = useRef<number>(22); // km/h
  const steerAngleRef = useRef<number>(0); // radians
  const pathProgressRef = useRef<number>(0.38); // 0 to 1 along roadCurve
  const chassisPitchRef = useRef<number>(0);
  const chassisRollRef = useRef<number>(0);

  // Synchronized state refs for requestAnimationFrame loop
  const driveModeRef = useRef(driveMode);
  const isPlayingRef = useRef(isPlaying);
  const simSpeedRef = useRef(simSpeed);
  const cameraViewRef = useRef(cameraView);
  const activeWeatherRef = useRef(activeWeather);

  driveModeRef.current = driveMode;
  isPlayingRef.current = isPlaying;
  simSpeedRef.current = simSpeed;
  cameraViewRef.current = cameraView;
  activeWeatherRef.current = activeWeather;

  // Initialize Web Audio
  useEffect(() => {
    const audio = new CanyonAudioEngine();
    audioRef.current = audio;
    return () => {
      audio.dispose();
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isAudioMuted) {
      audioRef.current.init();
      audioRef.current.setMute(false);
      setIsAudioMuted(false);
    } else {
      audioRef.current.setMute(true);
      setIsAudioMuted(true);
    }
  };

  // Keyboard event listeners for manual driving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.forward = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.backward = true;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = true;
      if (['ShiftLeft', 'ShiftRight'].includes(e.code)) {
        keysRef.current.turbo = true;
        setIsTurboActive(true);
      }
      if (['Space'].includes(e.code)) keysRef.current.brake = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.forward = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.backward = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
      if (['ShiftLeft', 'ShiftRight'].includes(e.code)) {
        keysRef.current.turbo = false;
        setIsTurboActive(false);
      }
      if (['Space'].includes(e.code)) keysRef.current.brake = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Set camera view preset
  const selectCameraView = (view: CamView) => {
    setCameraView(view);
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (view === 'bridge_fixed') {
      cam.position.set(-18, 17.5, -12);
      ctrl.target.set(0, 12.0, -18);
    } else if (view === 'waterfall_gorge') {
      cam.position.set(-22, 1.5, -4);
      ctrl.target.set(-32, 12, -12);
    } else if (view === 'free') {
      cam.position.set(-25, 24, 25);
      ctrl.target.set(0, 8, 0);
    }
    ctrl.update();
  };

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0c1322); // alpine dusk/day transition
    scene.fog = new THREE.FogExp2(0x0c1322, 0.015);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(48, aspect, 0.2, 350);
    camera.position.set(-28, 22, -8);
    cameraRef.current = camera;

    // Renderer
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
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 120;
    controls.minDistance = 2.0;
    controls.target.set(0, 10, -18);
    controlsRef.current = controls;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.75);
    hemiLight.position.set(0, 60, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    sunLight.position.set(45, 65, 35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 180;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.add(sunLight);

    // Build Landscape & Bridge
    const landscape = buildCanyonLandscape();
    landscapeRef.current = landscape;
    scene.add(landscape.rootGroup);

    // Build 6x6 Heavy Expedition Vehicle
    const vehicle = buildCanyonVehicle();
    vehicleRef.current = vehicle;
    scene.add(vehicle.rootGroup);

    // Build Particle Systems
    const particles = new CanyonParticleEngine();
    particlesRef.current = particles;
    scene.add(particles.tireDustParticles);
    scene.add(particles.exhaustParticles);
    scene.add(particles.waterfallParticles);
    scene.add(particles.weatherParticles);

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

    // Simulation Clock
    const clock = new THREE.Clock();
    let hudUpdateTimer = 0;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = Math.min(0.08, clock.getDelta()) * simSpeedRef.current;
      controls.update();

      if (isPlayingRef.current) {
        const roadCurve = landscape.roadCurve;
        const vMesh = vehicle.rootGroup;
        const chassis = vehicle.chassisBody;

        let curSpeed = vehicleSpeedRef.current;
        const keys = keysRef.current;

        // ==========================================
        // 1. VEHICLE DYNAMICS (Manual vs Auto Tour)
        // ==========================================
        if (driveModeRef.current === 'auto_tour') {
          // Cruise at steady speed (24 km/h)
          curSpeed = 24.0;
          vehicleSpeedRef.current = curSpeed;

          // Progress along 3D road curve
          const progressDelta = (curSpeed / 3.6 / roadCurve.getLength()) * delta;
          pathProgressRef.current = (pathProgressRef.current + progressDelta) % 1.0;

          const currentPoint = roadCurve.getPointAt(pathProgressRef.current);
          const tangent = roadCurve.getTangentAt(pathProgressRef.current).normalize();

          // Smoothly align vehicle with road tangent
          vMesh.position.copy(currentPoint);
          vMesh.position.y += 0.35; // Tire ground offset

          // Look ahead along curve
          const lookTarget = currentPoint.clone().add(tangent.clone().multiplyScalar(4.0));
          vMesh.lookAt(lookTarget);

          // Incline and banking computation
          const pitch = Math.atan2(tangent.y, Math.hypot(tangent.x, tangent.z)) * (180 / Math.PI);
          chassisPitchRef.current = -pitch * 0.7;

          // Steering angle from curvature
          const nextPt = roadCurve.getPointAt((pathProgressRef.current + 0.01) % 1.0);
          const nextTangent = roadCurve.getTangentAt((pathProgressRef.current + 0.01) % 1.0);
          const turnAngle = (nextTangent.x * tangent.z - nextTangent.z * tangent.x) * 12.0;
          steerAngleRef.current = Math.max(-0.55, Math.min(0.55, turnAngle));
          chassisRollRef.current = -turnAngle * 1.8;
        } else {
          // MANUAL WASD EXPEDITION DRIVE
          const maxSpeed = keys.turbo ? 65.0 : 42.0;
          const accel = keys.turbo ? 28.0 : 16.0;
          const brakeForce = 34.0;

          if (keys.forward) {
            curSpeed = Math.min(maxSpeed, curSpeed + accel * delta);
          } else if (keys.backward) {
            curSpeed = Math.max(-15.0, curSpeed - accel * delta);
          } else {
            // Natural friction coasting
            curSpeed *= Math.pow(0.88, delta * 30);
          }

          if (keys.brake) {
            if (curSpeed > 0) curSpeed = Math.max(0, curSpeed - brakeForce * delta);
            else if (curSpeed < 0) curSpeed = Math.min(0, curSpeed + brakeForce * delta);
          }

          vehicleSpeedRef.current = curSpeed;

          // Steering input
          const steerSpeed = 2.4 * delta;
          if (keys.left) {
            steerAngleRef.current = Math.min(0.52, steerAngleRef.current + steerSpeed);
          } else if (keys.right) {
            steerAngleRef.current = Math.max(-0.52, steerAngleRef.current - steerSpeed);
          } else {
            steerAngleRef.current *= Math.pow(0.75, delta * 30); // Self-centering
          }

          // Advance position along heading
          const speedMps = curSpeed / 3.6;
          vehicleHeadingRef.current += steerAngleRef.current * (speedMps / 3.4) * delta;

          const headingVec = new THREE.Vector3(
            Math.sin(vehicleHeadingRef.current),
            0,
            Math.cos(vehicleHeadingRef.current)
          );
          vMesh.position.addScaledVector(headingVec, speedMps * delta);
          vMesh.rotation.y = vehicleHeadingRef.current;

          // Pitch and Roll Inertia
          chassisPitchRef.current = keys.forward ? -2.2 : keys.brake ? 3.8 : 0;
          chassisRollRef.current = -steerAngleRef.current * (curSpeed / 25) * 6.5;
        }

        // Apply Chassis Pitch and Roll (Suspension Articulation)
        chassis.rotation.z = THREE.MathUtils.degToRad(chassisRollRef.current);
        chassis.rotation.x = THREE.MathUtils.degToRad(chassisPitchRef.current);

        // Turn front wheels according to steerAngle
        vehicle.frontSteerGroups.forEach((pivot) => {
          pivot.rotation.y = steerAngleRef.current;
        });

        // Spin all 6 wheels based on distance travelled
        const wheelSpin = (curSpeed / 3.6 / 0.48) * delta;
        vehicle.wheelGroups.forEach((w) => {
          w.rotation.x += wheelSpin;
        });

        // Rotate rooftop radar dish continuously
        vehicle.radarDishMesh.rotation.y += delta * 4.5;

        // Brake light activation
        const isBraking = keys.brake || (curSpeed < 0 && keys.forward);
        vehicle.taillightsMat.emissive.setHex(isBraking ? 0xff0000 : 0x000000);

        // ==========================================
        // 2. CAMERA TRACKING & PRESETS
        // ==========================================
        const cam = cameraRef.current;
        const ctrl = controlsRef.current;
        const vPos = vMesh.position;

        if (cameraViewRef.current === 'chase' && cam && ctrl) {
          // Dynamic chase camera following behind vehicle
          const offset = new THREE.Vector3(-8.5, 4.2, 0);
          offset.applyEuler(vMesh.rotation);
          const targetCamPos = vPos.clone().add(offset);
          cam.position.lerp(targetCamPos, 0.08);
          ctrl.target.lerp(vPos.clone().add(new THREE.Vector3(0, 1.4, 0)), 0.12);
        } else if (cameraViewRef.current === 'cockpit' && cam && ctrl) {
          // FPV inside the cab
          const eyeOffset = new THREE.Vector3(1.4, 1.2, 0.35);
          eyeOffset.applyEuler(vMesh.rotation);
          cam.position.copy(vPos.clone().add(eyeOffset));

          const lookDir = new THREE.Vector3(12.0, 0.4, 0);
          lookDir.applyEuler(vMesh.rotation);
          ctrl.target.copy(vPos.clone().add(lookDir));
        } else if (cameraViewRef.current === 'wheel_cam' && cam && ctrl) {
          // Low-angle wheel hub camera
          const wheelOffset = new THREE.Vector3(1.2, 0.4, 1.8);
          wheelOffset.applyEuler(vMesh.rotation);
          cam.position.copy(vPos.clone().add(wheelOffset));
          ctrl.target.copy(vPos);
        }

        // ==========================================
        // 3. PARTICLE SYSTEMS UPDATE
        // ==========================================
        const wheelWorldPositions: THREE.Vector3[] = [];
        vehicle.wheelGroups.forEach((w) => {
          const wp = new THREE.Vector3();
          w.getWorldPosition(wp);
          wheelWorldPositions.push(wp);
        });

        const exhaustWorld = new THREE.Vector3();
        vMesh.localToWorld(vehicle.exhaustStackWorld.clone());

        particles.update(
          delta,
          wheelWorldPositions,
          exhaustWorld,
          curSpeed,
          keys.forward ? 1.0 : keys.backward ? -1.0 : 0,
          activeWeatherRef.current
        );

        // River surface wave ripple animation
        const riverGeo = landscape.riverMesh.geometry as THREE.BufferGeometry;
        const riverPosAttr = riverGeo.attributes.position as THREE.BufferAttribute;
        const rArr = riverPosAttr.array as Float32Array;
        const time = clock.getElapsedTime() * 2.0;
        for (let i = 0; i < rArr.length / 3; i++) {
          const rx = rArr[i * 3];
          const rz = rArr[i * 3 + 2];
          rArr[i * 3 + 1] = Math.sin(rx * 0.4 + time) * 0.08 + Math.cos(rz * 0.3 + time * 1.5) * 0.06;
        }
        riverPosAttr.needsUpdate = true;

        // ==========================================
        // 4. AUDIO SYNTHESIS & TELEMETRY
        // ==========================================
        if (audioRef.current && !audioRef.current.getMuted()) {
          audioRef.current.updateEngine(
            curSpeed,
            keys.forward ? 1.0 : keys.backward ? -0.8 : 0.1,
            isBraking
          );
        }

        // Periodic UI State Sync (every 100ms)
        hudUpdateTimer += delta;
        if (hudUpdateTimer >= 0.1) {
          setSpeedKmh(Math.round(curSpeed));
          const calculatedRpm = Math.min(2600, Math.round(650 + (Math.abs(curSpeed) / 50) * 1800));
          setRpm(calculatedRpm);

          const absSpd = Math.abs(curSpeed);
          let currentGear = '1';
          if (absSpd === 0) currentGear = 'N';
          else if (curSpeed < 0) currentGear = 'R';
          else if (absSpd < 12) currentGear = '1';
          else if (absSpd < 24) currentGear = '2';
          else if (absSpd < 38) currentGear = '3';
          else currentGear = '4';
          setGear(currentGear);

          setInclinePitchDeg(parseFloat(chassisPitchRef.current.toFixed(1)));
          setLateralRollDeg(parseFloat(chassisRollRef.current.toFixed(1)));
          setElevationM(Math.round(1850 + vMesh.position.y * 14));

          // Zone name based on position
          if (vMesh.position.x > -16 && vMesh.position.x < 16 && Math.abs(vMesh.position.z - (-18)) < 4) {
            setCurrentZoneName('High Canyon Wooden Suspension Bridge');
          } else if (vMesh.position.y < 2.0) {
            setCurrentZoneName('Lower Canyon River Gorge Ford');
          } else if (vMesh.position.x < -25 && vMesh.position.y > 6.0) {
            setCurrentZoneName('West Cliffside Rockcut Hairpins');
          } else {
            setCurrentZoneName('Alpine Crest Ridge & Outpost');
          }

          hudUpdateTimer = 0;
        }
      }

      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      particles.dispose();
      landscape.materialsToDispose.forEach((m) => m.dispose());
      landscape.geometriesToDispose.forEach((g) => g.dispose());
      vehicle.materialsToDispose.forEach((m) => m.dispose());
      vehicle.geometriesToDispose.forEach((g) => g.dispose());
    };
  }, []);

  // Day / Night toggle
  const toggleNightMode = () => {
    setIsNightMode(!isNightMode);
    if (!sceneRef.current || !vehicleRef.current) return;
    const scene = sceneRef.current;
    if (!isNightMode) {
      scene.background = new THREE.Color(0x020617);
      scene.fog = new THREE.FogExp2(0x020617, 0.025);
      vehicleRef.current.headlights.forEach((h) => (h.intensity = 8.0));
    } else {
      scene.background = new THREE.Color(0x0c1322);
      scene.fog = new THREE.FogExp2(0x0c1322, 0.015);
      vehicleRef.current.headlights.forEach((h) => (h.intensity = 4.5));
    }
  };

  return (
    <div className="relative w-full bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur z-20 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Himalayan Canyon Gorge & Suspension Bridge Expedition
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-700/50 uppercase font-semibold">
                6x6 All-Terrain Rover
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Suspension Bridge Crossing · Waterfall Gorge · 6-Wheel Dynamic Physics · River Ford
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Switch to Mountain Simulation Environment */}
          {onSwitchToMountainSim && (
            <button
              onClick={onSwitchToMountainSim}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 text-xs font-medium transition shadow-sm"
              title="Switch to Mountain Slope & Traverse Simulation"
            >
              <Mountain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch to Mountain 3D</span>
            </button>
          )}

          {/* Drive Mode Toggle */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setDriveMode('auto_tour')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                driveMode === 'auto_tour'
                  ? 'bg-orange-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Auto Tour
            </button>
            <button
              onClick={() => setDriveMode('manual')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                driveMode === 'manual'
                  ? 'bg-orange-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Manual WASD / Touch Driving"
            >
              Manual Drive (WASD)
            </button>
          </div>

          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-lg border text-xs transition flex items-center space-x-1.5 ${
              isAudioMuted
                ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                : 'bg-orange-600 text-white border-orange-500 shadow-md animate-pulse'
            }`}
            title={isAudioMuted ? 'Unmute Diesel Engine Sound' : 'Mute Sound'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Day / Night Toggle */}
          <button
            onClick={toggleNightMode}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Toggle Day / Night"
          >
            {isNightMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-300" />}
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
              isPlaying ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Resume'}</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div ref={containerRef} className="relative w-full h-[640px] bg-slate-950 cursor-grab active:cursor-grabbing">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Camera Views Preset Toolbar (Top-Left) */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5 bg-slate-900/85 p-1.5 rounded-xl border border-slate-700/60 backdrop-blur shadow-xl">
          {[
            { id: 'chase', label: 'Chase Cam', icon: Camera },
            { id: 'cockpit', label: 'Cockpit FPV', icon: Eye },
            { id: 'bridge_fixed', label: 'Suspension Bridge', icon: Navigation },
            { id: 'waterfall_gorge', label: 'Waterfall Gorge', icon: Mountain },
            { id: 'wheel_cam', label: 'Wheel Hub', icon: Gauge },
            { id: 'free', label: 'Free Orbit', icon: Compass }
          ].map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                onClick={() => selectCameraView(preset.id as CamView)}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  cameraView === preset.id
                    ? 'bg-orange-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Location & Mission Status Badge (Top Center) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 border border-slate-700/80 px-4 py-2 rounded-xl backdrop-blur shadow-2xl flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-center font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">Active Sector</div>
            <div className="text-xs font-bold text-white">{currentZoneName}</div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
            {elevationM} m Alt
          </span>
        </div>

        {/* Weather Selector (Top-Right) */}
        <div className="absolute top-4 right-4 z-10 flex items-center bg-slate-900/85 p-1 rounded-xl border border-slate-700/60 backdrop-blur shadow-xl space-x-1">
          {[
            { id: 'clear', label: 'Clear', icon: Sun },
            { id: 'snow', label: 'Snow', icon: Snowflake },
            { id: 'rain', label: 'Rain', icon: CloudRain }
          ].map((w) => {
            const Icon = w.icon;
            return (
              <button
                key={w.id}
                onClick={() => setActiveWeather(w.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition ${
                  activeWeather === w.id
                    ? 'bg-orange-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{w.label}</span>
              </button>
            );
          })}
        </div>

        {/* Professional Vehicle Telemetry HUD (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-10 w-80 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur shadow-2xl space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                6x6 Heavy Powertrain
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50 font-bold">
              ALL-WHEEL DRIVE LOCK
            </span>
          </div>

          {/* Speedometer & Tachometer Display */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase">Speed</div>
              <div className="text-xl font-bold text-white">{speedKmh}</div>
              <div className="text-[9px] text-slate-500">km/h</div>
            </div>

            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase">Engine</div>
              <div className="text-xl font-bold text-orange-400">{rpm}</div>
              <div className="text-[9px] text-slate-500">RPM</div>
            </div>

            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase">Gear</div>
              <div className="text-xl font-bold text-cyan-300">{gear}</div>
              <div className="text-[9px] text-slate-500">{isTurboActive ? 'BOOST' : 'DRIVE'}</div>
            </div>
          </div>

          {/* Incline & Rollover Telemetry */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/40">
              <div className="text-[9px] text-slate-400 uppercase">Incline Grade</div>
              <div className="text-sm font-bold text-white">
                {inclinePitchDeg > 0 ? `+${inclinePitchDeg}°` : `${inclinePitchDeg}°`}
              </div>
            </div>

            <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/40">
              <div className="text-[9px] text-slate-400 uppercase">Lateral Roll</div>
              <div className="text-sm font-bold text-white">{lateralRollDeg}°</div>
            </div>
          </div>
        </div>

        {/* Manual Drive On-Screen Touch / Click Controls (Bottom-Right) */}
        {driveMode === 'manual' && (
          <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl backdrop-blur shadow-2xl flex flex-col items-center space-y-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
              Manual Drive Controls
            </div>

            {/* Steer & Throttle Crosshair Buttons */}
            <div className="flex flex-col items-center space-y-1.5">
              <button
                onMouseDown={() => (keysRef.current.forward = true)}
                onMouseUp={() => (keysRef.current.forward = false)}
                onTouchStart={() => (keysRef.current.forward = true)}
                onTouchEnd={() => (keysRef.current.forward = false)}
                className="w-12 h-10 rounded-lg bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white flex items-center justify-center font-bold shadow-md transition"
                title="Accelerate / Forward (W)"
              >
                <ArrowUp className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-1.5">
                <button
                  onMouseDown={() => (keysRef.current.left = true)}
                  onMouseUp={() => (keysRef.current.left = false)}
                  onTouchStart={() => (keysRef.current.left = true)}
                  onTouchEnd={() => (keysRef.current.left = false)}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-orange-600 text-white flex items-center justify-center font-bold border border-slate-700 transition"
                  title="Steer Left (A)"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <button
                  onMouseDown={() => (keysRef.current.backward = true)}
                  onMouseUp={() => (keysRef.current.backward = false)}
                  onTouchStart={() => (keysRef.current.backward = true)}
                  onTouchEnd={() => (keysRef.current.backward = false)}
                  className="w-12 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-orange-600 text-white flex items-center justify-center font-bold border border-slate-700 transition"
                  title="Reverse / Brake (S)"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>

                <button
                  onMouseDown={() => (keysRef.current.right = true)}
                  onMouseUp={() => (keysRef.current.right = false)}
                  onTouchStart={() => (keysRef.current.right = true)}
                  onTouchEnd={() => (keysRef.current.right = false)}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-orange-600 text-white flex items-center justify-center font-bold border border-slate-700 transition"
                  title="Steer Right (D)"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <button
                onMouseDown={() => {
                  keysRef.current.turbo = true;
                  setIsTurboActive(true);
                }}
                onMouseUp={() => {
                  keysRef.current.turbo = false;
                  setIsTurboActive(false);
                }}
                className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono tracking-wider shadow-md transition"
              >
                NITRO BOOST (SHIFT)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Mission Waypoints Bar */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-5 py-3.5 z-20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-300">
          <span className="font-bold text-white flex items-center space-x-1.5">
            <Flag className="w-4 h-4 text-orange-400" />
            <span>Expedition Waypoints:</span>
          </span>

          <span className="inline-flex items-center space-x-1 font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>1. Canyon River Ford</span>
          </span>

          <span className="inline-flex items-center space-x-1 font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>2. Cliffside Switchbacks</span>
          </span>

          <span className="inline-flex items-center space-x-1 font-mono text-cyan-300 animate-pulse font-bold">
            <Navigation className="w-3.5 h-3.5" />
            <span>3. Wooden Suspension Bridge (Current)</span>
          </span>

          <span className="inline-flex items-center space-x-1 font-mono text-slate-400">
            <Radio className="w-3.5 h-3.5" />
            <span>4. Summit Sanitation Outpost</span>
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Manual Driving: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">W</kbd>{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">A</kbd>{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">S</kbd>{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">D</kbd> · Boost:{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">Shift</kbd> · Brake:{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">Space</kbd>
        </div>
      </div>
    </div>
  );
};
