import React, { useEffect, useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Octagon,
  Gauge,
  Compass,
  Sliders,
  ShieldAlert,
  Zap,
  Droplets,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { DriveConcept } from '../types/vehicleMobility';

export const CrawlerMobilityController: React.FC = () => {
  const mobility = useSimulationStore((s) => s.mobilityTelemetry);
  const mobilityParams = useSimulationStore((s) => s.mobilityParams);
  const mobilityInputs = useSimulationStore((s) => s.mobilityInputs);
  const setMobilityInput = useSimulationStore((s) => s.setMobilityInput);
  const stopVehicle = useSimulationStore((s) => s.stopVehicle);
  const resetVehiclePosition = useSimulationStore((s) => s.resetVehiclePosition);
  const updateMobilityParams = useSimulationStore((s) => s.updateMobilityParams);

  const [isExpanded, setIsExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Keyboard navigation listeners (WASD / Arrows / Q / E / Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting input if typing in a text field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          e.preventDefault();
          setMobilityInput('forward', true);
          break;
        case 's':
        case 'arrowdown':
          e.preventDefault();
          setMobilityInput('reverse', true);
          break;
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          setMobilityInput('steerLeft', true);
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          setMobilityInput('steerRight', true);
          break;
        case 'q':
          e.preventDefault();
          setMobilityInput('pivotLeft', true);
          break;
        case 'e':
          e.preventDefault();
          setMobilityInput('pivotRight', true);
          break;
        case ' ':
        case 'x':
          e.preventDefault();
          stopVehicle();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setMobilityInput('forward', false);
          break;
        case 's':
        case 'arrowdown':
          setMobilityInput('reverse', false);
          break;
        case 'a':
        case 'arrowleft':
          setMobilityInput('steerLeft', false);
          break;
        case 'd':
        case 'arrowright':
          setMobilityInput('steerRight', false);
          break;
        case 'q':
          setMobilityInput('pivotLeft', false);
          break;
        case 'e':
          setMobilityInput('pivotRight', false);
          break;
        case ' ':
        case 'x':
          setMobilityInput('brake', false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setMobilityInput, stopVehicle]);

  return (
    <div className="bg-graphite-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl font-mono text-xs text-slate-200 w-80 select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-semibold text-slate-100">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>CRAWLER TRACK DRIVE</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded hover:bg-slate-800 transition ${
              showSettings ? 'text-amber-400' : 'text-slate-400'
            }`}
            title="Drive Configuration & Tuning"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 transition"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Safety Interlock Alert Banner */}
      {mobility.isInterlockBlocked && (
        <div className="mt-2 p-2 rounded-lg bg-rose-950/80 border border-rose-600/80 text-[10px] text-rose-200 flex items-start gap-1.5">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-rose-300">DRIVE INTERLOCK ENGAGED</div>
            <div className="text-rose-200/90 leading-tight mt-0.5">{mobility.interlockBlockReason}</div>
          </div>
        </div>
      )}

      {isExpanded && (
        <>
          {/* Telemetry Readouts Grid */}
          <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center">
            <div className="bg-graphite-900/80 p-1.5 rounded-lg border border-slate-800/80">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">SPEED</div>
              <div className="text-sm font-bold text-slate-100">
                {mobility.speedMs.toFixed(2)} <span className="text-[9px] font-normal text-slate-400">m/s</span>
              </div>
              <div className="text-[9px] text-slate-500">{mobility.speedKmh.toFixed(1)} km/h</div>
            </div>

            <div className="bg-graphite-900/80 p-1.5 rounded-lg border border-slate-800/80">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">HEADING</div>
              <div className="text-sm font-bold text-slate-100">
                {Math.round((mobility.headingDeg + 360) % 360)}°
              </div>
              <div className="text-[9px] text-slate-500">
                TILT {mobility.effectiveTiltDeg.toFixed(1)}°
              </div>
            </div>

            <div className="bg-graphite-900/80 p-1.5 rounded-lg border border-slate-800/80">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">GROUND P.</div>
              <div className="text-sm font-bold text-emerald-400">
                {mobility.groundPressureKpa.toFixed(1)} <span className="text-[9px] text-slate-400">kPa</span>
              </div>
              <div className="text-[9px] text-slate-500">LOW SINKAGE</div>
            </div>
          </div>

          {/* Interactive D-Pad Controls */}
          <div className="mt-3 flex flex-col items-center">
            {/* Row 1: Forward */}
            <div className="flex justify-center w-full">
              <button
                onMouseDown={() => setMobilityInput('forward', true)}
                onMouseUp={() => setMobilityInput('forward', false)}
                onMouseLeave={() => setMobilityInput('forward', false)}
                onTouchStart={() => setMobilityInput('forward', true)}
                onTouchEnd={() => setMobilityInput('forward', false)}
                disabled={mobility.isInterlockBlocked}
                className={`w-14 h-11 rounded-lg border flex flex-col items-center justify-center transition shadow-md ${
                  mobilityInputs.forward
                    ? 'bg-amber-500 text-white border-amber-400 scale-95 shadow-amber-500/30'
                    : 'bg-graphite-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Drive Forward (Key: W / Up)"
              >
                <ArrowUp className="w-4 h-4" />
                <span className="text-[8px] font-bold">FWD</span>
              </button>
            </div>

            {/* Row 2: Pivot Left | Steer Left | STOP | Steer Right | Pivot Right */}
            <div className="flex items-center gap-1.5 my-1.5 justify-center w-full">
              {/* Spin Pivot Left */}
              <button
                onMouseDown={() => setMobilityInput('pivotLeft', true)}
                onMouseUp={() => setMobilityInput('pivotLeft', false)}
                onMouseLeave={() => setMobilityInput('pivotLeft', false)}
                onTouchStart={() => setMobilityInput('pivotLeft', true)}
                onTouchEnd={() => setMobilityInput('pivotLeft', false)}
                disabled={mobility.isInterlockBlocked}
                className={`w-11 h-11 rounded-lg border flex flex-col items-center justify-center transition ${
                  mobilityInputs.pivotLeft
                    ? 'bg-cyan-600 text-white border-cyan-400 scale-95'
                    : 'bg-graphite-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Counter-Rotate Pivot Left (Key: Q)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[7px]">PIV L</span>
              </button>

              {/* Steer Left */}
              <button
                onMouseDown={() => setMobilityInput('steerLeft', true)}
                onMouseUp={() => setMobilityInput('steerLeft', false)}
                onMouseLeave={() => setMobilityInput('steerLeft', false)}
                onTouchStart={() => setMobilityInput('steerLeft', true)}
                onTouchEnd={() => setMobilityInput('steerLeft', false)}
                disabled={mobility.isInterlockBlocked}
                className={`w-11 h-11 rounded-lg border flex flex-col items-center justify-center transition ${
                  mobilityInputs.steerLeft
                    ? 'bg-amber-500 text-white border-amber-400 scale-95'
                    : 'bg-graphite-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Steer Left (Key: A / Left)"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[7px]">LEFT</span>
              </button>

              {/* Emergency Service Brake STOP Button */}
              <button
                onClick={stopVehicle}
                className="w-14 h-11 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white border border-rose-400 flex flex-col items-center justify-center shadow-lg shadow-rose-600/30 transition"
                title="Service Brake STOP (Key: Space)"
              >
                <Octagon className="w-4 h-4 text-white" />
                <span className="text-[9px] font-bold tracking-wider">STOP</span>
              </button>

              {/* Steer Right */}
              <button
                onMouseDown={() => setMobilityInput('steerRight', true)}
                onMouseUp={() => setMobilityInput('steerRight', false)}
                onMouseLeave={() => setMobilityInput('steerRight', false)}
                onTouchStart={() => setMobilityInput('steerRight', true)}
                onTouchEnd={() => setMobilityInput('steerRight', false)}
                disabled={mobility.isInterlockBlocked}
                className={`w-11 h-11 rounded-lg border flex flex-col items-center justify-center transition ${
                  mobilityInputs.steerRight
                    ? 'bg-amber-500 text-white border-amber-400 scale-95'
                    : 'bg-graphite-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Steer Right (Key: D / Right)"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="text-[7px]">RIGHT</span>
              </button>

              {/* Spin Pivot Right */}
              <button
                onMouseDown={() => setMobilityInput('pivotRight', true)}
                onMouseUp={() => setMobilityInput('pivotRight', false)}
                onMouseLeave={() => setMobilityInput('pivotRight', false)}
                onTouchStart={() => setMobilityInput('pivotRight', true)}
                onTouchEnd={() => setMobilityInput('pivotRight', false)}
                disabled={mobility.isInterlockBlocked}
                className={`w-11 h-11 rounded-lg border flex flex-col items-center justify-center transition ${
                  mobilityInputs.pivotRight
                    ? 'bg-cyan-600 text-white border-cyan-400 scale-95'
                    : 'bg-graphite-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Counter-Rotate Pivot Right (Key: E)"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[7px]">PIV R</span>
              </button>
            </div>

            {/* Row 3: Reverse */}
            <div className="flex justify-center w-full">
              <button
                onMouseDown={() => setMobilityInput('reverse', true)}
                onMouseUp={() => setMobilityInput('reverse', false)}
                onMouseLeave={() => setMobilityInput('reverse', false)}
                onTouchStart={() => setMobilityInput('reverse', true)}
                onTouchEnd={() => setMobilityInput('reverse', false)}
                disabled={mobility.isInterlockBlocked}
                className={`w-14 h-11 rounded-lg border flex flex-col items-center justify-center transition shadow-md ${
                  mobilityInputs.reverse
                    ? 'bg-amber-500 text-white border-amber-400 scale-95 shadow-amber-500/30'
                    : 'bg-graphite-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Drive Reverse (Key: S / Down)"
              >
                <ArrowDown className="w-4 h-4" />
                <span className="text-[8px] font-bold">REV</span>
              </button>
            </div>
          </div>

          {/* Quick Origin Reset & Keyboard Helper */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
            <button
              onClick={resetVehiclePosition}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
              title="Return crawler to origin staging coordinates [0, 0, 0]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Dock</span>
            </button>
            <span className="text-slate-500">Keys: WASD / Space</span>
          </div>

          {/* Settings & Tuning Drawer */}
          {showSettings && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-2 text-[10px]">
              <div className="font-bold text-slate-300 flex items-center justify-between">
                <span>DRIVE TUNING</span>
                <Badge variant="cyan" size="sm">
                  {mobilityParams.driveConcept === 'hydraulic' ? 'Dual Hydrostatic' : 'Dual Electric'}
                </Badge>
              </div>

              {/* Drive Concept Selection */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateMobilityParams({ driveConcept: 'hydraulic' })}
                  className={`flex-1 py-1 rounded text-center border transition flex items-center justify-center gap-1 ${
                    mobilityParams.driveConcept === 'hydraulic'
                      ? 'bg-blue-900/60 text-blue-200 border-blue-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Droplets className="w-3 h-3 text-blue-400" />
                  <span>Hydrostatic (Proposed)</span>
                </button>
                <button
                  onClick={() => updateMobilityParams({ driveConcept: 'electric' })}
                  className={`flex-1 py-1 rounded text-center border transition flex items-center justify-center gap-1 ${
                    mobilityParams.driveConcept === 'electric'
                      ? 'bg-amber-900/60 text-amber-200 border-amber-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Electric AC</span>
                </button>
              </div>

              {/* Max Speed Slider */}
              <div>
                <div className="flex justify-between text-slate-400">
                  <span>Max Speed</span>
                  <span className="text-slate-200">{mobilityParams.maxTravelSpeedMs.toFixed(1)} m/s</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.4"
                  step="0.1"
                  value={mobilityParams.maxTravelSpeedMs}
                  onChange={(e) => updateMobilityParams({ maxTravelSpeedMs: parseFloat(e.target.value) })}
                  className="w-full accent-safety-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Steering Sensitivity Slider */}
              <div>
                <div className="flex justify-between text-slate-400">
                  <span>Steer Sensitivity</span>
                  <span className="text-slate-200">{mobilityParams.steerSensitivity.toFixed(1)}×</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={mobilityParams.steerSensitivity}
                  onChange={(e) => updateMobilityParams({ steerSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-safety-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Engineering Mobility Disclaimer */}
              <div className="text-[9px] text-slate-500 bg-slate-900/80 p-1.5 rounded border border-slate-800 leading-tight">
                <span className="font-semibold text-slate-400">Model Assumption:</span> Continuous rubber crawler kinematics use Coulomb soil adhesion (μ = {mobility.currentTractionCoeff.toFixed(2)}) and rigid terrain clamping. Real-world climbing traction is not physically validated.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
