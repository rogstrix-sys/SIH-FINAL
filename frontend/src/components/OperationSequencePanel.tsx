import React, { useState } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  OctagonAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Truck,
  ChevronRight,
  Lock,
  Unlock,
  Gauge,
  Layers,
  Filter,
  Check,
  X,
  Info,
  Zap,
  Radio,
  Anchor,
  Droplets,
  HardHat,
  Clock
} from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { WORKFLOW_STAGES, WorkflowStageId } from '../types/simulationEngine';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export const OperationSequencePanel: React.FC = () => {
  const operatingState = useSimulationStore((s) => s.operatingState);
  const status = useSimulationStore((s) => s.status);
  const engine = useSimulationStore((s) => s.engine);
  const telemetry = useSimulationStore((s) => s.telemetry);
  const materialBalance = useSimulationStore((s) => s.materialBalance);
  const mobilityTelemetry = useSimulationStore((s) => s.mobilityTelemetry);
  const compactionTelemetry = useSimulationStore((s) => s.compactionTelemetry);
  const interlocks = useSimulationStore((s) => s.interlocks);
  const alarms = useSimulationStore((s) => s.alarms);

  // Workflow Triggers
  const setWorkflowStage = useSimulationStore((s) => s.setWorkflowStage);
  const triggerAdvanceWorkflow = useSimulationStore((s) => s.triggerAdvanceWorkflow);
  const triggerTravel = useSimulationStore((s) => s.triggerTravel);
  const triggerPosition = useSimulationStore((s) => s.triggerPosition);
  const triggerStabilize = useSimulationStore((s) => s.triggerStabilize);
  const triggerDeployHose = useSimulationStore((s) => s.triggerDeployHose);
  const triggerPrime = useSimulationStore((s) => s.triggerPrime);
  const triggerExtract = useSimulationStore((s) => s.triggerExtract);
  const triggerSettle = useSimulationStore((s) => s.triggerSettle);
  const triggerCompact = useSimulationStore((s) => s.triggerCompact);
  const triggerSecure = useSimulationStore((s) => s.triggerSecure);
  const triggerTransportReady = useSimulationStore((s) => s.triggerTransportReady);
  const triggerDischarge = useSimulationStore((s) => s.triggerDischarge);
  const triggerEmergencyStop = useSimulationStore((s) => s.triggerEmergencyStop);
  const triggerResolveFault = useSimulationStore((s) => s.triggerResolveFault);
  const resetSimulation = useSimulationStore((s) => s.resetSimulation);

  // Selected stage for inspection (defaults to current state mapping or TRAVEL)
  const [inspectedStageId, setInspectedStageId] = useState<WorkflowStageId | null>(null);

  // Map operatingState to active WorkflowStageId
  const getActiveStageId = (): WorkflowStageId => {
    switch (operatingState) {
      case 'TRAVEL': return 'TRAVEL';
      case 'POSITION': return 'POSITION';
      case 'STABILIZE': return 'STABILIZE';
      case 'DEPLOY':
      case 'DEPLOYMENT':
      case 'DEPLOY_HOSE': return 'DEPLOY_HOSE';
      case 'PRIME':
      case 'PRIMING': return 'PRIME';
      case 'EXTRACT':
      case 'EXTRACTION': return 'EXTRACT';
      case 'SETTLE': return 'SETTLE';
      case 'COMPACT': return 'COMPACT';
      case 'SECURE': return 'SECURE';
      case 'TRANSPORT_READY': return 'TRANSPORT_READY';
      case 'DISCHARGE': return 'DISCHARGE';
      case 'COMPLETE': return 'COMPLETE';
      case 'IDLE': return 'TRAVEL';
      default: return 'EXTRACT';
    }
  };

  const currentStageId = getActiveStageId();
  const activeStageDef = WORKFLOW_STAGES.find((s) => s.id === (inspectedStageId || currentStageId)) || WORKFLOW_STAGES[0];
  const currentStageIndex = WORKFLOW_STAGES.findIndex((s) => s.id === currentStageId);

  // Interlock condition verification evaluator
  const evaluateCondition = (cond: string): { satisfied: boolean; detail: string } => {
    const c = cond.toLowerCase();
    if (c.includes('stabilizer') && c.includes('retract')) {
      const ok = engine.kinematics.stabilizerExtension < 0.05;
      return { satisfied: ok, detail: `${(engine.kinematics.stabilizerExtension * 100).toFixed(0)}% extension` };
    }
    if (c.includes('boom') && (c.includes('stowed') || c.includes('retract'))) {
      const ok = engine.kinematics.deployProgress < 0.05;
      return { satisfied: ok, detail: ok ? 'Stowed (0%)' : 'Articulated' };
    }
    if (c.includes('piston') && (c.includes('locked') || c.includes('pin'))) {
      const ok = compactionTelemetry.isTransportLocked && compactionTelemetry.strokeMm <= 5;
      return { satisfied: ok, detail: ok ? 'Pin LATCHED (0mm)' : 'Pin UNLOCKED' };
    }
    if (c.includes('e-stop') || c.includes('emergency')) {
      const ok = !alarms.emergencyStopActive && !interlocks.emergencyStopLatched;
      return { satisfied: ok, detail: ok ? 'DISARMED (Normal)' : 'TRIPPED (Latched)' };
    }
    if (c.includes('stationary') || c.includes('speed = 0')) {
      const ok = !mobilityTelemetry.isMoving && Math.abs(mobilityTelemetry.speedMs) < 0.01;
      return { satisfied: ok, detail: ok ? '0.00 m/s' : `${mobilityTelemetry.speedMs.toFixed(2)} m/s` };
    }
    if (c.includes('grounded') || (c.includes('stabilizer') && c.includes('1.0'))) {
      const ok = engine.kinematics.stabilizerExtension >= 0.95 || interlocks.isStabilized;
      return { satisfied: ok, detail: ok ? 'Grounded (100%)' : `${(engine.kinematics.stabilizerExtension * 100).toFixed(0)}%` };
    }
    if (c.includes('prime') || c.includes('vacuum integrity')) {
      const ok = interlocks.isPrimed;
      return { satisfied: ok, detail: ok ? 'Sealed & Primed' : 'Unprimed' };
    }
    if (c.includes('tank') && c.includes('95%')) {
      const ok = materialBalance.collectionFillPct < 95;
      return { satisfied: ok, detail: `${materialBalance.collectionFillPct.toFixed(1)}% full` };
    }
    if (c.includes('source') && c.includes('10')) {
      const ok = materialBalance.sourceVolumeL > 10;
      return { satisfied: ok, detail: `${materialBalance.sourceVolumeL.toFixed(0)} L` };
    }
    if (c.includes('pump stopped')) {
      const ok = !engine.kinematics.isMaterialFlowing && engine.kinematics.pumpShaftRpm < 10;
      return { satisfied: ok, detail: ok ? 'Stopped (0 RPM)' : `${engine.kinematics.pumpShaftRpm.toFixed(0)} RPM` };
    }
    if (c.includes('receiver') || c.includes('receiving')) {
      const ok = engine.parameters.receiverTankCapacityL > 0 && !interlocks.preventDischargeNoDestination;
      return { satisfied: ok, detail: ok ? 'Connected' : 'External Tanker Standby' };
    }
    return { satisfied: true, detail: 'Compliant' };
  };

  // Mobility & Compaction Blocks evaluation
  const isMobilityBlocked =
    engine.kinematics.stabilizerExtension > 0.05 ||
    engine.kinematics.deployProgress > 0.05 ||
    !compactionTelemetry.isTransportLocked ||
    compactionTelemetry.strokeMm > 5 ||
    operatingState === 'EXTRACT' ||
    operatingState === 'EXTRACTION' ||
    operatingState === 'DISCHARGE' ||
    operatingState === 'COMPACT' ||
    operatingState === 'FAULT';

  const mobilityBlockReason =
    engine.kinematics.stabilizerExtension > 0.05
      ? 'STABILIZERS EXTENDED — Retract all 4 outriggers before vehicle transit'
      : engine.kinematics.deployProgress > 0.05
      ? 'BOOM ARTICULATED — Stow crane arm and reel hose before vehicle transit'
      : (!compactionTelemetry.isTransportLocked || compactionTelemetry.strokeMm > 5)
      ? 'PLATEN NOT LOCKED — Retract cylinder to 0mm and latch transport retention pins'
      : (operatingState === 'EXTRACT' || operatingState === 'EXTRACTION' || operatingState === 'DISCHARGE')
      ? 'ACTIVE SLURRY TRANSFER — Stop pump before vehicle transit'
      : operatingState === 'COMPACT'
      ? 'ACTIVE COMPACTION — Complete dewatering stroke and secure platen before travel'
      : operatingState === 'FAULT'
      ? 'SYSTEM FAULT ACTIVE — Clear active fault latch before travel'
      : null;

  const isCompactionBlocked =
    mobilityTelemetry.isMoving ||
    operatingState === 'TRAVEL' ||
    (engine.kinematics.stabilizerExtension < 0.05 && !interlocks.isDeployed && !interlocks.isStabilized) ||
    operatingState === 'EXTRACT' ||
    operatingState === 'EXTRACTION' ||
    operatingState === 'DISCHARGE' ||
    alarms.emergencyStopActive;

  const compactionBlockReason =
    alarms.emergencyStopActive
      ? 'EMERGENCY STOP (E-STOP) ACTUATED — Cylinder hydraulic circuit isolated'
      : mobilityTelemetry.isMoving
      ? 'VEHICLE IN MOTION — Stationary compaction operation only'
      : (engine.kinematics.stabilizerExtension < 0.05 && !interlocks.isDeployed && !interlocks.isStabilized)
      ? 'STABILIZERS NOT GROUNDED — Extend outriggers to support chassis during compression'
      : (operatingState === 'EXTRACT' || operatingState === 'EXTRACTION' || operatingState === 'DISCHARGE')
      ? 'ACTIVE PUMP TRANSFER — Stop pump before piston compression'
      : null;

  // Active Fault diagnostics
  const isFault = operatingState === 'FAULT';
  const activeFaultMessage =
    alarms.emergencyStopActive
      ? 'EMERGENCY STOP (E-STOP) LATCHED: Hardware safety loop tripped. All actuators halted.'
      : alarms.pistonExcessivePressure
      ? 'PISTON OVERPRESSURE TRIP: Hydraulic platen pressure exceeded 210 bar safety threshold.'
      : alarms.pistonTravelLimitFault
      ? 'CYLINDER STROKE LIMIT: Mechanical piston travel exceeded maximum allowable 600 mm envelope.'
      : alarms.invalidVehicleMovement
      ? 'TRAVEL INTERLOCK VIOLATION: Vehicle drive command issued while machine not in secured transport configuration.'
      : alarms.collectionTankFull
      ? 'TANK OVERFILL INTERLOCK: Collection tank reached 100% capacity.'
      : alarms.excessiveVacuum
      ? 'EXCESSIVE VACUUM TRIP: Suction vacuum exceeded maximum rating.'
      : alarms.motorOverload
      ? 'MOTOR THERMAL OVERLOAD: Pump drive power exceeded allowable motor rating.'
      : 'SAFETY INTERLOCK VIOLATION: State transition denied due to unmet safety precondition.';

  return (
    <div className="bg-graphite-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 select-none font-sans text-slate-200">
      {/* Top Header & Master Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-safety-500 animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-mono">
              12-Stage Operating State Machine & Interlock Sequencer
            </h3>
            <Badge
              variant={isFault ? 'danger' : operatingState === 'COMPLETE' ? 'success' : status === 'running' ? 'safety' : 'cyan'}
              size="sm"
            >
              STATE: {operatingState}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic electro-hydraulic sequencing with strict hardware interlocks across transit, suction, dewatering, and discharge.
          </p>
        </div>

        {/* Global Control Button Toolbar */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          {isFault ? (
            <Button
              variant="primary"
              size="sm"
              onClick={triggerResolveFault}
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-300" />}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Acknowledge & Clear Fault
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={triggerAdvanceWorkflow}
              icon={<ArrowRight className="w-4 h-4" />}
              className="bg-safety-600 hover:bg-safety-500 text-white font-bold"
            >
              Advance Next Stage
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={resetSimulation}
            icon={<RotateCcw className="w-4 h-4" />}
            className="text-slate-400 hover:text-white"
          >
            Reset
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={triggerEmergencyStop}
            icon={<OctagonAlert className="w-4 h-4 text-white" />}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 shadow-lg shadow-rose-950/60"
          >
            E-STOP
          </Button>
        </div>
      </div>

      {/* Fault Alert Banner */}
      {isFault && (
        <div className="bg-rose-950/40 border border-rose-600/70 rounded-xl p-3 flex items-start gap-3 text-xs font-mono text-rose-200">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-rose-400 uppercase tracking-wide block">Interlock Tripped — Machine Latched in FAULT State</span>
            <p className="mt-0.5 text-slate-300">{activeFaultMessage}</p>
            <p className="mt-1 text-[11px] text-rose-300/80 italic">
              Correct physical safety condition, verify all transducers, then click &ldquo;Acknowledge & Clear Fault&rdquo; to resume IDLE standby.
            </p>
          </div>
        </div>
      )}

      {/* 12-Stage Visual Breadcrumbs / Stepper */}
      <div className="bg-graphite-950 border border-slate-800 rounded-xl p-3">
        <div className="text-[11px] text-slate-400 font-mono font-bold uppercase mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-white">
            <Activity className="w-3.5 h-3.5 text-safety-500" />
            Stage Progression Pipeline
          </span>
          <span className="text-cyan-400">
            Current: Stage {currentStageIndex + 1} of 12 ({WORKFLOW_STAGES[currentStageIndex]?.name || operatingState})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 font-mono">
          {WORKFLOW_STAGES.map((st, idx) => {
            const isCurrent = currentStageId === st.id;
            const isCompleted = currentStageIndex > idx;
            const isInspected = inspectedStageId === st.id;

            return (
              <button
                key={st.id}
                onClick={() => {
                  setInspectedStageId(st.id);
                  setWorkflowStage(st.id);
                }}
                className={`p-2 rounded-lg border text-left transition-all relative ${
                  isCurrent
                    ? 'border-safety-500 bg-safety-500/15 text-safety-400 font-bold shadow-md shadow-safety-500/20 ring-1 ring-safety-500'
                    : isCompleted
                    ? 'border-emerald-600/40 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/30'
                    : 'border-slate-800 bg-graphite-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                } ${isInspected ? 'outline outline-1 outline-cyan-400' : ''}`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="font-semibold text-slate-400">#{st.order}</span>
                  {isCurrent ? (
                    <span className="inline-block w-2 h-2 rounded-full bg-safety-400 animate-ping" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>
                <div className="text-xs font-bold truncate text-white">{st.label.replace(/^\d+\.\s*/, '')}</div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5">{st.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Selected Stage Requirements + Subsystems Real-Time Transducers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Inspected / Active Stage Invariants Checklist (7 Cols) */}
        <div className="lg:col-span-7 bg-graphite-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-[10px] text-safety-400 uppercase font-bold tracking-wider">
                Stage {activeStageDef.order} Specification
              </span>
              <h4 className="text-sm font-bold text-white uppercase">{activeStageDef.name}</h4>
            </div>
            <Badge variant={currentStageId === activeStageDef.id ? 'safety' : 'slate'} size="sm">
              {currentStageId === activeStageDef.id ? 'ACTIVE NOW' : 'SPECIFICATION'}
            </Badge>
          </div>

          <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
            {activeStageDef.description}
          </p>

          {/* Interlock Pre-Conditions Matrix */}
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Safety Interlock Pre-Conditions & Invariants
            </div>
            <div className="space-y-1.5">
              {activeStageDef.requiredConditions.map((cond, cIdx) => {
                const evalResult = evaluateCondition(cond);
                return (
                  <div
                    key={cIdx}
                    className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                      evalResult.satisfied
                        ? 'border-emerald-600/30 bg-emerald-950/20 text-emerald-300'
                        : 'border-amber-600/30 bg-amber-950/20 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {evalResult.satisfied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span>{cond}</span>
                    </div>
                    <span className="text-[10px] font-bold shrink-0 ml-2 text-slate-400">
                      {evalResult.detail}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stage Execution Buttons */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Stage Action:</span>
            {currentStageId === 'TRAVEL' && (
              <Button size="sm" variant="secondary" onClick={triggerPosition} icon={<ChevronRight className="w-3.5 h-3.5" />}>
                Halt & Position at Site
              </Button>
            )}
            {currentStageId === 'POSITION' && (
              <Button size="sm" variant="secondary" onClick={triggerStabilize} icon={<Anchor className="w-3.5 h-3.5" />}>
                Deploy 4x Outriggers
              </Button>
            )}
            {currentStageId === 'STABILIZE' && (
              <Button size="sm" variant="secondary" onClick={triggerDeployHose} icon={<Layers className="w-3.5 h-3.5" />}>
                Deploy Crane & Hose
              </Button>
            )}
            {currentStageId === 'DEPLOY_HOSE' && (
              <Button size="sm" variant="secondary" onClick={triggerPrime} icon={<Zap className="w-3.5 h-3.5" />}>
                Prime Suction Core
              </Button>
            )}
            {currentStageId === 'PRIME' && (
              <Button size="sm" variant="primary" onClick={triggerExtract} icon={<Play className="w-3.5 h-3.5" />}>
                Start Sludge Extraction
              </Button>
            )}
            {currentStageId === 'EXTRACT' && (
              <Button size="sm" variant="secondary" onClick={triggerSettle} icon={<Clock className="w-3.5 h-3.5" />}>
                Stop Pump & Settle
              </Button>
            )}
            {currentStageId === 'SETTLE' && (
              <Button size="sm" variant="primary" onClick={triggerCompact} icon={<Filter className="w-3.5 h-3.5" />}>
                Begin Hydraulic Dewatering
              </Button>
            )}
            {currentStageId === 'COMPACT' && (
              <Button size="sm" variant="secondary" onClick={triggerSecure} icon={<Lock className="w-3.5 h-3.5" />}>
                Retract & Lock Platen
              </Button>
            )}
            {currentStageId === 'SECURE' && (
              <Button size="sm" variant="secondary" onClick={triggerTransportReady} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Confirm Transport Ready
              </Button>
            )}
            {currentStageId === 'TRANSPORT_READY' && (
              <>
                <Button size="sm" variant="primary" onClick={triggerDischarge} icon={<Droplets className="w-3.5 h-3.5" />}>
                  Discharge to External Tanker
                </Button>
                <Button size="sm" variant="secondary" onClick={triggerTravel} icon={<Truck className="w-3.5 h-3.5" />}>
                  Drive to Depot (Travel)
                </Button>
              </>
            )}
            {currentStageId === 'DISCHARGE' && (
              <Button size="sm" variant="secondary" onClick={() => setWorkflowStage('COMPLETE')} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Complete Cycle
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Hardware Subsystem Safety & Invariant Status (5 Cols) */}
        <div className="lg:col-span-5 space-y-3 font-mono text-xs">
          {/* Subsystem 1: Tracked Mobility Invariant */}
          <div className="bg-graphite-950 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                Tracked Mobility Invariant
              </span>
              <Badge variant={isMobilityBlocked ? 'danger' : 'success'} size="sm">
                {isMobilityBlocked ? 'TRANSIT PROHIBITED' : 'TRAVEL AUTHORIZED'}
              </Badge>
            </div>
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Speed / Heading:</span>
                <span className="font-bold">{mobilityTelemetry.speedMs.toFixed(2)} m/s | {(mobilityTelemetry.headingRad * 57.2958).toFixed(1)}°</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Ground Load:</span>
                <span className="font-bold">{mobilityTelemetry.groundPressureKpa.toFixed(1)} kPa</span>
              </div>
              {isMobilityBlocked && mobilityBlockReason && (
                <div className="text-[10px] text-rose-400 font-sans border-t border-slate-800/80 pt-1 mt-1">
                  ⛔ {mobilityBlockReason}
                </div>
              )}
            </div>
          </div>

          {/* Subsystem 2: Hydraulic Compactor Invariant */}
          <div className="bg-graphite-950 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-safety-400" />
                Compaction Invariant
              </span>
              <Badge variant={isCompactionBlocked ? 'danger' : 'success'} size="sm">
                {isCompactionBlocked ? 'COMPACTION BLOCKED' : 'COMPACTOR ARMED'}
              </Badge>
            </div>
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Piston Stroke / Max:</span>
                <span className="font-bold">{compactionTelemetry.strokeMm.toFixed(1)} / 600 mm</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Hydraulic Pressure:</span>
                <span className="font-bold">{compactionTelemetry.appliedPressureBar.toFixed(1)} bar (Limit: 210)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Retention Pin:</span>
                <span className={`font-bold ${compactionTelemetry.isTransportLocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {compactionTelemetry.isTransportLocked ? 'LATCHED (Transport Safe)' : 'DISENGAGED (Operating)'}
                </span>
              </div>
              {isCompactionBlocked && compactionBlockReason && (
                <div className="text-[10px] text-rose-400 font-sans border-t border-slate-800/80 pt-1 mt-1">
                  ⛔ {compactionBlockReason}
                </div>
              )}
            </div>
          </div>

          {/* Subsystem 3: Slurry Mass Balance */}
          <div className="bg-graphite-950 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                Strict Mass Balance
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                Δ = {materialBalance.massBalanceDiscrepancyL.toFixed(3)} L
              </span>
            </div>
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Source Vault:</span>
                <span className="font-bold">{materialBalance.sourceVolumeL.toFixed(0)} L</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Mobile Tank:</span>
                <span className="font-bold">{materialBalance.collectionVolumeL.toFixed(0)} L ({materialBalance.collectionFillPct.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Receiving Tanker:</span>
                <span className="font-bold">{materialBalance.receiverVolumeL.toFixed(0)} L</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
