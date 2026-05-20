"use client";
import React from 'react';
import Sidebar from '@/components/Sidebar';
import RiskMap from '@/components/RiskMap';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, CartesianGrid, XAxis, YAxis, BarChart, Bar, ReferenceLine
} from 'recharts';
import { MOCK_DISTRIBUICAO, DADOS_TEMPORAIS, RANKING_ACELERACAO } from '@/lib/mockData';
import { TrendingUp, Users, Activity, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import UrbanConflictSection from '@/components/UrbanConflictSection';
import { useAppStore } from '@/store/useAppStore';

// ── Tooltip customizado com dados reais ──────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">{Number(p.value).toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
};

// ── KPI Card ─────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, trend, trendLabel, accentColor, bgColor, borderColor
}: {
  label: string; value: string; sub: string;
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string;
  accentColor: string; bgColor: string; borderColor: string;
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? 'text-rose-400' : trend === 'down' ? 'text-emerald-400' : 'text-slate-400';

  return (
    <div className={`relative rounded-2xl p-5 border ${bgColor} ${borderColor} overflow-hidden group transition-all hover:shadow-lg`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 -mr-8 -mt-8 ${accentColor.replace('text-', 'bg-')}`} />
      <p className="text-[10px] text-white/50 uppercase tracking-widest mb-2 font-black">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className={`text-4xl font-black tabular-nums ${accentColor} drop-shadow-md`}>{value}</h3>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${trendColor} bg-[#131823] px-2.5 py-1 rounded-lg border border-white/5 shadow-inner`}>
            <TrendIcon className="w-3 h-3" />{trendLabel}
          </div>
        )}
      </div>
      <p className="text-[10px] text-white/40 mt-2 leading-relaxed font-medium">{sub}</p>
    </div>
  );
}

