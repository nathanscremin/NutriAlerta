"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/store/useAppStore';
import { ALL_POIS, getVoronoiGeoJSON, UNIDADES_SAUDE } from '@/lib/mockData';
import { useMap } from 'react-leaflet';

// Leaflet não funciona com SSR e precisa de desmontagem segura
const MapContainer  = dynamic(() => import('react-leaflet').then(m => m.MapContainer),  { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false });
const GeoJSONLayer  = dynamic(() => import('react-leaflet').then(m => m.GeoJSON),       { ssr: false });
const CircleMarker  = dynamic(() => import('react-leaflet').then(m => m.CircleMarker),  { ssr: false });
const Popup         = dynamic(() => import('react-leaflet').then(m => m.Popup),         { ssr: false });
const Tooltip       = dynamic(() => import('react-leaflet').then(m => m.Tooltip),       { ssr: false });

const BASE_STYLE = {
  fillColor: '#0f172a',
  weight: 1,
  opacity: 0.8,
  color: 'rgba(255,255,255,0.15)',
  fillOpacity: 0.4,
};
const HOVER_STYLE = { weight: 2, color: '#38bdf8', fillOpacity: 0.7 };
const ACTIVE_STYLE = { weight: 2, color: '#00ff9d', fillOpacity: 0.6 };

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
  const { activePoiTypes, selectedBairro, setSelectedBairro, setSelectedPoi } = useAppStore();

  useEffect(() => {
    setMounted(true);
    // Use dynamically generated Voronoi grid based on UBS coordinates
    setBairros(getVoronoiGeoJSON());
    return () => setMounted(false);
  }, []);

  const getFeatureStyle = (feature: any) => {
    if (selectedBairro && feature.properties?.nome_bairro === selectedBairro) {
      return ACTIVE_STYLE;
    }
    return BASE_STYLE;
  };

  const onEachFeature = (feature: any, layer: any) => {
    const nome = feature.properties?.nome_bairro || 'Desconhecido';
    
    layer.on({
      mouseover: (e: any) => { 
        if (selectedBairro !== nome) {
          e.target.setStyle(HOVER_STYLE); 
          e.target.bringToFront(); 
        }
      },
      mouseout:  (e: any) => { 
        if (selectedBairro !== nome) {
          e.target.setStyle(BASE_STYLE); 
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
      `<div class="font-semibold text-slate-200 text-xs">${nome}</div>`,
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

  return (
    <>
      <style>{`
        .custom-glass-tooltip {
          background: rgba(15, 23, 42, 0.85) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          box-shadow: 0 10px 20px rgba(0,0,0,0.4) !important;
          color: white !important;
          border-radius: 8px !important;
          padding: 5px 10px !important;
        }
        .custom-glass-tooltip::before { display: none !important; }
        .leaflet-container { background: #080c14 !important; }
      `}</style>
      <div className="h-full w-full">
        <MapContainer
          center={[-22.405, -47.555]}
          zoom={13}
          style={{ height: '100%', width: '100%', background: '#080c14' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapController />
          {bairros && (
            <GeoJSONLayer
              key={`base-map-${selectedBairro}`} // Re-render to apply styles when selectedBairro changes
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
                  click: () => setSelectedPoi(poi),
                }}
              >
                <Tooltip direction="top" className="custom-glass-tooltip" sticky>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-white text-xs">{poi.nome}</span>
                    <span className="text-[10px] text-white/50">{poi.categoria}</span>
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
