import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { getAdminSupabaseClient } from '@/lib/supabaseAdmin';
import { kv } from '@vercel/kv';
import dbConsolidatedLocal from '@/lib/dbConsolidatedData.json';
import extractedPoisLocal from '@/lib/extractedPois.json';

const CACHE_KEY = 'nutrialerta_data_cache';
const CACHE_TTL = 60 * 60 * 6; // 6 horas em segundos

// UBS CNES mapping from sync_db_data.js
const UBS_CNES: Record<string, string> = {
  "UBS Jardim Chervezon “Dr. Nicolino Maziotti”": "2074362",
  "UBS 29 “Oreste Armando Giovani”": "2031922",
  "UBS Wenzel “Dr. Mario Fittipaldi”": "2030462",
  "UBS Vila Cristina “Dr. Sílvio Arnaldo Piva”": "2073943",
  "USF Assistência": "2055821",
  "USF Ferraz": "6222629",
  "USF Nosso Teto/Boa Vista “Dr. Antonio R.M. Santomauro”": "2055902",
  "USF Ajapi/Ferraz": "2049163",
  "USF Mãe PretaI/II": "2071665",
  "USF Palmeiras I/II “Dr. Gilson Giovanni”": "2033186",
  "USF Jardim Novo I E II “Dr. Dirceu Ferreira Penteado”": "2074214",
  "USF Benjamin de Castro": "7058865",
  "USF Bonsucesso/Novo Wenzel “Célia Aparecida Ceccato da Silva”": "2046903",
  "USF Jardim das Flores “Dr. Moacir Camargo”": "2074419",
  "USF Guanabara “Dr. Celestino Donato”": "2074222",
  "USF Panorama “Dr. Osvaldo Akamine”": "2074346",
  "USF Terra Nova": "7533032"
};

// Standard child nutritional classification (based on child BMI)
function classifyBMI(peso: number, altura: number): string {
  if (!peso || !altura || altura <= 0) return 'Eutrofia';
  const imc = peso / (altura * altura);
  if (imc < 16.0) return 'Magreza_Acentuada';
  if (imc < 18.5) return 'Magreza';
  if (imc < 25.0) return 'Eutrofia';
  if (imc < 30.0) return 'Sobrepeso';
  if (imc < 35.0) return 'Obesidade';
  return 'Obesidade_Grave';
}

