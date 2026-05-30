import type { AnalysisLevel } from '@/store/useAppStore';

export type NutritionMetrics = {
  desnutricao: number;
  magreza: number;
  obesidade: number;
  sobrepeso: number;
  eutrofia: number;
  total_avaliados?: number;
};

export interface ScopedNutritionParams {
  analysisLevel: AnalysisLevel;
  selectedUbs: string | null;
  selectedBairroName: string | null;
  selectedSchoolName: string | null;
  year: string;
  temporalData: Array<{
    ano: string;
    desnutricao: number;
    magreza: number;
    obesidade: number;
    sobrepeso: number;
    eutrofia: number;
    isPrevisao?: boolean;
  }>;
  regionalData: Record<string, Record<string, any>>;
  schoolMetrics: Record<string, any>;
  bairroMetrics: Record<string, any>;
}

const DEFAULT_METRICS = {
  desnutricao: 2.62,
  magreza: 2.5,
  obesidade: 12.93,
  sobrepeso: 21.0,
  eutrofia: 61.55
};

function sanitizeMetrics(record: Partial<NutritionMetrics> | null | undefined) {
  const base = { ...DEFAULT_METRICS };

  if (!record) {
    return base;
  }

  return {
    desnutricao: Number.isFinite(Number(record.desnutricao)) ? Number(record.desnutricao) : base.desnutricao,
    magreza: Number.isFinite(Number(record.magreza)) ? Number(record.magreza) : base.magreza,
    obesidade: Number.isFinite(Number(record.obesidade)) ? Number(record.obesidade) : base.obesidade,
    sobrepeso: Number.isFinite(Number(record.sobrepeso)) ? Number(record.sobrepeso) : base.sobrepeso,
    eutrofia: Number.isFinite(Number(record.eutrofia)) ? Number(record.eutrofia) : base.eutrofia,
    total_avaliados: Number.isFinite(Number(record.total_avaliados)) ? Number(record.total_avaliados) : undefined
  };
}

function getGlobalMetrics(temporalData: ScopedNutritionParams['temporalData'], year: string) {
  const cleanYear = year.replace('★', '').trim();
  const record = temporalData.find((item) => item.ano.replace('★', '').trim() === cleanYear);
  return sanitizeMetrics(record || null);
}

export function getScopedNutritionMetrics(params: ScopedNutritionParams): NutritionMetrics {
  const {
    analysisLevel,
    selectedUbs,
    selectedBairroName,
    selectedSchoolName,
    year,
    temporalData,
    regionalData,
    schoolMetrics,
    bairroMetrics
  } = params;

  const globalMetrics = getGlobalMetrics(temporalData, year);

  if (analysisLevel === 'municipio') {
    return globalMetrics;
  }

  if (analysisLevel === 'ubs') {
    const record = selectedUbs ? regionalData[year]?.[selectedUbs] : null;
    return sanitizeMetrics(record || globalMetrics);
  }

  if (analysisLevel === 'bairro') {
    const bairroRecord = selectedBairroName ? bairroMetrics[selectedBairroName]?.anos?.[year] : null;
    if (bairroRecord) {
      return sanitizeMetrics(bairroRecord);
    }

    const parentUbs = selectedBairroName ? (bairroMetrics[selectedBairroName]?.regiao_ubs || selectedUbs) : selectedUbs;
    const fallbackRecord = parentUbs ? regionalData[year]?.[parentUbs] : null;
    return sanitizeMetrics(fallbackRecord || globalMetrics);
  }

  const schoolRecord = selectedSchoolName ? schoolMetrics[selectedSchoolName]?.anos?.[year] : null;
  if (schoolRecord) {
    return sanitizeMetrics(schoolRecord);
  }

  const parentUbs = selectedSchoolName ? (schoolMetrics[selectedSchoolName]?.regiao_ubs || selectedUbs) : selectedUbs;
  const fallbackRecord = parentUbs ? regionalData[year]?.[parentUbs] : null;
  return sanitizeMetrics(fallbackRecord || globalMetrics);
}

export function buildScopedTemporalSeries(params: Omit<ScopedNutritionParams, 'year'> & { yearsList: string[] }) {
  const { yearsList } = params;

  return yearsList.map((ano) => {
    const cleanYear = ano.replace('★', '').trim();
    return {
      ano,
      ...getScopedNutritionMetrics({
        ...params,
        year: cleanYear
      }),
      isPrevisao: Number(cleanYear) >= 2026
    };
  });
}
