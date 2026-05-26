import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import { kv } from '@vercel/kv';

const CACHE_KEY = 'nutrialerta_data_cache';
const CACHE_TTL = 60 * 60 * 6; // 6 horas em segundos

// Isolated thread-safe authenticated admin client to bypass RLS in the cloud database
async function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://peqvaslchaxrewhtxltc.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data, error } = await client.auth.signInWithPassword({
    email: 'nutrialerta@gmail.com',
    password: '#Pangam123@'
  });

  if (error) {
    throw new Error(`Auth RLS bypass failed: ${error.message}`);
  }

  return client;
}

// UBS CNES mapping from sync_db_data.js
const UBS_CNES: Record<string, string> = {
  "UBS Jardim Chervezon \u201cDr. Nicolino Maziotti\u201d": "2074362",
  "UBS 29 \u201cOreste Armando Giovani\u201d": "2031922",
  "UBS Wenzel \u201cDr. Mario Fittipaldi\u201d": "2030462",
  "UBS Vila Cristina \u201cDr. S\u00edlvio Arnaldo Piva\u201d": "2073943",
  "USF Assist\u00eancia": "2055821",
  "USF Ferraz": "6222629",
  "USF Nosso Teto/Boa Vista \u201cDr. Antonio R.M. Santomauro\u201d": "2055902",
  "USF Ajapi/Ferraz": "2049163",
  "USF M\u00e3e PretaI/II": "2071665",
  "USF Palmeiras I/II \u201cDr. Gilson Giovanni\u201d": "2033186",
  "USF Jardim Novo I E II \u201cDr. Dirceu Ferreira Penteado\u201d": "2074214",
  "USF Benjamin de Castro": "7058865",
  "USF Bonsucesso/Novo Wenzel \u201cC\u00e9lia Aparecida Ceccato da Silva\u201d": "2055902",
  "USF Jardim das Flores \u201cDr. Moacir Camargo\u201d": "2074419",
  "USF Guanabara \u201cDr. Celestino Donato\u201d": "2074222",
  "USF Panorama \u201cDr. Osvaldo Akamine\u201d": "2074346",
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
      if (data.length < pageSize) break;
      i += pageSize;
    } else {
      break;
    }
  }
  
  console.log(`[Supabase Cloud Sync] Loaded ${allRecords.length} records from Supabase.`);

  const poisPath = path.join(cwd, 'src', 'lib', 'extractedPois.json');
  let extractedPois: any[] = [];
  try {
    const poisContent = await fs.readFile(poisPath, 'utf8');
    extractedPois = JSON.parse(poisContent);
  } catch (err) {
    console.warn('[Supabase Cloud Sync] extractedPois.json not found, using empty array.');
  }

  const schoolMap: Record<string, any> = {};
  dbSchools.forEach((s: any) => {
    const norm = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    const dbNorm = norm(s.nome);
    
    let match = extractedPois.find(p => p.categoria === 'Educa\u00e7\u00e3o' && norm(p.nome) === dbNorm);
    if (!match) {
      match = extractedPois.find(p => p.categoria === 'Educa\u00e7\u00e3o' && (norm(p.nome).includes(dbNorm) || dbNorm.includes(norm(p.nome))));
    }
    
    schoolMap[s.id] = {
      dbSchool: s,
      poi: match || null,
      bairro: match ? match.bairro : 'Desconhecido',
      regiao_ubs: match ? match.regiao_ubs : 'UBS Jardim Chervezon "Dr. Nicolino Maziotti"'
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
      try { await fs.writeFile(p, csvRows.join('\n'), 'utf8'); } catch (err) {}
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

  const schoolMetrics: Record<string, any> = {};
  Object.values(schoolYearGroups).forEach((g: any) => {
    const schMeta = schoolMap[g.escola_id];
    if (!schMeta) return;
    const schoolName = schMeta.dbSchool.nome;
    const total = g.Total;
    if (total === 0) return;
    if (!schoolMetrics[schoolName]) {
      schoolMetrics[schoolName] = {
        nome: schoolName,
        lat: schMeta.poi ? schMeta.poi.lat : -22.41,
        lon: schMeta.poi ? schMeta.poi.lon : -47.56,
        bairro: schMeta.bairro,
        regiao_ubs: schMeta.regiao_ubs,
        anos: {}
      };
    }
    schoolMetrics[schoolName].anos[g.ano] = {
      desnutricao: Number((((g.Magreza_Acentuada_Qtd + g.Magreza_Qtd) / total) * 100).toFixed(2)),
      eutrofia: Number(((g.Eutrofia_Qtd / total) * 100).toFixed(2)),
      sobrepeso: Number(((g.Sobrepeso_Qtd / total) * 100).toFixed(2)),
      obesidade: Number((((g.Obesidade_Qtd + g.Obesidade_Grave_Qtd) / total) * 100).toFixed(2)),
      total_avaliados: total
    };
  });

  const dbConsolidatedResult = {
    schoolMetrics,
    schoolMap: Object.keys(schoolMap).reduce((acc: any, id: string) => {
      acc[id] = {
        nome: schoolMap[id].dbSchool.nome,
        bairro: schoolMap[id].bairro,
        regiao_ubs: schoolMap[id].regiao_ubs
      };
      return acc;
    }, {})
  };

  try {
    const jsonDestPath = path.join(cwd, 'src', 'lib', 'dbConsolidatedData.json');
    await fs.writeFile(jsonDestPath, JSON.stringify(dbConsolidatedResult, null, 2), 'utf8');
  } catch (err) {}

  return schoolMetrics;
}

const UNIDADES_SAUDE = [
  { nome: "UBS Jardim Chervezon \u201cDr. Nicolino Maziotti\u201d", categoria: "UBS", lat: -22.385236150603358, lon: -47.564888689845596 },
  { nome: "UBS 29 \u201cOreste Armando Giovani\u201d", categoria: "UBS", lat: -22.42459370350195, lon: -47.56384685307812 },
  { nome: "UBS Wenzel \u201cDr. Mario Fittipaldi\u201d", categoria: "UBS", lat: -22.388922097585972, lon: -47.58697051682788 },
  { nome: "UBS Vila Cristina \u201cDr. S\u00edlvio Arnaldo Piva\u201d", categoria: "UBS", lat: -22.383777261453787, lon: -47.55011343217318 },
  { nome: "Unidade de urg\u00eancia e emerg\u00eancia Nossa Senhora de Lourdes", categoria: "Pronto-Atendimento", lat: -22.41525217891934, lon: -47.55724428006094 },
  { nome: "UPA Chervezon", categoria: "Pronto-Atendimento", lat: -22.386031433205883, lon: -47.56481686100926 },
  { nome: "USF Assist\u00eancia", categoria: "UBS", lat: -22.500679761791204, lon: -47.58613791682307 },
  { nome: "USF Ferraz", categoria: "UBS", lat: -22.40860628729808, lon: -47.56232297820725 },
  { nome: "USF Nosso Teto/Boa Vista \u201cDr. Antonio R.M. Santomauro\u201d", categoria: "UBS", lat: -22.380490359110794, lon: -47.589205622903904 },
  { nome: "USF Ajapi/Ferraz", categoria: "UBS", lat: -22.28105677996832, lon: -47.54793785545208 },
  { nome: "USF M\u00e3e PretaI/II", categoria: "UBS", lat: -22.372630657380274, lon: -47.54392295519118 },
  { nome: "USF Palmeiras I/II \u201cDr. Gilson Giovanni\u201d", categoria: "UBS", lat: -22.428576882739897, lon: -47.58565651311844 },
  { nome: "USF Jardim Novo I E II \u201cDr. Dirceu Ferreira Penteado\u201d", categoria: "UBS", lat: -22.45320103742713, lon: -47.579031632170135 },
  { nome: "USF Benjamin de Castro", categoria: "UBS", lat: -22.415175533330167, lon: -47.5857422824289 },
  { nome: "USF Bonsucesso/Novo Wenzel \u201cC\u00e9lia Aparecida Ceccato da Silva\u201d", categoria: "UBS", lat: -22.40667484194884, lon: -47.602627740101724 },
  { nome: "USF Jardim das Flores \u201cDr. Moacir Camargo\u201d", categoria: "UBS", lat: -22.375771166559428, lon: -47.58014827957286 },
  { nome: "USF Guanabara \u201cDr. Celestino Donato\u201d", categoria: "UBS", lat: -22.43873461683572, lon: -47.5799385940652 },
  { nome: "USF Panorama \u201cDr. Osvaldo Akamine\u201d", categoria: "UBS", lat: -22.385357450828135, lon: -47.591746516828024 },
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
  keys.forEach(k => { sum += Number(result[k]) || 0; });
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
      if (val > maxVal) { maxVal = val; maxKey = k; }
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
    try { await fs.access(p); return p; } catch {}
  }
  return null;
}

export async function GET(req: NextRequest) {
  const isKvConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  // ── CACHE READ ──────────────────────────────────────────────────────────────
  if (isKvConfigured) {
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
  try {
    const consolidatedPath = await findCSVFile(['Base_Nutricional_Consolidada_Final.csv']);
    const obesityPath = await findCSVFile(['NutriAlerta_Projecao_Futura-2.csv', 'NutriAlerta_Projecao_Futura.csv']);
    const desnutricaoPath = await findCSVFile(['NutriAlerta_Projecao_Desnutricao.csv']);
    const demographicsPath = await findCSVFile(['NutriAlerta_Projecao_Demografica.json']);

    if (!obesityPath || !desnutricaoPath) {
      console.warn("CSV Files not found!");
      return NextResponse.json({ success: false, error: "CSV files not found. Please upload them to project/csv/" });
    }

    if (consolidatedPath && obesityPath) {
      try {
        const statsConsolidated = await fs.stat(consolidatedPath);
        const statsObesity = await fs.stat(obesityPath);
        if (statsConsolidated.mtime > statsObesity.mtime) {
          console.log("[Auto-ML Retrain] Base de dados modificada! Iniciando retreinamento assíncrono...");
          const modelScriptPath = path.join(cwd, '..', '..', 'models', 'unified_ML.py');
          exec(`python "${modelScriptPath}"`, { cwd: path.dirname(modelScriptPath) }, (err) => {
            if (err) console.error("[Auto-ML Retrain ERROR]", err);
            else console.log("[Auto-ML Retrain SUCCESS]");
          });
        }
      } catch (statErr) {
        console.error("[Auto-ML Retrain Check ERROR]", statErr);
      }
    }

    let demographicData = null;
    if (demographicsPath) {
      try {
        const demographicContent = await fs.readFile(demographicsPath, 'utf-8');
        demographicData = JSON.parse(demographicContent);
        if (demographicData) {
          Object.keys(demographicData).forEach(key => {
            const entry = demographicData[key];
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
        }
      } catch (err) {
        console.error("Error reading demographics JSON:", err);
      }
    }

    const obesityContent = await fs.readFile(obesityPath, 'utf-8');
    const desnutricaoContent = await fs.readFile(desnutricaoPath, 'utf-8');
    const obesityRows = parseCSV(obesityContent);
    const desnutricaoRows = parseCSV(desnutricaoContent);

    const rawDataMap: Record<string, Record<string, any>> = {};

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

    Object.keys(rawDataMap).forEach(year => {
      Object.keys(rawDataMap[year]).forEach(ubsName => {
        const rec = rawDataMap[year][ubsName] as any;
        const rawObj = {
          desnutricao: rec.desnutricao !== undefined ? rec.desnutricao : 2.62,
          obesidade: rec.obesidade !== undefined ? rec.obesidade : 12.93,
          sobrepeso: rec.sobrepeso !== undefined ? rec.sobrepeso : 15.2,
          eutrofia: rec.eutrofia !== undefined ? rec.eutrofia : 61.55
        };
        const normalized = normalizePercentages(rawObj, ['desnutricao', 'obesidade', 'sobrepeso', 'eutrofia']);
        rec.desnutricao = normalized.desnutricao;
        rec.obesidade = normalized.obesidade;
        rec.sobrepeso = normalized.sobrepeso;
        rec.eutrofia = normalized.eutrofia;
      });
    });

    const yearsSortedForDelta = Object.keys(rawDataMap).sort((a, b) => Number(a) - Number(b));
    yearsSortedForDelta.forEach((yr, index) => {
      Object.keys(rawDataMap[yr]).forEach(name => {
        const rec = rawDataMap[yr][name] as any;
        if (index === 0) {
          rec.delta_sobrepeso = 0;
          rec.delta_eutrofia = 0;
        } else {
          const prevYear = yearsSortedForDelta[index - 1];
          const prevRec = rawDataMap[prevYear]?.[name];
          rec.delta_sobrepeso = (prevRec?.sobrepeso !== undefined && rec.sobrepeso !== undefined)
            ? Number((rec.sobrepeso - prevRec.sobrepeso).toFixed(2)) : 0;
          rec.delta_eutrofia = (prevRec?.eutrofia !== undefined && rec.eutrofia !== undefined)
            ? Number((rec.eutrofia - prevRec.eutrofia).toFixed(2)) : 0;
        }
      });
    });

    const years = Object.keys(rawDataMap).sort((a, b) => Number(a) - Number(b));
    const temporalData = years.map(yr => {
      const ubsRecords = Object.values(rawDataMap[yr]);
      let totalObs = 0, countObs = 0, totalDes = 0, countDes = 0;
      let totalSob = 0, countSob = 0, totalEut = 0, countEut = 0;
      ubsRecords.forEach((rec: any) => {
        if (rec.obesidade != null) { totalObs += rec.obesidade; countObs++; }
        if (rec.desnutricao != null) { totalDes += rec.desnutricao; countDes++; }
        if (rec.sobrepeso != null) { totalSob += rec.sobrepeso; countSob++; }
        if (rec.eutrofia != null) { totalEut += rec.eutrofia; countEut++; }
      });
      const rawObj = {
        desnutricao: countDes > 0 ? totalDes / countDes : 2.62,
        obesidade: countObs > 0 ? totalObs / countObs : 12.93,
        sobrepeso: countSob > 0 ? totalSob / countSob : 15.2,
        eutrofia: countEut > 0 ? totalEut / countEut : 61.5
      };
      const normalized = normalizePercentages(rawObj, ['desnutricao', 'obesidade', 'sobrepeso', 'eutrofia']);
      const isPrevisao = Number(yr) >= 2026;
      return {
        ano: yr + (isPrevisao ? ' \u2605' : ''),
        desnutricao: normalized.desnutricao,
        obesidade: normalized.obesidade,
        sobrepeso: normalized.sobrepeso,
        eutrofia: normalized.eutrofia,
        isPrevisao
      };
    });

    let schoolMetrics: any = null;
    try {
      schoolMetrics = await fetchAndSyncDbData();
      console.log("[Supabase Cloud Sync SUCCESS] Fresh dynamic metrics fetched!");
    } catch (dbErr) {
      console.warn("[Supabase Cloud Sync Fallback] Falling back to local JSON cache...", dbErr);
    }

    if (!schoolMetrics || Object.keys(schoolMetrics).length === 0) {
      const dbConsolidatedPath = path.join(cwd, 'src', 'lib', 'dbConsolidatedData.json');
      const dbConsolidatedContent = await fs.readFile(dbConsolidatedPath, 'utf-8');
      const dbConsolidated = JSON.parse(dbConsolidatedContent);
      schoolMetrics = dbConsolidated.schoolMetrics;
    }

    schoolMetrics = JSON.parse(JSON.stringify(schoolMetrics));
    const schoolList = Object.values(schoolMetrics) as any[];

    schoolList.forEach(school => {
      Object.keys(school.anos).forEach(yr => {
        const data = school.anos[yr];
        const rawObj = {
          desnutricao: data.desnutricao || 0, obesidade: data.obesidade || 0,
          sobrepeso: data.sobrepeso || 0, eutrofia: data.eutrofia || 0
        };
        const normalized = normalizePercentages(rawObj, ['desnutricao', 'obesidade', 'sobrepeso', 'eutrofia']);
        data.desnutricao = normalized.desnutricao;
        data.obesidade = normalized.obesidade;
        data.sobrepeso = normalized.sobrepeso;
        data.eutrofia = normalized.eutrofia;
      });
    });

    schoolList.forEach(school => {
      const ubsName = school.regiao_ubs || findNearestUbsName(school.lat, school.lon) || UNIDADES_SAUDE[0].nome;
      ['2026', '2027'].forEach(targetYr => {
        const ubs2025 = rawDataMap['2025']?.[ubsName] || { desnutricao: 2.62, obesidade: 12.93, sobrepeso: 21.0, eutrofia: 61.55 };
        const ubsTarget = rawDataMap[targetYr]?.[ubsName];
        if (!ubsTarget) return;
        const deltaDes = (ubsTarget.desnutricao || 0) - (ubs2025.desnutricao || 0);
        const deltaObs = (ubsTarget.obesidade || 0) - (ubs2025.obesidade || 0);
        const deltaSob = (ubsTarget.sobrepeso || 0) - (ubs2025.sobrepeso || 0);
        const deltaEut = (ubsTarget.eutrofia || 0) - (ubs2025.eutrofia || 0);
        const schoolYears = Object.keys(school.anos).map(Number).filter(y => y <= 2025).sort((a, b) => b - a);
        const baselineYear = schoolYears[0] ? String(schoolYears[0]) : null;
        const baseline = baselineYear ? school.anos[baselineYear] : { desnutricao: 3.0, obesidade: 10.0, sobrepeso: 15.0, eutrofia: 72.0, total_avaliados: 100 };
        const rawObj = {
          desnutricao: Math.max(0, Math.min(100, (baseline.desnutricao || 0) + deltaDes)),
          obesidade: Math.max(0, Math.min(100, (baseline.obesidade || 0) + deltaObs)),
          sobrepeso: Math.max(0, Math.min(100, (baseline.sobrepeso || 0) + deltaSob)),
          eutrofia: Math.max(0, Math.min(100, (baseline.eutrofia || 0) + deltaEut))
        };
        const normalized = normalizePercentages(rawObj, ['desnutricao', 'obesidade', 'sobrepeso', 'eutrofia']);
        school.anos[targetYr] = { ...normalized, total_avaliados: baseline.total_avaliados || 100 };
      });
    });

    const bairrosPath = path.join(cwd, 'src', 'lib', 'rio_claro_bairros.json');
    const bairrosContent = await fs.readFile(bairrosPath, 'utf-8');
    const bairrosGeoJSON = JSON.parse(bairrosContent);

    const bairroCentroids: Record<string, { sumLon: number; sumLat: number; count: number; parentUbs: string }> = {};
    bairrosGeoJSON.features.forEach((feat: any) => {
      const props = feat.properties || {};
      const name = props.nome_real_bairro;
      if (!name) return;
      const geom = feat.geometry;
      if (!geom) return;
      let coords: number[][] = [];
      if (geom.type === 'Polygon') coords = geom.coordinates[0];
      else if (geom.type === 'MultiPolygon') geom.coordinates.forEach((poly: any) => { coords = coords.concat(poly[0]); });
      let sumLon = 0, sumLat = 0, count = 0;
      coords.forEach(pt => { if (Array.isArray(pt) && pt.length >= 2) { sumLon += pt[0]; sumLat += pt[1]; count++; } });
      if (count > 0) {
        if (!bairroCentroids[name]) bairroCentroids[name] = { sumLon: 0, sumLat: 0, count: 0, parentUbs: props.nome_bairro };
        bairroCentroids[name].sumLon += sumLon;
        bairroCentroids[name].sumLat += sumLat;
        bairroCentroids[name].count += count;
      }
    });

    const uniqueBairros: Record<string, { nome: string; lat: number; lon: number; parentUbs: string }> = {};
    Object.keys(bairroCentroids).forEach(name => {
      const data = bairroCentroids[name];
      uniqueBairros[name] = { nome: name, lat: data.sumLat / data.count, lon: data.sumLon / data.count, parentUbs: data.parentUbs };
    });

    const bairroMetrics: Record<string, any> = {};
    const yearsListCombined = [...years, '2026', '2027'];

    Object.keys(uniqueBairros).forEach(bName => {
      const bInfo = uniqueBairros[bName];
      let associatedSchools = schoolList.filter(s => s.bairro && s.bairro.trim().toLowerCase() === bName.trim().toLowerCase());
      if (associatedSchools.length === 0) {
        let closestSchool = null;
        let minDistance = Infinity;
        schoolList.forEach(school => {
          if (typeof school.lat !== 'number' || typeof school.lon !== 'number') return;
          const dist = getDistance(bInfo.lat, bInfo.lon, school.lat, school.lon);
          if (dist < minDistance) { minDistance = dist; closestSchool = school; }
        });
        if (closestSchool) associatedSchools = [closestSchool];
      }

      const anos: Record<string, any> = {};
      yearsListCombined.forEach(yr => {
        let sumAvaliados = 0, weightedDes = 0, weightedObs = 0, weightedSob = 0, weightedEut = 0;
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
          const rawObj = {
            desnutricao: weightedDes / sumAvaliados, obesidade: weightedObs / sumAvaliados,
            sobrepeso: weightedSob / sumAvaliados, eutrofia: weightedEut / sumAvaliados
          };
          const normalized = normalizePercentages(rawObj, ['desnutricao', 'obesidade', 'sobrepeso', 'eutrofia']);
          anos[yr] = { ...normalized, total_avaliados: sumAvaliados };
        } else {
          const ubsData = rawDataMap[yr]?.[bInfo.parentUbs] || rawDataMap[yr]?.[Object.keys(rawDataMap[yr] || {})[0]];
          if (ubsData) {
            const rawObj = {
              desnutricao: ubsData.desnutricao || 0, obesidade: ubsData.obesidade || 0,
              sobrepeso: ubsData.sobrepeso || 0, eutrofia: ubsData.eutrofia || 100
            };
            const normalized = normalizePercentages(rawObj, ['desnutricao', 'obesidade', 'sobrepeso', 'eutrofia']);
            anos[yr] = { ...normalized, total_avaliados: 100 };
          } else {
            anos[yr] = { desnutricao: 3.0, obesidade: 12.0, sobrepeso: 15.0, eutrofia: 70.0, total_avaliados: 100 };
          }
        }
      });

      bairroMetrics[bName] = { nome: bName, lat: bInfo.lat, lon: bInfo.lon, regiao_ubs: bInfo.parentUbs, anos };
    });

    // ── CACHE WRITE ─────────────────────────────────────────────────────────────
    const responseData = {
      success: true,
      temporalData,
      regionalData: rawDataMap,
      schoolMetrics,
      bairroMetrics,
      demographicData,
      yearsList: years
    };

    if (isKvConfigured) {
      try {
        await kv.set(CACHE_KEY, responseData, { ex: CACHE_TTL });
        console.log('[Cache] Data cached for 6 hours');
      } catch (e) {
        console.warn('[Cache] KV write failed');
      }
    }

    return NextResponse.json(responseData);
    // ────────────────────────────────────────────────────────────────────────────

  } catch (error: any) {
    console.error("API Dynamic Data Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
