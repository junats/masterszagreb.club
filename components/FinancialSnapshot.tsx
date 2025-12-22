import React from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
    CalendarDays, ShoppingBag, ArrowUpRight, Calendar, Activity,
    MoreHorizontal
} from 'lucide-react';
import { DashboardMetrics } from '../hooks/useDashboardMetrics';

interface FinancialSnapshotProps {
    metrics: DashboardMetrics;
    monthlyBudget: number;
    daysInMonth: number;
    onViewDetail: (metric: any) => void;
}

export const FinancialSnapshot: React.FC<FinancialSnapshotProps> = ({
    metrics,
    monthlyBudget,
    daysInMonth,
    onViewDetail
}) => {

    // Helper logic to map metrics to snapshot items 
    // (This logic was previously in Dashboard.tsx inside the return of aiMetrics, but we can re-derive or map here 
    // OR we can update the hook to return this exact shape. 
    // The hook returns `aiMetrics` as an empty array currently in my last edit?
    // Wait, in my last edit to useDashboardMetrics, I left `aiMetrics: []`. 
    // So passing `metrics` here might not be enough if I don't calculate the UI-specific array.

    // However, Dashboard.tsx previously had logic to construct `aiMetrics` using `useMemo`.
    // I replaced that logic with the hook call.
    // BUT the hook explicitly returned `aiMetrics: []`.
    // So Dashboard.tsx is receiving empty aiMetrics!

    // I need to either:
    // 1. Move the `aiMetrics` construction logic into this component (FinancialSnapshot).
    // 2. Or move it into the hook.

    // Moving it into this component is better for "View Logic".

    // Let's reconstruct the items here using `metrics` data.

    const daysPassed = new Date().getDate();
    const dailyAvg = metrics.dailyAverage;
    const projected = metrics.projectedTotal;
    const totalSpent = metrics.thisMonthTotal;
    const weekendSpend = (metrics.thisMonthReceipts || []).reduce((acc, r) => {
        const day = new Date(r.date).getDay();
        return (day === 0 || day === 6) ? acc + (r.total || 0) : acc;
    }, 0);
    const weekendPercent = totalSpent > 0 ? (weekendSpend / totalSpent) * 100 : 0;

    // Biggest Purchase
    const biggestPurchase = Math.max(...(metrics.thisMonthReceipts || []).map(r => r.total), 0);
    const biggestReceipt = metrics.latestReceipt && metrics.latestReceipt.total === biggestPurchase ? metrics.latestReceipt : (metrics.thisMonthReceipts || []).sort((a, b) => b.total - a.total)[0];

    // Top Category
    const topCategory = metrics.categoryData.length > 0 ? metrics.categoryData[0].name : '-';

    // Helper for Top 3 Cats
    const top3Cats = metrics.categoryData.slice(0, 3).map(c => ({
        label: c.name,
        value: c.percentage.toFixed(0) + "% ",
        subtext: "€" + c.value.toFixed(0) + " "
    }));

    // Status Logic
    let statusLabel = 'Forecast';
    let statusValue = "€" + projected.toFixed(0);
    let statusTrend = projected > monthlyBudget ? 'down' : 'up';
    let statusIcon: any = projected > monthlyBudget ? TrendingDown : TrendingUp;
    let statusDetail = metrics.spendingInsight;
    let statusPopup: any = {
        title: 'Budget Forecast',
        description: "Based on your current spending velocity, we project a Month End total of €" + projected.toFixed(0) + ".",
        insight: projected > monthlyBudget ? "You are on track to exceed your budget by €" + (projected - monthlyBudget).toFixed(0) + "." : 'You are comfortably on track to stay under budget.',
        items: [
            { label: 'Current Spend', value: "€" + totalSpent.toFixed(0) },
            { label: 'Remaining Budget', value: "€" + Math.max(0, monthlyBudget - totalSpent).toFixed(0) },
            { label: 'Projected Total', value: "€" + projected.toFixed(0) }
        ]
    };

    // Priority 1: Just Added (Last 5 mins)
    const latestReceipt = metrics.latestReceipt;
    if (latestReceipt && (new Date().getTime() - new Date(latestReceipt.date).getTime() < 5 * 60 * 1000)) {
        statusLabel = 'Just Added';
        statusValue = "Receipt Added";
        statusTrend = 'up';
        statusIcon = CheckCircle2;
        statusDetail = `+€${latestReceipt.total.toFixed(2)} at ${latestReceipt.storeName}`;
        statusPopup = {
            title: 'Receipt Processed',
            description: `We just added a receipt from ${latestReceipt.storeName} for €${latestReceipt.total.toFixed(2)}.`,
            insight: 'Your dashboard has been updated with the latest figures.',
            items: [
                { label: 'Store', value: latestReceipt.storeName },
                { label: 'Amount', value: "€" + latestReceipt.total.toFixed(2) },
                { label: 'Time', value: new Date(latestReceipt.date).toLocaleTimeString() }
            ]
        };
    }
    // Priority 2: Critical Alerts
    else if (metrics.thisMonthTotal > monthlyBudget) {
        statusLabel = 'Alert';
        statusValue = 'Over Budget';
        statusTrend = 'down';
        statusIcon = AlertTriangle;
        statusDetail = `Exceeded by €${(metrics.thisMonthTotal - monthlyBudget).toFixed(0)}`;
        statusPopup = {
            title: 'Budget Alert',
            description: `You have exceeded your monthly budget of €${monthlyBudget}.`,
            insight: 'Consider pausing non-essential spending for the rest of the month.',
            items: [
                { label: 'Total Spent', value: "€" + metrics.thisMonthTotal.toFixed(0) },
                { label: 'Budget', value: "€" + monthlyBudget.toFixed(0) },
                { label: 'Overage', value: "€" + (metrics.thisMonthTotal - monthlyBudget).toFixed(0) }
            ]
        };
    }

    // Daily Trend
    const dailyTarget = monthlyBudget / 30; // Approx
    const dailyTrendDiff = dailyAvg - dailyTarget;

    const snapshotItems = [
        {
            label: 'Daily Avg',
            value: "€" + dailyAvg.toFixed(0) + " ",
            trend: dailyTrendDiff > 0 ? 'up' : 'down',
            trendLabel: dailyTrendDiff > 0 ? 'Above Target' : 'On Track',
            icon: CalendarDays,
            detail: "Target: €" + dailyTarget.toFixed(0),
            popup: {
                title: 'Daily Spending Average',
                description: "You are spending an average of €" + dailyAvg.toFixed(0) + " every day this month. To stay within your €" + monthlyBudget + " budget, try to keep this under €" + (monthlyBudget / daysInMonth).toFixed(0) + ".",
                insight: dailyAvg > (monthlyBudget / daysInMonth) ? 'You are pacing to overspend. Try having one "No Spend Day" this week.' : 'Great job! Your daily pacing is sustainable.',
                items: [
                    { label: 'Today', value: "€" + metrics.todayTotal.toFixed(0) },
                    { label: 'Yesterday', value: "€" + (metrics.yesterdayTotal || 0).toFixed(0) }, // Approx
                    { label: 'Target', value: "€" + (monthlyBudget / daysInMonth).toFixed(0) }
                ]
            }
        },
        {
            label: statusLabel,
            value: statusValue,
            trend: statusTrend,
            trendLabel: statusTrend === 'down' ? 'Improving' : 'Attention',
            icon: statusIcon,
            detail: statusDetail,
            popup: statusPopup
        },
        {
            label: 'Top Cat',
            value: topCategory,
            trend: 'neutral',
            trendLabel: 'Dominant',
            icon: ShoppingBag,
            detail: (top3Cats[0]?.value || '0%') + " of total",
            popup: {
                title: 'Top Categories',
                description: "Your spending is heavily concentrated in " + topCategory + ". Diversifying or reducing this category is the fastest way to save.",
                insight: 'Check if these are essential or discretionary expenses.',
                items: top3Cats
            }
        },
        {
            label: 'Big Buy',
            value: "€" + biggestPurchase.toFixed(0),
            trend: 'neutral',
            trendLabel: 'One-off',
            icon: ArrowUpRight,
            detail: biggestReceipt?.storeName || '-',
            popup: {
                title: 'Biggest Purchase',
                description: biggestReceipt ? "Your largest single transaction was at " + biggestReceipt.storeName + " on " + new Date(biggestReceipt.date).toLocaleDateString() + "." : 'No large purchases yet.',
                insight: 'Large one-off purchases can derail a budget quickly. Plan for these in advance.',
                items: biggestReceipt ? [{ label: biggestReceipt.storeName, value: "€" + biggestReceipt.total.toFixed(2), subtext: new Date(biggestReceipt.date).toLocaleTimeString() }] : []
            }
        },
        // Frequency and Weekend logic could be added here similar to Dashboard.tsx
    ];

    // Render
    const heroMetric = snapshotItems[1]; // Forecast/Status is hero
    const subMetrics = [snapshotItems[0], snapshotItems[2], snapshotItems[3]]; // Daily, Top Cat, Big Buy

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* Main Hero Card (Forecast/Status) */}
            <button
                onClick={() => onViewDetail(heroMetric)}
                className={"flex-1 md:max-w-[40%] relative p-3 rounded-xl border transition-all duration-300 group/hero overflow-hidden flex flex-col justify-between gap-3 " + (
                    heroMetric.label === 'Alert' ?
                        'bg-red-500/10 border-red-500/20 hover:bg-red-500/15 hover:border-red-500/30' :
                        'bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20 backdrop-blur-xl'
                )}>

                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <div className={"p-1.5 rounded-lg " + (
                            heroMetric.label === 'Alert' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-300'
                        )}>
                            <heroMetric.icon size={14} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</span>
                    </div>
                </div>

                <div>
                    <div className="flex items-baseline gap-2 mb-1">
                        <div className={"text-2xl font-heading font-light tracking-tight leading-none " + (
                            heroMetric.label === 'Alert' ? 'text-red-400' : 'text-white'
                        )}>
                            {heroMetric.value}
                        </div>
                        {(heroMetric as any).trend && (heroMetric as any).trend !== 'neutral' && (
                            <div className={"flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border " + (
                                (heroMetric as any).trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                            )}>
                                {(heroMetric as any).trendLabel || ((heroMetric as any).trend === 'up' ? 'Safe' : 'Risk')}
                            </div>
                        )}
                    </div>
                    {(heroMetric as any).detail && (
                        <p className="text-[9px] text-slate-500 leading-tight opacity-70 line-clamp-1 text-left">{(heroMetric as any).detail}</p>
                    )}
                </div>
            </button>

            {/* 2x2 Grid of Sub Metrics */}
            <div className="flex-1 grid grid-cols-2 gap-2">
                {subMetrics.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => onViewDetail(item)}
                        className="relative p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between gap-2 group"
                    >
                        <div className="flex items-start justify-between w-full">
                            <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">{item.label}</span>
                            <div className={"text-xs transition-colors duration-300 " + (
                                (item as any).trend === 'up' ? 'text-emerald-400' : (item as any).trend === 'down' ? 'text-red-400' : 'text-slate-600 group-hover:text-slate-400'
                            )}>
                                <item.icon size={12} />
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-200 tracking-tight leading-none mb-0.5">
                                {item.value}
                            </div>
                            <div className="text-[9px] text-slate-500 truncate text-left opacity-60 group-hover:opacity-100 transition-opacity">
                                {(item as any).detail}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
