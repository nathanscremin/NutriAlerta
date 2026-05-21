import { kv } from '@vercel/kv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.NutriAlerta_API_Key || process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function getKnowledgeBaseGuia(screenData: any) {
   return `Você é o NutriBot, assistente de navegação do dashboard NutriAlerta — Rio Claro, SP.
Seu objetivo é explicar ao usuário como usar o sistema, onde cada funcionalidade está e o que cada visualização significa.
Responda sempre em português brasileiro, de forma clara e direta.
Não invente dados. Se perguntarem sobre análise de dados, oriente o usuário a usar o Consultor IA.

[ESTRUTURA GERAL DO SITE]
O dashboard tem duas abas principais no topo da página:
- "Especialista" (aba ativa por padrão): painel completo com mapa, gráficos e análises detalhadas.
- "Consultor IA" (aba ao lado): chatbot especialista em dados epidemiológicos. Clique no "+" ao lado para acessar.

No canto inferior direito da tela há um botão verde flutuante (ícone de chat): é o NutriBot — você está conversando com ele agora.

[BARRA LATERAL ESQUERDA]
A barra lateral esquerda contém todos os filtros e controles do painel. Pode ser recolhida clicando na seta "<" no topo.

Seções da barra lateral:
1. ANO DE REFERÊNCIA: Dropdown para selecionar o ano dos dados (ex: 2025). Altera todos os indicadores e gráficos do painel.

2. REGIÃO EM FOCO: Campo de busca "Pesquisar UBS..." para localizar uma UBS específica no mapa.

3. INDICADOR PRINCIPAL: Escolha qual indicador nutricional colorir o mapa de calor:
   - Mapa Global Integrado: exibe todos os indicadores juntos.
   - Desnutrição (ponto azul)
   - Peso Adequado (ponto verde)
   - Sobrepeso (ponto amarelo)
   - Obesidade (ponto vermelho) — marcado como ATIVO por padrão.
   O indicador selecionado aparece marcado como "ATIVO" e muda as cores do mapa.

4. CAMADAS (POIs): Ativa ou desativa camadas de pontos de interesse no mapa:
   - Saúde (UBS/UPA): fixo, sempre visível.
   - Educação: escolas da cidade.
   - Esporte & Lazer: praças, academias ao ar livre.
   - Restaurantes/Fast-Food: estabelecimentos de alimentação.
   - Mercados: supermercados e feiras.
   Clique no ícone de olho ao lado de cada camada para ativar/desativar.

5. RESUMO - RIO CLARO: Painel com os indicadores médios da cidade para o ano selecionado:
   - Peso adequado médio
   - Obesidade média
   - Sobrepeso médio
   - Desnutrição média
   - Pacientes avaliados
   - UBS monitoradas
   Role para baixo para ver todos.

6. MODO ESCURO: Toggle no final da barra lateral para alternar entre tema claro e escuro.

[ÁREA PRINCIPAL — ABA ESPECIALISTA]
A aba Especialista é dividida em seções rolando de cima para baixo:

1. CARDS DE INDICADORES (topo):
   Quatro cards com os números principais de Rio Claro no ano selecionado:
   - Avaliados: total de pacientes avaliados nas 18 UBS.
   - Obesidade: taxa média atual com variação projetada para 2027.
   - Projeção Obesidade 2027: previsão do modelo de Machine Learning.
   - Desnutrição: taxa atual com tendência.

2. MAPA DE CALOR + DISTRIBUIÇÃO NUTRICIONAL:
   - À esquerda: mapa interativo de Rio Claro com os bairros coloridos por nível de risco do indicador selecionado. Pontos coloridos indicam UBSs e POIs ativos. Use +/- para zoom. Clique em um bairro para selecionar e enviar o contexto ao Consultor IA.
   - À direita: gráfico de rosca "Distribuição Nutricional" mostrando a proporção entre Magreza, Obesidade, Peso Adequado e Sobrepeso no município.

3. EVOLUÇÃO HISTÓRICA E PROJEÇÃO:
   Gráfico de linhas com dados reais de 2009 a 2025 e projeção até 2027 (linha pontilhada). Cada linha representa um indicador nutricional. O destaque laranja indica o período de projeção do modelo ML.

4. TOP 5 UBS — ACELERAÇÃO DE RISCO:
   Gráfico de barras horizontais com as 5 UBSs com maior delta (variação percentual) no indicador ativo. Barras vermelhas indicam risco alto, amarelas risco moderado.

5. ANÁLISE DEMOGRÁFICA ESCOLAR:
   Análise por faixa etária com 4 grupos selecionáveis:
   - Primeira Infância (6 meses a 2 anos)
   - Pré-escolares (3 a 5 anos)
   - Escolares (6 a 11 anos)
   - Adolescentes (12 a 18 anos)
   Clique em uma faixa para ver a distribuição por gênero (meninos vs meninas) em cada indicador, além de um insight nutricional automático.

6. COMPARADOR TERRITORIAL DE UBS:
   Permite comparar duas UBSs lado a lado. Selecione a "Unidade A" e a "Unidade B" nos dropdowns. Escolha o indicador (Desnutrição, Peso Adequado, Sobrepeso, Obesidade) nos botões à direita. Exibe barras comparativas, idades médias por indicador, gênero predominante e um gráfico de evolução temporal comparativa entre as duas unidades.

7. ANÁLISE DE CONFLITO URBANO — INFRAESTRUTURA ALIMENTAR:
   Mapa com os POIs alimentares da cidade. Cards no topo mostram:
   - Restaurantes e padarias: 30
   - Esporte e Lazer: 33
   - Fast Food: 18
   - Índice de Risco: 22.2% da infraestrutura é obesogênica.
   O gráfico de rosca à direita mostra a proporção entre infraestrutura saudável (mercados + esportes) e de risco (fast food + conveniências).

[CONSULTOR IA]
Para acessar o Consultor IA, clique na aba "Consultor +" no topo da página.
O Consultor é um chatbot especialista em dados epidemiológicos de Rio Claro. Para melhor análise, selecione primeiro um bairro no mapa — o Consultor receberá automaticamente o contexto daquele bairro e poderá fazer análises específicas. Se nenhum bairro estiver selecionado, o Consultor usará os dados gerais do município.

${screenData?.bairro ? `[CONTEXTO ATUAL]\nUBS em foco: ${screenData.bairro} · Ano: ${screenData.ano} · Indicador: ${screenData.indicador}` : '[CONTEXTO ATUAL] Nenhuma UBS selecionada.'}
`;
}

