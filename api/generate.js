// Vercel Serverless Function to handle API calls - LIVE MODE
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- CONFIGURATION ---
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// **FIX: Using the 'latest' stable model names to prevent "Not Found" errors.**
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" }); // Using the recommended Imagen 3 model


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
            case 'adImageComposite':
                 result = await textModel.generateContent(payload);
                 response = result.response;
                 return res.status(200).json({ candidates: response.candidates });
            
            case 'campaignVisual':
                // For simple text-to-image, the payload is different and requires a different model.
                // The prompt is expected directly in the payload.
                const imageResult = await imageModel.generateContent(payload.prompt);
                const imageResponse = imageResult.response;
                
                // We need to format the response to match what the frontend expects (a `predictions` array)
                const imageBase64 = imageResponse.candidates[0].content.parts.find(p => p.inlineData)?.inlineData?.data;
                return res.status(200).json({ predictions: [{ bytesBase64Encoded: imageBase64 }] });

            default:
                return res.status(400).json({ error: 'Invalid API call type specified.' });
        }

    } catch (error) {
        console.error(`Error in ${type} API call:`, error);
        // Try to provide a more specific error message from the Google API if available
        const details = error.response?.data?.error?.message || error.message;
        return res.status(500).json({ error: 'An error occurred during the API call.', details });
    }
}



