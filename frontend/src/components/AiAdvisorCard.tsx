import React from 'react';
import { Cpu, AlertTriangle, CheckCircle, Lightbulb, Compass, ArrowRight } from 'lucide-react';
import { AiNarrative, EquipmentRecommendation } from '../types';

interface AiAdvisorCardProps {
  narrative: AiNarrative;
  topChoice?: EquipmentRecommendation;
  onNavigateToComparison: () => void;
}

export const AiAdvisorCard: React.FC<AiAdvisorCardProps> = ({
  narrative,
  topChoice,
  onNavigateToComparison
}) => {
  return (
    <div className="bg-slate-850 rounded-xl border border-slate-800 p-6 shadow-md relative overflow-hidden">
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center space-x-2">
              <span>Decision Support Engine</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                Deterministic Rule-Based
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Autonomous engineering diagnosis & multi-objective synthesis
            </p>
          </div>
        </div>
        <button
          onClick={onNavigateToComparison}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center space-x-1 transition"
        >
          <span>View Matrix</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Executive Summary */}
      <div className="mt-4 bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 text-xs text-slate-200 leading-relaxed font-mono">
        <div className="flex items-start space-x-2">
          <Compass className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>{narrative.executive_summary}</div>
        </div>
      </div>

      {/* Grid: Constraints & Top Choice Rationale */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Governing Constraints */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Governing Site Bottlenecks</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {narrative.governing_constraints.map((c, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Selected Model Justification */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Top Choice Technical Justification</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {narrative.top_choice_rationale}
          </p>
        </div>
      </div>

      {/* Trade-off Analysis */}
      <div className="mt-4 bg-slate-900/40 border border-slate-800/60 rounded-lg p-3 text-xs text-slate-300">
        <span className="font-semibold text-slate-200">Alternative Options & Trade-offs: </span>
        <span className="text-slate-400">{narrative.tradeoff_analysis}</span>
      </div>

      {/* Engineering Action Items & Missing Data */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Practical Field Improvements */}
        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3">
          <h5 className="font-semibold text-emerald-300 flex items-center space-x-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            <span>Recommended Engineering Mitigations</span>
          </h5>
          <ul className="space-y-1.5 text-slate-300">
            {narrative.engineering_action_items.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-1.5">
                <span className="text-emerald-400 font-mono">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Missing Measurements & Parameter Sensitivity */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
          <h5 className="font-semibold text-slate-300 flex items-center space-x-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
            <span>Sensitivity & Missing Field Measurements</span>
          </h5>
          <ul className="space-y-1.5 text-slate-400">
            {narrative.missing_data_advisory.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-1.5">
                <span className="text-slate-500 font-mono">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
