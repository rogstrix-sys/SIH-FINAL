import {
  SiteConditions,
  EvaluationWeights,
  FullRecommendationResponse,
  ScenarioItem,
  EquipmentProfile
} from '../types';
import {
  CLIENT_EQUIPMENT_CATALOG,
  CLIENT_PRESETS,
  runClientEvaluation
} from './clientFallback';

const API_BASE = '/api';

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('Backend health check failed');
      return await res.json();
    } catch {
      return { status: 'healthy', mode: 'client_fallback', service: 'desludging-decision-support' };
    }
  },

  async getEquipment(): Promise<EquipmentProfile[]> {
    try {
      const res = await fetch(`${API_BASE}/equipment`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('Failed to fetch equipment catalog');
      return await res.json();
    } catch {
      return CLIENT_EQUIPMENT_CATALOG;
    }
  },

  async updateEquipment(id: string, profile: EquipmentProfile): Promise<EquipmentProfile> {
    try {
      const res = await fetch(`${API_BASE}/equipment/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error('Failed to update equipment');
      return await res.json();
    } catch {
      const idx = CLIENT_EQUIPMENT_CATALOG.findIndex((e) => e.id === id);
      if (idx !== -1) CLIENT_EQUIPMENT_CATALOG[idx] = profile;
      return profile;
    }
  },

  async resetEquipment(): Promise<EquipmentProfile[]> {
    try {
      const res = await fetch(`${API_BASE}/equipment/reset`, { method: 'POST', signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('Failed to reset equipment catalog');
      return await res.json();
    } catch {
      return CLIENT_EQUIPMENT_CATALOG;
    }
  },

  async getRecommendations(site: SiteConditions, weights?: EvaluationWeights): Promise<FullRecommendationResponse> {
    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, weights }),
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error('Backend recommendation failed');
      return await res.json();
    } catch {
      // High-fidelity client-side engineering engine fallback
      return runClientEvaluation(site, weights);
    }
  },

  async getScenarioPresets(): Promise<ScenarioItem[]> {
    try {
      const res = await fetch(`${API_BASE}/scenarios/presets`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('Failed to fetch scenario presets');
      return await res.json();
    } catch {
      return CLIENT_PRESETS;
    }
  },

  async getScenarios(): Promise<ScenarioItem[]> {
    try {
      const res = await fetch(`${API_BASE}/scenarios`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('Failed to fetch saved scenarios');
      return await res.json();
    } catch {
      const saved = localStorage.getItem('saved_scenarios');
      return saved ? JSON.parse(saved) : CLIENT_PRESETS;
    }
  },

  async createScenario(data: {
    name: string;
    description?: string;
    site_conditions: SiteConditions;
    selected_equipment_id?: string;
    results_snapshot?: any;
  }): Promise<ScenarioItem> {
    try {
      const res = await fetch(`${API_BASE}/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error('Failed to save scenario');
      return await res.json();
    } catch {
      const newScenario: ScenarioItem = {
        id: `SCENARIO-${Date.now()}`,
        name: data.name,
        description: data.description,
        site_conditions: data.site_conditions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_preset: false,
        selected_equipment_id: data.selected_equipment_id,
        results_snapshot: data.results_snapshot
      };
      const existing = localStorage.getItem('saved_scenarios');
      const list = existing ? JSON.parse(existing) : [];
      list.push(newScenario);
      localStorage.setItem('saved_scenarios', JSON.stringify(list));
      return newScenario;
    }
  },

  async duplicateScenario(id: string): Promise<ScenarioItem> {
    try {
      const res = await fetch(`${API_BASE}/scenarios/${id}/duplicate`, { method: 'POST', signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('Failed to duplicate scenario');
      return await res.json();
    } catch {
      const presets = await this.getScenarioPresets();
      const match = presets.find((p) => p.id === id);
      if (match) {
        return this.createScenario({
          name: `${match.name} (Copy)`,
          description: match.description,
          site_conditions: match.site_conditions
        });
      }
      throw new Error('Scenario not found');
    }
  },

  async deleteScenario(id: string): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/scenarios/${id}`, { method: 'DELETE', signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('Failed to delete scenario');
    } catch {
      const existing = localStorage.getItem('saved_scenarios');
      if (existing) {
        const list = JSON.parse(existing).filter((s: ScenarioItem) => s.id !== id);
        localStorage.setItem('saved_scenarios', JSON.stringify(list));
      }
    }
  },

  getExportCsvUrl(): string {
    return `${API_BASE}/scenarios/export/csv`;
  }
};
