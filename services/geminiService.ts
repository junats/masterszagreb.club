import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Category } from "../types";

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
        },
        required: ["name", "price", "category"],
      },
    },
  },
  required: ["storeName", "total", "items", "type"],
};

export const analyzeReceiptImage = async (base64Image: string): Promise<AnalysisResult> => {
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

  if (!apiKey) {
    throw new Error("API Key is missing or environment configuration is invalid.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Unified Smart Prompt
  const promptText = `
    Analyze this image, which could be a retail shopping receipt OR a service bill/invoice (e.g., Kindergarten, School, Utility).
    
    1. Extract the Store or Provider Name, Date, and Total Amount. Prices are in Euro (€).
    2. Classify the document type: 'bill' if it is an invoice or has a payment reference code; 'receipt' if it is retail shopping.
    3. If it is a bill, extract the 'Reference Code', 'Invoice Number', or 'Payment ID' if visible.
    4. Extract all line items. 
    5. Categorize each item strictly into: Necessity, Food, Luxury, Household, Health, Transport, Education, or Other.
       - Note: Kindergarten/Tuition/Childcare fees should be 'Education'.
    6. IMPORTANT: Identify any items related to alcohol, tobacco, nicotine, gambling, or adult-only products and set their 'isRestricted' field to true.
    7. Ensure numeric values handle commas as decimals if standard in the receipt region.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
    
    // Ensure date defaults to today if missing or invalid
    if (!data.date) {
        data.date = new Date().toISOString().split('T')[0];
    }
    
    return data;

  } catch (error) {
    console.error("Error analyzing receipt:", error);
    throw error;
  }
};