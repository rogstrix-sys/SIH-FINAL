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
  ArrowLeft,
  ArrowRight,
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
  Sparkles,
  Box,
  Lock,
  Unlock,
  AlertOctagon,
  HardHat,
  Cog,
  CheckCircle2
} from 'lucide-react';
import { SiteConditions, EquipmentRecommendation } from '../types';
import { useSimulationStore } from '../store/useSimulationStore';
import { BhavyamDashboardView } from './BhavyamDashboardView';
import {
  PistonOperatingMode,
  SludgeCompactionParameters,
  DEFAULT_COMPACTION_PARAMS
} from '../types/sludgeCompaction';
import {
  calculateBoreAreaM2,
  calculateCylinderForceKn,
  calculateContactStrokeMm,
  calculateDewateringState
} from '../utils/sludgeCompactionModel';
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
  createCloudTexture,
  createCrawlerTrackTexture,
  createIndianParapetTexture,
  createBROSignTexture,
  createBROMilestoneTexture,
  createTibetanPrayerFlagsTexture
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

export type MountainWorkflowStage =
  | '1_DRIVE_TO_SITE'
  | '2_POSITION_VEHICLE'
  | '3_DEPLOY_STABILIZERS_HOSE'
  | '4_PRIME_PUMP'
  | '5_EXTRACT_SLUDGE'
  | '6_SETTLE_SLUDGE'
  | '7_COMPACT_SLUDGE'
  | '8_SECURE_PISTON'
  | '9_CONFIRM_TRANSPORT_READY'
  | '10_RESUME_DRIVING';

export interface MountainWorkflowStepDef {
  id: MountainWorkflowStage;
  num: number;
  name: string;
  shortName: string;
  description: string;
}

export const MOUNTAIN_WORKFLOW_STEPS: MountainWorkflowStepDef[] = [
  {
    id: '1_DRIVE_TO_SITE',
    num: 1,
    name: 'Drive to Mountain Worksite',
    shortName: '1. Drive',
    description: 'Tracked vehicle travels along switchback road to worksite waypoint.'
  },
  {
    id: '2_POSITION_VEHICLE',
    num: 2,
    name: 'Stop & Position Vehicle',
    shortName: '2. Position',
    description: 'Vehicle stops and aligns intake manifold with septic vault manhole.'
  },
  {
    id: '3_DEPLOY_STABILIZERS_HOSE',
    num: 3,
    name: 'Deploy Stabilizers & Hose',
    shortName: '3. Deploy',
    description: 'Plant hydraulic outriggers to ground and articulate suction boom.'
  },
  {
    id: '4_PRIME_PUMP',
    num: 4,
    name: 'Prime Extraction Pump',
    shortName: '4. Prime',
    description: 'Engage macerator and rotary positive-displacement pump vacuum.'
  },
  {
    id: '5_EXTRACT_SLUDGE',
    num: 5,
    name: 'Extract Sludge to Tank',
    shortName: '5. Extract',
    description: 'Vacuum transfer 400 L sludge from source vault into vehicle tank.'
  },
  {
    id: '6_SETTLE_SLUDGE',
    num: 6,
    name: 'Stop Pump & Allow Settling',
    shortName: '6. Settle',
    description: 'Disengage pump and allow gravitational solids clarification.'
  },
  {
    id: '7_COMPACT_SLUDGE',
    num: 7,
    name: 'Compact Sludge In-Situ',
    shortName: '7. Compact',
    description: 'Extend hydraulic piston to press sludge cake and express liquid filtrate.'
  },
  {
    id: '8_SECURE_PISTON',
    num: 8,
    name: 'Retract & Secure Piston',
    shortName: '8. Secure',
    description: 'Return platen to 0 mm, engage retention pins, and stow boom.'
  },
  {
    id: '9_CONFIRM_TRANSPORT_READY',
    num: 9,
    name: 'Confirm Transport Readiness',
    shortName: '9. Ready',
    description: 'Verify 0mm retention, outriggers stowed, and certified roadworthiness.'
  },
  {
    id: '10_RESUME_DRIVING',
    num: 10,
    name: 'Resume Driving',
    shortName: '10. Resume',
    description: 'Re-engage crawler tracks and resume mountain transit.'
  }
];

interface Simulation3DProps {
  site: SiteConditions;
  setSite?: React.Dispatch<React.SetStateAction<SiteConditions>>;
  topChoice?: EquipmentRecommendation;
  onSwitchToVaultSim?: () => void;
  onSwitchToCanyonSim?: () => void;
}

