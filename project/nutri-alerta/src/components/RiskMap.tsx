"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/store/useAppStore';
import { ALL_POIS, getVoronoiGeoJSON, UNIDADES_SAUDE, getVirtualAnchor } from '@/lib/mockData';
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
    const anchor = getVirtualAnchor(u.nome, u.lat, u.lon);
    const dist = getDistance(lat, lon, anchor.lat, anchor.lon);
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
  const { selectedBairro } = useAppStore();
  
  useEffect(() => {
    if (selectedBairro) {
      const ubsInfo = UNIDADES_SAUDE.find(u => u.nome === selectedBairro);
      if (ubsInfo) {
        map.setView([ubsInfo.lat, ubsInfo.lon], 15, { animate: true, duration: 1.2 });
      }
    } else {
      map.setView([-22.405, -47.555], 13, { animate: true, duration: 1.2 });
    }
  }, [selectedBairro, map]);
  
  return null;
}

export default function RiskMap() {
  const [bairros, setBairros] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const { 
    activePoiTypes, selectedBairro, setSelectedBairro, setSelectedPoi,
    indicador, anoSelecionado, regionalData, darkMode
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

    const isActive = selectedBairro && nome === selectedBairro;
    
    return {
      fillColor,
      weight: isActive ? 2.5 : 1,
      opacity: 0.9,
      color: isActive ? '#0d9488' : (darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.1)'),
      fillOpacity: selectedBairro ? (isActive ? 0.8 : 0.25) : 0.6,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const nome = feature.properties?.nome_bairro || 'Desconhecido';
    const { des, obs, sob, eut } = getBairroMetrics(nome);

    layer.on({
      mouseover: (e: any) => { 
        if (selectedBairro !== nome) {
          const baseStyle = getFeatureStyle(feature);
          e.target.setStyle({
            ...baseStyle,
            weight: 2,
            color: '#0d9488',
            fillOpacity: 0.7
          }); 
          e.target.bringToFront(); 
        }
      },
      mouseout:  (e: any) => { 
        if (selectedBairro !== nome) {
          e.target.setStyle(getFeatureStyle(feature)); 
        }
      },
      click: () => { 
        if (nome === selectedBairro) {
          setSelectedBairro(null);
        } else {
          setSelectedBairro(nome);
        }
      },
    });
    
    let tooltipContent = '';
    if (indicador === 'global') {
      tooltipContent = `
        <div class="p-1 font-sans space-y-2">
          <div class="font-extrabold text-[12px] border-b border-slate-200 dark:border-zinc-700/80 pb-1.5 mb-2 flex items-center justify-between gap-4">
            <span class="text-slate-800 dark:text-[#f5f5f7]">${nome}</span>
            <span class="text-[8px] uppercase tracking-wider bg-teal-100/50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded font-black border border-teal-200/30">Visão Global</span>
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
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
        <div class="font-sans">
          <div class="font-extrabold text-xs text-slate-800 dark:text-[#f5f5f7] mb-1">${nome}</div>
          <div class="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
            ${label}: <strong class="${colorClass} font-mono font-black">${activeVal.toFixed(2)}%</strong>
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
          border-radius: 8px !important;
          padding: 5px 10px !important;
          font-weight: 600 !important;
        }
        .custom-glass-tooltip::before { display: none !important; }
        .leaflet-container { background: ${mapBackground} !important; }
      `}</style>
      <div className="h-full w-full">
        <MapContainer
          center={[-22.405, -47.555]}
          zoom={13}
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

          {/* Markers para Pontos de Interesse */}
          {visiblePois.map((poi) => {
            const isGov = ['UBS', 'Pronto-Atendimento', 'Saúde Mental', 'Vigilância Sanitária'].includes(poi.categoria);
            const radius = isGov ? 8 : 4;
            const opacity = isGov ? 1.0 : 0.6;
            
            return (
              <CircleMarker
                key={poi.id}
                center={[poi.lat, poi.lon]}
                radius={radius}
                color={poi.color}
                weight={1}
                fillColor={poi.color}
                fillOpacity={opacity}
                eventHandlers={{
                  click: () => {
                    setSelectedPoi(poi);
                    if (poi.categoria === 'UBS') {
                      if (selectedBairro === poi.nome) {
                        setSelectedBairro(null);
                      } else {
                        setSelectedBairro(poi.nome);
                      }
                    } else if (isGov) {
                      const nearestUbs = findNearestUbsName(poi.lat, poi.lon);
                      if (nearestUbs) {
                        if (selectedBairro === nearestUbs) {
                          setSelectedBairro(null);
                        } else {
                          setSelectedBairro(nearestUbs);
                        }
                      }
                    }
                  },
                }}
              >
                <Tooltip direction="top" className="custom-glass-tooltip" sticky>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-xs">{poi.nome}</span>
                    <span className="text-[10px] opacity-80 font-bold">{poi.categoria}</span>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </>
  );
}
