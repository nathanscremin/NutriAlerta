import React from 'react';

export interface HudMetricsParams {
  analysisLevel: string;
  selectedSchoolName: string | null;
  selectedBairroName: string | null;
  selectedUbs: string | null;
  anoSelecionado: string;
  cleanYear: string;
  scopeMetrics: {
    obesidade: number;
    magreza: number;
    desnutricao: number;
    sobrepeso: number;
    eutrofia: number;
  };
  regionalData: any;
  schoolMetrics: any;
  bairroMetrics: any;
  ubsList: any[];
  schoolsList: any[];
  isPrevisao: boolean;
}

export interface HudMetricsResult {
  avgObs: string;
  avgMag: string;
  avgDes: string;
  avgSob: string;
  avgEut: string;
  evaluatedStr: string;
  subUnitLabel: string;
  subUnitValue: string;
}

/**
 * Custom React hook to centralize the HUD metrics computation.
 * Avoids code duplication between ExpertView.tsx and Sidebar.tsx (DUP-2).
 */
export function useHudMetrics({
  analysisLevel,
  selectedSchoolName,
  selectedBairroName,
  selectedUbs,
  anoSelecionado,
  cleanYear,
  scopeMetrics,
  regionalData,
  schoolMetrics,
  bairroMetrics,
  ubsList,
  schoolsList,
  isPrevisao
}: HudMetricsParams): HudMetricsResult {
  return React.useMemo(() => {
    let avaliados = 0;
    let subUnitLabel = "UBS monitoradas";
    let subUnitValue = String(ubsList.length);

    if (analysisLevel === 'escola' && selectedSchoolName) {
      const data = schoolMetrics[selectedSchoolName]?.anos?.[cleanYear];
      avaliados = data?.total_avaliados || 0;
      subUnitLabel = "Tipo de Escola";
      const schoolInfo = schoolsList.find(s => s.nome === selectedSchoolName);
      subUnitValue = schoolInfo?.categoria || "Educação";
    } else if (analysisLevel === 'bairro' && selectedBairroName) {
      const data = bairroMetrics[selectedBairroName]?.anos?.[cleanYear];
      avaliados = data?.total_avaliados || 0;
      const schoolCount = schoolsList.filter(s => s.bairro === selectedBairroName).length;
      subUnitLabel = "Escolas no bairro";
      subUnitValue = String(schoolCount);
    } else if (analysisLevel === 'ubs' && selectedUbs) {
      let ubsTotal = 0;
      Object.values(schoolMetrics).forEach((sch: any) => {
        if (sch.regiao_ubs === selectedUbs && sch.anos?.[cleanYear]?.total_avaliados) {
          ubsTotal += sch.anos[cleanYear].total_avaliados;
        }
      });
      avaliados = ubsTotal || regionalData[cleanYear]?.[selectedUbs]?.total_avaliados || 0;
      const schoolCount = schoolsList.filter(s => s.regiao_ubs === selectedUbs).length;
      subUnitLabel = "Escolas na região";
      subUnitValue = String(schoolCount);
    } else {
      let totalSchoolAvaliados = 0;
      Object.values(schoolMetrics).forEach((sch: any) => {
        if (sch.anos?.[cleanYear]?.total_avaliados) {
          totalSchoolAvaliados += sch.anos[cleanYear].total_avaliados;
        }
      });
      avaliados = totalSchoolAvaliados || 0;
      subUnitLabel = "UBS monitoradas";
      subUnitValue = String(ubsList.length);
    }

    const formatPct = (val: number) => {
      if (val === undefined || val === null || isNaN(val)) return 'N/D';
      return `${val.toFixed(2)}%`;
    };

    const formatAval = (val: number) => {
      if (isPrevisao) return 'Projetado';
      if (!val) return 'N/D';
      return val >= 1000 ? `${(val / 1000).toFixed(1)}K` : String(val);
    };

    return {
      avgObs: formatPct(scopeMetrics.obesidade),
      avgMag: formatPct(scopeMetrics.magreza),
      avgDes: formatPct(scopeMetrics.desnutricao),
      avgSob: formatPct(scopeMetrics.sobrepeso),
      avgEut: formatPct(scopeMetrics.eutrofia),
      evaluatedStr: formatAval(avaliados),
      subUnitLabel,
      subUnitValue
    };
  }, [
    analysisLevel,
    selectedSchoolName,
    selectedBairroName,
    selectedUbs,
    anoSelecionado,
    cleanYear,
    scopeMetrics,
    regionalData,
    schoolMetrics,
    ubsList,
    schoolsList,
    bairroMetrics,
    isPrevisao
  ]);
}
