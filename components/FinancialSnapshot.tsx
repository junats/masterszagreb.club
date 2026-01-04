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
    // Translated Top Category (Logic derived from Dashboard)
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

    // Priority 1: Just Added (Last 5 mins)
    const latestReceipt = metrics.latestReceipt;
    if (latestReceipt && (new Date().getTime() - new Date(latestReceipt.date).getTime() < 5 * 60 * 1000)) {
        statusLabel = t('status.justAdded');
        statusValue = t('status.receiptAdded');
        statusTrend = 'up';
        statusIcon = CheckCircle2;
        statusDetail = `+€${latestReceipt.total.toFixed(2)} at ${latestReceipt.storeName}`;
        statusPopup = {
            title: t('popups.receiptProcessed.title'),
            description: t('popups.receiptProcessed.description', { storeName: latestReceipt.storeName, amount: latestReceipt.total.toFixed(2) }),
            insight: t('popups.receiptProcessed.insight'),
            items: [
                { label: t('popups.receiptProcessed.store'), value: latestReceipt.storeName },
                { label: t('popups.receiptProcessed.amount'), value: "€" + latestReceipt.total.toFixed(2) },
                { label: t('popups.receiptProcessed.time'), value: new Date(latestReceipt.date).toLocaleTimeString() }
            ]
        };
    }
    // Priority 2: Critical Alerts
    else if (metrics.thisMonthTotal > monthlyBudget) {
        statusLabel = t('status.alert');
        statusValue = t('status.overBudget');
        statusTrend = 'down';
        statusIcon = AlertTriangle;
        statusDetail = `Exceeded by €${(metrics.thisMonthTotal - monthlyBudget).toFixed(0)}`;
        statusPopup = {
            title: t('popups.budgetAlert.title'),
            description: t('popups.budgetAlert.description', { budget: monthlyBudget.toString() }),
            insight: t('popups.budgetAlert.insight'),
            items: [
                { label: t('dashboard.totalSpent'), value: "€" + metrics.thisMonthTotal.toFixed(0) },
                { label: t('popups.budgetAlert.budget'), value: "€" + monthlyBudget.toFixed(0) },
                { label: t('popups.budgetAlert.overage'), value: "€" + (metrics.thisMonthTotal - monthlyBudget).toFixed(0) }
            ]
        };
    }

    // --- CHART DATA PREP ---

    // Sparkline Data for Hero (Last 30 Days or simple trend)
    const sparklineData = metrics.monthData.map(d => ({ value: d.total }));
    const isAlert = statusTrend === 'down' || metrics.thisMonthTotal > monthlyBudget;

    // Health Score Data
    const healthScore = Math.min(100, Math.max(0, metrics.avgNutritionScore || 0));
    const healthData = [{ name: 'Health', value: healthScore, fill: healthScore > 70 ? '#10b981' : healthScore < 40 ? '#ef4444' : '#eab308' }];

    // Top Category Progress
    const topCatPercent = metrics.categoryData.length > 0 ? metrics.categoryData[0].percentage : 0;
    const topCatColor = metrics.categoryData.length > 0 ? (metrics.categoryData[0] as any).color || '#818cf8' : '#818cf8'; // Fallback color logic handled in CSS/Inline usually, we'll assume solid color for now

    // --- RENDER ---

    return (
        <div className="flex flex-col md:flex-row gap-4 h-full min-h-[300px]">
            {/* HERO CARD (Left Side / Top) */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onViewDetail({ popup: statusPopup })}
                className={`group relative flex-1 md:flex-[1.4] rounded-3xl overflow-hidden border transition-all duration-500 shadow-xl ${isAlert
                    ? 'bg-gradient-to-br from-red-900/40 via-slate-900/60 to-black border-red-500/30 shadow-red-900/20'
                    : 'bg-gradient-to-br from-indigo-900/40 via-slate-900/60 to-black border-indigo-500/30 shadow-indigo-900/20'
                    }`}
            >
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20 ${isAlert ? 'bg-red-500' : 'bg-blue-500'}`} />

                {/* Content Container */}
                <div className="relative z-10 h-full flex flex-col justify-between p-6">
                    <div className="flex justify-between items-start">
                        <div className={`p-2 rounded-2xl border backdrop-blur-md ${isAlert
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                            }`}>
                            <statusIcon.icon size={20} />
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${isAlert
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                            {t('financial.currentStatus')}
                        </div>
                    </div>

                    <div className="mt-8">
                        <h4 className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">{statusLabel}</h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-heading font-light text-white tracking-tight">{statusValue}</span>
                        </div>
                        <p className={`text-xs mt-2 font-medium leading-relaxed max-w-[90%] ${isAlert ? 'text-red-300' : 'text-slate-400'}`}>
                            {statusDetail}
                        </p>
                    </div>
                </div>

                {/* Sparkline Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 pointer-events-none fade-b-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isAlert ? '#ef4444' : '#6366f1'} stopOpacity={0.5} />
                                    <stop offset="100%" stopColor={isAlert ? '#ef4444' : '#6366f1'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isAlert ? '#ef4444' : '#6366f1'}
                                strokeWidth={2}
                                fill="url(#chartGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.button>

            {/* GRID (Right Side / Bottom) */}
            <div className="flex-1 grid grid-cols-2 gap-3 md:gap-4">
                {/* HEALTH SCORE */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onViewDetail({ popup: { title: t('financial.healthScore'), items: [] } })}
                    className="relative bg-slate-900/50 border border-white/5 rounded-3xl p-4 flex flex-col items-center justify-center overflow-hidden hover:bg-slate-800/50 transition-colors"
                >
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart innerRadius="70%" outerRadius="100%" data={healthData} startAngle={90} endAngle={-270}>
                                <RadialBar background dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <Heart size={18} className={`${healthScore > 70 ? 'text-emerald-400' : 'text-amber-400'} fill-current animate-pulse`} />
                            <span className="text-xs font-bold text-white mt-0.5">{healthScore}</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{t('financial.healthScore')}</span>
                </motion.button>

                {/* TOP CATEGORY */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onViewDetail({ popup: { title: t('labels.topCat'), items: top3Cats } })}
                    className="relative bg-slate-900/50 border border-white/5 rounded-3xl p-4 flex flex-col justify-between hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex justify-between items-start w-full">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                            <ShoppingBag size={16} />
                        </div>
                        <span className="text-[10px] text-slate-500 tabular-nums">{topCatPercent.toFixed(0)}%</span>
                    </div>
                    <div>
                        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('labels.topCat')}</h5>
                        <p className="text-sm font-bold text-white truncate mb-2">{topCategoryLabel}</p>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${topCatPercent}%` }}
                                className="h-full bg-blue-500 rounded-full"
                            />
                        </div>
                    </div>
                </motion.button>

                {/* BIG PURCHASE */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onViewDetail({ popup: { title: t('labels.bigBuy'), items: [] } })} // Simplified handler
                    className="col-span-2 relative bg-slate-900/50 border border-white/5 rounded-3xl p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <CreditCard size={20} />
                        </div>
                        <div className="text-left">
                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{t('labels.bigBuy')}</h5>
                            <p className="text-sm font-bold text-white">{biggestReceipt?.storeName || '-'}</p>
                            <p className="text-[10px] text-slate-400">{biggestReceipt ? new Date(biggestReceipt.date).toLocaleDateString() : ''}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-bold text-white block">€{biggestPurchase.toFixed(0)}</span>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-purple-400 font-medium">
                            {t('labels.oneOff')} <ArrowUpRight size={10} />
                        </div>
                    </div>
                </motion.button>
            </div>
        </div>
    );
};
