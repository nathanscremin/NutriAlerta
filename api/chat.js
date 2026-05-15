const { kv } = require('@vercel/kv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.NutriAlerta_API_Key);

// --- BASE DE CONHECIMENTO VISUAL ---

// const KNOWLEDGE_BASE = `

function getSystemInstruction(screenData) {
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

    const rules = `
    Você é o NutriBot, assistente de vigilância nutricional do município de Rio Claro.
    Seu usuário é um gestor municipal de saúde.
    ${context}
    Responda com base nos dados acima. Use linguagem clara e objetiva para gestores públicos.
    Não invente dados que não estejam no contexto fornecido.
    `;

    return [
        { role: "user", parts: [{ text: `SYSTEM OVERRIDE: ${rules}` }] },
        { role: "model", parts: [{ text: "Entendido. Estou pronto para analisar os dados nutricionais da UBS selecionada." }] }
    ];
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
        const dynamicInstruction = getSystemInstruction(context.screenData);

        const historyForAPI = [
            ...dynamicInstruction,
            ...historyFromDB
        ];
        
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); 
        const chat = model.startChat({ history: historyForAPI });
        
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();
        
        const updatedHistory = await chat.getHistory();
        // Remove o prompt de sistema para não poluir o banco
        const cleanHistoryToSave = updatedHistory.slice(2);
        
        await kv.set(sessionId, cleanHistoryToSave);
        
        res.status(200).json({ response: text });

    } catch (error) {
        console.error("ERRO API:", error);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
};
