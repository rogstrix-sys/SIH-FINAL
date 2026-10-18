/**
 * Typed central simulation state management using Zustand.
 * Integrates deterministic physical mass-balance engine, telemetry streams,
 * event logs, kinematics, alarms, interlocks, and 3D UI modes.
 */

import { create } from 'zustand';
import {
  SimulationStatus,
  NavView,
  CameraPreset,
  SimulationParameters,
  TelemetryState,
  TelemetryPoint,
  EventLogItem,
  DisplayOptions,
  ComponentInspectionData,
  GuidedDemoState
} from '../types/digitalTwin';
import { DEMO_STAGES } from '../simulation/guidedDemoData';
import {
  OperatingState,
  EngineState,
  MaterialBalanceState,
  MachineKinematicsState,
  ActiveAlarms,
  SafetyInterlocks,
  EngineParameters
} from '../types/simulationEngine';
import {
  createInitialEngineState,
  stepSimulationEngine,
  triggerStart,
  triggerPause,
  triggerResume,
  triggerReset,
  triggerEmergencyStop,
  triggerResolveFault,
  triggerDeploy,
  triggerPrime,
  triggerExtract,
  triggerDischarge,
  triggerManualDischarge
} from '../simulation/deterministicEngine';
import { createInitialTelemetry } from '../simulation/physicsEngine';
import {
  TerrainScenarioId,
  TerrainParameters,
  StabilityThresholds,
  EngineeringFeasibilityEstimate
} from '../types/terrainScenarios';
import {
  TERRAIN_SCENARIOS,
  DEFAULT_TERRAIN_PARAMS,
  DEFAULT_STABILITY_THRESHOLDS,
  calculateTerrainFeasibility,
  getScenarioDefaultParams
} from '../simulation/terrainFeasibilityModel';

export const DEFAULT_PARAMETERS: SimulationParameters = {
  pumpRpm: 1850,
  targetVacuumKpa: -72.0,
  hoseDiameterMm: 100,
  hoseLengthM: 35,
  slurryViscosityCp: 450,
  slurryDensityKgM3: 1180,
  containmentVolumeLiters: 4200,
  initialSludgeDepthM: 1.85,
  waterJetPressureBar: 140,
  waterJetEnabled: true,
  ambientTempC: 18.0,
  cutterHeadSpeedRpm: 240,
  cutterHeadEnabled: true,
  pipeRoughnessMm: 0.045
};

