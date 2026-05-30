"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/store/useAppStore';
import { getSeverityLevel } from '@/lib/nutritionUtils';
import { TILE_URL_DARK, TILE_URL_LIGHT, RIO_CLARO_CENTER } from '@/lib/mapConfig';
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
    if (value < 1.5) return '#bfdbfe';
    if (value < 2.5) return '#93c5fd';
    if (value < 3.5) return '#3b82f6';
    if (value < 4.5) return '#1d4ed8';
    return '#1e3a8a';
  } else if (indicator === 'magreza') {
    if (value < 12) return '#bae6fd';
    if (value < 15) return '#7dd3fc';
    if (value < 18) return '#38bdf8';
    if (value < 21) return '#0ea5e9';
    return '#0369a1';
  } else if (indicator === 'eutrofia') {
    if (value < 55) return '#064e3b';
    if (value < 60) return '#047857';
    if (value < 65) return '#10b981';
    if (value < 70) return '#6ee7b7';
    return '#a7f3d0';
  } else if (indicator === 'sobrepeso') {
    if (value < 12) return '#fde68a';
    if (value < 15) return '#fcd34d';
    if (value < 18) return '#f59e0b';
    if (value < 21) return '#b45309';
    return '#78350f';
  } else {
    // Obesidade
    if (value < 7) return '#fecaca';
    if (value < 10) return '#fca5a5';
    if (value < 13) return '#ef4444';
    if (value < 16) return '#b91c1c';
    return '#7f1d1d';
  }
};



const indicatorLabels = {
  desnutricao: 'Desnutrição',
  magreza: 'Magreza',
  sobrepeso: 'Sobrepeso',
  obesidade: 'Obesidade',
  eutrofia: 'Peso Adequado',
  global: 'Visão Global'
} as const;

