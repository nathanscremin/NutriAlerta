"use client";
import React from 'react';
import { Activity, TrendingUp, Users, Stethoscope, Calendar, Map, Layers, ChevronLeft, Moon, Sun } from 'lucide-react';
import { useAppStore, PoiType } from '@/store/useAppStore';
import { UNIDADES_SAUDE } from '@/lib/mockData';

const POI_CATEGORIES: { id: PoiType; label: string; color: string }[] = [
  { id: 'UBS', label: 'Saúde (UBS/UPA)', color: 'bg-red-500' },
  { id: 'Educação', label: 'Educação', color: 'bg-blue-500' },
  { id: 'Esporte e Lazer', label: 'Esporte & Lazer', color: 'bg-green-500' },
  { id: 'Alimentação - Restaurante/Fast-food', label: 'Restaurantes/Fast-Food', color: 'bg-orange-500' },
  { id: 'Alimentação - Mercado', label: 'Mercados', color: 'bg-purple-500' },
];

export default function Sidebar() {
  const { 
    anoSelecionado, setAnoSelecionado, 
    indicador, setIndicador, 
    selectedBairro, setSelectedBairro, 
    activePoiTypes, setActivePoiTypes,
    yearsList,
    temporalData,
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

  const togglePoi = (poi: PoiType) => {
    if (poi === 'UBS') return;
    if (activePoiTypes.includes(poi)) {
      setActivePoiTypes(activePoiTypes.filter(p => p !== poi));
    } else {
      setActivePoiTypes([...activePoiTypes, poi]);
    }
  };

  const selectedYearData = temporalData.find(d => d.ano === anoSelecionado);
  const avgObs = selectedYearData ? `${selectedYearData.obesidade.toFixed(2)}%` : '...';
  const avgDes = selectedYearData ? `${selectedYearData.desnutricao.toFixed(2)}%` : '...';

  // Ocultar completamente o menu lateral caso esteja recolhido
  if (sidebarCollapsed) return null;

  return (
    <aside className="w-64 bg-white dark:bg-[#1c1c1e] border-r border-slate-200 dark:border-[#2c2c2e] flex flex-col shadow-sm z-10 transition-colors duration-300">
      {/* Header with collapse button only */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-[#2c2c2e] flex items-center justify-end">
        {/* Botão de Recolher (Collapse) */}
        <button
          onClick={() => setSidebarCollapsed(true)}
          className="text-slate-400 hover:text-slate-650 dark:text-zinc-500 dark:hover:text-[#f5f5f7] p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800/60 rounded-xl transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-y-auto scrollbar-thin">

        {/* Ano de Referência */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-slate-400 dark:text-zinc-500" /> Ano de Referência
          </label>
          <div className="relative group">
            <select
              value={anoSelecionado}
              onChange={e => setAnoSelecionado(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-[#2c2c2e] rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              {yearsList.map(a => (
                <option key={a} value={a} className="dark:bg-[#1c1c1e]">{a}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-zinc-500 group-hover:text-teal-600 transition-colors">
              ▼
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-slate-100 dark:border-[#2c2c2e]" />

        {/* Filtro Geográfico */}
        <div ref={dropdownRef} className="relative z-[100]">
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Map className="w-3 h-3 text-slate-400 dark:text-zinc-500" /> Região em Foco
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
              className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-[#2c2c2e] rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 dark:text-[#f5f5f7] placeholder-slate-400 dark:placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-text hover:bg-slate-100 dark:hover:bg-zinc-800"
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
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-550 pointer-events-none text-[10px]">
                🔍
              </div>
            )}
          </div>
          
          {/* Dropdown Suggestions */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-xl shadow-lg z-[500] scrollbar-thin">
              {filteredUbs.length > 0 ? (
                filteredUbs.map(u => (
                  <button
                    key={u.nome}
                    onClick={() => {
                      setSelectedBairro(u.nome);
                      setSearchQuery(u.nome);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-[11px] font-semibold transition-colors border-b border-slate-100 dark:border-[#2c2c2e] last:border-b-0 ${
                      selectedBairro === u.nome
                        ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400'
                        : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
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

        {/* Separador */}
        <div className="border-t border-slate-100 dark:border-[#2c2c2e]" />

        {/* Indicador */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-3 block">
            Indicador Principal
          </label>
          <div className="space-y-1.5">
            {[
              { id: 'obesidade', label: 'Obesidade', color: 'text-red-500', dot: 'bg-red-500' },
              { id: 'desnutricao', label: 'Desnutrição', color: 'text-blue-500',  dot: 'bg-blue-500' },
              { id: 'sobrepeso',  label: 'Sobrepeso',  color: 'text-amber-500', dot: 'bg-amber-500' },
            ].map(({ id, label, color, dot }) => (
              <button
                key={id}
                onClick={() => setIndicador(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  indicador === id
                    ? 'bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-[#2c2c2e] text-slate-800 dark:text-[#f5f5f7] shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-[#f5f5f7] border border-transparent'
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

        {/* Separador */}
        <div className="border-t border-slate-100 dark:border-[#2c2c2e]" />

        {/* Faixa Etária Alert */}
        <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-[#2c2c2e] rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-700 dark:text-[#f5f5f7] mb-1">Faixa Monitorada (0–18 anos)</p>
          <p className="text-[9px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
            Os dados consolidados abrangem de **0 a 18 anos** (infanto-juvenil). Filtros específicos de idade não apresentaram relevância prática e foram ocultados.
          </p>
        </div>

        {/* Separador */}
        <div className="border-t border-slate-100 dark:border-[#2c2c2e]" />

        {/* Filtro de Pontos */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-slate-400 dark:text-zinc-500" /> Camadas (POIs)
          </label>
          <div className="space-y-1.5">
            {POI_CATEGORIES.map(({ id, label, color }) => {
              const isActive = activePoiTypes.includes(id);
              const isUbs = id === 'UBS';
              return (
                <button
                  key={id}
                  onClick={() => togglePoi(id)}
                  disabled={isUbs}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all duration-300 ${
                    isUbs
                      ? 'bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-[#2c2c2e] text-slate-800 dark:text-[#f5f5f7] cursor-default'
                      : isActive 
                        ? 'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-[#2c2c2e] text-slate-800 dark:text-[#f5f5f7] shadow-sm cursor-pointer' 
                        : 'text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-700 dark:hover:text-[#f5f5f7] border border-transparent cursor-pointer'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color} opacity-90`} />
                  <span className="truncate">{label}</span>
                  {isUbs ? (
                    <span className="ml-auto text-[9px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 px-1.5 py-0.5 rounded">Fixo</span>
                  ) : (
                    isActive && <span className="ml-auto text-[10px] text-teal-600 dark:text-teal-500">✓</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-slate-100 dark:border-[#2c2c2e]" />

        {/* Métricas rápidas reais */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-3 block">
            Resumo · Rio Claro {anoSelecionado}
          </label>
          <div className="space-y-2">
            <MetricRow icon={<TrendingUp className="w-3.5 h-3.5 text-red-500" />} label="Obesidade média" value={avgObs} color="text-red-500" />
            <MetricRow icon={<Activity className="w-3.5 h-3.5 text-blue-500" />}   label="Desnutrição média" value={avgDes}  color="text-blue-500" />
            <MetricRow icon={<Users className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />}    label="Pacientes avaliados" value={anoSelecionado.includes('2026') || anoSelecionado.includes('2027') ? 'Projetado' : '45.2K'} color="text-slate-750 dark:text-zinc-300" />
            <MetricRow icon={<Stethoscope className="w-3.5 h-3.5 text-teal-600" />} label="UBS monitoradas" value="18" color="text-teal-600 dark:text-teal-500" />
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-slate-100 dark:border-[#2c2c2e]" />

        {/* Dark Mode Switch (Estilo Apple) */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/50 dark:border-[#2c2c2e] transition-colors">
          <div className="flex items-center gap-2">
            {darkMode ? <Moon className="w-3.5 h-3.5 text-teal-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Modo Escuro</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer ${
              darkMode ? 'bg-teal-600' : 'bg-slate-300 dark:bg-zinc-700'
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
        <div className="border-t border-slate-100 dark:border-[#2c2c2e] pt-4">
          <p className="text-[9px] text-slate-400 dark:text-zinc-550 leading-relaxed font-medium">
            Fonte: SISVAN/CNES · Status: Dados reais + ML (2026–2027)
          </p>
        </div>
      </div>
    </aside>
  );
}

function MetricRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-zinc-800/30 rounded-xl border border-slate-200/50 dark:border-[#2c2c2e] hover:bg-slate-100/50 dark:hover:bg-zinc-800/60 transition-colors">
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-semibold">{label}</span>
      </div>
      <span className={`text-[11px] font-black tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
