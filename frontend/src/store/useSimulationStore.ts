/**
 * Typed central simulation state management using Zustand.
 * Controls parameters, telemetry stream, event logs, and UI modes.
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
  ComponentInspectionData
} from '../types/digitalTwin';
import { createInitialTelemetry, stepPhysicsSimulation } from '../simulation/physicsEngine';

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
  pump: {
    id: 'pump',
    name: 'Tri-Lobe Positive Displacement Vacuum Pump',
    type: 'Hydraulic Core Unit',
    status: 'nominal',
    temperatureC: 48.5,
    pressureBar: 2.8,
    vibrationMmS: 2.1,
    description: 'Direct-drive rotary lobe pump designed for non-Newtonian viscous septage evacuation without mechanical air lock.',
    specifications: {
      'Displacement': '36 m³/h nominal',
      'Max Vacuum': '-88 kPa',
      'Shaft Power': '11.0 kW rated',
      'Lobe Geometry': 'Helical tri-lobe polyurethane'
    }
  },
  crawler: {
    id: 'crawler',
    name: 'Bandicoot Subsurface Dredging ROV',
    type: 'Robotic Agitator',
    status: 'nominal',
    temperatureC: 22.0,
    pressureBar: 1.2,
    vibrationMmS: 1.8,
    description: 'Tracked submersible robotic crawler equipped with rotary cutter bar and rotating LiDAR obstacle mapping.',
    specifications: {
      'Traction': 'Twin independent rubber tracks',
      'Cutter Speed': '0 - 600 RPM variable',
      'Submersible Rating': 'IP68 (5m head)',
      'Telemetry': 'RS-485 umbilical bus'
    }
  },
  hose: {
    id: 'hose',
    name: 'Heavy-Duty Reinforced Suction Hose',
    type: 'Fluid Conduit',
    status: 'nominal',
    temperatureC: 19.2,
    pressureBar: -0.72,
    vibrationMmS: 0.8,
    description: 'Helix steel-wire reinforced PVC composite hose with quick-disconnect camlock couplings.',
    specifications: {
      'Inner Diameter': '100 mm (4 inch)',
      'Burst Pressure': '12.0 bar',
      'Vacuum Rating': '-95 kPa full collapse resistant',
      'Length': '35 m operational'
    }
  },
  vault: {
    id: 'vault',
    name: 'Reinforced Concrete Subsurface Vault',
    type: 'Containment Chamber',
    status: 'nominal',
    temperatureC: 16.5,
    pressureBar: 1.01,
    vibrationMmS: 0.1,
    description: 'Dual-compartment municipal septic holding chamber with cast-iron access chimney.',
    specifications: {
      'Gross Capacity': '4,200 Liters',
      'Design Depth': '2.2 m total depth',
      'Access Chimney': '600 mm clear opening',
      'Atmosphere': 'Confined Space Category 1'
    }
  }
};

interface SimulationStore {
  // Core Status
  status: SimulationStatus;
  activeView: NavView;
  simSpeed: number; // 0.5, 1, 2, 5
  connectionState: 'SIMULATED';
  
  // State Models
  parameters: SimulationParameters;
  telemetry: TelemetryState;
  telemetryHistory: TelemetryPoint[];
  eventLog: EventLogItem[];
  alarmsActive: number;

  // Viewport & UI State
  cameraPreset: CameraPreset;
  displayOptions: DisplayOptions;
  selectedComponentId: string | null;

  // Actions
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  stepSimulation: (stepSeconds?: number) => void;
  setSimSpeed: (speed: number) => void;
  setActiveView: (view: NavView) => void;
  updateParameter: <K extends keyof SimulationParameters>(key: K, value: SimulationParameters[K]) => void;
  batchUpdateParameters: (partial: Partial<SimulationParameters>) => void;
  tickSimulation: (deltaSeconds: number) => void;
  addEvent: (level: EventLogItem['level'], source: string, message: string) => void;
  clearEvents: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  toggleDisplayOption: (key: keyof DisplayOptions) => void;
  setSelectedComponent: (id: string | null) => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => {
  const initialParams = { ...DEFAULT_PARAMETERS };
  const initialTelemetry = createInitialTelemetry(initialParams);

  // Seed baseline history for smooth chart on first render
  const initialHistory: TelemetryPoint[] = Array.from({ length: 12 }, (_, i) => {
    const t = i * 2;
    return {
      time: `00:${t.toString().padStart(2, '0')}`,
      timestamp: t,
      flowRate: 0,
      vacuum: 0,
      power: 0,
      h2s: 2.0,
      ch4: 0.15,
      sludgeLevel: initialParams.initialSludgeDepthM,
      vibration: 0.2
    };
  });

  const initialEvents: EventLogItem[] = [
    {
      id: 'evt-init-1',
      timestamp: new Date().toLocaleTimeString(),
      timeSec: 0,
      level: 'info',
      source: 'SYSTEM_BOOT',
      message: 'Desludge Digital Twin telemetry gateway initialized in SIMULATED mode.'
    },
    {
      id: 'evt-init-2',
      timestamp: new Date().toLocaleTimeString(),
      timeSec: 0,
      level: 'info',
      source: 'ATMOSPHERE_CHK',
      message: 'Initial vault atmospheric survey: H2S 2.1 ppm, CH4 0.15% (Within Safe Limits).'
    }
  ];

  return {
    status: 'idle',
    activeView: 'overview',
    simSpeed: 1,
    connectionState: 'SIMULATED',

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
      soundEnabled: false
    },
    selectedComponentId: null,

    startSimulation: () => {
      const { status, addEvent } = get();
      if (status === 'running') return;
      set({ status: 'running' });
      addEvent('info', 'OPERATOR_CMD', 'Desludging vacuum cycle initiated.');
    },

    pauseSimulation: () => {
      const { status, addEvent } = get();
      if (status !== 'running') return;
      set({ status: 'paused' });
      addEvent('warning', 'OPERATOR_CMD', 'Simulation paused by operator.');
    },

    resumeSimulation: () => {
      const { status, addEvent } = get();
      if (status !== 'paused') return;
      set({ status: 'running' });
      addEvent('info', 'OPERATOR_CMD', 'Simulation resumed.');
    },

    resetSimulation: () => {
      const { parameters, addEvent } = get();
      const freshTelemetry = createInitialTelemetry(parameters);
      const freshHistory: TelemetryPoint[] = [
        {
          time: '00:00',
          timestamp: 0,
          flowRate: 0,
          vacuum: 0,
          power: 0,
          h2s: 2.0,
          ch4: 0.15,
          sludgeLevel: parameters.initialSludgeDepthM,
          vibration: 0.2
        }
      ];

      set({
        status: 'idle',
        telemetry: freshTelemetry,
        telemetryHistory: freshHistory,
        alarmsActive: 0
      });
      addEvent('info', 'SYSTEM_RESET', 'Simulation telemetry and counters reset to baseline.');
    },

    stepSimulation: (stepSeconds = 1.0) => {
      get().tickSimulation(stepSeconds);
    },

    setSimSpeed: (speed: number) => {
      set({ simSpeed: speed });
    },

    setActiveView: (view: NavView) => {
      set({ activeView: view });
    },

    updateParameter: (key, value) => {
      set((state) => ({
        parameters: {
          ...state.parameters,
          [key]: value
        }
      }));
    },

    batchUpdateParameters: (partial) => {
      set((state) => ({
        parameters: {
          ...state.parameters,
          ...partial
        }
      }));
    },

    tickSimulation: (deltaSeconds: number) => {
      const state = get();
      if (state.status !== 'running') return;

      const effectiveDt = deltaSeconds * state.simSpeed;
      const result = stepPhysicsSimulation(state.parameters, state.telemetry, effectiveDt);

      // New point for chart history (sampled ~ every 0.8s)
      const shouldSample =
        state.telemetryHistory.length === 0 ||
        result.nextTelemetry.elapsedTimeSeconds -
          state.telemetryHistory[state.telemetryHistory.length - 1].timestamp >= 0.75;

      let nextHistory = state.telemetryHistory;
      if (shouldSample) {
        const mm = Math.floor(result.nextTelemetry.elapsedTimeSeconds / 60)
          .toString()
          .padStart(2, '0');
        const ss = Math.floor(result.nextTelemetry.elapsedTimeSeconds % 60)
          .toString()
          .padStart(2, '0');

        const newPoint: TelemetryPoint = {
          time: `${mm}:${ss}`,
          timestamp: result.nextTelemetry.elapsedTimeSeconds,
          flowRate: parseFloat(result.nextTelemetry.extractionRateM3H.toFixed(2)),
          vacuum: Math.abs(parseFloat(result.nextTelemetry.suctionPressureKpa.toFixed(1))),
          power: parseFloat(result.nextTelemetry.motorPowerKw.toFixed(2)),
          h2s: parseFloat(result.nextTelemetry.h2sConcentrationPpm.toFixed(1)),
          ch4: parseFloat(result.nextTelemetry.ch4ConcentrationPct.toFixed(2)),
          sludgeLevel: parseFloat(result.nextTelemetry.sludgeLevelM.toFixed(2)),
          vibration: parseFloat(result.nextTelemetry.vibrationRmsMmS.toFixed(2))
        };

        // Ring buffer max 45 points for fast chart animations
        nextHistory = [...state.telemetryHistory.slice(-44), newPoint];
      }

      const nextEvents = result.newEvents.length > 0
        ? [...result.newEvents, ...state.eventLog].slice(0, 100)
        : state.eventLog;

      const nextStatus: SimulationStatus = result.isCompleted
        ? 'complete'
        : result.hasAlarm
        ? 'alarm'
        : state.status;

      const alarmCount = nextEvents.filter(
        (e) => (e.level === 'critical' || e.level === 'warning') && !e.acknowledged
      ).length;

      set({
        status: nextStatus,
        telemetry: result.nextTelemetry,
        telemetryHistory: nextHistory,
        eventLog: nextEvents,
        alarmsActive: alarmCount
      });
    },

    addEvent: (level, source, message) => {
      const now = new Date();
      const newEvt: EventLogItem = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: now.toLocaleTimeString(),
        timeSec: Math.round(get().telemetry.elapsedTimeSeconds),
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

    setSelectedComponent: (id: string | null) => {
      set({ selectedComponentId: id });
    }
  };
});
