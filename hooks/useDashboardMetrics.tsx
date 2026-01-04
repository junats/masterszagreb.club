import { useMemo } from 'react';
import { Category, Receipt } from '../types';
import { CATEGORY_COLORS } from '../constants/colors';
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Helper types
export interface DashboardMetrics {
    totalSpent: number;
    provisionTotal: number;
    provisionRatio: number;
    categoryData: { name: string; value: number; percentage: number }[];
    childCategoryData: { name: string; value: number; percentage: number }[];
    childTotalSpent: number;
    globalCategoryData: { name: string; value: number; percentage: number }[];
    globalTotal: number;
    luxuryTotal: number;
    categoryItems: Record<string, { name: string; price: number; date: string; store: string; category: string }[]>;
    topStores: { name: string; value: number; percentage: number }[];
    avgReceipt: number;
    maxSingleReceipt: number;
    recentLogs: Receipt[];
    maxLogValue: number;
    volumeCount: number;
    spendingInsight: string;
    trendDirection: 'up' | 'down' | 'flat' | 'neutral'; // specific to insight
    filteredCount: number;
    numericEvidenceScore: number;
    evidenceLabel: string;
    evidenceColor: string;
    weeklyActivity: any[];
    maxDayTotal: number;
    monthDiff: number;
    projectedTotal: number;
    thisMonthTotal: number;

    // From extra calcs
    aiMetrics: any[]; // The structured grid data
    todayTotal: number;
    yesterdayTotal: number;
    thisWeekTotal: number;
    dailyAverage: number;
    weeklyAverage: number;
    todayCategoryData: any[]; // For daily view
    thisWeekCategoryData: any[]; // For weekly view

    globalTodayCategoryData: any[];
    globalThisWeekCategoryData: any[];

    // NEW: Child Context
    todayChildCategoryData: any[];
    thisWeekChildCategoryData: any[];
    todayChildTotal: number;
    thisWeekChildTotal: number;

    globalTotalToday: number;
    weekData: any[]; // Last 7 days chart data
    yearData: any[]; // Last 12 months chart data
    monthData: any[]; // Last 30 days chart data
    lastMonthTotal: number;
    latestReceipt: Receipt | null;
    thisMonthReceipts: Receipt[];
    thisMonthCategoryData: { name: string; value: number; percentage: number }[]; // NEW: Explicit monthly data
    thisMonthChildTotal: number; // NEW
    thisMonthChildCategoryData: { name: string; value: number; percentage: number }[]; // NEW
    sourceReceipts: Receipt[];
    lastWeekTotal: number;
    smartInsights: { type: 'warning' | 'success' | 'info'; title: string; message: string; icon: React.ReactNode }[];
    equity: number;
    harmony: number;
    avgNutritionScore: number;
    avgValueScore: number;
    stability: number;
}

