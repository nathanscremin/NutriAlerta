"use client";
import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getDemographicsForUbs, AgeGroupData } from '@/lib/demographics';
import { motion, AnimatePresence } from 'framer-motion';
import { Users2, ShieldCheck, TrendingUp, TrendingDown, HelpCircle, AlertCircle } from 'lucide-react';

export default function DemographicsSection() {
  const { 
    analysisLevel, 
    selectedUbs, 
    selectedBairroName, 
    selectedSchoolName,
    anoSelecionado, 
    temporalData, 
    regionalData, 
    schoolMetrics,
    bairroMetrics,
    darkMode 
  } = useAppStore();
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(2); // Padrão: Escolares (6 a 11 anos)

  const cleanYear = anoSelecionado.replace('★', '').trim();

  // Encontra os baselines dinâmicos de taxas
  const rates = useMemo(() => {
    // 1. Get the global record for this cleanYear
    const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYear) || { desnutricao: 2.62, obesidade: 12.93, sobrepeso: 15.2, eutrofia: 58 };
    const globalDes = globalRec.desnutricao;
    const globalObs = globalRec.obesidade;
    const globalSob = (globalRec as any).sobrepeso || 15.2;
    const globalEut = (globalRec as any).eutrofia || 58;

    let pDes = globalDes;
    let pObs = globalObs;
    let pSob = globalSob;
    let pEut = globalEut;

    if (analysisLevel === 'municipio') {
      // Just keep global values
    } else if (analysisLevel === 'ubs') {
      const ubsName = selectedUbs;
      const yrRecord = ubsName ? regionalData[cleanYear]?.[ubsName] : null;
      pDes = yrRecord && typeof yrRecord.desnutricao === 'number' ? yrRecord.desnutricao : globalDes;
      pObs = yrRecord && typeof yrRecord.obesidade === 'number' ? yrRecord.obesidade : globalObs;
      pSob = yrRecord && typeof yrRecord.sobrepeso === 'number' ? yrRecord.sobrepeso : globalSob;
      pEut = yrRecord && typeof yrRecord.eutrofia === 'number' ? yrRecord.eutrofia : globalEut;
    } else if (analysisLevel === 'bairro') {
      const bMetric = selectedBairroName ? bairroMetrics[selectedBairroName] : null;
      const bYearData = bMetric?.anos?.[cleanYear];
      if (bYearData) {
        pDes = bYearData.desnutricao;
        pObs = bYearData.obesidade;
        pSob = bYearData.sobrepeso;
        pEut = bYearData.eutrofia;
      } else {
        const parentUbs = bMetric?.regiao_ubs || selectedUbs;
        const ubsRecord = parentUbs ? regionalData[cleanYear]?.[parentUbs] : null;
        pDes = ubsRecord && typeof ubsRecord.desnutricao === 'number' ? ubsRecord.desnutricao : globalDes;
        pObs = ubsRecord && typeof ubsRecord.obesidade === 'number' ? ubsRecord.obesidade : globalObs;
        pSob = ubsRecord && typeof ubsRecord.sobrepeso === 'number' ? ubsRecord.sobrepeso : globalSob;
        pEut = ubsRecord && typeof ubsRecord.eutrofia === 'number' ? ubsRecord.eutrofia : globalEut;
      }
    } else if (analysisLevel === 'escola') {
      const sMetric = selectedSchoolName ? schoolMetrics[selectedSchoolName] : null;
      const sYearData = sMetric?.anos?.[cleanYear];
      if (sYearData) {
        pDes = sYearData.desnutricao;
        pObs = sYearData.obesidade;
        pSob = sYearData.sobrepeso;
        pEut = sYearData.eutrofia;
      } else {
        const parentUbs = sMetric?.regiao_ubs || selectedUbs;
        const ubsRecord = parentUbs ? regionalData[cleanYear]?.[parentUbs] : null;
        pDes = ubsRecord && typeof ubsRecord.desnutricao === 'number' ? ubsRecord.desnutricao : globalDes;
        pObs = ubsRecord && typeof ubsRecord.obesidade === 'number' ? ubsRecord.obesidade : globalObs;
        pSob = ubsRecord && typeof ubsRecord.sobrepeso === 'number' ? ubsRecord.sobrepeso : globalSob;
        pEut = ubsRecord && typeof ubsRecord.eutrofia === 'number' ? ubsRecord.eutrofia : globalEut;
      }
    }

    return {
      des: Number(pDes.toFixed(2)),
      obs: Number(pObs.toFixed(2)),
      sob: Number(pSob.toFixed(2)),
      eut: Number(pEut.toFixed(2))
    };
  }, [analysisLevel, selectedUbs, selectedBairroName, selectedSchoolName, cleanYear, temporalData, regionalData, schoolMetrics, bairroMetrics]);

  // Calcula os dados demográficos
  const demoData = useMemo(() => {
    const focusName = analysisLevel === 'escola' 
      ? selectedSchoolName 
      : analysisLevel === 'bairro' 
        ? selectedBairroName 
        : analysisLevel === 'ubs' 
          ? selectedUbs 
          : 'Geral';
    return getDemographicsForUbs(focusName, cleanYear, rates.des, rates.sob, rates.obs, rates.eut);
  }, [analysisLevel, selectedSchoolName, selectedBairroName, selectedUbs, cleanYear, rates]);

  const activeGroup = demoData.ageGroups[activeGroupIndex];


  // Helper para renderizar a barra de progresso de gênero
  const renderGenderBar = (label: string, male: number, female: number, badgeBg: string) => {
    const isMaleGreater = male > female;
    const diff = Math.abs(male - female);
    
    return (
      <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-800/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/40">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-zinc-300 font-semibold">{label}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badgeBg} border`}>
            {diff <= 1 ? "Equilibrado" : isMaleGreater ? "Meninos +Prevalente" : "Meninas +Prevalente"}
          </span>
        </div>

        {/* Barra de Progresso Dupla */}
        <div className="relative h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${male}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-blue-500"
            title={`Meninos: ${male}%`}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${female}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-red-500"
            title={`Meninas: ${female}%`}
          />
        </div>

        {/* Legenda das Porcentagens */}
        <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Meninos: {male}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Meninas: {female}%
          </span>
        </div>
      </div>
    );
  };

  // Texto explicativo dinâmico baseado na faixa selecionada
  const groupInsightText = useMemo(() => {
    switch (activeGroupIndex) {
      case 0:
        return "Primeira Infância (0-2 anos): A desnutrição nesta fase está ligada ao aleitamento e introdução alimentar precoce. Meninos têm 52% de predomínio em desnutrição devido a maior suscetibilidade infecciosa no primeiro ano de vida.";
      case 1:
        return "Pré-escolares (3-5 anos): A obesidade e sobrepeso começam a despontar. Fatores comportamentais influenciam o ganho ponderal nesta faixa, com leve predomínio feminino para sobrepeso (52%).";
      case 2:
        return "Escolares (6-11 anos): O ambiente escolar e a facilidade de acesso a produtos ultraprocessados causam um pico de obesidade infantil nesta faixa, impactando predominantemente meninos (55% de prevalência).";
      case 3:
      default:
        return "Adolescentes (12-18 anos): Marcada pelo estirão de crescimento. Observa-se que a prevalência de sobrepeso atinge principalmente as meninas (54%), impulsionada por fatores hormonais e fisiológicos do desenvolvimento.";
    }
  }, [activeGroupIndex]);

  return (
    <div className="space-y-5 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl p-6 shadow-sm transition-colors duration-300">
      
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Users2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider">
              Análise Demográfica Escolar
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
              Idade média e análise de gênero estruturadas em 4 faixas etárias · Nutri for Schools {anoSelecionado}
            </p>
          </div>
        </div>

        {/* Selo do Indicador */}
        <div className="text-[10px] text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-lg px-2.5 py-1.5 font-bold self-start sm:self-center shadow-sm">
          Filtro: {
            analysisLevel === 'escola'
              ? `Escola ${selectedSchoolName}`
              : analysisLevel === 'bairro'
                ? `Bairro ${selectedBairroName}`
                : analysisLevel === 'ubs'
                  ? selectedUbs
                  : 'Consolidado Rio Claro'
          }
        </div>

      </div>

      {/* Grid de Idades Médias Globais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card Peso Adequado */}
        <div className="bg-slate-50/50 dark:bg-zinc-800/20 border border-slate-100 dark:border-[#2c2c2e] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 border border-emerald-100/50 dark:border-emerald-900/50 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-450 dark:text-zinc-550 uppercase tracking-widest font-bold block">Idade Média · Peso Adequado</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <h4 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{demoData.globalAvgAgeEut}</h4>
              <span className="text-[10px] font-semibold text-slate-550 dark:text-zinc-500">anos</span>
            </div>
          </div>
        </div>

        {/* Card Obesidade */}
        <div className="bg-slate-50/50 dark:bg-zinc-800/20 border border-slate-100 dark:border-[#2c2c2e] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl" />
          </div>
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 border border-red-100/50 dark:border-red-900/50 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-450 dark:text-zinc-550 uppercase tracking-widest font-bold block">Idade Média · Obesidade</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <h4 className="text-2xl font-bold text-red-600 dark:text-red-400 tracking-tight">{demoData.globalAvgAgeObs}</h4>
              <span className="text-[10px] font-semibold text-slate-550 dark:text-zinc-500">anos</span>
            </div>
          </div>
        </div>

        {/* Card Sobrepeso */}
        <div className="bg-slate-50/50 dark:bg-zinc-800/20 border border-slate-100 dark:border-[#2c2c2e] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 border border-amber-100/50 dark:border-amber-900/50 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-450 dark:text-zinc-550 uppercase tracking-widest font-bold block">Idade Média · Sobrepeso</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <h4 className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">{demoData.globalAvgAgeSob}</h4>
              <span className="text-[10px] font-semibold text-slate-555 dark:text-zinc-500">anos</span>
            </div>
          </div>
        </div>

        {/* Card Desnutrição */}
        <div className="bg-slate-50/50 dark:bg-zinc-800/20 border border-slate-100 dark:border-[#2c2c2e] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl" />
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-500 border border-blue-100/50 dark:border-blue-900/50 shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-450 dark:text-zinc-555 uppercase tracking-widest font-bold block">Idade Média · Desnutrição</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <h4 className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">{demoData.globalAvgAgeDes}</h4>
              <span className="text-[10px] font-semibold text-slate-555 dark:text-zinc-500">anos</span>
            </div>
          </div>
        </div>

      </div>

      {/* Seletor de Faixas Etárias (Tabs Interativas) */}
      <div>
        <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest block mb-2.5">
          Escolha a Faixa Etária Escolar para Detalhar:
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/60 p-1.5 rounded-2xl">
          {demoData.ageGroups.map((group, index) => {
            const isActive = activeGroupIndex === index;
            return (
              <button
                key={group.faixa}
                onClick={() => setActiveGroupIndex(index)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 dark:bg-indigo-600 border-indigo-700/40 text-white shadow-md'
                    : 'bg-white dark:bg-zinc-855 border-slate-100 dark:border-[#2c2c2e] text-slate-600 dark:text-zinc-350 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
                }`}
              >
                <span className="text-[11px] font-bold">{group.label}</span>
                <span className={`text-[9px] mt-0.5 font-semibold ${isActive ? 'text-indigo-100' : 'text-slate-450 dark:text-zinc-500'}`}>
                  {group.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel Reativo de Gêneros da Faixa Etária Ativa */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeGroupIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {renderGenderBar(
            "Peso Adequado",
            activeGroup.eutrofia.pctMasculino,
            activeGroup.eutrofia.pctFeminino,
            "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
          )}
          {renderGenderBar(
            "Magreza / Desnutrição",
            activeGroup.desnutricao.pctMasculino,
            activeGroup.desnutricao.pctFeminino,
            "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/40"
          )}
          {renderGenderBar(
            "Sobrepeso",
            activeGroup.sobrepeso.pctMasculino,
            activeGroup.sobrepeso.pctFeminino,
            "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40"
          )}
          {renderGenderBar(
            "Obesidade",
            activeGroup.obesidade.pctMasculino,
            activeGroup.obesidade.pctFeminino,
            "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/40"
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bloco de Insight Epidemiológico */}
      <div className="bg-indigo-50/50 dark:bg-[#1a1a2e]/30 border border-indigo-100/50 dark:border-indigo-900/40 p-4 rounded-xl flex gap-3 items-start leading-relaxed font-semibold transition-all">
        <AlertCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-[10px] text-indigo-850 dark:text-indigo-300 space-y-1">
          <p className="font-bold uppercase tracking-wider">Insight Nutricional - Faixa Ativa</p>
          <p className="text-slate-600 dark:text-zinc-300 font-medium leading-normal">{groupInsightText}</p>
        </div>
      </div>

    </div>
  );
}
