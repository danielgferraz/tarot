import { Client, SavedReading, AIConfig, SpreadLayout } from "../types";

// Keys for LocalStorage fallback
const LS_KEYS = {
  SETTINGS: 'mystic_db_settings',
  CLIENTS: 'mystic_db_clients', // Will store clients with nested readings for simplicity in fallback
  LAYOUTS: 'mystic_db_layouts',
  PRESETS: 'mystic_db_presets'
};

// Helper to simulate delay for realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const request = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (res.status === 404) throw new Error("API_NOT_FOUND"); // Fallback trigger
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return res.json();
  } catch (e: any) {
    if (e.message === "API_NOT_FOUND" || e.name === 'TypeError') {
       throw new Error("FALLBACK_NEEDED");
    }
    throw e;
  }
};

export const api = {
  // --- Settings ---
  getSettings: async (): Promise<AIConfig | null> => {
    try {
      const data = await request('/api/settings');
      return data.config;
    } catch (e: any) {
      if (e.message === "FALLBACK_NEEDED") {
        console.log("Using LocalStorage fallback for Settings");
        const saved = localStorage.getItem(LS_KEYS.SETTINGS);
        return saved ? JSON.parse(saved) : null;
      }
      return null;
    }
  },
  saveSettings: async (config: AIConfig) => {
    try {
      return await request('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
    } catch (e: any) {
      if (e.message === "FALLBACK_NEEDED") {
        localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(config));
        return { success: true };
      }
      throw e;
    }
  },

  // --- Clients ---
  getClients: async (): Promise<Client[]> => {
    try {
      return await request('/api/clients');
    } catch (e: any) {
      if (e.message === "FALLBACK_NEEDED") {
        console.log("Using LocalStorage fallback for Clients");
        const saved = localStorage.getItem(LS_KEYS.CLIENTS);
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    }
  },
  saveClient: async (client: Client) => {
    try {
      return await request('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
    } catch (e: any) {
      if (e.message === "FALLBACK_NEEDED") {
        const clients = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
        clients.push(client); // In fallback, we trust client object has readingsHistory initialized
        localStorage.setItem(LS_KEYS.CLIENTS, JSON.stringify(clients));
        return { success: true };
      }
      throw e;
    }
  },
  updateClient: async (client: Client) => {
    try {
      return await request(`/api/clients?id=${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
    } catch (e: any) {
      if (e.message === "FALLBACK_NEEDED") {
        const clients = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
        const index = clients.findIndex((c: Client) => c.id === client.id);
        if (index !== -1) {
          clients[index] = { ...clients[index], ...client }; // Merge updates
          localStorage.setItem(LS_KEYS.CLIENTS, JSON.stringify(clients));
        }
        return { success: true };
      }
      throw e;
    }
  },
  deleteClient: async (id: string) => {
    try {
      return await request(`/api/clients?id=${id}`, { method: 'DELETE' });
    } catch (e: any) {
      if (e.message === "FALLBACK_NEEDED") {
        const clients = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
        const filtered = clients.filter((c: Client) => c.id !== id);
        localStorage.setItem(LS_KEYS.CLIENTS, JSON.stringify(filtered));
        return { success: true };
      }
      throw e;
    }
  },

  // --- Readings ---
  saveReading: async (clientId: string, reading: SavedReading) => {
    try {
      return await request('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, reading })
      });
    } catch (e: any) {
      if (e.message === "FALLBACK_NEEDED") {
        const clients = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
        const clientIndex = clients.findIndex((c: Client) => c.id === clientId);
        if (clientIndex !== -1) {
           // Ensure readingsHistory exists
           const history = clients[clientIndex].readingsHistory || [];
           clients[clientIndex].readingsHistory = [reading, ...history];
           localStorage.setItem(LS_KEYS.CLIENTS, JSON.stringify(clients));
        }
        return { success: true };
      }
      throw e;
    }
  },
  updateReading: async (reading: SavedReading) => {
    try {
      return await request(`/api/readings?id=${reading.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reading })
      });
    } catch (e: any) {
      if (e.message === "FALLBACK_NEEDED") {
         const clients: Client[] = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
         // Find which client owns this reading. Inefficient but necessary for flat structure in LS fallback
         for (const client of clients) {
             const rIndex = client.readingsHistory.findIndex(r => r.id === reading.id);
             if (rIndex !== -1) {
                 client.readingsHistory[rIndex] = reading;
                 break;
             }
         }
         localStorage.setItem(LS_KEYS.CLIENTS, JSON.stringify(clients));
         return { success: true };
      }
      throw e;
    }
  },
  deleteReading: async (id: string) => {
    try {
      return await request(`/api/readings?id=${id}`, { method: 'DELETE' });
    } catch (e: any) {
      if (e.message === "FALLBACK_NEEDED") {
         const clients: Client[] = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
         for (const client of clients) {
             client.readingsHistory = client.readingsHistory.filter(r => r.id !== id);
         }
         localStorage.setItem(LS_KEYS.CLIENTS, JSON.stringify(clients));
         return { success: true };
      }
      throw e;
    }
  },

  // --- Layouts ---
  getLayouts: async (): Promise<{ layouts: SpreadLayout[], presets: SpreadLayout[] }> => {
    try {
      return await request('/api/layouts');
    } catch (e: any) {
      if (e.message === "FALLBACK_NEEDED") {
         const layouts = JSON.parse(localStorage.getItem(LS_KEYS.LAYOUTS) || '[]');
         const presets = JSON.parse(localStorage.getItem(LS_KEYS.PRESETS) || '[]');
         return { layouts, presets };
      }
      return { layouts: [], presets: [] };
    }
  },
  saveLayout: async (layout: SpreadLayout, type: 'layout' | 'preset') => {
    try {
      return await request('/api/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout, type })
      });
    } catch (e: any) {
      if (e.message === "FALLBACK_NEEDED") {
         const key = type === 'layout' ? LS_KEYS.LAYOUTS : LS_KEYS.PRESETS;
         const list = JSON.parse(localStorage.getItem(key) || '[]');
         list.push(layout);
         localStorage.setItem(key, JSON.stringify(list));
         return { success: true };
      }
      throw e;
    }
  },
  deleteLayout: async (id: string) => {
    try {
      return await request(`/api/layouts?id=${id}`, { method: 'DELETE' });
    } catch (e: any) {
      if (e.message === "FALLBACK_NEEDED") {
          // Check both lists for simplicity
          const layouts = JSON.parse(localStorage.getItem(LS_KEYS.LAYOUTS) || '[]').filter((l: SpreadLayout) => l.id !== id);
          localStorage.setItem(LS_KEYS.LAYOUTS, JSON.stringify(layouts));

          const presets = JSON.parse(localStorage.getItem(LS_KEYS.PRESETS) || '[]').filter((l: SpreadLayout) => l.id !== id);
          localStorage.setItem(LS_KEYS.PRESETS, JSON.stringify(presets));
          return { success: true };
      }
      throw e;
    }
  }
};