async function fetchAndSyncDbData() {
  const cwd = process.cwd();
  console.log('[Supabase Cloud Sync] Starting dynamic cloud database query...');
  
  const adminClient = await getAdminSupabaseClient();
  
  const { data: dbSchools, error: schoolsErr } = await adminClient.from('escolas').select('*');
  if (schoolsErr) {
    throw new Error(`Failed to fetch schools from Supabase: ${schoolsErr.message}`);
  }
  
  const pageSize = 1000;
  const allRecords: any[] = [];
  let i = 0;
  
  while (true) {
    const { data, error } = await adminClient
      .from('registros_saude')
      .select('*')
      .range(i, i + pageSize - 1);
      
    if (error) {
      throw new Error(`Range fetch error at range ${i}-${i + pageSize - 1}: ${error.message}`);
    }
    
    if (data && data.length > 0) {
      allRecords.push(...data);
      if (data.length < pageSize) {
        break;
      }
      i += pageSize;
    } else {
      break;
    }
  }
  
  console.log(`[Supabase Cloud Sync] Loaded ${allRecords.length} records from Supabase.`);

  const extractedPois = (extractedPoisLocal as any[]) || [];

  const schoolMap: Record<string, any> = {};
  dbSchools.forEach((s: any) => {
    const norm = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    const dbNorm = norm(s.nome);
    
    let match = extractedPois.find(p => p.categoria === 'Educação' && norm(p.nome) === dbNorm);
    if (!match) {
      match = extractedPois.find(p => p.categoria === 'Educação' && (norm(p.nome).includes(dbNorm) || dbNorm.includes(norm(p.nome))));
    }
    
    schoolMap[s.id] = {
      dbSchool: s,
      poi: match || null,
      bairro: match ? match.bairro : 'Desconhecido',
      regiao_ubs: match ? match.regiao_ubs : 'UBS Jardim Chervezon “Dr. Nicolino Maziotti”'
    };
  });

  if (allRecords.length > 0) {
    const ubsYearGroups: Record<string, any> = {};
    
    allRecords.forEach(r => {
      const date = new Date(r.data_coleta);
      const year = date.getFullYear();
      if (isNaN(year) || year < 2000) return;
      
      const schMeta = schoolMap[r.escola_id];
      if (!schMeta) return;

      const ubsName = schMeta.regiao_ubs;
      const cnes = UBS_CNES[ubsName] || '2005565';
      const key = `${cnes}-${year}`;

      if (!ubsYearGroups[key]) {
        ubsYearGroups[key] = {
          cnes, ubsName, ano: year,
          Magreza_Acentuada_Qtd: 0, Magreza_Qtd: 0, Eutrofia_Qtd: 0,
          Sobrepeso_Qtd: 0, Obesidade_Qtd: 0, Obesidade_Grave_Qtd: 0, Total: 0
        };
      }

      const classification = classifyBMI(Number(r.peso), Number(r.altura));
      ubsYearGroups[key][`${classification}_Qtd`]++;
      ubsYearGroups[key].Total++;
    });

    const csvHeaders = [
      'UF', 'IBGE', 'Municipio', 'CNES', 'EAS',
      'Peso_Muito_Baixo_Quantidade', 'Peso_Muito_Baixo_Porcentagem',
      'Peso_Baixo_Quantidade', 'Peso_Baixo_Porcentagem',
      'Peso_Adequado_Quantidade', 'Peso_Adequado_Porcentagem',
      'Peso_Elevado_Quantidade', 'Peso_Elevado_Porcentagem',
      'Total', 'Local', 'Ano', 'Faixa_Etaria',
      'Magreza_Acentuada_Qtd', 'Magreza_Acentuada_Pct',
      'Magreza_Qtd', 'Magreza_Pct',
      'Eutrofia_Qtd', 'Eutrofia_Pct',
      'Sobrepeso_Qtd', 'Sobrepeso_Pct',
      'Obesidade_Qtd', 'Obesidade_Pct',
      'Obesidade_Grave_Qtd', 'Obesidade_Grave_Pct'
    ];

    const csvRows = [csvHeaders.join(',')];
    Object.values(ubsYearGroups).forEach((g: any) => {
      const total = g.Total;
      if (total === 0) return;

      const row = [
        'SP', '354390', 'RIO CLARO', g.cnes, g.ubsName,
        '', '', '', '', '', '', '', '',
        total, 'SP', g.ano, '0 a 18 anos',
        g.Magreza_Acentuada_Qtd, ((g.Magreza_Acentuada_Qtd / total) * 100).toFixed(6),
        g.Magreza_Qtd, ((g.Magreza_Qtd / total) * 100).toFixed(6),
        g.Eutrofia_Qtd, ((g.Eutrofia_Qtd / total) * 100).toFixed(6),
        g.Sobrepeso_Qtd, ((g.Sobrepeso_Qtd / total) * 100).toFixed(6),
        g.Obesidade_Qtd, ((g.Obesidade_Qtd / total) * 100).toFixed(6),
        g.Obesidade_Grave_Qtd, ((g.Obesidade_Grave_Qtd / total) * 100).toFixed(6)
      ];
      csvRows.push(row.join(','));
    });

    const csvFilename = 'Base_Nutricional_Consolidada_Final.csv';
    const pathsToUpdate = [
      path.join(cwd, '..', 'csv', csvFilename),
      path.join(cwd, 'csv', csvFilename),
      path.join(cwd, 'project', 'csv', csvFilename)
    ];

    for (const p of pathsToUpdate) {
      try {
        await fs.writeFile(p, csvRows.join('\n'), 'utf8');
      } catch (err) {}
    }
  }

  const schoolYearGroups: Record<string, any> = {};
  allRecords.forEach(r => {
    const date = new Date(r.data_coleta);
    const year = date.getFullYear();
    if (isNaN(year) || year < 2000) return;

    const key = `${r.escola_id}-${year}`;
    if (!schoolYearGroups[key]) {
      schoolYearGroups[key] = {
        escola_id: r.escola_id, ano: year,
        Magreza_Acentuada_Qtd: 0, Magreza_Qtd: 0, Eutrofia_Qtd: 0,
        Sobrepeso_Qtd: 0, Obesidade_Qtd: 0, Obesidade_Grave_Qtd: 0, Total: 0
      };
    }

    const classification = classifyBMI(Number(r.peso), Number(r.altura));
    schoolYearGroups[key][`${classification}_Qtd`]++;
    schoolYearGroups[key].Total++;
  });

  // Load existing metrics from the statically imported JSON to ensure Vercel bundles it properly
  const existingSchoolMetrics = (dbConsolidatedLocal as any).schoolMetrics || {};
  const existingSchoolMap = (dbConsolidatedLocal as any).schoolMap || {};

  const liveSchoolMetrics: Record<string, any> = {};
  Object.values(schoolYearGroups).forEach((g: any) => {
    const schMeta = schoolMap[g.escola_id];
    if (!schMeta) return;

    const schoolName = schMeta.dbSchool.nome;
    const total = g.Total;
    if (total === 0) return;

    if (!liveSchoolMetrics[schoolName]) {
      liveSchoolMetrics[schoolName] = {
        nome: schoolName,
        lat: schMeta.poi ? schMeta.poi.lat : -22.41,
        lon: schMeta.poi ? schMeta.poi.lon : -47.56,
        bairro: schMeta.bairro,
        regiao_ubs: schMeta.regiao_ubs,
        anos: {}
      };
    }

    liveSchoolMetrics[schoolName].anos[g.ano] = {
      desnutricao: Number(((g.Magreza_Acentuada_Qtd / total) * 100).toFixed(2)),
      magreza: Number(((g.Magreza_Qtd / total) * 100).toFixed(2)),
      eutrofia: Number(((g.Eutrofia_Qtd / total) * 100).toFixed(2)),
      sobrepeso: Number(((g.Sobrepeso_Qtd / total) * 100).toFixed(2)),
      obesidade: Number((((g.Obesidade_Qtd + g.Obesidade_Grave_Qtd) / total) * 100).toFixed(2)),
      total_avaliados: total
    };
  });

  // Merge live metrics into existing local metrics
  const mergedSchoolMetrics = { ...existingSchoolMetrics };
  Object.keys(liveSchoolMetrics).forEach((schoolName) => {
    const liveSchool = liveSchoolMetrics[schoolName];
    const existingSchool = mergedSchoolMetrics[schoolName];

    if (!existingSchool) {
      mergedSchoolMetrics[schoolName] = liveSchool;
    } else {
      mergedSchoolMetrics[schoolName] = {
        ...existingSchool,
        lat: liveSchool.lat ?? existingSchool.lat,
        lon: liveSchool.lon ?? existingSchool.lon,
        bairro: liveSchool.bairro ?? existingSchool.bairro,
        regiao_ubs: liveSchool.regiao_ubs ?? existingSchool.regiao_ubs,
        anos: {
          ...(existingSchool.anos || {}),
          ...(liveSchool.anos || {})
        }
      };
    }
  });

  const mergedSchoolMap = {
    ...existingSchoolMap,
    ...Object.keys(schoolMap).reduce((acc: any, id: string) => {
      acc[id] = {
        nome: schoolMap[id].dbSchool.nome,
        bairro: schoolMap[id].bairro,
        regiao_ubs: schoolMap[id].regiao_ubs
      };
      return acc;
    }, {})
  };

  const dbConsolidatedResult = {
    schoolMetrics: mergedSchoolMetrics,
    schoolMap: mergedSchoolMap
  };

  try {
    const jsonDestPath = path.join(cwd, 'src', 'lib', 'dbConsolidatedData.json');
    await fs.writeFile(jsonDestPath, JSON.stringify(dbConsolidatedResult, null, 2), 'utf8');
  } catch (err) {}

  return mergedSchoolMetrics;
}

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

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
}

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

function normalizePercentages<T extends Record<string, any>>(
  obj: T,
  keys: Array<keyof T>,
  targetSum: number = 100
): T {
  const result = { ...obj };
  let sum = 0;
  keys.forEach(k => {
    sum += Number(result[k]) || 0;
  });
  if (sum === 0) return result;
  
  let newSum = 0;
  keys.forEach(k => {
    const val = Number(result[k]) || 0;
    result[k] = Number(((val / sum) * targetSum).toFixed(2)) as any;
    newSum += result[k] as number;
  });
  
  const diff = Number((targetSum - newSum).toFixed(2));
  if (diff !== 0 && keys.length > 0) {
    let maxKey = keys[0];
    let maxVal = Number(result[maxKey]) || 0;
    keys.forEach(k => {
      const val = Number(result[k]) || 0;
      if (val > maxVal) {
        maxVal = val;
        maxKey = k;
      }
    });
    result[maxKey] = Number((Number(result[maxKey] || 0) + diff).toFixed(2)) as any;
  }
  return result;
}

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

