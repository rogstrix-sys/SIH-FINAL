import React from 'react';
import {
  LayoutDashboard,
  Box,
  Activity,
  Sliders,
  FileText,
  Mountain,
  Compass
} from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { NavView } from '../types/digitalTwin';

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Main industrial control dashboard'
  },
  {
    id: 'simulation3d',
    label: '3D Machine',
    icon: Box,
    description: 'Full-canvas interactive digital twin mechanical model'
  },
  {
    id: 'terrain',
    label: 'Terrain Scenarios',
    icon: Mountain,
    badge: 'SIH',
    description: 'Climatic zones and steep hilly access models'
  },
  {
    id: 'operations',
    label: 'Live Operations',
    icon: Activity,
    badge: 'LIVE',
    description: 'Real-time sequencing, safety interlocks & gas matrix'
  },
  {
    id: 'analysis',
    label: 'Engineering Analysis',
    icon: FileText,
    description: 'Darcy-Weisbach head loss, rheology & mass balance'
  },
  {
    id: 'prototype',
    label: 'Prototype Planning',
    icon: Compass,
    badge: 'TRL 4',
    description: 'Hardware BOM, modular assembly & TRL roadmap'
  }
];

export interface LeftNavigationProps {
  onOpenLegacyView?: (viewId: string) => void;
}

export const LeftNavigation: React.FC<LeftNavigationProps> = ({ onOpenLegacyView }) => {
  const activeView = useSimulationStore((s) => s.activeView);
  const setActiveView = useSimulationStore((s) => s.setActiveView);
  const alarmsActive = useSimulationStore((s) => s.alarmsActive);

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="w-64 bg-graphite-950 border-r border-slate-800/80 flex flex-col justify-between p-3 select-none shrink-0"
    >
      {/* Primary Navigation List */}
      <nav className="space-y-1.5" role="tablist">
        <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Control Center
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const hasAlarmOnSensors = (item.id === 'operations' || item.id === 'sensors') && alarmsActive > 0;

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group focus:outline-none focus:ring-2 focus:ring-safety-500/60 ${
                isActive
                  ? 'bg-graphite-850 text-white border-l-2 border-safety-500 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-graphite-900 border-l-2 border-transparent'
              }`}
              title={item.description}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-safety-500'
                      : hasAlarmOnSensors
                      ? 'text-rose-400 animate-pulse'
                      : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                    hasAlarmOnSensors
                      ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                      : isActive
                      ? 'bg-safety-500/20 text-safety-400 border border-safety-500/30'
                      : 'bg-graphite-900 text-slate-400'
                  }`}
                >
                  {hasAlarmOnSensors ? `! ${alarmsActive}` : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Auxiliary / Field Terrain Switchers */}
      {onOpenLegacyView && (
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Field Scenarios
          </div>
          <button
            onClick={() => onOpenLegacyView('canyon3d')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-graphite-900 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">Canyon Bridge Sim</span>
          </button>
          <button
            onClick={() => onOpenLegacyView('simulation3d')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-graphite-900 transition-colors"
          >
            <Mountain className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">Mountain Terrain Sim</span>
          </button>
        </div>
      )}
    </aside>
  );
};
