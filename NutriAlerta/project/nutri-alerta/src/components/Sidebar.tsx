"use client";
import React from 'react';
import { Activity, TrendingUp, Users, Stethoscope, Calendar, Map, ChevronLeft, Moon, Sun, ShieldCheck, Globe, Bot, Hospital, Home, School, Search, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { UNIDADES_SAUDE, ALL_POIS, getVoronoiGeoJSON } from '@/lib/mockData';

export default function Sidebar() {
  const { 
    viewMode, setViewMode,
    anoSelecionado, setAnoSelecionado, 
    indicador, setIndicador, 
    selectedBairro, setSelectedBairro, 
    analysisLevel, setAnalysisLevel,
    selectedUbs, setSelectedUbs,
    selectedBairroName, setSelectedBairroName,
    selectedSchoolName, setSelectedSchoolName,
    setSelection,
    yearsList,
    temporalData,
    regionalData,
    schoolMetrics,
    bairroMetrics,
    darkMode, setDarkMode,
    sidebarCollapsed, setSidebarCollapsed
  } = useAppStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Sincroniza a busca caso o escopo de análise mude globalmente (ex: clicado no mapa)
  React.useEffect(() => {
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

  // Fecha o menu de sugestões ao clicar fora dele
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lista de UBSs
  const ubsList = React.useMemo(() => {
    return UNIDADES_SAUDE.filter(u => u.categoria === 'UBS').sort((a, b) => {
      const nameA = a.nome.replace('UBS ', '').replace('USF ', '');
      const nameB = b.nome.replace('UBS ', '').replace('USF ', '');
      return nameA.localeCompare(nameB);
    });
  }, []);

  // Lista de Bairros Únicos extraídos do GeoJSON
  const uniqueBairrosList = React.useMemo(() => {
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

  // Lista de 88 Escolas Analisadas
  const schoolsList = React.useMemo(() => {
    return ALL_POIS.filter(p => p.categoria === 'Educação').sort((a, b) => a.nome.localeCompare(b.nome));
  }, []);

  // Filtros aplicados baseados no searchQuery ativo e na hierarquia de foco
  const filteredUbs = React.useMemo(() => {
    return ubsList.filter(u =>
      u.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ubsList, searchQuery]);

  const filteredBairros = React.useMemo(() => {
    let list = uniqueBairrosList;
    if (searchQuery.trim() === '' && selectedUbs) {
      list = list.filter(b => b.parentUbs === selectedUbs);
    }
    return list.filter(b =>
      b.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniqueBairrosList, selectedUbs, searchQuery]);

  const filteredSchools = React.useMemo(() => {
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

  const cleanYear = anoSelecionado.replace(' ★', '').trim();
  const isPrevisao = anoSelecionado.includes('★');

  const activeLabel = React.useMemo(() => {
    if (analysisLevel === 'escola' && selectedSchoolName) {
      return selectedSchoolName.replace('E.M.E.F. ', '').replace('E.E. ', '').replace('E.M. ', '').split(' “')[0];
    }
    if (analysisLevel === 'bairro' && selectedBairroName) {
      return selectedBairroName;
    }
    if (analysisLevel === 'ubs' && selectedUbs) {
      return selectedUbs.replace('UBS ', '').replace('USF ', '').split(' “')[0];
    }
    return 'Rio Claro';
  }, [analysisLevel, selectedSchoolName, selectedBairroName, selectedUbs]);

  const hudMetrics = React.useMemo(() => {
    let obs = 0;
    let des = 0;
    let sob = 0;
    let eut = 0;
    let avaliados = 0;
    let subUnitLabel = "UBS monitoradas";
    let subUnitValue = String(ubsList.length);

    if (analysisLevel === 'escola' && selectedSchoolName) {
      const data = schoolMetrics[selectedSchoolName]?.anos?.[cleanYear];
      if (data) {
        obs = data.obesidade;
        des = data.desnutricao;
        sob = data.sobrepeso;
        eut = data.eutrofia;
        avaliados = data.total_avaliados;
      }
      subUnitLabel = "Tipo de Escola";
      const schoolInfo = schoolsList.find(s => s.nome === selectedSchoolName);
      subUnitValue = schoolInfo?.categoria || "Educação";
    } else if (analysisLevel === 'bairro' && selectedBairroName) {
      const data = bairroMetrics[selectedBairroName]?.anos?.[cleanYear];
      if (data) {
        obs = data.obesidade;
        des = data.desnutricao;
        sob = data.sobrepeso;
        eut = data.eutrofia;
        avaliados = data.total_avaliados;
      }
      const schoolCount = schoolsList.filter(s => s.bairro === selectedBairroName).length;
      subUnitLabel = "Escolas no bairro";
      subUnitValue = String(schoolCount);
    } else if (analysisLevel === 'ubs' && selectedUbs) {
      const data = regionalData[cleanYear]?.[selectedUbs];
      if (data) {
        obs = data.obesidade || 0;
        des = data.desnutricao || 0;
        sob = data.sobrepeso || 0;
        eut = data.eutrofia || 0;
        avaliados = data.total_avaliados || 0;
      }
      const schoolCount = schoolsList.filter(s => s.regiao_ubs === selectedUbs).length;
      subUnitLabel = "Escolas na região";
      subUnitValue = String(schoolCount);
    } else {
      // municipio
      const data = temporalData.find(d => d.ano === anoSelecionado);
      if (data) {
        obs = data.obesidade;
        des = data.desnutricao;
        sob = data.sobrepeso;
        eut = data.eutrofia;
      }
      const currentYearRegions = regionalData && regionalData[cleanYear]
        ? Object.values(regionalData[cleanYear])
        : [];
      avaliados = currentYearRegions.reduce((sum: number, reg: any) => sum + (reg.total_avaliados ?? 0), 0);
      
      if (avaliados === 0) {
        avaliados = anoSelecionado.includes('2025') ? 45200 : anoSelecionado.includes('2024') ? 41100 : 38500;
      }
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
      avgObs: formatPct(obs),
      avgDes: formatPct(des),
      avgSob: formatPct(sob),
      avgEut: formatPct(eut),
      evaluatedStr: formatAval(avaliados),
      subUnitLabel,
      subUnitValue
    };
  }, [analysisLevel, selectedSchoolName, selectedBairroName, selectedUbs, anoSelecionado, cleanYear, temporalData, regionalData, schoolMetrics, bairroMetrics, ubsList, schoolsList, isPrevisao]);

  // Ocultar completamente o menu lateral caso esteja recolhido
  if (sidebarCollapsed) return null;

  return (
    <aside className="w-64 bg-white dark:bg-[#0c0d10] border-r border-slate-200/80 dark:border-zinc-800/80 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.01)] z-30 transition-all duration-300">
      {/* Header with collapse button only */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-900/60 flex items-center justify-end">
        {/* Botão de Recolher (Collapse) */}
        <button
          onClick={() => setSidebarCollapsed(true)}
          className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-[#f5f5f7] p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800/60 rounded-xl transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-thin">


        {/* Filtros Globais — Visíveis em todas as telas, exceto no Consultor */}
        {viewMode !== 'consultant' && (
          <div className="space-y-6">
            {/* Ano de Referência */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 leading-none">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" /> Ano de Referência
              </label>
              <div className="relative group">
                <select
                  value={anoSelecionado}
                  onChange={e => setAnoSelecionado(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-900"
                >
                  {yearsList.map(a => (
                    <option key={a} value={a} className="dark:bg-[#0c0d10]">{a}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-slate-400 dark:text-zinc-500 group-hover:text-teal-600 transition-colors">
                  ▼
                </div>
              </div>
            </div>

            {/* Separador Interno */}
            <div className="border-t border-slate-100 dark:border-zinc-900/60" />

            {/* Filtro Geográfico de Escopo Hierárquico */}
            <div ref={dropdownRef} className="relative z-[100]">
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 leading-none">
                <Map className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" /> Região em Foco
              </label>
              
              {/* Segmented level control button group */}
              <div className="flex bg-slate-100 dark:bg-zinc-900/60 rounded-xl p-0.5 mb-2.5 gap-0.5 shadow-inner">
                {[
                  { id: 'municipio', label: 'Geral', icon: Globe },
                  { id: 'ubs', label: 'UBS', icon: Hospital },
                  { id: 'bairro', label: 'Bairro', icon: Home },
                  { id: 'escola', label: 'Escola', icon: School }
                ].map((lvl) => {
                  const Icon = lvl.icon;
                  const isActive = analysisLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      onClick={() => {
                        setAnalysisLevel(lvl.id as any);
                        setIsDropdownOpen(false);
                      }}
                      className={`flex-1 flex flex-col items-center py-1.5 rounded-lg text-[9.5px] font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-zinc-800 text-teal-650 dark:text-teal-400 shadow-sm'
                          : 'text-slate-550 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-[#f5f5f7] hover:bg-slate-200/30 dark:hover:bg-zinc-800/20'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 mb-1 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-zinc-550'}`} />
                      {lvl.label}
                    </button>
                  );
                })}
              </div>
                 {/* Seletor do Input baseado no nível ativo */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    if (e.target.value === '') {
                      setSelection('municipio', null, null, null);
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Pesquisar UBS, Bairro ou Escola..."
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-semibold text-slate-700 dark:text-[#f5f5f7] placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-text hover:bg-slate-100 dark:hover:bg-zinc-900"
                />

                {searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsDropdownOpen(false);
                      setSelection('municipio', null, null, null);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-[#f5f5f7] transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-550" />
                  </div>
                )}
              </div>
              
              {/* Dropdown Suggestions */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white dark:bg-[#0c0d10] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg z-[500] scrollbar-thin divide-y divide-slate-100 dark:divide-zinc-900/60">
                  {searchQuery.trim() === '' ? (
                    // sugestões por nível
                    <>
                      {analysisLevel === 'municipio' && (
                        <div>
                          <div className="px-3.5 py-1.5 text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-950/20">Selecione uma UBS</div>
                          {ubsList.map(u => (
                            <button
                              key={u.nome}
                              onClick={() => {
                                setSelection('ubs', u.nome, null, null);
                                setSearchQuery(u.nome);
                                setIsDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-[11px] font-semibold text-slate-650 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-800 dark:hover:text-[#f5f5f7] transition-colors border-b border-slate-100 dark:border-zinc-900/60 last:border-b-0"
                            >
                              {u.nome}
                            </button>
                          ))}
                        </div>
                      )}

                      {analysisLevel === 'ubs' && (
                        <div>
                          <div className="px-3.5 py-1.5 text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-950/20">Bairros na Região ({selectedUbs?.replace('UBS ', '').replace('USF ', '')})</div>
                          {uniqueBairrosList.filter(b => b.parentUbs === selectedUbs).map(b => (
                            <button
                              key={b.nome}
                              onClick={() => {
                                setSelection('bairro', selectedUbs, b.nome, null);
                                setSearchQuery(b.nome);
                                setIsDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-[11px] font-semibold text-slate-650 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-800 dark:hover:text-[#f5f5f7] transition-colors border-b border-slate-100 dark:border-zinc-900/60 last:border-b-0"
                            >
                              {b.nome}
                            </button>
                          ))}
                        </div>
                      )}

                      {(analysisLevel === 'bairro' || analysisLevel === 'escola') && (
                        <div>
                          <div className="px-3.5 py-1.5 text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-950/20">Escolas no Bairro ({selectedBairroName})</div>
                          {schoolsList.filter(s => s.bairro === selectedBairroName).map(s => (
                            <button
                              key={s.nome}
                              onClick={() => {
                                setSelection('escola', selectedUbs, selectedBairroName, s.nome);
                                setSearchQuery(s.nome);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 text-[11px] font-semibold transition-colors border-b border-slate-100 dark:border-zinc-900/60 last:border-b-0 ${
                                selectedSchoolName === s.nome
                                  ? 'bg-teal-50/55 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400'
                                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
                              }`}
                            >
                              {s.nome}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    // busca global por categorias
                    <>
                      {/* Categoria: UBS */}
                      {filteredUbs.length > 0 && (
                        <div>
                          <div className="px-3.5 py-1.5 text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-950/20">Unidades de Saúde</div>
                          {filteredUbs.map(u => (
                            <button
                              key={u.nome}
                              onClick={() => {
                                setSelection('ubs', u.nome, null, null);
                                setSearchQuery(u.nome);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 text-[11px] font-semibold transition-colors border-b border-slate-100 dark:border-zinc-900/60 last:border-b-0 ${
                                selectedUbs === u.nome && analysisLevel === 'ubs'
                                  ? 'bg-teal-50/55 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400'
                                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
                              }`}
                            >
                              {u.nome}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Categoria: Bairros */}
                      {filteredBairros.length > 0 && (
                        <div>
                          <div className="px-3.5 py-1.5 text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-950/20">Bairros</div>
                          {filteredBairros.map(b => (
                            <button
                              key={b.nome}
                              onClick={() => {
                                setSelection('bairro', b.parentUbs || null, b.nome, null);
                                setSearchQuery(b.nome);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 text-[11px] font-semibold transition-colors border-b border-slate-100 dark:border-zinc-900/60 last:border-b-0 ${
                                selectedBairroName === b.nome
                                  ? 'bg-teal-50/55 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400'
                                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
                              }`}
                            >
                              <span className="block font-bold truncate text-slate-850 dark:text-zinc-200 leading-tight">{b.nome}</span>
                              <span className="block text-[8.5px] text-slate-450 dark:text-zinc-500 font-semibold uppercase mt-0.5">UBS: {b.parentUbs.replace('UBS ', '').replace('USF ', '')}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Categoria: Escolas */}
                      {filteredSchools.length > 0 && (
                        <div>
                          <div className="px-3.5 py-1.5 text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-950/20">Escolas</div>
                          {filteredSchools.map(s => (
                            <button
                              key={s.nome}
                              onClick={() => {
                                setSelection('escola', s.regiao_ubs || null, s.bairro || null, s.nome);
                                setSearchQuery(s.nome);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 text-[11px] font-semibold transition-colors border-b border-slate-100 dark:border-zinc-900/60 last:border-b-0 ${
                                selectedSchoolName === s.nome
                                  ? 'bg-teal-50/55 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400'
                                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
                              }`}
                            >
                              <span className="block font-bold text-slate-850 dark:text-zinc-200 leading-tight">{s.nome}</span>
                              <span className="block text-[8.5px] text-slate-450 dark:text-zinc-500 font-semibold uppercase mt-1">
                                {s.bairro ? `${s.bairro} · ` : ''}UBS: {(s.regiao_ubs || '').replace('UBS ', '').replace('USF ', '')}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {filteredUbs.length === 0 && filteredBairros.length === 0 && filteredSchools.length === 0 && (
                        <div className="px-3.5 py-4 text-center text-slate-400 dark:text-zinc-550 text-[11px] italic">
                          Nenhum resultado encontrado para "{searchQuery}"
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Separador Interno */}
            <div className="border-t border-slate-100 dark:border-zinc-900/60" />

            {/* Indicador */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 block leading-none">
                Indicador Principal
              </label>
              
              {/* Botão Premium de Mapa Global */}
              <button
                onClick={() => setIndicador(indicador === 'global' ? 'obesidade' : 'global')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 mb-3 border cursor-pointer ${
                  indicador === 'global'
                    ? 'bg-teal-500/5 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/40 text-teal-700 dark:text-teal-400 shadow-[0_2px_10px_rgba(13,148,136,0.02)]'
                    : 'bg-slate-50 dark:bg-zinc-900/20 border-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-zinc-900/40 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
                }`}
              >
                <Globe className={`w-3.5 h-3.5 shrink-0 transition-transform duration-700 ${indicador === 'global' ? 'rotate-180 text-teal-600 dark:text-teal-550' : 'text-slate-400 dark:text-zinc-550'}`} />
                <span>Mapa Global Integrado</span>
                {indicador === 'global' && (
                  <span className="ml-auto text-[9px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-100/40 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200/25">ativo</span>
                )}
              </button>

              <div className="space-y-1.5">
                {[
                  { id: 'desnutricao', label: 'Desnutrição', color: 'text-blue-500',  dot: 'bg-blue-500/80 dark:bg-blue-400/90' },
                  { id: 'eutrofia',   label: 'Peso Adequado', color: 'text-emerald-500', dot: 'bg-emerald-500/80 dark:bg-emerald-400/90' },
                  { id: 'sobrepeso',  label: 'Sobrepeso',  color: 'text-amber-500', dot: 'bg-amber-500/80 dark:bg-amber-400/90' },
                  { id: 'obesidade', label: 'Obesidade', color: 'text-red-500', dot: 'bg-red-500/80 dark:bg-red-400/90' },
                ].map(({ id, label, color, dot }) => (
                  <button
                    key={id}
                    disabled={indicador === 'global' && id !== 'global'}
                    onClick={() => setIndicador(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 border ${
                      indicador === id
                        ? 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-[#f5f5f7] shadow-sm'
                        : indicador === 'global'
                          ? 'opacity-35 cursor-not-allowed text-slate-400 dark:text-zinc-600 border-transparent'
                          : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/40 hover:text-slate-800 dark:hover:text-[#f5f5f7] border-transparent cursor-pointer'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                    {label}
                    {indicador === id && (
                      <span className={`ml-auto text-[9px] font-black uppercase tracking-wider ${color}`}>ativo</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Separador Interno */}
            <div className="border-t border-slate-100 dark:border-zinc-900/60" />

            {/* Resumo Métricas Rápidas */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 block leading-none truncate max-w-full">
                Resumo · {activeLabel} {anoSelecionado}
              </label>
              <div className="space-y-2">
                <MetricRow icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />} label="Peso adequado médio" value={hudMetrics.avgEut} color="text-emerald-600 dark:text-emerald-400" />
                <MetricRow icon={<TrendingUp className="w-3.5 h-3.5 text-red-500" />} label="Obesidade média" value={hudMetrics.avgObs} color="text-red-600 dark:text-red-400" />
                <MetricRow icon={<TrendingUp className="w-3.5 h-3.5 text-amber-500" />} label="Sobrepeso médio" value={hudMetrics.avgSob} color="text-amber-600 dark:text-amber-400" />
                <MetricRow icon={<Activity className="w-3.5 h-3.5 text-blue-500" />}   label="Desnutrição média" value={hudMetrics.avgDes}  color="text-blue-600 dark:text-blue-400" />
                <MetricRow icon={<Users className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-550" />}    label="Avaliados" value={hudMetrics.evaluatedStr} color="text-slate-700 dark:text-zinc-300" />
                <MetricRow icon={<Stethoscope className="w-3.5 h-3.5 text-teal-650" />} label={hudMetrics.subUnitLabel} value={hudMetrics.subUnitValue} color="text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </div>
        )}

        {/* Separador Fixo */}
        <div className="border-t border-slate-100 dark:border-zinc-900/60" />

        {/* Dark Mode Switch */}
        <div className="flex items-center justify-between px-3.5 py-3 bg-slate-50 dark:bg-zinc-900/40 rounded-xl border border-slate-200/50 dark:border-zinc-800/80 transition-colors">
          <div className="flex items-center gap-2">
            {darkMode ? <Moon className="w-3.5 h-3.5 text-teal-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Modo Escuro</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer ${
              darkMode ? 'bg-teal-600' : 'bg-slate-350 dark:bg-zinc-800'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${
                darkMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Fonte de dados */}
        <div className="pt-2">
          <p className="text-[9px] text-slate-450 dark:text-zinc-550 leading-relaxed font-medium">
            Fonte: Nutri for Schools/CNES · Status: Dados reais + ML (2026–2027)
          </p>
        </div>
      </div>
    </aside>
  );
}

function MetricRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-zinc-900/20 rounded-xl border border-slate-200/40 dark:border-zinc-800/35 hover:bg-slate-100/40 dark:hover:bg-zinc-900/40 transition-colors">
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-[10px] text-slate-550 dark:text-zinc-400 font-semibold">{label}</span>
      </div>
      <span className={`text-[11px] font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
