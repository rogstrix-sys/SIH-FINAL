import { SiteConditions, EvaluationWeights, FullRecommendationResponse, ScenarioItem, EquipmentProfile } from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },

  async getEquipment(): Promise<EquipmentProfile[]> {
    const res = await fetch(`${API_BASE}/equipment`);
    if (!res.ok) throw new Error('Failed to fetch equipment catalog');
    return res.json();
  },

  async updateEquipment(id: string, profile: EquipmentProfile): Promise<EquipmentProfile> {
    const res = await fetch(`${API_BASE}/equipment/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error('Failed to update equipment');
    return res.json();
  },

  async resetEquipment(): Promise<EquipmentProfile[]> {
    const res = await fetch(`${API_BASE}/equipment/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset equipment catalog');
    return res.json();
  },

  async getRecommendations(site: SiteConditions, weights?: EvaluationWeights): Promise<FullRecommendationResponse> {
    const res = await fetch(`${API_BASE}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site, weights })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Recommendation engine failed' }));
      throw new Error(err.detail || 'Recommendation engine failed');
    }
    return res.json();
  },

  async getScenarioPresets(): Promise<ScenarioItem[]> {
    const res = await fetch(`${API_BASE}/scenarios/presets`);
    if (!res.ok) throw new Error('Failed to fetch scenario presets');
    return res.json();
  },

  async getScenarios(): Promise<ScenarioItem[]> {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (!res.ok) throw new Error('Failed to fetch saved scenarios');
    return res.json();
  },

  async createScenario(data: {
    name: string;
    description?: string;
    site_conditions: SiteConditions;
    selected_equipment_id?: string;
    results_snapshot?: any;
  }): Promise<ScenarioItem> {
    const res = await fetch(`${API_BASE}/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save scenario');
    return res.json();
  },

  async duplicateScenario(id: string): Promise<ScenarioItem> {
    const res = await fetch(`${API_BASE}/scenarios/${id}/duplicate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to duplicate scenario');
    return res.json();
  },

  async deleteScenario(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/scenarios/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete scenario');
  },

  getExportCsvUrl(): string {
    return `${API_BASE}/scenarios/export/csv`;
  }
};
