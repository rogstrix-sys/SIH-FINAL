import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LeftNavigation } from './components/LeftNavigation';
import { OverviewDashboard } from './components/views/OverviewDashboard';
import { Simulation3DView } from './components/views/Simulation3DView';
import { TerrainScenariosView } from './components/views/TerrainScenariosView';
import { LiveOperationsView } from './components/views/LiveOperationsView';
import { EngineeringAnalysisView } from './components/views/EngineeringAnalysisView';
import { PrototypePlanningView } from './components/views/PrototypePlanningView';
import { SensorsView } from './components/views/SensorsView';
import { ParametersView } from './components/views/ParametersView';
import { ReportsView } from './components/views/ReportsView';
import { GuidedDemoTour } from './components/GuidedDemoTour';

// Field / Scenario exploration components
import { CanyonExpedition3D } from './components/canyonSimulation/CanyonExpedition3D';
import { Simulation3D } from './components/Simulation3D';
import { SubsurfaceVaultSim3D } from './components/vaultSimulation/SubsurfaceVaultSim3D';
import { BhavyamDashboardView } from './components/BhavyamDashboardView';
import { Dashboard } from './components/Dashboard';
import { SiteAssessmentForm } from './components/SiteAssessmentForm';

import { useSimulationStore } from './store/useSimulationStore';
import { SiteConditions, EvaluationWeights, FullRecommendationResponse, ScenarioItem } from './types';
import { api } from './services/api';
import { ArrowLeft, Box, Mountain, Compass, LayoutDashboard } from 'lucide-react';

const DEFAULT_SITE: SiteConditions = {
  terrain_type: 'mountainous',
  slope_degrees: 22.0,
  access_width_m: 1.3,
  distance_to_facility_m: 45.0,
  route_length_m: 2200.0,
  road_surface: 'gravel',
  elevation_m: 2100.0,
  climate_zone: 'cold_freezing',
  temperature_c: -2.0,
  rainfall_mm_h: 0.0,
  containment_volume_liters: 3200.0,
  sludge_consistency: 'viscous',
  solids_concentration_pct: 15.0,
  pumping_distance_m: 45.0,
  vertical_suction_lift_m: 3.8,
  water_available_l: 120.0,
  power_available: false,
  budget_usd: 350.0,
  desired_duration_h: 4.5
};

const DEFAULT_WEIGHTS: EvaluationWeights = {
  cost_weight: 0.25,
  time_weight: 0.20,
  accessibility_weight: 0.20,
  climate_weight: 0.15,
  safety_weight: 0.10,
  portability_weight: 0.10
};

