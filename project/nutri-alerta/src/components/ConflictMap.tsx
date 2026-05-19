"use client";
import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MERCADOS_GERAIS, ESPORTE_LAZER, AMBIENTE_OBESOGENICO } from '@/lib/mockData';

export default function ConflictMap() {
  return (
    <MapContainer
      center={[-22.405, -47.565]}
      zoom={13}
      style={{ height: '100%', width: '100%', background: '#080c14' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {/* Ambiente Obesogênico — vermelho */}
      {AMBIENTE_OBESOGENICO.map((p, i) => (
        <CircleMarker
          key={`risco-${i}`}
          center={[p.lat, p.lon]}
          radius={7}
          pathOptions={{ color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 0.85, weight: 1 }}
        >
          <Tooltip>
            <span className="text-xs font-semibold">{p.nome}</span><br />
            <span className="text-[10px] text-slate-400">{p.tipo}</span>
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Mercados / Oásis alimentares — verde */}
      {MERCADOS_GERAIS.map((p, i) => (
        <CircleMarker
          key={`mercado-${i}`}
          center={[p.lat, p.lon]}
          radius={6}
          pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.85, weight: 1 }}
        >
          <Tooltip>
            <span className="text-xs font-semibold">{p.nome}</span><br />
            <span className="text-[10px] text-slate-400">{p.tipo}</span>
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Parques e Esportes — azul/ciano */}
      {ESPORTE_LAZER.filter(p => ['park', 'fitness_station'].includes(p.tipo)).map((p, i) => (
        <CircleMarker
          key={`esporte-${i}`}
          center={[p.lat, p.lon]}
          radius={5}
          pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.7, weight: 1 }}
        >
          <Tooltip>
            <span className="text-xs font-semibold">{p.nome}</span><br />
            <span className="text-[10px] text-slate-400">{p.tipo}</span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
