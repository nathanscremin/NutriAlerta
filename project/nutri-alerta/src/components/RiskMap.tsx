"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/store/useAppStore';
import { ALL_POIS, getVoronoiGeoJSON, UNIDADES_SAUDE } from '@/lib/mockData';
import { useMap } from 'react-leaflet';

// Helper to calculate geographical proximity
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
}

// Map coordinates to standard frontend UBS names
function findNearestUbsName(lat: number, lon: number) {
  let nearest = null;
  let minDistance = Infinity;
  for (const u of UNIDADES_SAUDE) {
    if (u.categoria !== 'UBS') continue;
    const dist = getDistance(lat, lon, u.lat, u.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = u;
    }
  }
  return nearest ? nearest.nome : null;
}

// Leaflet não funciona com SSR e precisa de desmontagem segura
const MapContainer  = dynamic(() => import('react-leaflet').then(m => m.MapContainer),  { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false });
const GeoJSONLayer  = dynamic(() => import('react-leaflet').then(m => m.GeoJSON),       { ssr: false });
const CircleMarker  = dynamic(() => import('react-leaflet').then(m => m.CircleMarker),  { ssr: false });
const Tooltip       = dynamic(() => import('react-leaflet').then(m => m.Tooltip),       { ssr: false });

const getChoroplethColor = (value: number, indicator: string) => {
  if (indicator === 'desnutricao') {
    if (value < 1.5) return '#dbeafe';
    if (value < 2.5) return '#93c5fd';
    if (value < 3.5) return '#3b82f6';
    if (value < 4.5) return '#1d4ed8';
    return '#1e3a8a';
  } else if (indicator === 'eutrofia') {
    if (value < 55) return '#d1fae5';
    if (value < 60) return '#6ee7b7';
    if (value < 65) return '#10b981';
    if (value < 70) return '#047857';
    return '#064e3b';
  } else if (indicator === 'sobrepeso') {
    if (value < 12) return '#fef3c7';
    if (value < 15) return '#fcd34d';
    if (value < 18) return '#f59e0b';
    if (value < 21) return '#b45309';
    return '#78350f';
  } else {
    // Obesidade
    if (value < 7) return '#fee2e2';
    if (value < 10) return '#fca5a5';
    if (value < 13) return '#ef4444';
    if (value < 16) return '#b91c1c';
    return '#7f1d1d';
  }
};

function MapController() {
  const map = useMap();
  const { 
    analysisLevel, 
    selectedUbs, 
    selectedBairroName, 
    selectedSchoolName 
  } = useAppStore();
  
  useEffect(() => {
    if (analysisLevel === 'escola' && selectedSchoolName) {
      const schoolInfo = ALL_POIS.find(p => p.nome === selectedSchoolName);
      if (schoolInfo) {
        map.setView([schoolInfo.lat, schoolInfo.lon], 15, { animate: true, duration: 1.2 });
      }
    } else if (analysisLevel === 'bairro' && selectedBairroName) {
      const schoolInBairro = ALL_POIS.find(p => p.bairro === selectedBairroName);
      if (schoolInBairro) {
        map.setView([schoolInBairro.lat, schoolInBairro.lon], 14, { animate: true, duration: 1.2 });
      } else if (selectedUbs) {
        const ubsInfo = UNIDADES_SAUDE.find(u => u.nome === selectedUbs);
        if (ubsInfo) {
          map.setView([ubsInfo.lat, ubsInfo.lon], 14, { animate: true, duration: 1.2 });
        }
      }
    } else if (analysisLevel === 'ubs' && selectedUbs) {
      const ubsInfo = UNIDADES_SAUDE.find(u => u.nome === selectedUbs);
      if (ubsInfo) {
        map.setView([ubsInfo.lat, ubsInfo.lon], 14, { animate: true, duration: 1.2 });
      }
    } else {
      map.setView([-22.405, -47.555], 13, { animate: true, duration: 1.2 });
    }
  }, [analysisLevel, selectedUbs, selectedBairroName, selectedSchoolName, map]);
  
  return null;
}

