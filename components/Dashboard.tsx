import React, { useMemo, useState } from 'react';
import { Receipt, Category, CategoryDefinition, Goal, GoalType } from '../types';
import { Target, TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, PieChart, Shield, ShieldCheck, Calendar, Wallet, ArrowRight, Sparkles, Trophy, Pizza, Beer, Cigarette, Gamepad2, Dices, Coffee, Cookie, ShoppingCart, Shirt, Car, Tv, PiggyBank, ShoppingBag, X, FileText, Store, ArrowUp, BarChart3, Check, Hash, ArrowUpRight, CalendarDays, Activity, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface DashboardProps {
    receipts: Receipt[];
    monthlyBudget: number;
    ageRestricted: boolean;
    childSupportMode: boolean;
    categories: CategoryDefinition[];
    categoryBudgets: Record<string, number>;
    onViewReceipt?: (receipt: Receipt) => void;
    onProvisionClick?: () => void;
    onSettlementClick?: () => void;
    onCustodyClick?: () => void;
    goals?: Goal[];
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

const Dashboard: React.FC<DashboardProps> = ({ receipts, monthlyBudget, ageRestricted, childSupportMode, categories, categoryBudgets, onViewReceipt, onProvisionClick, onSettlementClick, onCustodyClick, goals = [] }) => {
    const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');

    const [chartView, setChartView] = useState<'week' | 'month' | 'year'>('week');
    const [insightView, setInsightView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [goalView, setGoalView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [showIndicators, setShowIndicators] = useState(false);

    // Helper to get category color
    const getCategoryColor = (catName: string) => {
        const cat = (categories || []).find(c => c.name === catName || c.id === catName.toLowerCase());
        return cat ? cat.color : '#94a3b8';
    };

    // Goal Colors Mapping
    const GOAL_COLORS: Record<string, string> = {
        [GoalType.JUNK_FOOD]: '#f97316', // Orange
        [GoalType.ALCOHOL]: '#ef4444',   // Red
        [GoalType.SMOKING]: '#64748b',   // Slate
        [GoalType.GAMING]: '#a855f7',    // Purple
        [GoalType.SAVINGS]: '#10b981',   // Emerald
        [GoalType.CAFFEINE]: '#d97706',  // Amber
        [GoalType.SUGAR]: '#ec4899',     // Pink
        [GoalType.ONLINE_SHOPPING]: '#3b82f6', // Blue
        [GoalType.GAMBLING]: '#e11d48',  // Rose
        [GoalType.FAST_FASHION]: '#d946ef', // Fuchsia
        [GoalType.RIDE_SHARING]: '#0ea5e9', // Sky
        [GoalType.STREAMING]: '#8b5cf6',    // Violet
    };

    // Goal Gauge Component
    const GoalGauge = ({ goal, total, isInView = false, trend, intensity, showIndicators }: { goal: Goal, total: number, isInView?: boolean, trend?: 'up' | 'down' | 'flat', intensity?: 'low' | 'medium' | 'high', showIndicators?: boolean }) => {
        let color = GOAL_COLORS[goal.type] || '#a855f7';

        // Traffic Light Logic
        if (showIndicators) {
            if (intensity === 'high') color = '#ef4444'; // Red
            else if (intensity === 'medium') color = '#eab308'; // Yellow
            else color = '#22c55e'; // Green
        }

        // Mock target for now (e.g., €100 limit per goal)
        const limit = 100;
        const percentage = Math.min((total / limit) * 100, 100);

        // Icon Mapping
        const getIcon = () => {
            const iconProps = { size: 20, style: { color: color } }; // Slightly smaller icon for 80px gauge
            switch (goal.type) {
                case GoalType.JUNK_FOOD: return <Pizza {...iconProps} />;
                case GoalType.ALCOHOL: return <Beer {...iconProps} />;
                case GoalType.SMOKING: return <Cigarette {...iconProps} />;
                case GoalType.GAMING: return <Gamepad2 {...iconProps} />;
                case GoalType.GAMBLING: return <Dices {...iconProps} />;
                case GoalType.CAFFEINE: return <Coffee {...iconProps} />;
                case GoalType.SUGAR: return <Cookie {...iconProps} />;
                case GoalType.ONLINE_SHOPPING: return <ShoppingCart {...iconProps} />;
                case GoalType.FAST_FASHION: return <Shirt {...iconProps} />;
                case GoalType.RIDE_SHARING: return <Car {...iconProps} />;
                case GoalType.STREAMING: return <Tv {...iconProps} />;
                case GoalType.SAVINGS: return <PiggyBank {...iconProps} />;
                default: return <Target {...iconProps} />;
            }
        };

        return (
            <div className="flex flex-col items-center relative">
                <div className="h-20 w-20 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            key={isInView ? 'visible' : 'hidden'}
                            cx="50%"
                            cy="50%"
                            innerRadius="65%"
                            outerRadius="100%"
                            barSize={8}
                            data={[{ value: percentage, fill: color }]}
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
                        {getIcon()}
                    </div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wide text-center ${showIndicators && intensity === 'high' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-slate-400'}`}>
                        €{total.toFixed(0)}
                    </span>
                    {showIndicators && trend && (
                        <span className={`${trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {trend === 'up' ? <TrendingUp size={10} /> : trend === 'down' ? <TrendingDown size={10} /> : <Minus size={10} />}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    // Calculate Metrics
    const metrics = useMemo(() => {
        console.log("Dashboard Receipts:", receipts);

        // 1. Filter Receipts based on Date Filter
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const filteredReceipts = (receipts || []).filter(r => {
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
        const thisMonthReceipts = (receipts || []).filter(r => {
            // Robust Date Parsing
            let rDate = new Date(r.date);
            if (r.date.includes('-') && !r.date.includes('T')) {
                // Handle YYYY-MM-DD manually to avoid UTC shift
                const parts = r.date.split('-');
                rDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
        });
        const lastMonthReceipts = (receipts || []).filter(r => {
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

        // 2b. Weekly Activity (Last 12 Weeks)
        const weeklyData = [];
        const weeksToShow = 12;

        // Helper to get week number
        const getWeekNumber = (d: Date) => {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };

        // Generate last 12 weeks keys
        const currentWeekDate = new Date();
        // Align to end of current week (Sunday)
        currentWeekDate.setDate(currentWeekDate.getDate() + (7 - currentWeekDate.getDay()));

        for (let i = weeksToShow - 1; i >= 0; i--) {
            const d = new Date(currentWeekDate);
            d.setDate(d.getDate() - (i * 7));

            // Format: "W23" or "Oct 12" (Start date)
            const weekStart = new Date(d);
            weekStart.setDate(weekStart.getDate() - 6);
            const label = `${weekStart.getDate()} ${weekStart.toLocaleString('default', { month: 'short' })}`;

            const weekEntry: any = {
                name: label,
                weekNum: getWeekNumber(d),
                year: d.getFullYear(),
                total: 0
            };

            Object.values(Category).forEach(cat => {
                weekEntry[cat] = 0;
            });
            if (weekEntry[Category.OTHER] === undefined) weekEntry[Category.OTHER] = 0;

            weeklyData.push(weekEntry);
        }

        // Populate Weekly Data
        receipts.forEach(r => {
            const d = new Date(r.date);
            const rWeekNum = getWeekNumber(d);
            const rYear = d.getFullYear();

            // Find matching week in our generated range
            // Simple match might fail across years, so we check if the date falls within the week range
            const match = (weeklyData || []).find(w => {
                // Parse label back to date for range check or use weekNum/Year
                // Let's use weekNum/Year for simplicity, handling year boundaries
                return w.weekNum === rWeekNum && w.year === rYear;
            });

            if (match) {
                r.items.forEach(item => {
                    if (ageRestricted && item.isRestricted) return;

                    // Normalize Category (Reuse existing logic or extract to helper)
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
                    if (match[cat] === undefined) cat = Category.OTHER;

                    match[cat] += item.price;
                    match.total += item.price;
                });
            }
        });

        // 3. Projection
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysPassed = Math.max(now.getDate(), 1);
        const projectedTotal = (thisMonthTotal / daysPassed) * daysInMonth;

        // 4. Year Trend Data (Last 12 Months)
        const yearData = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();

        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(2)}`;

            // Initialize with all categories set to 0
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

            const dayEntry: any = { label, date: d.toISOString().split('T')[0], total: 0 };
            Object.values(Category).forEach(cat => {
                dayEntry[cat] = 0;
            });
            if (dayEntry[Category.OTHER] === undefined) dayEntry[Category.OTHER] = 0;
            monthData.push(dayEntry);
        }

        // Update Weekly Activity to use 'label' instead of 'day' for consistency
        const weekData = (weeklyActivity || []).map(d => ({ ...d, label: d.day }));

        receipts.forEach(r => {
            const d = new Date(r.date);

            // Populate Year Data
            const yearKey = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(2)}`;
            const yearEntry = (yearData || []).find(m => m.label === yearKey);

            // Populate Month Data
            const rDateStr = r.date.split('T')[0];
            const monthEntry = (monthData || []).find(m => m.date === rDateStr);

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

                // Update Year Data
                if (yearEntry) {
                    if (yearEntry[cat] === undefined) cat = Category.OTHER;
                    yearEntry.total += item.price;
                    yearEntry[cat] += item.price;
                }

                // Update Month Data
                if (monthEntry) {
                    // Reset cat if needed (though it should be same)
                    let mCat = cat;
                    if (monthEntry[mCat] === undefined) mCat = Category.OTHER;
                    monthEntry.total += item.price;
                    monthEntry[mCat] += item.price;
                }
            });
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
            trendData: yearData, // Keep for backward compatibility if needed, but we use yearData now
            yearData,
            monthData,
            weekData,
            weeklyData,
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
            })(),

            // Weekly Metrics
            weeklyAverage: weeklyData.length > 0 ? weeklyData.reduce((acc, w) => acc + w.total, 0) / weeklyData.length : 0,
            thisWeekTotal: weeklyData[weeklyData.length - 1]?.total || 0,
            lastWeekTotal: weeklyData[weeklyData.length - 2]?.total || 0,
            weeklyRatios: (() => {
                const thisWeek = weeklyData[weeklyData.length - 1];
                if (!thisWeek || thisWeek.total === 0) return { education: 0, food: 0, activities: 0, health: 0 };
                return {
                    education: (thisWeek[Category.EDUCATION] / thisWeek.total) * 100,
                    food: (thisWeek[Category.FOOD] / thisWeek.total) * 100,
                    activities: (thisWeek[Category.LUXURY] / thisWeek.total) * 100,
                    health: (thisWeek[Category.HEALTH] / thisWeek.total) * 100
                };
            })(),

            // Smart Insights Logic
            smartInsights: (() => {
                const insights: { type: 'warning' | 'info' | 'success', title: string, message: string, icon: React.ReactNode }[] = [];

                // 1. Budget Warning
                if (monthlyBudget > 0) {
                    const usage = thisMonthTotal / monthlyBudget;
                    if (usage > 1.0) {
                        insights.push({
                            type: 'warning',
                            title: 'Over Budget',
                            message: `You've exceeded your monthly budget by €${(thisMonthTotal - monthlyBudget).toFixed(0)}. Consider reducing discretionary spending.`,
                            icon: <AlertTriangle size={16} />
                        });
                    } else if (usage > 0.85) {
                        insights.push({
                            type: 'warning',
                            title: 'Approaching Limit',
                            message: `You've used ${(usage * 100).toFixed(0)}% of your budget. Be careful with upcoming expenses.`,
                            icon: <AlertTriangle size={16} />
                        });
                    }
                }

                // 2. Top Category Analysis
                if (topStores.length > 0) {
                    const topCat = categoryData[0]; // Assuming sorted by value
                    if (topCat && topCat.value > (thisMonthTotal * 0.4)) {
                        insights.push({
                            type: 'info',
                            title: `High Spending on ${topCat.name}`,
                            message: `${topCat.name} accounts for ${(topCat.percentage).toFixed(0)}% of your spending this month.`,
                            icon: <PieChart size={16} />
                        });
                    }
                }

                // 3. Positive Reinforcement
                if (monthlyBudget > 0 && thisMonthTotal < (monthlyBudget * 0.5) && new Date().getDate() > 15) {
                    insights.push({
                        type: 'success',
                        title: 'Great Progress',
                        message: `You're halfway through the month and well under budget!`,
                        icon: <TrendingDown size={16} />
                    });
                }

                // 4. Goal Tracking & Gamification
                if (goals && goals.length > 0) {
                    goals.filter(g => g.isEnabled).forEach(goal => {
                        // Calculate spending for this goal in current month
                        let goalSpending = 0;
                        let goalItemsCount = 0;

                        thisMonthReceipts.forEach(receipt => {
                            receipt.items.forEach(item => {
                                const itemName = item.name.toLowerCase();
                                const storeName = receipt.storeName.toLowerCase();
                                if (goal.keywords.some(k => itemName.includes(k) || storeName.includes(k))) {
                                    goalSpending += item.price * (item.quantity || 1);
                                    goalItemsCount++;
                                }
                            });
                        });

                        if (goalSpending > 0) {
                            insights.push({
                                type: 'warning',
                                title: `${goal.name} Alert`,
                                message: `You've spent €${goalSpending.toFixed(2)} on ${goal.name.toLowerCase()} items this month.`,
                                icon: <Target size={16} className="text-purple-400" />
                            });
                        } else if (new Date().getDate() > 7) {
                            // Reward for 0 spending if it's been at least a week
                            insights.push({
                                type: 'success',
                                title: `${goal.name} Streak!`,
                                message: `Great job! You haven't spent anything on ${goal.name.toLowerCase()} this month!`,
                                icon: <Trophy size={16} className="text-yellow-400" />
                            });
                        }

                        // 5. Savings Projection (New)
                        if (goalSpending > 0) {
                            const daysPassed = Math.max(new Date().getDate(), 1);
                            const dailyAvg = goalSpending / daysPassed;
                            const monthlySavings = dailyAvg * 30;
                            const yearlySavings = dailyAvg * 365;

                            if (monthlySavings > 20) { // Only show if significant
                                insights.push({
                                    type: 'info',
                                    title: `Potential Savings 💰`,
                                    message: `Cutting out ${goal.name} could save you ~€${monthlySavings.toFixed(0)}/mo or €${yearlySavings.toFixed(0)}/yr!`,
                                    icon: <PiggyBank size={16} className="text-emerald-400" />
                                });
                            }
                        }
                    });
                }

                return insights.slice(0, 3); // Limit to 3 insights
            })()
        };
    }, [receipts, monthlyBudget, ageRestricted, dateFilter, goals]);


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
                                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
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
                                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_currentColor] opacity-90 ${isOverBudget ? 'bg-red-500 text-red-500' : 'bg-emerald-500 text-emerald-500'}`}
                                style={{ width: `${isInView ? Math.min(budgetProgress, 100) : 0}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </AnimatedSection>

            {/* Goal Breakdown Chart */}
            {goals && goals.some(g => g.isEnabled) ? (
                <AnimatedSection delay={300} className="mb-6" animateContainer={false}>
                    {({ isInView }: { isInView?: boolean } = {}) => {
                        // Filter receipts based on goalView
                        const filteredGoalReceipts = useMemo(() => {
                            const now = new Date();
                            return receipts.filter(r => {
                                const rDate = new Date(r.date);
                                if (goalView === 'daily') {
                                    return rDate.toDateString() === now.toDateString();
                                } else if (goalView === 'weekly') {
                                    const oneWeekAgo = new Date();
                                    oneWeekAgo.setDate(now.getDate() - 7);
                                    return rDate >= oneWeekAgo;
                                } else {
                                    return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
                                }
                            });
                        }, [receipts, goalView]);

                        // Calculate Previous Period Data for Trends
                        const previousGoalReceipts = useMemo(() => {
                            const now = new Date();
                            return receipts.filter(r => {
                                const rDate = new Date(r.date);
                                if (goalView === 'daily') {
                                    const yesterday = new Date();
                                    yesterday.setDate(now.getDate() - 1);
                                    return rDate.toDateString() === yesterday.toDateString();
                                } else if (goalView === 'weekly') {
                                    const oneWeekAgo = new Date();
                                    oneWeekAgo.setDate(now.getDate() - 7);
                                    const twoWeeksAgo = new Date();
                                    twoWeeksAgo.setDate(now.getDate() - 14);
                                    return rDate >= twoWeeksAgo && rDate < oneWeekAgo;
                                } else {
                                    const lastMonth = new Date();
                                    lastMonth.setMonth(now.getMonth() - 1);
                                    return rDate.getMonth() === lastMonth.getMonth() && rDate.getFullYear() === lastMonth.getFullYear();
                                }
                            });
                        }, [receipts, goalView]);

                        return (
                            <div className="rounded-3xl border border-slate-800 bg-card p-6 shadow-lg transition-all">
                                <div className="mb-6">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                                <Target className="w-4 h-4 text-purple-400" />
                                                Goal Breakdown
                                            </h3>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowIndicators(!showIndicators); }}
                                                className={`p-1.5 rounded-lg transition-all ${showIndicators ? 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-slate-800/50 text-slate-500 hover:text-slate-300'}`}
                                                title="Toggle Impact Mode"
                                            >
                                                <Zap size={14} fill={showIndicators ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                        <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                                            {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                                                <button
                                                    key={view}
                                                    onClick={(e) => { e.stopPropagation(); setGoalView(view); }}
                                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${goalView === view ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                                >
                                                    {view.charAt(0).toUpperCase() + view.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className={`relative z-10 w-full ${goals.filter(g => g.isEnabled).length === 1 ? 'flex justify-center py-8' : 'grid grid-cols-4 gap-4'}`}>
                                    {goals.filter(g => g.isEnabled).map(goal => {
                                        let total = 0;
                                        filteredGoalReceipts.forEach(r => {
                                            r.items.forEach(i => {
                                                const matchesKeyword = goal.keywords.some(k => i.name.toLowerCase().includes(k) || r.storeName.toLowerCase().includes(k));
                                                if (i.goalType === goal.type || matchesKeyword) {
                                                    total += i.price * (i.quantity || 1);
                                                }
                                            });
                                        });

                                        let prevTotal = 0;
                                        previousGoalReceipts.forEach(r => {
                                            r.items.forEach(i => {
                                                const matchesKeyword = goal.keywords.some(k => i.name.toLowerCase().includes(k) || r.storeName.toLowerCase().includes(k));
                                                if (i.goalType === goal.type || matchesKeyword) {
                                                    prevTotal += i.price * (i.quantity || 1);
                                                }
                                            });
                                        });

                                        // Determine Trend
                                        let trend: 'up' | 'down' | 'flat' = 'flat';
                                        if (total > prevTotal * 1.1) trend = 'up';
                                        else if (total < prevTotal * 0.9) trend = 'down';

                                        // Determine Intensity (Mock Limit 100)
                                        let intensity: 'low' | 'medium' | 'high' = 'low';
                                        if (total > 80) intensity = 'high';
                                        else if (total > 50) intensity = 'medium';

                                        return (
                                            <div key={goal.id} className="flex justify-center w-full">
                                                <GoalGauge
                                                    goal={goal}
                                                    total={total}
                                                    isInView={isInView}
                                                    trend={trend}
                                                    intensity={intensity}
                                                    showIndicators={showIndicators}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {goals.filter(g => g.isEnabled).every(g => {
                                    let total = 0;
                                    filteredGoalReceipts.forEach(r => {
                                        r.items.forEach(i => {
                                            const matchesKeyword = g.keywords.some(k => i.name.toLowerCase().includes(k) || r.storeName.toLowerCase().includes(k));
                                            if (i.goalType === g.type || matchesKeyword) {
                                                total += i.price * (i.quantity || 1);
                                            }
                                        });
                                    });
                                    return total === 0;
                                }) && (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="bg-slate-800/50 px-6 py-3 rounded-full border border-white/5 text-slate-400 text-xs font-medium">
                                                No goal spending detected for this period! 🎉
                                            </div>
                                        </div>
                                    )}
                            </div>
                        );
                    }}
                </AnimatedSection>
            ) : (
                <AnimatedSection delay={300} className="mb-6">
                    <div className="rounded-3xl border border-slate-800 bg-card p-6 shadow-lg relative overflow-hidden flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2 uppercase tracking-wide mb-1">
                                <Target className="w-4 h-4 text-purple-400" />
                                Track Your Habits
                            </h3>
                            <p className="text-xs text-slate-500">Enable goals in settings to track spending.</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <ArrowRight size={16} className="text-purple-400" />
                        </div>
                    </div>
                </AnimatedSection>
            )}

            {/* BENTO GRID LAYOUT */}
            <div className="grid grid-cols-2 gap-3 mb-6">



                {/* Monthly Insights (Expanded) */}
                {/* Monthly Insights (Expanded) */}
                <AnimatedSection delay={300} className="col-span-2" animateContainer={false}>
                    {({ isInView }: { isInView?: boolean } = {}) => (
                        <div
                            onClick={childSupportMode ? onProvisionClick : undefined}
                            className={`rounded-3xl border border-slate-800 bg-card p-6 shadow-lg transition-all ${childSupportMode ? 'cursor-pointer hover:border-slate-700' : ''} `}
                        >
                            <div className="mb-6">

                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-yellow-500" />
                                        Insights
                                    </h3>
                                    <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setInsightView('daily'); }}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${insightView === 'daily' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'} `}
                                        >
                                            Daily
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setInsightView('weekly'); }}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${insightView === 'weekly' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'} `}
                                        >
                                            Weekly
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setInsightView('monthly'); }}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${insightView === 'monthly' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'} `}
                                        >
                                            Monthly
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">
                                            {insightView === 'monthly' ? 'Daily Avg' : insightView === 'weekly' ? 'Weekly Avg' : 'Today'}
                                        </p>
                                        <p className="text-xl font-bold text-white tabular-nums">
                                            €{insightView === 'monthly' ? metrics.dailyAverage.toFixed(0) : insightView === 'weekly' ? metrics.weeklyAverage.toFixed(0) : metrics.todayTotal.toFixed(0)}
                                        </p>
                                    </div>
                                    <div className="h-8 w-px bg-slate-800"></div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">
                                            {insightView === 'monthly' ? 'Forecast' : insightView === 'weekly' ? 'This Week' : 'Yesterday'}
                                        </p>
                                        <p className="text-xl font-bold text-blue-400 tabular-nums">
                                            €{insightView === 'monthly' ? metrics.projectedTotal.toFixed(0) : insightView === 'weekly' ? metrics.thisWeekTotal.toFixed(0) : metrics.yesterdayTotal.toFixed(0)}
                                        </p>
                                    </div>
                                    {childSupportMode && (
                                        <>
                                            <div className="h-8 w-px bg-slate-800"></div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">Evidence</p>
                                                <p className={`text-xl font-bold tabular-nums ${metrics.evidenceColor} `}>{metrics.evidenceLabel}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                {/* Helper for Gauges */}
                                {[
                                    { label: 'Education', value: insightView === 'monthly' ? metrics.educationRatio : insightView === 'weekly' ? metrics.weeklyRatios.education : metrics.dailyRatios.education, color: '#818cf8' }, // Indigo
                                    { label: 'Food', value: insightView === 'monthly' ? metrics.foodRatio : insightView === 'weekly' ? metrics.weeklyRatios.food : metrics.dailyRatios.food, color: '#fbbf24' }, // Amber
                                    { label: 'Activities', value: insightView === 'monthly' ? metrics.luxuryRatio : insightView === 'weekly' ? metrics.weeklyRatios.activities : metrics.dailyRatios.activities, color: '#f472b6' }, // Pink
                                    { label: 'Health', value: insightView === 'monthly' ? metrics.healthRatio : insightView === 'weekly' ? metrics.weeklyRatios.health : metrics.dailyRatios.health, color: '#34d399' } // Emerald
                                ].map((gauge, idx) => (
                                    <div key={idx} className="flex flex-col items-center relative">
                                        <div className="h-20 w-20 relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadialBarChart
                                                    key={`${isInView ? 'visible' : 'hidden'} -${idx} `}
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

                            {/* Smart Suggestions */}
                            {metrics.smartInsights.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 text-purple-400" />
                                        Smart Suggestions
                                    </h4>
                                    {metrics.smartInsights.map((insight, idx) => (
                                        <div key={idx} className={`p-3 rounded-xl border flex items-start gap-3 ${insight.type === 'warning' ? 'bg-red-500/10 border-red-500/20' : insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-blue-500/10 border-blue-500/20'} `}>
                                            <div className={`mt-0.5 ${insight.type === 'warning' ? 'text-red-400' : insight.type === 'success' ? 'text-emerald-400' : 'text-blue-400'} `}>
                                                {insight.icon}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${insight.type === 'warning' ? 'text-red-300' : insight.type === 'success' ? 'text-emerald-300' : 'text-blue-300'} `}>{insight.title}</p>
                                                <p className="text-[10px] text-slate-400 leading-relaxed">{insight.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </AnimatedSection>

                {/* Co-Parenting Cards */}
                {childSupportMode && (
                    <div className="col-span-2 grid grid-cols-2 gap-3">
                        {/* Settlement Card Removed */}

                        <AnimatedSection delay={300}>
                            {({ isInView }: { isInView?: boolean } = {}) => (
                                <button
                                    onClick={onCustodyClick}
                                    className="w-full h-full rounded-2xl border border-slate-800 bg-card p-4 shadow-lg flex flex-col justify-between group hover:border-slate-700 transition-all"
                                >
                                    <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-400 w-fit mb-3 group-hover:scale-110 transition-transform">
                                        <CalendarDays size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-slate-200">Custody</h3>
                                        <p className="text-[10px] text-slate-500 font-medium">Track days</p>
                                    </div>
                                </button>
                            )}
                        </AnimatedSection>
                    </div>
                )}

                {/* Category Budgets */}
                <AnimatedSection delay={200}>
                    {({ isInView }: { isInView?: boolean } = {}) => {
                        // Calculate category spending
                        const categorySpending = useMemo(() => {
                            const spending: Record<string, number> = {};
                            const currentMonth = new Date().getMonth();
                            const currentYear = new Date().getFullYear();

                            receipts.forEach(r => {
                                const rDate = new Date(r.date);
                                if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
                                    r.items.forEach(item => {
                                        // Map item category to ID
                                        const catId = (categories || []).find(c => c.name === item.category || c.id === item.category.toLowerCase())?.id || item.category.toLowerCase();
                                        spending[catId] = (spending[catId] || 0) + item.price;
                                    });
                                }
                            });
                            return spending;
                        }, [receipts, categories]);

                        // Get categories with budgets
                        const budgetedCategories = (categories || []).filter(c => (categoryBudgets[c.id] || 0) > 0);

                        if (budgetedCategories.length === 0) return null;

                        return (
                            <div className="rounded-2xl border border-slate-800 bg-card p-4 shadow-lg mb-3">
                                <div className="flex items-center gap-2 mb-4">
                                    <PieChart className="w-4 h-4 text-emerald-400" />
                                    <h3 className="text-sm font-medium text-slate-400">Category Budgets</h3>
                                </div>
                                <div className="space-y-4">
                                    {budgetedCategories.map(cat => {
                                        const budget = categoryBudgets[cat.id];
                                        const spent = categorySpending[cat.id] || 0;
                                        const percentage = Math.min((spent / budget) * 100, 100);
                                        const isOverBudget = spent > budget;

                                        return (
                                            <div key={cat.id}>
                                                <div className="flex justify-between items-center text-xs mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                                        <span className="text-slate-200 font-medium">{cat.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`font-mono tabular-nums ${isOverBudget ? 'text-red-400 font-bold' : 'text-slate-300'} `}>€{spent.toFixed(0)}</span>
                                                        <span className="text-slate-600">/</span>
                                                        <span className="text-slate-500 font-mono tabular-nums">€{budget}</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'} `}
                                                        style={{ width: `${isInView ? percentage : 0}% `, backgroundColor: isOverBudget ? '#ef4444' : cat.color }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }}
                </AnimatedSection>

                {/* Trend (Area Chart) & Top Vendors */}
                <div className="grid grid-cols-2 gap-3 col-span-2">
                    <AnimatedSection className="col-span-2" delay={400} animateContainer={false}>
                        {({ isInView }: { isInView?: boolean } = {}) => (
                            <div className="h-full rounded-2xl border border-slate-800 bg-card p-3 shadow-lg flex flex-col min-h-[280px]">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-blue-400" />
                                        Trends
                                    </h3>
                                    <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                                        <button
                                            onClick={() => setChartView('week')}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${chartView === 'week' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'} `}
                                        >
                                            Week
                                        </button>
                                        <button
                                            onClick={() => setChartView('month')}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${chartView === 'month' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'} `}
                                        >
                                            Month
                                        </button>
                                        <button
                                            onClick={() => setChartView('year')}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${chartView === 'year' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'} `}
                                        >
                                            Year
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={chartView === 'week' ? metrics.weekData : chartView === 'month' ? metrics.monthData : metrics.yearData}
                                            key={`${chartView} -${isInView ? 'visible' : 'hidden'} `}
                                            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                {categories.map((cat) => (
                                                    <linearGradient key={cat.id} id={`gradient - trend - ${cat.name} `} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={cat.color} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={cat.color} stopOpacity={0} />
                                                    </linearGradient>
                                                ))}
                                            </defs>
                                            <XAxis dataKey="label" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} width={40} />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                            {categories.map((cat) => (
                                                <Area
                                                    key={cat.id}
                                                    type="monotone"
                                                    dataKey={cat.name}
                                                    stackId="1"
                                                    stroke={cat.color}
                                                    fill={`url(#gradient-trend-${cat.name})`}
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div >
                            </div >
                        )}
                    </AnimatedSection >

                    <AnimatedSection className="col-span-2" delay={500} animateContainer={false}>
                        {({ isInView }: { isInView?: boolean } = {}) => (
                            <div className="h-full rounded-2xl border border-slate-800 bg-card p-5 shadow-lg">
                                <h3 className="text-sm font-medium text-slate-400 mb-4">Top Vendors</h3>
                                <div className="space-y-3">
                                    {metrics.topStores.length > 0 ? (
                                        (metrics.topStores || []).map((store, idx) => (
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
                </div >

                {/* 4. Financial Snapshot (Grid of 3) */}
                < AnimatedSection delay={600} className="col-span-2" animateContainer={false} >
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
                </AnimatedSection >

                {/* 6. Category Breakdown (Linear Bars) */}
                < div className="col-span-2 bg-surface border border-white/5 rounded-3xl p-5 shadow-sm hover:border-white/10 transition-all duration-300" >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wide">Spending Breakdown</h3>
                        <ShoppingBag className="text-slate-600 w-4 h-4" />
                    </div>
                    <div className="space-y-4">
                        {(metrics.categoryData || []).slice(0, 4).map((d, i) => (
                            <AnimatedSection key={i} delay={700 + (i * 100)} animateContainer={false}>
                                {({ isInView }: { isInView?: boolean } = {}) => (
                                    <div onClick={() => {
                                        const items = metrics.categoryItems[d.name] || [];
                                        if (items.length > 0) setDrillDown({ category: d.name, items });
                                    }} className="cursor-pointer group">
                                        <div className="flex justify-between items-center text-xs mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: getCategoryColor(d.name) || '#94a3b8', color: getCategoryColor(d.name) || '#94a3b8' }}></div>
                                                <span className="text-slate-200 font-medium group-hover:text-white transition-colors duration-300">{d.name}</span>
                                            </div>
                                            <span className="text-slate-400 font-mono tabular-nums group-hover:text-white transition-colors duration-300">€{d.value.toFixed(0)}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-125 group-hover:shadow-[0_0_15px_currentColor]"
                                                style={{ width: `${isInView ? d.percentage : 0}%`, backgroundColor: getCategoryColor(d.name) || '#94a3b8', color: getCategoryColor(d.name) || '#94a3b8' }}
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
                </div >

                {/* 7. Recent Log (Compact List) */}
                < div className="col-span-2" >
                    <h3 className="text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-3 ml-1 mt-2">Recent Logs</h3>
                    <div className="space-y-2">
                        {(receipts || []).slice(0, 3).map(r => (
                            <button
                                key={r.id}
                                onClick={() => onViewReceipt?.(r)}
                                className="w-full bg-surface border border-white/5 rounded-2xl p-3 flex justify-between items-center shadow-sm hover:border-white/15 hover:bg-surfaceHighlight transition-all duration-300 text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${r.type === 'bill'
                                        ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
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
                </div >

            </div >

            {/* Drill Down Modal */}
            {
                drillDown && (
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
                                    {(drillDown.items || []).slice(0, 5).map((item, idx) => {
                                        const maxPrice = Math.max(...(drillDown.items || []).map(i => i.price));
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
                                                        style={{ width: `${width}%`, backgroundColor: getCategoryColor(drillDown.category) || '#818cf8', color: getCategoryColor(drillDown.category) || '#818cf8' }}
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
                                    {(drillDown.items || []).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-surfaceHighlight/30 hover:bg-surfaceHighlight transition-colors duration-200 border border-white/5 hover:border-white/15">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm" style={{ backgroundColor: getCategoryColor(item.category) }}>
                                                {item.category.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{item.store}</p>
                                                <p className="text-xs text-slate-400 truncate">{item.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-white tabular-nums">€{item.total.toFixed(2)}</p>
                                                <p className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* DEBUG SECTION */}
            <div className="mt-8 p-4 bg-black/50 rounded-xl border border-white/10 text-[10px] text-slate-400 font-mono text-left">
                <p className="text-white font-bold mb-2">DEBUG CALCULATION:</p>
                <p>Age Restricted: {ageRestricted ? 'ON' : 'OFF'}</p>
                <p>Calculated Total: €{metrics.thisMonthTotal.toFixed(2)}</p>
                <p className="mt-2 mb-1 text-white">Receipts included in this month:</p>
                <div className="space-y-1">
                    {(metrics.thisMonthReceipts || []).map((r, i) => (
                        <div key={i} className="flex justify-between border-b border-white/5 pb-1">
                            <span>{r.date} - {r.storeName}</span>
                            <span>€{r.total.toFixed(2)}</span>
                        </div>
                    ))}
                    {metrics.thisMonthReceipts.length === 0 && <p>No receipts found for this month.</p>}
                </div>

                <p className="mt-4 mb-1 text-white border-t border-white/10 pt-2">Last 5 Receipts (All Time):</p>
                <div className="space-y-1">
                    {(receipts || []).slice(0, 5).map((r, i) => (
                        <div key={i} className="flex justify-between border-b border-white/5 pb-1">
                            <span>{r.date} - {r.storeName}</span>
                            <span>€{r.total.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-20"></div>
        </div >
    );
};

export default Dashboard;