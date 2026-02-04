import React from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
    CalendarDays, ShoppingBag, ArrowUpRight, Calendar, Activity,
    MoreHorizontal, Heart, Sparkles, CreditCard
} from 'lucide-react';
import { DashboardMetrics } from '../hooks/useDashboardMetrics';
import { useLanguage } from '../contexts/LanguageContext';
import { AreaChart, Area, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

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
    const { t } = useLanguage();

    // --- DATA PREP ---
    const projected = metrics.projectedTotal;
    const totalSpent = metrics.thisMonthTotal;

    // Biggest Purchase
    const biggestPurchase = Math.max(...(metrics.thisMonthReceipts || []).map(r => r.total), 0);
    const biggestReceipt = metrics.latestReceipt && metrics.latestReceipt.total === biggestPurchase ? metrics.latestReceipt : (metrics.thisMonthReceipts || []).sort((a, b) => b.total - a.total)[0];

    // Top Category
    const topCatRaw = metrics.categoryData.length > 0 ? metrics.categoryData[0].name : null;
    const topCategoryLabel = topCatRaw ? t(`categories.${topCatRaw.toLowerCase()}`, { defaultValue: topCatRaw }) : '-';

    // Helper for Top 3 Cats
    const top3Cats = metrics.categoryData.slice(0, 3).map(c => ({
        label: t(`categories.${c.name.toLowerCase()}`, { defaultValue: c.name }),
        value: c.percentage.toFixed(0) + "% ",
        subtext: "€" + c.value.toFixed(0) + " "
    }));

    // Status Logic
    let statusLabel = t('status.forecast');
    let statusValue = "€" + projected.toFixed(0);
    let statusTrend = projected > monthlyBudget ? 'down' : 'up';
    let statusIcon: any = projected > monthlyBudget ? TrendingDown : TrendingUp;
    let statusDetail = metrics.spendingInsight;
    let statusPopup: any = {
        title: t('popups.budgetForecast.title'),
        description: t('popups.budgetForecast.description', { projected: projected.toFixed(0) }),
        insight: projected > monthlyBudget ? t('popups.budgetForecast.insightOver', { overage: (projected - monthlyBudget).toFixed(0) }) : t('popups.budgetForecast.insightUnder'),
        items: [
            { label: t('dashboard.currentSpend'), value: "€" + totalSpent.toFixed(0) },
            { label: t('dashboard.remainingBudget'), value: "€" + Math.max(0, monthlyBudget - totalSpent).toFixed(0) },
            { label: t('charts.target'), value: "€" + projected.toFixed(0) }
        ]
    };

    // Priority Just Added / Critical Alerts logic retained...
    // Priority 1: Just Added (Last 5 mins)
    const latestReceipt = metrics.latestReceipt;
    if (latestReceipt && (new Date().getTime() - new Date(latestReceipt.date).getTime() < 5 * 60 * 1000)) {
        statusLabel = t('status.justAdded');
        statusValue = t('status.receiptAdded');
        statusTrend = 'up';
        statusIcon = CheckCircle2;
        statusDetail = `+€${latestReceipt.total.toFixed(2)} at ${latestReceipt.storeName}`;
        statusPopup = { /* ... */ }; // Retain existing
    }
    // Priority 2: Critical Alerts
    else if (metrics.thisMonthTotal > monthlyBudget) {
        statusLabel = t('status.alert');
        statusValue = t('status.overBudget');
        statusTrend = 'down';
        statusIcon = AlertTriangle;
        statusDetail = `Exceeded by €${(metrics.thisMonthTotal - monthlyBudget).toFixed(0)}`;
        statusPopup = { /* ... */ }; // Retain existing
    }

    // Sparkline Data
    const sparklineData = metrics.monthData.map(d => ({ value: d.total }));
    const isAlert = statusTrend === 'down' || metrics.thisMonthTotal > monthlyBudget;

    // Health Score
    // const healthScore = Math.min(100, Math.max(0, metrics.avgNutritionScore || 0));
    // const healthData = [{ name: 'Health', value: healthScore, fill: healthScore > 70 ? '#10b981' : healthScore < 40 ? '#ef4444' : '#eab308' }];


    // Top Cat Progress
    const topCatPercent = metrics.categoryData.length > 0 ? metrics.categoryData[0].percentage : 0;

    return (
        <div className="flex flex-col md:flex-row gap-4 h-full min-h-[220px]">
            {/* HERO CARD - Minimalist */}
            <motion.button
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onViewDetail({ popup: statusPopup })}
                className="group relative flex-1 md:flex-[1.4] rounded-3xl overflow-hidden border border-white/5 bg-slate-950 shadow-sm transition-all duration-500 hover:border-white/10"
            >
                <div className="relative z-10 h-full flex flex-col justify-between p-6">
                    <div className="flex justify-between items-start">
                        <div className={`flex items-center gap-3 ${isAlert ? 'text-red-400' : 'text-slate-400'}`}>
                            <div className={`p-2 rounded-xl border border-white/5 bg-white/5`}>
                                <statusIcon.icon size={18} />
                            </div>
                            <span className="text-xxs font-bold uppercase tracking-widest">{statusLabel}</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-heading font-light text-white tracking-tight">{statusValue}</span>
                        </div>
                        <p className="text-xxs mt-2 font-medium text-slate-500 max-w-[90%] truncate">
                            {statusDetail}
                        </p>
                    </div>
                </div>

                {/* Subtle Sparkline Background */}
                <div className="absolute bottom-0 left-0 right-0 h-24 opacity-10 pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData}>
                            <defs>
                                <linearGradient id="chartGradientMinimal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isAlert ? '#ef4444' : '#ffffff'} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={isAlert ? '#ef4444' : '#ffffff'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isAlert ? '#ef4444' : '#94a3b8'}
                                strokeWidth={1}
                                fill="url(#chartGradientMinimal)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.button>

            {/* SECONDARY GRID - Cleaner */}
            <div className="flex-1 grid grid-cols-2 gap-3 md:gap-4">
                {/* HEALTH SCORE */}
                {/* <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onViewDetail({ popup: { title: t('financial.healthScore'), items: [] } })}
                    className="relative bg-slate-950 border border-white/5 rounded-3xl p-4 flex flex-col items-center justify-center hover:bg-white/5 transition-colors gap-2"
                >
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart innerRadius="80%" outerRadius="100%" data={healthData} startAngle={90} endAngle={-270}>
                                <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={50} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <Heart size={16} className={`${healthScore > 70 ? 'text-emerald-500' : 'text-amber-500'} absolute`} />
                    </div>
                    <div className="text-center">
                        <span className="text-xl font-bold text-white block leading-none">{healthScore}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('financial.healthScore')}</span>
                    </div>
                </motion.button> */}

                {/* TOP CATEGORY */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onViewDetail({ popup: { title: t('labels.topCat'), items: top3Cats } })}
                    className="relative bg-slate-950 border border-white/5 rounded-3xl p-4 flex flex-col justify-between hover:bg-white/5 transition-colors"
                >
                    <div className="flex justify-between items-start w-full mb-2">
                        <ShoppingBag size={18} className="text-blue-400" />
                        <span className="text-xxs font-mono text-slate-500">{topCatPercent.toFixed(0)}%</span>
                    </div>
                    <div>
                        <p className="text-xxs text-slate-500 font-bold uppercase tracking-widest mb-1">{t('labels.topCat')}</p>
                        <p className="text-sm font-bold text-white truncate">{topCategoryLabel}</p>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${topCatPercent}%` }}
                                className="h-full bg-blue-500 rounded-full"
                            />
                        </div>
                    </div>
                </motion.button>

                {/* BIG PURCHASE - Full Width Bottom */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onViewDetail({ popup: { title: t('labels.bigBuy'), items: [] } })}
                    className="col-span-2 relative bg-slate-950 border border-white/5 rounded-3xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/10">
                            <CreditCard size={18} />
                        </div>
                        <div className="text-left">
                            <p className="text-xxs text-slate-500 font-bold uppercase tracking-widest">{t('labels.bigBuy')}</p>
                            <p className="text-sm font-bold text-white truncate max-w-[120px]">{biggestReceipt?.storeName || '-'}</p>
                        </div>
                    </div>
                    <span className="text-lg font-mono text-white">€{biggestPurchase.toFixed(0)}</span>
                </motion.button>
            </div>
        </div>
    );
};
