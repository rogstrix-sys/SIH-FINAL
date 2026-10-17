import React, { useState } from 'react';
import { Activity, Check, X, AlertTriangle, ShieldCheck, DollarSign, Clock, Scale, Info, SlidersHorizontal } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { EquipmentRecommendation, EvaluationWeights } from '../types';

interface EquipmentComparisonProps {
  recommendations: EquipmentRecommendation[];
  weights: EvaluationWeights;
  setWeights: React.Dispatch<React.SetStateAction<EvaluationWeights>>;
  onRecalculateWithWeights: () => void;
  onSelectForDetailedView?: (equipmentId: string) => void;
}

export const EquipmentComparison: React.FC<EquipmentComparisonProps> = ({
  recommendations,
  weights,
  setWeights,
  onRecalculateWithWeights,
  onSelectForDetailedView
}) => {
  const [showWeightSliders, setShowWeightSliders] = useState<boolean>(false);
  const [selectedEqIds, setSelectedEqIds] = useState<string[]>(
    recommendations.slice(0, 3).map((r) => r.equipment.id)
  );

  const toggleSelect = (id: string) => {
    if (selectedEqIds.includes(id)) {
      if (selectedEqIds.length > 2) {
        setSelectedEqIds(selectedEqIds.filter((item) => item !== id));
      }
    } else {
      if (selectedEqIds.length < 4) {
        setSelectedEqIds([...selectedEqIds, id]);
      }
    }
  };

  const handleWeightChange = (key: keyof EvaluationWeights, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  // Prepare data for BarChart (Cost vs Productivity)
  const costProductivityData = recommendations.map((r) => ({
    name: r.equipment.name.split(' ')[0] + ' ' + (r.equipment.name.split(' ')[1] || ''),
    totalCost: r.calculations.costs.total_cost_usd,
    cycleTime: r.calculations.total_cycle_time_h,
    jobsPerShift: r.calculations.jobs_per_shift,
    isFeasible: r.is_feasible
  }));

  // Prepare radar multi-criteria data for top selected items
  const radarMetrics = [
    { metric: 'Terrain Mobility', key: 'access' },
    { metric: 'Climate Resilience', key: 'climate' },
    { metric: 'Economic Efficiency', key: 'cost' },
    { metric: 'Speed / Throughput', key: 'time' },
    { metric: 'Worker Safety', key: 'safety' },
  ];

  const radarData = radarMetrics.map((m) => {
    const row: any = { subject: m.metric };
    recommendations.filter(r => selectedEqIds.includes(r.equipment.id)).forEach((r) => {
      let val = 50;
      if (m.key === 'access') val = r.calculations.accessibility.score;
      if (m.key === 'climate') val = r.calculations.climate.score;
      if (m.key === 'cost') val = Math.max(10, 100 - (r.calculations.costs.total_cost_usd / 4.0));
      if (m.key === 'time') val = Math.max(10, 100 - (r.calculations.total_cycle_time_h * 15.0));
      if (m.key === 'safety') val = r.equipment.confined_space_prevention_score;
      row[r.equipment.id] = Math.round(val);
    });
    return row;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Multi-Criteria Equipment Decision Matrix</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Side-by-side engineering evaluation across physical feasibility, cost, hydraulic throughput, and ergonomics
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowWeightSliders(!showWeightSliders)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span>{showWeightSliders ? 'Hide Weight Sliders' : 'Adjust Decision Weights'}</span>
            </button>
          </div>
        </div>

        {/* Weight Sliders Panel */}
        {showWeightSliders && (
          <div className="mt-4 p-4 bg-slate-900 border border-slate-700/80 rounded-lg text-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-slate-200">Adjust Multi-Objective Scoring Weights (0.0 to 1.0)</span>
              <button
                onClick={onRecalculateWithWeights}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[11px] font-semibold"
              >
                Apply Weights
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Cost Weight', key: 'cost_weight', val: weights.cost_weight },
                { label: 'Time Weight', key: 'time_weight', val: weights.time_weight },
                { label: 'Terrain Weight', key: 'accessibility_weight', val: weights.accessibility_weight },
                { label: 'Climate Weight', key: 'climate_weight', val: weights.climate_weight },
                { label: 'Safety Weight', key: 'safety_weight', val: weights.safety_weight },
                { label: 'Portability Weight', key: 'portability_weight', val: weights.portability_weight },
              ].map((w) => (
                <div key={w.key} className="bg-slate-850 p-2.5 rounded border border-slate-800">
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>{w.label}</span>
                    <span className="font-mono text-emerald-400 font-bold">{w.val.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={w.val}
                    onChange={(e) => handleWeightChange(w.key as any, parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Matrix Table */}
      <div className="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden shadow-md">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Comparative Specifications & Performance Matrix (Select 2-4 to compare in radar)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {selectedEqIds.length} of 4 selected
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Model & Type</th>
                <th className="py-3 px-3 text-center">Feasibility</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-3">Effective Flow</th>
                <th className="py-3 px-3">Total Head</th>
                <th className="py-3 px-3">Cycle Time</th>
                <th className="py-3 px-3">Est. Cost</th>
                <th className="py-3 px-3">Max Slope</th>
                <th className="py-3 px-3">Min Width</th>
                <th className="py-3 px-3">Safety Rating</th>
                <th className="py-3 px-3">Evidence Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {recommendations.map((rec) => {
                const isSelected = selectedEqIds.includes(rec.equipment.id);
                return (
                  <tr
                    key={rec.equipment.id}
                    onClick={() => toggleSelect(rec.equipment.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-950/20' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-sans font-medium text-white flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div>{rec.equipment.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {rec.equipment.id} · {rec.equipment.power_source}</div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-sans">
                      {rec.is_feasible ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-600/50">
                          <Check className="w-3 h-3" />
                          <span>FEASIBLE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-600/50" title={rec.rejection_reasons.join('; ')}>
                          <X className="w-3 h-3" />
                          <span>REJECTED</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-emerald-400">
                      {rec.composite_score.toFixed(1)}
                    </td>

                    <td className="py-3 px-3">
                      {rec.calculations.effective_flow_m3_h.toFixed(1)} m³/h
                    </td>

                    <td className="py-3 px-3">
                      {rec.calculations.hydraulics.total_dynamic_head_m.toFixed(1)} m
                    </td>

                    <td className="py-3 px-3 text-slate-200">
                      {rec.calculations.total_cycle_time_h.toFixed(1)} hrs
                    </td>

                    <td className="py-3 px-3 text-emerald-300 font-bold">
                      ${rec.calculations.costs.total_cost_usd.toFixed(0)}
                    </td>

                    <td className="py-3 px-3">
                      {rec.equipment.max_slope_degrees}°
                    </td>

                    <td className="py-3 px-3">
                      {rec.equipment.min_access_width_m} m
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-cyan-300">{rec.equipment.confined_space_prevention_score}%</span>
                    </td>

                    <td className="py-3 px-3 text-[10px] text-slate-400 font-sans">
                      {rec.equipment.confidence_level.split(' ')[0]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Charts: Bar Chart (Cost vs Time) and Radar Chart (Multi-dimensional) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost vs Jobs/Shift Bar Chart */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Economic Cost ($) vs Operational Jobs per Shift</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costProductivityData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" />
                <YAxis yAxisId="left" stroke="#10b981" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="totalCost" name="Total Cost ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="jobsPerShift" name="Jobs per 8h Shift" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Dimensional Radar Comparison */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <span>Trade-Off Radar Profile (Selected Models)</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                {selectedEqIds.map((id, idx) => {
                  const colors = ['#10b981', '#38bdf8', '#f59e0b', '#ec4899'];
                  const color = colors[idx % colors.length];
                  const rec = recommendations.find(r => r.equipment.id === id);
                  return (
                    <Radar
                      key={id}
                      name={rec ? rec.equipment.name.split(' ')[0] : id}
                      dataKey={id}
                      stroke={color}
                      fill={color}
                      fillOpacity={0.25}
                    />
                  );
                })}
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
