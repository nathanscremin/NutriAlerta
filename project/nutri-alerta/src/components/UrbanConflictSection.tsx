"use client";
import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import {
  MERCADOS_GERAIS, ESPORTE_LAZER, AMBIENTE_OBESOGENICO, PROPORCAO_INFRAESTRUTURA
} from '@/lib/mockData';
import { ShieldAlert, Utensils, Dumbbell, ShoppingCart } from 'lucide-react';

// Lazy-load do mapa para não bloquear o bundle principal
const ConflictMap = dynamic(() => import('./ConflictMap'), { ssr: false, loading: () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="text-slate-500 text-xs animate-pulse">Carregando mapa…</div>
  </div>
) });

const totalProtetivo = MERCADOS_GERAIS.length + ESPORTE_LAZER.length;
const totalRisco = AMBIENTE_OBESOGENICO.length;
const total = totalProtetivo + totalRisco;
const ratioRisco = ((totalRisco / total) * 100).toFixed(1);

export default function UrbanConflictSection() {
  return (
    <div className="space-y-4 mt-6">

      {/* Título da seção */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <ShieldAlert className="w-4 h-4 text-rose-400" />
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-widest">
          Análise de Conflito Urbano — Infraestrutura Alimentar
        </h2>
      </div>

      {/* KPI cards da infraestrutura */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Oásis Alimentares"
          value={MERCADOS_GERAIS.length}
          icon={<ShoppingCart className="w-4 h-4 text-emerald-400" />}
          colorClass="bg-emerald-500/20 border-emerald-500/20"
          textColor="text-emerald-400"
        />
        <KpiCard
          label="Parques & Esportes"
          value={ESPORTE_LAZER.length}
          icon={<Dumbbell className="w-4 h-4 text-sky-400" />}
          colorClass="bg-sky-500/20 border-sky-500/20"
          textColor="text-sky-400"
        />
        <KpiCard
          label="Fast Food & Risco"
          value={AMBIENTE_OBESOGENICO.length}
          icon={<Utensils className="w-4 h-4 text-rose-400" />}
          colorClass="bg-rose-500/20 border-rose-500/20"
          textColor="text-rose-400"
        />
        <KpiCard
          label="Índice Obesogênico"
          value={`${ratioRisco}%`}
          icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
          colorClass="bg-amber-500/20 border-amber-500/20"
          textColor="text-amber-400"
          subtitle="do total são fatores de risco"
        />
      </div>

      {/* Mapa + Donut */}
      <div className="flex flex-col md:flex-row gap-4 h-[380px]">

        {/* Mapa de Conflito */}
        <div className="w-full md:w-[65%] bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden relative">
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider bg-slate-950/70 px-2 py-1 rounded-lg backdrop-blur-sm">
              Mapa de Conflito Urbano — Pântanos Alimentares
            </p>
          </div>
          {/* Legenda */}
          <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1 pointer-events-none">
            <div className="flex items-center gap-1.5 bg-slate-950/70 px-2 py-1 rounded-lg backdrop-blur-sm">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[9px] text-slate-300">Fast Food / Conveniência</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/70 px-2 py-1 rounded-lg backdrop-blur-sm">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] text-slate-300">Mercados / Padarias</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/70 px-2 py-1 rounded-lg backdrop-blur-sm">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span className="text-[9px] text-slate-300">Parques / Esportes</span>
            </div>
          </div>
          <ConflictMap />
        </div>

        {/* Gráfico de proporção */}
        <div className="w-full md:w-[35%] bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Proporção de Infraestrutura
          </h3>
          <p className="text-[10px] text-slate-500 mb-3">
            Saudável (Mercados + Esportes) vs. Risco (Fast Food + Conv.)
          </p>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PROPORCAO_INFRAESTRUTURA}
                  innerRadius="55%"
                  outerRadius="78%"
                  paddingAngle={4}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {PROPORCAO_INFRAESTRUTURA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number, name: string) => [`${value} locais`, name]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', color: '#94a3b8', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Insight dinâmico */}
          <div className={`mt-2 rounded-xl p-3 border text-[10px] leading-relaxed ${
            Number(ratioRisco) > 20
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
          }`}>
            {Number(ratioRisco) > 20
              ? `⚠️ ${ratioRisco}% da infraestrutura mapeada é obesogênica. Regiões sem praças/mercados próximos configuram Pântanos Alimentares críticos.`
              : `✅ Boa proporção de fatores protetivos (${(100 - Number(ratioRisco)).toFixed(1)}%). Monitore concentrações de fast food sem cobertura verde.`
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-componente KPI card inline
function KpiCard({
  label, value, icon, colorClass, textColor, subtitle
}: {
  label: string; value: string | number; icon: React.ReactNode;
  colorClass: string; textColor: string; subtitle?: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between">
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <h3 className={`text-2xl font-bold ${textColor}`}>{value}</h3>
        {subtitle && <p className="text-[9px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-xl border ${colorClass}`}>{icon}</div>
    </div>
  );
}