export default function RiskMap() {
  const [bairros, setBairros] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const { 
    activePoiTypes, setSelectedPoi, indicador, anoSelecionado, regionalData, darkMode,
    analysisLevel, selectedUbs, selectedBairroName, selectedSchoolName, selectedBairro,
    setAnalysisLevel, setSelectedUbs, setSelectedBairroName, setSelectedSchoolName
  } = useAppStore();

  useEffect(() => {
    setMounted(true);
    // Use dynamically generated Voronoi grid based on UBS coordinates
    setBairros(getVoronoiGeoJSON());
    return () => setMounted(false);
  }, []);

  // Multiplicadores dos POIs das camadas de infraestrutura (Simulação de Intervenção)
  const { multObs, multDes } = React.useMemo(() => {
    let mObs = 1.0;
    let mDes = 1.0;
    if (!activePoiTypes.includes('Alimentação - Restaurante/Fast-food')) {
      mObs *= 0.88;
    }
    if (!activePoiTypes.includes('Esporte e Lazer')) {
      mObs *= 1.10;
    }
    if (!activePoiTypes.includes('Alimentação - Mercado')) {
      mDes *= 1.15;
      mObs *= 1.08;
    }
    if (!activePoiTypes.includes('Educação')) {
      mDes *= 1.05;
      mObs *= 1.05;
    }
    return { multObs: mObs, multDes: mDes };
  }, [activePoiTypes]);

  // Recupera métricas para o bairro ajustadas pelos POIs
  const getBairroMetrics = React.useCallback((nome: string) => {
    const cleanYear = anoSelecionado.replace('★', '').trim();
    const yearData = regionalData && regionalData[cleanYear] ? regionalData[cleanYear] : null;
    const regionRecord = yearData ? yearData[nome] : null;

    const dObs = regionRecord ? (regionRecord.obesidade || 0) : 12.93;
    const dDes = regionRecord ? (regionRecord.desnutricao || 0) : 2.62;
    const dSob = regionRecord ? (regionRecord.sobrepeso || 0) : 16.3;
    const dEut = regionRecord ? (regionRecord.eutrofia || 0) : 61.55;

    const scaleDes = Number((dDes * multDes).toFixed(2));
    const scaleObs = Number((dObs * multObs).toFixed(2));
    const scaleSob = Number((dSob * ((multObs + 1) / 2)).toFixed(2));
    const beforeSum = dDes + dObs + dSob;
    const afterSum = scaleDes + scaleObs + scaleSob;
    const eut = Math.max(10, Number((dEut - (afterSum - beforeSum)).toFixed(2)));

    return { des: scaleDes, obs: scaleObs, sob: scaleSob, eut };
  }, [anoSelecionado, regionalData, multDes, multObs]);

  const getFeatureStyle = (feature: any) => {
    const nome = feature.properties?.nome_bairro || 'Desconhecido';
    const { des, obs, sob, eut } = getBairroMetrics(nome);
    
    let riskValue = 0;
    if (indicador === 'desnutricao') riskValue = des;
    else if (indicador === 'sobrepeso') riskValue = sob;
    else if (indicador === 'eutrofia') riskValue = eut;
    else riskValue = obs;

    let fillColor = '';
    if (indicador === 'global') {
      const ratioDes = des / 2.62;
      const ratioObs = obs / 19.88;
      const ratioEut = eut / 61.55;

      if (ratioObs > 1.15 && ratioObs >= ratioDes) {
        fillColor = getChoroplethColor(obs, 'obesidade');
      } else if (ratioDes > 1.15 && ratioDes > ratioObs) {
        fillColor = getChoroplethColor(des, 'desnutricao');
      } else {
        fillColor = getChoroplethColor(eut, 'eutrofia');
      }
    } else {
      fillColor = getChoroplethColor(riskValue, indicador);
    }

    const nomeReal = feature.properties?.nome_real_bairro || nome;
    let isActive = false;
    if (analysisLevel === 'bairro') {
      isActive = !!(selectedBairroName && nomeReal === selectedBairroName);
    } else if (analysisLevel === 'ubs') {
      isActive = !!(selectedUbs && nome === selectedUbs);
    } else if (analysisLevel === 'escola') {
      const activeSchool = ALL_POIS.find(p => p.nome === selectedSchoolName);
      isActive = !!(activeSchool && activeSchool.bairro && nomeReal === activeSchool.bairro);
    }
    
    return {
      fillColor,
      weight: isActive ? 2.5 : 1,
      opacity: 0.9,
      color: isActive ? '#0d9488' : (darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.1)'),
      fillOpacity: (selectedBairroName || selectedUbs) ? (isActive ? 0.8 : 0.25) : 0.6,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const nome = feature.properties?.nome_bairro || 'Desconhecido';
    const nomeReal = feature.properties?.nome_real_bairro || nome;
    const { des, obs, sob, eut } = getBairroMetrics(nome);

    layer.on({
      mouseover: (e: any) => { 
        const isActiveThis = (analysisLevel === 'bairro' && selectedBairroName === nomeReal) ||
                             (analysisLevel === 'ubs' && selectedUbs === nome);
        if (!isActiveThis) {
          const baseStyle = getFeatureStyle(feature);
          e.target.setStyle({
            ...baseStyle,
            weight: 2,
            color: '#0d9488',
            fillOpacity: 0.7
          }); 
        }
      },
      mouseout:  (e: any) => { 
        const isActiveThis = (analysisLevel === 'bairro' && selectedBairroName === nomeReal) ||
                             (analysisLevel === 'ubs' && selectedUbs === nome);
        if (!isActiveThis) {
          e.target.setStyle(getFeatureStyle(feature)); 
        }
      },
      click: () => { 
        if (analysisLevel === 'bairro' && selectedBairroName === nomeReal) {
          setSelectedBairroName(null);
        } else {
          setSelectedUbs(nome || '');
          setSelectedBairroName(nomeReal);
        }
      },
    });

    let tooltipContent = '';
    if (indicador === 'global') {
      tooltipContent = `
        <div class="p-1.5 font-sans space-y-2.5 min-w-[340px] max-w-[520px]">
          <div class="font-extrabold text-[12px] border-b border-slate-200 dark:border-zinc-700/80 pb-1.5 mb-2 flex items-center justify-between gap-5 w-full">
            <div class="flex flex-col min-w-0" style="white-space: nowrap !important;">
              <span class="text-slate-800 dark:text-[#f5f5f7] font-extrabold" style="white-space: nowrap !important;">${nomeReal}</span>
              <span class="text-[9px] font-semibold text-slate-400 dark:text-zinc-550" style="white-space: nowrap !important;">Ref: ${nome}</span>
            </div>
            <span class="text-[8px] uppercase tracking-wider bg-teal-100/50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded font-black border border-teal-200/30 shrink-0">Visão Global</span>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px]">
            <div class="flex items-center justify-between gap-2.5">
              <span class="text-blue-500 font-bold">Desnutrição:</span>
              <strong class="text-blue-600 dark:text-blue-400 font-mono font-black">${des.toFixed(2)}%</strong>
            </div>
            <div class="flex items-center justify-between gap-2.5">
              <span class="text-emerald-500 font-bold">Peso Adeq.:</span>
              <strong class="text-emerald-600 dark:text-emerald-400 font-mono font-black">${eut.toFixed(2)}%</strong>
            </div>
            <div class="flex items-center justify-between gap-2.5">
              <span class="text-amber-500 font-bold">Sobrepeso:</span>
              <strong class="text-amber-600 dark:text-amber-400 font-mono font-black">${sob.toFixed(2)}%</strong>
            </div>
            <div class="flex items-center justify-between gap-2.5">
              <span class="text-red-500 font-bold">Obesidade:</span>
              <strong class="text-red-600 dark:text-red-400 font-mono font-black">${obs.toFixed(2)}%</strong>
            </div>
          </div>
        </div>
      `;
    } else {
      let activeVal = 0;
      let label = '';
      let colorClass = '';
      if (indicador === 'desnutricao') {
        activeVal = des;
        label = 'Desnutrição';
        colorClass = 'text-blue-500';
      } else if (indicador === 'sobrepeso') {
        activeVal = sob;
        label = 'Sobrepeso';
        colorClass = 'text-amber-500';
      } else if (indicador === 'eutrofia') {
        activeVal = eut;
        label = 'Peso Adequado';
        colorClass = 'text-emerald-500';
      } else {
        activeVal = obs;
        label = 'Obesidade';
        colorClass = 'text-red-500';
      }
      tooltipContent = `
        <div class="p-1.5 font-sans space-y-2.5 min-w-[300px] max-w-[460px]">
          <div class="border-b border-slate-100 dark:border-zinc-800/60 pb-1.5 mb-1.5 flex items-center justify-between gap-4 w-full">
            <div class="flex flex-col min-w-0" style="white-space: nowrap !important;">
              <div class="font-extrabold text-[12px] text-slate-800 dark:text-[#f5f5f7]" style="white-space: nowrap !important;">${nomeReal}</div>
              <div class="text-[9px] text-slate-450 dark:text-zinc-550" style="white-space: nowrap !important;">Ref: ${nome}</div>
            </div>
            <span class="text-[8px] uppercase tracking-wider bg-slate-100 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-black border border-slate-200/20 shrink-0">Indicador Ativo</span>
          </div>
          <div class="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex justify-between w-full">
            <span>${label}:</span>
            <strong class="${colorClass} font-mono font-black text-xs">${activeVal.toFixed(2)}%</strong>
          </div>
        </div>
      `;
    }

    layer.bindTooltip(
      tooltipContent,
      { className: 'custom-glass-tooltip', sticky: true, direction: 'auto' }
    );
  };

  const visiblePois = ALL_POIS.filter(poi => {
    if (activePoiTypes.includes('UBS')) {
      if (['UBS', 'Pronto-Atendimento', 'Saúde Mental', 'Vigilância Sanitária'].includes(poi.categoria)) return true;
    }
    return activePoiTypes.includes(poi.categoria as any);
  });

  if (!mounted) return null;

  const mapBackground = darkMode ? '#1c1c1e' : '#f8fafc';

  return (
    <>
      <style>{`
        .custom-glass-tooltip {
          background: ${darkMode ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)'} !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.25) !important;
          color: ${darkMode ? '#f5f5f7' : '#0f172a'} !important;
          border-radius: 4px !important;
          padding: 8px 14px !important;
          font-weight: 600 !important;
          white-space: nowrap !important;
          pointer-events: none !important;
        }
        .custom-glass-tooltip::before { display: none !important; }
        .leaflet-container { background: ${mapBackground} !important; }
      `}</style>
      <div className="h-full w-full">
        <MapContainer
          center={[-22.405, -47.555]}
          zoom={13}
          minZoom={10}
          maxZoom={18}
          style={{ height: '100%', width: '100%', background: mapBackground }}
          zoomControl={true}
        >
          <TileLayer
            key={darkMode ? 'dark-tiles' : 'light-tiles'}
            url={darkMode 
              ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            }
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapController />
          {bairros && (
            <GeoJSONLayer
              key={`base-map-${selectedBairro}-${anoSelecionado}-${Object.keys(regionalData).length}-${indicador}-${darkMode}`} // Re-render to apply styles when state changes
              data={bairros}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
            />
          )}

          {/* Markers para Pontos de Interesse (POIs) */}
          {visiblePois.map((poi) => {
            const isGov = ['UBS', 'Pronto-Atendimento', 'Saúde Mental', 'Vigilância Sanitária'].includes(poi.categoria);
            const isSchool = poi.categoria === 'Educação';
            
            const isSchoolSelected = isSchool && selectedSchoolName === poi.nome;
            const isUbsSelected = poi.categoria === 'UBS' && selectedUbs === poi.nome;
            const isPoiHighlighted = isSchoolSelected || isUbsSelected;
            
            const radius = isSchoolSelected ? 12 : (isGov ? 8 : (isUbsSelected ? 12 : 4));
            const weight = isPoiHighlighted ? 3 : 1;
            const markerColor = isPoiHighlighted ? '#0d9488' : poi.color;
            const opacity = isPoiHighlighted ? 1.0 : (isGov ? 1.0 : 0.6);
            const fillOpacity = isPoiHighlighted ? 0.95 : opacity;
            
            // Determina o bairro real e a região de UBS responsável pelo POI
            const pBairro = poi.bairro || '';
            const pRegiao = poi.regiao_ubs || findNearestUbsName(poi.lat, poi.lon) || '';
            
            // Busca as métricas epidemiológicas baseadas na região de UBS
            const metrics = pRegiao ? getBairroMetrics(pRegiao) : null;
            
            // Função auxiliar de fallback robusto para métricas individuais por escola
            const getValidMetric = (val: any, fallbackVal: number): number => {
              if (val === undefined || val === null || isNaN(Number(val))) {
                return fallbackVal;
              }
              return Number(val);
            };

            const schoolDes = isSchool ? getValidMetric(poi.desnutricao, metrics?.des ?? 2.62) : (metrics?.des ?? 2.62);
            const schoolObs = isSchool ? getValidMetric(poi.obesidade, metrics?.obs ?? 12.93) : (metrics?.obs ?? 12.93);
            const schoolSob = isSchool ? getValidMetric(poi.sobrepeso, metrics?.sob ?? 16.3) : (metrics?.sob ?? 16.3);
            const schoolEut = isSchool ? getValidMetric(poi.eutrofia, metrics?.eut ?? Math.max(0, 100 - schoolDes - schoolObs - schoolSob)) : (metrics?.eut ?? 61.55);

            // Determina a prevalência do indicador ativo para destacar no tooltip
            let activeVal = 0;
            let activeLabel = '';
            let colorClass = '';
            
            if (indicador === 'desnutricao') {
              activeVal = isSchool ? schoolDes : (metrics?.des ?? 0);
              activeLabel = 'Desnutrição';
              colorClass = 'text-blue-500 dark:text-blue-450';
            } else if (indicador === 'sobrepeso') {
              activeVal = isSchool ? schoolSob : (metrics?.sob ?? 0);
              activeLabel = 'Sobrepeso';
              colorClass = 'text-amber-500 dark:text-amber-450';
            } else if (indicador === 'eutrofia') {
              activeVal = isSchool ? schoolEut : (metrics?.eut ?? 0);
              activeLabel = 'Peso Adequado';
              colorClass = 'text-emerald-500 dark:text-emerald-450';
            } else { // default ou 'obesidade'
              activeVal = isSchool ? schoolObs : (metrics?.obs ?? 0);
              activeLabel = 'Obesidade';
              colorClass = 'text-red-500 dark:text-red-450';
            }

            return (
              <CircleMarker
                key={poi.id}
                center={[poi.lat, poi.lon]}
                radius={radius}
                color={markerColor}
                weight={weight}
                fillColor={poi.color}
                fillOpacity={fillOpacity}
                pane="markerPane"
                eventHandlers={{
                  click: () => {
                    setSelectedPoi(poi);
                    if (isSchool) {
                      if (analysisLevel === 'escola' && selectedSchoolName === poi.nome) {
                        setSelectedSchoolName(null);
                      } else {
                        setSelectedUbs(pRegiao || null);
                        setSelectedBairroName(pBairro || null);
                        setSelectedSchoolName(poi.nome);
                      }
                    } else if (poi.categoria === 'UBS') {
                      if (analysisLevel === 'ubs' && selectedUbs === poi.nome) {
                        setSelectedUbs(null);
                      } else {
                        setSelectedUbs(poi.nome);
                      }
                    } else if (isGov) {
                      if (pRegiao) {
                        if (analysisLevel === 'ubs' && selectedUbs === pRegiao) {
                          setSelectedUbs(null);
                        } else {
                          setSelectedUbs(pRegiao);
                        }
                      }
                    }
                  },
                }}
              >
                <Tooltip direction="top" className="custom-glass-tooltip" sticky>
                  {isSchool ? (
                    // Formato detalhado para Escolas (Bolinhas de Educação) com métricas individuais da escola
                    <div className="p-1.5 font-sans space-y-1.5 min-w-[210px] max-w-[280px]">
                      <div className="font-extrabold text-[12px] border-b border-slate-200/80 dark:border-zinc-700/80 pb-1 flex items-center justify-between gap-3 w-full">
                        <span className="text-slate-800 dark:text-[#f5f5f7] block truncate flex-1 min-w-0" title={poi.nome}>
                          {poi.nome}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-black border border-blue-200/30 shrink-0">
                          Escola
                        </span>
                      </div>
                      
                      {pBairro && (
                        <div className="text-[9px] text-slate-450 dark:text-zinc-500 font-semibold flex justify-between gap-2 w-full">
                          <span className="shrink-0 text-slate-400">Bairro:</span>
                          <span className="text-slate-600 dark:text-zinc-350 font-bold block truncate flex-1 text-right min-w-0" title={pBairro}>
                            {pBairro}
                          </span>
                        </div>
                      )}

                      {pRegiao && (
                        <div className="text-[9px] text-slate-450 dark:text-zinc-500 font-semibold flex justify-between gap-2 w-full">
                          <span className="shrink-0 text-slate-400">Região:</span>
                          <span className="text-slate-600 dark:text-zinc-350 font-bold block truncate flex-1 text-right min-w-0" title={pRegiao}>
                            {pRegiao}
                          </span>
                        </div>
                      )}

                      {indicador === 'global' ? (
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[9px] pt-1.5 border-t border-slate-100 dark:border-zinc-800/60 w-full font-sans">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-blue-500 font-bold">Desn.:</span>
                            <strong className="text-blue-600 dark:text-blue-400 font-mono font-black">{schoolDes.toFixed(1)}%</strong>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-emerald-500 font-bold">Eutr.:</span>
                            <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-black">{schoolEut.toFixed(1)}%</strong>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-amber-500 font-bold">Sob.:</span>
                            <strong className="text-amber-600 dark:text-amber-400 font-mono font-black">{schoolSob.toFixed(1)}%</strong>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-red-500 font-bold">Obes.:</span>
                            <strong className="text-red-600 dark:text-red-400 font-mono font-black">{schoolObs.toFixed(1)}%</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 dark:border-zinc-800/60 w-full">
                          <span className="text-slate-550 dark:text-zinc-450 font-bold">{activeLabel}:</span>
                          <strong className={`${colorClass} font-mono font-black text-xs`}>{activeVal.toFixed(2)}%</strong>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Formato simplificado e focado para infraestruturas urbanas
                    <div className="p-1 font-sans space-y-1 min-w-[180px] max-w-[240px]">
                      <div className="flex items-center justify-between gap-2.5 w-full">
                        <span className="font-extrabold text-[11px] text-slate-800 dark:text-[#f5f5f7] block truncate flex-1 min-w-0" title={poi.nome}>
                          {poi.nome}
                        </span>
                        <span className="text-[8px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                          {poi.categoria}
                        </span>
                      </div>
                      
                      {pRegiao && metrics && (
                        <div className="border-t border-slate-100 dark:border-zinc-800/60 pt-1 flex flex-col gap-0.5 w-full">
                          <div className="text-[8px] text-slate-400 dark:text-zinc-550 uppercase tracking-wider font-black block truncate w-full" title={pRegiao}>
                            Prevalência na Região ({pRegiao})
                          </div>
                          <div className="text-[10px] font-bold text-slate-600 dark:text-zinc-350 mt-0.5 w-full flex justify-between">
                            {indicador === 'global' ? (
                              <>
                                <span className="text-slate-550 dark:text-zinc-400 font-semibold">Obesidade:</span>
                                <strong className="text-red-500 dark:text-red-405 font-mono font-black">{metrics.obs.toFixed(1)}%</strong>
                              </>
                            ) : (
                              <>
                                <span className="text-slate-550 dark:text-zinc-400 font-semibold">{activeLabel}:</span>
                                <strong className={`${colorClass} font-mono font-black`}>{activeVal.toFixed(2)}%</strong>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </>
  );
}
