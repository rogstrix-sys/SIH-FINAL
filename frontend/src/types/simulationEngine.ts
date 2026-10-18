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
  | 'TRAVEL'
  | 'POSITION'
  | 'STABILIZE'
  | 'DEPLOY'
  | 'DEPLOYMENT'
  | 'DEPLOY_HOSE'
  | 'PRIME'
  | 'PRIMING'
  | 'EXTRACT'
  | 'EXTRACTION'
  | 'SETTLE'
  | 'COMPACT'
  | 'SECURE'
  | 'TRANSPORT_READY'
  | 'DISCHARGE'
  | 'COMPLETE'
  | 'PAUSED'
  | 'FAULT';

export type WorkflowStageId =
  | 'TRAVEL'
  | 'POSITION'
  | 'STABILIZE'
  | 'DEPLOY_HOSE'
  | 'PRIME'
  | 'EXTRACT'
  | 'SETTLE'
  | 'COMPACT'
  | 'SECURE'
  | 'TRANSPORT_READY'
  | 'DISCHARGE'
  | 'COMPLETE';

export interface WorkflowStageDefinition {
  id: WorkflowStageId;
  order: number;
  label: string;
  name: string;
  description: string;
  requiredConditions: string[];
}

export const WORKFLOW_STAGES: readonly WorkflowStageDefinition[] = [
  {
    id: 'TRAVEL',
    order: 1,
    label: '1. Travel',
    name: 'Vehicle Transit to Site',
    description: 'Tracked vehicle drives from staging depot to sanitation worksite coordinates.',
    requiredConditions: ['Stabilizers fully retracted (<0.05)', 'Boom & hose stowed', 'Piston retention pin locked', 'E-Stop disarmed']
  },
  {
    id: 'POSITION',
    order: 2,
    label: '2. Position',
    name: 'Stationary Site Positioning',
    description: 'Vehicle halts at worksite, parking brakes applied, tracks isolated.',
    requiredConditions: ['Vehicle stationary (speed = 0 m/s)', 'Piston locked in transport position']
  },
  {
    id: 'STABILIZE',
    order: 3,
    label: '3. Stabilize',
    name: 'Hydraulic Outrigger Deployment',
    description: 'Deploy 4 telescoping outriggers to level chassis and relieve crawler ground load.',
    requiredConditions: ['Vehicle stationary', 'Level ground or slope <= 25°']
  },
  {
    id: 'DEPLOY_HOSE',
    order: 4,
    label: '4. Deploy Hose',
    name: 'Boom & Umbilical Articulation',
    description: 'Slew and elevate hydraulic crane boom, unreel Ø100mm hose, position suction nozzle into vault.',
    requiredConditions: ['Stabilizers grounded (1.0 extension)', 'Travel tracks locked']
  },
  {
    id: 'PRIME',
    order: 5,
    label: '5. Prime',
    name: 'Vacuum Core Chamber Priming',
    description: 'Spin rotary lobe pump at low speed, establish suction seal, verify vacuum integrity.',
    requiredConditions: ['Boom and hose deployed', 'Suction line submerged in septic vault']
  },
  {
    id: 'EXTRACT',
    order: 6,
    label: '6. Extract',
    name: 'Slurry Evacuation & Transfer',
    description: 'Positive displacement vacuum transfer of viscous septage from vault to mobile collection tank.',
    requiredConditions: ['Pump primed', 'Collection tank < 95% capacity', 'Source vault > 10 L', 'Stabilizers engaged']
  },
  {
    id: 'SETTLE',
    order: 7,
    label: '7. Settle',
    name: 'Slurry Settling & Phase Dwell',
    description: 'Halt extraction pump; allow entrapped gases to vent and colloidal solids to consolidate.',
    requiredConditions: ['Pump stopped', 'Tank atmospheric PVRV vent open']
  },
  {
    id: 'COMPACT',
    order: 8,
    label: '8. Compact',
    name: 'Hydraulic Platen Dewatering',
    description: 'Lower guided vertical cylinder; press porous platen into sludge bed; express liquid filtrate up to 180 bar.',
    requiredConditions: ['Vehicle stationary', 'Stabilizers engaged', 'Pump stopped', 'Relief valve armed']
  },
  {
    id: 'SECURE',
    order: 9,
    label: '9. Secure',
    name: 'Platen Retraction & Retention Pin Latching',
    description: 'Retract porous platen to top home position (0 mm); engage dual mechanical transport lock pins.',
    requiredConditions: ['Platen at top home position (0 mm)', 'Stow crane boom and reeled hose']
  },
  {
    id: 'TRANSPORT_READY',
    order: 10,
    label: '10. Transport Ready',
    name: 'Transport Envelope Clearance',
    description: 'Automated verification of transport invariants: outriggers up, platen pin locked, boom stowed.',
    requiredConditions: ['Retention pins engaged', 'Stabilizers retracted (<0.05)', 'Boom stowed', 'No active faults']
  },
  {
    id: 'DISCHARGE',
    order: 11,
    label: '11. Discharge',
    name: 'Material Transfer to Receiving Tanker',
    description: 'Open 4-inch discharge gate valve and transfer dewatered material to disposal transport tanker.',
    requiredConditions: ['Receiving destination connected', 'Receiver capacity available', 'Discharge valve open']
  },
  {
    id: 'COMPLETE',
    order: 12,
    label: '12. Complete',
    name: 'Mission Cycle Complete',
    description: 'Desludging and dewatering cycle completed; generate engineering report and metrics.',
    requiredConditions: ['Collection vessel evacuated or batch target fulfilled']
  }
] as const;

