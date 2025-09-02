// Vercel Serverless Function - PITCH MODE ENABLED (Simplified)

const PITCH_MODE = true; 

// --- FAKE DEMO DATA (No large Base64 string) ---
const demoData = {
    productAnalysis: {
        candidates: [{
            content: { parts: [{ text: "a premium botanical skincare serum in a sleek bottle" }] }
        }]
    },
    adCopy: {
        candidates: [{
            content: { parts: [{ text: "Headline: The Fusion of Nature & Science.\nBody: A fusion of nature's finest ingredients and scientific innovation for skin that feels as good as it looks. Experience the botanical brilliance." }] }
        }]
    },
    campaignText: {
        candidates: [{
            content: {
                parts: [{
                    text: JSON.stringify([
                        {
                            platform_name: "Facebook",
                            headline: "Unlock Your Natural Glow! ✨",
                            ad_copy: "Discover the secret to radiant skin with our new Botanical Serum. Made with scientifically-proven natural extracts to nourish and revitalize. Your skin deserves the best!",
                            visual_concept: "A sleek bottle of the serum resting on a bed of fresh green leaves and delicate flowers, with soft morning light filtering through.",
                            call_to_action: "Shop Now & Glow Up"
                        },
                        {
                            platform_name: "Instagram",
                            headline: "Science Meets Nature.",
                            ad_copy: "Purely botanical. Powerfully scientific. Our new serum is here to transform your skincare routine. Get ready for visible results. #BotanicalBeauty #ScienceOfSkin",
                            visual_concept: "A minimalist flat-lay of the product next to a glass beaker containing a single green leaf. Clean, white marble background.",
                            call_to_action: "Tap to Shop"
                        }
                    ])
                }]
            }
        }]
    },
    // The backend now returns a special string "USE_DEMO_IMAGE" instead of Base64 data.
    adImageComposite: {
        candidates: [{
            content: { parts: [{ text: "USE_DEMO_IMAGE" }] }
        }]
    },
    campaignVisual: {
        predictions: [{ text: "USE_DEMO_IMAGE" }]
    }
};

// --- MAIN HANDLER ---
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!PITCH_MODE) {
        return res.status(503).json({ error: 'Live API is disabled.' });
    }

    try {
        const { type } = req.body;
        if (!type || !demoData[type]) {
            return res.status(400).json({ error: `Bad Request: Invalid type in Pitch Mode: ${type}` });
        }
        await new Promise(resolve => setTimeout(resolve, 500)); 
        return res.status(200).json(demoData[type]);
    } catch (error) {
        console.error('Pitch Mode Error:', error);
        return res.status(500).json({ error: 'An error occurred in Pitch Mode.' });
    }
}