type SourceMeta = {
  source: 'supabase' | 'local-json' | 'local-csv';
  fallbackReason: string | null;
  artifacts: string[];
  lastUpdated: string;
};

const TEMPORAL_YEAR_MIN = 2010;
const TEMPORAL_YEAR_MAX = 2027;

function getTemporalYearRange() {
  return Array.from({ length: TEMPORAL_YEAR_MAX - TEMPORAL_YEAR_MIN + 1 }, (_, index) => TEMPORAL_YEAR_MIN + index);
}

function formatTemporalYear(year: number) {
  return year >= 2026 ? `${year} ★` : String(year);
}

function buildDefaultTemporalEntry(year: number) {
  return {
    ano: formatTemporalYear(year),
    desnutricao: 2.62,
    magreza: 0,
    obesidade: 12.93,
    sobrepeso: 15.2,
    eutrofia: 61.55,
    isPrevisao: year >= 2026
  };
}

function createDefaultTemporalData() {
  return getTemporalYearRange().map(buildDefaultTemporalEntry);
}

function computeTrendForecast(history: Array<{ year: number; value: number }>, targetYear: number) {
  if (history.length === 0) return 0;
  if (history.length === 1) return history[0].value;

  const xs = history.map((entry) => entry.year);
  const ys = history.map((entry) => entry.value);
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;

  const denominator = xs.reduce((sum, value) => sum + Math.pow(value - meanX, 2), 0);
  if (denominator === 0) {
    return ys[ys.length - 1];
  }

  const slope = xs.reduce((sum, value, index) => sum + (value - meanX) * (ys[index] - meanY), 0) / denominator;
  const intercept = meanY - slope * meanX;

  return intercept + slope * targetYear;
}

function averageTemporalMetrics(records: Array<Record<string, any>>) {
  if (records.length === 0) return null;

  const avg = records.reduce((acc: any, record: any) => {
    acc.desnutricao += Number(record.desnutricao || 0);
    acc.magreza += Number(record.magreza || 0);
    acc.obesidade += Number(record.obesidade || 0);
    acc.sobrepeso += Number(record.sobrepeso || 0);
    acc.eutrofia += Number(record.eutrofia || 0);
    return acc;
  }, { desnutricao: 0, magreza: 0, obesidade: 0, sobrepeso: 0, eutrofia: 0 });

  return normalizePercentages(
    {
      desnutricao: avg.desnutricao / records.length,
      magreza: avg.magreza / records.length,
      obesidade: avg.obesidade / records.length,
      sobrepeso: avg.sobrepeso / records.length,
      eutrofia: avg.eutrofia / records.length
    },
    ['desnutricao', 'magreza', 'obesidade', 'sobrepeso', 'eutrofia']
  );
}

function buildTemporalDataFromRegionalData(regionalData: Record<string, Record<string, any>>) {
  const temporalYearRange = getTemporalYearRange();
  const seriesByYear: Record<number, { desnutricao: number; magreza: number; obesidade: number; sobrepeso: number; eutrofia: number }> = {};

  temporalYearRange.forEach((year) => {
    const records = Object.values(regionalData[String(year)] || {});
    const averaged = averageTemporalMetrics(records);

    if (averaged) {
      seriesByYear[year] = {
        desnutricao: Number(averaged.desnutricao.toFixed(2)),
        magreza: Number(averaged.magreza.toFixed(2)),
        obesidade: Number(averaged.obesidade.toFixed(2)),
        sobrepeso: Number(averaged.sobrepeso.toFixed(2)),
        eutrofia: Number(averaged.eutrofia.toFixed(2))
      };
    }
  });

  const predictedSeries = { ...seriesByYear };

  for (const year of temporalYearRange) {
    if (predictedSeries[year]) {
      continue;
    }

    if (year <= 2025) {
      predictedSeries[year] = buildDefaultTemporalEntry(year);
      continue;
    }

    const metrics = ['desnutricao', 'magreza', 'obesidade', 'sobrepeso', 'eutrofia'] as const;
    const filledValues = {} as Record<(typeof metrics)[number], number>;

    metrics.forEach((metric) => {
      const history = Object.entries(predictedSeries)
        .map(([entryYear, values]) => ({
          year: Number(entryYear),
          value: Number(values[metric])
        }))
        .sort((a, b) => a.year - b.year);

      filledValues[metric] = Number(computeTrendForecast(history, year).toFixed(2));
    });

    predictedSeries[year] = filledValues;
  }

  return temporalYearRange.map((year) => {
    const values = predictedSeries[year] || buildDefaultTemporalEntry(year);

    return {
      ano: formatTemporalYear(year),
      desnutricao: Number(values.desnutricao.toFixed(2)),
      magreza: Number(values.magreza.toFixed(2)),
      obesidade: Number(values.obesidade.toFixed(2)),
      sobrepeso: Number(values.sobrepeso.toFixed(2)),
      eutrofia: Number(values.eutrofia.toFixed(2)),
      isPrevisao: year >= 2026
    };
  });
}