export type SludgeConsistency = 'liquid' | 'slurry' | 'viscous' | 'thick_crust';

export interface EngineParameters {
  // Pump & Machine Config
  pumpRatedFlowLpm: number;        // e.g. 500 L/min (~30 m³/h)
  pumpMaxRpm: number;              // e.g. 3000 RPM
  pumpRpm: number;                 // Operator setpoint (0 - 3000 RPM)
  pumpEfficiency: number;          // 0.0 - 1.0 (default 0.75)
  motorEfficiency: number;         // 0.0 - 1.0 (default 0.88)
  
  // Umbilical Hose Conduit & Elevation
  hoseDiameterMm: number;          // 50, 75, 100, 150 mm
  hoseLengthM: number;             // 10 - 100 m
  pipeRoughnessMm: number;         // 0.045 mm (standard steel/PVC)
  elevationDifferenceM: number;    // Elevation difference between source and collection equipment (m)
  
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
  receiverTankFull: boolean;
  excessiveVacuum: boolean;
  motorOverload: boolean;
  emergencyStopActive: boolean;
  pistonExcessivePressure: boolean;
  pistonTravelLimitFault: boolean;
  invalidVehicleMovement: boolean;
  unsecuredTransportConfig: boolean;
  hydraulicSubsystemFault: boolean;
}

export interface SafetyInterlocks {
  isDeployed: boolean;             // True only when stabilizers & boom fully deployed
  isPrimed: boolean;               // True only when prime sequence completed
  isStabilized: boolean;           // True when outriggers grounded
  isHoseDeployed: boolean;         // True when boom & hose positioned
  isTransportSecured: boolean;     // True when platen locked in home retention pins
  isTransportReady: boolean;       // True when all travel envelope conditions verified
  preventExtractNotDeployed: boolean;
  preventExtractNotPrimed: boolean;
  preventExtractTankFull: boolean;
  preventExtractSourceEmpty: boolean;
  preventDischargeNoDestination: boolean; // Interlock: blocks discharge if receiver full or missing
  preventTravelNotTransportReady: boolean;
  preventCompactionNotStationary: boolean;
  preventCompactionTransferActive: boolean;
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
  staticLiftKpa: number;           // Static elevation lift pressure (kPa)
  frictionHeadKpa: number;         // Dynamic Darcy-Weisbach friction loss (kPa)
  cavitationIndex: number;         // 0.0 (none) - 1.0 (severe)
  
  // Power & Energy (Simulated)
  motorPowerKw: number;            // Instantaneous electrical power
  cumulativeEnergyKwh: number;     // Integrated electrical energy
  specificEnergyKwhM3: number;     // Energy per m³ evacuated
  
  // Time Estimates
  estimatedRemainingTimeSec: number;

  // Engineering assumptions & limitations reference
  hydraulicModelLimitations?: readonly string[];
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
  settleTimerSec: number;
  settleDurationSec: number;
  
  // Audit Trail
  events: SimulationEvent[];
  recentEvents: SimulationEvent[];
}
