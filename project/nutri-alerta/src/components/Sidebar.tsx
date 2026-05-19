"use client";
import React from 'react';
import { Activity, TrendingUp, Users, Stethoscope, Calendar, MapPin, Map, Layers } from 'lucide-react';
import { useAppStore, PoiType } from '@/store/useAppStore';
import { UNIDADES_SAUDE } from '@/lib/mockData';

const ANOS = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];

const POI_CATEGORIES: { id: PoiType; label: string; color: string }[] = [
  { id: 'UBS', label: 'Saúde (UBS/UPA)', color: 'bg-[#e74c3c]' },
  { id: 'Educação', label: 'Educação', color: 'bg-[#3498db]' },
  { id: 'Esporte e Lazer', label: 'Esporte & Lazer', color: 'bg-[#2ecc71]' },
  { id: 'Alimentação - Restaurante/Fast-food', label: 'Restaurantes/Fast-Food', color: 'bg-[#e67e22]' },
  { id: 'Alimentação - Mercado', label: 'Mercados', color: 'bg-[#9b59b6]' },
];

export default function Sidebar() {
  const { 
    anoSelecionado, setAnoSelecionado, 
    indicador, setIndicador, 
    selectedBairro, setSelectedBairro, 
    activePoiTypes, setActivePoiTypes,
    faixaEtaria, setFaixaEtaria 
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

  const ubsList = UNIDADES_SAUDE.filter(u => u.categoria === 'UBS');
  const filteredUbs = ubsList.filter(u =>
    u.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePoi = (poi: PoiType) => {
    if (activePoiTypes.includes(poi)) {
      setActivePoiTypes(activePoiTypes.filter(p => p !== poi));
    } else {
      setActivePoiTypes([...activePoiTypes, poi]);
    }
  };

  return (
    <aside className="w-56 bg-[#0B0E14]/90 backdrop-blur-2xl border-r border-white/5 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#00ff9d]/10 p-2 rounded-xl border border-[#00ff9d]/20 shadow-[0_0_15px_rgba(0,255,157,0.15)]">
            <Activity className="w-4 h-4 text-[#00ff9d]" />
          </div>
          <div>
            <p className="text-xs font-black text-white tracking-wide">NutriAlerta</p>
            <p className="text-[9px] text-[#00e5ff] font-medium tracking-wider">RIO CLARO · SP</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-y-auto">

        {/* Ano de Referência */}
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Ano de Referência
          </label>
          <div className="relative group">
            <select
              value={anoSelecionado}
              onChange={e => setAnoSelecionado(e.target.value)}
              className="w-full bg-[#131823] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/30 focus:border-[#00ff9d]/50 transition-all appearance-none cursor-pointer hover:bg-[#1a2130]"
            >
              {ANOS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 group-hover:text-[#00ff9d] transition-colors">
              ▼
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-white/5" />

        {/* Filtro Geográfico */}
        <div ref={dropdownRef} className="relative z-[100]">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Map className="w-3 h-3" /> Região em Foco
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
              className="w-full bg-[#131823] border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/30 focus:border-[#00ff9d]/50 transition-all cursor-text hover:bg-[#1a2130]"
            />
            {selectedBairro ? (
              <button
                onClick={() => {
                  setSelectedBairro(null);
                  setSearchQuery('');
                  setIsDropdownOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors text-xs font-bold px-1"
              >
                ✕
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none text-[10px]">
                🔍
              </div>
            )}
          </div>
          
          {/* Dropdown Suggestions */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-[#0B0E14]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[500] scrollbar-thin scrollbar-thumb-white/10">
              {filteredUbs.length > 0 ? (
                filteredUbs.map(u => (
                  <button
                    key={u.nome}
                    onClick={() => {
                      setSelectedBairro(u.nome);
                      setSearchQuery(u.nome);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-[11px] font-semibold transition-colors border-b border-white/[0.02] last:border-b-0 ${
                      selectedBairro === u.nome
                        ? 'bg-[#00ff9d]/10 text-[#00ff9d]'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {u.nome}
                  </button>
                ))
              ) : (
                <div className="px-3.5 py-2.5 text-[11px] text-white/30 italic text-center">
                  Nenhuma UBS encontrada
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filtro de Pontos */}
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Layers className="w-3 h-3" /> Camadas (POIs)
          </label>
          <div className="space-y-1.5">
            {POI_CATEGORIES.map(({ id, label, color }) => {
              const isActive = activePoiTypes.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => togglePoi(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all duration-300 ${
                    isActive 
                      ? 'bg-[#131823] border border-white/10 text-white shadow-md' 
                      : 'text-white/40 hover:bg-[#131823]/50 hover:text-white/70 border border-transparent'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color} ${isActive ? 'shadow-[0_0_8px_currentColor] opacity-100' : 'opacity-30'}`} />
                  <span className="truncate">{label}</span>
                  {isActive && <MapPin className="w-3 h-3 ml-auto opacity-50" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-white/5" />

        {/* Indicador */}
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 block">
            Indicador Principal
          </label>
          <div className="space-y-1.5">
            {[
              { id: 'obesidade', label: 'Obesidade', color: 'text-[#ff3366]', dot: 'bg-[#ff3366]', shadow: 'shadow-[0_0_10px_rgba(255,51,102,0.4)]' },
              { id: 'desnutricao', label: 'Desnutrição', color: 'text-[#00e5ff]',  dot: 'bg-[#00e5ff]', shadow: 'shadow-[0_0_10px_rgba(0,229,255,0.4)]'  },
              { id: 'sobrepeso',  label: 'Sobrepeso',  color: 'text-[#ffbb00]', dot: 'bg-[#ffbb00]', shadow: 'shadow-[0_0_10px_rgba(255,187,0,0.4)]' },
            ].map(({ id, label, color, dot, shadow }) => (
              <button
                key={id}
                onClick={() => setIndicador(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  indicador === id
                    ? 'bg-[#131823] border border-white/10 text-white shadow-lg'
                    : 'text-white/50 hover:bg-[#131823]/50 hover:text-white/80 border border-transparent'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${dot} ${indicador === id ? shadow : ''}`} />
                {label}
                {indicador === id && (
                  <span className={`ml-auto text-[9px] font-black uppercase tracking-wider ${color}`}>ativo</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Faixa Etária */}
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 block">
            Faixa Etária
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#131823] border border-white/5 rounded-xl shadow-inner">
            <button
              onClick={() => setFaixaEtaria('0-10')}
              className={`py-2 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all duration-300 ${
                faixaEtaria === '0-10'
                  ? 'bg-[#00ff9d]/15 text-[#00ff9d] border border-[#00ff9d]/20 shadow-[0_0_10px_rgba(0,255,157,0.1)]'
                  : 'text-white/40 hover:text-white/70 border border-transparent cursor-pointer'
              }`}
            >
              0 a 10 anos
            </button>
            <button
              onClick={() => setFaixaEtaria('10-18')}
              className={`py-2 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all duration-300 ${
                faixaEtaria === '10-18'
                  ? 'bg-[#00ff9d]/15 text-[#00ff9d] border border-[#00ff9d]/20 shadow-[0_0_10px_rgba(0,255,157,0.1)]'
                  : 'text-white/40 hover:text-white/70 border border-transparent cursor-pointer'
              }`}
            >
              10 a 18 anos
            </button>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-white/5" />

        {/* Métricas rápidas reais */}
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 block">
            Resumo · Rio Claro 2025
          </label>
          <div className="space-y-2">
            <MetricRow icon={<TrendingUp className="w-3.5 h-3.5 text-[#ff3366]" />} label="Obesidade média" value="12.93%" color="text-[#ff3366]" />
            <MetricRow icon={<Activity className="w-3.5 h-3.5 text-[#00e5ff]" />}   label="Desnutrição média" value="2.62%"  color="text-[#00e5ff]" />
            <MetricRow icon={<Users className="w-3.5 h-3.5 text-white/50" />}    label="Pacientes avaliados" value="45.2K" color="text-white" />
            <MetricRow icon={<Stethoscope className="w-3.5 h-3.5 text-[#00ff9d]" />} label="UBS monitoradas" value="18" color="text-[#00ff9d]" />
          </div>
        </div>

        {/* Fonte de dados */}
        <div className="border-t border-white/5 pt-4">
          <p className="text-[9px] text-white/30 leading-relaxed font-medium">
            Fonte: SISVAN/CNES · Faixa: {faixaEtaria === '0-10' ? '0–10' : '10–18'} anos · Status: Dados reais + ML (2026–2027)
          </p>
        </div>
      </div>
    </aside>
  );
}

function MetricRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-[#131823]/50 rounded-xl border border-white/5 hover:bg-[#131823] transition-colors">
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-[10px] text-white/60 font-medium">{label}</span>
      </div>
      <span className={`text-[11px] font-black tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
