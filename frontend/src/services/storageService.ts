
import { supabase } from '../lib/supabaseClient';

export const storageService = {
    /**
     * Uploads a receipt image.
     * If Supabase is connected, uploads to 'receipts' bucket.
     * If Mock mode, returns the base64 string.
     */
    async uploadReceiptImage(file: Blob, userId: string): Promise<string> {
        if (supabase) {
            // Production: Upload to Supabase Storage
            // Folder structure: userID/timestamp_random.jpg
            const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

            const { error, data } = await supabase.storage
                .from('receipts')
                .upload(fileName, file, {
                    contentType: 'image/jpeg',
                    upsert: false
                });

            if (error) {
                console.error("Upload failed:", error);
                throw error;
            }

            return data.path;
        } else {
            // Mock Mode: Convert Blob back to Base64 to simulate a "path" that works locally
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result); // In mock mode, the "path" is just the base64 data
                    } else {
                        reject(new Error("Failed to convert blob to base64"));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
    },

    /**
     * General purpose receipt upload (PDF, PNG, JPG).
     */
    async uploadReceipt(file: File | Blob, userId: string): Promise<string> {
        if (supabase) {
            let ext = 'bin';
            let contentType = 'application/octet-stream';

            if (file instanceof File) {
                const parts = file.name.split('.');
                if (parts.length > 1) ext = parts.pop()?.toLowerCase() || 'bin';
                contentType = file.type || contentType;
            } else {
                if (file.type === 'application/pdf') ext = 'pdf';
                else if (file.type === 'image/png') ext = 'png';
                else if (file.type === 'image/jpeg') ext = 'jpg';
            }

            const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

            const { error, data } = await supabase.storage
                .from('receipts')
                .upload(fileName, file, {
                    contentType: contentType,
                    upsert: false
                });

            if (error) {
                console.error("Upload failed:", error);
                throw error;
            }

            return data.path;
        } else {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        reject(new Error("Failed to convert blob to base64"));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
    },

    /**
     * Gets the public URL for a receipt image.
     * Handles both Cloud paths and legacy Base64 strings.
     */
    getPublicUrl(path: string | undefined): string {
        if (!path) return '';

        // Handle Mock/Legacy Data
        if (path.startsWith('data:') || path.startsWith('http')) {
            return path;
        }

        // Handle Supabase Storage Path
        if (supabase) {
            const { data } = supabase.storage.from('receipts').getPublicUrl(path);
            return data.publicUrl;
        }

        return '';
    }
};
