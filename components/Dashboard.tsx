import React, { useMemo, useState } from 'react';
import { Receipt, Category } from '../types';
import { ShoppingBag, X, ShieldCheck, FileText, Calendar, Store, ArrowUp, BarChart3, Check, Shield, Sparkles, TrendingUp, TrendingDown, Minus, Wallet, Hash, ArrowUpRight, AlertTriangle, CalendarDays, ArrowRight, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface DashboardProps {
    receipts: Receipt[];
    monthlyBudget: number;
    ageRestricted: boolean;
    onViewReceipt?: (receipt: Receipt) => void;
    onProvisionClick?: () => void;
}

interface DrillDownState {
    category: string;
    items: { name: string; price: number; date: string; store: string }[];
}

type DateFilter = 'all' | 'this_month' | 'last_month';

// Hook for scroll animations
function useInView(options = { threshold: 0.1, rootMargin: '0px' }, triggerOnce = false) {
    const [ref, setRef] = useState<HTMLDivElement | null>(null);
    const [isInView, setIsInView] = useState(false);

    React.useEffect(() => {
        if (!ref) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                if (triggerOnce) observer.disconnect();
            } else {
                if (!triggerOnce) setIsInView(false);
            }
        }, options);

        observer.observe(ref);

        // Fallback: Force visible after 100ms to ensure content shows even if observer fails
        const timeout = setTimeout(() => {
            setIsInView(true);
        }, 100);

        return () => {
            observer.disconnect();
            clearTimeout(timeout);
        };
    }, [ref, options.threshold, options.rootMargin, triggerOnce]);

    return [setRef, isInView] as const;
}

const AnimatedSection: React.FC<{ children: React.ReactNode | ((props: { isInView: boolean }) => React.ReactNode); className?: string; delay?: number; triggerOnce?: boolean; animateContainer?: boolean }> = ({ children, className = "", delay = 0, triggerOnce = false, animateContainer = true }) => {
    const [ref, isInView] = useInView({ threshold: 0.1, rootMargin: '0px' }, triggerOnce);

    const containerClasses = animateContainer
        ? `transition-all duration-1000 ease-out transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`
        : '';

    return (
        <div
            ref={ref}
            className={`${containerClasses} ${className}`}
            style={animateContainer ? { transitionDelay: `${delay}ms` } : {}}
        >
            {typeof children === 'function'
                ? children({ isInView })
                : React.Children.map(children, child => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child as React.ReactElement<any>, { isInView });
                    }
                    return child;
                })
            }
        </div>
    );
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

