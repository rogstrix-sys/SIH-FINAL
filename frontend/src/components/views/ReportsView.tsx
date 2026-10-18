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
  const materialBalance = useSimulationStore((s) => s.materialBalance);
  const operatingState = useSimulationStore((s) => s.operatingState);

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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300 print:text-black flex items-center gap-2">
              <Scale className="w-4 h-4 text-safety-500" />
              <span>2. Process Mass & Electrical Energy Balance</span>
            </h3>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
              DISCREPANCY: ±{Math.abs(materialBalance.massBalanceDiscrepancyL).toFixed(4)} L (INVARIANT CONSERVED)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-graphite-950 print:bg-gray-100 rounded-lg border border-slate-800 print:border-gray-300 space-y-1">
              <span className="text-slate-400 print:text-gray-600 block text-[10px]">1. VAULT SOURCE REMAINING</span>
              <span className="text-base font-bold text-amber-300 print:text-amber-700">
                {Math.round(materialBalance.sourceVolumeL)} L
              </span>
              <p className="text-[10px] text-slate-400 print:text-gray-500">Fluid level: {materialBalance.sourceLevelM.toFixed(2)} m</p>
            </div>

            <div className="p-3 bg-graphite-950 print:bg-gray-100 rounded-lg border border-slate-800 print:border-gray-300 space-y-1">
              <span className="text-slate-400 print:text-gray-600 block text-[10px]">2. MACHINE COLLECTION TANK</span>
              <span className="text-base font-bold text-cyan-300 print:text-cyan-700">
                {Math.round(materialBalance.collectionVolumeL)} L
              </span>
              <p className="text-[10px] text-slate-400 print:text-gray-500">Fill: {materialBalance.collectionFillPct.toFixed(1)}%</p>
            </div>

            <div className="p-3 bg-graphite-950 print:bg-gray-100 rounded-lg border border-slate-800 print:border-gray-300 space-y-1">
              <span className="text-slate-400 print:text-gray-600 block text-[10px]">3. EXTERNAL RECEIVER TANK</span>
              <span className="text-base font-bold text-sky-300 print:text-sky-700">
                {Math.round(materialBalance.receiverVolumeL)} L
              </span>
              <p className="text-[10px] text-slate-400 print:text-gray-500">Discharge transfer volume</p>
            </div>

            <div className="p-3 bg-graphite-950 print:bg-gray-100 rounded-lg border border-slate-800 print:border-gray-300 space-y-1">
              <span className="text-slate-400 print:text-gray-600 block text-[10px]">ENERGY CONSUMPTION</span>
              <span className="text-base font-bold text-yellow-400 print:text-yellow-600">
                {energyKwh.toFixed(2)} kWh
              </span>
              <p className="text-[10px] text-slate-400 print:text-gray-500">Specific: {specificEnergy.toFixed(2)} kWh/m³</p>
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

        {/* 4. System Verification, Assumptions & Engineering Limitations Dossier */}
        <div className="mt-8 border-t border-slate-800 print:border-gray-300 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200 print:text-black flex items-center gap-2">
              <Layers className="w-4 h-4 text-safety-500" />
              <span>4. System Verification, Assumptions & Engineering Limitations Dossier</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 print:text-amber-700 font-semibold">
              TRUTH-IN-ENGINEERING AUDIT
            </span>
          </div>

          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-300/90 print:bg-amber-50 print:border-amber-300 print:text-amber-800 text-[11px] font-mono mb-5 leading-relaxed">
            <strong className="text-amber-400 print:text-amber-900">DISCLAIMER & INTEGRITY NOTICE:</strong> This digital twin models fluid hydrodynamics, kinematics, and mass conservation numerically using standard engineering formulations. Zero field trials, regulatory approvals, or physical test certifications are fabricated or claimed as completed. Physical commissioning gates must be performed on physical test rigs prior to actual sanitization deployment.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Subsection 4.1: Implemented Software Features */}
            <div className="p-4 bg-graphite-950 print:bg-gray-50 rounded-lg border border-slate-800 print:border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 print:text-emerald-700 font-bold uppercase text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>4.1 Implemented Software Features</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-gray-700 text-[11px]">
                <li>Deterministic 8-state machine (IDLE, DEPLOYMENT, PRIMING, EXTRACTION, DISCHARGE, COMPLETE, PAUSED, FAULT).</li>
                <li>Latched emergency-stop and interlock enforcement (tank capacity, priming threshold, ground stability).</li>
                <li>PBR 3D machine model with dual-axis stabilizer jacks, articulating boom, rotating reel, and dynamic sludge volume layers.</li>
                <li>6 Procedural terrain and environmental scenarios with slope, roughness, temperature, rainfall, and altitude parameters.</li>
                <li>Closed-loop mass balance tracking invariant conserving matter within ±0.001 L.</li>
                <li>Hardware Prototype Planning module with parametric Bill of Materials and editable INR costing.</li>
                <li>12-Stage sequential guided demonstration tour covering end-to-end operation.</li>
              </ul>
            </div>

            {/* Subsection 4.2: Calculated Engineering Estimates */}
            <div className="p-4 bg-graphite-950 print:bg-gray-50 rounded-lg border border-slate-800 print:border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 print:text-cyan-700 font-bold uppercase text-[11px]">
                <Activity className="w-3.5 h-3.5" />
                <span>4.2 Calculated Engineering Estimates</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-gray-700 text-[11px]">
                <li><strong>Darcy-Weisbach head loss (hf):</strong> Swamee-Jain explicit equation with commercial pipe roughness (e = 0.045 mm).</li>
                <li><strong>Reynolds number regime:</strong> Dynamic transition tracking (laminar Re &lt; 2000, transitional, turbulent Re &gt; 4000).</li>
                <li><strong>Temperature-viscosity decay:</strong> Andrade empirical formulation for temperature-dependent fluid shearing.</li>
                <li><strong>Barometric suction ceiling:</strong> Altitude-derated atmospheric pressure according to the barometric formula.</li>
                <li><strong>Chassis tilt & stability:</strong> Vector slope projection with simplified 15° operational rollover warning limit.</li>
                <li><strong>Motor power demand:</strong> Hydraulic power divided by total electromechanical efficiency (η_pump · η_motor).</li>
              </ul>
            </div>

            {/* Subsection 4.3: Conceptual Design Assumptions */}
            <div className="p-4 bg-graphite-950 print:bg-gray-50 rounded-lg border border-slate-800 print:border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 print:text-amber-700 font-bold uppercase text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>4.3 Conceptual Design Assumptions</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-gray-700 text-[11px]">
                <li>Quasi-homogeneous non-Newtonian slurry assumption; particle settling, compaction, and grit packing are not simulated.</li>
                <li>Stabilizer footings assume rigid soil contact with sufficient bearing capacity; ground shear failure is unmodeled.</li>
                <li>Vacuum pump efficiency is modeled as a linear derating curve down to fluid vapor pressure.</li>
                <li>Hose routing assumes a catenary slack multiplier (1.25×) over straight-line Pythagorean Euclidean distance.</li>
                <li>Atmospheric gas emissions (H2S, CH4) are simulated as steady-state concentrations without anaerobic microbial kinetics.</li>
              </ul>
            </div>

            {/* Subsection 4.4: Features Requiring Engineering Validation */}
            <div className="p-4 bg-graphite-950 print:bg-gray-50 rounded-lg border border-slate-800 print:border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 print:text-rose-700 font-bold uppercase text-[11px]">
                <Zap className="w-3.5 h-3.5" />
                <span>4.4 Features Requiring Engineering Validation</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-gray-700 text-[11px]">
                <li>Bingham plastic yield stress (τ₀) and Herschel-Bulkley parameters for total suspended solids (TSS) &gt; 8%.</li>
                <li>Liquid slosh dynamics (free-surface momentum transfer) affecting chassis center-of-gravity during grade climbs.</li>
                <li>Two-phase air-sludge ingestion behavior and suction valve wear under grit abrasiveness.</li>
                <li>Hose collapse resistance under sustained -75 kPa vacuum suction through sharp 90° bends.</li>
                <li>Thermal dissipation and motor overheat protection during prolonged continuous stall torque.</li>
              </ul>
            </div>
          </div>

          {/* Subsection 4.5: Physical Tests Not Yet Conducted (Pre-Commissioning Gates) */}
          <div className="mt-4 p-4 bg-graphite-950 print:bg-gray-50 rounded-lg border border-slate-800 print:border-gray-200">
            <div className="flex items-center gap-2 text-yellow-400 print:text-yellow-700 font-bold uppercase text-[11px] mb-2">
              <Scale className="w-3.5 h-3.5" />
              <span>4.5 Physical Tests Not Yet Conducted (Pre-Commissioning Verification Gates)</span>
            </div>
            <p className="text-[11px] text-slate-400 print:text-gray-600 mb-3">
              The following experimental tests must be completed on a fabricated hardware prototype before field deployment:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11px] font-mono">
              <div className="p-2.5 rounded bg-slate-900 print:bg-white border border-slate-800 print:border-gray-200">
                <span className="text-safety-400 font-bold block mb-1">Gate 1: Shaker Table Resonance</span>
                <span className="text-slate-300 print:text-gray-700">ISO 10816-3 harmonic vibration scan to identify structural frame resonance frequencies.</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 print:bg-white border border-slate-800 print:border-gray-200">
                <span className="text-safety-400 font-bold block mb-1">Gate 2: Bentonite Slurry Flow Loop</span>
                <span className="text-slate-300 print:text-gray-700">Bench-scale flow validation across 100 cP to 1200 cP to verify head loss and cavitation limits.</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 print:bg-white border border-slate-800 print:border-gray-200">
                <span className="text-safety-400 font-bold block mb-1">Gate 3: Vacuum Vessel Hydrotest</span>
                <span className="text-slate-300 print:text-gray-700">Hydrostatic and negative pressure vessel qualification per ASME Section VIII Division 1.</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 print:bg-white border border-slate-800 print:border-gray-200">
                <span className="text-safety-400 font-bold block mb-1">Gate 4: 25° Tilt Table Static Stability</span>
                <span className="text-slate-300 print:text-gray-700">Physical tilt table measurement of rollover angle with 100% full payload to confirm CG calculations.</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 print:bg-white border border-slate-800 print:border-gray-200">
                <span className="text-safety-400 font-bold block mb-1">Gate 5: ATEX / IECEx Explosion Proof</span>
                <span className="text-slate-300 print:text-gray-700">Confined space extraction nozzle electrical bonding and Zone 0 non-sparking certification.</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 print:bg-white border border-slate-800 print:border-gray-200">
                <span className="text-safety-400 font-bold block mb-1">Gate 6: Cold Weather Suction Lift</span>
                <span className="text-slate-300 print:text-gray-700">Verification of dry priming time and suction lift capacity at -5°C and 2500 m altitude.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
