import React from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  CheckCircle2,
  Gauge,
  Activity,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { DEMO_STAGES } from '../simulation/guidedDemoData';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export const GuidedDemoTour: React.FC = () => {
  const guidedDemo = useSimulationStore((s) => s.guidedDemo);
  const stopGuidedDemo = useSimulationStore((s) => s.stopGuidedDemo);
  const nextDemoStage = useSimulationStore((s) => s.nextDemoStage);
  const prevDemoStage = useSimulationStore((s) => s.prevDemoStage);
  const setDemoStage = useSimulationStore((s) => s.setDemoStage);
  const toggleDemoAutoAdvance = useSimulationStore((s) => s.toggleDemoAutoAdvance);
  const operatingState = useSimulationStore((s) => s.operatingState);
  const isPaused = useSimulationStore((s) => s.engine.isPaused);
  const pauseSimulation = useSimulationStore((s) => s.pauseSimulation);
  const resumeSimulation = useSimulationStore((s) => s.resumeSimulation);

  if (!guidedDemo.isActive) return null;

  const currentStage = DEMO_STAGES[guidedDemo.currentStageIndex] || DEMO_STAGES[0];
  const isLastStage = guidedDemo.currentStageIndex === DEMO_STAGES.length - 1;
  const isFirstStage = guidedDemo.currentStageIndex === 0;

  return (
    <div className="absolute top-3 left-3 right-3 sm:left-6 sm:right-6 z-40 max-w-4xl mx-auto animate-fade-in pointer-events-auto">
      <div className="bg-graphite-950/95 border border-safety-500/50 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-slate-100 ring-1 ring-white/10">
        {/* Top Header Strip */}
        <div className="bg-gradient-to-r from-safety-950/70 via-graphite-900 to-graphite-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-safety-500/20 border border-safety-500/40 flex items-center justify-center text-safety-400">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-safety-400">
                  Interactive Guided Demonstration
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  Step {guidedDemo.currentStageIndex + 1} of {DEMO_STAGES.length}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {currentStage.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={stopGuidedDemo}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
              title="Exit Guided Demonstration"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stepper Dots Bar for 12 Stages */}
        <div className="px-3 py-1.5 bg-graphite-900/60 border-b border-slate-800/80 grid grid-cols-6 sm:grid-cols-12 gap-1 overflow-x-auto">
          {DEMO_STAGES.map((stg, idx) => {
            const isCompleted = idx < guidedDemo.currentStageIndex;
            const isCurrent = idx === guidedDemo.currentStageIndex;
            return (
              <button
                key={stg.id}
                onClick={() => setDemoStage(idx)}
                className={`flex flex-col text-left px-1.5 py-1 rounded transition-all ${
                  isCurrent
                    ? 'bg-safety-500/15 border border-safety-500/50 text-white'
                    : isCompleted
                    ? 'bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-slate-400'
                    : 'bg-transparent hover:bg-slate-800/30 text-slate-500 border border-transparent'
                }`}
                title={stg.title}
              >
                <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
                  <span className={isCurrent ? 'text-safety-400 font-bold' : ''}>
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                </div>
                <span className="text-[9px] font-medium truncate hidden md:inline">
                  {stg.id === 'project_objective'
                    ? '1. Objective'
                    : stg.id === 'component_inspection'
                    ? '2. Inspect'
                    : stg.id === 'scenario_selection'
                    ? '3. Scenario'
                    : stg.id === 'feasibility_assessment'
                    ? '4. Feasibility'
                    : stg.id === 'deployment_positioning'
                    ? '5. Deploy'
                    : stg.id === 'priming_extraction'
                    ? '6. Extract'
                    : stg.id === 'live_dashboard'
                    ? '7. Dashboard'
                    : stg.id === 'alarm_estop_demo'
                    ? '8. E-Stop'
                    : stg.id === 'discharge_mass_balance'
                    ? '9. Discharge'
                    : stg.id === 'scenario_comparison'
                    ? '10. Compare'
                    : stg.id === 'hardware_bom_test_plan'
                    ? '11. BOM/Tests'
                    : '12. Report'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stage Content Body */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column: Description & Engineering Context */}
          <div className="md:col-span-7 space-y-3">
            <div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {currentStage.overview}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-graphite-900/80 border border-slate-800 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-semibold mb-1">
                <Info className="w-3.5 h-3.5" />
                <span>ENGINEERING CONTEXT & FIRST PRINCIPLES</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                {currentStage.engineeringContext}
              </p>
            </div>
          </div>

          {/* Right Column: Parameters & Monitored Sensors */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-safety-400" />
                <span>Operational Indicators</span>
              </div>
              <ul className="space-y-1">
                {currentStage.keyMetrics.map((metric, i) => (
                  <li key={i} className="text-[11px] font-mono text-slate-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-safety-400" />
                    <span>{metric}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-mono text-slate-400">Sensors:</span>
              {currentStage.sensors.map((sensor, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/50 text-[10px] font-mono text-cyan-300"
                >
                  {sensor}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Controls & Progress Timer Bar */}
        <div className="px-4 py-2.5 bg-graphite-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Progress bar */}
          <div className="flex-1 min-w-[140px] flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-safety-500 to-cyan-400 transition-all duration-150"
                style={{ width: `${guidedDemo.stageProgressPct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
              {guidedDemo.stageElapsedSec.toFixed(1)}s / {currentStage.durationSec}s
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Auto-advance toggle */}
            <button
              onClick={toggleDemoAutoAdvance}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition flex items-center gap-1 ${
                guidedDemo.isAutoAdvancing
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Automatically advance to subsequent stage when timer completes"
            >
              <span>Auto-Advance: {guidedDemo.isAutoAdvancing ? 'ON' : 'PAUSED'}</span>
            </button>

            {/* Pause/Resume Sim button */}
            <button
              onClick={isPaused ? resumeSimulation : pauseSimulation}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1"
            >
              {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {/* Previous */}
            <button
              onClick={prevDemoStage}
              disabled={isFirstStage}
              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-graphite-800 border border-slate-700 text-slate-200 hover:bg-graphite-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {/* Next / Finish */}
            <Button
              variant="primary"
              size="sm"
              onClick={nextDemoStage}
              icon={isLastStage ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              className="text-xs font-mono"
            >
              {isLastStage ? 'Finish Tour' : 'Next Stage'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
