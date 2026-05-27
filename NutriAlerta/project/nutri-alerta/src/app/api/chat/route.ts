import { kv } from '@vercel/kv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
// 1. Importa a base de dados local de chunks (crie este arquivo na mesma pasta ou em @/lib)
import documentos from './documents.json';

const apiKey = process.env.NutriAlerta_API_Key || process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// 2. Motor de busca in-memory baseado em relevância de termos (RAG Leve)
function buscarChuncksRelevantes(query: string, limite = 2): string {
  const palavrasQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove caracteres especiais
    .split(/\s+/)
    .filter(p => p.length > 2); // Descarta palavras muito curtas

  if (palavrasQuery.length === 0) return "";

  const documentosPontuados = documentos.map(doc => {
    const textoAlvo = `${doc.titulo} ${doc.texto}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let score = 0;

    palavrasQuery.forEach(palavra => {
      if (textoAlvo.includes(palavra)) {
        score += 1;
        if (doc.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(palavra)) {
          score += 1; // Bônus se a palavra chave estiver no título
        }
      }
    });

    return { ...doc, score };
  });

  const resultados = documentosPontuados
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limite);

  if (resultados.length === 0) return "";

  return resultados
    .map(r => `[Documento Técnico Oficial: ${r.titulo}]\n${r.texto}`)
    .join("\n\n");
}

function getKnowledgeBaseGuia(screenData: any) {
   return `Você é o NutriBot, assistente de navegação do dashboard NutriAlerta — Rio Claro, SP.
Seu objetivo exclusivo é orientar e guiar o gestor municipal de saúde pelas telas, gráficos, ferramentas e filtros da plataforma. 
Responda de forma extremamente pragmática, direta e sempre em português brasileiro. Não invente dados de saúde. Se o usuário quiser análises epidemiológicas profundas ou planos de intervenção, oriente-o a usar a aba "Consultor IA".

[ESTRUTURA GERAL DE NAVEGAÇÃO DO SITE]
O sistema possui um cabeçalho fixo no topo com o logo "NutriAlerta" à esquerda, um indicador de "Conectado" e três abas de navegação centrais:
1. "Mapa de Risco" (Aba principal de monitoramento geográfico).
2. "Análise Escolar" (Aba de quebras demográficas por faixa etária).
3. "Comparador UBS" (Aba de cruzamento estatístico direto entre duas unidades).
Logo abaixo dessas abas, há um botão "+ Consultor IA" que abre a interface dedicada de chat analítico.
No canto inferior direito da tela, há um botão circular flutuante: é o NutriBot Guia (você).

[BARRA LATERAL ESQUERDA — FILTROS GLOBAIS]
Presente em todas as telas de dados. Seções de cima para baixo:
1. FILTRO DE ANO: Menu dropdown para escolher o ano de referência dos dados (ex: 2025, 2024, 2023).
2. PESQUISA DE UNIDADE: Campo "Pesquisar UBS..." para filtrar a lista e localizar clínicas específicas.
3. SELEÇÃO DE INDICADOR: Botões para definir a métrica ativa no painel:
   - "Mapa Global Integrado"
   - "Desnutrição"
   - "Peso Adequado"
   - "Sobrepeso"
   - "Obesidade"
4. INFRAESTRUTURA (CAMADAS DO MAPA): Opções com ícones de "olho" para ligar/desligar camadas de Pontos de Interesse (POIs) sobre o mapa:
   - "Saúde (UBS/USF)" (Sempre ativo)
   - "Educação (Escolas)"
   - "Esporte e Lazer"
   - "Alimentação - Restaurante/Fast-food"
   - "Alimentação - Mercado"
5. RESUMO MUNICIPAL (DADOS GERAIS RIO CLARO): Cards compactos mostrando:
   - Peso Adequado, Obesidade, Sobrepeso e Desnutrição médios do município.
   - Total de Pacientes Avaliados (ex: 45.2K) e UBS Monitoradas (18).

[VISUALIZAÇÕES DA ABA: MAPA DE RISCO]
A tela é dividida horizontalmente em três grandes seções roláveis:
1. SEÇÃO DE CARDS (KPIs - Topo da página):
   - Card "Avaliados": Mostra o volume dinâmico acumulado de indivíduos pesados na região e ano selecionados.
   - Card "Prevalência do Indicador": Exibe o percentual do indicador selecionado (ex: Obesidade 12.93%) registrado no ano ativo.
   - Card "Tendência / Delta Preditivo p.p.": Exibe a variação futura acumulada prevista pelo modelo de Machine Learning (regressão Random Forest) até o ano de 2027 (ex: +0.32 p.p. em 2027) com badge colorido reativo.
   - Card "Indicador Secundário": Exibe a taxa correspondente ao indicador de prevalência oposto/secundário (ex: Desnutrição 2.62%).
2. BLOCO CENTRAL (MAPA + DISTRIBUIÇÃO):
   - À Esquerda: Mapa Coroplético Interativo de Rio Claro, dividindo o território por distritos de saúde/bairros coloridos em tons de risco (Verde = Baixo, Amarelo = Médio, Vermelho = Alto). Mostra marcadores geográficos das UBSs e POIs. Possui controles de zoom (+/-) e uma tag flutuante indicando o bairro selecionado (ex: 📍 UBS Wenzel).
   - À Direita: Gráfico de Rosca "Distribuição Nutricional" detalhando o percentual exato do município dividido em: Peso Adequado (Verde), Sobrepeso (Laranja), Obesidade (Vermelho), Magreza (Azul).
3. BLOCO INFERIOR (SÉRIE TEMPORAL + RANKING):
   - Gráfico de Linhas "Evolução Histórica e Projeção": Linhas contínuas mostram as taxas reais de 2009 a 2025. Uma linha vertical pontilhada separa o histórico real da área de Projeção (2026–2027), destacada com um fundo sutil.
   - Gráfico de Barras Horizontais "Top 5 UBS · Aceleração de Risco": Lista as 5 unidades com o maior aumento percentual (Delta ano a ano) no indicador selecionado. Se o usuário clicou em um bairro no mapa, a barra daquela UBS fica destacada na cor amarela/teal para fácil localização no ranking.
4. RODAPÉ: Seção "Análise de Conflito Urbano — Infraestrutura Alimentar", exibindo a comércios alimentares da cidade, o percentual de infraestrutura obesogênica e um gráfico comparativo de estabelecimentos saudáveis vs de risco.

[VISUALIZAÇÕES DA ABA: ANÁLISE ESCOLAR]
Focada em quebras demográficas e dados epidemiológicos por faixas etárias baseadas em Machine Learning.
1. ABAS DE FAIXAS ETÁRIAS (Topo da tela): Permite alternar os dados entre 4 grupos:
   - "Primeira Infância" (6 meses a 2 anos)
   - "Pré-escolares" (3 a 5 anos)
   - "Escolares" (6 a 11 anos)
   - "Adolescentes" (12 a 18 anos)
2. COMPONENTES VISUAIS PRINCIPAIS:
   - Cards de Idade Média Global por indicador nutricional.
   - Barra de Progresso Dupla "Distribuição por Gênero": Mostra o percentual de prevalência de cada indicador (Peso Adequado, Desnutrição, Sobrepeso, Obesidade) detalhado entre Meninos (Azul) e Meninas (Vermelho) com alertas de predomínio.
   - Painel de "Insight Nutricional - Faixa Ativa": Caixa de texto com insights automáticos gerados com base em predições epidemiológicas reais extraídas do arquivo JSON de projeções demográficas por faixa geradas pela IA (\`NutriAlerta_Projecao_Demografica.json\`). resumo textual com os principais desvios, alertas e padrões epidemiológicos identificados especificamente para a faixa etária e o bairro selecionados.

[VISUALIZAÇÕES DA ABA: COMPARADOR UBS]
Permite a auditoria visual cruzada entre duas regiões diferentes.
1. SELEÇÃO DE UNIDADES (Topo da tela): Dois menus dropdowns lado a lado para o usuário escolher o par de comparação (ex: "Unidade A: UBS Wenzel" vs "Unidade B: UBS Chervezon"). À direita, botões rápidos mudam o indicador de análise.
2. COMPONENTES VISUAIS PRINCIPAIS:
   - Gráfico Central de Colunas "Comparativo Direto": Exibe barras verticais emparelhadas comparando o percentual de prevalência entre as duas UBS selecionadas.
   - Cards de Perfil Demográfico (Abaixo do gráfico): Tabelas comparativas mostrando a idade média dos pacientes afetados em cada unidade e a distribuição percentual exata de gênero de forma individualizada.
   - Linha do Tempo Comparativa (Rodapé): Um mini gráfico de linhas cruzadas mostrando o histórico de evolução temporal das duas unidades ao longo dos anos para verificar qual região está apresentando melhoras ou pioras.

[CONSULTOR IA]
Interface de chat de tela cheia acessada pelo botão "+ Consultor IA". Possui um painel lateral direito listando todas as UBSs em ordem alfabética para o gestor ajustar o contexto do chat com apenas um clique. Exibe tags de status "Sinal: Ativo" e "Online" com botões para apagar o histórico da conversa.

${screenData?.bairro ? `[CONTEXTO ATUAL]\nUBS em foco: ${screenData.bairro} · Ano: ${screenData.ano} · Indicador: ${screenData.indicador}` : '[CONTEXTO ATUAL] Nenhuma UBS selecionada.'}
`;
}

// 3. Ajustado a assinatura da instrução técnica do sistema para receber (context, contextoRAG)
function getSystemInstruction(context: any, contextoRAG: string) {
  const screenData = context?.screenData;
  const tipo = screenData?.tipo || 'consultor'; 
  let rules = '';

  if (tipo === 'guia') {
    rules = getKnowledgeBaseGuia(screenData);
  } else {
    let contextStr = '';
    const level = screenData?.analysisLevel || 'municipio';
    const scopeName = screenData?.scopeName || 'Rio Claro (Geral)';
    const ano = screenData?.ano ?? 'não informado';
    const indicador = screenData?.indicador ?? 'não informado';
    const des = screenData?.desnutricao ?? 'não informado';
    const obs = screenData?.obesidade ?? 'não informado';
    const sob = screenData?.sobrepeso ?? 'não informado';
    const eut = screenData?.eutrofia ?? 'não informado';

    contextStr = `
    [[CONTEXTO DE ANÁLISE MULTINÍVEL]]
    Nível de Foco: ${level.toUpperCase()}
    Nome da Região/Local: ${scopeName}
    Ano de Referência: ${ano}
    Indicador Principal em Foco: ${indicador}
    
    Estatísticas Nutricionais na Região Selecionada (${ano}):
    - % Peso Adequado (Eutrofia): ${eut}%
    - % Obesidade: ${obs}%
    - % Sobrepeso: ${sob}%
    - % Desnutrição: ${des}%
    `;

    if (level === 'escola') {
      contextStr += `
      A escola monitorada está localizada no bairro: ${screenData.bairro || 'não informado'}
      Região de UBS parceira associada: ${screenData.regiaoUbs || 'não informada'}
      `;
    } else if (level === 'bairro') {
      contextStr += `
      O bairro monitorado pertence à região de abrangência da UBS: ${screenData.regiaoUbs || 'não informada'}
      `;
    }

    rules = `
    Você é o NutriBot, assistente de vigilância nutricional de inteligência de saúde pública do município de Rio Claro — SP.
    Seu usuário é um gestor municipal de saúde pública.

    ${contextStr}

    [[DOCUMENTAÇÃO TÉCNICA DE REFERÊNCIA (MINISTÉRIO DA SAÚDE / Nutri for Schools)]]
    ${contextoRAG ? contextoRAG : "Nenhum trecho de documento oficial indexado para esta pergunta específica. Use as diretrizes básicas do Nutri for Schools."}

    REGRAS DE RESPOSTA E POSTURA:
    1. Responda combinando os dados do contexto geográfico e de análise multinível acima com as diretrizes oficiais do Ministério da Saúde recuperadas. Não invente números, parâmetros ou prazos de pesagem sob qualquer hipótese.
    2. Adapte sua análise para o nível hierárquico ativo:
       - Se for uma ESCOLA, analise a escola, mencione o bairro dela e a UBS de referência, recomendando intervenções diretas de ambiente escolar (cantinas saudáveis, hortas comunitárias, reavaliação de merenda).
       - Se for um BAIRRO, mencione a UBS responsável pela cobertura e proponha ações focadas na vizinhança e agentes de saúde locais.
       - Se for uma UBS, ofereça propostas focadas nas equipes de atenção primária.
       - Se for MUNICIPIO (Geral), discuta políticas macro para a cidade de Rio Claro.
    3. Use linguagem clara, direta e objetiva. Responda em prosa corrida, sem listas com marcadores, sem bullet points e sem saudações formais como "Prezado(a) gestor(a)". Seja conciso: máximo 3 parágrafos curtos por resposta, salvo quando o gestor pedir explicitamente um plano de ações detalhado.
    4. Se não houver unidade/bairro/escola selecionada e a pergunta exigir dados locais específicos, lembre amigavelmente o gestor de selecionar uma unidade na lista lateral.
    5. Responda sempre em português brasileiro de forma pragmática e direta.
    `;
  }

  return rules;
}

function getLocalFallbackResponse(message: string, screenData: any) {
  const msgLower = message.toLowerCase();
  const level = screenData?.analysisLevel || 'municipio';
  const scopeName = screenData?.scopeName || 'Rio Claro';
  const ano = screenData?.ano || '2025';
  const indicador = screenData?.indicador || 'obesidade';
  
  let valor = 0;
  if (indicador === 'desnutricao') {
    valor = screenData?.desnutricao || 2.62;
  } else if (indicador === 'sobrepeso') {
    valor = screenData?.sobrepeso || 16.3;
  } else if (indicador === 'eutrofia') {
    valor = screenData?.eutrofia || 61.55;
  } else {
    valor = screenData?.obesidade || 12.93;
  }

  const isHighRisk = (indicador === 'desnutricao' && valor > 3.0) || 
                     (indicador === 'obesidade' && valor > 13.0) ||
                     (indicador === 'sobrepeso' && valor > 18.0) ||
                     (indicador === 'eutrofia' && valor < 55.0);
  const riskLabel = isHighRisk ? 'Alto' : 'Moderado';

  const levelText = level === 'municipio' 
    ? 'em todo o município de Rio Claro' 
    : level === 'ubs' 
      ? `na região da UBS ${scopeName}` 
      : level === 'bairro' 
        ? `no bairro ${scopeName} (área de abrangência da UBS ${screenData.regiaoUbs || 'responsável'})` 
        : `na escola ${scopeName} (situada no bairro ${screenData.bairro || 'da escola'} e vinculada à UBS ${screenData.regiaoUbs || 'parceira'})`;

  if (msgLower.includes('olá') || msgLower.includes('oi') || msgLower.includes('bom') || msgLower.includes('boa')) {
    return `Olá! Sou o NutriBot, seu assistente de vigilância nutricional em Rio Claro.
    
Atualmente estamos analisando os dados **${levelText}** para o ano **${ano}**. 
A taxa de **${indicador}** nesta região está em **${valor}%** (Risco ${riskLabel}). 

Como posso ajudar você na formulação de políticas públicas ou no planejamento de intervenções para esta unidade hoje?`;
  }

  if (msgLower.includes('ação') || msgLower.includes('acoes') || msgLower.includes('recomenda') || msgLower.includes('fazer') || msgLower.includes('intervir') || msgLower.includes('medida')) {
    if (level === 'escola') {
      return `Com base na prevalência de **${valor}%** de **${indicador}** na escola **${scopeName}**, proponho as seguintes intervenções prioritárias no ambiente escolar:

1. **Readequação da Merenda Escolar:** Parceria com nutricionistas do PNAE para enriquecer o cardápio e fiscalizar o cumprimento das diretrizes de alimentos frescos.
2. **Hortas Pedagógicas:** Criação de hortas comunitárias na escola como ferramenta pedagógica interdisciplinar, integrando crianças no cultivo de legumes e hortaliças.
3. **Auditoria da Cantina:** Implementação de regulamento proibindo a venda de ultraprocessados, refrigerantes e doces industrializados na cantina interna.
4. **Canais de Orientação Familiar:** Envio regular de cartilhas e receitas saudáveis de baixo custo para as famílias via reuniões de pais e aplicativos de comunicação escolar.`;
    }

    if (isHighRisk) {
      return `Com base na taxa elevada de **${valor}%** de **${indicador}** projetada **${levelText}**, recomendo as seguintes ações prioritárias de saúde pública no território:

1. **Mutirão de Avaliação e Triagem:** Articulação de mutirões antropométricos focados em localizar as famílias em situação de vulnerabilidade nutricional grave.
2. **Busca Ativa de Famílias Vulneráveis:** Intensificar as visitas dos Agentes Comunitários de Saúde (ACS) focando no aconselhamento dietético das microáreas de risco.
3. **Grupos Multidisciplinares de Apoio:** Criação de oficinas de nutrição prática e grupos terapêuticos integrando psicólogos, nutricionistas e educadores físicos nas unidades de saúde locais.
4. **Feiras de Alimentos Saudáveis:** Fomentar feiras livres com preços acessíveis de hortifrúti diretamente nas imediações dos bairros mais vulneráveis.`;
    } else {
      return `Como a taxa de **${indicador}** **${levelText}** é de **${valor}%** (considerada dentro dos parâmetros de risco moderado), as ações recomendadas são de caráter preventivo e de manutenção da saúde:

1. **Monitoramento Sistemático:** Acompanhar bimestralmente as pesagens de rotina do Nutri for Schools para prevenir flutuações e picos de risco.
2. **Ações Rápidas na Sala de Espera:** Oferecer rápidas oficinas educativas ou distribuir informativos sobre rotulagem nutricional e escolhas alimentares inteligentes na recepção da UBS.
3. **Integração com Esporte e Lazer:** Fomentar grupos de caminhada orientada e incentivar o uso das academias ao ar livre da vizinhança.`;
    }
  }

  return `Entendido. Em termos epidemiológicos, os dados **${levelText}** no ano de **${ano}** indicam que a taxa de **${indicador}** está em **${valor}%** (Risco **${riskLabel}**). 

Com base nisso, recomendo direcionar as ações comunitárias e de assistência da UBS parceira para atender os indivíduos em situação de risco identificados no nosso motor de geoprocessamento.`;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, context } = await req.json();
    console.log('📥 screenData recebido:', JSON.stringify(context?.screenData, null, 2));
    console.log('🤖 genAI configurado:', !!genAI);

    if (!sessionId || !message || !context) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    let historyFromDB: any[] = [];
    const isKvConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

    if (isKvConfigured) {
      try {
        historyFromDB = (await kv.get(sessionId)) || [];
      } catch (kvErr) {
        console.warn("Vercel KV read failed, falling back to empty memory:", kvErr);
      }
    }

    if (message === '__GET_HISTORY__') {
      return NextResponse.json({ history: historyFromDB });
    }

    if (!genAI) {
      console.warn("Gemini API Key is not set. Using smart local fallback response.");
      const mockText = getLocalFallbackResponse(message, context.screenData);
      return NextResponse.json({ response: mockText });
    }

    try {
      // 4. Implementação do RAG dinâmica: intercepta a busca e altera os parâmetros enviados à instrução
      const contextoRAG = buscarChuncksRelevantes(message, 2);
      const systemInstruction = getSystemInstruction(context, contextoRAG);
      const historyForAPI = [...historyFromDB];

const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  systemInstruction: {
    role: "system",
    parts: [{ text: systemInstruction }]
  }
});

const chat = model.startChat({ 
  history: historyForAPI,
  generationConfig: {
    thinkingConfig: { thinkingBudget: 8000 }
  } as any
});
      
const result = await chat.sendMessage(message);

const parts = result.response.candidates?.[0]?.content?.parts ?? [];
// Adicionando console.log
console.log('🧠 parts:', JSON.stringify(parts.map((p: any) => ({ thought: p.thought, len: p.text?.length }))));
const thinking = parts
  .filter((p: any) => p.thought === true)
  .map((p: any) => p.text)
  .join('');
const text = parts
  .filter((p: any) => !p.thought)
  .map((p: any) => p.text)
  .join('') || result.response.text();

      if (isKvConfigured) {
        try {
          const updatedHistory = await chat.getHistory();
          await kv.set(sessionId, updatedHistory);
        } catch (kvErr) {
          console.warn("Vercel KV write failed:", kvErr);
        }
      }

      return NextResponse.json({ response: text, thinking: thinking || null });
    } catch (geminiErr: any) {
      console.error("Gemini API call failed, falling back to smart local response:", geminiErr);
      const fallbackText = getLocalFallbackResponse(message, context.screenData);
      return NextResponse.json({ response: fallbackText });
    }
  } catch (error: any) {
    console.error('ERRO API:', error);
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId obrigatório.' }, { status: 400 });
    }

    const isKvConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

    if (isKvConfigured) {
      try {
        await kv.del(sessionId);
      } catch (kvErr) {
        console.warn("Vercel KV delete failed:", kvErr);
        return NextResponse.json({ error: 'Falha ao apagar histórico no KV.' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('ERRO DELETE:', error);
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