function buildRegionalDataFromSchoolMetrics(schoolMetrics: Record<string, any>) {
  const regionalData: Record<string, Record<string, any>> = {};
  const years = new Set<string>();

  Object.values(schoolMetrics).forEach((school: any) => {
    if (!school?.anos) return;
    Object.keys(school.anos).forEach((year) => years.add(year));
  });

  Array.from(years).sort((a, b) => Number(a) - Number(b)).forEach((year) => {
    const buckets: Record<string, { desnutricao: number; magreza: number; obesidade: number; sobrepeso: number; eutrofia: number; total_avaliados: number }> = {};

    Object.values(schoolMetrics).forEach((school: any) => {
      const yearData = school?.anos?.[year];
      if (!yearData) return;

      const ubsName = school.regiao_ubs || findNearestUbsName(Number(school.lat), Number(school.lon)) || UNIDADES_SAUDE[0].nome;
      const total = Number(yearData.total_avaliados || 0);
      if (!buckets[ubsName]) {
        buckets[ubsName] = { desnutricao: 0, magreza: 0, obesidade: 0, sobrepeso: 0, eutrofia: 0, total_avaliados: 0 };
      }

      buckets[ubsName].desnutricao += Number(yearData.desnutricao || 0) * total;
      buckets[ubsName].magreza += Number(yearData.magreza || 0) * total;
      buckets[ubsName].obesidade += Number(yearData.obesidade || 0) * total;
      buckets[ubsName].sobrepeso += Number(yearData.sobrepeso || 0) * total;
      buckets[ubsName].eutrofia += Number(yearData.eutrofia || 0) * total;
      buckets[ubsName].total_avaliados += total;
    });

    Object.entries(buckets).forEach(([ubsName, bucket]) => {
      const total = bucket.total_avaliados || 1;
      const normalized = normalizePercentages(
        {
          desnutricao: bucket.desnutricao / total,
          magreza: bucket.magreza / total,
          obesidade: bucket.obesidade / total,
          sobrepeso: bucket.sobrepeso / total,
          eutrofia: bucket.eutrofia / total
        },
        ['desnutricao', 'magreza', 'obesidade', 'sobrepeso', 'eutrofia']
      );

      regionalData[year] = regionalData[year] || {};
      regionalData[year][ubsName] = {
        nome: ubsName,
        ...normalized,
        total_avaliados: total
      };
    });
  });

  return regionalData;
}

function attachRegionalDeltaMetrics(regionalData: Record<string, Record<string, any>>) {
  const years = Object.keys(regionalData)
    .map((year) => Number(year))
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => a - b);

  years.forEach((year) => {
    const currentYearKey = String(year);
    const previousYearKey = String(year - 1);
    const currentRecords = regionalData[currentYearKey] || {};

    Object.entries(currentRecords).forEach(([ubsName, record]) => {
      const previousRecord = regionalData[previousYearKey]?.[ubsName];
      const getDelta = (metricKey: keyof typeof record) => {
        const currentValue = Number(record?.[metricKey] ?? 0);
        const previousValue = Number(previousRecord?.[metricKey] ?? currentValue);
        return Number((currentValue - previousValue).toFixed(2));
      };

      record.delta_desnutricao = getDelta('desnutricao');
      record.delta_magreza = getDelta('magreza');
      record.delta_obesidade = getDelta('obesidade');
      record.delta_sobrepeso = getDelta('sobrepeso');
      record.delta_eutrofia = getDelta('eutrofia');
    });
  });
}

function buildBairroMetricsFromSchoolMetrics(schoolMetrics: Record<string, any>, regionalData: Record<string, Record<string, any>>) {
  const bairroMetrics: Record<string, any> = {};
  const schools = Object.values(schoolMetrics) as any[];
  const bairroNames = Array.from(new Set(schools.map((school) => school?.bairro).filter(Boolean)));

  bairroNames.forEach((bairroName) => {
    const relatedSchools = schools.filter((school) => school?.bairro === bairroName);
    const years = new Set<string>();
    relatedSchools.forEach((school) => Object.keys(school?.anos || {}).forEach((year) => years.add(year)));

    const anos: Record<string, any> = {};
    Array.from(years).sort((a, b) => Number(a) - Number(b)).forEach((year) => {
      let total = 0;
      let weightedDes = 0;
      let weightedMag = 0;
      let weightedObs = 0;
      let weightedSob = 0;
      let weightedEut = 0;

      relatedSchools.forEach((school) => {
        const yearData = school?.anos?.[year];
        if (!yearData) return;
        const avaliados = Number(yearData.total_avaliados || 0);
        total += avaliados;
        weightedDes += Number(yearData.desnutricao || 0) * avaliados;
        weightedMag += Number(yearData.magreza || 0) * avaliados;
        weightedObs += Number(yearData.obesidade || 0) * avaliados;
        weightedSob += Number(yearData.sobrepeso || 0) * avaliados;
        weightedEut += Number(yearData.eutrofia || 0) * avaliados;
      });

      if (total > 0) {
        const normalized = normalizePercentages(
          {
            desnutricao: weightedDes / total,
            magreza: weightedMag / total,
            obesidade: weightedObs / total,
            sobrepeso: weightedSob / total,
            eutrofia: weightedEut / total
          },
          ['desnutricao', 'magreza', 'obesidade', 'sobrepeso', 'eutrofia']
        );
        anos[year] = {
          ...normalized,
          total_avaliados: total
        };
        return;
      }

      const parentUbs = relatedSchools[0]?.regiao_ubs || null;
      const fallback = parentUbs ? regionalData[year]?.[parentUbs] : null;
      anos[year] = fallback || {
        desnutricao: 2.62,
        obesidade: 12.93,
        sobrepeso: 15.2,
        eutrofia: 61.55,
        total_avaliados: 100
      };
    });

    bairroMetrics[bairroName] = {
      nome: bairroName,
      lat: relatedSchools[0]?.lat || 0,
      lon: relatedSchools[0]?.lon || 0,
      regiao_ubs: relatedSchools[0]?.regiao_ubs || UNIDADES_SAUDE[0].nome,
      anos
    };
  });

  return bairroMetrics;
}

function projectSchoolMetricsForward(schoolMetrics: Record<string, any>, targetYears = [2026, 2027]) {
  const projectedSchoolMetrics = JSON.parse(JSON.stringify(schoolMetrics || {}));
  const metricKeys = ['desnutricao', 'magreza', 'obesidade', 'sobrepeso', 'eutrofia'] as const;

  Object.values(projectedSchoolMetrics).forEach((school: any) => {
    if (!school?.anos) return;

    const orderedYears = Object.keys(school.anos)
      .map((year) => Number(year))
      .filter((year) => Number.isFinite(year))
      .sort((a, b) => a - b);

    if (orderedYears.length === 0) return;

    targetYears.forEach((targetYear) => {
      if (school.anos[String(targetYear)]) return;

      const historyByMetric = metricKeys.reduce((acc, metric) => {
        acc[metric] = orderedYears.map((year) => ({
          year,
          value: Number(school.anos[String(year)]?.[metric] || 0)
        }));
        return acc;
      }, {} as Record<(typeof metricKeys)[number], Array<{ year: number; value: number }>>);

      const predictedMetrics = metricKeys.reduce((acc, metric) => {
        const forecast = computeTrendForecast(historyByMetric[metric], targetYear);
        acc[metric] = Number(Math.max(0, Math.min(100, forecast)).toFixed(2));
        return acc;
      }, {} as Record<(typeof metricKeys)[number], number>);

      const totalHistory = orderedYears.map((year) => ({
        year,
        value: Number(school.anos[String(year)]?.total_avaliados || 0)
      }));
      const totalForecast = totalHistory.length > 0
        ? Math.max(0, Math.round(computeTrendForecast(totalHistory, targetYear)))
        : 0;

      const normalizedMetrics = normalizePercentages(predictedMetrics, [...metricKeys]);
      school.anos[String(targetYear)] = {
        ...normalizedMetrics,
        total_avaliados: totalForecast
      };
    });
  });

  return projectedSchoolMetrics;
}

