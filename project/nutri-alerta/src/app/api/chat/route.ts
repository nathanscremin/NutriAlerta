import { kv } from '@vercel/kv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.NutriAlerta_API_Key!);

function getSystemInstruction(screenData: any) {
  let context = '';

  if (screenData && screenData.bairro) {
    context = `
    [[CONTEXTO DO BAIRRO SELECIONADO]]
    Bairro: ${screenData.bairro}
    Ano: ${screenData.ano ?? 'não informado'}
    Faixa Etária: ${screenData.faixaEtaria ?? 'não informada'}
    Indicador em foco: ${screenData.indicador ?? 'não informado'}
    Risco Predito: ${screenData.risco ?? 'não informado'}
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

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, context } = await req.json();

    if (!sessionId || !message || !context) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    const historyFromDB: any[] = (await kv.get(sessionId)) || [];

    if (message === '__GET_HISTORY__') {
      return NextResponse.json({ history: historyFromDB });
    }

    const dynamicInstruction = getSystemInstruction(context.screenData);

    const historyForAPI = [...dynamicInstruction, ...historyFromDB];

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const chat = model.startChat({ history: historyForAPI });

    const result = await chat.sendMessage(message);
    const text = result.response.text();

    const updatedHistory = await chat.getHistory();
    const cleanHistory = updatedHistory.slice(2);
    await kv.set(sessionId, cleanHistory);

    return NextResponse.json({ response: text });
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
