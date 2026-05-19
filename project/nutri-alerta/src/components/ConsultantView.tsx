"use client";
import React from 'react';
import { Bot, Send, BrainCircuit, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { DADOS_TEMPORAIS } from '@/lib/mockData';
import { useAppStore } from '@/store/useAppStore';

export default function ConsultantView() {
  const { anoSelecionado, indicador } = useAppStore();
  const dadosAno = DADOS_TEMPORAIS.find(d => d.ano === anoSelecionado) || DADOS_TEMPORAIS[0];
  const dadosProj = DADOS_TEMPORAIS.find(d => d.ano === '2027') || DADOS_TEMPORAIS[0];
  const isObs = indicador === 'obesidade';
  const mainValue = isObs ? dadosAno.obesidade : dadosAno.desnutricao;
  const mainProj = isObs ? dadosProj.obesidade : dadosProj.desnutricao;
  const mainColor = indicador === 'desnutricao' ? 'text-[#00e5ff]' : indicador === 'sobrepeso' ? 'text-[#ffbb00]' : 'text-[#ff3366]';
  const mainLabel = indicador === 'desnutricao' ? 'desnutrição' : indicador === 'sobrepeso' ? 'sobrepeso' : 'obesidade';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-[calc(100vh-4rem)] w-full overflow-hidden p-6 gap-6 bg-[#0B0E14]"
    >
      {/* Left: Chatbot */}
      <div className="w-[60%] flex flex-col bg-[#131823] border border-white/5 rounded-2xl overflow-hidden relative shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0B0E14] via-[#00ff9d]/50 to-[#0B0E14]" />

        {/* Header do chat */}
        <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-[#0B0E14]/50">
          <div className="bg-[#00ff9d]/10 p-2.5 rounded-xl border border-[#00ff9d]/20 shadow-[0_0_15px_rgba(0,255,157,0.15)]">
            <BrainCircuit className="w-6 h-6 text-[#00ff9d]" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              EpidemiologistBot
              <Sparkles className="w-4 h-4 text-[#00ff9d]" />
            </h2>
            <p className="text-[10px] font-medium text-white/50 tracking-wide">IA de Apoio à Decisão Epidemiológica · Rio Claro</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-[#00ff9d] bg-[#00ff9d]/10 px-3 py-1.5 rounded-full border border-[#00ff9d]/20 shadow-[0_0_10px_rgba(0,255,157,0.1)]">
            <span className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse shadow-[0_0_8px_rgba(0,255,157,1)]" />
            Online
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Bot */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/20 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(0,255,157,0.15)]">
              <Bot className="w-4 h-4 text-[#00ff9d]" />
            </div>
            <div className="bg-[#0B0E14]/80 border border-white/5 p-5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-lg">
              <p className="text-sm text-white/80 leading-relaxed font-medium">
                Olá, Dra. Amanda. Analisando os dados SISVAN de <strong className="text-white">Rio Claro ({anoSelecionado})</strong>, identifiquei que a <strong className={mainColor}>taxa média de {mainLabel} é de {mainValue}%</strong> entre adolescentes de 10–19 anos — com tendência projetada para <strong className="text-[#ffbb00]">13.57% em 2027</strong>.
              </p>
              <p className="text-sm text-white/60 leading-relaxed mt-3 font-medium">
                Duas UBSs merecem atenção imediata: <strong className="text-white">USF Bela Vista</strong> e <strong className="text-white">UBS Dr. Celestino Donato</strong>, que apresentam os maiores deltas de aceleração nas projeções.
              </p>
              <p className="text-[10px] text-white/30 mt-4 font-bold tracking-wider">HOJE ÀS 09h12 · DADOS SISVAN/CNES</p>
            </div>
          </div>

          {/* Usuário */}
          <div className="flex gap-4 flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-[#1a2130] border border-white/10 flex items-center justify-center shrink-0 mt-1 shadow-lg">
              <span className="text-[10px] font-black text-white/70">AS</span>
            </div>
            <div className="bg-[#00ff9d]/10 border border-[#00ff9d]/20 p-5 rounded-2xl rounded-tr-sm max-w-[80%] shadow-[0_0_20px_rgba(0,255,157,0.05)]">
              <p className="text-sm text-[#00ff9d] leading-relaxed font-semibold">
                Quais são as regiões de maior risco? E como o ambiente alimentar impacta esses dados?
              </p>
              <p className="text-[10px] text-[#00ff9d]/40 mt-3 font-bold tracking-wider">HOJE ÀS 09h13</p>
            </div>
          </div>

          {/* Bot respondendo */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/20 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(0,255,157,0.15)]">
              <Bot className="w-4 h-4 text-[#00ff9d]" />
            </div>
            <div className="bg-[#0B0E14]/80 border border-white/5 p-5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-lg">
              <p className="text-sm text-white/80 leading-relaxed font-medium">
                O mapa de conflito urbano do painel Especialista revela que <strong className="text-white">22.2% da infraestrutura alimentar mapeada é obesogênica</strong> (fast food + conveniências). A concentração no centro-sul da cidade — com pouca cobertura de parques e mercados saudáveis — configura os chamados <strong className="text-[#ff3366]">Pântanos Alimentares</strong>.
              </p>
              <p className="text-sm text-white/60 leading-relaxed mt-3 font-medium">
                Recomendação: priorizar intervenções nas UBSs com maior delta de aceleração listadas no ranking do painel Especialista.
              </p>
              <p className="text-[10px] text-white/30 mt-4 font-bold tracking-wider">HOJE ÀS 09h13 · DADOS OSM + SISVAN</p>
            </div>
          </div>

          {/* Digitando */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,255,157,0.15)]">
              <Bot className="w-4 h-4 text-[#00ff9d]" />
            </div>
            <div className="bg-[#0B0E14]/80 border border-white/5 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2.5 shadow-lg">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-2 h-2 bg-[#00ff9d] rounded-full animate-bounce shadow-[0_0_8px_rgba(0,255,157,0.8)]" style={{ animationDelay: `${d}ms` }} />
              ))}
              <span className="text-[11px] font-bold text-white/40 ml-2 tracking-wide">Analisando correlações...</span>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-5 border-t border-white/5 bg-[#0B0E14]/50">
          <div className="relative">
            <input
              type="text"
              placeholder="Faça uma pergunta sobre os dados epidemiológicos..."
              className="w-full bg-[#1a2130] border border-white/10 rounded-xl py-4 pl-5 pr-14 text-sm font-medium text-white placeholder-white/30 focus:outline-none focus:border-[#00ff9d]/50 focus:ring-2 focus:ring-[#00ff9d]/20 transition-all shadow-inner"
            />
            <button className="absolute right-2 top-2 bottom-2 aspect-square bg-[#00ff9d] hover:bg-[#00e68d] rounded-lg flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(0,255,157,0.3)]">
              <Send className="w-5 h-5 text-[#0B0E14]" />
            </button>
          </div>
          <p className="text-[10px] font-bold tracking-wider text-white/30 mt-3 text-center uppercase">IA baseada nos dados reais SISVAN/CNES de Rio Claro</p>
        </div>
      </div>

      {/* Right: Contexto */}
      <div className="w-[40%] flex flex-col gap-6">

        {/* Gráfico de obesidade */}
        <div className="bg-[#131823] border border-white/5 rounded-2xl p-6 flex flex-col flex-1 shadow-[0_10px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className={`absolute -right-20 -top-20 w-64 h-64 ${isObs ? 'bg-[#ff3366]/5' : 'bg-[#00e5ff]/5'} rounded-full blur-3xl pointer-events-none`} />
          <div className="flex items-center justify-between mb-4 z-10">
            <div>
              <h3 className="text-base font-black text-white tracking-wide">Tendência de {mainLabel.charAt(0).toUpperCase() + mainLabel.slice(1)}</h3>
              <p className="text-[10px] font-medium text-white/40 tracking-wider mt-1">RIO CLARO · 2018–2027 · SISVAN + ML</p>
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isObs ? 'text-[#ff3366] bg-[#ff3366]/10 border-[#ff3366]/20' : 'text-[#00e5ff] bg-[#00e5ff]/10 border-[#00e5ff]/20'} px-3 py-1.5 rounded-lg border shadow-lg`}>
              <TrendingUp className="w-3.5 h-3.5" /> Alta projetada
            </div>
          </div>
          <div className="flex-1 min-h-[200px] mt-2 z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DADOS_TEMPORAIS} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isObs ? '#ff3366' : '#00e5ff'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isObs ? '#ff3366' : '#00e5ff'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="ano" stroke="rgba(255,255,255,0.1)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} unit="%" />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0B0E14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  formatter={(v: any, n: any) => [`${Number(v).toFixed(2)}%`, n]}
                />
                <Area
                  type="monotone"
                  dataKey={isObs ? "obesidade" : "desnutricao"}
                  name={mainLabel}
                  stroke={isObs ? "#ff3366" : "#00e5ff"}
                  strokeWidth={3}
                  fill="url(#gradArea)"
                  dot={(props: any) => props.payload.isPrevisao
                    ? <circle cx={props.cx} cy={props.cy} r={5} fill="none" stroke={isObs ? "#ff3366" : "#00e5ff"} strokeWidth={2} strokeDasharray="3 1" />
                    : <circle cx={props.cx} cy={props.cy} r={4} fill={isObs ? "#ff3366" : "#00e5ff"} strokeWidth={0}/>}
                  activeDot={{ r: 6, fill: '#fff', stroke: isObs ? "#ff3366" : "#00e5ff", strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 pt-5 border-t border-white/5 z-10">
            <p className="text-xs text-white/60 leading-relaxed font-medium">
              A taxa de {mainLabel} em Rio Claro evoluiu de <strong className="text-white">{(isObs ? DADOS_TEMPORAIS[0].obesidade : DADOS_TEMPORAIS[0].desnutricao).toFixed(2)}% (2018)</strong> para <strong className="text-white">{mainValue}% ({anoSelecionado})</strong>. O modelo preditivo projeta <strong className={mainColor}>{mainProj}% em 2027</strong>.
            </p>
          </div>
        </div>

        {/* Card de alerta */}
        <div className="bg-[#ffbb00]/10 border border-[#ffbb00]/20 rounded-2xl p-6 shadow-[0_10px_30px_rgba(255,187,0,0.1)]">
          <div className="flex items-start gap-4">
            <div className="bg-[#ffbb00]/20 p-3 rounded-xl border border-[#ffbb00]/30 shrink-0 shadow-[0_0_15px_rgba(255,187,0,0.3)]">
              <TrendingUp className="w-5 h-5 text-[#ffbb00]" />
            </div>
            <div>
              <p className="text-sm font-black text-[#ffbb00] mb-2 tracking-wide">Alerta de Projeção</p>
              <p className="text-xs text-white/70 leading-relaxed font-medium">
                O modelo detectou aceleração em 3 UBSs para 2026–2027. Intervenção preventiva é recomendada para as unidades <span className="text-white font-bold">Bela Vista</span> e <span className="text-white font-bold">Celestino Donato</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
