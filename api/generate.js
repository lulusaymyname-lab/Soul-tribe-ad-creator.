// Vercel Serverless Function to handle API calls - PITCH MODE ENABLED

const PITCH_MODE = true; 
// This is now a visible SVG placeholder image that says "Demo Visual"
const DEMO_IMAGE_BASE64 = "PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSIjMUYyOTM3Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iSW50ZXIsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5Q0EzQUYiPkRlbW8gVmlzdWFsPC90ZXh0Pgo8L3N2Zz4=";

// --- FAKE DEMO DATA ---
const demoData = {
    productAnalysis: {
        candidates: [{
            content: {
                parts: [{ text: "a premium botanical skincare serum in a sleek bottle" }]
            }
        }]
    },
    adCopy: {
        candidates: [{
            content: {
                parts: [{ text: "Headline: The Fusion of Nature & Science.\nBody: A fusion of nature's finest ingredients and scientific innovation for skin that feels as good as it looks. Experience the botanical brilliance." }]
            }
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
    adImageComposite: {
        candidates: [{
            content: {
                parts: [{ inlineData: { data: DEMO_IMAGE_BASE64 } }]
            }
        }]
    },
    campaignVisual: {
        predictions: [{ bytesBase64Encoded: DEMO_IMAGE_BASE64 }]
    }
};


// --- MAIN HANDLER (PITCH MODE) ---
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!PITCH_MODE) {
        // This block will be ignored when PITCH_MODE is true.
        // For production, you would put the real API logic here.
        return res.status(503).json({ error: 'Live API is disabled.' });
    }

    try {
        const { type } = req.body;

        if (!type || !demoData[type]) {
            return res.status(400).json({ error: `Bad Request: Invalid type in Pitch Mode: ${type}` });
        }

        // Instantly return the pre-canned demo data for the requested type
        // Add a small delay to simulate a real network request
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        return res.status(200).json(demoData[type]);

    } catch (error) {
        console.error('Pitch Mode Error:', error);
        return res.status(500).json({ 
            error: 'An error occurred in Pitch Mode.',
            details: error.message 
        });
    }
}


