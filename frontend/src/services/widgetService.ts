import { Preferences } from '@capacitor/preferences';
import { Receipt } from '@common/types';

const WIDGET_DATA_KEY = 'widgetData';

interface CategorySpend {
    category: string;
    amount: number;
    color: string;
}

interface WidgetData {
    // Spending
    monthlySpend: number;
    monthlyBudget: number;
    dailySpend: number;
    weeklySpend: number;
    budgetPercentage: number;

    // Additional metrics
    remainingBudget: number;
    daysLeftInMonth: number;
    averageDailySpend: number;

    // Category breakdown
    topCategories: CategorySpend[];

    // Co-parenting
    daysWithYou: number;
    daysWithCoparent: number;
    nextTransition: string;

    // Premium / Insights
    latestInsight?: string;
    proStatus?: boolean;

    lastUpdated: number;
}

// Category colors matching app
const CATEGORY_COLORS: Record<string, string> = {
    'Food': '#ef4444',
    'Activities': '#f59e0b',
    'Education': '#3b82f6',
    'Health': '#10b981',
    'Clothing': '#8b5cf6',
    'Transport': '#ec4899',
    'Other': '#6b7280'
};

export const WidgetService = {
    async updateWidgetData(receipts: Receipt[], monthlyBudget: number, custodyDays: any[] = [], isProMode: boolean = false) {
        console.log('🔵 WidgetService: updateWidgetData called');
        console.log('📊 WidgetService: Receipts count:', receipts.length);
        console.log('✨ Pro Mode:', isProMode);

        try {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // Find Latest Insight (Premium)
            let latestInsight: string | undefined = undefined;
            if (isProMode) {
                const recentReceiptWithInsight = receipts
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .find(r => r.items.some(i => i.insights && i.insights.insight));

                if (recentReceiptWithInsight) {
                    const item = recentReceiptWithInsight.items.find(i => i.insights?.insight);
                    if (item && item.insights) {
                        latestInsight = `${item.name}: ${item.insights.insight}`;
                    }
                }
            }

            // Calculate Monthly Spend
            const monthlySpend = receipts.reduce((total, r) => {
                let rDate = new Date(r.date);
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
            const localToday = new Date();
            const localTodayStr = localToday.toLocaleDateString('en-CA');

            const dailySpend = receipts.reduce((total, r) => {
                let rDateStr = r.date;
                if (r.date.includes('T')) {
                    const d = new Date(r.date);
                    rDateStr = d.toLocaleDateString('en-CA');
                }

                if (rDateStr === localTodayStr) {
                    return total + r.total;
                }
                return total;
            }, 0);

            // Calculate Weekly Spend
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const weeklySpend = receipts.reduce((total, r) => {
                let rDate = new Date(r.date);
                if (r.date.includes('-') && !r.date.includes('T')) {
                    const parts = r.date.split('-');
                    rDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                }

                if (rDate >= sevenDaysAgo) {
                    return total + r.total;
                }
                return total;
            }, 0);

            // Calculate budget percentage
            const budgetPercentage = monthlyBudget > 0 ? (monthlySpend / monthlyBudget) * 100 : 0;
            const remainingBudget = monthlyBudget - monthlySpend;

            // Days left
            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const currentDay = now.getDate();
            const daysLeftInMonth = lastDayOfMonth - currentDay;
            const averageDailySpend = currentDay > 0 ? monthlySpend / currentDay : 0;

            // Calculate Category Breakdown CORRECTLY
            const categoryTotals: Record<string, number> = {};

            receipts.forEach(r => {
                let rDate = new Date(r.date);
                if (r.date.includes('-') && !r.date.includes('T')) {
                    const parts = r.date.split('-');
                    rDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                }

                if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
                    if (r.items && r.items.length > 0) {
                        r.items.forEach(item => {
                            const cat = item.category || 'Other';
                            // Accumulate amounts properly
                            categoryTotals[cat] = (categoryTotals[cat] || 0) + item.price;
                        });
                    } else {
                        // Fallback
                        const category = r.categoryId || 'Other';
                        categoryTotals[category] = (categoryTotals[category] || 0) + r.total;
                    }
                }
            });

            console.log("📊 Debug Category Totals:", categoryTotals);

            // Get top 5 categories
            const topCategories: CategorySpend[] = Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([category, amount]) => ({
                    category,
                    amount,
                    color: CATEGORY_COLORS[category] || CATEGORY_COLORS['Other']
                }));

            // Calculate Custody Days
            const daysWithYou = custodyDays.filter(day => {
                const dayDate = new Date(day.date);
                return dayDate.getMonth() === currentMonth &&
                    dayDate.getFullYear() === currentYear &&
                    day.status === 'me';
            }).length;

            const daysWithCoparent = custodyDays.filter(day => {
                const dayDate = new Date(day.date);
                return dayDate.getMonth() === currentMonth &&
                    dayDate.getFullYear() === currentYear &&
                    day.status === 'partner';
            }).length;

            // Find next transition
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const futureDays = custodyDays
                .filter(day => new Date(day.date) > today)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            let nextTransition = 'No changes';
            if (futureDays.length > 0) {
                const nextDay = futureDays[0];
                const nextDate = new Date(nextDay.date);
                const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                    nextTransition = 'Today';
                } else if (diffDays === 1) {
                    nextTransition = 'Tomorrow';
                } else if (diffDays <= 7) {
                    nextTransition = `In ${diffDays}d`;
                } else {
                    nextTransition = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
            }

            const data: WidgetData = {
                monthlySpend,
                monthlyBudget,
                dailySpend,
                weeklySpend,
                budgetPercentage,
                remainingBudget,
                daysLeftInMonth,
                averageDailySpend,
                topCategories,
                daysWithYou,
                daysWithCoparent,
                nextTransition,
                latestInsight,
                proStatus: isProMode,
                lastUpdated: Date.now()
            };

            console.log('📝 WidgetService: Final data:', data);

            const jsonString = JSON.stringify(data);

            await Preferences.set({
                key: WIDGET_DATA_KEY,
                value: jsonString
            });

            console.log('✅ WidgetService: Widget data saved!');
            return { success: true };

        } catch (error) {
            console.error('❌ WidgetService: Failed to update widget data:', error);
            throw error;
        }
    }
};