export default function ExpertView() {
  const { 
    anoSelecionado, indicador, selectedPoi, selectedBairro, setSelectedPoi, faixaEtaria,
    temporalData, regionalData, yearsList, activePoiTypes
  } = useAppStore();

  // Multiplicadores dos POIs das camadas de infraestrutura (Simulação de Intervenção)
  const { multObs, multDes } = React.useMemo(() => {
    let mObs = 1.0;
    let mDes = 1.0;
    if (!activePoiTypes.includes('Alimentação - Restaurante/Fast-food')) {
      mObs *= 0.88; // Redução de 12% na obesidade ao controlar fast-food
    }
    if (!activePoiTypes.includes('Esporte e Lazer')) {
      mObs *= 1.10; // Aumento de 10% na obesidade se não houver parques/esportes
    }
    if (!activePoiTypes.includes('Alimentação - Mercado')) {
      mDes *= 1.15; // Aumento de 15% na desnutrição sem mercados saudáveis
      mObs *= 1.08; // Aumento de 8% na obesidade sem mercados saudáveis
    }
    if (!activePoiTypes.includes('Educação')) {
      mDes *= 1.05; // Aumento de 5% se não houver escolas/campanhas
      mObs *= 1.05; // Aumento de 5% se não houver escolas/campanhas
    }
    return { multObs: mObs, multDes: mDes };
  }, [activePoiTypes]);

  // Dado temporal reativo com fallback para métricas gerais e efeito dos POIs
  const activeTemporalData = React.useMemo(() => {
    const baseSource = selectedBairro ? yearsList.map(yr => {
      const cleanYr = yr.replace('★', '').trim();
      const yrRecord = regionalData[cleanYr]?.[selectedBairro];
      const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYr) || { desnutricao: 0, obesidade: 0 };
      
      return {
        ano: yr,
        desnutricao: yrRecord && yrRecord.desnutricao ? yrRecord.desnutricao : globalRec.desnutricao,
        obesidade: yrRecord && yrRecord.obesidade ? yrRecord.obesidade : globalRec.obesidade,
        isPrevisao: Number(cleanYr) >= 2026
      };
    }) : temporalData;

    return baseSource.map(d => ({
      ...d,
      desnutricao: Number((d.desnutricao * multDes).toFixed(2)),
      obesidade: Number((d.obesidade * multObs).toFixed(2))
    }));
  }, [selectedBairro, temporalData, yearsList, regionalData, multDes, multObs]);

  // Encontra os dados do ano selecionado
  const dadosAno = activeTemporalData.find(d => d.ano === anoSelecionado) || activeTemporalData[0] || { desnutricao: 0, obesidade: 0 };
  // Pega a projeção de 2027
  const dadosProj = activeTemporalData.find(d => d.ano === '2027 ★') || activeTemporalData.find(d => d.ano.includes('2027')) || activeTemporalData[activeTemporalData.length - 1] || { desnutricao: 0, obesidade: 0 };

  // Configuração baseada no indicador selecionado
  const isObs = indicador === 'obesidade';
  const mainValue = Number((isObs ? dadosAno.obesidade : dadosAno.desnutricao).toFixed(2));
  const mainProj = Number((isObs ? dadosProj.obesidade : dadosProj.desnutricao).toFixed(2));
  const secondaryValue = Number((isObs ? dadosAno.desnutricao : dadosAno.obesidade).toFixed(2));
  const delta = (mainProj - mainValue).toFixed(2);
  const isAlta = Number(delta) > 0;

  const mainColor = indicador === 'desnutricao' ? 'text-[#00e5ff]' : indicador === 'sobrepeso' ? 'text-[#ffbb00]' : 'text-[#ff3366]';
  const mainBg = indicador === 'desnutricao' ? 'bg-[#00e5ff]/5' : indicador === 'sobrepeso' ? 'bg-[#ffbb00]/5' : 'bg-[#ff3366]/5';
  const mainBorder = indicador === 'desnutricao' ? 'border-[#00e5ff]/20' : indicador === 'sobrepeso' ? 'border-[#ffbb00]/20' : 'border-[#ff3366]/20';
  const mainLabel = indicador === 'desnutricao' ? 'Desnutrição' : indicador === 'sobrepeso' ? 'Sobrepeso' : 'Obesidade';

  const cleanYear = anoSelecionado.replace('★', '').trim();
  // Compute dynamic ranking from loaded regional data
  const currentYearRegions = regionalData && regionalData[cleanYear] 
    ? Object.values(regionalData[cleanYear]) 
    : [];

  const dynamicRanking = currentYearRegions.length > 0
    ? currentYearRegions
        .map((reg: any) => {
          const deltaVal = indicador === 'obesidade' 
            ? reg.delta_obesidade 
            : reg.delta_desnutricao;
          return {
            name: reg.nome.replace('UBS ', '').replace('USF ', ''),
            delta: typeof deltaVal === 'number' ? Number((deltaVal).toFixed(2)) : 0
          };
        })
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 5)
    : [
        { name: 'Chervezon', delta: 2.1 },
        { name: 'Vila Cristina', delta: 1.8 },
        { name: 'Wenzel', delta: 1.5 },
        { name: 'Bela Vista', delta: 1.2 },
        { name: 'Mãe Preta', delta: 0.9 }
      ];

  const currentBairroRecord = selectedBairro && regionalData[cleanYear]?.[selectedBairro];
  const avaliadosVal = selectedBairro 
    ? (currentBairroRecord ? (currentBairroRecord.total_avaliados ?? 0) : 0)
    : (anoSelecionado === '2025' ? 45200 : anoSelecionado === '2024' ? 41100 : 38500);

  const avaliadosStr = avaliadosVal >= 1000 
    ? `${(avaliadosVal / 1000).toFixed(1)}K` 
    : String(avaliadosVal);
  const avaliadosSub = selectedBairro 
    ? "Total de indivíduos avaliados nesta UBS" 
    : "Total acumulado nas 18 UBS de Rio Claro";

  // Compute dynamic distribution averages for selected year
  let eutrofiaAvg = 61.2;
  let sobrepesoAvg = 16.3;
  let obesidadeAvg = isObs ? mainValue : (dadosAno.obesidade || 12.93);
  let desnutricaoAvg = !isObs ? mainValue : (dadosAno.desnutricao || 2.62);
  let graveAvg = 6.95;

  if (selectedBairro && currentBairroRecord) {
    eutrofiaAvg = typeof currentBairroRecord.eutrofia === 'number' && currentBairroRecord.eutrofia > 0 ? Number(currentBairroRecord.eutrofia.toFixed(1)) : eutrofiaAvg;
    sobrepesoAvg = typeof currentBairroRecord.sobrepeso === 'number' && currentBairroRecord.sobrepeso > 0 ? Number(currentBairroRecord.sobrepeso.toFixed(1)) : sobrepesoAvg;
    obesidadeAvg = typeof currentBairroRecord.obesidade === 'number' && currentBairroRecord.obesidade > 0 ? Number(currentBairroRecord.obesidade.toFixed(1)) : obesidadeAvg;
    desnutricaoAvg = typeof currentBairroRecord.desnutricao === 'number' && currentBairroRecord.desnutricao > 0 ? Number(currentBairroRecord.desnutricao.toFixed(1)) : desnutricaoAvg;
    graveAvg = typeof currentBairroRecord.obesidade_grave === 'number' && currentBairroRecord.obesidade_grave > 0 ? Number(currentBairroRecord.obesidade_grave.toFixed(1)) : graveAvg;
  } else if (currentYearRegions.length > 0) {
    let sumEutrofia = 0, sumSobrepeso = 0, sumGrave = 0, count = 0;
    currentYearRegions.forEach((reg: any) => {
      if (typeof reg.eutrofia === 'number') {
        sumEutrofia += reg.eutrofia;
        sumSobrepeso += reg.sobrepeso || 0;
        sumGrave += reg.obesidade_grave || 0;
        count++;
      }
    });
    if (count > 0) {
      eutrofiaAvg = Number((sumEutrofia / count).toFixed(2));
      sobrepesoAvg = Number((sumSobrepeso / count).toFixed(2));
      graveAvg = Number((sumGrave / count).toFixed(2));
      obesidadeAvg = Number((dadosAno.obesidade).toFixed(2));
      desnutricaoAvg = Number((dadosAno.desnutricao).toFixed(2));
    }
  }

  // Aplicamos os multiplicadores dos POIs na desnutrição, obesidade e obesidade grave
  obesidadeAvg = Number((obesidadeAvg * multObs).toFixed(2));
  desnutricaoAvg = Number((desnutricaoAvg * multDes).toFixed(2));
  graveAvg = Number((graveAvg * multObs).toFixed(2));

  // Normalização para a soma ser exatamente 100%
  const totalSum = eutrofiaAvg + sobrepesoAvg + obesidadeAvg + desnutricaoAvg + graveAvg;
  if (totalSum > 0) {
    eutrofiaAvg = Number((eutrofiaAvg / totalSum * 100).toFixed(1));
    sobrepesoAvg = Number((sobrepesoAvg / totalSum * 100).toFixed(1));
    obesidadeAvg = Number((obesidadeAvg / totalSum * 100).toFixed(1));
    desnutricaoAvg = Number((desnutricaoAvg / totalSum * 100).toFixed(1));
    graveAvg = Number((graveAvg / totalSum * 100).toFixed(1));
  }

  const cleanSelectedBairro = selectedBairro
    ? selectedBairro.replace('UBS ', '').replace('USF ', '')
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#0B0E14]"
    >
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Cabeçalho da view ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Rio Claro — Painel Epidemiológico</h2>
            <p className="text-xs text-white/50 mt-1 font-medium">SISVAN · Faixa {faixaEtaria === '0-10' ? '0 a 10' : '10 a 18'} anos · Filtro Ativo: {anoSelecionado}</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#00ff9d] font-bold bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-lg px-3 py-2 shadow-[0_0_15px_rgba(0,255,157,0.1)]">
            <span className="w-2 h-2 rounded-full bg-[#00ff9d] shadow-[0_0_8px_rgba(0,255,157,1)] animate-pulse" />
            LIVE DATA: SISVAN 2025
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label={`Avaliados (${anoSelecionado})`}
            value={avaliadosStr}
            sub={avaliadosSub}
            accentColor="text-white"
            bgColor="bg-[#131823]"
            borderColor="border-white/5"
          />
          <KpiCard
            label={`${mainLabel} · ${anoSelecionado}`}
            value={`${mainValue}%`}
            sub={`Média entre as UBS · SISVAN real`}
            trend={isAlta ? "up" : "down"}
            trendLabel={`${Number(delta) > 0 ? '+' : ''}${delta} p.p. em 2027`}
            accentColor={mainColor}
            bgColor={mainBg}
            borderColor={mainBorder}
          />
          <KpiCard
            label={`Projeção ${mainLabel} · 2027`}
            value={`${mainProj}%`}
            sub="★ Modelo preditivo de Machine Learning"
            trend={isAlta ? "up" : "down"}
            trendLabel={isAlta ? "alta gradual" : "queda leve"}
            accentColor="text-[#ffbb00]"
            bgColor="bg-[#ffbb00]/5"
            borderColor="border-[#ffbb00]/20"
          />
          <KpiCard
            label={`${isObs ? 'Desnutrição' : 'Obesidade'} · ${anoSelecionado}`}
            value={`${secondaryValue}%`}
            sub="Outro indicador acompanhado · SISVAN"
            trend="neutral"
            trendLabel="estável"
            accentColor="text-white/70"
            bgColor="bg-[#131823]"
            borderColor="border-white/5"
          />
        </div>

        {/* ── Mapa + Donut ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6" style={{ height: '360px' }}>

          {/* Mapa choropleth */}
          <div className="md:col-span-3 bg-[#131823] border border-white/5 rounded-2xl overflow-hidden relative shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
              <span className="text-[10px] font-black text-white/80 uppercase tracking-widest bg-[#0B0E14]/80 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-xl inline-block w-fit">
                Mapa de Risco por Região
              </span>
              {selectedBairro && (
                <span className="text-[10px] font-bold text-[#00ff9d] uppercase tracking-widest bg-[#0B0E14]/80 px-3 py-1.5 rounded-lg backdrop-blur-md border border-[#00ff9d]/30 shadow-xl inline-block w-fit">
                  📍 {selectedBairro}
                </span>
              )}
            </div>

            {selectedPoi && (
              <div className="absolute bottom-4 left-4 z-[400] bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl w-64 animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-white leading-tight pr-4">{selectedPoi.nome}</h4>
                  <button onClick={() => setSelectedPoi(null)} className="text-white/40 hover:text-white transition-colors font-bold text-lg leading-none -mt-1">×</button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedPoi.color }} />
                  <span className="text-[10px] text-white/60 font-medium uppercase tracking-wider">{selectedPoi.categoria}</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed mb-3">
                  Ponto de interesse integrado via motor de geoprocessamento. Pronto para análise pelo modelo de IA.
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-white/5 hover:bg-white/10 text-[10px] text-white font-bold py-1.5 rounded-lg border border-white/5 transition-colors">
                    Detalhes
                  </button>
                  <button className="flex-1 bg-[#00ff9d]/10 hover:bg-[#00ff9d]/20 text-[10px] text-[#00ff9d] font-bold py-1.5 rounded-lg border border-[#00ff9d]/20 transition-colors">
                    Simular
                  </button>
                </div>
              </div>
            )}

            <RiskMap />
          </div>

          {/* Distribuição Nutricional */}
          <div className="md:col-span-2 bg-[#131823] border border-white/5 rounded-2xl p-6 flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="mb-4">
              <h3 className="text-sm font-black text-white tracking-wide">
                {selectedBairro ? `Distribuição em ${selectedBairro}` : 'Distribuição Nutricional'}
              </h3>
              <p className="text-[10px] text-white/40 font-medium">
                {selectedBairro ? `${selectedBairro}` : 'Rio Claro'} · SISVAN {anoSelecionado} · Faixa {faixaEtaria === '0-10' ? '0 a 10' : '10 a 18'} anos
              </p>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Peso Adequado', value: eutrofiaAvg, fill: '#00ff9d' },
                      { name: 'Sobrepeso', value: sobrepesoAvg, fill: '#ffbb00' },
                      { name: 'Obesidade', value: obesidadeAvg, fill: '#ff3366' },
                      { name: 'Magreza', value: desnutricaoAvg, fill: '#00e5ff' },
                      { name: 'Obesidade Grave', value: graveAvg, fill: '#9900ff' }
                    ]}
                    innerRadius="58%"
                    outerRadius="80%"
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0B0E14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(v: any, n: any) => [`${v}%`, n]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', paddingTop: '10px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Série Temporal + Ranking ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ minHeight: '280px' }}>

          {/* Gráfico temporal */}
          <div className="bg-[#131823] border border-white/5 rounded-2xl p-6 flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="mb-4">
              <h3 className="text-sm font-black text-white tracking-wide">
                {selectedBairro ? `Evolução em ${selectedBairro}` : 'Evolução Histórica e Projeção'}
              </h3>
              <p className="text-[10px] text-white/40 font-medium">
                Destaque para: <span className="text-white font-bold">{mainLabel}</span> &nbsp;·&nbsp;
                {selectedBairro ? <span className="text-white/60 font-bold">{selectedBairro} &nbsp;·&nbsp;</span> : null}
                <span className="text-[#ffbb00]">★ 2026–2027</span>
              </p>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeTemporalData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="ano" stroke="rgba(255,255,255,0.1)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} unit="%" />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    x="2025"
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="4 3"
                    label={{ value: 'Projeção →', fill: 'rgba(255,255,255,0.3)', fontSize: 9, position: 'insideTopRight', fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    name="% Obesidade"
                    dataKey="obesidade"
                    stroke="#ff3366"
                    strokeWidth={isObs ? 3 : 1.5}
                    strokeOpacity={isObs ? 1 : 0.3}
                    dot={(props: any) => props.payload.isPrevisao
                      ? <circle cx={props.cx} cy={props.cy} r={isObs ? 5 : 3} fill="none" stroke="#ff3366" strokeWidth={2} strokeDasharray="3 1" strokeOpacity={isObs ? 1 : 0.3} />
                      : <circle cx={props.cx} cy={props.cy} r={isObs ? 4 : 2} fill="#ff3366" strokeOpacity={isObs ? 1 : 0.3} />}
                    activeDot={{ r: 6, fill: '#fff', stroke: '#ff3366', strokeWidth: 3 }}
                  />
                  <Line
                    type="monotone"
                    name="% Desnutrição"
                    dataKey="desnutricao"
                    stroke="#00e5ff"
                    strokeWidth={!isObs ? 3 : 1.5}
                    strokeOpacity={!isObs ? 1 : 0.3}
                    dot={(props: any) => props.payload.isPrevisao
                      ? <circle cx={props.cx} cy={props.cy} r={!isObs ? 5 : 3} fill="none" stroke="#00e5ff" strokeWidth={2} strokeDasharray="3 1" strokeOpacity={!isObs ? 1 : 0.3} />
                      : <circle cx={props.cx} cy={props.cy} r={!isObs ? 4 : 2} fill="#00e5ff" strokeOpacity={!isObs ? 1 : 0.3} />}
                    activeDot={{ r: 6, fill: '#fff', stroke: '#00e5ff', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranking */}
          <div className="bg-[#131823] border border-white/5 rounded-2xl p-6 flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="mb-4">
              <h3 className="text-sm font-black text-white tracking-wide">Top 5 UBS · Aceleração de Risco</h3>
              <p className="text-[10px] text-white/40 font-medium">Delta percentual ano a ano · {mainLabel}</p>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicRanking} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' }}
                    width={110}
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ backgroundColor: '#0B0E14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(v: any) => [`+${v}%`, 'Delta']}
                  />
                  <Bar dataKey="delta" name="Delta (%)" radius={[0, 6, 6, 0]}>
                    {dynamicRanking.map((entry: any, i: number) => {
                      const isHighlighted = cleanSelectedBairro && entry.name.toLowerCase() === cleanSelectedBairro.toLowerCase();
                      return (
                        <Cell 
                          key={i} 
                          fill={isHighlighted 
                            ? '#00ff9d' 
                            : (i < 2 ? '#ff3366' : i < 4 ? '#ffbb00' : 'rgba(255,255,255,0.15)')
                          } 
                          stroke={isHighlighted ? '#ffffff' : 'none'}
                          strokeWidth={isHighlighted ? 1 : 0}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Seção: Conflito Urbano ── */}
        <UrbanConflictSection />

      </div>
    </motion.div>
  );
}
