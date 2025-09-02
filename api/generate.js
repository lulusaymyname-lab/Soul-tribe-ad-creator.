// Vercel Serverless Function to handle API calls - LIVE MODE
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- CONFIGURATION ---
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-preview-0520" });
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-preview-0520" });
// The model for generating images from a text prompt.
const imageModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-image-preview" });

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

        // Route the request based on the 'type'
        switch (type) {
            case 'productAnalysis':
            case 'adCopy':
            case 'campaignText':
                result = await textModel.generateContent(payload);
                response = result.response;
                return res.status(200).json({ candidates: response.candidates });

            case 'adImageComposite':
                result = await visionModel.generateContent(payload);
                response = result.response;
                return res.status(200).json({ candidates: response.candidates });
            
            case 'campaignVisual':
                // For simple text-to-image, the payload is different.
                // We use the 'gemini-1.5-flash-image-preview' model for this.
                result = await imageModel.generateContent(payload.prompt);
                response = result.response;
                // We need to format the response to match what the frontend expects (a `predictions` array)
                const imageBase64 = response.candidates[0].content.parts.find(p => p.inlineData)?.inlineData?.data;
                return res.status(200).json({ predictions: [{ bytesBase64Encoded: imageBase64 }] });

            default:
                return res.status(400).json({ error: 'Invalid API call type specified.' });
        }

    } catch (error) {
        console.error(`Error in ${type} API call:`, error);
        const details = error.response?.data?.error?.message || error.message;
        return res.status(500).json({ error: 'An error occurred during the API call.', details });
    }
}



