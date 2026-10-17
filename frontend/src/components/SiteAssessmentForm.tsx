import React, { useState } from 'react';
import { Sliders, MapPin, CloudRain, Droplet, DollarSign, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { SiteConditions, TerrainType, RoadSurface, ClimateZone, SludgeConsistency } from '../types';

interface SiteAssessmentFormProps {
  site: SiteConditions;
  setSite: React.Dispatch<React.SetStateAction<SiteConditions>>;
  onRunEvaluation: () => void;
  isLoading: boolean;
}

export const SiteAssessmentForm: React.FC<SiteAssessmentFormProps> = ({
  site,
  setSite,
  onRunEvaluation,
  isLoading
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'geo' | 'climate' | 'sludge' | 'logistics'>('geo');

  const handleChange = (field: keyof SiteConditions, value: any) => {
    setSite((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Physical validation checks
  const validationWarnings: string[] = [];
  if (site.vertical_suction_lift_m > 7.0) {
    validationWarnings.push(`Suction lift (${site.vertical_suction_lift_m}m) exceeds 7.0m practical atmospheric vacuum limit. Cavitation risk!`);
  }
  if (site.slope_degrees > 35.0) {
    validationWarnings.push(`Slope (${site.slope_degrees}°) exceeds 35° mountaineering terrain threshold.`);
  }
  if (site.access_width_m < 0.8) {
    validationWarnings.push(`Access width (${site.access_width_m}m) is narrower than standard pedestrian stretchers/dollies.`);
  }
  if (site.temperature_c < -5.0 && site.rainfall_mm_h > 0) {
    validationWarnings.push('Sub-zero temperature with rainfall will cause instantaneous black-ice surface hazard.');
  }

  return (
    <div className="bg-slate-850 rounded-xl border border-slate-800 p-6 shadow-md">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>Site Assessment & Input Parameters</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure site-specific geographic, climatic, rheological, and logistical variables
          </p>
        </div>

        <button
          onClick={onRunEvaluation}
          disabled={isLoading}
          className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>Recalculate Engine</span>
        </button>
      </div>

      {/* Validation Alert Banner */}
      {validationWarnings.length > 0 && (
        <div className="mt-4 bg-amber-950/40 border border-amber-600/40 rounded-lg p-3 text-xs text-amber-200">
          <div className="flex items-center space-x-2 font-semibold mb-1 text-amber-300">
            <AlertOctagon className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Physical Feasibility Warning:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-300/90 pl-1">
            {validationWarnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="mt-5 flex space-x-2 border-b border-slate-800 pb-2 text-xs">
        {[
          { id: 'geo', label: '1. Geographic & Terrain', icon: MapPin },
          { id: 'climate', label: '2. Climate & Environment', icon: CloudRain },
          { id: 'sludge', label: '3. Sludge Rheology & Pit', icon: Droplet },
          { id: 'logistics', label: '4. Logistics & Utilities', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                isActive
                  ? 'bg-slate-700 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Fields Content */}
      <div className="mt-5 text-xs">
        {/* Tab 1: Geographic */}
        {activeSubTab === 'geo' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Terrain Category</label>
              <select
                value={site.terrain_type}
                onChange={(e) => handleChange('terrain_type', e.target.value as TerrainType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="flat">Flat (0° - 4°)</option>
                <option value="rolling">Rolling Hills (5° - 14°)</option>
                <option value="hilly">Hilly Terrain (15° - 24°)</option>
                <option value="mountainous">Mountainous / Steep (25° - 45°)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Slope Angle (°)</span>
                <span className="font-mono text-emerald-400">{site.slope_degrees}°</span>
              </div>
              <input
                type="number"
                min="0"
                max="45"
                step="0.5"
                value={site.slope_degrees}
                onChange={(e) => handleChange('slope_degrees', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Access Road Width (m)</span>
                <span className="font-mono text-emerald-400">{site.access_width_m} m</span>
              </div>
              <input
                type="number"
                min="0.5"
                max="10.0"
                step="0.1"
                value={site.access_width_m}
                onChange={(e) => handleChange('access_width_m', parseFloat(e.target.value) || 0.5)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Road Surface Condition</label>
              <select
                value={site.road_surface}
                onChange={(e) => handleChange('road_surface', e.target.value as RoadSurface)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="paved">Paved / Asphalt / Concrete</option>
                <option value="gravel">Compacted Gravel / Crushed Stone</option>
                <option value="mud">Wet Mud / Waterlogged Earth</option>
                <option value="rough_trail">Rough Dirt Trail / Stepped Pathway</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Distance to Facility / Pit (m)</span>
                <span className="font-mono text-emerald-400">{site.distance_to_facility_m} m</span>
              </div>
              <input
                type="number"
                min="1"
                max="300"
                step="1"
                value={site.distance_to_facility_m}
                onChange={(e) => handleChange('distance_to_facility_m', parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Elevation Above Sea Level (m)</span>
                <span className="font-mono text-emerald-400">{site.elevation_m} m</span>
              </div>
              <input
                type="number"
                min="0"
                max="5000"
                step="50"
                value={site.elevation_m}
                onChange={(e) => handleChange('elevation_m', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Climate */}
        {activeSubTab === 'climate' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Climate Classification</label>
              <select
                value={site.climate_zone}
                onChange={(e) => handleChange('climate_zone', e.target.value as ClimateZone)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="hot_arid">Hot and Arid (Desert / Dust)</option>
                <option value="tropical_humid">Tropical and Humid</option>
                <option value="monsoon_heavy">Heavy Monsoon Rainfall</option>
                <option value="cold_freezing">Cold and Freezing (Sub-zero)</option>
                <option value="temperate">Temperate (Mild)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Ambient Temperature (°C)</span>
                <span className="font-mono text-emerald-400">{site.temperature_c}°C</span>
              </div>
              <input
                type="number"
                min="-30"
                max="55"
                step="1"
                value={site.temperature_c}
                onChange={(e) => handleChange('temperature_c', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Rainfall Intensity (mm/h)</span>
                <span className="font-mono text-emerald-400">{site.rainfall_mm_h} mm/h</span>
              </div>
              <input
                type="number"
                min="0"
                max="120"
                step="1"
                value={site.rainfall_mm_h}
                onChange={(e) => handleChange('rainfall_mm_h', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Sludge & Pit */}
        {activeSubTab === 'sludge' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Containment Volume (Litres)</span>
                <span className="font-mono text-emerald-400">{site.containment_volume_liters} L</span>
              </div>
              <input
                type="number"
                min="200"
                max="25000"
                step="100"
                value={site.containment_volume_liters}
                onChange={(e) => handleChange('containment_volume_liters', parseFloat(e.target.value) || 200)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Sludge Qualitative Consistency</label>
              <select
                value={site.sludge_consistency}
                onChange={(e) => handleChange('sludge_consistency', e.target.value as SludgeConsistency)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="liquid">Liquid / Fresh (Viscosity &lt; 50 cP)</option>
                <option value="slurry">Slurry / Standard (Viscosity ~ 250 cP)</option>
                <option value="viscous">Viscous / Aged Digest (Viscosity ~ 2,200 cP)</option>
                <option value="thick_crust">Thick Crust / Solidified Scum (Viscosity &gt; 7,500 cP)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Total Solids Concentration (% w/w)</span>
                <span className="font-mono text-emerald-400">{site.solids_concentration_pct}%</span>
              </div>
              <input
                type="number"
                min="1"
                max="35"
                step="0.5"
                value={site.solids_concentration_pct}
                onChange={(e) => handleChange('solids_concentration_pct', parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Pumping Hose Length (m)</span>
                <span className="font-mono text-emerald-400">{site.pumping_distance_m} m</span>
              </div>
              <input
                type="number"
                min="5"
                max="250"
                step="5"
                value={site.pumping_distance_m}
                onChange={(e) => handleChange('pumping_distance_m', parseFloat(e.target.value) || 5)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Vertical Suction Lift (m)</span>
                <span className="font-mono text-emerald-400">{site.vertical_suction_lift_m} m</span>
              </div>
              <input
                type="number"
                min="0.5"
                max="10.0"
                step="0.1"
                value={site.vertical_suction_lift_m}
                onChange={(e) => handleChange('vertical_suction_lift_m', parseFloat(e.target.value) || 0.5)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Logistics */}
        {activeSubTab === 'logistics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Available Water on Site (L)</span>
                <span className="font-mono text-emerald-400">{site.water_available_l} L</span>
              </div>
              <input
                type="number"
                min="0"
                max="2000"
                step="50"
                value={site.water_available_l}
                onChange={(e) => handleChange('water_available_l', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">On-Site Grid Electrical Power</label>
              <div className="flex items-center space-x-3 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="power"
                    checked={site.power_available === true}
                    onChange={() => handleChange('power_available', true)}
                    className="text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="text-slate-200">Available (Single/3-Phase AC)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="power"
                    checked={site.power_available === false}
                    onChange={() => handleChange('power_available', false)}
                    className="text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="text-slate-200">No Grid (Off-grid engine only)</span>
                </label>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Service Target Budget (USD)</span>
                <span className="font-mono text-emerald-400">${site.budget_usd}</span>
              </div>
              <input
                type="number"
                min="30"
                max="3000"
                step="10"
                value={site.budget_usd}
                onChange={(e) => handleChange('budget_usd', parseFloat(e.target.value) || 30)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Transit Route Length to FSTP (m)</span>
                <span className="font-mono text-emerald-400">{site.route_length_m} m</span>
              </div>
              <input
                type="number"
                min="100"
                max="30000"
                step="100"
                value={site.route_length_m}
                onChange={(e) => handleChange('route_length_m', parseFloat(e.target.value) || 100)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Desired Shift Duration (Hours)</span>
                <span className="font-mono text-emerald-400">{site.desired_duration_h} hrs</span>
              </div>
              <input
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={site.desired_duration_h}
                onChange={(e) => handleChange('desired_duration_h', parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
