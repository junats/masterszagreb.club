import { AnalysisResult } from "@common/types";
import { supabase } from "../lib/supabaseClient";

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
  console.log('🔍 analyzeReceiptImage called (Edge Function)');

  try {
    if (!supabase) {
      console.warn("Supabase client not initialized. Returning mock data or error.");
      throw new Error("Supabase is not configured. Please check VITE_SUPABASE_URL.");
    }

    const { data, error } = await supabase.functions.invoke('api', {
      body: {
        action: 'analyze-receipt',
        base64Image,
        categories
      },
      headers: {
        // Optional: Hint to backend if needed
      }
    });

    if (error) {
      console.error("Function error:", error);
      throw error;
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data;

  } catch (error) {
    console.error("Error analyzing receipt:", error);
    throw error;
  }
};


export const analyzeItemInsights = async (items: any[], barcodes?: string[]): Promise<any[]> => {
  console.log('🔍 analyzeItemInsights called (Edge Function)');

  try {
    const { data, error } = await supabase.functions.invoke('api', {
      body: {
        action: 'item-insights',
        items,
        barcodes
      }
    });

    if (error) throw error;
    return data || items.map(() => null);

  } catch (error) {
    console.error("Error analyzing item insights:", error);
    return items.map(() => null);
  }
};

export const lookupProductByBarcode = async (barcode: string): Promise<{ name: string; category: string; brand?: string } | null> => {
  console.log('🤖 lookupProductByBarcode called (Edge Function)', barcode);

  try {
    const { data, error } = await supabase.functions.invoke('api', {
      body: {
        action: 'product-lookup',
        barcode
      }
    });

    if (error) return null;

    if (data && data.data) {
      return {
        name: data.data.name,
        brand: data.data.brand,
        category: data.data.category
      };
    }

    return null;

  } catch (e) {
    return null;
  }
};