export const INSPECTABLE_COMPONENTS: Record<string, ComponentInspectionData> = {
  chassis: {
    id: 'chassis',
    name: 'Heavy-Duty 4-Wheel / Crawler Mobile Chassis',
    type: 'Mobility Platform',
    status: 'nominal',
    temperatureC: 24.5,
    pressureBar: 0,
    vibrationMmS: 0.6,
    description: 'Narrow-gauge welded box-section steel chassis engineered for restricted-access alleyways and steep mountain slopes. Selectable between high-flotation agricultural lug wheels and articulated rubber continuous tracks.',
    specifications: {
      'Track Width': '1.35 m (Conceptual Assumption for Narrow Alleys)',
      'Wheelbase': '2.10 m (Conceptual Assumption)',
      'Ground Clearance': '320 mm nominal (Conceptual Model)',
      'Approximate Payload': '2,800 kg GVW Rating (Conceptual Estimate)',
      'Mobility Running Gear': 'Selectable 4-Wheel Lug / Articulated Rubber Crawler',
      'Stabilizers': '4x Telescopic hydraulic outrigger pads'
    }
  },
  pump: {
    id: 'pump',
    name: 'Tri-Lobe Positive Displacement Vacuum Slurry Pump',
    type: 'Hydraulic Pumping Core',
    status: 'nominal',
    temperatureC: 48.5,
    pressureBar: 2.8,
    vibrationMmS: 2.1,
    description: 'Direct-drive rotary lobe pump designed for non-Newtonian viscous septage evacuation without mechanical air lock. Coupled to 11 kW TEFC electric drive motor.',
    specifications: {
      'Displacement Capacity': '36 m³/h nominal (Conceptual Assumption)',
      'Max Vacuum Rating': '-88 kPa continuous (-0.88 bar)',
      'Shaft Power': '11.0 kW rated IE3 electric motor',
      'Lobe Geometry': 'Helical tri-lobe polyurethane with wear plates',
      'Operating Speed': '1,800 - 2,400 RPM rated'
    }
  },
  tank: {
    id: 'tank',
    name: 'On-Board Cylindrical Sludge Collection Vessel',
    type: 'Containment Pressure-Vacuum Vessel',
    status: 'nominal',
    temperatureC: 21.0,
    pressureBar: -0.72,
    vibrationMmS: 0.4,
    description: 'Pressure-vacuum certified cylindrical tank featuring anti-slosh internal baffle plates, external calibrated borosilicate sight glass, and full-opening hydraulic cleanout door.',
    specifications: {
      'Working Volume': '2,400 Liters (Conceptual Sizing Assumption)',
      'Shell Thickness': '6.0 mm structural carbon steel (SA 516 Gr 70)',
      'Sight Gauge': 'Direct optical borosilicate tube with etched ticks',
      'Inspection Hatch': '450 mm top dome with forged wing clamp bolts',
      'Safety Devices': 'Dual PVRV relief valve & cyclone moisture trap'
    }
  },
  receiver: {
    id: 'receiver',
    name: 'External Waste Disposal Receiving Tanker',
    type: 'Discharge Receiving Facility',
    status: 'nominal',
    temperatureC: 18.0,
    pressureBar: 1.01,
    vibrationMmS: 0.1,
    description: '10,000L high-capacity transport disposal tanker receiving transferred sludge during discharge cycle.',
    specifications: {
      'Gross Capacity': '10,000 Liters (Standard Municipal Sizing Assumption)',
      'Inlet Flange': 'DN100 Camlock Coupling with quick-release levers',
      'Vessel Type': 'Triple-axle highway vacuum road tanker',
      'Transfer Rate': '750 L/min nominal pump discharge'
    }
  },
  hosereel: {
    id: 'hosereel',
    name: 'Powered Hydraulic Hose Reel Mechanism',
    type: 'Conduit Management Subsystem',
    status: 'nominal',
    temperatureC: 28.0,
    pressureBar: 120,
    vibrationMmS: 0.9,
    description: 'High-torque hydraulic motor reel spooling 35m of heavy-duty spiral wire-reinforced extraction hose.',
    specifications: {
      'Drum Capacity': '35 m of Ø100mm heavy hose (Conceptual Assumption)',
      'Drive': 'Orbit hydraulic motor with auto-brake',
      'Swivel Joint': 'Dual Viton O-ring high-vacuum swivel union',
      'Guide Arms': 'Four-roller fairlead guide with tension roller'
    }
  },
  boom: {
    id: 'boom',
    name: 'Articulated Dual-Joint Support Boom Crane',
    type: 'Hydraulic Hose Manipulator',
    status: 'nominal',
    temperatureC: 32.0,
    pressureBar: 160,
    vibrationMmS: 1.2,
    description: 'Articulated dual-joint hydraulic crane arm that positions and supports the heavy suction umbilical over septic vault openings.',
    specifications: {
      'Reach Radius': '4.20 m maximum (Conceptual Assumption)',
      'Rotation Range': '270° slew ring bearing',
      'Lift Capacity': '250 kg at maximum extension (Conceptual Model)',
      'Actuation': 'Twin chrome hydraulic cylinders with safety check valves'
    }
  },
  hose: {
    id: 'hose',
    name: 'Reinforced Suction Hose Conduit',
    type: 'Fluid Conduit',
    status: 'nominal',
    temperatureC: 19.2,
    pressureBar: -0.72,
    vibrationMmS: 0.8,
    description: 'Helix steel-wire reinforced PVC composite hose with quick-disconnect camlock couplings.',
    specifications: {
      'Inner Diameter': '100 mm (4 inch)',
      'Burst Pressure': '12.0 bar rating',
      'Vacuum Rating': '-95 kPa full collapse resistant',
      'Configured Length': '35 m operational reach'
    }
  },
  nozzle: {
    id: 'nozzle',
    name: 'Submerged Slurry Fluidizing Nozzle & Cutter',
    type: 'Downhole Extraction Head',
    status: 'nominal',
    temperatureC: 17.5,
    pressureBar: 140,
    vibrationMmS: 2.8,
    description: 'Heavy steel suction bell with circular peripheral hydro-jetting manifold and rotary cutterhead for breaking consolidated sludge layers.',
    specifications: {
      'Intake Aperture': 'Ø110 mm flared inlet (Conceptual Assumption)',
      'Jetting Nozzles': '6x fan carbide inserts (140 bar shear pressure)',
      'Cutterhead Speed': '240 RPM rated macerator',
      'Agitation Cone': '0.8 m fluidized cone diameter'
    }
  },
  septictank: {
    id: 'septictank',
    name: 'Dual-Compartment Demonstration Septic Vault',
    type: 'Sanitation Vault',
    status: 'nominal',
    temperatureC: 16.0,
    pressureBar: 0,
    vibrationMmS: 0.1,
    description: 'Cutaway demonstration septic tank showing settled viscous sludge layer, anaerobic liquid layer, top scum crust, and central transfer weir baffle.',
    specifications: {
      'Vault Volume': '4,200 Liters total (Conceptual Assumption)',
      'Initial Sludge Depth': '1.85 m fluid column',
      'Cutaway Section': '120° acrylic sectional cut showing dynamic suction vortex',
      'Atmosphere': 'Hazardous sewer gas zone (H2S, CH4, CO monitored)'
    }
  }
};

export interface SimulationStore {
  // Core Status
  status: SimulationStatus;
  activeView: NavView;
  simSpeed: number; // 0.5, 1, 2, 5
  connectionState: 'SIMULATED';

  // Deterministic Simulation Engine State
  engine: EngineState;
  operatingState: OperatingState;
  materialBalance: MaterialBalanceState;
  kinematics: MachineKinematicsState;
  alarms: ActiveAlarms;
  interlocks: SafetyInterlocks;
  
  // Dashboard Models & Streams
  parameters: SimulationParameters;
  telemetry: TelemetryState;
  telemetryHistory: TelemetryPoint[];
  eventLog: EventLogItem[];
  alarmsActive: number;

  // Viewport & UI State
  cameraPreset: CameraPreset;
  displayOptions: DisplayOptions;
  selectedComponentId: string | null;

  // Operating Actions
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  stepSimulation: (stepSeconds?: number) => void;
  triggerEmergencyStop: () => void;
  triggerResolveFault: () => void;
  triggerDeploy: () => void;
  triggerPrime: () => void;
  triggerExtract: () => void;
  triggerDischarge: () => void;
  triggerManualDischarge: () => void;
  setSimSpeed: (speed: number) => void;
  setActiveView: (view: NavView) => void;
  updateParameter: <K extends keyof SimulationParameters>(key: K, value: SimulationParameters[K]) => void;
  batchUpdateParameters: (partial: Partial<SimulationParameters>) => void;
  updateEngineParameter: <K extends keyof EngineParameters>(key: K, value: EngineParameters[K]) => void;
  tickSimulation: (deltaSeconds: number) => void;
  addEvent: (level: EventLogItem['level'], source: string, message: string) => void;
  clearEvents: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  toggleDisplayOption: (key: keyof DisplayOptions) => void;
  setMobilityMode: (mode: 'wheels' | 'tracks') => void;
  setSelectedComponent: (id: string | null) => void;