const getIndicatorLegend = (indicator: string, darkMode?: boolean) => {
  if (indicator === 'global') {
    return [
      ['Foco Geral (Consolidado)', darkMode ? '#27272a' : '#ffffff']
    ];
  }

  if (indicator === 'desnutricao') {
    return [
      ['< 1,5%', '#bfdbfe'],
      ['1,5% – 2,5%', '#93c5fd'],
      ['2,5% – 3,5%', '#3b82f6'],
      ['3,5% – 4,5%', '#1d4ed8'],
      ['≥ 4,5%', '#1e3a8a']
    ];
  }

  if (indicator === 'magreza') {
    return [
      ['< 12%', '#bae6fd'],
      ['12% – 15%', '#7dd3fc'],
      ['15% – 18%', '#38bdf8'],
      ['18% – 21%', '#0ea5e9'],
      ['≥ 21%', '#0369a1']
    ];
  }

  if (indicator === 'eutrofia') {
    return [
      ['< 55%', '#064e3b'],
      ['55% – 60%', '#047857'],
      ['60% – 65%', '#10b981'],
      ['65% – 70%', '#6ee7b7'],
      ['≥ 70%', '#a7f3d0']
    ];
  }

  if (indicator === 'sobrepeso') {
    return [
      ['< 12%', '#fde68a'],
      ['12% – 15%', '#fcd34d'],
      ['15% – 18%', '#f59e0b'],
      ['18% – 21%', '#b45309'],
      ['≥ 21%', '#78350f']
    ];
  }

  return [
    ['< 7%', '#fecaca'],
    ['7% – 10%', '#fca5a5'],
    ['10% – 13%', '#ef4444'],
    ['13% – 16%', '#b91c1c'],
    ['≥ 16%', '#7f1d1d']
  ];
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
      map.setView(RIO_CLARO_CENTER, 13, { animate: true, duration: 1.2 });
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
    setAnalysisLevel, setSelectedUbs, setSelectedBairroName, setSelectedSchoolName, setSelection,
    schoolMetrics, bairroMetrics
  } = useAppStore();

  const safeNumber = (value: any, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  useEffect(() => {
    setMounted(true);
    // Use dynamically generated Voronoi grid based on UBS coordinates
    setBairros(getVoronoiGeoJSON());
    return () => setMounted(false);
  }, []);

  // Recupera métricas para o bairro diretamente da fonte de dados do modelo
  const getBairroMetrics = React.useCallback((nomeReal: string, nome: string) => {
    const cleanYear = anoSelecionado.replace('★', '').trim();
    const bMetric = bairroMetrics?.[nomeReal];
    const bYearData = bMetric?.anos?.[cleanYear];

    let dObs = 12.93;
    let dDes = 2.62;
    let dMag = 0;
    let dSob = 16.3;
    let dEut = 61.55;

    if (bYearData) {
      dDes = safeNumber(bYearData.desnutricao, dDes);
      dMag = safeNumber(bYearData.magreza, dMag);
      dObs = safeNumber(bYearData.obesidade, dObs);
      dSob = safeNumber(bYearData.sobrepeso, dSob);
      dEut = safeNumber(bYearData.eutrofia, dEut);
    } else {
      const yearData = regionalData && regionalData[cleanYear] ? regionalData[cleanYear] : null;
      const regionRecord = yearData ? yearData[nome] : null;
      dObs = safeNumber(regionRecord?.obesidade, dObs);
      dDes = safeNumber(regionRecord?.desnutricao, dDes);
      dMag = safeNumber(regionRecord?.magreza, dMag);
      dSob = safeNumber(regionRecord?.sobrepeso, dSob);
      dEut = safeNumber(regionRecord?.eutrofia, dEut);
    }

    return { des: dDes, mag: dMag, obs: dObs, sob: dSob, eut: dEut };
  }, [anoSelecionado, regionalData, bairroMetrics]);

  const getFeatureStyle = (feature: any) => {
    const nome = feature.properties?.nome_bairro || 'Desconhecido';
    const nomeReal = feature.properties?.nome_real_bairro || nome;
    const { des, mag, obs, sob, eut } = getBairroMetrics(nomeReal, nome);
    
    let riskValue = 0;
    if (indicador === 'desnutricao') riskValue = des;
    else if (indicador === 'magreza') riskValue = mag;
    else if (indicador === 'sobrepeso') riskValue = sob;
    else if (indicador === 'eutrofia') riskValue = eut;
    else riskValue = obs;

    let fillColor = '';
    if (indicador === 'global') {
      const candidates = [
        { id: 'desnutricao', val: des, lvl: getSeverityLevel(des, 'desnutricao') },
        { id: 'magreza', val: mag, lvl: getSeverityLevel(mag, 'magreza') },
        { id: 'sobrepeso', val: sob, lvl: getSeverityLevel(sob, 'sobrepeso') },
        { id: 'obesidade', val: obs, lvl: getSeverityLevel(obs, 'obesidade') }
      ];
      candidates.sort((a, b) => b.lvl - a.lvl || b.val - a.val);
      fillColor = getChoroplethColor(candidates[0].val, candidates[0].id);
    } else {
     fillColor = getChoroplethColor(riskValue, indicador);
    }

    let isActive = false;
    if (analysisLevel === 'bairro') {
      isActive = !!(selectedBairroName && nomeReal === selectedBairroName);
    } else if (analysisLevel === 'ubs') {
      isActive = !!(selectedUbs && nome === selectedUbs);
    } else if (analysisLevel === 'escola') {
      const activeSchool = ALL_POIS.find(p => p.nome === selectedSchoolName);
      isActive = !!(activeSchool && activeSchool.bairro && nomeReal === activeSchool.bairro);
    }

    const hasSelectedScope = Boolean(selectedBairroName || selectedUbs || selectedSchoolName);
    
    return {
      fillColor,
      weight: isActive ? 2.5 : 1,
      opacity: 0.9,
      color: isActive ? '#0d9488' : (darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.1)'),
      fillOpacity: hasSelectedScope ? (isActive ? 0.8 : 0.25) : 0.6,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const nome = feature.properties?.nome_bairro || 'Desconhecido';
    const nomeReal = feature.properties?.nome_real_bairro || nome;
    const { des, mag, obs, sob, eut } = getBairroMetrics(nomeReal, nome);

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
        const ubsName = feature.properties?.nome_bairro || '';
        const bairroName = feature.properties?.nome_real_bairro || ubsName;

        if (analysisLevel === 'ubs' && selectedUbs === ubsName) {
          // Clique secundário na mesma região: abre o bairro correspondente
          setSelection('bairro', ubsName, bairroName, null);
        } else if (analysisLevel === 'bairro' && selectedBairroName === bairroName) {
          // Clique de reset no bairro ativo: volta para a UBS
          setSelection('ubs', ubsName, null, null);
        } else {
          // Primeiro clique ou clique em outra região: abre a UBS
          setSelection('ubs', ubsName, null, null);
        }
      },
    });

    let tooltipContent = '';
    if (indicador === 'global') {
      tooltipContent = `
        <div class="p-1.5 font-sans space-y-2.5 min-w-[340px] max-w-[520px]">
          <div class="font-extrabold text-[12px] pb-1.5 mb-2 flex items-center justify-between gap-5 w-full" style="border-bottom: 1px solid var(--card-border, #e2e8f0);">
            <div class="flex flex-col min-w-0" style="white-space: nowrap !important;">
              <span class="font-extrabold" style="white-space: nowrap !important; color: var(--foreground, #1e293b);">${nomeReal}</span>
              <span class="text-[9px] font-semibold" style="white-space: nowrap !important; color: var(--muted, #64748b);">Ref: ${nome}</span>
            </div>
            <span class="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-black shrink-0" style="background-color: rgba(13, 148, 136, 0.15); color: #0d9488; border: 1px solid rgba(13, 148, 136, 0.3);">Visão Global</span>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px]">
            <div class="flex items-center justify-between gap-2.5">
              <span class="font-bold" style="color: #3b82f6;">Desnutrição:</span>
              <strong class="font-mono font-black" style="color: #2563eb;">${des.toFixed(2)}%</strong>
            </div>
            <div class="flex items-center justify-between gap-2.5">
              <span class="font-bold" style="color: #0ea5e9;">Magreza:</span>
              <strong class="font-mono font-black" style="color: #0284c7;">${mag.toFixed(2)}%</strong>
            </div>
            <div class="flex items-center justify-between gap-2.5">
              <span class="font-bold" style="color: #10b981;">Peso Adeq.:</span>
              <strong class="font-mono font-black" style="color: #059669;">${eut.toFixed(2)}%</strong>
            </div>
            <div class="flex items-center justify-between gap-2.5">
              <span class="font-bold" style="color: #f59e0b;">Sobrepeso:</span>
              <strong class="font-mono font-black" style="color: #d97706;">${sob.toFixed(2)}%</strong>
            </div>
            <div class="flex items-center justify-between gap-2.5">
              <span class="font-bold" style="color: #ef4444;">Obesidade:</span>
              <strong class="font-mono font-black" style="color: #dc2626;">${obs.toFixed(2)}%</strong>
            </div>
          </div>
        </div>
      `;
    } else {
      let activeVal = 0;
      let label = '';
      let activeColor = '';
      if (indicador === 'desnutricao') {
        activeVal = des;
        label = 'Desnutrição';
        activeColor = '#2563eb';
      } else if (indicador === 'sobrepeso') {
        activeVal = sob;
        label = 'Sobrepeso';
        activeColor = '#d97706';
      } else if (indicador === 'eutrofia') {
        activeVal = eut;
        label = 'Peso Adequado';
        activeColor = '#059669';
      } else if (indicador === 'magreza') {
        activeVal = mag;
        label = 'Magreza';
        activeColor = '#0284c7';
      } else {
        activeVal = obs;
        label = 'Obesidade';
        activeColor = '#dc2626';
      }
      tooltipContent = `
        <div class="p-1.5 font-sans space-y-2.5 min-w-[300px] max-w-[460px]">
          <div class="pb-1.5 mb-1.5 flex items-center justify-between gap-4 w-full" style="border-bottom: 1px solid var(--card-border, #e2e8f0);">
            <div class="flex flex-col min-w-0" style="white-space: nowrap !important;">
              <div class="font-extrabold text-[12px]" style="white-space: nowrap !important; color: var(--foreground, #1e293b);">${nomeReal}</div>
              <div class="text-[9px]" style="white-space: nowrap !important; color: var(--muted, #64748b);">Ref: ${nome}</div>
            </div>
            <span class="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-black shrink-0" style="background-color: rgba(100, 116, 139, 0.1); color: var(--muted, #64748b); border: 1px solid rgba(100, 116, 139, 0.25);">Indicador Ativo</span>
          </div>
          <div class="text-[11px] font-semibold flex justify-between w-full" style="color: var(--foreground, #334155);">
            <span>${label}:</span>
            <strong class="font-mono font-black text-xs" style="color: ${activeColor};">${activeVal.toFixed(2)}%</strong>
          </div>
        </div>
      `;
    }

    layer.bindTooltip(
      tooltipContent,
      { className: 'custom-glass-tooltip', sticky: true, direction: 'auto' }
    );
  };

  const visiblePois = React.useMemo(() => {
    return ALL_POIS.filter(poi => {
      if (activePoiTypes.includes('UBS')) {
        if (['UBS', 'Pronto-Atendimento', 'Saúde Mental', 'Vigilância Sanitária'].includes(poi.categoria)) return true;
      }
      return activePoiTypes.includes(poi.categoria as any);
    });
  }, [activePoiTypes]);

  if (!mounted) return null;

  const mapBackground = darkMode ? '#1c1c1e' : '#f8fafc';
  const activeIndicatorLabel = indicatorLabels[indicador as keyof typeof indicatorLabels] || indicatorLabels.obesidade;
  const scopeLabel = analysisLevel === 'escola'
    ? (selectedSchoolName || 'Escola')
    : analysisLevel === 'bairro'
      ? (selectedBairroName || 'Bairro')
      : analysisLevel === 'ubs'
        ? (selectedUbs || 'UBS')
        : 'Rio Claro';
  const indicatorLegend = getIndicatorLegend(indicador, darkMode);

  return (
    <div className="h-full w-full relative">
        <div className="absolute bottom-4 right-4 z-[1000] pointer-events-none">
          <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-[#1c1c1e]/95 px-3 py-2 shadow-lg backdrop-blur-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 mb-2">Legenda · {activeIndicatorLabel}</div>
            <div className="space-y-1.5">
              {indicatorLegend.map(([label, color]) => (
                <div key={label} className="flex items-center gap-2 text-[10px] font-semibold text-slate-700 dark:text-zinc-300">
                  <span className="w-3 h-3 rounded-sm border border-white/60" style={{ backgroundColor: color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800/70 text-[10px] text-slate-500 dark:text-zinc-400">
              Escopo: <span className="font-bold text-slate-700 dark:text-zinc-200">{scopeLabel}</span>
            </div>
          </div>
        </div>
        <MapContainer
          center={RIO_CLARO_CENTER}
          zoom={13}
          minZoom={10}
          maxZoom={18}
          style={{ height: '100%', width: '100%', background: mapBackground }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            key={darkMode ? 'dark-tiles' : 'light-tiles'}
            url={darkMode ? TILE_URL_DARK : TILE_URL_LIGHT}
            attribution=""
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
            const metrics = pRegiao ? getBairroMetrics(pRegiao, pRegiao) : null;
            
            const cleanYear = anoSelecionado.replace('★', '').trim();
            const schoolRecord = isSchool ? schoolMetrics[poi.nome]?.anos?.[cleanYear] : null;

            const dDes = schoolRecord ? safeNumber(schoolRecord.desnutricao, metrics?.des ?? 2.62) : (metrics?.des ?? 2.62);
            const dMag = schoolRecord ? safeNumber(schoolRecord.magreza, metrics?.mag ?? 0) : (metrics?.mag ?? 0);
            const dObs = schoolRecord ? safeNumber(schoolRecord.obesidade, metrics?.obs ?? 12.93) : (metrics?.obs ?? 12.93);
            const dSob = schoolRecord ? safeNumber(schoolRecord.sobrepeso, metrics?.sob ?? 16.3) : (metrics?.sob ?? 16.3);
            const dEut = schoolRecord ? safeNumber(schoolRecord.eutrofia, metrics?.eut ?? 61.55) : (metrics?.eut ?? 61.55);

            // Determina a prevalência do indicador ativo para destacar no tooltip
            let activeVal = 0;
            let activeLabel = '';
            let colorClass = '';
            
            if (indicador === 'desnutricao') {
              activeVal = isSchool ? dDes : (metrics?.des ?? 0);
              activeLabel = 'Desnutrição';
              colorClass = 'text-blue-500 dark:text-blue-450';
            } else if (indicador === 'magreza') {
              activeVal = isSchool ? dMag : (metrics?.mag ?? 0);
              activeLabel = 'Magreza';
              colorClass = 'text-sky-500 dark:text-sky-450';
            } else if (indicador === 'sobrepeso') {
              activeVal = isSchool ? dSob : (metrics?.sob ?? 0);
              activeLabel = 'Sobrepeso';
              colorClass = 'text-amber-500 dark:text-amber-450';
            } else if (indicador === 'eutrofia') {
              activeVal = isSchool ? dEut : (metrics?.eut ?? 0);
              activeLabel = 'Peso Adequado';
              colorClass = 'text-emerald-500 dark:text-emerald-450';
            } else { // default ou 'obesidade'
              activeVal = isSchool ? dObs : (metrics?.obs ?? 0);
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
                        setSelection('bairro', pRegiao || null, pBairro || null, null);
                      } else {
                        setSelection('escola', pRegiao || null, pBairro || null, poi.nome);
                      }
                    } else if (poi.categoria === 'UBS') {
                      if (analysisLevel === 'ubs' && selectedUbs === poi.nome) {
                        setSelection('municipio', null, null, null);
                      } else {
                        setSelection('ubs', poi.nome, null, null);
                      }
                    } else if (isGov) {
                      if (pRegiao) {
                        if (analysisLevel === 'ubs' && selectedUbs === pRegiao) {
                          setSelection('municipio', null, null, null);
                        } else {
                          setSelection('ubs', pRegiao, null, null);
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
                            <strong className="text-blue-600 dark:text-blue-400 font-mono font-black">{dDes.toFixed(1)}%</strong>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sky-500 font-bold">Mag.:</span>
                            <strong className="text-sky-600 dark:text-sky-400 font-mono font-black">{dMag.toFixed(1)}%</strong>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-emerald-500 font-bold">Eutr.:</span>
                            <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-black">{dEut.toFixed(1)}%</strong>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-amber-500 font-bold">Sob.:</span>
                            <strong className="text-amber-600 dark:text-amber-400 font-mono font-black">{dSob.toFixed(1)}%</strong>
                          </div>
                          <div className="flex items-center justify-between gap-1 col-span-2">
                            <span className="text-red-500 font-bold">Obes.:</span>
                            <strong className="text-red-600 dark:text-red-400 font-mono font-black">{dObs.toFixed(1)}%</strong>
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
  );
}
