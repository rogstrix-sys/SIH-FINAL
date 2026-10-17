import React, { useState } from 'react';
import { Save, Trash2, Copy, Download, X, Layers, Check, AlertCircle } from 'lucide-react';
import { ScenarioItem, SiteConditions, EquipmentRecommendation } from '../types';
import { api } from '../services/api';

interface ScenarioManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSite: SiteConditions;
  currentRecommendation?: EquipmentRecommendation;
  savedScenarios: ScenarioItem[];
  onRefreshScenarios: () => void;
  onLoadScenario: (scenario: ScenarioItem) => void;
}

export const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  isOpen,
  onClose,
  currentSite,
  currentRecommendation,
  savedScenarios,
  onRefreshScenarios,
  onLoadScenario
}) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      await api.createScenario({
        name: name.trim(),
        description: description.trim(),
        site_conditions: currentSite,
        selected_equipment_id: currentRecommendation?.equipment.id,
        results_snapshot: currentRecommendation?.calculations
      });
      setStatusMsg('Scenario successfully saved to database!');
      setName('');
      setDescription('');
      onRefreshScenarios();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message || 'Failed to save'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicateScenario(id);
      onRefreshScenarios();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this saved scenario?')) {
      try {
        await api.deleteScenario(id);
        onRefreshScenarios();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Simulation Scenario Management &amp; Persistence
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Save Current Scenario Form */}
          <form onSubmit={handleSave} className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-semibold text-slate-200 flex items-center space-x-1.5">
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Save Current Site Simulation Scenario</span>
            </h4>

            {statusMsg && (
              <div className="p-2 rounded bg-emerald-950/80 border border-emerald-600/60 text-emerald-300">
                {statusMsg}
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">Scenario Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Mussoorie Hillside Cluster B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Description / Project Notes</label>
              <textarea
                rows={2}
                placeholder="Operational notes, road condition observations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500 font-mono text-[11px]">
                Volume: {currentSite.containment_volume_liters}L · Slope: {currentSite.slope_degrees}° · {currentSite.climate_zone}
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Scenario'}
              </button>
            </div>
          </form>

          {/* Saved Scenarios List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-slate-300 uppercase tracking-wider">
                Saved Database Scenarios ({savedScenarios.length})
              </h4>
              <a
                href={api.getExportCsvUrl()}
                className="text-emerald-400 hover:text-emerald-300 inline-flex items-center space-x-1 font-medium text-xs"
                download
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV Spreadsheet</span>
              </a>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {savedScenarios.length === 0 ? (
                <div className="text-slate-500 text-center py-6">
                  No saved custom scenarios yet. Save your current simulation above!
                </div>
              ) : (
                savedScenarios.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-3 bg-slate-850 border border-slate-800 rounded-lg flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center space-x-2">
                        <span>{sc.name}</span>
                        {sc.is_preset && (
                          <span className="text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded">Preset</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {sc.site_conditions.terrain_type} · {sc.site_conditions.slope_degrees}° · {sc.site_conditions.containment_volume_liters}L · {sc.site_conditions.road_surface}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          onLoadScenario(sc);
                          onClose();
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded text-[11px] font-medium transition"
                      >
                        Load
                      </button>

                      <button
                        onClick={() => handleDuplicate(sc.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 transition"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {!sc.is_preset && (
                        <button
                          onClick={() => handleDelete(sc.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
