import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Rotate3d,
  Layers,
  Eye,
  Camera,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Check,
  Mountain,
  Sliders,
  Maximize2,
  Minimize2,
  Activity,
  Gauge,
  ArrowUp,
  ArrowDown,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  ShieldCheck,
  Volume2,
  VolumeX,
  Zap,
  Droplet,
  Compass,
  FileText,
  Info,
  Ruler,
  Crosshair,
  AlertTriangle,
  Video,
  Sparkles
} from 'lucide-react';
import { SiteConditions, EquipmentRecommendation } from '../types';
import {
  createAsphaltTextures,
  createRockTextures,
  createKathKuniStoneTexture,
  createCorrugatedTinTexture,
  createDecalTexture,
  createMountainSignTexture,
  createTireTextures,
  createCadDimensionBadge,
  createSludgeFoamTexture,
  createCloudTexture
} from './simulationTextures';

// Custom 3D Helical Curve for Coil Springs
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  radius: number;
  pitch: number;
  turns: number;

  constructor(radius = 0.045, pitch = 0.035, turns = 5) {
    super();
    this.radius = radius;
    this.pitch = pitch;
    this.turns = turns;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const angle = t * Math.PI * 2 * this.turns;
    const x = this.radius * Math.cos(angle);
    const z = this.radius * Math.sin(angle);
    const y = t * this.pitch * this.turns;
    return optionalTarget.set(x, y, z);
  }
}

interface Simulation3DProps {
  site: SiteConditions;
  setSite?: React.Dispatch<React.SetStateAction<SiteConditions>>;
  topChoice?: EquipmentRecommendation;
}

