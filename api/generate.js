// Vercel Serverless Function to handle API calls to Google's Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- CONFIGURATION ---
// IMPORTANT: You must set your GEMINI_API_KEY in your Vercel project's Environment Variables.
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
}
const genAI = new GoogleGenerativeAI(API_KEY);

// Define the models to be used for different tasks
const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
const imageGenModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

// --- MAIN HANDLER ---
// This is the main function Vercel will run.
export default async function handler(request, response) {
    // Set CORS headers to allow requests from your frontend
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*'); // Or specify your frontend domain for better security
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS pre-flight request for CORS
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // Ensure the request is a POST request
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!API_KEY) {
         return response.status(500).json({ error: 'API key not configured on the server.' });
    }

    try {
        const { type, payload } = request.body;
        if (!type || !payload) {
            return response.status(400).json({ error: 'Missing "type" or "payload" in request body' });
        }

        let result;

        // Route the request based on the 'type'
        switch (type) {
            case 'productAnalysis':
            case 'adImageComposite': {
                const { contents, generationConfig } = payload;
                result = await imageGenModel.generateContent({ contents, generationConfig });
                break;
            }
            case 'adCopy':
            case 'campaignText': {
                 const { contents, generationConfig } = payload;
                 result = await textModel.generateContent({ contents, generationConfig });
                 break;
            }
            case 'campaignVisual': {
                 // The 'campaignVisual' case in the frontend uses a different API structure (imagen).
                 // We will simulate it using gemini-2.5-flash-image-preview for consistency here.
                 const { instances } = payload;
                 const prompt = instances[0].prompt;
                 const imageResult = await imageGenModel.generateContent(prompt);
                 const base64Data = imageResult.response.candidates[0].content.parts.find(p => p.inlineData)?.inlineData?.data;
                 // Imagen expects a specific response structure, so we mimic it.
                 return response.status(200).json({ predictions: [{ bytesBase64Encoded: base64Data }] });
            }
            default:
                return response.status(400).json({ error: `Unknown request type: "${type}"` });
        }
        
        const resultCandidates = result?.response?.candidates;

        if (!resultCandidates || resultCandidates.length === 0) {
            console.error('API returned no candidates for type:', type, 'Full response:', result);
            return response.status(500).json({ error: 'The AI model did not return a valid response.' });
        }
        
        // Send the successful response back to the frontend
        return response.status(200).json({ candidates: resultCandidates });

    } catch (error) {
        console.error('Error in handler function:', error);
        return response.status(500).json({ error: error.message || 'An internal server error occurred.' });
    }
}


