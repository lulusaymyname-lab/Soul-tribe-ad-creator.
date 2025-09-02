// Vercel Serverless Function to handle API calls to Google's Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- DEMO MODE CONFIGURATION ---
// SET THIS TO 'true' FOR YOUR INVESTOR PITCH FOR A GUARANTEED FLAWLESS DEMO.
// SET THIS TO 'false' for normal live operation.
const PITCH_MODE = true;

// --- PRE-MADE DEMO DATA (Used in Pitch Mode) ---
// Using a standard 1x1 transparent PNG for maximum compatibility.
const demoAdImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; 

const demoCampaignText = {
    candidates: [{
        content: {
            parts: [{
                text: JSON.stringify([{
                    "platform_name": "Facebook",
                    "headline": "Unlock Your Natural Glow! ✨",
                    "ad_copy": "Discover the secret to radiant skin with our new Botanical Serum. Made with scientifically-proven natural extracts to nourish and revitalize. Your skin deserves the best!",
                    "visual_concept": "A sleek bottle of the serum resting on a bed of fresh green leaves and delicate flowers, with soft morning light filtering through.",
                    "call_to_action": "Shop Now & Glow Up"
                }, {
                    "platform_name": "Instagram",
                    "headline": "Science Meets Nature.",
                    "ad_copy": "Purely botanical. Powerfully scientific. Our new serum is here to transform your skincare routine. Get ready for visible results. #BotanicalBeauty #ScienceOfSkin",
                    "visual_concept": "A minimalist flat-lay of the product next to a glass beaker containing a single green leaf. Clean, white marble background.",
                    "call_to_action": "Tap to Shop"
                }])
            }]
        }
    }]
};

// --- LIVE API CONFIGURATION ---
const API_KEY = process.env.GEMINI_API_KEY;
let genAI, textModel, imageGenModel;

if (!PITCH_MODE) {
    if (!API_KEY) {
        console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set for live mode.");
    }
    genAI = new GoogleGenerativeAI(API_KEY);
    textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
    imageGenModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
}

// --- MAIN HANDLER ---
export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // --- PITCH MODE LOGIC ---
    if (PITCH_MODE) {
        const { type } = request.body;
        // Add a small delay to make it feel real
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        switch (type) {
            case 'campaignText':
                return response.status(200).json(demoCampaignText);
            case 'productAnalysis':
            case 'adCopy':
                 return response.status(200).json({ candidates: [{ content: { parts: [{ text: "Headline: Botanical Brilliance. Body: A fusion of nature's finest ingredients and scientific innovation for skin that feels as good as it looks." }] } }] });
            case 'adImageComposite':
            case 'campaignVisual':
                const demoResponse = (type === 'campaignVisual')
                    ? { predictions: [{ bytesBase64Encoded: demoAdImageBase64 }] }
                    : { candidates: [{ content: { parts: [{ inlineData: { data: demoAdImageBase64 } }] } }] };
                return response.status(200).json(demoResponse);
            default:
                return response.status(400).json({ error: `Unknown request type in Demo Mode: "${type}"` });
        }
    }

    // --- LIVE API LOGIC ---
    if (!API_KEY) {
        return response.status(500).json({ error: 'API key not configured on the server.' });
    }

    try {
        const { type, payload } = request.body;
        if (!type || !payload) {
            return response.status(400).json({ error: 'Missing "type" or "payload" in request body' });
        }

        let result;
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
                const { instances } = payload;
                const prompt = instances[0].prompt;
                const imageResult = await imageGenModel.generateContent(prompt);
                const base64Data = imageResult.response.candidates[0].content.parts.find(p => p.inlineData)?.inlineData?.data;
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
        
        return response.status(200).json({ candidates: resultCandidates });

    } catch (error) {
        console.error('Error in handler function:', error);
        return response.status(500).json({ error: error.message || 'An internal server error occurred.' });
    }
}


