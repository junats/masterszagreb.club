import React, { useMemo, useState } from 'react';
import { Receipt, Category } from '../types';
import { ShoppingBag, X, ShieldCheck, FileText, Calendar, Store, ArrowUp, BarChart3, Check, Shield, Sparkles, TrendingUp, TrendingDown, Minus, Wallet, Hash, ArrowUpRight, AlertTriangle, CalendarDays, ArrowRight } from 'lucide-react';

interface DashboardProps {
    receipts: Receipt[];
    monthlyBudget: number;
    ageRestricted: boolean;
    onViewReceipt?: (receipt: Receipt) => void;
}

interface DrillDownState {
    category: string;
    items: { name: string; price: number; date: string; store: string }[];
}

type DateFilter = 'all' | 'this_month' | 'last_month';

const Dashboard: React.FC<DashboardProps> = ({ receipts, monthlyBudget, ageRestricted, onViewReceipt }) => {
    const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');

    // Calculate Metrics
    const metrics = useMemo(() => {
        // 1. Filter Receipts based on Date Filter
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const filteredReceipts = receipts.filter(r => {
            const d = new Date(r.date);
            if (dateFilter === 'this_month') {
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            } else if (dateFilter === 'last_month') {
                const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
            }
            return true;
        });

        let totalSpent = 0;
        let provisionTotal = 0; // Essentials only
        const categoryTotals: Record<string, number> = {};
        const categoryItems: Record<string, DrillDownState['items']> = {};
        let luxuryTotal = 0;

        // For Dynamic Insight
        const storeTotals: Record<string, number> = {};

        filteredReceipts.forEach(r => {
            const validItems = r.items.filter(item => !ageRestricted || !item.isRestricted);
            const effectiveReceiptTotal = validItems.reduce((sum, item) => sum + item.price, 0);

            if (validItems.length === 0 && r.items.length > 0) return;

            totalSpent += effectiveReceiptTotal;
            storeTotals[r.storeName] = (storeTotals[r.storeName] || 0) + effectiveReceiptTotal;

            validItems.forEach(item => {
                const cat = item.category || Category.OTHER;
                categoryTotals[cat] = (categoryTotals[cat] || 0) + item.price;

                if (!categoryItems[cat]) categoryItems[cat] = [];
                categoryItems[cat].push({ name: item.name, price: item.price, date: r.date, store: r.storeName });

                if (cat === Category.LUXURY) {
                    luxuryTotal += item.price;
                    if (!categoryItems['Luxury']) categoryItems['Luxury'] = [];
                    categoryItems['Luxury'].push({ name: item.name, price: item.price, date: r.date, store: r.storeName });
                } else {
                    // Essentials Calculation (Stricter Provision Logic)
                    // 1. Always include Child Related items
                    if (item.isChildRelated) {
                        provisionTotal += item.price;
                    }
                    // 2. Include strict essentials (Food=Groceries, Household, Health, Education)
                    // Exclude Transport (Gas) unless child related, to avoid inflating score with personal travel
                    else if ([Category.NECESSITY, Category.FOOD, Category.HEALTH, Category.HOUSEHOLD, Category.EDUCATION].includes(cat)) {
                        provisionTotal += item.price;
                    }
                }
            });
        });

        const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
            name,
            value,
            percentage: totalSpent > 0 ? (value / totalSpent) * 100 : 0
        })).sort((a, b) => b.value - a.value);

        // Sort drilldown items
        Object.keys(categoryItems).forEach(key => {
            categoryItems[key].sort((a, b) => b.price - a.price);
        });

        const provisionRatio = totalSpent > 0 ? (provisionTotal / totalSpent) * 100 : 0;

        // Evidence Health Components
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
            ? Math.max(...filteredReceipts.map(r => r.items.reduce((s, i) => !ageRestricted || !i.isRestricted ? s + i.price : s, 0)))
            : 0;

        // Recent Spending Trend (Last 5 logs)
        const recentLogs = [...filteredReceipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).reverse();
        const maxLogValue = Math.max(...recentLogs.map(r => r.total), 1);

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
        let spendingInsight = "Scan more receipts to generate insights.";
        let trendDirection: 'up' | 'down' | 'flat' = 'flat';

        if (filteredReceipts.length >= 3) {
            // Compare average of last 3 logs vs global average
            const recentSubset = recentLogs.slice(-3);
            const recentAvg = recentSubset.reduce((sum, r) => sum + r.total, 0) / recentSubset.length;

            const diffPercent = avgReceipt > 0 ? ((recentAvg - avgReceipt) / avgReceipt) * 100 : 0;

            // Budget Logic (Priority)
            const budgetUsedPercent = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

            if (budgetUsedPercent > 100) {
                spendingInsight = "You have exceeded your monthly budget.";
                trendDirection = 'up';
            } else if (budgetUsedPercent > 85) {
                spendingInsight = "You are approaching your budget limit.";
                trendDirection = 'up';
            } else if (diffPercent > 20) {
                spendingInsight = "Recent spending is higher than average.";
                trendDirection = 'up';
            } else if (diffPercent < -20) {
                spendingInsight = "You are spending less than usual.";
                trendDirection = 'down';
            } else {
                spendingInsight = "Your spending habits are stable.";
                trendDirection = 'flat';
            }
        }

        // --- NEW METRICS ---

        // 1. Daily Activity (Last 7 Days)
        const weeklyActivity = [];
        let maxDayTotal = 0;

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);

            const dayTotal = receipts.reduce((acc, r) => {
                let rDate = new Date(r.date);

                // Handle YYYY-MM-DD strings explicitly
                if (r.date.length === 10 && r.date.includes('-')) {
                    const [y, m, dt] = r.date.split('-').map(Number);
                    rDate = new Date(y, m - 1, dt);
                }

                // Simple comparison of Day, Month, Year (Local Time)
                if (rDate.getDate() === d.getDate() &&
                    rDate.getMonth() === d.getMonth() &&
                    rDate.getFullYear() === d.getFullYear()) {

                    const validItems = r.items.filter(item => !ageRestricted || !item.isRestricted);
                    return acc + validItems.reduce((sum, item) => sum + item.price, 0);
                }
                return acc;
            }, 0);

            if (dayTotal > maxDayTotal) maxDayTotal = dayTotal;

            weeklyActivity.push({
                day: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), // "Mon 27"
                date: d.getDate(),
                value: dayTotal
            });
        }

        // 2. Monthly Comparison
        const thisMonthReceipts = receipts.filter(r => {
            const d = new Date(r.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const lastMonthReceipts = receipts.filter(r => {
            const d = new Date(r.date);
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });

        const thisMonthTotal = thisMonthReceipts.reduce((acc, r) => acc + r.items.reduce((s, i) => !ageRestricted || !i.isRestricted ? s + i.price : s, 0), 0);
        const lastMonthTotal = lastMonthReceipts.reduce((acc, r) => acc + r.items.reduce((s, i) => !ageRestricted || !i.isRestricted ? s + i.price : s, 0), 0);

        const monthDiff = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

        // 3. Projection
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysPassed = Math.max(now.getDate(), 1);
        const projectedTotal = (thisMonthTotal / daysPassed) * daysInMonth;

        return {
            totalSpent,
            provisionTotal,
            provisionRatio,
            categoryData,
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
            thisMonthTotal
        };
    }, [receipts, ageRestricted, monthlyBudget, dateFilter]);

    const toggleDateFilter = () => {
        if (dateFilter === 'all') setDateFilter('this_month');
        else if (dateFilter === 'this_month') setDateFilter('last_month');
        else setDateFilter('all');
    };

    const getDateFilterLabel = () => {
        switch (dateFilter) {
            case 'this_month': return 'This Month';
            case 'last_month': return 'Last Month';
            default: return 'All Time';
        }
    };

    const COLORS: Record<string, string> = {
        [Category.NECESSITY]: '#38bdf8', // Sky
        [Category.FOOD]: '#4ade80',      // Green
        [Category.LUXURY]: '#f472b6',    // Pink
        [Category.HOUSEHOLD]: '#818cf8', // Indigo
        [Category.HEALTH]: '#fb7185',    // Rose
        [Category.TRANSPORT]: '#facc15', // Yellow
        [Category.EDUCATION]: '#6366f1', // Indigo
        [Category.OTHER]: '#94a3b8',     // Slate
    };

    const budgetProgress = monthlyBudget > 0 ? (metrics.totalSpent / monthlyBudget) * 100 : 0;

    // Evidence Gauge Calc
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (metrics.numericEvidenceScore / 100) * circumference;

    return (
        <div className="flex flex-col h-full px-4 pt-4 pb-32 overflow-y-auto no-scrollbar bg-background">
            {/* Header */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-6 h-6 text-white fill-white/10" strokeWidth={2} />
                        <h1 className="text-2xl font-heading font-bold text-white tracking-tighter">TrueTrack</h1>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <p className="text-slate-400 text-xs font-medium tracking-tight">Safe Harbor Active</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {ageRestricted && (
                        <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded-lg">
                            <ShieldCheck className="text-amber-500 w-4 h-4" />
                        </div>
                    )}
                    <button
                        onClick={toggleDateFilter}
                        className="bg-surface border border-white/5 rounded-full h-9 px-4 flex items-center justify-center gap-2 transition-all duration-300 hover:bg-surfaceHighlight hover:border-white/20 hover:shadow-md active:shadow-inner"
                    >
                        <Calendar className="text-primary w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wide">{getDateFilterLabel()}</span>
                    </button>
                </div>
            </div>

            {/* BENTO GRID LAYOUT */}
            <div className="grid grid-cols-2 gap-3 mb-6">

                {/* 1. Main Provisioning Card (Full Width) */}
                <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 shadow-xl relative overflow-hidden group border border-white/10 transition-all duration-500 hover:shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 transition-all duration-700 group-hover:bg-white/15"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-indigo-100 text-xs font-heading font-semibold uppercase tracking-widest mb-1 opacity-80">Verified Provision</p>
                            <h2 className="text-4xl font-heading font-bold text-white tracking-tighter tabular-nums">
                                €{metrics.provisionTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums border border-white/10">
                                    {metrics.provisionRatio.toFixed(0)}%
                                </span>
                                <span className="text-indigo-100 text-xs font-medium tracking-tight opacity-90">of outgoing funds spent on Child/Home</span>
                            </div>
                        </div>
                        <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-sm group-hover:bg-white/25 transition-colors duration-300">
                            <ShieldCheck className="text-white w-6 h-6" />
                        </div>
                    </div>
                    {/* Progress Bar for Budget inside Main Card */}
                    <div className="relative z-10 mt-6 bg-black/20 rounded-xl p-3 border border-white/5 backdrop-blur-sm group-hover:border-white/10 transition-all duration-300">
                        <div className="flex justify-between text-[10px] text-indigo-100 mb-2 font-medium tracking-tight">
                            <span>Monthly Budget Usage</span>
                            <span className="tabular-nums">{Math.round(budgetProgress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden mb-2">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${budgetProgress > 100 ? 'bg-rose-300' : 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'}`}
                                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-indigo-200/70">
                            <span>Target: €{monthlyBudget}</span>
                            <span className="flex items-center gap-1">
                                Est. End: <span className="text-white font-bold tabular-nums">€{metrics.projectedTotal.toFixed(0)}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* 1.5 Weekly Activity Chart (New) */}
                <div className="col-span-2 bg-surface border border-white/5 rounded-3xl p-5 shadow-sm hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="text-orange-400 w-4 h-4" />
                            <span className="text-slate-400 text-xs font-heading font-semibold tracking-wide uppercase">Weekly Activity</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">Last 7 Days</div>
                    </div>

                    <div className="flex items-end justify-between gap-2 h-32 pt-2">
                        {metrics.weeklyActivity.map((day, idx) => {
                            const heightPercent = metrics.maxDayTotal > 0 ? (day.value / metrics.maxDayTotal) * 100 : 0;
                            return (
                                <div key={idx} className="flex flex-col items-center gap-2 w-full h-full group/bar">
                                    <div className="relative w-full flex-1 flex items-end">
                                        <div
                                            className="w-full bg-orange-500/20 rounded-t-lg transition-all duration-500 group-hover/bar:bg-orange-500 group-hover/bar:shadow-[0_0_15px_rgba(249,115,22,0.4)] relative"
                                            style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 border border-white/10 font-bold tabular-nums">
                                                €{day.value.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium group-hover/bar:text-slate-300 transition-colors">{day.day}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Evidence Health Check */}
                <div className="col-span-1 bg-surface border border-white/5 rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden shadow-sm hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="text-blue-400 w-4 h-4" />
                        <span className="text-slate-400 text-xs font-heading font-semibold tracking-wide uppercase">Log Strength</span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-2 relative">
                        <div className="relative w-14 h-14">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                                <circle className="text-slate-800" strokeWidth="5" stroke="currentColor" fill="transparent" r={radius} cx="24" cy="24" />
                                <circle
                                    className={`${metrics.evidenceColor} transition-all duration-1000 ease-out drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]`}
                                    strokeWidth="5"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r={radius}
                                    cx="24"
                                    cy="24"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-[10px] font-bold ${metrics.evidenceColor} tabular-nums`}>{metrics.numericEvidenceScore}</span>
                            </div>
                        </div>
                        <p className={`mt-2 text-sm font-heading font-bold tracking-tight ${metrics.evidenceColor}`}>{metrics.evidenceLabel}</p>
                        <p className="text-[10px] text-slate-500 text-center leading-tight mt-0.5">{metrics.volumeCount} verified logs</p>
                    </div>
                </div>

                {/* 3. Spending Trends */}
                <div className="col-span-1 bg-surface border border-white/5 rounded-3xl p-4 flex flex-col relative overflow-hidden shadow-sm hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="text-purple-400 w-4 h-4" />
                            <span className="text-slate-400 text-xs font-heading font-semibold tracking-wide uppercase">Trend</span>
                        </div>
                        {metrics.trendDirection === 'up' && <TrendingUp size={14} className="text-red-400" />}
                        {metrics.trendDirection === 'down' && <TrendingDown size={14} className="text-emerald-400" />}
                        {metrics.trendDirection === 'flat' && <Minus size={14} className="text-slate-400" />}
                    </div>

                    {/* Textual Insight */}
                    <div className="mb-3">
                        <div className="flex items-start gap-1.5">
                            <Sparkles size={10} className="text-purple-400 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] text-slate-300 leading-tight font-medium">{metrics.spendingInsight}</p>
                        </div>
                    </div>

                    <div className="flex-1 flex items-end justify-between gap-1 pt-1">
                        {metrics.recentLogs.length > 0 ? metrics.recentLogs.map((log, idx) => {
                            const heightPercent = (log.total / metrics.maxLogValue) * 100;
                            return (
                                <div key={idx} className="flex flex-col items-center gap-1 w-full">
                                    <div
                                        className="w-full bg-purple-500/30 rounded-t-sm transition-all duration-500 hover:bg-purple-500 hover:shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                        style={{ height: `${Math.max(heightPercent, 10)}%` }}
                                    ></div>
                                </div>
                            )
                        }) : (
                            <div className="w-full text-center text-[10px] text-slate-500 italic mt-2">
                                No data
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Financial Snapshot (Grid of 3) */}
                <div className="col-span-2 bg-surface border border-white/5 rounded-3xl p-5 shadow-sm hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-3">
                        <Wallet className="text-emerald-400 w-4 h-4" />
                        <span className="text-slate-400 text-xs font-heading font-semibold tracking-wide uppercase">Financial Snapshot ({getDateFilterLabel()})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Avg Spend */}
                        <div className="bg-surfaceHighlight/50 p-3 rounded-2xl border border-white/5 hover:bg-surfaceHighlight hover:border-white/10 transition-all duration-300">
                            <p className="text-[10px] text-slate-500 mb-1 font-medium">Average</p>
                            <p className="text-sm font-bold text-white tabular-nums tracking-tight">€{metrics.avgReceipt.toFixed(0)}</p>
                        </div>
                        {/* Max Spend */}
                        <div className="bg-surfaceHighlight/50 p-3 rounded-2xl border border-white/5 hover:bg-surfaceHighlight hover:border-white/10 transition-all duration-300">
                            <p className="text-[10px] text-slate-500 mb-1 font-medium">Highest</p>
                            <div className="flex items-center gap-1">
                                <p className="text-sm font-bold text-white tabular-nums tracking-tight">€{metrics.maxSingleReceipt.toFixed(0)}</p>
                                <ArrowUpRight size={12} className="text-red-400" />
                            </div>
                        </div>
                        {/* Monthly Comparison (New) */}
                        <div className="bg-surfaceHighlight/50 p-3 rounded-2xl border border-white/5 hover:bg-surfaceHighlight hover:border-white/10 transition-all duration-300">
                            <p className="text-[10px] text-slate-500 mb-1 font-medium">vs Last Month</p>
                            <div className="flex items-center gap-1">
                                <p className={`text-sm font-bold tabular-nums tracking-tight ${metrics.monthDiff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {metrics.monthDiff > 0 ? '+' : ''}{metrics.monthDiff.toFixed(0)}%
                                </p>
                                {metrics.monthDiff > 0 ? <TrendingUp size={12} className="text-red-400" /> : <TrendingDown size={12} className="text-emerald-400" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Top Vendors & Budget Remaining */}
                <div className="col-span-2 grid grid-cols-2 gap-3">
                    <div className="bg-surface border border-white/5 rounded-3xl p-4 shadow-sm hover:border-white/10 transition-all duration-300">
                        <div className="flex items-center gap-2 mb-3">
                            <Store className="text-slate-400 w-3 h-3" />
                            <span className="text-slate-400 text-xs font-heading font-semibold tracking-wide uppercase">Top Vendors</span>
                        </div>
                        <div className="space-y-3">
                            {metrics.topStores.length > 0 ? metrics.topStores.map((store, i) => (
                                <div key={i} className="relative">
                                    <div className="flex justify-between text-[10px] z-10 relative mb-1">
                                        <span className="text-slate-200 truncate max-w-[65%] font-medium">{store.name}</span>
                                        <span className="text-slate-400 tabular-nums">€{store.value.toFixed(0)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${store.percentage}%` }}></div>
                                    </div>
                                </div>
                            )) : (
                                <span className="text-[10px] text-slate-500">No data yet</span>
                            )}
                        </div>
                    </div>

                    <div className="bg-surface border border-white/5 rounded-3xl p-4 shadow-sm flex flex-col justify-center items-center text-center hover:border-white/10 transition-all duration-300">
                        <p className="text-slate-400 text-xs font-heading font-semibold tracking-wide uppercase mb-1">Remaining Budget</p>
                        <p className={`text-2xl font-heading font-bold tracking-tighter tabular-nums ${metrics.totalSpent > monthlyBudget ? 'text-red-400' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]'}`}>
                            €{Math.max(monthlyBudget - metrics.totalSpent, 0).toFixed(0)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                            of €{monthlyBudget} total
                        </p>
                    </div>
                </div>

                {/* 6. Category Breakdown (Linear Bars) */}
                <div className="col-span-2 bg-surface border border-white/5 rounded-3xl p-5 shadow-sm hover:border-white/10 transition-all duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wide">Spending Breakdown</h3>
                        <ShoppingBag className="text-slate-600 w-4 h-4" />
                    </div>
                    <div className="space-y-4">
                        {metrics.categoryData.slice(0, 4).map((d, i) => (
                            <div key={i} onClick={() => {
                                const items = metrics.categoryItems[d.name] || [];
                                if (items.length > 0) setDrillDown({ category: d.name, items });
                            }} className="cursor-pointer group">
                                <div className="flex justify-between items-center text-xs mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: COLORS[d.name], color: COLORS[d.name] }}></div>
                                        <span className="text-slate-200 font-medium group-hover:text-white transition-colors duration-300">{d.name}</span>
                                    </div>
                                    <span className="text-slate-400 font-mono tabular-nums group-hover:text-white transition-colors duration-300">€{d.value.toFixed(0)}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 group-hover:brightness-125 group-hover:shadow-[0_0_10px_currentColor]"
                                        style={{ width: `${d.percentage}%`, backgroundColor: COLORS[d.name], color: COLORS[d.name] }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {metrics.categoryData.length === 0 && (
                            <p className="text-slate-500 text-xs text-center py-2">No spending data yet.</p>
                        )}
                    </div>
                </div>

                {/* 7. Recent Log (Compact List) */}
                <div className="col-span-2">
                    <h3 className="text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-3 ml-1 mt-2">Recent Logs</h3>
                    <div className="space-y-2">
                        {receipts.slice(0, 3).map(r => (
                            <button
                                key={r.id}
                                onClick={() => onViewReceipt?.(r)}
                                className="w-full bg-surface border border-white/5 rounded-2xl p-3 flex justify-between items-center shadow-sm hover:border-white/15 hover:bg-surfaceHighlight transition-all duration-300 text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${r.type === 'bill'
                                        ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.15)]'
                                        : 'bg-surfaceHighlight text-slate-400 border border-white/5'
                                        }`}>
                                        {r.type === 'bill' ? <FileText size={16} /> : r.storeName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-slate-200 text-sm font-semibold tracking-tight group-hover:text-white transition-colors">{r.storeName}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{new Date(r.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {ageRestricted && r.items.some(i => i.isRestricted) && (
                                        <AlertTriangle className="text-amber-500 w-3 h-3" />
                                    )}
                                    <span className={`font-mono text-sm font-bold tracking-tight tabular-nums ${r.type === 'bill' ? 'text-indigo-400' : 'text-white'}`}>
                                        €{r.items.reduce((acc, i) => (!ageRestricted || !i.isRestricted ? acc + i.price : acc), 0).toFixed(2)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Drill Down Modal */}
            {drillDown && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-surface w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-10 duration-500 ring-1 ring-white/10">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-surface/90 sticky top-0 z-10 backdrop-blur-xl">
                            <div>
                                <h2 className="text-xl font-heading font-bold text-white tracking-tight">{drillDown.category}</h2>
                                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                    {drillDown.items.length} items • Total: <span className="text-emerald-400 font-mono font-bold tabular-nums">€{drillDown.items.reduce((acc, i) => acc + i.price, 0).toFixed(2)}</span>
                                </p>
                            </div>
                            <button onClick={() => setDrillDown(null)} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors duration-300">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto custom-scrollbar">
                            <div className="space-y-4 mb-6">
                                {drillDown.items.slice(0, 5).map((item, idx) => {
                                    const maxPrice = Math.max(...drillDown.items.map(i => i.price));
                                    const width = maxPrice > 0 ? (item.price / maxPrice) * 100 : 0;

                                    return (
                                        <div key={idx} className="space-y-1.5">
                                            <div className="flex justify-between text-xs text-slate-400 font-medium">
                                                <span>{item.name.substring(0, 20)}{item.name.length > 20 ? '...' : ''}</span>
                                                <span className="tabular-nums">€{item.price.toFixed(2)}</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full opacity-90 shadow-[0_0_5px_currentColor]"
                                                    style={{ width: `${width}%`, backgroundColor: COLORS[drillDown.category] || '#818cf8', color: COLORS[drillDown.category] || '#818cf8' }}
                                                ></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="space-y-1 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center px-2 pb-2 text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
                                    <span>Item / Date</span>
                                    <span>Price</span>
                                </div>
                                {drillDown.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs p-3 rounded-xl bg-surfaceHighlight/30 hover:bg-surfaceHighlight transition-colors duration-200 border border-white/5 hover:border-white/15">
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-slate-200 font-medium truncate max-w-[200px]">{item.name}</p>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                                <Calendar size={10} />
                                                <span>{new Date(item.date).toLocaleDateString()}</span>
                                                <span className="text-slate-700">•</span>
                                                <span className="text-slate-400">{item.store}</span>
                                            </div>
                                        </div>
                                        <span className="text-emerald-400 font-mono font-bold tabular-nums">€{item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;