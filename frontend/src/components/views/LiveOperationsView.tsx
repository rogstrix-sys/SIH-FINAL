import React from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  OctagonAlert,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Gauge,
  Flame,
  ShieldAlert,
  Droplets,
  Layers,
  Thermometer,
  Clock,
  Radio,
  ArrowRightCircle
} from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatPressureKpa, formatFlowRate, formatVolume, formatPpm, formatPercent, formatVibration, formatDuration } from '../../utils/units';
import { OperationSequencePanel } from '../OperationSequencePanel';

export const LiveOperationsView: React.FC = () => {
  const status = useSimulationStore((s) => s.status);
  const operatingState = useSimulationStore((s) => s.operatingState);
  const telemetry = useSimulationStore((s) => s.telemetry);
  const materialBalance = useSimulationStore((s) => s.materialBalance);
  const alarms = useSimulationStore((s) => s.alarms);
  const interlocks = useSimulationStore((s) => s.interlocks);
  const alarmsActive = useSimulationStore((s) => s.alarmsActive);
  const eventLog = useSimulationStore((s) => s.eventLog);
  const simSpeed = useSimulationStore((s) => s.simSpeed);

  // Actions
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const pauseSimulation = useSimulationStore((s) => s.pauseSimulation);
  const resumeSimulation = useSimulationStore((s) => s.resumeSimulation);
  const resetSimulation = useSimulationStore((s) => s.resetSimulation);
  const triggerEmergencyStop = useSimulationStore((s) => s.triggerEmergencyStop);
  const triggerResolveFault = useSimulationStore((s) => s.triggerResolveFault);
  const triggerManualDischarge = useSimulationStore((s) => s.triggerManualDischarge);
  const setSimSpeed = useSimulationStore((s) => s.setSimSpeed);

  const isFault = operatingState === 'FAULT';

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto bg-graphite-950 select-none">
      {/* Top Banner */}
      <div className="bg-graphite-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-safety-500" />
            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-mono">
              Live Operations & Machine Sequencing Console
            </h2>
            <Badge variant="cyan" size="sm">
              TELEMETRY BUS
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-stage machine state execution, hazardous sewer gas safety matrix, and emergency trip interlocks.
          </p>
        </div>

        {/* Master Control Button Strip */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          {operatingState !== 'FAULT' ? (
            <Button
              variant={status === 'running' ? 'secondary' : 'primary'}
              size="sm"
              onClick={status === 'running' ? pauseSimulation : status === 'paused' ? resumeSimulation : startSimulation}
              icon={status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            >
              {status === 'running' ? 'Pause Sequence' : status === 'paused' ? 'Resume Sequence' : 'Start Sequence'}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={triggerResolveFault}
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-300" />}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Acknowledge & Clear Fault
            </Button>
          )}

          {operatingState === 'EXTRACT' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={triggerManualDischarge}
              icon={<ArrowRightCircle className="w-4 h-4 text-sky-400" />}
              className="border-sky-600/40 text-sky-300 hover:bg-sky-950/40"
            >
              Discharge
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

      {/* 12-Stage Operating Sequence & Interlock Panel */}
      <OperationSequencePanel />

      {/* Main Grid: Gas Matrix + Active Interlocks + Key Transducers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Hazardous Sewer Atmosphere Matrix (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card title="OSHA/NIOSH Sewer Atmosphere Safety Matrix">
            <div className="space-y-3 font-mono text-xs">
              <p className="text-[11px] text-slate-400">
                Continuous optical & electrochemical gas monitoring inside the septic pit collar and machine operator breathing zone.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* H2S Monitor */}
                <div className="p-3 rounded-xl bg-graphite-950 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">H₂S Toxic Gas</span>
                    <ShieldAlert className={`w-4 h-4 ${telemetry.h2sConcentrationPpm > 10 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                  </div>
                  <div className="text-xl font-bold text-white my-1">
                    {telemetry.h2sConcentrationPpm.toFixed(1)} <span className="text-xs text-slate-400">ppm</span>
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Threshold: &lt;10 ppm nominal | &gt;20 ppm evacuation
                  </div>
                </div>

                {/* CH4 Explosive LEL */}
                <div className="p-3 rounded-xl bg-graphite-950 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">CH₄ Combustible</span>
                    <Flame className={`w-4 h-4 ${telemetry.ch4ConcentrationPct > 1.0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                  </div>
                  <div className="text-xl font-bold text-amber-300 my-1">
                    {telemetry.ch4ConcentrationPct.toFixed(2)} <span className="text-xs text-slate-400">%</span>
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Lower Explosive Limit: &gt;1.5% LEL trip
                  </div>
                </div>

                {/* CO Toxic Gas */}
                <div className="p-3 rounded-xl bg-graphite-950 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">CO Gas Matrix</span>
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-xl font-bold text-cyan-300 my-1">
                    {telemetry.coConcentrationPpm.toFixed(1)} <span className="text-xs text-slate-400">ppm</span>
                  </div>
                  <div className="text-[9px] text-slate-400">
                    OSHA PEL: &lt;35 ppm 8-hr TWA
                  </div>
                </div>
              </div>

              {/* Status Compliance Banner */}
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Operator Atmosphere Rating: HAZ-ZONE 1 SAFE
                </span>
                <span className="text-[10px] text-slate-400">Ventilation Aux Active</span>
              </div>
            </div>
          </Card>

          {/* Active Safety Interlocks Diagnostics */}
          <Card title="Hardware Interlock & Safety Latch Status">
            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800 flex items-center justify-between">
                <span>Outrigger Stabilizers Deployed:</span>
                <Badge variant={interlocks.isDeployed ? 'success' : 'warning'} size="sm">
                  {interlocks.isDeployed ? 'LOCKED' : 'RETRACTED'}
                </Badge>
              </div>

              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800 flex items-center justify-between">
                <span>Pump Chamber Primed:</span>
                <Badge variant={interlocks.isPrimed ? 'success' : 'slate'} size="sm">
                  {interlocks.isPrimed ? 'PRIMED' : 'UNPRIMED'}
                </Badge>
              </div>

              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800 flex items-center justify-between">
                <span>Collection Vessel Capacity:</span>
                <Badge variant={interlocks.preventExtractTankFull ? 'danger' : 'success'} size="sm">
                  {materialBalance.collectionFillPct.toFixed(0)}% FULL
                </Badge>
              </div>

              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800 flex items-center justify-between">
                <span>Emergency Stop Latch:</span>
                <Badge variant={interlocks.emergencyStopLatched ? 'danger' : 'success'} size="sm">
                  {interlocks.emergencyStopLatched ? 'TRIPPED' : 'ARMED'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Real-Time Mechanical Telemetry Grid (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card title="Key Transducer Channels & Power Diagnostics">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Suction Vacuum</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {formatPressureKpa(telemetry.suctionPressureKpa)}
                </div>
                <div className="text-[9px] text-slate-400">Tag: PT-101 (Inlet)</div>
              </div>

              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Extraction Flow</div>
                <div className="text-base font-bold text-safety-400 mt-0.5">
                  {(telemetry.extractionRateM3H * (1000 / 60)).toFixed(1)} L/min
                </div>
                <div className="text-[9px] text-slate-400">Tag: FT-101 (Magnetic)</div>
              </div>

              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Motor Load Power</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5">
                  {telemetry.motorPowerKw.toFixed(1)} kW
                </div>
                <div className="text-[9px] text-slate-400">Tag: PW-101 (Inverter)</div>
              </div>

              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Vibration Severity</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {telemetry.vibrationRmsMmS.toFixed(2)} mm/s
                </div>
                <div className="text-[9px] text-slate-400">ISO 10816 Zone A</div>
              </div>

              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Cavitation Index</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">
                  {telemetry.cavitationIndex.toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-400">Margin: Nominal &lt;0.60</div>
              </div>

              <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Slurry Temperature</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {telemetry.slurryTemperatureC.toFixed(1)} °C
                </div>
                <div className="text-[9px] text-slate-400">Tag: TT-101 (Core)</div>
              </div>
            </div>
          </Card>

          {/* Audit Event History */}
          <Card title="Live Operating Audit Log">
            <div className="h-44 overflow-y-auto space-y-1 font-mono text-[10px]">
              {eventLog.slice(0, 15).map((evt) => (
                <div
                  key={evt.id}
                  className="p-1.5 rounded bg-graphite-950 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-400">{evt.timestamp}</span>
                    <span
                      className={`font-semibold uppercase ${
                        evt.level === 'critical'
                          ? 'text-rose-400'
                          : evt.level === 'warning'
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      [{evt.source}]
                    </span>
                    <span className="text-slate-200 truncate">{evt.message}</span>
                  </div>
                  <Badge variant={evt.level === 'critical' ? 'danger' : evt.level === 'warning' ? 'warning' : 'slate'} size="sm">
                    {evt.level}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
