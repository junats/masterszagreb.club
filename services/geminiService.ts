import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Category } from "../types";
// Add this helper function at the top of the file, after imports
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;

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

        const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        resolve(base64);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
// Define the expected schema for the AI response
const receiptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    storeName: {
      type: Type.STRING,
      description: "The name of the store, merchant, school, or kindergarten.",
    },
    date: {
      type: Type.STRING,
      description: "The date of purchase or invoice date (YYYY-MM-DD format). If not found, use today's date.",
    },
    total: {
      type: Type.NUMBER,
      description: "The total amount paid or due. Extract only the numeric value.",
    },
    type: {
      type: Type.STRING,
      enum: ["receipt", "bill"],
      description: "Classify the document. 'bill' for invoices/services/utilities/tuition/kindergarten. 'receipt' for standard retail shopping.",
    },
    referenceCode: {
      type: Type.STRING,
      description: "For bills/invoices: Extract the Payment Reference, Invoice Number, or Student ID Code. Return null for regular receipts.",
    },
    transactionId: {
      type: Type.STRING,
      description: "For retail receipts: Extract the Transaction ID, Receipt Number, Slip #, or any unique identifier printed on the receipt. This is critical for duplicate detection.",
    },
    items: {
      type: Type.ARRAY,
      description: "List of items purchased or services billed.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the product or service." },
          price: { type: Type.NUMBER, description: "Total price for this line item." },
          quantity: { type: Type.NUMBER, description: "Quantity purchased (default to 1)." },
          category: {
            type: Type.STRING,
            enum: [
              "Necessity",
              "Food",
              "Luxury",
              "Household",
              "Health",
              "Transport",
              "Education",
              "Other"
            ],
            description: "Classify strictly. Kindergarten/Tuition/Childcare = 'Education'. Education is always a Necessity.",
          },
          isRestricted: {
            type: Type.BOOLEAN,
            description: "Set to true if the item is alcohol, tobacco, nicotine, gambling, or adult-only products. Otherwise false.",
          },
          isChildRelated: {
            type: Type.BOOLEAN,
            description: "Set to true if the item is for a child (e.g. toys, baby food, nappies, kids clothes). Otherwise false.",
          },
          goalType: {
            type: Type.STRING,
            enum: [
              "junk_food",
              "alcohol",
              "smoking",
              "gaming",
              "gambling",
              "caffeine",
              "sugar",
              "online_shopping",
              "fast_fashion",
              "ride_sharing",
              "streaming",
              "savings"
            ],
            description: "Classify if item fits a goal: 'junk_food' (fast food/chips/candy), 'alcohol', 'smoking', 'gaming', 'gambling', 'caffeine' (coffee/energy drinks), 'sugar' (sweets/soda), 'online_shopping', 'fast_fashion', 'ride_sharing', 'streaming'. Return null if none match.",
          }
        },
        required: ["name", "price", "category", "isRestricted", "isChildRelated"],
      },
    },
  },
  required: ["storeName", "date", "total", "items"],
};

