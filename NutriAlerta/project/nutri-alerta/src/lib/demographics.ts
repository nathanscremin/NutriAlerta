/**
 * demographics.ts
 * ===============
 * Lógica matemática e epidemiológica determinística para simulação de dados demográficos
 * (Idade Média, Distribuição por Gênero e Faixas Etárias) para o NutriAlerta.
 * 
 * Baseia-se no baseline da UBS e do ano selecionado para garantir consistência visual
 * e científica absoluta (OMS / Nutri for Schools).
 */

export interface GroupMetric {
  avgAge: number;       // Idade média no grupo
  pctMasculino: number; // % Masculino (Homens)
  pctFeminino: number;  // % Feminino (Mulheres)
  rate: number;         // Taxa de prevalência local do grupo (%)
}

export interface AgeGroupData {
  faixa: string;        // Ex: "0-2a"
  label: string;        // Ex: "Primeira Infância"
  sub: string;          // Ex: "6 meses a 2 anos"
  desnutricao: GroupMetric;
  sobrepeso: GroupMetric;
  obesidade: GroupMetric;
  eutrofia: GroupMetric;
}

export interface DemographicsResult {
  globalAvgAgeDes: number;
  globalAvgAgeSob: number;
  globalAvgAgeObs: number;
  globalAvgAgeEut: number;
  ageGroups: AgeGroupData[];
}

/**
 * Retorna dados demográficos reativos baseados nos índices de uma UBS ou Geral.
 */
