
import { GoogleGenAI } from "@google/genai";
import { PlacedCard, AIConfig, SpreadLayout, ChatMessage } from "../types";

const DEFAULT_SYSTEM_INSTRUCTION = `
Você é um tarólogo experiente, místico e empático. 
Sua tarefa é interpretar uma tiragem de cartas de Tarô fornecida pelo usuário.
O usuário fornecerá uma lista de cartas, seus estados (Normal ou Invertida) e posições.
Foque no significado simbólico, na interação entre as cartas e forneça um conselho prático e espiritual.
 IMPORTANTE: Dê ênfase especial ao interpretar cartas INVERTIDAS, explicando como elas representam energias bloqueadas, internalizadas ou aspectos de "sombra" que precisam de atenção.
Mantenha o tom misterioso mas acolhedor. Responda em português.
Use formatação Markdown para deixar a leitura bonita (negrito, itálico, listas).
`;

export const interpretSpread = async (
  cards: PlacedCard[], 
  aiConfig?: AIConfig,
  currentLayout?: SpreadLayout
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key não encontrada. Configure a variável de ambiente API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare context from uploaded files
  let contextData = "";
  if (aiConfig?.contextFiles && aiConfig.contextFiles.length > 0) {
    contextData = "\n\nCONTEXTO ADICIONAL / CONHECIMENTO ESPECÍFICO:\n";
    aiConfig.contextFiles.forEach(file => {
      contextData += `--- Início do arquivo: ${file.name} ---\n${file.content}\n--- Fim do arquivo ---\n`;
    });
    contextData += "\nUse o contexto acima para guiar sua interpretação se relevante.\n";
  }

  // Layout Context
  const layoutContext = currentLayout 
    ? `LAYOUT UTILIZADO: "${currentLayout.name}"\nDescrição do Layout: ${currentLayout.description}\n`
    : "LAYOUT: Estilo Livre (sem posições fixas).";

  // Connection Context (Ligação)
  let connectionsContext = "";
  if (currentLayout?.connections && currentLayout.connections.length > 0) {
      connectionsContext = "\n\nCONEXÕES ENTRE POSIÇÕES (Analise a tensão/sinergia entre estas cartas):\n";
      currentLayout.connections.forEach(conn => {
          const slotA = currentLayout.slots.find(s => s.id === conn.from);
          const slotB = currentLayout.slots.find(s => s.id === conn.to);
          if (slotA && slotB) {
              connectionsContext += `- Conexão entre "${slotA.label}" e "${slotB.label}"\n`;
          }
      });
  }

  // Session Specific Questions
  let questionsContext = "";
  if (aiConfig?.sessionQuestions) {
      questionsContext = `\n\nPERGUNTAS ESPECÍFICAS DO CONSULENTE:\n${aiConfig.sessionQuestions}\n(Responda a estas perguntas diretamente na leitura)`;
  }

  const cardDescriptions = cards.map((card, index) => {
    const orientationDescription = card.isReversed 
      ? "INVERTIDA (Sinalizando atraso, resistência, energia interna ou o oposto do significado tradicional)" 
      : "NORMAL (Energia fluindo livremente, manifestação direta)";
      
    const specificMeaning = card.description 
        ? `\n   - Significado/Descrição da Carta: "${card.description}"` 
        : "";

    return `Carta ${index + 1}: ${card.name} ${specificMeaning}\n   - Estado: ${orientationDescription}\n   - Localização Visual: X=${Math.round(card.x)}, Y=${Math.round(card.y)}`;
  }).join("\n\n");

  const prompt = `${contextData}${layoutContext}${connectionsContext}${questionsContext}\n\n` + 
                 `Por favor, realize uma leitura completa e profunda para esta tiragem de Tarô:\n\n` +
                 `CARTAS NA MESA:\n${cardDescriptions}\n\n` +
                 `Diretrizes para a leitura:\n` +
                 `1. Comece com uma síntese da energia geral da mesa baseada no Layout "${currentLayout?.name || 'Livre'}".\n` +
                 `2. Associe cada carta à sua posição no layout (ex: Carta 1 na Posição 1) se aplicável.\n` +
                 `3. Destaque EXPLICITAMENTE como as cartas invertidas estão influenciando a situação.\n` +
                 `4. Analise as interações e conexões solicitadas entre as cartas.\n` +
                 `5. Finalize com um conselho ou orientação clara.`;

  const instruction = aiConfig?.systemInstruction?.trim() 
    ? aiConfig.systemInstruction 
    : DEFAULT_SYSTEM_INSTRUCTION;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: instruction,
        temperature: 0.8,
      }
    });

    return response.text || "Não foi possível gerar a interpretação no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Ocorreu um erro ao conectar com os espíritos digitais (Erro na API). Verifique sua chave de API.";
  }
};

export const chatWithGemini = async (
    history: ChatMessage[], 
    newMessage: string,
    aiConfig?: AIConfig
): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const instruction = aiConfig?.systemInstruction?.trim() ? aiConfig.systemInstruction : DEFAULT_SYSTEM_INSTRUCTION;

    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction: instruction },
            history: history.map(h => ({ role: h.role, parts: [{ text: h.message }] }))
        });

        const result = await chat.sendMessage({ message: newMessage });
        return result.text || "";
    } catch (e) {
        console.error(e);
        return "Erro ao processar mensagem.";
    }
}
