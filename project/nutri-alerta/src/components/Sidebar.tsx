"use client";
import React from 'react';
import { Activity, TrendingUp, Users, Stethoscope, Calendar, Map, ChevronLeft, Moon, Sun, ShieldCheck, Globe, Bot } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { UNIDADES_SAUDE } from '@/lib/mockData';



export default function Sidebar() {
  const { 
    viewMode, setViewMode,
    anoSelecionado, setAnoSelecionado, 
    indicador, setIndicador, 
    selectedBairro, setSelectedBairro, 
    yearsList,
    temporalData,
    regionalData,
    darkMode, setDarkMode,
    sidebarCollapsed, setSidebarCollapsed
  } = useAppStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Sincroniza a busca caso a UBS seja clicada diretamente no mapa
  React.useEffect(() => {
    setSearchQuery(selectedBairro || '');
  }, [selectedBairro]);

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

  const ubsList = UNIDADES_SAUDE.filter(u => u.categoria === 'UBS').sort((a, b) => {
    const nameA = a.nome.replace('UBS ', '').replace('USF ', '');
    const nameB = b.nome.replace('UBS ', '').replace('USF ', '');
    return nameA.localeCompare(nameB);
  });
  const filteredUbs = ubsList.filter(u =>
    u.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedYearData = temporalData.find(d => d.ano === anoSelecionado);
  const avgObs = selectedYearData ? `${selectedYearData.obesidade.toFixed(2)}%` : '...';
  const avgDes = selectedYearData ? `${selectedYearData.desnutricao.toFixed(2)}%` : '...';
  const avgSob = selectedYearData && typeof selectedYearData.sobrepeso === 'number' ? `${selectedYearData.sobrepeso.toFixed(2)}%` : '...';
  const avgEut = selectedYearData && typeof selectedYearData.eutrofia === 'number' ? `${selectedYearData.eutrofia.toFixed(2)}%` : '...';

  const cleanYear = anoSelecionado.replace(' ★', '');
  const currentYearRegions = regionalData && regionalData[cleanYear]
    ? Object.values(regionalData[cleanYear])
    : [];
  const sumAvaliados = currentYearRegions.reduce((sum: number, reg: any) => sum + (reg.total_avaliados ?? 0), 0);
  const isPrevisao = anoSelecionado.includes('★');
  const evaluatedStr = isPrevisao 
    ? 'Projetado' 
    : (sumAvaliados > 0 
        ? (sumAvaliados >= 1000 ? `${(sumAvaliados / 1000).toFixed(1)}K` : String(sumAvaliados))
        : (anoSelecionado === '2025' ? '45.2K' : anoSelecionado === '2024' ? '41.1K' : '38.5K'));

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

            {/* Filtro Geográfico */}
            <div ref={dropdownRef} className="relative z-[100]">
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 leading-none">
                <Map className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" /> Região em Foco
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    if (e.target.value === '') {
                      setSelectedBairro(null);
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Pesquisar UBS..."
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-semibold text-slate-700 dark:text-[#f5f5f7] placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-text hover:bg-slate-100 dark:hover:bg-zinc-900"
                />
                {selectedBairro ? (
                  <button
                    onClick={() => {
                      setSelectedBairro(null);
                      setSearchQuery('');
                      setIsDropdownOpen(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-[#f5f5f7] transition-colors text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                ) : (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-zinc-500 pointer-events-none">
                    🔍
                  </div>
                )}
              </div>
              
              {/* Dropdown Suggestions */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-white dark:bg-[#0c0d10] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg z-[500] scrollbar-thin">
                  {filteredUbs.length > 0 ? (
                    filteredUbs.map(u => (
                      <button
                        key={u.nome}
                        onClick={() => {
                          setSelectedBairro(u.nome);
                          setSearchQuery(u.nome);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-[11px] font-semibold transition-colors border-b border-slate-100 dark:border-zinc-900/60 last:border-b-0 ${
                          selectedBairro === u.nome
                            ? 'bg-teal-50/55 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
                        }`}
                      >
                        {u.nome}
                      </button>
                    ))
                  ) : (
                    <div className="px-3.5 py-2.5 text-[11px] text-slate-400 dark:text-zinc-500 italic text-center">
                      Nenhuma UBS encontrada
                    </div>
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
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 block leading-none">
                Resumo · Rio Claro {anoSelecionado}
              </label>
              <div className="space-y-2">
                <MetricRow icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />} label="Peso adequado médio" value={avgEut} color="text-emerald-600 dark:text-emerald-400" />
                <MetricRow icon={<TrendingUp className="w-3.5 h-3.5 text-red-500" />} label="Obesidade média" value={avgObs} color="text-red-600 dark:text-red-400" />
                <MetricRow icon={<TrendingUp className="w-3.5 h-3.5 text-amber-500" />} label="Sobrepeso médio" value={avgSob} color="text-amber-600 dark:text-amber-400" />
                <MetricRow icon={<Activity className="w-3.5 h-3.5 text-blue-500" />}   label="Desnutrição média" value={avgDes}  color="text-blue-600 dark:text-blue-400" />
                <MetricRow icon={<Users className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-550" />}    label="Avaliados" value={evaluatedStr} color="text-slate-700 dark:text-zinc-300" />
                <MetricRow icon={<Stethoscope className="w-3.5 h-3.5 text-teal-600" />} label="UBS monitoradas" value="18" color="text-teal-600 dark:text-teal-400" />
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
            Fonte: SISVAN/CNES · Status: Dados reais + ML (2026–2027)
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
