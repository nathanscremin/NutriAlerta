export const MOCK_ESCOLAS = [
  { id: 1, nome: 'EMEF Marcelo Rubens', bairro: 'Centro', risco: 85, delta: '+12%', avaliados: 450, lat: -22.41, lng: -47.55 },
  { id: 2, nome: 'EMEI Criança Feliz', bairro: 'Centro', risco: 45, delta: '+2%', avaliados: 320, lat: -22.405, lng: -47.555 },
  { id: 3, node: 'Escola Estadual Norte', bairro: 'Bairro Norte', risco: 92, delta: '+18%', avaliados: 600, lat: -22.39, lng: -47.56 },
  { id: 4, nome: 'Creche Jardim', bairro: 'Bairro Norte', risco: 68, delta: '+5%', avaliados: 200, lat: -22.395, lng: -47.55 },
  { id: 5, nome: 'EE Professor Silva', bairro: 'Bairro Norte', risco: 74, delta: '+8%', avaliados: 500, lat: -22.398, lng: -47.555 },
  { id: 6, nome: 'EMEF Sul', bairro: 'Bairro Sul', risco: 25, delta: '-4%', avaliados: 800, lat: -22.415, lng: -47.56 },
  { id: 7, nome: 'Colegio Rio', bairro: 'Bairro Sul', risco: 35, delta: '+1%', avaliados: 350, lat: -22.42, lng: -47.555 },
  { id: 8, nome: 'EMEF Leste', bairro: 'Vila Nova', risco: 55, delta: '+4%', avaliados: 400, lat: -22.40, lng: -47.54 },
  { id: 9, nome: 'Creche Municipal', bairro: 'Vila Nova', risco: 80, delta: '+15%', avaliados: 150, lat: -22.405, lng: -47.545 },
  { id: 10, nome: 'EMEI Florescer', bairro: 'Jardim Primavera', risco: 15, delta: '-8%', avaliados: 220, lat: -22.38, lng: -47.57 },
  { id: 11, nome: 'Escola Modelo', bairro: 'Jardim Primavera', risco: 20, delta: '-2%', avaliados: 450, lat: -22.385, lng: -47.565 },
  { id: 12, nome: 'EE Santos Dumont', bairro: 'Aeroclube', risco: 78, delta: '+9%', avaliados: 550, lat: -22.43, lng: -47.55 },
  { id: 13, nome: 'EMEF Industrial', bairro: 'Distrito Ind.', risco: 88, delta: '+22%', avaliados: 380, lat: -22.44, lng: -47.53 },
  { id: 14, nome: 'Creche Operaria', bairro: 'Distrito Ind.', risco: 65, delta: '+6%', avaliados: 180, lat: -22.435, lng: -47.535 },
  { id: 15, nome: 'Colegio Oeste', bairro: 'Bairro Oeste', risco: 40, delta: '0%', avaliados: 600, lat: -22.41, lng: -47.58 }
];

// ============================================================
// DADOS REAIS — Fonte: NutriAlerta_Projecao_Desnutricao.csv
//                    + NutriAlerta_Projecao_Futura-2.csv
// Metodologia: média de Tendencia_Desnutricao e Tendencia_Obesidade
//              de todas as UBS de Rio Claro, agrupadas por ano.
// Status: DADO HISTÓRICO (2018–2025) | PREVISÃO FUTURA (2026–2027)
// ============================================================

export type PontoTemporal = {
  ano: string;
  /** % médio de desnutrição entre as UBS (Magreza + Magreza Acentuada) */
  desnutricao: number;
  /** % médio de obesidade entre as UBS (Obesidade + Obesidade Grave) */
  obesidade: number;
  /** % médio de sobrepeso entre as UBS */
  sobrepeso: number;
  /** % médio de peso adequado (eutrofia) entre as UBS */
  eutrofia: number;
  /** true = projeção do modelo, false = dado histórico real */
  isPrevisao: boolean;
};

export const DADOS_TEMPORAIS: PontoTemporal[] = [
  // — HISTÓRICO REAL (Nutri for Schools/CNES) —
  { ano: '2018', desnutricao: 2.81, obesidade: 8.98,  sobrepeso: 15.2, eutrofia: 72.41, isPrevisao: false },
  { ano: '2019', desnutricao: 3.42, obesidade: 10.41, sobrepeso: 16.5, eutrofia: 68.87, isPrevisao: false },
  { ano: '2020', desnutricao: 2.74, obesidade: 12.58, sobrepeso: 17.8, eutrofia: 65.78, isPrevisao: false },
  { ano: '2021', desnutricao: 2.37, obesidade: 13.27, sobrepeso: 18.2, eutrofia: 64.86, isPrevisao: false },
  { ano: '2022', desnutricao: 2.48, obesidade: 13.61, sobrepeso: 19.5, eutrofia: 62.91, isPrevisao: false },
  { ano: '2023', desnutricao: 2.65, obesidade: 13.28, sobrepeso: 20.1, eutrofia: 62.37, isPrevisao: false },
  { ano: '2024', desnutricao: 2.74, obesidade: 12.94, sobrepeso: 20.8, eutrofia: 61.72, isPrevisao: false },
  { ano: '2025', desnutricao: 2.62, obesidade: 12.93, sobrepeso: 21.0, eutrofia: 61.55, isPrevisao: false },
  // — PREVISÃO DO MODELO (2026–2027) —
  { ano: '2026 ★', desnutricao: 3.14, obesidade: 13.76, sobrepeso: 21.6, eutrofia: 59.50, isPrevisao: true },
  { ano: '2027 ★', desnutricao: 3.39, obesidade: 13.57, sobrepeso: 22.1, eutrofia: 58.84, isPrevisao: true },
];

