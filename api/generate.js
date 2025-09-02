// Vercel Serverless Function to handle API calls - LIVE MODE

import { GoogleGenerativeAI } from '@google/generative-ai';

// --- CONFIGURATION ---
// IMPORTANT: You MUST set your GEMINI_API_KEY in your Vercel project's Environment Variables.
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Define the models to be used for different tasks
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-preview-0520" });
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-preview-0520" });
const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-preview-0611"});


// --- MAIN HANDLER ---
// This is the main function Vercel will run.
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: API key not found.' });
    }

    try {
        const { type, payload } = req.body;
        console.log(`Received request for type: ${type}`);

        let result;

        switch (type) {
            case 'productAnalysis':
            case 'adImageComposite': // Handled by the same vision model
                result = await visionModel.generateContent(payload.contents);
                break;

            case 'adCopy':
            case 'campaignText': // Handled by the same text model
                result = await textModel.generateContent(payload.contents, payload.generationConfig);
                break;
            
            case 'campaignVisual':
                // Note: The Imagen model uses a different method signature
                const imageResponse = await imageModel.generateContent(payload.prompt);
                // We need to structure the response to be consistent for the frontend.
                // This is a mock structure to match what the other models return.
                // The actual image data is typically handled differently (e.g., streaming or direct bytes),
                // but for this client-side setup, we'll assume a parsable format is intended.
                // This part might need adjustment based on the exact client-side expectation
                // For now, we'll simulate a similar response structure.
                // A real implementation would process imageResponse differently.
                 result = { predictions: [ { bytesBase64Encoded: imageResponse.response.candidates[0].content.parts[0].inlineData.data }] };
                break;

            default:
                return res.status(400).json({ error: `Invalid API call type: ${type}` });
        }
        
        console.log(`Successfully processed request for type: ${type}`);
        return res.status(200).json(result.response ? result.response : result);

    } catch (error) {
        console.error(`Error processing API request:`, error);
        // Provide a more detailed error message back to the client if possible
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        return res.status(500).json({ 
            error: `An error occurred while processing your request.`,
            details: errorMessage
        });
    }
}


