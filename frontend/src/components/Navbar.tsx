import React from 'react';
import { Mountain, ShieldAlert, FileText, MapPin, Sliders, BarChart3, Activity, Save, Rotate3d, Box, Compass } from 'lucide-react';
import { ScenarioItem } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  backendOnline: boolean;
  presets: ScenarioItem[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenSaveModal: () => void;
  onPrintReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  backendOnline,
  presets,
  selectedPresetId,
  onSelectPreset,
  onOpenSaveModal,
  onPrintReport
}) => {
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'assessment', label: 'Site Assessment', icon: Sliders },
    { id: 'simulation', label: 'Terrain Simulation', icon: Mountain },
    { id: 'simulation3d', label: 'Mountain 3D', icon: Rotate3d },
    { id: 'canyon3d', label: 'Canyon 3D Sim', icon: Compass },
    { id: 'vault3d', label: 'Vault 3D Sim', icon: Box },
    { id: 'route', label: 'Route & Access', icon: MapPin },
    { id: 'comparison', label: 'Equipment Matrix', icon: Activity },
    { id: 'safety', label: 'Safety & Hazard Control', icon: ShieldAlert },
    { id: 'report', label: 'Engineering Report', icon: FileText },
  ];

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50 shadow-lg no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Mountain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">DesludgeEngine</span>
                <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono hidden sm:block">
                Adaptive Mechanized Desludging · Varied Climates & Mountain Terrains
              </p>
            </div>
          </div>

          {/* Preset selector & Actions */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <span className="text-slate-400 font-medium">Scenario:</span>
              <select
                aria-label="Benchmark Scenarios"
                className="bg-transparent border-0 text-emerald-400 font-medium focus:ring-0 cursor-pointer pr-4 text-xs"
                value={selectedPresetId}
                onChange={(e) => onSelectPreset(e.target.value)}
              >
                <option value="" className="bg-slate-900 text-slate-300">Select Benchmark Scenario...</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onOpenSaveModal}
              className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition"
              title="Save Current Scenario"
            >
              <Save className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Save</span>
            </button>

            <button
              onClick={onPrintReport}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition"
              title="Export Printable Report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Print Report</span>
            </button>

            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800" title={backendOnline ? 'Backend API connected' : 'Backend offline'}>
              <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">
                {backendOnline ? 'ENGINE ONLINE' : 'DISCONNECTED'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