export function getDemographicsForUbs(
  ubsName: string | null,
  ano: string,
  desRate: number,
  sobRate: number,
  obsRate: number,
  eutRate: number
): DemographicsResult {
  // Criar uma semente determinística baseada no nome da UBS e do Ano
  const seedStr = `${ubsName || 'Geral'}-${ano}`;
  let seedValue = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seedValue += seedStr.charCodeAt(i);
  }

  // Helper para gerar variações suaves e consistentes
  const getVariation = (offset: number, range: number) => {
    const val = Math.sin(seedValue + offset) * range;
    return Number(val.toFixed(2));
  };

  // 1. Lactentes e Primeira Infância: 6 meses a 2 anos
  const faixa1: AgeGroupData = {
    faixa: "0 a 2 anos",
    label: "Primeira Infância",
    sub: "6 meses a 2 anos",
    desnutricao: {
      avgAge: Number((1.2 + getVariation(1, 0.2)).toFixed(1)),
      pctMasculino: 52 + Math.round(getVariation(2, 3)),
      pctFeminino: 0, // calculado no getter
      rate: Number((desRate * (1.3 + getVariation(3, 0.15))).toFixed(2)),
    },
    sobrepeso: {
      avgAge: Number((1.6 + getVariation(4, 0.1)).toFixed(1)),
      pctMasculino: 49 + Math.round(getVariation(5, 2)),
      pctFeminino: 0,
      rate: Number((sobRate * (0.5 + getVariation(6, 0.1))).toFixed(2)),
    },
    obesidade: {
      avgAge: Number((1.8 + getVariation(7, 0.1)).toFixed(1)),
      pctMasculino: 51 + Math.round(getVariation(8, 3)),
      pctFeminino: 0,
      rate: Number((obsRate * (0.4 + getVariation(9, 0.1))).toFixed(2)),
    },
    eutrofia: {
      avgAge: Number((1.3 + getVariation(40, 0.1)).toFixed(1)),
      pctMasculino: 50 + Math.round(getVariation(41, 1)),
      pctFeminino: 0,
      rate: Number((eutRate * (0.8 + getVariation(42, 0.05))).toFixed(2)),
    }
  };

  // 2. Pré-escolares: 3 a 5 anos
  const faixa2: AgeGroupData = {
    faixa: "3 a 5 anos",
    label: "Pré-escolares",
    sub: "3 a 5 anos",
    desnutricao: {
      avgAge: Number((3.9 + getVariation(10, 0.3)).toFixed(1)),
      pctMasculino: 51 + Math.round(getVariation(11, 2)),
      pctFeminino: 0,
      rate: Number((desRate * (1.0 + getVariation(12, 0.1))).toFixed(2)),
    },
    sobrepeso: {
      avgAge: Number((4.3 + getVariation(13, 0.2)).toFixed(1)),
      pctMasculino: 47 + Math.round(getVariation(14, 3)),
      pctFeminino: 0,
      rate: Number((sobRate * (0.9 + getVariation(15, 0.05))).toFixed(2)),
    },
    obesidade: {
      avgAge: Number((4.6 + getVariation(16, 0.2)).toFixed(1)),
      pctMasculino: 53 + Math.round(getVariation(17, 2)),
      pctFeminino: 0,
      rate: Number((obsRate * (0.8 + getVariation(18, 0.1))).toFixed(2)),
    },
    eutrofia: {
      avgAge: Number((4.1 + getVariation(43, 0.1)).toFixed(1)),
      pctMasculino: 49 + Math.round(getVariation(44, 1)),
      pctFeminino: 0,
      rate: Number((eutRate * (0.9 + getVariation(45, 0.05))).toFixed(2)),
    }
  };

  // 3. Escolares: 6 a 11 anos
  const faixa3: AgeGroupData = {
    faixa: "6 a 11 anos",
    label: "Escolares",
    sub: "6 a 11 anos",
    desnutricao: {
      avgAge: Number((8.4 + getVariation(19, 0.4)).toFixed(1)),
      pctMasculino: 50 + Math.round(getVariation(20, 1)),
      pctFeminino: 0,
      rate: Number((desRate * (0.8 + getVariation(21, 0.08))).toFixed(2)),
    },
    sobrepeso: {
      avgAge: Number((8.8 + getVariation(22, 0.3)).toFixed(1)),
      pctMasculino: 49 + Math.round(getVariation(23, 2)),
      pctFeminino: 0,
      rate: Number((sobRate * (1.2 + getVariation(24, 0.1))).toFixed(2)),
    },
    obesidade: {
      avgAge: Number((9.2 + getVariation(25, 0.3)).toFixed(1)),
      pctMasculino: 55 + Math.round(getVariation(26, 3)),
      pctFeminino: 0,
      rate: Number((obsRate * (1.2 + getVariation(27, 0.1))).toFixed(2)),
    },
    eutrofia: {
      avgAge: Number((8.5 + getVariation(46, 0.2)).toFixed(1)),
      pctMasculino: 50 + Math.round(getVariation(47, 1)),
      pctFeminino: 0,
      rate: Number((eutRate * (1.1 + getVariation(48, 0.05))).toFixed(2)),
    }
  };

  // 4. Adolescentes: 12 a 18 anos
  const faixa4: AgeGroupData = {
    faixa: "12 a 18 anos",
    label: "Adolescentes",
    sub: "12 a 18 anos",
    desnutricao: {
      avgAge: Number((14.8 + getVariation(28, 0.5)).toFixed(1)),
      pctMasculino: 48 + Math.round(getVariation(29, 2)),
      pctFeminino: 0,
      rate: Number((desRate * (0.9 + getVariation(30, 0.1))).toFixed(2)),
    },
    sobrepeso: {
      avgAge: Number((15.2 + getVariation(31, 0.4)).toFixed(1)),
      pctMasculino: 46 + Math.round(getVariation(32, 3)),
      pctFeminino: 0,
      rate: Number((sobRate * (1.1 + getVariation(33, 0.08))).toFixed(2)),
    },
    obesidade: {
      avgAge: Number((15.6 + getVariation(34, 0.4)).toFixed(1)),
      pctMasculino: 49 + Math.round(getVariation(35, 2)),
      pctFeminino: 0,
      rate: Number((obsRate * (1.1 + getVariation(36, 0.08))).toFixed(2)),
    },
    eutrofia: {
      avgAge: Number((14.6 + getVariation(49, 0.3)).toFixed(1)),
      pctMasculino: 51 + Math.round(getVariation(50, 1)),
      pctFeminino: 0,
      rate: Number((eutRate * (1.2 + getVariation(51, 0.05))).toFixed(2)),
    }
  };

  const groups = [faixa1, faixa2, faixa3, faixa4];

  // Normalizar prevalências dentro de cada grupo para somar exatamente 100%
  groups.forEach(g => {
    const rawObj = {
      desnutricao: g.desnutricao.rate,
      sobrepeso: g.sobrepeso.rate,
      obesidade: g.obesidade.rate,
      eutrofia: g.eutrofia.rate
    };
    
    // Robust normalizer function
    const normalizeLocal = (obj: typeof rawObj, target = 100) => {
      let sum = obj.desnutricao + obj.sobrepeso + obj.obesidade + obj.eutrofia;
      if (sum === 0) return obj;
      const res = {
        desnutricao: Number(((obj.desnutricao / sum) * target).toFixed(2)),
        sobrepeso: Number(((obj.sobrepeso / sum) * target).toFixed(2)),
        obesidade: Number(((obj.obesidade / sum) * target).toFixed(2)),
        eutrofia: Number(((obj.eutrofia / sum) * target).toFixed(2))
      };
      const diff = Number((target - (res.desnutricao + res.sobrepeso + res.obesidade + res.eutrofia)).toFixed(2));
      if (diff !== 0) {
        let maxK: keyof typeof res = 'eutrofia';
        let maxV = res[maxK];
        (Object.keys(res) as Array<keyof typeof res>).forEach(k => {
          if (res[k] > maxV) {
            maxV = res[k];
            maxK = k;
          }
        });
        res[maxK] = Number((res[maxK] + diff).toFixed(2));
      }
      return res;
    };

    const norm = normalizeLocal(rawObj);
    g.desnutricao.rate = norm.desnutricao;
    g.sobrepeso.rate = norm.sobrepeso;
    g.obesidade.rate = norm.obesidade;
    g.eutrofia.rate = norm.eutrofia;

    g.desnutricao.pctFeminino = 100 - g.desnutricao.pctMasculino;
    g.sobrepeso.pctFeminino = 100 - g.sobrepeso.pctMasculino;
    g.obesidade.pctFeminino = 100 - g.obesidade.pctMasculino;
    g.eutrofia.pctFeminino = 100 - g.eutrofia.pctMasculino;
  });

  // Calcular médias globais (ponderadas pelas taxas dos grupos)
  let sumAgeDes = 0, sumWeightDes = 0;
  let sumAgeSob = 0, sumWeightSob = 0;
  let sumAgeObs = 0, sumWeightObs = 0;
  let sumAgeEut = 0, sumWeightEut = 0;

  groups.forEach(g => {
    // Desnutrição
    sumAgeDes += g.desnutricao.avgAge * g.desnutricao.rate;
    sumWeightDes += g.desnutricao.rate;

    // Sobrepeso
    sumAgeSob += g.sobrepeso.avgAge * g.sobrepeso.rate;
    sumWeightSob += g.sobrepeso.rate;

    // Obesidade
    sumAgeObs += g.obesidade.avgAge * g.obesidade.rate;
    sumWeightObs += g.obesidade.rate;

    // Peso Adequado
    sumAgeEut += g.eutrofia.avgAge * g.eutrofia.rate;
    sumWeightEut += g.eutrofia.rate;
  });

  const globalAvgAgeDes = sumWeightDes > 0 ? Number((sumAgeDes / sumWeightDes).toFixed(1)) : Number((4.2 + getVariation(37, 0.2)).toFixed(1));
  const globalAvgAgeSob = sumWeightSob > 0 ? Number((sumAgeSob / sumWeightSob).toFixed(1)) : Number((9.5 + getVariation(38, 0.2)).toFixed(1));
  const globalAvgAgeObs = sumWeightObs > 0 ? Number((sumAgeObs / sumWeightObs).toFixed(1)) : Number((10.8 + getVariation(39, 0.2)).toFixed(1));
  const globalAvgAgeEut = sumWeightEut > 0 ? Number((sumAgeEut / sumWeightEut).toFixed(1)) : Number((9.8 + getVariation(52, 0.2)).toFixed(1));

  return {
    globalAvgAgeDes,
    globalAvgAgeSob,
    globalAvgAgeObs,
    globalAvgAgeEut,
    ageGroups: groups
  };
}
