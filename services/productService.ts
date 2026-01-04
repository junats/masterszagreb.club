export interface ProductDetails {
    name: string;
    brand?: string;
    imageUrl?: string;
    category?: string;
    nutritionGrade?: string; // a, b, c, d, e
    ingredientsText?: string;
}

// Helper to map OpenFoodFacts categories to App Categories
const mapCategory = (tags: string[] = []): string => {
    const lowerTags = tags.map(t => t.toLowerCase());

    // Strict priority mapping
    if (lowerTags.some(t => t.includes('medicine') || t.includes('drug') || t.includes('health') || t.includes('pharmacy') || t.includes('supplement') || t.includes('vitamin'))) return 'Health';
    if (lowerTags.some(t => t.includes('alcohol') || t.includes('beer') || t.includes('wine') || t.includes('spirit') || t.includes('liquor'))) return 'Alcohol';
    if (lowerTags.some(t => t.includes('cleaning') || t.includes('detergent') || t.includes('household') || t.includes('soap') || t.includes('paper'))) return 'Household';
    if (lowerTags.some(t => t.includes('baby') || t.includes('child') || t.includes('toy') || t.includes('diaper'))) return 'Child';
    if (lowerTags.some(t => t.includes('beauty') || t.includes('cosmetic') || t.includes('hygiene') || t.includes('shampoo'))) return 'Health'; // Personal care -> Health
    if (lowerTags.some(t => t.includes('clothing') || t.includes('apparel') || t.includes('shoe'))) return 'Clothing';
    if (lowerTags.some(t => t.includes('education') || t.includes('book') || t.includes('school'))) return 'Education';

    // Food catch-all
    if (lowerTags.some(t => t.includes('food') || t.includes('snack') || t.includes('breakfast') || t.includes('cereal') || t.includes('dairy') || t.includes('beverage') || t.includes('drink') || t.includes('water') || t.includes('juice') || t.includes('soda') || t.includes('meat') || t.includes('cheese'))) return 'Food';

    // Default to Other if really unknown, but try strict fuzzy matched on simple category name if available
    return 'Other';
};

import { lookupProductByBarcode } from './geminiService';

export const fetchProductByBarcode = async (barcode: string): Promise<ProductDetails | null> => {
    try {
        console.log(`🔍 Raw barcode: ${barcode}`);

        // --- GS1 DataMatrix Parser (Pharma) ---
        // Pharma codes often come as "(01)12345678901234(17)..." or with invisible control chars.
        // We need to extract the GTIN (Global Trade Item Number) usually following AI (01).

        // AGGRESSIVE CLEAN: Remove everything except digits.
        let queryCode = barcode.replace(/[^0-9]/g, '');
        console.log(`🧹 Cleaned numeric code: ${queryCode}`);

        // Algorithm: If starts with 01 and length is sufficient, extract 14 digits (GTIN-14)
        if (queryCode.startsWith('01') && queryCode.length >= 16) {
            console.log('💊 Detected GS1 Pharma Code starting with 01');
            // AI (01) is 2 chars, GTIN is 14 chars. Total 16.
            queryCode = queryCode.substring(2, 16);
            console.log(`✨ Extracted GTIN: ${queryCode}`);
        } else if (queryCode.length > 14) {
            // Fallback: If it's very long but doesn't start with 01
            console.log(`⚠️ Code is long (${queryCode.length}) but no 01 AI detected. Using raw.`);
        }

        // List of endpoints to try in order of likelihood/quality
        const endpoints = [
            'https://world.openfoodfacts.org/api/v0/product/',     // Food
            'https://world.openbeautyfacts.org/api/v0/product/',   // Cosmetics
            'https://world.openproductsfacts.org/api/v0/product/'  // General
        ];

        for (const baseUrl of endpoints) {
            console.log(`🔍 Querying ${baseUrl}${queryCode}.json...`);
            try {
                const response = await fetch(`${baseUrl}${queryCode}.json`);
                if (!response.ok) continue;

                const data = await response.json();
                if (data.status === 1 && data.product) {
                    const p = data.product;
                    console.log(`✅ Product found via ${baseUrl}: ${p.product_name}`);

                    // Normalize Category
                    const rawTags = p.categories_tags || [];
                    let normalizedCategory = mapCategory(rawTags);

                    // Double check single category if normalization resulted in 'Other'
                    if (normalizedCategory === 'Other' && p.categories_tags?.[0]) {
                        const mainCat = p.categories_tags[0].replace('en:', '').replace(/-/g, ' ').toLowerCase();
                        if (mainCat.includes('food') || mainCat.includes('snack')) normalizedCategory = 'Food';
                        if (mainCat.includes('beverage')) normalizedCategory = 'Food';
                    }

                    return {
                        name: p.product_name || p.generic_name || 'Unknown Product',
                        brand: p.brands || p.brands_tags?.[0] || undefined,
                        imageUrl: p.image_front_url || p.image_url || undefined,
                        category: normalizedCategory,
                        nutritionGrade: p.nutrition_grades || undefined,
                        ingredientsText: p.ingredients_text || undefined
                    };
                }
            } catch (err) {
                console.warn(`Failed to connect to ${baseUrl}`, err);
            }
        }

        console.log('❌ Product not found in any OpenFacts database. Trying AI Fallback...');

        // Final Fallback: Ask Gemini
        try {
            const aiResult = await lookupProductByBarcode(queryCode);
            if (aiResult) {
                console.log(`🤖 AI identified product: ${aiResult.name}`);
                return {
                    name: aiResult.name,
                    brand: aiResult.brand,
                    category: aiResult.category || 'Other',
                };
            }
        } catch (e) {
            console.warn('AI lookup also failed', e);
        }

        return null;
    } catch (error) {
        console.error('Error fetching product by barcode:', error);
        return null;
    }
};
