"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getDemographicsForUbs } from '@/lib/demographics';
import { getScopedNutritionMetrics } from '@/lib/metricSelectors';
import { ALL_POIS, getVoronoiGeoJSON, UNIDADES_SAUDE } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip as RechartsTooltip,
  PieChart, Pie
} from 'recharts';
import { 
  Info, Mars, Venus, ChevronDown, Search, Globe, Hospital, Home, School, X
} from 'lucide-react';

// ── Custom Tooltip for Recharts Prevalence Bar Chart ───────────────────────────
const CustomChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-3 shadow-lg text-xs transition-all">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: data.fill }} />
        <span className="font-extrabold text-slate-800 dark:text-[#f5f5f7]">{data.name}</span>
      </div>
      <p className="text-slate-500 dark:text-zinc-400 font-semibold leading-none">
        Prevalência: <span className="font-mono font-black text-slate-900 dark:text-white">{Number(data.value).toFixed(2)}%</span>
      </p>
    </div>
  );
};
export default function DemographicsSection() {
  const { 
    analysisLevel, 
    selectedUbs, 
    selectedBairroName, 
    selectedSchoolName,
    setSelection,
    anoSelecionado, 
    setAnoSelecionado,
    yearsList,
    temporalData, 
    regionalData, 
    schoolMetrics,
    bairroMetrics,
    demographicData,
    darkMode 
  } = useAppStore();
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(2); // Padrão: Escolares (6 a 11 anos)
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isGenderStateOpen, setIsGenderStateOpen] = useState(false);

  // States and refs for Search Bar
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Sincroniza a busca caso o escopo de análise mude globalmente (ex: clicado no mapa)
  useEffect(() => {
    if (analysisLevel === 'ubs') {
      setSearchQuery(selectedUbs || '');
    } else if (analysisLevel === 'bairro') {
      setSearchQuery(selectedBairroName || '');
    } else if (analysisLevel === 'escola') {
      setSearchQuery(selectedSchoolName || '');
    } else {
      setSearchQuery('');
    }
  }, [analysisLevel, selectedUbs, selectedBairroName, selectedSchoolName]);

  // Fecha o menu de sugestões de busca ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Processamento de listas para busca
  const ubsList = useMemo(() => {
    return UNIDADES_SAUDE.filter(u => u.categoria === 'UBS').sort((a, b) => {
      const nameA = a.nome.replace('UBS ', '').replace('USF ', '');
      const nameB = b.nome.replace('UBS ', '').replace('USF ', '');
      return nameA.localeCompare(nameB);
    });
  }, []);

  const uniqueBairrosList = useMemo(() => {
    const bairrosGeoJSON = getVoronoiGeoJSON();
    if (!bairrosGeoJSON || !bairrosGeoJSON.features) return [];
    const setNames = new Set<string>();
    const list: Array<{ nome: string; parentUbs: string }> = [];
    bairrosGeoJSON.features.forEach((feat: any) => {
      const name = feat.properties?.nome_real_bairro;
      const ubs = feat.properties?.nome_bairro;
      if (name && !setNames.has(name)) {
        setNames.add(name);
        list.push({ nome: name, parentUbs: ubs || '' });
      }
    });
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, []);

  const schoolsList = useMemo(() => {
    return ALL_POIS.filter(p => p.categoria === 'Educação').sort((a, b) => a.nome.localeCompare(b.nome));
  }, []);

  const filteredUbs = useMemo(() => {
    return ubsList.filter(u =>
      u.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ubsList, searchQuery]);

  const filteredBairros = useMemo(() => {
    let list = uniqueBairrosList;
    if (searchQuery.trim() === '' && selectedUbs) {
      list = list.filter(b => b.parentUbs === selectedUbs);
    }
    return list.filter(b =>
      b.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniqueBairrosList, selectedUbs, searchQuery]);

  const filteredSchools = useMemo(() => {
    let list = schoolsList;
    if (searchQuery.trim() === '') {
      if (selectedBairroName) {
        list = list.filter(s => s.bairro === selectedBairroName);
      } else if (selectedUbs) {
        list = list.filter(s => s.regiao_ubs === selectedUbs);
      }
    }
    return list.filter(s =>
      s.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [schoolsList, selectedBairroName, selectedUbs, searchQuery]);

  const cleanYear = anoSelecionado.replace('★', '').trim();

  // Encontra os baselines dinâmicos de taxas
  const rates = useMemo(() => {
    const scoped = getScopedNutritionMetrics({
      analysisLevel,
      selectedUbs,
      selectedBairroName,
      selectedSchoolName,
      year: cleanYear,
      temporalData,
      regionalData,
      schoolMetrics,
      bairroMetrics
    });

    return {
      des: Number(scoped.desnutricao.toFixed(2)),
      mag: Number(scoped.magreza.toFixed(2)),
      obs: Number(scoped.obesidade.toFixed(2)),
      sob: Number(scoped.sobrepeso.toFixed(2)),
      eut: Number(scoped.eutrofia.toFixed(2))
    };
  }, [analysisLevel, selectedUbs, selectedBairroName, selectedSchoolName, cleanYear, temporalData, regionalData, schoolMetrics, bairroMetrics]);

  // Calcula os dados demográficos determinísticos
  const demoData = useMemo(() => {
    const focusName = analysisLevel === 'escola' 
      ? selectedSchoolName 
      : analysisLevel === 'bairro' 
        ? selectedBairroName 
        : analysisLevel === 'ubs' 
          ? selectedUbs 
          : 'Geral';
    
    return getDemographicsForUbs(focusName, cleanYear, rates.des, rates.sob, rates.obs, rates.eut, rates.mag);
  }, [analysisLevel, selectedSchoolName, selectedBairroName, selectedUbs, cleanYear, rates]);

  const activeGroup = demoData.ageGroups[activeGroupIndex];

  const genderStates = useMemo(() => [
    { id: 'desnutricao', label: 'Desnutrição', data: activeGroup.desnutricao, color: 'text-blue-550 dark:text-blue-450', fill: '#3b82f6' },
    { id: 'magreza', label: 'Magreza', data: activeGroup.magreza, color: 'text-sky-500', fill: '#38bdf8' },
    { id: 'eutrofia', label: 'Peso Adequado', data: activeGroup.eutrofia, color: 'text-teal-600 dark:text-teal-400', fill: '#0d9488' },
    { id: 'sobrepeso', label: 'Sobrepeso', data: activeGroup.sobrepeso, color: 'text-amber-500', fill: '#f59e0b' },
    { id: 'obesidade', label: 'Obesidade', data: activeGroup.obesidade, color: 'text-rose-500', fill: '#f43f5e' }
  ], [activeGroup]);

  const [genderStateId, setGenderStateId] = useState<string>('eutrofia');

  const selectedStateData = useMemo(() => {
    return genderStates.find(s => s.id === genderStateId) || genderStates[2];
  }, [genderStateId, genderStates]);

  const genderChartData = useMemo(() => {
    return [
      { name: 'Meninos', value: selectedStateData.data.pctMasculino, fill: '#3b82f6' },
      { name: 'Meninas', value: selectedStateData.data.pctFeminino, fill: '#ef4444' }
    ];
  }, [selectedStateData]);

  // Estrutura de dados para o gráfico Recharts da Faixa Etária Ativa
  const chartData = useMemo(() => {
    return [
      { name: 'Desnutrição', value: activeGroup.desnutricao.rate, fill: '#2563eb' },
      { name: 'Magreza', value: activeGroup.magreza.rate, fill: '#38bdf8' },
      { name: 'Peso Adequado', value: activeGroup.eutrofia.rate, fill: '#0d9488' },
      { name: 'Sobrepeso', value: activeGroup.sobrepeso.rate, fill: '#d97706' },
      { name: 'Obesidade', value: activeGroup.obesidade.rate, fill: '#f43f5e' }
    ];
  }, [activeGroup]);

  return (
    <div className="space-y-6">
      
      {/* 1. Dashboard Header (Sem ícones decorativos ou badges de escopo/tags) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-zinc-800/50 pb-5">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider">
            Análise Escolar
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold mt-1">
            Indicadores demográficos, idade média e análise de gênero estruturadas em 4 faixas etárias · Nutri for Schools {anoSelecionado}
          </p>
        </div>

        {/* Barra de Pesquisa e Seletor de Ano Customizado */}
        <div className="flex items-center gap-3">
          {/* Unified Search Box for region, UBS or school */}
          <div ref={searchDropdownRef} className="relative w-72">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                  if (e.target.value === '') {
                    setSelection('municipio', null, null, null);
                  }
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Pesquisar região, UBS ou escola..."
                className="w-full bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-805 rounded-xl pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-805 dark:text-[#f5f5f7] placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-0 focus:border-teal-500 transition-all shadow-sm cursor-text"
              />

              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                    setSelection('municipio', null, null, null);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-550 hover:text-slate-700 dark:hover:text-[#f5f5f7] transition-colors p-0.5 cursor-pointer flex items-center justify-center animate-in fade-in duration-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600" />
                </div>
              )}
            </div>
            
            {/* Search Suggestions Dropdown */}
            {isSearchOpen && (
              <div className="absolute right-0 mt-1.5 w-72 max-h-60 overflow-y-auto bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl z-[1002] scrollbar-thin divide-y divide-slate-100 dark:divide-zinc-900/60 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Option for General reset */}
                <button
                  onClick={() => {
                    setSelection('municipio', null, null, null);
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-[11px] font-black text-teal-655 dark:text-teal-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-teal-700 dark:hover:text-teal-350 transition-colors flex items-center gap-1.5 border-none bg-transparent cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Rio Claro - Geral</span>
                </button>

                {/* Categoria: UBS */}
                {filteredUbs.length > 0 && (
                  <div>
                    <div className="px-3.5 py-1.5 text-[8.5px] font-black text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-955/20 tracking-wider">Unidades de Saúde</div>
                    {filteredUbs.map(u => (
                      <button
                        key={u.nome}
                        onClick={() => {
                          setSelection('ubs', u.nome, null, null);
                          setSearchQuery(u.nome);
                          setIsSearchOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-[11px] font-bold transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2 ${
                          selectedUbs === u.nome && analysisLevel === 'ubs'
                            ? 'bg-teal-50/40 dark:bg-teal-955/10 text-teal-600 dark:text-teal-400'
                            : 'text-slate-655 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
                        }`}
                      >
                        <Hospital className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                        <span className="truncate">{u.nome}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Categoria: Bairros */}
                {filteredBairros.length > 0 && (
                  <div>
                    <div className="px-3.5 py-1.5 text-[8.5px] font-black text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-955/20 tracking-wider">Bairros</div>
                    {filteredBairros.map(b => (
                      <button
                        key={b.nome}
                        onClick={() => {
                          setSelection('bairro', b.parentUbs || null, b.nome, null);
                          setSearchQuery(b.nome);
                          setIsSearchOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-[11px] font-bold transition-colors border-none bg-transparent cursor-pointer flex gap-2 ${
                          selectedBairroName === b.nome
                            ? 'bg-teal-50/40 dark:bg-teal-955/10 text-teal-600 dark:text-teal-400'
                            : 'text-slate-655 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
                        }`}
                      >
                        <Home className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="block font-bold truncate text-slate-800 dark:text-zinc-200 leading-tight">{b.nome}</span>
                          <span className="block text-[8.5px] text-slate-400 dark:text-zinc-500 font-bold uppercase mt-0.5">UBS: {b.parentUbs.replace('UBS ', '').replace('USF ', '')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Categoria: Escolas */}
                {filteredSchools.length > 0 && (
                  <div>
                    <div className="px-3.5 py-1.5 text-[8.5px] font-black text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-955/20 tracking-wider">Escolas</div>
                    {filteredSchools.map(s => (
                      <button
                        key={s.nome}
                        onClick={() => {
                          setSelection('escola', s.regiao_ubs || null, s.bairro || null, s.nome);
                          setSearchQuery(s.nome);
                          setIsSearchOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-[11px] font-bold transition-colors border-none bg-transparent cursor-pointer flex gap-2 ${
                          selectedSchoolName === s.nome
                            ? 'bg-teal-50/40 dark:bg-teal-955/10 text-teal-600 dark:text-teal-400'
                            : 'text-slate-655 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
                        }`}
                      >
                        <School className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="block font-bold text-slate-800 dark:text-zinc-200 leading-tight truncate">{s.nome}</span>
                          <span className="block text-[8.5px] text-slate-455 dark:text-zinc-500 font-bold uppercase mt-0.5">
                            {s.bairro ? `${s.bairro} · ` : ''}UBS: {(s.regiao_ubs || '').replace('UBS ', '').replace('USF ', '')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredUbs.length === 0 && filteredBairros.length === 0 && filteredSchools.length === 0 && (
                  <div className="px-3.5 py-4 text-center text-slate-400 dark:text-zinc-500 text-[11px] italic">
                    Nenhum resultado encontrado para "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setIsYearOpen(!isYearOpen)}
              className="flex items-center gap-2 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-0 rounded-xl px-3.5 py-2 w-28 text-xs font-bold text-slate-800 dark:text-[#f5f5f7] hover:bg-slate-50 dark:hover:bg-zinc-800/60 shadow-sm cursor-pointer"
            >
              <span className="flex-1 text-left">{anoSelecionado}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-550 shrink-0" />
            </button>

            {isYearOpen && (
              <>
                <div className="fixed inset-0 z-[1000]" onClick={() => setIsYearOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-28 max-h-32 overflow-y-auto bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-[1001] scrollbar-thin divide-y divide-slate-100 dark:divide-zinc-900/60 animate-in fade-in slide-in-from-top-2 duration-200">
                  {yearsList.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => {
                        setAnoSelecionado(yr);
                        setIsYearOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-xs font-bold text-left transition-colors border-none bg-transparent cursor-pointer ${
                        anoSelecionado === yr
                          ? 'bg-teal-50/40 dark:bg-teal-955/10 text-teal-600 dark:text-teal-400 font-extrabold'
                          : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-55 dark:hover:bg-zinc-900/40'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top-tier KPI Cards Grid (Average Ages - Clean Visual) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI Desnutrição (Blue) */}
        <KpiCard
          label="Idade Média · Desnutrição"
          value={demoData.globalAvgAgeDes}
          accentColor="text-blue-600 dark:text-blue-400"
          tooltip="Idade média dos indivíduos com quadro clínico de magreza ou desnutrição extrema."
        />

        {/* KPI Magreza (Sky) */}
        <KpiCard
          label="Idade Média · Magreza"
          value={demoData.globalAvgAgeMag}
          accentColor="text-sky-600 dark:text-sky-400"
          tooltip="Idade média dos indivíduos com diagnóstico de magreza nesta região."
        />

        {/* KPI Peso Adequado (Teal) */}
        <KpiCard
          label="Idade Média · Peso Adequado"
          value={demoData.globalAvgAgeEut}
          accentColor="text-teal-600 dark:text-teal-400"
          tooltip="Idade média dos indivíduos com diagnóstico de peso adequado nesta localidade."
        />

        {/* KPI Sobrepeso (Amber) */}
        <KpiCard
          label="Idade Média · Sobrepeso"
          value={demoData.globalAvgAgeSob}
          accentColor="text-amber-600 dark:text-amber-400"
          tooltip="Idade média dos indivíduos com diagnóstico de sobrepeso nesta região."
        />

        {/* KPI Obesidade (Rose) */}
        <KpiCard
          label="Idade Média · Obesidade"
          value={demoData.globalAvgAgeObs}
          accentColor="text-rose-600 dark:text-rose-455"
          tooltip="Idade média dos indivíduos com diagnóstico de obesidade clínica."
        />
      </div>

      {/* 3. Seletor de Faixas Etárias (Interactive Rounded Tabs) */}
      <div className="space-y-3">
        <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest block leading-none">
          Faixa Etária em Foco:
        </span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-zinc-900/30 border border-slate-200/50 dark:border-zinc-800/80 p-1.5 rounded-xl shadow-inner">
          {demoData.ageGroups.map((group, index) => {
            const isActive = activeGroupIndex === index;
            return (
              <button
                key={group.faixa}
                onClick={() => setActiveGroupIndex(index)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all border duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 dark:bg-teal-700 border-teal-700/30 text-white shadow-sm'
                    : 'bg-white dark:bg-[#121316] border-slate-200/40 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
                }`}
              >
                <span className="text-[11px] font-black">{group.label}</span>
                <span className={`text-[9.5px] mt-1 font-bold ${isActive ? 'text-teal-100' : 'text-slate-400 dark:text-zinc-550'}`}>
                  {group.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Column Analytics Dashboard */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Prevalence & Graphical Chart Analysis */}
        <div className="space-y-4 border border-slate-200/50 dark:border-zinc-800/80 p-5 rounded-xl bg-slate-50/20 dark:bg-zinc-900/5 transition-colors">
          <div className="border-b border-slate-200/50 dark:border-zinc-800/70 pb-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider flex items-center gap-1">
              <span>Distribuição e Prevalência Geral</span>
              <div className="relative group/tooltip inline-block cursor-help ml-1 text-slate-400 dark:text-zinc-550 hover:text-slate-655 dark:hover:text-[#f5f5f7] normal-case tracking-normal">
                <Info className="w-3.5 h-3.5" />
                <div className="pointer-events-none absolute bottom-full left-0 sm:left-auto sm:right-0 mb-2 w-52 bg-slate-900 dark:bg-zinc-800 text-white dark:text-[#f5f5f7] text-[10px] p-2.5 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-[1002] font-semibold leading-relaxed text-center border dark:border-zinc-700">
                  Prevalência registrada de cada indicador nutricional no ano selecionado.
                </div>
              </div>
            </h3>
          </div>

          <div className="flex items-center justify-center min-h-[220px] w-full">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)'} />
                <XAxis type="number" unit="%" tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 9, fontWeight: 'bold' }} stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'} />
                <YAxis dataKey="name" type="category" width={115} tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 11, fontWeight: 'bold' }} stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'} />
                <RechartsTooltip content={<CustomChartTooltip />} cursor={{ fill: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Analysis Grid (Unified Donut Chart - Side-by-Side) */}
        <div className="space-y-4 border border-slate-200/50 dark:border-zinc-800/80 p-5 rounded-xl bg-slate-50/20 dark:bg-zinc-900/5 transition-colors flex flex-col justify-between animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800/50 pb-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider flex items-center gap-1">
              <span>Análise por Gênero</span>
              <div className="relative group/tooltip inline-block cursor-help ml-1 text-slate-400 dark:text-zinc-550 hover:text-slate-655 dark:hover:text-[#f5f5f7] normal-case tracking-normal">
                <Info className="w-3.5 h-3.5" />
                <div className="pointer-events-none absolute bottom-full left-0 sm:left-auto sm:right-0 mb-2 w-52 bg-slate-900 dark:bg-zinc-800 text-white dark:text-[#f5f5f7] text-[10px] p-2.5 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-[1002] font-semibold leading-relaxed text-center border dark:border-zinc-700">
                  Proporção de distribuição entre meninos (masculino) e meninas (feminino) para o indicador selecionado.
                </div>
              </div>
            </h3>

            {/* Dropdown Selector for Nutritional Indicator (Risk Map style) */}
            <div className="relative">
              <button
                onClick={() => setIsGenderStateOpen(!isGenderStateOpen)}
                className="flex items-center gap-2 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-0 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-[#f5f5f7] hover:bg-slate-50 dark:hover:bg-zinc-800/60 shadow-sm cursor-pointer"
              >
                <span className={`w-2 h-2 rounded-full ${
                  genderStateId === 'desnutricao' ? 'bg-blue-500' :
                  genderStateId === 'magreza' ? 'bg-sky-500' :
                  genderStateId === 'eutrofia' ? 'bg-emerald-500' :
                  genderStateId === 'sobrepeso' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span>{selectedStateData.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-550 shrink-0" />
              </button>

              {isGenderStateOpen && (
                <>
                  <div className="fixed inset-0 z-[1000]" onClick={() => setIsGenderStateOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-[1001] overflow-hidden divide-y divide-slate-100 dark:divide-zinc-900/60 animate-in fade-in slide-in-from-top-2 duration-200">
                    {genderStates.map((state) => (
                      <button
                        key={state.id}
                        onClick={() => {
                          setGenderStateId(state.id);
                          setIsGenderStateOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-left transition-colors border-none bg-transparent cursor-pointer ${
                          genderStateId === state.id
                            ? 'bg-teal-50/40 dark:bg-teal-955/10 text-teal-600 dark:text-teal-400 font-extrabold'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          state.id === 'desnutricao' ? 'bg-blue-500' :
                          state.id === 'magreza' ? 'bg-sky-500' :
                          state.id === 'eutrofia' ? 'bg-emerald-500' :
                          state.id === 'sobrepeso' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className="flex-1">{state.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Compact Donut chart and details (Alineado a la derecha) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4 bg-white dark:bg-slate-950 border border-slate-200/40 dark:border-zinc-900/30 p-6 rounded-2xl">
            {/* Enlarged Donut Chart */}
            <div className="relative w-56 h-56 flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {genderChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 dark:bg-zinc-850 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-lg z-[1002]">
                          {data.name}: {data.value}%
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label (Enlarged) */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 dark:text-zinc-550 leading-none">
                  Proporção
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-zinc-200 mt-0.5 leading-none">
                  Gênero
                </span>
              </div>
            </div>

            {/* Legends & Info (Azul, Vermelho e Prevalência Geral - Ao Lado do Gráfico) */}
            <div className="flex flex-col gap-3 w-full sm:w-56 shrink-0">
              {/* Meninos Stat */}
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-55/50 dark:bg-zinc-900/40 rounded-xl border border-slate-200/40 dark:border-zinc-800/60 w-full">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Mars className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-550 dark:text-zinc-400 uppercase tracking-widest leading-none mb-1">Meninos</span>
                  <span className="text-base font-mono font-black text-blue-600 dark:text-blue-400 leading-none">
                    {selectedStateData.data.pctMasculino}%
                  </span>
                </div>
              </div>

              {/* Meninas Stat */}
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-55/50 dark:bg-zinc-900/40 rounded-xl border border-slate-200/40 dark:border-zinc-800/60 w-full">
                <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-955/20 flex items-center justify-center text-red-600 dark:text-red-500 shrink-0">
                  <Venus className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-550 dark:text-zinc-400 uppercase tracking-widest leading-none mb-1">Meninas</span>
                  <span className="text-base font-mono font-black text-red-600 dark:text-red-555 leading-none">
                    {selectedStateData.data.pctFeminino}%
                  </span>
                </div>
              </div>

              {/* Prevalência Geral Stat */}
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-55/50 dark:bg-zinc-900/40 rounded-xl border border-slate-200/40 dark:border-zinc-800/60 w-full">
                <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-955/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                  <span className="text-xs font-black">P</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-550 dark:text-zinc-400 uppercase tracking-widest leading-none mb-1">Prevalência Geral</span>
                  <span className="text-base font-mono font-black text-teal-600 dark:text-teal-400 leading-none">
                    {selectedStateData.data.rate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Secondary KPI Card inline helper ───────────────────────────────────────────
function KpiCard({
  label, value, accentColor, tooltip
}: {
  label: string; value: string | number;
  accentColor: string; tooltip?: string;
}) {
  return (
    <div className="relative rounded-xl p-5 border border-slate-200/50 dark:border-zinc-800/50 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
      <div className="text-[11px] text-slate-550 dark:text-zinc-400 uppercase tracking-wider mb-2.5 font-extrabold flex items-center justify-between relative z-10">
        <span>{label}</span>
        {tooltip && (
          <div className="relative group/tooltip inline-block cursor-help ml-1 text-slate-400 dark:text-zinc-550 hover:text-slate-655 dark:hover:text-[#f5f5f7]">
            <Info className="w-3.5 h-3.5" />
            <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-48 bg-slate-900 dark:bg-zinc-800 text-white dark:text-[#f5f5f7] text-[10px] p-2.5 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-[1002] font-semibold normal-case tracking-normal leading-relaxed text-center border dark:border-zinc-700">
              {tooltip}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1 relative z-10">
        <h3 className={`text-3xl font-black tracking-tight ${accentColor}`}>{value}</h3>
        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550">anos</span>
      </div>
    </div>
  );
}
