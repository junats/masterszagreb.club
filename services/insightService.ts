import { Receipt, Category, CustodyDay, Goal } from '../types';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Wallet, ShoppingBag, Calendar, Lightbulb, User, Clock, Target } from 'lucide-react';

export type InsightSeverity = 'success' | 'warning' | 'danger' | 'info';

export interface InsightMessage {
    id: string;
    text: string;
    subtext?: string;
    severity: InsightSeverity;
    icon: any;
    category?: string; // If related to a specific category
}

/**
 * Generates a comprehensive list of AI insights based on current financial and calendar data.
 * Updated for "Meticulous" analysis: Time patterns, Category Drift, and Goal Checks.
 */
export const generateInsights = (
    currentSpent: number,
    monthlyBudget: number,
    receipts: Receipt[],
    custodyDays: CustodyDay[] = [],
    previousMonthSpent: number = 0,
    goals: Goal[] = []
): InsightMessage[] => {
    const insights: InsightMessage[] = [];
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    // --- 1. Meticulous Time Analysis ---
    // Late Night Spending (11PM - 5AM)
    const lateNightReceipts = receipts.filter(r => {
        const h = new Date(r.date).getHours();
        return h >= 23 || h < 5;
    });
    const lateNightSpend = lateNightReceipts.reduce((sum, r) => sum + r.total, 0);

    if (lateNightSpend > 50) {
        insights.push({
            id: 'late-night-habit',
            text: `Critical: €${lateNightSpend.toFixed(0)} spent between 11PM and 5AM.`,
            subtext: "Impulse control is lowest at night. Avoid late browsing.",
            severity: 'danger',
            icon: Clock
        });
    }

    // Weekend vs Weekday Ratio
    const weekendReceipts = receipts.filter(r => {
        const d = new Date(r.date).getDay();
        return d === 0 || d === 6;
    });
    const weekdayReceipts = receipts.filter(r => {
        const d = new Date(r.date).getDay();
        return d !== 0 && d !== 6;
    });

    // Avg Spend
    const weekdayAvg = weekdayReceipts.length > 0
        ? weekdayReceipts.reduce((s, r) => s + r.total, 0) / (dayOfMonth > 0 ? (dayOfMonth * 5 / 7) : 1) // Rough approx
        : 0;
    const weekendAvg = weekendReceipts.length > 0
        ? weekendReceipts.reduce((s, r) => s + r.total, 0) / (dayOfMonth > 0 ? (dayOfMonth * 2 / 7) : 1)
        : 0;

    if (weekendAvg > weekdayAvg * 2.5 && weekendAvg > 50) {
        insights.push({
            id: 'weekend-splurge',
            text: "Weekend spending is 2.5x higher than weekdays.",
            subtext: "You are undoing your weekday discipline on Saturdays.",
            severity: 'warning',
            icon: Calendar
        });
    }

    // --- 2. Goal Adherence (Honesty) ---
    // Check for "Junk Food" or "Alcohol" if goals deny them
    goals.filter(g => g.isEnabled).forEach(g => {
        // Find receipts matching strict keywords for this goal
        const violations = receipts.filter(r =>
            (g.keywords || []).some(k => r.storeName.toLowerCase().includes(k) || r.items.some(i => i.name.toLowerCase().includes(k)))
            || (r.categoryId === Category.ALCOHOL && g.type === 'ALCOHOL')
            || (r.categoryId === Category.DINING && g.type === 'JUNK_FOOD' && r.storeName.toLowerCase().includes('mcd')) // hardcode heuristic for demo
        );

        if (violations.length > 0) {
            const violationTotal = violations.reduce((s, r) => s + r.total, 0);
            if (violationTotal > 20) {
                insights.push({
                    id: `goal-fail-${g.id}`,
                    text: `You have broken your '${g.name}' goal.`,
                    subtext: `Detected €${violationTotal.toFixed(0)} spent on restricted items this month.`,
                    severity: 'danger',
                    icon: Target
                });
            }
        }
    });

    // --- 3. Category Drift (vs Previous Month Proxy) ---
    // If no real history, we simulate 'drift' if category > 30% of budget
    const categoryTotals: Record<string, number> = {};
    receipts.forEach(r => {
        const cat = r.categoryId || Category.OTHER;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + r.total;
    });

    Object.entries(categoryTotals).forEach(([cat, amount]) => {
        if (monthlyBudget > 0 && (amount / monthlyBudget) > 0.35 && cat !== Category.NECESSITY) {
            insights.push({
                id: `cat-drift-${cat}`,
                text: `${cat} consumes ${Math.round((amount / monthlyBudget) * 100)}% of your TOTAL budget.`,
                subtext: "This is unsustainable. Cut back immediately.",
                severity: 'warning',
                icon: ShoppingBag
            });
        }
    });

    // --- 4. Budget Health (Standard) ---
    if (monthlyBudget > 0) {
        const ratio = currentSpent / monthlyBudget;

        if (ratio > 1) {
            insights.push({
                id: 'budget-critical',
                text: `BUDGET EXCEEDED BY €${(currentSpent - monthlyBudget).toFixed(0)}.`,
                subtext: "Stop spending. You have 0 disposable income left.",
                severity: 'danger',
                icon: AlertTriangle
            });
        } else if (ratio > 0.85 && daysRemaining > 10) {
            insights.push({
                id: 'budget-warning',
                text: `Burning cash too fast (${Math.round(ratio * 100)}% used).`,
                subtext: `You must average < €${((monthlyBudget - currentSpent) / daysRemaining).toFixed(0)}/day to survive the month.`,
                severity: 'warning',
                icon: Wallet
            });
        }
    }

    // --- 5. Custody Prep ---
    const upcomingCustody = custodyDays
        .filter(d => new Date(d.date) >= today && d.status === 'me')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 1);

    if (upcomingCustody.length > 0) {
        const nextDate = new Date(upcomingCustody[0].date);
        const dayDiff = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (dayDiff <= 2 && dayDiff >= 0) {
            insights.push({
                id: 'custody-next',
                text: dayDiff === 0 ? "Custody: Kids are here today." : `Custody: Kids arrive in ${dayDiff} days.`,
                subtext: "Ensure fridge is stocked and activities planned.",
                severity: 'info',
                icon: User
            });
        }
    }

    // If still empty (rare with meticulous checks), fallback
    if (insights.length === 0) {
        insights.push({
            id: 'generic-clean',
            text: "Financial health is optimal.",
            subtext: "No spending anomalies or goal violations detected.",
            severity: 'success',
            icon: CheckCircle2
        });
    }

    return insights;
};
