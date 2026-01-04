import { AnalysisResult, Category } from "../types";

// Helper to compress image (optimized for speed)
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Aggressively reduced to 600x600 for maximum speed/minimum latency
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1]; // 0.5 quality
        resolve(base64);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const analyzeReceiptImage = async (base64Image: string, categories: { name: string }[] = []): Promise<AnalysisResult> => {
  console.log('🔍 analyzeReceiptImage called (REST), image length:', base64Image?.length);

  let apiKey: string | undefined;

  try {
    if (typeof process !== 'undefined') {
      apiKey = process.env.API_KEY;
    }
  } catch (e) { console.warn("process.env access failed", e); }

  if (!apiKey) {
    console.log('📌 Using fallback API key');
    // @ts-ignore
    apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  // MOCK FALLBACK
  if (!apiKey) {
    console.warn("⚠️ API Key missing. Returning Mock Analysis Result.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          storeName: "Mock Store (Demo)",
          date: new Date().toISOString().split('T')[0],
          total: 42.50,
          type: 'receipt',
          items: [
            { name: "Demo Item 1", price: 10.00, quantity: 1, category: "Food", isRestricted: false, isChildRelated: false, goalType: null },
            { name: "Demo Item 2", price: 32.50, quantity: 1, category: "Household", isRestricted: false, isChildRelated: false, goalType: null }
          ]
        });
      }, 2000);
    });
  }

  const defaultCategories = ["Necessity", "Food", "Dining", "Alcohol", "Luxury", "Household", "Health", "Transport", "Education", "Child", "Other"];
  const categoryNames = categories.length > 0 ? categories.map(c => c.name) : defaultCategories;
  const categoryListString = categoryNames.join(', ');

  // STEP 1: Validate that this is actually a receipt/payment form
  const validationPrompt = `
    Analyze this image and determine if it is a receipt, invoice, or payment form.
    Return pure JSON:
    {
      "isReceipt": Boolean,
      "reason": "Brief explanation"
    }
    
    A valid receipt/payment form includes:
    - Store/merchant name
    - Items purchased or services rendered
    - Prices and total amount
    - Date of transaction
    
    Invalid images include:
    - Personal photos
    - Screenshots of apps/websites (unless showing a digital receipt)
    - Random documents
    - Memes or social media posts
    
    NO Markdown. JSON ONLY.`;

  try {
    const model = "gemini-2.0-flash-exp";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Validation request
    const validationBody = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            },
            {
              text: validationPrompt
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    };

    const validationResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validationBody)
    });

    if (!validationResponse.ok) {
      console.error(`Validation API Error: ${validationResponse.status}`);
      // Continue anyway if validation fails
    } else {
      const validationJson = await validationResponse.json();
      const validationText = validationJson.candidates?.[0]?.content?.parts?.[0]?.text;

      if (validationText) {
        const validationResult = JSON.parse(validationText);
        if (!validationResult.isReceipt) {
          throw new Error(`NOT_A_RECEIPT: ${validationResult.reason || 'This image does not appear to be a receipt or payment form.'}`);
        }
      }
    }
  } catch (error: any) {
    if (error.message?.startsWith('NOT_A_RECEIPT:')) {
      throw error; // Re-throw validation errors
    }
    console.warn('Receipt validation failed, proceeding with analysis:', error);
    // Continue with analysis if validation check itself fails
  }

  // STEP 2: Analyze the receipt (original prompt)
  const promptText = `
    Analyze receipt. Return pure JSON.
    {
      "storeName": "Store Name",
      "date": "YYYY-MM-DD",
      "total": Number,
      "items": [
        { "name": "Item Name", "price": Number, "category": "Category", "isRestricted": Boolean, "isChildRelated": Boolean }
      ]
    }
    details:
    - total: if missing, sum items.
    - categories: ${categoryListString}.
    - isRestricted: true for alcohol/tobacco.
    - isChildRelated: true for baby/kid items (diapers, toys, clothes).
    - If unsure store, use "Unknown".
    NO Markdown. JSON ONLY.`;

  try {
    // Model: gemini-2.0-flash-exp (The only working/available model for this key)
    const model = "gemini-2.0-flash-exp";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            },
            {
              text: promptText
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Gemini API failed with status ${response.status}: ${errorText}`);
    }

    const jsonResponse = await response.json();

    // Parse response structure
    // REST API Structure: { candidates: [ { content: { parts: [ { text: "..." } ] } } ] }
    const candidate = jsonResponse.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart) {
      console.error("Gemini Response Structure:", JSON.stringify(jsonResponse, null, 2));
      throw new Error("No text returned from Gemini API");
    }

    const data = JSON.parse(textPart) as AnalysisResult;

    // --- VALIDATION & NORMALIZATION ---
    const todayStr = new Date().toISOString().split('T')[0];

    // Normalize Date
    if (!data.date) {
      data.date = todayStr;
    } else {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(data.date)) {
        const parsedDate = new Date(data.date);
        if (!isNaN(parsedDate.getTime())) {
          data.date = parsedDate.toISOString().split('T')[0];
        } else {
          data.date = todayStr;
        }
      }
    }

    // Normalize Total
    if (typeof data.total !== 'number' || isNaN(data.total)) {
      if (typeof data.total === 'string') {
        const extracted = parseFloat((data.total as string).replace(/[^0-9.]/g, ''));
        if (!isNaN(extracted)) {
          data.total = extracted;
        } else {
          // Fallback: Sum items
          const itemSum = (data.items || []).reduce((acc: number, item: any) => acc + (item.price || 0), 0);
          data.total = itemSum; // Default to sum or 0, don't throw
        }
      } else {
        // Fallback: Sum items
        const itemSum = (data.items || []).reduce((acc: number, item: any) => acc + (item.price || 0), 0);
        data.total = itemSum;
      }
    }

    // Normalize Items
    if (!Array.isArray(data.items)) data.items = [];
    if (!data.storeName) data.storeName = 'Unknown Store';

    return data;

  } catch (error) {
    console.error("Error analyzing receipt (REST):", error);
    throw error;
  }
};

/**
 * Analyze receipt items for nutrition, value, and child-friendliness insights
 * Pro feature only - requires barcode data for accurate product information
 */
export const analyzeItemInsights = async (items: any[], barcodes?: string[]): Promise<any[]> => {
  console.log('🔍 analyzeItemInsights called for', items.length, 'items');

  let apiKey: string | undefined;

  try {
    if (typeof process !== 'undefined') {
      apiKey = process.env.API_KEY;
    }
  } catch (e) { console.warn("process.env access failed", e); }

  if (!apiKey) {
    // @ts-ignore
    apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  if (!apiKey) {
    console.warn("⚠️ API Key missing. Skipping insights analysis.");
    return items.map(() => null);
  }

  const promptText = `Analyze these grocery/retail items and provide PREMIUM health, utility, and PHARMA insights.

Items: ${JSON.stringify(items.map((i, idx) => ({
    name: i.name,
    category: i.category,
    price: i.price,
    barcode: barcodes?.[idx] || null
  })))}

For EACH item, provide:
1. nutritionScore (-1 to 100): 
   - For FOOD/DRINK: Health Score (100=Superfood/Organic, 0=Processed/Junk).
   - For MEDICINE: 100=Essential/Lifesaving, 80=Standard Care, 20=Homeopathic, -1=Recalled/Dangerous.
   - For NON-FOOD/UTILITY: RETURN -1. (Plastic bags, batteries = -1).
2. valueRating (1-5): Real Value Assessment.
   - Food: Price per nutritional density.
   - Medicine: Efficacy vs Price (Generic=5, Overpriced Brand=2).
   - Non-Food: Durability/Utility (5=Essential).
3. childFriendly (1-5): Safety & Suitability.
   - medicine: 1="KEEP AWAY/ADULT ONLY", 5="Pediatric Safe/Child Formulated".
   - general: 5=Safe/Educational, 1=Hazardous.
4. insight (max 60 chars): 
   - Food: Health tip.
   - Meds: "Finish course", "Check dosage by weight", "Consult doctor".
   - Non-Food: Utility benefit.
5. warnings (array): 
   - Meds: "Not for under 12s", "May cause drowsiness", "Check allergies".
   - Food: Allergens.

Return pure JSON array matching item order:
[
  {
    "nutritionScore": 85,
    "valueRating": 4,
    "childFriendly": 5,
    "insight": "Excellent source of fiber and vitamins",
    "warnings": []
  },
  {
    "nutritionScore": 100,
    "valueRating": 5,
    "childFriendly": 1,
    "insight": "Antibiotic - Finish designated course",
    "warnings": ["Keep out of reach of children", "Prescription only"]
  }
]

Guidelines:
- PLASTIC BAGS/PACKAGING: nutritionScore = -1, valueRating = 1.
- ADULT MEDS: childFriendly = 1 (Safety First).
- PEDIATRIC MEDS: childFriendly = 5.
- FRESH PRODUCE: nutritionScore > 80.
- NON-EDIBLES: nutritionScore = -1.

NO Markdown. JSON ONLY.`;

  try {
    const model = "gemini-2.0-flash-exp";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            {
              text: promptText
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini Insights API Error: ${response.status}`, errorText);
      return items.map(() => null);
    }

    const jsonResponse = await response.json();
    const textPart = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textPart) {
      console.error("No insights returned from Gemini");
      return items.map(() => null);
    }

    const insights = JSON.parse(textPart);

    // Validate insights array matches items length
    if (!Array.isArray(insights) || insights.length !== items.length) {
      console.warn("Insights array length mismatch");
      return items.map(() => null);
    }

    return insights;

  } catch (error) {
    console.error("Error analyzing item insights:", error);
    return items.map(() => null);
  }
};

