"use client";
import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getDemographicsForUbs } from '@/lib/demographics';
import { getScopedNutritionMetrics } from '@/lib/metricSelectors';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip as RechartsTooltip 
} from 'recharts';
import { 
  Info, Mars, Venus 
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
    anoSelecionado, 
    temporalData, 
    regionalData, 
    schoolMetrics,
    bairroMetrics,
    demographicData,
    darkMode 
  } = useAppStore();
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(2); // Padrão: Escolares (6 a 11 anos)

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
    
    const key = `${focusName || 'Geral'}-${cleanYear}`;
    if (demographicData && demographicData[key]) {
      return demographicData[key];
    }
    
    return getDemographicsForUbs(focusName, cleanYear, rates.des, rates.sob, rates.obs, rates.eut);
  }, [analysisLevel, selectedSchoolName, selectedBairroName, selectedUbs, cleanYear, rates, demographicData]);

  const activeGroup = demoData.ageGroups[activeGroupIndex];

  // Helper para renderizar os cards de distribuição de gênero (sem tags/badges artificiais)
  const renderGenderBarCard = (
    title: string,
    rate: number,
    male: number,
    female: number,
    accentColor: string,
    borderColor: string
  ) => {
    return (
      <div className={`rounded-xl p-4.5 border bg-white dark:bg-slate-950 transition-all duration-300 hover:shadow-md ${borderColor} relative group overflow-hidden`}>
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">{title}</span>
          <span className={`text-[10px] font-bold ${accentColor}`}>{rate.toFixed(2)}%</span>
        </div>

        <div className="space-y-2.5">
          {/* Custom Progress Bar */}
          <div className="relative h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex border border-slate-200/20 dark:border-zinc-900/30">
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
              className="h-full bg-rose-500"
              title={`Meninas: ${female}%`}
            />
          </div>

          {/* Legend percentages with icons */}
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Mars className="w-3.5 h-3.5" />
              Meninos: <span className="font-mono">{male}%</span>
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-500">
              <Venus className="w-3.5 h-3.5" />
              Meninas: <span className="font-mono">{female}%</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Estrutura de dados para o gráfico Recharts da Faixa Etária Ativa
  const chartData = useMemo(() => {
    return [
      { name: 'Peso Adequado', value: activeGroup.eutrofia.rate, fill: '#0d9488' },
      { name: 'Sobrepeso', value: activeGroup.sobrepeso.rate, fill: '#d97706' },
      { name: 'Obesidade', value: activeGroup.obesidade.rate, fill: '#f43f5e' },
      { name: 'Desnutrição', value: activeGroup.desnutricao.rate, fill: '#2563eb' }
    ];
  }, [activeGroup]);

  return (
    <div className="space-y-7 bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-7 shadow-sm transition-colors duration-300">
      
      {/* 1. Dashboard Header (Sem ícones decorativos ou badges de escopo/tags) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-zinc-800/50 pb-5">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider">
            Análise Epidemiológica Escolar
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold mt-1">
            Indicadores demográficos, idade média e análise de gênero estruturadas em 4 faixas etárias · Nutri for Schools {anoSelecionado}
          </p>
        </div>
      </div>

      {/* 2. Top-tier KPI Cards Grid (Average Ages - Clean Visual) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI Peso Adequado (Teal) */}
        <KpiCard
          label="Idade Média · Peso Adequado"
          value={demoData.globalAvgAgeEut}
          accentColor="text-teal-600 dark:text-teal-400"
          tooltip="Idade média dos indivíduos com diagnóstico de peso saudável nesta localidade."
        />

        {/* KPI Obesidade (Rose) */}
        <KpiCard
          label="Idade Média · Obesidade"
          value={demoData.globalAvgAgeObs}
          accentColor="text-rose-600 dark:text-rose-455"
          tooltip="Idade média dos indivíduos com diagnóstico de obesidade clínica."
        />

        {/* KPI Sobrepeso (Amber) */}
        <KpiCard
          label="Idade Média · Sobrepeso"
          value={demoData.globalAvgAgeSob}
          accentColor="text-amber-600 dark:text-amber-400"
          tooltip="Idade média dos indivíduos com diagnóstico de sobrepeso nesta região."
        />

        {/* KPI Desnutrição (Blue) */}
        <KpiCard
          label="Idade Média · Desnutrição"
          value={demoData.globalAvgAgeDes}
          accentColor="text-blue-600 dark:text-blue-400"
          tooltip="Idade média dos indivíduos com quadro clínico de magreza ou desnutrição."
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
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Left Hand Column: Prevalence & Graphical Chart Analysis (Span 2) */}
        <div className="xl:col-span-2 space-y-4 border border-slate-200/50 dark:border-zinc-800/80 p-5 rounded-xl bg-slate-50/20 dark:bg-zinc-900/5 transition-colors">
          <div className="border-b border-slate-200/50 dark:border-zinc-800/70 pb-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider">
              Distribuição e Prevalência Geral
            </h3>
          </div>

          <div className="flex items-center justify-center min-h-[220px]">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)'} />
                <XAxis type="number" unit="%" tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 9, fontWeight: 'bold' }} stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 9, fontWeight: 'bold' }} stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'} />
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

        {/* Right Hand Column: Gender Analysis Grid (Span 3) */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800/50 pb-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider">
              Análise Epidemiológica por Gênero
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-extrabold text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-1 rounded-sm bg-blue-500" />Meninos</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-1 rounded-sm bg-rose-500" />Meninas</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Peso Adequado Gênero */}
            {renderGenderBarCard(
              "Peso Adequado",
              activeGroup.eutrofia.rate,
              activeGroup.eutrofia.pctMasculino,
              activeGroup.eutrofia.pctFeminino,
              "text-teal-600 dark:text-teal-400",
              "border-slate-200/50 dark:border-zinc-800/50"
            )}

            {/* Obesidade Gênero */}
            {renderGenderBarCard(
              "Obesidade Clínica",
              activeGroup.obesidade.rate,
              activeGroup.obesidade.pctMasculino,
              activeGroup.obesidade.pctFeminino,
              "text-rose-600 dark:text-rose-455",
              "border-slate-200/50 dark:border-zinc-800/50"
            )}

            {/* Sobrepeso Gênero */}
            {renderGenderBarCard(
              "Sobrepeso",
              activeGroup.sobrepeso.rate,
              activeGroup.sobrepeso.pctMasculino,
              activeGroup.sobrepeso.pctFeminino,
              "text-amber-600 dark:text-amber-400",
              "border-slate-200/50 dark:border-zinc-800/50"
            )}

            {/* Desnutrição Gênero */}
            {renderGenderBarCard(
              "Desnutrição",
              activeGroup.desnutricao.rate,
              activeGroup.desnutricao.pctMasculino,
              activeGroup.desnutricao.pctFeminino,
              "text-blue-600 dark:text-blue-400",
              "border-slate-200/50 dark:border-zinc-800/50"
            )}
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
      <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5 font-extrabold flex items-center justify-between relative z-10">
        <span>{label}</span>
        {tooltip && (
          <div className="relative group/tooltip inline-block cursor-help ml-1 text-slate-400 dark:text-zinc-550 hover:text-slate-655 dark:hover:text-[#f5f5f7]">
            <Info className="w-3.5 h-3.5" />
            <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-48 bg-slate-900 dark:bg-zinc-800 text-white dark:text-[#f5f5f7] text-[10px] p-2.5 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 font-semibold normal-case tracking-normal leading-relaxed text-center border dark:border-zinc-700">
              {tooltip}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1 relative z-10">
        <h3 className={`text-2.5xl font-black tracking-tight ${accentColor}`}>{value}</h3>
        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550">anos</span>
      </div>
    </div>
  );
}
