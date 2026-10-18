/**
 * Deterministic Simulation Engine Type Definitions for Desludge Digital Twin
 * 
 * Strict Physical Units:
 * - Volumes: Litres (L)
 * - Flow Rates: Litres per minute (L/min) and cubic metres per hour (m³/h)
 * - Pressures: Kilopascals (kPa)
 * - Power: Kilowatts (kW)
 * - Energy: Kilowatt-hours (kWh)
 * - Time: Seconds (s)
 * - Viscosity: Centipoise (cP)
 * - Density: Kilograms per cubic metre (kg/m³)
 */

export type OperatingState =
  | 'IDLE'
  | 'DEPLOY'
  | 'PRIME'
  | 'EXTRACT'
  | 'DISCHARGE'
  | 'COMPLETE'
  | 'FAULT';

export type SludgeConsistency = 'liquid' | 'slurry' | 'viscous' | 'thick_crust';

export interface EngineParameters {
  // Pump & Machine Config
  pumpRatedFlowLpm: number;        // e.g. 500 L/min (~30 m³/h)
  pumpMaxRpm: number;              // e.g. 3000 RPM
  pumpRpm: number;                 // Operator setpoint (0 - 3000 RPM)
  pumpEfficiency: number;          // 0.0 - 1.0 (default 0.75)
  motorEfficiency: number;         // 0.0 - 1.0 (default 0.88)
  
  // Umbilical Hose Conduit
  hoseDiameterMm: number;          // 50, 75, 100, 150 mm
  hoseLengthM: number;             // 10 - 100 m
  pipeRoughnessMm: number;         // 0.045 mm (standard steel/PVC)
  
  // Rheology & Material
  sludgeConsistency: SludgeConsistency;
  sludgeViscosityCp: number;       // 10 - 3000 cP
  sludgeDensityKgM3: number;       // 1000 - 1600 kg/m³
  
  // Tank Capacities & Limits
  sourceTankCapacityL: number;     // e.g. 4200 L
  initialSourceVolumeL: number;    // e.g. 3800 L
  collectionTankCapacityL: number; // e.g. 2400 L on-chassis tank
  receiverTankCapacityL: number;   // e.g. 10000 L disposal tanker
  targetExtractionVolumeL: number; // Target for current batch (e.g. 2400 L)
  
  // Auxiliary Hydro-Jetting & Cutter
  waterJettingEnabled: boolean;
  waterJetPressureBar: number;     // 0 - 250 bar
  cutterHeadEnabled: boolean;
  cutterHeadSpeedRpm: number;      // 0 - 600 RPM
  dischargeRateLpm: number;        // Transfer rate during discharge (e.g. 750 L/min)
}

export interface AlarmLimits {
  lowSourceLevelL: number;         // Trigger alarm when source has <= 150 L
  collectionTankFullPct: number;   // Trigger alarm when collection tank >= 95%
  maxVacuumKpa: number;            // Excessive vacuum threshold (e.g. 84.0 kPa)
  maxMotorPowerKw: number;         // Motor overload threshold (e.g. 14.5 kW)
}

export interface ActiveAlarms {
  lowSourceLevel: boolean;
  collectionTankFull: boolean;
  excessiveVacuum: boolean;
  motorOverload: boolean;
  emergencyStopActive: boolean;
}

export interface SafetyInterlocks {
  isDeployed: boolean;             // True only when stabilizers & boom fully deployed
  isPrimed: boolean;               // True only when prime sequence completed
  preventExtractNotDeployed: boolean;
  preventExtractNotPrimed: boolean;
  preventExtractTankFull: boolean;
  preventExtractSourceEmpty: boolean;
  emergencyStopLatched: boolean;
}

export interface MaterialBalanceState {
  sourceVolumeL: number;           // Material in demonstration septic vault
  sourceLevelM: number;            // Sludge depth (m) in source tank
  collectionVolumeL: number;       // Material inside mobile collection tank
  collectionFillPct: number;       // 0 - 100%
  receiverVolumeL: number;         // Material inside external disposal receiver
  totalInitialVolumeL: number;     // Invariant: source + collection + receiver
  massBalanceDiscrepancyL: number; // Invariant check: should be 0.0 ± 1e-4 L
  cycleExtractedL: number;         // Cumulative litres extracted this batch
  cycleDischargedL: number;        // Cumulative litres discharged this batch
}

export interface MachineKinematicsState {
  deployProgress: number;          // 0.0 (stowed) to 1.0 (fully deployed)
  stabilizerExtension: number;     // 0.0 (retracted) to 1.0 (ground contact)
  boomSlewAngleRad: number;        // Turret horizontal angle
  boomElevationRad: number;        // Main boom vertical lift angle
  jibFlexAngleRad: number;         // Jib knuckle articulation angle
  hoseReelAngleRad: number;        // Accumulated reel rotation
  hoseReelRpm: number;             // Instantaneous reel RPM
  pumpShaftAngleRad: number;       // Accumulated pump shaft rotation
  pumpShaftRpm: number;            // Instantaneous pump shaft RPM
  materialFlowVelocityMs: number;  // Fluid velocity in suction hose (m/s)
  isMaterialFlowing: boolean;      // True when active transfer is occurring
}

export interface ProcessTelemetryState {
  simulatedTimeSec: number;        // Cumulative simulated operation time
  operatingState: OperatingState;
  
  // Flow and Pressure (Simulated)
  flowRateLpm: number;             // Litres per minute
  flowRateM3H: number;             // m³/h (flowRateLpm * 0.06)
  suctionPressureKpa: number;      // Inlet vacuum (-kPa)
  dischargePressureKpa: number;    // Outlet head pressure (+kPa)
  cavitationIndex: number;         // 0.0 (none) - 1.0 (severe)
  
  // Power & Energy (Simulated)
  motorPowerKw: number;            // Instantaneous electrical power
  cumulativeEnergyKwh: number;     // Integrated electrical energy
  specificEnergyKwhM3: number;     // Energy per m³ evacuated
  
  // Time Estimates
  estimatedRemainingTimeSec: number;
}

export interface SimulationEvent {
  id: string;
  simTimeSec: number;              // Precise simulation timestamp (s)
  formattedTime: string;           // MM:SS representation
  state: OperatingState;
  level: 'info' | 'warning' | 'critical' | 'success';
  source: string;
  message: string;
}

export interface EngineState {
  // Core Sequencing & Clocks
  operatingState: OperatingState;
  previousState: OperatingState;
  simulatedTimeSec: number;
  fixedTimestepSec: number;        // Fixed step dt (e.g. 0.05s)
  isPaused: boolean;
  simSpeedMultiplier: number;      // 0.5, 1.0, 2.0, 5.0
  
  // Configuration
  parameters: EngineParameters;
  alarmLimits: AlarmLimits;
  
  // Runtime Sub-Systems
  materialBalance: MaterialBalanceState;
  kinematics: MachineKinematicsState;
  telemetry: ProcessTelemetryState;
  alarms: ActiveAlarms;
  interlocks: SafetyInterlocks;
  
  // Sequencing internal timers
  deployTimerSec: number;
  primeTimerSec: number;
  
  // Audit Trail
  events: SimulationEvent[];
  recentEvents: SimulationEvent[];
}
