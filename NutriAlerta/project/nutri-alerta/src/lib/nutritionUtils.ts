interface WHOThresholds {
  sdMin3: number; // Magreza Acentuada (< sdMin3)
  sdMin2: number; // Magreza (< sdMin2)
  sdPlus1: number; // Sobrepeso (> sdPlus1)
  sdPlus2: number; // Obesidade (> sdPlus2)
}

const WHO_BOYS_THRESHOLDS: Record<number, WHOThresholds> = {
  0: { sdMin3: 11.0, sdMin2: 12.0, sdPlus1: 15.0, sdPlus2: 16.5 },
  1: { sdMin3: 13.0, sdMin2: 14.0, sdPlus1: 18.0, sdPlus2: 19.5 },
  2: { sdMin3: 13.0, sdMin2: 14.0, sdPlus1: 17.5, sdPlus2: 19.0 },
  3: { sdMin3: 12.8, sdMin2: 13.7, sdPlus1: 17.2, sdPlus2: 18.8 },
  4: { sdMin3: 12.5, sdMin2: 13.4, sdPlus1: 17.0, sdPlus2: 18.5 },
  5: { sdMin3: 12.2, sdMin2: 13.0, sdPlus1: 16.8, sdPlus2: 18.3 },
  6: { sdMin3: 12.1, sdMin2: 13.0, sdPlus1: 17.0, sdPlus2: 18.5 },
  7: { sdMin3: 12.1, sdMin2: 13.0, sdPlus1: 17.4, sdPlus2: 19.2 },
  8: { sdMin3: 12.2, sdMin2: 13.1, sdPlus1: 18.0, sdPlus2: 20.0 },
  9: { sdMin3: 12.3, sdMin2: 13.3, sdPlus1: 18.6, sdPlus2: 21.0 },
  10: { sdMin3: 12.5, sdMin2: 13.5, sdPlus1: 19.4, sdPlus2: 22.0 },
  11: { sdMin3: 12.8, sdMin2: 13.9, sdPlus1: 20.2, sdPlus2: 23.2 },
  12: { sdMin3: 13.2, sdMin2: 14.4, sdPlus1: 21.0, sdPlus2: 24.2 },
  13: { sdMin3: 13.6, sdMin2: 14.9, sdPlus1: 21.8, sdPlus2: 25.2 },
  14: { sdMin3: 14.1, sdMin2: 15.5, sdPlus1: 22.6, sdPlus2: 26.2 },
  15: { sdMin3: 14.6, sdMin2: 16.0, sdPlus1: 23.4, sdPlus2: 27.2 },
  16: { sdMin3: 15.0, sdMin2: 16.5, sdPlus1: 24.2, sdPlus2: 28.2 },
  17: { sdMin3: 15.3, sdMin2: 16.9, sdPlus1: 24.8, sdPlus2: 29.0 },
  18: { sdMin3: 15.5, sdMin2: 17.2, sdPlus1: 25.0, sdPlus2: 30.0 }
};

const WHO_GIRLS_THRESHOLDS: Record<number, WHOThresholds> = {
  0: { sdMin3: 10.5, sdMin2: 11.5, sdPlus1: 14.5, sdPlus2: 16.0 },
  1: { sdMin3: 12.5, sdMin2: 13.5, sdPlus1: 17.5, sdPlus2: 19.0 },
  2: { sdMin3: 12.5, sdMin2: 13.5, sdPlus1: 17.0, sdPlus2: 18.5 },
  3: { sdMin3: 12.2, sdMin2: 13.2, sdPlus1: 16.8, sdPlus2: 18.3 },
  4: { sdMin3: 11.9, sdMin2: 12.9, sdPlus1: 16.6, sdPlus2: 18.2 },
  5: { sdMin3: 11.7, sdMin2: 12.7, sdPlus1: 16.5, sdPlus2: 18.2 },
  6: { sdMin3: 11.6, sdMin2: 12.5, sdPlus1: 16.7, sdPlus2: 18.5 },
  7: { sdMin3: 11.6, sdMin2: 12.6, sdPlus1: 17.2, sdPlus2: 19.2 },
  8: { sdMin3: 11.7, sdMin2: 12.7, sdPlus1: 17.8, sdPlus2: 20.0 },
  9: { sdMin3: 11.8, sdMin2: 12.9, sdPlus1: 18.6, sdPlus2: 21.0 },
  10: { sdMin3: 12.0, sdMin2: 13.2, sdPlus1: 19.4, sdPlus2: 22.0 },
  11: { sdMin3: 12.3, sdMin2: 13.6, sdPlus1: 20.3, sdPlus2: 23.2 },
  12: { sdMin3: 12.7, sdMin2: 14.1, sdPlus1: 21.2, sdPlus2: 24.4 },
  13: { sdMin3: 13.1, sdMin2: 14.6, sdPlus1: 22.1, sdPlus2: 25.5 },
  14: { sdMin3: 13.5, sdMin2: 15.0, sdPlus1: 22.9, sdPlus2: 26.5 },
  15: { sdMin3: 13.8, sdMin2: 15.4, sdPlus1: 23.5, sdPlus2: 27.3 },
  16: { sdMin3: 14.1, sdMin2: 15.7, sdPlus1: 24.0, sdPlus2: 28.0 },
  17: { sdMin3: 14.3, sdMin2: 16.0, sdPlus1: 24.4, sdPlus2: 28.6 },
  18: { sdMin3: 14.4, sdMin2: 16.2, sdPlus1: 24.7, sdPlus2: 29.0 }
};