export const analyzeReceiptImage = async (base64Image: string): Promise<AnalysisResult> => {
  console.log('🔍 analyzeReceiptImage called, image length:', base64Image?.length);

  let apiKey: string | undefined;

  try {
    // Robust check to allow bundlers to replace process.env.API_KEY 
    // while preventing ReferenceError if process is undefined at runtime
    if (typeof process !== 'undefined') {
      apiKey = process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Failed to access process.env safely:", e);
  }

  // Fallback for production builds (especially iOS) where process.env doesn't work
  if (!apiKey) {
    console.log('📌 Using fallback API key');
    apiKey = 'AIzaSyA-w-s5GVM5xVkS1siyypYRqXfSFIVy3wI';
  }

  if (!apiKey) {
    throw new Error("API Key is missing or environment configuration is invalid.");
  }

  console.log('✅ API key present, initializing GoogleGenAI...');
  const ai = new GoogleGenAI({ apiKey });

  // Unified Smart Prompt
  const promptText = `
    Analyze this image, which could be a retail shopping receipt OR a service bill/invoice (e.g., Kindergarten, School, Utility).
    
    1. Extract the Store or Provider Name, Date, and Total Amount. Prices are in Euro (€).
    2. Classify the document type: 'bill' if it is an invoice or has a payment reference code; 'receipt' if it is retail shopping.
    3. If it is a bill, extract the 'Reference Code', 'Invoice Number', or 'Payment ID' if visible.
    4. If it is a retail receipt, extract the 'Transaction ID', 'Receipt Number', 'Slip #', or any unique alphanumeric code that identifies this specific transaction.
    5. Extract EVERY single line item individually. Do not group items. Do not return a single 'Total' item. If the receipt has 20 items, return 20 items.
    6. Categorize each item strictly into: Necessity, Food, Luxury, Household, Health, Transport, Education, or Other.
       - 'Food': STRICTLY for edible items, groceries, supermarkets, bakery, meat, veg, snacks, drinks. If it goes in your mouth and isn't medicine/alcohol, it is Food.
       - 'Necessity': Only for essential non-food items (e.g. clothes, basic utilities). DO NOT use this for Food.
       - 'Luxury': Dining Out, Restaurants, Fast Food, Takeaway, Coffee Shops, Alcohol, Tobacco, Electronics, Decor, Toys (unless educational).
       - 'Household': Cleaning supplies, Toiletries, Maintenance, Kitchenware.
       - 'Health': Medicine, Pharmacy, Doctor, Dentist, Vitamins.
       - 'Transport': Fuel, Public Transit. Taxis/Uber are 'Luxury' unless clearly medical/school.
       - 'Education': Tuition, School Fees, Books, School Supplies.
    7. IMPORTANT: Identify any items related to alcohol, tobacco, nicotine, gambling, or adult-only products and set their 'isRestricted' field to true.
    8. CRITICAL: Identify items meant for children (18 and younger) and set 'isChildRelated' to true.
       - EXAMPLES: Diapers, Baby Food, Formula, Kids Clothing, Toys, School Supplies, Tuition, Kindergarten Fees, Pediatric Medicine, Children's Books.
       - INFERENCE: If the store is "Toys R Us" or "Kindergarten", items are likely child-related.
    9. Ensure numeric values handle commas as decimals if standard in the receipt region.
    10. If the image is blurry or items are unclear, try to infer the category from the store type (e.g., a Pharmacy receipt with unclear items should have items categorized as Health).
    
    CRITICAL FOR TOTAL EXTRACTION:
    - The 'Total' must be the POSITIVE amount to be paid.
    - IGNORE any lines labeled "Preplata" (Overpayment), "Credit", or negative numbers. These are NOT the total.
    - Look for "Iznos", "Za platiti", "Ukupno", or "Total" to find the correct amount.
    - If you see "-120,17" or similar negative values, that is a credit balance, NOT the bill amount. Find the positive charge amount (e.g., 39.82).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity from camera
              data: base64Image,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
        temperature: 0.1, // Low temperature for factual extraction
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text) as AnalysisResult;

    // --- ROBUST VALIDATION & NORMALIZATION ---

    // 1. Validate Date (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];
    if (!data.date) {
      console.warn("⚠️ Date missing from AI response, defaulting to today.");
      data.date = todayStr;
    } else {
      // Attempt to normalize date
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(data.date)) {
        console.warn(`⚠️ Invalid date format received: "${data.date}". Attempting to fix...`);
        const parsedDate = new Date(data.date);
        if (!isNaN(parsedDate.getTime())) {
          data.date = parsedDate.toISOString().split('T')[0];
          console.log(`✅ Fixed date to: ${data.date}`);
        } else {
          console.error("❌ Could not parse date, defaulting to today.");
          data.date = todayStr;
        }
      }
    }

    // 2. Validate Total (Number)
    if (typeof data.total !== 'number' || isNaN(data.total)) {
      console.warn(`⚠️ Invalid total received: "${data.total}". Attempting to extract number...`);
      if (typeof data.total === 'string') {
        const extracted = parseFloat((data.total as string).replace(/[^0-9.]/g, ''));
        if (!isNaN(extracted)) {
          data.total = extracted;
          console.log(`✅ Fixed total to: ${data.total}`);
        } else {
          throw new Error("Could not read the total amount (invalid format).");
        }
      } else {
        throw new Error("Could not read the total amount (missing).");
      }
    }

    // 3. Validate Items (Array)
    if (!Array.isArray(data.items)) {
      console.warn("⚠️ Items is not an array, defaulting to empty array.");
      data.items = [];
    }

    // 4. Ensure Store Name
    if (!data.storeName || data.storeName.trim() === '') {
      console.warn("⚠️ Store name missing, defaulting to 'Unknown Store'.");
      data.storeName = 'Unknown Store';
    }

    return data;


  } catch (error) {
    console.error("Error analyzing receipt:", error);
    console.error("Error type:", typeof error);
    console.error("Error stringified:", JSON.stringify(error, null, 2));

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Log additional details
    console.error("API Key present:", !!apiKey);
    console.error("Image data length:", base64Image?.length || 0);

    throw error;
  }
};