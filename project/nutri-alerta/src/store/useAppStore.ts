import { create } from 'zustand';
import { DADOS_TEMPORAIS } from '@/lib/mockData';

type ViewMode = 'expert' | 'consultant';

export type PoiType = 'UBS' | 'Pronto-Atendimento' | 'Saúde Mental' | 'Vigilância Sanitária' | 'Educação' | 'Esporte e Lazer' | 'Alimentação - Restaurante/Fast-food' | 'Alimentação - Mercado';

interface AppState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedBairro: string | null;
  setSelectedBairro: (bairro: string | null) => void;
  anoSelecionado: string;
  setAnoSelecionado: (ano: string) => void;
  indicador: string;
  setIndicador: (ind: string) => void;
  activePoiTypes: PoiType[];
  setActivePoiTypes: (types: PoiType[]) => void;
  selectedPoi: any | null;
  setSelectedPoi: (poi: any | null) => void;
  
  // Dark mode & Sidebar toggles
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;

  // Real-time Dynamic Data state
  temporalData: Array<{
    ano: string;
    desnutricao: number;
    obesidade: number;
    sobrepeso: number;
    eutrofia: number;
    isPrevisao: boolean;
  }>;
  regionalData: Record<string, Record<string, any>>;
  yearsList: string[];
  loading: boolean;
  error: string | null;
  initializeData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'expert',
  setViewMode: (mode) => set({ viewMode: mode }),
  selectedBairro: null,
  setSelectedBairro: (bairro) => set({ selectedBairro: bairro }),
  anoSelecionado: '2025',
  setAnoSelecionado: (ano) => set({ anoSelecionado: ano }),
  indicador: 'obesidade',
  setIndicador: (ind) => set({ indicador: ind }),
  activePoiTypes: ['UBS', 'Pronto-Atendimento', 'Saúde Mental', 'Vigilância Sanitária', 'Educação', 'Esporte e Lazer', 'Alimentação - Restaurante/Fast-food', 'Alimentação - Mercado'],
  setActivePoiTypes: (types) => set({ activePoiTypes: types }),
  selectedPoi: null,
  setSelectedPoi: (poi) => set({ selectedPoi: poi }),

  // Theme & Layout toggles
  darkMode: false,
  setDarkMode: (val) => set({ darkMode: val }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

  // Initial State Hydration with Mock Data Fallback
  temporalData: DADOS_TEMPORAIS,
  regionalData: {},
  yearsList: ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026 ★', '2027 ★'],
  loading: false,
  error: null,

  initializeData: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/data');
      const data = await res.json();
      if (data.success) {
        set({
          temporalData: data.temporalData,
          regionalData: data.regionalData,
          yearsList: data.temporalData.map((d: any) => d.ano),
          loading: false
        });
      } else {
        set({ error: data.error || 'Failed to load CSV model data', loading: false });
      }
    } catch (err: any) {
      console.error("Zustand Hydration Error:", err);
      set({ error: err.message || 'Connection to API failed', loading: false });
    }
  }
}));
