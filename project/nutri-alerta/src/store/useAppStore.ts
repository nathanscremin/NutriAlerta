import { create } from 'zustand';

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
  faixaEtaria: '0-10' | '10-18';
  setFaixaEtaria: (faixa: '0-10' | '10-18') => void;
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
  activePoiTypes: ['UBS', 'Educação', 'Alimentação - Mercado'], // Default visible
  setActivePoiTypes: (types) => set({ activePoiTypes: types }),
  selectedPoi: null,
  setSelectedPoi: (poi) => set({ selectedPoi: poi }),
  faixaEtaria: '10-18',
  setFaixaEtaria: (faixa) => set({ faixaEtaria: faixa }),
}));