async function loadSupabasePrevisoes() {
  try {
    const adminClient = await getAdminSupabaseClient();
    const { data: rows, error } = await adminClient
      .from('previsoes_nutricionais')
      .select('*');

    if (error) {
      console.warn('[Supabase Previsoes] Failed to query previsoes_nutricionais:', error.message);
      return null;
    }

    if (!rows || rows.length === 0) {
      console.log('[Supabase Previsoes] Table is empty, fallback to local CSVs');
      return null;
    }

    console.log(`[Supabase Previsoes] Loaded ${rows.length} prediction rows from Cloud Database.`);

    const cnesToUbsMap: Record<string, string> = {};
    Object.entries(UBS_CNES).forEach(([name, cnes]) => {
      cnesToUbsMap[cnes] = name;
    });

    const regionalData: Record<string, Record<string, any>> = {};

    const getOrInit = (year: string, ubsName: string, cnes: string) => {
      regionalData[year] = regionalData[year] || {};
      if (!regionalData[year][ubsName]) {
        const ubsGeo = UNIDADES_SAUDE.find(u => u.nome === ubsName);
        const lat = ubsGeo ? ubsGeo.lat : -22.41;
        const lon = ubsGeo ? ubsGeo.lon : -47.56;

        regionalData[year][ubsName] = {
          nome: ubsName,
          cnes: cnes,
          lat: lat,
          lon: lon,
          ano: Number(year),
          status: Number(year) >= 2026 ? 'PREVISÃO' : 'DADO HISTÓRICO'
        };
      }
      return regionalData[year][ubsName];
    };

    const schoolPredictions: Record<string, Record<string, any>> = {};

    rows.forEach((row: any) => {
      const year = String(row.ano);
      const ubsName = cnesToUbsMap[row.cnes];
      
      if (ubsName) {
        const rec = getOrInit(year, ubsName, row.cnes);
        if (row.tipo_projecao === 'obesidade') {
          rec.obesidade = Number((Number(row.obesidade_pct || 0) + Number(row.obesidade_grave_pct || 0)).toFixed(2));
          rec.sobrepeso = Number(Number(row.sobrepeso_pct || 0).toFixed(2));
          rec.eutrofia = Number(Number(row.eutrofia_pct || 58).toFixed(2));
          rec.total_avaliados = rec.total_avaliados || 0;
        } else if (row.tipo_projecao === 'desnutricao') {
          rec.desnutricao = Number(Number(row.magreza_acentuada_pct || 2.62).toFixed(2));
          rec.magreza = Number(Number(row.magreza_pct || 0).toFixed(2));
        }
      } else {
        const schoolName = row.cnes;
        schoolPredictions[schoolName] = schoolPredictions[schoolName] || {};
        schoolPredictions[schoolName][year] = schoolPredictions[schoolName][year] || {
          ano: Number(year),
          status: Number(year) >= 2026 ? 'PREVISÃO' : 'DADO HISTÓRICO'
        };
        const rec = schoolPredictions[schoolName][year];
        if (row.tipo_projecao === 'obesidade') {
          rec.obesidade = Number((Number(row.obesidade_pct || 0) + Number(row.obesidade_grave_pct || 0)).toFixed(2));
          rec.sobrepeso = Number(Number(row.sobrepeso_pct || 0).toFixed(2));
          rec.eutrofia = Number(Number(row.eutrofia_pct || 58).toFixed(2));
          rec.total_avaliados = rec.total_avaliados || 0;
        } else if (row.tipo_projecao === 'desnutricao') {
          rec.desnutricao = Number(Number(row.magreza_acentuada_pct || 2.62).toFixed(2));
          rec.magreza = Number(Number(row.magreza_pct || 0).toFixed(2));
        }
      }
    });

    Object.keys(regionalData).forEach((year) => {
      Object.keys(regionalData[year]).forEach((ubsName) => {
        const rec = regionalData[year][ubsName];
        const normalized = normalizePercentages(
          {
            desnutricao: rec.desnutricao ?? 2.62,
            magreza: rec.magreza ?? 0,
            obesidade: rec.obesidade ?? 12.93,
            sobrepeso: rec.sobrepeso ?? 15.2,
            eutrofia: rec.eutrofia ?? 61.55
          },
          ['desnutricao', 'magreza', 'obesidade', 'sobrepeso', 'eutrofia']
        );

        rec.desnutricao = normalized.desnutricao;
        rec.magreza = normalized.magreza;
        rec.obesidade = normalized.obesidade;
        rec.sobrepeso = normalized.sobrepeso;
        rec.eutrofia = normalized.eutrofia;
      });
    });

    Object.keys(schoolPredictions).forEach((schoolName) => {
      Object.keys(schoolPredictions[schoolName]).forEach((year) => {
        const rec = schoolPredictions[schoolName][year];
        const normalized = normalizePercentages(
          {
            desnutricao: rec.desnutricao ?? 2.62,
            magreza: rec.magreza ?? 0,
            obesidade: rec.obesidade ?? 12.93,
            sobrepeso: rec.sobrepeso ?? 15.2,
            eutrofia: rec.eutrofia ?? 61.55
          },
          ['desnutricao', 'magreza', 'obesidade', 'sobrepeso', 'eutrofia']
        );
        rec.desnutricao = normalized.desnutricao;
        rec.magreza = normalized.magreza;
        rec.obesidade = normalized.obesidade;
        rec.sobrepeso = normalized.sobrepeso;
        rec.eutrofia = normalized.eutrofia;
      });
    });

    attachRegionalDeltaMetrics(regionalData);

    return {
      regionalData,
      temporalData: buildTemporalDataFromRegionalData(regionalData),
      bairroMetrics: {},
      schoolPredictions,
      source: 'supabase-cloud' as const,
      artifacts: ['previsoes_nutricionais']
    };
  } catch (err: any) {
    console.error('[Supabase Previsoes ERROR]', err);
    return null;
  }
}

