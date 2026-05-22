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

export const MERCADOS_GERAIS: InfraPoint[] = [
  { nome: 'Supermercado Furkim', tipo: 'supermarket', lat: -22.3762855, lon: -47.5518907, grupo: 'protetivo' },
  { nome: 'Supermercado Tetra', tipo: 'supermarket', lat: -22.3870598, lon: -47.5531562, grupo: 'protetivo' },
  { nome: 'Alvimar Guedes', tipo: 'supermarket', lat: -22.3829758, lon: -47.5642162, grupo: 'protetivo' },
  { nome: 'Supermercado da Rosa', tipo: 'supermarket', lat: -22.4084055, lon: -47.6021985, grupo: 'protetivo' },
  { nome: 'Casa&Vida', tipo: 'wholesale', lat: -22.4228324, lon: -47.5663048, grupo: 'protetivo' },
  { nome: 'Mercado Família', tipo: 'supermarket', lat: -22.387285, lon: -47.6139328, grupo: 'protetivo' },
  { nome: 'Paulistão Atacadista', tipo: 'wholesale', lat: -22.3847316, lon: -47.5564681, grupo: 'protetivo' },
  { nome: 'Covabra Supermercados', tipo: 'supermarket', lat: -22.3842458, lon: -47.5730971, grupo: 'protetivo' },
  { nome: 'Assaí Atacadista', tipo: 'supermarket', lat: -22.4149934, lon: -47.5749365, grupo: 'protetivo' },
  { nome: 'Supermercado Covabra', tipo: 'supermarket', lat: -22.4007914, lon: -47.5683947, grupo: 'protetivo' },
  { nome: 'Qualidade Supermercado', tipo: 'supermarket', lat: -22.4067551, lon: -47.5711652, grupo: 'protetivo' },
  { nome: 'Padaria Claret', tipo: 'bakery', lat: -22.407357, lon: -47.5722133, grupo: 'protetivo' },
  { nome: 'Supermercado Brasil Frios', tipo: 'supermarket', lat: -22.3920434, lon: -47.5596618, grupo: 'protetivo' },
  { nome: 'Savegnano Supermercados', tipo: 'supermarket', lat: -22.4237938, lon: -47.5628518, grupo: 'protetivo' },
  { nome: 'Examine Supermercados (1)', tipo: 'supermarket', lat: -22.4010829, lon: -47.5847635, grupo: 'protetivo' },
  { nome: 'Supermercado Tropical (1)', tipo: 'supermarket', lat: -22.395533, lon: -47.5836803, grupo: 'protetivo' },
  { nome: 'Examine Supermercados (2)', tipo: 'supermarket', lat: -22.3874351, lon: -47.5802755, grupo: 'protetivo' },
  { nome: 'Supermercado Tropical (2)', tipo: 'supermarket', lat: -22.3946047, lon: -47.5733196, grupo: 'protetivo' },
  { nome: 'Matos Supermercado', tipo: 'supermarket', lat: -22.3755504, lon: -47.57965, grupo: 'protetivo' },
  { nome: 'Examine Supermercados (3)', tipo: 'supermarket', lat: -22.4357071, lon: -47.5819898, grupo: 'protetivo' },
  { nome: 'Big Bem Supermercado', tipo: 'supermarket', lat: -22.4199925, lon: -47.5839687, grupo: 'protetivo' },
  { nome: 'Pães & Doces 5 Estrelas', tipo: 'bakery', lat: -22.4217892, lon: -47.5830643, grupo: 'protetivo' },
  { nome: 'Supermercado Tropical (3)', tipo: 'supermarket', lat: -22.4296013, lon: -47.5819891, grupo: 'protetivo' },
  { nome: 'Atacadão', tipo: 'supermarket', lat: -22.4180339, lon: -47.5803487, grupo: 'protetivo' },
  { nome: 'Supermercado Santo Antônio', tipo: 'supermarket', lat: -22.3810621, lon: -47.5874412, grupo: 'protetivo' },
  { nome: 'Supermercados Savegnago', tipo: 'supermarket', lat: -22.3819109, lon: -47.5477645, grupo: 'protetivo' },
  { nome: 'Padaria Village', tipo: 'bakery', lat: -22.3755407, lon: -47.5520178, grupo: 'protetivo' },
  { nome: 'Supermercado Jóia', tipo: 'supermarket', lat: -22.3693396, lon: -47.5394383, grupo: 'protetivo' },
  { nome: 'Padaria Vila Alemã', tipo: 'bakery', lat: -22.3893022, lon: -47.5546693, grupo: 'protetivo' },
  { nome: 'Modelo Padaria', tipo: 'bakery', lat: -22.4227737, lon: -47.558267, grupo: 'protetivo' },
];

