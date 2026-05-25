import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';


type ViewMode = 'map' | 'schools' | 'comparison' | 'consultant' | 'data-entry';

export type PoiType = 'UBS' | 'Pronto-Atendimento' | 'Saúde Mental' | 'Vigilância Sanitária' | 'Educação' | 'Esporte e Lazer' | 'Alimentação - Restaurante/Fast-food' | 'Alimentação - Mercado';

export type AnalysisLevel = 'municipio' | 'ubs' | 'bairro' | 'escola';

interface AppState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedBairro: string | null;
  setSelectedBairro: (bairro: string | null) => void;

  // Offline Cache for Resilient Data Entry
  offlineQueue: Array<any>;
  addToOfflineQueue: (patient: any) => void;
  clearOfflineQueue: () => void;

  // Hierarchical analysis states
  analysisLevel: AnalysisLevel;
  selectedUbs: string | null;
  selectedBairroName: string | null;
  selectedSchoolName: string | null;
  setAnalysisLevel: (level: AnalysisLevel) => void;
  setSelectedUbs: (ubs: string | null) => void;
  /** Sets selectedUbs WITHOUT changing analysisLevel or resetting bairro/escola.
   *  Use when you need to store the parent UBS reference after already setting bairro/escola level. */
  setParentUbs: (ubs: string | null) => void;
  setSelectedBairroName: (bairro: string | null) => void;
  setSelectedSchoolName: (school: string | null) => void;
  setSelection: (level: AnalysisLevel, ubs: string | null, bairro: string | null, school: string | null) => void;

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
  schoolMetrics: Record<string, any>;
  bairroMetrics: Record<string, any>;
  demographicData: Record<string, any> | null;
  yearsList: string[];
  sourceMeta: {
    source: 'supabase' | 'local-json' | 'local-csv';
    fallbackReason: string | null;
    artifacts: string[];
    lastUpdated: string | null;
  };
  loading: boolean;
  error: string | null;
  initializeData: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      viewMode: 'map',
      setViewMode: (mode) => set({ viewMode: mode }),
      selectedBairro: null,
      setSelectedBairro: (bairro) => {
        if (!bairro) {
          set({
            selectedBairro: null,
            analysisLevel: 'municipio',
            selectedUbs: null,
            selectedBairroName: null,
            selectedSchoolName: null
          });
        } else if (bairro.startsWith('UBS ') || bairro.startsWith('USF ') || bairro.toLowerCase().includes('urgência')) {
          set({
            selectedBairro: bairro,
            analysisLevel: 'ubs',
            selectedUbs: bairro,
            selectedBairroName: null,
            selectedSchoolName: null
          });
        } else {
          set({ selectedBairro: bairro });
        }
      },

      // Hierarchical analysis initial state
      analysisLevel: 'municipio',
      selectedUbs: null,
      selectedBairroName: null,
      selectedSchoolName: null,

      setAnalysisLevel: (level) => set((state) => {
        if (level === 'municipio') {
          return {
            analysisLevel: 'municipio',
            selectedBairro: null,
            selectedUbs: null,
            selectedBairroName: null,
            selectedSchoolName: null
          };
        }
        if (level === 'ubs') {
          return {
            analysisLevel: 'ubs',
            selectedBairroName: null,
            selectedSchoolName: null
          };
        }
        if (level === 'bairro') {
          return {
            analysisLevel: 'bairro',
            selectedSchoolName: null
          };
        }
        return { analysisLevel: level };
      }),

      // Full UBS selection — changes analysisLevel to 'ubs' and clears sub-selections
      setSelectedUbs: (ubs) => set((state) => {
        if (!ubs) {
          return {
            selectedUbs: null,
            selectedBairro: null,
            analysisLevel: 'municipio',
            selectedBairroName: null,
            selectedSchoolName: null
          };
        }
        return {
          selectedUbs: ubs,
          selectedBairro: ubs,
          analysisLevel: 'ubs',
          selectedBairroName: null,
          selectedSchoolName: null
        };
      }),

      // Silent UBS reference setter — does NOT change analysisLevel or clear sub-selections
      // Use after setSelectedBairroName or setSelectedSchoolName to preserve parent context
      setParentUbs: (ubs) => set({ selectedUbs: ubs }),

      setSelectedBairroName: (bairro) => set((state) => {
        if (!bairro) {
          return {
            selectedBairroName: null,
            selectedBairro: state.selectedUbs,
            analysisLevel: state.selectedUbs ? 'ubs' : 'municipio'
          };
        }
        return {
          selectedBairroName: bairro,
          selectedBairro: bairro,
          analysisLevel: 'bairro',
          selectedSchoolName: null
        };
      }),

      setSelectedSchoolName: (school) => set((state) => {
        if (!school) {
          return {
            selectedSchoolName: null,
            selectedBairro: state.selectedBairroName || state.selectedUbs,
            analysisLevel: state.selectedBairroName ? 'bairro' : (state.selectedUbs ? 'ubs' : 'municipio')
          };
        }
        return {
          selectedSchoolName: school,
          selectedBairro: school,
          analysisLevel: 'escola'
        };
      }),

      setSelection: (level, ubs, bairro, school) => set({
        analysisLevel: level,
        selectedUbs: ubs,
        selectedBairroName: bairro,
        selectedSchoolName: school,
        selectedBairro: school || bairro || ubs || null
      }),

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

      // Offline Cache for Resilient Data Entry
      offlineQueue: [],
      addToOfflineQueue: (patient) => set((state) => ({
        offlineQueue: [...state.offlineQueue, patient]
      })),
      clearOfflineQueue: () => set({ offlineQueue: [] }),

      // Initial State Hydration with Database (no mock fallback)
      temporalData: [],
      regionalData: {},
      schoolMetrics: {},
      bairroMetrics: {},
      demographicData: null,
      yearsList: [],
      sourceMeta: {
        source: 'supabase',
        fallbackReason: null,
        artifacts: ['registros_saude'],
        lastUpdated: null
      },
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
              schoolMetrics: data.schoolMetrics,
              bairroMetrics: data.bairroMetrics,
              demographicData: data.demographicData,
              yearsList: data.temporalData.map((d: any) => d.ano),
              sourceMeta: data.sourceMeta || {
                source: 'supabase',
                fallbackReason: null,
                artifacts: ['registros_saude'],
                lastUpdated: null
              },
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
    }),
    {
      name: 'nutrialerta-ui-state',
      storage: createJSONStorage(() => localStorage),
      // Persiste só o que faz sentido — dados de API são sempre buscados frescos
      partialize: (state) => ({
        viewMode: state.viewMode,
        darkMode: state.darkMode,
        sidebarCollapsed: state.sidebarCollapsed,
        selectedBairro: state.selectedBairro,
        anoSelecionado: state.anoSelecionado,
        indicador: state.indicador,
        activePoiTypes: state.activePoiTypes,
        offlineQueue: state.offlineQueue,
      }),
    }
  )
);
