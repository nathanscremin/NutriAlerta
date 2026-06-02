import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { getAdminSupabaseClient } from '@/lib/supabaseAdmin';
import { classifyNutritionWHO } from '@/lib/nutritionUtils';

// Algoritmo de criptografia irrefutável para dados pessoais de menores (LGPD)
const ALGORITHM = 'aes-256-gcm';

const SECRET_KEY = process.env.ENCRYPTION_KEY;
const SALT = process.env.HASH_SALT;

if (!SECRET_KEY || SECRET_KEY.length !== 32) {
  throw new Error('LGPD Security Module failed: ENCRYPTION_KEY environment variable is not defined or is not exactly 32 bytes/characters long.');
}

if (!SALT) {
  throw new Error('LGPD Security Module failed: HASH_SALT environment variable is not defined.');
}

// UBS CNES mapping to resolve codes into textual names for local processing
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

// Função para atualizar a base consolidada local de dados (CSV) e re-treinar o modelo de IA
async function updateConsolidatedCSV(ubsName: string, classificacao: string) {
  try {
    const csvFilename = 'Base_Nutricional_Consolidada_Final.csv';
    const cwd = process.cwd();
    
    // Caminhos para atualizar nos dois subprojetos
    const pathsToUpdate: string[] = [];
    const pathNA = path.join(cwd, '..', 'csv', csvFilename);
    const pathNFS = path.join(cwd, '..', '..', '..', 'Nutri-for-Schools', 'project', 'csv', csvFilename);
    
    for (const p of [pathNA, pathNFS]) {
      try {
        await fs.access(p);
        pathsToUpdate.push(p);
      } catch {}
    }

    if (pathsToUpdate.length === 0) {
      console.warn("[Real-time ML] Base_Nutricional_Consolidada_Final.csv não foi encontrado para gravação.");
      return;
    }

    // Lê e analisa o arquivo CSV primário
    const primaryPath = pathsToUpdate[0];
    const content = await fs.readFile(primaryPath, 'utf8');
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',');
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = vals[i] || '';
      });
      return obj;
    });

    const currentYear = new Date().getFullYear().toString(); // e.g. "2026"
    
    // Procura se já existe uma linha para esta UBS no ano corrente
    let targetRow = rows.find(r => r.Ano === currentYear && r.EAS?.trim().toLowerCase() === ubsName.trim().toLowerCase());
    
    if (targetRow) {
      const total = parseInt(targetRow.Total || '0', 10) + 1;
      targetRow.Total = total.toString();
      
      let magrezaQtd = parseInt(targetRow.Magreza_Qtd || '0', 10);
      let eutrofiaQtd = parseInt(targetRow.Eutrofia_Qtd || '0', 10);
      let sobrepesoQtd = parseInt(targetRow.Sobrepeso_Qtd || '0', 10);
      let obesidadeQtd = parseInt(targetRow.Obesidade_Qtd || '0', 10);
      
      if (classificacao === 'Eutrofia') eutrofiaQtd++;
      else if (classificacao === 'Sobrepeso') sobrepesoQtd++;
      else if (classificacao === 'Obesidade') obesidadeQtd++;
      else if (classificacao === 'Desnutrição') magrezaQtd++;
      
      targetRow.Magreza_Qtd = magrezaQtd.toString();
      targetRow.Eutrofia_Qtd = eutrofiaQtd.toString();
      targetRow.Sobrepeso_Qtd = sobrepesoQtd.toString();
      targetRow.Obesidade_Qtd = obesidadeQtd.toString();
      
      targetRow.Magreza_Pct = ((magrezaQtd / total) * 100).toFixed(6);
      targetRow.Eutrofia_Pct = ((eutrofiaQtd / total) * 100).toFixed(6);
      targetRow.Sobrepeso_Pct = ((sobrepesoQtd / total) * 100).toFixed(6);
      targetRow.Obesidade_Pct = ((obesidadeQtd / total) * 100).toFixed(6);
    } else {
      // Cria uma nova linha. Busca uma linha da mesma UBS de anos anteriores para herdar CNES e Municipio
      const siblingRow = rows.find(r => r.EAS?.trim().toLowerCase() === ubsName.trim().toLowerCase());
      const cnesVal = siblingRow ? siblingRow.CNES : '0000000';
      
      const newRow: any = {};
      headers.forEach(h => {
        newRow[h] = '';
      });
      
      newRow.UF = 'SP';
      newRow.IBGE = '354390';
      newRow.Municipio = 'RIO CLARO';
      newRow.CNES = cnesVal;
      newRow.EAS = ubsName;
      newRow.Total = '1';
      newRow.Local = 'SP';
      newRow.Ano = currentYear;
      newRow.Faixa_Etaria = '0 a 18 anos';
      
      newRow.Magreza_Qtd = classificacao === 'Desnutrição' ? '1' : '0';
      newRow.Magreza_Pct = classificacao === 'Desnutrição' ? '100.000000' : '0.000000';
      newRow.Eutrofia_Qtd = classificacao === 'Eutrofia' ? '1' : '0';
      newRow.Eutrofia_Pct = classificacao === 'Eutrofia' ? '100.000000' : '0.000000';
      newRow.Sobrepeso_Qtd = classificacao === 'Sobrepeso' ? '1' : '0';
      newRow.Sobrepeso_Pct = classificacao === 'Sobrepeso' ? '100.000000' : '0.000000';
      newRow.Obesidade_Qtd = classificacao === 'Obesidade' ? '1' : '0';
      newRow.Obesidade_Pct = classificacao === 'Obesidade' ? '100.000000' : '0.000000';
      
      rows.push(newRow);
    }

    // Reconverte para formato CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(r => headers.map(h => r[h]).join(','))
    ].join('\n');

    // Grava nos dois diretórios para garantir sincronia total
    for (const p of pathsToUpdate) {
      await fs.writeFile(p, csvContent, 'utf8');
      console.log(`[Real-time ML] CSV atualizado com sucesso em: ${p}`);
    }

    // Executa o script do modelo de IA (unified_ML.py) em segundo plano
    const modelScriptPath = path.join(cwd, '..', '..', 'models', 'unified_ML.py');
    console.log(`[Real-time ML] Iniciando retreinamento assíncrono do modelo em: ${modelScriptPath}`);
    
    fs.access(modelScriptPath)
      .then(() => {
        exec(`python "${modelScriptPath}"`, { cwd: path.dirname(modelScriptPath) }, (err, stdout, stderr) => {
          if (err) {
            console.error(`[Real-time ML ERROR] Falha ao re-treinar o modelo de IA:`, err);
            return;
          }
          console.log(`[Real-time ML SUCCESS] Modelo de IA re-treinado com sucesso em tempo real!`);
        });
      })
      .catch(() => {
        console.warn(`[Real-time ML WARNING] Script de ML não encontrado em: ${modelScriptPath}. Ignorando retreinamento.`);
      });

  } catch (error) {
    console.error("[Real-time ML ERROR]", error);
  }
}

