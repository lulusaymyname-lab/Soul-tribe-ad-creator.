// Vercel Serverless Function to handle API calls - LIVE MODE
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- CONFIGURATION ---
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
// Note: Imagen is called differently, so we don't initialize it here.

// --- MAIN HANDLER ---
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    if (!API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: API key not set.' });
    }

    const { type, payload } = req.body;

    try {
        let result;
        let response;

        switch (type) {
            case 'productAnalysis':
            case 'adCopy':
            case 'campaignText':
            case 'adImageComposite':
                // These all use the same Gemini model and request structure
                result = await textModel.generateContent(payload);
                response = result.response;
                return res.status(200).json({ candidates: response.candidates });

            case 'campaignVisual':
                // Imagen uses a different endpoint and payload structure via a direct fetch call.
                const imagenApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${API_KEY}`;
                
                const imagenPayload = {
                    instances: [{ prompt: payload.prompt }],
                    parameters: { "sampleCount": 1 }
                };

                const imagenResponse = await fetch(imagenApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(imagenPayload)
                });

                if (!imagenResponse.ok) {
                    const errorBody = await imagenResponse.json();
                    console.error("Imagen API Error:", errorBody);
                    throw new Error(errorBody.error?.message || 'Failed to generate image with Imagen.');
                }
                
                const imagenResult = await imagenResponse.json();
                return res.status(200).json(imagenResult);

            default:
                return res.status(400).json({ error: 'Invalid API call type specified.' });
        }

    } catch (error) {
        console.error(`Error in ${type} API call:`, error);
        return res.status(500).json({ error: 'An error occurred during the API call.', details: error.message });
    }
}



