export type SimulationStatus = 'idle' | 'running' | 'paused' | 'alarm' | 'complete';

export type NavView = 'overview' | 'simulation3d' | 'sensors' | 'parameters' | 'reports';

export type CameraPreset = 'iso' | 'cutaway' | 'crawler' | 'pump' | 'top';

export interface SimulationParameters {
  pumpRpm: number;                 // 0 - 3600 RPM
  targetVacuumKpa: number;         // -90 to 0 kPa
  hoseDiameterMm: number;          // 50, 75, 100, 150 mm
  hoseLengthM: number;             // 10 - 100 m
  slurryViscosityCp: number;       // 10 - 3000 cP
  slurryDensityKgM3: number;       // 1000 - 1600 kg/m3
  containmentVolumeLiters: number; // Total vault capacity (L)
  initialSludgeDepthM: number;     // 0.5 - 3.5 m
  waterJetPressureBar: number;     // 0 - 250 bar
  waterJetEnabled: boolean;
  ambientTempC: number;            // -20 to 50 C
  cutterHeadSpeedRpm: number;      // 0 - 600 RPM
  cutterHeadEnabled: boolean;
  pipeRoughnessMm: number;         // 0.045 mm (standard steel/PVC)
}

export interface TelemetryState {
  elapsedTimeSeconds: number;
  volumeExtractedLiters: number;
  volumeRemainingLiters: number;
  sludgeLevelM: number;
  extractionRateM3H: number;
  suctionPressureKpa: number;
  dischargePressureBar: number;
  cavitationIndex: number;         // 0.0 - 1.0 (>0.60 warning, >0.80 critical)
  motorPowerKw: number;
  motorCurrentAmps: number;
  slurryTemperatureC: number;
  h2sConcentrationPpm: number;     // H2S safety threshold: >10 ppm warn, >20 ppm evac
  ch4ConcentrationPct: number;     // CH4 explosive lower limit: >1.0% warn, >2.5% crit
  coConcentrationPpm: number;
  vibrationRmsMmS: number;         // ISO 10816 vibration severity
  reynoldsNumber: number;
  headLossM: number;
  systemEfficiencyPct: number;
  estimatedCompletionMinutes: number;
}

export interface TelemetryPoint {
  time: string;
  timestamp: number;
  flowRate: number;
  vacuum: number;
  power: number;
  h2s: number;
  ch4: number;
  sludgeLevel: number;
  vibration: number;
}

export type EventLogLevel = 'info' | 'warning' | 'critical' | 'success';

export interface EventLogItem {
  id: string;
  timestamp: string;
  timeSec: number;
  level: EventLogLevel;
  source: string;
  message: string;
  acknowledged?: boolean;
}

export interface DisplayOptions {
  wireframe: boolean;
  cutaway: boolean;
  showAnnotations: boolean;
  showParticles: boolean;
  godRays: boolean;
  soundEnabled: boolean;
}

export interface ComponentInspectionData {
  id: string;
  name: string;
  type: string;
  status: 'nominal' | 'warning' | 'alert' | 'offline';
  temperatureC: number;
  pressureBar: number;
  vibrationMmS: number;
  description: string;
  specifications: Record<string, string>;
}