/**
 * Classifica clinicamente o IMC de uma criança ou adolescente baseando-se nas tabelas
 * oficiais simplificadas de percentis e Z-score (desvio padrão) da Organização Mundial da Saúde (OMS).
 */
export function classifyNutritionWHO(
  idade: number,
  genero: 'Masculino' | 'Feminino' | 'M' | 'F',
  imc: number
): {
  classificacao: string;
  alertaRisco: string;
  condutaClinica: string;
} {
  const normGenero = (genero === 'Masculino' || genero === 'M') ? 'M' : 'F';
  const ageKey = Math.max(0, Math.min(18, Math.round(idade)));
  
  const thresholds = normGenero === 'M' ? WHO_BOYS_THRESHOLDS[ageKey] : WHO_GIRLS_THRESHOLDS[ageKey];
  
  let classificacao = 'Eutrofia';
  let alertaRisco = 'Baixo';
  let condutaClinica = 'Manter monitoramento rotineiro no Nutri for Schools.';
  
  if (imc < thresholds.sdMin3) {
    classificacao = 'Desnutrição';
    alertaRisco = 'Alto';
    condutaClinica = 'Aconselhamento urgente de aleitamento materno/alimentação complementar e encaminhamento prioritário imediato à pediatria da UBS.';
  } else if (imc < thresholds.sdMin2) {
    classificacao = 'Desnutrição';
    alertaRisco = 'Médio/Alto';
    condutaClinica = 'Visita domiciliar preventiva do Agente de Saúde e suplementação alimentar/orientação nutricional familiar.';
  } else if (imc > thresholds.sdPlus2) {
    classificacao = 'Obesidade';
    alertaRisco = 'Alto';
    condutaClinica = 'Agendar consulta com endocrinologista/nutricionista na UBS e orientar a prática diária de atividade física e reeducação familiar ativa.';
  } else if (imc > thresholds.sdPlus1) {
    classificacao = 'Sobrepeso';
    alertaRisco = 'Médio';
    condutaClinica = 'Oficina dietética prática para a família e acompanhamento trimestral do ganho de peso ponderal na UBS.';
  } else {
    classificacao = 'Eutrofia';
    alertaRisco = 'Baixo';
    condutaClinica = 'Parabenizar a família pela saúde ativa, incentivar alimentação saudável de rotina e manter monitoramento anual.';
  }
  
  return { classificacao, alertaRisco, condutaClinica };
}

/**
 * Retorna o nível de severidade correspondente para cada indicador do dashboard.
 * Unificado a partir de ExpertView.tsx e RiskMap.tsx (DUP-1).
 */
export function getSeverityLevel(value: number, indicator: string): number {
  if (indicator === 'desnutricao') {
    if (value < 1.5) return 0;
    if (value < 2.5) return 1;
    if (value < 3.5) return 2;
    return 3;
  }
  if (indicator === 'sobrepeso') {
    if (value < 12.0) return 0;
    if (value < 16.0) return 1;
    if (value < 20.0) return 2;
    return 3;
  }
  if (indicator === 'obesidade') {
    if (value < 8.0) return 0;
    if (value < 12.0) return 1;
    if (value < 15.0) return 2;
    return 3;
  }
  if (indicator === 'magreza') {
    if (value < 1.0) return 0;
    if (value < 2.5) return 1;
    if (value < 4.0) return 2;
    return 3;
  }
  // Eutrofia (inverso: quanto maior, menor o risco)
  if (value > 65.0) return 0;
  if (value > 58.0) return 1;
  if (value > 50.0) return 2;
  return 3;
}
