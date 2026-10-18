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
  FileSpreadsheet
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

  // Viewport / Inspection
  const cameraPreset = useSimulationStore((s) => s.cameraPreset);
  const setCameraPreset = useSimulationStore((s) => s.setCameraPreset);
  const displayOptions = useSimulationStore((s) => s.displayOptions);
  const toggleDisplayOption = useSimulationStore((s) => s.toggleDisplayOption);
  const selectedComponentId = useSimulationStore((s) => s.selectedComponentId);
  const setSelectedComponent = useSimulationStore((s) => s.setSelectedComponent);

  // Local tab for bottom trend charts
  const [activeChartTab, setActiveChartTab] = useState<'flowMotor' | 'tankBalance'>('flowMotor');

  const selectedData = selectedComponentId ? INSPECTABLE_COMPONENTS[selectedComponentId] : null;

  // Camera presets list
  const presets: { id: CameraPreset; label: string }[] = [
    { id: 'reset', label: 'Reset' },
    { id: 'iso', label: 'ISO' },
    { id: 'top', label: 'Top' },
    { id: 'side', label: 'Side' },
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

  const deployDisabled = isFault || operatingState !== 'IDLE';
  const deployReason = isFault
    ? 'Fault active: Clear fault first.'
    : operatingState !== 'IDLE'
    ? `Machine is currently in ${operatingState} phase.`
    : 'Extend 4 hydraulic outriggers and articulate extraction boom into vault opening.';

  const primeDisabled =
    isFault ||
    (!interlocks.isDeployed && kinematics.deployProgress < 0.95) ||
    operatingState === 'PRIME' ||
    operatingState === 'EXTRACT' ||
    operatingState === 'DISCHARGE';
  const primeReason = isFault
    ? 'Fault active: Clear fault first.'
    : !interlocks.isDeployed && kinematics.deployProgress < 0.95
    ? 'Interlock blocked: Machine stabilizers and boom must be fully deployed first.'
    : operatingState === 'PRIME'
    ? 'Priming sequence is currently running.'
    : operatingState === 'EXTRACT' || operatingState === 'DISCHARGE'
    ? `Machine already past priming (${operatingState}).`
    : 'Prime positive displacement vacuum chamber and flood suction lines.';

  const extractDisabled =
    isFault ||
    !interlocks.isPrimed ||
    materialBalance.collectionFillPct >= 100 ||
    materialBalance.sourceVolumeL <= 10 ||
    operatingState === 'EXTRACT';
  const extractReason = isFault
    ? 'Fault active: Clear fault first.'
    : !interlocks.isPrimed
    ? 'Interlock blocked: Machine must be deployed and primed before extraction.'
    : materialBalance.collectionFillPct >= 100
    ? 'Collection tank is full (100% capacity reached).'
    : materialBalance.sourceVolumeL <= 10
    ? 'Source septic vault is evacuated (empty).'
    : operatingState === 'EXTRACT'
    ? 'Extraction is currently active.'
    : 'Engage vacuum pump and draw sludge through suction umbilical.';

  const dischargeDisabled =
    isFault || materialBalance.collectionVolumeL <= 0.5 || operatingState === 'DISCHARGE';
  const dischargeReason = isFault
    ? 'Fault active: Clear fault first.'
    : materialBalance.collectionVolumeL <= 0.5
    ? 'Collection tank has no sludge to discharge (empty).'
    : operatingState === 'DISCHARGE'
    ? 'Discharge transfer is currently active.'
    : 'Evacuate on-board collection tank to external waste disposal tanker.';

  const eStopDisabled = interlocks.emergencyStopLatched;
  const eStopReason = interlocks.emergencyStopLatched
    ? 'E-STOP already latched. Acknowledge and resolve fault to restore IDLE state.'
    : 'Instantly de-energize all actuators, halt material transfer, and latch emergency stop.';

  // State badge variant
  const stateVariant: Record<string, 'slate' | 'safety' | 'warning' | 'danger' | 'success' | 'cyan'> = {
    IDLE: 'slate',
    DEPLOY: 'warning',
    PRIME: 'safety',
    EXTRACT: 'success',
    DISCHARGE: 'cyan',
    COMPLETE: 'success',
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
      {/* 0. Machine Sequence Stepper & Mass Balance Ribbon */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Operating Sequence Stepper */}
        <div className="lg:col-span-7 bg-graphite-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-safety-500" />
              Machine Operating Sequence
            </span>
            <span className="text-[10px] text-slate-400">Deterministic Engine (Δt = 0.05s)</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {[
              { id: 'IDLE', label: '1. IDLE' },
              { id: 'DEPLOY', label: '2. DEPLOY' },
              { id: 'PRIME', label: '3. PRIME' },
              { id: 'EXTRACT', label: '4. EXTRACT' },
              { id: 'DISCHARGE', label: '5. DISCHG' },
              { id: 'COMPLETE', label: '6. DONE' }
            ].map((step, idx) => {
              const isActive = operatingState === step.id;
              const stepOrder = ['IDLE', 'DEPLOY', 'PRIME', 'EXTRACT', 'DISCHARGE', 'COMPLETE'];
              const isPassed = stepOrder.indexOf(operatingState) > idx;
              return (
                <div
                  key={step.id}
                  className={`px-2 py-1.5 rounded-lg border text-center font-mono text-[11px] transition-all ${
                    isActive
                      ? 'border-safety-500 bg-safety-500/15 text-safety-400 font-bold shadow-md shadow-safety-500/20 animate-pulse'
                      : isPassed
                      ? 'border-emerald-600/50 bg-emerald-950/30 text-emerald-400'
                      : 'border-slate-800 bg-graphite-950/60 text-slate-400'
                  }`}
                >
                  <div className="truncate">{step.label}</div>
                  <div className="text-[9px] uppercase tracking-tighter opacity-80">
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

      {/* 1. Exactly 8 Live Industrial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {/* KPI 1: Extraction Flow Rate (L/min) */}
        <KpiCard
          label="Extraction Flow"
          value={engine.telemetry.flowRateLpm.toFixed(1)}
          unit="L/min"
          icon={<Activity className="w-4 h-4 text-safety-400" />}
          status={engine.telemetry.flowRateLpm > 0 ? 'nominal' : 'neutral'}
          tooltip={`Simulated Extraction Flow: ${engine.telemetry.flowRateM3H.toFixed(2)} m³/h`}
        />

        {/* KPI 2: Total Volume Extracted (L) */}
        <KpiCard
          label="Volume Extracted"
          value={Math.round(materialBalance.collectionVolumeL)}
          unit="L"
          icon={<Droplets className="w-4 h-4 text-cyan-400" />}
          status="nominal"
          progress={{
            current: materialBalance.collectionVolumeL,
            max: engineParams.collectionTankCapacityL
          }}
          tooltip={`On-board tank: ${Math.round(materialBalance.collectionVolumeL)} / ${engineParams.collectionTankCapacityL} L`}
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
          tooltip={`Initial: ${engineParams.initialSourceVolumeL} L | Level: ${materialBalance.sourceLevelM.toFixed(2)} m`}
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
          tooltip={`Collection vessel capacity limit: ${engineParams.collectionTankCapacityL} L`}
        />

        {/* KPI 5: Simulated Inlet Vacuum (kPa) */}
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
          tooltip={`Target: ${parameters.targetVacuumKpa} kPa | Cavitation Risk: ${(engine.telemetry.cavitationIndex * 100).toFixed(0)}%`}
        />

        {/* KPI 6: Motor Load (%) */}
        <KpiCard
          label="Motor Load"
          value={motorLoadPct.toFixed(1)}
          unit="%"
          icon={<Zap className="w-4 h-4 text-yellow-400" />}
          status={motorLoadPct >= 90 ? 'alert' : motorLoadPct >= 75 ? 'warning' : 'neutral'}
          progress={{
            current: motorLoadPct,
            max: 100
          }}
          tooltip={`Power: ${engine.telemetry.motorPowerKw.toFixed(1)} kW / 15.0 kW rated (${telemetry.motorCurrentAmps.toFixed(1)} A)`}
        />

        {/* KPI 7: Estimated Time Remaining */}
        <KpiCard
          label="Est. Time Left"
          value={timeRemainingStr}
          unit={engine.telemetry.estimatedRemainingTimeSec > 0 ? '' : ''}
          icon={<Clock className="w-4 h-4 text-purple-400" />}
          status={engine.telemetry.estimatedRemainingTimeSec > 0 ? 'nominal' : 'neutral'}
          tooltip={`Based on dynamic flow rate (${engine.telemetry.flowRateLpm.toFixed(1)} L/min)`}
        />

        {/* KPI 8: Current Operating State */}
        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium tracking-wide uppercase text-[10px] truncate">OPERATING STATE</span>
            <Cpu className="w-3.5 h-3.5 text-safety-400 shrink-0" />
          </div>
          <div className="my-1 flex items-center">
            <Badge variant={stateVariant[operatingState] || 'slate'} size="md">
              {operatingState}
            </Badge>
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Status:</span>
            <span className="font-semibold text-slate-300 uppercase">{status}</span>
          </div>
        </div>
      </div>

      {/* 2. Machine Operating Controls & Speed Ribbon */}
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
        <div className="flex flex-wrap items-center gap-2">
          {/* Start / Pause / Resume */}
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

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Discrete Sequence Steps */}
          <Tooltip content={deployReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={deployDisabled}
              onClick={triggerDeploy}
              className="flex items-center gap-1.5 text-xs"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              Deploy
            </Button>
          </Tooltip>

          <Tooltip content={primeReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={primeDisabled}
              onClick={triggerPrime}
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              Prime
            </Button>
          </Tooltip>

          <Tooltip content={extractReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={extractDisabled}
              onClick={triggerExtract}
              className="flex items-center gap-1.5 text-xs"
            >
              <Activity className="w-3.5 h-3.5 text-safety-400" />
              Extract
            </Button>
          </Tooltip>

          <Tooltip content={dischargeReason}>
            <Button
              variant="secondary"
              size="sm"
              disabled={dischargeDisabled}
              onClick={triggerDischarge}
              className="flex items-center gap-1.5 text-xs"
            >
              <ArrowRightCircle className="w-3.5 h-3.5 text-emerald-400" />
              Discharge
            </Button>
          </Tooltip>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Reset */}
          <Tooltip content="Reset simulation state, mass balance, kinematics, charts, and telemetry to initial IDLE baseline.">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSimulation}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Machine
            </Button>
          </Tooltip>

          {/* E-Stop */}
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
                : !interlocks.isDeployed
                ? 'Machine in IDLE: Stabilizers and hose boom stowed.'
                : !interlocks.isPrimed
                ? 'Machine deployed: Vacuum chamber requires priming before extraction.'
                : materialBalance.collectionFillPct >= 100
                ? 'Collection tank full (100% capacity): Ready for DISCHARGE.'
                : materialBalance.sourceVolumeL <= 10
                ? 'Vault evacuated: Complete or initiate final DISCHARGE.'
                : operatingState === 'EXTRACT'
                ? 'Extraction active: Continuous mass transfer into on-board vessel.'
                : operatingState === 'DISCHARGE'
                ? 'Discharge active: Evacuating collection tank to external disposal tanker.'
                : 'All safety interlocks clear. Ready for command.'}
            </span>
          </div>
          <span className="text-slate-400 hidden md:inline">
            {isRunning ? 'RUNNING' : isPaused ? 'PAUSED' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* 3. Middle Section: 3D Viewport (Left) + Parameter Sliders & Inspector (Right) */}
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

        {/* Right Column: Parameters Panel & Component Inspector */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Machine Parameter Panel with Functional Sliders & Numeric Inputs */}
          <Card
            title="Machine Parameters"
            subtitle="Physics configuration & setpoints"
            icon={<Sliders className="w-4 h-4 text-safety-500" />}
          >
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

              {/* 2. Hose Length (m) */}
              <Slider
                id="param-hose-length"
                label="Hose Length"
                value={parameters.hoseLengthM}
                min={5}
                max={100}
                step={1}
                unit="m"
                onChange={(val) => updateParameter('hoseLengthM', val)}
                description="Suction conduit length; increases Darcy head loss."
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

              {/* 4. Sludge Consistency / Viscosity (cP) */}
              <Slider
                id="param-viscosity"
                label="Sludge Viscosity"
                value={parameters.slurryViscosityCp}
                min={100}
                max={3000}
                step={50}
                unit="cP"
                onChange={(val) => updateParameter('slurryViscosityCp', val)}
                dangerThreshold={2200}
                description="Dynamic rheology (water = 1 cP, thick slurry = 1500+ cP)."
              />

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
          </Card>

          {/* Selected Component Inspector Card */}
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

      {/* 4. Bottom Section: Real-Time Charts + Timestamped Alarms & Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Trend Charts Column */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <Card
            title={
              activeChartTab === 'flowMotor'
                ? 'Extraction Flow & Motor Load Telemetry'
                : 'Tank Volume Mass Balance History'
            }
            subtitle={
              activeChartTab === 'flowMotor'
                ? 'Simulated flow rate (L/min) and motor load (%)'
                : 'Source vault, on-board tank, and external receiver volumes (L)'
            }
            icon={<Activity className="w-4 h-4 text-safety-500" />}
            headerAction={
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-graphite-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveChartTab('flowMotor')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      activeChartTab === 'flowMotor'
                        ? 'bg-safety-500 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Flow & Load
                  </button>
                  <button
                    onClick={() => setActiveChartTab('tankBalance')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      activeChartTab === 'tankBalance'
                        ? 'bg-cyan-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tank Balance
                  </button>
                </div>
                <Badge variant="cyan" size="sm">
                  LIVE STREAM
                </Badge>
              </div>
            }
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeChartTab === 'flowMotor' ? (
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
                ) : (
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
                )}
              </ResponsiveContainer>
            </div>
          </Card>
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
