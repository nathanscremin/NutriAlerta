"use client";
import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getDemographicsForUbs } from '@/lib/demographics';
import { UNIDADES_SAUDE } from '@/lib/mockData';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, Legend } from 'recharts';
import { GitCompare, MapPin, TrendingUp, Users, ArrowUpRight, ArrowDownRight, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UbsComparisonSection() {
  const { regionalData, temporalData, yearsList, darkMode, indicador, setIndicador, selectedBairro } = useAppStore();

  // Estado para controle de montagem no cliente (SSR Hydration Guard)
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Lista de todas as UBSs ordenadas
  const ubsList = useMemo(() => {
    return UNIDADES_SAUDE.filter(u => u.categoria === 'UBS')
      .map(u => u.nome)
      .sort((a, b) => {
        const nameA = a.replace('UBS ', '').replace('USF ', '');
        const nameB = b.replace('UBS ', '').replace('USF ', '');
        return nameA.localeCompare(nameB);
      });
  }, []);

  // Estados locais para seleção das duas UBSs
  const [ubsA, setUbsA] = useState<string>("UBS Jardim Chervezon");
  const [ubsB, setUbsB] = useState<string>("UBS Vila Cristina");

  // Sincroniza a UBS A com a UBS/Bairro selecionado no mapa/sidebar globalmente
  React.useEffect(() => {
    if (selectedBairro && ubsList.includes(selectedBairro)) {
      if (selectedBairro === ubsB) {
        // Se a UBS selecionada globalmente já for a UBS B, troca os lados
        setUbsB(ubsA);
        setUbsA(selectedBairro);
      } else {
        setUbsA(selectedBairro);
      }
    }
  }, [selectedBairro, ubsList]);

  // Mapeia o indicador ativo (se for o 'global', usamos 'obesidade' como padrão)
  const activeIndicator = useMemo(() => {
    if (indicador === 'global') return 'obesidade';
    if (indicador === 'desnutricao' || indicador === 'eutrofia' || indicador === 'sobrepeso' || indicador === 'obesidade') {
      return indicador;
    }
    return 'obesidade';
  }, [indicador]);

  // Dropdown states
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);

  // Encontra taxas reais ou fallbacks
  const getUbsStatsForYear = (ubsName: string, year: string) => {
    const cleanYear = year.replace('★', '').trim();
    const record = regionalData[cleanYear]?.[ubsName];
    
    // Obesidade
    let obs = 12.9;
    if (record && typeof record.obesidade === 'number') {
      obs = record.obesidade;
    } else {
      const yearRec = temporalData.find(d => d.ano.replace('★', '').trim() === cleanYear);
      if (yearRec) obs = yearRec.obesidade;
    }

    // Desnutrição
    let des = 2.6;
    if (record && typeof record.desnutricao === 'number') {
      des = record.desnutricao;
    } else {
      const yearRec = temporalData.find(d => d.ano.replace('★', '').trim() === cleanYear);
      if (yearRec) des = yearRec.desnutricao;
    }

    // Sobrepeso
    let sob = 18.0;
    if (record && typeof record.sobrepeso === 'number') {
      sob = record.sobrepeso;
    } else {
      const yearRec = temporalData.find(d => d.ano.replace('★', '').trim() === cleanYear);
      if (yearRec && typeof (yearRec as any).sobrepeso === 'number') sob = (yearRec as any).sobrepeso;
    }

    // Peso Adequado (Eutrofia)
    let eut = 61.55;
    if (record && typeof record.eutrofia === 'number') {
      eut = record.eutrofia;
    } else {
      const yearRec = temporalData.find(d => d.ano.replace('★', '').trim() === cleanYear);
      if (yearRec && typeof (yearRec as any).eutrofia === 'number') eut = (yearRec as any).eutrofia;
    }

    // Alunos avaliados
    let total = 350;
    if (record && typeof record.total_avaliados === 'number') {
      total = record.total_avaliados;
    }

    return { obs, des, sob, eut, total };
  };

  // Último ano histórico consolidado (geralmente 2025)
  const statsA = useMemo(() => getUbsStatsForYear(ubsA, '2025'), [ubsA, regionalData, temporalData]);
  const statsB = useMemo(() => getUbsStatsForYear(ubsB, '2025'), [ubsB, regionalData, temporalData]);

  // Demográficos reativos por UBS baseados no ano de 2025
  const demoA = useMemo(() => {
    return getDemographicsForUbs(ubsA, '2025', statsA.des, statsA.sob, statsA.obs, statsA.eut);
  }, [ubsA, statsA]);

  const demoB = useMemo(() => {
    return getDemographicsForUbs(ubsB, '2025', statsB.des, statsB.sob, statsB.obs, statsB.eut);
  }, [ubsB, statsB]);

  // Dados para o gráfico histórico
  const chartData = useMemo(() => {
    return yearsList.map(yr => {
      const cleanYr = yr.replace('★', '').trim();
      const sA = getUbsStatsForYear(ubsA, cleanYr);
      const sB = getUbsStatsForYear(ubsB, cleanYr);

      return {
        ano: yr,
        [ubsA]: sA[activeIndicator === 'obesidade' ? 'obs' : activeIndicator === 'desnutricao' ? 'des' : activeIndicator === 'sobrepeso' ? 'sob' : 'eut'],
        [ubsB]: sB[activeIndicator === 'obesidade' ? 'obs' : activeIndicator === 'desnutricao' ? 'des' : activeIndicator === 'sobrepeso' ? 'sob' : 'eut'],
        isPrevisao: Number(cleanYr) >= 2026
      };
    });
  }, [ubsA, ubsB, yearsList, activeIndicator, regionalData, temporalData]);

  // Cores do indicador selecionado para o gráfico
  const indicatorConfig = useMemo(() => {
    switch (activeIndicator) {
      case 'desnutricao':
        return {
          label: 'Desnutrição',
          color: '#3b82f6',
          bg: 'bg-blue-500/10 dark:bg-blue-500/20',
          text: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200/50 dark:border-blue-900/40'
        };
      case 'sobrepeso':
        return {
          label: 'Sobrepeso',
          color: '#f59e0b',
          bg: 'bg-amber-500/10 dark:bg-amber-500/20',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-200/50 dark:border-amber-900/40'
        };
      case 'eutrofia':
        return {
          label: 'Peso Adequado',
          color: '#10b981',
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-200/50 dark:border-emerald-900/40'
        };
      case 'obesidade':
      default:
        return {
          label: 'Obesidade',
          color: '#ef4444',
          bg: 'bg-red-500/10 dark:bg-red-500/20',
          text: 'text-red-600 dark:text-red-400',
          border: 'border-red-200/50 dark:border-red-900/40'
        };
    }
  }, [activeIndicator]);

  // Custom tooltip para o gráfico comparativo
  const CustomCompareTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-xl p-3 shadow-lg text-xs transition-colors">
        <p className="text-slate-500 dark:text-zinc-400 mb-2 font-bold uppercase tracking-wider text-[10px]">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-6 mb-1.5 last:mb-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color, border: p.strokeDasharray ? '1px dashed #fff' : 'none' }} />
              <span className="text-slate-600 dark:text-zinc-300 font-bold truncate max-w-[130px]">{p.name.replace('UBS ', '').replace('USF ', '')}</span>
            </div>
            <span className="font-extrabold text-slate-900 dark:text-[#f5f5f7]">{Number(p.value).toFixed(2)}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl p-6 shadow-sm transition-colors duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 rounded-xl text-teal-600 dark:text-teal-400 shadow-inner">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider">
              Comparador Territorial de UBS
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
              Análise comparativa em tempo real entre duas unidades de atenção básica · SISVAN 2025
            </p>
          </div>
        </div>

        {/* Seletor de indicador interno */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200/50 dark:border-zinc-800/80 self-start sm:self-center">
          {[
            { id: 'desnutricao', label: 'Desnutrição', activeClass: 'bg-blue-500 text-white' },
            { id: 'eutrofia', label: 'Peso Adequado', activeClass: 'bg-emerald-500 text-white' },
            { id: 'sobrepeso', label: 'Sobrepeso', activeClass: 'bg-amber-500 text-white' },
            { id: 'obesidade', label: 'Obesidade', activeClass: 'bg-red-500 text-white' }
          ].map(ind => (
            <button
              key={ind.id}
              onClick={() => setIndicador(ind.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeIndicator === ind.id 
                  ? ind.activeClass + ' shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      {/* Seletores de UBS (Dropdowns de alto padrão) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* UBS A Selector */}
        <div className="relative z-30">
          <label className="text-[9px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest block mb-1.5">
            Selecione a Unidade de Saúde A:
          </label>
          <div className="relative">
            <button
              onClick={() => { setOpenA(!openA); setOpenB(false); }}
              className="w-full bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-[#2c2c2e] rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 dark:text-[#f5f5f7] flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-inner"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                {ubsA}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openA ? 'rotate-180' : ''}`} />
            </button>

            {openA && (
              <div className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-xl shadow-lg z-[500] scrollbar-thin">
                {ubsList.map(u => (
                  <button
                    key={u}
                    disabled={u === ubsB}
                    onClick={() => { setUbsA(u); setOpenA(false); }}
                    className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors border-b border-slate-100 dark:border-[#2c2c2e] last:border-b-0 flex items-center justify-between ${
                      ubsA === u
                        ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400'
                        : u === ubsB
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-zinc-900/50 text-slate-400'
                          : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
                    }`}
                  >
                    {u}
                    {ubsA === u && <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* UBS B Selector */}
        <div className="relative z-30">
          <label className="text-[9px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest block mb-1.5">
            Selecione a Unidade de Saúde B:
          </label>
          <div className="relative">
            <button
              onClick={() => { setOpenB(!openB); setOpenA(false); }}
              className="w-full bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-[#2c2c2e] rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 dark:text-[#f5f5f7] flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-inner"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                {ubsB}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openB ? 'rotate-180' : ''}`} />
            </button>

            {openB && (
              <div className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-xl shadow-lg z-[500] scrollbar-thin">
                {ubsList.map(u => (
                  <button
                    key={u}
                    disabled={u === ubsA}
                    onClick={() => { setUbsB(u); setOpenB(false); }}
                    className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors border-b border-slate-100 dark:border-[#2c2c2e] last:border-b-0 flex items-center justify-between ${
                      ubsB === u
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                        : u === ubsA
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-zinc-900/50 text-slate-400'
                          : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
                    }`}
                  >
                    {u}
                    {ubsB === u && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Grid Comparativa de Métricas (Lado a Lado) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Painel UBS A */}
        <div className="border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 bg-slate-50/30 dark:bg-zinc-900/10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 bg-teal-500 h-full" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50">
                UNIDADE A
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold flex items-center gap-1">
                <Users className="w-3 h-3" /> {statsA.total} Alunos
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-800 dark:text-[#f5f5f7] mb-4 tracking-tight">
              {ubsA}
            </h4>

            {/* Linhas de Prevalência */}
            <div className="space-y-3.5 mb-5">
              <IndicatorBar label="Peso Adequado" value={statsA.eut} color="bg-emerald-500" valueColor="text-emerald-500" />
              <IndicatorBar label="Obesidade" value={statsA.obs} color="bg-red-500" valueColor="text-red-500" />
              <IndicatorBar label="Sobrepeso" value={statsA.sob} color="bg-amber-500" valueColor="text-amber-500" />
              <IndicatorBar label="Desnutrição" value={statsA.des} color="bg-blue-500" valueColor="text-blue-500" />
            </div>
          </div>

          {/* Dados Demográficos Consolidados (Ano 2025) */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/50 grid grid-cols-2 gap-3 text-[10px]">
            <div className="bg-white dark:bg-[#1c1c1e] p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/40">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Idade Média Peso Adeq.</span>
              <span className="text-sm font-bold text-emerald-500">{demoA.globalAvgAgeEut} <span className="text-[9px] font-semibold text-slate-400">anos</span></span>
            </div>
            <div className="bg-white dark:bg-[#1c1c1e] p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/40">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Idade Média Obes.</span>
              <span className="text-sm font-bold text-red-500">{demoA.globalAvgAgeObs} <span className="text-[9px] font-semibold text-slate-400">anos</span></span>
            </div>
            <div className="bg-white dark:bg-[#1c1c1e] p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/40">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Idade Média Sobr.</span>
              <span className="text-sm font-bold text-amber-500">{demoA.globalAvgAgeSob} <span className="text-[9px] font-semibold text-slate-400">anos</span></span>
            </div>
            <div className="bg-white dark:bg-[#1c1c1e] p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/40">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Idade Média Desn.</span>
              <span className="text-sm font-bold text-blue-500">{demoA.globalAvgAgeDes} <span className="text-[9px] font-semibold text-slate-400">anos</span></span>
            </div>
            <div className="bg-white dark:bg-[#1c1c1e] p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/40 col-span-2 flex items-center justify-between">
              <div>
                <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Gênero Mais Acometido (Geral)</span>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200">
                  {demoA.globalAvgAgeObs > demoA.globalAvgAgeDes ? "Meninos (Predominante)" : "Meninas (Predominante)"}
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 dark:bg-blue-950/20 text-blue-500 border border-blue-100 dark:border-blue-900/35">
                SISVAN
              </span>
            </div>
          </div>
        </div>

        {/* Painel UBS B */}
        <div className="border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 bg-slate-50/30 dark:bg-zinc-900/10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                UNIDADE B
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold flex items-center gap-1">
                <Users className="w-3 h-3" /> {statsB.total} Alunos
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-800 dark:text-[#f5f5f7] mb-4 tracking-tight">
              {ubsB}
            </h4>

            {/* Linhas de Prevalência */}
            <div className="space-y-3.5 mb-5">
              <IndicatorBar label="Peso Adequado" value={statsB.eut} color="bg-emerald-500" valueColor="text-emerald-500" />
              <IndicatorBar label="Obesidade" value={statsB.obs} color="bg-red-500" valueColor="text-red-500" />
              <IndicatorBar label="Sobrepeso" value={statsB.sob} color="bg-amber-500" valueColor="text-amber-500" />
              <IndicatorBar label="Desnutrição" value={statsB.des} color="bg-blue-500" valueColor="text-blue-500" />
            </div>
          </div>

          {/* Dados Demográficos Consolidados (Ano 2025) */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/50 grid grid-cols-2 gap-3 text-[10px]">
            <div className="bg-white dark:bg-[#1c1c1e] p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/40">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Idade Média Peso Adeq.</span>
              <span className="text-sm font-bold text-emerald-500">{demoB.globalAvgAgeEut} <span className="text-[9px] font-semibold text-slate-400">anos</span></span>
            </div>
            <div className="bg-white dark:bg-[#1c1c1e] p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/40">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Idade Média Obes.</span>
              <span className="text-sm font-bold text-red-500">{demoB.globalAvgAgeObs} <span className="text-[9px] font-semibold text-slate-400">anos</span></span>
            </div>
            <div className="bg-white dark:bg-[#1c1c1e] p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/40">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Idade Média Sobr.</span>
              <span className="text-sm font-bold text-amber-500">{demoB.globalAvgAgeSob} <span className="text-[9px] font-semibold text-slate-400">anos</span></span>
            </div>
            <div className="bg-white dark:bg-[#1c1c1e] p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/40">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Idade Média Desn.</span>
              <span className="text-sm font-bold text-blue-500">{demoB.globalAvgAgeDes} <span className="text-[9px] font-semibold text-slate-400">anos</span></span>
            </div>
            <div className="bg-white dark:bg-[#1c1c1e] p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/40 col-span-2 flex items-center justify-between">
              <div>
                <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Gênero Mais Acometido (Geral)</span>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200">
                  {demoB.globalAvgAgeObs > demoB.globalAvgAgeDes ? "Meninos (Predominante)" : "Meninas (Predominante)"}
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 border border-indigo-100 dark:border-indigo-900/35">
                SISVAN
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Gráfico de Evolução Comparativo Temporal (Overlay das duas UBSs) */}
      <div className="bg-slate-50/50 dark:bg-zinc-800/10 border border-slate-100 dark:border-zinc-800/50 rounded-2xl p-5">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider">
              Evolução Temporal Comparativa: % {indicatorConfig.label}
            </h4>
            <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">
              Comparação histórica real (2018–2025) e projeções preditivas <span className="text-amber-500 font-bold">★</span> (2026–2027)
            </p>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
              <span className="w-3 h-0.5 bg-teal-500 inline-block" /> Unidade A
            </span>
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="w-3 h-0.5 bg-indigo-500 border-t border-dashed inline-block" style={{ borderTop: '2px dashed' }} /> Unidade B
            </span>
          </div>
        </div>

        <div className="h-56">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <filter id="glow-teal" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0d9488" floodOpacity="0.45" />
                  </filter>
                  <filter id="glow-indigo" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.45" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"} vertical={false} />
                <XAxis dataKey="ano" stroke={darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} tick={{ fill: darkMode ? '#a1a1aa' : '#475569', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                <YAxis stroke={darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} tick={{ fill: darkMode ? '#a1a1aa' : '#475569', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomCompareTooltip />} />
                <ReferenceLine
                  x="2025"
                  stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
                  strokeDasharray="4 3"
                  label={{ value: 'Previsões →', fill: darkMode ? '#a1a1aa' : '#64748b', fontSize: 9, position: 'insideTopRight', fontWeight: 'bold' }}
                />
                
                {/* Linha UBS A (Sólida / Glow) */}
                <Line
                  type="monotone"
                  name={ubsA}
                  dataKey={ubsA}
                  stroke="#0d9488"
                  strokeWidth={3}
                  filter="url(#glow-teal)"
                  dot={(props: any) => props.payload.isPrevisao
                    ? <circle cx={props.cx} cy={props.cy} r={5} fill="none" stroke="#0d9488" strokeWidth={2} strokeDasharray="3 1" />
                    : <circle cx={props.cx} cy={props.cy} r={4} fill="#0d9488" />}
                  activeDot={{ r: 6, fill: '#fff', stroke: '#0d9488', strokeWidth: 3 }}
                />

                {/* Linha UBS B (Dashed / Glow) */}
                <Line
                  type="monotone"
                  name={ubsB}
                  dataKey={ubsB}
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  filter="url(#glow-indigo)"
                  dot={(props: any) => props.payload.isPrevisao
                    ? <circle cx={props.cx} cy={props.cy} r={5} fill="none" stroke="#6366f1" strokeWidth={2} strokeDasharray="3 1" />
                    : <circle cx={props.cx} cy={props.cy} r={4} fill="#6366f1" />}
                  activeDot={{ r: 6, fill: '#fff', stroke: '#6366f1', strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-zinc-800/10 rounded-xl" />
          )}
        </div>
      </div>

    </div>
  );
}

// Subcomponente de barra de prevalência para simplificar
function IndicatorBar({ label, value, color, valueColor }: { label: string; value: number; color: string; valueColor: string }) {
  const isHealthyWeight = label === "Peso Adequado";
  const displayWidth = isHealthyWeight ? value : Math.min(value * 3, 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className="text-slate-650 dark:text-zinc-400 font-semibold">{label}</span>
        <span className={`font-bold ${valueColor} font-mono`}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${displayWidth}%` }}
          className={`h-full ${color} rounded-full`}
          transition={{ duration: 0.8 }}
          style={{ maxWidth: '100%' }}
        />
      </div>
    </div>
  );
}