async function loadLocalCsvFallback(cwd: string) {
  const obesityPath = await findCSVFile(['NutriAlerta_Projecao_Futura-2.csv', 'NutriAlerta_Projecao_Futura.csv']);
  const desnutricaoPath = await findCSVFile(['NutriAlerta_Projecao_Desnutricao.csv']);

  const regionalData: Record<string, Record<string, any>> = {};
  const schoolPredictions: Record<string, Record<string, any>> = {};
  const temporalData = createDefaultTemporalData();

  if (!obesityPath || !desnutricaoPath) {
    return { regionalData, temporalData, bairroMetrics: {}, schoolPredictions: {}, source: 'local-json' as const, artifacts: [] };
  }

  const obesityRows = parseCSV(await fs.readFile(obesityPath, 'utf-8'));
  const desnutricaoRows = parseCSV(await fs.readFile(desnutricaoPath, 'utf-8'));

  const getOrInit = (year: string, ubsName: string, row: any) => {
    regionalData[year] = regionalData[year] || {};
    regionalData[year][ubsName] = regionalData[year][ubsName] || {
      nome: ubsName,
      cnes: row.CNES || row.cnes,
      lat: Number(row.lat_ubs),
      lon: Number(row.lon_ubs),
      ano: Number(year),
      status: Number(year) >= 2026 ? 'PREVISÃO' : 'DADO HISTÓRICO'
    };
    return regionalData[year][ubsName];
  };

  obesityRows.forEach((row) => {
    const year = String(row.Ano);
    const lat = Number(row.lat_ubs);
    const lon = Number(row.lon_ubs);
    if (!year) return;

    const isSchool = isNaN(Number(row.CNES || row.cnes));

    if (isSchool) {
      const schoolName = String(row.CNES || row.cnes);
      schoolPredictions[schoolName] = schoolPredictions[schoolName] || {};
      schoolPredictions[schoolName][year] = schoolPredictions[schoolName][year] || {
        ano: Number(year),
        status: Number(year) >= 2026 ? 'PREVISÃO' : 'DADO HISTÓRICO'
      };
      const rec = schoolPredictions[schoolName][year];
      rec.obesidade = Number(((row.Obesidade_Pct || 0) + (row.Obesidade_Grave_Pct || 0)).toFixed(2));
      rec.sobrepeso = Number((row.Sobrepeso_Pct || 0).toFixed(2));
      rec.eutrofia = Number((row.Eutrofia_Pct || 58).toFixed(2));
      rec.total_avaliados = Number(row.Total || 0);
    } else {
      if (isNaN(lat) || isNaN(lon)) return;
      const ubsName = findNearestUbsName(lat, lon);
      if (!ubsName) return;

      const rec = getOrInit(year, ubsName, row);
      rec.obesidade = Number(((row.Obesidade_Pct || 0) + (row.Obesidade_Grave_Pct || 0)).toFixed(2));
      rec.sobrepeso = Number((row.Sobrepeso_Pct || 0).toFixed(2));
      rec.eutrofia = Number((row.Eutrofia_Pct || 58).toFixed(2));
      rec.total_avaliados = Number(row.Total || 0);
    }
  });

  desnutricaoRows.forEach((row) => {
    const year = String(row.Ano);
    const lat = Number(row.lat_ubs);
    const lon = Number(row.lon_ubs);
    if (!year) return;

    const isSchool = isNaN(Number(row.CNES || row.cnes));

    if (isSchool) {
      const schoolName = String(row.CNES || row.cnes);
      schoolPredictions[schoolName] = schoolPredictions[schoolName] || {};
      schoolPredictions[schoolName][year] = schoolPredictions[schoolName][year] || {
        ano: Number(year),
        status: Number(year) >= 2026 ? 'PREVISÃO' : 'DADO HISTÓRICO'
      };
      const rec = schoolPredictions[schoolName][year];
      rec.desnutricao = Number((row.Tendencia_Desnutricao || row.Magreza_Pct || 2.62).toFixed(2));
      rec.magreza = Number((row.Magreza_Pct || 0).toFixed(2));
    } else {
      if (isNaN(lat) || isNaN(lon)) return;
      const ubsName = findNearestUbsName(lat, lon);
      if (!ubsName) return;

      const rec = getOrInit(year, ubsName, row);
      rec.desnutricao = Number((row.Tendencia_Desnutricao || row.Magreza_Pct || 2.62).toFixed(2));
      rec.magreza = Number((row.Magreza_Pct || 0).toFixed(2));
    }
  });

  Object.keys(regionalData).forEach((year) => {
    Object.keys(regionalData[year]).forEach((ubsName) => {
      const rec = regionalData[year][ubsName];
      const normalized = normalizePercentages(
        {
          desnutricao: rec.desnutricao ?? 2.62,
          magreza: rec.magreza ?? 0,
          obesidade: rec.obesidade ?? 12.93,
          sobrepeso: rec.sobrepeso ?? 15.2,
          eutrofia: rec.eutrofia ?? 61.55
        },
        ['desnutricao', 'magreza', 'obesidade', 'sobrepeso', 'eutrofia']
      );

      rec.desnutricao = normalized.desnutricao;
      rec.magreza = normalized.magreza;
      rec.obesidade = normalized.obesidade;
      rec.sobrepeso = normalized.sobrepeso;
      rec.eutrofia = normalized.eutrofia;
    });
  });

  Object.keys(schoolPredictions).forEach((schoolName) => {
    Object.keys(schoolPredictions[schoolName]).forEach((year) => {
      const rec = schoolPredictions[schoolName][year];
      const normalized = normalizePercentages(
        {
          desnutricao: rec.desnutricao ?? 2.62,
          magreza: rec.magreza ?? 0,
          obesidade: rec.obesidade ?? 12.93,
          sobrepeso: rec.sobrepeso ?? 15.2,
          eutrofia: rec.eutrofia ?? 61.55
        },
        ['desnutricao', 'magreza', 'obesidade', 'sobrepeso', 'eutrofia']
      );
      rec.desnutricao = normalized.desnutricao;
      rec.magreza = normalized.magreza;
      rec.obesidade = normalized.obesidade;
      rec.sobrepeso = normalized.sobrepeso;
      rec.eutrofia = normalized.eutrofia;
    });
  });

  attachRegionalDeltaMetrics(regionalData);

  return {
    regionalData,
    temporalData: buildTemporalDataFromRegionalData(regionalData),
    bairroMetrics: {},
    schoolPredictions,
    source: 'local-csv' as const,
    artifacts: ['NutriAlerta_Projecao_Futura.csv', 'NutriAlerta_Projecao_Desnutricao.csv']
  };
}

