import { Receipt } from '../types';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const exportService = {
    generateCSV: (receipts: Receipt[]): string => {
        // Define headers
        const headers = ['Date', 'Store', 'Total', 'Category', 'Items', 'Type', 'Reference'];

        // Create CSV content
        const rows = receipts.map(r => {
            const itemsSummary = r.items.map(i => `${i.quantity || 1}x ${i.name} (€${i.price})`).join('; ');
            const category = r.categoryId || (r.items.length > 0 ? r.items[0].category : 'Uncategorized');

            // Escape fields that might contain commas
            const escape = (field: string | number | undefined) => {
                if (field === undefined || field === null) return '';
                const stringField = String(field);
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            };

            return [
                escape(r.date),
                escape(r.storeName),
                escape(r.total.toFixed(2)),
                escape(category),
                escape(itemsSummary),
                escape(r.type),
                escape(r.referenceCode)
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    },

    downloadCSV: async (csvContent: string, filename: string): Promise<void> => {
        if (Capacitor.isNativePlatform()) {
            try {
                // Save to filesystem
                const path = `${filename}`;
                await Filesystem.writeFile({
                    path,
                    data: csvContent,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8
                });

                // Get the file URI
                const uriResult = await Filesystem.getUri({
                    directory: Directory.Documents,
                    path
                });

                // Share the file
                await Share.share({
                    title: 'Export Receipt Data',
                    text: 'Here is your receipt data export.',
                    url: uriResult.uri,
                    dialogTitle: 'Export Data'
                });
            } catch (e) {
                console.error('Export failed on native:', e);
                alert('Failed to export data. Please try again.');
            }
        } else {
            // Web download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};
