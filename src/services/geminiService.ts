import type { Question } from "../types";

export const generateQuizQuestions = async (topic: string, count: number): Promise<Question[]> => {
    // This function now calls our Netlify serverless function, 
    // which securely handles the API key on the backend.
    const endpoint = '/.netlify/functions/generate-quiz';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic, count }),
        });

        const responseBody = await response.json();

        if (!response.ok) {
            // Use the error message from the serverless function's response if available
            const errorMessage = responseBody.error || `Request failed with status ${response.status}`;
            const errorDetails = responseBody.details ? `: ${responseBody.details}` : '';
            throw new Error(`${errorMessage}${errorDetails}`);
        }

        const questions = responseBody;
        
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
            throw new Error("Received malformed question data from the server.");
        }
        
        return questions as Question[];
    } catch (error) {
        console.error("Error calling generate-quiz function:", error);
        // Re-throw the error to be caught by the component
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred while communicating with the server.");
    }
};