/** @deprecated Use DADOS_TEMPORAIS — mantido para compatibilidade com gráficos antigos */
export const MOCK_TEMPORAL = DADOS_TEMPORAIS
  .filter(d => !d.isPrevisao && parseInt(d.ano) >= 2020)
  .map(d => ({ ano: d.ano, riscoMedio: d.desnutricao, altoRisco: d.obesidade / 4 }));

// Distribuição nutricional média de 2025 (Fonte: dados reais Nutri for Schools)
export const MOCK_DISTRIBUICAO = [
  { name: 'Peso Adequado (Eutrofia)', value: 58, fill: '#10b981' },
  { name: 'Sobrepeso',               value: 21, fill: '#f59e0b' },
  { name: 'Obesidade (Geral)',        value: 17, fill: '#ef4444' },
  { name: 'Magreza / Desnutrição',   value:  4, fill: '#3b82f6' },
];

export const RANKING_ACELERACAO = [...MOCK_ESCOLAS]
  .sort((a, b) => parseFloat(b.delta) - parseFloat(a.delta))
  .slice(0, 5)
  .map(esc => ({ name: esc.nome, delta: parseFloat(esc.delta) }));

// === DADOS INFRAESTRUTURA URBANA - RIO CLARO (CSVs) ===

export type InfraPoint = { nome: string; tipo: string; lat: number; lon: number; grupo: 'risco' | 'protetivo'; };



export const UNIDADES_SAUDE = [
  { nome: "UBS Jardim Chervezon “Dr. Nicolino Maziotti”", categoria: "UBS", lat: -22.385236150603358, lon: -47.564888689845596 },
  { nome: "UBS 29 “Oreste Armando Giovani”", categoria: "UBS", lat: -22.42459370350195, lon: -47.56384685307812 },
  { nome: "UBS Wenzel “Dr. Mario Fittipaldi”", categoria: "UBS", lat: -22.388922097585972, lon: -47.58697051682788 },
  { nome: "UBS Vila Cristina “Dr. Sílvio Arnaldo Piva”", categoria: "UBS", lat: -22.383777261453787, lon: -47.55011343217318 },
  { nome: "Unidade de urgência e emergência Nossa Senhora de Lourdes", categoria: "Pronto-Atendimento", lat: -22.41525217891934, lon: -47.55724428006094 },
  { nome: "UPA Chervezon", categoria: "Pronto-Atendimento", lat: -22.386031433205883, lon: -47.56481686100926 },
  { nome: "USF Assistência", categoria: "UBS", lat: -22.500679761791204, lon: -47.58613791682307 },
  { nome: "USF Ferraz", categoria: "UBS", lat: -22.40860628729808, lon: -47.56232297820725 },
  { nome: "USF Nosso Teto/Boa Vista “Dr. Antonio R.M. Santomauro”", categoria: "UBS", lat: -22.380490359110794, lon: -47.589205622903904 },
  { nome: "USF Ajapi/Ferraz", categoria: "UBS", lat: -22.28105677996832, lon: -47.54793785545208 },
  { nome: "USF Mãe PretaI/II", categoria: "UBS", lat: -22.372630657380274, lon: -47.54392295519118 },
  { nome: "USF Palmeiras I/II “Dr. Gilson Giovanni”", categoria: "UBS", lat: -22.428576882739897, lon: -47.58565651311844 },
  { nome: "USF Jardim Novo I E II “Dr. Dirceu Ferreira Penteado”", categoria: "UBS", lat: -22.45320103742713, lon: -47.579031632170135 },
  { nome: "USF Benjamin de Castro", categoria: "UBS", lat: -22.415175533330167, lon: -47.5857422824289 },
  { nome: "USF Bonsucesso/Novo Wenzel “Célia Aparecida Ceccato da Silva”", categoria: "UBS", lat: -22.40667484194884, lon: -47.602627740101724 },
  { nome: "USF Jardim das Flores “Dr. Moacir Camargo”", categoria: "UBS", lat: -22.375771166559428, lon: -47.58014827957286 },
  { nome: "USF Guanabara “Dr. Celestino Donato”", categoria: "UBS", lat: -22.43873461683572, lon: -47.5799385940652 },
  { nome: "USF Panorama “Dr. Osvaldo Akamine”", categoria: "UBS", lat: -22.385357450828135, lon: -47.591746516828024 },
  { nome: "USF Terra Nova", categoria: "UBS", lat: -22.449226627079025, lon: -47.583233814971415 }
];

