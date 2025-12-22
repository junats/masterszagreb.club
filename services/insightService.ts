import { Receipt, Category, CustodyDay, Goal } from '../types';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Wallet, ShoppingBag, Calendar, Lightbulb, User, Clock, Target } from 'lucide-react';

export type InsightSeverity = 'success' | 'warning' | 'danger' | 'info';

export interface InsightMessage {
    id: string;
    text: string;
    subtext?: string;
    severity: InsightSeverity;
    icon: any;
    category?: string;
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

    // Late Night Spending
    const lateNightReceipts = receipts.filter(r => {
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
    const weekendReceipts = receipts.filter(r => {
        const d = new Date(r.date).getDay();
        return d === 0 || d === 6;
    });
    const weekdayReceipts = receipts.filter(r => {
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
            icon: Calendar
        });
    }

    // Goal Adherence
    goals.filter(g => g.isEnabled).forEach(g => {
        const violations = receipts.filter(r =>
            (g.keywords || []).some(k => r.storeName.toLowerCase().includes(k) || r.items.some(i => i.name.toLowerCase().includes(k)))
            || (r.categoryId === Category.ALCOHOL && g.type === 'ALCOHOL')
            || (r.categoryId === Category.DINING && g.type === 'JUNK_FOOD' && r.storeName.toLowerCase().includes('mcd'))
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
    receipts.forEach(r => {
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
                icon: AlertTriangle
            });
        } else if (ratio > 0.85 && daysRemaining > 10) {
            insights.push({
                id: 'budget-warning',
                text: t('insights.budgetWarningTitle', { percent: Math.round(ratio * 100) }),
                subtext: t('insights.budgetWarningSubtext', {
                    dailyLimit: ((monthlyBudget - currentSpent) / daysRemaining).toFixed(0)
                }),
                severity: 'warning',
                icon: Wallet
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
                icon: User
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