export const Simulation3D: React.FC<Simulation3DProps> = ({
  site,
  setSite,
  topChoice,
  onSwitchToVaultSim,
  onSwitchToCanyonSim
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Geographic & Climatic Indian Himalayan preset options (Uttarakhand Ghats, Himachal Alpine, Ladakh High-Pass)
  const [terrainPreset, setTerrainPreset] = useState<
    'uttarakhand' | 'himachal' | 'ladakh' | 'shimla' | 'aizawl'
  >('uttarakhand');
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
    'none' | 'hill_brake' | 'hairpin_turn' | 'freeze_surge' | 'muddy_traction' | 'narrow_alley'
  >('none');
  const [stabilityMarginPct, setStabilityMarginPct] = useState<number>(85);
  const [selectedCallout, setSelectedCallout] = useState<
    'none' | 'tank' | 'baffles' | 'battery' | 'macerator' | 'outriggers' | 'suction_arm' | 'vault' | 'piston'
  >('none');

  // Worksite waypoint selection & multi-stage sequenced mission
  const [selectedWorksite, setSelectedWorksite] = useState<'alley' | 'station' | 'summit'>('summit');
  const [missionStage, setMissionStage] = useState<
    'idle' | 'positioning' | 'stabilizing' | 'deploying_boom' | 'priming' | 'extracting' | 'settling' | 'compacting' | 'securing' | 'ready_to_travel'
  >('idle');
  const [isEStopActive, setIsEStopActive] = useState<boolean>(false);
  const [interlockWarning, setInterlockWarning] = useState<string | null>(null);

  // 10-Stage Mountain Mission Workflow state
  const [workflowStage, setWorkflowStage] = useState<MountainWorkflowStage>('1_DRIVE_TO_SITE');
  const [isAutoWorkflowRunning, setIsAutoWorkflowRunning] = useState<boolean>(false);
  const [sourceVaultVolumeL, setSourceVaultVolumeL] = useState<number>(1200);
  const [collectionTankVolumeL, setCollectionTankVolumeL] = useState<number>(0);
  const [extractionRateLpm, setExtractionRateLpm] = useState<number>(0.0);
  const [suctionVacuumKpa, setSuctionVacuumKpa] = useState<number>(0.0);
  const [isTransportReady, setIsTransportReady] = useState<boolean>(true);

  // Hydraulic Sludge-Compaction Piston & Dewatering state
  const [pistonMode, setPistonMode] = useState<PistonOperatingMode>('LOCKED');
  const [pistonStrokeMm, setPistonStrokeMm] = useState<number>(0);
  const [appliedPressureBar, setAppliedPressureBar] = useState<number>(0);
  const [compactionForceKn, setCompactionForceKn] = useState<number>(0);
  const [cakeVolumeL, setCakeVolumeL] = useState<number>(400);
  const [filtrateVolumeL, setFiltrateVolumeL] = useState<number>(0);
  const [compactionRatio, setCompactionRatio] = useState<number>(1.0);
  const [isTransportLocked, setIsTransportLocked] = useState<boolean>(true);
  const [sludgeType, setSludgeType] = useState<'septage' | 'raw_sludge' | 'digested_biosolids'>('septage');
  const [maxStrokeLimitMm, setMaxStrokeLimitMm] = useState<number>(600);
  const [reliefPressureLimitBar, setReliefPressureLimitBar] = useState<number>(180);
  const [isReliefValveOpen, setIsReliefValveOpen] = useState<boolean>(false);

  // Bhavyam SCADA Dashboard Unified Layout & Store Integration
  const storeCompactionTelemetry = useSimulationStore((s) => s.compactionTelemetry);
  const setStoreCompactionStrokePct = useSimulationStore((s) => s.setCompactionStrokePct);
  const [displayLayout, setDisplayLayout] = useState<'3d' | 'split' | 'scada'>('split');

  // Synchronize 3D Piston model with unified useSimulationStore / Bhavyam SCADA
  useEffect(() => {
    if (storeCompactionTelemetry) {
      setPistonStrokeMm(storeCompactionTelemetry.strokeMm);
      pistonStrokeMmRef.current = storeCompactionTelemetry.strokeMm;
      setPistonMode(storeCompactionTelemetry.pistonState);
      pistonModeRef.current = storeCompactionTelemetry.pistonState;
      setIsTransportLocked(storeCompactionTelemetry.isTransportLocked);
      isTransportLockedRef.current = storeCompactionTelemetry.isTransportLocked;
      setAppliedPressureBar(storeCompactionTelemetry.appliedPressureBar);
      setCompactionForceKn(storeCompactionTelemetry.compactionForceKn);
    }
  }, [
    storeCompactionTelemetry?.strokeMm,
    storeCompactionTelemetry?.pistonState,
    storeCompactionTelemetry?.isTransportLocked,
    storeCompactionTelemetry?.appliedPressureBar,
    storeCompactionTelemetry?.compactionForceKn
  ]);

  // Desludging operation sequence state
  const [desludgeStage, setDesludgeStage] = useState<'idle' | 'deploying' | 'pumping' | 'completed'>('idle');
  const [desludgeProgressPct, setDesludgeProgressPct] = useState<number>(0);
  const [pumpedVolumeLiters, setPumpedVolumeLiters] = useState<number>(0);

  // Telemetry state
  const [currentAltitudeM, setCurrentAltitudeM] = useState<number>(1850);
  const [currentInclineDeg, setCurrentInclineDeg] = useState<number>(28.0);
  const [lateralGForce, setLateralGForce] = useState<number>(0.0);
  const [activePowerKw, setActivePowerKw] = useState<number>(8.4);
  const [measuredFps, setMeasuredFps] = useState<number>(60);
  const [measuredFrameTimeMs, setMeasuredFrameTimeMs] = useState<number>(16.6);

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
  const levelSightFloatRef = useRef<THREE.Mesh | null>(null);
  const trackBeltMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const trackCleatsRef = useRef<Array<{ mesh: THREE.Group; baseU: number; side?: 'left' | 'right' }>>([]);
  const trackProgressRef = useRef<number>(0);
  const trackProfileCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const lidarTurretRef = useRef<THREE.Mesh | null>(null);
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
  const tankMatRef = useRef<THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial | null>(null);
  const batteryCaseMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const foamTexRef = useRef<THREE.CanvasTexture | null>(null);

  // Hydraulic Compaction Piston 3D References
  const compactionPlatenRef = useRef<THREE.Group | null>(null);
  const pistonRodRef = useRef<THREE.Mesh | null>(null);
  const filtrateMeshRef = useRef<THREE.Mesh | null>(null);
  const pistonLockPinsRef = useRef<THREE.Mesh[]>([]);
  const pistonStatusLedRef = useRef<THREE.Mesh | null>(null);
  const tankWorkLightRef = useRef<THREE.PointLight | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());

  // Worksite Waypoint 3D References
  const alleyGroupRef = useRef<THREE.Group | null>(null);
  const alleyManholeRef = useRef<THREE.Mesh | null>(null);
  const serviceGroupRef = useRef<THREE.Group | null>(null);
  const serviceManholeRef = useRef<THREE.Mesh | null>(null);

  // Dynamic chassis pitch & roll simulation refs
  const chassisPitchRef = useRef<number>(0);
  const chassisRollRef = useRef<number>(0);
  const fluidSloshAngleRef = useRef<number>(0);
  const droneOrbitAngleRef = useRef<number>(0);
  const stressTimerRef = useRef<number>(0);
  const activeStressTestRef = useRef<'none' | 'hill_brake' | 'hairpin_turn' | 'freeze_surge' | 'muddy_traction' | 'narrow_alley'>('none');
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
  const selectedWorksiteRef = useRef(selectedWorksite);
  const pistonModeRef = useRef<PistonOperatingMode>(pistonMode);
  const pistonStrokeMmRef = useRef<number>(pistonStrokeMm);
  const isTransportLockedRef = useRef<boolean>(isTransportLocked);
  const isEStopActiveRef = useRef<boolean>(isEStopActive);
  const sludgeTypeRef = useRef(sludgeType);
  const maxStrokeLimitMmRef = useRef(maxStrokeLimitMm);
  const reliefPressureLimitBarRef = useRef(reliefPressureLimitBar);
  const isReliefValveOpenRef = useRef(isReliefValveOpen);
  const interlockWarningTimeoutRef = useRef<any>(null);

  // 10-Stage Mountain Mission Workflow refs
  const workflowStageRef = useRef<MountainWorkflowStage>(workflowStage);
  const isAutoWorkflowRunningRef = useRef<boolean>(isAutoWorkflowRunning);
  const workflowTimerRef = useRef<number>(0);
  const sourceVaultVolumeLRef = useRef<number>(sourceVaultVolumeL);
  const collectionTankVolumeLRef = useRef<number>(collectionTankVolumeL);
  const extractionRateLpmRef = useRef<number>(extractionRateLpm);
  const suctionVacuumKpaRef = useRef<number>(suctionVacuumKpa);
  const isTransportReadyRef = useRef<boolean>(isTransportReady);

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
  selectedWorksiteRef.current = selectedWorksite;
  pistonModeRef.current = pistonMode;
  pistonStrokeMmRef.current = pistonStrokeMm;
  isTransportLockedRef.current = isTransportLocked;
  isEStopActiveRef.current = isEStopActive;
  sludgeTypeRef.current = sludgeType;
  maxStrokeLimitMmRef.current = maxStrokeLimitMm;
  reliefPressureLimitBarRef.current = reliefPressureLimitBar;
  isReliefValveOpenRef.current = isReliefValveOpen;
  workflowStageRef.current = workflowStage;
  isAutoWorkflowRunningRef.current = isAutoWorkflowRunning;
  sourceVaultVolumeLRef.current = sourceVaultVolumeL;
  collectionTankVolumeLRef.current = collectionTankVolumeL;
  extractionRateLpmRef.current = extractionRateLpm;
  suctionVacuumKpaRef.current = suctionVacuumKpa;
  isTransportReadyRef.current = isTransportReady;

  // Vehicle progress tracking
  const pathProgressRef = useRef<number>(0.12);
  const manualThrottleRef = useRef<number>(0);
  const manualSteerRef = useRef<number>(0);
  const lateralOffsetRef = useRef<number>(0);
  const trackProgressLeftRef = useRef<number>(0);
  const trackProgressRightRef = useRef<number>(0);
  const leftWheelsRef = useRef<THREE.Group[]>([]);
  const rightWheelsRef = useRef<THREE.Group[]>([]);
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
        if (pistonStrokeMmRef.current > 5 || !isTransportLockedRef.current) {
          setInterlockWarning('TRANSPORT INTERLOCK: Platen extended! Return to 0mm & engage Lock Pins before driving.');
          return;
        }
        manualThrottleRef.current = 1;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (pistonStrokeMmRef.current > 5 || !isTransportLockedRef.current) {
          setInterlockWarning('TRANSPORT INTERLOCK: Platen extended! Return to 0mm & engage Lock Pins before driving.');
          return;
        }
        manualThrottleRef.current = -1;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        manualSteerRef.current = -1;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        manualSteerRef.current = 1;
      } else if (e.key === ' ') {
        manualThrottleRef.current = 0;
        manualSteerRef.current = 0;
      } else if (e.key === 'r' || e.key === 'R') {
        pathProgressRef.current = 0.05;
        lateralOffsetRef.current = 0;
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
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'a' ||
        e.key === 'A' ||
        e.key === 'ArrowRight' ||
        e.key === 'd' ||
        e.key === 'D'
      ) {
        manualSteerRef.current = 0;
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
    const height = container.clientHeight || 820;

    // 1. Scene & Photorealistic Atmospheric Sky
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    let skyColorHex = isNightMode ? 0x050914 : 0x0f172a;
    if (terrainPreset === 'uttarakhand' || terrainPreset === 'aizawl') {
      skyColorHex = isNightMode ? 0x040d12 : 0x0b2520; // Garhwal misty valley emerald tint
    } else if (terrainPreset === 'ladakh') {
      skyColorHex = isNightMode ? 0x060c18 : 0x1a2638; // Cold high-altitude crystalline blue-grey
    } else if (terrainPreset === 'himachal' || terrainPreset === 'shimla') {
      skyColorHex = isNightMode ? 0x050916 : 0x0f1d30; // Alpine deodar pine sky
    }
    scene.background = new THREE.Color(skyColorHex);
    scene.fog = new THREE.FogExp2(
      skyColorHex,
      terrainPreset === 'uttarakhand' ? 0.009 : terrainPreset === 'ladakh' ? 0.006 : activeWeather === 'snow' ? 0.010 : 0.007
    );

    // 2. Camera with Expansive 700m Mountain Sightlines
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 700);
    cameraRef.current = camera;
    camera.position.set(0, 16, 42);

    // 3. Renderer with High Dynamic Range Lighting & Soft Shadows
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.minDistance = 2.0;
    controls.maxDistance = 280.0;
    controls.target.set(0, 8, 0);

    // 5. Directional Sun, Sky Ambient & Rim Lights (Optimized Focused Shadow Coverage)
    const ambientLight = new THREE.AmbientLight(
      isNightMode ? 0x1e293b : 0xf8fafc,
      isNightMode ? 0.38 : 0.86
    );
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const hemiLight = new THREE.HemisphereLight(
      isNightMode ? 0x1e3a8a : 0xbae6fd,
      isNightMode ? 0x080c14 : 0x1e293b,
      isNightMode ? 0.28 : 0.68
    );
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const sunLight = new THREE.DirectionalLight(
      isNightMode ? 0x60a5fa : 0xffedd5,
      isNightMode ? 0.35 : 1.75
    );
    sunLight.position.set(65, 95, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0002;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 280;
    sunLight.shadow.camera.left = -68;
    sunLight.shadow.camera.right = 68;
    sunLight.shadow.camera.top = 68;
    sunLight.shadow.camera.bottom = -68;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Mountain & Environment Group
    const mountainGroup = new THREE.Group();
    mountainGroupRef.current = mountainGroup;
    scene.add(mountainGroup);

    // Procedural PBR Textures
    const asphaltTex = createAsphaltTextures(terrainPreset);
    asphaltTex.map.repeat.set(1, 36);
    asphaltTex.bumpMap.repeat.set(1, 36);
    asphaltTex.roughnessMap.repeat.set(1, 36);

    const rockTex = createRockTextures(terrainPreset);
    rockTex.map.repeat.set(12, 12);
    rockTex.bumpMap.repeat.set(12, 12);
    rockTex.roughnessMap.repeat.set(12, 12);

    const indianParapetTex = createIndianParapetTexture();
    indianParapetTex.map.repeat.set(1, 1);
    indianParapetTex.bumpMap.repeat.set(1, 1);

    const prayerFlagsTex = createTibetanPrayerFlagsTexture();
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
      new THREE.Vector3(0, 0.4 * slopeScaleY, 52),      // Valley River Base Depot
      new THREE.Vector3(-14.0, 3.2 * slopeScaleY, 38),  // Lower Forest sweep
      new THREE.Vector3(-18.5, 6.8 * slopeScaleY, 22),  // Hairpin 1: 180° switchback
      new THREE.Vector3(-4.0, 10.2 * slopeScaleY, 10),  // Ridge traversal 1
      new THREE.Vector3(16.0, 14.0 * slopeScaleY, 0),   // Hairpin 2: mid-cliff switchback
      new THREE.Vector3(18.5, 18.2 * slopeScaleY, -14), // Precipice shelf traversal
      new THREE.Vector3(4.0, 22.0 * slopeScaleY, -26),  // Hairpin 3: high mountain switchback
      new THREE.Vector3(-12.0, 25.5 * slopeScaleY, -36),// Upper pine forest sweep
      new THREE.Vector3(-6.0, 28.2 * slopeScaleY, -46), // Mountain village approach
      new THREE.Vector3(0, 29.5 * slopeScaleY, -52)     // Summit Septic Containment Vault
    ];

    const roadCurve = new THREE.CatmullRomCurve3(roadWaypoints, false, 'catmullrom', 0.15);
    roadCurveRef.current = roadCurve;

    // 7. Prominently Visible Indian Mountain Road: Wide Asphalt (3.6m), Solid Engineered Retaining Wall Embankment, Dual Gravel Shoulders, Indian Black/White Parapets, BRO Milestones & Slogan Signboards
    const roadSegments = 360;
    const roadWidth = 3.6;
    const shoulderWidth = 0.50;
    const roadYOffset = 0.38; // Raised cleanly above mountain terrain
    const curvePoints = roadCurve.getPoints(roadSegments);

    const roadGeo = new THREE.BufferGeometry();
    const roadVerts: number[] = [];
    const roadNorms: number[] = [];
    const roadUvs: number[] = [];
    const roadIdx: number[] = [];

    // Outer Stone Retaining Wall Embankment (masonry wall supporting road above slope)
    const embGeo = new THREE.BufferGeometry();
    const embVerts: number[] = [];
    const embNorms: number[] = [];
    const embUvs: number[] = [];
    const embIdx: number[] = [];

    // Dual Gravel Road Shoulders
    const shGeo = new THREE.BufferGeometry();
    const shVerts: number[] = [];
    const shNorms: number[] = [];
    const shIdx: number[] = [];

    // Continuous W-Beam Steel Crash Barrier Ribbon (for Himachal preset)
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

    const indianParapetMat = new THREE.MeshStandardMaterial({
      map: indianParapetTex.map,
      bumpMap: indianParapetTex.bumpMap,
      bumpScale: 0.05,
      roughness: 0.85,
      metalness: 0.12,
      side: THREE.DoubleSide
    });

    const parapetBlockGeo = new THREE.BoxGeometry(0.85, 0.65, 0.35);

    // Instanced roadside fixtures (massive performance optimization: ~350 draw calls -> 4 instanced draw calls)
    const studTransforms: THREE.Matrix4[] = [];
    const parapetTransforms: THREE.Matrix4[] = [];
    const parapetDotTransforms: THREE.Matrix4[] = [];
    const parapetDotColors: THREE.Color[] = [];
    const postTransforms: THREE.Matrix4[] = [];
    const delineatorTransforms: THREE.Matrix4[] = [];
    const delineatorColors: THREE.Color[] = [];
    const guardStoneTransforms: THREE.Matrix4[] = [];

    // Dedicated Road Surface Markings Overlay (Razor-Sharp Outer White Lines & Centerline Dashes)
    const markVerts: number[] = [];
    const markColors: number[] = [];
    const markIdx: number[] = [];

    for (let i = 0; i <= roadSegments; i++) {
      const t = i / roadSegments;
      const pt = curvePoints[i];
      const tangent = roadCurve.getTangent(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const leftPt = pt.clone().add(normal.clone().multiplyScalar(roadWidth / 2));
      const rightPt = pt.clone().add(normal.clone().multiplyScalar(-roadWidth / 2));

      // 1. Road Tarmac Bed with UV mapping (U: 0 to 1 across width; V: t along length)
      roadVerts.push(leftPt.x, leftPt.y + roadYOffset, leftPt.z);
      roadVerts.push(rightPt.x, rightPt.y + roadYOffset, rightPt.z);
      roadNorms.push(0, 1, 0, 0, 1, 0);
      roadUvs.push(0, t, 1, t);

      // 2. Outer Deep Stone Retaining Wall Embankment (supports road into bedrock)
      const wallTop = leftPt.clone().setY(leftPt.y + roadYOffset);
      const wallBottom = leftPt.clone().add(normal.clone().multiplyScalar(0.42)).setY(leftPt.y + roadYOffset - 1.8);
      embVerts.push(wallTop.x, wallTop.y, wallTop.z);
      embVerts.push(wallBottom.x, wallBottom.y, wallBottom.z);
      embNorms.push(normal.x, 0.2, normal.z, normal.x, 0.2, normal.z);
      embUvs.push(0, t * 18, 1, t * 18);

      // 3. Dual Gravel Road Shoulders
      const outerShoulderEdge = leftPt.clone().add(normal.clone().multiplyScalar(shoulderWidth));
      const innerShoulderEdge = rightPt.clone().add(normal.clone().multiplyScalar(-shoulderWidth));
      shVerts.push(leftPt.x, leftPt.y + roadYOffset - 0.01, leftPt.z);
      shVerts.push(outerShoulderEdge.x, outerShoulderEdge.y + roadYOffset - 0.03, outerShoulderEdge.z);
      shVerts.push(rightPt.x, rightPt.y + roadYOffset - 0.01, rightPt.z);
      shVerts.push(innerShoulderEdge.x, innerShoulderEdge.y + roadYOffset - 0.03, innerShoulderEdge.z);
      shNorms.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);

      // 4. Retroreflective Cat-Eye Road Studs along centerline every 4 segments (Collected for single-draw instancing)
      if (i % 4 === 0) {
        const studMat4 = new THREE.Matrix4();
        const sRot = new THREE.Matrix4().makeRotationY(Math.atan2(tangent.x, tangent.z));
        const sPos = new THREE.Matrix4().makeTranslation(pt.x, pt.y + roadYOffset + 0.02, pt.z);
        studMat4.multiplyMatrices(sPos, sRot);
        studTransforms.push(studMat4);
      }

      // Precision Roadmarkings Quads (Outer White Lines & Dashed Yellow Centerline)
      const leftEdgeOuter = leftPt.clone().add(normal.clone().multiplyScalar(-0.06)).setY(leftPt.y + roadYOffset + 0.005);
      const leftEdgeInner = leftPt.clone().add(normal.clone().multiplyScalar(-0.16)).setY(leftPt.y + roadYOffset + 0.005);
      const rightEdgeInner = rightPt.clone().add(normal.clone().multiplyScalar(0.16)).setY(rightPt.y + roadYOffset + 0.005);
      const rightEdgeOuter = rightPt.clone().add(normal.clone().multiplyScalar(0.06)).setY(rightPt.y + roadYOffset + 0.005);

      const centerL = pt.clone().add(normal.clone().multiplyScalar(0.05)).setY(pt.y + roadYOffset + 0.005);
      const centerR = pt.clone().add(normal.clone().multiplyScalar(-0.05)).setY(pt.y + roadYOffset + 0.005);

      const baseMarkIdx = markVerts.length / 3;
      markVerts.push(
        leftEdgeOuter.x, leftEdgeOuter.y, leftEdgeOuter.z,
        leftEdgeInner.x, leftEdgeInner.y, leftEdgeInner.z,
        rightEdgeInner.x, rightEdgeInner.y, rightEdgeInner.z,
        rightEdgeOuter.x, rightEdgeOuter.y, rightEdgeOuter.z,
        centerL.x, centerL.y, centerL.z,
        centerR.x, centerR.y, centerR.z
      );
      markColors.push(
        0.95, 0.95, 0.95,  0.95, 0.95, 0.95,
        0.95, 0.95, 0.95,  0.95, 0.95, 0.95,
        0.98, 0.78, 0.12,  0.98, 0.78, 0.12
      );

      if (i < roadSegments) {
        markIdx.push(baseMarkIdx, baseMarkIdx + 6, baseMarkIdx + 1);
        markIdx.push(baseMarkIdx + 1, baseMarkIdx + 6, baseMarkIdx + 7);
        markIdx.push(baseMarkIdx + 2, baseMarkIdx + 8, baseMarkIdx + 3);
        markIdx.push(baseMarkIdx + 3, baseMarkIdx + 8, baseMarkIdx + 9);
        if ((i % 6) < 3) {
          markIdx.push(baseMarkIdx + 4, baseMarkIdx + 10, baseMarkIdx + 5);
          markIdx.push(baseMarkIdx + 5, baseMarkIdx + 10, baseMarkIdx + 11);
        }
      }

      // 5. REGIONAL ROADSIDE SAFETY BARRIERS (Collected for instancing):
      const grEdge = leftPt.clone().add(normal.clone().multiplyScalar(0.22));
      const grBaseY = grEdge.y + roadYOffset;

      if (terrainPreset === 'uttarakhand' || terrainPreset === 'aizawl') {
        // --- UTTARAKHAND: Iconic Indian Hill Road Black & White Concrete Safety Parapet Blocks ---
        if (i % 2 === 0) {
          const pMat4 = new THREE.Matrix4();
          const pRot = new THREE.Matrix4().makeRotationY(Math.atan2(tangent.x, tangent.z));
          const pPos = new THREE.Matrix4().makeTranslation(grEdge.x, grBaseY + 0.32, grEdge.z);
          pMat4.multiplyMatrices(pPos, pRot);
          parapetTransforms.push(pMat4);

          const dMat4 = new THREE.Matrix4();
          const dLocal = new THREE.Matrix4().multiplyMatrices(
            new THREE.Matrix4().makeTranslation(0, 0.14, 0.18),
            new THREE.Matrix4().makeRotationX(Math.PI / 2)
          );
          dMat4.multiplyMatrices(pMat4, dLocal);
          parapetDotTransforms.push(dMat4);
          parapetDotColors.push(new THREE.Color(i % 4 === 0 ? 0xef4444 : 0xfacc15));
        }
      } else if (terrainPreset === 'ladakh') {
        // --- LADAKH: Drystone Guard Boulders + Tibetan 5-Color Prayer Flags at Passes ---
        if (i % 3 === 0) {
          const gsMat4 = new THREE.Matrix4();
          const gsPos = new THREE.Matrix4().makeTranslation(grEdge.x, grBaseY + 0.28, grEdge.z);
          const gsRot = new THREE.Matrix4().makeRotationFromEuler(
            new THREE.Euler((i * 0.4) % Math.PI, (i * 0.7) % Math.PI, 0)
          );
          gsMat4.multiplyMatrices(gsPos, gsRot);
          guardStoneTransforms.push(gsMat4);
        }

        // Tibetan Prayer Flag Mast Assemblies at Switchback Curves (i = 80, 180, 264) and Summit (i = 350)
        if (i === 80 || i === 180 || i === 264 || i === 350) {
          const mastGroup = new THREE.Group();
          mastGroup.position.set(grEdge.x, grBaseY, grEdge.z);
          mountainGroup.add(mastGroup);

          // Weathered Himalayan Cedar / Juniper Pass Pole
          const mast = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.10, 5.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
          );
          mast.position.y = 2.6;
          mast.castShadow = true;
          mastGroup.add(mast);

          // White Khata ceremonial scarf wrapped at pole joint
          const khata = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8),
            new THREE.MeshBasicMaterial({ color: 0xf8fafc })
          );
          khata.position.y = 4.8;
          mastGroup.add(khata);

          // Fluttering 5-Color Tibetan Prayer Flags Banner (Lungta)
          const flagBannerGeo = new THREE.PlaneGeometry(3.6, 0.9, 8, 2);
          const flagBannerMat = new THREE.MeshStandardMaterial({
            map: prayerFlagsTex,
            roughness: 0.85,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95
          });
          const flagBanner = new THREE.Mesh(flagBannerGeo, flagBannerMat);
          flagBanner.position.set(1.6, 4.3, 0);
          flagBanner.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI / 6;
          mastGroup.add(flagBanner);
        }
      } else {
        // --- HIMACHAL: Galvanized W-Beam Crash Barrier Ribbon ---
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

        if (i % 6 === 0) {
          const postMat4 = new THREE.Matrix4().makeTranslation(grEdge.x, grBaseY + 0.38, grEdge.z);
          postTransforms.push(postMat4);

          const delMat4 = new THREE.Matrix4().makeTranslation(grEdge.x, grBaseY + 0.78, grEdge.z);
          delineatorTransforms.push(delMat4);
          delineatorColors.push(new THREE.Color(i % 12 === 0 ? 0xef4444 : 0xfacc15));
        }
      }

      // 6. Concrete Drainage Gutter along inner cliff wall (Universal in Indian Ghats)
      const drainEdge = rightPt.clone().add(normal.clone().multiplyScalar(-0.04));
      const drainBottom = drainEdge.clone().add(normal.clone().multiplyScalar(-0.18)).setY(drainEdge.y + roadYOffset - 0.16);
      const drainWall = drainEdge.clone().add(normal.clone().multiplyScalar(-0.38)).setY(drainEdge.y + roadYOffset + 0.02);

      drainVerts.push(drainEdge.x, drainEdge.y + roadYOffset, drainEdge.z);
      drainVerts.push(drainBottom.x, drainBottom.y, drainBottom.z);
      drainVerts.push(drainWall.x, drainWall.y, drainWall.z);

      // Hairpin Curve Chevron Hazard Boards at apexes
      const isHairpinApex = (i >= 76 && i <= 88 && i % 4 === 0) ||
                            (i >= 174 && i <= 186 && i % 4 === 0) ||
                            (i >= 258 && i <= 270 && i % 4 === 0);
      if (isHairpinApex) {
        const chevronBoard = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, 0.45, 0.03),
          new THREE.MeshStandardMaterial({
            color: 0xef4444,
            roughness: 0.3,
            metalness: 0.4
          })
        );
        const chevPos = leftPt.clone().add(normal.clone().multiplyScalar(0.75)).setY(leftPt.y + roadYOffset + 0.9);
        chevronBoard.position.set(chevPos.x, chevPos.y, chevPos.z);
        chevronBoard.lookAt(pt);
        mountainGroup.add(chevronBoard);

        const chevArrow = new THREE.Mesh(
          new THREE.PlaneGeometry(0.55, 0.28),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        chevArrow.position.set(0, 0, 0.02);
        chevronBoard.add(chevArrow);
      }

      // Quads indexing: Counter-clockwise winding (+Y face normal upwards)
      if (i < roadSegments) {
        const v = i * 2;
        roadIdx.push(v, v + 2, v + 1); // CRITICAL FIX: Counter-clockwise (+Y normal up, eliminates transparency culling)
        roadIdx.push(v + 1, v + 2, v + 3);

        // Embankment Quads
        const eV = i * 2;
        embIdx.push(eV, eV + 2, eV + 1);
        embIdx.push(eV + 1, eV + 2, eV + 3);

        // Shoulders Quads
        const sV = i * 4;
        shIdx.push(sV, sV + 4, sV + 1);
        shIdx.push(sV + 1, sV + 4, sV + 5);
        shIdx.push(sV + 2, sV + 6, sV + 3);
        shIdx.push(sV + 3, sV + 6, sV + 7);

        // Guardrail Ribbon Quads (if Himachal)
        if (terrainPreset === 'himachal' || terrainPreset === 'shimla') {
          const grV = i * 5;
          for (let s = 0; s < 4; s++) {
            grIdx.push(grV + s, grV + s + 1, grV + s + 5);
            grIdx.push(grV + s + 1, grV + s + 6, grV + s + 5);
          }
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
    roadGeo.computeVertexNormals();

    // 100% Solid & Opaque PBR Road Material with Polygon Offset to guarantee 0 z-fighting and 0 culling
    const roadMat = new THREE.MeshStandardMaterial({
      map: asphaltTex.map,
      bumpMap: asphaltTex.bumpMap,
      bumpScale: 0.08,
      roughnessMap: asphaltTex.roughnessMap,
      roughness: 0.82,
      metalness: 0.14,
      side: THREE.DoubleSide, // CRITICAL: Never culled by camera angles
      polygonOffset: true,
      polygonOffsetFactor: -3.0,
      polygonOffsetUnits: -4.0,
      depthWrite: true,
      depthTest: true
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    mountainGroup.add(roadMesh);

    // Outer Stone Retaining Wall Embankment Mesh
    embGeo.setAttribute('position', new THREE.Float32BufferAttribute(embVerts, 3));
    embGeo.setAttribute('normal', new THREE.Float32BufferAttribute(embNorms, 3));
    embGeo.setAttribute('uv', new THREE.Float32BufferAttribute(embUvs, 2));
    embGeo.setIndex(embIdx);
    embGeo.computeVertexNormals();
    const embMesh = new THREE.Mesh(
      embGeo,
      new THREE.MeshStandardMaterial({
        map: stoneWallTex,
        roughness: 0.88,
        metalness: 0.15,
        side: THREE.DoubleSide
      })
    );
    embMesh.castShadow = true;
    embMesh.receiveShadow = true;
    mountainGroup.add(embMesh);

    // Dual Gravel Road Shoulders Mesh
    shGeo.setAttribute('position', new THREE.Float32BufferAttribute(shVerts, 3));
    shGeo.setAttribute('normal', new THREE.Float32BufferAttribute(shNorms, 3));
    shGeo.setIndex(shIdx);
    const shMesh = new THREE.Mesh(
      shGeo,
      new THREE.MeshStandardMaterial({
        color: terrainPreset === 'ladakh' ? 0xa89984 : 0x8a7f72,
        roughness: 0.95,
        metalness: 0.05,
        side: THREE.DoubleSide
      })
    );
    shMesh.receiveShadow = true;
    mountainGroup.add(shMesh);

    // Guardrail Ribbon Mesh (if Himachal)
    if ((terrainPreset === 'himachal' || terrainPreset === 'shimla') && grVerts.length > 0) {
      grGeo.setAttribute('position', new THREE.Float32BufferAttribute(grVerts, 3));
      grGeo.setAttribute('normal', new THREE.Float32BufferAttribute(grNorms, 3));
      grGeo.setIndex(grIdx);
      const grMesh = new THREE.Mesh(grGeo, galvanizedMat);
      grMesh.castShadow = true;
      mountainGroup.add(grMesh);
    }

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

    // 7A. Precision Road Surface Markings Mesh (White Edge Lines & Dashed Yellow Centerline)
    if (markVerts.length > 0) {
      const markGeo = new THREE.BufferGeometry();
      markGeo.setAttribute('position', new THREE.Float32BufferAttribute(markVerts, 3));
      markGeo.setAttribute('color', new THREE.Float32BufferAttribute(markColors, 3));
      markGeo.setIndex(markIdx);
      markGeo.computeVertexNormals();

      const markMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4.0,
        polygonOffsetUnits: -5.0,
        depthTest: true,
        depthWrite: true
      });
      const markMesh = new THREE.Mesh(markGeo, markMat);
      mountainGroup.add(markMesh);
    }

    // Instanced Cat-Eye Reflective Road Studs (Single Draw Call)
    if (studTransforms.length > 0) {
      const studGeo = new THREE.BoxGeometry(0.12, 0.04, 0.12);
      const studMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        roughness: 0.15,
        metalness: 0.85,
        emissive: 0x78350f,
        emissiveIntensity: 0.45
      });
      const studInstanced = new THREE.InstancedMesh(studGeo, studMat, studTransforms.length);
      studTransforms.forEach((m, idx) => studInstanced.setMatrixAt(idx, m));
      studInstanced.instanceMatrix.needsUpdate = true;
      mountainGroup.add(studInstanced);
    }

    // Instanced Parapet Blocks & Hazard Dots (Uttarakhand/Aizawl)
    if (parapetTransforms.length > 0) {
      const parapetInstanced = new THREE.InstancedMesh(parapetBlockGeo, indianParapetMat, parapetTransforms.length);
      parapetTransforms.forEach((m, idx) => parapetInstanced.setMatrixAt(idx, m));
      parapetInstanced.castShadow = true;
      parapetInstanced.receiveShadow = true;
      parapetInstanced.instanceMatrix.needsUpdate = true;
      mountainGroup.add(parapetInstanced);

      const dotGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8);
      const dotMat = new THREE.MeshBasicMaterial();
      const dotInstanced = new THREE.InstancedMesh(dotGeo, dotMat, parapetDotTransforms.length);
      parapetDotTransforms.forEach((m, idx) => {
        dotInstanced.setMatrixAt(idx, m);
        dotInstanced.setColorAt(idx, parapetDotColors[idx]);
      });
      dotInstanced.instanceMatrix.needsUpdate = true;
      if (dotInstanced.instanceColor) dotInstanced.instanceColor.needsUpdate = true;
      mountainGroup.add(dotInstanced);
    }

    // Instanced Guard Stones (Ladakh)
    if (guardStoneTransforms.length > 0) {
      const gsGeo = new THREE.DodecahedronGeometry(0.44, 1);
      const gsMat = new THREE.MeshStandardMaterial({
        map: rockTex.map,
        roughness: 0.88,
        metalness: 0.15
      });
      const gsInstanced = new THREE.InstancedMesh(gsGeo, gsMat, guardStoneTransforms.length);
      guardStoneTransforms.forEach((m, idx) => gsInstanced.setMatrixAt(idx, m));
      gsInstanced.castShadow = true;
      gsInstanced.receiveShadow = true;
      gsInstanced.instanceMatrix.needsUpdate = true;
      mountainGroup.add(gsInstanced);
    }

    // Instanced Guardrail Posts & Delineators (Himachal)
    if (postTransforms.length > 0) {
      const postGeo = new THREE.BoxGeometry(0.08, 0.76, 0.08);
      const postInstanced = new THREE.InstancedMesh(postGeo, galvanizedMat, postTransforms.length);
      postTransforms.forEach((m, idx) => postInstanced.setMatrixAt(idx, m));
      postInstanced.castShadow = true;
      postInstanced.instanceMatrix.needsUpdate = true;
      mountainGroup.add(postInstanced);

      const delGeo = new THREE.BoxGeometry(0.06, 0.14, 0.03);
      const delMat = new THREE.MeshBasicMaterial();
      const delInstanced = new THREE.InstancedMesh(delGeo, delMat, delineatorTransforms.length);
      delineatorTransforms.forEach((m, idx) => {
        delInstanced.setMatrixAt(idx, m);
        delInstanced.setColorAt(idx, delineatorColors[idx]);
      });
      delInstanced.instanceMatrix.needsUpdate = true;
      if (delInstanced.instanceColor) delInstanced.instanceColor.needsUpdate = true;
      mountainGroup.add(delInstanced);
    }

    // Rockfall Hazard Catch Drapery Netting along steep Himalayan cuttings
    [-1, 1].forEach((side) => {
      const netGeo = new THREE.PlaneGeometry(16, 5.5, 10, 5);
      const netMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        wireframe: true,
        metalness: 0.88,
        roughness: 0.35,
        side: THREE.DoubleSide
      });
      const netMesh = new THREE.Mesh(netGeo, netMat);
      if (side === -1) {
        netMesh.position.set(-18.5, 7.8 * slopeScaleY, 20);
        netMesh.rotation.y = Math.PI / 4.2;
      } else {
        netMesh.position.set(16.8, 15.2 * slopeScaleY, -2);
        netMesh.rotation.y = -Math.PI / 3.8;
      }
      mountainGroup.add(netMesh);
    });

    // 7B. AUTHENTIC BORDER ROADS ORGANISATION (BRO) MILESTONES & HIGHWAY SLOGAN BOARDS
    // Traditional Indian Highway Milestones (NH-58 / NH-5 / NH-1D)
    const milestoneWaypoints = [
      { t: 0.12, route: terrainPreset === 'himachal' ? 'NH 5' : terrainPreset === 'ladakh' ? 'NH 1D' : 'NH 58', km: 84, elev: 'ELEV 1,850 M' },
      { t: 0.48, route: terrainPreset === 'himachal' ? 'NH 5' : terrainPreset === 'ladakh' ? 'NH 1D' : 'NH 58', km: 42, elev: 'ELEV 2,240 M' },
      { t: 0.85, route: terrainPreset === 'himachal' ? 'NH 5' : terrainPreset === 'ladakh' ? 'NH 1D' : 'NH 58', km: 6, elev: terrainPreset === 'ladakh' ? '17,982 FT' : 'ELEV 2,680 M' }
    ];

    milestoneWaypoints.forEach((ms) => {
      const msPt = roadCurve.getPoint(ms.t);
      const msTan = roadCurve.getTangent(ms.t).normalize();
      const msNorm = new THREE.Vector3().crossVectors(msTan, new THREE.Vector3(0, 1, 0)).normalize();
      const msPos = msPt.clone().add(msNorm.clone().multiplyScalar(-roadWidth / 2 - 0.72));

      // Milestone Pillar Group
      const msGroup = new THREE.Group();
      msGroup.position.set(msPos.x, msPos.y + roadYOffset + 0.38, msPos.z);
      msGroup.rotation.y = Math.atan2(msTan.x, msTan.z) + Math.PI / 2;
      mountainGroup.add(msGroup);

      // Milestone 3D body with curved dome top
      const msGeo = new THREE.BoxGeometry(0.42, 0.76, 0.24);
      const msTex = createBROMilestoneTexture(terrainPreset, ms.route, ms.km, ms.elev);
      const msMat = new THREE.MeshStandardMaterial({
        map: msTex,
        roughness: 0.65,
        metalness: 0.1
      });
      const msMesh = new THREE.Mesh(msGeo, msMat);
      msMesh.castShadow = true;
      msGroup.add(msMesh);
    });

    // Signature Border Roads Organisation (BRO) Yellow Slogan Signboards
    const broSlogans: Record<string, Array<{ t: number; slogan: string; sub?: string }>> = {
      uttarakhand: [
        { t: 0.06, slogan: 'DRIVE ON MY CURVES WITH CARE', sub: 'PROJECT SHIVALIK · NH-58' },
        { t: 0.25, slogan: 'SAFETY ON ROAD, SAFE TEA AT HOME', sub: 'ACCIDENT PRONE BEND' },
        { t: 0.45, slogan: 'IF YOU ARE MARRIED, DIVORCE SPEED', sub: 'GIVE WAY TO UPHILL VEHICLES' },
        { t: 0.65, slogan: 'ALERT TODAY, ALIVE TOMORROW', sub: 'STEEP PRECIPICE AHEAD' },
        { t: 0.82, slogan: 'BRO WELCOMES YOU TO DEV BHOOMI', sub: 'SUMMIT VILLAGE 2 KM' }
      ],
      himachal: [
        { t: 0.06, slogan: 'PEEP PEEP DONT SLEEP', sub: 'PROJECT DEEPAK · NH-5' },
        { t: 0.25, slogan: 'BETTER BE MR. LATE THAN LATE MR.', sub: 'BLIND HAIRPIN CURVE' },
        { t: 0.45, slogan: 'LIFE IS A SHORT TRIP, DONT MAKE IT SHORTER', sub: 'USE LOW GEAR 4WD' },
        { t: 0.65, slogan: 'DARLING I LIKE YOU, BUT NOT SO FAST', sub: 'ROCKFALL HAZARD ZONE' },
        { t: 0.82, slogan: 'PROJECT DEEPAK · DRIVE SAFELY', sub: 'SUMMIT SANITATION HUB' }
      ],
      ladakh: [
        { t: 0.06, slogan: 'DONT BE SILLY ON THE CHILLY', sub: 'PROJECT HIMANK · NH-1D' },
        { t: 0.25, slogan: 'AFTER WHISKY, DRIVING IS RISKY', sub: 'HIGH ALTITUDE PASS' },
        { t: 0.45, slogan: 'HIGHEST MOTORABLE PASS IN THE WORLD', sub: 'KHARDUNG LA · 17,982 FT' },
        { t: 0.65, slogan: 'BE GENTLE ON MY CURVES', sub: 'SUB-ZERO ICE PATCHES' },
        { t: 0.82, slogan: 'PROJECT HIMANK · THE MOUNTAIN TAMERS', sub: 'OXYGEN LEVEL 50% · DRIVE SLOW' }
      ]
    };

    const activeSlogans = broSlogans[terrainPreset] || broSlogans.uttarakhand;
    activeSlogans.forEach((s) => {
      const pt = roadCurve.getPoint(s.t);
      const tangent = roadCurve.getTangent(s.t).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const signPos = pt.clone().add(normal.clone().multiplyScalar(roadWidth / 2 + 0.85));

      // Dual Galvanized Steel Mounting Posts
      const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), galvanizedMat);
      poleL.position.set(signPos.x + normal.x * 0.35, signPos.y + roadYOffset + 1.1, signPos.z + normal.z * 0.35);
      mountainGroup.add(poleL);

      const poleR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), galvanizedMat);
      poleR.position.set(signPos.x - normal.x * 0.35, signPos.y + roadYOffset + 1.1, signPos.z - normal.z * 0.35);
      mountainGroup.add(poleR);

      const signTex = createBROSignTexture(terrainPreset, s.slogan, s.sub);
      const boardGeo = new THREE.BoxGeometry(1.4, 0.8, 0.04);
      const boardMat = new THREE.MeshStandardMaterial({
        map: signTex,
        roughness: 0.35,
        metalness: 0.25
      });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(signPos.x, signPos.y + roadYOffset + 1.75, signPos.z);
      board.lookAt(signPos.clone().add(tangent));
      board.castShadow = true;
      mountainGroup.add(board);
    });

    // Streetlamps with Night-Lighting along Switchback Curves (Expanded across 11 waypoints)
    streetLightBulbsRef.current = [];
    const streetLampWaypoints = [0.10, 0.26, 0.44, 0.62, 0.78, 0.92];
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

    // 8. Procedural Mountain Terrain with Geological Slope Shading & Glacial Riverbed
    const terrainSize = 165;
    const terrainSegs = 140;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    const terrainElevationFactor = (baseSlopeFactor * 0.38);

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      let vy = -vz * terrainElevationFactor;

      const distFromCenter = Math.abs(vx);
      if (distFromCenter > 10.0) {
        const ridge = Math.sin(vx * 0.18) * Math.cos(vz * 0.15) * 6.8 + (distFromCenter - 10.0) * 0.82;
        vy += Math.max(0, ridge);
      }

      // Valley Riverbed depression at Z > 46
      if (vz > 46) {
        const riverDist = Math.abs(vx - 2.0);
        if (riverDist < 16.0) {
          vy -= (16.0 - riverDist) * 0.28;
        }
      }

      // Smooth terrain bench cut under the road curve to guarantee rock never clips through road
      let minRoadDist = 999;
      let nearestRoadY = 0;
      for (let k = 0; k < curvePoints.length; k += 2) {
        const d = Math.hypot(vx - curvePoints[k].x, vz - curvePoints[k].z);
        if (d < minRoadDist) {
          minRoadDist = d;
          nearestRoadY = curvePoints[k].y;
        }
      }

      if (minRoadDist < roadWidth * 1.35) {
        // Engineered mountain road bench cut: carve ground strictly BELOW asphalt and stone bedding
        const benchY = nearestRoadY - 0.28;
        const blend = Math.max(0, (minRoadDist - roadWidth * 0.52) / (roadWidth * 0.83));
        vy = benchY * (1 - blend) + vy * blend;
      }

      pos.setY(i, vy);
    }

    terrainGeo.computeVertexNormals();

    // Slope-Based Vertex Shading (Craggy rock on steep angles, regional vegetation on shelves)
    const normals = terrainGeo.attributes.normal;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const vy = pos.getY(i);
      const ny = normals.getY(i); // Vertical component of normal (1.0 = flat ground, 0.0 = vertical cliff)

      let r = 0.18, g = 0.26, b = 0.18;

      if (terrainPreset === 'uttarakhand' || terrainPreset === 'aizawl') {
        // Garhwal & Kumaon Ghats: dark slate/shale rock faces; lush riverine moss & terraces
        if (ny < 0.72) {
          r = 0.22; g = 0.25; b = 0.27; // Slate crag
        } else {
          r = 0.12; g = 0.32; b = 0.16; // Lush Himalayan valley grass/moss
        }
        if (vy > 24.0 * slopeScaleY) {
          r = 0.88; g = 0.92; b = 0.96; // Alpine ridge frost
        }
      } else if (terrainPreset === 'ladakh') {
        // High-Altitude Cold Desert: barren scree, mineral dust & permanent glacial snow
        if (ny < 0.70) {
          r = 0.42; g = 0.38; b = 0.34; // Ladakh batholith granodiorite rock
        } else {
          r = 0.54; g = 0.50; b = 0.45; // Sun-baked mineral silt & moraine
        }
        if (vy > 10.0 * slopeScaleY) {
          r = 0.92; g = 0.95; b = 0.98; // Glacial snowpack
        }
      } else {
        // Himachal Pradesh (Shimla - Kinnaur NH-5): grey granite cliffs, alpine turf & snow dusting
        if (ny < 0.72) {
          r = 0.28; g = 0.32; b = 0.35; // Granite crag
        } else {
          r = 0.18; g = 0.29; b = 0.18; // Alpine deodar grass
        }
        if (vy > 18.0 * slopeScaleY) {
          r = 0.90; g = 0.93; b = 0.97; // Snow cap
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

    // Glacial Valley River Plane at Z > 48
    const riverGeo = new THREE.PlaneGeometry(85, 26, 24, 8);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.08,
      metalness: 0.85,
      transparent: true,
      opacity: 0.82
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.position.set(0, -0.3, 56);
    mountainGroup.add(riverMesh);

    // Distant Jagged Snowy Himalayan Ridge Silhouette Backdrop (9 Massive Peaks across Horizon)
    for (let r = 0; r < 9; r++) {
      const peakX = -64 + r * 16;
      const peakZ = -70 - Math.abs(r - 4) * 4;
      const peakH = 34 + (r % 3) * 8;
      const peakR = 18 + (r % 2) * 5;

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
      const capGeo = new THREE.ConeGeometry(peakR * 0.45, peakH * 0.38, 5);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(peakX, peakH - peakH * 0.19 - 4, peakZ);
      capMesh.rotation.y = (r * Math.PI) / 4;
      mountainGroup.add(capMesh);
    }

    // Mountain Granite Boulders & Rock Scree
    const boulderCoords = [
      [-12.5, 42], [14.0, 36], [-16.5, 20], [18.2, 12], [-8.2, -4], [16.5, -12],
      [-14.2, -22], [12.8, -32], [-8.2, -44], [6.5, -48], [-4.0, 54], [8.0, 56]
    ];
    boulderCoords.forEach(([bx, bz]) => {
      const bGeo = new THREE.DodecahedronGeometry(0.65 + Math.random() * 0.45, 1);
      const bMat = new THREE.MeshStandardMaterial({
        map: rockTex.map,
        roughness: 0.85,
        metalness: 0.15
      });
      const boulder = new THREE.Mesh(bGeo, bMat);
      const by = -bz * terrainElevationFactor + 0.35;
      boulder.position.set(bx, by, bz);
      boulder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      boulder.castShadow = true;
      mountainGroup.add(boulder);
    });

    // Multi-tier Himalayan Blue Pine Trees (Pinus wallichiana) - 24 Trees
    pineTreeGroupsRef.current = [];
    const pineTreeLocations = [
      [-16, 42], [-12, 32], [-22, 24], [-10, 14], [-24, 6], [-8, -4], [-18, -16], [-14, -28], [-18, -40], [-10, -48],
      [14, 46], [18, 34], [10, 20], [22, 12], [14, 2], [24, -10], [12, -22], [20, -32], [8, -42], [14, -50],
      [-4, 48], [4, 48], [-6, -52], [6, -52]
    ];
    pineTreeLocations.forEach(([tx, tz]) => {
      const tree = new THREE.Group();

      if (terrainPreset === 'ladakh') {
        // High-altitude Whitewashed Buddhist Chortens / Stupa Cairns (Signature Ladakh roadside monument)
        const stupaBase = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.7, 1.2),
          new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.85 })
        );
        stupaBase.position.y = 0.35;
        stupaBase.castShadow = true;
        tree.add(stupaBase);

        const stupaMid = new THREE.Mesh(
          new THREE.CylinderGeometry(0.44, 0.58, 0.75, 8),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 })
        );
        stupaMid.position.y = 0.95;
        stupaMid.castShadow = true;
        tree.add(stupaMid);

        const stupaSpire = new THREE.Mesh(
          new THREE.ConeGeometry(0.24, 0.8, 8),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.25 })
        );
        stupaSpire.position.y = 1.65;
        tree.add(stupaSpire);
      } else {
        // 3 Staggered Conical Foliage Tiers for Deodar & Blue Pine (Uttarakhand & Himachal)
        const foliageColor = terrainPreset === 'uttarakhand' || terrainPreset === 'aizawl' ? 0x093f21 : 0x14532d;
        const foliageMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.85 });

        const tier1 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.5, 7), foliageMat);
        tier1.position.y = 1.3;
        tier1.castShadow = true;
        tree.add(tier1);

        const tier2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.4, 7), foliageMat);
        tier2.position.y = 2.1;
        tier2.castShadow = true;
        tree.add(tier2);

        const tier3 = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.2, 7), foliageMat);
        tier3.position.y = 2.9;
        tier3.castShadow = true;
        tree.add(tier3);

        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.20, 0.9, 6),
          new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
        );
        trunk.position.y = 0.45;
        tree.add(trunk);
      }

      const ty = -tz * terrainElevationFactor + (Math.abs(tx) > 8 ? (Math.abs(tx) - 8) * 0.75 : 0);
      tree.position.set(tx, ty, tz);
      tree.scale.setScalar(0.9 + Math.random() * 0.4);
      mountainGroup.add(tree);
      pineTreeGroupsRef.current.push(tree);
    });

    // Rolling Mountain Mist / Clouds drifting across Himalayan peaks
    const cloudsGroup = new THREE.Group();
    cloudsGroupRef.current = cloudsGroup;
    mountainGroup.add(cloudsGroup);

    const cloudGeo = new THREE.PlaneGeometry(24, 12);
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide
    });

    const cloudCoords = [
      { x: -38, y: 22 * slopeScaleY + 2, z: -45, ry: 0.1 },
      { x: 28, y: 24 * slopeScaleY + 3, z: -35, ry: -0.2 },
      { x: -18, y: 14 * slopeScaleY + 1, z: 12, ry: 0.15 },
      { x: 32, y: 16 * slopeScaleY + 2, z: -10, ry: -0.1 },
      { x: -10, y: 26 * slopeScaleY + 4, z: -55, ry: 0.05 },
      { x: 20, y: 10 * slopeScaleY + 1, z: 32, ry: -0.15 }
    ];

    cloudCoords.forEach((cfg) => {
      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      cloudMesh.position.set(cfg.x, cfg.y, cfg.z);
      cloudMesh.rotation.y = cfg.ry;
      cloudsGroup.add(cloudMesh);
    });

    // Vernacular Himalayan Kath-Kuni Hillside Cottages (5 Village Cottages)
    const houseCoords = [
      { x: -14.5, z: 32, roofColor: '#b91c1c' },
      { x: 12.0, z: 18, roofColor: '#1d4ed8' },
      { x: -12.5, z: 2, roofColor: '#047857' },
      { x: 15.0, z: -18, roofColor: '#b91c1c' },
      { x: -10.0, z: -38, roofColor: '#d97706' }
    ];
    houseCoords.forEach((hc) => {
      const hGroup = new THREE.Group();
      const hy = -hc.z * terrainElevationFactor + 1.2;
      hGroup.position.set(hc.x, hy, hc.z);

      // Level 1: Kath-Kuni Dressed Stone & Timber Foundation
      const stoneBase = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 1.8, 2.8),
        new THREE.MeshStandardMaterial({ map: stoneWallTex, roughness: 0.85 })
      );
      stoneBase.position.y = 0.9;
      stoneBase.castShadow = true;
      hGroup.add(stoneBase);

      // Level 2: Upper Living Floor (Cedar Wood Framing)
      const woodFloor = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.5, 2.6),
        new THREE.MeshStandardMaterial({ color: 0x452311, roughness: 0.75 })
      );
      woodFloor.position.y = 2.4;
      woodFloor.castShadow = true;
      hGroup.add(woodFloor);

      // Cantilevered Wooden Balcony / Veranda with Spindles
      const balcony = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.14, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.8 })
      );
      balcony.position.set(0, 1.7, 1.5);
      hGroup.add(balcony);

      // Corrugated CGI Gabled Tin Roof
      const tinRoofTex = createCorrugatedTinTexture(hc.roofColor);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(2.8, 1.4, 4),
        new THREE.MeshStandardMaterial({ map: tinRoofTex, roughness: 0.5, metalness: 0.4 })
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 3.6;
      roof.castShadow = true;
      hGroup.add(roof);

      // Stone Chimney with Smoke Outlet
      const chimney = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 1.1, 0.38),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 })
      );
      chimney.position.set(0.9, 4.0, 0.4);
      hGroup.add(chimney);

      // Glowing Multi-paned Window
      const windowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.7),
        new THREE.MeshBasicMaterial({ color: isNightMode ? 0xfef08a : 0xfde047 })
      );
      windowMesh.position.set(0, 2.4, 1.32);
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

    // Waypoint 1: Narrow Access Alley Worksites (t = 0.18)
    const alleyPt = roadCurve.getPoint(0.18);
    const alleyGroup = new THREE.Group();
    alleyGroupRef.current = alleyGroup;
    alleyGroup.position.set(alleyPt.x, alleyPt.y, alleyPt.z);
    mountainGroup.add(alleyGroup);

    // Stone Perimeter Flanking Walls (enforces 1.5m narrow sanitation clearance)
    [-1.85, 1.85].forEach((wx) => {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 1.6, 7.0),
        new THREE.MeshStandardMaterial({ map: stoneWallTex, roughness: 0.9 })
      );
      wall.position.set(wx, 0.8, 0);
      wall.castShadow = true;
      alleyGroup.add(wall);
    });

    // Alleyway Inspection Manhole Chamber on roadside shoulder
    const alleyManhole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.12, 20),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 })
    );
    alleyManhole.position.set(1.15, 0.24, 0);
    alleyGroup.add(alleyManhole);
    alleyManholeRef.current = alleyManhole;

    // Narrow Access BRO Warning Marker Sign
    const alleySign = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.6, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
    );
    alleySign.position.set(-1.85, 2.1, 0);
    alleyGroup.add(alleySign);

    // Waypoint 2: Roadside Service Area & Community Septic Vault (t = 0.42)
    const servicePt = roadCurve.getPoint(0.42);
    const serviceGroup = new THREE.Group();
    serviceGroupRef.current = serviceGroup;
    serviceGroup.position.set(servicePt.x, servicePt.y, servicePt.z);
    mountainGroup.add(serviceGroup);

    // Reinforced Concrete Service Apron
    const serviceApron = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.24, 8.0),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    serviceApron.position.set(2.8, 0.12, 0);
    serviceApron.receiveShadow = true;
    serviceGroup.add(serviceApron);

    // Community Septic Access Manhole Cover
    const serviceManhole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.50, 0.50, 0.14, 24),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 })
    );
    serviceManhole.position.set(2.6, 0.26, 0);
    serviceGroup.add(serviceManhole);
    serviceManholeRef.current = serviceManhole;

    // Safety Stanchions & Warning Sign
    const serviceSign = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.8, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
    );
    serviceSign.position.set(4.2, 1.4, 0);
    serviceGroup.add(serviceSign);

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

    // Armored Faceted Rover Tub Chassis with High-Clearance Belly Skid Plates
    const chassisMat = new THREE.MeshStandardMaterial({
      color: isXRayMode ? 0x0284c7 : 0x0f172a,
      metalness: 0.88,
      roughness: 0.32,
      wireframe: isXRayMode
    });
    chassisMatRef.current = chassisMat;

    // Central Armored Monocoque Belly Tub (360mm ground clearance)
    const chassisMesh = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.20, 2.22), chassisMat);
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    chassisGroup.add(chassisMesh);

    // Angled Front Belly Skid Plate (45° Approach Angle Deflector)
    const frontSkid = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 0.04, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
    );
    frontSkid.rotation.x = -Math.PI / 4;
    frontSkid.position.set(0, 0.02, 1.16);
    chassisGroup.add(frontSkid);

    // Angled Rear Belly Skid Plate (38° Departure Angle Deflector)
    const rearSkid = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 0.04, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
    );
    rearSkid.rotation.x = Math.PI / 4.5;
    rearSkid.position.set(0, 0.02, -1.14);
    chassisGroup.add(rearSkid);

    // Heavy-Duty Tubular Rock Sliders / Lateral Rub Rails
    [-0.56, 0.56].forEach((sx) => {
      const slider = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 2.15, 12), galvanizedMat);
      slider.rotation.x = Math.PI / 2;
      slider.position.set(sx, -0.04, 0);
      chassisGroup.add(slider);

      // 4 Stanchion Brackets per side
      [-0.8, -0.25, 0.25, 0.8].forEach((sz) => {
        const standoff = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.04), chassisMat);
        standoff.position.set(sx > 0 ? sx - 0.04 : sx + 0.04, -0.04, sz);
        chassisGroup.add(standoff);
      });
    });

    // Dual Rear Hydraulic Rock Anchoring Spikes (Ground Claws for 42° Steep Slope Suction Locking)
    [-0.42, 0.42].forEach((ax) => {
      const anchorBracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.14, 0.16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 })
      );
      anchorBracket.position.set(ax, 0.04, -1.15);
      chassisGroup.add(anchorBracket);

      // Hydraulic Actuator Ram Cylinder
      const ramCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.32, 12),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
      );
      ramCylinder.rotation.x = -Math.PI / 3.8;
      ramCylinder.position.set(ax, -0.06, -1.22);
      chassisGroup.add(ramCylinder);

      // Chrome Piston Shaft
      const ramPiston = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.22, 12),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.98, roughness: 0.05 })
      );
      ramPiston.rotation.x = -Math.PI / 3.8;
      ramPiston.position.set(ax, -0.16, -1.28);
      chassisGroup.add(ramPiston);

      // Hardened Tungsten Carbide Ground Anchor Spike / Claw Footpad
      const clawSpike = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.16, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.15 })
      );
      clawSpike.rotation.x = -Math.PI / 3.8 + Math.PI;
      clawSpike.position.set(ax, -0.26, -1.34);
      chassisGroup.add(clawSpike);
    });

    // Heavy-Duty Front Steel Bullbar Bumper (+Z = +1.18) with Recovery Winch & Tow D-Rings
    const bullbar = new THREE.Mesh(
      new THREE.BoxGeometry(1.22, 0.26, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.25 })
    );
    bullbar.position.set(0, 0.06, 1.18);
    chassisGroup.add(bullbar);

    [-0.38, 0.38].forEach((sx) => {
      const shackle = new THREE.Mesh(
        new THREE.TorusGeometry(0.045, 0.014, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
      );
      shackle.position.set(sx, 0.05, 1.26);
      chassisGroup.add(shackle);
    });

    // Planetary Gear Recovery Winch Drum & Steel Cable
    const winchDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.32, 16),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.95, roughness: 0.2 })
    );
    winchDrum.rotation.z = Math.PI / 2;
    winchDrum.position.set(0, 0.12, 1.25);
    chassisGroup.add(winchDrum);

    // Front Bullbar Tubular Push Frame
    const pushBarTop = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.85, 12), galvanizedMat);
    pushBarTop.rotation.z = Math.PI / 2;
    pushBarTop.position.set(0, 0.32, 1.22);
    chassisGroup.add(pushBarTop);

    [-0.38, 0.38].forEach((px) => {
      const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.26, 12), galvanizedMat);
      riser.position.set(px, 0.20, 1.20);
      chassisGroup.add(riser);
    });

    // Front Electric Powertrain Cooler Cowling with Swachh Bharat Decal
    const frontCowl = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.22, 0.10),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.25 })
    );
    frontCowl.position.set(0, 0.24, 1.16);
    chassisGroup.add(frontCowl);

    const cowlDecal = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.10),
      new THREE.MeshStandardMaterial({ map: swachhDecal, transparent: true, roughness: 0.4 })
    );
    cowlDecal.position.set(0, 0.24, 1.215);
    chassisGroup.add(cowlDecal);

    // Rear Fold-down Service Step / Operator Platform (-Z = -1.24)
    const operatorPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.035, 0.30),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.4 })
    );
    operatorPlatform.position.set(0, -0.04, -1.24);
    operatorPlatform.castShadow = true;
    chassisGroup.add(operatorPlatform);

    [-0.36, 0.36].forEach((px) => {
      const pBracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.16, 0.26),
        galvanizedMat
      );
      pBracket.position.set(px, 0.02, -1.22);
      chassisGroup.add(pBracket);
    });

    // 4 Corner Crane Lifting Eyes / Mountain Air-Drop Hoist Lugs (Safety Orange)
    [[-0.48, 1.05], [0.48, 1.05], [-0.48, -1.05], [0.48, -1.05]].forEach(([lx, lz]) => {
      const liftEye = new THREE.Mesh(
        new THREE.TorusGeometry(0.035, 0.012, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
      );
      liftEye.position.set(lx, 0.18, lz);
      chassisGroup.add(liftEye);
    });

    // =========================================================================
    // SIH 26258 PURPOSE-BUILT TRACKED MECHANIZED DESLUDGING SUPERSTRUCTURE
    // Dedicated Sanitation Equipment Platform (Zero Passenger Cabin / No Cockpit)
    // =========================================================================

    // 1. Structural Industrial Equipment Deck & Diamond-Plate Walkway
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.35
    });
    const equipmentDeck = new THREE.Mesh(
      new THREE.BoxGeometry(1.04, 0.05, 1.15),
      deckMat
    );
    equipmentDeck.position.set(0, 0.12, 0.65);
    equipmentDeck.castShadow = true;
    equipmentDeck.receiveShadow = true;
    chassisGroup.add(equipmentDeck);

    // Front & Side Equipment Grab Rails (Safety Yellow & Galvanized)
    [-0.48, 0.48].forEach((rx) => {
      const railPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 8), galvanizedMat);
      railPost1.position.set(rx, 0.32, 0.18);
      chassisGroup.add(railPost1);

      const railPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 8), galvanizedMat);
      railPost2.position.set(rx, 0.32, 1.12);
      chassisGroup.add(railPost2);

      const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.98, 8), galvanizedMat);
      topRail.rotation.x = Math.PI / 2;
      topRail.position.set(rx, 0.52, 0.65);
      chassisGroup.add(topRail);
    });

    // Left & Right Side Maintenance Equipment Access Panels with Louvers & Latches
    [-0.51, 0.51].forEach((px) => {
      const accessPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.28, 0.94),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 })
      );
      accessPanel.position.set(px, 0.28, 0.65);
      accessPanel.castShadow = true;
      chassisGroup.add(accessPanel);

      [-0.30, 0.30].forEach((lz) => {
        const latch = new THREE.Mesh(
          new THREE.BoxGeometry(0.035, 0.04, 0.06),
          new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
        );
        latch.position.set(px > 0 ? px + 0.012 : px - 0.012, 0.28, 0.65 + lz);
        chassisGroup.add(latch);
      });

      for (let v = 0; v < 4; v++) {
        const louver = new THREE.Mesh(
          new THREE.BoxGeometry(0.032, 0.012, 0.36),
          galvanizedMat
        );
        louver.rotation.z = px > 0 ? -0.3 : 0.3;
        louver.position.set(px, 0.22 + v * 0.035, 0.65);
        chassisGroup.add(louver);
      }
    });

    // Perforated Stone Debris Mesh Guard over Pump & Macerator Assembly
    const pumpGuardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.38, 0.58),
      new THREE.MeshStandardMaterial({
        color: 0x475569,
        wireframe: true,
        metalness: 0.85
      })
    );
    pumpGuardMesh.position.set(0.28, 0.36, 0.65);
    chassisGroup.add(pumpGuardMesh);

    // Overhead Protective Roll Arch (ROPS Structural Steel)
    const ropsArch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 1.02, 12),
      galvanizedMat
    );
    ropsArch.rotation.z = Math.PI / 2;
    ropsArch.position.set(0, 0.72, 0.65);
    chassisGroup.add(ropsArch);

    [-0.48, 0.48].forEach((rx) => {
      const ropsLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.42, 12),
        galvanizedMat
      );
      ropsLeg.position.set(rx, 0.51, 0.65);
      chassisGroup.add(ropsLeg);
    });

    // 2. Weatherproof Sealed Operator Control & Hydraulic Logic Cabinet (Front Left: x = -0.32, z = 0.68)
    const cabinetGroup = new THREE.Group();
    cabinetGroup.position.set(-0.32, 0.38, 0.65);
    chassisGroup.add(cabinetGroup);

    const cabinetBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.48, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.28 })
    );
    cabinetBody.castShadow = true;
    cabinetGroup.add(cabinetBody);

    // Cabinet Faceplate in Industrial Warning Amber
    const faceplate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.44),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.4 })
    );
    faceplate.position.set(0, 0, 0.172);
    cabinetGroup.add(faceplate);

    // Diagnostic Digital Telemetry LCD Screen (Glowing Cyan Display)
    const lcdScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    );
    lcdScreen.position.set(0, 0.10, 0.175);
    cabinetGroup.add(lcdScreen);

    // Emergency Stop Mushroom Button (Red on High-Visibility Yellow Collar)
    const eStopCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.015, 16),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    eStopCollar.rotation.x = Math.PI / 2;
    eStopCollar.position.set(-0.08, -0.06, 0.18);
    cabinetGroup.add(eStopCollar);

    const eStopMushroom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.022, 0.025, 16),
      new THREE.MeshBasicMaterial({ color: 0xdc2626 })
    );
    eStopMushroom.rotation.x = Math.PI / 2;
    eStopMushroom.position.set(-0.08, -0.06, 0.195);
    cabinetGroup.add(eStopMushroom);

    // Dual Analog Pressure Gauges (Cylinder Line 0-250 bar & Vacuum Line)
    [-0.05, 0.05].forEach((gx) => {
      const dial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, 0.015, 16),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.9 })
      );
      dial.rotation.x = Math.PI / 2;
      dial.position.set(gx + 0.05, -0.06, 0.18);
      cabinetGroup.add(dial);

      const dialBezel = new THREE.Mesh(
        new THREE.TorusGeometry(0.03, 0.005, 8, 16),
        galvanizedMat
      );
      dialBezel.position.set(gx + 0.05, -0.06, 0.188);
      cabinetGroup.add(dialBezel);
    });

    // 4-Bank Hydraulic Manual Control Levers (Spool Valve Bank)
    for (let l = 0; l < 4; l++) {
      const leverStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.055, 8),
        galvanizedMat
      );
      leverStem.rotation.x = Math.PI / 6;
      leverStem.position.set(-0.10 + l * 0.065, -0.14, 0.19);
      cabinetGroup.add(leverStem);

      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.009, 8, 8),
        new THREE.MeshStandardMaterial({ color: l === 0 ? 0xdc2626 : 0x0284c7 })
      );
      knob.position.set(-0.10 + l * 0.065, -0.115, 0.205);
      cabinetGroup.add(knob);
    }

    // High-Mounted Rotating Amber Hazard Strobe Beacon
    const beaconPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8),
      galvanizedMat
    );
    beaconPost.position.set(0.12, 0.38, 0);
    cabinetGroup.add(beaconPost);

    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    beacon.position.set(0.12, 0.58, 0);
    cabinetGroup.add(beacon);
    roofBeaconRef.current = beacon;

    // Compact Autonomous Sensor Mast (Turret with spinning LiDAR)
    const sensorMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.28, 8),
      galvanizedMat
    );
    sensorMast.position.set(-0.12, 0.35, 0);
    cabinetGroup.add(sensorMast);

    const lidarPuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.07, 16),
      new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 })
    );
    lidarPuck.position.set(-0.12, 0.52, 0);
    cabinetGroup.add(lidarPuck);
    lidarTurretRef.current = lidarPuck;

    const laserRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.062, 0.015, 16),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    lidarPuck.add(laserRing);

    // 3. High-Torque Macerator & Progressive Cavity Slurry Pump (Front Right: x = 0.28, z = 0.65)
    const pumpGroup = new THREE.Group();
    pumpGroup.position.set(0.28, 0.26, 0.65);
    chassisGroup.add(pumpGroup);

    // Cast-Iron Pump Barrel & Stator in Industrial Amber
    const pcPumpBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.44, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 })
    );
    pcPumpBody.rotation.x = Math.PI / 2;
    pcPumpBody.castShadow = true;
    pumpGroup.add(pcPumpBody);

    // Tungsten Carbide Rotary Chopper Cutting Chamber
    const chopperChamber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.2 })
    );
    chopperChamber.rotation.x = Math.PI / 2;
    chopperChamber.position.set(0, 0, 0.26);
    pumpGroup.add(chopperChamber);

    // Rotating Tungsten Cutter Blade Disc (spins with pump flow)
    const chopperBlade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.03, 8),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95 })
    );
    chopperBlade.rotation.x = Math.PI / 2;
    chopperBlade.position.set(0, 0, 0.33);
    pumpGroup.add(chopperBlade);
    maceratorBladesRef.current = chopperBlade;

    // 3.5 kW Brushless Drive Motor with Heat-Dissipation Fins
    const pumpMotor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.10, 0.10, 0.26, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.35 })
    );
    pumpMotor.rotation.x = Math.PI / 2;
    pumpMotor.position.set(0, 0, -0.32);
    pumpGroup.add(pumpMotor);

    // Steel Braided Slurry Hose connecting Pump to Tank Intake
    const pumpDischargePipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.65, 12),
      galvanizedMat
    );
    pumpDischargePipe.rotation.x = Math.PI / 3;
    pumpDischargePipe.position.set(-0.12, 0.18, -0.15);
    pumpGroup.add(pumpDischargePipe);

    // 4. Motorized Heavy-Duty Hose Reel Assembly (Mounted Centrally: x = 0, y = 0.42, z = 0.78)
    const reelGroup = new THREE.Group();
    reelGroup.position.set(0, 0.42, 0.78);
    chassisGroup.add(reelGroup);

    [-0.22, 0.22].forEach((bx) => {
      const aFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.34, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 })
      );
      aFrame.position.set(bx, 0, 0);
      reelGroup.add(aFrame);

      const drumDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.02, 24),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
      );
      drumDisc.rotation.z = Math.PI / 2;
      drumDisc.position.set(bx > 0 ? 0.18 : -0.18, 0.08, 0);
      reelGroup.add(drumDisc);
    });

    const hoseCoil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.34, 20),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45, metalness: 0.1 })
    );
    hoseCoil.rotation.z = Math.PI / 2;
    hoseCoil.position.set(0, 0.08, 0);
    reelGroup.add(hoseCoil);

    // 5. Articulated 2-Segment Robotic Crane Suction Boom Arm (Front Center: x = 0, y = 0.30, z = 1.10)
    const boomGroup = new THREE.Group();
    boomGroup.position.set(0, 0.30, 1.10);
    chassisGroup.add(boomGroup);
    suctionArmRef.current = boomGroup;

    // Turntable Slewing Pedestal
    const slewingRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
    );
    boomGroup.add(slewingRing);

    // Primary Boom Arm (Industrial Safety Amber)
    const primaryBoom = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.72),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 })
    );
    primaryBoom.rotation.x = Math.PI / 4;
    primaryBoom.position.set(0, 0.26, 0.24);
    primaryBoom.castShadow = true;
    boomGroup.add(primaryBoom);

    // Chrome Hydraulic Lift Cylinder for Boom
    const boomRamCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.38, 12),
      galvanizedMat
    );
    boomRamCyl.rotation.x = Math.PI / 3;
    boomRamCyl.position.set(0.06, 0.16, 0.14);
    boomGroup.add(boomRamCyl);

    const boomRamRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.24, 12),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.98, roughness: 0.05 })
    );
    boomRamRod.rotation.x = Math.PI / 3;
    boomRamRod.position.set(0.06, 0.25, 0.22);
    boomGroup.add(boomRamRod);

    // Secondary Articulated Jib Arm
    const secondaryJib = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.065, 0.58),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 })
    );
    secondaryJib.rotation.x = -Math.PI / 6;
    secondaryJib.position.set(0, 0.46, 0.62);
    boomGroup.add(secondaryJib);

    // Flexible Extraction Hose routed along boom
    const boomHose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, 1.15, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    boomHose.rotation.x = Math.PI / 4;
    boomHose.position.set(0, 0.28, 0.40);
    boomGroup.add(boomHose);

    // Heavy Cast Stainless Steel Suction Nozzle at Boom Tip
    const suctionNozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.036, 0.18, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.95, roughness: 0.15 })
    );
    suctionNozzle.rotation.x = Math.PI / 2;
    suctionNozzle.position.set(0, 0.38, 0.88);
    boomGroup.add(suctionNozzle);

    // =========================================================================
    // 400L SLUDGE VACUUM HOLDING TANK WITH ADVANCED CUTAWAY INSPECTION PROFILE
    // =========================================================================
    const tankRadius = 0.38;
    const tankLength = 1.35;
    const isCutawayMode = cutawayOpacity < 0.85;

    const tankMat = new THREE.MeshPhysicalMaterial({
      color: isCutawayMode ? 0x38bdf8 : 0x0f766e,
      metalness: isCutawayMode ? 0.2 : 0.6,
      roughness: isCutawayMode ? 0.1 : 0.28,
      transparent: isCutawayMode,
      opacity: isCutawayMode ? Math.max(0.18, cutawayOpacity) : 1.0,
      depthWrite: !isCutawayMode,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12
    });
    tankMatRef.current = tankMat;

    const tankCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(tankRadius, tankRadius, tankLength, 32),
      tankMat
    );
    tankCylinderRef.current = tankCylinder;
    tankCylinder.rotation.x = Math.PI / 2;
    tankCylinder.position.set(0, 0.46, -0.28);
    tankCylinder.castShadow = true;
    chassisGroup.add(tankCylinder);

    // High-Intensity Internal Inspection Work Light (illuminates compaction piston & sludge)
    const tankWorkLight = new THREE.PointLight(
      0x38bdf8,
      isCutawayMode ? 2.2 : 0.0,
      3.2,
      1.2
    );
    tankWorkLight.position.set(0, 0.46, -0.28);
    chassisGroup.add(tankWorkLight);
    tankWorkLightRef.current = tankWorkLight;

    // Tank Welded Torispherical Dished Heads with Seam Rings
    [-tankLength / 2, tankLength / 2].forEach((zOffset) => {
      const capMesh = new THREE.Mesh(
        new THREE.SphereGeometry(tankRadius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        tankMat
      );
      capMesh.rotation.x = zOffset > 0 ? -Math.PI / 2 : Math.PI / 2;
      capMesh.position.set(0, 0.46, -0.28 + zOffset);
      chassisGroup.add(capMesh);

      const seam = new THREE.Mesh(
        new THREE.TorusGeometry(tankRadius + 0.008, 0.012, 8, 32),
        galvanizedMat
      );
      seam.position.set(0, 0.46, -0.28 + zOffset);
      chassisGroup.add(seam);
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

    // Structural Tank Cradle Saddle Bolsters (Curved support brackets welded to chassis frame)
    [-0.45, 0.45].forEach((sz) => {
      const saddleBolster = new THREE.Mesh(
        new THREE.CylinderGeometry(tankRadius + 0.032, tankRadius + 0.032, 0.09, 20, 1, false, Math.PI, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 })
      );
      saddleBolster.rotation.x = Math.PI / 2;
      saddleBolster.position.set(0, 0.46, -0.28 + sz);
      chassisGroup.add(saddleBolster);

      const isoPad = new THREE.Mesh(
        new THREE.CylinderGeometry(tankRadius + 0.016, tankRadius + 0.016, 0.08, 20, 1, false, Math.PI, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 })
      );
      isoPad.rotation.x = Math.PI / 2;
      isoPad.position.set(0, 0.46, -0.28 + sz);
      chassisGroup.add(isoPad);

      [-0.41, 0.41].forEach((bx) => {
        const trunnion = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8),
          galvanizedMat
        );
        trunnion.position.set(bx, 0.46, -0.28 + sz);
        chassisGroup.add(trunnion);
      });
    });

    // Forward Inspection Cleanout Manhole (Ø280mm) with Bolted Dome Hatch
    const cleanoutHatch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.07, 20),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.88, roughness: 0.25 })
    );
    cleanoutHatch.position.set(0, 0.86, 0.18);
    chassisGroup.add(cleanoutHatch);

    const hatchDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
    );
    hatchDome.position.set(0, 0.89, 0.18);
    chassisGroup.add(hatchDome);

    // Top Cyclone Separator Dome & Stainless Steel Vacuum Piping
    const cyclone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.08, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
    );
    cyclone.position.set(0, 0.92, -0.15);
    chassisGroup.add(cyclone);

    const vacPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 12), galvanizedMat);
    vacPipe.rotation.x = Math.PI / 4;
    vacPipe.position.set(0, 0.72, -0.55);
    chassisGroup.add(vacPipe);

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

    // Transparent Liquid Level Sight Glass Column with Floating Indicator Ball
    const sightTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.42, 12),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, roughness: 0.05, transmission: 0.9 })
    );
    sightTube.position.set(0.40, 0.46, -0.28);
    chassisGroup.add(sightTube);

    [-0.22, 0.22].forEach((yOff) => {
      const fitting = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, 0.04, 8),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
      );
      fitting.position.set(0.40, 0.46 + yOff, -0.28);
      chassisGroup.add(fitting);
    });

    const sightFloat = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    sightFloat.position.set(0.40, 0.46, -0.28);
    chassisGroup.add(sightFloat);
    levelSightFloatRef.current = sightFloat;

    // 3D Laser-Etched Volume Graduation Scale Notches (100L, 200L, 300L, 400L)
    const graduationGroup = new THREE.Group();
    graduationGroup.position.set(0.405, 0.46, -0.28);
    chassisGroup.add(graduationGroup);

    [-0.15, -0.05, 0.05, 0.15].forEach((yMark, idx) => {
      const notch = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.008, 0.04),
        new THREE.MeshBasicMaterial({ color: idx === 3 ? 0xef4444 : 0x38bdf8 })
      );
      notch.position.set(0.012, yMark, 0);
      graduationGroup.add(notch);
    });

    // Rear 4-inch Discharge Gate Valve Assembly with Red Handwheel & Camlock
    const valveBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
    );
    valveBody.position.set(0, 0.28, -0.28 - tankLength / 2 - 0.08);
    chassisGroup.add(valveBody);

    const handwheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.012, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7, roughness: 0.3 })
    );
    handwheel.position.set(0, 0.38, -0.28 - tankLength / 2 - 0.08);
    handwheel.rotation.x = Math.PI / 2;
    chassisGroup.add(handwheel);

    const camlock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 })
    );
    camlock.rotation.x = Math.PI / 2;
    camlock.position.set(0, 0.28, -0.28 - tankLength / 2 - 0.18);
    chassisGroup.add(camlock);

    // Twin Side Hose Storage Trays with Coiled 3" Flexible Suction Hoses
    [-0.48, 0.48].forEach((xTray) => {
      const tray = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, tankLength * 0.95), galvanizedMat);
      tray.position.set(xTray, 0.28, -0.28);
      chassisGroup.add(tray);

      const coiledHose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, tankLength * 0.9, 16),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
      );
      coiledHose.rotation.x = Math.PI / 2;
      coiledHose.position.set(xTray, 0.34, -0.28);
      chassisGroup.add(coiledHose);
    });

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

    // =========================================================================
    // HYDRAULIC SLUDGE-COMPACTION PISTON & DEWATERING MECHANISM
    // Vertical double-acting cylinder, chrome piston rod, anti-tilt guide columns,
    // perforated platen, perimeter scraper seal, and mechanical retention lock pins.
    // =========================================================================
    const compactionGroup = new THREE.Group();
    compactionGroup.position.set(0, 0, -0.28);
    chassisGroup.add(compactionGroup);

    // 1. Structural Overhead Mounting Truss / Saddle
    const bridgeYoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.05, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 })
    );
    bridgeYoke.position.set(0, 0.90, 0);
    compactionGroup.add(bridgeYoke);

    // High-Pressure Compaction Warning Decal Plate
    const compWarnDecal = createDecalTexture('compaction_warning');
    const compWarnPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 0.13),
      new THREE.MeshStandardMaterial({ map: compWarnDecal, transparent: true, roughness: 0.3 })
    );
    compWarnPlate.position.set(0, 0.90, 0.095);
    compactionGroup.add(compWarnPlate);

    [-0.34, 0.34].forEach((rx) => {
      const yokeRiser = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.44, 0.16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 })
      );
      yokeRiser.position.set(rx, 0.68, 0);
      compactionGroup.add(yokeRiser);
    });

    // 2. Heavy-Duty Hydraulic Cylinder Barrel (Ø120 mm Bore Class)
    const hydCylBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.36, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.88, roughness: 0.22 })
    );
    hydCylBarrel.position.set(0, 1.08, 0);
    compactionGroup.add(hydCylBarrel);

    // Cylinder End Gland Cap with High-Pressure Seal
    const glandCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 })
    );
    glandCap.position.set(0, 0.91, 0);
    compactionGroup.add(glandCap);

    // High-Pressure Hydraulic Fluid Ports & Steel Braided Lines
    [-0.07, 0.07].forEach((px) => {
      const portFitting = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.04, 12),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.95 })
      );
      portFitting.rotation.z = Math.PI / 2;
      portFitting.position.set(px, 1.14, 0);
      compactionGroup.add(portFitting);

      const hydLine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.42, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
      );
      hydLine.position.set(px * 1.5, 0.92, 0.08);
      compactionGroup.add(hydLine);
    });

    // 3. Dual Vertical Chrome Guide Columns (Ø45 mm Class, Anti-Tilt Mechanism)
    [-0.24, 0.24].forEach((gx) => {
      const guideRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.020, 0.020, 0.70, 16),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.08 })
      );
      guideRod.position.set(gx, 0.60, 0);
      compactionGroup.add(guideRod);
    });

    // 4. Moving Compaction Platen Assembly (moves from y=0.72 down to y=0.25)
    const platenGroup = new THREE.Group();
    platenGroup.position.set(0, 0.72, 0);
    compactionGroup.add(platenGroup);
    compactionPlatenRef.current = platenGroup;

    // Rigid Structural Platen Plate (1.15m x 0.56m)
    const platenMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.035, 1.15),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 })
    );
    platenMesh.position.y = 0;
    platenGroup.add(platenMesh);

    // Heavy-Duty Structural Stiffening Cross-Ribs on Platen Upper Surface
    [-0.35, 0, 0.35].forEach((rz) => {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.024, 0.035),
        galvanizedMat
      );
      rib.position.set(0, 0.026, rz);
      platenGroup.add(rib);
    });

    // Perforated Filter Mesh Underside
    const perforatedMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.006, 1.14),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.92, roughness: 0.4 })
    );
    perforatedMesh.position.y = -0.018;
    platenGroup.add(perforatedMesh);

    // Polyurethane Perimeter Scraper / Wiper Seal Ring
    const wiperSeal = new THREE.Mesh(
      new THREE.BoxGeometry(0.575, 0.018, 1.165),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 })
    );
    wiperSeal.position.y = -0.005;
    platenGroup.add(wiperSeal);

    // Dual Bronze Guide Sleeve Bushings
    [-0.24, 0.24].forEach((bx) => {
      const bushing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 })
      );
      bushing.position.set(bx, 0.035, 0);
      platenGroup.add(bushing);
    });

    // Twin Mechanical Retention Pin Locking Ear Brackets (for transport lock)
    [-0.26, 0.26].forEach((lx) => {
      const ear = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.09, 0.08),
        galvanizedMat
      );
      ear.position.set(lx, 0.05, 0);
      platenGroup.add(ear);

      const earHole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.032, 12),
        new THREE.MeshBasicMaterial({ color: 0x020617 })
      );
      earHole.rotation.z = Math.PI / 2;
      earHole.position.set(lx, 0.065, 0);
      platenGroup.add(earHole);
    });

    // 5. Guided Chrome Piston Rod (Ø60 mm Rod Class)
    const hydPistonRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.65, 20),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.98, roughness: 0.04 })
    );
    hydPistonRod.position.set(0, 0.92, 0);
    compactionGroup.add(hydPistonRod);
    pistonRodRef.current = hydPistonRod;

    // 6. Mechanical Retention Lock Pins (Engage at Top Home Position)
    pistonLockPinsRef.current = [];
    [-0.32, 0.32].forEach((px, pIdx) => {
      const pinHousing = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
      );
      pinHousing.position.set(px, 0.785, 0);
      compactionGroup.add(pinHousing);

      const lockPin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.09, 12),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.95, roughness: 0.1 })
      );
      lockPin.rotation.z = Math.PI / 2;
      lockPin.position.set(pIdx === 0 ? -0.27 : 0.27, 0.785, 0);
      compactionGroup.add(lockPin);
      pistonLockPinsRef.current.push(lockPin);
    });

    // Safety Lock Status Dual Indicator LED Lamps on Overhead Bridge
    const lockLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    lockLed.position.set(0, 0.94, 0.10);
    compactionGroup.add(lockLed);
    pistonStatusLedRef.current = lockLed;

    // 7. Dynamic Liquid Filtrate Pool Layer (Appears directly above platen during dewatering)
    const filtrateGeo = new THREE.PlaneGeometry(0.53, 1.12);
    filtrateGeo.rotateX(-Math.PI / 2);
    const filtrateMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      roughness: 0.08,
      transmission: 0.82,
      ior: 1.33
    });
    const filtrateMesh = new THREE.Mesh(filtrateGeo, filtrateMat);
    filtrateMesh.position.set(0, 0.74, 0);
    compactionGroup.add(filtrateMesh);
    filtrateMeshRef.current = filtrateMesh;

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

    // Rear Hydraulic Power Unit (HPU) Oil Reservoir & High-Pressure Filtration Manifold
    const hpuTank = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.28, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 })
    );
    hpuTank.position.set(0, 0.22, -1.02);
    chassisGroup.add(hpuTank);

    const hpuFilter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.18, 12),
      galvanizedMat
    );
    hpuFilter.position.set(0.14, 0.26, -1.14);
    chassisGroup.add(hpuFilter);

    const hpuMotor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.18, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
    );
    hpuMotor.rotation.x = Math.PI / 2;
    hpuMotor.position.set(-0.12, 0.24, -1.14);
    chassisGroup.add(hpuMotor);

    // High-Pressure Braided Stainless Steel Hydraulic Supply Lines from HPU to Compaction Cylinder
    [-0.04, 0.04].forEach((hx) => {
      const hydCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(hx, 0.28, -1.0),
        new THREE.Vector3(hx * 1.5, 0.52, -0.75),
        new THREE.Vector3(hx * 1.8, 0.85, -0.35),
        new THREE.Vector3(hx > 0 ? 0.07 : -0.07, 1.12, -0.28)
      ]);
      const hydHoseGeo = new THREE.TubeGeometry(hydCurve, 16, 0.010, 8, false);
      const hydHoseMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.35
      });
      const hydHoseMesh = new THREE.Mesh(hydHoseGeo, hydHoseMat);
      chassisGroup.add(hydHoseMesh);
    });

    // 4 Articulated Hydraulic Outrigger Stabilizer Legs with Swivel Footpads attached to Rams
    const hazardDecal = createDecalTexture('hazard_stripe');
    hazardDecal.wrapS = THREE.RepeatWrapping;
    hazardDecal.repeat.set(2, 1);

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

      // Industrial Hazard Warning Chevron Band on leg casing
      const hazardBand = new THREE.Mesh(
        new THREE.BoxGeometry(0.104, 0.08, 0.104),
        new THREE.MeshStandardMaterial({ map: hazardDecal, roughness: 0.35 })
      );
      hazardBand.position.y = 0.06;
      legGroup.add(hazardBand);

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

    // Quad Projector LED Headlights (+Z = +1.15) & Volumetric Atmospheric Beam Cones
    headlightsLightRef.current = [];
    volumetricHeadlightsRef.current = [];
    [-0.35, 0.35].forEach((xPos) => {
      // Recessed Headlamp Housing
      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.14, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
      );
      housing.position.set(xPos, 0.28, 1.18);
      chassisGroup.add(housing);

      // Dual Projector LEDs per headlamp unit (Low beam + High beam)
      [-0.05, 0.05].forEach((pOff, pIdx) => {
        const lens = new THREE.Mesh(
          new THREE.SphereGeometry(0.038, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        lens.rotation.x = -Math.PI / 2;
        lens.position.set(xPos + pOff, 0.28, 1.21);
        chassisGroup.add(lens);

        const lensBezel = new THREE.Mesh(
          new THREE.TorusGeometry(0.042, 0.008, 8, 16),
          galvanizedMat
        );
        lensBezel.position.set(xPos + pOff, 0.28, 1.205);
        chassisGroup.add(lensBezel);
      });

      const spotLight = new THREE.SpotLight(0xfff7ed, 3.4, 45, Math.PI / 5.2, 0.35, 1);
      spotLight.position.set(xPos, 0.28, 1.18);
      const targetObj = new THREE.Object3D();
      targetObj.position.set(xPos, -0.2, 14);
      chassisGroup.add(targetObj);

      spotLight.target = targetObj;
      spotLight.castShadow = true;
      chassisGroup.add(spotLight);
      headlightsLightRef.current.push(spotLight);

      // Volumetric Atmospheric Light Cone
      const beamGeo = new THREE.CylinderGeometry(1.6, 0.08, 14.0, 24, 1, true);
      beamGeo.rotateX(Math.PI / 2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xfffae0,
        transparent: true,
        opacity: isNightMode ? 0.32 : 0.09,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.rotation.x = 0.038;
      beamMesh.position.set(xPos, 0.28 - 0.22, 1.18 + 7.0);
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

    // 10. Dual Heavy-Duty Continuous Caterpillar Tank Tracks (Extreme-Terrain Crawler Assemblies)
    const trackOffsetsX = [-0.68, 0.68]; // Left & Right Tracks
    wheelsRef.current = [];
    leftWheelsRef.current = [];
    rightWheelsRef.current = [];
    suspensionSpringsRef.current = [];
    damperPistonsRef.current = [];
    trackBeltMatsRef.current = [];
    trackCleatsRef.current = [];

    // Continuous 2D CatmullRom Curve profile defining track belt loop in Y-Z plane
    const trackProfileCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.22, -0.65), // upper rear run
      new THREE.Vector3(0, 0.20, 0.0),   // upper mid sag
      new THREE.Vector3(0, 0.22, 0.65),  // upper front run
      new THREE.Vector3(0, 0.17, 0.88),  // front upper transition
      new THREE.Vector3(0, 0.08, 1.04),  // front drive sprocket apex
      new THREE.Vector3(0, -0.06, 0.98), // front approach incline
      new THREE.Vector3(0, -0.18, 0.70), // front ground contact start
      new THREE.Vector3(0, -0.18, 0.0),  // flat bottom ground contact
      new THREE.Vector3(0, -0.18, -0.70),// rear ground contact end
      new THREE.Vector3(0, -0.06, -0.98),// rear departure incline
      new THREE.Vector3(0, 0.08, -1.04), // rear tensioner idler apex
      new THREE.Vector3(0, 0.17, -0.88)  // rear upper transition
    ], true, 'catmullrom', 0.12);
    trackProfileCurveRef.current = trackProfileCurve;

    const ribbonSampleCount = 56;
    const trackPoints = trackProfileCurve.getPoints(ribbonSampleCount);
    const trackRibbonWidth = 0.28;

    trackOffsetsX.forEach((tx) => {
      const isLeft = tx < 0;
      const targetSideWheels = isLeft ? leftWheelsRef.current : rightWheelsRef.current;
      const trackModuleGroup = new THREE.Group();
      trackModuleGroup.position.set(tx, -0.06, 0);
      chassisGroup.add(trackModuleGroup); // Mechanically locked to armored rover chassis monocoque

      // Armored Track Longitudinal Bogie Beam
      const bogieBeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.16, 1.84),
        chassisMat
      );
      bogieBeam.position.set(0, 0.04, 0);
      bogieBeam.castShadow = true;
      trackModuleGroup.add(bogieBeam);

      // Front Sprocket Housing & Rear Tensioner Cylinder
      const frontHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.14, 16),
        chassisMat
      );
      frontHousing.rotation.z = Math.PI / 2;
      frontHousing.position.set(0, 0.08, 0.86);
      trackModuleGroup.add(frontHousing);

      // Hydraulic Planetary Final-Drive Motor Casing
      const driveMotorCasing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10, 0.10, 0.18, 16),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.28 })
      );
      driveMotorCasing.rotation.z = Math.PI / 2;
      driveMotorCasing.position.set(tx > 0 ? 0.08 : -0.08, 0.08, 0.86);
      trackModuleGroup.add(driveMotorCasing);

      const rearTensioner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.28, 12),
        galvanizedMat
      );
      rearTensioner.rotation.x = Math.PI / 2;
      rearTensioner.position.set(0, 0.08, -0.72);
      trackModuleGroup.add(rearTensioner);

      // Front Toothed Drive Sprocket (Rotates dynamically around X axis with vehicle velocity)
      const frontSprocketHub = new THREE.Group();
      frontSprocketHub.position.set(0, 0.08, 0.86);
      trackModuleGroup.add(frontSprocketHub);
      targetSideWheels.push(frontSprocketHub);
      wheelsRef.current.push(frontSprocketHub);

      const sprocketDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.22, 24),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.92, roughness: 0.2 })
      );
      sprocketDisc.rotation.z = Math.PI / 2;
      sprocketDisc.castShadow = true;
      frontSprocketHub.add(sprocketDisc);

      // 12 Hardened Alloy Drive Teeth around perimeter
      for (let t = 0; t < 12; t++) {
        const ang = (t / 12) * Math.PI * 2;
        const tooth = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.045, 0.038),
          new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.88, roughness: 0.25 })
        );
        tooth.position.set(0, Math.sin(ang) * 0.18, Math.cos(ang) * 0.18);
        tooth.rotation.x = ang;
        frontSprocketHub.add(tooth);
      }

      // Sprocket Axle Hub Cap & Bolts
      const frontCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, 0.23, 16),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95 })
      );
      frontCap.rotation.z = Math.PI / 2;
      frontSprocketHub.add(frontCap);

      // Rear Heavy Tensioner Idler Wheel (Rotates dynamically around X axis)
      const rearIdlerHub = new THREE.Group();
      rearIdlerHub.position.set(0, 0.08, -0.86);
      trackModuleGroup.add(rearIdlerHub);
      targetSideWheels.push(rearIdlerHub);
      wheelsRef.current.push(rearIdlerHub);

      const idlerRim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.20, 24),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.88, roughness: 0.25 })
      );
      idlerRim.rotation.z = Math.PI / 2;
      idlerRim.castShadow = true;
      rearIdlerHub.add(idlerRim);

      const idlerCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.21, 16),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
      );
      idlerCap.rotation.z = Math.PI / 2;
      rearIdlerHub.add(idlerCap);

      // 4 Dual-Wheel Road Bogie Rollers on Articulated Trailing Arms
      const bogieZs = [-0.55, -0.18, 0.18, 0.55];
      bogieZs.forEach((bz, bIdx) => {
        const bogieHub = new THREE.Group();
        bogieHub.position.set(0, -0.06, bz);
        trackModuleGroup.add(bogieHub);
        targetSideWheels.push(bogieHub);
        wheelsRef.current.push(bogieHub);

        // Dual Bogie Wheels (inner and outer discs with center gap for guide horns)
        [-0.07, 0.07].forEach((bx) => {
          const bogieWheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 0.08, 20),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.35 })
          );
          bogieWheel.rotation.z = Math.PI / 2;
          bogieWheel.position.set(bx, 0, 0);
          bogieHub.add(bogieWheel);

          // Solid Vulcanized Heavy Rubber Tire Ring
          const rubberRing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.122, 0.122, 0.078, 20),
            new THREE.MeshStandardMaterial({ color: 0x0a0f1d, roughness: 0.95 })
          );
          rubberRing.rotation.z = Math.PI / 2;
          rubberRing.position.set(bx, 0, 0);
          bogieHub.add(rubberRing);
        });

        // Articulated Swingarm connecting Bogie to Track Frame
        const swingarm = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.05, 0.12),
          chassisMat
        );
        swingarm.position.set(0, 0.05, bz);
        trackModuleGroup.add(swingarm);

        // Suspension Shock Absorber Coil & Damper (Hooked to the 4 main corner bogies for dynamic articulation)
        if (bIdx === 0 || bIdx === 3) {
          const suspAssembly = new THREE.Group();
          suspAssembly.position.set(0, 0.06, bz);
          trackModuleGroup.add(suspAssembly);

          const springGeo = new THREE.TubeGeometry(new HelixCurve(0.038, 0.028, 5), 32, 0.006, 8, false);
          const spring = new THREE.Mesh(
            springGeo,
            new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 })
          );
          spring.position.set(0, 0.02, 0);
          suspAssembly.add(spring);
          suspensionSpringsRef.current.push(spring);

          const damperPiston = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, 0.16, 12),
            new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.98, roughness: 0.08 })
          );
          damperPiston.position.set(0, 0.10, 0);
          suspAssembly.add(damperPiston);
          damperPistonsRef.current.push(damperPiston);
        }
      });

      // 2 Top Return Rollers supporting upper track run
      [-0.34, 0.34].forEach((rz) => {
        const rollerHub = new THREE.Group();
        rollerHub.position.set(0, 0.18, rz);
        trackModuleGroup.add(rollerHub);
        targetSideWheels.push(rollerHub);
        wheelsRef.current.push(rollerHub);

        const rollerWheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.065, 0.065, 0.20, 16),
          new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.3 })
        );
        rollerWheel.rotation.z = Math.PI / 2;
        rollerHub.add(rollerWheel);
      });

      // Construct Closed-Loop 3D Track Belt Ribbon Mesh
      const posArray = new Float32Array(ribbonSampleCount * 2 * 3);
      const uvArray = new Float32Array(ribbonSampleCount * 2 * 2);
      const indices: number[] = [];

      const hw = trackRibbonWidth / 2;
      for (let i = 0; i < ribbonSampleCount; i++) {
        const p = trackPoints[i];
        const v = (i / ribbonSampleCount) * 4.0; // repeats 4 times around track loop

        // Left vertex
        posArray[i * 6] = -hw;
        posArray[i * 6 + 1] = p.y;
        posArray[i * 6 + 2] = p.z;
        uvArray[i * 4] = 0;
        uvArray[i * 4 + 1] = v;

        // Right vertex
        posArray[i * 6 + 3] = hw;
        posArray[i * 6 + 4] = p.y;
        posArray[i * 6 + 5] = p.z;
        uvArray[i * 4 + 2] = 1;
        uvArray[i * 4 + 3] = v;

        const next = (i + 1) % ribbonSampleCount;
        const i0 = i * 2;
        const i1 = i * 2 + 1;
        const i2 = next * 2;
        const i3 = next * 2 + 1;

        indices.push(i0, i1, i2);
        indices.push(i1, i3, i2);
      }

      const trackBeltGeo = new THREE.BufferGeometry();
      trackBeltGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      trackBeltGeo.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
      trackBeltGeo.setIndex(indices);
      trackBeltGeo.computeVertexNormals();

      // PBR Crawler Track Texture with Vulcanized Cleats, Pins & Guide Slots
      const trackTex = createCrawlerTrackTexture();
      trackTex.map.wrapS = THREE.RepeatWrapping;
      trackTex.map.wrapT = THREE.RepeatWrapping;
      trackTex.bumpMap.wrapS = THREE.RepeatWrapping;
      trackTex.bumpMap.wrapT = THREE.RepeatWrapping;

      const trackMat = new THREE.MeshStandardMaterial({
        map: trackTex.map,
        bumpMap: trackTex.bumpMap,
        bumpScale: 0.08,
        roughness: 0.88,
        metalness: 0.32,
        side: THREE.DoubleSide
      });
      trackBeltMatsRef.current.push(trackMat);

      const trackMesh = new THREE.Mesh(trackBeltGeo, trackMat);
      trackMesh.castShadow = true;
      trackMesh.receiveShadow = true;
      trackModuleGroup.add(trackMesh);

      // 22 3D Chevron Grouser Cleats around track loop for physical grip relief
      for (let g = 0; g < 22; g++) {
        const u = g / 22;
        const pt = trackProfileCurve.getPointAt(u);
        const tan = trackProfileCurve.getTangentAt(u).normalize();
        const norm = new THREE.Vector3(1, 0, 0).cross(tan).normalize();

        const cleatGroup = new THREE.Group();
        cleatGroup.position.copy(pt);

        const rotMat = new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), norm, tan);
        cleatGroup.quaternion.setFromRotationMatrix(rotMat);

        const cleat = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, 0.024, 0.038),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95, metalness: 0.4 })
        );
        cleat.position.set(0, 0.012, 0);
        cleatGroup.add(cleat);

        // Center Guide Horn Tooth
        const horn = new THREE.Mesh(
          new THREE.ConeGeometry(0.016, 0.042, 4),
          galvanizedMat
        );
        horn.position.set(0, -0.022, 0);
        cleatGroup.add(horn);

        trackModuleGroup.add(cleatGroup);
        trackCleatsRef.current.push({ mesh: cleatGroup, baseU: u, side: isLeft ? 'left' : 'right' });
      }

      // Armored Track Mud/Rock Deflector Armor Skirt with Hazard Stripes
      const skirt = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.14, 1.88),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.88, roughness: 0.3 })
      );
      skirt.position.set(tx > 0 ? 0.16 : -0.16, 0.22, 0);
      trackModuleGroup.add(skirt);
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

    // Laser line projection down to ground footprint (Parented to vehicleGroup for aligned coordinates)
    const linePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.7, 0)];
    const vectorLineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const vectorLineMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 });
    const comVectorLine = new THREE.Line(vectorLineGeo, vectorLineMat);
    comVectorLineRef.current = comVectorLine;
    vehicleGroup.add(comVectorLine);

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

    // Ground footprint perimeter line loop (Track Contact Polygon)
    const footprintPts = [
      new THREE.Vector3(-0.68, -0.24, 0.80), // FL
      new THREE.Vector3(0.68, -0.24, 0.80),  // FR
      new THREE.Vector3(0.68, -0.24, -0.80), // RR
      new THREE.Vector3(-0.68, -0.24, -0.80) // RL
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

    // 1. Rover Track Gauge: 1.48 m
    const widthPts = [new THREE.Vector3(-0.74, 0.42, 1.15), new THREE.Vector3(0.74, 0.42, 1.15)];
    const widthLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(widthPts), dimLineMat);
    cadDimensionsGroup.add(widthLine);
    [-0.74, 0.74].forEach((tx) => {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.12, 0.015), tickMat);
      tick.position.set(tx, 0.42, 1.15);
      cadDimensionsGroup.add(tick);
    });
    const widthBadgeTex = createCadDimensionBadge('Track Outer Gauge', '1.48 m', 'Extreme-Mobility Rover Spec');
    const widthBadge = createBadgeSprite(widthBadgeTex, 0, 0.68, 1.15);
    cadDimensionsGroup.add(widthBadge);

    // 2. Belly Clearance: 340 mm
    const gcPts = [new THREE.Vector3(0.82, -0.24, 0.1), new THREE.Vector3(0.82, 0.10, 0.1)];
    const gcLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(gcPts), dimLineMat);
    cadDimensionsGroup.add(gcLine);
    [-0.24, 0.10].forEach((ty) => {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.015), tickMat);
      tick.position.set(0.82, ty, 0.1);
      cadDimensionsGroup.add(tick);
    });
    const gcBadgeTex = createCadDimensionBadge('Belly Clearance', '340 mm', 'Armored Skid Plate Standard');
    const gcBadge = createBadgeSprite(gcBadgeTex, 0.94, -0.07, 0.1);
    cadDimensionsGroup.add(gcBadge);

    // 3. Laden CoM Height: 0.36 m
    const comPts = [new THREE.Vector3(-0.82, -0.24, -0.28), new THREE.Vector3(-0.82, 0.36, -0.28)];
    const comLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(comPts), dimLineMat);
    cadDimensionsGroup.add(comLine);
    [-0.24, 0.36].forEach((ty) => {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.015), tickMat);
      tick.position.set(-0.82, ty, -0.28);
      cadDimensionsGroup.add(tick);
    });
    const comBadgeTex = createCadDimensionBadge('Laden CoM Height', '0.36 m', 'Low-CoM Anti-Rollover Center');
    const comBadge = createBadgeSprite(comBadgeTex, -0.94, 0.18, -0.28);
    cadDimensionsGroup.add(comBadge);

    // 4. Track Contact Length: 1.70 m
    const trackPts = [new THREE.Vector3(-0.68, -0.24, 0.80), new THREE.Vector3(-0.68, -0.24, -0.80)];
    const trackLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(trackPts), dimLineMat);
    cadDimensionsGroup.add(trackLine);
    [-0.80, 0.80].forEach((tz) => {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.015), tickMat);
      tick.position.set(-0.68, -0.24, tz);
      cadDimensionsGroup.add(tick);
    });
    const trackBadgeTex = createCadDimensionBadge('Ground Contact Length', '1.70 m', '18.4 kPa Low Ground Pressure');
    const trackBadge = createBadgeSprite(trackBadgeTex, 0, -0.16, 0.96);
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
      const h = container.clientHeight || 820;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. Physics & Animation Driving Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Rolling Real-Time Performance & Measured FPS Measurement
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 500) {
        const elapsedSec = (now - lastFpsTimeRef.current) / 1000;
        const curFps = Math.round((frameCountRef.current / elapsedSec) * 10) / 10;
        const curFrameTime = Math.round((1000 / Math.max(1, curFps)) * 10) / 10;
        setMeasuredFps(curFps);
        setMeasuredFrameTimeMs(curFrameTime);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

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

        // Active Worksite Target Determination
        const currentWorksite = selectedWorksiteRef.current;
        const targetWorksiteT = currentWorksite === 'alley' ? 0.18 : currentWorksite === 'station' ? 0.42 : 0.98;

        // Stress Test Handling
        if (currentStress === 'hill_brake') {
          // Lock vehicle on 28° incline with hard braking deceleration
          pathProgressRef.current = THREE.MathUtils.lerp(pathProgressRef.current, 0.35, 0.08);
          stressTimerRef.current += delta;
        } else if (currentStress === 'hairpin_turn') {
          // Lock vehicle in apex of tight hairpin curve at 20 km/h
          pathProgressRef.current = THREE.MathUtils.lerp(pathProgressRef.current, 0.225, 0.06);
          stressTimerRef.current += delta;
        } else if (currentStress === 'freeze_surge') {
          // Sub-zero viscous progression
          const speedFactor = (currentSpeed / 14) * 0.018;
          pathProgressRef.current = (pathProgressRef.current + delta * speedFactor) % 1;
        } else if (currentStress === 'muddy_traction') {
          // Slippery mountain clay: crawler track grousers bite with 28 kPa contact pressure
          const speedFactor = (currentSpeed / 14) * 0.014;
          pathProgressRef.current = (pathProgressRef.current + delta * speedFactor) % 1;
        } else if (currentStress === 'narrow_alley') {
          // Navigate tight 1.5m clearance alleyway at t=0.18
          pathProgressRef.current = THREE.MathUtils.lerp(pathProgressRef.current, 0.18, 0.05);
        } else if (currentDrive === 'auto_climb') {
          // Transport Safety Interlock: Block travel if piston is unseated or unlocked
          if (pistonStrokeMmRef.current > 5 || !isTransportLockedRef.current) {
            setInterlockWarning('TRANSPORT INTERLOCK: Compaction piston must be in Top Home (0mm) position with Transport Lock Pins engaged before vehicle travel is permitted!');
          } else {
            const speedFactor = (currentSpeed / 14) * 0.026;
            pathProgressRef.current = (pathProgressRef.current + delta * speedFactor) % 1;
          }
        } else if (currentDrive === 'manual') {
          // Transport Safety Interlock for manual throttle
          if (pistonStrokeMmRef.current > 5 || !isTransportLockedRef.current) {
            setInterlockWarning('TRANSPORT INTERLOCK: Compaction piston must be in Top Home (0mm) position with Transport Lock Pins engaged before vehicle travel is permitted!');
          } else {
            const speedFactor = (currentSpeed / 14) * 0.035;
            pathProgressRef.current = Math.max(
              0.01,
              Math.min(0.99, pathProgressRef.current + manualThrottleRef.current * delta * speedFactor)
            );
            // Lateral steering across road surface (±1.15m within road lane)
            lateralOffsetRef.current = THREE.MathUtils.clamp(
              lateralOffsetRef.current + manualSteerRef.current * delta * 1.6,
              -1.15,
              1.15
            );
            if (manualSteerRef.current === 0 && Math.abs(manualThrottleRef.current) > 0) {
              lateralOffsetRef.current = THREE.MathUtils.lerp(lateralOffsetRef.current, 0, delta * 0.5);
            }
          }
        }

        // 10-Stage Mechanized Desludging & Dewatering Workflow Orchestration
        const curStage = workflowStageRef.current;
        const isDeployStage = [
          '3_DEPLOY_STABILIZERS_HOSE',
          '4_PRIME_PUMP',
          '5_EXTRACT_SLUDGE',
          '6_SETTLE_SLUDGE',
          '7_COMPACT_SLUDGE'
        ].includes(curStage);

        // World coordinates of active worksite manhole and vehicle intake manifold
        let activeWorksitePt = summitGroupRef.current
          ? summitGroupRef.current.localToWorld(new THREE.Vector3(0, 0.25, 0))
          : roadCurveRef.current.getPoint(0.98).clone().add(new THREE.Vector3(0, 0.25, 0));

        if (currentWorksite === 'alley' && alleyManholeRef.current) {
          activeWorksitePt = alleyManholeRef.current.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.08, 0));
        } else if (currentWorksite === 'station' && serviceManholeRef.current) {
          activeWorksitePt = serviceManholeRef.current.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.08, 0));
        }

        const manifoldPt = vehicleGroupRef.current
          ? vehicleGroupRef.current.localToWorld(new THREE.Vector3(0, 0.45, 1.10))
          : activeWorksitePt.clone().add(new THREE.Vector3(0, 0.98, 1.10));

        const dynamicHoseCurve = new THREE.CatmullRomCurve3([
          activeWorksitePt,
          activeWorksitePt.clone().lerp(manifoldPt, 0.35).add(new THREE.Vector3(0, 0.55, 0)),
          activeWorksitePt.clone().lerp(manifoldPt, 0.70).add(new THREE.Vector3(0, 0.35, 0)),
          manifoldPt
        ]);

        if (isDeployStage) {
          // Plant hydraulic outriggers firmly into ground
          outriggersRef.current.forEach((jack) => {
            jack.position.y = THREE.MathUtils.lerp(jack.position.y, -0.28, 0.08);
          });
          // Articulate suction crane boom towards vault manhole
          if (suctionArmRef.current) {
            suctionArmRef.current.rotation.x = THREE.MathUtils.lerp(suctionArmRef.current.rotation.x, -0.65, 0.08);
          }
          // Dynamic flexible suction hose tube
          if (suctionHoseTubeRef.current) {
            suctionHoseTubeRef.current.geometry.dispose();
            suctionHoseTubeRef.current.geometry = new THREE.TubeGeometry(dynamicHoseCurve, 24, 0.038, 8, false);
            suctionHoseTubeRef.current.visible = true;
          }
        } else {
          // Stow outriggers & suction boom for travel
          outriggersRef.current.forEach((jack) => {
            jack.position.y = THREE.MathUtils.lerp(jack.position.y, -0.06, 0.08);
          });
          if (suctionArmRef.current) {
            suctionArmRef.current.rotation.x = THREE.MathUtils.lerp(suctionArmRef.current.rotation.x, 0.0, 0.08);
          }
          if (suctionHoseTubeRef.current) {
            suctionHoseTubeRef.current.visible = false;
          }
        }

        // Stage-by-Stage Operational Sequencing
        if (curStage === '1_DRIVE_TO_SITE') {
          if (isAutoWorkflowRunningRef.current) {
            workflowTimerRef.current += delta;
            const distToWorksite = Math.abs(pathProgressRef.current - targetWorksiteT);
            if (distToWorksite < 0.03 || workflowTimerRef.current >= 6.0) {
              transitionToWorkflowStage('2_POSITION_VEHICLE');
            }
          }
        } else if (curStage === '2_POSITION_VEHICLE') {
          // Bring vehicle to smooth stop and align intake manifold with manhole
          pathProgressRef.current = THREE.MathUtils.lerp(pathProgressRef.current, targetWorksiteT, 0.08);
          vehicleSpeedKmhRef.current = 0;
          driveModeRef.current = 'parked';
          isTransportReadyRef.current = false;
          if (isAutoWorkflowRunningRef.current) {
            workflowTimerRef.current += delta;
            if (workflowTimerRef.current >= 2.0) {
              transitionToWorkflowStage('3_DEPLOY_STABILIZERS_HOSE');
            }
          }
        } else if (curStage === '3_DEPLOY_STABILIZERS_HOSE') {
          pathProgressRef.current = targetWorksiteT;
          vehicleSpeedKmhRef.current = 0;
          driveModeRef.current = 'parked';
          isTransportReadyRef.current = false;
          if (isAutoWorkflowRunningRef.current) {
            workflowTimerRef.current += delta;
            if (workflowTimerRef.current >= 2.5) {
              transitionToWorkflowStage('4_PRIME_PUMP');
            }
          }
        } else if (curStage === '4_PRIME_PUMP') {
          pathProgressRef.current = targetWorksiteT;
          vehicleSpeedKmhRef.current = 0;
          driveModeRef.current = 'parked';
          isTransportReadyRef.current = false;
          if (maceratorBladesRef.current) {
            maceratorBladesRef.current.rotation.z += delta * 20;
          }
          suctionVacuumKpaRef.current = THREE.MathUtils.lerp(suctionVacuumKpaRef.current, -48.0, delta * 2.0);
          extractionRateLpmRef.current = THREE.MathUtils.lerp(extractionRateLpmRef.current, 60.0, delta * 2.0);
          if (isAutoWorkflowRunningRef.current) {
            workflowTimerRef.current += delta;
            if (workflowTimerRef.current >= 2.0) {
              transitionToWorkflowStage('5_EXTRACT_SLUDGE');
            }
          }
        } else if (curStage === '5_EXTRACT_SLUDGE') {
          pathProgressRef.current = targetWorksiteT;
          vehicleSpeedKmhRef.current = 0;
          driveModeRef.current = 'parked';
          isTransportReadyRef.current = false;
          suctionVacuumKpaRef.current = -68.5;
          extractionRateLpmRef.current = 150.0;
          if (maceratorBladesRef.current) {
            maceratorBladesRef.current.rotation.z += delta * 28;
          }

          // Transfer sludge from source vault into vehicle collection tank (Strict conservation: V_source + V_tank = 1200L)
          const transferRateLps = 48.0; // Scaled simulation speed (fills 400L in ~8.3s)
          const deltaL = Math.min(400 - collectionTankVolumeLRef.current, transferRateLps * delta);
          collectionTankVolumeLRef.current += deltaL;
          sourceVaultVolumeLRef.current = 1200 - collectionTankVolumeLRef.current;

          // Slurry flow particles VFX along hose curve
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

          // Pit liquid drops
          if (pitLiquidRef.current && currentWorksite === 'summit') {
            pitLiquidRef.current.scale.y = Math.max(0.1, sourceVaultVolumeLRef.current / 1200);
            pitLiquidRef.current.position.y = -0.6 - (1 - sourceVaultVolumeLRef.current / 1200) * 0.35;
          }

          // Vehicle collection tank fills up
          if (vehicleTankLiquidRef.current) {
            vehicleTankLiquidRef.current.scale.y = 0.15 + (collectionTankVolumeLRef.current / 400) * 0.85;
          }

          // Level sight float rises
          if (levelSightFloatRef.current) {
            levelSightFloatRef.current.position.y = 0.46 - 0.16 + (collectionTankVolumeLRef.current / 400) * 0.32;
          }

          // Pump audio
          if (pumpGainRef.current) {
            pumpGainRef.current.gain.setValueAtTime(0.2, audioCtxRef.current?.currentTime || 0);
          }

          if (isAutoWorkflowRunningRef.current) {
            workflowTimerRef.current += delta;
            if (collectionTankVolumeLRef.current >= 400 || workflowTimerRef.current >= 9.0) {
              transitionToWorkflowStage('6_SETTLE_SLUDGE');
            }
          }
        } else if (curStage === '6_SETTLE_SLUDGE') {
          pathProgressRef.current = targetWorksiteT;
          vehicleSpeedKmhRef.current = 0;
          driveModeRef.current = 'parked';
          isTransportReadyRef.current = false;
          extractionRateLpmRef.current = 0;
          suctionVacuumKpaRef.current = 0;
          if (suctionFlowPointsRef.current) suctionFlowPointsRef.current.visible = false;
          if (pumpGainRef.current) {
            pumpGainRef.current.gain.setValueAtTime(0, audioCtxRef.current?.currentTime || 0);
          }
          if (isAutoWorkflowRunningRef.current) {
            workflowTimerRef.current += delta;
            if (workflowTimerRef.current >= 2.0) {
              transitionToWorkflowStage('7_COMPACT_SLUDGE');
            }
          }
        } else if (curStage === '7_COMPACT_SLUDGE') {
          pathProgressRef.current = targetWorksiteT;
          vehicleSpeedKmhRef.current = 0;
          driveModeRef.current = 'parked';
          isTransportReadyRef.current = false;
          pistonModeRef.current = 'EXTENDING';
          isTransportLockedRef.current = false;
          if (isAutoWorkflowRunningRef.current) {
            workflowTimerRef.current += delta;
            if (pistonStrokeMmRef.current >= 520 || workflowTimerRef.current >= 8.0) {
              transitionToWorkflowStage('8_SECURE_PISTON');
            }
          }
        } else if (curStage === '8_SECURE_PISTON') {
          pathProgressRef.current = targetWorksiteT;
          vehicleSpeedKmhRef.current = 0;
          driveModeRef.current = 'parked';
          isTransportReadyRef.current = false;
          pistonModeRef.current = 'RETRACTING';
          if (isAutoWorkflowRunningRef.current) {
            workflowTimerRef.current += delta;
            if (pistonStrokeMmRef.current <= 0 && workflowTimerRef.current >= 3.0) {
              transitionToWorkflowStage('9_CONFIRM_TRANSPORT_READY');
            }
          }
        } else if (curStage === '9_CONFIRM_TRANSPORT_READY') {
          pathProgressRef.current = targetWorksiteT;
          vehicleSpeedKmhRef.current = 0;
          driveModeRef.current = 'parked';
          pistonStrokeMmRef.current = 0;
          isTransportLockedRef.current = true;
          pistonModeRef.current = 'LOCKED';
          isTransportReadyRef.current = true;
          if (isAutoWorkflowRunningRef.current) {
            workflowTimerRef.current += delta;
            if (workflowTimerRef.current >= 2.0) {
              transitionToWorkflowStage('10_RESUME_DRIVING');
            }
          }
        } else if (curStage === '10_RESUME_DRIVING') {
          pistonStrokeMmRef.current = 0;
          isTransportLockedRef.current = true;
          pistonModeRef.current = 'LOCKED';
          isTransportReadyRef.current = true;
          if (currentDrive === 'auto_climb') {
            const speedFactor = (currentSpeed / 14) * 0.026;
            pathProgressRef.current = (pathProgressRef.current + delta * speedFactor) % 1;
          }
          if (isAutoWorkflowRunningRef.current) {
            setIsAutoWorkflowRunning(false);
            isAutoWorkflowRunningRef.current = false;
          }
        }

        // Hide flow particles & tube when not in stage 5
        if (curStage !== '5_EXTRACT_SLUDGE') {
          if (suctionFlowPointsRef.current) suctionFlowPointsRef.current.visible = false;
        }

        // Manual Piston Mode Execution (Outside Auto Mission Sequence)
        const currentSludge = sludgeTypeRef.current;
        const dewaterFactor = currentSludge === 'raw_sludge' ? 0.42 : currentSludge === 'digested_biosolids' ? 0.22 : 0.35;
        const dynamicCompactionParams: SludgeCompactionParameters = {
          ...DEFAULT_COMPACTION_PARAMS,
          strokeMaxMm: maxStrokeLimitMmRef.current,
          reliefPressureBar: reliefPressureLimitBarRef.current,
          dewaterabilityFactor: dewaterFactor
        };

        if (currentDrive !== 'desludge') {
          if (isEStopActiveRef.current) {
            if (pistonModeRef.current === 'EXTENDING' || pistonModeRef.current === 'RETRACTING') {
              pistonModeRef.current = 'HOLD';
              setPistonMode('HOLD');
            }
          } else {
            const curPistonMode = pistonModeRef.current;
            if (curPistonMode === 'EXTENDING') {
              if (currentDrive !== 'parked' || vehicleSpeedKmhRef.current > 0.1) {
                setInterlockWarning('MOTION INTERLOCK: Compaction piston cannot extend while vehicle is in motion!');
                pistonModeRef.current = 'HOLD';
                setPistonMode('HOLD');
              } else {
                isTransportLockedRef.current = false;
                const maxStroke = maxStrokeLimitMmRef.current;
                const nextStroke = Math.min(maxStroke, pistonStrokeMmRef.current + delta * 35);
                pistonStrokeMmRef.current = nextStroke;

                // Check instantaneous hydraulic pressure against relief limit
                const curDewater = calculateDewateringState(nextStroke, 0, 400, dynamicCompactionParams);
                if (curDewater.hydraulicPressureBar >= reliefPressureLimitBarRef.current) {
                  pistonModeRef.current = 'HOLD';
                  setPistonMode('HOLD');
                  isReliefValveOpenRef.current = true;
                  setIsReliefValveOpen(true);
                  setInterlockWarning(`PRESSURE RELIEF LIMIT REACHED: Hydraulic pressure reached relief setpoint (${reliefPressureLimitBarRef.current} bar). Compaction held.`);
                } else if (nextStroke >= maxStroke) {
                  pistonModeRef.current = 'HOLD';
                  setPistonMode('HOLD');
                  setInterlockWarning(`STROKE LIMIT REACHED: Reached maximum configured stroke (${maxStroke} mm). Switching to HOLD.`);
                }
              }
            } else if (curPistonMode === 'RETRACTING') {
              isReliefValveOpenRef.current = false;
              setIsReliefValveOpen(false);
              isTransportLockedRef.current = false;
              pistonStrokeMmRef.current = Math.max(0, pistonStrokeMmRef.current - delta * 60);
              if (pistonStrokeMmRef.current <= 0) {
                pistonStrokeMmRef.current = 0;
                pistonModeRef.current = 'HOME';
                setPistonMode('HOME');
              }
            } else if (curPistonMode === 'LOCKED') {
              pistonStrokeMmRef.current = 0;
              isTransportLockedRef.current = true;
            }
          }
        }

        // Safety Invariant: Inhibit vehicle travel if platen not seated at 0mm with transport lock pin engaged
        if (currentDrive === 'auto_climb' || currentDrive === 'manual') {
          if (pistonStrokeMmRef.current > 5 || !isTransportLockedRef.current) {
            driveModeRef.current = 'parked';
            setDriveMode('parked');
            setVehicleSpeedKmh(0);
            setInterlockWarning('TRANSPORT INTERLOCK: Platen movement detected while in motion! Motion halted.');
          }
        }

        // =====================================================================
        // COMPACTION KINEMATICS & DEWATERING 3D MESH ARTICULATION
        // =====================================================================
        const strokeMm = pistonStrokeMmRef.current;
        const strokeRatio = strokeMm / (maxStrokeLimitMmRef.current || 600);

        // Dewatering physics calculations via sludgeCompactionModel with configurable rheology
        const dewateringResult = calculateDewateringState(
          strokeMm,
          0, // Contact occurs at top of loaded sludge bed
          400, // Initial 400L batch
          dynamicCompactionParams
        );

        // Update Compaction Platen Vertical Position (y: 0.72 -> 0.25)
        if (compactionPlatenRef.current) {
          compactionPlatenRef.current.position.y = 0.72 - strokeRatio * 0.47;
        }

        // Update Guided Chrome Piston Rod Extension
        if (pistonRodRef.current) {
          pistonRodRef.current.position.y = 0.92 - strokeRatio * 0.235;
          pistonRodRef.current.scale.y = 1.0 + strokeRatio * 0.75;
        }

        // Update Expressed Translucent Liquid Filtrate Layer
        if (filtrateMeshRef.current) {
          if (strokeMm > 25) {
            filtrateMeshRef.current.visible = true;
            filtrateMeshRef.current.position.y = 0.72 - strokeRatio * 0.47 + 0.025;
            (filtrateMeshRef.current.material as THREE.MeshPhysicalMaterial).opacity = Math.min(
              0.85,
              0.25 + strokeRatio * 0.60
            );
          } else {
            filtrateMeshRef.current.visible = false;
            (filtrateMeshRef.current.material as THREE.MeshPhysicalMaterial).opacity = 0;
          }
        }

        // Update Sludge Bed Compression underneath platen
        if (vehicleTankLiquidRef.current && currentDrive !== 'desludge') {
          const compScale = Math.max(0.40, 1.0 - strokeRatio * 0.42);
          vehicleTankLiquidRef.current.scale.y = compScale;
          vehicleTankLiquidRef.current.position.y = -(strokeRatio * 0.12);
        }

        // Update Mechanical Transport Retention Lock Pins
        if (pistonLockPinsRef.current.length === 2) {
          const isLocked = isTransportLockedRef.current;
          const targetL = isLocked ? -0.25 : -0.32;
          const targetR = isLocked ? 0.25 : 0.32;
          pistonLockPinsRef.current[0].position.x = THREE.MathUtils.lerp(
            pistonLockPinsRef.current[0].position.x,
            targetL,
            0.15
          );
          pistonLockPinsRef.current[1].position.x = THREE.MathUtils.lerp(
            pistonLockPinsRef.current[1].position.x,
            targetR,
            0.15
          );
        }

        // Update Safety Lock Status LED
        if (pistonStatusLedRef.current) {
          const ledMat = pistonStatusLedRef.current.material as THREE.MeshBasicMaterial;
          if (isTransportLockedRef.current) {
            ledMat.color.setHex(0x22c55e); // Green: locked & transit-ready
          } else if (pistonModeRef.current === 'EXTENDING' || missionStage === 'compacting') {
            ledMat.color.setHex(0xf59e0b); // Amber: compacting
          } else if (pistonModeRef.current === 'RETRACTING' || missionStage === 'securing') {
            ledMat.color.setHex(0xa855f7); // Purple: retracting
          } else {
            ledMat.color.setHex(0xef4444); // Red: unlocked/holding
          }
        }

        const t = pathProgressRef.current;
        const pt = roadCurveRef.current.getPoint(t);
        const tangent = roadCurveRef.current.getTangent(t).normalize();
        const tNext = Math.min(0.999, t + 0.006);
        const nextPt = roadCurveRef.current.getPoint(tNext);
        const nextTangent = roadCurveRef.current.getTangent(tNext).normalize();

        // VEHICLE POSITION: road sits at pt.y + 0.38m; track lowest plane is -0.24m below vehicleGroup
        // Placing vehicleGroup at pt.y + 0.62m rests track contact bottom flush upon road surface
        const upVector = new THREE.Vector3(0, 1, 0);
        const laneNormal = new THREE.Vector3().crossVectors(upVector, tangent).normalize();
        const vehiclePos = new THREE.Vector3(pt.x, pt.y + 0.62, pt.z).add(
          laneNormal.clone().multiplyScalar(lateralOffsetRef.current)
        );
        vehicleGroupRef.current.position.copy(vehiclePos);

        // FORWARD ORIENTATION: lookTarget with dynamic steering yaw
        const steerYaw = manualSteerRef.current * 0.45;
        const lookTarget = vehiclePos.clone()
          .add(tangent.clone().multiplyScalar(4))
          .add(laneNormal.clone().multiplyScalar(steerYaw));
        vehicleGroupRef.current.lookAt(lookTarget);

        // Grade & Elevation telemetry
        const gradeDeg =
          Math.atan2(tangent.y, Math.sqrt(tangent.x * tangent.x + tangent.z * tangent.z)) * (180 / Math.PI);
        const gradeRad = (gradeDeg * Math.PI) / 180;
        const currentGradeDeg = Math.round(Math.abs(gradeDeg) * 10) / 10;

        // Accurate Centripetal Lateral G-Force from True Road Curvature (kappa = dTheta / ds)
        const h1 = Math.atan2(tangent.x, tangent.z);
        const h2 = Math.atan2(nextTangent.x, nextTangent.z);
        let dHeading = h2 - h1;
        while (dHeading > Math.PI) dHeading -= Math.PI * 2;
        while (dHeading < -Math.PI) dHeading += Math.PI * 2;

        const ds = Math.max(0.1, pt.distanceTo(nextPt));
        const curvature = dHeading / ds; // rad/m (+ for left turn, - for right turn)

        const effectiveSpeedKmh = activeStressTest === 'hill_brake' ? 0 : vehicleSpeedKmh;
        const speedMs = (effectiveSpeedKmh * 1000) / 3600;
        const rawLateralG = (speedMs * speedMs * curvature) / 9.81;

        // Realistic Lateral G: mountain crawl is 0.05G - 0.25G; stress test pushes to 0.38G
        const currentLateralG =
          activeStressTest === 'hairpin_turn'
            ? (!hasBaffles ? 0.38 : 0.22)
            : Math.max(-0.35, Math.min(0.35, Math.round(rawLateralG * 100) / 100));

        // Climbing mechanical power required (kW)
        const massKg = 620 + payloadLiters * 1.1;
        const inclineSin = Math.sin((Math.abs(gradeDeg) * Math.PI) / 180);
        const powerKw =
          activeStressTest === 'freeze_surge'
            ? 11.4
            : (massKg * 9.81 * inclineSin * speedMs) / 1000 / 0.82;

        // Periodic Throttle Sync to React State for Telemetry HUD (every ~200ms / 5Hz to prevent frame drops)
        if (Math.round(elapsed * 10) % 2 === 0) {
          setWorkflowStage(workflowStageRef.current);
          setSourceVaultVolumeL(Math.round(sourceVaultVolumeLRef.current));
          setCollectionTankVolumeL(Math.round(collectionTankVolumeLRef.current));
          setExtractionRateLpm(Math.round(extractionRateLpmRef.current * 10) / 10);
          setSuctionVacuumKpa(Math.round(suctionVacuumKpaRef.current * 10) / 10);
          setIsTransportReady(isTransportReadyRef.current);
          setVehicleSpeedKmh(Math.round(vehicleSpeedKmhRef.current));
          setDriveMode(driveModeRef.current);
          setPistonStrokeMm(Math.round(strokeMm));
          setAppliedPressureBar(dewateringResult.hydraulicPressureBar);
          setCompactionForceKn(
            Math.round(calculateCylinderForceKn(dewateringResult.hydraulicPressureBar, dynamicCompactionParams.boreDiameterMm) * 10) / 10
          );
          setCakeVolumeL(Math.round(dewateringResult.cakeVolumeL));
          setFiltrateVolumeL(Math.round(dewateringResult.filtrateVolumeL));
          setCompactionRatio(dewateringResult.compactionRatio);
          setIsTransportLocked(isTransportLockedRef.current);
          setIsReliefValveOpen(dewateringResult.reliefValveOpen || dewateringResult.hydraulicPressureBar >= reliefPressureLimitBarRef.current);
          setCurrentInclineDeg(currentGradeDeg);
          setCurrentAltitudeM(Math.round(1850 + pt.y * 30));
          setLateralGForce(currentLateralG);
          setActivePowerKw(Math.round(powerKw * 10) / 10);
        }

        // Rotate all drive sprockets, idlers, and bogie rollers forward/reverse with differential track steering
        if (driveMode !== 'parked' && driveMode !== 'desludge' && activeStressTest !== 'hill_brake') {
          const throttleDir = driveMode === 'manual' ? manualThrottleRef.current : 1;
          const steerDir = driveMode === 'manual' ? manualSteerRef.current : 0;

          // Differential track velocities for skid-steer crawler
          let vLeft = throttleDir;
          let vRight = throttleDir;

          if (Math.abs(throttleDir) > 0.01) {
            vLeft -= steerDir * 0.5;
            vRight += steerDir * 0.5;
          } else if (Math.abs(steerDir) > 0.01) {
            // Counter-rotation on pivot turn
            vLeft = -steerDir * 0.65;
            vRight = steerDir * 0.65;
          }

          const baseRate = delta * (vehicleSpeedKmh / 14) * 0.82;
          const deltaU_Left = baseRate * vLeft;
          const deltaU_Right = baseRate * vRight;

          trackProgressLeftRef.current = (trackProgressLeftRef.current + deltaU_Left + 1.0) % 1.0;
          trackProgressRightRef.current = (trackProgressRightRef.current + deltaU_Right + 1.0) % 1.0;
          trackProgressRef.current = (trackProgressRef.current + (deltaU_Left + deltaU_Right) * 0.5 + 1.0) % 1.0;

          // Sprockets and bogie wheels rotate differentially
          if (leftWheelsRef.current && leftWheelsRef.current.length > 0) {
            leftWheelsRef.current.forEach((w) => {
              w.rotation.x -= deltaU_Left * 26.7;
            });
          }
          if (rightWheelsRef.current && rightWheelsRef.current.length > 0) {
            rightWheelsRef.current.forEach((w) => {
              w.rotation.x -= deltaU_Right * 26.7;
            });
          }

          // Continuous caterpillar track belt texture scrolling (Left=0, Right=1)
          if (trackBeltMatsRef.current.length >= 2) {
            const matL = trackBeltMatsRef.current[0];
            if (matL.map) matL.map.offset.y -= deltaU_Left * 4.0;
            if (matL.bumpMap) matL.bumpMap.offset.y -= deltaU_Left * 4.0;

            const matR = trackBeltMatsRef.current[1];
            if (matR.map) matR.map.offset.y -= deltaU_Right * 4.0;
            if (matR.bumpMap) matR.bumpMap.offset.y -= deltaU_Right * 4.0;
          } else {
            trackBeltMatsRef.current.forEach((mat) => {
              if (mat.map) mat.map.offset.y -= baseRate * throttleDir * 4.0;
              if (mat.bumpMap) mat.bumpMap.offset.y -= baseRate * throttleDir * 4.0;
            });
          }

          // Dynamically animate all 3D Chevron Grouser Cleats along continuous track curve
          if (trackProfileCurveRef.current) {
            const curve = trackProfileCurveRef.current;
            const xUnit = new THREE.Vector3(1, 0, 0);
            trackCleatsRef.current.forEach((item) => {
              const curProg = item.side === 'left' ? trackProgressLeftRef.current : trackProgressRightRef.current;
              const currentU = (item.baseU + curProg) % 1.0;
              const cp = curve.getPointAt(currentU);
              const cTan = curve.getTangentAt(currentU).normalize();
              const cNorm = xUnit.clone().cross(cTan).normalize();
              item.mesh.position.copy(cp);
              const rotMat = new THREE.Matrix4().makeBasis(xUnit, cNorm, cTan);
              item.mesh.quaternion.setFromRotationMatrix(rotMat);
            });
          }
        }

        // Autonomous 360-degree spinning LiDAR puck turret
        if (lidarTurretRef.current) {
          lidarTurretRef.current.rotation.y += delta * 12.0;
        }

        // =====================================================================
        // Dynamic Chassis Suspension & Inertial Transfer (Pitch, Roll & Bounce)
        // Stiff mountain crawler suspension: realistic ~1.8°/G roll, max ±3.4°
        // =====================================================================
        const throttleFactor = driveModeRef.current === 'manual' ? manualThrottleRef.current : (effectiveSpeedKmh > 2 ? 0.5 : 0);
        let targetPitch = -throttleFactor * 0.015; // mild 0.8° acceleration squat
        let targetRoll = -currentLateralG * 0.035;  // 1.8° body roll per lateral G

        // Stress test pitch & roll spikes
        if (activeStressTestRef.current === 'hill_brake') {
          // Hard nose-dive under -4.2 m/s² deceleration
          targetPitch = !hasBafflesRef.current ? -0.045 : -0.022; // 2.5° vs 1.2°
        } else if (activeStressTestRef.current === 'hairpin_turn') {
          // Centrifugal lateral lean on sharp hairpin
          targetRoll = !hasBafflesRef.current ? -0.052 : -0.026; // 3.0° vs 1.5°
        }

        // Hard physical mechanical suspension bump-stop limits: max ±3.4° roll, ±2.8° pitch
        targetRoll = Math.max(-0.06, Math.min(0.06, targetRoll));
        targetPitch = Math.max(-0.05, Math.min(0.03, targetPitch));

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
          suspensionSpringsRef.current[0].scale.y = Math.max(0.78, Math.min(1.22, 1.0 - p - r + springRumble));
          // RL (Rear Left)
          suspensionSpringsRef.current[1].scale.y = Math.max(0.78, Math.min(1.22, 1.0 + p - r - springRumble));
          // FR (Front Right)
          suspensionSpringsRef.current[2].scale.y = Math.max(0.78, Math.min(1.22, 1.0 - p + r + springRumble));
          // RR (Rear Right)
          suspensionSpringsRef.current[3].scale.y = Math.max(0.78, Math.min(1.22, 1.0 + p + r - springRumble));

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
        const comY = hasLowComBatteryRef.current ? 0.36 : 0.52;
        const baseSurgeOffset = (currentSurgeCm / 100) * (slopeDegRef.current / 28.0);
        let dynamicSurgeZ = -0.28 - baseSurgeOffset;
        let dynamicSurgeX = (!hasBafflesRef.current ? 0.08 : 0.015) * (currentLateralG / 0.35);

        if (activeStressTestRef.current === 'hill_brake') {
          dynamicSurgeZ += !hasBafflesRef.current ? 0.14 : 0.02;
        } else if (activeStressTestRef.current === 'hairpin_turn') {
          dynamicSurgeX += !hasBafflesRef.current ? 0.10 : 0.02;
        }

        if (comCrosshairRef.current) {
          comCrosshairRef.current.position.set(dynamicSurgeX, comY, dynamicSurgeZ);
        }

        // Apex of Rollover Pyramid
        const apex = new THREE.Vector3(dynamicSurgeX, comY, dynamicSurgeZ);
        const pFL = new THREE.Vector3(-0.68, -0.24, 0.80);
        const pFR = new THREE.Vector3(0.68, -0.24, 0.80);
        const pRR = new THREE.Vector3(0.68, -0.24, -0.80);
        const pRL = new THREE.Vector3(-0.68, -0.24, -0.80);

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
        const groundPlaneY = -0.24;
        const hCom = comY - groundPlaneY;
        const projectedGroundX = dynamicSurgeX + Math.tan(chassisRollRef.current) * hCom;
        const projectedGroundZ = dynamicSurgeZ - Math.tan(chassisPitchRef.current) * hCom;

        if (comVectorLineRef.current) {
          const vGeo = comVectorLineRef.current.geometry;
          vGeo.setFromPoints([apex, new THREE.Vector3(projectedGroundX, groundPlaneY, projectedGroundZ)]);
        }

        // Accurate Stability Margin to crawler track boundary: 0.68m track half-gauge, 0.80m contact length from center
        const normX = Math.abs(projectedGroundX) / 0.68;
        const normZ = Math.abs(projectedGroundZ) / 0.80;
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
            new THREE.Vector3(-0.68, -0.24, -0.85),
            new THREE.Vector3(0.68, -0.24, -0.85),
            new THREE.Vector3(-0.68, -0.24, 0.85),
            new THREE.Vector3(0.68, -0.24, 0.85)
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
          const chaseOffset = tangent.clone().multiplyScalar(-8.5).add(new THREE.Vector3(0, 3.8, 0));
          const targetCamPos = vehiclePos.clone().add(chaseOffset);
          camera.position.lerp(targetCamPos, 0.08);
          controls.target.lerp(vehiclePos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0.1);
        } else if (currentCam === 'cockpit') {
          const cabPos = vehiclePos.clone().add(new THREE.Vector3(0, 0.42, 0)).add(tangent.clone().multiplyScalar(0.7));
          camera.position.copy(cabPos);
          controls.target.copy(vehiclePos.clone().add(tangent.clone().multiplyScalar(10)));
        } else if (currentCam === 'drone') {
          const dronePos = new THREE.Vector3(0, 34, 0);
          camera.position.lerp(dronePos, 0.04);
          controls.target.lerp(vehiclePos, 0.06);
        } else if (currentCam === 'tank') {
          const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
          const tankCamPos = vehiclePos.clone().add(normal.clone().multiplyScalar(2.8)).add(new THREE.Vector3(0, 0.6, 0));
          camera.position.lerp(tankCamPos, 0.08);
          controls.target.lerp(vehiclePos.clone().add(new THREE.Vector3(0, 0.2, -0.28)), 0.1);
        } else if (currentCam === 'desludge') {
          const summitTarget = roadCurveRef.current.getPoint(0.98).clone().add(new THREE.Vector3(0, 0.62, 0));
          const desludgeCamPos = summitTarget.clone().add(new THREE.Vector3(3.8, 3.2, 3.8));
          camera.position.lerp(desludgeCamPos, 0.06);
          controls.target.lerp(summitTarget.clone().add(new THREE.Vector3(0, 0.2, 0)), 0.08);
        } else if (currentCam === 'wheel_axle') {
          // Wheel/Axle Cam: Front-Left crawler drive sprocket & continuous track articulation
          const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
          const flWheel = vehiclePos.clone().add(normal.clone().multiplyScalar(0.72)).add(tangent.clone().multiplyScalar(0.86));
          const camPos = flWheel.clone().add(normal.clone().multiplyScalar(1.05)).add(new THREE.Vector3(0, 0.48, 0)).add(tangent.clone().multiplyScalar(0.55));
          const targetPos = flWheel.clone().add(new THREE.Vector3(0, 0.08, 0)).add(normal.clone().multiplyScalar(-0.15));
          camera.position.lerp(camPos, 0.1);
          controls.target.lerp(targetPos, 0.12);
        } else if (currentCam === 'cinematic_drone') {
          // Cinematic Flyby Drone orbit around rig
          droneOrbitAngleRef.current += delta * 0.22;
          const a = droneOrbitAngleRef.current;
          const orbitR = 9.2 + Math.sin(a * 0.7) * 3.2;
          const orbitH = 4.2 + Math.cos(a * 0.5) * 2.2;
          const dronePos = vehiclePos.clone().add(new THREE.Vector3(Math.cos(a) * orbitR, orbitH, Math.sin(a) * orbitR));
          camera.position.lerp(dronePos, 0.06);
          controls.target.lerp(vehiclePos.clone().add(new THREE.Vector3(0, 0.35, 0)), 0.08);
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
    if (terrainPreset === 'uttarakhand' || terrainPreset === 'aizawl') {
      skyColorHex = isNightMode ? 0x040d12 : 0x0b2520;
    } else if (terrainPreset === 'ladakh') {
      skyColorHex = isNightMode ? 0x060c18 : 0x1a2638;
    } else if (terrainPreset === 'himachal' || terrainPreset === 'shimla') {
      skyColorHex = isNightMode ? 0x050916 : 0x0f1d30;
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

    // Tank Transparency & Cutaway Shader Settings
    if (tankMatRef.current) {
      const isCutaway = cutawayOpacity < 0.85;
      tankMatRef.current.transparent = isCutaway;
      tankMatRef.current.opacity = isCutaway ? Math.max(0.18, cutawayOpacity) : 1.0;
      tankMatRef.current.depthWrite = !isCutaway;
      tankMatRef.current.color.setHex(isCutaway ? 0x38bdf8 : 0x0f766e);
      tankMatRef.current.needsUpdate = true;
      if (tankWorkLightRef.current) {
        tankWorkLightRef.current.intensity = isCutaway ? (1.0 - cutawayOpacity) * 2.8 : 0.0;
      }
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
  const runStressTest = (
    testType: 'none' | 'hill_brake' | 'hairpin_turn' | 'freeze_surge' | 'muddy_traction' | 'narrow_alley'
  ) => {
    setActiveStressTest(testType);
    activeStressTestRef.current = testType;
    stressTimerRef.current = 0;

    if (testType === 'hill_brake') {
      setDriveMode('manual');
      pathProgressRef.current = 0.35;
      setVehicleSpeedKmh(0);
      setSlopeDeg(28.0);
    } else if (testType === 'hairpin_turn') {
      setDriveMode('manual');
      pathProgressRef.current = 0.225;
      setVehicleSpeedKmh(20);
    } else if (testType === 'freeze_surge') {
      setDriveMode('auto_climb');
      setTerrainPreset('ladakh');
      setActiveWeather('snow');
      setSlopeDeg(30.0);
      setVehicleSpeedKmh(12);
    } else if (testType === 'muddy_traction') {
      setDriveMode('auto_climb');
      setActiveWeather('rain');
      setSlopeDeg(26.0);
      setVehicleSpeedKmh(10);
    } else if (testType === 'narrow_alley') {
      setSelectedWorksite('alley');
      selectedWorksiteRef.current = 'alley';
      pathProgressRef.current = 0.18;
      setDriveMode('parked');
      setCameraMode('chase');
    } else {
      setDriveMode('auto_climb');
      setVehicleSpeedKmh(14);
    }
  };

  // 10-Stage Mountain Mission Workflow Transitions
  const transitionToWorkflowStage = (target: MountainWorkflowStage) => {
    setWorkflowStage(target);
    workflowStageRef.current = target;
    workflowTimerRef.current = 0;
    setInterlockWarning(null);

    const targetWorksiteT = selectedWorksite === 'alley' ? 0.18 : selectedWorksite === 'station' ? 0.42 : 0.98;

    switch (target) {
      case '1_DRIVE_TO_SITE':
        setDriveMode('auto_climb');
        driveModeRef.current = 'auto_climb';
        setVehicleSpeedKmh(14);
        vehicleSpeedKmhRef.current = 14;
        setPistonMode('LOCKED');
        pistonModeRef.current = 'LOCKED';
        setIsTransportLocked(true);
        isTransportLockedRef.current = true;
        setPistonStrokeMm(0);
        pistonStrokeMmRef.current = 0;
        setExtractionRateLpm(0);
        extractionRateLpmRef.current = 0;
        setSuctionVacuumKpa(0);
        suctionVacuumKpaRef.current = 0;
        setIsTransportReady(true);
        isTransportReadyRef.current = true;
        setCameraMode('chase');
        cameraModeRef.current = 'chase';
        if (suctionHoseTubeRef.current) suctionHoseTubeRef.current.visible = false;
        if (suctionFlowPointsRef.current) suctionFlowPointsRef.current.visible = false;
        break;

      case '2_POSITION_VEHICLE':
        setDriveMode('parked');
        driveModeRef.current = 'parked';
        setVehicleSpeedKmh(0);
        vehicleSpeedKmhRef.current = 0;
        pathProgressRef.current = targetWorksiteT;
        setIsTransportReady(false);
        isTransportReadyRef.current = false;
        setCameraMode('desludge');
        cameraModeRef.current = 'desludge';
        break;

      case '3_DEPLOY_STABILIZERS_HOSE':
        setDriveMode('parked');
        driveModeRef.current = 'parked';
        setVehicleSpeedKmh(0);
        vehicleSpeedKmhRef.current = 0;
        setIsTransportReady(false);
        isTransportReadyRef.current = false;
        setCameraMode('desludge');
        cameraModeRef.current = 'desludge';
        if (suctionHoseTubeRef.current) suctionHoseTubeRef.current.visible = true;
        break;

      case '4_PRIME_PUMP':
        setDriveMode('parked');
        driveModeRef.current = 'parked';
        setVehicleSpeedKmh(0);
        vehicleSpeedKmhRef.current = 0;
        setIsTransportReady(false);
        isTransportReadyRef.current = false;
        setSuctionVacuumKpa(-45.0);
        suctionVacuumKpaRef.current = -45.0;
        setExtractionRateLpm(60.0);
        extractionRateLpmRef.current = 60.0;
        setCameraMode('desludge');
        cameraModeRef.current = 'desludge';
        if (suctionHoseTubeRef.current) suctionHoseTubeRef.current.visible = true;
        break;

      case '5_EXTRACT_SLUDGE':
        setDriveMode('parked');
        driveModeRef.current = 'parked';
        setVehicleSpeedKmh(0);
        vehicleSpeedKmhRef.current = 0;
        setIsTransportReady(false);
        isTransportReadyRef.current = false;
        setSuctionVacuumKpa(-68.5);
        suctionVacuumKpaRef.current = -68.5;
        setExtractionRateLpm(150.0);
        extractionRateLpmRef.current = 150.0;
        setCameraMode('desludge');
        cameraModeRef.current = 'desludge';
        if (suctionHoseTubeRef.current) suctionHoseTubeRef.current.visible = true;
        if (suctionFlowPointsRef.current) suctionFlowPointsRef.current.visible = true;
        break;

      case '6_SETTLE_SLUDGE':
        setDriveMode('parked');
        driveModeRef.current = 'parked';
        setVehicleSpeedKmh(0);
        vehicleSpeedKmhRef.current = 0;
        setIsTransportReady(false);
        isTransportReadyRef.current = false;
        setExtractionRateLpm(0);
        extractionRateLpmRef.current = 0;
        setSuctionVacuumKpa(0);
        suctionVacuumKpaRef.current = 0;
        if (suctionFlowPointsRef.current) suctionFlowPointsRef.current.visible = false;
        break;

      case '7_COMPACT_SLUDGE':
        setDriveMode('parked');
        driveModeRef.current = 'parked';
        setVehicleSpeedKmh(0);
        vehicleSpeedKmhRef.current = 0;
        setIsTransportReady(false);
        isTransportReadyRef.current = false;
        setIsTransportLocked(false);
        isTransportLockedRef.current = false;
        setPistonMode('EXTENDING');
        pistonModeRef.current = 'EXTENDING';
        setCameraMode('tank');
        cameraModeRef.current = 'tank';
        if (cutawayOpacity >= 0.85) setCutawayOpacity(0.35);
        break;

      case '8_SECURE_PISTON':
        setDriveMode('parked');
        driveModeRef.current = 'parked';
        setVehicleSpeedKmh(0);
        vehicleSpeedKmhRef.current = 0;
        setIsTransportReady(false);
        isTransportReadyRef.current = false;
        setPistonMode('RETRACTING');
        pistonModeRef.current = 'RETRACTING';
        setCameraMode('tank');
        cameraModeRef.current = 'tank';
        break;

      case '9_CONFIRM_TRANSPORT_READY':
        setDriveMode('parked');
        driveModeRef.current = 'parked';
        setVehicleSpeedKmh(0);
        vehicleSpeedKmhRef.current = 0;
        setPistonMode('LOCKED');
        pistonModeRef.current = 'LOCKED';
        setIsTransportLocked(true);
        isTransportLockedRef.current = true;
        setPistonStrokeMm(0);
        pistonStrokeMmRef.current = 0;
        setIsTransportReady(true);
        isTransportReadyRef.current = true;
        setCameraMode('chase');
        cameraModeRef.current = 'chase';
        if (suctionHoseTubeRef.current) suctionHoseTubeRef.current.visible = false;
        if (suctionFlowPointsRef.current) suctionFlowPointsRef.current.visible = false;
        break;

      case '10_RESUME_DRIVING':
        setPistonMode('LOCKED');
        pistonModeRef.current = 'LOCKED';
        setIsTransportLocked(true);
        isTransportLockedRef.current = true;
        setPistonStrokeMm(0);
        pistonStrokeMmRef.current = 0;
        setIsTransportReady(true);
        isTransportReadyRef.current = true;
        setDriveMode('auto_climb');
        driveModeRef.current = 'auto_climb';
        setVehicleSpeedKmh(14);
        vehicleSpeedKmhRef.current = 14;
        setCameraMode('chase');
        cameraModeRef.current = 'chase';
        if (suctionHoseTubeRef.current) suctionHoseTubeRef.current.visible = false;
        if (suctionFlowPointsRef.current) suctionFlowPointsRef.current.visible = false;
        break;
    }
  };

  const advanceWorkflowStep = () => {
    const curIdx = MOUNTAIN_WORKFLOW_STEPS.findIndex((s) => s.id === workflowStageRef.current);
    if (curIdx >= 0 && curIdx < MOUNTAIN_WORKFLOW_STEPS.length - 1) {
      transitionToWorkflowStage(MOUNTAIN_WORKFLOW_STEPS[curIdx + 1].id);
    }
  };

  const prevWorkflowStep = () => {
    const curIdx = MOUNTAIN_WORKFLOW_STEPS.findIndex((s) => s.id === workflowStageRef.current);
    if (curIdx > 0) {
      transitionToWorkflowStage(MOUNTAIN_WORKFLOW_STEPS[curIdx - 1].id);
    }
  };

  const resetWorkflow = () => {
    setIsAutoWorkflowRunning(false);
    isAutoWorkflowRunningRef.current = false;
    setSourceVaultVolumeL(1200);
    sourceVaultVolumeLRef.current = 1200;
    setCollectionTankVolumeL(0);
    collectionTankVolumeLRef.current = 0;
    setCakeVolumeL(0);
    setFiltrateVolumeL(0);
    setCompactionRatio(1.0);
    transitionToWorkflowStage('1_DRIVE_TO_SITE');
  };

  const toggleAutoWorkflow = () => {
    const nextRunning = !isAutoWorkflowRunning;
    setIsAutoWorkflowRunning(nextRunning);
    isAutoWorkflowRunningRef.current = nextRunning;
    if (nextRunning && workflowStage === '10_RESUME_DRIVING') {
      resetWorkflow();
      setIsAutoWorkflowRunning(true);
      isAutoWorkflowRunningRef.current = true;
    }
  };

  // Launch Full Automated Desludging Mission at target worksite
  const startDesludgingMission = (worksite: 'alley' | 'station' | 'summit' = selectedWorksite) => {
    runStressTest('none');
    setSelectedWorksite(worksite);
    selectedWorksiteRef.current = worksite;
    setDriveMode('desludge');
    setCameraMode('desludge');
    desludgeTimerRef.current = 0;
    setDesludgeStage('deploying');
    setMissionStage('stabilizing');
    setDesludgeProgressPct(0);
    setInterlockWarning(null);
    setIsEStopActive(false);
  };

  // Emergency Stop Trigger
  const triggerEmergencyStop = () => {
    setIsEStopActive(true);
    isEStopActiveRef.current = true;
    setDriveMode('parked');
    driveModeRef.current = 'parked';
    setVehicleSpeedKmh(0);
    setPistonMode('HOLD');
    pistonModeRef.current = 'HOLD';
    setInterlockWarning('EMERGENCY STOP ENGAGED: All drive motors, vacuum pumps, and hydraulic compaction actuators halted.');
  };

  const resumeFromEStop = () => {
    setIsEStopActive(false);
    isEStopActiveRef.current = false;
    setInterlockWarning(null);
  };

  // Manual Piston Handlers with Strict Interlocks
  const handleExtendPiston = () => {
    if (isEStopActive) {
      setInterlockWarning('EMERGENCY STOP ACTIVE: Compaction hydraulic circuit isolated. Reset E-Stop first.');
      return;
    }
    if (driveMode !== 'parked' || vehicleSpeedKmh > 0.1) {
      setInterlockWarning('MOTION INTERLOCK: Compaction piston operation prohibited while vehicle is in motion!');
      return;
    }
    if (desludgeStage === 'pumping' || missionStage === 'extracting' || missionStage === 'priming' || missionStage === 'stabilizing') {
      setInterlockWarning('SUCTION INTERLOCK: Cannot compact sludge bed while extraction pump is operating!');
      return;
    }
    if (pistonStrokeMm >= maxStrokeLimitMm) {
      setInterlockWarning(`STROKE LIMIT: Platen already at maximum configured travel limit (${maxStrokeLimitMm} mm).`);
      return;
    }
    if (appliedPressureBar >= reliefPressureLimitBar) {
      setInterlockWarning(`PRESSURE RELIEF LIMIT: Hydraulic pressure at relief setpoint (${reliefPressureLimitBar} bar). Compaction held.`);
      return;
    }
    setInterlockWarning(null);
    setIsReliefValveOpen(false);
    isReliefValveOpenRef.current = false;
    setPistonMode('EXTENDING');
    pistonModeRef.current = 'EXTENDING';
  };

  const handleRetractPiston = () => {
    if (isEStopActive) {
      setInterlockWarning('EMERGENCY STOP ACTIVE: Compaction hydraulic circuit isolated. Reset E-Stop first.');
      return;
    }
    setInterlockWarning(null);
    setIsReliefValveOpen(false);
    isReliefValveOpenRef.current = false;
    setPistonMode('RETRACTING');
    pistonModeRef.current = 'RETRACTING';
  };

  const handleHoldPiston = () => {
    setPistonMode('HOLD');
    pistonModeRef.current = 'HOLD';
  };

  const handleLockTransportPins = () => {
    if (pistonStrokeMm > 5) {
      setInterlockWarning('LOCK INTERLOCK: Piston platen must be fully returned to Top Home (0mm) before transport retention pin can engage!');
      return;
    }
    setInterlockWarning(null);
    setPistonMode('LOCKED');
    pistonModeRef.current = 'LOCKED';
    setIsTransportLocked(true);
    isTransportLockedRef.current = true;
  };

  const toggleTankCutaway = () => {
    const isCurrentlyCutaway = cutawayOpacity < 0.85;
    const nextCutaway = isCurrentlyCutaway ? 1.0 : 0.35;
    setCutawayOpacity(nextCutaway);
    if (!isCurrentlyCutaway) {
      setCameraMode('tank');
    }
  };

  const handleWorksiteSelect = (ws: 'alley' | 'station' | 'summit') => {
    setSelectedWorksite(ws);
    selectedWorksiteRef.current = ws;
    const targetT = ws === 'alley' ? 0.18 : ws === 'station' ? 0.42 : 0.98;
    pathProgressRef.current = targetT;
    setCameraMode(ws === 'summit' ? 'desludge' : 'tank');
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
                <span>SIH 26258 | Tracked Desludging Vehicle</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Forward Drive · Paved Mountain Switchback · Zero-Entry Desludging
              </span>
            </div>
            <h1 className="text-lg font-bold text-white mt-1 flex items-center space-x-2">
              <Mountain className="w-5 h-5 text-emerald-400" />
              <span>SIH 26258 | Tracked Desludging Vehicle</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Simulating the 1.4m narrow mechanized desludging unit navigating extreme 20°–30° gradients. Features dual longitudinal anti-slosh baffles (-88.9% surge suppression), low-CoM under-chassis battery, and automated zero-entry extraction.
            </p>
          </div>

          {/* View Mode Selector: 3D Only vs Split View (3D + Bhavyam SCADA) vs SCADA Full */}
            <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-700">
              <button
                onClick={() => setDisplayLayout('3d')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  displayLayout === '3d'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Full 3D Mountain Terrain Simulator Viewport"
              >
                3D Sim Only
              </button>
              <button
                onClick={() => setDisplayLayout('split')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center space-x-1 ${
                  displayLayout === 'split'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Synchronized Split View: 3D Mountain Sim + Bhavyam SCADA Mk-IV Multi-Physics Dashboard"
              >
                <Sliders className="w-3.5 h-3.5 text-teal-300" />
                <span>Split: 3D + Bhavyam SCADA</span>
              </button>
              <button
                onClick={() => setDisplayLayout('scada')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  displayLayout === 'scada'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Dedicated Bharat-Jal SCADA Mk-IV Multi-Physics Dashboard"
              >
                Bhavyam SCADA Full
              </button>
            </div>

            {/* Quick Actions: Switch to Canyon Sim, Switch to Vault Sim, Audio, X-Ray, Fullscreen */}
          <div className="flex items-center space-x-2 shrink-0">
            {onSwitchToCanyonSim && (
              <button
                onClick={onSwitchToCanyonSim}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition bg-orange-950/80 border-orange-500/70 text-orange-300 hover:bg-orange-900 shadow-sm"
                title="Switch to Himalayan Canyon Gorge & Suspension Bridge Expedition"
              >
                <Compass className="w-4 h-4 text-orange-400" />
                <span>Switch to Canyon Sim</span>
              </button>
            )}

            {onSwitchToVaultSim && (
              <button
                onClick={onSwitchToVaultSim}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition bg-amber-950/80 border-amber-500/70 text-amber-300 hover:bg-amber-900 shadow-sm"
                title="Switch to Subsurface Vault & Robotics Digital Twin Simulation"
              >
                <Box className="w-4 h-4 text-amber-400" />
                <span>Switch to Vault Sim</span>
              </button>
            )}

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

      {/* Safety Interlock & E-Stop Alert Banner */}
      {interlockWarning && (
        <div className="p-3 bg-rose-950/90 border border-rose-500 rounded-lg text-xs font-mono text-rose-200 flex items-center justify-between shadow-xl animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-bold">{interlockWarning}</span>
          </div>
          <button
            onClick={() => {
              setInterlockWarning(null);
              if (isEStopActive) resumeFromEStop();
            }}
            className="px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-rose-100 rounded text-[11px] font-bold"
          >
            {isEStopActive ? 'Reset E-Stop' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* 3D Viewport & Interactive HUD */}
      <div
        className={`relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl transition-all ${displayLayout === "scada" ? "hidden" : displayLayout === "split" ? "h-[560px]" : "h-[820px]"}`}
        ref={containerRef}
      >
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

        {/* Top-Right Telemetry & Sensor HUD */}
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-3 text-xs shadow-xl w-72 pointer-events-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Machine & Ascent Telemetry</span>
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono border border-emerald-800">
              {measuredFps} FPS · {measuredFrameTimeMs}ms
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Ground Speed:</span>
              <span className="text-emerald-400 font-bold">
                {vehicleSpeedKmh} km/h · <span className="text-cyan-400">{driveMode.toUpperCase().replace('_', ' ')}</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mission Workflow:</span>
              <span className="text-amber-400 font-bold">
                {MOUNTAIN_WORKFLOW_STEPS.find((s) => s.id === workflowStage)?.shortName || workflowStage}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Road Gradient:</span>
              <span className="text-white font-bold">{currentInclineDeg}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Worksite:</span>
              <span className="text-cyan-400 font-bold uppercase">
                {selectedWorksite === 'alley'
                  ? 'Narrow Alley (0.18)'
                  : selectedWorksite === 'station'
                  ? 'Service Station (0.42)'
                  : 'Summit Vault (0.98)'}
              </span>
            </div>

            {/* Source Vault & Vehicle Collection Tank Mass Balance */}
            <div className="pt-1.5 mt-1 border-t border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Source Septic Vault:</span>
                <span className="text-amber-400 font-bold">{sourceVaultVolumeL} L / 1200 L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Collection Tank Fill:</span>
                <span className="text-cyan-400 font-bold">
                  {collectionTankVolumeL} L / 400 L ({((collectionTankVolumeL / 400) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Extraction Flow:</span>
                <span className="text-cyan-300 font-bold">
                  {extractionRateLpm > 0 ? `${extractionRateLpm.toFixed(1)} L/min (${suctionVacuumKpa.toFixed(1)} kPa)` : 'OFF (0.0 L/min)'}
                </span>
              </div>
            </div>

            {/* Anti-Slosh & Vehicle Dynamics */}
            <div className="pt-1.5 mt-1 border-t border-slate-800 space-y-1">
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
              <div className="flex justify-between">
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
                  {stabilityMarginPct}% (Tip: {criticalRolloverAngle.toFixed(1)}°)
                </span>
              </div>
            </div>

            {/* Hydraulic Sludge-Compaction & Dewatering Telemetry */}
            <div className="pt-1.5 mt-1 border-t border-slate-800 space-y-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Cog className="w-3 h-3 text-emerald-400" />
                  <span>Compaction Piston</span>
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isTransportLocked
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                  }`}
                >
                  {isTransportLocked ? 'PIN LOCKED' : 'UNLOCKED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Piston Stroke:</span>
                <span className="text-white font-bold">
                  {pistonStrokeMm} mm / {maxStrokeLimitMm} mm ({((pistonStrokeMm / maxStrokeLimitMm) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hydraulic Pressure:</span>
                <span className="text-cyan-400 font-bold">{appliedPressureBar.toFixed(1)} bar / {reliefPressureLimitBar} bar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Compaction Thrust:</span>
                <span className="text-amber-400 font-bold">{compactionForceKn.toFixed(1)} kN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cake / Filtrate Vol:</span>
                <span className="text-slate-200">
                  {cakeVolumeL}L cake · {filtrateVolumeL}L filtrate
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Compaction Ratio:</span>
                <span className="text-emerald-400 font-bold">
                  {compactionRatio.toFixed(2)}× ({((1 - cakeVolumeL / Math.max(1, collectionTankVolumeL || 400)) * 100).toFixed(1)}% red.)
                </span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-400">Relief Valve:</span>
                <span className={`font-bold ${isReliefValveOpen ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                  {isReliefValveOpen ? 'OPEN (RELIEVING)' : 'CLOSED (NORMAL)'}
                </span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-400">Transport Readiness:</span>
                <span
                  className={`font-bold ${
                    isTransportReady && isTransportLocked && pistonStrokeMm <= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400 animate-pulse'
                  }`}
                >
                  {isTransportReady && isTransportLocked && pistonStrokeMm <= 0
                    ? 'READY (CERTIFIED)'
                    : 'BLOCKED (OPS ACTIVE)'}
                </span>
              </div>
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
                    : activeStressTest === 'muddy_traction'
                    ? '28 kPa Ground Pressure · Cleats bit into clay'
                    : activeStressTest === 'narrow_alley'
                    ? '1.4m Machine Width cleared 1.5m alley passage'
                    : '1400 cP Viscous Damping · PMAC 11.4 kW'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top-Center Interactive 1-Click Engineering Stress Scenarios Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-2 text-xs shadow-xl pointer-events-auto flex items-center space-x-2 z-10 max-w-2xl overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1 pl-1 pr-1 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Stress Tests:</span>
          </span>
          <button
            onClick={() => runStressTest(activeStressTest === 'hill_brake' ? 'none' : 'hill_brake')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center space-x-1 shrink-0 ${
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
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center space-x-1 shrink-0 ${
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
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center space-x-1 shrink-0 ${
              activeStressTest === 'freeze_surge'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Simulates -15°C sub-zero high-viscosity sludge (1400 cP) sluggish slosh"
          >
            <span>Sub-Zero Freeze Surge</span>
          </button>
          <button
            onClick={() => runStressTest(activeStressTest === 'muddy_traction' ? 'none' : 'muddy_traction')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center space-x-1 shrink-0 ${
              activeStressTest === 'muddy_traction'
                ? 'bg-amber-700 text-white shadow-lg shadow-amber-700/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Simulates low-traction muddy mountain slope to test rubber track crawler cleats"
          >
            <span>Muddy Ground</span>
          </button>
          <button
            onClick={() => runStressTest(activeStressTest === 'narrow_alley' ? 'none' : 'narrow_alley')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center space-x-1 shrink-0 ${
              activeStressTest === 'narrow_alley'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Positions vehicle at Waypoint 1 (Narrow 1.5m clearance alleyway)"
          >
            <span>Narrow Alley (1.5m)</span>
          </button>
          {activeStressTest !== 'none' && (
            <button
              onClick={() => runStressTest('none')}
              className="px-2 py-1 rounded text-[10px] font-bold bg-slate-800 text-slate-400 hover:text-white transition shrink-0"
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
              <span>SIH 26258 | Tracked Desludging Vehicle</span>
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

          {/* Worksite Destination Waypoint Selector */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
              <span className="text-slate-400">Worksite Waypoint:</span>
              <span className="text-cyan-400 font-bold uppercase">
                {selectedWorksite === 'alley' ? 'Narrow Alley (t=0.18)' : selectedWorksite === 'station' ? 'Service Bay (t=0.42)' : 'Summit Pit (t=0.98)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => handleWorksiteSelect('alley')}
                className={`py-1 px-1.5 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 ${
                  selectedWorksite === 'alley'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Narrow access alleyway worksite (t = 0.18)"
              >
                <span>Alley (0.18)</span>
              </button>
              <button
                onClick={() => handleWorksiteSelect('station')}
                className={`py-1 px-1.5 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 ${
                  selectedWorksite === 'station'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Roadside service layby sanitation vault (t = 0.42)"
              >
                <span>Station (0.42)</span>
              </button>
              <button
                onClick={() => handleWorksiteSelect('summit')}
                className={`py-1 px-1.5 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 ${
                  selectedWorksite === 'summit'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Summit Kath-Kuni cottage septic pit (t = 0.98)"
              >
                <span>Summit (0.98)</span>
              </button>
            </div>
          </div>

          {/* 10-Stage Mechanized Desludging & Dewatering Mission Workflow */}
          <div className="p-3 bg-slate-950 border border-emerald-700/60 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 text-xs flex items-center space-x-1.5">
                <Rotate3d className="w-4 h-4 text-emerald-400" />
                <span>10-Stage Mission Workflow</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                Step {MOUNTAIN_WORKFLOW_STEPS.find((s) => s.id === workflowStage)?.num || 1} / 10
              </span>
            </div>

            {/* Stage Title & Operational Description */}
            <div className="p-2 bg-slate-900/90 rounded border border-slate-800 text-[11px] font-mono">
              <div className="text-white font-bold flex items-center space-x-1">
                <span className="text-amber-400">
                  {MOUNTAIN_WORKFLOW_STEPS.find((s) => s.id === workflowStage)?.name}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {MOUNTAIN_WORKFLOW_STEPS.find((s) => s.id === workflowStage)?.description}
              </p>
            </div>

            {/* 10 Clickable Sequenced Stage Pills */}
            <div className="grid grid-cols-5 gap-1 font-mono text-[10px]">
              {MOUNTAIN_WORKFLOW_STEPS.map((step) => {
                const curIdx = MOUNTAIN_WORKFLOW_STEPS.findIndex((s) => s.id === workflowStage);
                const isCurrent = step.id === workflowStage;
                const isPassed = step.num < (curIdx + 1);

                return (
                  <button
                    key={step.id}
                    onClick={() => transitionToWorkflowStage(step.id)}
                    className={`py-1 px-1 rounded flex flex-col items-center justify-center transition border ${
                      isCurrent
                        ? 'bg-emerald-600 text-white font-bold border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-300'
                        : isPassed
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    title={`${step.num}. ${step.name}: ${step.description}`}
                  >
                    <span className="text-[11px] font-bold">{step.num}</span>
                    <span className="text-[8px] truncate max-w-[50px]">{step.shortName.split('. ')[1]}</span>
                  </button>
                );
              })}
            </div>

            {/* Workflow Navigation Controls: Prev, Next, Auto-Run, Reset */}
            <div className="flex items-center space-x-1.5 pt-1">
              <button
                onClick={prevWorkflowStep}
                disabled={workflowStage === '1_DRIVE_TO_SITE'}
                className="py-1 px-2 rounded font-bold text-[10px] bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1"
                title="Go to previous operational workflow step"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>

              <button
                onClick={toggleAutoWorkflow}
                className={`flex-1 py-1 px-2 rounded font-bold text-[10px] flex items-center justify-center space-x-1 transition ${
                  isAutoWorkflowRunning
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                }`}
                title={isAutoWorkflowRunning ? 'Pause automated 10-stage progression' : 'Execute 10-stage automated workflow'}
              >
                {isAutoWorkflowRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isAutoWorkflowRunning ? 'Pause Auto' : 'Auto Run (10-Stage)'}</span>
              </button>

              <button
                onClick={advanceWorkflowStep}
                disabled={workflowStage === '10_RESUME_DRIVING'}
                className="py-1 px-2 rounded font-bold text-[10px] bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1"
                title="Advance to next operational workflow step"
              >
                <span>Next</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                onClick={resetWorkflow}
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition"
                title="Reset mission workflow to Stage 1"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Mass Balance & Dewatering Tracking */}
            <div className="p-2 bg-slate-900/80 rounded border border-slate-800 text-[10px] font-mono space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span>Material Conservation:</span>
                <span className="text-emerald-400 font-bold">1200 L (Strict 100%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Source Vault (1200L):</span>
                <span className="text-amber-400 font-bold">{sourceVaultVolumeL} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Collection Tank (400L):</span>
                <span className="text-cyan-400 font-bold">{collectionTankVolumeL} L</span>
              </div>
              <div className="flex justify-between pt-0.5 border-t border-slate-800">
                <span className="text-slate-400">Cake / Filtrate Separation:</span>
                <span className="text-slate-200 font-bold">
                  {cakeVolumeL} L cake · {filtrateVolumeL} L liquid
                </span>
              </div>
            </div>
          </div>

          {/* Drive Mode Action Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                if (driveMode !== 'auto_climb') {
                  if (pistonStrokeMm > 5 || !isTransportLocked) {
                    setInterlockWarning('TRANSPORT INTERLOCK: Compaction piston must be at 0mm (Home) and Transport Pin locked before travel!');
                    return;
                  }
                }
                setDriveMode(driveMode === 'auto_climb' ? 'parked' : 'auto_climb');
              }}
              className={`flex-1 py-1.5 rounded font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                driveMode === 'auto_climb'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {driveMode === 'auto_climb' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{driveMode === 'auto_climb' ? 'Halt Drive' : 'Auto Climb'}</span>
            </button>

            <button
              onClick={() => {
                if (driveMode !== 'manual') {
                  if (pistonStrokeMm > 5 || !isTransportLocked) {
                    setInterlockWarning('TRANSPORT INTERLOCK: Compaction piston must be at 0mm (Home) and Transport Pin locked before travel!');
                    return;
                  }
                }
                setDriveMode('manual');
              }}
              className={`flex-1 py-1.5 rounded font-semibold text-xs transition ${
                driveMode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Manual (WASD)
            </button>

            <button
              onClick={() => {
                setDriveMode('parked');
                setVehicleSpeedKmh(0);
              }}
              className={`px-3 py-1.5 rounded font-semibold text-xs transition ${
                driveMode === 'parked' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Parked
            </button>
          </div>

          {/* Hydraulic Sludge-Compaction Piston Dedicated Control Box */}
          <div className="p-2.5 bg-slate-950/90 border border-slate-700/80 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="font-bold text-white flex items-center space-x-1">
                <Cog className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hydraulic Compaction Piston</span>
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  pistonMode === 'LOCKED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : pistonMode === 'EXTENDING'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse'
                    : pistonMode === 'RETRACTING'
                    ? 'bg-purple-950 text-purple-300 border border-purple-700'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {pistonMode}
              </span>
            </div>

            {/* Piston Action Buttons */}
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={handleExtendPiston}
                disabled={isEStopActive || driveMode !== 'parked'}
                className={`py-1 px-1 rounded text-[10px] font-bold transition flex items-center justify-center space-x-0.5 ${
                  pistonMode === 'EXTENDING'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : isEStopActive || driveMode !== 'parked'
                    ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                }`}
                title={
                  isEStopActive
                    ? 'E-Stop active: Compaction isolated'
                    : driveMode !== 'parked'
                    ? 'Motion Interlock: Park machine before extending'
                    : 'Extend hydraulic compaction cylinder into sludge bed'
                }
              >
                <span>Extend</span>
              </button>
              <button
                onClick={handleRetractPiston}
                disabled={isEStopActive}
                className={`py-1 px-1 rounded text-[10px] font-bold transition flex items-center justify-center space-x-0.5 ${
                  pistonMode === 'RETRACTING'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : isEStopActive
                    ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800 text-purple-400 hover:bg-slate-700'
                }`}
                title={isEStopActive ? 'E-Stop active' : 'Retract piston platen up to Top Home position'}
              >
                <span>Retract</span>
              </button>
              <button
                onClick={handleHoldPiston}
                className={`py-1 px-1 rounded text-[10px] font-bold transition flex items-center justify-center space-x-0.5 ${
                  pistonMode === 'HOLD'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Hold hydraulic cylinder at current stroke depth"
              >
                <span>Hold</span>
              </button>
              <button
                onClick={handleLockTransportPins}
                disabled={pistonStrokeMm > 5}
                className={`py-1 px-1 rounded text-[10px] font-bold transition flex items-center justify-center space-x-0.5 ${
                  isTransportLocked
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : pistonStrokeMm > 5
                    ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                }`}
                title={
                  pistonStrokeMm > 5
                    ? 'Lock Interlock: Return platen to 0mm before engaging retention pins'
                    : 'Engage mechanical retention lock pins for transport'
                }
              >
                <Lock className="w-2.5 h-2.5 mr-0.5" />
                <span>Lock</span>
              </button>
            </div>

            {/* Stroke Depth Indicator / Slider */}
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                <span>Piston Stroke:</span>
                <span className="text-white font-bold">
                  {pistonStrokeMm} mm / {maxStrokeLimitMm} mm ({((pistonStrokeMm / maxStrokeLimitMm) * 100).toFixed(0)}%)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={maxStrokeLimitMm}
                step="5"
                value={pistonStrokeMm}
                disabled={isEStopActive || driveMode !== 'parked' || desludgeStage === 'pumping' || missionStage === 'extracting'}
                onChange={(e) => {
                  if (isEStopActive) {
                    setInterlockWarning('EMERGENCY STOP ACTIVE: Cannot adjust compaction piston.');
                    return;
                  }
                  if (driveMode !== 'parked' || vehicleSpeedKmh > 0.1) {
                    setInterlockWarning('MOTION INTERLOCK: Cannot manually adjust piston while vehicle is moving.');
                    return;
                  }
                  if (desludgeStage === 'pumping' || missionStage === 'extracting' || missionStage === 'priming' || missionStage === 'stabilizing') {
                    setInterlockWarning('SUCTION INTERLOCK: Cannot manually adjust piston while extraction pump is operating.');
                    return;
                  }
                  const val = parseInt(e.target.value);
                  const strokePct = Math.round((val / (maxStrokeLimitMm || 600)) * 100);
                  const res = setStoreCompactionStrokePct(strokePct);
                  if (!res.accepted) {
                    setInterlockWarning('INTERLOCK TRIP: ' + (res.reason || 'Cannot move piston.'));
                    return;
                  }
                  setPistonStrokeMm(val);
                  pistonStrokeMmRef.current = val;
                  if (val > 0) {
                    setIsTransportLocked(false);
                    isTransportLockedRef.current = false;
                    setPistonMode('HOLD');
                    pistonModeRef.current = 'HOLD';
                  } else {
                    setPistonMode('HOME');
                    pistonModeRef.current = 'HOME';
                  }
                }}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Configurable Sludge Rheology Profile Selector */}
            <div className="pt-1.5 border-t border-slate-800 space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Sludge Rheology:</span>
                <span className="text-emerald-400 font-bold uppercase">
                  {sludgeType === 'septage' ? 'Septage (35% dewater)' : sludgeType === 'raw_sludge' ? 'Raw Sewage (42% dewater)' : 'Digested (22% dewater)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => {
                    setSludgeType('septage');
                    sludgeTypeRef.current = 'septage';
                  }}
                  className={`py-0.5 px-1 rounded text-[9px] font-semibold transition ${
                    sludgeType === 'septage' ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Fecal Septage: 4.5% TS, compressible index n=1.4, dewaterability 0.35"
                >
                  Septage
                </button>
                <button
                  onClick={() => {
                    setSludgeType('raw_sludge');
                    sludgeTypeRef.current = 'raw_sludge';
                  }}
                  className={`py-0.5 px-1 rounded text-[9px] font-semibold transition ${
                    sludgeType === 'raw_sludge' ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Primary Raw Sludge: 3.0% TS, compressible index n=1.2, dewaterability 0.42"
                >
                  Raw Sludge
                </button>
                <button
                  onClick={() => {
                    setSludgeType('digested_biosolids');
                    sludgeTypeRef.current = 'digested_biosolids';
                  }}
                  className={`py-0.5 px-1 rounded text-[9px] font-semibold transition ${
                    sludgeType === 'digested_biosolids' ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Digested Biosolids: 6.5% TS, stiff matrix index n=1.7, dewaterability 0.22"
                >
                  Biosolids
                </button>
              </div>
            </div>

            {/* Configurable Stroke & Pressure Relief Limits */}
            <div className="pt-1.5 border-t border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>Config Limits:</span>
                <span className="text-slate-200">
                  Stroke {maxStrokeLimitMm}mm · Relief {reliefPressureLimitBar} bar
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <span className="text-[9px] text-slate-500 block mb-0.5">Stroke Limit</span>
                  <div className="flex space-x-1">
                    {[450, 520, 600].map((sVal) => (
                      <button
                        key={sVal}
                        onClick={() => {
                          setMaxStrokeLimitMm(sVal);
                          maxStrokeLimitMmRef.current = sVal;
                        }}
                        className={`flex-1 py-0.5 text-[9px] rounded font-mono ${
                          maxStrokeLimitMm === sVal ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {sVal}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block mb-0.5">Relief Valve</span>
                  <div className="flex space-x-1">
                    {[160, 180, 200].map((pVal) => (
                      <button
                        key={pVal}
                        onClick={() => {
                          setReliefPressureLimitBar(pVal);
                          reliefPressureLimitBarRef.current = pVal;
                        }}
                        className={`flex-1 py-0.5 text-[9px] rounded font-mono ${
                          reliefPressureLimitBar === pVal ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {pVal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Hydraulic Sensor Instrumentation */}
            <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[10px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Pressure / Force:</span>
                <span className="text-cyan-400 font-bold">{appliedPressureBar.toFixed(1)} bar · {compactionForceKn.toFixed(1)} kN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cake / Filtrate:</span>
                <span className="text-slate-200">{cakeVolumeL}L cake · {filtrateVolumeL}L filtrate ({compactionRatio.toFixed(2)}×)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Relief Valve:</span>
                <span className={`font-bold flex items-center space-x-1 ${isReliefValveOpen ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                  {isReliefValveOpen ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>RELIEVING ({reliefPressureLimitBar} bar)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>NORMAL (CLOSED)</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Transport Lock:</span>
                <span className={`font-bold ${isTransportLocked ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                  {isTransportLocked ? 'SAFE (RETENTION ENGAGED)' : 'UNLOCKED (DRIVE BLOCKED)'}
                </span>
              </div>
            </div>

            {/* Tank Viewport Quick Inspection Buttons */}
            <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-800">
              <button
                onClick={toggleTankCutaway}
                className={`py-1 px-1.5 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 ${
                  cutawayOpacity < 0.85
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
                }`}
                title="Toggle transparent tank cutaway mode to view piston & sludge layers"
              >
                <Eye className="w-3 h-3 mr-0.5" />
                <span>{cutawayOpacity < 0.85 ? 'Cutaway: ON' : 'Cutaway: OFF'}</span>
              </button>
              <button
                onClick={() => {
                  setCameraMode('tank');
                  if (cutawayOpacity >= 0.85) setCutawayOpacity(0.35);
                }}
                className={`py-1 px-1.5 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 ${
                  cameraMode === 'tank'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Position camera for direct close-up inspection of tank internals"
              >
                <Camera className="w-3 h-3 mr-0.5" />
                <span>Inspect Tank</span>
              </button>
            </div>

            {/* Explicit Engineering Assumptions & Validation Checklist */}
            <div className="pt-1.5 border-t border-slate-800 text-[9px] font-mono text-slate-400 space-y-0.5">
              <span className="text-amber-400 font-bold block flex items-center space-x-1">
                <Info className="w-3 h-3 text-amber-400" />
                <span>UNVALIDATED ENGINEERING ASSUMPTIONS:</span>
              </span>
              <p>• Rheology: 1D Terzaghi consolidated porous media (non-linear n={sludgeType === 'raw_sludge' ? '1.2' : sludgeType === 'digested_biosolids' ? '1.7' : '1.4'}).</p>
              <p>• Filtrate rate assumes clean 80-mesh wedge-wire screen; cake fouling neglected.</p>
              <p>• Wiper seal wall friction and hydraulic cylinder flow inertia neglected.</p>
              <p className="text-amber-300">• Field deployment requires physical bench testing & structural FEA certification.</p>
            </div>
          </div>

          {/* Safety E-Stop Button */}
          <div className="pt-1">
            <button
              onClick={isEStopActive ? resumeFromEStop : triggerEmergencyStop}
              className={`w-full py-1.5 rounded font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                isEStopActive
                  ? 'bg-rose-700 text-white animate-pulse shadow-lg shadow-rose-700/50'
                  : 'bg-rose-950/80 border border-rose-600/70 text-rose-300 hover:bg-rose-900'
              }`}
            >
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>{isEStopActive ? 'EMERGENCY STOPPED (CLICK TO RESET)' : 'EMERGENCY STOP (E-STOP)'}</span>
            </button>
          </div>

          {/* Tank Cutaway View Controls */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Tank Cutaway Opacity:</span>
              <span className="text-emerald-400 font-bold">{Math.round(cutawayOpacity * 100)}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={cutawayOpacity}
                onChange={(e) => setCutawayOpacity(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <button
                onClick={toggleTankCutaway}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300"
              >
                {cutawayOpacity < 0.85 ? 'Cutaway ON' : 'Opaque'}
              </button>
            </div>
          </div>

          {/* Manual Drive Controls (Arrow buttons + WASD info) */}
          {driveMode === 'manual' && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-center space-x-1.5">
                <button
                  onMouseDown={() => { manualSteerRef.current = -1; }}
                  onMouseUp={() => { manualSteerRef.current = 0; }}
                  onTouchStart={() => { manualSteerRef.current = -1; }}
                  onTouchEnd={() => { manualSteerRef.current = 0; }}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold transition"
                  title="Steer Left (A / Left Arrow)"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onMouseDown={() => {
                    if (pistonStrokeMm > 5 || !isTransportLocked) {
                      setInterlockWarning('TRANSPORT INTERLOCK: Platen extended! Return to 0mm & engage Lock Pins before driving.');
                      return;
                    }
                    manualThrottleRef.current = -1;
                  }}
                  onMouseUp={() => { manualThrottleRef.current = 0; }}
                  onTouchStart={() => {
                    if (pistonStrokeMm > 5 || !isTransportLocked) {
                      setInterlockWarning('TRANSPORT INTERLOCK: Platen extended! Return to 0mm & engage Lock Pins before driving.');
                      return;
                    }
                    manualThrottleRef.current = -1;
                  }}
                  onTouchEnd={() => { manualThrottleRef.current = 0; }}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold transition"
                  title="Reverse Downhill (Down / S)"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onMouseDown={() => {
                    if (pistonStrokeMm > 5 || !isTransportLocked) {
                      setInterlockWarning('TRANSPORT INTERLOCK: Platen extended! Return to 0mm & engage Lock Pins before driving.');
                      return;
                    }
                    manualThrottleRef.current = 1;
                  }}
                  onMouseUp={() => { manualThrottleRef.current = 0; }}
                  onTouchStart={() => {
                    if (pistonStrokeMm > 5 || !isTransportLocked) {
                      setInterlockWarning('TRANSPORT INTERLOCK: Platen extended! Return to 0mm & engage Lock Pins before driving.');
                      return;
                    }
                    manualThrottleRef.current = 1;
                  }}
                  onTouchEnd={() => { manualThrottleRef.current = 0; }}
                  className="p-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                  title="Drive Forward Uphill (Up / W)"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onMouseDown={() => { manualSteerRef.current = 1; }}
                  onMouseUp={() => { manualSteerRef.current = 0; }}
                  onTouchStart={() => { manualSteerRef.current = 1; }}
                  onTouchEnd={() => { manualSteerRef.current = 0; }}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold transition"
                  title="Steer Right (D / Right Arrow)"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    pathProgressRef.current = 0.05;
                    lateralOffsetRef.current = 0;
                  }}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Reset to Valley Base (R)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-1">Drive: W/S · Steer: A/D · Stop: Space</p>
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
                title="Front operator console and slurry pump perspective"
              >
                Operator
              </button>
              <button
                onClick={() => {
                  setCameraMode('tank');
                  setCutawayOpacity(0.35);
                }}
                className={`py-1 px-1 text-[10px] font-semibold rounded text-center transition ${
                  cameraMode === 'tank' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Close-up cutaway inspection of internal piston and sludge bed"
              >
                Tank Cutaway
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
        <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 text-xs shadow-2xl flex flex-wrap items-center gap-3 pointer-events-auto">
          {/* Regional Terrain Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Region:</span>
            </span>
            <button
              onClick={() => {
                setTerrainPreset('uttarakhand');
                setSlopeDeg(28.0);
                setActiveWeather('clear');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                terrainPreset === 'uttarakhand' || terrainPreset === 'aizawl'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Garhwal & Kumaon Ghats (NH-58 · Badrinath · Project Shivalik)"
            >
              Uttarakhand (28°)
            </button>
            <button
              onClick={() => {
                setTerrainPreset('himachal');
                setSlopeDeg(26.0);
                setActiveWeather('clear');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                terrainPreset === 'himachal' || terrainPreset === 'shimla'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Pir Panjal & Kinnaur Highway (NH-5 · Project Deepak)"
            >
              Himachal (26°)
            </button>
            <button
              onClick={() => {
                setTerrainPreset('ladakh');
                setSlopeDeg(32.0);
                setActiveWeather('snow');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                terrainPreset === 'ladakh'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Cold Desert Khardung La Pass (NH-1D · 17,982 FT · Project Himank)"
            >
              Ladakh Pass (32°)
            </button>
          </div>

          {/* Active Indian BRO Highway Project Badge */}
          <div className="hidden lg:flex items-center">
            <span className="text-[10px] text-amber-300 font-mono bg-amber-950/80 border border-amber-600/40 px-2 py-0.5 rounded">
              {terrainPreset === 'ladakh'
                ? 'BRO Project Himank · NH-1D Khardung La Pass'
                : terrainPreset === 'himachal' || terrainPreset === 'shimla'
                ? 'BRO Project Deepak · NH-5 Kinnaur Highway'
                : 'BRO Project Shivalik · NH-58 Badrinath Ghats'}
            </span>
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
            { id: 'piston', label: 'Hydraulic Compaction Platen' },
            { id: 'vault', label: 'Kath-Kuni Septic Station' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedCallout(item.id as any);
                if (item.id === 'tank' || item.id === 'baffles' || item.id === 'piston') {
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
            {selectedCallout === 'piston' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Hydraulic Cylinder &amp; Bore</span>
                  <span className="text-emerald-400 font-bold">Ø120mm Bore · Ø60mm Rod · 600mm Stroke</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Double-acting chrome cylinder mounted to rigid overhead bridge yoke across tank chassis rails.</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Pressure &amp; Dewatering Thrust</span>
                  <span className="text-cyan-400 font-bold">180 Bar Relief · 203.6 kN Thrust</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Perforated platen with perimeter PU scraper compresses sludge cake down to 260L (1.54x compaction ratio).</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans font-bold text-white mb-0.5">Anti-Tilt &amp; Transport Interlock</span>
                  <span className="text-amber-400 font-bold">Dual Ø45mm Guide Columns &amp; Lock Pins</span>
                  <p className="text-slate-400 text-[10px] font-sans mt-0.5">Bronze bushings prevent angular tilting. Mechanical retention pins lock platen at 0mm home during travel.</p>
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
