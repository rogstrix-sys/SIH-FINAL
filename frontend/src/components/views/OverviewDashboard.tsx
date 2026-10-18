import React, { useState } from 'react';
import {
  Droplets,
  Activity,
  Gauge,
  Zap,
  ShieldAlert,
  Flame,
  Eye,
  Sliders,
  Maximize2,
  Scale,
  Cpu,
  Truck,
  Play,
  Pause,
  RotateCcw,
  OctagonAlert,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Clock,
  ArrowRightCircle,
  RefreshCw,
  FileSpreadsheet,
  Mountain,
  Compass,
  Ruler,
  TableProperties,
  Sparkles,
  BatteryCharging,
  Info,
  Filter,
  Lock,
  Unlock,
  Anchor,
  ChevronRight,
  Check,
  X,
  ShieldCheck,
  Radio,
  ArrowDownToLine,
  ArrowUpToLine,
  Square
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend
} from 'recharts';
import { useSimulationStore, INSPECTABLE_COMPONENTS } from '../../store/useSimulationStore';
import { DigitalTwinCanvas } from '../../scene/DigitalTwinCanvas';
import { Card } from '../ui/Card';
import { KpiCard } from '../ui/KpiCard';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { CameraPreset } from '../../types/digitalTwin';
import { TerrainScenarioId } from '../../types/terrainScenarios';
import { WORKFLOW_STAGES } from '../../types/simulationEngine';
import { TERRAIN_SCENARIOS, PRELIMINARY_ESTIMATE_DISCLAIMER } from '../../simulation/terrainFeasibilityModel';
import { HYDRAULIC_MODEL_LIMITATIONS } from '../../simulation/deterministicEngine';
import { TerrainComparisonPanel } from '../TerrainComparisonPanel';
import { formatDuration } from '../../utils/units';
import { downloadTelemetryCsv, downloadEventsCsv } from '../../utils/csvExport';

