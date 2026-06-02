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
  { id: 'desnutricao', label: 'Desnutrição',     short: 'Desn.',  key: 'des', color: '#3b82f6', tailwind: 'blue' },
  { id: 'magreza',     label: 'Magreza',       short: 'Mag.',   key: 'mag', color: '#38bdf8', tailwind: 'sky' },
  { id: 'eutrofia',    label: 'Peso Adequado', short: 'Eut.',   key: 'eut', color: '#0d9488', tailwind: 'teal' },
  { id: 'sobrepeso',   label: 'Sobrepeso',       short: 'Sob.',   key: 'sob', color: '#f59e0b', tailwind: 'amber' },
  { id: 'obesidade',   label: 'Obesidade',      short: 'Obes.',  key: 'obs', color: '#f43f5e', tailwind: 'rose' },
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

function DeltaBadge({ delta, isRuim = false }: { delta: number; isRuim?: boolean }) {
  const isAscending = delta > 0;
  const abs = Math.abs(delta);
  const colorClass = isRuim
    ? (isAscending ? 'text-rose-500 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400')
    : (isAscending ? 'text-teal-600 dark:text-teal-400' : 'text-rose-500 dark:text-rose-400');

  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold ${colorClass}`}>
      {isAscending ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
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
      <div className="text-center min-w-[100px] sm:min-w-[200px] flex flex-col items-center justify-center gap-0.5">
        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-slate-505 dark:text-zinc-400 leading-tight">{label}</p>
        <DeltaBadge delta={delta} isRuim={lowerIsBetter} />
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
  const { regionalData, temporalData, yearsList, darkMode, indicador, selectedBairro, schoolMetrics, anoSelecionado, setAnoSelecionado } = useAppStore();

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const ubsList = useMemo(() =>
    UNIDADES_SAUDE.filter(u => u.categoria === 'UBS')
      .map(u => u.nome)
      .sort((a, b) => a.replace(/^(UBS|USF)\s/, '').localeCompare(b.replace(/^(UBS|USF)\s/, ''))),
  []);

  const [ubsA, setUbsA] = useState<string | null>(null);
  const [ubsB, setUbsB] = useState<string | null>(null);
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

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

  const [localIndicator, setLocalIndicator] = useState<'desnutricao' | 'magreza' | 'eutrofia' | 'sobrepeso' | 'obesidade'>('obesidade');
  const [isIndSelectorOpen, setIsIndSelectorOpen] = useState(false);

  React.useEffect(() => {
    if (['desnutricao', 'magreza', 'eutrofia', 'sobrepeso', 'obesidade'].includes(indicador)) {
      setLocalIndicator(indicador as 'desnutricao' | 'magreza' | 'eutrofia' | 'sobrepeso' | 'obesidade');
    }
  }, [indicador]);

  const activeIndicator = localIndicator;

  const activeIndConfig = useMemo(() => INDICATORS.find(i => i.id === activeIndicator) ?? INDICATORS[1], [activeIndicator]);

  // getStats estabilizado com useCallback para evitar recriação a cada render
  const getStats = useCallback((ubsName: string | null, year: string): UbsStats => {
    if (!ubsName) return { obs: 0, mag: 0, des: 0, sob: 0, eut: 0, total: 0 };
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

  const cleanYear = anoSelecionado.replace('★', '').trim();

  const statsA = useMemo(() => ubsA ? getStats(ubsA, cleanYear) : null, [getStats, ubsA, cleanYear]);
  const statsB = useMemo(() => ubsB ? getStats(ubsB, cleanYear) : null, [getStats, ubsB, cleanYear]);

  const demoA = useMemo(() => ubsA && statsA ? getDemographicsForUbs(ubsA, cleanYear, statsA.des, statsA.sob, statsA.obs, statsA.eut, statsA.mag) : null, [ubsA, statsA, cleanYear]);
  const demoB = useMemo(() => ubsB && statsB ? getDemographicsForUbs(ubsB, cleanYear, statsB.des, statsB.sob, statsB.obs, statsB.eut, statsB.mag) : null, [ubsB, statsB, cleanYear]);

  const chartData = useMemo(() => {
    if (!ubsA || !ubsB) return [];
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

  const hasSelection = ubsA !== null && ubsB !== null;



  // A comparação global do estado nutricional da UBS é baseada em quem tem a maior taxa de Peso Adequado (eutrofia)
  const eutA = statsA ? statsA.eut : 0;
  const eutB = statsB ? statsB.eut : 0;
  const aLeads = eutA >= eutB;

  return (
    <div className="space-y-6">

      {/* ── Cabeçalho Equivalente e Proporcional com Seletor de Ano ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-zinc-800/50 pb-5">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-500 shrink-0" />
            <span>Comparador de Unidades de Saúde</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold mt-1">
            Análise lado a lado entre duas UBS · Nutri for Schools {anoSelecionado}
          </p>
        </div>

        {/* Seletores de Ano e Indicador Customizados */}
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full md:w-auto">
          {/* Seletor do Indicador Ativo */}
          <div className="relative">
            <button
              onClick={() => setIsIndSelectorOpen(!isIndSelectorOpen)}
              className="flex items-center gap-2 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-0 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-[#f5f5f7] hover:bg-slate-50 dark:hover:bg-zinc-800/60 shadow-sm cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeIndConfig.color }} />
              <span>{activeIndConfig.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isIndSelectorOpen && (
              <>
                <div className="fixed inset-0 z-[1000]" onClick={() => setIsIndSelectorOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-44 max-h-52 overflow-y-auto bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-[1001] scrollbar-thin divide-y divide-slate-100 dark:divide-zinc-900/60 animate-in fade-in slide-in-from-top-2 duration-200">
                  {INDICATORS.map((ind) => (
                    <button
                      key={ind.id}
                      onClick={() => {
                        setLocalIndicator(ind.id);
                        setIsIndSelectorOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-xs font-bold text-left transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2 ${
                        localIndicator === ind.id
                          ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-extrabold'
                          : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ind.color }} />
                      <span>{ind.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Seletor de Ano Customizado */}
          <div className="relative">
            <button
              onClick={() => setIsYearOpen(!isYearOpen)}
              className="flex items-center gap-2 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-0 rounded-xl px-3.5 py-2 w-28 text-xs font-bold text-slate-800 dark:text-[#f5f5f7] hover:bg-slate-50 dark:hover:bg-zinc-800/60 shadow-sm cursor-pointer"
            >
              <span className="flex-1 text-left">{anoSelecionado}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-550 shrink-0" />
            </button>

            {isYearOpen && (
              <>
                <div className="fixed inset-0 z-[1000]" onClick={() => setIsYearOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-28 max-h-32 overflow-y-auto bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-[1001] scrollbar-thin divide-y divide-slate-100 dark:divide-zinc-900/60 animate-in fade-in slide-in-from-top-2 duration-200">
                  {yearsList.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => {
                        setAnoSelecionado(yr);
                        setIsYearOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-xs font-bold text-left transition-colors border-none bg-transparent cursor-pointer ${
                        anoSelecionado === yr
                          ? 'bg-teal-55 dark:bg-teal-955/10 text-teal-600 dark:text-teal-400 font-extrabold'
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
      </div>

      {/* ── Seletores de UBS ── */}
      <div
        className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-stretch sm:items-end"
        onClick={() => { if (openA || openB) { setOpenA(false); setOpenB(false); } }}
      >
        <UbsDropdown
          label="Unidade A"
          value={ubsA}
          onChange={setUbsA}
          list={ubsList}
          disabledItem={ubsB}
          accentClass="bg-teal-50 dark:bg-teal-955/20 text-teal-700 dark:text-teal-400"
          pinColor="text-teal-500"
          open={openA}
          setOpen={(v) => { setOpenA(v); if (v) setOpenB(false); }}
          zIndex={40}
        />

        <div className="flex flex-col items-center justify-center pb-1.5 gap-0.5 sm:self-end">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-center my-1 sm:my-0">
            <span className="text-[10px] font-black text-slate-400 dark:text-zinc-550">VS</span>
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

      {!hasSelection ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-955/5 p-12 text-center flex flex-col items-center justify-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-center text-slate-400 dark:text-zinc-550 shadow-inner">
            <Activity className="w-6 h-6 animate-pulse text-teal-500" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h4 className="text-sm font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Aguardando Comparação</h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-bold leading-relaxed">
              Selecione a <span className="text-teal-600 dark:text-teal-400">Unidade A</span> e a <span className="text-indigo-500 dark:text-indigo-400">Unidade B</span> nos seletores acima para visualizar a análise comparativa de indicadores e o histórico de evolução temporal.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Comparação linha a linha de todos os indicadores ── */}
          <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800/60 bg-white dark:bg-[#111116] p-5 space-y-4 animate-in fade-in duration-300">
            {/* Cabeçalho das colunas */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800/50">
              <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Unidade A
              </span>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center justify-center gap-1.5 min-w-[100px] sm:min-w-[200px]">
                <div className="flex items-center justify-end">
                  {aLeads ? (
                    <span className="text-[9.5px] font-black text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md leading-none flex items-center gap-0.5 shadow-sm">
                      ★ <span className="translate-y-[0.5px]">Melhor</span>
                    </span>
                  ) : <span />}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600 text-center px-2 leading-none">
                  Indicador
                </span>
                <div className="flex items-center justify-start">
                  {!aLeads ? (
                    <span className="text-[9.5px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md leading-none flex items-center gap-0.5 shadow-sm">
                      <span className="translate-y-[0.5px]">Melhor</span> ★
                    </span>
                  ) : <span />}
                </div>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 justify-end">
                Unidade B <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              </span>
            </div>

            {statsA && statsB && INDICATORS.map(ind => {
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
            {statsA && statsB && (() => {
              const totalA = statsA.total;
              const totalB = statsB.total;
              const diffPct = totalB > 0 ? ((totalA - totalB) / totalB) * 100 : 0;
              const diffPctString = diffPct > 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`;
              const diffPctColor = diffPct >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-500 dark:text-rose-400';
              return (
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/50 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600">Avaliados (A)</span>
                    <span className="text-base font-black text-teal-600 dark:text-teal-400 font-mono">{totalA}</span>
                  </div>
                  <div className="text-center min-w-[100px] sm:min-w-[200px]">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 leading-none">Diferença de Alunos (A vs B)</p>
                    <span className={`text-xs font-black font-mono ${diffPctColor}`}>
                      {diffPctString}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600">Avaliados (B)</span>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">{totalB}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── Gráfico temporal ── */}
          <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800/60 bg-white dark:bg-[#111116] p-5 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider">
                  Evolução Histórica · {activeIndConfig.label}
                </h4>
                <p className="text-[9px] text-slate-400 dark:text-zinc-600 font-semibold mt-0.5">
                  2010–2025 · Projeções <span className="text-amber-500">★</span> 2026–2027
                </p>
              </div>
              
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                  <span className="w-5 h-[3px] bg-teal-500 rounded-full inline-block" /> Unidade A
                </span>
                <span className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
                  <span className="w-5 h-[3px] rounded-full inline-block border-t-[2px] border-dashed border-indigo-500" /> Unidade B
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
                      tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 9, fontWeight: 'bold' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 9, fontWeight: 'bold' }}
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
                      name={ubsA || 'Unidade A'}
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
                      name={ubsB || 'Unidade B'}
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
        </>
      )}
    </div>
  );
}
