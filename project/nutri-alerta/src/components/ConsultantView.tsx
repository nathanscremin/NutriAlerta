"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, BrainCircuit, Sparkles, MapPin, Search, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { UNIDADES_SAUDE } from '@/lib/mockData';
import { useAppStore } from '@/store/useAppStore';
import { SparklesIcon } from './Header';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const SESSION_KEY = 'nutribot_especialista_session';

function getSessionId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'esp-' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getRiskBadge(value: number, indicator: string) {
  if (indicator === 'eutrofia') {
    if (value >= 68.0) return { label: 'Peso Saudável', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' };
    if (value >= 60.0) return { label: 'Atenção Leve', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Alerta / Baixo', bg: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50' };
  } else if (indicator === 'desnutricao') {
    if (value < 2.0) return { label: 'Risco Baixo', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' };
    if (value < 3.2) return { label: 'Risco Médio', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Risco Alto', bg: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50' };
  } else if (indicator === 'sobrepeso') {
    if (value < 12) return { label: 'Risco Baixo', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' };
    if (value < 18) return { label: 'Risco Médio', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Risco Alto', bg: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50' };
  } else {
    if (value < 8) return { label: 'Risco Baixo', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' };
    if (value < 13.5) return { label: 'Risco Médio', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Risco Alto', bg: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50' };
  }
}

export default function ConsultantView() {
  const { 
    anoSelecionado, indicador, setIndicador, selectedBairro, setSelectedBairro, 
    temporalData, regionalData, yearsList, activePoiTypes 
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');

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

  const dadosAno = activeTemporalData.find(d => d.ano === anoSelecionado) || activeTemporalData[0] || { desnutricao: 0, obesidade: 0, sobrepeso: 0, eutrofia: 0 };

  const cleanYear = anoSelecionado.replace('★', '').trim();
  const mainLabel = indicador === 'eutrofia' ? 'peso adequado' : indicador === 'desnutricao' ? 'desnutrição' : indicador === 'sobrepeso' ? 'sobrepeso' : 'obesidade';

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: 'Olá! Sou o NutrIA. Selecione uma UBS na lista lateral para ajustar o contexto dinamicamente, e me faça qualquer pergunta sobre a vigilância nutricional da região.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getSessionId(),
          message: text,
          context: {
            screenData: {
              bairro: selectedBairro ?? 'Não selecionado',
              ano: anoSelecionado,
              indicador,
              obesidade: dadosAno.obesidade,
              desnutricao: dadosAno.desnutricao,
            }
          }
        })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.response || data.error || 'Sem resposta.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Erro de conexão com a API.' }]);
    }

    setLoading(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Filtrar UBS da lista de saúde e ordenar em ordem alfabética pelo nome limpo (sem prefixos)
  const ubsList = UNIDADES_SAUDE.filter(u => u.categoria === 'UBS').sort((a, b) => {
    const nameA = a.nome.replace('UBS ', '').replace('USF ', '');
    const nameB = b.nome.replace('UBS ', '').replace('USF ', '');
    return nameA.localeCompare(nameB);
  });
  const filteredUbs = ubsList.filter(u =>
    u.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Métrica consolidada para a opção Geral
  let geralVal = 0;
  if (indicador === 'desnutricao') {
    geralVal = dadosAno.desnutricao;
  } else if (indicador === 'eutrofia') {
    geralVal = dadosAno.eutrofia || 58;
  } else if (indicador === 'sobrepeso') {
    const currentYearRegions = regionalData && regionalData[cleanYear] 
      ? Object.values(regionalData[cleanYear]) 
      : [];
    if (currentYearRegions.length > 0) {
      let sumSobrepeso = 0, count = 0;
      currentYearRegions.forEach((reg: any) => {
        if (typeof reg.sobrepeso === 'number') {
          sumSobrepeso += reg.sobrepeso;
          count++;
        }
      });
      geralVal = count > 0 ? Number((sumSobrepeso / count).toFixed(2)) : 16.3;
    } else {
      geralVal = 16.3;
    }
  } else {
    geralVal = dadosAno.obesidade;
  }
  const geralBadge = getRiskBadge(geralVal, indicador);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-[calc(100vh-4rem)] w-full overflow-hidden p-6 gap-6 bg-background transition-colors duration-300"
    >
      {/* Left: Chatbot */}
      <div className="w-[60%] flex flex-col bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl overflow-hidden relative shadow-sm transition-colors duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#2c2c2e] flex flex-col md:flex-row md:items-center gap-4 bg-slate-50/50 dark:bg-[#1c1c1e]/50">
          <div className="flex items-center gap-3">
            <div className="bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-100 dark:border-teal-900/60 flex items-center justify-center shadow-sm">
              <SparklesIcon className="w-6 h-6 text-teal-600 dark:text-teal-500" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-[#f5f5f7] flex items-center gap-2">
                NutrIA
                <SparklesIcon className="w-5 h-5 text-amber-500" />
              </h2>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 tracking-wide">IA de Apoio à Decisão Epidemiológica · Rio Claro</p>
            </div>
          </div>
          
          {/* Signal / Active Context Pill */}
          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            <div className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border flex items-center gap-1 ${
              selectedBairro 
                ? 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/60 font-bold' 
                : 'text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-[#2c2c2e] font-semibold'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${selectedBairro ? 'bg-teal-500 animate-pulse' : 'bg-slate-400'}`} />
              Sinal: {selectedBairro ? selectedBairro : 'Rio Claro (Geral)'}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-3 py-1.5 rounded-full border border-teal-100 dark:border-teal-900/60">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Online
            </div>
          </div>

          {/* Indicator Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 rounded-xl p-0.5 gap-0.5 shadow-inner md:ml-auto">
            {[
              { id: 'desnutricao', label: 'Desnutrição' },
              { id: 'eutrofia', label: 'Peso Adequado' },
              { id: 'sobrepeso', label: 'Sobrepeso' },
              { id: 'obesidade', label: 'Obesidade' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setIndicador(id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 cursor-pointer ${
                  indicador === id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-[#f5f5f7] hover:bg-slate-200/40 dark:hover:bg-zinc-700/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-[#1c1c1e] scrollbar-thin">
          {messages.map((msg, i) => (
            msg.role === 'bot' ? (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <SparklesIcon className="w-4 h-4 text-teal-600 dark:text-teal-500" />
                </div>
                <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-[#2c2c2e] p-5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm">
                  <p className="text-sm text-slate-700 dark:text-zinc-200 leading-relaxed font-semibold whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-4 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-[#2c2c2e] flex items-center justify-center shrink-0 mt-1">
                  <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400">EU</span>
                </div>
                <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 p-5 rounded-2xl rounded-tr-sm max-w-[80%]">
                  <p className="text-sm text-teal-800 dark:text-teal-300 leading-relaxed font-bold">{msg.text}</p>
                </div>
              </div>
            )
          ))}

          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-teal-600 dark:text-teal-500" />
              </div>
              <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-[#2c2c2e] px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2.5 shadow-sm">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 ml-2 tracking-wide">Analisando correlações...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-5 border-t border-slate-200 dark:border-[#2c2c2e] bg-slate-50/50 dark:bg-[#1c1c1e]/50">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Faça uma pergunta sobre os dados epidemiológicos..."
              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-[#2c2c2e] rounded-xl py-4 pl-5 pr-14 text-sm font-semibold text-slate-800 dark:text-[#f5f5f7] placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/25 transition-all shadow-sm"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-teal-600 hover:bg-teal-700 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 mt-3 text-center uppercase">IA baseada nos dados reais SISVAN/CNES de Rio Claro</p>
        </div>
      </div>

      {/* Right: UBS / USF List */}
      <div className="w-[40%] flex flex-col bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
        
        {/* List Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#2c2c2e] bg-slate-50/50 dark:bg-[#1c1c1e]/50">
          <h3 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] tracking-wide uppercase">Unidades de Saúde (UBS/USF)</h3>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-1">
            Selecione uma UBS para cruzar os dados no chatbot (Ano: {cleanYear})
          </p>

          {/* Search bar inside list */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar UBS/USF..."
              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-[#2c2c2e] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 dark:text-[#f5f5f7] placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/25 transition-colors"
            />
          </div>
        </div>

        {/* List content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 scrollbar-thin">
          
          {/* Opção GERAL (Todo o Município) */}
          <div
            onClick={() => {
              setSelectedBairro(null);
              setSearchQuery('');
            }}
            className={`p-4 flex items-start gap-3 cursor-pointer transition-all duration-150 relative ${
              selectedBairro === null 
                ? 'bg-teal-50/55 dark:bg-teal-950/20 border-l-4 border-l-teal-600' 
                : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 border-l-4 border-l-transparent'
            }`}
          >
            <div className={`p-2 rounded-xl border shrink-0 ${selectedBairro === null ? 'bg-teal-100/50 border-teal-200/50 text-teal-700' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>
              <Globe className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-xs font-bold text-slate-800 dark:text-[#f5f5f7] truncate">Geral (Todo o Município)</h4>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${geralBadge.bg} shrink-0`}>
                  {geralBadge.label}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                <span>{mainLabel.toUpperCase()}: <strong className="text-slate-700 dark:text-zinc-300">{geralVal}%</strong></span>
                <span>Avaliados: <strong className="text-slate-700 dark:text-zinc-300">45.2K</strong></span>
              </div>
            </div>
          </div>

          {/* Lista Filtrada de UBSs */}
          {filteredUbs.map(ubs => {
            const isSelected = selectedBairro === ubs.nome;
            const ubsData = regionalData[cleanYear]?.[ubs.nome];
            let val = 0;
            if (indicador === 'desnutricao') {
              val = ubsData ? ubsData.desnutricao : 2.62;
            } else if (indicador === 'sobrepeso') {
              val = ubsData ? ubsData.sobrepeso : 16.3;
            } else if (indicador === 'eutrofia') {
              val = ubsData ? ubsData.eutrofia : 61.2;
            } else {
              val = ubsData ? ubsData.obesidade : 12.93;
            }

            let finalVal = 0;
            if (indicador === 'eutrofia') {
              const dObs = ubsData ? ubsData.obesidade : 12.93;
              const dDes = ubsData ? ubsData.desnutricao : 2.62;
              const dSob = ubsData ? ubsData.sobrepeso : 16.3;
              const dEut = ubsData ? ubsData.eutrofia : 61.2;
              const scaleDes = Number((dDes * multDes).toFixed(2));
              const scaleObs = Number((dObs * multObs).toFixed(2));
              const scaleSob = Number((dSob * ((multObs + 1) / 2)).toFixed(2));
              const beforeSum = dDes + dObs + dSob;
              const afterSum = scaleDes + scaleObs + scaleSob;
              finalVal = Math.max(10, Number((dEut - (afterSum - beforeSum)).toFixed(2)));
            } else {
              const multiplier = indicador === 'desnutricao' ? multDes : multObs;
              finalVal = Number((val * multiplier).toFixed(2));
            }
            const badge = getRiskBadge(finalVal, indicador);
            const totalAvaliados = ubsData ? (ubsData.total_avaliados ?? 'N/D') : 'N/D';

            return (
              <div
                key={ubs.nome}
                onClick={() => setSelectedBairro(isSelected ? null : ubs.nome)}
                className={`p-4 flex items-start gap-3 cursor-pointer transition-all duration-150 relative ${
                  isSelected 
                    ? 'bg-teal-50/55 dark:bg-teal-950/20 border-l-4 border-l-teal-600' 
                    : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 border-l-4 border-l-transparent'
                }`}
              >
                <div className={`p-2 rounded-xl border shrink-0 ${isSelected ? 'bg-teal-100/50 border-teal-200/50 text-teal-700' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>
                  <MapPin className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-[#f5f5f7] truncate">{ubs.nome.replace('UBS ', '').replace('USF ', '')}</h4>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${badge.bg} shrink-0`}>
                      {badge.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                    <span>{mainLabel.toUpperCase()}: <strong className="text-slate-700 dark:text-zinc-300">{finalVal}%</strong></span>
                    <span>Avaliados: <strong className="text-slate-700 dark:text-zinc-300">{totalAvaliados}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredUbs.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
              Nenhuma unidade de saúde encontrada.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
