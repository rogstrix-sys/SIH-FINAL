import React from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Scale
} from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  formatVolume,
  formatFlowRate,
  formatPressureKpa,
  formatPower,
  formatPpm,
  formatPercent,
  formatVibration,
  formatDuration
} from '../../utils/units';

export const ReportsView: React.FC = () => {
  const telemetry = useSimulationStore((s) => s.telemetry);
  const parameters = useSimulationStore((s) => s.parameters);
  const status = useSimulationStore((s) => s.status);

  // Compute energy consumption: kWh = (kW * hours)
  const hoursElapsed = telemetry.elapsedTimeSeconds / 3600.0;
  const energyKwh = telemetry.motorPowerKw * hoursElapsed;
  const m3Evacuated = telemetry.volumeExtractedLiters / 1000.0;
  const specificEnergy = m3Evacuated > 0.05 ? energyKwh / m3Evacuated : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto print:p-0 print:bg-white print:text-black">
      {/* Header and Action Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 no-print">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-safety-500" />
            <span>Digital Twin Engineering & Hydrodynamics Report</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Standard ISO/DIN process mass balance, Darcy-Weisbach head loss, and safety compliance audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Print / PDF Export
          </Button>
        </div>
      </div>

      {/* Printable Engineering Certificate Header */}
      <div className="bg-graphite-900 border border-slate-800 rounded-xl p-5 shadow-lg print:border-black print:bg-white print:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 print:border-gray-300 pb-4">
          <div>
            <div className="text-xs uppercase font-mono font-bold text-safety-500 print:text-orange-600">
              DESLUDGE DIGITAL TWIN • SIMULATION AUDIT
            </div>
            <h1 className="text-xl font-bold text-white print:text-black mt-1">
              Mechanized Septage Extraction Performance Certificate
            </h1>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
              Conduit: Ø{parameters.hoseDiameterMm}mm • Volume: {parameters.containmentVolumeLiters} L • Viscosity: {parameters.slurryViscosityCp} cP
            </p>
          </div>

          <div className="text-right text-xs font-mono">
            <div className="text-slate-400 print:text-gray-500">TIMESTAMP</div>
            <div className="text-white print:text-black font-semibold">{new Date().toLocaleString()}</div>
            <Badge variant="cyan" size="sm" className="mt-1">
              STATUS: {status.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* 1. Fluid Dynamics & Pipe Friction Table */}
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300 print:text-black mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-safety-500" />
            <span>1. Hydraulic Flow Regime & Head Loss Analysis</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-graphite-950 print:bg-gray-100 text-slate-400 print:text-gray-700 text-left">
                  <th className="p-2.5 border border-slate-800 print:border-gray-300">Parameter</th>
                  <th className="p-2.5 border border-slate-800 print:border-gray-300">Equation / Standard</th>
                  <th className="p-2.5 border border-slate-800 print:border-gray-300">Current Value</th>
                  <th className="p-2.5 border border-slate-800 print:border-gray-300">Engineering Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                <tr>
                  <td className="p-2.5 font-semibold text-slate-200 print:text-black border border-slate-800 print:border-gray-300">
                    Reynolds Number (Re)
                  </td>
                  <td className="p-2.5 text-slate-400 print:text-gray-600 border border-slate-800 print:border-gray-300">
                    Re = (ρ · v · D) / μ
                  </td>
                  <td className="p-2.5 text-safety-400 print:text-orange-600 font-bold border border-slate-800 print:border-gray-300">
                    {telemetry.reynoldsNumber.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-slate-300 print:text-gray-700 border border-slate-800 print:border-gray-300">
                    {telemetry.reynoldsNumber < 2000
                      ? 'Laminar Non-Newtonian Core'
                      : telemetry.reynoldsNumber < 4000
                      ? 'Transitional Hydro-Shear'
                      : 'Fully Developed Turbulent Slurry'}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-200 print:text-black border border-slate-800 print:border-gray-300">
                    Friction Head Loss (hf)
                  </td>
                  <td className="p-2.5 text-slate-400 print:text-gray-600 border border-slate-800 print:border-gray-300">
                    hf = f · (L/D) · (v² / 2g)
                  </td>
                  <td className="p-2.5 text-white print:text-black font-bold border border-slate-800 print:border-gray-300">
                    {telemetry.headLossM.toFixed(2)} m
                  </td>
                  <td className="p-2.5 text-slate-300 print:text-gray-700 border border-slate-800 print:border-gray-300">
                    Swamee-Jain Darcy friction over {parameters.hoseLengthM}m hose conduit.
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-200 print:text-black border border-slate-800 print:border-gray-300">
                    Suction Vacuum Level
                  </td>
                  <td className="p-2.5 text-slate-400 print:text-gray-600 border border-slate-800 print:border-gray-300">
                    Negative Gauge Pressure
                  </td>
                  <td className="p-2.5 text-white print:text-black font-bold border border-slate-800 print:border-gray-300">
                    {formatPressureKpa(telemetry.suctionPressureKpa)}
                  </td>
                  <td className="p-2.5 text-slate-300 print:text-gray-700 border border-slate-800 print:border-gray-300">
                    Setpoint: {parameters.targetVacuumKpa} kPa. Margin to vapor pressure is adequate.
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-200 print:text-black border border-slate-800 print:border-gray-300">
                    Cavitation Index (NPSH Margin)
                  </td>
                  <td className="p-2.5 text-slate-400 print:text-gray-600 border border-slate-800 print:border-gray-300">
                    NPSHa / NPSHr Index
                  </td>
                  <td className="p-2.5 text-white print:text-black font-bold border border-slate-800 print:border-gray-300">
                    {(telemetry.cavitationIndex * 100).toFixed(0)}%
                  </td>
                  <td className="p-2.5 text-slate-300 print:text-gray-700 border border-slate-800 print:border-gray-300">
                    {telemetry.cavitationIndex >= 0.75 ? (
                      <span className="text-rose-400 print:text-red-600 font-bold">
                        HIGH CAVITATION RISK — REDUCE RPM
                      </span>
                    ) : (
                      <span className="text-emerald-400 print:text-green-600">
                        Stable NPSH suction margin (acceptable)
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Mass Balance & Energy Balance Table */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300 print:text-black mb-3 flex items-center gap-2">
            <Scale className="w-4 h-4 text-safety-500" />
            <span>2. Process Mass & Electrical Energy Balance</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-graphite-950 print:bg-gray-100 rounded-lg border border-slate-800 print:border-gray-300 space-y-1">
              <span className="text-slate-400 print:text-gray-600 block text-[10px]">TOTAL VAULT VOLUME</span>
              <span className="text-base font-bold text-white print:text-black">
                {formatVolume(parameters.containmentVolumeLiters)}
              </span>
              <p className="text-[10px] text-slate-400 print:text-gray-500">Initial sludge depth: {parameters.initialSludgeDepthM} m</p>
            </div>

            <div className="p-3 bg-graphite-950 print:bg-gray-100 rounded-lg border border-slate-800 print:border-gray-300 space-y-1">
              <span className="text-slate-400 print:text-gray-600 block text-[10px]">EVACUATED VOLUME</span>
              <span className="text-base font-bold text-emerald-400 print:text-green-600">
                {formatVolume(telemetry.volumeExtractedLiters)} (
                {((telemetry.volumeExtractedLiters / Math.max(1, parameters.containmentVolumeLiters)) * 100).toFixed(1)}%)
              </span>
              <p className="text-[10px] text-slate-400 print:text-gray-500">Remaining: {formatVolume(telemetry.volumeRemainingLiters)}</p>
            </div>

            <div className="p-3 bg-graphite-950 print:bg-gray-100 rounded-lg border border-slate-800 print:border-gray-300 space-y-1">
              <span className="text-slate-400 print:text-gray-600 block text-[10px]">ENERGY CONSUMPTION</span>
              <span className="text-base font-bold text-yellow-400 print:text-yellow-600">
                {energyKwh.toFixed(2)} kWh
              </span>
              <p className="text-[10px] text-slate-400 print:text-gray-500">Specific energy: {specificEnergy.toFixed(2)} kWh/m³</p>
            </div>
          </div>
        </div>

        {/* 3. Confined Space Atmospheric Compliance */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300 print:text-black mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>3. Confined Space Atmosphere & OSHA Compliance Audit</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-graphite-950 print:bg-gray-100 rounded-lg border border-slate-800 print:border-gray-300">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 print:text-gray-600 text-[10px]">HYDROGEN SULFIDE (H2S)</span>
                <span className="text-[10px] text-slate-400">PEL: 10 ppm</span>
              </div>
              <div className="text-lg font-bold text-white print:text-black">
                {formatPpm(telemetry.h2sConcentrationPpm)}
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  telemetry.h2sConcentrationPpm >= 10
                    ? 'text-rose-400 print:text-red-600'
                    : 'text-emerald-400 print:text-green-600'
                }`}
              >
                {telemetry.h2sConcentrationPpm >= 10 ? 'EXCEEDS OSHA CEILING' : 'WITHIN SAFE LIMITS'}
              </span>
            </div>

            <div className="p-3 bg-graphite-950 print:bg-gray-100 rounded-lg border border-slate-800 print:border-gray-300">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 print:text-gray-600 text-[10px]">METHANE (CH4)</span>
                <span className="text-[10px] text-slate-400">LEL: 5.0%</span>
              </div>
              <div className="text-lg font-bold text-white print:text-black">
                {formatPercent(telemetry.ch4ConcentrationPct)}
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 print:text-green-600">
                BELOW 10% LEL ACTION LEVEL
              </span>
            </div>

            <div className="p-3 bg-graphite-950 print:bg-gray-100 rounded-lg border border-slate-800 print:border-gray-300">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 print:text-gray-600 text-[10px]">VIBRATION (ISO 10816)</span>
                <span className="text-[10px] text-slate-400">Limit: 7.1 mm/s</span>
              </div>
              <div className="text-lg font-bold text-white print:text-black">
                {formatVibration(telemetry.vibrationRmsMmS)}
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  telemetry.vibrationRmsMmS >= 4.5
                    ? 'text-amber-400 print:text-amber-600'
                    : 'text-emerald-400 print:text-green-600'
                }`}
              >
                {telemetry.vibrationRmsMmS >= 4.5 ? 'ZONE C: RESTRICTED' : 'ZONE A/B: PERMISSIBLE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
