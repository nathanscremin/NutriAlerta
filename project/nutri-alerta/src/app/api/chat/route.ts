import { kv } from '@vercel/kv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.NutriAlerta_API_Key || process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function getSystemInstruction(screenData: any) {
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
    `;
  } else {
    context =
      '[[CONTEXTO]] Nenhum bairro selecionado. Oriente o gestor a clicar em um bairro no mapa.';
  }

  const rules = `
  Você é o NutriBot, assistente de vigilância nutricional do município de Rio Claro — SP.
  Seu usuário é um gestor municipal de saúde pública.

  ${context}

  REGRAS:
  1. Responda com base nos dados do contexto acima. Não invente números.
  2. Use linguagem clara e objetiva para gestores públicos — sem jargão técnico desnecessário.
  3. Se não houver bairro selecionado, peça ao gestor que clique no mapa.
  4. Quando o risco for Alto, sugira ações concretas (busca ativa, visitas domiciliares, reforço de agentes comunitários).
  5. Quando o risco for Médio, sugira monitoramento e alertas preventivos.
  6. Quando o risco for Baixo, parabenize e sugira manutenção das ações.
  7. Responda sempre em português brasileiro.
  `;

  return [
    { role: 'user', parts: [{ text: `SYSTEM OVERRIDE: ${rules}` }] },
    {
      role: 'model',
      parts: [
        {
          text: 'Entendido. Estou pronto para analisar os dados nutricionais do bairro selecionado e apoiar a tomada de decisão do gestor.',
        },
      ],
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
    return `Olá! Sou o NutrIA, seu assistente de vigilância nutricional em Rio Claro.
    
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