export const ESPORTE_LAZER: InfraPoint[] = [
  { nome: 'Jardim Público', tipo: 'park', lat: -22.4100179, lon: -47.5603859, grupo: 'protetivo' },
  { nome: 'Praça da Liberdade', tipo: 'park', lat: -22.4121623, lon: -47.562644, grupo: 'protetivo' },
  { nome: 'Praça Vereador Silas Bianchini', tipo: 'park', lat: -22.3872396, lon: -47.5633751, grupo: 'protetivo' },
  { nome: 'Bosque dos Angicos', tipo: 'park', lat: -22.3804147, lon: -47.5504651, grupo: 'protetivo' },
  { nome: 'Praça Prof Dr. Antônio Christofoletti', tipo: 'park', lat: -22.3967193, lon: -47.5472359, grupo: 'protetivo' },
  { nome: 'Praça Monumento Rio Claro', tipo: 'park', lat: -22.4174805, lon: -47.5750704, grupo: 'protetivo' },
  { nome: 'Praça da Rodoviária Municipal', tipo: 'park', lat: -22.4171792, lon: -47.5753013, grupo: 'protetivo' },
  { nome: 'Praça dos Ferroviários', tipo: 'park', lat: -22.4106598, lon: -47.5572635, grupo: 'protetivo' },
  { nome: 'Parque do Jequitibás', tipo: 'park', lat: -22.4453753, lon: -47.5376753, grupo: 'protetivo' },
  { nome: 'Parque Multiuso', tipo: 'park', lat: -22.4585435, lon: -47.527019, grupo: 'protetivo' },
  { nome: 'Praça Theodor Koelle', tipo: 'park', lat: -22.4044288, lon: -47.5650428, grupo: 'protetivo' },
  { nome: 'Praça Santa Cruz', tipo: 'park', lat: -22.4068878, lon: -47.5669011, grupo: 'protetivo' },
  { nome: 'Espaço Livre', tipo: 'park', lat: -22.4062005, lon: -47.5651674, grupo: 'protetivo' },
  { nome: 'Praça Dalva de Oliveira', tipo: 'park', lat: -22.413576, lon: -47.5704674, grupo: 'protetivo' },
  { nome: 'Praça do jardim América', tipo: 'park', lat: -22.3840435, lon: -47.5553127, grupo: 'protetivo' },
  { nome: 'Praça Jardim Leblon', tipo: 'park', lat: -22.4350076, lon: -47.5587027, grupo: 'protetivo' },
  { nome: 'Praça Jardim Botânico', tipo: 'park', lat: -22.4323623, lon: -47.5610633, grupo: 'protetivo' },
  { nome: 'Praça do Parque Universitário', tipo: 'park', lat: -22.3933023, lon: -47.5791001, grupo: 'protetivo' },
  { nome: 'Praça Jardim Olinda', tipo: 'park', lat: -22.3898129, lon: -47.5798939, grupo: 'protetivo' },
  { nome: 'Praça Capeça', tipo: 'park', lat: -22.4263645, lon: -47.5713813, grupo: 'protetivo' },
  { nome: 'Praça Jardim Quitandinha', tipo: 'park', lat: -22.4280052, lon: -47.5721784, grupo: 'protetivo' },
  { nome: 'Praça Jd. Itapuã', tipo: 'park', lat: -22.4384816, lon: -47.5613638, grupo: 'protetivo' },
  { nome: 'Pracinha Pasetto', tipo: 'park', lat: -22.4020687, lon: -47.5749665, grupo: 'protetivo' },
  { nome: 'Praça Rotary', tipo: 'park', lat: -22.4070571, lon: -47.5726154, grupo: 'protetivo' },
  { nome: 'Praça Antonio Paes de Barros', tipo: 'park', lat: -22.4088672, lon: -47.5654163, grupo: 'protetivo' },
  { nome: 'Praça Delfino da Silva Barbosa', tipo: 'park', lat: -22.407706, lon: -47.5648944, grupo: 'protetivo' },
  { nome: 'Campo de futebol Lagoa Seca', tipo: 'pitch', lat: -22.3843182, lon: -47.5684916, grupo: 'protetivo' },
  { nome: 'Ginásio da Lagoa Seca', tipo: 'pitch', lat: -22.3846531, lon: -47.5695446, grupo: 'protetivo' },
  { nome: 'Campo Arco-íris', tipo: 'pitch', lat: -22.3773896, lon: -47.5517518, grupo: 'protetivo' },
  { nome: 'Academia ao Ar Livre (1)', tipo: 'fitness_station', lat: -22.3843569, lon: -47.5509181, grupo: 'protetivo' },
  { nome: 'Academia ao Ar Livre (2)', tipo: 'fitness_station', lat: -22.428157, lon: -47.577748, grupo: 'protetivo' },
  { nome: 'Academia ao Ar Livre (3)', tipo: 'fitness_station', lat: -22.398058, lon: -47.5635354, grupo: 'protetivo' },
  { nome: 'Academia ao Ar Livre (4)', tipo: 'fitness_station', lat: -22.3756703, lon: -47.5431585, grupo: 'protetivo' },
];