function mergeRegionalData(
  historical: Record<string, Record<string, any>>,
  predicted: Record<string, Record<string, any>>
): Record<string, Record<string, any>> {
  const merged = { ...historical };
  Object.keys(predicted).forEach((year) => {
    if (!merged[year]) {
      merged[year] = { ...predicted[year] };
    } else {
      merged[year] = { ...merged[year] };
      Object.keys(predicted[year]).forEach((ubsName) => {
        merged[year][ubsName] = {
          ...(merged[year][ubsName] || {}),
          ...predicted[year][ubsName]
        };
      });
    }
  });
  return merged;
}

function mergeSchoolPredictions(
  schoolMetrics: Record<string, any>,
  schoolPredictions: Record<string, Record<string, any>>
): Record<string, any> {
  const merged = { ...schoolMetrics };
  Object.keys(schoolPredictions).forEach((schoolName) => {
    const matchingKey = Object.keys(merged).find(
      (k) => k === schoolName || k.startsWith(schoolName) || schoolName.startsWith(k)
    );
    if (matchingKey) {
      merged[matchingKey] = {
        ...merged[matchingKey],
        anos: {
          ...(merged[matchingKey].anos || {}),
          ...Object.keys(schoolPredictions[schoolName]).reduce((acc: any, year) => {
            const pred = schoolPredictions[schoolName][year];
            acc[year] = {
              desnutricao: pred.desnutricao,
              magreza: pred.magreza,
              eutrofia: pred.eutrofia,
              sobrepeso: pred.sobrepeso,
              obesidade: pred.obesidade,
              total_avaliados: pred.total_avaliados || 100
            };
            return acc;
          }, {})
        }
      };
    }
  });
  return merged;
}

