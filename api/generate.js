// Vercel Serverless Function to handle API calls - LIVE MODE (Corrected)

import { GoogleGenerativeAI } from '@google/generative-ai';

// --- CONFIGURATION ---
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Define the models to be used for different tasks
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-preview-0520" });
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-preview-0520" });
// Using the specific model for image generation
const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-preview-0611" });

// --- MAIN HANDLER ---
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
            case 'adImageComposite':
                result = await visionModel.generateContent(payload.contents);
                break;

            case 'adCopy':
            case 'campaignText':
                result = await textModel.generateContent(payload.contents, payload.generationConfig);
                break;
            
            case 'campaignVisual':
                const imageResponse = await imageModel.generateContent(payload.prompt);
                
                // --- THIS IS THE CORRECTED CODE ---
                // Find the part of the response that contains the image data.
                const imagePart = imageResponse.response.candidates[0].content.parts.find(part => part.inlineData);

                if (!imagePart || !imagePart.inlineData || !imagePart.inlineData.data) {
                    throw new Error("No image data found in the API response.");
                }
                const imageData = imagePart.inlineData.data;

                // Structure the response consistently for the frontend.
                result = { predictions: [{ bytesBase64Encoded: imageData }] };
                break;

            default:
                return res.status(400).json({ error: `Invalid API call type: ${type}` });
        }
        
        console.log(`Successfully processed request for type: ${type}`);
        return res.status(200).json(result.response ? result.response : result);

    } catch (error) {
        console.error(`Error processing API request:`, error);
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        return res.status(500).json({ 
            error: `An error occurred while processing your request.`,
            details: errorMessage
        });
    }
}



