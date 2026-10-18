import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  FastForward,
  AlertTriangle,
  Clock,
  Layers
} from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Button } from './ui/Button';
import { StatusIndicator } from './ui/StatusIndicator';
import { Badge } from './ui/Badge';
import { formatDuration } from '../utils/units';

export const Header: React.FC = () => {
  const status = useSimulationStore((s) => s.status);
  const elapsedTime = useSimulationStore((s) => s.telemetry.elapsedTimeSeconds);
  const simSpeed = useSimulationStore((s) => s.simSpeed);
  const alarmsActive = useSimulationStore((s) => s.alarmsActive);
  
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const pauseSimulation = useSimulationStore((s) => s.pauseSimulation);
  const resumeSimulation = useSimulationStore((s) => s.resumeSimulation);
  const resetSimulation = useSimulationStore((s) => s.resetSimulation);
  const stepSimulation = useSimulationStore((s) => s.stepSimulation);
  const setSimSpeed = useSimulationStore((s) => s.setSimSpeed);

  const toggleRun = () => {
    if (status === 'running') {
      pauseSimulation();
    } else if (status === 'paused') {
      resumeSimulation();
    } else {
      startSimulation();
    }
  };

  const nextSpeed = () => {
    if (simSpeed === 1) setSimSpeed(2);
    else if (simSpeed === 2) setSimSpeed(5);
    else if (simSpeed === 5) setSimSpeed(0.5);
    else setSimSpeed(1);
  };

  return (
    <header className="h-16 bg-graphite-950 border-b border-slate-800/90 px-4 sm:px-6 flex items-center justify-between z-30 select-none shadow-md shrink-0">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-graphite-900 border border-safety-500/30 flex items-center justify-center text-safety-500 shadow-inner">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>Desludge Digital Twin</span>
            </h1>
            <Badge variant="safety" size="sm">
              ENGINEERING v2.4
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 font-mono hidden md:block">
            Autonomous Slurry Hydro-Mechanics & Confined Space Robotics
          </p>
        </div>
      </div>

      {/* Center: System Status & Telemetry Indicators */}
      <div className="flex items-center gap-3">
        {/* Simulation Status */}
        <StatusIndicator
          status={status}
          label={status === 'running' ? 'OPERATIONAL' : status}
          size="sm"
        />

        {/* Connection Indicator labelled SIMULATED */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-700/40 bg-cyan-950/40 text-cyan-400 font-mono text-[11px]"
          title="Telemetry stream connected to internal deterministic simulation engine"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="font-semibold tracking-wider uppercase">SIMULATED</span>
        </div>

        {/* Active Alarms Counter */}
        {alarmsActive > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rose-600/50 bg-rose-950/60 text-rose-300 font-mono text-[11px] animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{alarmsActive} ALARM{alarmsActive > 1 ? 'S' : ''}</span>
          </div>
        )}

        {/* Elapsed Simulation Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-graphite-900 text-slate-300 font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDuration(elapsedTime)}</span>
        </div>
      </div>

      {/* Right: Master Simulation Controls */}
      <div className="flex items-center gap-2">
        {/* Start / Pause Button */}
        <Button
          variant={status === 'running' ? 'secondary' : 'primary'}
          size="sm"
          onClick={toggleRun}
          icon={status === 'running' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          title={status === 'running' ? 'Pause Simulation' : 'Start Simulation'}
        >
          {status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Run'}
        </Button>

        {/* Step Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => stepSimulation(1.0)}
          icon={<StepForward className="w-3.5 h-3.5" />}
          title="Advance by 1 second"
          disabled={status === 'running'}
        >
          <span className="hidden sm:inline">Step</span>
        </Button>

        {/* Speed Selector */}
        <Button
          variant="secondary"
          size="sm"
          onClick={nextSpeed}
          icon={<FastForward className="w-3.5 h-3.5" />}
          title={`Cycle speed multiplier (current: ${simSpeed}x)`}
        >
          <span>{simSpeed}x</span>
        </Button>

        {/* Reset Action */}
        <Button
          variant="secondary"
          size="sm"
          onClick={resetSimulation}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          title="Reset simulation parameters and telemetry to baseline"
          className="text-slate-400 hover:text-white"
        >
          <span className="hidden md:inline">Reset</span>
        </Button>
      </div>
    </header>
  );
};