export async function GET(req: NextRequest) {
  const isKvConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  const { searchParams } = new URL(req.url);
  const bypassCache = searchParams.get('bypassCache') === 'true' || searchParams.get('refresh') === 'true';

  // ── CACHE READ ──────────────────────────────────────────────────────────────
  if (isKvConfigured && !bypassCache) {
    try {
      const cached = await kv.get(CACHE_KEY);
      if (cached) {
        console.log('[Cache HIT] Returning cached data');
        return NextResponse.json(cached);
      }
    } catch (e) {
      console.warn('[Cache] KV read failed, proceeding to full fetch');
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  const cwd = process.cwd();
  let sourceMeta: SourceMeta = {
    source: 'supabase',
    fallbackReason: null,
    artifacts: ['registros_saude'],
    lastUpdated: new Date().toISOString()
  };

  let demographicData: Record<string, any> | null = null;
  let schoolMetrics: Record<string, any> = {};
  let regionalData: Record<string, Record<string, any>> = {};
  let bairroMetrics: Record<string, any> = {};
  let temporalData = createDefaultTemporalData();
  let yearsList = temporalData.map((entry) => entry.ano);

  try {
    const consolidatedPath = await findCSVFile(['Base_Nutricional_Consolidada_Final.csv']);
    const obesityPath = await findCSVFile(['NutriAlerta_Projecao_Futura-2.csv', 'NutriAlerta_Projecao_Futura.csv']);
    const desnutricaoPath = await findCSVFile(['NutriAlerta_Projecao_Desnutricao.csv']);
    const demographicsPath = await findCSVFile(['NutriAlerta_Projecao_Demografica.json']);

    if (consolidatedPath && obesityPath) {
      try {
        const statsConsolidated = await fs.stat(consolidatedPath);
        const statsObesity = await fs.stat(obesityPath);

        if (statsConsolidated.mtime > statsObesity.mtime) {
          console.log("[Auto-ML Retrain] Base de dados modificada! Iniciando retreinamento assíncrono do modelo...");
          const modelScriptPath = path.join(cwd, '..', '..', 'models', 'unified_ML.py');

          fs.access(modelScriptPath)
            .then(() => {
              exec(`python "${modelScriptPath}"`, { cwd: path.dirname(modelScriptPath) }, (err) => {
                if (err) {
                  console.error("[Auto-ML Retrain ERROR] Falha ao re-treinar o modelo de IA:", err);
                  return;
                }
                console.log("[Auto-ML Retrain SUCCESS] Modelo de IA re-treinado com sucesso em tempo real!");
              });
            })
            .catch(() => {
              console.warn(`[Auto-ML Retrain WARNING] Script de ML não encontrado em: ${modelScriptPath}. Ignorando retreinamento.`);
            });
        }
      } catch (statErr) {
        console.error("[Auto-ML Retrain Check ERROR]", statErr);
      }
    }

    if (demographicsPath) {
      try {
        const demographicContent = await fs.readFile(demographicsPath, 'utf-8');
        demographicData = JSON.parse(demographicContent);
        Object.keys(demographicData || {}).forEach((key) => {
          const entry = demographicData?.[key];
          if (entry && Array.isArray(entry.ageGroups)) {
            entry.ageGroups.forEach((group: any) => {
              const rawObj = {
                desnutricao: group.desnutricao?.rate || 0,
                sobrepeso: group.sobrepeso?.rate || 0,
                obesidade: group.obesidade?.rate || 0,
                eutrofia: group.eutrofia?.rate || 0
              };
              const normalized = normalizePercentages(rawObj, ['desnutricao', 'sobrepeso', 'obesidade', 'eutrofia']);
              if (group.desnutricao) group.desnutricao.rate = normalized.desnutricao;
              if (group.sobrepeso) group.sobrepeso.rate = normalized.sobrepeso;
              if (group.obesidade) group.obesidade.rate = normalized.obesidade;
              if (group.eutrofia) group.eutrofia.rate = normalized.eutrofia;
            });
          }
        });
      } catch (err) {
        console.error('Error reading demographics JSON:', err);
      }
    }

    try {
      const liveSchoolMetrics = await fetchAndSyncDbData();
      if (liveSchoolMetrics && Object.keys(liveSchoolMetrics).length > 0) {
        schoolMetrics = JSON.parse(JSON.stringify(liveSchoolMetrics));
        Object.values(schoolMetrics).forEach((school: any) => {
          if (!school?.anos) return;
          Object.keys(school.anos).forEach((year) => {
            const data = school.anos[year];
            const normalized = normalizePercentages(
              {
                desnutricao: data.desnutricao || 0,
                magreza: data.magreza || 0,
                obesidade: data.obesidade || 0,
                sobrepeso: data.sobrepeso || 0,
                eutrofia: data.eutrofia || 0
              },
              ['desnutricao', 'magreza', 'obesidade', 'sobrepeso', 'eutrofia']
            );
            data.desnutricao = normalized.desnutricao;
            data.magreza = normalized.magreza;
            data.obesidade = normalized.obesidade;
            data.sobrepeso = normalized.sobrepeso;
            data.eutrofia = normalized.eutrofia;
          });
        });

        schoolMetrics = projectSchoolMetricsForward(schoolMetrics);

        // Carrega prioritariamente as previsões epidemiológicas consolidada da nuvem do Supabase
        const cloudPredictions = await loadSupabasePrevisoes();
        if (cloudPredictions) {
          if (cloudPredictions.schoolPredictions) {
            schoolMetrics = mergeSchoolPredictions(schoolMetrics, cloudPredictions.schoolPredictions);
          }

          sourceMeta = {
            source: 'supabase',
            fallbackReason: null,
            artifacts: ['previsoes_nutricionais'],
            lastUpdated: new Date().toISOString()
          };
        }

        // Agrupa todas as informações a partir das escolas finalizadas (histórico + previsões)
        regionalData = buildRegionalDataFromSchoolMetrics(schoolMetrics);
        attachRegionalDeltaMetrics(regionalData);
        bairroMetrics = buildBairroMetricsFromSchoolMetrics(schoolMetrics, regionalData);
        temporalData = buildTemporalDataFromRegionalData(regionalData);
        yearsList = temporalData.map((entry) => entry.ano);
      } else {
        throw new Error('Supabase returned empty school metrics');
      }
    } catch (dbErr: any) {
      sourceMeta = {
        source: 'local-json',
        fallbackReason: dbErr?.message || 'Supabase unavailable',
        artifacts: ['dbConsolidatedData.json'],
        lastUpdated: new Date().toISOString()
      };

      try {
        schoolMetrics = JSON.parse(JSON.stringify((dbConsolidatedLocal as any).schoolMetrics || {}));
      } catch (cacheErr) {
        schoolMetrics = {};
      }

      if (Object.keys(schoolMetrics).length > 0) {
        schoolMetrics = projectSchoolMetricsForward(schoolMetrics);
      }

      // Tenta prioritariamente carregar previsões em nuvem mesmo no cenário de contingência de escolas
      const cloudPredictions = await loadSupabasePrevisoes();
      if (cloudPredictions) {
        if (cloudPredictions.schoolPredictions) {
          schoolMetrics = mergeSchoolPredictions(schoolMetrics, cloudPredictions.schoolPredictions);
        }
        sourceMeta = {
          source: 'local-json',
          fallbackReason: dbErr?.message || 'School sync failed, using Cloud ML predictions',
          artifacts: ['previsoes_nutricionais'],
          lastUpdated: new Date().toISOString()
        };
      }

      // Agrupa todas as informações a partir das escolas se disponíveis
      if (Object.keys(schoolMetrics).length > 0) {
        regionalData = buildRegionalDataFromSchoolMetrics(schoolMetrics);
        attachRegionalDeltaMetrics(regionalData);
        bairroMetrics = buildBairroMetricsFromSchoolMetrics(schoolMetrics, regionalData);
        temporalData = buildTemporalDataFromRegionalData(regionalData);
        yearsList = temporalData.map((entry) => entry.ano);
      } else if (cloudPredictions) {
        // Fallback extremo caso não tenha escolas mas tenha previsões de nuvem de UBS
        regionalData = cloudPredictions.regionalData;
        attachRegionalDeltaMetrics(regionalData);
        temporalData = buildTemporalDataFromRegionalData(regionalData);
        bairroMetrics = {};
        yearsList = temporalData.map((entry) => entry.ano);
      } else if (obesityPath && desnutricaoPath) {
        const localFallback = await loadLocalCsvFallback(cwd);
        sourceMeta = {
          source: localFallback.source,
          fallbackReason: sourceMeta.fallbackReason,
          artifacts: localFallback.artifacts,
          lastUpdated: new Date().toISOString()
        };
        
        if (localFallback.schoolPredictions) {
          schoolMetrics = mergeSchoolPredictions(schoolMetrics, localFallback.schoolPredictions);
        }

        if (Object.keys(schoolMetrics).length > 0) {
          regionalData = buildRegionalDataFromSchoolMetrics(schoolMetrics);
          attachRegionalDeltaMetrics(regionalData);
          bairroMetrics = buildBairroMetricsFromSchoolMetrics(schoolMetrics, regionalData);
          temporalData = buildTemporalDataFromRegionalData(regionalData);
          yearsList = temporalData.map((entry) => entry.ano);
        } else {
          regionalData = localFallback.regionalData;
          attachRegionalDeltaMetrics(regionalData);
          temporalData = localFallback.temporalData;
          bairroMetrics = localFallback.bairroMetrics;
          yearsList = localFallback.temporalData.map((entry) => entry.ano);
        }
      }
    }

    if (Object.keys(temporalData).length === 0) {
      temporalData = createDefaultTemporalData();
      yearsList = temporalData.map((entry) => entry.ano);
    }

    const responseData = {
      success: true,
      temporalData,
      regionalData,
      schoolMetrics,
      bairroMetrics,
      demographicData,
      yearsList,
      sourceMeta
    };

    // ── CACHE WRITE ─────────────────────────────────────────────────────────────
    if (isKvConfigured) {
      try {
        await kv.set(CACHE_KEY, responseData, { ex: CACHE_TTL });
        console.log('[Cache] Data cached for 6 hours');
      } catch (e) {
        console.warn('[Cache] KV write failed');
      }
    }
    // ────────────────────────────────────────────────────────────────────────────

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('API Dynamic Data Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
