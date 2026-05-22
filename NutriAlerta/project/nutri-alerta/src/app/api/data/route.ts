import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the health units to perform geographical proximity mapping
const UNIDADES_SAUDE = [
  { nome: "UBS Jardim Chervezon “Dr. Nicolino Maziotti”", categoria: "UBS", lat: -22.385236150603358, lon: -47.564888689845596 },
  { nome: "UBS 29 “Oreste Armando Giovani”", categoria: "UBS", lat: -22.42459370350195, lon: -47.56384685307812 },
  { nome: "UBS Wenzel “Dr. Mario Fittipaldi”", categoria: "UBS", lat: -22.388922097585972, lon: -47.58697051682788 },
  { nome: "UBS Vila Cristina “Dr. Sílvio Arnaldo Piva”", categoria: "UBS", lat: -22.383777261453787, lon: -47.55011343217318 },
  { nome: "Unidade de urgência e emergência Nossa Senhora de Lourdes", categoria: "Pronto-Atendimento", lat: -22.41525217891934, lon: -47.55724428006094 },
  { nome: "UPA Chervezon", categoria: "Pronto-Atendimento", lat: -22.386031433205883, lon: -47.56481686100926 },
  { nome: "USF Assistência", categoria: "UBS", lat: -22.500679761791204, lon: -47.58613791682307 },
  { nome: "USF Ferraz", categoria: "UBS", lat: -22.40860628729808, lon: -47.56232297820725 },
  { nome: "USF Nosso Teto/Boa Vista “Dr. Antonio R.M. Santomauro”", categoria: "UBS", lat: -22.380490359110794, lon: -47.589205622903904 },
  { nome: "USF Ajapi/Ferraz", categoria: "UBS", lat: -22.28105677996832, lon: -47.54793785545208 },
  { nome: "USF Mãe PretaI/II", categoria: "UBS", lat: -22.372630657380274, lon: -47.54392295519118 },
  { nome: "USF Palmeiras I/II “Dr. Gilson Giovanni”", categoria: "UBS", lat: -22.428576882739897, lon: -47.58565651311844 },
  { nome: "USF Jardim Novo I E II “Dr. Dirceu Ferreira Penteado”", categoria: "UBS", lat: -22.45320103742713, lon: -47.579031632170135 },
  { nome: "USF Benjamin de Castro", categoria: "UBS", lat: -22.415175533330167, lon: -47.5857422824289 },
  { nome: "USF Bonsucesso/Novo Wenzel “Célia Aparecida Ceccato da Silva”", categoria: "UBS", lat: -22.40667484194884, lon: -47.602627740101724 },
  { nome: "USF Jardim das Flores “Dr. Moacir Camargo”", categoria: "UBS", lat: -22.375771166559428, lon: -47.58014827957286 },
  { nome: "USF Guanabara “Dr. Celestino Donato”", categoria: "UBS", lat: -22.43873461683572, lon: -47.5799385940652 },
  { nome: "USF Panorama “Dr. Osvaldo Akamine”", categoria: "UBS", lat: -22.385357450828135, lon: -47.591746516828024 },
  { nome: "USF Terra Nova", categoria: "UBS", lat: -22.449226627079025, lon: -47.583233814971415 }
];

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
