import type { Handler, HandlerEvent } from '@netlify/functions';
import { GoogleGenAI, Type } from "@google/genai";

// The Question interface is duplicated here to avoid complex module resolution
// issues within the Netlify Functions build environment.
interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

const quizSchema = {
  type: Type.ARRAY,
  description: "A list of multiple-choice questions for a quiz.",
  items: {
    type: Type.OBJECT,
    properties: {
      questionText: {
        type: Type.STRING,
        description: "The text of the quiz question.",
      },
      options: {
        type: Type.ARRAY,
        description: "An array of 4 possible answers.",
        items: {
          type: Type.STRING,
        },
      },
      correctAnswerIndex: {
        type: Type.INTEGER,
        description: "The 0-based index of the correct answer in the 'options' array.",
      },
    },
    required: ["questionText", "options", "correctAnswerIndex"],
  },
};

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    console.error("API_KEY environment variable is not set.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error: API_KEY is not set. Please configure it in your Netlify site settings." }),
    };
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const { topic, count } = JSON.parse(event.body || '{}');

    if (!topic || !count || typeof count !== 'number' || count <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body must include a "topic" (string) and a "count" (positive number).' }),
      };
    }
    
    const prompt = `Generate a ${count}-question multiple-choice quiz about "${topic}". The difficulty should be suitable for astronomy enthusiasts. For each question, provide the question text, exactly 4 options, and the 0-based index of the correct answer.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7, -3);
    }
    
    const questions = JSON.parse(jsonText);
    
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("API did not return a valid array of questions.");
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questions),
    };
  } catch (error) {
    console.error("Error in generate-quiz serverless function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown internal error occurred.";
    if (errorMessage.includes("API key not valid")) {
        return {
           statusCode: 401,
           body: JSON.stringify({ error: "Invalid API Key provided.", details: errorMessage }),
       };
   }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate quiz questions.", details: errorMessage }),
    };
  }
};

export { handler };
