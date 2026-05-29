"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import {
  MERCADOS_GERAIS, RESTAURANTES_GERAIS, ESPORTE_LAZER, AMBIENTE_OBESOGENICO
} from '@/lib/mockData';
import { ShieldAlert, Utensils, Dumbbell, ShoppingCart, Info } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

// Lazy-load do mapa para não bloquear o bundle principal
const ConflictMap = dynamic(() => import('./ConflictMap'), { ssr: false, loading: () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="text-slate-500 text-xs animate-pulse">Carregando mapa…</div>
  </div>
) });

const totalProtetivo = MERCADOS_GERAIS.length + RESTAURANTES_GERAIS.length + ESPORTE_LAZER.length;
const totalRisco = AMBIENTE_OBESOGENICO.length;
const total = totalProtetivo + totalRisco;
const ratioRisco = total > 0 ? ((totalRisco / total) * 100).toFixed(1) : "0.0";

const proporcaoLocal = [
  { name: 'Mercados', value: MERCADOS_GERAIS.length, fill: '#10b981' },
  { name: 'Restaurantes', value: RESTAURANTES_GERAIS.length, fill: '#0d9488' },
  { name: 'Esporte e Lazer', value: ESPORTE_LAZER.length, fill: '#3b82f6' },
  { name: 'Fast-Foods', value: AMBIENTE_OBESOGENICO.length, fill: '#ef4444' },
];

