import React from 'react';
import { AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react';

export default function StatsCards({ bairro }: { bairro: string | null }) {
  const isSelected = !!bairro;
  
  // Dados simulados baseados na seleção do bairro
  const data = {
    title: isSelected ? `Indicadores: ${bairro}` : 'Visão Geral: Rio Claro',
    risk: isSelected ? (bairro === 'Bairro Norte' ? 75 : 25) : 32,
    delta: isSelected ? '+12%' : '+4%',
    trend: isSelected ? 'Piora' : 'Estável',
    probabilidade: isSelected ? (bairro === 'Bairro Norte' ? 'Alta' : 'Baixa') : 'Média'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="col-span-full mb-[-1rem]">
        <h2 className="text-xl font-bold text-slate-200">{data.title}</h2>
      </div>
      
      <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Risco Médio Predito</p>
            <h3 className="text-3xl font-bold text-white">{data.risk}%</h3>
          </div>
          <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/20">
            <AlertTriangle className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Delta Piora (A/A)</p>
            <h3 className="text-3xl font-bold text-white">{data.delta}</h3>
          </div>
          <div className="bg-rose-500/20 p-2.5 rounded-xl border border-rose-500/20">
            <TrendingUp className="w-6 h-6 text-rose-400" />
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Probabilidade</p>
            <h3 className="text-3xl font-bold text-white">{data.probabilidade}</h3>
          </div>
          <div className="bg-cyan-500/20 p-2.5 rounded-xl border border-cyan-500/20">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
