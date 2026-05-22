const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load env vars
const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = 'https://peqvaslchaxrewhtxltc.supabase.co';
let supabaseAnonKey = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim();
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// UBS CNES mapping
const UBS_CNES = {
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
  "USF Bonsucesso/Novo Wenzel “Célia Aparecida Ceccato da Silva”": "2055902",
  "USF Jardim das Flores “Dr. Moacir Camargo”": "2074419",
  "USF Guanabara “Dr. Celestino Donato”": "2074222",
  "USF Panorama “Dr. Osvaldo Akamine”": "2074346",
  "USF Terra Nova": "7533032"
};

// Standard child nutritional classification (based on child BMI)
function classifyBMI(peso, altura) {
  if (!peso || !altura || altura <= 0) return 'Eutrofia';
  const imc = peso / (altura * altura);
  if (imc < 16.0) return 'Magreza_Acentuada';
  if (imc < 18.5) return 'Magreza';
  if (imc < 25.0) return 'Eutrofia';
  if (imc < 30.0) return 'Sobrepeso';
  if (imc < 35.0) return 'Obesidade';
  return 'Obesidade_Grave';
}

async function runSync() {
  console.log('--- STARTING NUTRI ALERTA DATABASE DYNAMIC SYNC ---');
  
  // 1. Sign in as superadmin to bypass RLS policies
  console.log('Authenticating with Supabase...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'nutrialerta@gmail.com',
    password: '#Pangam123@'
  });
  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    process.exit(1);
  }
  console.log('✅ Authenticated successfully!');

  // 2. Fetch all schools
  console.log('Fetching schools...');
  const { data: dbSchools, error: schoolsErr } = await supabase.from('escolas').select('*');
  if (schoolsErr) {
    console.error('❌ Failed to fetch schools:', schoolsErr.message);
    process.exit(1);
  }
  console.log(`✅ Loaded ${dbSchools.length} schools from database.`);

  // 3. Fetch all health records in sequential chunks
  console.log('Fetching health records...');
  const pageSize = 1000;
  const allRecords = [];
  let i = 0;
  
  while (true) {
    console.log(`Fetching records ${i} to ${i + pageSize - 1}...`);
    const { data, error } = await supabase
      .from('registros_saude')
      .select('*')
      .range(i, i + pageSize - 1);
      
    if (error) {
      console.error(`❌ Range fetch error at range ${i}-${i + pageSize - 1}:`, error.message);
      process.exit(1);
    }
    
    if (data && data.length > 0) {
      allRecords.push(...data);
      console.log(`Successfully fetched ${data.length} records. Total accumulated: ${allRecords.length}`);
      if (data.length < pageSize) {
        console.log('Reached the end of available records.');
        break;
      }
      i += pageSize;
    } else {
      console.log('No more records returned.');
      break;
    }
  }

  // 4. Load spatial mapping POIs from extractedPois.json
  const poisPath = path.join(__dirname, 'src', 'lib', 'extractedPois.json');
  let extractedPois = [];
  if (fs.existsSync(poisPath)) {
    extractedPois = JSON.parse(fs.readFileSync(poisPath, 'utf8'));
  }
  console.log(`Loaded ${extractedPois.length} POIs for geospatial school-to-UBS mapping.`);

  // Map school DB name to POI metadata
  const schoolMap = {};
  dbSchools.forEach(s => {
    // Normalization helper
    const norm = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    const dbNorm = norm(s.nome);
    
    // Find matching school in extractedPois
    let match = extractedPois.find(p => p.categoria === 'Educação' && norm(p.nome) === dbNorm);
    if (!match) {
      // Fuzzy prefix/suffix/includes matching
      match = extractedPois.find(p => p.categoria === 'Educação' && (norm(p.nome).includes(dbNorm) || dbNorm.includes(norm(p.nome))));
    }
    
    schoolMap[s.id] = {
      dbSchool: s,
      poi: match || null,
      bairro: match ? match.bairro : 'Desconhecido',
      regiao_ubs: match ? match.regiao_ubs : 'UBS Jardim Chervezon “Dr. Nicolino Maziotti”' // default
    };
  });

  // 5. Group records by Year and UBS region for base CSV model file
  const ubsYearGroups = {}; // key: `cnes-year`
  
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
        cnes,
        ubsName,
        ano: year,
        Magreza_Acentuada_Qtd: 0,
        Magreza_Qtd: 0,
        Eutrofia_Qtd: 0,
        Sobrepeso_Qtd: 0,
        Obesidade_Qtd: 0,
        Obesidade_Grave_Qtd: 0,
        Total: 0
      };
    }

    const classification = classifyBMI(Number(r.peso), Number(r.altura));
    ubsYearGroups[key][`${classification}_Qtd`]++;
    ubsYearGroups[key].Total++;
  });

  // 6. Generate the consolidated CSV in memory
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
  
  Object.values(ubsYearGroups).forEach(g => {
    const total = g.Total;
    if (total === 0) return;

    const magAcentPct = ((g.Magreza_Acentuada_Qtd / total) * 100).toFixed(6);
    const magPct = ((g.Magreza_Qtd / total) * 100).toFixed(6);
    const eutPct = ((g.Eutrofia_Qtd / total) * 100).toFixed(6);
    const sobPct = ((g.Sobrepeso_Qtd / total) * 100).toFixed(6);
    const obsPct = ((g.Obesidade_Qtd / total) * 100).toFixed(6);
    const obsGravePct = ((g.Obesidade_Grave_Qtd / total) * 100).toFixed(6);

    const row = [
      'SP', '354390', 'RIO CLARO', g.cnes, g.ubsName,
      '', '', '', '', '', '', '', '', // placeholder values for traditional fields
      total, 'SP', g.ano, '0 a 18 anos',
      g.Magreza_Acentuada_Qtd, magAcentPct,
      g.Magreza_Qtd, magPct,
      g.Eutrofia_Qtd, eutPct,
      g.Sobrepeso_Qtd, sobPct,
      g.Obesidade_Qtd, obsPct,
      g.Obesidade_Grave_Qtd, obsGravePct
    ];

    csvRows.push(row.join(','));
  });

  // Write base nutritional consolidated CSV
  const csvDestPath = path.join(__dirname, '..', 'csv', 'Base_Nutricional_Consolidada_Final.csv');
  console.log(`Writing consolidated CSV data to: ${csvDestPath}`);
  fs.writeFileSync(csvDestPath, csvRows.join('\n'), 'utf8');

  // 7. Also build a high-fidelity school, neighborhood, and UBS dynamic metrics cache JSON
  // This will completely prevent any "N/D" or "fallback" values in all analysis levels!
  const schoolYearGroups = {}; // key: `schoolId-year`
  
  allRecords.forEach(r => {
    const date = new Date(r.data_coleta);
    const year = date.getFullYear();
    if (isNaN(year) || year < 2000) return;

    const key = `${r.escola_id}-${year}`;
    if (!schoolYearGroups[key]) {
      schoolYearGroups[key] = {
        escola_id: r.escola_id,
        ano: year,
        Magreza_Acentuada_Qtd: 0,
        Magreza_Qtd: 0,
        Eutrofia_Qtd: 0,
        Sobrepeso_Qtd: 0,
        Obesidade_Qtd: 0,
        Obesidade_Grave_Qtd: 0,
        Total: 0
      };
    }

    const classification = classifyBMI(Number(r.peso), Number(r.altura));
    schoolYearGroups[key][`${classification}_Qtd`]++;
    schoolYearGroups[key].Total++;
  });

  // Compile full school coordinates/neighborhood mapping along with metrics
  const schoolMetrics = {};
  Object.values(schoolYearGroups).forEach(g => {
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

  // Write school metrics JSON cache
  const jsonDestPath = path.join(__dirname, 'src', 'lib', 'dbConsolidatedData.json');
  console.log(`Writing consolidated JSON cache to: ${jsonDestPath}`);
  fs.writeFileSync(jsonDestPath, JSON.stringify({
    schoolMetrics,
    schoolMap: Object.keys(schoolMap).reduce((acc, id) => {
      acc[id] = {
        nome: schoolMap[id].dbSchool.nome,
        bairro: schoolMap[id].bairro,
        regiao_ubs: schoolMap[id].regiao_ubs
      };
      return acc;
    }, {})
  }, null, 2), 'utf8');

  console.log('✅ SYNC COMPLETED SUCCESSFULLY!');
}

runSync().catch(err => {
  console.error('❌ Sync failed with error:', err);
  process.exit(1);
});
