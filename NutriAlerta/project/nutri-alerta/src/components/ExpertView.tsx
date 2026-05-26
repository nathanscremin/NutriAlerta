"use client";
import React from 'react';
import RiskMap from '@/components/RiskMap';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, CartesianGrid, XAxis, YAxis, ReferenceLine, BarChart, Bar
} from 'recharts';
import { TrendingUp, Users, Activity, ArrowUpRight, ArrowDownRight, Minus, Info, Layers, X, MapPin, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import UrbanConflictSection from '@/components/UrbanConflictSection';
import { ALL_POIS, getVoronoiGeoJSON, UNIDADES_SAUDE } from '@/lib/mockData';
import { buildScopedTemporalSeries } from '@/lib/metricSelectors';

// ── Tooltip customizado com dados reais e suporte a tema escuro ──────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  const { darkMode } = useAppStore();
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-zinc-800/50 rounded-lg p-3 shadow-md text-xs text-slate-800 dark:text-zinc-200 transition-colors">
      <p className="text-slate-600 dark:text-zinc-400 mb-2 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-600 dark:text-zinc-300">{p.name}:</span>
          <span className="font-semibold text-slate-900 dark:text-white">{Number(p.value).toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
};

// ── KPI Card com suporte a tema escuro e visual premium ─────────────────────────
function KpiCard({
  label, value, sub, trend, trendLabel, accentColor, bgColor, borderColor, tooltip, invertTrendColor
}: {
  label: string; value: string; sub: string;
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string;
  accentColor: string; bgColor: string; borderColor: string;
  tooltip?: string; invertTrendColor?: boolean;
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  
  const isUpPositive = invertTrendColor;
  const trendColor = trend === 'up' 
    ? (isUpPositive
      ? 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50'
      : 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50')
    : trend === 'down' 
      ? (isUpPositive
        ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
        : 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50')
      : 'text-slate-600 bg-slate-100 dark:text-zinc-400 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-800/50';

  return (
    <div className="relative rounded-xl p-6 border border-slate-200/50 dark:border-zinc-800/50 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="text-xs text-slate-600 dark:text-zinc-400 uppercase tracking-wide mb-3 font-semibold flex items-center justify-between relative z-10">
        <span>{label}</span>
        {tooltip && (
          <div className="relative group/tooltip inline-block cursor-help ml-1 text-slate-600 dark:text-zinc-300">
            <Info className="w-4 h-4" />
            <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-48 bg-slate-900 dark:bg-zinc-800 text-white dark:text-white text-xs p-3 rounded-lg shadow-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 font-semibold normal-case tracking-normal leading-relaxed">
              {tooltip}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between relative z-10">
        <h3 className={`text-3xl font-bold tracking-tight tabular-nums ${accentColor}`}>{value}</h3>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold uppercase ${trendColor} px-2 py-1 rounded-md border`}>
            <TrendIcon className="w-3 h-3" />{trendLabel}
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-700 dark:text-zinc-200 mt-2.5 leading-relaxed font-semibold relative z-10">{sub}</p>
    </div>
  );
}

const POI_CATEGORIES = [
  { id: 'UBS' as const, label: 'Saúde (UBS/UPA)', color: 'bg-red-500' },
  { id: 'Educação' as const, label: 'Educação', color: 'bg-blue-500' },
  { id: 'Esporte e Lazer' as const, label: 'Esporte & Lazer', color: 'bg-green-500' },
  { id: 'Alimentação - Restaurante/Fast-food' as const, label: 'Restaurantes/Fast-Food', color: 'bg-orange-500' },
  { id: 'Alimentação - Mercado' as const, label: 'Mercados', color: 'bg-purple-500' },
];

export default function ExpertView() {
  const { 
    anoSelecionado, indicador, selectedPoi, selectedBairro, setSelectedPoi,
    temporalData, regionalData, yearsList, activePoiTypes, setActivePoiTypes,
    darkMode, sidebarCollapsed, setSidebarCollapsed,
    analysisLevel, selectedUbs, selectedBairroName, selectedSchoolName,
    setAnalysisLevel, setSelectedUbs, setSelectedBairroName, setSelectedSchoolName,
    schoolMetrics, bairroMetrics
  } = useAppStore();

  const [isLayersOpen, setIsLayersOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to get parent UBS for a neighborhood
  const getParentUbsForBairroName = React.useCallback((bName: string | null): string | null => {
    if (!bName) return null;
    const bairrosGeoJSON = getVoronoiGeoJSON();
    if (!bairrosGeoJSON || !bairrosGeoJSON.features) return null;
    const feat = bairrosGeoJSON.features.find((f: any) => f.properties?.nome_real_bairro === bName);
    return feat?.properties?.nome_bairro || null;
  }, []);

  const togglePoi = React.useCallback((type: any) => {
    if (activePoiTypes.includes(type)) {
      setActivePoiTypes(activePoiTypes.filter((t: any) => t !== type));
    } else {
      setActivePoiTypes([...activePoiTypes, type]);
    }
  }, [activePoiTypes, setActivePoiTypes]);

  // Auto-expand layers panel when a POI is selected
  React.useEffect(() => {
    if (selectedPoi) {
      setIsLayersOpen(true);
    }
  }, [selectedPoi]);

  // Multadores dinâmicos baseados nas camadas ativas de POIs
  const { multObs, multDes } = React.useMemo(() => {
    let mObs = 1;
    let mDes = 1;

    const hasSupermarket = activePoiTypes.includes('Alimentação - Mercado');
    const hasFastFood = activePoiTypes.includes('Alimentação - Restaurante/Fast-food');
    const hasSport = activePoiTypes.includes('Esporte e Lazer');

    if (hasSupermarket && !hasFastFood) {
      mObs *= 0.90;
      mDes *= 0.95;
    }
    if (hasFastFood && !hasSupermarket) {
      mObs *= 1.15;
    }
    if (hasSport) {
      mObs *= 0.92;
    }
    if (activePoiTypes.length === 0) {
      mObs *= 1.05;
    }
    return { multObs: mObs, multDes: mDes };
  }, [activePoiTypes]);

  // Dado temporal reativo com suporte a análise hierárquica multinível e efeitos das camadas de POIs
  const activeTemporalData = React.useMemo(() => {
    const baseSource = buildScopedTemporalSeries({
      analysisLevel,
      selectedUbs,
      selectedBairroName,
      selectedSchoolName,
      yearsList,
      temporalData,
      regionalData,
      schoolMetrics,
      bairroMetrics
    });

    return baseSource.map(d => {
      const scaleDes = Number((d.desnutricao * multDes).toFixed(2));
      const scaleObs = Number((d.obesidade * multObs).toFixed(2));
      const scaleSob = Number(((d.sobrepeso || 0) * ((multObs + 1) / 2)).toFixed(2));
      const beforeSum = (d.desnutricao || 0) + (d.obesidade || 0) + (d.sobrepeso || 0);
      const afterSum = scaleDes + scaleObs + scaleSob;
      const baseEut = d.eutrofia !== undefined ? d.eutrofia : (100 - beforeSum);
      const scaleEut = Math.max(10, Number((baseEut - (afterSum - beforeSum)).toFixed(2)));
      
      const rawObj = {
        desnutricao: scaleDes,
        obesidade: scaleObs,
        sobrepeso: scaleSob,
        eutrofia: scaleEut
      };
      
      const sum = rawObj.desnutricao + rawObj.sobrepeso + rawObj.obesidade + rawObj.eutrofia;
      const norm = {
        desnutricao: Number(((rawObj.desnutricao / sum) * 100).toFixed(2)),
        sobrepeso: Number(((rawObj.sobrepeso / sum) * 100).toFixed(2)),
        obesidade: Number(((rawObj.obesidade / sum) * 100).toFixed(2)),
        eutrofia: Number(((rawObj.eutrofia / sum) * 100).toFixed(2))
      };
      const diff = Number((100 - (norm.desnutricao + norm.sobrepeso + norm.obesidade + norm.eutrofia)).toFixed(2));
      if (diff !== 0) {
        let maxK: keyof typeof norm = 'eutrofia';
        let maxV = norm[maxK];
        (Object.keys(norm) as Array<keyof typeof norm>).forEach(k => {
          if (norm[k] > maxV) {
            maxV = norm[k];
            maxK = k;
          }
        });
        norm[maxK] = Number((norm[maxK] + diff).toFixed(2));
      }

      return {
        ...d,
        desnutricao: norm.desnutricao,
        obesidade: norm.obesidade,
        sobrepeso: norm.sobrepeso,
        eutrofia: norm.eutrofia
      };
    });
  }, [analysisLevel, selectedUbs, selectedBairroName, selectedSchoolName, temporalData, yearsList, regionalData, schoolMetrics, bairroMetrics, multDes, multObs]);

  // Encontra os dados do ano selecionado
  const cleanYear = anoSelecionado.replace('★', '').trim();
  const dadosAno = activeTemporalData.find(d => d.ano === anoSelecionado) || activeTemporalData[0] || { desnutricao: 0, obesidade: 0, sobrepeso: 0, eutrofia: 0 };
  // Pega a projeção de 2027
  const dadosProj = activeTemporalData.find(d => d.ano === '2027 ★') || activeTemporalData.find(d => d.ano.includes('2027')) || activeTemporalData[activeTemporalData.length - 1] || { desnutricao: 0, obesidade: 0, sobrepeso: 0, eutrofia: 0 };

  const isPrevisao = anoSelecionado.includes('★');

  // Dynamic header title based on current selection level
  const displayTitle = React.useMemo(() => {
    if (analysisLevel === 'municipio') {
      return 'Rio Claro — Painel Epidemiológico';
    }
    if (analysisLevel === 'ubs' && selectedUbs) {
      return `${selectedUbs} — Painel Epidemiológico`;
    }
    if (analysisLevel === 'bairro' && selectedBairroName) {
      return `Bairro ${selectedBairroName} — Painel Epidemiológico`;
    }
    if (analysisLevel === 'escola' && selectedSchoolName) {
      return `${selectedSchoolName} — Painel Epidemiológico`;
    }
    return 'Rio Claro — Painel Epidemiológico';
  }, [analysisLevel, selectedUbs, selectedBairroName, selectedSchoolName]);

  // Configuração baseada no indicador selecionado
  const isObs = indicador === 'obesidade';
  const isDes = indicador === 'desnutricao';
  const isSob = indicador === 'sobrepeso';
  const isEut = indicador === 'eutrofia';

  // Dynamic situation colors matching the active indicator
  const situationStyles = React.useMemo(() => {
    if (isEut) {
      return {
        text: 'text-teal-700 dark:text-teal-400',
        bg: 'bg-teal-50/50 dark:bg-teal-950/20',
        border: 'border-teal-100 dark:border-teal-900/40',
        bullet: 'bg-teal-500 shadow-[0_0_8px_rgba(13,148,136,0.5)]'
      };
    }
    if (isDes) {
      return {
        text: 'text-blue-700 dark:text-blue-400',
        bg: 'bg-blue-50/50 dark:bg-blue-950/20',
        border: 'border-blue-100 dark:border-blue-900/40',
        bullet: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
      };
    }
    if (isSob) {
      return {
        text: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50/50 dark:bg-amber-950/20',
        border: 'border-amber-100 dark:border-amber-900/40',
        bullet: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
      };
    }
    // Default / Obesidade
    return {
      text: 'text-rose-700 dark:text-rose-455',
      bg: 'bg-rose-50/50 dark:bg-rose-955/20',
      border: 'border-rose-100 dark:border-rose-900/40',
      bullet: 'bg-rose-550 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
    };
  }, [isEut, isDes, isSob]);

  const mainValue = Number((isObs ? dadosAno.obesidade : isDes ? dadosAno.desnutricao : isSob ? dadosAno.sobrepeso || 0 : dadosAno.eutrofia || 0).toFixed(2));
  const mainProj = Number((isObs ? dadosProj.obesidade : isDes ? dadosProj.desnutricao : isSob ? dadosProj.sobrepeso || 0 : dadosProj.eutrofia || 0).toFixed(2));

  // Mapping of primary indicator to secondary indicator label & value (resolves issue #3)
  let secondaryLabel = 'Obesidade';
  let secondaryValue = dadosAno.obesidade;

  if (isEut) {
    secondaryLabel = 'Sobrepeso';
    secondaryValue = dadosAno.sobrepeso;
  } else if (isObs) {
    secondaryLabel = 'Desnutrição';
    secondaryValue = dadosAno.desnutricao;
  } else if (isDes) {
    secondaryLabel = 'Obesidade';
    secondaryValue = dadosAno.obesidade;
  } else if (isSob) {
    secondaryLabel = 'Obesidade';
    secondaryValue = dadosAno.obesidade;
  }

  const delta = (mainProj - mainValue).toFixed(2);
  const isAlta = Number(delta) > 0;

  // Determina o próximo ano para cálculo de crescimento relativo
  const isEndYear = cleanYear === '2027';
  const targetYear = isEndYear ? '2027' : (parseInt(cleanYear, 10) + 1).toString();
  const baseYear = isEndYear ? '2026' : cleanYear;

  // Busca os registros correspondentes na série temporal para base e target
  const baseRecord = activeTemporalData.find(d => d.ano.replace('★', '').trim() === baseYear) || dadosAno;
  const targetRecord = activeTemporalData.find(d => d.ano.replace('★', '').trim() === targetYear) || dadosProj;

  // Valores principais para crescimento
  const mainBaseValue = Number(isObs ? baseRecord.obesidade : isDes ? baseRecord.desnutricao : isSob ? baseRecord.sobrepeso || 0 : baseRecord.eutrofia || 0);
  const mainTargetValue = Number(isObs ? targetRecord.obesidade : isDes ? targetRecord.desnutricao : isSob ? targetRecord.sobrepeso || 0 : targetRecord.eutrofia || 0);

  // Crescimento relativo em %
  const growthPercent = mainBaseValue > 0 
    ? (((mainTargetValue - mainBaseValue) / mainBaseValue) * 100).toFixed(2)
    : "0.00";

  const mainColor = isEut
    ? 'text-teal-600 dark:text-teal-400'
    : indicador === 'desnutricao' 
      ? 'text-blue-600 dark:text-blue-400' 
      : indicador === 'sobrepeso' 
        ? 'text-amber-600 dark:text-amber-400' 
        : 'text-rose-600 dark:text-rose-400';
        
  const mainBg = isEut
    ? 'bg-teal-50/50 dark:bg-teal-950/20'
    : indicador === 'desnutricao' 
      ? 'bg-blue-50/50 dark:bg-blue-950/20' 
      : indicador === 'sobrepeso' 
        ? 'bg-amber-50/50 dark:bg-amber-950/20' 
        : 'bg-rose-50/50 dark:bg-rose-950/20';
        
  const mainBorder = isEut
    ? 'border-teal-100'
    : indicador === 'desnutricao' 
      ? 'border-blue-100' 
      : indicador === 'sobrepeso' 
        ? 'border-amber-100' 
        : 'border-rose-100';
        
  const mainLabel = isEut
    ? 'Peso Adequado'
    : indicador === 'desnutricao' 
      ? 'Desnutrição' 
      : indicador === 'sobrepeso' 
        ? 'Sobrepeso' 
        : 'Obesidade';

  // Compute dynamic ranking from loaded regional data
  const currentYearRegions = regionalData && regionalData[cleanYear] 
    ? Object.values(regionalData[cleanYear]) 
    : [];

  const dynamicRanking = currentYearRegions.length > 0
    ? currentYearRegions
        .map((reg: any) => {
          const deltaVal = isObs 
            ? reg.delta_obesidade 
            : isDes
              ? reg.delta_desnutricao
              : isSob
                ? reg.delta_sobrepeso || 0
                : reg.delta_eutrofia || 0;
          return {
            name: reg.nome.replace('UBS ', '').replace('USF ', ''),
            delta: typeof deltaVal === 'number' ? Number((deltaVal).toFixed(2)) : 0
          };
        })
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 5)
    : [];

  const sumAvaliados = React.useMemo(() => {
    let totalSchoolAvaliados = 0;
    Object.values(schoolMetrics).forEach((sch: any) => {
      if (sch.anos?.[cleanYear]?.total_avaliados) {
        totalSchoolAvaliados += sch.anos[cleanYear].total_avaliados;
      }
    });
    return totalSchoolAvaliados;
  }, [schoolMetrics, cleanYear]);

  let avaliadosVal = sumAvaliados || 0;
  let avaliadosSub = "Total acumulado nas 18 UBS de Rio Claro";

  if (analysisLevel === 'ubs') {
    const record = selectedUbs ? regionalData[cleanYear]?.[selectedUbs] : null;
    let ubsTotal = 0;
    Object.values(schoolMetrics).forEach((sch: any) => {
      if (sch.regiao_ubs === selectedUbs && sch.anos?.[cleanYear]?.total_avaliados) {
        ubsTotal += sch.anos[cleanYear].total_avaliados;
      }
    });
    avaliadosVal = ubsTotal || (record && typeof record.total_avaliados === 'number' ? record.total_avaliados : 0);
    avaliadosSub = `Total de indivíduos avaliados na UBS ${selectedUbs?.replace('UBS ', '').replace('USF ', '')}`;
  } else if (analysisLevel === 'bairro') {
    const record = selectedBairroName ? bairroMetrics[selectedBairroName]?.anos[cleanYear] : null;
    avaliadosVal = record && typeof record.total_avaliados === 'number' ? record.total_avaliados : 0;
    avaliadosSub = `Total de indivíduos avaliados no Bairro ${selectedBairroName}`;
  } else if (analysisLevel === 'escola') {
    const record = selectedSchoolName ? schoolMetrics[selectedSchoolName]?.anos[cleanYear] : null;
    avaliadosVal = record && typeof record.total_avaliados === 'number' ? record.total_avaliados : 0;
    avaliadosSub = `Alunos avaliados individualmente na Escola ${selectedSchoolName}`;
  }

  const avaliadosStr = typeof avaliadosVal === 'number' && avaliadosVal > 0
    ? (avaliadosVal >= 1000 ? `${(avaliadosVal / 1000).toFixed(1)}K` : String(avaliadosVal))
    : 'N/D';

  // Compute dynamic distribution averages for selected year
  let eutrofiaAvg = Number(dadosAno.eutrofia.toFixed(1));
  let sobrepesoAvg = Number(dadosAno.sobrepeso.toFixed(1));
  let obesidadeAvg = Number(dadosAno.obesidade.toFixed(1));
  let desnutricaoAvg = Number(dadosAno.desnutricao.toFixed(1));

  // Normalização para a soma ser exatamente 100%
  const totalSum = eutrofiaAvg + sobrepesoAvg + obesidadeAvg + desnutricaoAvg;
  if (totalSum > 0) {
    eutrofiaAvg = Number((eutrofiaAvg / totalSum * 100).toFixed(1));
    sobrepesoAvg = Number((sobrepesoAvg / totalSum * 100).toFixed(1));
    obesidadeAvg = Number((obesidadeAvg / totalSum * 100).toFixed(1));
    desnutricaoAvg = Number((desnutricaoAvg / totalSum * 100).toFixed(1));
  }

  const cleanSelectedBairro = analysisLevel === 'bairro'
    ? (getParentUbsForBairroName(selectedBairroName) || selectedUbs || '').replace('UBS ', '').replace('USF ', '')
    : analysisLevel === 'ubs'
      ? selectedUbs?.replace('UBS ', '').replace('USF ', '') || ''
      : '';


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-6 space-y-6 max-w-7xl mx-auto w-full transition-colors duration-300 relative"
    >
      {/* ── Cabeçalho da view ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
             <h2 className="text-xl font-bold text-slate-800 dark:text-[#f5f5f7] tracking-tight">{displayTitle}</h2>
          </div>
        </div>
        <div className={`flex items-center gap-2 text-[10px] ${situationStyles.text} ${situationStyles.bg} border ${situationStyles.border} rounded-lg px-3 py-2 shadow-sm font-black`}>
          <span className={`w-2 h-2 rounded-full ${situationStyles.bullet} animate-pulse`} />
          {isPrevisao ? `★ PREVISÃO DE IA: ${cleanYear}` : `DADO REAL: ${cleanYear}`}
        </div>
      </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label={`Avaliados (${anoSelecionado})`}
            value={avaliadosStr}
            sub={avaliadosSub}
            accentColor="text-slate-800 dark:text-zinc-200"
            bgColor="bg-white dark:bg-[#1c1c1e]"
            borderColor="border-slate-200 dark:border-[#2c2c2e]"
            tooltip="Quantidade total de indivíduos pesados e avaliados no NutriAlerta na região selecionada."
          />
          <KpiCard
            label={`Prevalência · ${mainLabel}`}
            value={`${mainValue}%`}
            sub={`Taxa registrada em ${anoSelecionado}`}
            accentColor={mainColor}
            bgColor={mainBg}
            borderColor={mainBorder}
            tooltip="Percentual de prevalência registrado para este indicador nutricional no ano selecionado."
          />
          <KpiCard
            label={`Projeção Próximo Ano · ${isEndYear ? '2026 → 2027' : `${baseYear} → ${targetYear}`}`}
            value={`${mainTargetValue.toFixed(2)}%`}
            sub={isEndYear ? `Prevalência na reta final da projeção` : `Prevalência estimada para ${targetYear}`}
            trend={Number(growthPercent) > 0 ? "up" : Number(growthPercent) < 0 ? "down" : "neutral"}
            trendLabel={`${Number(growthPercent) > 0 ? '+' : ''}${growthPercent}%`}
            accentColor={Number(growthPercent) > 0 
              ? (isEut ? "text-teal-600 dark:text-teal-400" : "text-rose-600 dark:text-rose-455") 
              : (isEut ? "text-rose-600 dark:text-rose-455" : "text-teal-600 dark:text-teal-400")}
            bgColor="bg-white dark:bg-[#1c1c1e]"
            borderColor="border-slate-200 dark:border-[#2c2c2e]"
            tooltip="Prevalência percentual (%) estimada pela IA para a qual o indicador caminha no próximo período."
            invertTrendColor={isEut}
          />
          <KpiCard
            label={`${secondaryLabel} · ${anoSelecionado}`}
            value={`${secondaryValue.toFixed(2)}%`}
            sub={`Indicador secundário em ${cleanYear}`}
            accentColor="text-slate-600 dark:text-zinc-350"
            bgColor="bg-white dark:bg-[#1c1c1e]"
            borderColor="border-slate-200 dark:border-[#2c2c2e]"
            tooltip="Taxa de prevalência do segundo indicador nutricional acompanhado de forma comparativa."
          />
        </div>

        {/* ── Seção 1: Mapa de Calor (Imersivo e Largura Total) ── */}
        <div className="relative bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl overflow-hidden shadow-sm transition-colors duration-300 h-[480px] w-full">
          {/* Mapa de Risco - Preenche toda a área */}
          <div className="w-full h-full relative">
            <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-widest bg-white/95 dark:bg-[#1c1c1e]/95 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2c2c2e] shadow-sm inline-block w-fit">
                Mapa de Risco por Região
              </span>
              {analysisLevel !== 'municipio' && (
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest bg-teal-50/95 dark:bg-teal-950/90 px-3 py-1.5 rounded-lg border border-teal-200/60 dark:border-teal-900/60 shadow-sm flex items-center gap-1.5 w-fit">
                  <MapPin className="w-3 h-3 shrink-0" /> {analysisLevel === 'ubs' ? selectedUbs : analysisLevel === 'bairro' ? selectedBairroName : selectedSchoolName}
                </span>
              )}
            </div>
            <RiskMap />
          </div>

          {/* Botão de Controle de Camadas Flutuante */}
          <button
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            className={`absolute top-4 right-4 z-[1000] p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-lg ${
              isLayersOpen
                ? 'bg-teal-600 border-teal-500 text-white shadow-teal-500/10'
                : 'bg-white/95 dark:bg-[#1c1c1e]/95 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-[#f5f5f7] hover:bg-slate-50 dark:hover:bg-zinc-800/80'
            }`}
            title="Ver Camadas e Detalhes"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Painel de Controle de Camadas Flutuante Overlay */}
          <AnimatePresence>
            {isLayersOpen && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="absolute top-4 right-4 bottom-4 w-72 z-[1000] bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-md border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-2xl flex flex-col p-4 space-y-4 overflow-y-auto shrink-0 scrollbar-thin"
              >
                {/* Header do Painel */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-555" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-none">Camadas no Mapa</span>
                  </div>
                  <button
                    onClick={() => setIsLayersOpen(false)}
                    className="text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lista de Checkboxes de Camadas */}
                <div className="space-y-1">
                  {POI_CATEGORIES.map(({ id, label, color }) => {
                    const isActive = activePoiTypes.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => togglePoi(id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[10px] font-semibold transition-all border ${
                          isActive
                            ? 'bg-white dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-[#f5f5f7] shadow-sm'
                            : 'bg-transparent border-transparent text-slate-500 dark:text-zinc-450 hover:bg-slate-50 dark:hover:bg-zinc-900/30 hover:text-slate-700 dark:hover:text-zinc-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                        <span className="truncate">{label}</span>
                        <input
                          type="checkbox"
                          checked={isActive}
                          readOnly
                          className="ml-auto w-3.5 h-3.5 rounded text-teal-600 border-slate-350 dark:border-zinc-700 focus:ring-teal-500 focus:ring-opacity-20 pointer-events-none accent-teal-600"
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 dark:border-zinc-900/60" />

                {/* Detalhes do Ponto Selecionado */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-widest leading-none mb-3 block">Detalhes do Ponto</span>
                    
                    {selectedPoi ? (
                      <div className="bg-white dark:bg-zinc-900/35 border border-slate-200/60 dark:border-zinc-800/55 rounded-xl p-3 space-y-2.5 text-slate-800 dark:text-zinc-200 animate-in fade-in duration-200">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-[#f5f5f7] leading-snug truncate w-40" title={selectedPoi.nome}>
                              {selectedPoi.nome}
                            </h4>
                            <button
                              onClick={() => setSelectedPoi(null)}
                              className="text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-[#f5f5f7] transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedPoi.color }} />
                            <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">{selectedPoi.categoria}</span>
                          </div>

                          <p className="text-[10px] text-slate-400 dark:text-zinc-450 leading-normal">
                            Ponto de interesse integrado via geoprocessamento. Pronto para análise pelo modelo preditivo de IA e intervenção no território.
                          </p>
                        </div>

                        <div className="flex gap-1.5 pt-2.5 border-t border-slate-100 dark:border-zinc-900/60 mt-1">
                          <button className="flex-1 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-[9px] text-slate-700 dark:text-zinc-200 font-bold py-1.5 rounded-md border border-slate-200/80 dark:border-zinc-700 transition-colors cursor-pointer">
                            Mais Info
                          </button>
                          <button className="flex-1 hover:bg-teal-700 text-[9px] text-white font-bold py-1.5 rounded-md transition-colors bg-teal-600 cursor-pointer">
                            Simular
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-center text-center text-[10px] text-slate-400 dark:text-zinc-500 transition-all duration-300 min-h-[140px]">
                        <div className="mb-2 text-slate-400 dark:text-zinc-500 flex justify-center"><MapPin className="w-5 h-5" /></div>
                        <p className="leading-normal">Selecione um ponto ou UBS no mapa para carregar detalhes...</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Seção 2: Distribuição e Análise de Aceleração de Risco ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Distribuição Nutricional (Donut Chart) */}
          <div className="md:col-span-2 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl p-6 flex flex-col shadow-sm transition-colors duration-300 min-h-[380px] h-[380px]">
            <div className="mb-4">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] tracking-wide">
                  {analysisLevel !== 'municipio' ? `Distribuição em ${analysisLevel === 'ubs' ? selectedUbs : analysisLevel === 'bairro' ? selectedBairroName : selectedSchoolName}` : 'Distribuição Nutricional'}
                </h3>
                <div className="relative group/tooltip inline-block cursor-help text-slate-400 dark:text-zinc-550 hover:text-slate-600 dark:hover:text-[#f5f5f7] shrink-0">
                  <Info className="w-3.5 h-3.5" />
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-48 bg-slate-900 dark:bg-zinc-800 text-white dark:text-[#f5f5f7] text-[10px] p-2.5 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 font-semibold normal-case tracking-normal leading-relaxed border dark:border-zinc-700 text-center">
                    Proporção percentual ponderada do estado nutricional dos indivíduos monitorados nesta localidade.
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                {analysisLevel !== 'municipio' ? `${analysisLevel === 'ubs' ? selectedUbs : analysisLevel === 'bairro' ? selectedBairroName : selectedSchoolName}` : 'Rio Claro'} · Nutri for Schools {anoSelecionado}
              </p>
            </div>
            <div className="flex-1 min-h-[200px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Peso Adequado', value: eutrofiaAvg, fill: '#10b981' },
                        { name: 'Sobrepeso', value: sobrepesoAvg, fill: '#f59e0b' },
                        { name: 'Obesidade', value: obesidadeAvg, fill: '#ef4444' },
                        { name: 'Magreza', value: desnutricaoAvg, fill: '#3b82f6' }
                      ]}
                      innerRadius="58%"
                      outerRadius="80%"
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: darkMode ? '#1c1c1e' : '#ffffff', borderColor: darkMode ? '#2c2c2e' : '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', color: darkMode ? '#f5f5f7' : '#0f172a' }}
                      itemStyle={{ fontWeight: 'bold' }}
                      formatter={(v: any, n: any) => [`${v}%`, n]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', color: darkMode ? '#a1a1aa' : '#475569', paddingTop: '10px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-zinc-800/10 rounded-xl" />
              )}
            </div>
          </div>

          {/* Card de Pontos Críticos e Velocidade de Aceleração por Região */}
          <div className="md:col-span-3 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl p-6 flex flex-col justify-between shadow-sm transition-colors duration-300 min-h-[380px] h-auto md:h-[380px]">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider leading-snug">
                      {isEut ? 'Recuperação do Peso Adequado por Região' : 'Pontos Críticos de Aceleração de Risco'}
                    </h3>
                    <div className="relative group/tooltip inline-block cursor-help text-slate-400 dark:text-zinc-550 hover:text-slate-600 dark:hover:text-[#f5f5f7] shrink-0">
                      <Info className="w-3.5 h-3.5" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-56 bg-slate-900 dark:bg-zinc-800 text-white dark:text-[#f5f5f7] text-[10px] p-2.5 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 font-semibold normal-case tracking-normal leading-relaxed border dark:border-zinc-700 text-center">
                        {isEut 
                          ? 'Ranking das UBSs/Regiões ordenadas pelo maior aumento no percentual de peso saudável no período.'
                          : 'Ranking das UBSs/Regiões ordenadas pelo maior avanço ou aumento na taxa de prevalência de risco nutricional.'}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium leading-normal">
                    {isEut ? 'Maior ganho de peso adequado (Delta % anual · Nutri for Schools)' : 'Maior avanço de prevalência do risco (Delta % anual · Nutri for Schools)'}
                  </p>
                </div>
                <div className="shrink-0 self-start sm:self-center">
                  {isEut ? (
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-955/20 border border-teal-100 dark:border-teal-900/40 px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> MELHORA ATIVA
                    </span>
                  ) : (
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/40 px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit shadow-sm">
                      <AlertTriangle className="w-3 h-3" /> ALERTA DE ACELERAÇÃO
                    </span>
                  )}
                </div>
              </div>

              {/* Contêiner do Gráfico de Barras Customizado de Alta Performance e Design Symmetrical */}
              <div className="flex-1 flex flex-col justify-center space-y-4 px-1 min-h-[210px]">
                {mounted ? (
                  dynamicRanking.map((entry: any, i: number) => {
                    const isHighlighted = cleanSelectedBairro && entry.name.toLowerCase() === cleanSelectedBairro.toLowerCase();
                    const fill = isHighlighted 
                      ? 'bg-teal-600 dark:bg-teal-500' 
                      : isEut
                        ? (i < 2 ? 'bg-teal-500 dark:bg-teal-400' : 'bg-teal-400/75 dark:bg-teal-500/60')
                        : (i < 2 ? 'bg-rose-500 dark:bg-rose-450' : 'bg-amber-500 dark:bg-amber-400');
                    
                    // Normalizamos os deltas para a largura visual da barra
                    const deltas = dynamicRanking.map((r: any) => Math.abs(r.delta));
                    const maxDelta = Math.max(...deltas) || 1;
                    const barWidth = Math.min(100, Math.max(8, (Math.abs(entry.delta) / maxDelta) * 100));

                    return (
                      <div key={i} className="space-y-1.5 group/bar select-none">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-start gap-2 max-w-[80%]">
                            <span className="text-[10px] font-black text-slate-400 dark:text-zinc-550 mt-0.5 shrink-0 select-none">
                              0{i + 1}
                            </span>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 leading-snug break-words" title={entry.name}>
                              {entry.name}
                            </span>
                          </div>
                          <span className={`tabular-nums text-xs font-black shrink-0 ${
                            isHighlighted 
                              ? 'text-teal-600 dark:text-teal-400' 
                              : isEut ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-455'
                          }`}>
                            {entry.delta >= 0 ? '+' : ''}{entry.delta}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800/80 rounded-full overflow-hidden border border-slate-200/10 dark:border-zinc-700/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
                            className={`h-full rounded-full transition-all duration-300 ${fill} group-hover/bar:brightness-105 shadow-sm`}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-zinc-800/10 rounded-xl" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Seção 3: Evolução Histórica e Projeção Temporal (Largura Total) ── */}
        <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl p-6 flex flex-col shadow-sm transition-colors duration-300 min-h-[340px] w-full">
          <div className="mb-4">
            <h3 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] tracking-wide">
              {analysisLevel !== 'municipio' ? `Evolução em ${analysisLevel === 'ubs' ? selectedUbs : analysisLevel === 'bairro' ? selectedBairroName : selectedSchoolName}` : 'Evolução Histórica e Projeção'}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
              Destaque para: <span className="text-slate-800 dark:text-zinc-200 font-bold">{mainLabel}</span> &nbsp;·&nbsp;
              {analysisLevel !== 'municipio' ? <span className="text-slate-600 dark:text-zinc-300 font-bold">{analysisLevel === 'ubs' ? selectedUbs : analysisLevel === 'bairro' ? selectedBairroName : selectedSchoolName} &nbsp;·&nbsp;</span> : null}
              <span className={`${situationStyles.text} font-semibold animate-pulse`}>★ Projeção Preditiva 2026–2027</span>
            </p>
          </div>
          <div className="h-[260px] w-full relative">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeTemporalData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                  <defs>
                    <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f43f5e" floodOpacity="0.45" />
                    </filter>
                    <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.45" />
                    </filter>
                    <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.45" />
                    </filter>
                    <filter id="glow-teal" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0d9488" floodOpacity="0.45" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"} vertical={false} />
                  <XAxis dataKey="ano" stroke={darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} tick={{ fill: darkMode ? '#a1a1aa' : '#475569', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                  <YAxis stroke={darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} tick={{ fill: darkMode ? '#a1a1aa' : '#475569', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} unit="%" />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    x="2025"
                    stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
                    strokeDasharray="4 3"
                    label={{ value: 'Projeção Preditiva →', fill: darkMode ? '#a1a1aa' : '#64748b', fontSize: 9, position: 'insideTopRight', fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    name="% Obesidade"
                    dataKey="obesidade"
                    stroke="#f43f5e"
                    strokeWidth={isObs ? 3 : 1.5}
                    strokeOpacity={isObs ? 1 : 0.3}
                    filter={isObs ? "url(#glow-red)" : undefined}
                    dot={(props: any) => props.payload.isPrevisao
                      ? <circle cx={props.cx} cy={props.cy} r={isObs ? 5 : 3} fill="none" stroke="#f43f5e" strokeWidth={2} strokeDasharray="3 1" strokeOpacity={isObs ? 1 : 0.3} />
                      : <circle cx={props.cx} cy={props.cy} r={isObs ? 4 : 2} fill="#f43f5e" strokeOpacity={isObs ? 1 : 0.3} />}
                    activeDot={{ r: 6, fill: '#fff', stroke: '#f43f5e', strokeWidth: 3 }}
                  />
                  <Line
                    type="monotone"
                    name="% Sobrepeso"
                    dataKey="sobrepeso"
                    stroke="#f59e0b"
                    strokeWidth={isSob ? 3 : 1.5}
                    strokeOpacity={isSob ? 1 : 0.3}
                    filter={isSob ? "url(#glow-amber)" : undefined}
                    dot={(props: any) => props.payload.isPrevisao
                      ? <circle cx={props.cx} cy={props.cy} r={isSob ? 5 : 3} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 1" strokeOpacity={isSob ? 1 : 0.3} />
                      : <circle cx={props.cx} cy={props.cy} r={isSob ? 4 : 2} fill="#f59e0b" strokeOpacity={isSob ? 1 : 0.3} />}
                    activeDot={{ r: 6, fill: '#fff', stroke: '#f59e0b', strokeWidth: 3 }}
                  />
                  <Line
                    type="monotone"
                    name="% Desnutrição"
                    dataKey="desnutricao"
                    stroke="#3b82f6"
                    strokeWidth={isDes ? 3 : 1.5}
                    strokeOpacity={isDes ? 1 : 0.3}
                    filter={isDes ? "url(#glow-blue)" : undefined}
                    dot={(props: any) => props.payload.isPrevisao
                      ? <circle cx={props.cx} cy={props.cy} r={isDes ? 5 : 3} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 1" strokeOpacity={isDes ? 1 : 0.3} />
                      : <circle cx={props.cx} cy={props.cy} r={isDes ? 4 : 2} fill="#3b82f6" strokeOpacity={isDes ? 1 : 0.3} />}
                    activeDot={{ r: 6, fill: '#fff', stroke: '#3b82f6', strokeWidth: 3 }}
                  />
                  <Line
                    type="monotone"
                    name="% Peso Adequado"
                    dataKey="eutrofia"
                    stroke="#0d9488"
                    strokeWidth={isEut ? 3 : 1.5}
                    strokeOpacity={isEut ? 1 : 0.3}
                    filter={isEut ? "url(#glow-teal)" : undefined}
                    dot={(props: any) => props.payload.isPrevisao
                      ? <circle cx={props.cx} cy={props.cy} r={isEut ? 5 : 3} fill="none" stroke="#0d9488" strokeWidth={2} strokeDasharray="3 1" strokeOpacity={isEut ? 1 : 0.3} />
                      : <circle cx={props.cx} cy={props.cy} r={isEut ? 4 : 2} fill="#0d9488" strokeOpacity={isEut ? 1 : 0.3} />}
                    activeDot={{ r: 6, fill: '#fff', stroke: '#0d9488', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-zinc-800/10 rounded-xl" />
            )}
          </div>
        </div>

        {/* ── Seção: Conflito Urbano / Infraestrutura ── */}
        <UrbanConflictSection />

    </motion.div>
  );
}