import extractedPois from './extractedPois.json';
import rioClaroBairros from './rio_claro_bairros.json';

export interface Poi {
  id: string;
  nome: string;
  categoria: string;
  lat: number;
  lon: number;
  color: string;
  bairro?: string;
  regiao_ubs?: string;
  desnutricao?: number;
  obesidade?: number;
  sobrepeso?: number;
  eutrofia?: number;
}

// Combine all for the Map
// Filter out from extractedPois any points that are government infra to avoid duplicates, and also filter out all "Desconhecido" points.
const filteredExtracted = extractedPois.filter(p => 
  !['UBS', 'Pronto-Atendimento', 'Saúde Mental', 'Vigilância Sanitária'].includes(p.categoria) &&
  p.nome !== 'Desconhecido'
);

export function classifyFoodCategory(nome: string): 'Alimentação - Restaurante' | 'Alimentação - Fast-food' {
  const nameLower = nome.toLowerCase();
  const fastFoodKeywords = [
    'subway', 'mc', 'burger', 'burguer', 'habib', 'king', 'lanches', 
    'lanchonete', 'lanchinete', 'hamburgueria', 'sorveteria', 'doces', 
    'ice', 'mania', 'entreposto', 'fast', 'fast-food', 'fastfood', 
    'conveniência', 'bar', 'lanchonete'
  ];
  const isFast = fastFoodKeywords.some(keyword => nameLower.includes(keyword));
  return isFast ? 'Alimentação - Fast-food' : 'Alimentação - Restaurante';
}

export const ALL_POIS: Poi[] = [
  ...UNIDADES_SAUDE.map(u => ({ 
    id: `saude-${u.nome}`, 
    nome: u.nome, 
    categoria: u.categoria, 
    lat: u.lat, 
    lon: u.lon, 
    color: u.categoria === 'UBS' ? '#e74c3c' : u.categoria === 'Pronto-Atendimento' ? '#8e44ad' : '#c0392b' 
  })),
  ...filteredExtracted.map((p, i) => {
    let cat = p.categoria;
    if (p.categoria === 'Alimentação - Restaurante/Fast-food') {
      cat = classifyFoodCategory(p.nome === 'Desconhecido' ? p.categoria : p.nome);
    }
    return { 
      ...p,
      id: `extracted-${i}`, 
      nome: p.nome === 'Desconhecido' ? cat + ' (Mapeado)' : p.nome, 
      categoria: cat, 
      lat: p.lat, 
      lon: p.lon, 
      color: cat === 'Alimentação - Restaurante' ? '#0d9488' : p.color
    };
  })
];

export const MERCADOS_GERAIS: InfraPoint[] = ALL_POIS
  .filter(p => p.categoria === 'Alimentação - Mercado')
  .map(p => ({
    nome: p.nome,
    tipo: 'supermarket',
    lat: p.lat,
    lon: p.lon,
    grupo: 'protetivo' as const
  }));

export const RESTAURANTES_GERAIS: InfraPoint[] = ALL_POIS
  .filter(p => p.categoria === 'Alimentação - Restaurante')
  .map(p => ({
    nome: p.nome,
    tipo: 'restaurant',
    lat: p.lat,
    lon: p.lon,
    grupo: 'protetivo' as const
  }));

export const ESPORTE_LAZER: InfraPoint[] = ALL_POIS
  .filter(p => p.categoria === 'Esporte e Lazer')
  .map(p => ({
    nome: p.nome,
    tipo: 'park',
    lat: p.lat,
    lon: p.lon,
    grupo: 'protetivo' as const
  }));

export const AMBIENTE_OBESOGENICO: InfraPoint[] = ALL_POIS
  .filter(p => p.categoria === 'Alimentação - Fast-food')
  .map(p => ({
    nome: p.nome,
    tipo: 'fast_food',
    lat: p.lat,
    lon: p.lon,
    grupo: 'risco' as const
  }));

export const PROPORCAO_INFRAESTRUTURA = [
  { name: 'Mercados', value: MERCADOS_GERAIS.length, fill: '#10b981' },
  { name: 'Restaurantes', value: RESTAURANTES_GERAIS.length, fill: '#0d9488' },
  { name: 'Parques & Esportes', value: ESPORTE_LAZER.length, fill: '#38bdf8' },
  { name: 'Fast Food & Risco', value: AMBIENTE_OBESOGENICO.length, fill: '#f43f5e' },
];

// Mapeamento de âncoras virtuais - Removido por obsolescência (usando limites reais de bairros)
export function getVirtualAnchor(nome: string, realLat: number, realLon: number) {
  return { lat: realLat, lon: realLon };
}

// Retorna os bairros oficiais de Rio Claro baseados no Censo 2022 vinculados à sua respectiva UBS
export const getVoronoiGeoJSON = () => {
  return rioClaroBairros;
};