export default function UrbanConflictSection() {
  const { darkMode } = useAppStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-4 mt-6">

      {/* Título da seção */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-zinc-800/80 pb-3">
        <ShieldAlert className="w-4 h-4 text-red-500" />
        <h2 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider">
          Análise de Conflito Urbano — Infraestrutura Alimentar
        </h2>
      </div>

      {/* KPI cards da infraestrutura */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <KpiCard
          label="Mercados (Saudável)"
          value={MERCADOS_GERAIS.length}
          icon={<ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          colorClass="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/40 dark:border-emerald-900/35"
          textColor="text-emerald-700 dark:text-emerald-400"
          tooltip="Mapeamento de supermercados, mercados, quitandas e sacolões que servem como rede de alimentação saudável protetiva."
        />
        <KpiCard
          label="Restaurantes (Saudável)"
          value={RESTAURANTES_GERAIS.length}
          icon={<Utensils className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
          colorClass="bg-teal-50/50 dark:bg-teal-950/20 border-teal-100/40 dark:border-teal-900/35"
          textColor="text-teal-700 dark:text-teal-400"
          tooltip="Mapeamento de restaurantes saudáveis, trattorias, pizzarias e cafés que servem refeições saudáveis ou tradicionais preparadas."
        />
        <KpiCard
          label="Esporte e Lazer"
          value={ESPORTE_LAZER.length}
          icon={<Dumbbell className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          colorClass="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100/40 dark:border-blue-900/35"
          textColor="text-blue-700 dark:text-blue-400"
          tooltip="Mapeamento de parques, praças e complexos esportivos para fomento de atividade física."
        />
        <KpiCard
          label="Fast-Foods & Risco"
          value={AMBIENTE_OBESOGENICO.length}
          icon={<Utensils className="w-4 h-4 text-red-600 dark:text-red-400" />}
          colorClass="bg-red-50/50 dark:bg-red-955/20 border-red-100/40 dark:border-red-900/35"
          textColor="text-red-700 dark:text-red-400"
          tooltip="Mapeamento de lanchonetes, redes de fast-food, sorveterias e lojas de conveniência com predomínio de ultraprocessados de risco."
        />
        <KpiCard
          label="Índice de Concentração"
          value={`${ratioRisco}%`}
          icon={<ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          colorClass="bg-amber-50/50 dark:bg-amber-955/20 border-amber-100/40 dark:border-amber-900/35"
          textColor="text-amber-700 dark:text-amber-400"
          subtitle="do total mapeado na região"
          tooltip="Percentual de estabelecimentos de alimentação rápida em relação à infraestrutura alimentar total."
        />
      </div>

      {/* Mapa + Donut */}
      <div className="flex flex-col md:flex-row gap-4 h-[380px]">

        {/* Mapa de Conflito */}
        <div className="w-full md:w-[65%] bg-white dark:bg-[#121316]/90 border border-slate-200/70 dark:border-zinc-900/70 rounded-2xl overflow-hidden relative shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-colors duration-300">
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-widest bg-white/95 dark:bg-[#1c1c1e]/95 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 shadow-sm">
              Mapa de Análise Territorial — Distribuição de Equipamentos
            </p>
          </div>
          {/* Legenda */}
          <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
            <div className="flex items-center gap-1.5 bg-white/95 dark:bg-[#1c1c1e]/95 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 shadow-sm text-slate-700 dark:text-zinc-300">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-[9px] font-bold">Fast-Foods & Conveniência (Risco)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/95 dark:bg-[#1c1c1e]/95 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 shadow-sm text-slate-700 dark:text-zinc-300">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-bold">Mercados (Saudável)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/95 dark:bg-[#1c1c1e]/95 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 shadow-sm text-slate-700 dark:text-zinc-300">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-600" />
              <span className="text-[9px] font-bold">Restaurantes (Saudável)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/95 dark:bg-[#1c1c1e]/95 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 shadow-sm text-slate-700 dark:text-zinc-300">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-[9px] font-bold">Parques, Esporte & Lazer</span>
            </div>
          </div>
          <ConflictMap />
        </div>

        {/* Gráfico de proporção */}
        <div className="w-full md:w-[35%] bg-white dark:bg-[#121316]/90 border border-slate-200/70 dark:border-zinc-900/70 rounded-2xl p-5 flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-colors duration-300">
          <h3 className="text-xs font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider mb-1">
            Proporção de Infraestrutura
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mb-3 font-semibold">
            Saudável (Mercados, Restaurantes & Lazer) vs. Fast-Foods (Risco)
          </p>
          <div className="flex-1">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={proporcaoLocal}
                    innerRadius="55%"
                    outerRadius="78%"
                    paddingAngle={4}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    cornerRadius={4}
                  >
                    {proporcaoLocal.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: darkMode ? '#1c1c1e' : '#ffffff', borderColor: darkMode ? '#2c2c2e' : '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', color: darkMode ? '#f5f5f7' : '#0f172a' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: number, name: string) => [`${value} locais`, name]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', color: darkMode ? '#a1a1aa' : '#475569', paddingTop: '8px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-zinc-800/10 rounded-xl" />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// Sub-componente KPI card inline
function KpiCard({
  label, value, icon, colorClass, textColor, subtitle, tooltip
}: {
  label: string; value: string | number; icon: React.ReactNode;
  colorClass: string; textColor: string; subtitle?: string;
  tooltip?: string;
}) {
  return (
    <div className="bg-white dark:bg-[#121316]/90 border border-slate-200/70 dark:border-zinc-900/70 rounded-2xl p-4.5 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.01)] relative group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <p className="text-[10px] text-slate-500 dark:text-zinc-450 uppercase tracking-wider font-extrabold">{label}</p>
          {tooltip && (
            <div className="relative group/tooltip inline-block cursor-help text-slate-400 dark:text-zinc-550 hover:text-slate-650 dark:hover:text-[#f5f5f7]">
              <Info className="w-3.5 h-3.5" />
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-48 bg-slate-900 dark:bg-zinc-800 text-white dark:text-[#f5f5f7] text-[10px] p-2.5 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 font-semibold normal-case tracking-normal leading-relaxed text-center border dark:border-zinc-700">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <h3 className={`text-2xl font-black tracking-tight ${textColor}`}>{value}</h3>
        {subtitle && <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1 font-semibold leading-none">{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-xl border ${colorClass} flex items-center justify-center shadow-sm`}>{icon}</div>
    </div>
  );
}