export const App: React.FC = () => {
  const activeView = useSimulationStore((s) => s.activeView);
  const setActiveView = useSimulationStore((s) => s.setActiveView);

  // Field scenario view overlay (defaults to 'simulation3d' so Mountain Terrain Sim loads immediately at localhost:3000)
  const [legacyView, setLegacyView] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlView = params.get('view') || params.get('sim');
      if (urlView === 'mountain' || urlView === 'simulation3d') return 'simulation3d';
      if (urlView === 'canyon' || urlView === 'canyon3d') return 'canyon3d';
      if (urlView === 'dashboard') return 'dashboard';
      if (urlView === 'control' || urlView === 'digitaltwin') return null;
      const stored = localStorage.getItem('sih_legacy_view');
      if (stored !== null) return stored === 'none' ? null : stored;
    }
    return 'simulation3d';
  });

  const handleSetLegacyView = (view: string | null) => {
    setLegacyView(view);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sih_legacy_view', view || 'none');
    }
  };

  const [site, setSite] = useState<SiteConditions>(DEFAULT_SITE);
  const [weights, setWeights] = useState<EvaluationWeights>(DEFAULT_WEIGHTS);
  const [recommendationData, setRecommendationData] = useState<FullRecommendationResponse | null>(null);
  const [presets, setPresets] = useState<ScenarioItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        const presetData = await api.getScenarioPresets();
        setPresets(presetData);
      } catch (err) {
        console.warn('API presets unavailable, using local mock defaults.');
      }

      try {
        const res = await api.getRecommendations(DEFAULT_SITE, DEFAULT_WEIGHTS);
        setRecommendationData(res);
      } catch (err) {
        console.warn('Backend API offline or unreachable, continuing in stand-alone simulation mode.');
      }
    };

    init();
  }, []);

  const topChoice = recommendationData?.recommendations[0];

  return (
    <div className="min-h-screen bg-graphite-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* 1. Global Header */}
      <Header />

      {/* Interactive Guided Demonstration Overlay */}
      <GuidedDemoTour />

      {/* Legacy / Field Scenario Overlay banner if active */}
      {legacyView && (
        <div className="bg-graphite-900 border-b border-safety-500/40 px-4 py-2 flex items-center justify-between text-xs font-mono z-40">
          <div className="flex items-center gap-2 text-safety-400">
            <span className="w-2 h-2 rounded-full bg-safety-500 animate-pulse" />
            <span className="font-semibold uppercase">Field Scenario View: {legacyView}</span>
          </div>
          <button
            onClick={() => handleSetLegacyView(null)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-graphite-800 hover:bg-graphite-700 text-white border border-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-safety-400" />
            <span>Return to Digital Twin Control Room</span>
          </button>
        </div>
      )}

      {/* 2. Main Workspace Layout */}
      {legacyView ? (
        <div className="flex-1 overflow-y-auto">
          {legacyView === 'canyon3d' && (
            <CanyonExpedition3D
              site={site}
              setSite={setSite}
              topChoice={topChoice}
              onSwitchToMountainSim={() => handleSetLegacyView('simulation3d')}
              onSwitchToVaultSim={() => handleSetLegacyView('vault3d')}
            />
          )}

          {legacyView === 'simulation3d' && (
            <Simulation3D
              site={site}
              setSite={setSite}
              topChoice={topChoice}
              onSwitchToVaultSim={() => handleSetLegacyView('vault3d')}
              onSwitchToCanyonSim={() => handleSetLegacyView('canyon3d')}
            />
          )}

          {legacyView === 'vault3d' && (
            <SubsurfaceVaultSim3D
              site={site}
              setSite={setSite}
              topChoice={topChoice}
              onSwitchToMountainSim={() => handleSetLegacyView('simulation3d')}
              onSwitchToCanyonSim={() => handleSetLegacyView('canyon3d')}
            />
          )}

          {legacyView === 'dashboard' && recommendationData && (
            <div className="max-w-7xl mx-auto p-6">
              <Dashboard
                topChoice={topChoice}
                recommendations={recommendationData.recommendations}
                site={site}
                safety={recommendationData.safety_assessment}
                narrative={recommendationData.ai_narrative}
                recentScenarios={presets}
                onSelectScenario={(sc) => setSite(sc.site_conditions)}
                onNavigateTab={(tab) => handleSetLegacyView(tab)}
              />
            </div>
          )}

          {legacyView === 'bhavyam' && (
            <div className="max-w-7xl mx-auto p-4 space-y-4">
              <BhavyamDashboardView />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Rail */}
          <LeftNavigation onOpenLegacyView={(viewId) => handleSetLegacyView(viewId)} />

          {/* Primary View Display */}
          <main className="flex-1 flex flex-col overflow-hidden bg-graphite-950">
            {activeView === 'overview' && <OverviewDashboard />}
            {activeView === 'simulation3d' && <Simulation3DView />}
            {activeView === 'terrain' && <TerrainScenariosView />}
            {activeView === 'operations' && <LiveOperationsView />}
            {activeView === 'sensors' && <SensorsView />}
            {activeView === 'analysis' && <EngineeringAnalysisView />}
            {activeView === 'reports' && <ReportsView />}
            {activeView === 'prototype' && <PrototypePlanningView />}
            {activeView === 'parameters' && <ParametersView />}
          </main>
        </div>
      )}
    </div>
  );
};
export default App;
