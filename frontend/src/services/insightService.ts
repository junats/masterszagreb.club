import { Receipt, Category, CustodyDay, Goal, GoalType } from '@common/types';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Wallet, ShoppingBag, Calendar, Lightbulb, User, Clock, Target } from 'lucide-react';

export type InsightSeverity = 'success' | 'warning' | 'danger' | 'info';

export interface InsightMessage {
    id: string;
    text: string;
    subtext?: string;
    severity: InsightSeverity;
    icon: any;
    category?: string;
    action?: 'budget' | 'calendar' | 'history' | 'goals';
    actionLabel?: string;
}

// Translation function type
type TranslateFunction = (key: string, params?: Record<string, string | number>) => string;

/**
 * Generates translated AI insights based on financial data
 */
export const generateInsights = (
    currentSpent: number,
    monthlyBudget: number,
    receipts: Receipt[],
    custodyDays: CustodyDay[] = [],
    previousMonthSpent: number = 0,
    goals: Goal[] = [],
    t: TranslateFunction
): InsightMessage[] => {
    const insights: InsightMessage[] = [];
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    // --- 1. Meticulous Item-Level Analysis ---

    // Filter for recent receipts (This Month)
    const thisMonthReceipts = receipts.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });

    // let lowNutriCount = 0;
    // let lowNutriExamples: string[] = [];
    let lowValueSpend = 0;
    let lowValueExamples: string[] = [];
    let childFriendlyCount = 0;

    // Track specific frequency (e.g. "Coffee" x 5)
    const frequencyMap: Record<string, { count: number, spend: number }> = {};

    thisMonthReceipts.forEach(r => {
        r.items.forEach(item => {
            // Frequency Analysis (Simple normalization)
            const lowerName = item.name.toLowerCase();
            let key = "";
            if (lowerName.includes('coffee') || lowerName.includes('latte') || lowerName.includes('cappuccino')) key = "Coffee";
            else if (lowerName.includes('burger') || lowerName.includes('mcdonald')) key = "Fast Food";
            else if (lowerName.includes('energy') && lowerName.includes('drink')) key = "Energy Drinks";

            if (key) {
                if (!frequencyMap[key]) frequencyMap[key] = { count: 0, spend: 0 };
                frequencyMap[key].count++;
                frequencyMap[key].spend += item.price;
            }

            // AI Insights Analysis
            if (item.insights) {
                // Nutrition Check (Rule: < 30 score is "Junk")
                /* if (item.insights.nutritionScore < 30) {
                    lowNutriCount++;
                    if (lowNutriExamples.length < 3) lowNutriExamples.push(item.name);
                } */

                // Value Check (Rule: < 3 stars is "Poor Value")
                if (item.insights.valueRating < 3) {
                    lowValueSpend += item.price;
                    if (lowValueExamples.length < 3) lowValueExamples.push(item.name);
                }

                // Child Friendly
                if (item.insights.childFriendly > 4) {
                    childFriendlyCount++;
                }
            }
        });
    });

    // --- 2. Generate Specific Insights ---

    // Bad Habits (Nutrition)
    /* if (lowNutriCount >= 3) {
        insights.push({
            id: 'nutrition-alert',
            text: `High Junk Food Intake`,
            subtext: `You bought ${lowNutriCount} items with low nutritional value this month (e.g. ${lowNutriExamples[0]}).`,
            severity: 'danger',
            icon: AlertTriangle,
            action: 'history',
            actionLabel: 'Review Items'
        });
    } */

    // Money Wasted (Low Value)
    if (lowValueSpend > 20) {
        insights.push({
            id: 'value-alert',
            text: `Low Value Spending`,
            subtext: `You spent €${lowValueSpend.toFixed(0)} on items rated as poor value (e.g. ${lowValueExamples[0]}).`,
            severity: 'warning',
            icon: Wallet,
            action: 'history',
            actionLabel: 'Review Items'
        });
    }

    // High Frequency Loop
    Object.entries(frequencyMap).forEach(([key, data]) => {
        if (data.count >= 4) {
            insights.push({
                id: `freq-${key}`,
                text: `Frequent ${key} Purchases`,
                subtext: `You've bought ${key} ${data.count} times this month, costing €${data.spend.toFixed(0)}.`,
                severity: 'info',
                icon: Clock
            });
        }
    });

    // Positive Reinforcement (Child Friendly)
    if (childFriendlyCount >= 5) {
        insights.push({
            id: 'child-hero',
            text: `Child-First Shopping`,
            subtext: `You've made ${childFriendlyCount} purchases identified as highly child-friendly. Great parenting!`,
            severity: 'success',
            icon: User
        });
    }

    // --- 3. Existing Broad Pattern Logic (Retained & Refined) ---

    // Late Night Spending
    const lateNightReceipts = thisMonthReceipts.filter(r => {
        const h = new Date(r.date).getHours();
        return h >= 23 || h < 5;
    });
    const lateNightSpend = lateNightReceipts.reduce((sum, r) => sum + r.total, 0);

    if (lateNightSpend > 50) {
        insights.push({
            id: 'late-night-habit',
            text: t('insights.lateNightTitle', { amount: lateNightSpend.toFixed(0) }),
            subtext: t('insights.lateNightSubtext'),
            severity: 'danger',
            icon: Clock
        });
    }

    // Weekend vs Weekday
    const weekendReceipts = thisMonthReceipts.filter(r => {
        const d = new Date(r.date).getDay();
        return d === 0 || d === 6;
    });
    const weekdayReceipts = thisMonthReceipts.filter(r => {
        const d = new Date(r.date).getDay();
        return d !== 0 && d !== 6;
    });

    const weekdayAvg = weekdayReceipts.length > 0
        ? weekdayReceipts.reduce((s, r) => s + r.total, 0) / (dayOfMonth > 0 ? (dayOfMonth * 5 / 7) : 1)
        : 0;
    const weekendAvg = weekendReceipts.length > 0
        ? weekendReceipts.reduce((s, r) => s + r.total, 0) / (dayOfMonth > 0 ? (dayOfMonth * 2 / 7) : 1)
        : 0;

    if (weekendAvg > weekdayAvg * 2.5 && weekendAvg > 50) {
        insights.push({
            id: 'weekend-splurge',
            text: t('insights.weekendSplurgeTitle'),
            subtext: t('insights.weekendSplurgeSubtext'),
            severity: 'warning',
            icon: Calendar,
            action: 'history',
            actionLabel: 'Analyze'
        });
    }

    // Goal Adherence
    goals.filter(g => g.isEnabled).forEach(g => {
        const violations = thisMonthReceipts.filter(r =>
            (g.keywords || []).some(k => r.storeName.toLowerCase().includes(k) || r.items.some(i => i.name.toLowerCase().includes(k)))
            || (r.categoryId === Category.ALCOHOL && g.type === GoalType.ALCOHOL)
            || (r.categoryId === Category.DINING && g.type === GoalType.JUNK_FOOD && r.storeName.toLowerCase().includes('mcd'))
        );

        if (violations.length > 0) {
            const violationTotal = violations.reduce((s, r) => s + r.total, 0);
            if (violationTotal > 20) {
                insights.push({
                    id: `goal-fail-${g.id}`,
                    text: t('insights.goalFailTitle', { goalName: g.name }),
                    subtext: t('insights.goalFailSubtext', { amount: violationTotal.toFixed(0) }),
                    severity: 'danger',
                    icon: Target
                });
            }
        }
    });

    // Category Drift
    const categoryTotals: Record<string, number> = {};
    thisMonthReceipts.forEach(r => {
        const cat = r.categoryId || Category.OTHER;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + r.total;
    });

    Object.entries(categoryTotals).forEach(([cat, amount]) => {
        if (monthlyBudget > 0 && (amount / monthlyBudget) > 0.35 && cat !== Category.NECESSITY) {
            insights.push({
                id: `cat-drift-${cat}`,
                text: t('insights.categoryDriftTitle', {
                    category: cat,
                    percent: Math.round((amount / monthlyBudget) * 100)
                }),
                subtext: t('insights.categoryDriftSubtext'),
                severity: 'warning',
                icon: ShoppingBag
            });
        }
    });

    // Budget Health
    if (monthlyBudget > 0) {
        const ratio = currentSpent / monthlyBudget;

        if (ratio > 1) {
            insights.push({
                id: 'budget-critical',
                text: t('insights.budgetExceededTitle', { amount: (currentSpent - monthlyBudget).toFixed(0) }),
                subtext: t('insights.budgetExceededSubtext'),
                severity: 'danger',
                icon: AlertTriangle,
                action: 'budget',
                actionLabel: 'Fix Budget'
            });
        } else if (ratio > 0.85 && daysRemaining > 10) {
            insights.push({
                id: 'budget-warning',
                text: t('insights.budgetWarningTitle', { percent: Math.round(ratio * 100) }),
                subtext: t('insights.budgetWarningSubtext', {
                    dailyLimit: ((monthlyBudget - currentSpent) / daysRemaining).toFixed(0)
                }),
                severity: 'warning',
                icon: Wallet,
                action: 'budget',
                actionLabel: 'View Budget'
            });
        }
    }

    // Custody Prep
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
                text: dayDiff === 0
                    ? t('insights.custodyTodayTitle')
                    : t('insights.custodyUpcomingTitle', { days: dayDiff }),
                subtext: t('insights.custodySubtext'),
                severity: 'info',
                icon: User,
                action: 'calendar',
                actionLabel: 'Schedule'
            });
        }
    }

    // Fallback
    if (insights.length === 0) {
        insights.push({
            id: 'generic-clean',
            text: t('insights.optimalTitle'),
            subtext: t('insights.optimalSubtext'),
            severity: 'success',
            icon: CheckCircle2
        });
    }

    return insights;
};