  // Challenging Terrain & Feasibility Modeling
  selectedScenario: TerrainScenarioId;
  terrainParams: TerrainParameters;
  stabilityThresholds: StabilityThresholds;
  feasibility: EngineeringFeasibilityEstimate;
  setTerrainScenario: (id: TerrainScenarioId) => void;
  updateTerrainParams: (partial: Partial<TerrainParameters>) => void;
  resetTerrainToDefault: () => void;
  updateStabilityThresholds: (partial: Partial<StabilityThresholds>) => void;

  // Guided Demonstration Tour
  guidedDemo: GuidedDemoState;
  startGuidedDemo: () => void;
  stopGuidedDemo: () => void;
  nextDemoStage: () => void;
  prevDemoStage: () => void;
  setDemoStage: (stageIndex: number) => void;
  toggleDemoAutoAdvance: () => void;

  // Engineering Test Scenarios (Deliverable 2)
  runCompleteCycleScenario: () => void;
  triggerTankFullScenario: () => void;
}

function syncEngineParamsFromDigitalTwin(
  p: SimulationParameters,
  existing: EngineParameters
): Partial<EngineParameters> {
  return {
    pumpRpm: p.pumpRpm,
    hoseDiameterMm: p.hoseDiameterMm,
    hoseLengthM: p.hoseLengthM,
    pipeRoughnessMm: p.pipeRoughnessMm,
    elevationDifferenceM: (p as any).elevationDifferenceM ?? existing.elevationDifferenceM ?? 2.5,
    sludgeViscosityCp: p.slurryViscosityCp,
    sludgeDensityKgM3: p.slurryDensityKgM3,
    sourceTankCapacityL: p.containmentVolumeLiters,
    initialSourceVolumeL: p.containmentVolumeLiters * (p.initialSludgeDepthM / 2.0),
    waterJettingEnabled: p.waterJetEnabled,
    waterJetPressureBar: p.waterJetPressureBar,
    cutterHeadEnabled: p.cutterHeadEnabled,
    cutterHeadSpeedRpm: p.cutterHeadSpeedRpm
  };
}

