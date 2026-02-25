import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Edge Function started (V9 Gemini 2.5)");

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        let action = pathParts[pathParts.length - 1];

        let body: any = {};
        try { body = await req.json(); } catch (e) { }

        if (action === 'api' || action === 'v1' || !action) {
            if (body.action) action = body.action;
        }

        console.log(`Action: ${action}`);
        if (action === 'list-models') return await handleListModels();
        if (action === 'analyze-receipt') return await handleAnalyzeReceipt(body);
        if (action === 'product-lookup' || action === 'item-insights') return await handleGenericGemini(body, action);

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

async function handleListModels() {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function executeWithFailover(isPremium: boolean, body: any, action: string) {
    const proModels = [
        "gemini-2.5-pro",
        "gemini-pro-latest"
    ];

    const flashModels = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-lite-001" // Ultra-cheap last resort
    ];

    const modelsToTry = isPremium ? [...proModels, ...flashModels] : flashModels;

    let lastError = null;

    for (const model of modelsToTry) {
        let retries = 2; // max 2 retries per model for 429/5xx
        let delayMs = 1000;

        while (retries >= 0) {
            try {
                console.log(`[${action}] Trying model: ${model} (retries left: ${retries})`);
                const result = await runGeminiInternal(model, body, action);
                return result;
            } catch (e) {
                lastError = e;
                console.warn(`Model ${model} failed: ${e.message}`);

                // If 404 (Not Found) or 400 (Bad Request), retrying the same missing/bad model won't help
                if (e.message.includes("Error 404") || e.message.includes("Error 400") || e.message.includes("NOT_FOUND")) {
                    break;
                }

                // If it's a hard Quota Exceeded error (not just a minor rate limit spike), stop all failovers immediately
                if (e.message.includes("Quota exceeded") || e.message.includes("RESOURCE_EXHAUSTED")) {
                    console.error(`Hard quota limit reached for ${model}. Moving to next fallback model.`);
                    break;
                }

                // For rate limits (429) or server errors (500), back off and retry
                if (retries > 0) {
                    console.log(`Waiting ${delayMs}ms before retrying...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    delayMs *= 2; // Exponential backoff
                }
                retries--;
            }
        }
    }

    throw lastError || new Error(`All models and retries failed for Action: ${action}`);
}

async function handleAnalyzeReceipt(body: any) {
    const payloadSize = body.base64Image ? Math.round(body.base64Image.length * 0.75 / 1024) : 0;
    console.log(`Analyzing receipt. Payload size: ${payloadSize}KB`);
    const isPremium = body.isPremium === true;

    const result = await executeWithFailover(isPremium, body, "analyze-receipt");
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleGenericGemini(body: any, action: string) {
    const isPremium = body.isPremium === true;
    const result = await executeWithFailover(isPremium, body, action);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function runGeminiInternal(model: string, body: any, action: string) {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    let prompt = "";
    if (action === 'analyze-receipt') {
        const cats = body.categories?.map((c: any) => c.name).join(', ') || "Food, Household, Other";
        const goalTypes = "junk_food, alcohol, smoking, gaming, online_shopping, fast_fashion, streaming, gambling, caffeine, sugar, ride_sharing, other";
        prompt = `Analyze receipt. Return pure JSON: { "storeName": "Store", "date": "YYYY-MM-DD", "total": Number, "items": [{ "name": "Item", "price": Number, "category": "Category", "goalType": "GoalType", "isRestricted": Boolean, "isChildRelated": Boolean }] }. Categories: ${cats}. GoalTypes: ${goalTypes}. NO Markdown.`;
    } else if (action === 'product-lookup') {
        prompt = `Identify the product associated with this Barcode/GTIN: "${body.barcode}". Return pure JSON: { "found": Boolean, "name": "Name", "brand": "Brand", "category": "Category", "confidence": Number }. NO Markdown.`;
    }

    const parts: any[] = [{ text: prompt }];
    if (body.base64Image) parts.unshift({ inlineData: { mimeType: "image/jpeg", data: body.base64Image } });

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.1 } })
    });

    if (!res.ok) throw new Error(`Gemini ${model} Error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    let content = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Empty response");

    try {
        if (content.includes('```json')) content = content.split('```json')[1].split('```')[0];
        else if (content.includes('```')) content = content.split('```')[1].split('```')[0];
        return JSON.parse(content.trim());
    } catch (e) { return { raw: content }; }
}
