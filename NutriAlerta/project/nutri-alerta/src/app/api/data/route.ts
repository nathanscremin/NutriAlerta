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
      console.warn("CSV Files not found!");
      return NextResponse.json({
        success: false,
        error: "CSV files not found. Please upload them to project/csv/"
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
          lat: Number(row.lat_ubs),
          lon: Number(row.lon_ubs),
          ano: Number(yearStr),
          status: row.Status || (Number(yearStr) >= 2026 ? 'PREVISÃO' : 'DADO HISTÓRICO')
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

    // Compute delta_sobrepeso and delta_eutrofia dynamically year-over-year
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

    // Compute annual averages (temporalData) dynamically
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

    // LOAD SUPABASE DYNAMIC SCHOOL DATA
    const cwd = process.cwd();
    const dbConsolidatedPath = path.join(cwd, 'src', 'lib', 'dbConsolidatedData.json');
    const dbConsolidatedContent = await fs.readFile(dbConsolidatedPath, 'utf-8');
    const dbConsolidated = JSON.parse(dbConsolidatedContent);

    // Deep clone schoolMetrics to avoid mutating cache
    const schoolMetrics = JSON.parse(JSON.stringify(dbConsolidated.schoolMetrics));
    const schoolList = Object.values(schoolMetrics) as any[];

    // PROJECT SCHOOL METRICS FOR 2026 and 2027 BY APPLYING PARENT UBS MODEL TREND DELTAS
    schoolList.forEach(school => {
      const ubsName = school.regiao_ubs || findNearestUbsName(school.lat, school.lon) || UNIDADES_SAUDE[0].nome;
      
      // We will project 2026 and 2027
      const targetYears = ['2026', '2027'];
      targetYears.forEach(targetYr => {
        // Find parent UBS records for 2025 and the target year
        const ubs2025 = rawDataMap['2025']?.[ubsName] || { desnutricao: 2.62, obesidade: 12.93, sobrepeso: 21.0, eutrofia: 61.55 };
        const ubsTarget = rawDataMap[targetYr]?.[ubsName];

        if (!ubsTarget) return;

        // Compute deltas from parent UBS
        const deltaDes = (ubsTarget.desnutricao || 0) - (ubs2025.desnutricao || 0);
        const deltaObs = (ubsTarget.obesidade || 0) - (ubs2025.obesidade || 0);
        const deltaSob = (ubsTarget.sobrepeso || 0) - (ubs2025.sobrepeso || 0);
        const deltaEut = (ubsTarget.eutrofia || 0) - (ubs2025.eutrofia || 0);

        // Find school baseline year (latest available year <= 2025)
        const schoolYears = Object.keys(school.anos).map(Number).filter(y => y <= 2025).sort((a, b) => b - a);
        const baselineYear = schoolYears[0] ? String(schoolYears[0]) : null;
        const baseline = baselineYear ? school.anos[baselineYear] : { desnutricao: 3.0, obesidade: 10.0, sobrepeso: 15.0, eutrofia: 72.0, total_avaliados: 100 };

        // Apply deltas to baseline school rates
        let des = Math.max(0, Math.min(100, (baseline.desnutricao || 0) + deltaDes));
        let obs = Math.max(0, Math.min(100, (baseline.obesidade || 0) + deltaObs));
        let sob = Math.max(0, Math.min(100, (baseline.sobrepeso || 0) + deltaSob));
        let eut = Math.max(0, Math.min(100, (baseline.eutrofia || 0) + deltaEut));

        // Normalize sum to 100%
        const sum = des + obs + sob + eut;
        if (sum > 0) {
          des = Number(((des / sum) * 100).toFixed(2));
          obs = Number(((obs / sum) * 100).toFixed(2));
          sob = Number(((sob / sum) * 100).toFixed(2));
          eut = Number(((eut / sum) * 100).toFixed(2));
        }

        school.anos[targetYr] = {
          desnutricao: des,
          obesidade: obs,
          sobrepeso: sob,
          eutrofia: eut,
          total_avaliados: baseline.total_avaliados || 100
        };
      });
    });

    // LOAD RIO CLARO BAIRROS FOR CENTROID CALCULATION
    const bairrosPath = path.join(cwd, 'src', 'lib', 'rio_claro_bairros.json');
    const bairrosContent = await fs.readFile(bairrosPath, 'utf-8');
    const bairrosGeoJSON = JSON.parse(bairrosContent);

    // Calculate neighborhood centroids and group features
    const bairroCentroids: Record<string, { sumLon: number; sumLat: number; count: number; parentUbs: string }> = {};

    bairrosGeoJSON.features.forEach((feat: any) => {
      const props = feat.properties || {};
      const name = props.nome_real_bairro;
      if (!name) return;

      const geom = feat.geometry;
      if (!geom) return;

      let coords: number[][] = [];
      if (geom.type === 'Polygon') {
        coords = geom.coordinates[0];
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach((poly: any) => {
          coords = coords.concat(poly[0]);
        });
      }

      let sumLon = 0, sumLat = 0, count = 0;
      coords.forEach(pt => {
        if (Array.isArray(pt) && pt.length >= 2) {
          sumLon += pt[0];
          sumLat += pt[1];
          count++;
        }
      });

      if (count > 0) {
        if (!bairroCentroids[name]) {
          bairroCentroids[name] = { sumLon: 0, sumLat: 0, count: 0, parentUbs: props.nome_bairro };
        }
        bairroCentroids[name].sumLon += sumLon;
        bairroCentroids[name].sumLat += sumLat;
        bairroCentroids[name].count += count;
      }
    });

    const uniqueBairros: Record<string, { nome: string; lat: number; lon: number; parentUbs: string }> = {};
    Object.keys(bairroCentroids).forEach(name => {
      const data = bairroCentroids[name];
      uniqueBairros[name] = {
        nome: name,
        lat: data.sumLat / data.count,
        lon: data.sumLon / data.count,
        parentUbs: data.parentUbs
      };
    });

    // Map each neighborhood to school(s) (with closest school fallback)
    const bairroMetrics: Record<string, {
      nome: string;
      lat: number;
      lon: number;
      regiao_ubs: string;
      anos: Record<string, {
        desnutricao: number;
        obesidade: number;
        sobrepeso: number;
        eutrofia: number;
        total_avaliados: number;
      }>;
    }> = {};

    const yearsListCombined = [...years, '2026', '2027'];

    Object.keys(uniqueBairros).forEach(bName => {
      const bInfo = uniqueBairros[bName];
      
      // Filter schools directly inside this neighborhood
      let associatedSchools = schoolList.filter(s => s.bairro && s.bairro.trim().toLowerCase() === bName.trim().toLowerCase());

      // Geographical nearest-neighbor fallback if no schools are directly inside
      if (associatedSchools.length === 0) {
        let closestSchool = null;
        let minDistance = Infinity;

        schoolList.forEach(school => {
          if (typeof school.lat !== 'number' || typeof school.lon !== 'number') return;
          const dist = getDistance(bInfo.lat, bInfo.lon, school.lat, school.lon);
          if (dist < minDistance) {
            minDistance = dist;
            closestSchool = school;
          }
        });

        if (closestSchool) {
          associatedSchools = [closestSchool];
        }
      }

      // Aggregate metrics across associated schools for all years
      const anos: Record<string, any> = {};

      yearsListCombined.forEach(yr => {
        let sumAvaliados = 0;
        let weightedDes = 0;
        let weightedObs = 0;
        let weightedSob = 0;
        let weightedEut = 0;

        associatedSchools.forEach(sch => {
          const yrData = sch.anos[yr];
          if (!yrData) return;

          const aval = yrData.total_avaliados || 0;
          sumAvaliados += aval;
          weightedDes += (yrData.desnutricao || 0) * aval;
          weightedObs += (yrData.obesidade || 0) * aval;
          weightedSob += (yrData.sobrepeso || 0) * aval;
          weightedEut += (yrData.eutrofia || 0) * aval;
        });

        if (sumAvaliados > 0) {
          let des = Number((weightedDes / sumAvaliados).toFixed(2));
          let obs = Number((weightedObs / sumAvaliados).toFixed(2));
          let sob = Number((weightedSob / sumAvaliados).toFixed(2));
          let eut = Number((weightedEut / sumAvaliados).toFixed(2));

          // Normalização a 100%
          const sum = des + obs + sob + eut;
          if (sum > 0) {
            des = Number(((des / sum) * 100).toFixed(2));
            obs = Number(((obs / sum) * 100).toFixed(2));
            sob = Number(((sob / sum) * 100).toFixed(2));
            eut = Number(((eut / sum) * 100).toFixed(2));
          }

          anos[yr] = {
            desnutricao: des,
            obesidade: obs,
            sobrepeso: sob,
            eutrofia: eut,
            total_avaliados: sumAvaliados
          };
        } else {
          // If no school has data for this year, fallback to parent UBS metrics for that year
          const parentUbs = bInfo.parentUbs;
          const ubsData = rawDataMap[yr]?.[parentUbs] || rawDataMap[yr]?.[Object.keys(rawDataMap[yr])[0]];
          
          if (ubsData) {
            anos[yr] = {
              desnutricao: ubsData.desnutricao || 0,
              obesidade: ubsData.obesidade || 0,
              sobrepeso: ubsData.sobrepeso || 0,
              eutrofia: ubsData.eutrofia || 100,
              total_avaliados: 100
            };
          } else {
            anos[yr] = {
              desnutricao: 3.0,
              obesidade: 12.0,
              sobrepeso: 15.0,
              eutrofia: 70.0,
              total_avaliados: 100
            };
          }
        }
      });

      bairroMetrics[bName] = {
        nome: bName,
        lat: bInfo.lat,
        lon: bInfo.lon,
        regiao_ubs: bInfo.parentUbs,
        anos
      };
    });

    return NextResponse.json({
      success: true,
      temporalData,
      regionalData: rawDataMap,
      schoolMetrics,
      bairroMetrics,
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
