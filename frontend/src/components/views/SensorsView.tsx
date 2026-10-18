import React from 'react';
import {
  Activity,
  Gauge,
  Droplets,
  ShieldAlert,
  Flame,
  Zap,
  Thermometer,
  Radio,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  formatPressureKpa,
  formatFlowRate,
  formatVolume,
  formatPpm,
  formatPercent,
  formatVibration,
  formatTemp
} from '../../utils/units';

interface SensorChannelConfig {
  id: string;
  name: string;
  tag: string;
  category: string;
  unit: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  warnThreshold: number;
  alarmThreshold: number;
  isLowerAlarm?: boolean;
  protocol: string;
  samplingRate: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SensorsView: React.FC = () => {
  const telemetry = useSimulationStore((s) => s.telemetry);
  const parameters = useSimulationStore((s) => s.parameters);
  const status = useSimulationStore((s) => s.status);

  const channels: SensorChannelConfig[] = [
    {
      id: 'pt-101',
      name: 'Suction Vacuum Transducer',
      tag: 'PT-101',
      category: 'Hydraulics',
      unit: 'kPa',
      value: Math.abs(telemetry.suctionPressureKpa),
      displayValue: formatPressureKpa(telemetry.suctionPressureKpa),
      min: 0,
      max: 100,
      warnThreshold: 75,
      alarmThreshold: 85,
      protocol: '4-20 mA Hart',
      samplingRate: '50 Hz',
      icon: Gauge
    },
    {
      id: 'ft-201',
      name: 'Electromagnetic Slurry Flowmeter',
      tag: 'FT-201',
      category: 'Hydraulics',
      unit: 'm³/h',
      value: telemetry.extractionRateM3H,
      displayValue: formatFlowRate(telemetry.extractionRateM3H),
      min: 0,
      max: 40,
      warnThreshold: 32,
      alarmThreshold: 38,
      protocol: 'Modbus RTU / RS-485',
      samplingRate: '10 Hz',
      icon: Activity
    },
    {
      id: 'lt-301',
      name: 'Optical Laser Sludge Depth Sensor',
      tag: 'LT-301',
      category: 'Containment',
      unit: 'm',
      value: telemetry.sludgeLevelM,
      displayValue: `${telemetry.sludgeLevelM.toFixed(2)} m`,
      min: 0,
      max: parameters.initialSludgeDepthM,
      warnThreshold: 0.3,
      alarmThreshold: 0.1,
      isLowerAlarm: true,
      protocol: 'IO-Link Class B',
      samplingRate: '5 Hz',
      icon: Droplets
    },
    {
      id: 'at-401',
      name: 'Headspace Toxic Gas (H2S)',
      tag: 'AT-401',
      category: 'Atmospheric Safety',
      unit: 'ppm',
      value: telemetry.h2sConcentrationPpm,
      displayValue: formatPpm(telemetry.h2sConcentrationPpm),
      min: 0,
      max: 50,
      warnThreshold: 10,
      alarmThreshold: 20,
      protocol: 'WirelessHART (Mesh)',
      samplingRate: '1 Hz',
      icon: ShieldAlert
    },
    {
      id: 'at-402',
      name: 'Combustible Hydrocarbons (CH4)',
      tag: 'AT-402',
      category: 'Atmospheric Safety',
      unit: '% LEL',
      value: telemetry.ch4ConcentrationPct,
      displayValue: formatPercent(telemetry.ch4ConcentrationPct),
      min: 0,
      max: 5.0,
      warnThreshold: 1.0,
      alarmThreshold: 2.5,
      protocol: 'WirelessHART (Mesh)',
      samplingRate: '1 Hz',
      icon: Flame
    },
    {
      id: 'vt-501',
      name: 'Tri-Axial Bearing Accelerometer',
      tag: 'VT-501',
      category: 'Mechanical Vibration',
      unit: 'mm/s',
      value: telemetry.vibrationRmsMmS,
      displayValue: formatVibration(telemetry.vibrationRmsMmS),
      min: 0,
      max: 12.0,
      warnThreshold: 4.5,
      alarmThreshold: 7.1,
      protocol: 'ICP / IEPE Analog',
      samplingRate: '1000 Hz',
      icon: Radio
    },
    {
      id: 'tt-601',
      name: 'Pump Casing Thermocouple (Type K)',
      tag: 'TT-601',
      category: 'Thermal',
      unit: '°C',
      value: telemetry.slurryTemperatureC,
      displayValue: formatTemp(telemetry.slurryTemperatureC),
      min: -10,
      max: 90,
      warnThreshold: 65,
      alarmThreshold: 80,
      protocol: 'Pt100 RTD 3-wire',
      samplingRate: '2 Hz',
      icon: Thermometer
    },
    {
      id: 'et-701',
      name: 'Motor Active Power Transducer',
      tag: 'ET-701',
      category: 'Electrical',
      unit: 'kW',
      value: telemetry.motorPowerKw,
      displayValue: `${telemetry.motorPowerKw.toFixed(1)} kW`,
      min: 0,
      max: 18.0,
      warnThreshold: 13.5,
      alarmThreshold: 16.0,
      protocol: 'Current Transformer 5A',
      samplingRate: '20 Hz',
      icon: Zap
    }
  ];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-safety-500" />
            <span>Industrial Sensor & Telemetry Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time digital twin transducer stream mapped to physical process channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="safety" size="md">
            8 CHANNELS ONLINE
          </Badge>
          <Badge variant="cyan" size="md">
            POLLING: 100ms
          </Badge>
        </div>
      </div>

      {/* Grid of Sensor Instrument Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map((ch) => {
          const Icon = ch.icon;
          const isAlarm = ch.isLowerAlarm
            ? ch.value <= ch.alarmThreshold && status === 'running'
            : ch.value >= ch.alarmThreshold;
          const isWarn = ch.isLowerAlarm
            ? ch.value <= ch.warnThreshold && !isAlarm && status === 'running'
            : ch.value >= ch.warnThreshold && !isAlarm;

          const pct = Math.min(100, Math.max(0, ((ch.value - ch.min) / (ch.max - ch.min)) * 100));

          return (
            <Card
              key={ch.id}
              className={`transition-all duration-200 ${
                isAlarm
                  ? 'border-rose-600/70 bg-rose-950/20 shadow-rose-900/10'
                  : isWarn
                  ? 'border-amber-600/60 bg-amber-950/15'
                  : 'hover:border-slate-700'
              }`}
            >
              {/* Card Header with Instrument Tag */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isAlarm
                        ? 'bg-rose-950 text-rose-400'
                        : isWarn
                        ? 'bg-amber-950 text-amber-400'
                        : 'bg-graphite-950 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-safety-400 uppercase tracking-wider block">
                      {ch.tag}
                    </span>
                    <span className="text-[10px] text-slate-400">{ch.category}</span>
                  </div>
                </div>

                {isAlarm ? (
                  <Badge variant="danger" size="sm">
                    ALARM
                  </Badge>
                ) : isWarn ? (
                  <Badge variant="warning" size="sm">
                    WARNING
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>NORMAL</span>
                  </div>
                )}
              </div>

              {/* Channel Name */}
              <h3 className="text-xs font-semibold text-slate-200 mb-2 truncate" title={ch.name}>
                {ch.name}
              </h3>

              {/* Digital Readout */}
              <div className="flex items-baseline gap-1.5 my-2">
                <span
                  className={`text-2xl font-bold font-mono tracking-tight ${
                    isAlarm
                      ? 'text-rose-400'
                      : isWarn
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}
                >
                  {ch.displayValue}
                </span>
              </div>

              {/* Gauge Bar */}
              <div className="w-full mt-3 space-y-1">
                <div className="h-1.5 w-full bg-graphite-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isAlarm
                        ? 'bg-rose-500'
                        : isWarn
                        ? 'bg-amber-500'
                        : 'bg-safety-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>{ch.min} {ch.unit}</span>
                  <span className="text-slate-400">Warn: {ch.warnThreshold}</span>
                  <span>{ch.max} {ch.unit}</span>
                </div>
              </div>

              {/* Bus & Transducer Metadata */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{ch.protocol}</span>
                <span>{ch.samplingRate}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
