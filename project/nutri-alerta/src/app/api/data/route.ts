import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the health units to perform geographical proximity mapping
const UNIDADES_SAUDE = [
  { nome: "Vigilância Sanitária", categoria: "Vigilância Sanitária", lat: -22.4968707, lon: -47.586236 },
  { nome: "PSMI - Nossa Senhora de Lourdes", categoria: "Pronto-Atendimento", lat: -22.2781584, lon: -47.5506379 },
  { nome: "Pronto Atendimento Ginecológico", categoria: "Pronto-Atendimento", lat: -22.2781584, lon: -47.5506379 },
  { nome: "UPA 29", categoria: "Pronto-Atendimento", lat: -22.4250407, lon: -47.5637595 },
  { nome: "UPA Chervezon", categoria: "Pronto-Atendimento", lat: -22.3844026, lon: -47.5653482 },
  { nome: "CAPS III 18 de Maio", categoria: "Saúde Mental", lat: -22.420253, lon: -47.5681105 },
  { nome: "UBS Jardim Chervezon", categoria: "UBS", lat: -22.3861442, lon: -47.5699258 },
  { nome: "UBS 29 Oreste Armando", categoria: "UBS", lat: -22.4249039, lon: -47.5634923 },
  { nome: "UBS Wenzel", categoria: "UBS", lat: -22.3891756, lon: -47.5870718 },
  { nome: "UBS Vila Cristina", categoria: "UBS", lat: -22.3841679, lon: -47.5501818 },
  { nome: "USF Assistência", categoria: "UBS", lat: -22.4968707, lon: -47.586236 },
  { nome: "USF Ferraz", categoria: "UBS", lat: -22.261032998683, lon: -47.588831031504 },
  { nome: "USF Nosso Teto / Boa Vista", categoria: "UBS", lat: -22.3806919, lon: -47.5897807 },
  { nome: "USF Ajapi", categoria: "UBS", lat: -22.2594742, lon: -47.5874974 },
  { nome: "USF Mãe Preta I/II", categoria: "UBS", lat: -22.3784852, lon: -47.5515221 },
  { nome: "USF Palmeiras", categoria: "UBS", lat: -22.4304055, lon: -47.5839577 },
  { nome: "USF Jardim Novo I e II", categoria: "UBS", lat: -22.4535749, lon: -47.5790812 },
  { nome: "USF Benjamin de Castro", categoria: "UBS", lat: -22.4114609, lon: -47.5780932 },
  { nome: "USF Bonsucesso / Novo Wenzel", categoria: "UBS", lat: -22.4066791, lon: -47.6029343 },
  { nome: "USF Jardim das Flores", categoria: "UBS", lat: -22.3775292, lon: -47.5818228 },
  { nome: "USF Guanabara", categoria: "UBS", lat: -22.4408403, lon: -47.5792059 },
  { nome: "USF Panorama", categoria: "UBS", lat: -22.3873908, lon: -47.5901844 },
  { nome: "USF Terra Nova", categoria: "UBS", lat: -22.498276923094, lon: -47.582697262242 }
];

// Helper to calculate geographical proximity
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
}

// Mapeamento de âncoras virtuais para expandir matematicamente as células de Voronoi
// sem distorcer visualmente a renderização física dos marcadores no mapa.
function getVirtualAnchor(nome: string, realLat: number, realLon: number) {
  if (nome === 'USF Ferraz') return { lat: -22.2610, lon: -47.6300 };
  if (nome === 'USF Ajapi') return { lat: -22.2595, lon: -47.5400 };
  if (nome === 'USF Assistência') return { lat: -22.4969, lon: -47.6062 };
  if (nome === 'USF Terra Nova') return { lat: -22.4983, lon: -47.5627 };
  if (nome === 'USF Palmeiras') return { lat: -22.4600, lon: -47.6500 };
  if (nome === 'USF Bonsucesso / Novo Wenzel') return { lat: -22.4067, lon: -47.6229 };
  return { lat: realLat, lon: realLon };
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

// Fast CSV Parser
function parseCSV(content: string) {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((header, index) => {
      let val: any = values[index];
      if (val !== undefined && val !== null) {
        val = val.trim();
        if (val === '') {
          val = null;
        } else {
          const isIntegerColumn = 
            header === 'Total' || 
            header.toLowerCase().includes('qtd') || 
            header.toLowerCase().includes('quantidade') || 
            header.toLowerCase() === 'cnes' || 
            header.toLowerCase() === 'ibge' ||
            header.toLowerCase() === 'ano';

          if (isIntegerColumn && /^\d{1,3}(\.\d{3})+$/.test(val)) {
            val = parseInt(val.replace(/\./g, ''), 10);
          } else if (!isNaN(Number(val))) {
            val = Number(val);
          }
        }
      } else {
        val = null;
      }
      obj[header] = val;
    });
    return obj;
  });
}

