"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, BrainCircuit, Sparkles, MapPin, Search, Globe, Trash2, Hospital, Home, School, ChevronDown, MoreVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { UNIDADES_SAUDE, ALL_POIS, getVoronoiGeoJSON } from '@/lib/mockData';
import { useAppStore } from '@/store/useAppStore';
import ReactMarkdown from 'react-markdown';
// commit no vercel
interface Message {
  role: 'user' | 'bot';
  text: string;
  thinking?: string | null;
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
    if (value >= 68.0) return { label: 'Peso Adequado', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' };
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

const normalizeQuotes = (s: string) => s.replace(/[\u201c\u201d\u2018\u2019]/g, '"');

function ThinkingBubble({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
      >
        <BrainCircuit className="w-3.5 h-3.5" />
        <span>{open ? 'Ocultar raciocínio' : 'Ver raciocínio do modelo'}</span>
        <span className="text-[9px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 px-4 py-3 rounded-xl bg-slate-100/60 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
          {thinking}
        </div>
      )}
    </div>
  );
}

const normalizeUbsKey = (name: string, data: Record<string, any>): any => {
  if (!data || !name) return undefined;
  if (data[name]) return data[name];
  const normalize = (s: string) =>
    s.normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/[\u201c\u201d\u2018\u2019"']/g, '')
     .toLowerCase()
     .trim();
  const normalizedName = normalize(name);
  const key = Object.keys(data).find(k => normalize(k) === normalizedName);
  return key ? data[key] : undefined;
};

export default function ConsultantView() {
  const { 
    anoSelecionado, setAnoSelecionado, indicador, setIndicador, selectedBairro, setSelectedBairro, 
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
  const [pendingContext, setPendingContext] = useState<string | null>(null);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isIndicatorOpen, setIsIndicatorOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const prevContextRef = useRef<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const schoolsList = React.useMemo(() => {
    return ALL_POIS.filter(p => p.categoria === 'Educação').sort((a, b) => a.nome.localeCompare(b.nome));
  }, []);

  const ubsList = React.useMemo(() => {
    return UNIDADES_SAUDE.filter(u => u.categoria === 'UBS').sort((a, b) => {
      const nameA = a.nome.replace('UBS ', '').replace('USF ', '');
      const nameB = b.nome.replace('UBS ', '').replace('USF ', '');
      return nameA.localeCompare(nameB);
    });
  }, []);

  const filteredUbs = React.useMemo(() => {
    return ubsList.filter(u => u.nome.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [ubsList, searchQuery]);

  const filteredBairros = React.useMemo(() => {
    let list = uniqueBairrosList;
    if (selectedUbs) {
      list = list.filter(b => b.parentUbs === selectedUbs);
    }
    return list.filter(b => b.nome.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [uniqueBairrosList, selectedUbs, searchQuery]);

  const filteredSchools = React.useMemo(() => {
    let list = schoolsList;
    if (selectedBairroName) {
      list = list.filter(s => s.bairro === selectedBairroName);
    } else if (selectedUbs) {
      list = list.filter(s => s.regiao_ubs === selectedUbs);
    }
    return list.filter(s => s.nome.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [schoolsList, selectedBairroName, selectedUbs, searchQuery]);

  const filteredSearchSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    let list = schoolsList.filter(s => s.nome.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedBairroName) {
      list = list.filter(s => s.bairro === selectedBairroName);
    }
    return list.slice(0, 5);
  }, [schoolsList, selectedBairroName, selectedUbs, searchQuery]);

  const activeTemporalData = React.useMemo(() => {
    let baseSource: Array<{
      ano: string;
      desnutricao: number;
      magreza: number;
      obesidade: number;
      sobrepeso: number;
      eutrofia: number;
      isPrevisao: boolean;
    }> = [];

    if (analysisLevel === 'municipio') {
      baseSource = temporalData.map(d => ({
        ano: d.ano,
        desnutricao: d.desnutricao,
        magreza: d.magreza || 0,
        obesidade: d.obesidade,
        sobrepeso: (d as any).sobrepeso || 15.2,
        eutrofia: d.eutrofia || 58,
        isPrevisao: d.isPrevisao
      }));
    } else if (analysisLevel === 'ubs') {
      const ubsName = selectedUbs;
      baseSource = yearsList.map(yr => {
        const cleanYr = yr.replace('★', '').trim();
        const yrRecord = ubsName ? normalizeUbsKey(ubsName, regionalData[cleanYr] || {}) : null;
        const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYr) || { desnutricao: 2.62, magreza: 0, obesidade: 12.93, sobrepeso: 16.3, eutrofia: 61.2 };
        return {
          ano: yr,
          desnutricao: yrRecord && typeof yrRecord.desnutricao === 'number' ? yrRecord.desnutricao : globalRec.desnutricao,
          magreza: yrRecord && typeof yrRecord.magreza === 'number' ? yrRecord.magreza : (globalRec as any).magreza || 0,
          obesidade: yrRecord && typeof yrRecord.obesidade === 'number' ? yrRecord.obesidade : globalRec.obesidade,
          sobrepeso: yrRecord && typeof yrRecord.sobrepeso === 'number' ? yrRecord.sobrepeso : (globalRec as any).sobrepeso || 16.3,
          eutrofia: yrRecord && typeof yrRecord.eutrofia === 'number' ? yrRecord.eutrofia : (globalRec as any).eutrofia || 61.2,
          isPrevisao: Number(cleanYr) >= 2026
        };
      });
    } else if (analysisLevel === 'bairro') {
      const bName = selectedBairroName;
      baseSource = yearsList.map(yr => {
        const cleanYr = yr.replace('★', '').trim();
        const bairroRecord = bName ? (bairroMetrics as any)[bName]?.anos[cleanYr] : null;
        const parentUbsName = (bName && bairroMetrics[bName]?.regiao_ubs) || selectedUbs;
        const ubsRecord = parentUbsName ? normalizeUbsKey(parentUbsName, regionalData[cleanYr] || {}) : null;
        const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYr) || { desnutricao: 2.62, magreza: 0, obesidade: 12.93, sobrepeso: 16.3, eutrofia: 61.2 };
        return {
          ano: yr,
          desnutricao: bairroRecord && typeof bairroRecord.desnutricao === 'number' ? bairroRecord.desnutricao : (ubsRecord?.desnutricao ?? globalRec.desnutricao),
          magreza: bairroRecord && typeof bairroRecord.magreza === 'number' ? bairroRecord.magreza : (ubsRecord?.magreza ?? (globalRec as any).magreza ?? 0),
          obesidade: bairroRecord && typeof bairroRecord.obesidade === 'number' ? bairroRecord.obesidade : (ubsRecord?.obesidade ?? globalRec.obesidade),
          sobrepeso: bairroRecord && typeof bairroRecord.sobrepeso === 'number' ? bairroRecord.sobrepeso : ((ubsRecord?.sobrepeso ?? (globalRec as any).sobrepeso) || 16.3),
          eutrofia: bairroRecord && typeof bairroRecord.eutrofia === 'number' ? bairroRecord.eutrofia : ((ubsRecord?.eutrofia ?? (globalRec as any).eutrofia) || 61.2),
          isPrevisao: Number(cleanYr) >= 2026
        };
      });
    } else if (analysisLevel === 'escola') {
      const schoolName = selectedSchoolName;
      baseSource = yearsList.map(yr => {
        const cleanYr = yr.replace('★', '').trim();
        const schoolRecord = schoolName ? (schoolMetrics as any)[schoolName]?.anos[cleanYr] : null;
        const parentUbsName = (schoolName && schoolMetrics[schoolName]?.regiao_ubs) || selectedUbs;
        const ubsRecord = parentUbsName ? normalizeUbsKey(parentUbsName, regionalData[cleanYr] || {}) : null;
        const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYr) || { desnutricao: 2.62, magreza: 0, obesidade: 12.93, sobrepeso: 16.3, eutrofia: 61.2 };
        return {
          ano: yr,
          desnutricao: schoolRecord && typeof schoolRecord.desnutricao === 'number' ? schoolRecord.desnutricao : (ubsRecord?.desnutricao ?? globalRec.desnutricao),
          magreza: schoolRecord && typeof schoolRecord.magreza === 'number' ? schoolRecord.magreza : (ubsRecord?.magreza ?? (globalRec as any).magreza ?? 0),
          obesidade: schoolRecord && typeof schoolRecord.obesidade === 'number' ? schoolRecord.obesidade : (ubsRecord?.obesidade ?? globalRec.obesidade),
          sobrepeso: schoolRecord && typeof schoolRecord.sobrepeso === 'number' ? schoolRecord.sobrepeso : ((ubsRecord?.sobrepeso ?? (globalRec as any).sobrepeso) || 16.3),
          eutrofia: schoolRecord && typeof schoolRecord.eutrofia === 'number' ? schoolRecord.eutrofia : ((ubsRecord?.eutrofia ?? (globalRec as any).eutrofia) || 61.2),
          isPrevisao: Number(cleanYr) >= 2026
        };
      });
    }

    return baseSource;
  }, [analysisLevel, selectedUbs, selectedBairroName, selectedSchoolName, temporalData, yearsList, regionalData, schoolMetrics, bairroMetrics]);

  const dadosAno = activeTemporalData.find(d => d.ano === anoSelecionado) || activeTemporalData[0] || { desnutricao: 0, magreza: 0, obesidade: 0, sobrepeso: 0, eutrofia: 0 };
  const cleanYear = anoSelecionado.replace('★', '').trim();
  const mainLabel = indicador === 'eutrofia'
    ? 'peso adequado'
    : indicador === 'desnutricao'
      ? 'desnutrição'
      : indicador === 'magreza'
        ? 'magreza'
        : indicador === 'sobrepeso'
          ? 'sobrepeso'
          : 'obesidade';

  useEffect(() => {
    const contextKey = `${analysisLevel}|${selectedUbs}|${selectedBairroName}|${selectedSchoolName}`;

    // Inicialização: guarda o contexto inicial sem disparar preview
    if (prevContextRef.current === '') {
      prevContextRef.current = contextKey;
      return;
    }

    // Sem mudança de contexto
    if (prevContextRef.current === contextKey) return;

    // Aguarda seleção específica quando o nível exige uma
    if (analysisLevel === 'ubs' && !selectedUbs) return;
    if (analysisLevel === 'bairro' && !selectedBairroName) return;
    if (analysisLevel === 'escola' && !selectedSchoolName) return;
    
    prevContextRef.current = contextKey;

    const valorIndicador = Number((dadosAno[indicador as keyof typeof dadosAno] || 0).toFixed(2));

    const labelIndicador = indicador === 'desnutricao' ? 'Desnutrição'
      : indicador === 'magreza' ? 'Magreza'
      : indicador === 'sobrepeso' ? 'Sobrepeso'
      : indicador === 'eutrofia' ? 'Peso Adequado'
      : 'Obesidade';

    const badge = getRiskBadge(valorIndicador, indicador);

    let scopeLabel = '';
    let proactiveQuestion = '';

    if (analysisLevel === 'municipio') {
      scopeLabel = 'Rio Claro (Geral)';
      proactiveQuestion = 'Quer uma análise da situação nutricional do município ou uma comparação entre UBSs?';
    } else if (analysisLevel === 'ubs' && selectedUbs) {
      scopeLabel = selectedUbs;
      proactiveQuestion = badge.label.includes('Alto') || badge.label.includes('Médio')
        ? 'Quer que eu analise as causas ou sugira intervenções prioritárias para essa unidade?'
        : 'Quer comparar essa UBS com a média municipal ou explorar os bairros de abrangência?';
    } else if (analysisLevel === 'bairro' && selectedBairroName) {
      scopeLabel = selectedBairroName;
      proactiveQuestion = 'Quer analisar o perfil nutricional deste bairro ou ver as escolas vinculadas?';
    } else if (analysisLevel === 'escola' && selectedSchoolName) {
      scopeLabel = selectedSchoolName;
      proactiveQuestion = 'Quer analisar o perfil nutricional desta escola ou sugestões de intervenção no ambiente escolar?';
    } else {
      setPendingContext(null);
      return;
    }

    setPendingContext(
      `**Contexto atualizado: ${scopeLabel}**\n${labelIndicador}: **${valorIndicador}%** · ${badge.label} · Ano: ${anoSelecionado}\n\n${proactiveQuestion}`
    );
  }, [analysisLevel, selectedUbs, selectedBairroName, selectedSchoolName, indicador, anoSelecionado, dadosAno]);

  useEffect(() => {
  if (!regionalData || Object.keys(regionalData).length === 0) return;
  if (analysisLevel === 'municipio') return;
  if (!selectedUbs && !selectedBairroName && !selectedSchoolName) return;
  prevContextRef.current = 'force-recalc';
}, [regionalData]);
  
  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const contextSnapshot = pendingContext;
    setPendingContext(null);
    setMessages(prev => [
      ...prev,
      ...(contextSnapshot ? [{ role: 'bot' as const, text: contextSnapshot }] : []),
      { role: 'user' as const, text }
    ]);
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
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: data.response || data.error || 'Sem resposta.',
        thinking: data.thinking || null
      }]);
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

  let geralVal = 0;
  if (indicador === 'desnutricao') {
    geralVal = dadosAno.desnutricao;
  } else if (indicador === 'magreza') {
    geralVal = dadosAno.magreza;
  } else if (indicador === 'sobrepeso') {
    geralVal = dadosAno.sobrepeso;
  } else if (indicador === 'eutrofia') {
    geralVal = dadosAno.eutrofia;
  } else {
    geralVal = dadosAno.obesidade;
  }
  const geralBadge = getRiskBadge(geralVal, indicador);

  const totalAvaliados = React.useMemo(() => {
    let totalSchoolAvaliados = 0;
    Object.values(schoolMetrics || {}).forEach((sch: any) => {
      if (sch.anos?.[cleanYear]?.total_avaliados) { totalSchoolAvaliados += sch.anos[cleanYear].total_avaliados; }
    });
    return totalSchoolAvaliados;
  }, [schoolMetrics, cleanYear]);

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
      className="flex h-[calc(100vh-4rem)] w-full overflow-hidden p-6 gap-6 bg-slate-50/30 dark:bg-zinc-950/20 transition-colors duration-300"
    >
      {/* Left: Chatbot */}
      <div className="w-[60%] flex flex-col bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl overflow-hidden relative shadow-sm transition-colors duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#2c2c2e] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-[#1c1c1e]/50">
          <div className="flex items-center gap-3">
            <div className="bg-teal-50/60 dark:bg-teal-955/20 p-2.5 rounded-xl border border-teal-100 dark:border-teal-900/50 flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] flex items-center gap-1.5 leading-none">
                NutriBot
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h2>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mt-1">
                Apoio à decisão epidemiológica
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Menu de Ações (3 Pontinhos para apagar histórico) */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-805 transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                title="Opções do Chat"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[1000]" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-[1001] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => {
                        clearConversation();
                        setIsMenuOpen(false);
                      }}
                      disabled={clearing || loading}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-red-655 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Apagar histórico</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-[#1c1c1e] scrollbar-thin">
          {messages.map((msg, i) => (
            msg.role === 'bot' ? (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-50/80 dark:bg-teal-955/20 border border-teal-100 dark:border-teal-900/60 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-500" />
                </div>
                <div className="flex flex-col max-w-[85%]">
                  {msg.thinking && <ThinkingBubble thinking={msg.thinking} />}
                  <div className="bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/60 dark:border-[#2c2c2e]/60 p-5 rounded-2xl rounded-tl-sm shadow-sm">
                    <div className="text-xs text-slate-700 dark:text-zinc-250 leading-relaxed font-semibold whitespace-pre-wrap prose prose-sm dark:prose-invert">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-4 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-[#2c2c2e] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <span className="text-[9px] font-black text-slate-500 dark:text-zinc-400">EU</span>
                </div>
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white p-4 px-5 rounded-2xl rounded-tr-sm max-w-[80%] shadow-md shadow-teal-500/5">
                  <p className="text-xs text-white leading-relaxed font-bold">{msg.text}</p>
                </div>
              </div>
            )
          ))}

          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-50/80 dark:bg-teal-955/20 border border-teal-100 dark:border-teal-900/60 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-teal-600 dark:text-teal-500" />
              </div>
              <div className="bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/60 dark:border-[#2c2c2e]/60 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2.5 shadow-sm">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 ml-2 tracking-wide uppercase">Analisando correlações...</span>
              </div>
            </div>
          )}

          {pendingContext && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-50/80 dark:bg-teal-955/20 border border-teal-100 dark:border-teal-900/60 flex items-center justify-center shrink-0 mt-1 opacity-50">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-500" />
              </div>
              <div className="bg-slate-100/60 dark:bg-zinc-800/40 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%] opacity-60">
                <ReactMarkdown className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {pendingContext}
                </ReactMarkdown>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-[#2c2c2e] bg-slate-50/50 dark:bg-[#1c1c1e]/50">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Faça uma pergunta sobre os dados epidemiológicos..."
              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-[#2c2c2e] rounded-2xl py-3.5 pl-5 pr-16 text-xs font-semibold text-slate-800 dark:text-[#f5f5f7] placeholder:text-slate-405 dark:placeholder:text-zinc-655 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 focus:bg-white dark:focus:bg-zinc-900 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] cursor-text"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-40 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer active:scale-95 text-white"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-[9.5px] font-black tracking-wider text-slate-400 dark:text-zinc-550 mt-3 text-center uppercase leading-relaxed">
            IA baseada nos dados reais Nutri for Schools/CNES de Rio Claro · O NutriBot é uma inteligência artificial e pode cometer erros. Confirme as informações críticas.
          </p>
        </div>
      </div>

      {/* Right: Unified Geographic Selection Panel */}
      <div className="w-[40%] flex flex-col bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
        
        {/* Permanent Search Bar Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#2c2c2e] bg-slate-50/50 dark:bg-[#1c1c1e]/50 flex flex-col gap-4">
          
          {/* Selectors Row: Indicator (State) on Left, Year on Right */}
          <div className="grid grid-cols-[1fr_auto] gap-3">
            {/* Seletor de Estado (Indicador) */}
            <div className="relative">
              <button
                onClick={() => setIsIndicatorOpen(!isIndicatorOpen)}
                className="w-full flex items-center justify-between gap-2 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-0 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-[#f5f5f7] hover:bg-slate-50 dark:hover:bg-zinc-800/60 shadow-sm cursor-pointer"
              >
                <span className="truncate">
                  {indicador === 'obesidade' && 'Obesidade'}
                  {indicador === 'sobrepeso' && 'Sobrepeso'}
                  {indicador === 'eutrofia' && 'Peso Adequado'}
                  {indicador === 'magreza' && 'Magreza'}
                  {indicador === 'desnutricao' && 'Desnutrição'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-555 shrink-0" />
              </button>

              {isIndicatorOpen && (
                <>
                  <div className="fixed inset-0 z-[1000]" onClick={() => setIsIndicatorOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1.5 w-full bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-[1001] divide-y divide-slate-100 dark:divide-zinc-900/60 animate-in fade-in slide-in-from-top-2 duration-200">
                    {[
                      { id: 'desnutricao', label: 'Desnutrição' },
                      { id: 'magreza', label: 'Magreza' },
                      { id: 'eutrofia', label: 'Peso Adequado' },
                      { id: 'sobrepeso', label: 'Sobrepeso' },
                      { id: 'obesidade', label: 'Obesidade' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => {
                          setIndicador(id);
                          setIsIndicatorOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-xs font-bold text-left transition-colors border-none bg-transparent cursor-pointer ${
                          indicador === id
                            ? 'bg-teal-50/40 dark:bg-teal-955/10 text-teal-600 dark:text-teal-400 font-extrabold'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Seletor de Ano */}
            <div className="relative">
              <button
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="flex items-center gap-2 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-0 rounded-xl px-3.5 py-2 w-28 text-xs font-bold text-slate-800 dark:text-[#f5f5f7] hover:bg-slate-50 dark:hover:bg-zinc-800/60 shadow-sm cursor-pointer"
              >
                <span className="flex-1 text-left">{anoSelecionado}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-550 shrink-0" />
              </button>

              {isYearDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[1000]" onClick={() => setIsYearDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-28 max-h-32 overflow-y-auto bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-[1001] scrollbar-thin divide-y divide-slate-100 dark:divide-zinc-900/60 animate-in fade-in slide-in-from-top-2 duration-200">
                    {yearsList.map((yr) => (
                      <button
                        key={yr}
                        onClick={() => {
                          setAnoSelecionado(yr);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-xs font-bold text-left transition-colors border-none bg-transparent cursor-pointer ${
                          anoSelecionado === yr
                            ? 'bg-teal-50/40 dark:bg-teal-955/10 text-teal-600 dark:text-teal-400 font-extrabold'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
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

          <div>
            <h3 className="text-xs font-black tracking-wider uppercase flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-500 shrink-0" />
              <span className="font-extrabold text-slate-900 dark:text-white">Filtro de Localidade</span>
            </h3>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-1">
              Selecione uma UBS, bairro ou escola para refinar o contexto do NutriBot
            </p>
          </div>
          
          <div className="relative mt-0.5">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar UBS, Bairro ou Escola..."
              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-[#2c2c2e] rounded-xl pl-3.5 pr-9 py-2 text-xs font-semibold text-slate-800 dark:text-[#f5f5f7] placeholder-slate-400 dark:placeholder-zinc-655 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] cursor-text"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-550 hover:text-slate-700 dark:hover:text-zinc-300 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600" />
              </div>
            )}
          </div>
        </div>

        {/* Unified Scrollable categorized list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/80 scrollbar-thin">
          
          {/* CATEGORIA 1: CONSOLIDADO MUNICIPAL (GERAL) */}
          {('geral'.includes(searchQuery.toLowerCase()) || 'rio claro'.includes(searchQuery.toLowerCase()) || searchQuery.trim() === '') && (
            <div>
              <div className="px-4 py-2 text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-950/20 tracking-wider">
                Consolidado Municipal
              </div>
              <div
                onClick={() => setSelection('municipio', null, null, null)}
                className={`p-4 flex items-start gap-3.5 cursor-pointer transition-all duration-300 relative ${
                  analysisLevel === 'municipio'
                    ? 'bg-gradient-to-r from-teal-50/20 to-transparent dark:from-teal-955/10 dark:to-transparent border-l-4 border-l-teal-500 shadow-[inset_1px_0_0_rgba(13,148,136,0.1)]'
                    : 'hover:bg-slate-50/40 dark:hover:bg-zinc-800/20 border-l-4 border-l-transparent'
                }`}
              >
                <div className={`p-2 rounded-xl border shrink-0 transition-colors duration-250 ${
                  analysisLevel === 'municipio'
                    ? 'bg-teal-50/60 dark:bg-teal-955/20 border-teal-200/50 dark:border-teal-900/60 text-teal-600 dark:text-teal-400'
                    : 'bg-slate-50/80 dark:bg-zinc-900/40 border-slate-200/50 dark:border-zinc-800 text-slate-450 dark:text-zinc-500'
                }`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-black text-slate-800 dark:text-[#f5f5f7] truncate">Geral (Todo o Município)</h4>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${geralBadge.bg} shrink-0`}>
                      {geralBadge.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-555 dark:text-zinc-400 font-bold">
                    <span>{mainLabel.toUpperCase()}: <strong className="text-slate-700 dark:text-zinc-250 font-extrabold">{geralVal}%</strong></span>
                    <span>Avaliados: <strong className="text-slate-700 dark:text-zinc-250 font-extrabold">{totalAvaliadosStr}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIA 2: UNIDADES DE SAÚDE (UBS/USF) */}
          {filteredUbs.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-955/20 tracking-wider">
                Unidades de Saúde (UBS/USF)
              </div>
              {filteredUbs.map(ubs => {
                const isSelected = selectedUbs === ubs.nome && analysisLevel === 'ubs';
                const ubsData = normalizeUbsKey(ubs.nome, regionalData[cleanYear] || {});
                const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYear) || { desnutricao: 2.62, magreza: 0, obesidade: 12.93, sobrepeso: 16.3, eutrofia: 61.2 };
                const finalVal = ubsData && typeof ubsData[indicador] === 'number'
                  ? ubsData[indicador]
                  : ((globalRec as any)[indicador] ?? (indicador === 'desnutricao' ? 2.62 : indicador === 'magreza' ? 0.0 : indicador === 'obesidade' ? 12.93 : indicador === 'sobrepeso' ? 16.3 : 61.2));
                const badge = getRiskBadge(finalVal, indicador);
                
                let ubsTotalEvaluated = 0;
                Object.values(schoolMetrics || {}).forEach((sch: any) => {
                  if (sch.regiao_ubs === ubs.nome && sch.anos?.[cleanYear]?.total_avaliados) {
                    ubsTotalEvaluated += sch.anos[cleanYear].total_avaliados;
                  }
                });
                const totalAvaliados = ubsTotalEvaluated > 0 ? ubsTotalEvaluated : (ubsData?.total_avaliados || 1200);

                return (
                  <div
                    key={ubs.nome}
                    onClick={() => {
                      if (isSelected) { setSelection('municipio', null, null, null); }
                      else { setSelection('ubs', ubs.nome, null, null); }
                    }}
                    className={`p-4 flex items-start gap-3.5 cursor-pointer transition-all duration-300 relative ${
                      isSelected 
                        ? 'bg-gradient-to-r from-teal-50/20 to-transparent dark:from-teal-955/10 dark:to-transparent border-l-4 border-l-teal-500 shadow-[inset_1px_0_0_rgba(13,148,136,0.1)]' 
                        : 'hover:bg-slate-50/40 dark:hover:bg-zinc-800/20 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 transition-colors duration-250 ${
                      isSelected 
                        ? 'bg-teal-50/60 dark:bg-teal-955/20 border-teal-200/50 dark:border-teal-900/60 text-teal-600 dark:text-teal-455' 
                        : 'bg-slate-50/80 dark:bg-zinc-900/40 border-slate-200/50 dark:border-zinc-800 text-slate-450 dark:text-zinc-500'
                    }`}>
                      <Hospital className="w-4 h-4 text-teal-550" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-black text-slate-800 dark:text-[#f5f5f7] truncate">{ubs.nome.replace('UBS ', '').replace('USF ', '')}</h4>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${badge.bg} shrink-0`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-555 dark:text-zinc-400 font-bold">
                        <span>{mainLabel.toUpperCase()}: <strong className="text-slate-700 dark:text-zinc-250 font-extrabold">{finalVal}%</strong></span>
                        <span>Avaliados: <strong className="text-slate-700 dark:text-zinc-250 font-extrabold">{totalAvaliados}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CATEGORIA 3: SETORES E BAIRROS */}
          {filteredBairros.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-955/20 tracking-wider">
                Setores e Bairros
              </div>
              {filteredBairros.map(b => {
                const isSelected = selectedBairroName === b.nome && analysisLevel === 'bairro';
                const parentUbs = b.parentUbs;
                const ubsData = normalizeUbsKey(parentUbs, regionalData[cleanYear] || {});
                const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYear) || { desnutricao: 2.62, magreza: 0, obesidade: 12.93, sobrepeso: 16.3, eutrofia: 61.2 };
                const baseVal = ubsData && typeof ubsData[indicador] === 'number' ? ubsData[indicador] : (globalRec as any)[indicador] ?? 0;
                const bMetric = bairroMetrics[b.nome];
                const bYearData = bMetric?.anos?.[cleanYear];
                const finalVal = bYearData && typeof bYearData[indicador] === 'number' ? bYearData[indicador] : baseVal;
                const badge = getRiskBadge(finalVal, indicador);

                return (
                  <div
                    key={b.nome}
                    onClick={() => {
                      if (isSelected) { setSelection('ubs', b.parentUbs || null, null, null); }
                      else { setSelection('bairro', b.parentUbs || null, b.nome, null); }
                    }}
                    className={`p-4 flex items-start gap-3.5 cursor-pointer transition-all duration-300 relative ${
                      isSelected 
                        ? 'bg-gradient-to-r from-teal-50/20 to-transparent dark:from-teal-955/10 dark:to-transparent border-l-4 border-l-teal-500 shadow-[inset_1px_0_0_rgba(13,148,136,0.1)]' 
                        : 'hover:bg-slate-50/40 dark:hover:bg-zinc-800/20 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 transition-colors duration-250 ${isSelected ? 'bg-teal-50/60 dark:bg-teal-955/20 border-teal-200/50 dark:border-teal-900/60 text-teal-600 dark:text-teal-455' : 'bg-slate-50/80 dark:bg-zinc-900/40 border-slate-200/50 dark:border-zinc-800 text-slate-450 dark:text-zinc-500'}`}>
                      <Home className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-black text-slate-800 dark:text-[#f5f5f7] truncate">{b.nome}</h4>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${badge.bg} shrink-0`}>{badge.label}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-555 dark:text-zinc-400 font-bold">
                        <span>{mainLabel.toUpperCase()}: <strong className="text-slate-700 dark:text-zinc-250 font-extrabold">{finalVal}%</strong></span>
                        <span className="truncate">UBS: <strong className="text-slate-700 dark:text-zinc-250 font-extrabold">{b.parentUbs.replace('UBS ', '').replace('USF ', '')}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CATEGORIA 4: ESCOLAS MONITORADAS */}
          {filteredSchools.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase bg-slate-50/50 dark:bg-zinc-955/20 tracking-wider">
                Escolas Analisadas
              </div>
              {filteredSchools.map(s => {
                const isSelected = selectedSchoolName === s.nome && analysisLevel === 'escola';
                const parentUbs = s.regiao_ubs || '';
                const ubsRecord = parentUbs 
                ? normalizeUbsKey(parentUbs, regionalData[cleanYear] || {})
                : null;
                const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYear) || { desnutricao: 2.62, magreza: 0, obesidade: 12.93, sobrepeso: 16.3, eutrofia: 61.2 };
                const baseVal = ubsRecord && typeof ubsRecord[indicador] === 'number' ? ubsRecord[indicador] : (globalRec as any)[indicador] ?? 0;
                const sMetric = schoolMetrics[s.nome];
                const sYearData = sMetric?.anos?.[cleanYear];
                const finalVal = sYearData && typeof sYearData[indicador] === 'number' ? sYearData[indicador] : baseVal;
                const badge = getRiskBadge(finalVal, indicador);

                return (
                  <div
                    key={s.nome}
                    onClick={() => {
                      if (isSelected) { setSelection('bairro', parentUbs || null, s.bairro || null, null); }
                      else { setSelection('escola', parentUbs || null, s.bairro || null, s.nome); }
                    }}
                    className={`p-4 flex items-start gap-3.5 cursor-pointer transition-all duration-300 relative ${
                      isSelected 
                        ? 'bg-gradient-to-r from-teal-50/20 to-transparent dark:from-teal-955/10 dark:to-transparent border-l-4 border-l-teal-500 shadow-[inset_1px_0_0_rgba(13,148,136,0.1)]' 
                        : 'hover:bg-slate-50/40 dark:hover:bg-zinc-800/20 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 transition-colors duration-250 ${isSelected ? 'bg-teal-50/60 dark:bg-teal-955/20 border-teal-200/50 dark:border-teal-900/60 text-teal-600 dark:text-teal-455' : 'bg-slate-50/80 dark:bg-zinc-900/40 border-slate-200/50 dark:border-zinc-800 text-slate-450 dark:text-zinc-500'}`}>
                      <School className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-black text-slate-800 dark:text-[#f5f5f7] truncate">{s.nome}</h4>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${badge.bg} shrink-0`}>{badge.label}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-555 dark:text-zinc-400 font-bold">
                        <span>{mainLabel.toUpperCase()}: <strong className="text-slate-700 dark:text-zinc-250 font-extrabold">{finalVal}%</strong></span>
                        <span className="truncate">UBS: <strong className="text-slate-700 dark:text-zinc-250 font-extrabold">{parentUbs.replace('UBS ', '').replace('USF ', '')}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VAZIO DE BUSCA */}
          {filteredUbs.length === 0 && filteredBairros.length === 0 && filteredSchools.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
              Nenhum local encontrado correspondente a "{searchQuery}"
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
