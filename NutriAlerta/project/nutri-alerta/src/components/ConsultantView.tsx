"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, BrainCircuit, Sparkles, MapPin, Search, Globe, Trash2, Hospital, Home, School } from 'lucide-react';
import { motion } from 'framer-motion';
import { UNIDADES_SAUDE, ALL_POIS, getVoronoiGeoJSON } from '@/lib/mockData';
import { useAppStore } from '@/store/useAppStore';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const SESSION_KEY = 'nutribot_especialista_session';
const MESSAGES_KEY = 'nutribot_especialista_messages';

const INITIAL_MESSAGE_CONSULTANT: Message = {
  role: 'bot',
  text: 'Olá! Sou o NutriBot. Selecione o nível de análise na barra lateral (Geral, UBS, Bairro ou Escola) para ajustar o contexto dinamicamente, e me faça qualquer pergunta sobre a vigilância nutricional da região.'
};

function getSessionId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'esp-' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function resetSessionId() {
  const newId = 'esp-' + Math.random().toString(36).slice(2, 9);
  localStorage.setItem(SESSION_KEY, newId);
  return newId;
}

function loadMessages(): Message[] {
  if (typeof window === 'undefined') return [INITIAL_MESSAGE_CONSULTANT];
  try {
    const saved = localStorage.getItem(MESSAGES_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [INITIAL_MESSAGE_CONSULTANT];
}

function saveMessages(msgs: Message[]) {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  } catch {}
}

function getRiskBadge(value: number, indicator: string) {
  if (indicator === 'eutrofia') {
    if (value >= 68.0) return { label: 'Peso Saudável', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' };
    if (value >= 55.0) return { label: 'Atenção Preventiva', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Desvio Crítico', bg: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50' };
  }
  if (indicator === 'desnutricao') {
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
    temporalData, regionalData, yearsList, activePoiTypes,
    analysisLevel, selectedUbs, selectedBairroName, selectedSchoolName,
    setAnalysisLevel, setSelectedUbs, setSelectedBairroName, setSelectedSchoolName, setSelection,
    schoolMetrics, bairroMetrics
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Lista de Bairros Únicos extraídos do GeoJSON
  const uniqueBairrosList = React.useMemo(() => {
    const bairrosGeoJSON = getVoronoiGeoJSON();
    if (!bairrosGeoJSON || !bairrosGeoJSON.features) return [];
    const setNames = new Set<string>();
    const list: Array<{ nome: string; parentUbs: string }> = [];
    bairrosGeoJSON.features.forEach((feat: any) => {
      const p = feat.properties;
      if (p && p.nome_real_bairro && !setNames.has(p.nome_real_bairro)) {
        setNames.add(p.nome_real_bairro);
        list.push({ nome: p.nome_real_bairro, parentUbs: p.nome_bairro || '' });
      }
    });
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, []);

  // Lista de Escolas
  const schoolsList = React.useMemo(() => {
    return ALL_POIS.filter(p => p.categoria === 'Educação').sort((a, b) => a.nome.localeCompare(b.nome));
  }, []);

  // Lista de UBSs
  const ubsList = React.useMemo(() => {
    return UNIDADES_SAUDE.filter(u => u.categoria === 'UBS').sort((a, b) => {
      const nameA = a.nome.replace('UBS ', '').replace('USF ', '');
      const nameB = b.nome.replace('UBS ', '').replace('USF ', '');
      return nameA.localeCompare(nameB);
    });
  }, []);

  // Filtros aplicados baseados no searchQuery ativo e na hierarquia de foco
  const filteredUbs = React.useMemo(() => {
    return ubsList.filter(u =>
      u.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ubsList, searchQuery]);

  const filteredBairros = React.useMemo(() => {
    let list = uniqueBairrosList;
    if (selectedUbs) {
      list = list.filter(b => b.parentUbs === selectedUbs);
    }
    return list.filter(b =>
      b.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniqueBairrosList, selectedUbs, searchQuery]);

  const filteredSchools = React.useMemo(() => {
    let list = schoolsList;
    if (selectedBairroName) {
      list = list.filter(s => s.bairro === selectedBairroName);
    } else if (selectedUbs) {
      list = list.filter(s => s.regiao_ubs === selectedUbs);
    }
    return list.filter(s =>
      s.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [schoolsList, selectedBairroName, selectedUbs, searchQuery]);

  // Filtra as sugestões da barra de busca do assistente
  const filteredSearchSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    // Filtro por Escolas
    let list = schoolsList.filter(s => s.nome.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Se estivermos em um bairro, mostra apenas escolas desse bairro
    if (selectedBairroName) {
      list = list.filter(s => s.bairro === selectedBairroName);
    }
    
    return list.slice(0, 5);
  }, [schoolsList, selectedBairroName, selectedUbs, searchQuery]);

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
    let baseSource: Array<{
      ano: string;
      desnutricao: number;
      obesidade: number;
      sobrepeso: number;
      eutrofia: number;
      isPrevisao: boolean;
    }> = [];

    if (analysisLevel === 'municipio') {
      baseSource = temporalData.map(d => ({
        ano: d.ano,
        desnutricao: d.desnutricao,
        obesidade: d.obesidade,
        sobrepeso: (d as any).sobrepeso || 15.2,
        eutrofia: d.eutrofia || 58,
        isPrevisao: d.isPrevisao
      }));
    } else if (analysisLevel === 'ubs') {
      const ubsName = selectedUbs;
      baseSource = yearsList.map(yr => {
        const cleanYr = yr.replace('★', '').trim();
        const yrRecord = ubsName ? regionalData[cleanYr]?.[ubsName] : null;
        const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYr) || { desnutricao: 0, obesidade: 0, sobrepeso: 15.2, eutrofia: 58 };
        return {
          ano: yr,
          desnutricao: yrRecord && typeof yrRecord.desnutricao === 'number' ? yrRecord.desnutricao : globalRec.desnutricao,
          obesidade: yrRecord && typeof yrRecord.obesidade === 'number' ? yrRecord.obesidade : globalRec.obesidade,
          sobrepeso: yrRecord && typeof yrRecord.sobrepeso === 'number' ? yrRecord.sobrepeso : (globalRec as any).sobrepeso || 15.2,
          eutrofia: yrRecord && typeof yrRecord.eutrofia === 'number' ? yrRecord.eutrofia : (globalRec as any).eutrofia || 58,
          isPrevisao: Number(cleanYr) >= 2026
        };
      });
    } else if (analysisLevel === 'bairro') {
      const bName = selectedBairroName;
      baseSource = yearsList.map(yr => {
        const cleanYr = yr.replace('★', '').trim();
        const bairroRecord = bName ? (bairroMetrics as any)[bName]?.anos[cleanYr] : null;
        const ubsRecord = (bName && bairroMetrics[bName]?.regiao_ubs) ? regionalData[cleanYr]?.[bairroMetrics[bName].regiao_ubs] : null;
        const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYr) || { desnutricao: 0, obesidade: 0, sobrepeso: 15.2, eutrofia: 58 };
        
        return {
          ano: yr,
          desnutricao: bairroRecord && typeof bairroRecord.desnutricao === 'number' ? bairroRecord.desnutricao : (ubsRecord?.desnutricao ?? globalRec.desnutricao),
          obesidade: bairroRecord && typeof bairroRecord.obesidade === 'number' ? bairroRecord.obesidade : (ubsRecord?.obesidade ?? globalRec.obesidade),
          sobrepeso: bairroRecord && typeof bairroRecord.sobrepeso === 'number' ? bairroRecord.sobrepeso : ((ubsRecord?.sobrepeso ?? (globalRec as any).sobrepeso) || 15.2),
          eutrofia: bairroRecord && typeof bairroRecord.eutrofia === 'number' ? bairroRecord.eutrofia : ((ubsRecord?.eutrofia ?? (globalRec as any).eutrofia) || 58),
          isPrevisao: Number(cleanYr) >= 2026
        };
      });
    } else if (analysisLevel === 'escola') {
      const schoolName = selectedSchoolName;
      baseSource = yearsList.map(yr => {
        const cleanYr = yr.replace('★', '').trim();
        const schoolRecord = schoolName ? (schoolMetrics as any)[schoolName]?.anos[cleanYr] : null;
        const ubsRecord = (schoolName && schoolMetrics[schoolName]?.regiao_ubs) ? regionalData[cleanYr]?.[schoolMetrics[schoolName].regiao_ubs] : null;
        const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYr) || { desnutricao: 0, obesidade: 0, sobrepeso: 15.2, eutrofia: 58 };

        return {
          ano: yr,
          desnutricao: schoolRecord && typeof schoolRecord.desnutricao === 'number' ? schoolRecord.desnutricao : (ubsRecord?.desnutricao ?? globalRec.desnutricao),
          obesidade: schoolRecord && typeof schoolRecord.obesidade === 'number' ? schoolRecord.obesidade : (ubsRecord?.obesidade ?? globalRec.obesidade),
          sobrepeso: schoolRecord && typeof schoolRecord.sobrepeso === 'number' ? schoolRecord.sobrepeso : ((ubsRecord?.sobrepeso ?? (globalRec as any).sobrepeso) || 15.2),
          eutrofia: schoolRecord && typeof schoolRecord.eutrofia === 'number' ? schoolRecord.eutrofia : ((ubsRecord?.eutrofia ?? (globalRec as any).eutrofia) || 58),
          isPrevisao: Number(cleanYr) >= 2026
        };
      });
    }

    return baseSource.map(d => {
      const scaleDes = Number((d.desnutricao * multDes).toFixed(2));
      const scaleObs = Number((d.obesidade * multObs).toFixed(2));
      const scaleSob = Number(((d.sobrepeso || 0) * ((multObs + 1) / 2)).toFixed(2));
      const beforeSum = (d.desnutricao || 0) + (d.obesidade || 0) + (d.sobrepeso || 0);
      const afterSum = scaleDes + scaleObs + scaleSob;
      const baseEut = d.eutrofia !== undefined ? d.eutrofia : (100 - beforeSum);
      const scaleEut = Math.max(10, Number((baseEut - (afterSum - beforeSum)).toFixed(2)));
      return { ...d, desnutricao: scaleDes, obesidade: scaleObs, sobrepeso: scaleSob, eutrofia: scaleEut };
    });
  }, [analysisLevel, selectedUbs, selectedBairroName, selectedSchoolName, temporalData, yearsList, regionalData, schoolMetrics, bairroMetrics, multDes, multObs]);

  const dadosAno = activeTemporalData.find(d => d.ano === anoSelecionado) || activeTemporalData[0] || { desnutricao: 0, obesidade: 0, sobrepeso: 0, eutrofia: 0 };
  const cleanYear = anoSelecionado.replace('★', '').trim();
  const mainLabel = indicador === 'eutrofia' ? 'peso adequado' : indicador === 'desnutricao' ? 'desnutrição' : indicador === 'sobrepeso' ? 'sobrepeso' : 'obesidade';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

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
              tipo: 'consultor',
              analysisLevel,
              selectedUbs: selectedUbs ?? 'Não selecionado',
              selectedBairroName: selectedBairroName ?? 'Não selecionado',
              selectedSchoolName: selectedSchoolName ?? 'Não selecionado',
              scopeName: analysisLevel === 'municipio' ? 'Rio Claro (Geral)' :
                         analysisLevel === 'ubs' ? (selectedUbs ?? 'Não selecionado') :
                         analysisLevel === 'bairro' ? (selectedBairroName ?? 'Não selecionado') :
                         (selectedSchoolName ?? 'Não selecionado'),
              bairro: analysisLevel === 'escola' ? (schoolsList.find(s => s.nome === selectedSchoolName)?.bairro ?? 'Não selecionado') :
                      analysisLevel === 'bairro' ? (selectedBairroName ?? 'Não selecionado') :
                      'Não selecionado',
              regiaoUbs: analysisLevel === 'escola' ? (schoolsList.find(s => s.nome === selectedSchoolName)?.regiao_ubs ?? 'Não selecionada') :
                         analysisLevel === 'bairro' ? (uniqueBairrosList.find(b => b.nome === selectedBairroName)?.parentUbs ?? 'Não selecionada') :
                         'Não selecionada',
              sobrepeso: dadosAno.sobrepeso,
              eutrofia: dadosAno.eutrofia,
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

  async function clearConversation() {
    if (clearing || loading) return;
    setClearing(true);

    const oldSessionId = getSessionId();
    try {
      await fetch('/api/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: oldSessionId }),
      });
    } catch {}

    resetSessionId();
    localStorage.removeItem(MESSAGES_KEY);
    setMessages([INITIAL_MESSAGE_CONSULTANT]);
    setInput('');
    setClearing(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }


  // Métrica consolidada para a opção Geral
  let geralVal = 0;
  if (indicador === 'desnutricao') {
    geralVal = dadosAno.desnutricao;
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
  } else if (indicador === 'eutrofia') {
    const currentYearRegions = regionalData && regionalData[cleanYear] ? Object.values(regionalData[cleanYear]) : [];
    if (currentYearRegions.length > 0) {
      let sumEutrofia = 0, count = 0;
      currentYearRegions.forEach((reg: any) => {
        if (typeof reg.eutrofia === 'number') {
          sumEutrofia += reg.eutrofia;
          count++;
        }
      });
      geralVal = count > 0 ? Number((sumEutrofia / count).toFixed(2)) : 61.2;
    } else {
      geralVal = 61.2;
    }
  } else {
    geralVal = dadosAno.obesidade;
  }
  const geralBadge = getRiskBadge(geralVal, indicador);

  // Dynamic total evaluated students across all UBSs for the selected year
  const totalAvaliados = React.useMemo(() => {
    if (!regionalData || !regionalData[cleanYear]) return 0;
    return Object.values(regionalData[cleanYear]).reduce((sum: number, reg: any) => {
      return sum + (reg.total_avaliados ?? 0);
    }, 0);
  }, [regionalData, cleanYear]);

  const totalAvaliadosStr = React.useMemo(() => {
    if (!totalAvaliados) return 'N/D';
    return totalAvaliados >= 1000 ? `${(totalAvaliados / 1000).toFixed(1)}K` : String(totalAvaliados);
  }, [totalAvaliados]);


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
              <Sparkles className="w-6 h-6 text-teal-600 dark:text-teal-500" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-[#f5f5f7] flex items-center gap-2">
                NutriBot
                <Sparkles className="w-5 h-5 text-amber-500" />
              </h2>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 tracking-wide">NutriBot de Apoio à Decisão Epidemiológica · Rio Claro</p>
            </div>
          </div>
          
          {/* Signal / Active Context Pill */}
          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            <div className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border flex items-center gap-1 ${
              analysisLevel !== 'municipio' 
                ? 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/60 font-bold' 
                : 'text-slate-550 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-[#2c2c2e]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${analysisLevel !== 'municipio' ? 'bg-teal-500 animate-pulse' : 'bg-slate-400'}`} />
              Sinal: {
                analysisLevel === 'escola' ? `Escola: ${selectedSchoolName}` :
                analysisLevel === 'bairro' ? `Bairro: ${selectedBairroName}` :
                analysisLevel === 'ubs' ? `UBS: ${selectedUbs}` : 'Rio Claro (Geral)'
              }
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-3 py-1.5 rounded-full border border-teal-100 dark:border-teal-900/60">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Online
            </div>
            <button
              onClick={clearConversation}
              disabled={clearing || loading}
              title="Apagar histórico local"
              className="p-1.5 rounded-full text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm transition-colors cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Indicator Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 rounded-xl p-0.5 gap-0.5 shadow-inner md:ml-auto">
            {[
              { id: 'obesidade', label: 'Obesidade' },
              { id: 'desnutricao', label: 'Desnutrição' },
              { id: 'sobrepeso', label: 'Sobrepeso' },
              { id: 'eutrofia', label: 'Peso Saudável' },
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
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-500" />
                </div>
                <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-[#2c2c2e] p-5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm">
                  <div className="text-sm text-slate-700 dark:text-zinc-200 leading-relaxed font-semibold whitespace-pre-wrap">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
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
          <p className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 mt-3 text-center uppercase">
            IA baseada nos dados reais Nutri for Schools/CNES de Rio Claro
          </p>
        </div>
      </div>

      {/* Right: Geographic Selection Panel (Geral, UBS, Bairros, Escolas) */}
      <div className="w-[40%] flex flex-col bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
        
        {/* Level Tabs */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex bg-slate-200/50 dark:bg-zinc-850 p-1 rounded-xl">
            {[
                            { id: 'municipio', label: 'Geral', icon: Globe },
                            { id: 'ubs', label: 'UBS', icon: Hospital },
                            { id: 'bairro', label: 'Bairro', icon: Home },
                            { id: 'escola', label: 'Escola', icon: School }
            ].map((lvl) => {
              const Icon = lvl.icon;
              return (
              <button
                key={lvl.id}
                onClick={() => {
                  setAnalysisLevel(lvl.id as any);
                  setSearchQuery('');
                }}
                className={`flex-1 flex flex-col items-center py-1.5 rounded-lg text-[9.5px] font-bold transition-all cursor-pointer ${
                  analysisLevel === lvl.id
                    ? 'bg-white dark:bg-zinc-800 text-teal-650 dark:text-teal-400 shadow-sm'
                    : 'text-slate-550 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-[#f5f5f7] hover:bg-slate-200/30 dark:hover:bg-zinc-800/20'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 mb-0.5 ${analysisLevel === lvl.id ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                {lvl.label}
              </button>
              );
            })}
          </div>
        </div>

        {/* List Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#2c2c2e] bg-slate-50/50 dark:bg-[#1c1c1e]/50">
          <h3 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] tracking-wide uppercase font-sans">
            {analysisLevel === 'municipio' && 'Todo o Município'}
            {analysisLevel === 'ubs' && 'Unidades de Saúde (UBS/USF)'}
            {analysisLevel === 'bairro' && 'Setores e Bairros'}
            {analysisLevel === 'escola' && 'Escolas Analisadas'}
          </h3>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-1">
            {analysisLevel === 'municipio' && 'Visão consolidada de Rio Claro (Ano: ' + cleanYear + ')'}
            {analysisLevel === 'ubs' && 'Selecione uma UBS para cruzar os dados no chatbot (Ano: ' + cleanYear + ')'}
            {analysisLevel === 'bairro' && 'Selecione um bairro censitário monitorado (Ano: ' + cleanYear + ')'}
            {analysisLevel === 'escola' && 'Selecione uma das 88 escolas analisadas (Ano: ' + cleanYear + ')'}
          </p>
          
          {analysisLevel !== 'municipio' && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  analysisLevel === 'ubs' ? "Pesquisar UBS/USF..." :
                  analysisLevel === 'bairro' ? "Pesquisar Bairro..." : "Pesquisar Escola..."
                }
                className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-[#2c2c2e] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 dark:text-[#f5f5f7] placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/25 transition-colors"
              />
            </div>
          )}
        </div>

        {/* List content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 scrollbar-thin">
          
          {analysisLevel === 'municipio' && (
            <div
              onClick={() => {
                setAnalysisLevel('municipio');
              }}
              className={`p-4 flex items-start gap-3 cursor-pointer transition-all duration-150 relative bg-teal-50/55 dark:bg-teal-950/20 border-l-4 border-l-teal-600`}
            >
              <div className="p-2 rounded-xl border shrink-0 bg-teal-100/50 border-teal-200/50 text-teal-700">
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
                  <span>Avaliados: <strong className="text-slate-700 dark:text-zinc-300">{totalAvaliadosStr}</strong></span>
                </div>
              </div>
            </div>
          )}

          {analysisLevel === 'ubs' && (
            <>
              {filteredUbs.map(ubs => {
                const isSelected = selectedUbs === ubs.nome;
                const ubsData = regionalData[cleanYear]?.[ubs.nome];
                let val = ubsData ? ubsData[indicador] : (indicador === 'desnutricao' ? 2.62 : indicador === 'obesidade' ? 12.93 : indicador === 'sobrepeso' ? 16.3 : 61.2);

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
                
                // Sum the total evaluated students of all schools in this UBS region for this year
                let ubsTotalEvaluated = 0;
                Object.values(schoolMetrics || {}).forEach((sch: any) => {
                  if (sch.regiao_ubs === ubs.nome && sch.anos?.[cleanYear]?.total_avaliados) {
                    ubsTotalEvaluated += sch.anos[cleanYear].total_avaliados;
                  }
                });

                const totalAvaliados = ubsTotalEvaluated > 0 
                  ? ubsTotalEvaluated 
                  : (ubsData?.total_avaliados || 1200);

                return (
                  <div
                    key={ubs.nome}
                    onClick={() => {
                      if (isSelected) {
                        setSelection('municipio', null, null, null);
                      } else {
                        setSelection('ubs', ubs.nome, null, null);
                      }
                    }}
                    className={`p-4 flex items-start gap-3 cursor-pointer transition-all duration-150 relative ${
                      isSelected 
                        ? 'bg-teal-50/55 dark:bg-teal-950/20 border-l-4 border-l-teal-600' 
                        : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 ${isSelected ? 'bg-teal-100/50 border-teal-200/50 text-teal-700' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-550'}`}>
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
            </>
          )}

          {analysisLevel === 'bairro' && (
            <>
              {filteredBairros.map(b => {
                const isSelected = selectedBairroName === b.nome;
                
                const parentUbs = b.parentUbs;
                const ubsData = regionalData[cleanYear]?.[parentUbs];
                const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYear) || { desnutricao: 2.62, obesidade: 12.93, sobrepeso: 16.3, eutrofia: 61.2 };
                
                const baseDes = ubsData && typeof ubsData.desnutricao === 'number' ? ubsData.desnutricao : globalRec.desnutricao;
                const baseObs = ubsData && typeof ubsData.obesidade === 'number' ? ubsData.obesidade : globalRec.obesidade;
                const baseSob = ubsData && typeof ubsData.sobrepeso === 'number' ? ubsData.sobrepeso : (globalRec as any).sobrepeso || 16.3;
                const baseEut = ubsData && typeof ubsData.eutrofia === 'number' ? ubsData.eutrofia : (globalRec as any).eutrofia || 61.2;
                
                const bMetric = bairroMetrics[b.nome];
                const bYearData = bMetric?.anos?.[cleanYear];
                
                let pDes = bYearData ? bYearData.desnutricao : baseDes;
                let pObs = bYearData ? bYearData.obesidade : baseObs;
                let pSob = bYearData ? bYearData.sobrepeso : baseSob;
                let pEut = bYearData ? bYearData.eutrofia : baseEut;
                
                const scaleDes = Number((pDes * multDes).toFixed(2));
                const scaleObs = Number((pObs * multObs).toFixed(2));
                const scaleSob = Number((pSob * ((multObs + 1) / 2)).toFixed(2));
                const beforeSum = pDes + pObs + pSob;
                const afterSum = scaleDes + scaleObs + scaleSob;
                const scaleEut = Math.max(10, Number((pEut - (afterSum - beforeSum)).toFixed(2)));
                
                let finalVal = 0;
                if (indicador === 'desnutricao') finalVal = scaleDes;
                else if (indicador === 'obesidade') finalVal = scaleObs;
                else if (indicador === 'sobrepeso') finalVal = scaleSob;
                else finalVal = scaleEut;

                const badge = getRiskBadge(finalVal, indicador);

                return (
                  <div
                    key={b.nome}
                    onClick={() => {
                      if (isSelected) {
                        setSelection('ubs', b.parentUbs || null, null, null);
                      } else {
                        setSelection('bairro', b.parentUbs || null, b.nome, null);
                      }
                    }}
                    className={`p-4 flex items-start gap-3 cursor-pointer transition-all duration-150 relative ${
                      isSelected 
                        ? 'bg-teal-50/55 dark:bg-teal-950/20 border-l-4 border-l-teal-600' 
                        : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 ${isSelected ? 'bg-teal-100/50 border-teal-200/50 text-teal-700' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-550'}`}>
                      <MapPin className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-[#f5f5f7] truncate">{b.nome}</h4>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${badge.bg} shrink-0`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                        <span>{mainLabel.toUpperCase()}: <strong className="text-slate-700 dark:text-zinc-300">{finalVal}%</strong></span>
                        <span className="truncate">UBS: <strong className="text-slate-700 dark:text-zinc-300">{b.parentUbs.replace('UBS ', '').replace('USF ', '')}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredBairros.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
                  Nenhum bairro encontrado.
                </div>
              )}
            </>
          )}

          {analysisLevel === 'escola' && (
            <>
              {filteredSchools.map(s => {
                const isSelected = selectedSchoolName === s.nome;
                
                const parentUbs = s.regiao_ubs || '';
                const ubsRecord = parentUbs ? regionalData[cleanYear]?.[parentUbs] : null;
                const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYear) || { desnutricao: 2.62, obesidade: 12.93, sobrepeso: 16.3, eutrofia: 61.2 };
                
                const baseDes = ubsRecord && typeof ubsRecord.desnutricao === 'number' ? ubsRecord.desnutricao : globalRec.desnutricao;
                const baseObs = ubsRecord && typeof ubsRecord.obesidade === 'number' ? ubsRecord.obesidade : globalRec.obesidade;
                const baseSob = ubsRecord && typeof ubsRecord.sobrepeso === 'number' ? ubsRecord.sobrepeso : (globalRec as any).sobrepeso || 16.3;
                const baseEut = ubsRecord && typeof ubsRecord.eutrofia === 'number' ? ubsRecord.eutrofia : (globalRec as any).eutrofia || 61.2;
                
                const sMetric = schoolMetrics[s.nome];
                const sYearData = sMetric?.anos?.[cleanYear];
                
                let pDes = sYearData ? sYearData.desnutricao : baseDes;
                let pObs = sYearData ? sYearData.obesidade : baseObs;
                let pSob = sYearData ? sYearData.sobrepeso : baseSob;
                let pEut = sYearData ? sYearData.eutrofia : baseEut;
                
                const sum = pDes + pObs + pSob + pEut;
                if (sum > 0) {
                  pDes = (pDes / sum) * 100;
                  pObs = (pObs / sum) * 100;
                  pSob = (pSob / sum) * 100;
                  pEut = (pEut / sum) * 100;
                }
                
                const scaleDes = Number((pDes * multDes).toFixed(2));
                const scaleObs = Number((pObs * multObs).toFixed(2));
                const scaleSob = Number((pSob * ((multObs + 1) / 2)).toFixed(2));
                const beforeSum = pDes + pObs + pSob;
                const afterSum = scaleDes + scaleObs + scaleSob;
                const scaleEut = Math.max(10, Number((pEut - (afterSum - beforeSum)).toFixed(2)));
                
                let finalVal = 0;
                if (indicador === 'desnutricao') finalVal = scaleDes;
                else if (indicador === 'obesidade') finalVal = scaleObs;
                else if (indicador === 'sobrepeso') finalVal = scaleSob;
                else finalVal = scaleEut;

                const badge = getRiskBadge(finalVal, indicador);

                return (
                  <div
                    key={s.nome}
                    onClick={() => {
                      if (isSelected) {
                        setSelection('bairro', parentUbs || null, s.bairro || null, null);
                      } else {
                        setSelection('escola', parentUbs || null, s.bairro || null, s.nome);
                      }
                    }}
                    className={`p-4 flex items-start gap-3 cursor-pointer transition-all duration-150 relative ${
                      isSelected 
                        ? 'bg-teal-50/55 dark:bg-teal-950/20 border-l-4 border-l-teal-600' 
                        : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 ${isSelected ? 'bg-teal-100/50 border-teal-200/50 text-teal-700' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-550'}`}>
                      <MapPin className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-[#f5f5f7] truncate">{s.nome}</h4>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${badge.bg} shrink-0`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                        <span>{mainLabel.toUpperCase()}: <strong className="text-slate-700 dark:text-zinc-300">{finalVal}%</strong></span>
                        <span className="truncate">UBS: <strong className="text-slate-700 dark:text-zinc-300">{parentUbs.replace('UBS ', '').replace('USF ', '')}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredSchools.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
                  Nenhuma escola encontrada.
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </motion.div>
  );
}