export const OverviewDashboard: React.FC = () => {
  // Store state
  const status = useSimulationStore((s) => s.status);
  const operatingState = useSimulationStore((s) => s.operatingState);
  const engine = useSimulationStore((s) => s.engine);
  const telemetry = useSimulationStore((s) => s.telemetry);
  const parameters = useSimulationStore((s) => s.parameters);
  const engineParams = useSimulationStore((s) => s.engine.parameters);
  const materialBalance = useSimulationStore((s) => s.materialBalance);
  const kinematics = useSimulationStore((s) => s.kinematics);
  const alarms = useSimulationStore((s) => s.alarms);
  const interlocks = useSimulationStore((s) => s.interlocks);
  const history = useSimulationStore((s) => s.telemetryHistory);
  const eventLog = useSimulationStore((s) => s.eventLog);
  const simSpeed = useSimulationStore((s) => s.simSpeed);

  // Terrain & Feasibility state
  const selectedScenario = useSimulationStore((s) => s.selectedScenario);
  const setTerrainScenario = useSimulationStore((s) => s.setTerrainScenario);
  const terrainParams = useSimulationStore((s) => s.terrainParams);
  const updateTerrainParams = useSimulationStore((s) => s.updateTerrainParams);
  const stabilityThresholds = useSimulationStore((s) => s.stabilityThresholds);
  const updateStabilityThresholds = useSimulationStore((s) => s.updateStabilityThresholds);
  const feasibility = useSimulationStore((s) => s.feasibility);

  // Store actions
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const pauseSimulation = useSimulationStore((s) => s.pauseSimulation);
  const resumeSimulation = useSimulationStore((s) => s.resumeSimulation);
  const resetSimulation = useSimulationStore((s) => s.resetSimulation);
  const triggerEmergencyStop = useSimulationStore((s) => s.triggerEmergencyStop);
  const triggerResolveFault = useSimulationStore((s) => s.triggerResolveFault);
  const triggerDeploy = useSimulationStore((s) => s.triggerDeploy);
  const triggerPrime = useSimulationStore((s) => s.triggerPrime);
  const triggerExtract = useSimulationStore((s) => s.triggerExtract);
  const triggerDischarge = useSimulationStore((s) => s.triggerDischarge);
  const setSimSpeed = useSimulationStore((s) => s.setSimSpeed);
  const updateParameter = useSimulationStore((s) => s.updateParameter);
  const updateEngineParameter = useSimulationStore((s) => s.updateEngineParameter);
  const setActiveView = useSimulationStore((s) => s.setActiveView);
  const startGuidedDemo = useSimulationStore((s) => s.startGuidedDemo);

  // Mobility & Compaction state & actions
  const mobilityTelemetry = useSimulationStore((s) => s.mobilityTelemetry);
  const mobilityInputs = useSimulationStore((s) => s.mobilityInputs);
  const compactionTelemetry = useSimulationStore((s) => s.compactionTelemetry);
  const compactionParams = useSimulationStore((s) => s.compactionParams);
  const alarmsActive = useSimulationStore((s) => s.alarmsActive);

  const triggerTravel = useSimulationStore((s) => s.triggerTravel);
  const triggerPosition = useSimulationStore((s) => s.triggerPosition);
  const triggerStabilize = useSimulationStore((s) => s.triggerStabilize);
  const triggerDeployHose = useSimulationStore((s) => s.triggerDeployHose);
  const triggerSettle = useSimulationStore((s) => s.triggerSettle);
  const triggerCompact = useSimulationStore((s) => s.triggerCompact);
  const triggerSecure = useSimulationStore((s) => s.triggerSecure);
  const triggerTransportReady = useSimulationStore((s) => s.triggerTransportReady);
  const retractCompactionPiston = useSimulationStore((s) => s.retractCompactionPiston);
  const stopVehicle = useSimulationStore((s) => s.stopVehicle);
  const setWorkflowStage = useSimulationStore((s) => s.setWorkflowStage);

  // Viewport / Inspection
  const cameraPreset = useSimulationStore((s) => s.cameraPreset);
  const setCameraPreset = useSimulationStore((s) => s.setCameraPreset);
  const displayOptions = useSimulationStore((s) => s.displayOptions);
  const toggleDisplayOption = useSimulationStore((s) => s.toggleDisplayOption);
  const setMobilityMode = useSimulationStore((s) => s.setMobilityMode);
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);

  // Local UI State
  const [activeChartTab, setActiveChartTab] = useState<'flowRate' | 'tankBalance' | 'powerEnergy' | 'eventTimeline'>('flowRate');
  const [paramPanelTab, setParamPanelTab] = useState<'machine' | 'terrain'>('machine');
  const [showComparisonPanel, setShowComparisonPanel] = useState(false);
  const [showModelLimitations, setShowModelLimitations] = useState(false);

  const selectedData = selectedComponentId ? INSPECTABLE_COMPONENTS[selectedComponentId] : null;

  // Camera presets list
  const presets: { id: CameraPreset; label: string }[] = [
    { id: 'reset', label: 'Reset' },
    { id: 'iso', label: 'ISO' },
    { id: 'top', label: 'Top' },
    { id: 'side', label: 'Side' },
    { id: 'tank', label: 'Tank' },
    { id: 'boom', label: 'Boom' },
    { id: 'nozzle', label: 'Nozzle' },
    { id: 'cutaway', label: 'Cutaway' }
  ];

  // Motor load calculation (%)
  const motorLoadPct = Math.min(
    100,
    Math.max(0, (engine.telemetry.motorPowerKw / 15.0) * 100)
  );

  // Time remaining string
  const timeRemainingStr =
    engine.telemetry.estimatedRemainingTimeSec > 0
      ? formatDuration(engine.telemetry.estimatedRemainingTimeSec)
      : materialBalance.sourceVolumeL <= 10 || materialBalance.collectionFillPct >= 100
      ? '00:00'
      : '--:--';

  // Disabled states and explanations for operating controls
  const isFault = operatingState === 'FAULT';
  const isRunning = status === 'running';
  const isPaused = status === 'paused';

  const startDisabled = isRunning || isFault;
  const startReason = isFault
    ? 'Cannot start: Acknowledge and clear active fault / E-STOP first.'
    : isRunning
    ? 'Simulation is already running.'
    : 'Initiate automated desludging sequence (DEPLOY -> PRIME -> EXTRACT -> DISCHARGE).';

  const pauseDisabled = !isRunning || isFault;
  const pauseReason = !isRunning
    ? 'Simulation is not running.'
    : 'Freeze simulation time, kinematics, and mass transfer.';

  const resumeDisabled = !isPaused || isFault;
  const resumeReason = !isPaused
    ? 'Simulation is not currently paused.'
    : 'Resume simulation clock and active actuators.';

  // 1. Travel
  const travelDisabled =
    isFault ||
    (!compactionTelemetry.isTransportLocked && compactionTelemetry.strokeMm > 5) ||
    kinematics.deployProgress > 0.05;
  const travelReason = isFault
    ? 'Fault active: Clear fault first.'
    : !compactionTelemetry.isTransportLocked && compactionTelemetry.strokeMm > 5
    ? 'Interlock blocked: Compaction platen must be in locked transport position (0 mm) before travel.'
    : kinematics.deployProgress > 0.05
    ? 'Interlock blocked: Outriggers and boom crane must be stowed (<0.05) before travel.'
    : 'Drive tracked vehicle across terrain to worksite.';

  // 2. Stop
  const stopDisabled = !mobilityTelemetry.isMoving && status !== 'running';
  const stopReason = !mobilityTelemetry.isMoving && status !== 'running'
    ? 'Vehicle and simulation are already stopped.'
    : 'Halt crawler track motion, lock brakes, and pause transit.';

  // 3. Deploy
  const deployDisabled = isFault || (interlocks.isDeployed && kinematics.deployProgress >= 0.95);
  const deployReason = isFault
    ? 'Fault active: Clear fault first.'
    : interlocks.isDeployed && kinematics.deployProgress >= 0.95
    ? 'Machine stabilizers and boom are already fully deployed.'
    : 'Extend 4 hydraulic outriggers and articulate suction boom over septic vault.';

  // 4. Prime
  const primeDisabled =
    isFault ||
    (!interlocks.isDeployed && kinematics.deployProgress < 0.95) ||
    operatingState === 'PRIME' ||
    operatingState === 'PRIMING' ||
    operatingState === 'EXTRACT' ||
    operatingState === 'EXTRACTION' ||
    operatingState === 'DISCHARGE';
  const primeReason = isFault
    ? 'Fault active: Clear fault first.'
    : !interlocks.isDeployed && kinematics.deployProgress < 0.95
    ? 'Interlock blocked: Stabilizers and hose must be deployed first.'
    : operatingState === 'PRIME' || operatingState === 'PRIMING'
    ? 'Priming sequence currently running.'
    : operatingState === 'EXTRACT' || operatingState === 'EXTRACTION' || operatingState === 'DISCHARGE'
    ? `Machine already past priming (${operatingState}).`
    : 'Prime positive displacement vacuum chamber and flood suction lines.';

  // 5. Extract
  const extractDisabled =
    isFault ||
    !interlocks.isPrimed ||
    materialBalance.collectionFillPct >= 100 ||
    materialBalance.sourceVolumeL <= 10 ||
    operatingState === 'EXTRACT' ||
    operatingState === 'EXTRACTION';
  const extractReason = isFault
    ? 'Fault active: Clear fault first.'
    : !interlocks.isPrimed
    ? 'Interlock blocked: Machine must be deployed and primed before extraction.'
    : materialBalance.collectionFillPct >= 100
    ? 'Collection tank is full (100% capacity reached).'
    : materialBalance.sourceVolumeL <= 10
    ? 'Source septic vault is evacuated (empty).'
    : operatingState === 'EXTRACT' || operatingState === 'EXTRACTION'
    ? 'Extraction is currently active.'
    : 'Engage vacuum pump and draw sludge through suction umbilical.';

  // 6. Settle
  const settleDisabled =
    isFault ||
    operatingState === 'SETTLE' ||
    (operatingState !== 'EXTRACT' && operatingState !== 'EXTRACTION' && materialBalance.collectionVolumeL < 10);
  const settleReason = isFault
    ? 'Fault active: Clear fault first.'
    : operatingState === 'SETTLE'
    ? 'Settling phase currently active.'
    : 'Halt vacuum pump; allow slurry phase separation and degassing.';

  // 7. Compact
  const compactDisabled =
    isFault ||
    mobilityTelemetry.isMoving ||
    !interlocks.isStabilized ||
    operatingState === 'COMPACT' ||
    materialBalance.collectionVolumeL < 10;
  const compactReason = isFault
    ? 'Fault active: Clear fault first.'
    : mobilityTelemetry.isMoving
    ? 'Interlock blocked: Vehicle must be stationary.'
    : !interlocks.isStabilized
    ? 'Interlock blocked: Hydraulic outriggers must be deployed.'
    : operatingState === 'COMPACT'
    ? 'Compaction stroke currently active.'
    : materialBalance.collectionVolumeL < 10
    ? 'No sludge in collection tank to dewater.'
    : 'Lower hydraulic cylinder; press porous platen into sludge bed up to 180 bar.';

  // 8. Retract
  const retractDisabled =
    isFault || compactionTelemetry.strokeMm <= 1 || compactionTelemetry.pistonState === 'RETRACTING';
  const retractReason = isFault
    ? 'Fault active: Clear fault first.'
    : compactionTelemetry.strokeMm <= 1
    ? 'Piston is already fully retracted at top home (0 mm).'
    : compactionTelemetry.pistonState === 'RETRACTING'
    ? 'Piston is currently retracting.'
    : 'Retract compaction platen to top home position (0 mm).';

  // 9. Secure
  const secureDisabled =
    isFault || (compactionTelemetry.isTransportLocked && compactionTelemetry.strokeMm <= 5);
  const secureReason = isFault
    ? 'Fault active: Clear fault first.'
    : compactionTelemetry.isTransportLocked && compactionTelemetry.strokeMm <= 5
    ? 'Piston is already secured with retention pins engaged.'
    : 'Retract platen to 0 mm and engage dual mechanical retention pins for safe transport.';

  // 10. Discharge
  const dischargeDisabled =
    isFault || materialBalance.collectionVolumeL <= 0.5 || operatingState === 'DISCHARGE';
  const dischargeReason = isFault
    ? 'Fault active: Clear fault first.'
    : materialBalance.collectionVolumeL <= 0.5
    ? 'Collection tank has no sludge to discharge (empty).'
    : operatingState === 'DISCHARGE'
    ? 'Discharge transfer is currently active.'
    : 'Evacuate on-board collection tank to external waste disposal tanker.';

  // 11. Reset
  const resetDisabled = false;
  const resetReason = 'Reset simulation state, mass balance, kinematics, charts, and telemetry to initial baseline.';

  // 12. E-Stop
  const eStopDisabled = interlocks.emergencyStopLatched;
  const eStopReason = interlocks.emergencyStopLatched
    ? 'E-STOP already latched. Acknowledge and resolve fault to restore IDLE state.'
    : 'Instantly de-energize all actuators, halt material transfer, and latch emergency stop.';

  // State badge variant
  const stateVariant: Record<string, 'slate' | 'safety' | 'warning' | 'danger' | 'success' | 'cyan'> = {
    IDLE: 'slate',
    TRAVEL: 'warning',
    POSITION: 'slate',
    STABILIZE: 'warning',
    DEPLOY: 'warning',
    DEPLOYMENT: 'warning',
    DEPLOY_HOSE: 'warning',
    PRIME: 'safety',
    PRIMING: 'safety',
    EXTRACT: 'success',
    EXTRACTION: 'success',
    SETTLE: 'cyan',
    COMPACT: 'safety',
    SECURE: 'slate',
    TRANSPORT_READY: 'success',
    DISCHARGE: 'cyan',
    COMPLETE: 'success',
    PAUSED: 'warning',
    FAULT: 'danger'
  };

  // Alarm counts
  const hasActiveAlarms =
    alarms.lowSourceLevel ||
    alarms.collectionTankFull ||
    alarms.excessiveVacuum ||
    alarms.motorOverload ||
    alarms.emergencyStopActive;

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 gap-4 overflow-y-auto select-none">
      {/* 0. Operating Environments Selector Ribbon */}
      <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-safety-500" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Challenging Operating Environments
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
            (Select terrain to update 3D scene & feasibility model)
          </span>
        </div>

        {/* 3 Environment Selectors & Matrix Comparison Button */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {(
            [
              { id: 'level_paved', label: '1. Paved' },
              { id: 'hilly_sloped', label: '2. Hilly (14°)' },
              { id: 'uneven_muddy', label: '3. Muddy' },
              { id: 'narrow_restricted', label: '4. Alley (1.6m)' },
              { id: 'heavy_rain', label: '5. Heavy Rain' },
              { id: 'cold_high_altitude', label: '6. Alpine (-8°C)' }
            ] as const
          ).map((env) => (
            <button
              key={env.id}
              onClick={() => setTerrainScenario(env.id as TerrainScenarioId)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                selectedScenario === env.id
                  ? 'bg-safety-500 text-white border-safety-400 shadow-md shadow-safety-500/20'
                  : 'bg-graphite-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {env.label}
            </button>
          ))}

          <Button
            variant={showComparisonPanel ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowComparisonPanel(!showComparisonPanel)}
            className="text-[11px] py-1 px-2.5 flex items-center gap-1"
          >
            <TableProperties className="w-3.5 h-3.5" />
            {showComparisonPanel ? 'Hide Comparison' : 'Compare Environments'}
          </Button>
        </div>
      </div>

      {/* Comparison Matrix Modal / Drawer when active */}
      {showComparisonPanel && (
        <TerrainComparisonPanel onClose={() => setShowComparisonPanel(false)} />
      )}

      {/* Feasibility & Stability Alert Bar (When warnings or limits violated) */}
      {feasibility.warnings.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-600/60 rounded-xl p-3 shadow-md text-xs font-mono text-amber-300 flex flex-col gap-1.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase flex items-center gap-1.5 text-[11px]">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Preliminary Feasibility Alerts ({feasibility.warnings.length} Active Limit Notices)
            </span>
            <span className="text-[10px] text-amber-400/80 uppercase">
              Status: {feasibility.stabilityStatus}
            </span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
            {feasibility.warnings.map((w, i) => (
              <li key={`warn-${i}`}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 1. Machine Sequence Stepper & Mass Balance Ribbon */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Operating Sequence Stepper */}
        <div className="lg:col-span-7 bg-graphite-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-safety-500" />
              Machine Operating Sequence
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 hidden sm:inline">Δt = 0.05s</span>
              <button
                onClick={startGuidedDemo}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-safety-500/20 hover:bg-safety-500/30 text-safety-400 border border-safety-500/40 text-[10px] font-mono transition"
                title="Launch Guided Demonstration Tour"
              >
                <Sparkles className="w-3 h-3 text-safety-400" />
                <span>Guided Tour</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
            {WORKFLOW_STAGES.map((step, idx) => {
              const isActive =
                operatingState === step.id ||
                (step.id === 'DEPLOY_HOSE' && (operatingState === 'DEPLOY' || operatingState === 'DEPLOYMENT')) ||
                (step.id === 'PRIME' && operatingState === 'PRIMING') ||
                (step.id === 'EXTRACT' && operatingState === 'EXTRACTION');

              const stageOrder = WORKFLOW_STAGES.map((s) => s.id);
              const currentIdx = stageOrder.indexOf(
                operatingState === 'DEPLOY' || operatingState === 'DEPLOYMENT'
                  ? 'DEPLOY_HOSE'
                  : operatingState === 'PRIMING'
                  ? 'PRIME'
                  : operatingState === 'EXTRACTION'
                  ? 'EXTRACT'
                  : (operatingState as any)
              );
              const isPassed = currentIdx > idx;

              return (
                <div
                  key={step.id}
                  onClick={() => setWorkflowStage(step.id)}
                  title={`${step.name}: ${step.description}\nRequired Conditions: ${step.requiredConditions.join(', ')}`}
                  className={`px-1.5 py-1.5 rounded-lg border text-center font-mono text-[10px] cursor-pointer transition-all ${
                    isActive
                      ? 'border-safety-500 bg-safety-500/20 text-safety-400 font-bold shadow-md shadow-safety-500/20 ring-1 ring-safety-500/50'
                      : isPassed
                      ? 'border-emerald-600/50 bg-emerald-950/30 text-emerald-400'
                      : 'border-slate-800 bg-graphite-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate font-semibold">{step.label}</div>
                  <div className="text-[8px] uppercase tracking-tighter opacity-80 mt-0.5">
                    {isActive ? 'ACTIVE' : isPassed ? 'PASSED' : 'STANDBY'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mass Balance Invariant Monitor */}
        <div className="lg:col-span-5 bg-graphite-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider text-[11px]">
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              Mass Balance Invariant
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
              Δ {Math.abs(materialBalance.massBalanceDiscrepancyL).toFixed(4)} L (SIMULATED)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
            <div className="bg-graphite-950/80 border border-slate-800/80 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 uppercase">Septic Vault</div>
              <div className="text-sm font-bold text-amber-300">
                {Math.round(materialBalance.sourceVolumeL)} L
              </div>
              <div className="text-[9px] text-slate-400">
                Depth: {materialBalance.sourceLevelM.toFixed(2)}m
              </div>
            </div>

            <div className="bg-graphite-950/80 border border-slate-800/80 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 uppercase">Machine Tank</div>
              <div className="text-sm font-bold text-cyan-300">
                {Math.round(materialBalance.collectionVolumeL)} L
              </div>
              <div className="text-[9px] text-slate-400">
                {materialBalance.collectionFillPct.toFixed(0)}% full
              </div>
            </div>

            <div className="bg-graphite-950/80 border border-slate-800/80 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 uppercase">Disposal Tanker</div>
              <div className="text-sm font-bold text-emerald-300">
                {Math.round(materialBalance.receiverVolumeL)} L
              </div>
              <div className="text-[9px] text-slate-400">Transferred</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Complete 10 Live Engineering KPI Cards (Connected directly to Deterministic Simulation Engine) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10 gap-2.5">
        {/* KPI 1: Extraction Flow Rate (L/min) */}
        <KpiCard
          label="Extraction Flow"
          value={engine.telemetry.flowRateLpm.toFixed(1)}
          unit="L/min"
          icon={<Activity className="w-4 h-4 text-safety-400" />}
          status={engine.telemetry.flowRateLpm > 0 ? 'nominal' : 'neutral'}
          tooltip={`Simulated Extraction Flow: ${engine.telemetry.flowRateM3H.toFixed(2)} m³/h (${engine.telemetry.flowRateLpm.toFixed(1)} L/min)`}
        />

        {/* KPI 2: Total Volume Extracted (L) */}
        <KpiCard
          label="Extracted Vol"
          value={Math.round(materialBalance.collectionVolumeL)}
          unit="L"
          icon={<Droplets className="w-4 h-4 text-cyan-400" />}
          status="nominal"
          progress={{
            current: materialBalance.collectionVolumeL,
            max: engineParams.collectionTankCapacityL
          }}
          tooltip={`On-board tank: ${Math.round(materialBalance.collectionVolumeL)} / ${engineParams.collectionTankCapacityL} L (Target: ${engineParams.targetExtractionVolumeL} L)`}
        />

        {/* KPI 3: Source Tank Remaining Volume (L) */}
        <KpiCard
          label="Vault Remaining"
          value={Math.round(materialBalance.sourceVolumeL)}
          unit="L"
          icon={<Flame className="w-4 h-4 text-amber-400" />}
          status={materialBalance.sourceVolumeL < 200 ? 'warning' : 'neutral'}
          progress={{
            current: materialBalance.sourceVolumeL,
            max: engineParams.initialSourceVolumeL
          }}
          tooltip={`Initial: ${engineParams.initialSourceVolumeL} L | Depth: ${materialBalance.sourceLevelM.toFixed(2)} m`}
        />

        {/* KPI 4: Collection Tank Fill (%) */}
        <KpiCard
          label="Collection Fill"
          value={materialBalance.collectionFillPct.toFixed(1)}
          unit="%"
          icon={<Layers className="w-4 h-4 text-cyan-400" />}
          status={
            materialBalance.collectionFillPct >= 95
              ? 'alert'
              : materialBalance.collectionFillPct >= 80
              ? 'warning'
              : 'neutral'
          }
          progress={{
            current: materialBalance.collectionFillPct,
            max: 100
          }}
          tooltip={`Collection vessel capacity limit: ${engineParams.collectionTankCapacityL} L | Interlock: 95% full`}
        />

        {/* KPI 5: Estimated Pump Power (kW) */}
        <KpiCard
          label="Pump Power"
          value={engine.telemetry.motorPowerKw.toFixed(2)}
          unit="kW"
          icon={<Zap className="w-4 h-4 text-yellow-400" />}
          status={
            engine.telemetry.motorPowerKw >= 14.0
              ? 'alert'
              : engine.telemetry.motorPowerKw >= 11.0
              ? 'warning'
              : 'nominal'
          }
          progress={{
            current: engine.telemetry.motorPowerKw,
            max: 15.0
          }}
          tooltip={`Simulated hydraulic shaft power: ${engine.telemetry.motorPowerKw.toFixed(2)} kW / 15.0 kW rated`}
        />

        {/* KPI 6: Estimated Energy Consumption (kWh) */}
        <KpiCard
          label="Energy Used"
          value={(engine.telemetry.cumulativeEnergyKwh || 0).toFixed(3)}
          unit="kWh"
          icon={<BatteryCharging className="w-4 h-4 text-emerald-400" />}
          status="nominal"
          tooltip={`Cumulative integrated energy: ∫ P dt = ${(engine.telemetry.cumulativeEnergyKwh || 0).toFixed(3)} kWh`}
        />

        {/* KPI 7: Simulated Inlet Vacuum (kPa) */}
        <KpiCard
          label="Inlet Vacuum"
          value={Math.abs(engine.telemetry.suctionPressureKpa).toFixed(1)}
          unit="kPa"
          icon={<Gauge className="w-4 h-4 text-emerald-400" />}
          status={
            Math.abs(engine.telemetry.suctionPressureKpa) >= 80
              ? 'alert'
              : Math.abs(engine.telemetry.suctionPressureKpa) >= 65
              ? 'warning'
              : 'nominal'
          }
          progress={{
            current: Math.abs(engine.telemetry.suctionPressureKpa),
            max: 90
          }}
          tooltip={`Dynamic vacuum (Darcy-Weisbach + static lift) | Cavitation Risk: ${(engine.telemetry.cavitationIndex * 100).toFixed(0)}%`}
        />

        {/* KPI 8: Motor Load (%) */}
        <KpiCard
          label="Motor Load"
          value={motorLoadPct.toFixed(1)}
          unit="%"
          icon={<Activity className="w-4 h-4 text-orange-400" />}
          status={motorLoadPct >= 90 ? 'alert' : motorLoadPct >= 75 ? 'warning' : 'neutral'}
          progress={{
            current: motorLoadPct,
            max: 100
          }}
          tooltip={`Power: ${engine.telemetry.motorPowerKw.toFixed(1)} kW / 15.0 kW rated (${telemetry.motorCurrentAmps.toFixed(1)} A)`}
        />

        {/* KPI 9: Estimated Time Remaining */}
        <KpiCard
          label="Est. Time Left"
          value={timeRemainingStr}
          unit=""
          icon={<Clock className="w-4 h-4 text-purple-400" />}
          status={engine.telemetry.estimatedRemainingTimeSec > 0 ? 'nominal' : 'neutral'}
          tooltip={`Based on dynamic flow rate (${engine.telemetry.flowRateLpm.toFixed(1)} L/min)`}
        />

        {/* KPI 10: Selected Terrain & Operating State */}
        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium tracking-wide uppercase text-[10px] truncate">TERRAIN / STATE</span>
            <Mountain className="w-3.5 h-3.5 text-safety-400 shrink-0" />
          </div>
          <div className="my-0.5 flex flex-col gap-1">
            <Badge variant={stateVariant[operatingState] || 'slate'} size="sm">
              {operatingState} ({status})
            </Badge>
            <span className="text-[10px] font-mono text-cyan-300 font-semibold truncate" title={selectedScenario}>
              {selectedScenario.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between">
            <span>FIDELITY:</span>
            <span className="text-safety-400 font-bold">SIMULATED</span>
          </div>
        </div>
      </div>

      {/* 3. Machine Operating Controls & Speed Ribbon */}
      <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-safety-500" />
              Machine Operating Controls
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              (Discrete execution interlocks enforced)
            </span>
          </div>

          {/* Simulation Speed Selector */}
          <div className="flex items-center gap-1.5 bg-graphite-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 text-[11px] mr-1">Sim Speed:</span>
            {[0.5, 1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  simSpeed === speed
                    ? 'bg-safety-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-graphite-850'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Operating Control Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Automated Cycle Controls */}
          <Tooltip content={startReason}>
            <Button
              variant="primary"
              size="sm"
              disabled={startDisabled}
              onClick={startSimulation}
              className="flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Start Cycle
            </Button>
          </Tooltip>

          <Tooltip content={pauseReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={pauseDisabled}
              onClick={pauseSimulation}
              className="flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </Button>
          </Tooltip>

          <Tooltip content={resumeReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={resumeDisabled}
              onClick={resumeSimulation}
              className="flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              Resume
            </Button>
          </Tooltip>

          <div className="h-5 w-px bg-slate-800 mx-0.5 hidden sm:block" />

          {/* Dedicated Engineering Operation Buttons */}
          {/* 1. Travel */}
          <Tooltip content={travelReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={travelDisabled}
              onClick={triggerTravel}
              className="flex items-center gap-1 text-xs"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              Travel
            </Button>
          </Tooltip>

          {/* 2. Stop */}
          <Tooltip content={stopReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={stopDisabled}
              onClick={stopVehicle}
              className="flex items-center gap-1 text-xs"
            >
              <Square className="w-3.5 h-3.5 text-rose-400" />
              Stop
            </Button>
          </Tooltip>

          {/* 3. Deploy */}
          <Tooltip content={deployReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={deployDisabled}
              onClick={triggerDeploy}
              className="flex items-center gap-1 text-xs"
            >
              <Anchor className="w-3.5 h-3.5 text-amber-400" />
              Deploy
            </Button>
          </Tooltip>

          {/* 4. Prime */}
          <Tooltip content={primeReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={primeDisabled}
              onClick={triggerPrime}
              className="flex items-center gap-1 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              Prime
            </Button>
          </Tooltip>

          {/* 5. Extract */}
          <Tooltip content={extractReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={extractDisabled}
              onClick={triggerExtract}
              className="flex items-center gap-1 text-xs"
            >
              <Activity className="w-3.5 h-3.5 text-safety-400" />
              Extract
            </Button>
          </Tooltip>

          {/* 6. Settle */}
          <Tooltip content={settleReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={settleDisabled}
              onClick={triggerSettle}
              className="flex items-center gap-1 text-xs"
            >
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Settle
            </Button>
          </Tooltip>

          {/* 7. Compact */}
          <Tooltip content={compactReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={compactDisabled}
              onClick={triggerCompact}
              className="flex items-center gap-1 text-xs"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-safety-400" />
              Compact
            </Button>
          </Tooltip>

          {/* 8. Retract */}
          <Tooltip content={retractReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={retractDisabled}
              onClick={retractCompactionPiston}
              className="flex items-center gap-1 text-xs"
            >
              <ArrowUpToLine className="w-3.5 h-3.5 text-cyan-400" />
              Retract
            </Button>
          </Tooltip>

          {/* 9. Secure */}
          <Tooltip content={secureReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={secureDisabled}
              onClick={triggerSecure}
              className="flex items-center gap-1 text-xs"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Secure
            </Button>
          </Tooltip>

          {/* 10. Discharge */}
          <Tooltip content={dischargeReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={dischargeDisabled}
              onClick={triggerDischarge}
              className="flex items-center gap-1 text-xs"
            >
              <ArrowRightCircle className="w-3.5 h-3.5 text-emerald-400" />
              Discharge
            </Button>
          </Tooltip>

          <div className="h-5 w-px bg-slate-800 mx-0.5 hidden sm:block" />

          {/* 11. Reset */}
          <Tooltip content={resetReason}>
            <Button
              variant="ghost"
              size="sm"
              disabled={resetDisabled}
              onClick={resetSimulation}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </Tooltip>

          {/* 12. E-Stop */}
          <Tooltip content={eStopReason}>
            <Button
              variant="danger"
              size="sm"
              disabled={eStopDisabled}
              onClick={triggerEmergencyStop}
              className="flex items-center gap-1.5 font-bold shadow-md shadow-rose-950/50"
            >
              <OctagonAlert className="w-3.5 h-3.5" />
              EMERGENCY STOP
            </Button>
          </Tooltip>

          {/* Fault Recovery Button (Only visible when FAULT active) */}
          {isFault && (
            <Button
              variant="primary"
              size="sm"
              onClick={triggerResolveFault}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold animate-pulse"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Acknowledge & Clear Fault
            </Button>
          )}
        </div>

        {/* Dynamic Interlock & Status Explanation Bar */}
        <div className="text-[11px] font-mono text-slate-400 bg-graphite-950 px-3 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-safety-400 font-semibold uppercase">Interlock Status:</span>
            <span>
              {isFault
                ? 'CRITICAL FAULT: Emergency stop latched. Clear fault before operating.'
                : operatingState === 'TRAVEL'
                ? 'Machine in TRAVEL: Tracked crawler mobility active across terrain.'
                : operatingState === 'POSITION'
                ? 'Machine in POSITION: Vehicle stationary at worksite, parking brake locked.'
                : operatingState === 'STABILIZE'
                ? 'Machine in STABILIZE: Deploying 4 telescoping hydraulic outriggers.'
                : operatingState === 'DEPLOY' || operatingState === 'DEPLOYMENT' || operatingState === 'DEPLOY_HOSE'
                ? 'Machine in DEPLOY: Articulating crane boom and positioning suction nozzle.'
                : operatingState === 'PRIME' || operatingState === 'PRIMING'
                ? 'Machine in PRIME: Flooding positive displacement vacuum chamber.'
                : operatingState === 'EXTRACT' || operatingState === 'EXTRACTION'
                ? 'Machine in EXTRACT: Continuous vacuum mass transfer into collection vessel.'
                : operatingState === 'SETTLE'
                ? 'Machine in SETTLE: Slurry phase separation and tank gas venting.'
                : operatingState === 'COMPACT'
                ? 'Machine in COMPACT: Guided vertical hydraulic platen pressing sludge bed.'
                : operatingState === 'SECURE'
                ? 'Machine in SECURE: Platen retracted to 0 mm, retention pins engaged.'
                : operatingState === 'TRANSPORT_READY'
                ? 'Machine in TRANSPORT READY: Travel envelope clearance verified safe.'
                : operatingState === 'DISCHARGE'
                ? 'Machine in DISCHARGE: Evacuating collection tank to external disposal tanker.'
                : operatingState === 'COMPLETE'
                ? 'Cycle COMPLETE: Batch target accomplished and mass balance verified.'
                : !interlocks.isDeployed
                ? 'Machine in IDLE: Stabilizers and hose boom stowed.'
                : !interlocks.isPrimed
                ? 'Machine deployed: Vacuum chamber requires priming before extraction.'
                : materialBalance.collectionFillPct >= 100
                ? 'Collection tank full (100% capacity): Ready for dewatering or DISCHARGE.'
                : materialBalance.sourceVolumeL <= 10
                ? 'Vault evacuated: Complete or initiate final DISCHARGE.'
                : 'All safety interlocks clear. Ready for command.'}
            </span>
          </div>
          <span className="text-slate-400 hidden md:inline">
            {isRunning ? 'RUNNING' : isPaused ? 'PAUSED' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* 4. Tracked Engineering Vehicle & Hydraulic Dewatering Transducer Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Domain 1: Tracked Mobility & Chassis Dynamics */}
        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800 mb-2">
            <span className="font-bold text-white uppercase flex items-center gap-1.5 text-[11px]">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              1. Tracked Mobility & Chassis
            </span>
            <Badge variant={mobilityTelemetry.isMoving ? 'safety' : 'slate'} size="sm">
              {mobilityTelemetry.isMoving ? 'TRANSIT' : 'STATIONARY'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Travel Speed</span>
              <span className="text-sm font-bold text-amber-300">
                {mobilityTelemetry.speedKmh.toFixed(1)}{' '}
                <span className="text-[10px] font-normal text-slate-400">km/h</span>
              </span>
              <span className="text-[9px] text-slate-400 block">
                ({mobilityTelemetry.speedMs.toFixed(2)} m/s)
              </span>
            </div>
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Chassis Tilt</span>
              <span className="text-sm font-bold text-cyan-300">
                {mobilityTelemetry.effectiveTiltDeg.toFixed(1)}°
              </span>
              <span className="text-[9px] text-slate-400 block">
                P: {mobilityTelemetry.pitchDeg.toFixed(1)}° | R: {mobilityTelemetry.rollDeg.toFixed(1)}°
              </span>
            </div>
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Crawler Tracks (L/R)</span>
              <span className="text-xs font-semibold text-slate-200">
                {mobilityTelemetry.leftTrackSpeedMs.toFixed(2)} / {mobilityTelemetry.rightTrackSpeedMs.toFixed(2)}{' '}
                <span className="text-[9px] text-slate-400">m/s</span>
              </span>
              <span className="text-[9px] text-slate-400 block">
                Yaw: {(mobilityTelemetry.steerRateRadS * (180 / Math.PI)).toFixed(1)}°/s
              </span>
            </div>
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Ground Contact</span>
              <span className="text-xs font-semibold text-emerald-300">
                {mobilityTelemetry.groundPressureKpa.toFixed(1)}{' '}
                <span className="text-[9px] text-slate-400">kPa</span>
              </span>
              <span className="text-[9px] text-slate-400 block">
                Max Grade: {mobilityTelemetry.gradeabilityMaxDeg.toFixed(1)}°
              </span>
            </div>
          </div>
        </div>

        {/* Domain 2: Sludge Extraction Core */}
        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800 mb-2">
            <span className="font-bold text-white uppercase flex items-center gap-1.5 text-[11px]">
              <Activity className="w-3.5 h-3.5 text-safety-400" />
              2. Sludge Extraction Core
            </span>
            <Badge
              variant={engine.telemetry.flowRateLpm > 0 ? 'success' : 'slate'}
              size="sm"
            >
              {engine.telemetry.flowRateLpm > 0 ? 'PUMP ACTIVE' : 'IDLE'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Suction Flow</span>
              <span className="text-sm font-bold text-safety-400">
                {engine.telemetry.flowRateLpm.toFixed(1)}{' '}
                <span className="text-[10px] font-normal text-slate-400">L/min</span>
              </span>
              <span className="text-[9px] text-slate-400 block">
                ({engine.telemetry.flowRateM3H.toFixed(2)} m³/h)
              </span>
            </div>
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Vessel Fill</span>
              <span className="text-sm font-bold text-cyan-300">
                {materialBalance.collectionFillPct.toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-400 block">
                {Math.round(materialBalance.collectionVolumeL)} / {engineParams.collectionTankCapacityL} L
              </span>
            </div>
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Suction Vacuum</span>
              <span className="text-xs font-semibold text-emerald-300">
                {Math.abs(engine.telemetry.suctionPressureKpa).toFixed(1)}{' '}
                <span className="text-[9px] text-slate-400">kPa</span>
              </span>
              <span className="text-[9px] text-slate-400 block">
                Cavitation: {(engine.telemetry.cavitationIndex * 100).toFixed(0)}%
              </span>
            </div>
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Dynamic Losses</span>
              <span className="text-xs font-semibold text-slate-200">
                {(engine.telemetry.staticLiftKpa + engine.telemetry.frictionHeadKpa).toFixed(1)}{' '}
                <span className="text-[9px] text-slate-400">kPa</span>
              </span>
              <span className="text-[9px] text-slate-400 block">
                Lift: {engine.telemetry.staticLiftKpa.toFixed(1)} | Fric: {engine.telemetry.frictionHeadKpa.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Domain 3: Hydraulic Dewatering Piston */}
        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800 mb-2">
            <span className="font-bold text-white uppercase flex items-center gap-1.5 text-[11px]">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              3. Hydraulic Dewatering Piston
            </span>
            <Badge
              variant={
                compactionTelemetry.pistonState === 'EXTENDING' || compactionTelemetry.pistonState === 'RETRACTING'
                  ? 'safety'
                  : compactionTelemetry.pistonState === 'LOCKED'
                  ? 'success'
                  : 'slate'
              }
              size="sm"
            >
              {compactionTelemetry.pistonState}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Piston Travel</span>
              <span className="text-sm font-bold text-cyan-300">
                {compactionTelemetry.strokeMm.toFixed(0)}{' '}
                <span className="text-[10px] font-normal text-slate-400">/ {compactionParams.strokeMaxMm} mm</span>
              </span>
              <span className="text-[9px] text-slate-400 block">
                Stroke: {compactionTelemetry.strokePct.toFixed(0)}%
              </span>
            </div>
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Hydraulic Thrust</span>
              <span className="text-sm font-bold text-amber-300">
                {compactionTelemetry.compactionForceKn.toFixed(1)}{' '}
                <span className="text-[10px] font-normal text-slate-400">kN</span>
              </span>
              <span className="text-[9px] text-slate-400 block">
                Press: {compactionTelemetry.appliedPressureBar.toFixed(1)} bar
              </span>
            </div>
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Sludge Cake / Liquid</span>
              <span className="text-xs font-semibold text-slate-200">
                {Math.round(compactionTelemetry.cakeVolumeL)} L / {Math.round(compactionTelemetry.filtrateVolumeL)} L
              </span>
              <span className="text-[9px] text-slate-400 block">
                Init: {Math.round(compactionTelemetry.initialSludgeVolumeL)} L
              </span>
            </div>
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Compaction Ratio</span>
              <span className="text-xs font-semibold text-emerald-300">
                {compactionTelemetry.compactionRatio.toFixed(2)}x
              </span>
              <span className="text-[9px] text-slate-400 block">
                ΔVol: -{compactionTelemetry.volumeReductionPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Domain 4: Hydraulics, Interlocks & Transport Readiness */}
        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800 mb-2">
            <span className="font-bold text-white uppercase flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              4. Hydraulics & Transport Safety
            </span>
            <Badge
              variant={interlocks.isTransportReady ? 'success' : 'warning'}
              size="sm"
            >
              {interlocks.isTransportReady ? 'ROAD READY' : 'INTERLOCKED'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Relief Valve (180b)</span>
              <span
                className={`text-xs font-semibold ${
                  compactionTelemetry.reliefValveOpen ? 'text-amber-400 animate-pulse' : 'text-emerald-300'
                }`}
              >
                {compactionTelemetry.reliefValveOpen ? 'RELIEF OPEN' : 'ARMED'}
              </span>
              <span className="text-[9px] text-slate-400 block">
                Trip: {compactionTelemetry.overpressureTrip ? 'TRIPPED' : 'NORMAL'}
              </span>
            </div>
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Transport Lock</span>
              <span
                className={`text-xs font-semibold flex items-center gap-1 ${
                  compactionTelemetry.isTransportLocked ? 'text-emerald-300' : 'text-rose-400'
                }`}
              >
                {compactionTelemetry.isTransportLocked ? (
                  <>
                    <Lock className="w-3 h-3 text-emerald-400" />
                    LATCHED
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3 text-rose-400" />
                    UNLOCKED
                  </>
                )}
              </span>
              <span className="text-[9px] text-slate-400 block">
                Pin at 0 mm home
              </span>
            </div>
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Stabilizer Outriggers</span>
              <span className="text-xs font-semibold text-slate-200">
                {interlocks.isStabilized ? 'GROUNDED (1.0)' : kinematics.stabilizerExtension > 0 ? `${(kinematics.stabilizerExtension * 100).toFixed(0)}% DEPLOYED` : 'STOWED'}
              </span>
              <span className="text-[9px] text-slate-400 block">
                Boom: {interlocks.isHoseDeployed ? 'DEPLOYED' : 'STOWED'}
              </span>
            </div>
            <div className="bg-graphite-950/80 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">System Alarms</span>
              <span
                className={`text-xs font-semibold ${
                  hasActiveAlarms ? 'text-rose-400 font-bold animate-pulse' : 'text-emerald-300'
                }`}
              >
                {hasActiveAlarms ? `${alarmsActive || 1} ACTIVE` : 'ALL NOMINAL'}
              </span>
              <span className="text-[9px] text-slate-400 block">
                Interlocks: {interlocks.emergencyStopLatched ? 'E-STOP' : 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Middle Section: 3D Viewport (Left) + Parameter & Terrain Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[460px]">
        {/* Large 3D Viewport Column */}
        <div className="lg:col-span-8 flex flex-col relative rounded-xl overflow-hidden border border-slate-800 bg-graphite-950 shadow-2xl">
          {/* Viewport Floating Header Bar */}
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Camera Presets Selector */}
            <div className="flex items-center gap-1 bg-graphite-950/80 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setCameraPreset(p.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                    cameraPreset === p.id
                      ? 'bg-safety-500 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-graphite-850'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Display Layer Toggles */}
            <div className="flex items-center gap-1.5 bg-graphite-950/80 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto">
              <Button
                variant={displayOptions.cutaway ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => toggleDisplayOption('cutaway')}
                title="Toggle Architectural Cutaway Section"
                className="text-[10px] py-1 px-2"
              >
                Cutaway
              </Button>
              <Button
                variant={displayOptions.showAnnotations ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => toggleDisplayOption('showAnnotations')}
                title="Toggle 3D Sensor Tags"
                className="text-[10px] py-1 px-2"
              >
                <Eye className="w-3 h-3" />
              </Button>
              <Button
                variant={displayOptions.showGrid ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => toggleDisplayOption('showGrid')}
                title="Toggle Ground Grid"
                className="text-[10px] py-1 px-2"
              >
                Grid
              </Button>
              <Button
                variant={displayOptions.mobilityMode === 'tracks' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setMobilityMode(displayOptions.mobilityMode === 'tracks' ? 'wheels' : 'tracks')}
                title="Switch between 4-Wheel and Crawler Track Mobility Gear"
                className="text-[10px] py-1 px-2 font-mono flex items-center gap-1"
              >
                <Truck className="w-3 h-3" />
                {displayOptions.mobilityMode === 'tracks' ? 'Tracks' : 'Wheels'}
              </Button>
              <Button
                variant={displayOptions.wireframe ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => toggleDisplayOption('wireframe')}
                title="Toggle Wireframe Mode"
                className="text-[10px] py-1 px-2"
              >
                Mesh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView('simulation3d')}
                title="Expand to Fullscreen View"
                className="text-[10px] py-1 px-2"
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* R3F 3D Canvas */}
          <div className="flex-1 w-full h-full min-h-[420px]">
            <DigitalTwinCanvas />
          </div>

          {/* Selected Component Quick Overlay */}
          {selectedData && (
            <div className="absolute bottom-3 left-3 right-3 md:right-auto md:w-96 z-10 bg-graphite-950/95 border border-safety-500/50 rounded-xl p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-safety-500 animate-pulse" />
                    {selectedData.name}
                  </h4>
                  <p className="text-[10px] text-slate-400">{selectedData.type}</p>
                </div>
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded border border-slate-800"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                {selectedData.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-graphite-900/80 p-2 rounded-lg border border-slate-800 mb-2">
                {Object.entries(selectedData.specifications).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-slate-400 block">{key}</span>
                    <span className="text-slate-200 font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Parameters Panel & Terrain Feasibility */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card with Tab Switcher: Machine Actuators vs Terrain Feasibility */}
          <Card
            title={paramPanelTab === 'machine' ? 'Machine Parameters' : 'Terrain Feasibility Model'}
            subtitle={
              paramPanelTab === 'machine'
                ? 'Actuator setpoints & fluid properties'
                : 'Kinematic inclination & route losses'
            }
            icon={<Sliders className="w-4 h-4 text-safety-500" />}
            headerAction={
              <div className="flex items-center bg-graphite-950 p-0.5 rounded-lg border border-slate-800 font-mono text-[10px]">
                <button
                  onClick={() => setParamPanelTab('machine')}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    paramPanelTab === 'machine'
                      ? 'bg-safety-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Machine
                </button>
                <button
                  onClick={() => setParamPanelTab('terrain')}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    paramPanelTab === 'terrain'
                      ? 'bg-safety-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Terrain
                </button>
              </div>
            }
          >
            {paramPanelTab === 'machine' ? (
              <div className="space-y-3.5 text-xs">
                {/* 1. Pump Speed (RPM) */}
                <Slider
                  id="param-pump-rpm"
                  label="Pump Speed"
                  value={parameters.pumpRpm}
                  min={0}
                  max={3600}
                  step={50}
                  unit="RPM"
                  onChange={(val) => updateParameter('pumpRpm', val)}
                  dangerThreshold={3200}
                  description="Lobe pump displacement cycle frequency."
                />

                {/* 1b. Pump Displacement Capacity (L/min) */}
                <Slider
                  id="param-pump-capacity"
                  label="Pump Displacement Capacity"
                  value={engineParams.pumpRatedFlowLpm}
                  min={100}
                  max={1000}
                  step={25}
                  unit="L/min"
                  onChange={(val) => updateEngineParameter('pumpRatedFlowLpm', val)}
                  description="Nominal displacement capacity at maximum rated speed."
                />

                {/* 2. Hose Length (m) */}
                <Slider
                  id="param-hose-length"
                  label="Configured Hose Length"
                  value={parameters.hoseLengthM}
                  min={5}
                  max={100}
                  step={1}
                  unit="m"
                  onChange={(val) => updateParameter('hoseLengthM', val)}
                  description="Available suction conduit on reel."
                />

                {/* 3. Hose Diameter (mm) */}
                <Slider
                  id="param-hose-diameter"
                  label="Hose Diameter"
                  value={parameters.hoseDiameterMm}
                  min={50}
                  max={200}
                  step={5}
                  unit="mm"
                  onChange={(val) => updateParameter('hoseDiameterMm', val)}
                  description="Inner bore diameter (larger bore reduces friction)."
                />

                {/* 3b. Static Geodetic Elevation Difference (m) */}
                <Slider
                  id="param-elevation"
                  label="Static Elevation Lift"
                  value={engineParams.elevationDifferenceM}
                  min={0}
                  max={12}
                  step={0.5}
                  unit="m"
                  onChange={(val) => updateEngineParameter('elevationDifferenceM', val)}
                  dangerThreshold={6.5}
                  description="Static elevation difference between septic vault floor and pump inlet."
                />

                {/* 4. Sludge Consistency Presets + Fine Viscosity (cP) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] text-slate-300 font-medium">
                    <span>Sludge Consistency Presets</span>
                    <span className="font-mono text-safety-400 font-bold">{parameters.slurryViscosityCp} cP</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 font-mono text-[10px]">
                    {[
                      { label: 'Liquid (50cP)', cp: 50, type: 'liquid' },
                      { label: 'Slurry (250cP)', cp: 250, type: 'slurry' },
                      { label: 'Viscous (450cP)', cp: 450, type: 'viscous' },
                      { label: 'Crust (1800cP)', cp: 1800, type: 'thick_crust' }
                    ].map((preset) => (
                      <button
                        key={preset.type}
                        type="button"
                        onClick={() => {
                          updateParameter('slurryViscosityCp', preset.cp);
                          updateEngineParameter('sludgeViscosityCp', preset.cp);
                          updateEngineParameter('sludgeConsistency', preset.type as any);
                        }}
                        className={`px-1 py-1 rounded border text-center transition truncate ${
                          Math.abs(parameters.slurryViscosityCp - preset.cp) < 25
                            ? 'bg-safety-500/20 border-safety-400 text-safety-300 font-bold'
                            : 'bg-graphite-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title={preset.label}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <Slider
                    id="param-viscosity"
                    label="Fine Viscosity Slider"
                    value={parameters.slurryViscosityCp}
                    min={50}
                    max={3000}
                    step={25}
                    unit="cP"
                    onChange={(val) => {
                      updateParameter('slurryViscosityCp', val);
                      updateEngineParameter('sludgeViscosityCp', val);
                    }}
                    dangerThreshold={2200}
                    description="Dynamic rheology (water = 1 cP, thick slurry = 1500+ cP)."
                  />
                </div>

                {/* 5. Collection Tank Capacity (L) */}
                <Slider
                  id="param-tank-capacity"
                  label="Tank Capacity"
                  value={engineParams.collectionTankCapacityL}
                  min={1000}
                  max={6000}
                  step={100}
                  unit="L"
                  onChange={(val) => updateEngineParameter('collectionTankCapacityL', val)}
                  description="On-board vacuum containment vessel rated volume."
                />

                {/* 6. Target Extraction Volume (L) */}
                <Slider
                  id="param-target-volume"
                  label="Target Volume"
                  value={engineParams.targetExtractionVolumeL}
                  min={500}
                  max={5000}
                  step={100}
                  unit="L"
                  onChange={(val) => updateEngineParameter('targetExtractionVolumeL', val)}
                  description="Batch extraction limit before automatic cycle cut-off."
                />

                {/* Auxiliary Toggles */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <Button
                    variant={parameters.waterJetEnabled ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateParameter('waterJetEnabled', !parameters.waterJetEnabled)}
                    className="text-xs"
                  >
                    Jetting: {parameters.waterJetEnabled ? 'ON' : 'OFF'}
                  </Button>
                  <Button
                    variant={parameters.cutterHeadEnabled ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateParameter('cutterHeadEnabled', !parameters.cutterHeadEnabled)}
                    className="text-xs"
                  >
                    Cutter: {parameters.cutterHeadEnabled ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                {/* 1. Terrain Slope Angle (°) */}
                <Slider
                  id="terrain-slope"
                  label="Terrain Slope Angle"
                  value={terrainParams.slopeDeg}
                  min={0}
                  max={28}
                  step={0.5}
                  unit="°"
                  onChange={(val) => updateTerrainParams({ slopeDeg: val })}
                  dangerThreshold={stabilityThresholds.maxChassisTiltDeg}
                  description="Ground inclination gradient along access route."
                />

                {/* 2. Surface Roughness */}
                <Slider
                  id="terrain-roughness"
                  label="Surface Roughness (Boulders/Gravel)"
                  value={terrainParams.surfaceRoughness}
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  unit=""
                  onChange={(val) => updateTerrainParams({ surfaceRoughness: val })}
                  dangerThreshold={0.7}
                  description="0.0 = smooth paved, 0.7+ = rocky unpaved terrain."
                />

                {/* 3. Machine Staging Setback Distance (m) */}
                <Slider
                  id="terrain-setback"
                  label="Machine Staging Setback"
                  value={terrainParams.machineSetbackM}
                  min={3}
                  max={30}
                  step={0.5}
                  unit="m"
                  onChange={(val) => updateTerrainParams({ machineSetbackM: val })}
                  description="Distance between machine chassis and vault opening."
                />

                {/* 4. Access Corridor Width (m) */}
                <Slider
                  id="terrain-width"
                  label="Path Corridor Width"
                  value={terrainParams.pathWidthM}
                  min={1.2}
                  max={5.0}
                  step={0.1}
                  unit="m"
                  onChange={(val) => updateTerrainParams({ pathWidthM: val })}
                  description="Clearance envelope width between walls/curbs."
                />

                {/* 5. Machine Orientation Heading on Slope (°) */}
                <Slider
                  id="terrain-heading"
                  label="Orientation Heading on Slope"
                  value={terrainParams.machineHeadingDeg}
                  min={0}
                  max={180}
                  step={5}
                  unit="°"
                  onChange={(val) => updateTerrainParams({ machineHeadingDeg: val })}
                  description="0° = nose up-slope (pitch), 90° = cross-slope (roll)."
                />

                {/* Real-Time Feasibility Results Ribbon */}
                <div className="bg-graphite-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Chassis Tilt (Compensated):</span>
                    <span className={`font-bold ${feasibility.effectiveTiltDeg >= 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {feasibility.effectiveTiltDeg.toFixed(1)}° (Roll: {feasibility.chassisRollDeg.toFixed(1)}°)
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Required Hose Length:</span>
                    <span className={`font-bold ${feasibility.hoseLengthAdequate ? 'text-slate-200' : 'text-rose-400'}`}>
                      {feasibility.requiredHoseLengthM} m ({feasibility.hoseLengthAdequate ? 'ADEQUATE' : 'DEFICIT'})
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Static + Friction Loss:</span>
                    <span className="text-safety-400 font-bold">
                      {feasibility.totalRoutingLossKpa} kPa
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Lateral Clearance Margin:</span>
                    <span className={`font-bold ${feasibility.clearanceConflictDetected ? 'text-rose-400' : 'text-slate-200'}`}>
                      {feasibility.lateralClearanceMarginM} m/side
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Stability Rating:</span>
                    <Badge
                      variant={
                        feasibility.stabilityStatus === 'critical_unstable'
                          ? 'danger'
                          : feasibility.stabilityStatus === 'caution'
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                    >
                      {feasibility.stabilityStatus.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-mono italic">
                  * {PRELIMINARY_ESTIMATE_DISCLAIMER}
                </p>
              </div>
            )}
          </Card>

          {/* Component Inspector Card */}
          <Card
            title="Component Inspector"
            subtitle="Mechanical & sensory telemetry"
            icon={<Cpu className="w-4 h-4 text-cyan-400" />}
          >
            {/* Component Quick Selector Chips */}
            <div className="flex flex-wrap gap-1 mb-3">
              {Object.keys(INSPECTABLE_COMPONENTS).map((key) => {
                const comp = INSPECTABLE_COMPONENTS[key];
                const isSelected = selectedComponentId === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedComponent(isSelected ? null : key)}
                    className={`px-2 py-1 rounded text-[10px] font-mono transition-all border ${
                      isSelected
                        ? 'bg-safety-500/20 border-safety-500 text-safety-400 font-bold'
                        : 'bg-graphite-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {comp.id}
                  </button>
                );
              })}
            </div>

            {selectedData ? (
              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div>
                    <div className="text-white font-bold text-xs">{selectedData.name}</div>
                    <div className="text-[10px] text-slate-400">{selectedData.type}</div>
                  </div>
                  <Badge variant="success" size="sm">
                    {selectedData.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-graphite-950 p-2 rounded-lg border border-slate-800/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">TEMP</span>
                    <span className="text-slate-200 font-bold">{selectedData.temperatureC}°C</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">PRESS</span>
                    <span className="text-slate-200 font-bold">{selectedData.pressureBar} bar</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">VIBE</span>
                    <span className="text-slate-200 font-bold">{selectedData.vibrationMmS} mm/s</span>
                  </div>
                </div>

                <div className="space-y-1 bg-graphite-950 p-2 rounded-lg border border-slate-800/80 text-[10px]">
                  {Object.entries(selectedData.specifications).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-slate-200 font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 font-mono text-xs flex flex-col items-center gap-1.5">
                <Eye className="w-5 h-5 text-slate-400 opacity-60" />
                <span>Click machine parts in 3D viewport or pick a component above to inspect live telemetry.</span>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 5. Bottom Section: Real-Time Charts + Timestamped Alarms & Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Trend Charts Column */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <Card
            title={
              activeChartTab === 'flowRate'
                ? 'Extraction Flow & Motor Load Telemetry'
                : activeChartTab === 'tankBalance'
                ? 'Tank Volume Mass Balance History'
                : activeChartTab === 'powerEnergy'
                ? 'Pump Power & Cumulative Energy Telemetry'
                : 'Chronological Event & Alarm Timeline'
            }
            subtitle={
              activeChartTab === 'flowRate'
                ? 'Simulated flow rate (L/min) and motor load (%)'
                : activeChartTab === 'tankBalance'
                ? 'Source vault, on-board tank, and external receiver volumes (L)'
                : activeChartTab === 'powerEnergy'
                ? 'Simulated motor power (kW) and cumulative integrated electrical energy (kWh)'
                : 'Chronological operating transitions, safety trips, and actuator interlocks'
            }
            icon={<Activity className="w-4 h-4 text-safety-500" />}
            headerAction={
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-graphite-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveChartTab('flowRate')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      activeChartTab === 'flowRate'
                        ? 'bg-safety-500 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Flow
                  </button>
                  <button
                    onClick={() => setActiveChartTab('tankBalance')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      activeChartTab === 'tankBalance'
                        ? 'bg-cyan-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tanks
                  </button>
                  <button
                    onClick={() => setActiveChartTab('powerEnergy')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      activeChartTab === 'powerEnergy'
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Power/Energy
                  </button>
                  <button
                    onClick={() => setActiveChartTab('eventTimeline')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      activeChartTab === 'eventTimeline'
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Timeline
                  </button>
                </div>
                <Badge variant="cyan" size="sm">
                  LIVE STREAM
                </Badge>
              </div>
            }
          >
            <div className="h-64 w-full">
              {activeChartTab === 'eventTimeline' ? (
                <div className="h-full overflow-y-auto pr-2 space-y-2 scrollbar-thin">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800">
                    <span>Simulation Event Milestones ({eventLog.length} recorded events)</span>
                    <span className="text-safety-400">Sequential Telemetry</span>
                  </div>
                  {eventLog.length === 0 ? (
                    <div className="h-44 flex items-center justify-center text-slate-500 text-xs font-mono">
                      No timeline events recorded yet. Run simulation cycle to record transitions and alarms.
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-slate-800 space-y-3 py-1">
                      {eventLog.map((evt) => {
                        const dotColor = {
                          critical: 'bg-rose-500 border-rose-300 ring-rose-500/30',
                          warning: 'bg-amber-500 border-amber-300 ring-amber-500/30',
                          success: 'bg-emerald-500 border-emerald-300 ring-emerald-500/30',
                          info: 'bg-cyan-500 border-cyan-300 ring-cyan-500/30'
                        }[evt.level];

                        return (
                          <div key={evt.id} className="relative group">
                            <div
                              className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 ring-4 ${dotColor}`}
                            />
                            <div className="bg-graphite-950 p-2 rounded-lg border border-slate-800/80 font-mono text-xs hover:border-slate-700 transition">
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span className="font-bold text-slate-200">{evt.source}</span>
                                <span className="text-slate-400">{evt.timestamp}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-tight">{evt.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartTab === 'flowRate' ? (
                    <AreaChart data={history} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="flowLpmGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="motorLoadGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis
                        yAxisId="left"
                        stroke="#f97316"
                        tick={{ fontSize: 10 }}
                        domain={[0, 'auto']}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#eab308"
                        tick={{ fontSize: 10 }}
                        domain={[0, 100]}
                      />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: '#0b0f17',
                          borderColor: '#334155',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="flowRateLpm"
                        stroke="#f97316"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#flowLpmGrad)"
                        name="Flow Rate (L/min)"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="motorLoadPct"
                        stroke="#eab308"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#motorLoadGrad)"
                        name="Motor Load (%)"
                      />
                    </AreaChart>
                  ) : activeChartTab === 'tankBalance' ? (
                    <LineChart data={history} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: '#0b0f17',
                          borderColor: '#334155',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      <Line
                        type="monotone"
                        dataKey="sourceVolumeL"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                        name="Vault Source (L)"
                      />
                      <Line
                        type="monotone"
                        dataKey="collectionVolumeL"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={false}
                        name="Collection Vessel (L)"
                      />
                      <Line
                        type="monotone"
                        dataKey="receiverVolumeL"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        name="Disposal Tanker (L)"
                      />
                    </LineChart>
                  ) : (
                    <LineChart data={history} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis
                        yAxisId="power"
                        stroke="#eab308"
                        tick={{ fontSize: 10 }}
                        domain={[0, 18]}
                      />
                      <YAxis
                        yAxisId="energy"
                        orientation="right"
                        stroke="#10b981"
                        tick={{ fontSize: 10 }}
                        domain={[0, 'auto']}
                      />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: '#0b0f17',
                          borderColor: '#334155',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      <Line
                        yAxisId="power"
                        type="monotone"
                        dataKey="power"
                        stroke="#eab308"
                        strokeWidth={2}
                        dot={false}
                        name="Motor Power (kW)"
                      />
                      <Line
                        yAxisId="energy"
                        type="monotone"
                        dataKey="energyKwh"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        name="Cumulative Energy (kWh)"
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Hydraulic Model Assumptions & Disclaimers Accordion */}
          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md font-mono text-xs">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setShowModelLimitations(!showModelLimitations)}
            >
              <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px]">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hydraulic Model Assumptions & Limitations</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-semibold hover:underline">
                {showModelLimitations ? 'Collapse ▲' : 'Expand Details ▼'}
              </span>
            </div>

            {showModelLimitations && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                <p className="text-slate-300">
                  Desludge Digital Twin calculates flow using deterministic engineering formulas. Key documented simplifications:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  {HYDRAULIC_MODEL_LIMITATIONS.map((lim, i) => (
                    <li key={`lim-${i}`}>{lim}</li>
                  ))}
                </ul>
                <div className="mt-2 p-2 rounded bg-graphite-950 border border-slate-800 text-[10px] text-amber-300/90 flex items-center justify-between">
                  <span>DATA FIDELITY: SIMULATED DIGITAL TWIN (PHYSICAL TRANSDUCER PENDING)</span>
                  <span className="text-slate-400">Fixed integration step Δt = 0.05s</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timestamped Alarm Panel & Event Log Column */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Timestamped Alarm Panel */}
          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold text-white uppercase flex items-center gap-1.5 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-safety-500" />
                Active Safety Alarms & Interlocks
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                  hasActiveAlarms
                    ? 'bg-rose-950/80 text-rose-300 border-rose-700/60 animate-pulse'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                }`}
              >
                {hasActiveAlarms ? 'ALARM ACTIVE' : 'ALL NOMINAL'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[10px]">
              <div
                className={`p-1.5 rounded border text-center ${
                  alarms.emergencyStopActive
                    ? 'bg-rose-950 text-rose-300 border-rose-700 font-bold animate-pulse'
                    : 'bg-graphite-950 border-slate-800 text-slate-400'
                }`}
              >
                E-Stop: {alarms.emergencyStopActive ? 'TRIPPED' : 'CLEAR'}
              </div>

              <div
                className={`p-1.5 rounded border text-center ${
                  alarms.collectionTankFull
                    ? 'bg-rose-950 text-rose-300 border-rose-700 font-bold'
                    : 'bg-graphite-950 border-slate-800 text-slate-400'
                }`}
              >
                Tank Full: {alarms.collectionTankFull ? 'HIGH ALARM' : 'NORMAL'}
              </div>

              <div
                className={`p-1.5 rounded border text-center ${
                  alarms.lowSourceLevel
                    ? 'bg-amber-950 text-amber-300 border-amber-700 font-bold'
                    : 'bg-graphite-950 border-slate-800 text-slate-400'
                }`}
              >
                Source: {alarms.lowSourceLevel ? 'LOW LEVEL' : 'NORMAL'}
              </div>

              <div
                className={`p-1.5 rounded border text-center ${
                  alarms.excessiveVacuum
                    ? 'bg-rose-950 text-rose-300 border-rose-700 font-bold'
                    : 'bg-graphite-950 border-slate-800 text-slate-400'
                }`}
              >
                Vacuum: {alarms.excessiveVacuum ? 'EXCESSIVE' : 'NORMAL'}
              </div>

              <div
                className={`p-1.5 rounded border text-center ${
                  alarms.motorOverload
                    ? 'bg-rose-950 text-rose-300 border-rose-700 font-bold'
                    : 'bg-graphite-950 border-slate-800 text-slate-400'
                }`}
              >
                Motor: {alarms.motorOverload ? 'OVERLOAD' : 'NORMAL'}
              </div>

              <div
                className={`p-1.5 rounded border text-center ${
                  !interlocks.isDeployed && operatingState !== 'IDLE'
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-graphite-950 border-slate-800 text-slate-400'
                }`}
              >
                Deploy Lock: {interlocks.isDeployed ? 'OK' : 'STOWED'}
              </div>
            </div>
          </div>

          {/* Chronological Event Log with CSV Export */}
          <Card
            title="Chronological Event Log"
            subtitle="Simulated sequence audit stream"
            icon={<FileSpreadsheet className="w-4 h-4 text-safety-500" />}
            headerAction={
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadTelemetryCsv(history)}
                  title="Download simulated telemetry buffer in CSV format"
                  className="text-[10px] py-0.5 px-2 text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Telemetry CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadEventsCsv(eventLog)}
                  title="Download chronological event log in CSV format"
                  className="text-[10px] py-0.5 px-2 text-safety-400 hover:text-safety-300 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Events CSV
                </Button>
              </div>
            }
          >
            <div className="h-44 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {eventLog.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                  No active events logged
                </div>
              ) : (
                eventLog.map((evt) => {
                  const levelBadge = {
                    critical: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
                    warning: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
                    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
                    info: 'bg-slate-800 text-slate-300 border-slate-700'
                  }[evt.level];

                  return (
                    <div
                      key={evt.id}
                      className="p-1.5 rounded-lg bg-graphite-950 border border-slate-800 text-xs font-mono flex items-start gap-2"
                    >
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${levelBadge}`}
                      >
                        {evt.level}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="text-safety-400 font-semibold">{evt.source}</span>
                          <span>{evt.timestamp}</span>
                        </div>
                        <p className="text-slate-200 text-[11px] leading-tight break-words">
                          {evt.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
