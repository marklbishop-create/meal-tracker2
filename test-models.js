const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

async function listModels() {
  try {
    const models = await ai.models.list();
    console.log("Models:", models.map(m => m.name));
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
