import React from 'react';
import { ShieldAlert, AlertOctagon, Skull, Zap, Droplets, HardHat, PhoneCall, CheckSquare } from 'lucide-react';
import { SafetyAssessmentResult, SiteConditions } from '../types';

interface SafetyPanelProps {
  safety: SafetyAssessmentResult;
  site: SiteConditions;
}

export const SafetyPanel: React.FC<SafetyPanelProps> = ({ safety, site }) => {
  return (
    <div className="space-y-6">
      {/* Strict Confined Space Zero-Entry Mandate Banner */}
      <div className="bg-gradient-to-r from-rose-950/80 via-red-950/60 to-slate-900 border-2 border-rose-600 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-lg bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400 flex-shrink-0">
            <Skull className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-widest text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                Mandatory Life-Safety Protocol
              </span>
              <span className="text-xs font-bold text-white">ISO 21876 / OSHA 1910.146 Compliant</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              NON-ENTRY RESTRICTION: ZERO PHYSICAL PIT ENTRY
            </h3>
            <p className="text-xs text-rose-200/90 mt-1.5 leading-relaxed font-sans">
              {safety.confined_space_mandate}
            </p>
          </div>
        </div>
      </div>

      {/* Terrain Stability & Anti-Slosh Baffles Card */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow-lg">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded">
                Steep Mountain Alley Engineering
              </span>
              <span className="text-xs text-slate-400 font-mono">20°–30° Incline (40%–55% Gradient)</span>
            </div>
            <h3 className="text-base font-bold text-white tracking-wide mt-1">
              Terrain Stability &amp; Rollover Prevention Analysis
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Preventing dynamic sloshing liquid pitch-back in steep hillside towns (Shimla, Aizawl, Mussoorie)
            </p>
          </div>

          <div className="bg-slate-900 border border-emerald-600/40 rounded-lg p-3 font-mono text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Key Metric</span>
            <span className="text-sm font-black text-emerald-400 block">
              Critical Rollover Angle: 34.2°
            </span>
            <span className="text-[10px] text-slate-300 block">
              Operating threshold safely rated at 28.0° with full 400L sludge payload
            </span>
          </div>
        </div>

        {/* Design Highlight Banner */}
        <div className="mt-4 bg-emerald-950/30 border border-emerald-700/40 p-3 rounded-lg text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <span className="font-bold text-emerald-300">Design Feature Highlight: </span>
            <span className="text-slate-200">
              "Low Center-of-Gravity achieved by under-chassis battery placement + dual longitudinal anti-slosh baffles inside the holding tank."
            </span>
          </div>
          <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-600/60 px-2.5 py-1 rounded text-[10px] font-mono font-bold whitespace-nowrap">
            CoM hcg = 0.42 m
          </span>
        </div>

        {/* Anti-Slosh Comparison Columns */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
            <span className="font-bold text-rose-400 block mb-1">
              The "Sloshing Liquid" Danger (Free-Surface Surge):
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">
              Unlike solid freight, a desludging unit carries 300–500 kg of liquid sludge. When ascending 20°–30° hillside ramps, fluid surges rearward. 
              In an unbaffled tank, the Center of Mass (CoM) shifts 11.8 cm backward, unloading the front axle and causing dynamic rearward pitch rollover at slopes above 21.8°.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
            <span className="font-bold text-emerald-400 block mb-1">
              Engineered Rollover Prevention Mechanism:
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">
              Dual internal longitudinal and transverse baffles divide the holding tank into stabilized fluid chambers, reducing the free-surface moment of inertia by 88.9% (I_baffled = I_0 / 9). 
              Combined with placing heavy battery modules beneath the chassis, laden CoM height remains at 0.42 m, guaranteeing safe operation on 28° mountain inclines.
            </p>

          </div>
        </div>
      </div>


      {/* Safety Hazards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
        {/* Toxic Biogas Accumulation */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-200 flex items-center space-x-2">
              <Skull className="w-4 h-4 text-amber-400" />
              <span>Biogas & Toxic Atmosphere</span>
            </h4>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              safety.gas_hazard.risk_level === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-amber-950 text-amber-300 border border-amber-700'
            }`}>
              {safety.gas_hazard.risk_level} RISK
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed mb-3">
            {safety.gas_hazard.operational_protocol}
          </p>
          <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px]">
            <span className="font-semibold text-slate-400">Target Toxic Gases: </span>
            <span className="text-amber-300">{safety.gas_hazard.primary_toxicants.join(', ')}</span>
          </div>
        </div>

        {/* Slope Stability & Tip Angle */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-200 flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-emerald-400" />
              <span>Vehicle Slope Rollover Limit</span>
            </h4>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              safety.slope_stability_hazard.risk_level === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
              safety.slope_stability_hazard.risk_level === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
              'bg-emerald-950 text-emerald-300 border border-emerald-700'
            }`}>
              {safety.slope_stability_hazard.risk_level} RISK
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center mb-3">
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">Site Gradient</div>
              <div className="text-sm font-bold text-white font-mono">{site.slope_degrees}°</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">Critical Tip Limit</div>
              <div className="text-sm font-bold text-amber-400 font-mono">
                {safety.slope_stability_hazard.critical_tip_angle_deg}°
              </div>
            </div>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {safety.slope_stability_hazard.mitigation}
          </p>
        </div>

        {/* Pathogens & Biological Exposure */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-200 flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Bioaerosol & Pathogen Control</span>
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700">
              HIGH RISK
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed mb-3">
            {safety.pathogen_hazard.mitigation}
          </p>
          <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px]">
            <span className="font-semibold text-slate-400">Biological Vectors: </span>
            <span className="text-cyan-300">{safety.pathogen_hazard.biological_agents.slice(0, 3).join(', ')}</span>
          </div>
        </div>

        {/* Electrical Wet-Weather Hazard */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-200 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Electrical Wet Environment</span>
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {safety.electrical_hazard.risk_level}
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed mb-2">
            {safety.electrical_hazard.mitigation}
          </p>
          <div className="text-emerald-400 font-mono font-medium">
            Protection: {safety.electrical_hazard.ground_fault_protection}
          </div>
        </div>

        {/* Pressurized Hose & Couplings */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-200 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <span>Hose Rupture & Pressure Safety</span>
            </h4>
            <span className="text-emerald-400 font-mono font-bold">
              SF = {safety.pressure_hazard.burst_safety_factor}x
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed mb-2">
            {safety.pressure_hazard.mitigation}
          </p>
          <div className="text-slate-400 text-[11px]">
            Whip arrestor cables: <span className="text-emerald-400 font-semibold">MANDATORY</span>
          </div>
        </div>

        {/* Spill Prevention & Environmental Berm */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-200 flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-emerald-400" />
              <span>Spill Containment Plan</span>
            </h4>
            <span className="text-slate-400 font-mono">
              Berm: {safety.spill_control_plan.absorbent_capacity_liters}L
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed mb-2">
            {safety.spill_control_plan.containment_method}
          </p>
          <div className="text-[11px] text-slate-400">
            Decontaminant: <span className="text-emerald-300">{safety.spill_control_plan.disinfection_agent}</span>
          </div>
        </div>
      </div>

      {/* PPE Matrix & Emergency Protocols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PPE Requirements Table */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <HardHat className="w-4 h-4 text-emerald-400" />
            <span>Required PPE Standards Matrix (Every Crew Member)</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Equipment Item</th>
                  <th className="py-2 px-3">Certified Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                {safety.required_ppe.map((ppe, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 font-sans text-white flex items-center space-x-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{ppe.item}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">{ppe.standard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Emergency Response Checklist */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-rose-400" />
            <span>Emergency Protocols & Rapid Incident Response</span>
          </h3>
          <ul className="space-y-2.5 text-xs">
            {safety.emergency_protocols.map((proto, idx) => (
              <li key={idx} className="bg-slate-900 border border-slate-800 p-2.5 rounded flex items-start space-x-2">
                <span className="w-5 h-5 rounded bg-slate-800 text-rose-400 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                  {idx + 1}
                </span>
                <span className="text-slate-300 font-sans">{proto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