const Dashboard: React.FC<DashboardProps> = ({ receipts, monthlyBudget, ageRestricted, onViewReceipt, onProvisionClick }) => {
    const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');

    const [chartView, setChartView] = useState<'daily' | 'monthly'>('daily');
    const [insightView, setInsightView] = useState<'daily' | 'monthly'>('monthly');

    // Calculate Metrics
    const metrics = useMemo(() => {
        console.log("Dashboard Receipts:", receipts);

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
            // Store Totals
            storeTotals[r.storeName] = (storeTotals[r.storeName] || 0) + r.items.reduce((s, i) => s + i.price, 0);

            r.items.forEach(i => {
                const cat = i.category || Category.OTHER; // Original category

                // Normalize Category for Aggregation
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
                    else normalizedCat = Category.OTHER;
                }

                categoryTotals[normalizedCat] = (categoryTotals[normalizedCat] || 0) + i.price;
                totalSpent += i.price; // Accumulate total spent here

                // Provision Calculation (using normalized or raw)
                // ... (existing logic is fine, but we can simplify using normalizedCat if we trust it,
                // but let's keep the existing robust check for now to be safe)

                // Check against valid Enum values
                const isEssentialEnum = [Category.FOOD, Category.HEALTH, Category.HOUSEHOLD, Category.EDUCATION].includes(cat as any);
                const isLuxuryEnum = [Category.LUXURY].includes(cat as any);

                // Fallback string checks
                const catLower = typeof cat === 'string' ? cat.toLowerCase() : '';
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
                    store: r.storeName
                });
            });
        });

        const provisionRatio = totalSpent > 0 ? (provisionTotal / totalSpent) * 100 : 0;

        const categoryData = Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value, percentage: totalSpent > 0 ? (value / totalSpent) * 100 : 0 }))
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
            ? Math.max(...filteredReceipts.map(r => r.items.reduce((s, i) => s + i.price, 0)))
            : 0;

        // Recent Spending Trend (Last 5 logs)
        const recentLogs = [...filteredReceipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).reverse();
        const maxLogValue = Math.max(...recentLogs.map(r => r.items.reduce((s, i) => s + i.price, 0)), 1);

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
            const recentAvg = recentSubset.reduce((sum, r) => sum + r.items.reduce((s, i) => s + i.price, 0), 0) / recentSubset.length;

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

        // 1. Daily Activity (Last 7 Days) - FIXED DATE LOGIC
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

            receipts.forEach(r => {
                let rDateStr = r.date;
                if (r.date.includes('T')) {
                    rDateStr = r.date.split('T')[0];
                } else if (r.date.length === 10 && r.date.includes('-')) {
                    // Already YYYY-MM-DD
                } else {
                    try {
                        rDateStr = new Date(r.date).toISOString().split('T')[0];
                    } catch (e) {
                        rDateStr = '';
                    }
                }

                if (rDateStr === dStr) {
                    r.items.forEach(item => {
                        if (ageRestricted && item.isRestricted) return;

                        // Normalize Category
                        let cat = item.category || Category.OTHER;
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

        console.log("Weekly Activity:", weeklyActivity); // Debug log

        // 2. Monthly Comparison
        // 2. Monthly Comparison
        const thisMonthReceipts = receipts.filter(r => {
            // Robust Date Parsing
            let rDate = new Date(r.date);
            if (r.date.includes('-') && !r.date.includes('T')) {
                // Handle YYYY-MM-DD manually to avoid UTC shift
                const parts = r.date.split('-');
                rDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
        });
        const lastMonthReceipts = receipts.filter(r => {
            let rDate = new Date(r.date);
            if (r.date.includes('-') && !r.date.includes('T')) {
                const parts = r.date.split('-');
                rDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return rDate.getMonth() === lastMonth && rDate.getFullYear() === lastMonthYear;
        });

        const thisMonthTotal = thisMonthReceipts.reduce((acc, r) => {
            if (!ageRestricted) return acc + r.total;
            return acc + r.items.reduce((s, i) => !i.isRestricted ? s + i.price : s, 0);
        }, 0);

        const lastMonthTotal = lastMonthReceipts.reduce((acc, r) => {
            if (!ageRestricted) return acc + r.total;
            return acc + r.items.reduce((s, i) => !i.isRestricted ? s + i.price : s, 0);
        }, 0);

        const monthDiff = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

        // 3. Projection
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysPassed = Math.max(now.getDate(), 1);
        const projectedTotal = (thisMonthTotal / daysPassed) * daysInMonth;

        // 4. Six Month Trend Data (for Area Chart)
        const trendData = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(2)}`;

            // Initialize with all categories set to 0
            const monthEntry: any = { name: key, total: 0 };
            Object.values(Category).forEach(cat => {
                monthEntry[cat] = 0;
            });
            // Ensure 'Other' is initialized if it's not in the enum values loop (it is in types.ts but let's be safe)
            if (monthEntry[Category.OTHER] === undefined) monthEntry[Category.OTHER] = 0;

            trendData.push(monthEntry);
        }

        receipts.forEach(r => {
            const d = new Date(r.date);
            const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(2)}`;
            const monthData = trendData.find(m => m.name === key);

            if (monthData) {
                r.items.forEach(item => {
                    // Normalize Category
                    let cat = item.category || Category.OTHER;
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

                    // If category is not in our known list (e.g. from old data), fallback to OTHER
                    if (monthData[cat] === undefined) cat = Category.OTHER;

                    monthData.total += item.price;
                    monthData[cat] += item.price;
                });
            }
        });

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
            thisMonthTotal,
            trendData,
            thisMonthReceipts, // Export for debug
            dailyAverage: daysPassed > 0 ? thisMonthTotal / daysPassed : 0,
            foodRatio: totalSpent > 0 ? ((categoryTotals[Category.FOOD] || 0) / totalSpent) * 100 : 0,
            luxuryRatio: totalSpent > 0 ? (luxuryTotal / totalSpent) * 100 : 0,
            educationRatio: totalSpent > 0 ? ((categoryTotals[Category.EDUCATION] || 0) / totalSpent) * 100 : 0,
            healthRatio: totalSpent > 0 ? ((categoryTotals[Category.HEALTH] || 0) / totalSpent) * 100 : 0,

            // Daily Metrics
            todayTotal: weeklyActivity[weeklyActivity.length - 1]?.total || 0,
            yesterdayTotal: weeklyActivity[weeklyActivity.length - 2]?.total || 0,
            dailyRatios: (() => {
                const today = weeklyActivity[weeklyActivity.length - 1];
                if (!today || today.total === 0) return { education: 0, food: 0, activities: 0, health: 0 };
                return {
                    education: (today[Category.EDUCATION] / today.total) * 100,
                    food: (today[Category.FOOD] / today.total) * 100,
                    activities: (today[Category.LUXURY] / today.total) * 100,
                    health: (today[Category.HEALTH] / today.total) * 100
                };
            })()
        };
    }, [receipts, monthlyBudget, ageRestricted]);


    // COLORS moved outside
    console.log("Dashboard Render - Category Data:", metrics.categoryData);
    console.log("Dashboard Render - Trend Data:", metrics.trendData);

    // const [isMounted, setIsMounted] = useState(false); // No longer needed
    // React.useEffect(() => {
    //     const timer = setTimeout(() => setIsMounted(true), 50);
    //     return () => clearTimeout(timer);
    // }, []);

    const budgetProgress = monthlyBudget > 0 ? (metrics.thisMonthTotal / monthlyBudget) * 100 : 0;
    const isOverBudget = metrics.thisMonthTotal > monthlyBudget;

    // Animated Budget Progress (now driven by isInView)
    // const [animatedBudgetProgress, setAnimatedBudgetProgress] = useState(0);
    // React.useEffect(() => {
    //     if (isMounted) {
    //         setAnimatedBudgetProgress(budgetProgress);
    //     } else {
    //         setAnimatedBudgetProgress(0);
    //     }
    // }, [isMounted, budgetProgress]);

    // Evidence Gauge Calc (for simplified provision card)
    const circumference = 2 * Math.PI * 70; // Adjusted radius for the new simplified card
    const targetOffset = circumference - (metrics.numericEvidenceScore / 100) * circumference;

    const getDateFilterLabel = () => {
        return "All Time"; // Simplified for dashboard
    };

    return (
        <div className="flex flex-col h-full px-4 pt-4 pb-32 overflow-y-auto no-scrollbar bg-background">
            {/* Header */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-6 h-6 text-white fill-white/10" strokeWidth={2} />
                        <h1 className="text-2xl font-heading font-bold text-white tracking-tighter">TrueTrack</h1>
                    </div>

                </div>
                <div className="flex items-center gap-3">
                    {ageRestricted && (
                        <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded-lg">
                            <ShieldCheck className="text-amber-500 w-4 h-4" />
                        </div>
                    )}
                    {/* Removed date filter button as per simplification */}
                    {/* <button
                        onClick={toggleDateFilter}
                        className="bg-surface border border-white/5 rounded-full h-9 px-4 flex items-center justify-center gap-2 transition-all duration-300 hover:bg-surfaceHighlight hover:border-white/20 hover:shadow-md active:shadow-inner"
                    >
                        <Calendar className="text-primary w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wide">{getDateFilterLabel()}</span>
                    </button> */}
                </div>
            </div>

            {/* HERO: Budget Progress */}
            <AnimatedSection delay={100} className="mb-6" animateContainer={false}>
                {({ isInView }: { isInView?: boolean } = {}) => (
                    <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                                    <Wallet className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Monthly Budget</h3>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-heading font-bold text-white tracking-tight">€{metrics.thisMonthTotal.toFixed(2)}</p>
                                        <span className="text-sm text-slate-500 font-medium">/ €{monthlyBudget}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-emerald-400'}`}>
                                    {Math.round(isInView ? budgetProgress : 0)}%
                                </span>
                                <p className="text-xs text-slate-500 font-medium mt-1">{isOverBudget ? 'Over Budget' : 'Used'}</p>
                            </div>
                        </div>
                        <div className="h-4 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5 relative z-10">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor] ${isOverBudget ? 'bg-red-500 text-red-500' : 'bg-emerald-500 text-emerald-500'}`}
                                style={{ width: `${isInView ? Math.min(budgetProgress, 100) : 0}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </AnimatedSection>

            {/* BENTO GRID LAYOUT */}
            <div className="grid grid-cols-2 gap-3 mb-6">



                {/* Monthly Insights (Expanded) */}
                {/* Monthly Insights (Expanded) */}
                <AnimatedSection delay={300} className="col-span-2" animateContainer={false}>
                    {({ isInView }: { isInView?: boolean } = {}) => (
                        <div
                            onClick={onProvisionClick}
                            className="rounded-3xl border border-slate-800 bg-card p-6 shadow-lg cursor-pointer hover:border-slate-700 transition-all"
                        >
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-yellow-500" />
                                        {insightView === 'monthly' ? 'Monthly Insights' : 'Daily Insights'}
                                    </h3>
                                    <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setInsightView('daily'); }}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${insightView === 'daily' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                        >
                                            Daily
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setInsightView('monthly'); }}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${insightView === 'monthly' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                        >
                                            Monthly
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">{insightView === 'monthly' ? 'Daily Avg' : 'Today'}</p>
                                        <p className="text-xl font-bold text-white tabular-nums">€{insightView === 'monthly' ? metrics.dailyAverage.toFixed(0) : metrics.todayTotal.toFixed(0)}</p>
                                    </div>
                                    <div className="h-8 w-px bg-slate-800"></div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">{insightView === 'monthly' ? 'Forecast' : 'Yesterday'}</p>
                                        <p className="text-xl font-bold text-blue-400 tabular-nums">€{insightView === 'monthly' ? metrics.projectedTotal.toFixed(0) : metrics.yesterdayTotal.toFixed(0)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                {/* Helper for Gauges */}
                                {[
                                    { label: 'Education', value: insightView === 'monthly' ? metrics.educationRatio : metrics.dailyRatios.education, color: '#818cf8' }, // Indigo
                                    { label: 'Food', value: insightView === 'monthly' ? metrics.foodRatio : metrics.dailyRatios.food, color: '#fbbf24' }, // Amber
                                    { label: 'Activities', value: insightView === 'monthly' ? metrics.luxuryRatio : metrics.dailyRatios.activities, color: '#f472b6' }, // Pink
                                    { label: 'Health', value: insightView === 'monthly' ? metrics.healthRatio : metrics.dailyRatios.health, color: '#34d399' } // Emerald
                                ].map((gauge, idx) => (
                                    <div key={idx} className="flex flex-col items-center relative">
                                        <div className="h-20 w-20 relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadialBarChart
                                                    key={`${isInView ? 'visible' : 'hidden'}-${idx}`}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="65%"
                                                    outerRadius="100%"
                                                    barSize={8}
                                                    data={[{ value: Math.min(gauge.value, 100), fill: gauge.color }]}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                >
                                                    <PolarAngleAxis
                                                        type="number"
                                                        domain={[0, 100]}
                                                        angleAxisId={0}
                                                        tick={false}
                                                    />
                                                    <RadialBar
                                                        background={{ fill: '#1e293b' }}
                                                        dataKey="value"
                                                        cornerRadius={10}
                                                        isAnimationActive={true}
                                                        animationDuration={1500}
                                                        animationEasing="ease-out"
                                                    />
                                                </RadialBarChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-sm font-bold" style={{ color: gauge.color }}>{gauge.value.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wide mt-1 font-bold text-center">{gauge.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </AnimatedSection>

                {/* Trend (Area Chart) & Top Vendors */}
                <div className="grid grid-cols-2 gap-3 col-span-2">
                    <AnimatedSection className="col-span-2" delay={400} animateContainer={false}>
                        {({ isInView }: { isInView?: boolean } = {}) => (
                            <div className="h-full rounded-2xl border border-slate-800 bg-card p-4 shadow-lg flex flex-col min-h-[300px]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-blue-400" />
                                        Spending Trends
                                    </h3>
                                    <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                                        <button
                                            onClick={() => setChartView('daily')}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${chartView === 'daily' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                        >
                                            Daily
                                        </button>
                                        <button
                                            onClick={() => setChartView('monthly')}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${chartView === 'monthly' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                        >
                                            Monthly
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 w-full -ml-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={chartView === 'daily' ? metrics.weeklyActivity : metrics.trendData}
                                            key={`${chartView}-${isInView ? 'visible' : 'hidden'}`}
                                        >
                                            <defs>
                                                {Object.keys(COLORS).map((cat, index) => (
                                                    <linearGradient key={cat} id={`gradient-${cat}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={COLORS[cat]} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={COLORS[cat]} stopOpacity={0} />
                                                    </linearGradient>
                                                ))}
                                            </defs>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value: number, name: string) => [`€${value.toFixed(2)}`, name]}
                                                labelStyle={{ color: '#94a3b8' }}
                                                wrapperStyle={{ zIndex: 1000 }}
                                            />
                                            <XAxis
                                                dataKey={chartView === 'daily' ? "day" : "name"}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 10 }}
                                                dy={10}
                                            />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                            {Object.keys(COLORS).map((cat) => (
                                                <Area
                                                    key={cat}
                                                    type="monotone"
                                                    dataKey={cat}
                                                    name={cat}
                                                    stackId="1"
                                                    stroke={COLORS[cat]}
                                                    fill={`url(#gradient-${cat})`}
                                                    strokeWidth={2}
                                                    animationDuration={1500}
                                                />
                                            ))}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </AnimatedSection>

                    <AnimatedSection className="col-span-2" delay={500} animateContainer={false}>
                        {({ isInView }: { isInView?: boolean } = {}) => (
                            <div className="h-full rounded-2xl border border-slate-800 bg-card p-5 shadow-lg">
                                <h3 className="text-sm font-medium text-slate-400 mb-4">Top Vendors</h3>
                                <div className="space-y-3">
                                    {metrics.topStores.length > 0 ? (
                                        metrics.topStores.map((store, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-300 truncate max-w-[200px]">{store.name}</span>
                                                    <span className="text-slate-400 tabular-nums">€{store.value.toFixed(0)}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${isInView ? store.percentage : 0}%` }}></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-slate-500 text-center py-4">No data</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </AnimatedSection>
                </div>

                {/* 4. Financial Snapshot (Grid of 3) */}
                <AnimatedSection delay={600} className="col-span-2" animateContainer={false}>
                    <div className="bg-surface border border-white/5 rounded-3xl p-5 shadow-sm hover:border-white/10 transition-all duration-300">
                        <div className="flex items-center gap-2 mb-3">
                            <Wallet className="text-emerald-400 w-4 h-4" />
                            <span className="text-slate-400 text-xs font-heading font-semibold tracking-wide uppercase">Financial Snapshot (All Time)</span>
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
                </AnimatedSection>

                {/* 6. Category Breakdown (Linear Bars) */}
                <div className="col-span-2 bg-surface border border-white/5 rounded-3xl p-5 shadow-sm hover:border-white/10 transition-all duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wide">Spending Breakdown</h3>
                        <ShoppingBag className="text-slate-600 w-4 h-4" />
                    </div>
                    <div className="space-y-4">
                        {metrics.categoryData.slice(0, 4).map((d, i) => (
                            <AnimatedSection key={i} delay={700 + (i * 100)} animateContainer={false}>
                                {({ isInView }: { isInView?: boolean } = {}) => (
                                    <div onClick={() => {
                                        const items = metrics.categoryItems[d.name] || [];
                                        if (items.length > 0) setDrillDown({ category: d.name, items });
                                    }} className="cursor-pointer group">
                                        <div className="flex justify-between items-center text-xs mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: COLORS[d.name] || '#94a3b8', color: COLORS[d.name] || '#94a3b8' }}></div>
                                                <span className="text-slate-200 font-medium group-hover:text-white transition-colors duration-300">{d.name}</span>
                                            </div>
                                            <span className="text-slate-400 font-mono tabular-nums group-hover:text-white transition-colors duration-300">€{d.value.toFixed(0)}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-125 group-hover:shadow-[0_0_10px_currentColor]"
                                                style={{ width: `${isInView ? d.percentage : 0}%`, backgroundColor: COLORS[d.name] || '#94a3b8', color: COLORS[d.name] || '#94a3b8' }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </AnimatedSection>
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
            {/* DEBUG SECTION */}
            <div className="mt-8 p-4 bg-black/50 rounded-xl border border-white/10 text-[10px] text-slate-400 font-mono text-left">
                <p className="text-white font-bold mb-2">DEBUG CALCULATION:</p>
                <p>Age Restricted: {ageRestricted ? 'ON' : 'OFF'}</p>
                <p>Calculated Total: €{metrics.thisMonthTotal.toFixed(2)}</p>
                <p className="mt-2 mb-1 text-white">Receipts included in this month:</p>
                <div className="space-y-1">
                    {metrics.thisMonthReceipts.map((r, i) => (
                        <div key={i} className="flex justify-between border-b border-white/5 pb-1">
                            <span>{r.date} - {r.storeName}</span>
                            <span>€{r.total.toFixed(2)}</span>
                        </div>
                    ))}
                    {metrics.thisMonthReceipts.length === 0 && <p>No receipts found for this month.</p>}
                </div>

                <p className="mt-4 mb-1 text-white border-t border-white/10 pt-2">Last 5 Receipts (All Time):</p>
                <div className="space-y-1">
                    {receipts.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex justify-between border-b border-white/5 pb-1">
                            <span>{r.date} - {r.storeName}</span>
                            <span>€{r.total.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-20"></div>
        </div>
    );
};

export default Dashboard;