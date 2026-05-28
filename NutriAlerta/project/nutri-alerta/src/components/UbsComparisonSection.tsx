"use client";
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getDemographicsForUbs } from '@/lib/demographics';
import { getScopedNutritionMetrics } from '@/lib/metricSelectors';
import { UNIDADES_SAUDE } from '@/lib/mockData';
import { MapPin, ChevronDown, Check, ArrowUpRight, ArrowDownRight, Minus, Users, TrendingUp, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface UbsStats {
  obs: number;
  des: number;
  mag: number;
  sob: number;
  eut: number;
  total: number;
}

interface CompareTooltipProps {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number; dataKey: string | number }>;
  label?: string;
}

// ─── Configuração dos indicadores ────────────────────────────────────────────

const INDICATORS = [
  { id: 'eutrofia',    label: 'Peso Adequado', short: 'Eut.',   key: 'eut', color: '#0d9488', tailwind: 'teal' },
  { id: 'magreza',     label: 'Magreza',       short: 'Mag.',   key: 'mag', color: '#38bdf8', tailwind: 'sky' },
  { id: 'obesidade',   label: 'Obesidade',      short: 'Obes.',  key: 'obs', color: '#f43f5e', tailwind: 'rose' },
  { id: 'sobrepeso',   label: 'Sobrepeso',       short: 'Sob.',   key: 'sob', color: '#f59e0b', tailwind: 'amber' },
  { id: 'desnutricao', label: 'Desnutrição',     short: 'Desn.',  key: 'des', color: '#3b82f6', tailwind: 'blue' },
] as const;

