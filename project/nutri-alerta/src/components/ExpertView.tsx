"use client";
import React from 'react';
import Sidebar from '@/components/Sidebar';
import RiskMap from '@/components/RiskMap';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, CartesianGrid, XAxis, YAxis, BarChart, Bar, ReferenceLine
} from 'recharts';
import { TrendingUp, Users, Activity, ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import UrbanConflictSection from '@/components/UrbanConflictSection';
import DemographicsSection from '@/components/DemographicsSection';
import UbsComparisonSection from '@/components/UbsComparisonSection';
import { useAppStore } from '@/store/useAppStore';

// ── Tooltip customizado com dados reais e suporte a tema escuro ──────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  const { darkMode } = useAppStore();
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-xl p-3 shadow-lg text-xs text-slate-800 dark:text-zinc-200 transition-colors">
      <p className="text-slate-500 dark:text-zinc-400 mb-2 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-600 dark:text-zinc-300">{p.name}:</span>
          <span className="font-bold text-slate-900 dark:text-[#f5f5f7]">{Number(p.value).toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
};

// ── KPI Card com suporte a tema escuro e fix de tooltip cortado ─────────────────────────
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
      ? 'text-emerald-600 bg-emerald-50/40 dark:text-emerald-400 dark:bg-emerald-950/20'
      : 'text-red-600 bg-red-50/40 dark:text-red-400 dark:bg-red-950/20')
    : trend === 'down' 
      ? (isUpPositive
        ? 'text-red-600 bg-red-50/40 dark:text-red-400 dark:bg-red-950/20'
        : 'text-emerald-600 bg-emerald-50/40 dark:text-emerald-400 dark:bg-emerald-950/20')
      : 'text-slate-500 bg-slate-100 dark:text-zinc-400 dark:bg-zinc-800';

  return (
    <div className={`relative rounded-2xl p-5 border bg-white dark:bg-[#1c1c1e] ${borderColor} dark:border-[#2c2c2e] group transition-all hover:shadow-md`}>
      {/* Container de máscara absoluta para a bolha desfocada (evita cortar o tooltip) */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 -mr-8 -mt-8 ${accentColor.replace('text-', 'bg-')}`} />
      </div>
      
      <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2 font-black flex items-center justify-between relative z-10">
        <span>{label}</span>
        {tooltip && (
          <div className="relative group/tooltip inline-block cursor-help ml-1 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300">
            <Info className="w-3.5 h-3.5" />
            <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-48 bg-slate-900 dark:bg-zinc-800 text-white dark:text-[#f5f5f7] text-[10px] p-2.5 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 font-medium normal-case tracking-normal leading-normal border dark:border-zinc-700">
              {tooltip}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between relative z-10">
        <h3 className={`text-4.5xl font-black tracking-tight tabular-nums ${accentColor} drop-shadow-sm`}>{value}</h3>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${trendColor} px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-zinc-700/50 shadow-sm`}>
            <TrendIcon className="w-3 h-3" />{trendLabel}
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed font-medium relative z-10">{sub}</p>
    </div>
  );
}