/**
 * Fallback: Ask AI to identify a product solely by its barcode/GTIN.
 * This utilizes the LLM's internal knowledge base of common barcodes.
 */
export const lookupProductByBarcode = async (barcode: string): Promise<{ name: string; category: string; brand?: string } | null> => {
  console.log('🤖 Asking AI to identify barcode:', barcode);

  let apiKey: string | undefined;
  try {
    if (typeof process !== 'undefined') apiKey = process.env.API_KEY;
  } catch (e) { }

  if (!apiKey) {
    // @ts-ignore
    apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  if (!apiKey) return null;

  const promptText = `
    Identify the product associated with this Barcode/GTIN: "${barcode}".
    
    Return pure JSON:
    {
      "found": Boolean,
      "name": "Product Name",
      "brand": "Brand Name",
      "category": "General Category (Food, Electronics, etc)",
      "confidence": Number (0-1)
    }
    
    If you don't recognize it with >50% confidence, set found=false.
    NO Markdown. JSON ONLY.`;

  try {
    const model = "gemini-2.0-flash-exp";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) return null;

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const result = JSON.parse(text);
    if (result.found) {
      return {
        name: result.name,
        brand: result.brand,
        category: result.category
      };
    }
    return null;

  } catch (error) {
    console.warn("AI Barcode lookup failed:", error);
    return null;
  }
};