const INDICATOR_STYLES: Record<string, { bar: string; text: string; bg: string; border: string; glow: string }> = {
  teal:  { bar: 'from-teal-500 to-teal-400',   text: 'text-teal-600 dark:text-teal-400',   bg: 'bg-teal-50 dark:bg-teal-950/30',   border: 'border-teal-200/60 dark:border-teal-800/40',  glow: '#0d9488' },
  rose:  { bar: 'from-rose-500 to-rose-400',   text: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-50 dark:bg-rose-950/30',   border: 'border-rose-200/60 dark:border-rose-800/40',  glow: '#f43f5e' },
  amber: { bar: 'from-amber-500 to-amber-400', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200/60 dark:border-amber-800/40',glow: '#f59e0b' },
  blue:  { bar: 'from-blue-500 to-blue-400',   text: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30',   border: 'border-blue-200/60 dark:border-blue-800/40',  glow: '#3b82f6' },
  sky:   { bar: 'from-sky-500 to-sky-400',    text: 'text-sky-600 dark:text-sky-400',    bg: 'bg-sky-50 dark:bg-sky-950/30',    border: 'border-sky-200/60 dark:border-sky-800/40',   glow: '#38bdf8' },
};

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function UbsDropdown({
  label,
  value,
  onChange,
  list,
  disabledItem,
  accentClass,
  pinColor,
  open,
  setOpen,
  zIndex = 30,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  list: string[];
  disabledItem: string;
  accentClass: string;
  pinColor: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  zIndex?: number;
}) {
  return (
    <div className={`relative`} style={{ zIndex }}>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1.5">{label}</p>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl
          bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800
          hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200
          text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-sm cursor-pointer"
      >
        <span className="flex items-center gap-2 min-w-0">
          <MapPin className={`w-3.5 h-3.5 shrink-0 ${pinColor}`} />
          <span className="truncate">{value}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1.5 max-h-52 overflow-y-auto
              bg-white dark:bg-[#111116] border border-slate-200 dark:border-zinc-800
              rounded-xl shadow-2xl z-[600] scrollbar-thin"
          >
            {list.map(u => {
              const isSelected = u === value;
              const isDisabled = u === disabledItem;
              return (
                <button
                  key={u}
                  disabled={isDisabled}
                  onClick={() => { onChange(u); setOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 text-[11px] font-semibold flex items-center justify-between gap-2
                    border-b border-slate-100 dark:border-zinc-900/60 last:border-b-0 transition-colors
                    ${isSelected ? `${accentClass}` : isDisabled
                      ? 'opacity-35 cursor-not-allowed text-slate-400 dark:text-zinc-600 bg-slate-50 dark:bg-zinc-900/40'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                    }`}
                >
                  <span className="truncate">{u}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnimatedBar({ value, maxValue, colorClass }: { value: number; maxValue: number; colorClass: string }) {
  const pct = maxValue > 0 ? Math.max(4, (value / maxValue) * 100) : 4;
  return (
    <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
      />
    </div>
  );
}

function DeltaBadge({ delta, lowerIsBetter = false }: { delta: number; lowerIsBetter?: boolean }) {
  const isGood = lowerIsBetter ? delta < 0 : delta > 0;
  const abs = Math.abs(delta);
  if (abs < 0.05) return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-400 dark:text-zinc-500">
      <Minus className="w-2.5 h-2.5" /> {abs.toFixed(1)}pp
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold ${isGood ? 'text-teal-600 dark:text-teal-400' : 'text-rose-500 dark:text-rose-400'}`}>
      {isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {abs.toFixed(1)}pp
    </span>
  );
}

function MetricRow({
  label,
  valueA,
  valueB,
  colorStyle,
  lowerIsBetter = false,
}: {
  label: string;
  valueA: number;
  valueB: number;
  colorStyle: { bar: string; text: string };
  lowerIsBetter?: boolean;
}) {
  const maxVal = Math.max(valueA, valueB, 1);
  const delta = valueA - valueB;
  const aIsWinner = lowerIsBetter ? valueA < valueB : valueA > valueB;
  const bIsWinner = lowerIsBetter ? valueB < valueA : valueB > valueA;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      {/* Side A */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm font-black ${colorStyle.text} font-mono`}>{valueA.toFixed(1)}%</span>
          {aIsWinner && (
            <span className="text-[8px] font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-1 py-0.5 rounded">
              ▲
            </span>
          )}
        </div>
        <AnimatedBar value={valueA} maxValue={maxVal} colorClass={colorStyle.bar} />
      </div>

      {/* Label Central */}
      <div className="text-center min-w-[72px]">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 leading-tight">{label}</p>
        <DeltaBadge delta={delta} lowerIsBetter={lowerIsBetter} />
      </div>

      {/* Side B */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-1">
          {bIsWinner && (
            <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-1 py-0.5 rounded">
              ▲
            </span>
          )}
          <span className={`text-sm font-black ${colorStyle.text} font-mono ml-auto`}>{valueB.toFixed(1)}%</span>
        </div>
        <AnimatedBar value={valueB} maxValue={maxVal} colorClass={colorStyle.bar} />
      </div>
    </div>
  );
}

function CompareTooltip({ active, payload, label }: CompareTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-400 dark:text-zinc-500 mb-2 font-bold uppercase tracking-wider text-[10px]">{label}</p>
      {payload.map(p => (
        <div key={String(p.dataKey)} className="flex items-center justify-between gap-5 mb-1.5 last:mb-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-slate-600 dark:text-zinc-300 font-semibold truncate max-w-[120px]">
              {String(p.name).replace(/^(UBS|USF)\s/, '')}
            </span>
          </div>
          <span className="font-black text-slate-900 dark:text-zinc-100">{Number(p.value).toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function UbsComparisonSection() {
  const { regionalData, temporalData, yearsList, darkMode, indicador, selectedBairro, schoolMetrics } = useAppStore();

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const ubsList = useMemo(() =>
    UNIDADES_SAUDE.filter(u => u.categoria === 'UBS')
      .map(u => u.nome)
      .sort((a, b) => a.replace(/^(UBS|USF)\s/, '').localeCompare(b.replace(/^(UBS|USF)\s/, ''))),
  []);

  const [ubsA, setUbsA] = useState<string>('UBS Jardim Chervezon "Dr. Nicolino Maziotti"');
  const [ubsB, setUbsB] = useState<string>('UBS Vila Cristina "Dr. Sílvio Arnaldo Piva"');
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);

  // Usa ref para evitar stale closure no effect do selectedBairro
  const ubsARef = useRef(ubsA);
  const ubsBRef = useRef(ubsB);
  ubsARef.current = ubsA;
  ubsBRef.current = ubsB;

  React.useEffect(() => {
    if (selectedBairro && ubsList.includes(selectedBairro)) {
      if (selectedBairro === ubsBRef.current) {
        setUbsB(ubsARef.current);
        setUbsA(selectedBairro);
      } else if (selectedBairro !== ubsARef.current) {
        setUbsA(selectedBairro);
      }
    }
  }, [selectedBairro, ubsList]);

  const activeIndicator = useMemo(() => {
    if (['desnutricao', 'magreza', 'eutrofia', 'sobrepeso', 'obesidade'].includes(indicador)) return indicador as 'desnutricao' | 'magreza' | 'eutrofia' | 'sobrepeso' | 'obesidade';
    return 'obesidade';
  }, [indicador]);

  const activeIndConfig = useMemo(() => INDICATORS.find(i => i.id === activeIndicator) ?? INDICATORS[1], [activeIndicator]);

  // getStats estabilizado com useCallback para evitar recriação a cada render
  const getStats = useCallback((ubsName: string, year: string): UbsStats => {
    const cleanYear = year.replace('★', '').trim();
    const safeSchoolMetrics = schoolMetrics || {};
    const metrics = getScopedNutritionMetrics({
      analysisLevel: 'ubs',
      selectedUbs: ubsName,
      selectedBairroName: null,
      selectedSchoolName: null,
      year: cleanYear,
      temporalData,
      regionalData,
      schoolMetrics: safeSchoolMetrics,
      bairroMetrics: {},
    });
    let ubsTotal = 0;
    Object.values(safeSchoolMetrics).forEach((sch: any) => {
      if (sch.regiao_ubs === ubsName && sch.anos?.[cleanYear]?.total_avaliados) {
        ubsTotal += sch.anos[cleanYear].total_avaliados;
      }
    });
    return { obs: metrics.obesidade, mag: metrics.magreza ?? 0, des: metrics.desnutricao, sob: metrics.sobrepeso, eut: metrics.eutrofia, total: ubsTotal || 350 };
  }, [regionalData, temporalData, schoolMetrics]);

  const statsA = useMemo(() => getStats(ubsA, '2025'), [getStats, ubsA]);
  const statsB = useMemo(() => getStats(ubsB, '2025'), [getStats, ubsB]);

  const demoA = useMemo(() => getDemographicsForUbs(ubsA, '2025', statsA.des, statsA.sob, statsA.obs, statsA.eut, statsA.mag), [ubsA, statsA]);
  const demoB = useMemo(() => getDemographicsForUbs(ubsB, '2025', statsB.des, statsB.sob, statsB.obs, statsB.eut, statsB.mag), [ubsB, statsB]);

  const chartData = useMemo(() => {
    const keyMap = { obesidade: 'obs', magreza: 'mag', desnutricao: 'des', sobrepeso: 'sob', eutrofia: 'eut' } as const;
    const k = keyMap[activeIndicator];
    return yearsList.map(yr => {
      const cleanYr = yr.replace('★', '').trim();
      const sA = getStats(ubsA, cleanYr);
      const sB = getStats(ubsB, cleanYr);
      return {
        ano: cleanYr,
        A: Number((sA[k] as number).toFixed(2)),
        B: Number((sB[k] as number).toFixed(2)),
        isPrevisao: Number(cleanYr) >= 2026,
      };
    });
  }, [getStats, ubsA, ubsB, yearsList, activeIndicator]);

  // Valor principal do indicador ativo para o placar central
  const activeKeyMap = { obesidade: 'obs', magreza: 'mag', desnutricao: 'des', sobrepeso: 'sob', eutrofia: 'eut' } as const;
  const activeKey = activeKeyMap[activeIndicator];
  const valA = statsA[activeKey];
  const valB = statsB[activeKey];
  const diff = Math.abs(valA - valB);
  const aLeads = activeIndicator === 'eutrofia' ? valA >= valB : valA <= valB;

  return (
    <div className="space-y-5">

      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-2.5">
        <Activity className="w-4 h-4 text-teal-500 shrink-0" />
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider">
            Comparador de Unidades de Saúde
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
            Análise lado a lado entre duas UBS · Nutri for Schools 2025
          </p>
        </div>
      </div>

      {/* ── Seletores de UBS ── */}
      <div
        className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end"
        onClick={() => { if (openA || openB) { setOpenA(false); setOpenB(false); } }}
      >
        <UbsDropdown
          label="Unidade A"
          value={ubsA}
          onChange={setUbsA}
          list={ubsList}
          disabledItem={ubsB}
          accentClass="bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400"
          pinColor="text-teal-500"
          open={openA}
          setOpen={(v) => { setOpenA(v); if (v) setOpenB(false); }}
          zIndex={40}
        />

        <div className="flex flex-col items-center justify-center pb-1.5 gap-0.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-center">
            <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500">VS</span>
          </div>
        </div>

        <UbsDropdown
          label="Unidade B"
          value={ubsB}
          onChange={setUbsB}
          list={ubsList}
          disabledItem={ubsA}
          accentClass="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400"
          pinColor="text-indigo-500"
          open={openB}
          setOpen={(v) => { setOpenB(v); if (v) setOpenA(false); }}
          zIndex={39}
        />
      </div>

      {/* ── Placar central do indicador ativo ── */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800/60 overflow-hidden bg-white dark:bg-[#111116]">
        {/* Barra de cor do indicador */}
        <div className="h-1 w-full" style={{ background: activeIndConfig.color }} />

        <div className="grid grid-cols-[1fr_auto_1fr]">
          {/* Painel A */}
          <div className={`p-5 flex flex-col items-center gap-2 border-r border-slate-100 dark:border-zinc-800/50 ${aLeads ? 'bg-teal-50/40 dark:bg-teal-950/10' : ''}`}>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> Unidade A
            </span>
            <span className="text-4xl font-black text-slate-800 dark:text-zinc-100 font-mono leading-none">
              {valA.toFixed(1)}<span className="text-lg font-bold text-slate-400 dark:text-zinc-500">%</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <Users className="w-3 h-3" /> {statsA.total} alunos
            </span>
            {aLeads && (
              <span className="text-[9px] font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-800/40 px-2 py-0.5 rounded-full">
                Melhor resultado
              </span>
            )}
          </div>

          {/* Centro: diferença */}
          <div className="px-4 py-5 flex flex-col items-center justify-center gap-1 min-w-[80px]">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600">Δ Diferença</p>
            <span className="text-xl font-black font-mono" style={{ color: activeIndConfig.color }}>
              {diff.toFixed(1)}<span className="text-xs">pp</span>
            </span>
            <p className="text-[8px] text-center font-bold text-slate-400 dark:text-zinc-600 leading-tight">
              {activeIndConfig.label}
            </p>
          </div>

          {/* Painel B */}
          <div className={`p-5 flex flex-col items-center gap-2 border-l border-slate-100 dark:border-zinc-800/50 ${!aLeads ? 'bg-indigo-50/40 dark:bg-indigo-950/10' : ''}`}>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Unidade B
            </span>
            <span className="text-4xl font-black text-slate-800 dark:text-zinc-100 font-mono leading-none">
              {valB.toFixed(1)}<span className="text-lg font-bold text-slate-400 dark:text-zinc-500">%</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <Users className="w-3 h-3" /> {statsB.total} alunos
            </span>
            {!aLeads && (
              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40 px-2 py-0.5 rounded-full">
                Melhor resultado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Comparação linha a linha de todos os indicadores ── */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800/60 bg-white dark:bg-[#111116] p-5 space-y-4">
        {/* Cabeçalho das colunas */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800/50">
          <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Unidade A
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600 text-center min-w-[72px]">Indicador</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 justify-end">
            Unidade B <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
          </span>
        </div>

        {INDICATORS.map(ind => {
          const styles = INDICATOR_STYLES[ind.tailwind];
          const a = statsA[ind.key as keyof UbsStats] as number;
          const b = statsB[ind.key as keyof UbsStats] as number;
          return (
            <MetricRow
              key={ind.id}
              label={ind.label}
              valueA={a}
              valueB={b}
              colorStyle={styles}
              lowerIsBetter={ind.id !== 'eutrofia'}
            />
          );
        })}

        {/* Linha separadora com dados de alunos */}
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/50 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600">Avaliados</span>
            <span className="text-base font-black text-teal-600 dark:text-teal-400 font-mono">{statsA.total}</span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600 text-center min-w-[72px]">Total Alunos</span>
          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600">Avaliados</span>
            <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">{statsB.total}</span>
          </div>
        </div>
      </div>

      {/* ── Gráfico temporal ── */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800/60 bg-white dark:bg-[#111116] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wider">
              Evolução Histórica · {activeIndConfig.label}
            </h4>
            <p className="text-[9px] text-slate-400 dark:text-zinc-600 font-semibold mt-0.5">
              2010–2025 · Projeções <span className="text-amber-500">★</span> 2026–2027
            </p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
              <span className="w-5 h-[3px] bg-teal-500 rounded-full inline-block" /> A
            </span>
            <span className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
              <span className="w-5 h-[3px] rounded-full inline-block border-t-[2px] border-dashed border-indigo-500" /> B
            </span>
          </div>
        </div>

        <div className="h-52">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <filter id="cmp-glow-a" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0d9488" floodOpacity="0.4" />
                  </filter>
                  <filter id="cmp-glow-b" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.4" />
                  </filter>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                  vertical={false}
                />
                <XAxis
                  dataKey="ano"
                  tick={{ fill: darkMode ? '#71717a' : '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: darkMode ? '#71717a' : '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                />
                <Tooltip content={<CompareTooltip />} />
                <ReferenceLine
                  x="2025"
                  stroke={darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}
                  strokeDasharray="4 3"
                  label={{ value: 'Prev. →', fill: darkMode ? '#52525b' : '#94a3b8', fontSize: 9, position: 'insideTopRight', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="A"
                  name={ubsA}
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  filter="url(#cmp-glow-a)"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    return payload?.isPrevisao
                      ? <circle key={`a-${cx}`} cx={cx} cy={cy} r={4} fill="none" stroke="#0d9488" strokeWidth={2} strokeDasharray="3 1" />
                      : <circle key={`a-${cx}`} cx={cx} cy={cy} r={3} fill="#0d9488" />;
                  }}
                  activeDot={{ r: 5, fill: '#fff', stroke: '#0d9488', strokeWidth: 2.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="B"
                  name={ubsB}
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  filter="url(#cmp-glow-b)"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    return payload?.isPrevisao
                      ? <circle key={`b-${cx}`} cx={cx} cy={cy} r={4} fill="none" stroke="#6366f1" strokeWidth={2} strokeDasharray="3 1" />
                      : <circle key={`b-${cx}`} cx={cx} cy={cy} r={3} fill="#6366f1" />;
                  }}
                  activeDot={{ r: 5, fill: '#fff', stroke: '#6366f1', strokeWidth: 2.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-xl bg-slate-50 dark:bg-zinc-800/20" />
          )}
        </div>
      </div>

    </div>
  );
}