export const useDashboardMetrics = (
    receipts: Receipt[],
    monthlyBudget: number,
    daysInMonth: number,
    childSupportMode: boolean,
    dateFilter: 'this_month' | 'last_month' | 'all',
    ageRestricted: boolean
): DashboardMetrics => {
    const { t } = useLanguage();

    return useMemo(() => {
        // 0. Source Data
        const sourceReceipts = receipts || [];

        // 1. Filter Receipts based on Date Filter
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Unified Date Parser
        const parseDate = (dateStr: string) => {
            if (!dateStr) return new Date();
            // If YYYY-MM-DD (local date from input), parse manually to avoid UTC offset issues
            if (dateStr.length === 10 && dateStr.includes('-') && !dateStr.includes('T')) {
                const parts = dateStr.split('-');
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            return new Date(dateStr);
        };

        const checkDate = (r: Receipt) => {
            const d = parseDate(r.date);
            if (dateFilter === 'this_month') {
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            } else if (dateFilter === 'last_month') {
                const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
            }
            return true;
        };

        // Standard Filtered List (Respects Co-Parenting Mode) -> Powers main dashboard
        const filteredReceipts = sourceReceipts.filter(r => {
            if (!checkDate(r)) return false;
            // Filter if Child Mode is ON
            // User Feedback: Show ALL items in Co-Parenting mode. Do NOT hide non-child items.
            // if (childSupportMode && !r.items.some(i => i.isChildRelated || ...)) return false; 
            return true;
        });

        // Global Filtered List (Ignores Co-Parenting Mode, respects Date) -> Powers "Total" Pie Chart
        const globalFilteredReceipts = sourceReceipts.filter(checkDate);

        // Calculate Global Totals (for Left Pie Chart)
        const globalCategoryTotals: Record<string, number> = {};
        let globalTotal = 0;

        // NEW: Global Today/Week Totals for Pie Context
        const globalTodayCategoryTotals: Record<string, number> = {};
        const globalThisWeekCategoryTotals: Record<string, number> = {};
        let globalTotalToday = 0;

        // Date Checks helpers
        const isToday = (dStr: string) => {
            const d = new Date(dStr);
            return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        };

        // Check if date is in this week (Mon-Sun)
        const getWeekStart = (d: Date) => {
            const copy = new Date(d);
            const day = copy.getDay() || 7;
            if (day !== 1) copy.setHours(-24 * (day - 1));
            copy.setHours(0, 0, 0, 0);
            return copy;
        };
        const currentWeekStart = getWeekStart(new Date());

        const isThisWeek = (dStr: string) => {
            const d = new Date(dStr);
            return d >= currentWeekStart;
        }


        globalFilteredReceipts.forEach(r => {
            // Robust Date Parsing for buckets
            const d = parseDate(r.date);
            const isRToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); // Re-do check safely
            const isRThisWeek = d >= currentWeekStart;

            r.items.forEach(i => {
                // 18+ Check
                if (ageRestricted && i.isRestricted) return;

                const cat = i.category || Category.OTHER;
                // Simple normalization (copy/paste lite logic or use helper if available? Inline for safety)
                let normalizedCat = cat;
                if (typeof cat === 'string') {
                    const lower = cat.toLowerCase();
                    if (['groceries', 'food', 'dining'].includes(lower)) normalizedCat = Category.FOOD;
                    else if (['alcohol', 'beer', 'wine'].includes(lower)) normalizedCat = Category.ALCOHOL;
                    else if (['health', 'pharmacy'].includes(lower)) normalizedCat = Category.HEALTH;
                    else if (['household', 'cleaning'].includes(lower)) normalizedCat = Category.HOUSEHOLD;
                    else if (['education', 'child'].includes(lower)) normalizedCat = Category.EDUCATION;
                    else if (['transport', 'fuel'].includes(lower)) normalizedCat = Category.TRANSPORT;
                    else if (['luxury', 'tech'].includes(lower)) normalizedCat = Category.LUXURY;
                    else if (['necessity'].includes(lower)) normalizedCat = Category.NECESSITY;
                }

                // Add Sub-categorization Logic matches Dashboard.tsx
                if (normalizedCat === Category.FOOD) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/apple|banana|orange|grape|fruit|berry|melon|lemon|lime|pear|peach/)) normalizedCat = "Fruit";
                    else if (nameLower.match(/carrot|potato|onion|pepper|vegetable|salad|tomato|cucumber|lettuce/)) normalizedCat = "Vegetables";
                    else if (nameLower.match(/coke|pepsi|soda|fanta|sprite|drink|beverage|water/)) normalizedCat = "Soda";
                    else if (nameLower.match(/chicken|beef|pork|meat|steak/)) normalizedCat = "Meat";
                    else if (nameLower.match(/milk|cheese|yogurt|butter|cream/)) normalizedCat = "Dairy";
                    else if (nameLower.match(/bread|bakery|cake|pastry|pizza|burger/)) normalizedCat = "Bakery";
                    else if (nameLower.match(/chip|snack|chocolate|candy/)) normalizedCat = "Snacks";
                } else if (normalizedCat === Category.LUXURY) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/tech|phone|laptop|computer|headphone|earbud/)) normalizedCat = "Tech";
                    else if (nameLower.match(/clothes|shirt|jacket|jean|shoe/)) normalizedCat = "Clothing";
                    else if (nameLower.match(/game|steam|xbox|playstation|lego/)) normalizedCat = "Gaming";
                    else if (nameLower.match(/flight|hotel|airbnb|trip|travel/)) normalizedCat = "Travel";
                } else if (normalizedCat === Category.HOUSEHOLD) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/clean|soap|detergent|bleach/)) normalizedCat = "Cleaning";
                    else if (nameLower.match(/plant|flower|garden/)) normalizedCat = "Garden";
                    else if (nameLower.match(/decor|frame|candle/)) normalizedCat = "Decor";
                } else if (normalizedCat === Category.TRANSPORT) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/petrol|diesel|fuel|gas|circle k|applegreen/)) normalizedCat = "Fuel";
                    else if (nameLower.match(/bus|train|tram|luas|dart|leap|ticket/)) normalizedCat = "Public Transport";
                    else if (nameLower.match(/taxi|uber|bolt|freenow/)) normalizedCat = "Taxi";
                    else if (nameLower.match(/park|toll|wash|service|nct|tax|insurance/)) normalizedCat = "Car Expenses";
                } else if (normalizedCat === Category.HEALTH) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/pharmacy|boots|lloyds|drug|med|vitamin|prescription/)) normalizedCat = "Pharmacy";
                    else if (nameLower.match(/doctor|gp|clinic|hospital|dentist|consult/)) normalizedCat = "Doctor";
                    else if (nameLower.match(/gym|swim|sport|train|fit/)) normalizedCat = "Fitness";
                }
                else if (normalizedCat === Category.DINING) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/coffee|cafe|latte|cappuccino|tea|starbucks|costa/)) normalizedCat = "Cafe";
                    else if (nameLower.match(/mcdonald|burger|kfc|subway|pizza|fast|takeaway/)) normalizedCat = "Fast Food";
                    else normalizedCat = "Restaurant";
                }

                globalCategoryTotals[normalizedCat] = (globalCategoryTotals[normalizedCat] || 0) + i.price;
                globalTotal += i.price;

                if (isRToday) {
                    globalTodayCategoryTotals[normalizedCat] = (globalTodayCategoryTotals[normalizedCat] || 0) + i.price;
                    globalTotalToday += i.price;
                }
                if (isRThisWeek) {
                    globalThisWeekCategoryTotals[normalizedCat] = (globalThisWeekCategoryTotals[normalizedCat] || 0) + i.price;
                }
            });
        });

        let totalSpent = 0;
        let provisionTotal = 0; // Essentials only
        const categoryTotals: Record<string, number> = {};
        const childCategoryTotals: Record<string, number> = {}; // New: Child Only
        let childTotalSpent = 0;

        const categoryItems: Record<string, any[]> = {};
        let luxuryTotal = 0;

        // For Dynamic Insight
        const storeTotals: Record<string, number> = {};

        // For Daily/Weekly view specifics
        const todayCategoryTotals: Record<string, number> = {};
        const thisWeekCategoryTotals: Record<string, number> = {};
        let todayTotal = 0;

        // NEW: Child Daily/Weekly
        const todayChildCategoryTotals: Record<string, number> = {};
        const thisWeekChildCategoryTotals: Record<string, number> = {};
        let todayChildTotal = 0;
        let thisWeekChildTotal = 0;

        // Yesterday / Week 
        let yesterdayTotal = 0;
        let thisWeekTotal = 0;

        const dYesterday = new Date(now);
        dYesterday.setDate(dYesterday.getDate() - 1);
        const isYesterday = (d: Date) => d.getDate() === dYesterday.getDate() && d.getMonth() === dYesterday.getMonth() && d.getFullYear() === dYesterday.getFullYear();


        filteredReceipts.forEach(r => {
            // Robust Date
            let d = new Date(r.date);
            if (r.date.includes('-') && !r.date.includes('T')) {
                const parts = r.date.split('-');
                d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            const isRToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            const isRYesterday = isYesterday(d);
            const isRThisWeek = d >= currentWeekStart;


            // Store Totals
            storeTotals[r.storeName] = (storeTotals[r.storeName] || 0) + r.items.reduce((s, i) => (!ageRestricted || !i.isRestricted) ? s + i.price : s, 0);

            r.items.forEach(i => {
                if (ageRestricted && i.isRestricted) return;

                const cat = i.category || Category.OTHER; // Original category

                // Normalize Category for Aggregation
                let normalizedCat = cat;
                if (typeof cat === 'string') {
                    const lower = cat.toLowerCase();
                    if (['groceries', 'food', 'dining'].includes(lower)) normalizedCat = Category.FOOD;
                    else if (['alcohol', 'beer', 'wine', 'spirits'].includes(lower)) normalizedCat = Category.ALCOHOL;
                    else if (['health', 'pharmacy', 'medical'].includes(lower)) normalizedCat = Category.HEALTH;
                    else if (['household', 'cleaning', 'furniture'].includes(lower)) normalizedCat = Category.HOUSEHOLD;
                    else if (['education', 'school', 'tuition', 'child'].includes(lower)) normalizedCat = Category.EDUCATION;
                    else if (['transport', 'fuel', 'parking'].includes(lower)) normalizedCat = Category.TRANSPORT;
                    else if (['luxury', 'electronics', 'entertainment'].includes(lower)) normalizedCat = Category.LUXURY;
                    else if (['necessity'].includes(lower)) normalizedCat = Category.NECESSITY;
                    else normalizedCat = Category.OTHER;
                }

                // Reuse sub-cat block
                if (normalizedCat === Category.FOOD) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/apple|banana|orange|grape|fruit|berry|melon|lemon|lime|pear|peach/)) normalizedCat = "Fruit";
                    else if (nameLower.match(/carrot|potato|onion|pepper|vegetable|salad|tomato|cucumber|lettuce|spinach|garlic|ginger/)) normalizedCat = "Vegetables";
                    else if (nameLower.match(/coke|pepsi|soda|fanta|sprite|drink|beverage|water|juice|cola/)) normalizedCat = "Soda";
                    else if (nameLower.match(/organic|bio|eco/)) normalizedCat = "Organic";
                    else if (nameLower.match(/chicken|beef|pork|meat|steak|lamb|turkey|ham|bacon|sausage/)) normalizedCat = "Meat";
                    else if (nameLower.match(/milk|cheese|yogurt|butter|cream|dairy/)) normalizedCat = "Dairy";
                    else if (nameLower.match(/bread|bakery|cake|pastry|croissant|bagel|bun|roll|pizza|burger/)) normalizedCat = "Bakery"; // Added pizza/burger
                    else if (nameLower.match(/chip|snack|chocolate|candy|sweet|cookie|biscuit/)) normalizedCat = "Snacks";
                }
                else if (normalizedCat === Category.LUXURY) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/tech|phone|laptop|computer|headphone|earbud|watch|camera|electronic|apple|samsung|sony/)) normalizedCat = "Tech";
                    else if (nameLower.match(/clothes|shirt|jacket|jean|shoe|sneaker|dress|coat|fashion|zara|h&m|nike|adidas/)) normalizedCat = "Clothing";
                    else if (nameLower.match(/game|steam|xbox|playstation|nintendo|toy|lego/)) normalizedCat = "Gaming"; // Toys -> Gaming/Fun
                    else if (nameLower.match(/flight|hotel|airbnb|trip|travel/)) normalizedCat = "Travel";
                }
                else if (normalizedCat === Category.HOUSEHOLD) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/clean|soap|detergent|bleach|sponge|towel|paper|tissue/)) normalizedCat = "Cleaning";
                    else if (nameLower.match(/plant|flower|garden|seed|pot/)) normalizedCat = "Garden";
                    else if (nameLower.match(/decor|frame|candle|lamp|light|furniture|chair|table/)) normalizedCat = "Decor";
                }

                categoryTotals[normalizedCat] = (categoryTotals[normalizedCat] || 0) + i.price;
                totalSpent += i.price; // Accumulate total spent here

                // CHILD LOGIC
                // Include explicit child flag OR category match (Education/Child)
                const isChildAgg = i.isChildRelated ||
                    normalizedCat === Category.EDUCATION ||
                    (typeof i.category === 'string' && i.category.toLowerCase() === 'child');

                if (isChildAgg) {
                    childCategoryTotals[normalizedCat] = (childCategoryTotals[normalizedCat] || 0) + i.price;
                    childTotalSpent += i.price;

                    if (isRToday) {
                        todayChildCategoryTotals[normalizedCat] = (todayChildCategoryTotals[normalizedCat] || 0) + i.price;
                        todayChildTotal += i.price;
                    }
                    if (isRThisWeek) {
                        thisWeekChildCategoryTotals[normalizedCat] = (thisWeekChildCategoryTotals[normalizedCat] || 0) + i.price;
                        thisWeekChildTotal += i.price;
                    }
                }

                // Daily/Weekly Context
                if (isRToday) {
                    todayCategoryTotals[normalizedCat] = (todayCategoryTotals[normalizedCat] || 0) + i.price;
                    todayTotal += i.price;
                }
                if (isRYesterday) {
                    yesterdayTotal += i.price;
                }
                if (isRThisWeek) {
                    thisWeekCategoryTotals[normalizedCat] = (thisWeekCategoryTotals[normalizedCat] || 0) + i.price;
                    thisWeekTotal += i.price;
                }

                // Provision Calc
                // Fallback string checks
                const catLower = typeof cat === 'string' ? cat.toLowerCase() : '';
                const isEssentialEnum = [Category.FOOD, Category.HEALTH, Category.HOUSEHOLD, Category.EDUCATION].includes(cat as any);
                const isLuxuryEnum = [Category.LUXURY].includes(cat as any);

                const isEssentialString = ['groceries', 'health', 'household', 'education', 'child'].includes(catLower);
                const isLuxuryString = ['dining', 'entertainment', 'alcohol', 'electronics', 'luxury'].includes(catLower);

                const isEssential = isEssentialEnum || isEssentialString;
                const isLuxury = isLuxuryEnum || isLuxuryString;

                if (i.isChildRelated || (isEssential && !isLuxury)) {
                    provisionTotal += i.price;
                }
                if (isLuxury && !i.isChildRelated) {
                    luxuryTotal += i.price;
                }

                if (!categoryItems[normalizedCat]) categoryItems[normalizedCat] = [];
                categoryItems[normalizedCat].push({
                    name: i.name,
                    price: i.price,
                    date: r.date,
                    store: r.storeName,
                    category: normalizedCat // Include category for UI colors
                });
            });
        });

        const provisionRatio = totalSpent > 0 ? (provisionTotal / totalSpent) * 100 : 0;

        // Global Data (Unfiltered)
        const globalCategoryData = Object.entries(globalCategoryTotals)
            .map(([name, value]) => ({ name, value, percentage: globalTotal > 0 ? (value / globalTotal) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        const categoryData = Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value, percentage: totalSpent > 0 ? (value / totalSpent) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        const childCategoryData = Object.entries(childCategoryTotals)
            .map(([name, value]) => ({ name, value, percentage: childTotalSpent > 0 ? (value / childTotalSpent) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        const todayChildCategoryData = Object.entries(todayChildCategoryTotals)
            .map(([name, value]) => ({ name, value, percentage: todayChildTotal > 0 ? (value / todayChildTotal) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        const thisWeekChildCategoryData = Object.entries(thisWeekChildCategoryTotals)
            .map(([name, value]) => ({ name, value, percentage: thisWeekChildTotal > 0 ? (value / thisWeekChildTotal) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        // Context Data
        const todayCategoryData = Object.entries(todayCategoryTotals)
            .map(([name, value]) => ({ name, value, percentage: todayTotal > 0 ? (value / todayTotal) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        const thisWeekCategoryData = Object.entries(thisWeekCategoryTotals)
            .map(([name, value]) => ({ name, value, percentage: thisWeekTotal > 0 ? (value / thisWeekTotal) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        const globalTodayCategoryData = Object.entries(globalTodayCategoryTotals)
            .map(([name, value]) => ({ name, value, percentage: globalTotalToday > 0 ? (value / globalTotalToday) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        const globalThisWeekCategoryData = Object.entries(globalThisWeekCategoryTotals)
            .map(([name, value]) => ({ name, value, percentage: thisWeekTotal > 0 ? (value / thisWeekTotal) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        // Sort drilldown items
        Object.keys(categoryItems).forEach(key => {
            categoryItems[key].sort((a, b) => b.price - a.price);
        });

        const volumeCount = filteredReceipts.length;

        // Top Stores (Top 3)
        const topStores = Object.entries(storeTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, val]) => ({ name, value: val, percentage: totalSpent > 0 ? (val / totalSpent) * 100 : 0 }));

        // Avg Receipt
        const avgReceipt = filteredReceipts.length > 0 ? totalSpent / filteredReceipts.length : 0;

        // Max Receipt
        const maxSingleReceipt = filteredReceipts.length > 0
            ? Math.max(...filteredReceipts.map(r => (r.items || []).reduce((s, i) => s + i.price, 0)))
            : 0;

        // Recent Spending Trend (Last 5 logs)
        const recentLogs = [...filteredReceipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).reverse();
        const maxLogValue = Math.max(...recentLogs.map(r => (r.items || []).reduce((s, i) => s + i.price, 0)), 1);

        // Evidence Score Calculation (0-100)
        // 50% Volume (capped at 20 receipts), 50% Provision Ratio
        const volumeScore = Math.min(volumeCount, 20) / 20 * 50;
        const ratioScore = (provisionRatio / 100) * 50;
        const numericEvidenceScore = Math.round(volumeScore + ratioScore);

        let evidenceLabel = "Building";
        let evidenceColor = "text-slate-400";
        if (numericEvidenceScore > 80) { evidenceLabel = "Strong"; evidenceColor = "text-emerald-400"; }
        else if (numericEvidenceScore > 50) { evidenceLabel = "Good"; evidenceColor = "text-blue-400"; }
        else if (numericEvidenceScore > 30) { evidenceLabel = "Fair"; evidenceColor = "text-amber-400"; }

        // --- SPENDING PREDICTION / INSIGHT LOGIC ---
        let spendingInsight = t('insights.scanMore');
        let trendDirection: 'up' | 'down' | 'flat' | 'neutral' = 'neutral';

        if (filteredReceipts.length >= 3) {
            // Compare average of last 3 logs vs global average
            const recentSubset = recentLogs.slice(-3);
            const recentAvg = recentSubset.reduce((sum, r) => sum + (r.items || []).reduce((s, i) => s + i.price, 0), 0) / recentSubset.length;

            const diffPercent = avgReceipt > 0 ? ((recentAvg - avgReceipt) / avgReceipt) * 100 : 0;

            // Budget Logic (Priority)
            const budgetUsedPercent = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

            if (budgetUsedPercent > 100) {
                spendingInsight = t('insights.exceeded');
                trendDirection = 'up';
            } else if (budgetUsedPercent > 85) {
                spendingInsight = t('insights.approaching');
                trendDirection = 'up';
            } else if (diffPercent > 20) {
                spendingInsight = t('insights.higher');
                trendDirection = 'up';
            } else if (diffPercent < -20) {
                spendingInsight = t('insights.lower');
                trendDirection = 'down';
            } else {
                spendingInsight = t('insights.stable');
                trendDirection = 'flat';
            }
        }

        // 1. Daily Activity (Last 7 Days)
        const weeklyActivity = [];
        let maxDayTotal = 0;

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const offset = d.getTimezoneOffset();
            const localDate = new Date(d.getTime() - (offset * 60 * 1000));
            const dStr = localDate.toISOString().split('T')[0];

            // Initialize day entry with 0 for all categories
            const dayEntry: any = {
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                fullDate: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
                total: 0
            };
            Object.values(Category).forEach(cat => {
                dayEntry[cat] = 0;
            });
            if (dayEntry[Category.OTHER] === undefined) dayEntry[Category.OTHER] = 0;

            // Use filteredReceipts for Context-Aware Data
            filteredReceipts.forEach(r => {
                let rDateStr = r.date;
                const parsed = parseDate(r.date);
                if (!isNaN(parsed.getTime())) {
                    const offset = parsed.getTimezoneOffset();
                    // Adjust to local date string for comparison
                    const local = new Date(parsed.getTime() - (offset * 60 * 1000));
                    rDateStr = local.toISOString().split('T')[0];
                }

                if (rDateStr === dStr) {
                    r.items.forEach(item => {
                        let cat = item.category || Category.OTHER;
                        // Normalize
                        if (typeof cat === 'string') {
                            const lower = cat.toLowerCase();
                            if (['groceries', 'food', 'dining', 'alcohol'].includes(lower)) cat = Category.FOOD;
                            else if (['health', 'pharmacy', 'medical'].includes(lower)) cat = Category.HEALTH;
                            else if (['household', 'cleaning', 'furniture'].includes(lower)) cat = Category.HOUSEHOLD;
                            else if (['education', 'school', 'tuition', 'child'].includes(lower)) cat = Category.EDUCATION;
                            else if (['transport', 'fuel', 'parking'].includes(lower)) cat = Category.TRANSPORT;
                            else if (['luxury', 'electronics', 'entertainment'].includes(lower)) cat = Category.LUXURY;
                            else if (['necessity'].includes(lower)) cat = Category.NECESSITY;
                        }
                        if (dayEntry[cat] === undefined) cat = Category.OTHER;

                        dayEntry[cat] += item.price;
                        dayEntry.total += item.price;
                    });
                }
            });

            if (dayEntry.total > maxDayTotal) maxDayTotal = dayEntry.total;
            weeklyActivity.push(dayEntry);
        }

        // 2. Monthly Comparison
        const checkChildFilter = (r: Receipt) => {
            if (childSupportMode && !r.items.some(i => i.isChildRelated || i.category === Category.EDUCATION || i.category === 'Child')) {
                return false;
            }
            return true;
        };

        const thisMonthReceipts = (receipts || []).filter(r => {
            // if (!checkChildFilter(r)) return false;

            const rDate = parseDate(r.date);
            return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
        }).map(r => ({
            ...r,
            items: r.items.filter(i => !ageRestricted || !i.isRestricted)
        })).filter(r => r.items.length > 0);

        const lastMonthReceipts = (receipts || []).filter(r => {
            // if (!checkChildFilter(r)) return false;

            const rDate = parseDate(r.date);
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return rDate.getMonth() === lastMonth && rDate.getFullYear() === lastMonthYear;
        });

        const thisMonthTotal = thisMonthReceipts.reduce((acc, r) => {
            // Simplified logic: If restricted mode is ON, sum allowed items.
            // If OFF, use receipt total (or items sum if total missing).
            if (ageRestricted) {
                const allowedSum = r.items.reduce((s, i) => (!i.isRestricted ? s + i.price : s), 0);
                return acc + allowedSum;
            } else {
                return acc + (r.total > 0 ? r.total : r.items.reduce((s, i) => s + i.price, 0));
            }
        }, 0);

        const lastMonthTotal = lastMonthReceipts.reduce((acc, r) => {
            if (!ageRestricted) {
                return acc + (r.total > 0 ? r.total : r.items.reduce((s, i) => s + i.price, 0));
            }
            return acc + r.items.reduce((s, i) => !i.isRestricted ? s + i.price : s, 0);
        }, 0);

        const monthDiff = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

        // NEW: Explicit 'This Month' breakdown for Distribution Chart
        // This ensures the Pie Chart matches the Budget Card exactly when "Monthly" is selected.
        const thisMonthCategoryTotals: Record<string, number> = {};
        thisMonthReceipts.forEach(r => {
            r.items.forEach(i => {
                let cat = i.category || Category.OTHER;
                // Normalize (Inline for consistency, ideally moving to helper)
                if (typeof cat === 'string') {
                    const lower = cat.toLowerCase();
                    if (['groceries', 'food', 'dining', 'alcohol'].includes(lower)) cat = Category.FOOD;
                    else if (['health', 'pharmacy', 'medical'].includes(lower)) cat = Category.HEALTH;
                    else if (['household', 'cleaning', 'furniture'].includes(lower)) cat = Category.HOUSEHOLD;
                    else if (['education', 'school', 'tuition', 'child'].includes(lower)) cat = Category.EDUCATION;
                    else if (['transport', 'fuel', 'parking'].includes(lower)) cat = Category.TRANSPORT;
                    else if (['luxury', 'electronics', 'entertainment'].includes(lower)) cat = Category.LUXURY;
                    else if (['necessity'].includes(lower)) cat = Category.NECESSITY;
                }

                // 18+ Filter Check (Must match thisMonthTotal logic)
                if (ageRestricted && i.isRestricted) {
                    return; // Skip restricted items from the visual breakdown if mode is active
                }

                thisMonthCategoryTotals[cat] = (thisMonthCategoryTotals[cat] || 0) + i.price;
            });
        });

        const thisMonthCategoryData = Object.entries(thisMonthCategoryTotals)
            .map(([name, value]) => ({ name, value, percentage: thisMonthTotal > 0 ? (value / thisMonthTotal) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        // NEW: Explicit 'This Month' Child breakdown
        const thisMonthChildCategoryTotals: Record<string, number> = {};
        let thisMonthChildTotal = 0;
        thisMonthReceipts.forEach(r => {
            r.items.forEach(i => {
                const cat = i.category || Category.OTHER;
                let normalizedCat = cat;
                if (typeof cat === 'string') {
                    const lower = cat.toLowerCase();
                    if (['groceries', 'food', 'dining', 'alcohol'].includes(lower)) normalizedCat = Category.FOOD;
                    else if (['health', 'pharmacy', 'medical'].includes(lower)) normalizedCat = Category.HEALTH;
                    else if (['household', 'cleaning', 'furniture'].includes(lower)) normalizedCat = Category.HOUSEHOLD;
                    else if (['education', 'school', 'tuition', 'child'].includes(lower)) normalizedCat = Category.EDUCATION;
                    else if (['transport', 'fuel', 'parking'].includes(lower)) normalizedCat = Category.TRANSPORT;
                    else if (['luxury', 'electronics', 'entertainment'].includes(lower)) normalizedCat = Category.LUXURY;
                    else if (['necessity'].includes(lower)) normalizedCat = Category.NECESSITY;
                }

                // Child Flag OR Category Match
                const isChildAgg = i.isChildRelated ||
                    normalizedCat === Category.EDUCATION ||
                    (typeof i.category === 'string' && i.category.toLowerCase() === 'child');

                if (isChildAgg) {
                    if (ageRestricted && i.isRestricted) return;
                    thisMonthChildCategoryTotals[normalizedCat] = (thisMonthChildCategoryTotals[normalizedCat] || 0) + i.price;
                    thisMonthChildTotal += i.price;
                }
            });
        });

        const thisMonthChildCategoryData = Object.entries(thisMonthChildCategoryTotals)
            .map(([name, value]) => ({ name, value, percentage: thisMonthChildTotal > 0 ? (value / thisMonthChildTotal) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        console.log('DEBUG METRICS:', {
            thisMonthReceiptsLen: thisMonthReceipts.length,
            filteredReceiptsLen: filteredReceipts.length,
            thisMonthTotal,
            totalSpent,
            ageRestricted,
            childSupportMode
        });

        // 3. Projection
        const daysPassed = Math.max(now.getDate(), 1);
        const projectedTotal = (thisMonthTotal / daysPassed) * daysInMonth;

        // 4. Year Trend Data (Last 12 Months)
        const yearData = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = months[d.getMonth()] + ' ' + d.getFullYear().toString().substr(2);
            const monthEntry: any = { label: key, total: 0 };
            Object.values(Category).forEach(cat => {
                monthEntry[cat] = 0;
            });
            if (monthEntry[Category.OTHER] === undefined) monthEntry[Category.OTHER] = 0;
            yearData.push(monthEntry);
        }

        // 5. Month Data (Last 30 Days)
        const monthData = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const offset = d.getTimezoneOffset();
            const localDate = new Date(d.getTime() - (offset * 60 * 1000));
            const dayEntry: any = { label, date: localDate.toISOString().split('T')[0], total: 0 };
            Object.values(Category).forEach(cat => {
                dayEntry[cat] = 0;
            });
            if (dayEntry[Category.OTHER] === undefined) dayEntry[Category.OTHER] = 0;
            monthData.push(dayEntry);
        }

        const weekData = (weeklyActivity || []).map(d => ({ ...d, label: d.day }));

        // Fill Year and Month Data
        receipts.forEach(r => {
            let d = new Date(r.date);
            if (r.date.includes('-') && !r.date.includes('T')) {
                const parts = r.date.split('-');
                d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }

            const yearKey = months[d.getMonth()] + ' ' + d.getFullYear().toString().substr(2);
            const yearEntry = (yearData || []).find(m => m.label === yearKey);

            const offset = d.getTimezoneOffset();
            const localDate = new Date(d.getTime() - (offset * 60 * 1000));
            const rDateStr = localDate.toISOString().split('T')[0];
            const monthEntry = (monthData || []).find(m => m.date === rDateStr);

            r.items.forEach(item => {
                let cat = item.category || Category.OTHER;
                // Normalize
                if (typeof cat === 'string') {
                    const lower = cat.toLowerCase();
                    if (['groceries', 'food', 'dining'].includes(lower)) cat = Category.FOOD;
                    else if (['health', 'pharmacy', 'medical'].includes(lower)) cat = Category.HEALTH;
                    else if (['household', 'cleaning', 'furniture'].includes(lower)) cat = Category.HOUSEHOLD;
                    else if (['education', 'school', 'tuition', 'child'].includes(lower)) cat = Category.EDUCATION;
                    else if (['transport', 'fuel', 'parking'].includes(lower)) cat = Category.TRANSPORT;
                    else if (['luxury', 'electronics', 'entertainment'].includes(lower)) cat = Category.LUXURY;
                    else if (['necessity'].includes(lower)) cat = Category.NECESSITY;
                }

                if (yearEntry) {
                    if (yearEntry[cat] === undefined) cat = Category.OTHER;
                    yearEntry.total += item.price;
                    yearEntry[cat] += item.price;
                }
                if (monthEntry) {
                    let mCat = cat;
                    if (monthEntry[mCat] === undefined) mCat = Category.OTHER; // safety
                    monthEntry.total += item.price;
                    monthEntry[mCat] += item.price;
                }
            });
        });

        // --- Calculate Ratios for InsightsGauges ---
        // Helper
        const getRatio = (val: number, total: number) => total > 0 ? (val / total) * 100 : 0;

        // Daily Ratios
        const dailyRatios = {
            education: getRatio(todayCategoryTotals[Category.EDUCATION] || 0, todayTotal),
            food: getRatio(todayCategoryTotals[Category.FOOD] || 0, todayTotal),
            activities: getRatio(todayCategoryTotals[Category.LUXURY] || 0, todayTotal),
            health: getRatio(todayCategoryTotals[Category.HEALTH] || 0, todayTotal)
        };

        // Weekly Ratios
        const weeklyRatios = {
            education: getRatio(thisWeekCategoryTotals[Category.EDUCATION] || 0, thisWeekTotal),
            food: getRatio(thisWeekCategoryTotals[Category.FOOD] || 0, thisWeekTotal),
            activities: getRatio(thisWeekCategoryTotals[Category.LUXURY] || 0, thisWeekTotal),
            health: getRatio(thisWeekCategoryTotals[Category.HEALTH] || 0, thisWeekTotal)
        };

        // Monthly Ratios (using categoryTotals which is "this month" based on default filter logic, else use thisMonthTotal explicitly if needed)
        // Note: categoryTotals is based on 'filteredReceipts' which depends on 'dateFilter'. 
        // If dateFilter is 'all', categoryTotals is all time. 
        // But Insights usually want *current month* context if 'monthly' view is selected.
        // For safety, let's use the 'thisMonthTotal' we calculated earlier and filter thisMonthReceipts

        const thisMonthEducation = thisMonthReceipts.reduce((acc, r) => acc + (r.items || []).filter(i => (i.category === Category.EDUCATION || i.category?.toLowerCase().includes('education'))).reduce((s, i) => s + i.price, 0), 0);
        const thisMonthFood = thisMonthReceipts.reduce((acc, r) => acc + (r.items || []).filter(i => (i.category === Category.FOOD || i.category?.toLowerCase().includes('food') || i.category?.toLowerCase().includes('groceries'))).reduce((s, i) => s + i.price, 0), 0);
        const thisMonthLuxury = thisMonthReceipts.reduce((acc, r) => acc + (r.items || []).filter(i => (i.category === Category.LUXURY || i.category?.toLowerCase().includes('luxury') || i.category?.toLowerCase().includes('entertainment'))).reduce((s, i) => s + i.price, 0), 0);
        const thisMonthHealth = thisMonthReceipts.reduce((acc, r) => acc + (r.items || []).filter(i => (i.category === Category.HEALTH || i.category?.toLowerCase().includes('health'))).reduce((s, i) => s + i.price, 0), 0);

        // If hook is already filtered to 'this_month', then 'categoryTotals' matches. But let's be explicit for "Monthly" tab of Insights.
        // Actually, InsightsGauges toggles view.
        // Let's return explicit properties.

        const educationRatio = getRatio(thisMonthEducation, thisMonthTotal);
        const foodRatio = getRatio(thisMonthFood, thisMonthTotal);
        const luxuryRatio = getRatio(thisMonthLuxury, thisMonthTotal);
        const healthRatio = getRatio(thisMonthHealth, thisMonthTotal);

        // Generate AI Metrics (Using calculated totals)
        const dailyAvg = daysPassed > 0 ? (thisMonthTotal / daysPassed) : 0;
        const weeklyAvg = thisMonthTotal > 0 ? (thisMonthTotal / (daysPassed / 7)) : 0;
        const projected = projectedTotal;
        const weekendSpend = filteredReceipts
            .filter(r => {
                const d = new Date(r.date);
                const day = d.getDay();
                return day === 0 || day === 6; // Sun or Sat
            })
            .reduce((total, r) => total + r.items.reduce((s, i) => s + i.price, 0), 0);
        const weekendPercent = totalSpent > 0 ? (weekendSpend / totalSpent) * 100 : 0;

        // Freq
        const frequency = daysPassed > 0 ? (filteredReceipts.length / daysPassed).toFixed(1) : "0";

        // Top Cat
        const topCategory = categoryData.length > 0 ? categoryData[0].name : '-';
        const top3Cats = categoryData.slice(0, 3).map(c => ({
            label: c.name,
            value: c.percentage.toFixed(0) + "% ",
            subtext: "€" + c.value.toFixed(0) + " "
        }));

        const biggestReceipt = (filteredReceipts || []).sort((a, b) => {
            const getSafeTotal = (r: Receipt) => r.items.reduce((s, i) => (!ageRestricted || !i.isRestricted) ? s + i.price : s, 0);
            return getSafeTotal(b) - getSafeTotal(a);
        })[0];

        const biggestPurchase = biggestReceipt
            ? biggestReceipt.items.reduce((s, i) => (!ageRestricted || !i.isRestricted) ? s + i.price : s, 0)
            : 0;


        // Status Logic
        const diff = monthlyBudget > 0 ? monthlyBudget - projected : 0;
        const percentUsed = monthlyBudget > 0 ? (thisMonthTotal / monthlyBudget) * 100 : 0;
        const expectedPercent = (daysPassed / daysInMonth) * 100;
        const statusDiff = percentUsed - expectedPercent;

        let statusLabel = 'On Track';
        let statusValue = ((monthlyBudget || 0) - thisMonthTotal).toFixed(0);
        let statusTrend: 'up' | 'down' | 'neutral' = 'neutral';
        let statusDetail = 'Remaining';

        let statusIcon = null;

        const aiMetrics = []; // We construct this locally or return raw data? for simplicity let's return raw data structure as expected by Dashboard

        // ... Wait, the Dashboard.tsx constructs components FROM this array. I should return the raw values and let component build UI, OR return the configured array. 
        // Returning the configured array is cleaner for the View component.
        // But the icons (Lucide) need to be imported here.

        // Actually, importing icons here is fine. Better than passing 20 raw numbers.

        // ... I'll skip icon imports for now and just return the raw numbers, and let the View component map them to generic UI or specific UI.
        // Actually, for refactor, moving the logic is key. The logic creates 'aiMetrics' array.
        // I should return that array.

        return {
            totalSpent,
            provisionTotal,
            provisionRatio,
            categoryData,
            childCategoryData,
            childTotalSpent,
            globalCategoryData,
            globalTotal,
            luxuryTotal,
            categoryItems,
            topStores,
            avgReceipt,
            maxSingleReceipt,
            recentLogs,
            maxLogValue,
            volumeCount,
            spendingInsight,
            trendDirection,
            filteredCount: filteredReceipts.length,
            numericEvidenceScore,
            evidenceLabel,
            evidenceColor,
            weeklyActivity,
            maxDayTotal,
            monthDiff,
            projectedTotal,
            thisMonthTotal,
            thisMonthCategoryData, // NEW
            thisMonthChildTotal,
            thisMonthChildCategoryData,
            lastMonthTotal,

            // Extras

            aiMetrics: [], // Populated in Dashboard.tsx or here? Let's leave it to Dashboard.tsx for now to avoid Icon dependency hell in hook
            todayTotal,
            yesterdayTotal,
            todayChildCategoryData,
            thisWeekChildCategoryData,
            todayChildTotal,
            thisWeekChildTotal,
            thisWeekTotal,
            dailyAverage: dailyAvg,
            weeklyAverage: weeklyAvg,
            todayCategoryData,
            thisWeekCategoryData,
            globalTodayCategoryData,
            globalThisWeekCategoryData,
            globalTotalToday,
            weekData,
            yearData,
            monthData,
            latestReceipt: recentLogs.length > 0 ? recentLogs[0] : null,
            thisMonthReceipts,
            sourceReceipts,
            lastWeekTotal: (weeklyActivity[5]?.total || 0) + (weeklyActivity[4]?.total || 0), // Approx
            smartInsights: spendingInsight ? [{
                type: trendDirection === 'up' ? 'warning' : 'success',
                title: trendDirection === 'up' ? 'Spending Alert' : 'Good Progress',
                message: spendingInsight,
                icon: trendDirection === 'up' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />
            }] : [],
            equity: 50, // Placeholder
            stability: 85, // Placeholder
            harmony: 90, // Placeholder

            // Insight Ratios
            dailyRatios,
            weeklyRatios,
            educationRatio,
            foodRatio,
            luxuryRatio,
            healthRatio,

            // AI Product Metrics
            avgNutritionScore: filteredReceipts.reduce((acc, r) => acc + r.items.reduce((s, i) => i.insights ? s + i.insights.nutritionScore : s, 0), 0) /
                (filteredReceipts.reduce((acc, r) => acc + r.items.filter(i => i.insights).length, 0) || 1),
            avgValueScore: filteredReceipts.reduce((acc, r) => acc + r.items.reduce((s, i) => i.insights ? s + i.insights.valueRating : s, 0), 0) /
                (filteredReceipts.reduce((acc, r) => acc + r.items.filter(i => i.insights).length, 0) || 1)
        };

    }, [receipts, monthlyBudget, daysInMonth, childSupportMode, dateFilter, ageRestricted]);
};
