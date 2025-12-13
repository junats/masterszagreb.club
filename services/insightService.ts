
import { Receipt, Category, CustodyDay } from '../types';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Wallet, ShoppingBag, Calendar, Lightbulb, User } from 'lucide-react';

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
 */
export const generateInsights = (
    currentSpent: number,
    monthlyBudget: number,
    receipts: Receipt[],
    custodyDays: CustodyDay[] = [],
    previousMonthSpent: number = 0
): InsightMessage[] => {
    const insights: InsightMessage[] = [];
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    // --- 1. Budget Health Analysis ---
    if (monthlyBudget > 0) {
        const ratio = currentSpent / monthlyBudget;
        const idealRatio = dayOfMonth / daysInMonth; // Linear burn rate

        if (ratio > 1) {
            insights.push({
                id: 'budget-critical',
                text: `You've exceeded your budget by €${(currentSpent - monthlyBudget).toFixed(0)}.`,
                subtext: "Consider pausing non-essential spending for the rest of the month.",
                severity: 'danger',
                icon: AlertTriangle
            });
        } else if (ratio > 0.9 && daysRemaining > 5) {
            insights.push({
                id: 'budget-warning',
                text: `You're at ${Math.round(ratio * 100)}% of budget with ${daysRemaining} days left.`,
                subtext: `Daily safe spend is now €${((monthlyBudget - currentSpent) / daysRemaining).toFixed(0)}.`,
                severity: 'warning',
                icon: Wallet
            });
        } else if (ratio < idealRatio - 0.1) {
            insights.push({
                id: 'budget-success',
                text: "Great job! You're significantly under budget.",
                subtext: `You have €${(monthlyBudget - currentSpent).toFixed(0)} remaining.`,
                severity: 'success',
                icon: CheckCircle2
            });
        }
    }

    // --- 2. Category Spike Analysis ---
    const categoryTotals: Record<string, number> = {};
    receipts.forEach(r => {
        r.items.forEach(i => {
            const cat = i.category || Category.OTHER;
            categoryTotals[cat] = (categoryTotals[cat] || 0) + i.price;
        });
    });

    // Check for dominant categories (> 40% of spend)
    Object.entries(categoryTotals).forEach(([cat, amount]) => {
        if (currentSpent > 0 && (amount / currentSpent) > 0.4) {
            insights.push({
                id: `cat-spike-${cat}`,
                text: `${cat} Accounts for ${Math.round((amount / currentSpent) * 100)}% of your spending.`,
                subtext: "This is unusually high compared to other categories.",
                severity: 'info',
                icon: ShoppingBag,
                category: cat
            });
        }
    });

    // --- 3. Spending Velocity (Projected vs Actual) ---
    if (dayOfMonth > 5) {
        const dailyAvg = currentSpent / dayOfMonth;
        const projected = dailyAvg * daysInMonth;

        if (previousMonthSpent > 0) {
            if (projected > previousMonthSpent * 1.2) {
                insights.push({
                    id: 'velocity-warning',
                    text: `Pacing to spend ${Math.round(((projected - previousMonthSpent) / previousMonthSpent) * 100)}% more than last month.`,
                    subtext: "Check for recurring subscriptions or large one-time purchases.",
                    severity: 'warning',
                    icon: TrendingUp
                });
            } else if (projected < previousMonthSpent * 0.8) {
                insights.push({
                    id: 'velocity-success',
                    text: `On track to save €${(previousMonthSpent - projected).toFixed(0)} vs last month!`,
                    severity: 'success',
                    icon: TrendingDown
                });
            }
        }
    }

    // --- 4. Co-Parenting / Custody Context ---
    // Find next custody days
    const upcomingCustody = custodyDays
        .filter(d => new Date(d.date) >= today && d.status === 'me') // 'me' is defined in CustodyStatus
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3); // Check next 3 occurrences

    if (upcomingCustody.length > 0) {
        const nextDate = new Date(upcomingCustody[0].date);
        const dayDiff = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

        if (dayDiff <= 2 && dayDiff >= 0) {
            insights.push({
                id: 'custody-prep',
                text: dayDiff === 0 ? "Kids are with you today!" : `Kids arriving in ${dayDiff} day${dayDiff === 1 ? '' : 's'}.`,
                subtext: "Have you stocked up on groceries?",
                severity: 'info',
                icon: User
            });
        }
    }

    // If no specific insights generated, provide a generic positive one
    if (insights.length === 0) {
        insights.push({
            id: 'generic-tip',
            text: "No major alerts. Keep tracking your expenses!",
            severity: 'info',
            icon: Lightbulb
        });
    }

    return insights;
};
