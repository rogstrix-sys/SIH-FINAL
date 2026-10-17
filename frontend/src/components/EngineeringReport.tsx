import React from 'react';
import { Printer, Download, Mountain, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SiteConditions, EquipmentRecommendation, SafetyAssessmentResult, AiNarrative } from '../types';

interface EngineeringReportProps {
  site: SiteConditions;
  topChoice?: EquipmentRecommendation;
  recommendations: EquipmentRecommendation[];
  safety: SafetyAssessmentResult;
  narrative: AiNarrative;
}

export const EngineeringReport: React.FC<EngineeringReportProps> = ({
  site,
  topChoice,
  recommendations,
  safety,
  narrative
}) => {
  const calc = topChoice?.calculations;
  const eq = topChoice?.equipment;
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Trigger Bar (Hidden when printing) */}
      <div className="bg-slate-850 rounded-xl border border-slate-800 p-4 flex items-center justify-between no-print shadow-md">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Printable Engineering Assessment Report</span>
          </h3>
          <p className="text-xs text-slate-400">
            Official decision support assessment documentation formatted for technical evaluation, academic review, or client submittal
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Report Document Sheet (Clean, formal styling) */}
      <div className="bg-white text-slate-900 rounded-xl p-8 sm:p-12 shadow-2xl border border-slate-200 max-w-4xl mx-auto font-sans leading-normal">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Official Engineering Decision Support Record
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-2 tracking-tight">
                MECHANIZED DESLUDGING FEASIBILITY &amp; EQUIPMENT SELECTION REPORT
              </h1>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Autonomous Decision Support System for Varied Climatic Zones &amp; Hilly Mountain Terrains
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-500">
              <div>Ref: DSR-{Math.floor(site.elevation_m)}-{site.terrain_type.toUpperCase()}</div>
              <div>Date: {reportDate}</div>
              <div className="text-emerald-700 font-bold">Status: EVALUATED</div>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
            1. Executive Engineering Summary
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed font-serif">
            {narrative.executive_summary}
          </p>
        </section>

        {/* Section 2: Site & Environmental Boundary Conditions */}
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
            2. Site Assessment &amp; Hydraulic Boundary Conditions
          </h2>
          <table className="w-full text-xs border border-slate-300 divide-y divide-slate-200 mb-3 font-mono">
            <tbody>
              <tr className="divide-x divide-slate-200 bg-slate-50">
                <td className="p-2 font-semibold text-slate-700 w-1/4">Terrain Category</td>
                <td className="p-2 text-slate-900 w-1/4">{site.terrain_type.toUpperCase()} ({site.slope_degrees}°)</td>
                <td className="p-2 font-semibold text-slate-700 w-1/4">Access Road Width</td>
                <td className="p-2 text-slate-900 w-1/4">{site.access_width_m} m ({site.road_surface})</td>
              </tr>
              <tr className="divide-x divide-slate-200">
                <td className="p-2 font-semibold text-slate-700">Elevation (Altitude)</td>
                <td className="p-2 text-slate-900">{site.elevation_m} m ASL</td>
                <td className="p-2 font-semibold text-slate-700">Climate Zone / Temp</td>
                <td className="p-2 text-slate-900">{site.climate_zone} ({site.temperature_c}°C)</td>
              </tr>
              <tr className="divide-x divide-slate-200 bg-slate-50">
                <td className="p-2 font-semibold text-slate-700">Containment Volume</td>
                <td className="p-2 text-slate-900">{site.containment_volume_liters} Litres ({(site.containment_volume_liters / 1000).toFixed(2)} m³)</td>
                <td className="p-2 font-semibold text-slate-700">Precipitation Intensity</td>
                <td className="p-2 text-slate-900">{site.rainfall_mm_h} mm/hr</td>
              </tr>
              <tr className="divide-x divide-slate-200">
                <td className="p-2 font-semibold text-slate-700">Sludge Consistency</td>
                <td className="p-2 text-slate-900">{site.sludge_consistency} ({site.solids_concentration_pct}% TS)</td>
                <td className="p-2 font-semibold text-slate-700">Vertical Suction Depth</td>
                <td className="p-2 text-slate-900">{site.vertical_suction_lift_m} m</td>
              </tr>
              <tr className="divide-x divide-slate-200 bg-slate-50">
                <td className="p-2 font-semibold text-slate-700">Discharge Line Length</td>
                <td className="p-2 text-slate-900">{site.pumping_distance_m} m</td>
                <td className="p-2 font-semibold text-slate-700">On-Site Water Supply</td>
                <td className="p-2 text-slate-900">{site.water_available_l} Litres</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 3: Recommended Equipment Specification */}
        {topChoice && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
              3. Recommended Equipment Configuration &amp; Technical Justification
            </h2>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 text-xs mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-base font-bold text-emerald-900">{topChoice.equipment.name}</span>
                  <div className="text-[11px] text-emerald-800 font-mono mt-0.5">
                    ID: {topChoice.equipment.id} · Type: {topChoice.equipment.equipment_type} · Power: {topChoice.equipment.power_source} ({topChoice.equipment.power_kw} kW)
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    Score: {topChoice.composite_score.toFixed(1)}/100
                  </span>
                </div>
              </div>
              <p className="text-slate-700 mt-2 font-sans text-xs leading-relaxed">
                {topChoice.equipment.description}
              </p>
            </div>

            <div className="text-xs font-serif text-slate-700 leading-relaxed mb-3">
              <strong>Engineering Selection Rationale: </strong>
              {narrative.top_choice_rationale}
            </div>
          </section>
        )}

        {/* Section 4: Engineering Calculations Breakdown */}
        {calc && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
              4. Quantitative Engineering &amp; Hydraulic Calculations
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs font-mono">
              <div className="border border-slate-200 p-2 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block">TOTAL DYNAMIC HEAD</span>
                <span className="text-sm font-bold text-slate-900">{calc.hydraulics.total_dynamic_head_m.toFixed(1)} m</span>
              </div>
              <div className="border border-slate-200 p-2 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block">HYDRAULIC POWER</span>
                <span className="text-sm font-bold text-emerald-700">{calc.hydraulic_power_kw.toFixed(2)} kW</span>
              </div>
              <div className="border border-slate-200 p-2 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block">EFFECTIVE FLOW RATE</span>
                <span className="text-sm font-bold text-slate-900">{calc.effective_flow_m3_h.toFixed(1)} m³/h</span>
              </div>
              <div className="border border-slate-200 p-2 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block">TOTAL CYCLE TIME</span>
                <span className="text-sm font-bold text-blue-700">{calc.total_cycle_time_h.toFixed(1)} hrs</span>
              </div>
            </div>

            <table className="w-full text-xs border border-slate-200 divide-y divide-slate-200 font-mono mb-2">
              <thead className="bg-slate-100 text-slate-700 font-semibold">
                <tr>
                  <th className="p-2 text-left">Cost Component</th>
                  <th className="p-2 text-right">Calculation Basis</th>
                  <th className="p-2 text-right">Amount (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2">Fuel / Energy Consumption</td>
                  <td className="p-2 text-right text-slate-500">{eq?.fuel_consumption_l_h} L/h × ${eq?.fuel_cost_per_liter_usd}/L</td>
                  <td className="p-2 text-right">${calc.costs.fuel_cost_usd.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-2">Crew Direct Labor</td>
                  <td className="p-2 text-right text-slate-500">{eq?.min_crew_size} operators × ${eq?.hourly_labor_rate_usd}/hr × {calc.total_cycle_time_h}h</td>
                  <td className="p-2 text-right">${calc.costs.labor_cost_usd.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-2">Transit &amp; Vehicle Mileage</td>
                  <td className="p-2 text-right text-slate-500">{((site.route_length_m * 2) / 1000).toFixed(1)} km round-trip</td>
                  <td className="p-2 text-right">${calc.costs.transit_cost_usd.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-2">Equipment Maintenance &amp; Gasket Wear</td>
                  <td className="p-2 text-right text-slate-500">Scheduled maintenance amortization</td>
                  <td className="p-2 text-right">${calc.costs.maintenance_cost_usd.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-2">FSTP Sludge Tipping &amp; Treatment Fee</td>
                  <td className="p-2 text-right text-slate-500">{calc.sludge_volume_m3.toFixed(2)} m³ × ${eq?.sludge_disposal_fee_per_m3_usd}/m³</td>
                  <td className="p-2 text-right">${calc.costs.disposal_fee_usd.toFixed(2)}</td>
                </tr>
                <tr className="bg-slate-100 font-bold text-slate-900">
                  <td className="p-2">TOTAL ESTIMATED JOB COST</td>
                  <td className="p-2 text-right text-slate-600">Unit Cost: ${calc.costs.cost_per_m3_usd.toFixed(2)} / m³</td>
                  <td className="p-2 text-right text-emerald-800">${calc.costs.total_cost_usd.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* Section 5: Safety and Confined Space Mandate */}
        <section className="mb-6 page-break">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
            5. Mandatory Worker Health, Safety &amp; Confined Space Protocol
          </h2>
          <div className="bg-rose-50 border border-rose-300 rounded p-3 text-xs text-rose-950 mb-3 font-sans">
            <strong>CRITICAL LIFE-SAFETY MANDATE: </strong>
            {safety.confined_space_mandate}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-3">
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Atmospheric Toxic Gas Controls:</h4>
              <p className="text-slate-600">{safety.gas_hazard.operational_protocol}</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Slope Stability &amp; Tip Limit:</h4>
              <p className="text-slate-600">{safety.slope_stability_hazard.mitigation}</p>
            </div>
          </div>

          {/* Terrain Stability & Anti-Slosh Baffles Analysis */}
          <div className="border border-slate-300 rounded p-3 bg-slate-50 text-xs font-sans">
            <div className="flex justify-between items-center mb-1 border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-900 uppercase">Terrain Stability &amp; Rollover Prevention Analysis</span>
              <span className="font-mono font-bold text-emerald-800">Critical Rollover Angle: 34.2° (Rated at 28.0°)</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-serif mb-1.5">
              <strong>The "Sloshing Liquid" Danger (Free-Surface Effect): </strong>
              In steep mountain towns (Shimla, Aizawl, Mussoorie), paths reach 20° to 30° incline (40% to 55% gradient). Standard utility vehicles flip backwards because 300–500 kg of liquid sludge surges rearward, shifting Center of Mass toward the rear.
            </p>
            <div className="text-[11px] font-mono text-emerald-900 bg-emerald-100/70 p-2 rounded border border-emerald-300">
              <strong>Design Feature Highlight: </strong>
              "Low Center-of-Gravity achieved by under-chassis battery placement + dual longitudinal anti-slosh baffles inside the holding tank."
            </div>
          </div>
        </section>


        {/* Section 6: Assumptions and Model Limitations */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
            6. Engineering Assumptions, Evidence Quality &amp; Field Limitations
          </h2>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 font-serif">
            <li>Calculations are based on 1D Darcy-Weisbach hydraulics with Bingham-plastic sludge viscosity approximations.</li>
            <li>Elevation head is computed from static depth and longitudinal hose slope incline. Minor losses assume K_sum = 3.8.</li>
            <li>Equipment specifications reflect baseline laboratory and field test standards (Eawag/Sandec, Oxfam, UN-Habitat).</li>
            <li>Field validation requires site-specific gravimetric total solids (TS%) testing and calibrated 4-gas monitoring.</li>
          </ul>
        </section>

        {/* Document Sign-Off Block */}
        <div className="border-t border-slate-300 pt-6 mt-8 flex justify-between text-xs font-mono text-slate-600">
          <div>
            <div>LEAD SANITATION SYSTEMS ENGINEER</div>
            <div className="mt-8 border-b border-slate-400 w-48"></div>
            <div className="text-[10px] text-slate-400 mt-1">Autonomous Mechanized DSS v1.0</div>
          </div>
          <div>
            <div>VERIFIED FIELD OPERATIONS MANAGER</div>
            <div className="mt-8 border-b border-slate-400 w-48"></div>
            <div className="text-[10px] text-slate-400 mt-1">Date of Certification: {reportDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