export const Simulation3D: React.FC<Simulation3DProps> = ({
  site,
  setSite,
  topChoice
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Geographic & Climatic preset options
  const [terrainPreset, setTerrainPreset] = useState<'shimla' | 'aizawl' | 'ladakh'>('shimla');
  const [slopeDeg, setSlopeDeg] = useState<number>(site.slope_degrees || 28.0);
  const [payloadLiters, setPayloadLiters] = useState<number>(400);
  const [hasBaffles, setHasBaffles] = useState<boolean>(true);
  const [hasLowComBattery, setHasLowComBattery] = useState<boolean>(true);
  const [cutawayOpacity, setCutawayOpacity] = useState<number>(0.6);
  const [isXRayMode, setIsXRayMode] = useState<boolean>(false);

  // Motion & Mission modes
  const [driveMode, setDriveMode] = useState<'auto_climb' | 'manual' | 'parked' | 'desludge'>('auto_climb');
  const [vehicleSpeedKmh, setVehicleSpeedKmh] = useState<number>(14);
  const [cameraMode, setCameraMode] = useState<
    'chase' | 'cockpit' | 'drone' | 'tank' | 'desludge' | 'wheel_axle' | 'cinematic_drone' | 'free'
  >('chase');
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [activeWeather, setActiveWeather] = useState<'snow' | 'rain' | 'clear'>(
    site.climate_zone === 'cold_freezing' ? 'snow' : site.climate_zone === 'monsoon_heavy' ? 'rain' : 'clear'
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [activeStressTest, setActiveStressTest] = useState<
    'none' | 'hill_brake' | 'hairpin_turn' | 'freeze_surge'
  >('none');
  const [stabilityMarginPct, setStabilityMarginPct] = useState<number>(85);
  const [selectedCallout, setSelectedCallout] = useState<
    'none' | 'tank' | 'baffles' | 'battery' | 'macerator' | 'outriggers' | 'suction_arm' | 'vault'
  >('none');

  // Desludging operation sequence state
  const [desludgeStage, setDesludgeStage] = useState<'idle' | 'deploying' | 'pumping' | 'completed'>('idle');
  const [desludgeProgressPct, setDesludgeProgressPct] = useState<number>(0);
  const [pumpedVolumeLiters, setPumpedVolumeLiters] = useState<number>(0);

  // Telemetry state
  const [currentAltitudeM, setCurrentAltitudeM] = useState<number>(1850);
  const [currentInclineDeg, setCurrentInclineDeg] = useState<number>(28.0);
  const [lateralGForce, setLateralGForce] = useState<number>(0.0);
  const [activePowerKw, setActivePowerKw] = useState<number>(8.4);

  // Physics thresholds
  const criticalRolloverAngle = hasBaffles && hasLowComBattery ? 34.2 : 21.8;
  const safeOperatingThreshold = 28.0;
  const isRolloverTriggered = slopeDeg > criticalRolloverAngle;
  const isSafeAtCurrentSlope = slopeDeg <= safeOperatingThreshold && hasBaffles && hasLowComBattery;
  const currentSurgeCm = hasBaffles ? 0.9 : 7.9;

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Dynamic 3D model references
  const mountainGroupRef = useRef<THREE.Group | null>(null);
  const cloudsGroupRef = useRef<THREE.Group | null>(null);
  const pineTreeGroupsRef = useRef<THREE.Group[]>([]);
  const vehicleGroupRef = useRef<THREE.Group | null>(null);
  const chassisGroupRef = useRef<THREE.Group | null>(null);
  const tankCylinderRef = useRef<THREE.Mesh | null>(null);
  const baffledLiquidGroupRef = useRef<THREE.Group | null>(null);
  const unbaffledLiquidRef = useRef<THREE.Mesh | null>(null);
  const baffledLiquidSurfacesRef = useRef<THREE.Mesh[]>([]);
  const unbaffledLiquidSurfaceRef = useRef<THREE.Mesh | null>(null);
  const unbaffledSurfaceGeoRef = useRef<THREE.PlaneGeometry | null>(null);
  const tankFoamMeshRef = useRef<THREE.Mesh | null>(null);
  const vehicleTankLiquidRef = useRef<THREE.Group | null>(null);
  const bafflesMeshRef = useRef<THREE.Group | null>(null);
  const batteryMeshRef = useRef<THREE.Mesh | null>(null);
  const comCrosshairRef = useRef<THREE.Group | null>(null);
  const comVectorLineRef = useRef<THREE.Line | null>(null);
  const rolloverPyramidRef = useRef<THREE.Mesh | null>(null);
  const rolloverPyramidEdgesRef = useRef<THREE.LineSegments | null>(null);
  const rolloverBaseLineRef = useRef<THREE.LineLoop | null>(null);
  const cadDimensionsGroupRef = useRef<THREE.Group | null>(null);
  const headlightsLightRef = useRef<THREE.SpotLight[]>([]);
  const volumetricHeadlightsRef = useRef<THREE.Mesh[]>([]);
  const wheelsRef = useRef<THREE.Group[]>([]);
  const suspensionSpringsRef = useRef<THREE.Mesh[]>([]);
  const damperPistonsRef = useRef<THREE.Mesh[]>([]);
  const outriggersRef = useRef<THREE.Mesh[]>([]);
  const suctionArmRef = useRef<THREE.Group | null>(null);
  const summitGroupRef = useRef<THREE.Group | null>(null);
  const suctionHoseTubeRef = useRef<THREE.Mesh | null>(null);
  const pitLiquidRef = useRef<THREE.Mesh | null>(null);
  const maceratorBladesRef = useRef<THREE.Mesh | null>(null);
  const roofBeaconRef = useRef<THREE.Mesh | null>(null);
  const streetLightBulbsRef = useRef<THREE.PointLight[]>([]);
  const weatherParticlesRef = useRef<THREE.Points | null>(null);
  const tireParticlesRef = useRef<THREE.Points | null>(null);
  const tireParticleDataRef = useRef<{ velocities: Float32Array; lifetimes: Float32Array; maxLife: number } | null>(null);
  const suctionFlowPointsRef = useRef<THREE.Points | null>(null);
  const roadCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const chassisMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const batteryCaseMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const foamTexRef = useRef<THREE.CanvasTexture | null>(null);

  // Dynamic chassis pitch & roll simulation refs
  const chassisPitchRef = useRef<number>(0);
  const chassisRollRef = useRef<number>(0);
  const fluidSloshAngleRef = useRef<number>(0);
  const droneOrbitAngleRef = useRef<number>(0);
  const stressTimerRef = useRef<number>(0);
  const activeStressTestRef = useRef<'none' | 'hill_brake' | 'hairpin_turn' | 'freeze_surge'>('none');
  const showDimensionsRef = useRef<boolean>(true);

  // State synchronization refs to prevent WebGL context recreation on UI interactions
  const cameraModeRef = useRef(cameraMode);
  const driveModeRef = useRef(driveMode);
  const vehicleSpeedKmhRef = useRef(vehicleSpeedKmh);
  const isNightModeRef = useRef(isNightMode);
  const activeWeatherRef = useRef(activeWeather);
  const hasBafflesRef = useRef(hasBaffles);
  const hasLowComBatteryRef = useRef(hasLowComBattery);
  const isXRayModeRef = useRef(isXRayMode);
  const slopeDegRef = useRef(slopeDeg);

  cameraModeRef.current = cameraMode;
  driveModeRef.current = driveMode;
  vehicleSpeedKmhRef.current = vehicleSpeedKmh;
  isNightModeRef.current = isNightMode;
  activeWeatherRef.current = activeWeather;
  hasBafflesRef.current = hasBaffles;
  hasLowComBatteryRef.current = hasLowComBattery;
  isXRayModeRef.current = isXRayMode;
  slopeDegRef.current = slopeDeg;
  activeStressTestRef.current = activeStressTest;
  showDimensionsRef.current = showDimensions;

  // Vehicle progress tracking
  const pathProgressRef = useRef<number>(0.12);
  const manualThrottleRef = useRef<number>(0);
  const desludgeTimerRef = useRef<number>(0);

  // Web Audio Context & Procedural Synthesizers
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  const pumpOscRef = useRef<OscillatorNode | null>(null);
  const pumpGainRef = useRef<GainNode | null>(null);
  const alarmOscRef = useRef<OscillatorNode | null>(null);
  const alarmGainRef = useRef<GainNode | null>(null);

  // Audio synthesizer init / toggle
  const toggleAudio = () => {
    if (!isAudioEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const master = ctx.createGain();
        master.gain.value = 0.25;
        master.connect(ctx.destination);
        masterGainRef.current = master;

        // 1. Engine Powertrain Synthesizer (Sawtooth low-pass)
        const engineOsc = ctx.createOscillator();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.setValueAtTime(55, ctx.currentTime);
        const engineFilter = ctx.createBiquadFilter();
        engineFilter.type = 'lowpass';
        engineFilter.frequency.setValueAtTime(260, ctx.currentTime);

        const engineGain = ctx.createGain();
        engineGain.gain.setValueAtTime(0.35, ctx.currentTime);
        engineOsc.connect(engineFilter);
        engineFilter.connect(engineGain);
        engineGain.connect(master);
        engineOsc.start();
        engineOscRef.current = engineOsc;
        engineGainRef.current = engineGain;

        // 2. Macerator & Suction Pump Drone (Triangle wave with bandpass)
        const pumpOsc = ctx.createOscillator();
        pumpOsc.type = 'triangle';
        pumpOsc.frequency.setValueAtTime(120, ctx.currentTime);
        const pumpGain = ctx.createGain();
        pumpGain.gain.setValueAtTime(0, ctx.currentTime);
        pumpOsc.connect(pumpGain);
        pumpGain.connect(master);
        pumpOsc.start();
        pumpOscRef.current = pumpOsc;
        pumpGainRef.current = pumpGain;

        // 3. Rollover Proximity Alarm (Square wave pulsed)
        const alarmOsc = ctx.createOscillator();
        alarmOsc.type = 'square';
        alarmOsc.frequency.setValueAtTime(880, ctx.currentTime);
        const alarmGain = ctx.createGain();
        alarmGain.gain.setValueAtTime(0, ctx.currentTime);
        alarmOsc.connect(alarmGain);
        alarmGain.connect(master);
        alarmOsc.start();
        alarmOscRef.current = alarmOsc;
        alarmGainRef.current = alarmGain;

        setIsAudioEnabled(true);
      } catch (e) {
        console.warn('AudioContext not available:', e);
      }
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      setIsAudioEnabled(false);
    }
  };

  // Keyboard navigation for manual driving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (driveMode !== 'manual') return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        manualThrottleRef.current = 1;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        manualThrottleRef.current = -1;
      } else if (e.key === ' ') {
        manualThrottleRef.current = 0;
      } else if (e.key === 'r' || e.key === 'R') {
        pathProgressRef.current = 0.05;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (driveMode !== 'manual') return;
      if (
        e.key === 'ArrowUp' ||
        e.key === 'w' ||
        e.key === 'W' ||
        e.key === 'ArrowDown' ||
        e.key === 's' ||
        e.key === 'S'
      ) {
        manualThrottleRef.current = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [driveMode]);

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 640;

    // 1. Scene & Photorealistic Atmospheric Sky
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    let skyColorHex = isNightMode ? 0x050914 : 0x0f172a;
    if (terrainPreset === 'aizawl') {
      skyColorHex = isNightMode ? 0x040d12 : 0x0a221e;
    } else if (terrainPreset === 'ladakh') {
      skyColorHex = isNightMode ? 0x060c18 : 0x162334;
    }
    scene.background = new THREE.Color(skyColorHex);
    scene.fog = new THREE.FogExp2(
      skyColorHex,
      terrainPreset === 'aizawl' ? 0.02 : activeWeather === 'snow' ? 0.016 : 0.01
    );

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 380);
    cameraRef.current = camera;
    camera.position.set(0, 10, 22);

    // 3. Renderer with High Dynamic Range Lighting & Soft Shadows
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.minDistance = 2.0;
    controls.maxDistance = 90.0;
    controls.target.set(0, 4, 0);

    // 5. Directional Sun, Sky Ambient & Rim Lights
    const ambientLight = new THREE.AmbientLight(
      isNightMode ? 0x1e293b : 0xf8fafc,
      isNightMode ? 0.35 : 0.82
    );
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const hemiLight = new THREE.HemisphereLight(
      isNightMode ? 0x1e3a8a : 0xbae6fd,
      isNightMode ? 0x080c14 : 0x1e293b,
      isNightMode ? 0.25 : 0.65
    );
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const sunLight = new THREE.DirectionalLight(
      isNightMode ? 0x60a5fa : 0xffedd5,
      isNightMode ? 0.3 : 1.7
    );
    sunLight.position.set(38, 58, 32);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 160;
    sunLight.shadow.camera.left = -45;
    sunLight.shadow.camera.right = 45;
    sunLight.shadow.camera.top = 45;
    sunLight.shadow.camera.bottom = -45;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Mountain & Environment Group
    const mountainGroup = new THREE.Group();
    mountainGroupRef.current = mountainGroup;
    scene.add(mountainGroup);

    // Procedural PBR Textures
    const asphaltTex = createAsphaltTextures();
    asphaltTex.map.repeat.set(1, 14);
    asphaltTex.bumpMap.repeat.set(1, 14);
    asphaltTex.roughnessMap.repeat.set(1, 14);

    const rockTex = createRockTextures(terrainPreset);
    rockTex.map.repeat.set(4, 4);
    rockTex.bumpMap.repeat.set(4, 4);
    rockTex.roughnessMap.repeat.set(4, 4);

    const stoneWallTex = createKathKuniStoneTexture();
    const tireTex = createTireTextures();
    const swachhDecal = createDecalTexture('swachh_bharat');
    const batteryDecal = createDecalTexture('battery_warning');
    const gaugeDecal = createDecalTexture('vacuum_gauge');
    const foamTex = createSludgeFoamTexture();
    foamTexRef.current = foamTex;
    const cloudTex = createCloudTexture();

    // 6. Mountain Switchback Road Curve (Dynamically scaled Y based on slopeDeg)
    const baseSlopeFactor = Math.tan((slopeDeg * Math.PI) / 180);
    const refSlopeFactor = Math.tan((28 * Math.PI) / 180);
    const slopeScaleY = baseSlopeFactor / refSlopeFactor;

    const roadWaypoints = [
      new THREE.Vector3(0, 0.4 * slopeScaleY, 25), // Valley Base Station
      new THREE.Vector3(-6.5, 2.8 * slopeScaleY, 14), // Turn 1: Forest sweep
      new THREE.Vector3(-7.5, 5.6 * slopeScaleY, 3), // Hairpin 1: steep incline
      new THREE.Vector3(5.5, 8.8 * slopeScaleY, -4), // Hairpin 2: Ridge traversal
      new THREE.Vector3(7.0, 11.8 * slopeScaleY, -12), // Turn 2: Cliffside curve
      new THREE.Vector3(1.5, 14.2 * slopeScaleY, -19), // Mountain village approach
      new THREE.Vector3(0, 15.0 * slopeScaleY, -25) // Summit Septic Containment Vault
    ];

    const roadCurve = new THREE.CatmullRomCurve3(roadWaypoints, false, 'catmullrom', 0.15);
    roadCurveRef.current = roadCurve;

    // 7. Photorealistic Mountain Road Bed with Integrated Markings & Continuous W-Beam Guardrails
    const roadSegments = 260;
    const roadWidth = 2.4;
    const curvePoints = roadCurve.getPoints(roadSegments);

    const roadGeo = new THREE.BufferGeometry();
    const roadVerts: number[] = [];
    const roadNorms: number[] = [];
    const roadUvs: number[] = [];
    const roadIdx: number[] = [];

    // Continuous W-Beam Steel Crash Barrier Ribbon
    const grGeo = new THREE.BufferGeometry();
    const grVerts: number[] = [];
    const grNorms: number[] = [];
    const grIdx: number[] = [];

    // Hillside Concrete Rainwater Drainage Gutter (Pucca Drain)
    const drainGeo = new THREE.BufferGeometry();
    const drainVerts: number[] = [];
    const drainIdx: number[] = [];

    const galvanizedMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.88,
      roughness: 0.32,
      side: THREE.DoubleSide
    });

    for (let i = 0; i <= roadSegments; i++) {
      const t = i / roadSegments;
      const pt = curvePoints[i];
      const tangent = roadCurve.getTangent(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const roadYOffset = 0.12;

      const leftPt = pt.clone().add(normal.clone().multiplyScalar(roadWidth / 2));
      const rightPt = pt.clone().add(normal.clone().multiplyScalar(-roadWidth / 2));

      // Road Tarmac Bed with UV mapping (U: 0 to 1 across width; V: t along length)
      roadVerts.push(leftPt.x, leftPt.y + roadYOffset, leftPt.z);
      roadVerts.push(rightPt.x, rightPt.y + roadYOffset, rightPt.z);
      roadNorms.push(0, 1, 0, 0, 1, 0);
      roadUvs.push(0, t, 1, t);

      // Corrugated W-Beam Crash Barrier (Profile heights along outer precipice edge)
      const grEdge = leftPt.clone().add(normal.clone().multiplyScalar(0.14));
      const grBaseY = grEdge.y + roadYOffset;
      const p0 = new THREE.Vector3(grEdge.x, grBaseY + 0.32, grEdge.z);
      const p1 = new THREE.Vector3(grEdge.x + normal.x * 0.04, grBaseY + 0.42, grEdge.z + normal.z * 0.04);
      const p2 = new THREE.Vector3(grEdge.x, grBaseY + 0.50, grEdge.z);
      const p3 = new THREE.Vector3(grEdge.x + normal.x * 0.04, grBaseY + 0.58, grEdge.z + normal.z * 0.04);
      const p4 = new THREE.Vector3(grEdge.x, grBaseY + 0.68, grEdge.z);

      grVerts.push(p0.x, p0.y, p0.z);
      grVerts.push(p1.x, p1.y, p1.z);
      grVerts.push(p2.x, p2.y, p2.z);
      grVerts.push(p3.x, p3.y, p3.z);
      grVerts.push(p4.x, p4.y, p4.z);

      grNorms.push(normal.x, 0, normal.z);
      grNorms.push(normal.x, 0, normal.z);
      grNorms.push(normal.x, 0, normal.z);
      grNorms.push(normal.x, 0, normal.z);
      grNorms.push(normal.x, 0, normal.z);

      // Concrete Drainage Gutter along inner cliff wall
      const drainEdge = rightPt.clone().add(normal.clone().multiplyScalar(-0.02));
      const drainBottom = drainEdge.clone().add(normal.clone().multiplyScalar(-0.16)).setY(drainEdge.y + roadYOffset - 0.14);
      const drainWall = drainEdge.clone().add(normal.clone().multiplyScalar(-0.34)).setY(drainEdge.y + roadYOffset + 0.02);

      drainVerts.push(drainEdge.x, drainEdge.y + roadYOffset, drainEdge.z);
      drainVerts.push(drainBottom.x, drainBottom.y, drainBottom.z);
      drainVerts.push(drainWall.x, drainWall.y, drainWall.z);

      // Guardrail Steel Posts every 8 segments (~2.2 meters)
      if (i % 8 === 0) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.72, 0.08),
          galvanizedMat
        );
        post.position.set(grEdge.x, grBaseY + 0.36, grEdge.z);
        post.castShadow = true;
        mountainGroup.add(post);

        // Retroreflective Delineator Tabs on Hairpins
        if ((i > 40 && i < 110) || (i > 140 && i < 210)) {
          const delineator = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.12, 0.03),
            new THREE.MeshBasicMaterial({ color: i % 16 === 0 ? 0xef4444 : 0xfacc15 })
          );
          delineator.position.set(grEdge.x, grBaseY + 0.76, grEdge.z);
          mountainGroup.add(delineator);
        }
      }

      if (i < roadSegments) {
        const v = i * 2;
        roadIdx.push(v, v + 1, v + 2);
        roadIdx.push(v + 1, v + 3, v + 2);

        // Guardrail Ribbon Quads
        const grV = i * 5;
        for (let s = 0; s < 4; s++) {
          grIdx.push(grV + s, grV + s + 1, grV + s + 5);
          grIdx.push(grV + s + 1, grV + s + 6, grV + s + 5);
        }

        // Drain Gutter Quads
        const dV = i * 3;
        drainIdx.push(dV, dV + 1, dV + 3);
        drainIdx.push(dV + 1, dV + 4, dV + 3);
        drainIdx.push(dV + 1, dV + 2, dV + 4);
        drainIdx.push(dV + 2, dV + 5, dV + 4);
      }
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNorms, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIdx);

    const roadMat = new THREE.MeshStandardMaterial({
      map: asphaltTex.map,
      bumpMap: asphaltTex.bumpMap,
      bumpScale: 0.04,
      roughnessMap: asphaltTex.roughnessMap,
      roughness: 0.85,
      metalness: 0.12
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    mountainGroup.add(roadMesh);

    // Guardrail Mesh
    grGeo.setAttribute('position', new THREE.Float32BufferAttribute(grVerts, 3));
    grGeo.setAttribute('normal', new THREE.Float32BufferAttribute(grNorms, 3));
    grGeo.setIndex(grIdx);
    const grMesh = new THREE.Mesh(grGeo, galvanizedMat);
    grMesh.castShadow = true;
    mountainGroup.add(grMesh);

    // Concrete Drainage Gutter Mesh
    drainGeo.setAttribute('position', new THREE.Float32BufferAttribute(drainVerts, 3));
    drainGeo.computeVertexNormals();
    drainGeo.setIndex(drainIdx);
    const drainMesh = new THREE.Mesh(
      drainGeo,
      new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
      })
    );
    drainMesh.receiveShadow = true;
    mountainGroup.add(drainMesh);

    // Roadside Grade & Mountain Warning Signs with Procedural Textures
    const signLocations = [
      { t: 0.08, title: '28° STEEP INCLINE', sub: 'ENGAGE LOW GEAR 4WD', icon: 'slope' as const },
      { t: 0.32, title: 'HAIRPIN BEND', sub: 'SOUND HORN · SLOW', icon: 'curve' as const },
      { t: 0.65, title: 'SLOSH HAZARD ZONE', sub: 'DUAL BAFFLES ACTIVE', icon: 'hazard' as const }
    ];
    signLocations.forEach((s) => {
      const pt = roadCurve.getPoint(s.t);
      const tangent = roadCurve.getTangent(s.t).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const signPos = pt.clone().add(normal.clone().multiplyScalar(roadWidth / 2 + 0.65));

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8),
        galvanizedMat
      );
      pole.position.set(signPos.x, signPos.y + 0.8, signPos.z);
      mountainGroup.add(pole);

      const signTex = createMountainSignTexture(s.title, s.sub, s.icon);
      const boardGeo = new THREE.BoxGeometry(0.9, 0.6, 0.03);
      const boardMat = new THREE.MeshStandardMaterial({
        map: signTex,
        roughness: 0.3,
        metalness: 0.2
      });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(signPos.x, signPos.y + 1.45, signPos.z);
      board.lookAt(signPos.clone().add(tangent));
      mountainGroup.add(board);
    });

    // Streetlamps with Night-Lighting along Switchback Curves
    streetLightBulbsRef.current = [];
    const streetLampWaypoints = [0.18, 0.48, 0.78];
    streetLampWaypoints.forEach((sw) => {
      const lampPt = roadCurve.getPoint(sw);
      const lampTan = roadCurve.getTangent(sw).normalize();
      const lampNorm = new THREE.Vector3().crossVectors(lampTan, new THREE.Vector3(0, 1, 0)).normalize();
      const basePos = lampPt.clone().add(lampNorm.clone().multiplyScalar(-roadWidth / 2 - 0.65));

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 3.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 })
      );
      pole.position.set(basePos.x, basePos.y + 1.7, basePos.z);
      mountainGroup.add(pole);

      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85 })
      );
      arm.rotation.z = Math.PI / 3;
      arm.position.set(basePos.x + 0.3, basePos.y + 3.25, basePos.z);
      mountainGroup.add(arm);

      // Downward Cobra-Head Luminaire
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.08, 0.16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
      );
      head.position.set(basePos.x + 0.52, basePos.y + 3.35, basePos.z);
      mountainGroup.add(head);

      // Light bulb
      const bulb = new THREE.PointLight(0xfef08a, isNightMode ? 2.2 : 0.0, 16, 1.5);
      bulb.position.set(basePos.x + 0.52, basePos.y + 3.2, basePos.z);
      mountainGroup.add(bulb);
      streetLightBulbsRef.current.push(bulb);
    });

    // 8. Procedural Mountain Terrain with Geological Slope Shading & Road Depression Smoothing
    const terrainSize = 85;
    const terrainSegs = 95;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    const terrainElevationFactor = (baseSlopeFactor * 0.4);

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      let vy = -vz * terrainElevationFactor;

      const distFromCenter = Math.abs(vx);
      if (distFromCenter > 5.5) {
        const ridge = Math.sin(vx * 0.32) * Math.cos(vz * 0.28) * 4.2 + (distFromCenter - 5.5) * 0.95;
        vy += Math.max(0, ridge);
      }

      // Smooth terrain depression under the road curve to prevent clipping
      let minRoadDist = 999;
      let nearestRoadY = 0;
      for (let k = 0; k < curvePoints.length; k += 4) {
        const d = Math.hypot(vx - curvePoints[k].x, vz - curvePoints[k].z);
        if (d < minRoadDist) {
          minRoadDist = d;
          nearestRoadY = curvePoints[k].y;
        }
      }

      if (minRoadDist < roadWidth * 1.5) {
        const blend = minRoadDist / (roadWidth * 1.5);
        vy = nearestRoadY * (1 - blend) + vy * blend;
      }

      pos.setY(i, vy);
    }

    terrainGeo.computeVertexNormals();

    // Slope-Based Vertex Shading (Craggy rock on steep angles, grass/moss on shelves)
    const normals = terrainGeo.attributes.normal;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const vy = pos.getY(i);
      const ny = normals.getY(i); // Vertical component of normal (1.0 = flat ground, 0.0 = sheer vertical cliff)

      let r = 0.18, g = 0.26, b = 0.18; // Default temperate soil/grass

      if (terrainPreset === 'aizawl') {
        // Lush monsoon vegetation on slopes; wet dark mud rock on cliffs
        if (ny < 0.72) {
          // Steep cliff face
          r = 0.22; g = 0.18; b = 0.14;
        } else {
          r = 0.10; g = 0.28; b = 0.13;
        }
      } else if (terrainPreset === 'ladakh') {
        // Arid high-altitude cold desert rock & frost
        if (ny < 0.70) {
          r = 0.38; g = 0.35; b = 0.31;
        } else {
          r = 0.52; g = 0.48; b = 0.44;
        }
        if (vy > 8.0 * slopeScaleY) {
          // Summit glacial snow dusting
          r = 0.88; g = 0.92; b = 0.96;
        }
      } else {
        // Shimla alpine temperate
        if (ny < 0.72) {
          // Exposed craggy slate & limestone cliff strata
          r = 0.30; g = 0.33; b = 0.36;
        } else {
          // Alpine grass shelf
          r = 0.18; g = 0.30; b = 0.19;
        }
        if (vy > 13.0 * slopeScaleY) {
          // Alpine peak snow line
          r = 0.90; g = 0.93; b = 0.97;
        }
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const terrainMat = new THREE.MeshStandardMaterial({
      map: rockTex.map,
      bumpMap: rockTex.bumpMap,
      bumpScale: 0.08,
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.1
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    mountainGroup.add(terrainMesh);

    // Distant Jagged Snowy Himalayan Ridge Silhouette Backdrop
    for (let r = 0; r < 5; r++) {
      const peakX = -32 + r * 16;
      const peakZ = -45 - Math.abs(r - 2) * 4;
      const peakH = 26 + (r % 3) * 6;
      const peakR = 14 + (r % 2) * 4;

      const peakGeo = new THREE.ConeGeometry(peakR, peakH, 5);
      const peakMat = new THREE.MeshStandardMaterial({
        color: terrainPreset === 'ladakh' ? 0xe2e8f0 : 0x334155,
        roughness: 0.85
      });
      const peakMesh = new THREE.Mesh(peakGeo, peakMat);
      peakMesh.position.set(peakX, peakH / 2 - 4, peakZ);
      peakMesh.rotation.y = (r * Math.PI) / 4;
      mountainGroup.add(peakMesh);

      // White snow cap atop peak
      const capGeo = new THREE.ConeGeometry(peakR * 0.45, peakH * 0.35, 5);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(peakX, peakH - peakH * 0.17 - 4, peakZ);
      capMesh.rotation.y = (r * Math.PI) / 4;
      mountainGroup.add(capMesh);
    }

    // Mountain Granite Boulders & Rock Scree
    const boulderCoords = [
      [-6.5, 9], [6.2, 12], [-8.2, -2], [8.5, -8], [-5.2, -14], [5.8, -17]
    ];
    boulderCoords.forEach(([bx, bz]) => {
      const bGeo = new THREE.DodecahedronGeometry(0.55 + Math.random() * 0.4, 1);
      const bMat = new THREE.MeshStandardMaterial({
        map: rockTex.map,
        roughness: 0.85,
        metalness: 0.15
      });
      const boulder = new THREE.Mesh(bGeo, bMat);
      const by = -bz * terrainElevationFactor + 0.3;
      boulder.position.set(bx, by, bz);
      boulder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      boulder.castShadow = true;
      mountainGroup.add(boulder);
    });

    // Multi-tier Himalayan Blue Pine Trees (Pinus wallichiana)
    pineTreeGroupsRef.current = [];
    const pineTreeLocations = [
      [-9, 16], [-10, 8], [-11, 0], [-8, -6],
      [9, 14], [10, 5], [11, -5], [8, -14],
      [-7, -18], [6, -20], [-5, 22], [5, 20]
    ];
    pineTreeLocations.forEach(([tx, tz]) => {
      const tree = new THREE.Group();
      const foliageColor =
        terrainPreset === 'ladakh' ? 0x1f2937 : terrainPreset === 'aizawl' ? 0x064e3b : 0x14532d;
      const foliageMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.85 });

      // 3 Staggered Conical Foliage Tiers
      const tier1 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.4, 7), foliageMat);
      tier1.position.y = 1.2;
      tier1.castShadow = true;
      tree.add(tier1);

      const tier2 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.3, 7), foliageMat);
      tier2.position.y = 1.9;
      tier2.castShadow = true;
      tree.add(tier2);

      const tier3 = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.1, 7), foliageMat);
      tier3.position.y = 2.6;
      tier3.castShadow = true;
      tree.add(tier3);

      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 0.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
      );
      trunk.position.y = 0.4;
      tree.add(trunk);

      const ty = -tz * terrainElevationFactor + (Math.abs(tx) > 6 ? (Math.abs(tx) - 6) * 0.85 : 0);
      tree.position.set(tx, ty, tz);
      tree.scale.setScalar(0.85 + Math.random() * 0.35);
      mountainGroup.add(tree);
      pineTreeGroupsRef.current.push(tree);
    });

    // Rolling Mountain Mist / Clouds drifting across Himalayan peaks
    const cloudsGroup = new THREE.Group();
    cloudsGroupRef.current = cloudsGroup;
    mountainGroup.add(cloudsGroup);

    const cloudGeo = new THREE.PlaneGeometry(18, 9);
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide
    });

    const cloudCoords = [
      { x: -28, y: 15 * slopeScaleY + 2, z: -32, ry: 0.1 },
      { x: 19, y: 17 * slopeScaleY + 3, z: -26, ry: -0.2 },
      { x: -12, y: 10 * slopeScaleY + 1, z: 6, ry: 0.15 },
      { x: 22, y: 12 * slopeScaleY + 2, z: -6, ry: -0.1 },
      { x: -6, y: 18 * slopeScaleY + 4, z: -40, ry: 0.05 },
      { x: 14, y: 8 * slopeScaleY + 1, z: 19, ry: -0.15 }
    ];

    cloudCoords.forEach((cfg) => {
      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      cloudMesh.position.set(cfg.x, cfg.y, cfg.z);
      cloudMesh.rotation.y = cfg.ry;
      cloudsGroup.add(cloudMesh);
    });

    // Vernacular Himalayan Kath-Kuni Hillside Cottages (Shimla / Manali Architecture)
    const houseCoords = [
      { x: -9.8, z: 12, roofColor: '#b91c1c' },
      { x: 9.5, z: 2, roofColor: '#1d4ed8' },
      { x: -8.5, z: -10, roofColor: '#047857' }
    ];
    houseCoords.forEach((hc) => {
      const hGroup = new THREE.Group();
      const hy = -hc.z * terrainElevationFactor + 1.2;
      hGroup.position.set(hc.x, hy, hc.z);

      // Level 1: Kath-Kuni Dressed Stone & Timber Foundation
      const stoneBase = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.6, 2.6),
        new THREE.MeshStandardMaterial({ map: stoneWallTex, roughness: 0.85 })
      );
      stoneBase.position.y = 0.8;
      stoneBase.castShadow = true;
      hGroup.add(stoneBase);

      // Level 2: Upper Living Floor (Cedar Wood Framing)
      const woodFloor = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 1.4, 2.4),
        new THREE.MeshStandardMaterial({ color: 0x452311, roughness: 0.75 })
      );
      woodFloor.position.y = 2.2;
      woodFloor.castShadow = true;
      hGroup.add(woodFloor);

      // Cantilevered Wooden Balcony / Veranda with Spindles
      const balcony = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.12, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.8 })
      );
      balcony.position.set(0, 1.6, 1.4);
      hGroup.add(balcony);

      // Corrugated CGI Gabled Tin Roof
      const tinRoofTex = createCorrugatedTinTexture(hc.roofColor);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(2.6, 1.3, 4),
        new THREE.MeshStandardMaterial({ map: tinRoofTex, roughness: 0.5, metalness: 0.4 })
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 3.4;
      roof.castShadow = true;
      hGroup.add(roof);

      // Stone Chimney with Smoke Outlet
      const chimney = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 1.0, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 })
      );
      chimney.position.set(0.8, 3.8, 0.4);
      hGroup.add(chimney);

      // Glowing Multi-paned Window
      const windowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.65, 0.65),
        new THREE.MeshBasicMaterial({ color: isNightMode ? 0xfef08a : 0xfde047 })
      );
      windowMesh.position.set(0, 2.2, 1.22);
      hGroup.add(windowMesh);

      mountainGroup.add(hGroup);
    });

    // Summit Destination: Septic Containment Vault & Cottage
    const summitPt = roadWaypoints[roadWaypoints.length - 1];
    const summitGroup = new THREE.Group();
    summitGroupRef.current = summitGroup;
    summitGroup.position.set(summitPt.x, summitPt.y, summitPt.z);
    mountainGroup.add(summitGroup);

    // Concrete Septic Pit Vault (Transparent Cutaway for Sludge Extraction)
    const vaultGeo = new THREE.BoxGeometry(2.4, 1.8, 2.4);
    const vaultMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.75,
      transparent: true,
      opacity: 0.85
    });
    const vaultMesh = new THREE.Mesh(vaultGeo, vaultMat);
    vaultMesh.position.y = -0.7;
    vaultMesh.receiveShadow = true;
    summitGroup.add(vaultMesh);

    // Sludge level inside Septic Vault (drops during pumping)
    const pitLiquidGeo = new THREE.BoxGeometry(2.2, 1.2, 2.2);
    const pitLiquidMat = new THREE.MeshStandardMaterial({
      color: 0x3b2416,
      roughness: 0.4,
      metalness: 0.2,
      transparent: true,
      opacity: 0.95
    });
    const pitLiquidMesh = new THREE.Mesh(pitLiquidGeo, pitLiquidMat);
    pitLiquidMesh.position.set(0, -0.6, 0);
    summitGroup.add(pitLiquidMesh);
    pitLiquidRef.current = pitLiquidMesh;

    // Manhole Rim with Heavy-Duty Gasket
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.14, 24),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.6 })
    );
    rim.position.y = 0.25;
    summitGroup.add(rim);

    // Summit Mountain Cottage Structure
    const summitHouse = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 2.4, 3.0),
      new THREE.MeshStandardMaterial({ map: stoneWallTex, roughness: 0.85 })
    );
    summitHouse.position.set(-3.4, 1.2, 0);
    summitGroup.add(summitHouse);

    const summitRoof = new THREE.Mesh(
      new THREE.ConeGeometry(2.8, 1.5, 4),
      new THREE.MeshStandardMaterial({
        map: createCorrugatedTinTexture('#991b1b'),
        roughness: 0.6,
        metalness: 0.3
      })
    );
    summitRoof.rotateY(Math.PI / 4);
    summitRoof.position.set(-3.4, 3.1, 0);
    summitGroup.add(summitRoof);

    // =========================================================================
    // 9. HIGH-FIDELITY 3D DESLUDGING VEHICLE ENGINEERING MODEL
    // Standard FRONT = +Z axis; Independent 4-Wheel Suspension & Dynamic Pitch/Roll
    // =========================================================================
    const vehicleGroup = new THREE.Group();
    vehicleGroupRef.current = vehicleGroup;
    scene.add(vehicleGroup);

    // Chassis Group: Tilts with dynamic pitch and roll atop suspension
    const chassisGroup = new THREE.Group();
    chassisGroupRef.current = chassisGroup;
    vehicleGroup.add(chassisGroup);

    // Boxed Ladder Chassis Frame
    const chassisMat = new THREE.MeshStandardMaterial({
      color: isXRayMode ? 0x0284c7 : 0x0f172a,
      metalness: 0.85,
      roughness: 0.35,
      wireframe: isXRayMode
    });
    chassisMatRef.current = chassisMat;
    const chassisMesh = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.18, 2.2), chassisMat);
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    chassisGroup.add(chassisMesh);

    // Heavy-Duty Front Bullbar Bumper (+Z = +1.15) with Recovery Winch
    const bullbar = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.24, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.25 })
    );
    bullbar.position.set(0, 0.05, 1.15);
    chassisGroup.add(bullbar);

    // Winch Drum & Steel Cable Hook
    const winchDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.28, 16),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.95, roughness: 0.2 })
    );
    winchDrum.rotation.z = Math.PI / 2;
    winchDrum.position.set(0, 0.1, 1.23);
    chassisGroup.add(winchDrum);

    // Industrial Driver Cab (Emerald Green SIH Automotive Livery with Clearcoat)
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.65, 0.75),
      new THREE.MeshPhysicalMaterial({
        color: isXRayMode ? 0x06b6d4 : 0x059669,
        metalness: 0.5,
        roughness: 0.25,
        clearcoat: 0.9,
        clearcoatRoughness: 0.15,
        transparent: isXRayMode,
        opacity: isXRayMode ? 0.4 : 1.0
      })
    );
    cab.position.set(0, 0.42, 0.68);
    cab.castShadow = true;
    chassisGroup.add(cab);

    // Cab Front Grille & SIH Emblem
    const grille = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.22, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.4 })
    );
    grille.position.set(0, 0.28, 1.06);
    chassisGroup.add(grille);

    // Door Decals (Swachh Bharat Mission / SIH-26258) on Driver & Passenger Doors
    const decalMat = new THREE.MeshStandardMaterial({
      map: swachhDecal,
      transparent: true,
      roughness: 0.3
    });
    [-0.485, 0.485].forEach((xPos) => {
      const doorDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.24), decalMat);
      doorDecal.rotation.y = xPos > 0 ? Math.PI / 2 : -Math.PI / 2;
      doorDecal.position.set(xPos, 0.42, 0.68);
      chassisGroup.add(doorDecal);
    });

    // Tinted Panoramic Windshield Glass
    const windshield = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.4),
      new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.6,
        roughness: 0.08,
        metalness: 0.9,
        transmission: 0.55
      })
    );
    windshield.position.set(0, 0.48, 1.06);
    windshield.rotation.x = -0.15;
    chassisGroup.add(windshield);

    // Articulated Windshield Wipers
    [-0.2, 0.2].forEach((wx) => {
      const wiper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.25, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
      );
      wiper.rotation.z = Math.PI / 4;
      wiper.position.set(wx, 0.38, 1.07);
      chassisGroup.add(wiper);
    });

    // Aerodynamic Side Mirrors with Chrome Faces
    [-0.56, 0.56].forEach((mx) => {
      const mirrorArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.16, 8),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
      );
      mirrorArm.rotation.z = mx > 0 ? Math.PI / 3 : -Math.PI / 3;
      mirrorArm.position.set(mx * 0.9, 0.48, 0.85);
      chassisGroup.add(mirrorArm);

      const mirrorHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.12, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
      );
      mirrorHead.position.set(mx, 0.52, 0.85);
      chassisGroup.add(mirrorHead);

      const mirrorGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(0.06, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.05 })
      );
      mirrorGlass.rotation.y = mx > 0 ? -Math.PI / 2 : Math.PI / 2;
      mirrorGlass.position.set(mx + (mx > 0 ? -0.022 : 0.022), 0.52, 0.85);
      chassisGroup.add(mirrorGlass);
    });

    // Cockpit Interior: Steering Wheel & Dashboard
    const steeringWheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.018, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    steeringWheel.rotation.x = Math.PI / 3;
    steeringWheel.position.set(-0.2, 0.42, 0.82);
    chassisGroup.add(steeringWheel);

    // Cab Roof Emergency LED Strobe Beacon Bar
    const beaconBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.08, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
    );
    beaconBar.position.set(0, 0.78, 0.68);
    chassisGroup.add(beaconBar);

    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.1, 16),
      new THREE.MeshBasicMaterial({ color: isRolloverTriggered ? 0xef4444 : 0xf59e0b })
    );
    beacon.position.set(0, 0.85, 0.68);
    chassisGroup.add(beacon);
    roofBeaconRef.current = beacon;

    // 400L Sludge Vacuum Holding Tank (Photorealistic Clearcoat PBR)
    const tankRadius = 0.38;
    const tankLength = 1.35;
    const tankMat = new THREE.MeshPhysicalMaterial({
      color: isXRayMode ? 0x06b6d4 : 0x0284c7,
      metalness: 0.35,
      roughness: 0.18,
      transmission: 0.75,
      transparent: true,
      opacity: cutawayOpacity,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const tankCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(tankRadius, tankRadius, tankLength, 32),
      tankMat
    );
    tankCylinderRef.current = tankCylinder;
    tankCylinder.rotation.x = Math.PI / 2;
    tankCylinder.position.set(0, 0.46, -0.28);
    tankCylinder.castShadow = true;
    chassisGroup.add(tankCylinder);

    // Tank Rounded End Caps
    [-tankLength / 2, tankLength / 2].forEach((zOffset) => {
      const capMesh = new THREE.Mesh(
        new THREE.SphereGeometry(tankRadius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        tankMat
      );
      capMesh.rotation.x = zOffset > 0 ? -Math.PI / 2 : Math.PI / 2;
      capMesh.position.set(0, 0.46, -0.28 + zOffset);
      chassisGroup.add(capMesh);
    });

    // Reinforcing Steel Hoops with Tensioning Hex Bolts
    [-0.45, 0.45].forEach((zOffset) => {
      const strap = new THREE.Mesh(
        new THREE.TorusGeometry(tankRadius + 0.015, 0.018, 12, 32),
        new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.85, roughness: 0.25 })
      );
      strap.position.set(0, 0.46, -0.28 + zOffset);
      chassisGroup.add(strap);
    });

    // Top Intake Manifold with Vacuum Gauge & Pressure Relief Valve
    const manifold = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.16, 16),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 })
    );
    manifold.position.set(0, 0.88, -0.28);
    chassisGroup.add(manifold);

    const gaugeMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16),
      new THREE.MeshStandardMaterial({ map: gaugeDecal, roughness: 0.2, metalness: 0.5 })
    );
    gaugeMesh.rotation.x = Math.PI / 2;
    gaugeMesh.position.set(0, 0.98, -0.28);
    chassisGroup.add(gaugeMesh);

    // Dual Internal Anti-Slosh Baffles
    const bafflesGroup = new THREE.Group();
    bafflesMeshRef.current = bafflesGroup;
    chassisGroup.add(bafflesGroup);

    const baffleMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      metalness: 0.8,
      roughness: 0.3,
      transparent: true,
      opacity: 0.85
    });

    // Longitudinal Baffle Plate (divides tank left/right)
    const longBaffle = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, tankRadius * 1.8, tankLength * 0.95),
      baffleMat
    );
    longBaffle.position.set(0, 0.46, -0.28);
    bafflesGroup.add(longBaffle);

    // Transverse Baffles (divides tank front/back)
    [-0.25, 0.25].forEach((zPos) => {
      const trans = new THREE.Mesh(
        new THREE.CylinderGeometry(tankRadius * 0.92, tankRadius * 0.92, 0.012, 24),
        baffleMat
      );
      trans.rotation.x = Math.PI / 2;
      trans.position.set(0, 0.46, -0.28 + zPos);
      bafflesGroup.add(trans);
    });

    // Liquid Sludge Simulation
    const vehicleTankLiquidGroup = new THREE.Group();
    vehicleTankLiquidRef.current = vehicleTankLiquidGroup;
    chassisGroup.add(vehicleTankLiquidGroup);

    // Mode A: Baffled Liquid (3 segmented calm compartments with dynamic surface planes)
    const baffledLiquidGroup = new THREE.Group();
    baffledLiquidGroupRef.current = baffledLiquidGroup;
    vehicleTankLiquidGroup.add(baffledLiquidGroup);

    baffledLiquidSurfacesRef.current = [];
    const compLength = tankLength / 3.2;
    const sludgeMat = new THREE.MeshStandardMaterial({
      color: 0x4a3424,
      roughness: 0.35,
      metalness: 0.2,
      transparent: true,
      opacity: 0.92
    });
    const sludgeSurfaceMat = new THREE.MeshStandardMaterial({
      color: 0x4a3424,
      map: foamTex,
      roughness: 0.32,
      metalness: 0.18,
      transparent: true,
      opacity: 0.94
    });

    [-0.38, 0, 0.38].forEach((zOffset) => {
      // Base compartment volume
      const compMesh = new THREE.Mesh(
        new THREE.BoxGeometry(tankRadius * 1.5, tankRadius * 0.75, compLength),
        sludgeMat
      );
      compMesh.position.set(0, 0.28, -0.28 + zOffset);
      baffledLiquidGroup.add(compMesh);

      // Subdivided Dynamic Top Surface Mesh for each compartment
      const surfGeo = new THREE.PlaneGeometry(tankRadius * 1.48, compLength * 0.94, 6, 6);
      surfGeo.rotateX(-Math.PI / 2);
      const surfMesh = new THREE.Mesh(surfGeo, sludgeSurfaceMat);
      surfMesh.position.set(0, 0.42, -0.28 + zOffset);
      baffledLiquidGroup.add(surfMesh);
      baffledLiquidSurfacesRef.current.push(surfMesh);
    });

    // Mode B: Unbaffled Liquid (Dynamic Multi-Point Surging Fluid)
    const unbaffledGroup = new THREE.Group();
    unbaffledLiquidRef.current = unbaffledGroup as any;
    vehicleTankLiquidGroup.add(unbaffledGroup);

    const unbaffledBase = new THREE.Mesh(
      new THREE.BoxGeometry(tankRadius * 1.55, tankRadius * 0.75, tankLength * 0.88),
      sludgeMat
    );
    unbaffledBase.position.set(0, 0.28, -0.28);
    unbaffledGroup.add(unbaffledBase);

    // Multi-vertex dynamic surging surface mesh (14x28 segments = 435 vertices!)
    const unbaffledSurfGeo = new THREE.PlaneGeometry(tankRadius * 1.55, tankLength * 0.88, 14, 28);
    unbaffledSurfGeo.rotateX(-Math.PI / 2);
    unbaffledSurfaceGeoRef.current = unbaffledSurfGeo;

    const unbaffledSurfMesh = new THREE.Mesh(unbaffledSurfGeo, sludgeSurfaceMat);
    unbaffledSurfMesh.position.set(0, 0.42, -0.28);
    unbaffledGroup.add(unbaffledSurfMesh);
    unbaffledLiquidSurfaceRef.current = unbaffledSurfMesh;

    // Aerated Sludge Froth & Foam Top Layer
    const foamGeo = new THREE.PlaneGeometry(tankRadius * 1.52, tankLength * 0.86);
    foamGeo.rotateX(-Math.PI / 2);
    const foamMat = new THREE.MeshStandardMaterial({
      map: foamTex,
      transparent: true,
      opacity: 0.65,
      roughness: 0.8
    });
    const foamMesh = new THREE.Mesh(foamGeo, foamMat);
    foamMesh.position.set(0, 0.43, -0.28);
    tankFoamMeshRef.current = foamMesh;
    vehicleTankLiquidGroup.add(foamMesh);

    // Under-Chassis LiFePO4 Solid-State Battery Bank (Low-CoM, h = 0.15m)
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(0, -0.15, 0);

    const batteryMat = new THREE.MeshStandardMaterial({
      color: isXRayMode ? 0xec4899 : 0x0f172a,
      metalness: 0.8,
      roughness: 0.3
    });
    batteryCaseMatRef.current = batteryMat;
    const batteryCase = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.14, 0.9),
      batteryMat
    );
    batteryCase.castShadow = true;
    batteryGroup.add(batteryCase);

    // Battery Warning Decal
    const batDecalMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.12),
      new THREE.MeshStandardMaterial({ map: batteryDecal, roughness: 0.3 })
    );
    batDecalMesh.rotation.x = Math.PI / 2;
    batDecalMesh.position.set(0, -0.071, 0);
    batteryGroup.add(batDecalMesh);

    // High Voltage Conduits (Orange HV Cables)
    [-0.2, 0.2].forEach((cx) => {
      const hvCable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 })
      );
      hvCable.rotation.x = Math.PI / 2;
      hvCable.position.set(cx, -0.08, -0.6);
      batteryGroup.add(hvCable);
    });

    batteryMeshRef.current = batteryCase;
    chassisGroup.add(batteryGroup);

    // Progressive Cavity Macerator Pump & Cutter Blades
    const pumpMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.34, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 })
    );
    pumpMesh.position.set(0, 0.22, -1.02);
    chassisGroup.add(pumpMesh);

    const bladeMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95 })
    );
    bladeMesh.rotation.x = Math.PI / 2;
    bladeMesh.position.set(0, 0.22, -1.18);
    maceratorBladesRef.current = bladeMesh;
    chassisGroup.add(bladeMesh);

    // Dual Hose Reels: Vacuum Hose Reel & Hydro-Jetting Auxiliary Reel
    const reelMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.32, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
    );
    reelMesh.rotation.z = Math.PI / 2;
    reelMesh.position.set(0, 0.44, -1.02);
    chassisGroup.add(reelMesh);

    // Deployable Articulated Robotic Suction Arm & Corrugated Hose
    const suctionArmGroup = new THREE.Group();
    suctionArmRef.current = suctionArmGroup;
    suctionArmGroup.position.set(0, 0.55, -1.02);
    chassisGroup.add(suctionArmGroup);

    const boomArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 })
    );
    boomArm.rotation.x = Math.PI / 4;
    boomArm.position.set(0, 0.3, -0.3);
    suctionArmGroup.add(boomArm);

    // Double-acting hydraulic cylinder on boom arm
    const boomCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.45, 12),
      galvanizedMat
    );
    boomCylinder.rotation.x = Math.PI / 3;
    boomCylinder.position.set(0.06, 0.2, -0.2);
    suctionArmGroup.add(boomCylinder);

    const hoseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 })
    );
    hoseMesh.position.set(0, -0.2, -0.6);
    suctionArmGroup.add(hoseMesh);

    // 4 Articulated Hydraulic Outrigger Stabilizer Legs with Swivel Footpads attached to Rams
    outriggersRef.current = [];
    const outriggerCoords = [
      [-0.56, 0.1, 0.75],
      [-0.56, 0.1, -0.75],
      [0.56, 0.1, 0.75],
      [0.56, 0.1, -0.75]
    ];
    outriggerCoords.forEach(([ox, oy, oz]) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(ox, oy, oz);

      // Heavy-duty outer square casing
      const casing = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.32, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85 })
      );
      legGroup.add(casing);

      // Inner telescoping chrome hydraulic ram
      const jack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.35, 12),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 })
      );
      jack.position.y = -0.06;
      legGroup.add(jack);
      outriggersRef.current.push(jack);

      // Swiveling corrugated grip footpad attached directly to the bottom of the jack ram!
      const footpad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.03, 16),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 })
      );
      footpad.position.y = -0.18;
      jack.add(footpad);

      chassisGroup.add(legGroup);
    });

    // Twin Projector LED Headlights (+Z = +1.15) & Volumetric Atmospheric Beam Cones
    headlightsLightRef.current = [];
    volumetricHeadlightsRef.current = [];
    [-0.35, 0.35].forEach((xPos) => {
      const spotLight = new THREE.SpotLight(0xfff7ed, 3.2, 38, Math.PI / 5.5, 0.35, 1);
      spotLight.position.set(xPos, 0.28, 1.15);
      const targetObj = new THREE.Object3D();
      targetObj.position.set(xPos, -0.2, 12);
      chassisGroup.add(targetObj);

      spotLight.target = targetObj;
      spotLight.castShadow = true;
      chassisGroup.add(spotLight);
      headlightsLightRef.current.push(spotLight);

      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.07, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      lens.position.set(xPos, 0.28, 1.21);
      chassisGroup.add(lens);

      // Volumetric Atmospheric Light Cone (Narrow at lens r=0.07, wide spread ahead r=1.4)
      const beamGeo = new THREE.CylinderGeometry(1.4, 0.07, 12.0, 24, 1, true);
      beamGeo.rotateX(Math.PI / 2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xfffae0,
        transparent: true,
        opacity: isNightMode ? 0.28 : 0.08,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.rotation.x = 0.042;
      beamMesh.position.set(xPos, 0.28 - 0.22, 1.15 + 6.0);
      chassisGroup.add(beamMesh);
      volumetricHeadlightsRef.current.push(beamMesh);
    });

    // Red LED Tail Lights (-Z = -1.1)
    [-0.38, 0.38].forEach((xPos) => {
      const tailLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.08, 0.04),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      tailLight.position.set(xPos, 0.1, -1.11);
      chassisGroup.add(tailLight);
    });

    // 10. Independent 4-Wheel Suspension Assemblies with Clean Axial Rotation Hubs
    const wheelPositions = [
      [-0.52, -0.06, 0.65], // FL
      [-0.52, -0.06, -0.65], // RL
      [0.52, -0.06, 0.65], // FR
      [0.52, -0.06, -0.65] // RR
    ];
    wheelsRef.current = [];
    suspensionSpringsRef.current = [];
    damperPistonsRef.current = [];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheelAssembly = new THREE.Group();
      wheelAssembly.position.set(wx, wy, wz);
      vehicleGroup.add(wheelAssembly);

      // Stationary Suspension Upright & A-Arm Wishbone
      const aArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8),
        chassisMat
      );
      aArm.rotation.z = wx > 0 ? Math.PI / 4 : -Math.PI / 4;
      aArm.position.set(wx > 0 ? -0.1 : 0.1, 0.08, 0);
      wheelAssembly.add(aArm);

      // Telescoping Shock Absorber Damper
      const damperBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.16, 12),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
      );
      damperBody.position.set(0, 0.18, 0);
      wheelAssembly.add(damperBody);

      const damperPiston = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.18, 12),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.98, roughness: 0.08 })
      );
      damperPiston.position.set(0, 0.10, 0);
      wheelAssembly.add(damperPiston);
      damperPistonsRef.current.push(damperPiston);

      // Yellow Helical Coil Spring
      const springGeo = new THREE.TubeGeometry(new HelixCurve(0.042, 0.032, 5), 36, 0.007, 8, false);
      const springMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.85,
        roughness: 0.2
      });
      const spring = new THREE.Mesh(springGeo, springMat);
      spring.position.set(0, 0.05, 0);
      wheelAssembly.add(spring);
      suspensionSpringsRef.current.push(spring);

      // Stationary Brake Caliper clamping the rotor
      const brakeCaliper = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.08, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.3 })
      );
      brakeCaliper.position.set(wx > 0 ? -0.07 : 0.07, 0.06, 0);
      wheelAssembly.add(brakeCaliper);

      // =======================================================================
      // Rotating Wheel Hub Group: spins around clean X-axis with zero wobble!
      // =======================================================================
      const wheelHub = new THREE.Group();
      wheelAssembly.add(wheelHub);
      wheelsRef.current.push(wheelHub);

      // Knobby All-Terrain Tire (oriented along X)
      const tireGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMat = new THREE.MeshStandardMaterial({
        map: tireTex.map,
        bumpMap: tireTex.bumpMap,
        bumpScale: 0.05,
        roughness: 0.92,
        metalness: 0.08
      });
      const tireMesh = new THREE.Mesh(tireGeo, tireMat);
      tireMesh.castShadow = true;
      wheelHub.add(tireMesh);

      // 5-Spoke Off-Road Alloy Rim with Emerald Accent
      const rimGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.185, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(
        rimGeo,
        new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.85, roughness: 0.2 })
      );
      wheelHub.add(rimMesh);

      // Center Hub Cap & Lug Nuts
      const capGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.19, 12);
      capGeo.rotateZ(Math.PI / 2);
      const capMesh = new THREE.Mesh(
        capGeo,
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
      );
      wheelHub.add(capMesh);

      for (let l = 0; l < 5; l++) {
        const lugAngle = (l / 5) * Math.PI * 2;
        const lugX = wx > 0 ? 0.096 : -0.096;
        const lugY = Math.sin(lugAngle) * 0.08;
        const lugZ = Math.cos(lugAngle) * 0.08;
        const lugMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.015, 0.018, 0.018),
          galvanizedMat
        );
        lugMesh.position.set(lugX, lugY, lugZ);
        wheelHub.add(lugMesh);
      }

      // Ventilated Brake Disc Rotor
      const rotorGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.015, 16);
      rotorGeo.rotateZ(Math.PI / 2);
      const brakeRotor = new THREE.Mesh(rotorGeo, galvanizedMat);
      wheelHub.add(brakeRotor);
    });

    // Center-of-Mass (CoM) Gyro Rings & Projection Laser Vector
    const comGroup = new THREE.Group();
    comCrosshairRef.current = comGroup;
    vehicleGroup.add(comGroup);

    const comSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    comGroup.add(comSphere);

    ['x', 'y', 'z'].forEach((axis) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.12, 0.14, 24),
        new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true })
      );
      if (axis === 'x') ring.rotation.y = Math.PI / 2;
      if (axis === 'y') ring.rotation.x = Math.PI / 2;
      comGroup.add(ring);
    });

    // Laser line projection down to ground footprint
    const linePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.7, 0)];
    const vectorLineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const vectorLineMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 });
    const comVectorLine = new THREE.Line(vectorLineGeo, vectorLineMat);
    comVectorLineRef.current = comVectorLine;
    comGroup.add(comVectorLine);

    // 3D Dynamic Rollover Safety Pyramid connecting Laden CoM to 4 Tire Ground Contact Points
    const pyramidGeo = new THREE.BufferGeometry();
    const pyramidPositions = new Float32Array(12 * 3);
    pyramidGeo.setAttribute('position', new THREE.BufferAttribute(pyramidPositions, 3));
    const pyramidMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const pyramidMesh = new THREE.Mesh(pyramidGeo, pyramidMat);
    vehicleGroup.add(pyramidMesh);
    rolloverPyramidRef.current = pyramidMesh;

    // Laser Edge Lines connecting Apex to 4 ground contact points
    const pyramidEdgeGeo = new THREE.BufferGeometry();
    const pyramidEdgePositions = new Float32Array(8 * 3);
    pyramidEdgeGeo.setAttribute('position', new THREE.BufferAttribute(pyramidEdgePositions, 3));
    const pyramidEdgeMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    const pyramidEdgeLines = new THREE.LineSegments(pyramidEdgeGeo, pyramidEdgeMat);
    vehicleGroup.add(pyramidEdgeLines);
    rolloverPyramidEdgesRef.current = pyramidEdgeLines;

    // Ground footprint perimeter line loop
    const footprintPts = [
      new THREE.Vector3(-0.52, -0.28, 0.65), // FL
      new THREE.Vector3(0.52, -0.28, 0.65),  // FR
      new THREE.Vector3(0.52, -0.28, -0.65), // RR
      new THREE.Vector3(-0.52, -0.28, -0.65) // RL
    ];
    const footprintGeo = new THREE.BufferGeometry().setFromPoints(footprintPts);
    const footprintMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 });
    const footprintLine = new THREE.LineLoop(footprintGeo, footprintMat);
    vehicleGroup.add(footprintLine);
    rolloverBaseLineRef.current = footprintLine;

    // 3D Floating CAD Dimension Callouts (Billboarding Sprites with zero clipping)
    const cadDimensionsGroup = new THREE.Group();
    cadDimensionsGroupRef.current = cadDimensionsGroup;
    cadDimensionsGroup.visible = showDimensions;
    vehicleGroup.add(cadDimensionsGroup);

    const dimLineMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2 });
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    const createBadgeSprite = (texture: THREE.CanvasTexture, x: number, y: number, z: number, sx = 0.82, sy = 0.26) => {
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(sx, sy, 1);
      sprite.position.set(x, y, z);
      return sprite;
    };

    // 1. Chassis Width: 1.40 m
    const widthPts = [new THREE.Vector3(-0.7, 0.42, 1.15), new THREE.Vector3(0.7, 0.42, 1.15)];
    const widthLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(widthPts), dimLineMat);
    cadDimensionsGroup.add(widthLine);
    [-0.7, 0.7].forEach((tx) => {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.12, 0.015), tickMat);
      tick.position.set(tx, 0.42, 1.15);
      cadDimensionsGroup.add(tick);
    });
    const widthBadgeTex = createCadDimensionBadge('Chassis Width', '1.40 m', 'Ultra-Narrow Alley Standard');
    const widthBadge = createBadgeSprite(widthBadgeTex, 0, 0.68, 1.15);
    cadDimensionsGroup.add(widthBadge);

    // 2. Ground Clearance: 280 mm
    const gcPts = [new THREE.Vector3(0.68, -0.28, 0.1), new THREE.Vector3(0.68, 0.0, 0.1)];
    const gcLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(gcPts), dimLineMat);
    cadDimensionsGroup.add(gcLine);
    [-0.28, 0.0].forEach((ty) => {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.015), tickMat);
      tick.position.set(0.68, ty, 0.1);
      cadDimensionsGroup.add(tick);
    });
    const gcBadgeTex = createCadDimensionBadge('Ground Clearance', '280 mm', 'High-Clearance Off-Road Spec');
    const gcBadge = createBadgeSprite(gcBadgeTex, 0.78, -0.12, 0.1);
    cadDimensionsGroup.add(gcBadge);

    // 3. Laden CoM Height: 0.42 m
    const comPts = [new THREE.Vector3(-0.68, -0.28, -0.28), new THREE.Vector3(-0.68, 0.42, -0.28)];
    const comLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(comPts), dimLineMat);
    cadDimensionsGroup.add(comLine);
    [-0.28, 0.42].forEach((ty) => {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.015), tickMat);
      tick.position.set(-0.68, ty, -0.28);
      cadDimensionsGroup.add(tick);
    });
    const comBadgeTex = createCadDimensionBadge('Laden CoM Height', '0.42 m', 'Low-CoM Anti-Rollover Center');
    const comBadge = createBadgeSprite(comBadgeTex, -0.78, 0.22, -0.28);
    cadDimensionsGroup.add(comBadge);

    // 4. Track Width: 1.10 m
    const trackPts = [new THREE.Vector3(-0.52, -0.22, 0.65), new THREE.Vector3(0.52, -0.22, 0.65)];
    const trackLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(trackPts), dimLineMat);
    cadDimensionsGroup.add(trackLine);
    [-0.52, 0.52].forEach((tx) => {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.08, 0.015), tickMat);
      tick.position.set(tx, -0.22, 0.65);
      cadDimensionsGroup.add(tick);
    });
    const trackBadgeTex = createCadDimensionBadge('Track Width', '1.10 m', 'Stout Mountain Footprint');
    const trackBadge = createBadgeSprite(trackBadgeTex, 0, -0.18, 0.88);
    cadDimensionsGroup.add(trackBadge);

    // Weather Particles (Snow / Rain)
    const weatherCount = 950;
    const weatherGeo = new THREE.BufferGeometry();
    const weatherPos = new Float32Array(weatherCount * 3);
    for (let i = 0; i < weatherCount; i++) {
      weatherPos[i * 3] = (Math.random() - 0.5) * 70;
      weatherPos[i * 3 + 1] = Math.random() * 34;
      weatherPos[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    weatherGeo.setAttribute('position', new THREE.BufferAttribute(weatherPos, 3));
    const weatherMat = new THREE.PointsMaterial({
      color: activeWeather === 'snow' ? 0xffffff : 0x38bdf8,
      size: activeWeather === 'snow' ? 0.11 : 0.065,
      transparent: true,
      opacity: 0.8
    });
    const weatherPoints = new THREE.Points(weatherGeo, weatherMat);
    weatherParticlesRef.current = weatherPoints;
    scene.add(weatherPoints);

    // Dynamic Tire Particle Trails (Dust on dry gravel / Spray on wet monsoon)
    const tireParticleCount = 200;
    const tireGeo = new THREE.BufferGeometry();
    const tirePos = new Float32Array(tireParticleCount * 3);
    const tireVel = new Float32Array(tireParticleCount * 3);
    const tireLife = new Float32Array(tireParticleCount);
    for (let i = 0; i < tireParticleCount; i++) {
      tireLife[i] = -1;
      tirePos[i * 3 + 1] = -999;
    }
    tireGeo.setAttribute('position', new THREE.BufferAttribute(tirePos, 3));
    const tireMat = new THREE.PointsMaterial({
      color: activeWeather === 'rain' ? 0x93c5fd : 0xb59e7f,
      size: activeWeather === 'rain' ? 0.09 : 0.12,
      transparent: true,
      opacity: 0.65,
      blending: activeWeather === 'rain' ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    const tirePoints = new THREE.Points(tireGeo, tireMat);
    scene.add(tirePoints);
    tireParticlesRef.current = tirePoints;
    tireParticleDataRef.current = { velocities: tireVel, lifetimes: tireLife, maxLife: 0.65 };

    // Luminous Suction Flow Stream Particles (Extraction cycle VFX)
    const flowCount = 120;
    const flowGeo = new THREE.BufferGeometry();
    const flowPos = new Float32Array(flowCount * 3);
    const flowOffsets = new Float32Array(flowCount);
    for (let i = 0; i < flowCount; i++) {
      flowOffsets[i] = i / flowCount;
      flowPos[i * 3 + 1] = -999;
    }
    flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3));
    const flowMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.13,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const flowPoints = new THREE.Points(flowGeo, flowMat);
    flowPoints.visible = false;
    scene.add(flowPoints);
    suctionFlowPointsRef.current = flowPoints;

    // Flexible Suction Hose 3D Tube mesh
    const initHoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.5, 0.5),
      new THREE.Vector3(0, 1.0, 1.0)
    ]);
    const hoseTubeGeo = new THREE.TubeGeometry(initHoseCurve, 20, 0.038, 8, false);
    const hoseTubeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.35,
      metalness: 0.3
    });
    const hoseTubeMesh = new THREE.Mesh(hoseTubeGeo, hoseTubeMat);
    hoseTubeMesh.visible = false;
    scene.add(hoseTubeMesh);
    suctionHoseTubeRef.current = hoseTubeMesh;

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 640;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. Physics & Animation Driving Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      controls.update();

      // 1. Rolling Mountain Clouds Horizontal Drift (Always face camera like soft billboard mist)
      if (cloudsGroupRef.current) {
        cloudsGroupRef.current.children.forEach((c, idx) => {
          c.position.x += delta * (0.35 + (idx % 3) * 0.12);
          if (c.position.x > 38) {
            c.position.x = -38;
          }
          c.quaternion.copy(camera.quaternion);
        });
      }

      // 2. Roadside Pine Tree Sway in Dynamic Alpine Wind Gusts
      pineTreeGroupsRef.current.forEach((tGroup, idx) => {
        const swaySpeed = 1.6 + (idx % 4) * 0.22;
        const baseAmp = activeWeatherRef.current === 'rain' ? 0.055 : activeWeatherRef.current === 'snow' ? 0.04 : 0.03;
        const gust = Math.sin(elapsed * 0.45 + idx * 0.5) * 0.4 + 0.6;
        const currentAmp = baseAmp * gust;
        tGroup.rotation.z = Math.sin(elapsed * swaySpeed + idx * 0.8) * currentAmp;
        tGroup.rotation.x = Math.cos(elapsed * (swaySpeed * 0.75) + idx) * (currentAmp * 0.6);
      });

      // 3. Vehicle Drive Physics & Stress Test Integration along Mountain Switchback
      if (roadCurveRef.current && vehicleGroupRef.current) {
        const currentStress = activeStressTestRef.current;
        const currentDrive = driveModeRef.current;
        const currentSpeed = vehicleSpeedKmhRef.current;

        // Stress Test Handling
        if (currentStress === 'hill_brake') {
          // Lock vehicle on 28° incline with hard braking deceleration
          pathProgressRef.current = THREE.MathUtils.lerp(pathProgressRef.current, 0.42, 0.08);
          stressTimerRef.current += delta;
        } else if (currentStress === 'hairpin_turn') {
          // Lock vehicle in apex of tight hairpin curve at 20 km/h
          pathProgressRef.current = THREE.MathUtils.lerp(pathProgressRef.current, 0.285, 0.06);
          stressTimerRef.current += delta;
        } else if (currentStress === 'freeze_surge') {
          // Sub-zero viscous progression
          const speedFactor = (currentSpeed / 14) * 0.018;
          pathProgressRef.current = (pathProgressRef.current + delta * speedFactor) % 1;
        } else if (currentDrive === 'auto_climb') {
          const speedFactor = (currentSpeed / 14) * 0.026;
          pathProgressRef.current = (pathProgressRef.current + delta * speedFactor) % 1;
        } else if (currentDrive === 'manual') {
          pathProgressRef.current = Math.max(
            0.01,
            Math.min(0.99, pathProgressRef.current + manualThrottleRef.current * delta * 0.035)
          );
        } else if (currentDrive === 'desludge') {
          // Park vehicle at Summit Vault (t = 0.98)
          pathProgressRef.current = THREE.MathUtils.lerp(pathProgressRef.current, 0.98, 0.05);

          // Animate Desludging Cycle Sequence
          desludgeTimerRef.current += delta;
          if (desludgeTimerRef.current < 2.0) {
            setDesludgeStage('deploying');
            // Outriggers extend downward with hydraulic clamp
            outriggersRef.current.forEach((jack) => {
              jack.position.y = THREE.MathUtils.lerp(jack.position.y, -0.28, 0.08);
            });
            // Suction arm uncoils toward vault manhole
            if (suctionArmRef.current) {
              suctionArmRef.current.rotation.x = THREE.MathUtils.lerp(
                suctionArmRef.current.rotation.x,
                -0.65,
                0.08
              );
            }
          } else if (desludgeTimerRef.current < 12.0) {
            setDesludgeStage('pumping');
            const progress = (desludgeTimerRef.current - 2.0) / 10.0;
            const pct = Math.min(100, Math.round(progress * 100));
            setDesludgeProgressPct(pct);
            const currentPumpedLiters = Math.round((pct / 100) * 400);
            setPumpedVolumeLiters(currentPumpedLiters);

            // Spin macerator cutter blades rapidly
            if (maceratorBladesRef.current) {
              maceratorBladesRef.current.rotation.z += delta * 26;
            }

            // Sludge in septic pit drops down
            if (pitLiquidRef.current) {
              pitLiquidRef.current.scale.y = Math.max(0.1, 1 - progress * 0.7);
              pitLiquidRef.current.position.y = -0.6 - progress * 0.35;
            }

            // Sludge inside vehicle holding tank fills up!
            if (vehicleTankLiquidRef.current) {
              const fillScale = 0.15 + progress * 0.85;
              vehicleTankLiquidRef.current.scale.y = fillScale;
            }

            // Real-time world positions of manhole and intake manifold
            const summitStationPt = summitGroupRef.current
              ? summitGroupRef.current.localToWorld(new THREE.Vector3(0, 0.25, 0))
              : roadCurveRef.current.getPoint(0.98).clone().add(new THREE.Vector3(0, 0.25, 0));
            const manifoldPt = vehicleGroupRef.current
              ? vehicleGroupRef.current.localToWorld(new THREE.Vector3(0, 0.55, -1.02))
              : summitStationPt.clone().add(new THREE.Vector3(0, 0.98, -1.28));

            const dynamicHoseCurve = new THREE.CatmullRomCurve3([
              summitStationPt,
              summitStationPt.clone().lerp(manifoldPt, 0.35).add(new THREE.Vector3(0, 0.55, 0)),
              summitStationPt.clone().lerp(manifoldPt, 0.70).add(new THREE.Vector3(0, 0.35, 0)),
              manifoldPt
            ]);

            // Update physical flexible suction hose tube
            if (suctionHoseTubeRef.current && (!suctionHoseTubeRef.current.visible || desludgeTimerRef.current < 2.5)) {
              suctionHoseTubeRef.current.geometry.dispose();
              suctionHoseTubeRef.current.geometry = new THREE.TubeGeometry(dynamicHoseCurve, 24, 0.038, 8, false);
              suctionHoseTubeRef.current.visible = true;
            }

            // Pumping Flow Stream Particles VFX along flexible hose
            if (suctionFlowPointsRef.current) {
              suctionFlowPointsRef.current.visible = true;
              const fGeo = suctionFlowPointsRef.current.geometry;
              const fPos = fGeo.attributes.position.array as Float32Array;

              for (let i = 0; i < 120; i++) {
                const curOffset = ((i / 120) + elapsed * 1.8) % 1.0;
                const ptOnCurve = dynamicHoseCurve.getPoint(curOffset);
                fPos[i * 3] = ptOnCurve.x + (Math.sin(elapsed * 12 + i) * 0.02);
                fPos[i * 3 + 1] = ptOnCurve.y + (Math.cos(elapsed * 12 + i) * 0.02);
                fPos[i * 3 + 2] = ptOnCurve.z + (Math.sin(elapsed * 8 + i * 2) * 0.02);
              }
              fGeo.attributes.position.needsUpdate = true;
            }

            // Pulse & animate aerated foam froth
            if (foamTexRef.current) {
              foamTexRef.current.offset.y = (foamTexRef.current.offset.y + delta * 0.25) % 1.0;
            }
            if (tankFoamMeshRef.current) {
              tankFoamMeshRef.current.scale.set(
                1.0 + Math.sin(elapsed * 14) * 0.04,
                1,
                1.0 + Math.cos(elapsed * 12) * 0.04
              );
              (tankFoamMeshRef.current.material as THREE.MeshStandardMaterial).opacity =
                0.55 + Math.sin(elapsed * 8) * 0.2;
            }

            // Audio: pump sound activates
            if (pumpGainRef.current) {
              pumpGainRef.current.gain.setValueAtTime(0.2, audioCtxRef.current?.currentTime || 0);
            }
          } else {
            setDesludgeStage('completed');
            if (suctionHoseTubeRef.current) {
              suctionHoseTubeRef.current.visible = false;
            }
            if (suctionFlowPointsRef.current) {
              suctionFlowPointsRef.current.visible = false;
            }
            if (pumpGainRef.current) {
              pumpGainRef.current.gain.setValueAtTime(0, audioCtxRef.current?.currentTime || 0);
            }
          }
        }

        // Hide flow particles & tube when not pumping
        if (currentDrive !== 'desludge') {
          if (suctionFlowPointsRef.current) suctionFlowPointsRef.current.visible = false;
          if (suctionHoseTubeRef.current) suctionHoseTubeRef.current.visible = false;
          if (vehicleTankLiquidRef.current) vehicleTankLiquidRef.current.scale.y = 1.0;
        }

        // Retract outriggers and suction arm back to travel position when not desludging
        if (driveMode !== 'desludge') {
          outriggersRef.current.forEach((jack) => {
            jack.position.y = THREE.MathUtils.lerp(jack.position.y, -0.06, 0.08);
          });
          if (suctionArmRef.current) {
            suctionArmRef.current.rotation.x = THREE.MathUtils.lerp(
              suctionArmRef.current.rotation.x,
              0.0,
              0.08
            );
          }
        }

        const t = pathProgressRef.current;
        const pt = roadCurveRef.current.getPoint(t);
        const tangent = roadCurveRef.current.getTangent(t).normalize();
        const nextPt = roadCurveRef.current.getPoint(Math.min(0.999, t + 0.005));

        vehicleGroupRef.current.position.set(pt.x, pt.y + 0.28, pt.z);

        // FORWARD ORIENTATION: (pt + tangent) ensures vehicle drives cab-first forward
        const lookTarget = pt.clone().add(tangent.clone().multiplyScalar(4));
        vehicleGroupRef.current.lookAt(lookTarget);

        // Grade & Elevation telemetry
        const gradeDeg =
          Math.atan2(tangent.y, Math.sqrt(tangent.x * tangent.x + tangent.z * tangent.z)) * (180 / Math.PI);
        const currentGradeDeg = Math.round(Math.abs(gradeDeg) * 10) / 10;
        setCurrentInclineDeg(currentGradeDeg);
        setCurrentAltitudeM(Math.round(1850 + pt.y * 30));

        // Lateral curve curvature G-force
        const baseLateralG = (nextPt.x - pt.x) * 15;
        const currentLateralG =
          activeStressTest === 'hairpin_turn' ? 0.58 : Math.round(baseLateralG * 10) / 10;
        setLateralGForce(currentLateralG);

        // Climbing mechanical power required (kW)
        const massKg = 620 + payloadLiters * 1.1;
        const inclineSin = Math.sin((Math.abs(gradeDeg) * Math.PI) / 180);
        const effectiveSpeedKmh = activeStressTest === 'hill_brake' ? 0 : vehicleSpeedKmh;
        const speedMs = (effectiveSpeedKmh * 1000) / 3600;
        const powerKw =
          activeStressTest === 'freeze_surge'
            ? 11.4
            : (massKg * 9.81 * inclineSin * speedMs) / 1000 / 0.82;
        setActivePowerKw(Math.round(powerKw * 10) / 10);

        // Rotate wheel hubs forward about their axle with ground velocity
        if (driveMode !== 'parked' && driveMode !== 'desludge' && activeStressTest !== 'hill_brake') {
          wheelsRef.current.forEach((w) => {
            w.rotation.x -= delta * (vehicleSpeedKmh / 14) * 8.0;
          });
        }

        // =====================================================================
        // Dynamic Chassis Suspension & Inertial Transfer (Pitch, Roll & Bounce)
        // =====================================================================
        const gradeRad = (gradeDeg * Math.PI) / 180;
        const throttleFactor = driveModeRef.current === 'manual' ? manualThrottleRef.current : 0.8;
        let targetPitch = -gradeRad * 0.15 - throttleFactor * 0.04;
        let targetRoll = -currentLateralG * 0.09;

        // Stress test pitch & roll spikes
        if (activeStressTestRef.current === 'hill_brake') {
          // Hard nose-dive under -4.2 m/s² deceleration
          targetPitch = !hasBafflesRef.current ? -0.22 : -0.11;
        } else if (activeStressTestRef.current === 'hairpin_turn') {
          targetRoll = !hasBafflesRef.current ? -0.16 : -0.07;
        }

        chassisPitchRef.current = THREE.MathUtils.lerp(chassisPitchRef.current, targetPitch, 0.1);
        chassisRollRef.current = THREE.MathUtils.lerp(chassisRollRef.current, targetRoll, 0.1);

        const isMoving =
          (driveModeRef.current === 'auto_climb' || driveModeRef.current === 'manual') &&
          vehicleSpeedKmhRef.current > 2 &&
          activeStressTestRef.current !== 'hill_brake';

        // Road vibration rumble / micro-bounce
        const rumble = isMoving
          ? (Math.sin(elapsed * 26) * 0.004 + Math.cos(elapsed * 38) * 0.0025) * (vehicleSpeedKmhRef.current / 14)
          : 0;

        if (chassisGroupRef.current) {
          chassisGroupRef.current.rotation.x = chassisPitchRef.current;
          chassisGroupRef.current.rotation.z = chassisRollRef.current;
          chassisGroupRef.current.position.y = rumble;
        }

        // Dynamic Spring & Damper Compression / Rebound with road rumble articulation
        if (suspensionSpringsRef.current.length === 4) {
          const p = chassisPitchRef.current * 1.8;
          const r = chassisRollRef.current * 1.8;
          const springRumble = rumble * 12;

          // FL (Front Left)
          suspensionSpringsRef.current[0].scale.y = Math.max(0.55, Math.min(1.45, 1.0 - p - r + springRumble));
          // RL (Rear Left)
          suspensionSpringsRef.current[1].scale.y = Math.max(0.55, Math.min(1.45, 1.0 + p - r - springRumble));
          // FR (Front Right)
          suspensionSpringsRef.current[2].scale.y = Math.max(0.55, Math.min(1.45, 1.0 - p + r + springRumble));
          // RR (Rear Right)
          suspensionSpringsRef.current[3].scale.y = Math.max(0.55, Math.min(1.45, 1.0 + p + r - springRumble));

          if (damperPistonsRef.current.length === 4) {
            damperPistonsRef.current[0].position.y = 0.10 * suspensionSpringsRef.current[0].scale.y;
            damperPistonsRef.current[1].position.y = 0.10 * suspensionSpringsRef.current[1].scale.y;
            damperPistonsRef.current[2].position.y = 0.10 * suspensionSpringsRef.current[2].scale.y;
            damperPistonsRef.current[3].position.y = 0.10 * suspensionSpringsRef.current[3].scale.y;
          }
        }

        // Dynamic Multi-Point Fluid Slosh Wave Physics
        if (hasBafflesRef.current) {
          // Baffled Liquid: Calm compartmentalized micro-ripples in each of the 3 chambers
          baffledLiquidSurfacesRef.current.forEach((surf, idx) => {
            const geo = surf.geometry as THREE.PlaneGeometry;
            const pAttr = geo.attributes.position;
            const waveFreq = activeStressTestRef.current === 'freeze_surge' ? 1.5 : 4.2;
            const waveAmp = activeStressTestRef.current === 'hill_brake' ? 0.005 : 0.0035;

            for (let i = 0; i < pAttr.count; i++) {
              const x = pAttr.getX(i);
              const z = pAttr.getZ(i);
              const ripple = Math.sin(elapsed * waveFreq + x * 10 + z * 12 + idx * 2.1) * waveAmp;
              const tilt = -Math.sin(gradeRad) * z * 0.012 - currentLateralG * x * 0.008;
              pAttr.setY(i, tilt + ripple);
            }
            geo.computeVertexNormals();
            pAttr.needsUpdate = true;
          });
        } else {
          // Unbaffled Liquid: Dynamic multi-point surging fluid across full tank length
          if (unbaffledSurfaceGeoRef.current) {
            const geo = unbaffledSurfaceGeoRef.current;
            const pAttr = geo.attributes.position;
            const count = pAttr.count;
            const currentTest = activeStressTestRef.current;
            const waveFreq = currentTest === 'freeze_surge' ? 1.4 : 4.8;

            for (let i = 0; i < count; i++) {
              const x = pAttr.getX(i);
              const z = pAttr.getZ(i);
              const normZ = z / (tankLength * 0.44); // -1 (rear) to +1 (front)
              const normX = x / (tankRadius * 0.7);  // -1 (left) to +1 (right)

              let surgeY = 0;
              if (currentTest === 'hill_brake') {
                // Hard deceleration on 28° incline: liquid slams violently forward
                const slamWave = Math.sin(elapsed * 6.0) * 0.07 * (normZ + 0.5);
                const forwardInertia = normZ * 0.08;
                const turbulentRipple = Math.sin(elapsed * 9.0 + normZ * 12) * 0.025 + Math.cos(elapsed * 12 + normX * 8) * 0.015;
                surgeY = forwardInertia + slamWave + turbulentRipple;
              } else if (currentTest === 'hairpin_turn') {
                // Centrifugal lateral tilt: sludge banks steeply against outer side wall
                const lateralBank = normX * 0.075;
                const sloshRoll = Math.sin(elapsed * 5.5 + normX * 10) * 0.03;
                surgeY = lateralBank + sloshRoll;
              } else if (currentTest === 'freeze_surge') {
                // High-viscosity semi-frozen sludge (shear-thickening): slow, sluggish, viscous heave
                const viscousSurge = -Math.sin(gradeRad) * normZ * 0.035;
                const sluggishWave = Math.sin(elapsed * 1.5 + normZ * 4) * 0.018;
                surgeY = viscousSurge + sluggishWave;
              } else {
                // Standard mountain ascent: gravity pulls full sludge mass backward
                const backwardPooling = -Math.sin(gradeRad) * normZ * 0.072;
                const climbingTurbulence = Math.sin(elapsed * waveFreq + normZ * 7) * 0.024 + Math.cos(elapsed * (waveFreq * 1.4) + normX * 8) * 0.012;
                surgeY = backwardPooling + climbingTurbulence;
              }
              pAttr.setY(i, surgeY);
            }
            geo.computeVertexNormals();
            pAttr.needsUpdate = true;
          }
        }

        // =====================================================================
        // Dynamic 3D Rollover Safety Pyramid & Stability Vector Calculation
        // =====================================================================
        const comY = hasLowComBatteryRef.current ? 0.42 : 0.58;
        const baseSurgeOffset = (currentSurgeCm / 100) * (slopeDegRef.current / 28.0);
        let dynamicSurgeZ = -0.28 - baseSurgeOffset;
        let dynamicSurgeX = 0;

        if (activeStressTestRef.current === 'hill_brake') {
          dynamicSurgeZ += !hasBafflesRef.current ? 0.16 : 0.02;
        } else if (activeStressTestRef.current === 'hairpin_turn') {
          dynamicSurgeX += !hasBafflesRef.current ? 0.12 : 0.02;
        }

        if (comCrosshairRef.current) {
          comCrosshairRef.current.position.set(dynamicSurgeX, comY, dynamicSurgeZ);
        }

        // Apex of Rollover Pyramid
        const apex = new THREE.Vector3(dynamicSurgeX, comY, dynamicSurgeZ);
        const pFL = new THREE.Vector3(-0.52, -0.28, 0.65);
        const pFR = new THREE.Vector3(0.52, -0.28, 0.65);
        const pRR = new THREE.Vector3(0.52, -0.28, -0.65);
        const pRL = new THREE.Vector3(-0.52, -0.28, -0.65);

        const pVerts = [
          apex.x, apex.y, apex.z, pFL.x, pFL.y, pFL.z, pFR.x, pFR.y, pFR.z,
          apex.x, apex.y, apex.z, pFR.x, pFR.y, pFR.z, pRR.x, pRR.y, pRR.z,
          apex.x, apex.y, apex.z, pRR.x, pRR.y, pRR.z, pRL.x, pRL.y, pRL.z,
          apex.x, apex.y, apex.z, pRL.x, pRL.y, pRL.z, pFL.x, pFL.y, pFL.z
        ];

        if (rolloverPyramidRef.current) {
          const pAttr = rolloverPyramidRef.current.geometry.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < pVerts.length; i++) {
            pAttr.setComponent(Math.floor(i / 3), i % 3, pVerts[i]);
          }
          pAttr.needsUpdate = true;
        }

        const edgeVerts = [
          apex.x, apex.y, apex.z, pFL.x, pFL.y, pFL.z,
          apex.x, apex.y, apex.z, pFR.x, pFR.y, pFR.z,
          apex.x, apex.y, apex.z, pRR.x, pRR.y, pRR.z,
          apex.x, apex.y, apex.z, pRL.x, pRL.y, pRL.z
        ];
        if (rolloverPyramidEdgesRef.current) {
          const eAttr = rolloverPyramidEdgesRef.current.geometry.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < edgeVerts.length; i++) {
            eAttr.setComponent(Math.floor(i / 3), i % 3, edgeVerts[i]);
          }
          eAttr.needsUpdate = true;
        }

        // Projected ground contact point of gravity vector
        const groundPlaneY = -0.28;
        const hCom = comY - groundPlaneY;
        const projectedGroundX = dynamicSurgeX + Math.tan(chassisRollRef.current) * hCom;
        const projectedGroundZ = dynamicSurgeZ - Math.tan(chassisPitchRef.current) * hCom;

        if (comVectorLineRef.current) {
          const vGeo = comVectorLineRef.current.geometry;
          vGeo.setFromPoints([apex, new THREE.Vector3(projectedGroundX, groundPlaneY, projectedGroundZ)]);
        }

        // Accurate Stability Margin to track boundary: 0.52m track width, 0.65m wheelbase from axle center
        const normX = Math.abs(projectedGroundX) / 0.52;
        const normZ = Math.abs(projectedGroundZ) / 0.65;
        const maxNorm = Math.max(normX, normZ);
        const marginPct = Math.max(0, Math.min(100, Math.round((1 - maxNorm) * 100)));
        setStabilityMarginPct(marginPct);

        let pyramidColorHex = 0x10b981; // Safe Green
        let pyramidOpacity = 0.28;
        const isHazard =
          maxNorm > 0.94 ||
          isRolloverTriggered ||
          (activeStressTestRef.current === 'hill_brake' && !hasBafflesRef.current) ||
          (activeStressTestRef.current === 'hairpin_turn' && !hasBafflesRef.current);

        if (isHazard) {
          pyramidColorHex = 0xef4444; // Danger Red
          pyramidOpacity = 0.52 + Math.sin(elapsed * 12) * 0.15;
        } else if (maxNorm > 0.72 || slopeDegRef.current > safeOperatingThreshold) {
          pyramidColorHex = 0xf59e0b; // Amber Caution
          pyramidOpacity = 0.38;
        }

        if (rolloverPyramidRef.current) {
          (rolloverPyramidRef.current.material as THREE.MeshBasicMaterial).color.setHex(pyramidColorHex);
          (rolloverPyramidRef.current.material as THREE.MeshBasicMaterial).opacity = pyramidOpacity;
        }
        if (rolloverPyramidEdgesRef.current) {
          (rolloverPyramidEdgesRef.current.material as THREE.LineBasicMaterial).color.setHex(pyramidColorHex);
        }
        if (rolloverBaseLineRef.current) {
          (rolloverBaseLineRef.current.material as THREE.LineBasicMaterial).color.setHex(pyramidColorHex);
        }
        if (comCrosshairRef.current) {
          comCrosshairRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              (child.material as THREE.MeshBasicMaterial).color.setHex(pyramidColorHex);
            }
          });
        }
        if (comVectorLineRef.current) {
          (comVectorLineRef.current.material as THREE.LineBasicMaterial).color.setHex(pyramidColorHex);
        }

        // Dynamic Tire Particle Trails (Dust / Spray behind rolling wheels)
        if (tireParticlesRef.current && tireParticleDataRef.current) {
          const pData = tireParticleDataRef.current;
          const pGeo = tireParticlesRef.current.geometry;
          const pPos = pGeo.attributes.position.array as Float32Array;
          const isMoving =
            (driveMode === 'auto_climb' || driveMode === 'manual') &&
            vehicleSpeedKmh > 2 &&
            activeStressTest !== 'hill_brake';

          const wheelLocalOffsets = [
            new THREE.Vector3(-0.52, -0.22, -0.65),
            new THREE.Vector3(0.52, -0.22, -0.65),
            new THREE.Vector3(-0.52, -0.22, 0.65),
            new THREE.Vector3(0.52, -0.22, 0.65)
          ];

          if (isMoving && vehicleGroupRef.current) {
            for (let s = 0; s < 2; s++) {
              const pIdx = Math.floor(Math.random() * 200);
              const wIdx = Math.floor(Math.random() * 4);
              const wWorld = wheelLocalOffsets[wIdx].clone().applyMatrix4(vehicleGroupRef.current.matrixWorld);

              pPos[pIdx * 3] = wWorld.x + (Math.random() - 0.5) * 0.08;
              pPos[pIdx * 3 + 1] = wWorld.y + 0.05;
              pPos[pIdx * 3 + 2] = wWorld.z + (Math.random() - 0.5) * 0.08;

              const kick = (vehicleSpeedKmhRef.current / 14) * 0.95;
              pData.velocities[pIdx * 3] = -tangent.x * kick + (Math.random() - 0.5) * 0.35;
              pData.velocities[pIdx * 3 + 1] = Math.random() * 0.65 + 0.25;
              pData.velocities[pIdx * 3 + 2] = -tangent.z * kick + (Math.random() - 0.5) * 0.35;
              pData.lifetimes[pIdx] = pData.maxLife;
            }
          }

          for (let i = 0; i < 200; i++) {
            if (pData.lifetimes[i] > 0) {
              pData.lifetimes[i] -= delta;
              pPos[i * 3] += pData.velocities[i * 3] * delta;
              pPos[i * 3 + 1] += pData.velocities[i * 3 + 1] * delta;
              pPos[i * 3 + 2] += pData.velocities[i * 3 + 2] * delta;
              pData.velocities[i * 3 + 1] -= delta * 1.3;
            } else {
              pPos[i * 3 + 1] = -999;
            }
          }
          pGeo.attributes.position.needsUpdate = true;
        }

        // Web Audio engine frequency scaling with speed
        if (engineOscRef.current && audioCtxRef.current) {
          const currentHz = 45 + vehicleSpeedKmhRef.current * 3.4;
          engineOscRef.current.frequency.setValueAtTime(currentHz, audioCtxRef.current.currentTime);
        }

        // Flash roof beacon & alarm sound on rollover hazard
        if (roofBeaconRef.current) {
          const strobe = Math.sin(elapsed * 12) > 0;
          roofBeaconRef.current.visible = strobe;
        }
        if (alarmGainRef.current && audioCtxRef.current) {
          const alarmVol = isHazard ? (Math.sin(elapsed * 10) > 0 ? 0.35 : 0) : 0;
          alarmGainRef.current.gain.setValueAtTime(alarmVol, audioCtxRef.current.currentTime);
        }

        // Camera Follow Modes (Including Wheel Cam & Cinematic Drone)
        const currentCam = cameraModeRef.current;
        if (currentCam === 'chase') {
          const chaseOffset = tangent.clone().multiplyScalar(-8.5).add(new THREE.Vector3(0, 4.2, 0));
          const targetCamPos = pt.clone().add(chaseOffset);
          camera.position.lerp(targetCamPos, 0.08);
          controls.target.lerp(pt.clone().add(new THREE.Vector3(0, 1.2, 0)), 0.1);
        } else if (currentCam === 'cockpit') {
          const cabPos = pt.clone().add(new THREE.Vector3(0, 0.72, 0)).add(tangent.clone().multiplyScalar(0.7));
          camera.position.copy(cabPos);
          controls.target.copy(pt.clone().add(tangent.clone().multiplyScalar(10)));
        } else if (currentCam === 'drone') {
          const dronePos = new THREE.Vector3(0, 34, 0);
          camera.position.lerp(dronePos, 0.04);
          controls.target.lerp(pt, 0.06);
        } else if (currentCam === 'tank') {
          const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
          const tankCamPos = pt.clone().add(normal.clone().multiplyScalar(2.8)).add(new THREE.Vector3(0, 1.2, 0));
          camera.position.lerp(tankCamPos, 0.08);
          controls.target.lerp(pt.clone().add(new THREE.Vector3(0, 0.46, -0.28)), 0.1);
        } else if (currentCam === 'desludge') {
          const summitTarget = roadCurveRef.current.getPoint(0.98);
          const desludgeCamPos = summitTarget.clone().add(new THREE.Vector3(3.8, 3.2, 3.8));
          camera.position.lerp(desludgeCamPos, 0.06);
          controls.target.lerp(summitTarget.clone().add(new THREE.Vector3(0, 0.6, 0)), 0.08);
        } else if (currentCam === 'wheel_axle') {
          // Wheel/Axle Cam: Front-Left wheel wishbone & tire articulation
          const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
          const flWheel = pt.clone().add(normal.clone().multiplyScalar(0.55)).add(tangent.clone().multiplyScalar(0.65));
          const camPos = flWheel.clone().add(normal.clone().multiplyScalar(0.95)).add(new THREE.Vector3(0, 0.45, 0)).add(tangent.clone().multiplyScalar(0.55));
          const targetPos = flWheel.clone().add(new THREE.Vector3(0, 0.05, 0)).add(normal.clone().multiplyScalar(-0.15));
          camera.position.lerp(camPos, 0.1);
          controls.target.lerp(targetPos, 0.12);
        } else if (currentCam === 'cinematic_drone') {
          // Cinematic Flyby Drone orbit around rig
          droneOrbitAngleRef.current += delta * 0.22;
          const a = droneOrbitAngleRef.current;
          const orbitR = 9.2 + Math.sin(a * 0.7) * 3.2;
          const orbitH = 4.6 + Math.cos(a * 0.5) * 2.2;
          const dronePos = pt.clone().add(new THREE.Vector3(Math.cos(a) * orbitR, orbitH, Math.sin(a) * orbitR));
          camera.position.lerp(dronePos, 0.06);
          controls.target.lerp(pt.clone().add(new THREE.Vector3(0, 0.75, 0)), 0.08);
        }
      }

      // Atmospheric Weather Particles Falling
      if (weatherPoints) {
        const wPos = weatherPoints.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < weatherCount; i++) {
          wPos[i * 3 + 1] -= delta * (activeWeatherRef.current === 'rain' ? 22 : 3.8);
          if (activeWeatherRef.current === 'snow') {
            wPos[i * 3] += Math.sin(elapsed + i) * 0.025;
          }
          if (wPos[i * 3 + 1] < -2.0) {
            wPos[i * 3 + 1] = 32;
          }
        }
        weatherPoints.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
      controls.dispose();
    };
  }, [
    terrainPreset,
    slopeDeg
  ]);

  // Audio Context unmount cleanup only
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Reactive CameraMode Toggle & OrbitControls Target Sync
  useEffect(() => {
    if (controlsRef.current) {
      if (cameraMode === 'free') {
        controlsRef.current.enabled = true;
        if (vehicleGroupRef.current) {
          controlsRef.current.target.copy(vehicleGroupRef.current.position);
        }
      } else {
        controlsRef.current.enabled = false;
      }
    }
  }, [cameraMode]);

  // Reactive Weather Particles & Atmosphere Update
  useEffect(() => {
    if (weatherParticlesRef.current) {
      const mat = weatherParticlesRef.current.material as THREE.PointsMaterial;
      mat.color.setHex(activeWeather === 'snow' ? 0xffffff : 0x38bdf8);
      mat.size = activeWeather === 'snow' ? 0.11 : 0.065;
    }
    if (tireParticlesRef.current) {
      const mat = tireParticlesRef.current.material as THREE.PointsMaterial;
      mat.color.setHex(activeWeather === 'rain' ? 0x93c5fd : 0xb59e7f);
      mat.size = activeWeather === 'rain' ? 0.09 : 0.12;
      mat.blending = activeWeather === 'rain' ? THREE.AdditiveBlending : THREE.NormalBlending;
    }
    if (sceneRef.current) {
      sceneRef.current.fog = new THREE.FogExp2(
        sceneRef.current.fog?.color.getHex() || 0x0f172a,
        terrainPreset === 'aizawl' ? 0.02 : activeWeather === 'snow' ? 0.016 : 0.01
      );
    }
  }, [activeWeather, terrainPreset]);

  // Reactive Day/Night Atmosphere & Volumetric Lighting
  useEffect(() => {
    let skyColorHex = isNightMode ? 0x050914 : 0x0f172a;
    if (terrainPreset === 'aizawl') {
      skyColorHex = isNightMode ? 0x040d12 : 0x0a221e;
    } else if (terrainPreset === 'ladakh') {
      skyColorHex = isNightMode ? 0x060c18 : 0x162334;
    }
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(skyColorHex);
      if (sceneRef.current.fog) {
        sceneRef.current.fog.color.setHex(skyColorHex);
      }
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.color.setHex(isNightMode ? 0x1e293b : 0xf8fafc);
      ambientLightRef.current.intensity = isNightMode ? 0.35 : 0.82;
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.color.setHex(isNightMode ? 0x1e3a8a : 0xbae6fd);
      hemiLightRef.current.groundColor.setHex(isNightMode ? 0x080c14 : 0x1e293b);
      hemiLightRef.current.intensity = isNightMode ? 0.25 : 0.65;
    }
    if (sunLightRef.current) {
      sunLightRef.current.color.setHex(isNightMode ? 0x60a5fa : 0xffedd5);
      sunLightRef.current.intensity = isNightMode ? 0.3 : 1.7;
    }
    volumetricHeadlightsRef.current.forEach((bm) => {
      (bm.material as THREE.MeshBasicMaterial).opacity = isNightMode ? 0.28 : 0.08;
    });
    headlightsLightRef.current.forEach((hl) => {
      hl.intensity = isNightMode ? 4.5 : 2.0;
    });
    streetLightBulbsRef.current.forEach((sl) => {
      sl.intensity = isNightMode ? 2.2 : 0.0;
    });
  }, [isNightMode, terrainPreset]);

  // Reactive X-Ray Mode Toggle
  useEffect(() => {
    if (chassisMatRef.current) {
      chassisMatRef.current.wireframe = isXRayMode;
      chassisMatRef.current.color.setHex(isXRayMode ? 0x0284c7 : 0x0f172a);
    }
    if (batteryCaseMatRef.current) {
      batteryCaseMatRef.current.color.setHex(isXRayMode ? 0xec4899 : 0x0f172a);
    }
  }, [isXRayMode]);

  // Dynamic Physics & Visual Properties Update
  useEffect(() => {
    if (!vehicleGroupRef.current) return;

    // Slosh Dynamics Toggle
    if (bafflesMeshRef.current) {
      bafflesMeshRef.current.visible = hasBaffles;
    }
    if (baffledLiquidGroupRef.current) {
      baffledLiquidGroupRef.current.visible = hasBaffles;
    }
    if (unbaffledLiquidRef.current) {
      unbaffledLiquidRef.current.visible = !hasBaffles;
    }

    // Battery Placement
    if (batteryMeshRef.current) {
      if (hasLowComBattery) {
        batteryMeshRef.current.position.set(0, -0.15, 0);
      } else {
        batteryMeshRef.current.position.set(0, 0.88, -0.28);
      }
    }

    // Center of Mass Gyro Indicator & Ground Vector Line
    if (comCrosshairRef.current) {
      const comY = hasLowComBattery ? 0.42 : 0.58;
      const surgeOffsetM = (currentSurgeCm / 100) * (slopeDeg / 28.0);
      comCrosshairRef.current.position.set(0, comY, -0.28 - surgeOffsetM);

      const colorHex = isRolloverTriggered
        ? 0xef4444
        : slopeDeg > safeOperatingThreshold
        ? 0xf59e0b
        : 0x10b981;

      comCrosshairRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          (child.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        }
      });
      if (comVectorLineRef.current && comVectorLineRef.current.material) {
        (comVectorLineRef.current.material as THREE.LineBasicMaterial).color.setHex(colorHex);
      }
    }

    // Tank Transparency
    if (tankCylinderRef.current) {
      (tankCylinderRef.current.material as THREE.MeshPhysicalMaterial).opacity = cutawayOpacity;
    }

    // 3D Floating CAD Dimensions & Rollover Safety Pyramid Visibility
    if (cadDimensionsGroupRef.current) {
      cadDimensionsGroupRef.current.visible = showDimensions;
    }
    if (rolloverPyramidRef.current) {
      rolloverPyramidRef.current.visible = showDimensions;
    }
    if (rolloverPyramidEdgesRef.current) {
      rolloverPyramidEdgesRef.current.visible = showDimensions;
    }
    if (rolloverBaseLineRef.current) {
      rolloverBaseLineRef.current.visible = showDimensions;
    }
    if (comCrosshairRef.current) {
      comCrosshairRef.current.visible = showDimensions;
    }
    if (comVectorLineRef.current) {
      comVectorLineRef.current.visible = showDimensions;
    }

    showDimensionsRef.current = showDimensions;
    activeStressTestRef.current = activeStressTest;
  }, [
    slopeDeg,
    hasBaffles,
    hasLowComBattery,
    payloadLiters,
    cutawayOpacity,
    isRolloverTriggered,
    showDimensions,
    activeStressTest
  ]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch((e) => console.warn(e));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch((e) => console.warn(e));
    }
  };

  // Interactive 1-Click Stress Test Trigger Handlers
  const runStressTest = (testType: 'none' | 'hill_brake' | 'hairpin_turn' | 'freeze_surge') => {
    setActiveStressTest(testType);
    activeStressTestRef.current = testType;
    stressTimerRef.current = 0;

    if (testType === 'hill_brake') {
      setDriveMode('manual');
      pathProgressRef.current = 0.42;
      setVehicleSpeedKmh(0);
      setSlopeDeg(28.0);
    } else if (testType === 'hairpin_turn') {
      setDriveMode('manual');
      pathProgressRef.current = 0.285;
      setVehicleSpeedKmh(20);
    } else if (testType === 'freeze_surge') {
      setDriveMode('auto_climb');
      setTerrainPreset('ladakh');
      setActiveWeather('snow');
      setSlopeDeg(30.0);
      setVehicleSpeedKmh(12);
    } else {
      setDriveMode('auto_climb');
      setVehicleSpeedKmh(14);
    }
  };

  // Launch Full Automated Desludging Mission
  const startDesludgingMission = () => {
    runStressTest('none');
    setDriveMode('desludge');
    setCameraMode('desludge');
    desludgeTimerRef.current = 0;
    setDesludgeStage('deploying');
    setDesludgeProgressPct(0);
  };

  return (
    <div className="space-y-6">
      {/* 3D Simulation Header Card */}
      <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-2.5 py-0.5 rounded flex items-center space-x-1">
                <Rotate3d className="w-3.5 h-3.5" />
                <span>SIH-26258: 3D Mechanized Desludging Simulator</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Forward Drive · Paved Mountain Switchback · Zero-Entry Desludging
              </span>
            </div>
            <h1 className="text-lg font-bold text-white mt-1 flex items-center space-x-2">
              <Mountain className="w-5 h-5 text-emerald-400" />
              <span>Full-Physics Mountain Desludging Vehicle & Septic Vault Simulation</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Simulating the 1.4m narrow mechanized desludging unit navigating extreme 20°–30° gradients. Features dual longitudinal anti-slosh baffles (-88.9% surge suppression), low-CoM under-chassis battery, and automated zero-entry extraction.
            </p>
          </div>

          {/* Quick Actions: Audio, X-Ray, Fullscreen */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={toggleAudio}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition ${
                isAudioEnabled
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Synthesized Engine & Pump Sound"
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{isAudioEnabled ? 'Sound ON' : 'Mute'}</span>
            </button>

            <button
              onClick={() => setIsXRayMode(!isXRayMode)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition ${
                isXRayMode
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Holographic Blueprint CAD Inspection View"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>{isXRayMode ? 'CAD X-Ray ON' : 'CAD X-Ray'}</span>
            </button>

            <button
              onClick={() => setShowDimensions(!showDimensions)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition ${
                showDimensions
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle 3D Floating CAD Dimension Callouts"
            >
              <Ruler className="w-4 h-4 text-cyan-400" />
              <span>{showDimensions ? '3D Specs ON' : '3D Specs'}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dynamic Rollover Alert & Telemetry Strip */}
        <div
          className={`mt-4 p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition ${
            isRolloverTriggered || stabilityMarginPct < 20
              ? 'bg-rose-950/50 border-rose-500 text-rose-200'
              : isSafeAtCurrentSlope && stabilityMarginPct >= 50
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isRolloverTriggered || stabilityMarginPct < 20
                  ? 'bg-rose-600 text-white'
                  : isSafeAtCurrentSlope && stabilityMarginPct >= 50
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {isRolloverTriggered || stabilityMarginPct < 20 ? (
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              ) : (
                <Check className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="font-bold flex items-center space-x-2">
                <span>
                  {activeStressTest === 'hill_brake'
                    ? hasBaffles
                      ? 'EMERGENCY BRAKE TEST: Baffles Prevented Liquid Surge Slam (Axle Grip Retained)'
                      : 'EMERGENCY BRAKE TEST: Unbaffled Wave Slammed Forward (Critical Wheel Slip Alert)'
                    : activeStressTest === 'hairpin_turn'
                    ? hasBaffles
                      ? 'CENTRIFUGAL HAIRPIN TEST: Dual Baffles Divided Moment (Stability Margin Maintained)'
                      : 'CENTRIFUGAL HAIRPIN TEST: Fluid Shift Outwards (Tipping Risk Imminent)'
                    : activeStressTest === 'freeze_surge'
                    ? 'SUB-ZERO FREEZE SURGE: Ladakh High-Viscosity Septage Damping Demonstrated'
                    : isRolloverTriggered
                    ? 'CRITICAL ROLLOVER DANGER: Gradient Exceeds Tipping Limit!'
                    : isSafeAtCurrentSlope
                    ? 'ASCENT STABLE: Anti-Slosh Baffles Eliminating Fluid Momentum Surge'
                    : 'CAUTION: Steep Alpine Gradient'}
                </span>
                <span className="font-mono text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                  Instant Grade: {currentInclineDeg}°
                </span>
              </div>
              <p className="text-[11px] opacity-90 mt-0.5">
                {isRolloverTriggered
                  ? `Critical tipping limit (${criticalRolloverAngle}°) breached. Fluid shifted vehicle center-of-mass outside track base.`
                  : `Rated safe operating threshold: 28.0° with 400L liquid sludge payload. Laden CoM: 0.42m above ground · 3D Safety Pyramid Active.`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 font-mono shrink-0">
            <div className="bg-slate-900/90 px-2.5 py-1 rounded border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 block">Stability Margin</span>
              <span
                className={`text-sm font-bold ${
                  stabilityMarginPct >= 50
                    ? 'text-emerald-400'
                    : stabilityMarginPct >= 25
                    ? 'text-amber-400'
                    : 'text-rose-400 animate-pulse'
                }`}
              >
                {stabilityMarginPct}%
              </span>
            </div>
            <div className="bg-slate-900/90 px-2.5 py-1 rounded border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 block">Elevation</span>
              <span className="text-sm font-bold text-white">{currentAltitudeM} m</span>
            </div>
            <div className="bg-slate-900/90 px-2.5 py-1 rounded border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 block">Motor Power</span>
              <span className="text-sm font-bold text-emerald-400">{activePowerKw} kW</span>
            </div>
            <div className="bg-slate-900/90 px-2.5 py-1 rounded border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 block">Lateral G</span>
              <span className="text-sm font-bold text-cyan-400">{lateralGForce} G</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Viewport & Interactive HUD */}
      <div
        className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl h-[650px]"
        ref={containerRef}
      >
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

        {/* Top-Right Telemetry & Sensor HUD */}
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-3 text-xs shadow-xl w-64 pointer-events-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Ascent Telemetry</span>
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono border border-emerald-800">
              60 FPS
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Road Gradient:</span>
              <span className="text-white font-bold">{currentInclineDeg}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ground Speed:</span>
              <span className="text-emerald-400 font-bold">{vehicleSpeedKmh} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payload Volume:</span>
              <span className="text-slate-200">
                {driveMode === 'desludge' ? `${pumpedVolumeLiters}L / 400L` : `${payloadLiters}L (440 kg)`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Anti-Slosh Baffles:</span>
              <span className="text-emerald-400 font-bold">
                {hasBaffles ? 'ACTIVE (-88.9%)' : 'DISABLED (SURGE)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Liquid Surge Shift:</span>
              <span className={hasBaffles ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                +{currentSurgeCm} cm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Center of Mass Height:</span>
              <span className="text-slate-200 font-bold">{hasLowComBattery ? '0.42 m' : '0.58 m'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Critical Tip Limit:</span>
              <span className="text-white font-bold">{criticalRolloverAngle.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Rollover Stability:</span>
              <span
                className={`font-bold ${
                  stabilityMarginPct >= 50
                    ? 'text-emerald-400'
                    : stabilityMarginPct >= 25
                    ? 'text-amber-400'
                    : 'text-rose-400 animate-pulse'
                }`}
              >
                {stabilityMarginPct}%
              </span>
            </div>
            {activeStressTest !== 'none' && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-800">
                <span className="text-[10px] text-amber-400 font-bold block">
                  STRESS TEST: {activeStressTest.toUpperCase().replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-300 block">
                  {activeStressTest === 'hill_brake'
                    ? hasBaffles
                      ? 'Damping: 94.4% · Forward surge restricted'
                      : 'WARNING: Fluid slammed front wall!'
                    : activeStressTest === 'hairpin_turn'
                    ? hasBaffles
                      ? 'Ix = I0/9 · Safe lateral vector'
                      : 'WARNING: Fluid tilting outward!'
                    : '1400 cP Viscous Damping · PMAC 11.4 kW'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top-Center Interactive 1-Click Engineering Stress Scenarios Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-2 text-xs shadow-xl pointer-events-auto flex items-center space-x-2 z-10">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1 pl-1 pr-1 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Stress Tests:</span>
          </span>
          <button
            onClick={() => runStressTest(activeStressTest === 'hill_brake' ? 'none' : 'hill_brake')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center space-x-1 ${
              activeStressTest === 'hill_brake'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Simulates rapid braking on a 28° slope to prove baffle surge suppression"
          >
            <span>Hill Brake (28°)</span>
          </button>
          <button
            onClick={() => runStressTest(activeStressTest === 'hairpin_turn' ? 'none' : 'hairpin_turn')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center space-x-1 ${
              activeStressTest === 'hairpin_turn'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Simulates 20 km/h sharp hairpin turn to test lateral anti-rollover pyramid stability"
          >
            <span>Hairpin Turn (20 km/h)</span>
          </button>
          <button
            onClick={() => runStressTest(activeStressTest === 'freeze_surge' ? 'none' : 'freeze_surge')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center space-x-1 ${
              activeStressTest === 'freeze_surge'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Simulates -15°C sub-zero high-viscosity sludge (1400 cP) sluggish slosh"
          >
            <span>Sub-Zero Freeze Surge</span>
          </button>
          {activeStressTest !== 'none' && (
            <button
              onClick={() => runStressTest('none')}
              className="px-2 py-1 rounded text-[10px] font-bold bg-slate-800 text-slate-400 hover:text-white transition"
              title="Reset to Standard Ascent"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Top-Left Drive & Mission Command Panel */}
        <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-3 text-xs shadow-xl pointer-events-auto space-y-2.5 max-w-sm">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Drive & Mission Control</span>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                driveMode === 'auto_climb'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : driveMode === 'desludge'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                  : driveMode === 'manual'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {driveMode === 'auto_climb'
                ? 'AUTO-CLIMB'
                : driveMode === 'desludge'
                ? 'DESLUDGING'
                : driveMode === 'manual'
                ? 'MANUAL (WASD)'
                : 'PARKED'}
            </span>
          </div>

          {/* Drive Mode Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setDriveMode(driveMode === 'auto_climb' ? 'parked' : 'auto_climb')}
              className={`flex-1 py-1.5 rounded font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                driveMode === 'auto_climb'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {driveMode === 'auto_climb' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{driveMode === 'auto_climb' ? 'Halt' : 'Auto Climb'}</span>
            </button>

            <button
              onClick={startDesludgingMission}
              className={`flex-1 py-1.5 rounded font-bold text-xs flex items-center justify-center space-x-1 transition ${
                driveMode === 'desludge'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
              }`}
              title="Deploy Outriggers & Unfurl Suction Hose to Desludge Pit"
            >
              <Droplet className="w-3.5 h-3.5" />
              <span>Desludge Pit</span>
            </button>

            <button
              onClick={() => setDriveMode('manual')}
              className={`px-2.5 py-1.5 rounded font-semibold text-xs transition ${
                driveMode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Manual
            </button>
          </div>

          {/* Desludging Operation Progress Modal/Card */}
          {driveMode === 'desludge' && (
            <div className="p-2.5 bg-slate-950 border border-cyan-800/60 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-cyan-400 font-bold flex items-center space-x-1">
                  <Droplet className="w-3.5 h-3.5 animate-bounce" />
                  <span>
                    {desludgeStage === 'deploying'
                      ? 'Deploying Stabilizers & Hose...'
                      : desludgeStage === 'pumping'
                      ? 'Pumping Viscous Sludge...'
                      : 'Extraction Complete!'}
                  </span>
                </span>
                <span className="text-white font-bold">{desludgeProgressPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${desludgeProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Transferred: {pumpedVolumeLiters}L / 400L</span>
                <span>Vacuum: -0.78 bar</span>
                <span>Flow: 82 L/min</span>
              </div>
            </div>
          )}

          {/* Manual Drive Controls (Arrow buttons + WASD info) */}
          {driveMode === 'manual' && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-center space-x-2">
                <button
                  onMouseDown={() => { manualThrottleRef.current = -1; }}
                  onMouseUp={() => { manualThrottleRef.current = 0; }}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  title="Reverse Downhill (Down / S)"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onMouseDown={() => { manualThrottleRef.current = 1; }}
                  onMouseUp={() => { manualThrottleRef.current = 0; }}
                  className="p-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  title="Accelerate Uphill (Up / W)"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { pathProgressRef.current = 0.05; }}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Reset to Valley Base (R)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-1">Use W/S or Up/Down arrow keys</p>
            </div>
          )}

          {/* Speed Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-mono">
              <span className="text-slate-400">Ascent Speed:</span>
              <span className="text-emerald-400 font-bold">{vehicleSpeedKmh} km/h</span>
            </div>
            <input
              type="range"
              min="4"
              max="28"
              step="1"
              value={vehicleSpeedKmh}
              onChange={(e) => setVehicleSpeedKmh(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Camera View Switcher Buttons */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5 flex items-center space-x-1">
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Perspective</span>
            </span>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => setCameraMode('chase')}
                className={`py-1 px-1 text-[10px] font-semibold rounded text-center transition ${
                  cameraMode === 'chase' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Third-person chase camera"
              >
                Chase Cam
              </button>
              <button
                onClick={() => setCameraMode('cockpit')}
                className={`py-1 px-1 text-[10px] font-semibold rounded text-center transition ${
                  cameraMode === 'cockpit' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Driver cab interior perspective"
              >
                Cockpit
              </button>
              <button
                onClick={() => setCameraMode('tank')}
                className={`py-1 px-1 text-[10px] font-semibold rounded text-center transition ${
                  cameraMode === 'tank' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Lateral cutaway view of fluid & baffles"
              >
                Tank Cut
              </button>
              <button
                onClick={() => setCameraMode('desludge')}
                className={`py-1 px-1 text-[10px] font-semibold rounded text-center transition ${
                  cameraMode === 'desludge' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Septic vault summit station view"
              >
                Vault
              </button>
              <button
                onClick={() => setCameraMode('wheel_axle')}
                className={`py-1 px-1 text-[10px] font-semibold rounded text-center transition ${
                  cameraMode === 'wheel_axle' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Low-angle front wishbone and wheel articulation"
              >
                Wheel Cam
              </button>
              <button
                onClick={() => setCameraMode('cinematic_drone')}
                className={`py-1 px-1 text-[10px] font-semibold rounded text-center transition ${
                  cameraMode === 'cinematic_drone' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Dynamic orbiting flyby drone camera"
              >
                Flyby Drone
              </button>
              <button
                onClick={() => setCameraMode('drone')}
                className={`py-1 px-1 text-[10px] font-semibold rounded text-center transition ${
                  cameraMode === 'drone' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Top-down aerial drone view"
              >
                Aerial
              </button>
              <button
                onClick={() => setCameraMode('free')}
                className={`py-1 px-1 text-[10px] font-semibold rounded text-center transition ${
                  cameraMode === 'free' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Free mouse orbit & pan control"
              >
                Free Orbit
              </button>
            </div>
          </div>
        </div>

        {/* Bottom-Left Slope & Hardware Inspection Controls */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-3 text-xs shadow-xl space-y-2 pointer-events-auto max-w-sm">
          {/* Mountain Gradient Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-mono">
              <span className="text-slate-400">Mountain Slope Gradient:</span>
              <span className={`font-bold ${slopeDeg > 28 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {slopeDeg.toFixed(1)}° ({Math.round(Math.tan((slopeDeg * Math.PI) / 180) * 100)}%)
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              step="0.5"
              value={slopeDeg}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSlopeDeg(val);
                if (setSite) {
                  setSite((prev) => ({ ...prev, slope_degrees: val }));
                }
              }}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Hardware Toggles */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-1 gap-1.5 text-[11px]">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-200">
              <input
                type="checkbox"
                checked={hasBaffles}
                onChange={(e) => setHasBaffles(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-0"
              />
              <span>Dual Longitudinal Anti-Slosh Baffles</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-slate-200">
              <input
                type="checkbox"
                checked={hasLowComBattery}
                onChange={(e) => setHasLowComBattery(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-0"
              />
              <span>Under-Chassis Low CoM Battery Pack</span>
            </label>
          </div>
        </div>

        {/* Bottom-Right Environment & Regional Preset Switcher */}
        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-2.5 text-xs shadow-xl flex flex-wrap items-center gap-3 pointer-events-auto">
          {/* Regional Terrain Presets */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zone:</span>
            </span>
            <button
              onClick={() => {
                setTerrainPreset('shimla');
                setSlopeDeg(28.0);
                setActiveWeather('clear');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                terrainPreset === 'shimla' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Shimla (28°)
            </button>
            <button
              onClick={() => {
                setTerrainPreset('aizawl');
                setSlopeDeg(24.0);
                setActiveWeather('rain');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                terrainPreset === 'aizawl' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Aizawl Monsoon
            </button>
            <button
              onClick={() => {
                setTerrainPreset('ladakh');
                setSlopeDeg(30.0);
                setActiveWeather('snow');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                terrainPreset === 'ladakh' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Ladakh Sub-Zero
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Day / Night Mode Toggle */}
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition ${
              isNightMode ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-amber-300'
            }`}
          >
            {isNightMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span>{isNightMode ? 'Night' : 'Day'}</span>
          </button>

          {/* Weather Toggle */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveWeather('snow')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                activeWeather === 'snow' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
              title="Snow Particles"
            >
              <Snowflake className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveWeather('rain')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                activeWeather === 'rain' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
              title="Monsoon Rain"
            >
              <CloudRain className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Sub-Assembly CAD & Engineering Inspection Toolbar */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-white flex items-center space-x-1.5 uppercase tracking-wider font-mono">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Interactive Sub-Assembly CAD Inspector:</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Click component to inspect engineering design & statutory compliance
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'none', label: 'Overview' },
            { id: 'tank', label: '400L Sludge Vacuum Tank' },
            { id: 'baffles', label: 'Dual Anti-Slosh Baffles' },
            { id: 'battery', label: 'Low-CoM LiFePO4 Battery' },
            { id: 'macerator', label: 'Macerator & Cavity Pump' },
            { id: 'outriggers', label: 'Hydraulic Outriggers' },
            { id: 'suction_arm', label: 'Articulated Suction Arm' },
            { id: 'vault', label: 'Kath-Kuni Septic Station' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedCallout(item.id as any);
                if (item.id === 'tank' || item.id === 'baffles') {
                  setCameraMode('tank');
                } else if (item.id === 'vault') {
                  setCameraMode('desludge');
                }
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                selectedCallout === item.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900 border border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Selected Callout Deep Engineering Card */}
        {selectedCallout !== 'none' && (
          <div className="mt-3 p-3.5 bg-slate-950/80 rounded-lg border border-emerald-500/30 text-xs space-y-2">
            {selectedCallout === 'tank' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Vacuum Holding Vessel</span>
                  <span className="text-emerald-400 font-bold">400 Liters (440 kg septage)</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Grade 316 stainless steel cylinder with dished hemispherical ends.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Operating Vacuum</span>
                  <span className="text-cyan-400 font-bold">-0.78 to -0.85 bar (-25 inHg)</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Dual-stage rotary vane vacuum generation with 1.5 bar safety blow-off valve.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Chassis Weight Balance</span>
                  <span className="text-amber-400 font-bold">Laden CoM: 0.42m</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Rigidly mounted between front and rear axles to preserve 50:50 axle weight distribution.</p>
                </div>
              </div>
            )}
            {selectedCallout === 'baffles' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Free-Surface Suppression</span>
                  <span className="text-emerald-400 font-bold">I_x = I_0 / 9 (-88.9%)</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Dual longitudinal divider plates segment fluid surface moment into 3 independent inertia cells.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Dynamic Fluid Surge</span>
                  <span className="text-cyan-400 font-bold">0.9 cm (vs 7.9 cm unbaffled)</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Calibrated 15mm equalization ports dampen longitudinal fluid mass transfer on 28° ramps.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Critical Tip Threshold</span>
                  <span className="text-emerald-400 font-bold">34.2° Rollover Limit</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Prevents hazardous fluid pooling at rear tank head during steep mountain ascent.</p>
                </div>
              </div>
            )}
            {selectedCallout === 'battery' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Battery Chemistry</span>
                  <span className="text-emerald-400 font-bold">LiFePO4 (Solid-State Array)</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">48V nominal · 200Ah capacity · 12.8 kWh usable storage with integrated BMS.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Sub-Chassis Placement</span>
                  <span className="text-cyan-400 font-bold">Mounting Height: h = 0.15m</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Heavy 65kg pack placed below chassis rails directly counteracts tank mass high-center.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Environmental Ingress</span>
                  <span className="text-amber-400 font-bold">IP68 Waterproof Sealed</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Withstands deep mountain water crossings, monsoon mud, and sub-zero Ladakh freezing.</p>
                </div>
              </div>
            )}
            {selectedCallout === 'macerator' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Chopper Mechanism</span>
                  <span className="text-amber-400 font-bold">Tungsten-Carbide Cutter</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">High-torque rotary blades reduce non-biodegradable municipal trash to &lt;12mm fragments.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Progressive Cavity Pump</span>
                  <span className="text-cyan-400 font-bold">82 L/min @ 35m High-Head</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Positive displacement design handles high-viscosity septage up to 14% total solids.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Drive Motor</span>
                  <span className="text-emerald-400 font-bold">3.5 kW Brushless PMAC</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Integrated electronic jam-reversal sensor automatically clears fibrous obstructions.</p>
                </div>
              </div>
            )}
            {selectedCallout === 'outriggers' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Stabilizer Configuration</span>
                  <span className="text-emerald-400 font-bold">4x Double-Acting Cylinders</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Telescoping chrome rams extend to anchor vehicle chassis firmly to road bedrock.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Hydraulic Clamping Force</span>
                  <span className="text-cyan-400 font-bold">180 Bar Clamping Pressure</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Dual pilot-operated check valves maintain lock even during complete hydraulic line loss.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Articulated Footpads</span>
                  <span className="text-amber-400 font-bold">±18° Ball-Joint Swivel</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Corrugated steel anti-slip footpads seat securely on uneven mountain rocks and icy tarmac.</p>
                </div>
              </div>
            )}
            {selectedCallout === 'suction_arm' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Robotic Boom Reach</span>
                  <span className="text-cyan-400 font-bold">4.5m Radius · 6.0m Depth</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Electro-hydraulic 2-segment articulated boom arm maneuvers hose directly over pit manhole.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Zero-Entry Compliance</span>
                  <span className="text-emerald-400 font-bold">100% Mechanized Extraction</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Section 7 &amp; 9, Prohibition of Employment as Manual Scavengers Act 2013 strictly enforced.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Gas Safety Interlock</span>
                  <span className="text-emerald-400 font-bold">H2S &amp; CH4 Multi-Gas Sensors</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Continuous digital telemetry prevents ignition in volatile toxic sewer environments.</p>
                </div>
              </div>
            )}
            {selectedCallout === 'vault' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Station Location</span>
                  <span className="text-emerald-400 font-bold">Summit Station (1850m Altitude)</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Serves clustered terraced Himalayan mountain settlement without sewer grid infrastructure.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Road Infrastructure</span>
                  <span className="text-cyan-400 font-bold">W-Beam Guardrails &amp; Pucca Drain</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Engineered switchback roadway with roadside stormwater drainage channels.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Vernacular Architecture</span>
                  <span className="text-amber-400 font-bold">Kath-Kuni Hillside Cottages</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Traditional dressed stone foundations, deodar timber balconies, and corrugated CGI tin roofs.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Engineering Innovation Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 shadow">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4" />
            <span>Dual Longitudinal Baffles (-88.9% Free-Surface)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Standard vacuum tanks suffer from liquid sloshing where fluid surges to the rear on steep mountain ramps, shifting the Center of Mass and triggering backward rollover. Our dual longitudinal baffles partition the 400L tank into 3 isolated chambers, cutting the free-surface moment of area by <strong>88.9% (I₀/9)</strong> and restricting liquid surge to just <strong>0.9 cm</strong>.
          </p>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 shadow">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Sliders className="w-4 h-4" />
            <span>Under-Chassis LiFePO4 Battery (34.2° Tip Limit)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Placing the 65 kg lithium iron phosphate battery pack beneath the chassis floor (height h = 0.15m) lowers the entire vehicle laden Center-of-Mass to <strong>0.42 m</strong> above ground. This achieves a verified <strong>34.2° critical rollover tipping angle</strong>, safely clearing Shimla and Mussoorie 20°–28° hillside access ramps.
          </p>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 shadow">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Entry Robotic Extraction Mandate</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Fully compliant with the <strong>Prohibition of Employment as Manual Scavengers Act 2013</strong>. Deployable hydraulic outriggers stabilize the rig on uneven terrain while an articulated suction wand and high-head progressive cavity pump extract dense septage without any worker entering confined toxic spaces.
          </p>
        </div>
      </div>
    </div>
  );
};