// Função para criptografar texto sensível (AES-256-GCM)
function encrypt(text: string): { iv: string; encryptedData: string; authTag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag
  };
}

// Função para gerar o hash do ID pseudonimizado (SHA-256 com Salt)
function pseudonymize(cpf: string): string {
  const normalizedCpf = cpf.replace(/\D/g, ''); // Apenas números
  return crypto.createHmac('sha256', SALT).update(normalizedCpf).digest('hex');
}

// Simulação de Rate Limiter simples em memória
const rateLimitCache = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_MAX = 30; // Max 30 requisições
const RATE_LIMIT_WINDOW = 60 * 1000; // Por minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limitInfo = rateLimitCache.get(ip);

  if (!limitInfo) {
    rateLimitCache.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (now - limitInfo.lastReset > RATE_LIMIT_WINDOW) {
    limitInfo.count = 1;
    limitInfo.lastReset = now;
    return true;
  }

  if (limitInfo.count >= RATE_LIMIT_MAX) {
    return false;
  }

  limitInfo.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // 1. Rate Limiting para mitigar ataques de negação de serviço e varredura de API
  const ip = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Muitas requisições. Por favor, tente novamente em um minuto.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { nome, cpf, nome_responsavel, idade_anos, peso_kg, altura_m, genero, cnes_ubs } = body;

    // Se cnes_ubs for código numérico, converte para o nome da UBS correspondente
    let resolvedUbsName = cnes_ubs;
    if (cnes_ubs && /^\d+$/.test(cnes_ubs)) {
      const matchedName = Object.keys(UBS_CNES).find(key => UBS_CNES[key] === cnes_ubs);
      if (matchedName) {
        resolvedUbsName = matchedName;
      }
    }

    // 2. Validação Funcional Estrita de QA (Prevenção de injeção e dados anômalos)
    if (!nome || typeof nome !== 'string' || nome.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'Validação de QA: Nome inválido.' }, { status: 400 });
    }
    
    // Regex para validar CPF (previne SQL injection e garante formato correto)
    const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
    if (!cpf || typeof cpf !== 'string' || !cpfRegex.test(cpf)) {
      return NextResponse.json({ success: false, error: 'Validação de QA: CPF inválido.' }, { status: 400 });
    }

    if (!nome_responsavel || typeof nome_responsavel !== 'string' || nome_responsavel.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'Validação de QA: Nome do responsável inválido.' }, { status: 400 });
    }

    // Validação fisiológica antropométrica estrita (Caso 2 de QA: Out of Bounds)
    const idade = Number(idade_anos);
    if (isNaN(idade) || idade < 0 || idade > 18) {
      return NextResponse.json({ success: false, error: 'Validação de QA: Idade deve ser entre 0 e 18 anos.' }, { status: 400 });
    }

    const peso = Number(peso_kg);
    if (isNaN(peso) || peso <= 1.0 || peso > 200.0) {
      return NextResponse.json({ success: false, error: 'Validação de QA: Peso fora dos limites fisiológicos aceitáveis (1.0kg - 200.0kg).' }, { status: 400 });
    }

    const altura = Number(altura_m);
    if (isNaN(altura) || altura <= 0.3 || altura > 2.5) {
      return NextResponse.json({ success: false, error: 'Validação de QA: Altura fora dos limites fisiológicos aceitáveis (0.3m - 2.5m).' }, { status: 400 });
    }

    if (!genero || (genero !== 'Masculino' && genero !== 'Feminino')) {
      return NextResponse.json({ success: false, error: 'Validação de QA: Gênero deve ser Masculino ou Feminino.' }, { status: 400 });
    }

    if (!cnes_ubs || typeof cnes_ubs !== 'string' || cnes_ubs.trim().length < 4) {
      return NextResponse.json({ success: false, error: 'Validação de QA: CNES da UBS de origem é obrigatório.' }, { status: 400 });
    }

    // 3. Aplicação do Cálculo de Risco Antropométrico baseando-se no Z-score da OMS
    const bmi = peso / (altura * altura);
    const { classificacao, alertaRisco, condutaClinica } = classifyNutritionWHO(idade, genero, bmi);

    // 4. Tratamento de Segurança e Privacidade LGPD (Criptografia AES-GCM e Pseudonimização)
    const idPseudonimizado = pseudonymize(cpf);
    const dadosNomeCriptografados = encrypt(nome);
    const dadosResponsavelCriptografados = encrypt(nome_responsavel);

    // 5. Salvar o registro diretamente na nuvem (Supabase)
    let savedToCloud = false;
    let cloudRecordId = null;
    try {
      const adminClient = await getAdminSupabaseClient();
      
      // Busca todas as escolas
      const { data: dbSchools, error: schoolsErr } = await adminClient.from('escolas').select('*');
      
      if (!schoolsErr && dbSchools && dbSchools.length > 0) {
        // Encontra o melhor school_id correspondente à região da UBS (fuzzy matching)
        let schoolId = dbSchools[0].id;
        
        try {
          const poisPath = path.join(process.cwd(), 'src', 'lib', 'extractedPois.json');
          const poisContent = await fs.readFile(poisPath, 'utf8');
          const extractedPois = JSON.parse(poisContent);
          
          const regionalPois = extractedPois.filter((p: any) => p.categoria === 'Educação' && p.regiao_ubs === resolvedUbsName);
          if (regionalPois.length > 0) {
            const norm = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
            const matchedSchool = dbSchools.find((s: any) => {
              const dbNorm = norm(s.nome);
              return regionalPois.some((p: any) => norm(p.nome).includes(dbNorm) || dbNorm.includes(norm(p.nome)));
            });
            if (matchedSchool) {
              schoolId = matchedSchool.id;
            }
          }
        } catch (poiErr) {
          console.warn("[Supabase Cloud Insert] Erro ao carregar extração de POIs, usando primeira escola.", poiErr);
        }

        // Insere o novo registro antropométrico no banco de dados na nuvem (registros_saude)
        const { data: insertResult, error: insertErr } = await adminClient
          .from('registros_saude')
          .insert({
            escola_id: schoolId,
            genero: genero === 'Masculino' ? 'M' : 'F',
            idade: idade,
            peso: peso,
            altura: altura,
            data_coleta: new Date().toISOString()
          })
          .select('id');

        if (insertErr) {
          console.error("[Supabase Cloud Insert ERROR] Falha ao inserir registros_saude na nuvem:", insertErr.message);
        } else {
          console.log("[Supabase Cloud Insert SUCCESS] Registro salvo na nuvem com ID:", insertResult?.[0]?.id);
          savedToCloud = true;
          cloudRecordId = insertResult?.[0]?.id;
        }
      }
    } catch (cloudErr) {
      console.error("[Supabase Cloud Auth ERROR] Falha na conexão ou autenticação de nuvem:", cloudErr);
    }

    // 6. Atualizar a base de dados consolidada local e re-treinar o modelo de IA em tempo real
    await updateConsolidatedCSV(resolvedUbsName, classificacao);

    // 7. Retorno Seguro (Dados Pessoais Sensíveis ocultados e pseudonimizados de acordo com a LGPD)
    return NextResponse.json({
      success: true,
      message: savedToCloud ? 'Paciente cadastrado, triado e sincronizado com a nuvem!' : 'Paciente cadastrado e triado com sucesso!',
      dadosProcessados: {
        idPseudonimizado, // SHA-256 Salted
        cnes_ubs,
        idade_anos: idade,
        genero,
        peso_kg: peso,
        altura_m: altura,
        imc: Number(bmi.toFixed(2)),
        classificacao,
        alertaRisco,
        condutaClinica,
        savedToCloud,
        cloudRecordId,
        // Envia as tags de criptografia para comprovar a segurança no banco de dados
        criptografiaSegurança: {
          nomeAlgoritmo: ALGORITHM,
          nomeIV: dadosNomeCriptografados.iv,
          dadosCriptografados: dadosNomeCriptografados.encryptedData,
          authTag: dadosNomeCriptografados.authTag
        }
      }
    });

  } catch (err: any) {
    console.error('ERRO CADASTRO PACIENTE:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno de servidor.', details: err.message },
      { status: 500 }
    );
  }
}
