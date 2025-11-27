
import { Client, SavedReading, AIConfig, SpreadLayout } from "../types";

// Helper para chamadas fetch
const request = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  return res.json();
};

export const api = {
  // --- Settings (AI Config & Decks) ---
  getSettings: async (): Promise<AIConfig | null> => {
    try {
      const data = await request('/api/settings');
      return data.config;
    } catch (e) {
      console.warn("Failed to fetch settings, using defaults", e);
      return null;
    }
  },
  saveSettings: async (config: AIConfig) => {
    return request('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    });
  },

  // --- Clients ---
  getClients: async (): Promise<Client[]> => {
    return request('/api/clients');
  },
  saveClient: async (client: Client) => {
    return request('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client)
    });
  },
  updateClient: async (client: Client) => {
    return request(`/api/clients?id=${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client)
    });
  },
  deleteClient: async (id: string) => {
    return request(`/api/clients?id=${id}`, { method: 'DELETE' });
  },

  // --- Readings ---
  // Note: Readings are typically nested in Clients in the current App state structure,
  // but DB stores them relationally. The API getClients endpoint should join them ideally,
  // or we fetch them separately. For simplicity and consistency with existing App types,
  // the /api/clients endpoint will likely populate the readingsHistory.
  saveReading: async (clientId: string, reading: SavedReading) => {
    return request('/api/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, reading })
    });
  },
  updateReading: async (reading: SavedReading) => {
    return request(`/api/readings?id=${reading.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reading })
    });
  },
  deleteReading: async (id: string) => {
    return request(`/api/readings?id=${id}`, { method: 'DELETE' });
  },

  // --- Layouts ---
  getLayouts: async (): Promise<{ layouts: SpreadLayout[], presets: SpreadLayout[] }> => {
    return request('/api/layouts');
  },
  saveLayout: async (layout: SpreadLayout, type: 'layout' | 'preset') => {
    return request('/api/layouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout, type })
    });
  },
  deleteLayout: async (id: string) => {
    return request(`/api/layouts?id=${id}`, { method: 'DELETE' });
  }
};
