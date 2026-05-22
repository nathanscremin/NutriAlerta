const { kv } = require('@vercel/kv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.NutriAlerta_API_Key);

// --- BASE DE CONHECIMENTO VISUAL ---

function getSystemInstructionText(screenData) {
    let context = "";
    if (screenData && screenData.ubs) {
        context = `
        [[CONTEXTO DA UBS SELECIONADA]]
        UBS: ${screenData.ubs}
        Ano: ${screenData.ano}
        Faixa Etária: ${screenData.faixa_etaria}
        Risco Predito: ${screenData.risco_predito}
        Probabilidade de Risco Alto: ${screenData.prob_alto}
        Delta Obesidade: ${screenData.delta_obesidade}
        Delta Desnutrição: ${screenData.delta_desnutricao}
        `;
    } else {
        context = "[[CONTEXTO]] Nenhuma UBS selecionada. Oriente o gestor a clicar em uma UBS no mapa.";
    }

    return `
    Você é o NutriBot, assistente de vigilância nutricional do município de Rio Claro.
    Seu usuário é um gestor municipal de saúde.
    ${context}
    Responda com base nos dados acima. Use linguagem clara e objetiva para gestores públicos.
    Não invente dados que não estejam no contexto fornecido.
    `;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { sessionId, message, context } = req.body;

        if (!sessionId || !message || !context) {
            return res.status(400).json({ error: 'Dados incompletos.' });
        }
        
        // Recupera histórico
        const historyFromDB = await kv.get(sessionId) || [];

        if (message === "__GET_HISTORY__") {
            res.status(200).json({ history: historyFromDB });
            return;
        }

        // Gera instrução atualizada com o contexto visual correto
        const systemInstruction = getSystemInstructionText(context.screenData);

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            systemInstruction: {
                role: "system",
                parts: [{ text: systemInstruction }]
            }
        }); 
        
        const chat = model.startChat({ history: historyFromDB });
        
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();
        
        const updatedHistory = await chat.getHistory();
        
        await kv.set(sessionId, updatedHistory);
        
        res.status(200).json({ response: text });

    } catch (error) {
        console.error("ERRO API:", error);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
};