// Dynamic CSV Finder
async function findCSVFile(filenames: string[]): Promise<string | null> {
  const cwd = process.cwd();
  const checkPaths = [
    ...filenames.map(f => path.join(cwd, '..', 'csv', f)),
    ...filenames.map(f => path.join(cwd, 'csv', f)),
    ...filenames.map(f => path.join(cwd, 'project', 'csv', f)),
    ...filenames.map(f => path.join(cwd, f)),
  ];

  for (const p of checkPaths) {
    try {
      await fs.access(p);
      return p;
    } catch {}
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const obesityPath = await findCSVFile(['NutriAlerta_Projecao_Futura-2.csv', 'NutriAlerta_Projecao_Futura.csv']);
    const desnutricaoPath = await findCSVFile(['NutriAlerta_Projecao_Desnutricao.csv']);

    if (!obesityPath || !desnutricaoPath) {
      console.warn("CSV Files not found! Falling back to static mock data structures.");
      return NextResponse.json({
        success: false,
        error: "CSV files not found. Please upload them to project/csv/",
        obesityPathFound: !!obesityPath,
        desnutricaoPathFound: !!desnutricaoPath
      });
    }

    const obesityContent = await fs.readFile(obesityPath, 'utf-8');
    const desnutricaoContent = await fs.readFile(desnutricaoPath, 'utf-8');

    const obesityRows = parseCSV(obesityContent);
    const desnutricaoRows = parseCSV(desnutricaoContent);

    // Grouping by Year and Geospatially Matched UBS Name
    const rawDataMap: Record<string, Record<string, {
      nome: string;
      cnes: string | number;
      lat: number;
      lon: number;
      ano: number;
      status: string;
      obesidade?: number;
      desnutricao?: number;
      sobrepeso?: number;
      eutrofia?: number;
      obesidade_grave?: number;
      total_avaliados?: number;
      delta_obesidade?: number;
      delta_desnutricao?: number;
      delta_sobrepeso?: number;
      delta_eutrofia?: number;
    }>> = {};

    // Helper to initialize map keys
    const getOrInitRecord = (yearStr: string, ubsName: string, row: any) => {
      if (!rawDataMap[yearStr]) rawDataMap[yearStr] = {};
      if (!rawDataMap[yearStr][ubsName]) {
        rawDataMap[yearStr][ubsName] = {
          nome: ubsName,
          cnes: row.CNES || row.cnes,
          lat: row.lat_ubs,
          lon: row.lon_ubs,
          ano: Number(yearStr),
          status: row.Status || 'DADO HISTÓRICO'
        };
      }
      return rawDataMap[yearStr][ubsName];
    };

    // Parse Obesity rows
    obesityRows.forEach(row => {
      const year = String(row.Ano);
      const lat = Number(row.lat_ubs);
      const lon = Number(row.lon_ubs);
      if (!year || isNaN(lat) || isNaN(lon)) return;

      const ubsName = findNearestUbsName(lat, lon);
      if (!ubsName) return;

      const rec = getOrInitRecord(year, ubsName, row);
      const severeObs = row.Obesidade_Grave_Pct || 0;
      const baseObs = typeof row.Tendencia_Obesidade === 'number' ? row.Tendencia_Obesidade : (row.Obesidade_Pct || 0);
      rec.obesidade = Number((baseObs + severeObs).toFixed(2));
      rec.sobrepeso = row.Sobrepeso_Pct || 0;
      rec.eutrofia = row.Eutrofia_Pct || 58;
      rec.obesidade_grave = 0;
      rec.total_avaliados = row.Total || 0;
      rec.delta_obesidade = row.Delta_Predito !== null ? row.Delta_Predito : row.Delta_Obesidade;
    });

    // Parse Desnutrição rows
    desnutricaoRows.forEach(row => {
      const year = String(row.Ano);
      const lat = Number(row.lat_ubs);
      const lon = Number(row.lon_ubs);
      if (!year || isNaN(lat) || isNaN(lon)) return;

      const ubsName = findNearestUbsName(lat, lon);
      if (!ubsName) return;

      const rec = getOrInitRecord(year, ubsName, row);
      rec.desnutricao = typeof row.Tendencia_Desnutricao === 'number' ? row.Tendencia_Desnutricao : row.Magreza_Pct;
      rec.delta_desnutricao = row.Delta_Predito !== null ? row.Delta_Predito : row.Delta_Desnutricao;
      
    });

    // Compute delta_sobrepeso and delta_eutrofia dynamically year-over-year for all records
    const yearsSortedForDelta = Object.keys(rawDataMap).sort((a, b) => Number(a) - Number(b));
    yearsSortedForDelta.forEach((yr, index) => {
      const ubsNames = Object.keys(rawDataMap[yr]);
      ubsNames.forEach(name => {
        const rec = rawDataMap[yr][name] as any;
        if (index === 0) {
          rec.delta_sobrepeso = 0;
          rec.delta_eutrofia = 0;
        } else {
          const prevYear = yearsSortedForDelta[index - 1];
          const prevRec = rawDataMap[prevYear]?.[name];
          
          if (prevRec && prevRec.sobrepeso !== undefined && rec.sobrepeso !== undefined) {
            rec.delta_sobrepeso = Number((rec.sobrepeso - prevRec.sobrepeso).toFixed(2));
          } else {
            rec.delta_sobrepeso = 0;
          }

          if (prevRec && prevRec.eutrofia !== undefined && rec.eutrofia !== undefined) {
            rec.delta_eutrofia = Number((rec.eutrofia - prevRec.eutrofia).toFixed(2));
          } else {
            rec.delta_eutrofia = 0;
          }
        }
      });
    });

    // Compute annual averages (DADOS_TEMPORAIS) dynamically
    const years = Object.keys(rawDataMap).sort((a, b) => Number(a) - Number(b));
    const temporalData = years.map(yr => {
      const ubsRecords = Object.values(rawDataMap[yr]);
      let totalObs = 0;
      let countObs = 0;
      let totalDes = 0;
      let countDes = 0;
      let totalSob = 0;
      let countSob = 0;
      let totalEut = 0;
      let countEut = 0;

      ubsRecords.forEach(rec => {
        if (rec.obesidade !== undefined && rec.obesidade !== null) {
          totalObs += rec.obesidade;
          countObs++;
        }
        if (rec.desnutricao !== undefined && rec.desnutricao !== null) {
          totalDes += rec.desnutricao;
          countDes++;
        }
        if (rec.sobrepeso !== undefined && rec.sobrepeso !== null) {
          totalSob += rec.sobrepeso;
          countSob++;
        }
        if (rec.eutrofia !== undefined && rec.eutrofia !== null) {
          totalEut += rec.eutrofia;
          countEut++;
        }
      });

      const avgObs = countObs > 0 ? Number((totalObs / countObs).toFixed(2)) : 0;
      const avgDes = countDes > 0 ? Number((totalDes / countDes).toFixed(2)) : 0;
      const avgSob = countSob > 0 ? Number((totalSob / countSob).toFixed(2)) : 0;
      const avgEut = countEut > 0 ? Number((totalEut / countEut).toFixed(2)) : 61.5;

      const isPrevisao = Number(yr) >= 2026;
      return {
        ano: yr + (isPrevisao ? ' ★' : ''),
        desnutricao: avgDes,
        obesidade: avgObs,
        sobrepeso: avgSob,
        eutrofia: avgEut,
        isPrevisao
      };
    });

    return NextResponse.json({
      success: true,
      temporalData,
      regionalData: rawDataMap,
      yearsList: years
    });
  } catch (error: any) {
    console.error("API Dynamic Data Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