export const AMBIENTE_OBESOGENICO: InfraPoint[] = [
  { nome: 'Subway', tipo: 'fast_food', lat: -22.3865925, lon: -47.5560987, grupo: 'risco' },
  { nome: 'Bar e Lanchonete do Rafael', tipo: 'fast_food', lat: -22.4077455, lon: -47.5586846, grupo: 'risco' },
  { nome: 'Brooks Hamburgueria', tipo: 'fast_food', lat: -22.4097342, lon: -47.5664329, grupo: 'risco' },
  { nome: 'China in Box', tipo: 'fast_food', lat: -22.4136904, lon: -47.5717099, grupo: 'risco' },
  { nome: 'Barão Burguer', tipo: 'fast_food', lat: -22.4036919, lon: -47.5657272, grupo: 'risco' },
  { nome: 'Hermmanito Fast Food', tipo: 'fast_food', lat: -22.4218514, lon: -47.5565867, grupo: 'risco' },
  { nome: 'Bella Capri Pizza e Pasta', tipo: 'restaurant', lat: -22.4189226, lon: -47.5601911, grupo: 'risco' },
  { nome: 'Lanches Val', tipo: 'restaurant', lat: -22.3866271, lon: -47.5568934, grupo: 'risco' },
  { nome: 'Sorveteria Vanilla Ice', tipo: 'restaurant', lat: -22.3889055, lon: -47.5578573, grupo: 'risco' },
  { nome: 'Pizzaria Ypê', tipo: 'restaurant', lat: -22.3868722, lon: -47.55357, grupo: 'risco' },
  { nome: 'Jack Brown', tipo: 'restaurant', lat: -22.4092951, lon: -47.5619963, grupo: 'risco' },
  { nome: 'Cebola Brava Rotisserie', tipo: 'restaurant', lat: -22.4135002, lon: -47.5679233, grupo: 'risco' },
  { nome: 'Seu Bentô', tipo: 'restaurant', lat: -22.4045381, lon: -47.5640158, grupo: 'risco' },
  { nome: 'Restaurant China Express', tipo: 'restaurant', lat: -22.4034166, lon: -47.5649996, grupo: 'risco' },
  { nome: 'Padoka\'s', tipo: 'restaurant', lat: -22.3716454, lon: -47.5403132, grupo: 'risco' },
  { nome: 'Entreposto', tipo: 'convenience', lat: -22.4226909, lon: -47.5592579, grupo: 'risco' },
  { nome: 'BR Mania', tipo: 'convenience', lat: -22.4229631, lon: -47.5605285, grupo: 'risco' },
  { nome: 'Padaria e Casa de Carnes Paulista', tipo: 'convenience', lat: -22.395929, lon: -47.5923492, grupo: 'risco' },
];

// Proporção total para o gráfico donut de infraestrutura
export const PROPORCAO_INFRAESTRUTURA = [
  { name: 'Mercados & Padarias', value: MERCADOS_GERAIS.length, fill: '#10b981' },
  { name: 'Parques & Esportes', value: ESPORTE_LAZER.length, fill: '#38bdf8' },
  { name: 'Fast Food & Risco', value: AMBIENTE_OBESOGENICO.length, fill: '#f43f5e' },
];

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
// Filter out from extractedPois any points that are government infra to avoid duplicates
const filteredExtracted = extractedPois.filter(p => !['UBS', 'Pronto-Atendimento', 'Saúde Mental', 'Vigilância Sanitária'].includes(p.categoria));

export const ALL_POIS: Poi[] = [
  ...UNIDADES_SAUDE.map(u => ({ 
    id: `saude-${u.nome}`, 
    nome: u.nome, 
    categoria: u.categoria, 
    lat: u.lat, 
    lon: u.lon, 
    color: u.categoria === 'UBS' ? '#e74c3c' : u.categoria === 'Pronto-Atendimento' ? '#8e44ad' : '#c0392b' 
  })),
  ...filteredExtracted.map((p, i) => ({ 
    id: `extracted-${i}`, 
    nome: p.nome === 'Desconhecido' ? p.categoria + ' (Mapeado)' : p.nome, 
    categoria: p.categoria, 
    lat: p.lat, 
    lon: p.lon, 
    color: p.color,
    ...p 
  }))
];

// Mapeamento de âncoras virtuais - Removido por obsolescência (usando limites reais de bairros)
export function getVirtualAnchor(nome: string, realLat: number, realLon: number) {
  return { lat: realLat, lon: realLon };
}

// Retorna os bairros oficiais de Rio Claro baseados no Censo 2022 vinculados à sua respectiva UBS
export const getVoronoiGeoJSON = () => {
  return rioClaroBairros;
};

