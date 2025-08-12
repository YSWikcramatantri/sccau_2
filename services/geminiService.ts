
import { GoogleGenAI, Type } from "@google/genai";
import type { Question } from "../types";

// Schema for the expected JSON output from the Gemini API
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

export const generateQuizQuestions = async (topic: string, count: number): Promise<Question[]> => {
    // IMPORTANT: In a real-world browser application, embedding an API key is a security risk.
    // This should be handled via a backend proxy. For this environment, we use process.env.API_KEY.
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        console.error("API_KEY environment variable is not set.");
        throw new Error("API_KEY is not configured. Please ensure it is set in your environment.");
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const prompt = `Generate a ${count}-question multiple-choice quiz about "${topic}". The difficulty should be suitable for astronomy enthusiasts. For each question, provide the question text, exactly 4 options, and the 0-based index of the correct answer.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
            },
        });

        // The response text is a JSON string, sometimes wrapped in markdown.
        let jsonText = response.text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.slice(7, -3).trim();
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.slice(3, -3).trim();
        }
        
        const questions = JSON.parse(jsonText);
        
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("API did not return a valid array of questions.");
        }

        // Basic validation of the parsed structure
        const isValid = questions.every(q => 
            typeof q.questionText === 'string' &&
            Array.isArray(q.options) &&
            q.options.length > 0 &&
            typeof q.correctAnswerIndex === 'number'
        );

        if (!isValid) {
            throw new Error("Received malformed question data from the API.");
        }
        
        return questions as Question[];
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            // Check for common API key errors
            if (error.message.includes("API key not valid")) {
                throw new Error("The provided API Key is invalid. Please check your configuration.");
            }
            throw new Error(`Failed to generate quiz questions: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the quiz.");
    }
};
