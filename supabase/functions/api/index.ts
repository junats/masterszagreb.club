import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Edge Function started (V8 Standard ROOT)");

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

        if (action === 'health') {
            const apiKey = Deno.env.get('GEMINI_API_KEY');
            return new Response(JSON.stringify({ status: 'ok', hasApiKey: !!apiKey }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

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

async function handleAnalyzeReceipt(body: any) {
    const payloadSize = body.base64Image ? Math.round(body.base64Image.length * 0.75 / 1024) : 0;
    console.log(`Analyzing receipt. Payload size: ${payloadSize}KB`);

    // Added gemini-1.5-flash as it's very stable and less likely to 429
    const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-flash-lite", "gemini-flash-latest", "gemini-pro-latest"];
    let lastError = null;
    for (const model of modelsToTry) {
        try {
            console.log(`Trying model: ${model}`);
            const result = await runGeminiInternal(model, body, "analyze-receipt");
            return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch (e) {
            console.warn(`Model ${model} failed: ${e.message}`);
            lastError = e;
            // Continue to next model on ANY error (429, 500, etc.)
        }
    }
    throw lastError || new Error("All models failed");
}

async function handleGenericGemini(body: any, action: string) {
    const result = await runGeminiInternal("gemini-flash-latest", body, action);
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