export const useSimulationStore = create<SimulationStore>((set, get) => {
  const initialParams = { ...DEFAULT_PARAMETERS };
  const initialTelemetry = createInitialTelemetry(initialParams);

  const initialEngine = createInitialEngineState({
    pumpRpm: initialParams.pumpRpm,
    hoseDiameterMm: initialParams.hoseDiameterMm,
    hoseLengthM: initialParams.hoseLengthM,
    elevationDifferenceM: 2.5,
    sludgeViscosityCp: initialParams.slurryViscosityCp,
    sludgeDensityKgM3: initialParams.slurryDensityKgM3,
    sourceTankCapacityL: initialParams.containmentVolumeLiters,
    initialSourceVolumeL: 3800,
    collectionTankCapacityL: 2400,
    receiverTankCapacityL: 10000,
    targetExtractionVolumeL: 2400,
    waterJettingEnabled: initialParams.waterJetEnabled,
    waterJetPressureBar: initialParams.waterJetPressureBar,
    cutterHeadEnabled: initialParams.cutterHeadEnabled,
    cutterHeadSpeedRpm: initialParams.cutterHeadSpeedRpm
  });

  const initialHistory: TelemetryPoint[] = Array.from({ length: 12 }, (_, i) => {
    const t = i * 2;
    return {
      time: `00:${t.toString().padStart(2, '0')}`,
      timestamp: t,
      flowRate: 0,
      flowRateLpm: 0,
      vacuum: 0,
      power: 0,
      energyKwh: 0,
      motorLoadPct: 0,
      h2s: 2.0,
      ch4: 0.15,
      sludgeLevel: initialParams.initialSludgeDepthM,
      sourceVolumeL: 3800,
      collectionVolumeL: 0,
      receiverVolumeL: 0,
      vibration: 0.2
    };
  });

  const initialEvents: EventLogItem[] = [
    {
      id: 'evt-init-1',
      timestamp: '00:00',
      timeSec: 0,
      level: 'info',
      source: 'SYSTEM_BOOT',
      message: 'Desludge Digital Twin deterministic physics & kinematics engine initialized.'
    },
    {
      id: 'evt-init-2',
      timestamp: '00:00',
      timeSec: 0,
      level: 'info',
      source: 'INTERLOCK_CHK',
      message: 'Safety interlocks armed. Stabilizers stowed. Machine in IDLE sequence.'
    }
  ];

  return {
    status: 'idle',
    activeView: 'overview',
    simSpeed: 1,
    connectionState: 'SIMULATED',

    engine: initialEngine,
    operatingState: initialEngine.operatingState,
    materialBalance: initialEngine.materialBalance,
    kinematics: initialEngine.kinematics,
    alarms: initialEngine.alarms,
    interlocks: initialEngine.interlocks,

    parameters: initialParams,
    telemetry: initialTelemetry,
    telemetryHistory: initialHistory,
    eventLog: initialEvents,
    alarmsActive: 0,

    cameraPreset: 'iso',
    displayOptions: {
      wireframe: false,
      cutaway: true,
      showAnnotations: false,
      showParticles: true,
      godRays: true,
      soundEnabled: false,
      showGrid: true,
      mobilityMode: 'wheels',
      showSensorOverlay: true
    },
    selectedComponentId: null,

    selectedScenario: 'level_paved',
    terrainParams: { ...DEFAULT_TERRAIN_PARAMS },
    stabilityThresholds: { ...DEFAULT_STABILITY_THRESHOLDS },
    feasibility: calculateTerrainFeasibility(
      DEFAULT_TERRAIN_PARAMS,
      initialEngine.kinematics.stabilizerExtension,
      initialParams.hoseLengthM,
      initialParams.slurryDensityKgM3,
      initialParams.slurryViscosityCp,
      initialParams.hoseDiameterMm,
      DEFAULT_STABILITY_THRESHOLDS
    ),

    guidedDemo: {
      isActive: false,
      currentStageIndex: 0,
      stageProgressPct: 0,
      isAutoAdvancing: true,
      stageElapsedSec: 0
    },

    startSimulation: () => {
      const { engine, addEvent } = get();
      if (engine.operatingState === 'FAULT') {
        addEvent('critical', 'INTERLOCK_TRIP', 'Cannot start machine: Clear active fault / E-STOP first.');
        return;
      }
      const updatedEngine = triggerStart(engine);
      set({
        engine: updatedEngine,
        operatingState: updatedEngine.operatingState,
        status: 'running'
      });
      addEvent('info', 'OPERATOR_CMD', 'Operating sequence initiated: DEPLOY sequence starting.');
    },

    pauseSimulation: () => {
      const { engine, addEvent } = get();
      const updatedEngine = triggerPause(engine);
      set({
        engine: updatedEngine,
        status: 'paused'
      });
      addEvent('warning', 'OPERATOR_CMD', 'Simulation paused by operator.');
    },

    resumeSimulation: () => {
      const { engine, addEvent } = get();
      const updatedEngine = triggerResume(engine);
      set({
        engine: updatedEngine,
        status: 'running'
      });
      addEvent('info', 'OPERATOR_CMD', 'Simulation resumed.');
    },

    resetSimulation: () => {
      const { parameters, engine, addEvent } = get();
      const freshEngine = triggerReset(engine);
      const freshTelemetry = createInitialTelemetry(parameters);
      const freshHistory: TelemetryPoint[] = [
        {
          time: '00:00',
          timestamp: 0,
          flowRate: 0,
          flowRateLpm: 0,
          vacuum: 0,
          power: 0,
          energyKwh: 0,
          motorLoadPct: 0,
          h2s: 2.0,
          ch4: 0.15,
          sludgeLevel: parameters.initialSludgeDepthM,
          sourceVolumeL: freshEngine.materialBalance.sourceVolumeL,
          collectionVolumeL: freshEngine.materialBalance.collectionVolumeL,
          receiverVolumeL: freshEngine.materialBalance.receiverVolumeL,
          vibration: 0.2
        }
      ];

      const freshFeasibility = calculateTerrainFeasibility(
        get().terrainParams,
        freshEngine.kinematics.stabilizerExtension,
        parameters.hoseLengthM,
        parameters.slurryDensityKgM3,
        parameters.slurryViscosityCp,
        parameters.hoseDiameterMm,
        get().stabilityThresholds
      );

      set({
        status: 'idle',
        engine: freshEngine,
        operatingState: freshEngine.operatingState,
        materialBalance: freshEngine.materialBalance,
        kinematics: freshEngine.kinematics,
        alarms: freshEngine.alarms,
        interlocks: freshEngine.interlocks,
        telemetry: freshTelemetry,
        telemetryHistory: freshHistory,
        alarmsActive: 0,
        feasibility: freshFeasibility
      });
      addEvent('info', 'SYSTEM_RESET', 'Machine kinematics, tanks, and telemetry reset to initial IDLE baseline.');
    },

    stepSimulation: (stepSeconds = 1.0) => {
      get().tickSimulation(stepSeconds);
    },

    triggerEmergencyStop: () => {
      const { engine, addEvent } = get();
      const nextEngine = triggerEmergencyStop(engine);
      set({
        engine: nextEngine,
        operatingState: nextEngine.operatingState,
        status: 'alarm',
        alarms: nextEngine.alarms,
        interlocks: nextEngine.interlocks,
        alarmsActive: get().alarmsActive + 1
      });
      addEvent('critical', 'EMERGENCY_STOP', 'EMERGENCY STOP (E-STOP) ACTUATED! Machinery disabled immediately.');
    },

    triggerResolveFault: () => {
      const { engine, addEvent } = get();
      const nextEngine = triggerResolveFault(engine);
      set({
        engine: nextEngine,
        operatingState: nextEngine.operatingState,
        status: 'idle',
        alarms: nextEngine.alarms,
        interlocks: nextEngine.interlocks,
        alarmsActive: 0
      });
      addEvent('info', 'FAULT_RESOLVED', 'Operator fault reset acknowledged. Machine returned to safe IDLE mode.');
    },

    triggerManualDischarge: () => {
      const { engine, addEvent } = get();
      const nextEngine = triggerManualDischarge(engine);
      set({
        engine: nextEngine,
        operatingState: nextEngine.operatingState
      });
      addEvent('info', 'OPERATOR_CMD', 'Manual discharge to external disposal tanker initiated.');
    },

    triggerDeploy: () => {
      const { engine, addEvent } = get();
      const nextEngine = triggerDeploy(engine);
      set({
        engine: nextEngine,
        operatingState: nextEngine.operatingState,
        interlocks: nextEngine.interlocks,
        status: nextEngine.operatingState === 'FAULT' ? 'alarm' : 'running'
      });
      if (nextEngine.operatingState === 'FAULT') {
        addEvent('critical', 'INTERLOCK_TRIP', 'Deploy interlock blocked.');
      } else {
        addEvent('info', 'OPERATOR_CMD', 'Manual DEPLOY triggered: Stabilizers extending and boom positioning.');
      }
    },

    triggerPrime: () => {
      const { engine, addEvent } = get();
      const nextEngine = triggerPrime(engine);
      set({
        engine: nextEngine,
        operatingState: nextEngine.operatingState,
        interlocks: nextEngine.interlocks,
        status: nextEngine.operatingState === 'FAULT' ? 'alarm' : 'running'
      });
      if (nextEngine.operatingState === 'FAULT') {
        addEvent('critical', 'INTERLOCK_TRIP', 'Prime blocked: Machine must be fully deployed first.');
      } else {
        addEvent('info', 'OPERATOR_CMD', 'Manual PRIME triggered: Vacuum preparation sequence running.');
      }
    },

    triggerExtract: () => {
      const { engine, addEvent } = get();
      const nextEngine = triggerExtract(engine);
      set({
        engine: nextEngine,
        operatingState: nextEngine.operatingState,
        interlocks: nextEngine.interlocks,
        status: nextEngine.operatingState === 'FAULT' ? 'alarm' : 'running'
      });
      if (nextEngine.operatingState === 'FAULT') {
        addEvent('critical', 'INTERLOCK_TRIP', 'Extract blocked: Machine must be primed and tanks ready.');
      } else {
        addEvent('info', 'OPERATOR_CMD', 'Manual EXTRACT triggered: Slurry vacuum suction pump engaged.');
      }
    },

    triggerDischarge: () => {
      const { engine, addEvent } = get();
      const nextEngine = triggerDischarge(engine);
      set({
        engine: nextEngine,
        operatingState: nextEngine.operatingState,
        interlocks: nextEngine.interlocks,
        status: nextEngine.operatingState === 'FAULT' ? 'alarm' : 'running'
      });
      if (nextEngine.operatingState === 'FAULT') {
        addEvent('critical', 'INTERLOCK_TRIP', 'Discharge blocked.');
      } else {
        addEvent('info', 'OPERATOR_CMD', 'Manual DISCHARGE triggered: Evacuating collection tank to external tanker.');
      }
    },

    setSimSpeed: (speed: number) => {
      set((state) => ({
        simSpeed: speed,
        engine: { ...state.engine, simSpeedMultiplier: speed }
      }));
    },

    setActiveView: (view: NavView) => {
      set({ activeView: view });
    },

    updateParameter: (key, value) => {
      set((state) => {
        const nextParams = { ...state.parameters, [key]: value };
        const enginePartial = syncEngineParamsFromDigitalTwin(nextParams, state.engine.parameters);
        const nextEngine: EngineState = {
          ...state.engine,
          parameters: {
            ...state.engine.parameters,
            ...enginePartial
          }
        };
        const nextFeasibility = calculateTerrainFeasibility(
          state.terrainParams,
          state.kinematics.stabilizerExtension,
          nextParams.hoseLengthM,
          nextParams.slurryDensityKgM3,
          nextParams.slurryViscosityCp,
          nextParams.hoseDiameterMm,
          state.stabilityThresholds
        );
        return {
          parameters: nextParams,
          engine: nextEngine,
          feasibility: nextFeasibility
        };
      });
    },

    batchUpdateParameters: (partial) => {
      set((state) => {
        const nextParams = { ...state.parameters, ...partial };
        const enginePartial = syncEngineParamsFromDigitalTwin(nextParams, state.engine.parameters);
        const nextEngine: EngineState = {
          ...state.engine,
          parameters: {
            ...state.engine.parameters,
            ...enginePartial
          }
        };
        return {
          parameters: nextParams,
          engine: nextEngine
        };
      });
    },

    updateEngineParameter: (key, value) => {
      set((state) => {
        const nextParams = {
          ...state.engine.parameters,
          [key]: value
        };
        const nextMaterial = { ...state.materialBalance };
        if (key === 'collectionTankCapacityL') {
          nextMaterial.collectionFillPct = Math.min(
            100,
            (nextMaterial.collectionVolumeL / Number(value)) * 100
          );
        }
        return {
          engine: {
            ...state.engine,
            parameters: nextParams,
            materialBalance: nextMaterial
          },
          materialBalance: nextMaterial
        };
      });
    },

    tickSimulation: (deltaSeconds: number) => {
      const state = get();
      if (state.engine.isPaused) return;
      if (state.engine.operatingState === 'IDLE' && state.status === 'idle') return;

      const effectiveDt = deltaSeconds * state.simSpeed;
      const nextEngine = stepSimulationEngine(state.engine, effectiveDt);

      // Collect new events generated by engine
      const convertedEvents: EventLogItem[] = nextEngine.recentEvents.map((evt) => ({
        id: evt.id,
        timestamp: evt.formattedTime,
        timeSec: evt.simTimeSec,
        level: evt.level,
        source: evt.source,
        message: evt.message,
        acknowledged: false
      }));

      const nextEvents = convertedEvents.length > 0
        ? [...convertedEvents, ...state.eventLog].slice(0, 100)
        : state.eventLog;

      // Status mapping
      const nextStatus: SimulationStatus =
        nextEngine.operatingState === 'FAULT'
          ? 'alarm'
          : nextEngine.operatingState === 'COMPLETE'
          ? 'complete'
          : nextEngine.operatingState === 'IDLE'
          ? 'idle'
          : 'running';

      // Telemetry synchronization
      const isFlowing = nextEngine.kinematics.isMaterialFlowing;
      const rpmRatio = nextEngine.parameters.pumpRpm / 3000;
      const nextTelemetry: TelemetryState = {
        ...state.telemetry,
        elapsedTimeSeconds: nextEngine.simulatedTimeSec,
        volumeExtractedLiters: nextEngine.materialBalance.collectionVolumeL,
        volumeRemainingLiters: nextEngine.materialBalance.sourceVolumeL,
        sludgeLevelM: nextEngine.materialBalance.sourceLevelM,
        extractionRateM3H: nextEngine.telemetry.flowRateM3H,
        suctionPressureKpa: -nextEngine.telemetry.suctionPressureKpa,
        dischargePressureBar: nextEngine.telemetry.dischargePressureKpa / 100,
        cavitationIndex: nextEngine.telemetry.cavitationIndex,
        motorPowerKw: nextEngine.telemetry.motorPowerKw,
        motorCurrentAmps: (nextEngine.telemetry.motorPowerKw * 1000) / (400 * 1.732 * 0.88),
        h2sConcentrationPpm: isFlowing
          ? Math.min(18.0, 2.0 + (nextEngine.materialBalance.cycleExtractedL / 3800) * 8.5)
          : 2.0,
        ch4ConcentrationPct: isFlowing
          ? Math.min(1.2, 0.15 + (nextEngine.materialBalance.cycleExtractedL / 3800) * 0.45)
          : 0.15,
        vibrationRmsMmS: isFlowing
          ? 1.5 + rpmRatio * 1.4 + (nextEngine.telemetry.cavitationIndex > 0.5 ? 2.0 : 0)
          : 0.2,
        estimatedCompletionMinutes: nextEngine.telemetry.estimatedRemainingTimeSec / 60
      };

      // Chart history sampling
      const lastPoint = state.telemetryHistory[state.telemetryHistory.length - 1];
      const shouldSample =
        !lastPoint ||
        nextTelemetry.elapsedTimeSeconds - lastPoint.timestamp >= 0.75;

      let nextHistory = state.telemetryHistory;
      if (shouldSample) {
        const mm = Math.floor(nextTelemetry.elapsedTimeSeconds / 60)
          .toString()
          .padStart(2, '0');
        const ss = Math.floor(nextTelemetry.elapsedTimeSeconds % 60)
          .toString()
          .padStart(2, '0');

        const flowRateLpm = parseFloat(nextEngine.telemetry.flowRateLpm.toFixed(1));
        const motorLoadPct = parseFloat(
          Math.min(100, Math.max(0, (nextEngine.telemetry.motorPowerKw / 15.0) * 100)).toFixed(1)
        );

        const newPoint: TelemetryPoint = {
          time: `${mm}:${ss}`,
          timestamp: nextTelemetry.elapsedTimeSeconds,
          flowRate: parseFloat(nextTelemetry.extractionRateM3H.toFixed(2)),
          flowRateLpm,
          vacuum: Math.abs(parseFloat(nextTelemetry.suctionPressureKpa.toFixed(1))),
          power: parseFloat(nextTelemetry.motorPowerKw.toFixed(2)),
          energyKwh: parseFloat(nextEngine.telemetry.cumulativeEnergyKwh.toFixed(3)),
          motorLoadPct,
          h2s: parseFloat(nextTelemetry.h2sConcentrationPpm.toFixed(1)),
          ch4: parseFloat(nextTelemetry.ch4ConcentrationPct.toFixed(2)),
          sludgeLevel: parseFloat(nextTelemetry.sludgeLevelM.toFixed(2)),
          sourceVolumeL: parseFloat(nextEngine.materialBalance.sourceVolumeL.toFixed(1)),
          collectionVolumeL: parseFloat(nextEngine.materialBalance.collectionVolumeL.toFixed(1)),
          receiverVolumeL: parseFloat(nextEngine.materialBalance.receiverVolumeL.toFixed(1)),
          vibration: parseFloat(nextTelemetry.vibrationRmsMmS.toFixed(2))
        };

        nextHistory = [...state.telemetryHistory.slice(-44), newPoint];
      }

      const alarmCount =
        (nextEngine.alarms.lowSourceLevel ? 1 : 0) +
        (nextEngine.alarms.collectionTankFull ? 1 : 0) +
        (nextEngine.alarms.excessiveVacuum ? 1 : 0) +
        (nextEngine.alarms.motorOverload ? 1 : 0) +
        (nextEngine.alarms.emergencyStopActive ? 1 : 0);

      const nextFeasibility = calculateTerrainFeasibility(
        state.terrainParams,
        nextEngine.kinematics.stabilizerExtension,
        state.parameters.hoseLengthM,
        state.parameters.slurryDensityKgM3,
        state.parameters.slurryViscosityCp,
        state.parameters.hoseDiameterMm,
        state.stabilityThresholds
      );

      set({
        engine: nextEngine,
        operatingState: nextEngine.operatingState,
        materialBalance: nextEngine.materialBalance,
        kinematics: nextEngine.kinematics,
        alarms: nextEngine.alarms,
        interlocks: nextEngine.interlocks,
        status: nextStatus,
        telemetry: nextTelemetry,
        telemetryHistory: nextHistory,
        eventLog: nextEvents,
        alarmsActive: alarmCount,
        feasibility: nextFeasibility
      });

      // Update Guided Demo timer & auto-advance
      if (state.guidedDemo.isActive) {
        const stage = DEMO_STAGES[state.guidedDemo.currentStageIndex];
        if (stage) {
          const nextElapsed = state.guidedDemo.stageElapsedSec + effectiveDt;
          const nextProgress = Math.min(100, (nextElapsed / stage.durationSec) * 100);

          if (nextElapsed >= stage.durationSec && state.guidedDemo.isAutoAdvancing) {
            setTimeout(() => {
              get().nextDemoStage();
            }, 0);
          } else {
            set((s) => ({
              guidedDemo: {
                ...s.guidedDemo,
                stageElapsedSec: nextElapsed,
                stageProgressPct: nextProgress
              }
            }));
          }
        }
      }
    },

    addEvent: (level, source, message) => {
      const simSec = Math.round(get().engine.simulatedTimeSec);
      const mm = Math.floor(simSec / 60).toString().padStart(2, '0');
      const ss = (simSec % 60).toString().padStart(2, '0');
      const newEvt: EventLogItem = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: `${mm}:${ss}`,
        timeSec: simSec,
        level,
        source,
        message,
        acknowledged: false
      };

      set((state) => ({
        eventLog: [newEvt, ...state.eventLog].slice(0, 100),
        alarmsActive: level === 'critical' || level === 'warning' ? state.alarmsActive + 1 : state.alarmsActive
      }));
    },

    clearEvents: () => {
      set({ eventLog: [], alarmsActive: 0 });
    },

    setCameraPreset: (preset: CameraPreset) => {
      set({ cameraPreset: preset });
    },

    toggleDisplayOption: (key: keyof DisplayOptions) => {
      set((state) => ({
        displayOptions: {
          ...state.displayOptions,
          [key]: !state.displayOptions[key]
        }
      }));
    },

    setMobilityMode: (mode: 'wheels' | 'tracks') => {
      set((state) => ({
        displayOptions: {
          ...state.displayOptions,
          mobilityMode: mode
        }
      }));
    },

    setSelectedComponent: (id: string | null) => {
      set({ selectedComponentId: id });
    },

    setTerrainScenario: (scenarioId: TerrainScenarioId) => {
      const scenarioConfig = TERRAIN_SCENARIOS[scenarioId];
      if (!scenarioConfig) return;
      set((state) => {
        const nextTerrain = getScenarioDefaultParams(scenarioId);
        // Preserve user-configured hose length if set
        nextTerrain.configuredHoseLengthM = state.parameters.hoseLengthM;
        const nextFeasibility = calculateTerrainFeasibility(
          nextTerrain,
          state.kinematics.stabilizerExtension,
          state.parameters.hoseLengthM,
          state.parameters.slurryDensityKgM3,
          state.parameters.slurryViscosityCp,
          state.parameters.hoseDiameterMm,
          state.stabilityThresholds
        );
        return {
          selectedScenario: scenarioId,
          terrainParams: nextTerrain,
          feasibility: nextFeasibility
        };
      });
      get().addEvent(
        'info',
        'SCENARIO_SWITCH',
        `Operating environment switched to ${TERRAIN_SCENARIOS[scenarioId].name}: Slope ${TERRAIN_SCENARIOS[scenarioId].defaultSlopeDeg}°, Width ${TERRAIN_SCENARIOS[scenarioId].defaultPathWidthM}m, Rain ${TERRAIN_SCENARIOS[scenarioId].defaultRainfallIntensityMmH}mm/h, Temp ${TERRAIN_SCENARIOS[scenarioId].defaultAmbientTempC}°C, Alt ${TERRAIN_SCENARIOS[scenarioId].defaultAltitudeM}m.`
      );
    },

    updateTerrainParams: (partial: Partial<TerrainParameters>) => {
      set((state) => {
        const nextTerrain = { ...state.terrainParams, ...partial };
        const nextFeasibility = calculateTerrainFeasibility(
          nextTerrain,
          state.kinematics.stabilizerExtension,
          state.parameters.hoseLengthM,
          state.parameters.slurryDensityKgM3,
          state.parameters.slurryViscosityCp,
          state.parameters.hoseDiameterMm,
          state.stabilityThresholds
        );
        return {
          terrainParams: nextTerrain,
          feasibility: nextFeasibility
        };
      });
    },

    resetTerrainToDefault: () => {
      const currentId = get().selectedScenario;
      const defaultParams = getScenarioDefaultParams(currentId);
      set((state) => {
        defaultParams.configuredHoseLengthM = state.parameters.hoseLengthM;
        const nextFeasibility = calculateTerrainFeasibility(
          defaultParams,
          state.kinematics.stabilizerExtension,
          state.parameters.hoseLengthM,
          state.parameters.slurryDensityKgM3,
          state.parameters.slurryViscosityCp,
          state.parameters.hoseDiameterMm,
          state.stabilityThresholds
        );
        return {
          terrainParams: defaultParams,
          feasibility: nextFeasibility
        };
      });
      get().addEvent(
        'info',
        'TERRAIN_RESET',
        `Reset terrain parameters to default calibration for ${TERRAIN_SCENARIOS[currentId].name}.`
      );
    },

    updateStabilityThresholds: (partial: Partial<StabilityThresholds>) => {
      set((state) => {
        const nextThresholds = { ...state.stabilityThresholds, ...partial };
        const nextFeasibility = calculateTerrainFeasibility(
          state.terrainParams,
          state.kinematics.stabilizerExtension,
          state.parameters.hoseLengthM,
          state.parameters.slurryDensityKgM3,
          state.parameters.slurryViscosityCp,
          state.parameters.hoseDiameterMm,
          nextThresholds
        );
        return {
          stabilityThresholds: nextThresholds,
          feasibility: nextFeasibility
        };
      });
    },

    startGuidedDemo: () => {
      const { resetSimulation, setSimSpeed, setCameraPreset, setSelectedComponent, addEvent } = get();
      resetSimulation();
      setSimSpeed(2);
      const stage = DEMO_STAGES[0];
      setCameraPreset(stage.cameraPreset);
      setSelectedComponent(stage.selectedComponent);
      set({
        guidedDemo: {
          isActive: true,
          currentStageIndex: 0,
          stageProgressPct: 0,
          isAutoAdvancing: true,
          stageElapsedSec: 0
        }
      });
      addEvent('info', 'DEMO_MODE', 'Guided demonstration tour activated: Stage 1 Machine Staging.');
    },

    stopGuidedDemo: () => {
      set((s) => ({
        guidedDemo: {
          ...s.guidedDemo,
          isActive: false
        }
      }));
      get().setSimSpeed(1);
      get().addEvent('info', 'DEMO_MODE', 'Guided demonstration tour concluded. Standard manual control restored.');
    },

    setDemoStage: (index: number) => {
      const targetIdx = Math.max(0, Math.min(DEMO_STAGES.length - 1, index));
      const stage = DEMO_STAGES[targetIdx];
      const {
        setCameraPreset,
        setSelectedComponent,
        setTerrainScenario,
        triggerDeploy,
        triggerPrime,
        triggerExtract,
        triggerDischarge,
        triggerEmergencyStop,
        triggerResolveFault,
        resetSimulation,
        setActiveView,
        addEvent
      } = get();

      setCameraPreset(stage.cameraPreset);
      setSelectedComponent(stage.selectedComponent);

      if (stage.activeViewTarget) {
        setActiveView(stage.activeViewTarget);
      }

      if (stage.scenarioTarget) {
        setTerrainScenario(stage.scenarioTarget as any);
      }

      // State machine sequencing according to stage without bypassing interlocks
      switch (stage.id) {
        case 'project_objective':
          resetSimulation();
          break;
        case 'component_inspection':
          break;
        case 'scenario_selection':
        case 'feasibility_assessment':
          setTerrainScenario('hilly_sloped');
          break;
        case 'deployment_positioning':
          if (get().operatingState === 'FAULT') triggerResolveFault();
          triggerDeploy();
          break;
        case 'priming_extraction':
          if (get().operatingState === 'FAULT') triggerResolveFault();
          if (!get().interlocks.isDeployed) {
            triggerDeploy();
          }
          triggerPrime();
          setTimeout(() => {
            get().triggerExtract();
          }, 350);
          break;
        case 'live_dashboard':
          if (get().operatingState !== 'EXTRACT' && get().interlocks.isPrimed) {
            triggerExtract();
          }
          break;
        case 'alarm_estop_demo':
          triggerEmergencyStop();
          break;
        case 'discharge_mass_balance':
          if (get().operatingState === 'FAULT') {
            triggerResolveFault();
          }
          triggerDischarge();
          break;
        case 'scenario_comparison':
        case 'hardware_bom_test_plan':
        case 'report_export':
          break;
      }

      set((s) => ({
        guidedDemo: {
          ...s.guidedDemo,
          currentStageIndex: targetIdx,
          stageElapsedSec: 0,
          stageProgressPct: 0
        }
      }));
      addEvent('info', 'DEMO_MODE', `Demonstration stage: ${stage.title}`);
    },

    nextDemoStage: () => {
      const { guidedDemo, setDemoStage, stopGuidedDemo } = get();
      if (guidedDemo.currentStageIndex < DEMO_STAGES.length - 1) {
        setDemoStage(guidedDemo.currentStageIndex + 1);
      } else {
        stopGuidedDemo();
      }
    },

    prevDemoStage: () => {
      const { guidedDemo, setDemoStage } = get();
      if (guidedDemo.currentStageIndex > 0) {
        setDemoStage(guidedDemo.currentStageIndex - 1);
      }
    },

    toggleDemoAutoAdvance: () => {
      set((s) => ({
        guidedDemo: {
          ...s.guidedDemo,
          isAutoAdvancing: !s.guidedDemo.isAutoAdvancing
        }
      }));
    },

    runCompleteCycleScenario: () => {
      const { resetSimulation, setSimSpeed, triggerDeploy, addEvent } = get();
      resetSimulation();
      setSimSpeed(2.5);
      triggerDeploy();
      addEvent(
        'info',
        'TEST_SCENARIO',
        'TEST SCENARIO 1: Automated full desludging cycle initiated (IDLE → DEPLOY → PRIME → EXTRACT → DISCHARGE → COMPLETE).'
      );
    },

    triggerTankFullScenario: () => {
      const { resetSimulation, setSimSpeed, triggerExtract, addEvent } = get();
      resetSimulation();
      setSimSpeed(2.0);

      // Pre-fill collection tank to 99.6% (2,390 L out of 2,400 L) while strictly conserving mass!
      set((state) => {
        const capacity = state.engine.parameters.collectionTankCapacityL; // 2400
        const prefillL = capacity - 5; // 2395 L (99.8% capacity)
        const initialTotal = state.materialBalance.totalInitialVolumeL; // 3800
        const newSourceL = Math.max(0, initialTotal - prefillL); // 1405 L

        const nextMat = {
          ...state.materialBalance,
          collectionVolumeL: prefillL,
          collectionFillPct: (prefillL / capacity) * 100,
          sourceVolumeL: newSourceL,
          receiverVolumeL: 0,
          totalInitialVolumeL: initialTotal,
          massBalanceDiscrepancyL: prefillL + newSourceL - initialTotal,
          cycleExtractedL: 0.0
        };

        const nextEngine = {
          ...state.engine,
          materialBalance: nextMat,
          interlocks: {
            ...state.engine.interlocks,
            isDeployed: true,
            isPrimed: true,
            preventExtractNotDeployed: false,
            preventExtractNotPrimed: false
          },
          kinematics: {
            ...state.engine.kinematics,
            deployProgress: 1.0,
            stabilizerExtension: 1.0
          }
        };

        return {
          engine: nextEngine,
          materialBalance: nextMat,
          interlocks: nextEngine.interlocks,
          kinematics: nextEngine.kinematics
        };
      });

      // Initiate extraction — in subsequent simulation step, will immediately hit capacity and trip tank-full interlock!
      triggerExtract();
      addEvent(
        'warning',
        'TEST_SCENARIO',
        'TEST SCENARIO 2: Overfill protection interlock activated. Collection vessel pre-filled to 99.6% capacity.'
      );
    }
  };
});
