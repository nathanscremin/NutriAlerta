"use client";
import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MERCADOS_GERAIS, RESTAURANTES_GERAIS, ESPORTE_LAZER, AMBIENTE_OBESOGENICO } from '@/lib/mockData';
import { useAppStore } from '@/store/useAppStore';

export default function ConflictMap() {
  const { darkMode } = useAppStore();
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
          white-space: normal !important;
        }
        .custom-glass-tooltip::before { display: none !important; }
        .leaflet-container { background: ${mapBackground} !important; }
      `}</style>
      <MapContainer
        center={[-22.405, -47.565]}
        zoom={13}
        minZoom={10}
        maxZoom={18}
        style={{ height: '100%', width: '100%', background: mapBackground }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          key={darkMode ? 'dark-tiles' : 'light-tiles'}
          url={darkMode 
            ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          }
          attribution=""
        />

        {/* Ambiente Obesogênico — vermelho */}
        {AMBIENTE_OBESOGENICO.map((p, i) => (
          <CircleMarker
            key={`risco-${i}`}
            center={[p.lat, p.lon]}
            radius={7}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.8, weight: 1 }}
          >
            <Tooltip className="custom-glass-tooltip">
              <div className="min-w-[140px] max-w-[200px] font-sans">
                <span className="text-xs font-bold text-slate-800 dark:text-[#f5f5f7] block truncate" title={p.nome}>{p.nome}</span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold block mt-0.5">{p.tipo}</span>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Mercados / Oásis alimentares — verde */}
        {MERCADOS_GERAIS.map((p, i) => (
          <CircleMarker
            key={`mercado-${i}`}
            center={[p.lat, p.lon]}
            radius={6}
            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.8, weight: 1 }}
          >
            <Tooltip className="custom-glass-tooltip">
              <div className="min-w-[140px] max-w-[200px] font-sans">
                <span className="text-xs font-bold text-slate-800 dark:text-[#f5f5f7] block truncate" title={p.nome}>{p.nome}</span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold block mt-0.5">{p.tipo}</span>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Restaurantes (Saudável) — teal */}
        {RESTAURANTES_GERAIS.map((p, i) => (
          <CircleMarker
            key={`restaurante-${i}`}
            center={[p.lat, p.lon]}
            radius={6}
            pathOptions={{ color: '#0d9488', fillColor: '#0d9488', fillOpacity: 0.8, weight: 1 }}
          >
            <Tooltip className="custom-glass-tooltip">
              <div className="min-w-[140px] max-w-[200px] font-sans">
                <span className="text-xs font-bold text-slate-800 dark:text-[#f5f5f7] block truncate" title={p.nome}>{p.nome}</span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold block mt-0.5">{p.tipo}</span>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Parques e Esportes — azul/ciano */}
        {ESPORTE_LAZER.filter(p => ['park', 'fitness_station'].includes(p.tipo)).map((p, i) => (
          <CircleMarker
            key={`esporte-${i}`}
            center={[p.lat, p.lon]}
            radius={5}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.7, weight: 1 }}
          >
            <Tooltip className="custom-glass-tooltip">
              <div className="min-w-[140px] max-w-[200px] font-sans">
                <span className="text-xs font-bold text-slate-800 dark:text-[#f5f5f7] block truncate" title={p.nome}>{p.nome}</span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold block mt-0.5">{p.tipo}</span>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </>
  );
}
