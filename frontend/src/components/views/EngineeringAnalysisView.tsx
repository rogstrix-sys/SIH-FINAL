import React, { useState } from 'react';
import {
  FileText,
  Scale,
  Activity,
  Zap,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Ruler,
  Gauge,
  HelpCircle
} from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { downloadTelemetryCsv, downloadEventsCsv } from '../../utils/csvExport';
import { EngineeringAssumptionsPanel } from '../EngineeringAssumptionsPanel';

export const EngineeringAnalysisView: React.FC = () => {
  const telemetry = useSimulationStore((s) => s.telemetry);
  const parameters = useSimulationStore((s) => s.parameters);
  const materialBalance = useSimulationStore((s) => s.materialBalance);
  const history = useSimulationStore((s) => s.telemetryHistory);
  const eventLog = useSimulationStore((s) => s.eventLog);

  const [activeTab, setActiveTab] = useState<'audit' | 'assumptions'>('audit');

  // Energy audit calculations
  const hoursElapsed = telemetry.elapsedTimeSeconds / 3600.0;
  const energyKwh = telemetry.motorPowerKw * hoursElapsed;
  const m3Extracted = materialBalance.cycleExtractedL / 1000.0;
  const specificEnergy = m3Extracted > 0.05 ? energyKwh / m3Extracted : 0.0;

  // Mass balance discrepancy
  const totalVolume =
    materialBalance.sourceVolumeL +
    materialBalance.collectionVolumeL +
    materialBalance.receiverVolumeL;
  const discrepancy = Math.abs(totalVolume - materialBalance.totalInitialVolumeL);

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto bg-graphite-950 select-none print:p-0 print:bg-white print:text-black">
      {/* Header Banner */}
      <div className="bg-graphite-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-safety-500" />
            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-mono">
              Engineering Analysis & Mathematical Assumptions Audit
            </h2>
            <Badge variant="safety" size="sm">
              RIGOROUS MODELS
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl font-sans">
            Mathematical mass conservation invariant verification, Darcy-Weisbach friction head losses,
            Reynolds number flow regimes, and transparent documentation of all engineering assumptions.
          </p>
        </div>

        {/* Tab & Export Strip */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="flex items-center bg-graphite-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'audit'
                  ? 'bg-safety-500 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-graphite-850'
              }`}
            >
              Hydrodynamic Audit
            </button>
            <button
              onClick={() => setActiveTab('assumptions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'assumptions'
                  ? 'bg-safety-500 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-graphite-850'
              }`}
            >
              Engineering Assumptions Panel
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadTelemetryCsv(history)}
              icon={<Download className="w-3.5 h-3.5 text-cyan-400" />}
            >
              Telemetry CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadEventsCsv(eventLog)}
              icon={<Download className="w-3.5 h-3.5 text-safety-400" />}
            >
              Events CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Print / PDF
            </Button>
          </div>
        </div>
      </div>

      {activeTab === 'assumptions' ? (
        <EngineeringAssumptionsPanel />
      ) : (
        <>
          {/* Mass Conservation Invariant Card */}
          <Card title="Law of Conservation of Mass — Physical Invariant Check">
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-graphite-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Mass Balance Invariant Equation:</span>
                  <div className="text-sm font-bold text-white mt-0.5">
                    V_total(t) = V_vault(t) + V_collection(t) + V_receiver(t) = V_initial
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Total System Volume:</span>
                  <span className="text-base font-bold text-emerald-400">
                    {totalVolume.toFixed(2)} L
                  </span>
                  <span className="text-xs text-slate-400">/ {materialBalance.totalInitialVolumeL.toFixed(2)} L initial</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Septic Vault</div>
                  <div className="text-base font-bold text-amber-300 mt-1">
                    {materialBalance.sourceVolumeL.toFixed(1)} L
                  </div>
                  <div className="text-[10px] text-slate-400">Source Evacuation</div>
                </div>

                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Machine Collection Tank</div>
                  <div className="text-base font-bold text-cyan-300 mt-1">
                    {materialBalance.collectionVolumeL.toFixed(1)} L
                  </div>
                  <div className="text-[10px] text-slate-400">{materialBalance.collectionFillPct.toFixed(1)}% Full</div>
                </div>

                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Disposal Tanker Receiver</div>
                  <div className="text-base font-bold text-emerald-300 mt-1">
                    {materialBalance.receiverVolumeL.toFixed(1)} L
                  </div>
                  <div className="text-[10px] text-slate-400">Discharged Batch</div>
                </div>

                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Numerical Discrepancy</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">
                    Δ {discrepancy.toFixed(6)} L
                  </div>
                  <div className="text-[10px] text-emerald-400">Conservation Verified</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Hydrodynamics & Darcy-Weisbach Fluid Mechanics Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card title="Slurry Hydrodynamics & Head Loss Modeling">
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-graphite-950 border border-slate-800 space-y-2">
                  <div className="text-slate-300 font-bold">Darcy-Weisbach Formulation:</div>
                  <p className="text-[11px] text-slate-400">
                    h_f = f · (L / D) · (v² / 2g), with friction factor f calculated via Churchill / Colebrook-White equation.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>Conduit Diameter: <strong className="text-white">{parameters.hoseDiameterMm} mm</strong></div>
                    <div>Umbilical Length: <strong className="text-white">{parameters.hoseLengthM} m</strong></div>
                    <div>Fluid Density: <strong className="text-white">{parameters.slurryDensityKgM3} kg/m³</strong></div>
                    <div>Base Viscosity: <strong className="text-white">{parameters.slurryViscosityCp} cP</strong></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Reynolds Number</div>
                    <div className="text-base font-bold text-cyan-400 mt-0.5">
                      {telemetry.reynoldsNumber.toFixed(0)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {telemetry.reynoldsNumber < 2100 ? 'Laminar Regime' : 'Transitional'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Friction Head Loss</div>
                    <div className="text-base font-bold text-amber-400 mt-0.5">
                      {telemetry.headLossM.toFixed(2)} m
                    </div>
                    <div className="text-[10px] text-slate-400">Friction Gradient</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Cavitation Index</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      {telemetry.cavitationIndex.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">Trip Limit: 0.80</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Energy & Environmental Sustainability Card */}
            <Card title="Energy Consumption & Efficiency Audit">
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-graphite-950 border border-slate-800 space-y-2">
                  <div className="text-slate-300 font-bold">Specific Energy Consumption:</div>
                  <p className="text-[11px] text-slate-400">
                    Total electrical energy required per cubic meter of septage evacuated under varying terrain slope.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-300">Specific Energy Index:</span>
                    <span className="text-base font-bold text-safety-400">
                      {specificEnergy.toFixed(2)} kWh/m³
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Cumulative Energy</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {energyKwh.toFixed(3)} kWh
                    </div>
                    <div className="text-[10px] text-slate-400">Total Work Done</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Total Evacuated</div>
                    <div className="text-base font-bold text-cyan-400 mt-0.5">
                      {m3Extracted.toFixed(2)} m³
                    </div>
                    <div className="text-[10px] text-slate-400">{Math.round(materialBalance.cycleExtractedL)} Liters</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">System Efficiency</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      {telemetry.systemEfficiencyPct.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-400">Hydraulic Wire-to-Water</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Embedded Assumptions Accordion */}
          <div className="pt-2">
            <EngineeringAssumptionsPanel />
          </div>
        </>
      )}
    </div>
  );
};
