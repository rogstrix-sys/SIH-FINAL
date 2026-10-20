import React, { useState } from 'react';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Download,
  FileSpreadsheet,
  OctagonAlert,
  CheckCircle2,
  Trash2,
  Sliders,
  Layers,
  Droplets
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { downloadTelemetryCsv, downloadEventsCsv } from '../../utils/csvExport';

export const TelemetryAlarmsView: React.FC = () => {
  const telemetry = useSimulationStore((s) => s.telemetry);
  const telemetryHistory = useSimulationStore((s) => s.telemetryHistory);
  const alarms = useSimulationStore((s) => s.alarms);
  const interlocks = useSimulationStore((s) => s.interlocks);
  const alarmsActive = useSimulationStore((s) => s.alarmsActive);
  const eventLog = useSimulationStore((s) => s.eventLog);
  const clearEvents = useSimulationStore((s) => s.clearEvents);
  const triggerEmergencyStop = useSimulationStore((s) => s.triggerEmergencyStop);
  const triggerResolveFault = useSimulationStore((s) => s.triggerResolveFault);

  const [activeChartTab, setActiveChartTab] = useState<'flow' | 'vacuum' | 'power'>('flow');

  const isEmergencyStop =
    Boolean(alarms?.emergencyStopActive) || Boolean(interlocks?.emergencyStopLatched);

  const alarmItems = [
    {
      id: 'alm-estop',
      name: 'Emergency Stop Circuit (E-Stop)',
      active: isEmergencyStop,
      level: 'critical',
      desc: 'Hardware safety relay circuit tripped. High-pressure pump and tracks isolated.'
    },
    {
      id: 'alm-tank-full',
      name: 'Collection Tank Level Limit (>95%)',
      active: alarms?.collectionTankFull || false,
      level: 'warning',
      desc: 'Holding vessel at maximum capacity. Pumping shut off to prevent slurry spill.'
    },
    {
      id: 'alm-low-source',
      name: 'Septic Pit Low Level (<0.2m)',
      active: alarms?.lowSourceLevel || false,
      level: 'info',
      desc: 'Liquid layer depleted. Extraction completed.'
    },
    {
      id: 'alm-vacuum',
      name: 'Excessive Suction Vacuum (<-85 kPa)',
      active: alarms?.excessiveVacuum || false,
      level: 'warning',
      desc: 'Suction throat clogged or elevation head exceeds cavitation threshold.'
    },
    {
      id: 'alm-motor',
      name: 'Electric Drive Motor Thermal Overload (>90%)',
      active: alarms?.motorOverload || false,
      level: 'critical',
      desc: 'Pump electric motor temperature or stator current approaching thermal trip point.'
    }
  ];

  const interlockItems = [
    {
      id: 'int-stabilizers',
      label: 'Hydraulic Outriggers Deployed',
      active: interlocks?.isStabilized || false,
      desc: 'Chassis leveled and weight transferred off rubber tracks'
    },
    {
      id: 'int-transport-lock',
      label: 'Transport Retention Pins Armed',
      active: !interlocks?.emergencyStopLatched,
      desc: 'Compaction platen and boom stowed in road travel detents'
    },
    {
      id: 'int-venting',
      label: 'PVRV Tank Atmospheric Vent Open',
      active: true,
      desc: 'Prevents vacuum vessel implosion during high-head pumping'
    },
    {
      id: 'int-hose-seal',
      label: 'Camlock Vacuum Umbilical Latched',
      active: interlocks?.isDeployed || false,
      desc: 'Dual cam-arm interlock switches verified closed'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-graphite-950 p-4 sm:p-6 space-y-6">
      {/* Title & E-Stop Quick Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-safety-500" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Machine Telemetry, Safety Alarms & Event Logs
            </h2>
            <Badge variant={alarmsActive > 0 ? 'danger' : 'safety'} size="sm">
              {alarmsActive > 0 ? `${alarmsActive} ALARMS ACTIVE` : 'ALL SYSTEMS NOMINAL'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time physical telemetry logging, ISO 21876 safety interlock supervision, and event auditing.
          </p>
        </div>

        {/* Action Buttons: E-Stop & CSV Export */}
        <div className="flex items-center gap-2.5">
          {isEmergencyStop ? (
            <Button
              variant="outline"
              size="sm"
              onClick={triggerResolveFault}
              className="text-xs font-mono border-rose-500 text-rose-300 hover:bg-rose-950"
            >
              Acknowledge & Clear E-Stop
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={triggerEmergencyStop}
              className="text-xs font-mono font-bold"
            >
              <OctagonAlert className="w-3.5 h-3.5 mr-1.5 fill-current" /> EMERGENCY STOP
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadTelemetryCsv(telemetryHistory)}
            className="text-xs font-mono"
            title="Export full time-series telemetry data to CSV file"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Telemetry CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadEventsCsv(eventLog)}
            className="text-xs font-mono"
            title="Export chronological event logs to CSV file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Events CSV
          </Button>
        </div>
      </div>

      {/* Real-time Telemetry Charts */}
      <Card
        title="Physical Process Telemetry Streams"
        subtitle="Time-series log of slurry flow rate, vacuum pressure, and motor electrical load"
        icon={<Activity className="w-4 h-4 text-safety-500" />}
        headerAction={
          <div className="flex items-center gap-1.5 bg-graphite-950 p-0.5 rounded-lg border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setActiveChartTab('flow')}
              className={`px-2.5 py-1 rounded transition ${
                activeChartTab === 'flow' ? 'bg-safety-500 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Flow Rate (L/min)
            </button>
            <button
              onClick={() => setActiveChartTab('vacuum')}
              className={`px-2.5 py-1 rounded transition ${
                activeChartTab === 'vacuum' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vacuum (kPa)
            </button>
            <button
              onClick={() => setActiveChartTab('power')}
              className={`px-2.5 py-1 rounded transition ${
                activeChartTab === 'power' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Motor Power (kW)
            </button>
          </div>
        }
      >
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetryHistory} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={activeChartTab === 'flow' ? '#f97316' : activeChartTab === 'vacuum' ? '#06b6d4' : '#f59e0b'}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={activeChartTab === 'flow' ? '#f97316' : activeChartTab === 'vacuum' ? '#06b6d4' : '#f59e0b'}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis
                stroke={activeChartTab === 'flow' ? '#f97316' : activeChartTab === 'vacuum' ? '#06b6d4' : '#f59e0b'}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Area
                type="monotone"
                dataKey={activeChartTab === 'flow' ? 'flowRateLpm' : activeChartTab === 'vacuum' ? 'vacuum' : 'power'}
                stroke={activeChartTab === 'flow' ? '#f97316' : activeChartTab === 'vacuum' ? '#06b6d4' : '#f59e0b'}
                fill="url(#streamGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two Column Grid: Safety Alarms & Chronological Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alarms Matrix & Interlocks */}
        <div className="lg:col-span-6 space-y-5">
          <Card
            title="Safety Alarms & Trip Matrix"
            subtitle="Automated fail-safe supervision of pressure, temperature, and volume thresholds"
            icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
          >
            <div className="space-y-2.5 pt-1">
              {alarmItems.map((alm) => (
                <div
                  key={alm.id}
                  className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 font-mono text-xs ${
                    alm.active
                      ? 'bg-rose-950/80 border-rose-600 text-rose-200 animate-pulse'
                      : 'bg-graphite-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {alm.active ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block text-white">{alm.name}</span>
                      <span className="text-[11px] text-slate-400 block font-sans mt-0.5">{alm.desc}</span>
                    </div>
                  </div>
                  <Badge variant={alm.active ? 'danger' : 'slate'} size="sm" className="shrink-0">
                    {alm.active ? 'TRIPPED' : 'CLEAR'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Safety Interlocks Panel */}
          <Card
            title="Safety Interlocks Supervision"
            subtitle="Hardware electrical permissive interlocks enforcing zero hazardous operation"
            icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          >
            <div className="space-y-2.5 pt-1 font-mono text-xs">
              {interlockItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-graphite-900 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    {item.active ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-white block">{item.label}</span>
                      <span className="text-[11px] text-slate-400 font-sans block">{item.desc}</span>
                    </div>
                  </div>
                  <Badge variant={item.active ? 'safety' : 'warning'} size="sm">
                    {item.active ? 'PERMISSIVE' : 'INHIBITED'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Chronological Event Log */}
        <div className="lg:col-span-6 space-y-5">
          <Card
            title="Chronological Operating Event Log"
            subtitle={`${eventLog.length} sequential timestamped events recorded during session`}
            icon={<Clock className="w-4 h-4 text-cyan-400" />}
            headerAction={
              <Button
                variant="outline"
                size="sm"
                onClick={clearEvents}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
            }
          >
            <div className="h-[480px] overflow-y-auto pr-2 space-y-2.5 scrollbar-thin font-mono text-xs">
              {eventLog.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  No events logged yet. Execute machine actions to capture telemetry audit trail.
                </div>
              ) : (
                eventLog.map((evt) => {
                  const border = {
                    critical: 'border-l-4 border-l-rose-500 bg-rose-950/40 border-rose-900',
                    warning: 'border-l-4 border-l-amber-500 bg-amber-950/30 border-amber-900',
                    success: 'border-l-4 border-l-emerald-500 bg-emerald-950/30 border-emerald-900',
                    info: 'border-l-4 border-l-cyan-500 bg-graphite-900 border-slate-800'
                  }[evt.level];

                  return (
                    <div key={evt.id} className={`p-2.5 rounded-lg border ${border} transition hover:bg-graphite-850`}>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-slate-200 uppercase">{evt.source}</span>
                        <span>{evt.timestamp}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] font-sans leading-snug">{evt.message}</p>
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

export default TelemetryAlarmsView;
