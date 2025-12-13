import { registerPlugin, Capacitor } from '@capacitor/core';
import { Receipt } from '../types';

// Define the custom plugin interface
export interface TrueTrackWidgetPlugin {
    echo123(options: { value: string }): Promise<{ value: string }>;
    ping(options: {}): Promise<{ value: string }>;
    setWidgetData(options: { key: string; value: string }): Promise<{ success: boolean; error?: string; filePath?: string }>;
}

const TrueTrackWidget = registerPlugin<TrueTrackWidgetPlugin>('TrueTrackWidgetPlugin');

// DEBUG: Log available plugins
console.log('--- AVAILABLE PLUGINS ---');
console.log(Object.keys(Capacitor.Plugins));
console.log('-------------------------');

const WIDGET_DATA_KEY = 'widgetData';

interface WidgetData {
    monthlySpend: number;
    monthlyBudget: number;
    dailySpend: number;
    lastUpdated: number;
}

export const WidgetService = {
    async ping() {
        return await TrueTrackWidget.ping({});
    },

    async echo123(options: { value: string }) {
        return await TrueTrackWidget.echo123(options);
    },

    async echo(value: string) {
        return TrueTrackWidget.echo123({ value });
    },

    async updateWidgetData(receipts: Receipt[], monthlyBudget: number) {
        console.log('Available Plugins:', Object.keys(Capacitor.Plugins));
        try {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const todayStr = now.toISOString().split('T')[0];

            // Calculate Monthly Spend
            const monthlySpend = receipts.reduce((total, r) => {
                let rDate = new Date(r.date);
                // Robust parsing for YYYY-MM-DD to avoid UTC shift
                if (r.date.includes('-') && !r.date.includes('T')) {
                    const parts = r.date.split('-');
                    rDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                }

                if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
                    return total + r.total;
                }
                return total;
            }, 0);

            // Calculate Daily Spend
            // Use local date string for comparison
            const localToday = new Date();
            const localTodayStr = localToday.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

            const dailySpend = receipts.reduce((total, r) => {
                let rDateStr = r.date;
                if (r.date.includes('T')) {
                    // Convert ISO to local YYYY-MM-DD
                    const d = new Date(r.date);
                    rDateStr = d.toLocaleDateString('en-CA');
                }

                if (rDateStr === localTodayStr) {
                    return total + r.total;
                }
                return total;
            }, 0);

            const data: WidgetData = {
                monthlySpend,
                monthlyBudget,
                dailySpend,
                lastUpdated: Date.now()
            };

            // Use the native helper to write directly to the shared group container
            const result = await TrueTrackWidget.setWidgetData({
                key: WIDGET_DATA_KEY,
                value: JSON.stringify(data)
            });

            if (!result.success) {
                throw new Error(result.error || 'Native write failed');
            }

            console.log('Widget data updated via native helper:', data);
            return result;

        } catch (error) {
            console.error('Failed to update widget data:', error);
            throw error;
        }
    }
};