export default function ExpertView() {
  const { 
    anoSelecionado, indicador, selectedPoi, selectedBairro, setSelectedPoi,
    temporalData, regionalData, yearsList, activePoiTypes,
    darkMode, sidebarCollapsed, setSidebarCollapsed
  } = useAppStore();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Multiplicadores dos POIs das camadas de infraestrutura (Simulação de Intervenção)
  const { multObs, multDes } = React.useMemo(() => {
    let mObs = 1.0;
    let mDes = 1.0;
    if (!activePoiTypes.includes('Alimentação - Restaurante/Fast-food')) {
      mObs *= 0.88;
    }
    if (!activePoiTypes.includes('Esporte e Lazer')) {
      mObs *= 1.10;
    }
    if (!activePoiTypes.includes('Alimentação - Mercado')) {
      mDes *= 1.15;
      mObs *= 1.08;
    }
    if (!activePoiTypes.includes('Educação')) {
      mDes *= 1.05;
      mObs *= 1.05;
    }
    return { multObs: mObs, multDes: mDes };
  }, [activePoiTypes]);

  // Dado temporal reativo com fallback para métricas gerais e efeito dos POIs
  const activeTemporalData = React.useMemo(() => {
    const baseSource = selectedBairro ? yearsList.map(yr => {
      const cleanYr = yr.replace('★', '').trim();
      const yrRecord = regionalData[cleanYr]?.[selectedBairro];
      const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYr) || { desnutricao: 0, obesidade: 0, sobrepeso: 0, eutrofia: 58 };
      
      return {
        ano: yr,
        desnutricao: yrRecord && yrRecord.desnutricao ? yrRecord.desnutricao : globalRec.desnutricao,
        obesidade: yrRecord && yrRecord.obesidade ? yrRecord.obesidade : globalRec.obesidade,
        sobrepeso: yrRecord && yrRecord.sobrepeso ? yrRecord.sobrepeso : (globalRec as any).sobrepeso || 0,
        eutrofia: yrRecord && yrRecord.eutrofia ? yrRecord.eutrofia : (globalRec as any).eutrofia || 58,
        isPrevisao: Number(cleanYr) >= 2026
      };
    }) : temporalData;

    return baseSource.map(d => {
      const scaleDes = Number((d.desnutricao * multDes).toFixed(2));
      const scaleObs = Number((d.obesidade * multObs).toFixed(2));
      const scaleSob = Number(((d.sobrepeso || 0) * ((multObs + 1) / 2)).toFixed(2));
      const beforeSum = (d.desnutricao || 0) + (d.obesidade || 0) + (d.sobrepeso || 0);
      const afterSum = scaleDes + scaleObs + scaleSob;
      const baseEut = d.eutrofia !== undefined ? d.eutrofia : (100 - beforeSum);
      const scaleEut = Math.max(10, Number((baseEut - (afterSum - beforeSum)).toFixed(2)));
      return {
        ...d,
        desnutricao: scaleDes,
        obesidade: scaleObs,
        sobrepeso: scaleSob,
        eutrofia: scaleEut
      };
    });
  }, [selectedBairro, temporalData, yearsList, regionalData, multDes, multObs]);

  // Encontra os dados do ano selecionado
  const dadosAno = activeTemporalData.find(d => d.ano === anoSelecionado) || activeTemporalData[0] || { desnutricao: 0, obesidade: 0, sobrepeso: 0, eutrofia: 0 };
  // Pega a projeção de 2027
  const dadosProj = activeTemporalData.find(d => d.ano === '2027 ★') || activeTemporalData.find(d => d.ano.includes('2027')) || activeTemporalData[activeTemporalData.length - 1] || { desnutricao: 0, obesidade: 0, sobrepeso: 0, eutrofia: 0 };

  // Configuração baseada no indicador selecionado
  const isObs = indicador === 'obesidade';
  const isDes = indicador === 'desnutricao';
  const isSob = indicador === 'sobrepeso';
  const isEut = indicador === 'eutrofia';

  const mainValue = Number((isObs ? dadosAno.obesidade : isDes ? dadosAno.desnutricao : isSob ? dadosAno.sobrepeso || 0 : dadosAno.eutrofia || 0).toFixed(2));
  const mainProj = Number((isObs ? dadosProj.obesidade : isDes ? dadosProj.desnutricao : isSob ? dadosProj.sobrepeso || 0 : dadosProj.eutrofia || 0).toFixed(2));
  const secondaryValue = Number((isDes ? dadosAno.obesidade : dadosAno.desnutricao).toFixed(2));
  const delta = (mainProj - mainValue).toFixed(2);
  const isAlta = Number(delta) > 0;

  const mainColor = isEut
    ? 'text-emerald-600 dark:text-emerald-400'
    : indicador === 'desnutricao' 
      ? 'text-blue-600 dark:text-blue-400' 
      : indicador === 'sobrepeso' 
        ? 'text-amber-600 dark:text-amber-400' 
        : 'text-red-600 dark:text-red-400';
        
  const mainBg = isEut
    ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
    : indicador === 'desnutricao' 
      ? 'bg-blue-50/50 dark:bg-blue-950/20' 
      : indicador === 'sobrepeso' 
        ? 'bg-amber-50/50 dark:bg-amber-950/20' 
        : 'bg-red-50/50 dark:bg-red-950/20';
        
  const mainBorder = isEut
    ? 'border-emerald-100'
    : indicador === 'desnutricao' 
      ? 'border-blue-100' 
      : indicador === 'sobrepeso' 
        ? 'border-amber-100' 
        : 'border-red-100';
        
  const mainLabel = isEut
    ? 'Peso Adequado'
    : indicador === 'desnutricao' 
      ? 'Desnutrição' 
      : indicador === 'sobrepeso' 
        ? 'Sobrepeso' 
        : 'Obesidade';

  const cleanYear = anoSelecionado.replace('★', '').trim();
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
    : [
        { name: 'Chervezon', delta: 2.1 },
        { name: 'Vila Cristina', delta: 1.8 },
        { name: 'Wenzel', delta: 1.5 },
        { name: 'Bela Vista', delta: 1.2 },
        { name: 'Mãe Preta', delta: 0.9 }
      ];

  const currentBairroRecord = selectedBairro && regionalData[cleanYear]?.[selectedBairro];
  const sumAvaliados = currentYearRegions.reduce((sum: number, reg: any) => sum + (reg.total_avaliados ?? 0), 0);
  const avaliadosVal = selectedBairro 
    ? (currentBairroRecord ? (currentBairroRecord.total_avaliados ?? 0) : 0)
    : (sumAvaliados > 0 ? sumAvaliados : (anoSelecionado === '2025' ? 45200 : anoSelecionado === '2024' ? 41100 : 38500));

  const avaliadosStr = avaliadosVal >= 1000 
    ? `${(avaliadosVal / 1000).toFixed(1)}K` 
    : String(avaliadosVal);
  const avaliadosSub = selectedBairro 
    ? "Total de indivíduos avaliados nesta UBS" 
    : "Total acumulado nas 18 UBS de Rio Claro";

  // Compute dynamic distribution averages for selected year
  let eutrofiaAvg = 61.2;
  let sobrepesoAvg = 16.3;
  let obesidadeAvg = isObs ? mainValue : (dadosAno.obesidade || 12.93);
  let desnutricaoAvg = !isObs ? mainValue : (dadosAno.desnutricao || 2.62);

  if (selectedBairro && currentBairroRecord) {
    eutrofiaAvg = typeof currentBairroRecord.eutrofia === 'number' && currentBairroRecord.eutrofia > 0 ? Number(currentBairroRecord.eutrofia.toFixed(1)) : eutrofiaAvg;
    sobrepesoAvg = typeof currentBairroRecord.sobrepeso === 'number' && currentBairroRecord.sobrepeso > 0 ? Number(currentBairroRecord.sobrepeso.toFixed(1)) : sobrepesoAvg;
    obesidadeAvg = typeof currentBairroRecord.obesidade === 'number' && currentBairroRecord.obesidade > 0 ? Number(currentBairroRecord.obesidade.toFixed(1)) : obesidadeAvg;
    desnutricaoAvg = typeof currentBairroRecord.desnutricao === 'number' && currentBairroRecord.desnutricao > 0 ? Number(currentBairroRecord.desnutricao.toFixed(1)) : desnutricaoAvg;
  } else if (currentYearRegions.length > 0) {
    let sumEutrofia = 0, sumSobrepeso = 0, count = 0;
    currentYearRegions.forEach((reg: any) => {
      if (typeof reg.eutrofia === 'number') {
        sumEutrofia += reg.eutrofia;
        sumSobrepeso += reg.sobrepeso || 0;
        count++;
      }
    });
    if (count > 0) {
      eutrofiaAvg = Number((sumEutrofia / count).toFixed(2));
      sobrepesoAvg = Number((sumSobrepeso / count).toFixed(2));
      obesidadeAvg = Number((dadosAno.obesidade).toFixed(2));
      desnutricaoAvg = Number((dadosAno.desnutricao).toFixed(2));
    }
  }

  // Aplicamos os multiplicadores dos POIs na desnutrição e obesidade
  obesidadeAvg = Number((obesidadeAvg * multObs).toFixed(2));
  desnutricaoAvg = Number((desnutricaoAvg * multDes).toFixed(2));

  // Normalização para a soma ser exatamente 100%
  const totalSum = eutrofiaAvg + sobrepesoAvg + obesidadeAvg + desnutricaoAvg;
  if (totalSum > 0) {
    eutrofiaAvg = Number((eutrofiaAvg / totalSum * 100).toFixed(1));
    sobrepesoAvg = Number((sobrepesoAvg / totalSum * 100).toFixed(1));
    obesidadeAvg = Number((obesidadeAvg / totalSum * 100).toFixed(1));
    desnutricaoAvg = Number((desnutricaoAvg / totalSum * 100).toFixed(1));
  }

  const cleanSelectedBairro = selectedBairro
    ? selectedBairro.replace('UBS ', '').replace('USF ', '')
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background transition-colors duration-300 relative"
    >
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Cabeçalho da view (Com botão de expandir o menu) ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                title="Mostrar menu lateral"
                className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] shadow-sm p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-[#f5f5f7] cursor-pointer flex items-center justify-center"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-[#f5f5f7] tracking-tight">Rio Claro — Painel Epidemiológico</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">SISVAN · Faixa Etária: 0 a 18 anos (Consolidado) · Filtro Ativo: {anoSelecionado}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 rounded-lg px-3 py-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(13,148,136,0.5)] animate-pulse" />
            LIVE DATA: SISVAN 2025
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label={`Avaliados (${anoSelecionado})`}
            value={avaliadosStr}
            sub={avaliadosSub}
            accentColor="text-slate-800 dark:text-zinc-200"
            bgColor="bg-white dark:bg-[#1c1c1e]"
            borderColor="border-slate-200 dark:border-[#2c2c2e]"
            tooltip="Quantidade total de indivíduos pesados e avaliados no SISVAN na região selecionada."
          />
          <KpiCard
            label={`${mainLabel} · ${anoSelecionado}`}
            value={`${mainValue}%`}
            sub={`Média entre as UBS · SISVAN real`}
            trend={isAlta ? "up" : "down"}
            trendLabel={`${Number(delta) > 0 ? '+' : ''}${delta} p.p. em 2027`}
            accentColor={mainColor}
            bgColor={mainBg}
            borderColor={mainBorder}
            tooltip="Percentual de prevalência registrado para este indicador nutricional em relação total avaliado."
            invertTrendColor={isEut}
          />
          <KpiCard
            label={`Projeção ${mainLabel} · 2027`}
            value={`${mainProj}%`}
            sub="★ Modelo preditivo de Machine Learning"
            trend={isAlta ? "up" : "down"}
            trendLabel={isAlta ? (isEut ? "melhora gradual" : "alta gradual") : (isEut ? "recuo leve" : "queda leve")}
            accentColor={isEut ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}
            bgColor={isEut ? "bg-emerald-50/20 dark:bg-emerald-950/20" : "bg-amber-50/20 dark:bg-amber-950/20"}
            borderColor={isEut ? "border-emerald-200/60 dark:border-emerald-900/40" : "border-amber-200/60 dark:border-amber-900/40"}
            tooltip="Previsão calculada por inteligência artificial para o ano de 2027 com base no histórico."
            invertTrendColor={isEut}
          />
          <KpiCard
            label={`${isObs ? 'Desnutrição' : 'Obesidade'} · ${anoSelecionado}`}
            value={`${secondaryValue}%`}
            sub="Outro indicador acompanhado · SISVAN"
            trend="neutral"
            trendLabel="estável"
            accentColor="text-slate-600 dark:text-zinc-300"
            bgColor="bg-white dark:bg-[#1c1c1e]"
            borderColor="border-slate-200 dark:border-[#2c2c2e]"
            tooltip="Taxa de prevalência do segundo indicador nutricional acompanhado."
          />
        </div>

        {/* ── Mapa + Donut ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6" style={{ height: '360px' }}>

          {/* Mapa choropleth */}
          <div className="md:col-span-3 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl overflow-hidden relative shadow-sm transition-colors duration-300">
            <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-700 dark:text-zinc-200 uppercase tracking-widest bg-white/95 dark:bg-[#1c1c1e]/95 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2c2c2e] shadow-sm inline-block w-fit">
                Mapa de Risco por Região
              </span>
              {selectedBairro && (
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest bg-teal-50/95 dark:bg-teal-950/90 px-3 py-1.5 rounded-lg border border-teal-200/60 dark:border-teal-900/60 shadow-sm inline-block w-fit">
                  📍 {selectedBairro}
                </span>
              )}
            </div>

            {selectedPoi && (
              <div className="absolute bottom-4 left-4 z-[400] bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-xl p-4 shadow-lg w-64 animate-in slide-in-from-bottom-4 text-slate-800 dark:text-zinc-200">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-[#f5f5f7] leading-tight pr-4">{selectedPoi.nome}</h4>
                  <button onClick={() => setSelectedPoi(null)} className="text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-[#f5f5f7] transition-colors font-bold text-lg leading-none -mt-1 cursor-pointer">×</button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedPoi.color }} />
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">{selectedPoi.categoria}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-3">
                  Ponto de interesse integrado via motor de geoprocessamento. Pronto para análise pelo modelo de IA.
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-[10px] text-slate-700 dark:text-zinc-200 font-bold py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer">
                    Detalhes
                  </button>
                  <button className="flex-1 hover:bg-teal-700 text-[10px] text-white font-bold py-1.5 rounded-lg transition-colors bg-teal-600 cursor-pointer">
                    Simular
                  </button>
                </div>
              </div>
            )}

            <RiskMap />
          </div>

          {/* Distribuição Nutricional */}
          <div className="md:col-span-2 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl p-6 flex flex-col shadow-sm transition-colors duration-300">
            <div className="mb-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] tracking-wide">
                {selectedBairro ? `Distribuição em ${selectedBairro}` : 'Distribuição Nutricional'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                {selectedBairro ? `${selectedBairro}` : 'Rio Claro'} · SISVAN {anoSelecionado}
              </p>
            </div>
            <div className="flex-1">
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
                    >
                    </Pie>
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
        </div>

        {/* ── Série Temporal + Ranking ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ minHeight: '280px' }}>

          {/* Gráfico temporal */}
          <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl p-6 flex flex-col shadow-sm transition-colors duration-300">
            <div className="mb-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] tracking-wide">
                {selectedBairro ? `Evolução em ${selectedBairro}` : 'Evolução Histórica e Projeção'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                Destaque para: <span className="text-slate-800 dark:text-zinc-200 font-bold">{mainLabel}</span> &nbsp;·&nbsp;
                {selectedBairro ? <span className="text-slate-600 dark:text-zinc-300 font-bold">{selectedBairro} &nbsp;·&nbsp;</span> : null}
                <span className="text-amber-600 dark:text-amber-400">★ 2026–2027</span>
              </p>
            </div>
            <div className="flex-1">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeTemporalData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                    <defs>
                      <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.45" />
                      </filter>
                      <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.45" />
                      </filter>
                      <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.45" />
                      </filter>
                      <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.45" />
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
                      label={{ value: 'Projeção →', fill: darkMode ? '#a1a1aa' : '#64748b', fontSize: 9, position: 'insideTopRight', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      name="% Obesidade"
                      dataKey="obesidade"
                      stroke="#ef4444"
                      strokeWidth={isObs ? 3 : 1.5}
                      strokeOpacity={isObs ? 1 : 0.3}
                      filter={isObs ? "url(#glow-red)" : undefined}
                      dot={(props: any) => props.payload.isPrevisao
                        ? <circle cx={props.cx} cy={props.cy} r={isObs ? 5 : 3} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 1" strokeOpacity={isObs ? 1 : 0.3} />
                        : <circle cx={props.cx} cy={props.cy} r={isObs ? 4 : 2} fill="#ef4444" strokeOpacity={isObs ? 1 : 0.3} />}
                      activeDot={{ r: 6, fill: '#fff', stroke: '#ef4444', strokeWidth: 3 }}
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
                      stroke="#10b981"
                      strokeWidth={isEut ? 3 : 1.5}
                      strokeOpacity={isEut ? 1 : 0.3}
                      filter={isEut ? "url(#glow-emerald)" : undefined}
                      dot={(props: any) => props.payload.isPrevisao
                        ? <circle cx={props.cx} cy={props.cy} r={isEut ? 5 : 3} fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="3 1" strokeOpacity={isEut ? 1 : 0.3} />
                        : <circle cx={props.cx} cy={props.cy} r={isEut ? 4 : 2} fill="#10b981" strokeOpacity={isEut ? 1 : 0.3} />}
                      activeDot={{ r: 6, fill: '#fff', stroke: '#10b981', strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-zinc-800/10 rounded-xl" />
              )}
            </div>
          </div>

          {/* Ranking */}
          <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl p-6 flex flex-col shadow-sm transition-colors duration-300">
            <div className="mb-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] tracking-wide">
                {isEut ? 'Top 5 UBS · Evolução Saudável' : 'Top 5 UBS · Aceleração de Risco'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                {isEut ? 'Delta percentual ano a ano · Melhora no Peso Adequado' : `Delta percentual ano a ano · ${mainLabel}`}
              </p>
            </div>
            <div className="flex-1">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicRanking} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: darkMode ? '#a1a1aa' : '#475569', fontSize: 10, fontWeight: 'bold' }}
                      width={110}
                    />
                    <RechartsTooltip
                      cursor={{ fill: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
                      contentStyle={{ backgroundColor: darkMode ? '#1c1c1e' : '#ffffff', borderColor: darkMode ? '#2c2c2e' : '#e2e8f0', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: darkMode ? '#f5f5f7' : '#0f172a' }}
                      formatter={(v: any) => [`${v >= 0 ? '+' : ''}${v}%`, 'Delta']}
                    />
                    <Bar dataKey="delta" name="Delta (%)" radius={[0, 6, 6, 0]}>
                      {dynamicRanking.map((entry: any, i: number) => {
                        const isHighlighted = cleanSelectedBairro && entry.name.toLowerCase() === cleanSelectedBairro.toLowerCase();
                        return (
                          <Cell 
                             key={i} 
                             fill={isHighlighted 
                               ? '#0d9488' // Teal
                               : isEut
                                 ? (i < 2 ? '#10b981' : i < 4 ? '#34d399' : darkMode ? '#3a3a3c' : '#cbd5e1') // Green/Emerald tones
                                 : (i < 2 ? '#ef4444' : i < 4 ? '#f59e0b' : darkMode ? '#3a3a3c' : '#cbd5e1') // Red/Amber risk tones
                             } 
                             stroke={isHighlighted ? '#ffffff' : 'none'}
                             strokeWidth={isHighlighted ? 1 : 0}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-zinc-800/10 rounded-xl" />
              )}
            </div>
          </div>
        </div>

        {/* ── Painel Demográfico Escolar (Idade e Gênero) ── */}
        <DemographicsSection />

        {/* ── Painel Comparador Territorial de UBSs ── */}
        <UbsComparisonSection />

        {/* ── Seção: Conflito Urbano ── */}
        <UrbanConflictSection />

      </div>
    </motion.div>
  );
}