function getSystemInstruction(screenData: any) {
  // Captura a flag que você já configurou no widget
  const tipo = screenData?.tipo || 'consultor'; 
  let rules = '';

  if (tipo === 'guia') {
    rules = getKnowledgeBaseGuia(screenData);
  } else {
    let context = '';

    if (screenData && screenData.bairro) {
      context = `
      [[CONTEXTO DO BAIRRO SELECIONADO]]
      Bairro: ${screenData.bairro}
      Ano: ${screenData.ano ?? 'não informado'}
      Faixa Etária: ${screenData.faixaEtaria ?? 'não informada'}
      Indicador em foco: ${screenData.indicador ?? 'não informado'}
      % Obesidade: ${screenData.obesidade ?? 'não informado'}
      % Desnutrição: ${screenData.desnutricao ?? 'não informado'}
      % Sobrepeso: ${screenData.sobrepeso ?? 'não informado'}
      % Peso Adequado (Eutrofia): ${screenData.eutrofia ?? 'não informado'}
      `;
    } else {
      context = '[[CONTEXTO]] Nenhum bairro selecionado. Oriente o gestor a clicar em um bairro no mapa.';
    }

    rules = `
    Você é o NutriBot, assistente de vigilância nutricional do município de Rio Claro — SP.
    Seu usuário é um gestor municipal de saúde pública.

    ${context}

    REGRAS:
    1. Responda com base nos dados do contexto acima. Não invente números.
    2. Use linguagem clara e objetiva — sem jargão técnico desnecessário.
    3. Se não houver bairro selecionado, peça ao gestor que clique no mapa.
    4. Responda sempre em português brasileiro.
    `;
  }

  return [
    { role: 'user', parts: [{ text: `SYSTEM OVERRIDE: ${rules}` }] },
    {
      role: 'model',
      parts: [{ text: 'Entendido. Estou pronto para atuar de acordo com o perfil solicitado.' }],
    },
  ];
}
function getLocalFallbackResponse(message: string, screenData: any) {
  const msgLower = message.toLowerCase();
  const bairro = screenData?.bairro || 'Rio Claro';
  const ano = screenData?.ano || '2025';
  const indicador = screenData?.indicador || 'obesidade';
  
  let valor = 0;
  if (indicador === 'desnutricao') {
    valor = screenData?.desnutricao || 2.62;
  } else if (indicador === 'sobrepeso') {
    valor = screenData?.sobrepeso || 16.3;
  } else {
    valor = screenData?.obesidade || 12.93;
  }

  const isHighRisk = (indicador === 'desnutricao' && valor > 3.0) || 
                     (indicador === 'obesidade' && valor > 13.0) ||
                     (indicador === 'sobrepeso' && valor > 18.0);
  const riskLabel = isHighRisk ? 'Alto' : 'Moderado';

  if (msgLower.includes('olá') || msgLower.includes('oi') || msgLower.includes('bom') || msgLower.includes('boa')) {
    return `Olá! Sou o NutriBot, seu assistente de vigilância nutricional em Rio Claro.
    
Atualmente estamos analisando os dados de **${bairro}** para o ano **${ano}**. 
A taxa de **${indicador}** nesta região está em **${valor}%** (Risco ${riskLabel}). 

Como posso ajudar você na formulação de políticas públicas ou no planejamento de intervenções para esta unidade hoje?`;
  }

  if (msgLower.includes('ação') || msgLower.includes('acoes') || msgLower.includes('recomenda') || msgLower.includes('fazer') || msgLower.includes('intervir') || msgLower.includes('medida')) {
    if (isHighRisk) {
      return `Com base na taxa elevada de **${valor}%** de **${indicador}** projetada para **${bairro}**, recomendo as seguintes ações prioritárias de saúde pública:

1. **Mutirão de Avaliação Nutricional Escolar:** Articulação imediata com as escolas da região de abrangência da UBS para avaliação antropométrica dos estudantes.
2. **Busca Ativa de Famílias Vulneráveis:** Acionar os Agentes Comunitários de Saúde (ACS) para visitas focadas no aconselhamento dietético familiar.
3. **Grupo de Apoio Nutricional na UBS:** Criação de grupos semanais de orientação com equipe multidisciplinar (nutricionistas, psicólogos e educadores físicos).
4. **Combate ao Ambiente Obesogênico:** Restrição da publicidade de ultraprocessados nos arredores das escolas e promoção da Feira do Produtor local.`;
    } else {
      return `Como a taxa de **${indicador}** em **${bairro}** é de **${valor}%** (considerada dentro dos parâmetros de risco moderado), as ações recomendadas são de caráter preventivo e de manutenção:

1. **Monitoramento Quadrimestral:** Acompanhar as pesagens do Programa Bolsa Família e do SISVAN para detecção de variações abruptas.
2. **Campanhas Educativas:** Implementar palestras rápidas na sala de espera da UBS sobre escolhas alimentares saudáveis e rotulagem nutricional.
3. **Estímulo à Atividade Física:** Fomentar o uso de praças e academias ao ar livre da região, em parceria com a Secretaria de Esportes.`;
    }
  }

  return `Entendido. Em termos epidemiológicos, os dados de **${bairro}** no ano de **${ano}** indicam que a taxa de **${indicador}** está em **${valor}%** (Risco **${riskLabel}**). 

Recomendo focar no fortalecimento da atenção primária e na busca ativa de casos críticos nas microáreas periféricas mapeadas pelo nosso motor de geoprocessamento. Se desejar, posso sugerir intervenções específicas voltadas para escolas ou infraestrutura da vizinhança.`;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, context } = await req.json();

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

    // Se o Gemini não estiver configurado, usa a resposta local simulada
    if (!genAI) {
      console.warn("Gemini API Key is not set. Using smart local fallback response.");
      const mockText = getLocalFallbackResponse(message, context.screenData);
      return NextResponse.json({ response: mockText });
    }

    try {
      const dynamicInstruction = getSystemInstruction(context.screenData);
      const historyForAPI = [...dynamicInstruction, ...historyFromDB];

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const chat = model.startChat({ history: historyForAPI });

      const result = await chat.sendMessage(message);
      const text = result.response.text();

      if (isKvConfigured) {
        try {
          const updatedHistory = await chat.getHistory();
          const cleanHistory = updatedHistory.slice(2);
          await kv.set(sessionId, cleanHistory);
        } catch (kvErr) {
          console.warn("Vercel KV write failed:", kvErr);
        }
      }

      return NextResponse.json({ response: text });
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
