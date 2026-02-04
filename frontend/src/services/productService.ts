import { supabase } from '../lib/supabaseClient';

export interface ProductDetails {
    name: string;
    brand?: string;
    imageUrl?: string;
    category?: string;
    // nutritionGrade?: string; // a, b, c, d, e
    ingredientsText?: string;
}

export const fetchProductByBarcode = async (barcode: string): Promise<ProductDetails | null> => {
    try {
        console.log(`🔍 Product Lookup via API for barcode: ${barcode}`);

        const { data, error } = await supabase.functions.invoke('api', {
            body: {
                action: 'product-lookup',
                barcode
            }
        });

        if (error) {
            console.error('Edge Function Error:', error);
            throw error;
        }

        if (data && data.data) {
            console.log(`✅ Product found via ${data.source}: ${data.data.name}`);
            return data.data as ProductDetails;
        }

        return null;

    } catch (error) {
        console.error('Error fetching product by barcode:', error);
        return null;
    }
};
