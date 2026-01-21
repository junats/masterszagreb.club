import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from Functions!");

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        let action = pathParts[pathParts.length - 1];

        // Read body once
        let body: any = {};
        try {
            body = await req.json();
        } catch (e) {
            // Body might be empty for simple GETs
        }

        // Check if action is just the function name (likely 'api'), if so, look in body
        if (action === 'api' || action === 'v1' || !action) {
            if (body.action) action = body.action;
        }

        console.log(`Resource requested: ${action}`);

        if (action === 'health') {
            return new Response(JSON.stringify({ status: 'ok', version: '1.0.0' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (action === 'product-lookup') {
            return await handleProductLookup(body);
        }

        if (action === 'analyze-receipt') {
            return await handleAnalyzeReceipt(body);
        }

        if (action === 'item-insights') {
            return await handleItemInsights(body);
        }

        // Default: Return 404 for unknown actions
        return new Response(JSON.stringify({ error: `Method ${action} not found` }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});

// --- Handlers ---

async function handleProductLookup(body: any) {
    const { barcode } = body;
    if (!barcode) throw new Error("Barcode is required");

    console.log(`Looking up barcode: ${barcode}`);

    // 1. Try OpenFoodFacts/OpenBeautyFacts/etc.
    const endpoints = [
        'https://world.openfoodfacts.org/api/v0/product/',
        'https://world.openbeautyfacts.org/api/v0/product/',
        'https://world.openproductsfacts.org/api/v0/product/'
    ];

    let cleanCode = barcode.replace(/[^0-9]/g, '');
    if (cleanCode.startsWith('01') && cleanCode.length >= 16) {
        cleanCode = cleanCode.substring(2, 16); // Extract GTIN-14 from GS1
    }

    for (const baseUrl of endpoints) {
        try {
            const res = await fetch(`${baseUrl}${cleanCode}.json`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 1 && data.product) {
                    const p = data.product;
                    return new Response(JSON.stringify({
                        source: 'openfacts',
                        data: {
                            name: p.product_name || p.generic_name || 'Unknown Product',
                            brand: p.brands || p.brands_tags?.[0],
                            imageUrl: p.image_front_url || p.image_url,
                            category: mapCategory(p.categories_tags),
                            nutritionGrade: p.nutrition_grades,
                            ingredientsText: p.ingredients_text
                        }
                    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
            }
        } catch (e) {
            console.warn(`Failed to fetch from ${baseUrl}`, e);
        }
    }

    // 2. Fallback to Gemini
    console.log("Native lookup failed, trying Gemini...");
    const geminiResult = await callGeminiProductLookup(cleanCode);

    return new Response(JSON.stringify({
        source: 'gemini',
        data: geminiResult || null
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleAnalyzeReceipt(body: any) {
    const { base64Image, categories } = body;
    if (!base64Image) throw new Error("Image data required");

    console.log("Analyzing receipt...");
    const result = await callGeminiReceiptAnalysis(base64Image, categories);

    return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

async function handleItemInsights(body: any) {
    const { items, barcodes } = body;
    if (!items) throw new Error("Items array required");

    console.log(`Generating insights for ${items.length} items`);
    const insights = await callGeminiItemInsights(items, barcodes);

    return new Response(JSON.stringify(insights), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// --- Helpers ---

function mapCategory(tags: string[] = []): string {
    const lowerTags = tags.map(t => t.toLowerCase());
    if (lowerTags.some(t => t.includes('medicine') || t.includes('drug') || t.includes('health'))) return 'Health';
    if (lowerTags.some(t => t.includes('alcohol') || t.includes('beer') || t.includes('wine'))) return 'Alcohol';
    if (lowerTags.some(t => t.includes('cleaning') || t.includes('detergent'))) return 'Household';
    if (lowerTags.some(t => t.includes('baby') || t.includes('child'))) return 'Child';
    if (lowerTags.some(t => t.includes('education'))) return 'Education';
    if (lowerTags.some(t => t.includes('clothing'))) return 'Clothing';
    // Defaults
    if (lowerTags.some(t => t.includes('food') || t.includes('snack') || t.includes('drink'))) return 'Food';
    return 'Other';
}

// --- Gemini Calls ---

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MODEL = "gemini-2.0-flash-exp";

async function callGeminiProductLookup(barcode: string) {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

    const prompt = `Identify the product associated with this Barcode/GTIN: "${barcode}". Return pure JSON: { "found": Boolean, "name": "Name", "brand": "Brand", "category": "Category", "confidence": Number }. NO Markdown.`;

    const result = await runGemini(prompt);
    if (result && result.found) return result;
    return null;
}

async function callGeminiReceiptAnalysis(base64: string, customCategories: any[]) {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

    // Recycled prompt from client logic
    const cats = customCategories?.map((c: any) => c.name).join(', ') || "Food, Household, Other";
    const prompt = `Analyze receipt. Return pure JSON: { "storeName": "Store", "date": "YYYY-MM-DD", "total": Number, "items": [{ "name": "Item", "price": Number, "category": "Category", "isRestricted": Boolean, "isChildRelated": Boolean }] }. Categories: ${cats}. NO Markdown.`;

    const result = await runGemini(prompt, base64);
    return result;
}

async function callGeminiItemInsights(items: any[], barcodes: any[]) {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

    const prompt = `Analyze items and provie insights. Items: ${JSON.stringify(items)}. Return pure JSON array matching item order: [{ "nutritionScore": number, "valueRating": number, "childFriendly": number, "insight": "string", "warnings": ["string"] }]. NO Markdown.`;

    const result = await runGemini(prompt);
    return result || items.map(() => null);
}

async function runGemini(text: string, imageBase64?: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const parts: any[] = [{ text }];
    if (imageBase64) {
        parts.unshift({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.1 } })
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Gemini API Error: ${res.status} ${txt}`);
    }

    const json = await res.json();
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return null;

    try {
        return JSON.parse(content);
    } catch (e) {
        console.error("Failed to parse Gemini JSON", content);
        return null; // or throw
    }
}
