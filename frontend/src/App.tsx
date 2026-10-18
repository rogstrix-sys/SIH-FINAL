import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SiteAssessmentForm } from './components/SiteAssessmentForm';
import { TerrainSimulationSVG } from './components/TerrainSimulationSVG';
import { Simulation3D } from './components/Simulation3D';
import { SubsurfaceVaultSim3D } from './components/vaultSimulation/SubsurfaceVaultSim3D';
import { RouteAccessPlanner } from './components/RouteAccessPlanner';
import { EquipmentComparison } from './components/EquipmentComparison';
import { SafetyPanel } from './components/SafetyPanel';
import { EngineeringReport } from './components/EngineeringReport';
import { ScenarioManager } from './components/ScenarioManager';
import { SiteConditions, EvaluationWeights, FullRecommendationResponse, ScenarioItem } from './types';
import { api } from './services/api';

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
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [site, setSite] = useState<SiteConditions>(DEFAULT_SITE);
  const [weights, setWeights] = useState<EvaluationWeights>(DEFAULT_WEIGHTS);
  
  const [recommendationData, setRecommendationData] = useState<FullRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [presets, setPresets] = useState<ScenarioItem[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [savedScenarios, setSavedScenarios] = useState<ScenarioItem[]>([]);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);

  // Initial load: health check, presets, scenarios, initial recommendation
  useEffect(() => {
    const initialize = async () => {
      try {
        await api.getHealth();
        setBackendOnline(true);
      } catch (err) {
        console.warn('Backend offline or starting up...');
        setBackendOnline(false);
      }

      try {
        const presetData = await api.getScenarioPresets();
        setPresets(presetData);
      } catch (err) {
        console.warn('Error fetching presets:', err);
      }

      try {
        const scenarioData = await api.getScenarios();
        setSavedScenarios(scenarioData);
      } catch (err) {
        console.warn('Error fetching scenarios:', err);
      }

      runEvaluation(DEFAULT_SITE, DEFAULT_WEIGHTS);
    };

    initialize();
  }, []);

  const runEvaluation = async (targetSite: SiteConditions, targetWeights: EvaluationWeights) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.getRecommendations(targetSite, targetWeights);
      setRecommendationData(res);
      setBackendOnline(true);
    } catch (err: any) {
      console.error('Recommendation fetch error:', err);
      setErrorMsg(err.message || 'Failed to calculate recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run evaluation when site changes
  const handleSiteChange = (newSite: SiteConditions) => {
    setSite(newSite);
    runEvaluation(newSite, weights);
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const matched = presets.find((p) => p.id === presetId);
    if (matched) {
      setSite(matched.site_conditions);
      runEvaluation(matched.site_conditions, weights);
    }
  };

  const handleLoadScenario = (scenario: ScenarioItem) => {
    setSite(scenario.site_conditions);
    runEvaluation(scenario.site_conditions, weights);
    setActiveTab('dashboard');
  };

  const refreshScenarios = async () => {
    try {
      const data = await api.getScenarios();
      setSavedScenarios(data);
    } catch (err) {
      console.error(err);
    }
  };

  const topChoice = recommendationData?.recommendations[0];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendOnline={backendOnline}
        presets={presets}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onOpenSaveModal={() => setIsScenarioModalOpen(true)}
        onPrintReport={() => setActiveTab('report')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error notification if any */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs flex justify-between items-center shadow-lg">
            <div>
              <span className="font-bold">Error executing calculation: </span>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => runEvaluation(site, weights)}
              className="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 rounded text-white font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        {recommendationData && (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                topChoice={topChoice}
                recommendations={recommendationData.recommendations}
                site={site}
                safety={recommendationData.safety_assessment}
                narrative={recommendationData.ai_narrative}
                recentScenarios={presets.concat(savedScenarios)}
                onSelectScenario={handleLoadScenario}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'assessment' && (
              <SiteAssessmentForm
                site={site}
                setSite={setSite}
                onRunEvaluation={() => runEvaluation(site, weights)}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'simulation' && (
              <TerrainSimulationSVG
                site={site}
                setSite={setSite}
                topChoice={topChoice}
              />
            )}

            {activeTab === 'simulation3d' && (
              <Simulation3D
                site={site}
                setSite={setSite}
                topChoice={topChoice}
                onSwitchToVaultSim={() => setActiveTab('vault3d')}
              />
            )}

            {activeTab === 'vault3d' && (
              <SubsurfaceVaultSim3D
                site={site}
                setSite={setSite}
                topChoice={topChoice}
                onSwitchToMountainSim={() => setActiveTab('simulation3d')}
              />
            )}

            {activeTab === 'route' && (
              <RouteAccessPlanner
                site={site}
                setSite={setSite}
                recommendations={recommendationData.recommendations}
              />
            )}

            {activeTab === 'comparison' && (
              <EquipmentComparison
                recommendations={recommendationData.recommendations}
                weights={weights}
                setWeights={setWeights}
                onRecalculateWithWeights={() => runEvaluation(site, weights)}
              />
            )}

            {activeTab === 'safety' && (
              <SafetyPanel
                safety={recommendationData.safety_assessment}
                site={site}
              />
            )}

            {activeTab === 'report' && (
              <EngineeringReport
                site={site}
                topChoice={topChoice}
                recommendations={recommendationData.recommendations}
                safety={recommendationData.safety_assessment}
                narrative={recommendationData.ai_narrative}
              />
            )}
          </>
        )}
      </main>

      {/* Scenario Manager Modal */}
      <ScenarioManager
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        currentSite={site}
        currentRecommendation={topChoice}
        savedScenarios={savedScenarios}
        onRefreshScenarios={refreshScenarios}
        onLoadScenario={handleLoadScenario}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500 font-mono no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Innovative Mechanized Desludging Decision Support System v1.0</span>
          <span>Zero Physical Pit Entry Mandated · ISO 21876 / OSHA 1910.146</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
