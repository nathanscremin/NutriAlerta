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
    if (value < 2.0) return '#a7f3d0'; // Soft emerald
    if (value < 3.2) return '#bae6fd'; // Soft sky blue
    return '#7dd3fc'; // Warning blue
  } else if (indicator === 'sobrepeso') {
    if (value < 12) return '#a7f3d0'; // Soft emerald
    if (value < 18) return '#fde68a'; // Soft yellow/amber
    return '#fed7aa'; // Soft orange
  } else {
    // Obesidade
    if (value < 8) return '#a7f3d0'; // Soft emerald
    if (value < 13.5) return '#fde68a'; // Soft yellow/amber
    return '#fca5a5'; // Soft red/rose
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

  const getFeatureStyle = (feature: any) => {
    const nome = feature.properties?.nome_bairro || 'Desconhecido';
    
    // Look up dynamic ML/historical risk value
    const cleanYear = anoSelecionado.replace('★', '').trim();
    const yearData = regionalData && regionalData[cleanYear] ? regionalData[cleanYear] : null;
    const regionRecord = yearData ? yearData[nome] : null;
    
    let riskValue = 0;
    if (indicador === 'desnutricao') {
      riskValue = regionRecord ? (regionRecord.desnutricao || 0) : 2.62;
      riskValue = Number((riskValue * multDes).toFixed(2));
    } else if (indicador === 'sobrepeso') {
      riskValue = regionRecord ? (regionRecord.sobrepeso || 0) : 16.3;
      riskValue = Number((riskValue * multObs).toFixed(2));
    } else {
      riskValue = regionRecord ? (regionRecord.obesidade || 0) : 12.93;
      riskValue = Number((riskValue * multObs).toFixed(2));
    }

    const fillColor = getChoroplethColor(riskValue, indicador);
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
    
    layer.bindTooltip(
      `<div class="font-bold text-xs">${nome}</div>`,
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
