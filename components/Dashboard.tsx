
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Receipt, Category, CategoryDefinition, Goal, GoalType, CustodyDay, User, Achievement } from '../types';
import { Target, TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, PieChart as PieIcon, Shield, ShieldCheck, Calendar, Wallet, ArrowRight, Sparkles, Trophy, Pizza, Beer, Cigarette, Gamepad2, Dices, Coffee, Cookie, ShoppingCart, Shirt, Car, Tv, PiggyBank, ShoppingBag, X, FileText, Store, ArrowUp, BarChart3, Check, Hash, ArrowUpRight, CalendarDays, Activity, Users, Gift, Plus, CheckCircle2 } from 'lucide-react';
import { HapticsService } from '../services/haptics';
import { WidgetService } from '../services/widgetService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar, PolarAngleAxis, PieChart, Pie, Cell, Sector } from 'recharts';

import AnimatedSection from './AnimatedSection';
import { AmbientBackground } from './AmbientBackground';
import { CountUp } from './CountUp';
import { SpotlightCard } from './SpotlightCard';
import { TrendsChart } from './TrendsChart';
import { InsightsGauges } from './InsightsGauges';
import { GoalDetailsModal } from './GoalDetailsModal';
import { AchievementDetailsModal } from './AchievementDetailsModal';
import { CoParentingDetailsModal } from './CoParentingDetailsModal';
import { CATEGORY_COLORS } from '../constants/colors';
import { generateInsights, InsightMessage } from '../services/insightService';
import SnapshotDetailsModal from './SnapshotDetailsModal';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5
        }
    }
};


const VisibilitySensor = ({ children, threshold = 0.5 }: { children: (props: { isVisible: boolean }) => React.ReactNode, threshold?: number }) => {
    const ref = useRef(null);
    // Use amount to ensure 50% of element is in view before triggering
    const isVisible = useInView(ref, { amount: threshold });

    return <div ref={ref} className="w-full h-full">{children({ isVisible })}</div>;
};

import { useData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';

interface DashboardProps {
    onViewReceipt?: (receipt: Receipt) => void;
    onProvisionClick?: () => void;
    onSettlementClick?: () => void;
    onCustodyClick?: () => void;
    onHabitsClick?: () => void;
    // Removed data props: receipts, monthlyBudget, ageRestricted, childSupportMode, categories, categoryBudgets, recurringExpenses, setRecurringExpenses, goals, custodyDays, user, ambientMode
}

interface DrillDownState {
    category: string;
    items: { name: string; price: number; date: string; store: string }[];
}

type DateFilter = 'all' | 'this_month' | 'last_month';

const Dashboard: React.FC<DashboardProps> = ({
    onViewReceipt,
    onProvisionClick,
    onSettlementClick,
    onCustodyClick,
    onHabitsClick
}) => {
    const {
        receipts,
        monthlyBudget,
        ageRestricted,
        childSupportMode,
        categories,
        categoryBudgets,
        goals,
        custodyDays,
        ambientMode,
        syncCustody,
        isProMode
    } = useData();
    const { user } = useUser();

    const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [chartView, setChartView] = useState<'week' | 'month' | 'year'>('week');


    const [insightView, setInsightView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [goalView, setGoalView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [custodyView, setCustodyView] = useState<'weekly' | 'monthly'>('weekly');
    const [monthViewMode, setMonthViewMode] = useState<'share' | 'insights'>('share');
    const [showIndicators, setShowIndicators] = useState(false);
    const [showMoney, setShowMoney] = useState(true); // Toggle for privacy mode
    const [isCoParentingMode, setIsCoParentingMode] = useState(false); // Toggle for Co-parenting view
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [selectedSnapshotMetric, setSelectedSnapshotMetric] = useState<any | null>(null);
    const [showCoParentingModal, setShowCoParentingModal] = useState(false);
    const [viewMode, setViewMode] = useState<'chart' | 'legend'>('chart');
    const [budgetView, setBudgetView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [pieView, setPieView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    // Optimization: Only animate heavy ambient effects when in view
    const budgetCardRef = useRef(null);
    const isBudgetInView = useInView(budgetCardRef, { margin: "-10% 0px" });

    // Item Colors for Drilldown
    const ITEM_COLORS = ['#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f87171', '#fb923c', '#a3e635'];
    const getItemColor = (index: number) => ITEM_COLORS[index % ITEM_COLORS.length];

    // Helper to get category color
    const getCategoryColor = (catName: string) => {
        // Direct match
        if (CATEGORY_COLORS[catName]) return CATEGORY_COLORS[catName];

        // ID match (e.g. 'food' vs 'Food')
        const catId = catName.charAt(0).toUpperCase() + catName.slice(1).toLowerCase();
        if (CATEGORY_COLORS[catId]) return CATEGORY_COLORS[catId];

        // Fallback to CategoryDefinition color if available
        const cat = (categories || []).find(c => c.name === catName || c.id === catName.toLowerCase());
        return cat ? cat.color : CATEGORY_COLORS['Other'] || '#94a3b8';
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
            else color = '#22c5e'; // Green
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
                    <span className={"text-[10px] font-bold uppercase tracking-wide text-center " + (showIndicators && intensity === 'high' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-slate-400')}>
                        <CountUp value={total} prefix="€" decimals={0} />
                    </span>
                    {showIndicators && trend && (
                        <span className={(trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-emerald-400' : 'text-slate-500')}>
                            {trend === 'up' ? <TrendingUp size={10} /> : trend === 'down' ? <TrendingDown size={10} /> : <Minus size={10} />}
                        </span>
                    )}
                </div>
            </div>
        );
    };


    // Calculate Metrics
    const metrics = useMemo(() => {
        // 0. Source Data (Unfiltered by Child Mode initially, so we can calculate global totals)
        const sourceReceipts = receipts || [];

        // 1. Filter Receipts based on Date Filter
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const checkDate = (r: Receipt) => {
            let d = new Date(r.date);
            if (r.date.includes('-') && !r.date.includes('T')) {
                const parts = r.date.split('-');
                d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            if (dateFilter === 'this_month') {
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            } else if (dateFilter === 'last_month') {
                const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
            }
            return true;
        };

        // Standard Filtered List (Respects Co-Parenting Mode) -> Powers main dashboard
        const filteredReceipts = sourceReceipts.filter(r => {
            if (!checkDate(r)) return false;
            // Filter if Child Mode is ON
            if (childSupportMode && !r.items.some(i => i.isChildRelated || i.category === Category.EDUCATION || i.category === 'Child')) {
                return false;
            }
            return true;
        });

        // Global Filtered List (Ignores Co-Parenting Mode, respects Date) -> Powers "Total" Pie Chart
        const globalFilteredReceipts = sourceReceipts.filter(checkDate);

        // Calculate Global Totals (for Left Pie Chart)
        const globalCategoryTotals: Record<string, number> = {};
        let globalTotal = 0;

        globalFilteredReceipts.forEach(r => {
            r.items.forEach(i => {
                const cat = i.category || Category.OTHER;
                // Simple normalization (copy/paste lite logic or use helper if available? Inline for safety)
                let normalizedCat = cat;
                if (typeof cat === 'string') {
                    const lower = cat.toLowerCase();
                    if (['groceries', 'food', 'dining'].includes(lower)) normalizedCat = Category.FOOD;
                    else if (['alcohol', 'beer', 'wine'].includes(lower)) normalizedCat = Category.ALCOHOL;
                    else if (['health', 'pharmacy'].includes(lower)) normalizedCat = Category.HEALTH;
                    else if (['household', 'cleaning'].includes(lower)) normalizedCat = Category.HOUSEHOLD;
                    else if (['education', 'child'].includes(lower)) normalizedCat = Category.EDUCATION;
                    else if (['transport', 'fuel'].includes(lower)) normalizedCat = Category.TRANSPORT;
                    else if (['luxury', 'tech'].includes(lower)) normalizedCat = Category.LUXURY;
                    else if (['necessity'].includes(lower)) normalizedCat = Category.NECESSITY;
                }

                // Add Sub-categorization Logic (Simplified for redundancy check, or fully robust?)
                // Let's copy the robust sub-cat logic to ensure charts match visually
                if (normalizedCat === Category.FOOD) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/apple|banana|orange|grape|fruit|berry|melon|lemon|lime|pear|peach/)) normalizedCat = "Fruit";
                    else if (nameLower.match(/carrot|potato|onion|pepper|vegetable|salad|tomato|cucumber|lettuce/)) normalizedCat = "Vegetables";
                    else if (nameLower.match(/coke|pepsi|soda|fanta|sprite|drink|beverage|water/)) normalizedCat = "Soda";
                    else if (nameLower.match(/chicken|beef|pork|meat|steak/)) normalizedCat = "Meat";
                    else if (nameLower.match(/milk|cheese|yogurt|butter|cream/)) normalizedCat = "Dairy";
                    else if (nameLower.match(/bread|bakery|cake|pastry|pizza|burger/)) normalizedCat = "Bakery";
                    else if (nameLower.match(/chip|snack|chocolate|candy/)) normalizedCat = "Snacks";
                } else if (normalizedCat === Category.LUXURY) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/tech|phone|laptop|computer|headphone|earbud/)) normalizedCat = "Tech";
                    else if (nameLower.match(/clothes|shirt|jacket|jean|shoe/)) normalizedCat = "Clothing";
                    else if (nameLower.match(/game|steam|xbox|playstation|lego/)) normalizedCat = "Gaming"; // Toys -> Gaming/Fun
                    else if (nameLower.match(/flight|hotel|airbnb|trip|travel/)) normalizedCat = "Travel";
                } else if (normalizedCat === Category.HOUSEHOLD) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/clean|soap|detergent|bleach/)) normalizedCat = "Cleaning";
                    else if (nameLower.match(/plant|flower|garden/)) normalizedCat = "Garden";
                    else if (nameLower.match(/decor|frame|candle/)) normalizedCat = "Decor";
                }
                // Sub-categorize Transport
                else if (normalizedCat === Category.TRANSPORT) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/petrol|diesel|fuel|gas|circle k|applegreen/)) normalizedCat = "Fuel";
                    else if (nameLower.match(/bus|train|tram|luas|dart|leap|ticket/)) normalizedCat = "Public Transport";
                    else if (nameLower.match(/taxi|uber|bolt|freenow/)) normalizedCat = "Taxi";
                    else if (nameLower.match(/park|toll|wash|service|nct|tax|insurance/)) normalizedCat = "Car Expenses";
                }
                // Sub-categorize Health
                else if (normalizedCat === Category.HEALTH) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/pharmacy|boots|lloyds|drug|med|vitamin|prescription/)) normalizedCat = "Pharmacy";
                    else if (nameLower.match(/doctor|gp|clinic|hospital|dentist|consult/)) normalizedCat = "Doctor";
                    else if (nameLower.match(/gym|swim|sport|train|fit/)) normalizedCat = "Fitness";
                }
                // Sub-categorize Dining
                else if (normalizedCat === Category.DINING) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/coffee|cafe|latte|cappuccino|tea|starbucks|costa/)) normalizedCat = "Cafe";
                    else if (nameLower.match(/mcdonald|burger|kfc|subway|pizza|fast|takeaway/)) normalizedCat = "Fast Food";
                    else normalizedCat = "Restaurant";
                }

                globalCategoryTotals[normalizedCat] = (globalCategoryTotals[normalizedCat] || 0) + i.price;
                globalTotal += i.price;
            });
        });

        let totalSpent = 0;
        let provisionTotal = 0; // Essentials only
        const categoryTotals: Record<string, number> = {};
        const childCategoryTotals: Record<string, number> = {}; // New: Child Only
        let childTotalSpent = 0;

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
                    if (['groceries', 'food', 'dining'].includes(lower)) normalizedCat = Category.FOOD;
                    else if (['alcohol', 'beer', 'wine', 'spirits'].includes(lower)) normalizedCat = Category.ALCOHOL;
                    else if (['health', 'pharmacy', 'medical'].includes(lower)) normalizedCat = Category.HEALTH;
                    else if (['household', 'cleaning', 'furniture'].includes(lower)) normalizedCat = Category.HOUSEHOLD;
                    else if (['education', 'school', 'tuition', 'child'].includes(lower)) normalizedCat = Category.EDUCATION;
                    else if (['transport', 'fuel', 'parking'].includes(lower)) normalizedCat = Category.TRANSPORT;
                    else if (['luxury', 'electronics', 'entertainment'].includes(lower)) normalizedCat = Category.LUXURY;
                    else if (['necessity'].includes(lower)) normalizedCat = Category.NECESSITY;
                    else normalizedCat = Category.OTHER;
                }

                // Sub-categorize Food
                if (normalizedCat === Category.FOOD) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/apple|banana|orange|grape|fruit|berry|melon|lemon|lime|pear|peach/)) normalizedCat = "Fruit";
                    else if (nameLower.match(/carrot|potato|onion|pepper|vegetable|salad|tomato|cucumber|lettuce|spinach|garlic|ginger/)) normalizedCat = "Vegetables";
                    else if (nameLower.match(/coke|pepsi|soda|fanta|sprite|drink|beverage|water|juice|cola/)) normalizedCat = "Soda";
                    else if (nameLower.match(/organic|bio|eco/)) normalizedCat = "Organic";
                    else if (nameLower.match(/chicken|beef|pork|meat|steak|lamb|turkey|ham|bacon|sausage/)) normalizedCat = "Meat";
                    else if (nameLower.match(/milk|cheese|yogurt|butter|cream|dairy/)) normalizedCat = "Dairy";
                    else if (nameLower.match(/bread|bakery|cake|pastry|croissant|bagel|bun|roll|pizza|burger/)) normalizedCat = "Bakery"; // Added pizza/burger
                    else if (nameLower.match(/chip|snack|chocolate|candy|sweet|cookie|biscuit/)) normalizedCat = "Snacks";
                }
                // Sub-categorize Luxury
                else if (normalizedCat === Category.LUXURY) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/tech|phone|laptop|computer|headphone|earbud|watch|camera|electronic|apple|samsung|sony/)) normalizedCat = "Tech";
                    else if (nameLower.match(/clothes|shirt|jacket|jean|shoe|sneaker|dress|coat|fashion|zara|h&m|nike|adidas/)) normalizedCat = "Clothing";
                    else if (nameLower.match(/game|steam|xbox|playstation|nintendo|toy|lego/)) normalizedCat = "Gaming"; // Toys -> Gaming/Fun
                    else if (nameLower.match(/flight|hotel|airbnb|trip|travel/)) normalizedCat = "Travel";
                }
                // Sub-categorize Household
                else if (normalizedCat === Category.HOUSEHOLD) {
                    const nameLower = i.name.toLowerCase();
                    if (nameLower.match(/clean|soap|detergent|bleach|sponge|towel|paper|tissue/)) normalizedCat = "Cleaning";
                    else if (nameLower.match(/plant|flower|garden|seed|pot/)) normalizedCat = "Garden";
                    else if (nameLower.match(/decor|frame|candle|lamp|light|furniture|chair|table/)) normalizedCat = "Decor";
                }

                categoryTotals[normalizedCat] = (categoryTotals[normalizedCat] || 0) + i.price;
                totalSpent += i.price; // Accumulate total spent here

                if (i.isChildRelated) {
                    childCategoryTotals[normalizedCat] = (childCategoryTotals[normalizedCat] || 0) + i.price;
                    childTotalSpent += i.price;
                }

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

        // Global Data (Unfiltered)
        const globalCategoryData = Object.entries(globalCategoryTotals)
            .map(([name, value]) => ({ name, value, percentage: globalTotal > 0 ? (value / globalTotal) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        const categoryData = Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value, percentage: totalSpent > 0 ? (value / totalSpent) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        const childCategoryData = Object.entries(childCategoryTotals)
            .map(([name, value]) => ({ name, value, percentage: childTotalSpent > 0 ? (value / childTotalSpent) * 100 : 0 }))
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

            if (dayEntry[Category.OTHER] === undefined) dayEntry[Category.OTHER] = 0;

            // Use filteredReceipts for Context-Aware Data (Child Mode or Single Mode)
            filteredReceipts.forEach(r => {
                let rDateStr = r.date;
                if (r.date.includes('T')) {
                    rDateStr = r.date.split('T')[0];
                } else if (r.date.length === 10 && r.date.includes('-')) {
                    // No-op
                } else {
                    try {
                        const parsed = new Date(r.date);
                        if (!isNaN(parsed.getTime())) {
                            rDateStr = parsed.toISOString().split('T')[0];
                        }
                    } catch (e) {
                        rDateStr = '';
                    }
                }

                if (rDateStr === dStr) {
                    r.items.forEach(item => {
                        // Sub-category logic handled loosely here, but main category required for Bar Chart
                        let cat = item.category || Category.OTHER;
                        if (typeof cat === 'string') {
                            const lower = cat.toLowerCase();
                            // Simple mapping provided here for bar chart consistency
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

        // 1.5 Global Weekly Activity (For "Total" Chart Context even in Child Mode)
        const globalWeeklyActivity: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const offset = d.getTimezoneOffset();
            const localDate = new Date(d.getTime() - (offset * 60 * 1000));
            const dStr = localDate.toISOString().split('T')[0];

            const dayEntry: any = { total: 0 };
            Object.values(Category).forEach(cat => dayEntry[cat] = 0);
            if (dayEntry[Category.OTHER] === undefined) dayEntry[Category.OTHER] = 0;

            sourceReceipts.forEach(r => { // GLOBAL SOURCE
                let rDateStr = r.date.includes('T') ? r.date.split('T')[0] : r.date;
                // (Simplified date check for brevity, assuming standard format or consistent with above)
                try {
                    const parsed = new Date(r.date);
                    if (!isNaN(parsed.getTime())) rDateStr = parsed.toISOString().split('T')[0];
                } catch (e) { }

                if (rDateStr === dStr) {
                    r.items.forEach(item => {
                        let cat = item.category || Category.OTHER;
                        // Normalize (Simplified for Global Calc)
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
            globalWeeklyActivity.push(dayEntry);
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
            if (!ageRestricted) {
                // Use receipt total if available, otherwise sum items
                return acc + (r.total > 0 ? r.total : r.items.reduce((s, i) => s + i.price, 0));
            }
            return acc + r.items.reduce((s, i) => !i.isRestricted ? s + i.price : s, 0);
        }, 0);

        const lastMonthTotal = lastMonthReceipts.reduce((acc, r) => {
            if (!ageRestricted) {
                return acc + (r.total > 0 ? r.total : r.items.reduce((s, i) => s + i.price, 0));
            }
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
            const label = weekStart.getDate() + ' ' + weekStart.toLocaleString('default', { month: 'short' });

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
            // Robust Date Parsing
            let d = new Date(r.date);
            if (r.date.includes('-') && !r.date.includes('T')) {
                const parts = r.date.split('-');
                d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
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
            const key = months[d.getMonth()] + ' ' + d.getFullYear().toString().substr(2);

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

            const offset = d.getTimezoneOffset();
            const localDate = new Date(d.getTime() - (offset * 60 * 1000));
            const dayEntry: any = { label, date: localDate.toISOString().split('T')[0], total: 0 };
            Object.values(Category).forEach(cat => {
                dayEntry[cat] = 0;
            });
            if (dayEntry[Category.OTHER] === undefined) dayEntry[Category.OTHER] = 0;
            monthData.push(dayEntry);
        }

        // Update Weekly Activity to use 'label' instead of 'day' for consistency
        const weekData = (weeklyActivity || []).map(d => ({ ...d, label: d.day }));

        receipts.forEach(r => {
            // Robust Date Parsing
            let d = new Date(r.date);
            if (r.date.includes('-') && !r.date.includes('T')) {
                const parts = r.date.split('-');
                d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }

            // Populate Year Data
            const yearKey = months[d.getMonth()] + ' ' + d.getFullYear().toString().substr(2);
            const yearEntry = (yearData || []).find(m => m.label === yearKey);

            // Populate Month Data
            // Use the robustly parsed local date for comparison
            const offset = d.getTimezoneOffset();
            const localDate = new Date(d.getTime() - (offset * 60 * 1000));
            const rDateStr = localDate.toISOString().split('T')[0];
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
            childCategoryData,
            childTotalSpent,    // Restored
            globalCategoryData, // Exposed
            globalTotal,        // Exposed
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
            trendData: yearData, // Keep for backward compatibility
            yearData, // Explicitly exposed for TrendsChart
            monthData, // Explicitly exposed for TrendsChart
            weekData, // Explicitly exposed for TrendsChart
            weeklyData,
            thisMonthReceipts,
            sourceReceipts, // Export filtered receipts for Insights
            dailyAverage: daysPassed > 0 ? thisMonthTotal / daysPassed : 0,
            foodRatio: totalSpent > 0 ? ((categoryTotals[Category.FOOD] || 0) / totalSpent) * 100 : 0,
            luxuryRatio: totalSpent > 0 ? (luxuryTotal / totalSpent) * 100 : 0,
            educationRatio: totalSpent > 0 ? ((categoryTotals[Category.EDUCATION] || 0) / totalSpent) * 100 : 0,
            healthRatio: totalSpent > 0 ? ((categoryTotals[Category.HEALTH] || 0) / totalSpent) * 100 : 0,

            // Daily Ratios (For Gauges)
            dailyRatios: (() => {
                const today = weeklyActivity[weeklyActivity.length - 1] || { total: 0 };
                const t = today.total || 0;
                return {
                    education: t > 0 ? ((today[Category.EDUCATION] || 0) / t) * 100 : 0,
                    food: t > 0 ? ((today[Category.FOOD] || 0) / t) * 100 : 0,
                    activities: t > 0 ? ((today[Category.LUXURY] || 0) / t) * 100 : 0,
                    health: t > 0 ? ((today[Category.HEALTH] || 0) / t) * 100 : 0,
                };
            })(),

            // Daily Metrics
            todayTotal: weeklyActivity[weeklyActivity.length - 1]?.total || 0,
            yesterdayTotal: weeklyActivity[weeklyActivity.length - 2]?.total || 0,
            todayCategoryData: (() => {
                const today = weeklyActivity[weeklyActivity.length - 1];
                if (!today) return [];
                return Object.entries(today)
                    .filter(([key]) => Object.values(Category).includes(key as any))
                    .map(([name, value]) => ({
                        name,
                        value: value as number,
                        percentage: today.total > 0 ? ((value as number) / today.total) * 100 : 0
                    }))
                    .filter(i => i.value > 0)
                    .sort((a, b) => b.value - a.value);
            })(),

            // GLOBAL Daily/Weekly Data (Ignores Child Mode)
            globalTotalToday: globalWeeklyActivity[globalWeeklyActivity.length - 1]?.total || 0,

            globalTodayCategoryData: (() => {
                const today = globalWeeklyActivity[globalWeeklyActivity.length - 1];
                if (!today) return [];
                return Object.entries(today)
                    .filter(([key]) => Object.values(Category).includes(key as any) && (today as any)[key] > 0)
                    .map(([name, value]) => ({ name, value: value as number, percentage: today.total > 0 ? ((value as number) / today.total) * 100 : 0 }))
                    .sort((a, b) => b.value - a.value);
            })(),

            globalThisWeekCategoryData: (() => {
                const rollingWeekTotal: Record<string, number> = {};
                let rollingTotal = 0;
                globalWeeklyActivity.forEach(day => {
                    Object.entries(day).forEach(([key, val]) => {
                        if (Object.values(Category).includes(key as any)) {
                            rollingWeekTotal[key] = (rollingWeekTotal[key] || 0) + (val as number);
                            rollingTotal += (val as number);
                        }
                    });
                });
                return Object.entries(rollingWeekTotal)
                    .map(([name, value]) => ({ name, value, percentage: rollingTotal > 0 ? (value / rollingTotal) * 100 : 0 }))
                    .sort((a, b) => b.value - a.value);
            })(),

            thisWeekCategoryData: (() => {
                const thisWeek = weeklyData[weeklyData.length - 1];
                if (!thisWeek) return [];
                return Object.entries(thisWeek)
                    .filter(([key]) => Object.values(Category).includes(key as any) && (thisWeek as any)[key] > 0)
                    .map(([name, value]) => ({ name, value: value as number, percentage: thisWeek.total > 0 ? ((value as number) / thisWeek.total) * 100 : 0 }))
                    .sort((a, b) => b.value - a.value);
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
                            message: "You've exceeded your monthly budget by €" + (thisMonthTotal - monthlyBudget).toFixed(0) + ". Consider reducing discretionary spending.",
                            icon: <AlertTriangle size={16} />
                        });
                    } else if (usage > 0.85) {
                        insights.push({
                            type: 'warning',
                            title: 'Approaching Limit',
                            message: "You've used " + (usage * 100).toFixed(0) + "% of your budget. Be careful with upcoming expenses.",
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
                            title: "High Spending on " + topCat.name,
                            message: topCat.name + " accounts for " + (topCat.percentage).toFixed(0) + "% of your spending this month.",
                            icon: <PieIcon size={16} />
                        });
                    }
                }

                // 3. Positive Reinforcement
                if (monthlyBudget > 0 && thisMonthTotal < (monthlyBudget * 0.5) && new Date().getDate() > 15) {
                    insights.push({
                        type: 'success',
                        title: 'Great Progress',
                        message: "You're halfway through the month and well under budget!",
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
                                title: goal.name + " Alert",
                                message: "You've spent €" + goalSpending.toFixed(2) + " on " + goal.name.toLowerCase() + " items this month.",
                                icon: <Target size={16} className="text-purple-400" />
                            });
                        } else if (new Date().getDate() > 7) {
                            // Reward for 0 spending if it's been at least a week
                            insights.push({
                                type: 'success',
                                title: goal.name + " Streak!",
                                message: "Great job! You haven't spent anything on " + goal.name.toLowerCase() + " this month!",
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
                                    title: "Potential Savings 💰",
                                    message: "Cutting out " + goal.name + " could save you ~€" + monthlySavings.toFixed(0) + "/mo or €" + yearlySavings.toFixed(0) + "/yr!",
                                    icon: <PiggyBank size={16} className="text-emerald-400" />
                                });
                            }
                        }
                    });
                }

                return insights.slice(0, 3);
            })(),
            latestReceipt: recentLogs[recentLogs.length - 1],
        };
    }, [receipts, monthlyBudget, ageRestricted, dateFilter, goals]);


    // COLORS moved outside
    console.log('Dashboard Chart Debug:', {
        view: chartView,
        weekDataLen: metrics.weekData?.length,
        monthDataLen: metrics.monthData?.length,
        yearDataLen: metrics.yearData?.length,
        categoriesLen: categories.length,
        firstWeekItem: metrics.weekData?.[0],
        firstMonthItem: metrics.monthData?.[0]
    });

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

    // Ambient Health State Logic
    // Ambient Health State Logic (Dynamic based on Budget View)
    const healthState = useMemo(() => {
        let current = 0;
        let target = 1;

        if (budgetView === 'daily') {
            current = metrics.todayTotal;
            target = monthlyBudget / 30; // Approx
        } else if (budgetView === 'weekly') {
            current = metrics.thisWeekTotal;
            target = monthlyBudget / 4; // Approx
        } else {
            current = metrics.thisMonthTotal;
            target = monthlyBudget;
        }

        const ratio = target > 0 ? current / target : 0;
        if (ratio >= 1.0) return 'critical'; // Red
        if (ratio >= 0.85) return 'warning'; // Amber
        return 'healthy'; // Green
    }, [metrics.thisMonthTotal, metrics.thisWeekTotal, metrics.todayTotal, monthlyBudget, budgetView]);

    // Drill Down Data
    const drillDownData = useMemo(() => {
        if (!selectedCategory || !metrics.categoryItems[selectedCategory]) return [];
        const items = metrics.categoryItems[selectedCategory];
        const aggregated: Record<string, number> = {};
        items.forEach(i => {
            aggregated[i.name] = (aggregated[i.name] || 0) + i.price;
        });
        return Object.entries(aggregated)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 items
    }, [selectedCategory, metrics.categoryItems]);

    // AI Suggestions
    const suggestions = useMemo(() => {
        return generateInsights(
            metrics.thisMonthTotal,
            monthlyBudget,
            metrics.sourceReceipts, // Use mode-filtered receipts
            custodyDays,
            metrics.lastMonthTotal,
            goals
        );
    }, [metrics.thisMonthTotal, monthlyBudget, metrics.sourceReceipts, custodyDays, metrics.lastMonthTotal, goals]);

    // AI Smart Metrics
    const aiMetrics = useMemo(() => {
        const daysPassed = new Date().getDate();
        const totalSpent = metrics.thisMonthTotal;
        const dailyAvg = daysPassed > 0 ? totalSpent / daysPassed : 0;
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const projected = (dailyAvg * daysInMonth);

        // Biggest Purchase
        const biggestPurchase = Math.max(...(metrics.thisMonthReceipts || []).map(r => r.total), 0);

        // Top Category
        const topCategory = metrics.categoryData.length > 0 ? metrics.categoryData[0].name : '-';

        // Weekend Spend %
        const weekendSpend = (metrics.thisMonthReceipts || []).reduce((acc, r) => {
            const day = new Date(r.date).getDay();
            return (day === 0 || day === 6) ? acc + (r.total || 0) : acc;
        }, 0);
        const weekendPercent = totalSpent > 0 ? (weekendSpend / totalSpent) * 100 : 0;

        // Shopping Frequency
        const frequency = daysPassed > 0 ? ((metrics.thisMonthReceipts || []).length / daysPassed).toFixed(1) : '0';

        // Use suggestions to find relevant tips
        const warning = suggestions.find(s => s.severity === 'warning' || s.severity === 'danger');
        const success = suggestions.find(s => s.severity === 'success');

        // Dynamic Status Logic
        let statusLabel = 'Forecast';
        let statusValue = "€" + projected.toFixed(0);
        let statusTrend = projected > monthlyBudget ? 'down' : 'up';
        let statusIcon = projected > monthlyBudget ? TrendingDown : TrendingUp;
        let statusDetail = metrics.spendingInsight;
        let statusPopup = {
            title: 'Budget Forecast',
            description: "Based on your current spending velocity, we project a Month End total of €" + projected.toFixed(0) + ".",
            insight: projected > monthlyBudget ? "You are on track to exceed your budget by €" + (projected - monthlyBudget).toFixed(0) + "." : 'You are comfortably on track to stay under budget.',
            items: [
                { label: 'Current Spend', value: "€" + totalSpent.toFixed(0) },
                { label: 'Remaining Budget', value: "€" + Math.max(0, monthlyBudget - totalSpent).toFixed(0) },
                { label: 'Projected Total', value: "€" + projected.toFixed(0) }
            ]
        };

        const latestReceipt = metrics.latestReceipt;
        // Priority 1: Just Added (Last 5 mins)
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
        // Priority 3: Success / Warning (Existing logic)
        else if (warning) {
            statusLabel = 'Alert';
            if (warning.id === 'late-night-habit') statusValue = 'Late Spending';
            else if (warning.id === 'weekend-splurge') statusValue = 'Weekend Spike';
            else if (warning.id.startsWith('cat-drift')) statusValue = 'Category Drift';
            else if (warning.id === 'budget-warning') statusValue = 'Check Budget';
            else if (warning.id === 'budget-critical') statusValue = 'Over Budget';
            else statusValue = 'Insight Alert';

            // Catch-all for heavy text if ID logic misses (safety)
            if (/over budget/i.test(warning.text)) statusValue = 'Over Budget';

            statusTrend = 'down';
            statusIcon = AlertTriangle;
            statusDetail = warning.text;
            statusPopup = {
                title: statusValue, // Use the specific label as title
                description: warning.text,
                insight: warning.subtext || 'Review your recent transactions.',
                items: []
            };
        }
        else if (success) {
            statusLabel = 'Status';
            statusValue = 'On Track';
            statusTrend = 'up';
            statusIcon = CheckCircle2;
            statusDetail = success.text;
            statusPopup = {
                title: 'Good Progress',
                description: success.text,
                insight: success.subtext || 'Keep it up!',
                items: []
            };
        }

        // Helper for Top 3 Cats
        const top3Cats = metrics.categoryData.slice(0, 3).map(c => ({
            label: c.name,
            value: c.percentage.toFixed(0) + "% ",
            subtext: "€" + c.value.toFixed(0) + " "
        }));

        // Helper for Biggest Purchase details
        const biggestReceipt = (metrics.thisMonthReceipts || []).sort((a, b) => b.total - a.total)[0];

        // Calculate Target Daily
        const dailyTarget = monthlyBudget / 30; // Approx
        const dailyTrendDiff = dailyAvg - dailyTarget;

        return [
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
                        { label: 'Yesterday', value: "€" + (metrics.weekData[6]?.total || 0).toFixed(0) }, // Approx
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
            {
                label: 'Weekend',
                value: weekendPercent.toFixed(0) + "%",
                trend: weekendPercent > 40 ? 'up' : 'neutral',
                trendLabel: weekendPercent > 40 ? 'High' : 'Balanced',
                icon: Calendar,
                detail: 'vs Weekday',
                popup: {
                    title: 'Weekend vs Weekday',
                    description: weekendPercent.toFixed(0) + "% of your spending happens on weekends (Sat/Sun).",
                    insight: weekendPercent > 40 ? 'You have a "Weekend Splurge" habit. Try to stick to your routine on Saturdays.' : 'Your spending is fairly balanced throughout the week.',
                    items: [
                        { label: 'Weekend Total', value: "€" + weekendSpend.toFixed(0) },
                        { label: 'Weekday Total', value: "€" + (totalSpent - weekendSpend).toFixed(0) }
                    ]
                }
            },
            {
                label: 'Freq/Day',
                value: frequency,
                trend: parseFloat(frequency) > 3 ? 'up' : 'neutral',
                trendLabel: parseFloat(frequency) > 3 ? 'High' : 'Normal',
                icon: Activity,
                detail: 'Trans./Day',
                popup: {
                    title: 'Spending Frequency',
                    description: "On average, you make " + frequency + " transactions per day.",
                    insight: parseFloat(frequency) > 3 ? 'High frequency often indicates impulsive micro-transactions. Try to batch your purchases.' : 'Low frequency suggests planned, deliberate spending.',
                    items: [
                        { label: 'Total Txns', value: "" + (metrics.thisMonthReceipts || []).length },
                        { label: 'Days Passed', value: "" + daysPassed }
                    ]
                }
            }
        ];
    }, [metrics.thisMonthTotal, metrics.thisMonthReceipts, metrics.categoryData, monthlyBudget, suggestions, metrics.todayTotal, metrics.weekData, metrics.latestReceipt, metrics.spendingInsight]);

    const activePieData = useMemo(() => {
        if (selectedCategory) return drillDownData;
        switch (pieView) {
            case 'daily': return metrics.todayCategoryData;
            case 'weekly': return metrics.thisWeekCategoryData;
            default: return metrics.categoryData;
        }
    }, [pieView, selectedCategory, drillDownData, metrics.categoryData, metrics.todayCategoryData, metrics.thisWeekCategoryData]);

    const cardGlowStyles = useMemo(() => {
        switch (healthState) {
            case 'critical':
                return 'shadow-[0_0_50px_-5px_rgba(220,38,38,0.6)] border-red-500/60 bg-red-900/30 animate-glow-pulse';
            case 'warning':
                return 'shadow-[0_0_50px_-5px_rgba(245,158,11,0.6)] border-amber-500/60 bg-amber-900/30 animate-glow-pulse';
            case 'healthy':
                return 'shadow-[0_0_40px_-5px_rgba(16,185,129,0.4)] border-emerald-500/50 bg-emerald-900/20 transition-all duration-1000';
        }
    }, [healthState]);

    // Ambient Color Helper with Continuous Interpolation
    const getAmbientStyle = (ratio: number) => {
        // Helper to interpolate RGB (Hex)
        const interpolate = (color1: string, color2: string, factor: number) => {
            const r1 = parseInt(color1.substring(1, 3), 16);
            const g1 = parseInt(color1.substring(3, 5), 16);
            const b1 = parseInt(color1.substring(5, 7), 16);

            const r2 = parseInt(color2.substring(1, 3), 16);
            const g2 = parseInt(color2.substring(3, 5), 16);
            const b2 = parseInt(color2.substring(5, 7), 16);

            const r = Math.round(r1 + (r2 - r1) * factor);
            const g = Math.round(g1 + (g2 - g1) * factor);
            const b = Math.round(b1 + (b2 - b1) * factor);

            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        };

        const green = '#84cc16'; // Lime-500
        const yellow = '#eab308'; // Yellow-500
        const red = '#ef4444'; // Red-500
        const brightRed = '#ff0000'; // Pure Red

        let color = green;
        let glowSize = '15px';
        let duration = 4;
        let brightColor = '#ffffff';

        if (ratio < 0.5) {
            color = green;
            glowSize = '10px';
            duration = 12;
            brightColor = '#bef264'; // Light Lime
        } else if (ratio < 0.8) {
            // Interpolate Green -> Yellow
            color = yellow;
            glowSize = '20px';
            duration = 8;
            brightColor = '#facc15'; // Yellow-400 (Vibrant)
        } else if (ratio < 1.0) {
            // Interpolate Yellow -> Red
            color = red;
            glowSize = '25px';
            duration = 6;
            brightColor = '#f87171'; // Red-400 (Vibrant)
        } else {
            color = brightRed;
            glowSize = '30px';
            duration = 4;
            brightColor = '#ff2222'; // Neon Red
        }

        // If NOT in view, return plain style with NO animation to save resources
        if (!isBudgetInView) {
            return {
                '--glow-color': color,
                '--glow-color-bright': brightColor,
                '--glow-size': '0px', // No glow
                borderColor: 'rgba(255,255,255,0.1)', // Dim border
                boxShadow: 'none',
                transition: 'all 0.5s ease',
                background: 'transparent' // Kill gradient
            } as React.CSSProperties;
        }

        return {
            '--glow-color': color,
            '--glow-color-bright': brightColor,
            '--glow-size': glowSize,
            borderColor: color,
            boxShadow: "0 0 " + glowSize + " " + color,
            transition: 'all 1s ease',
            animation: "pulse-border-v2 " + duration + "s infinite ease-in-out"
        } as React.CSSProperties;
    };

    // Unified Ambient Style
    const ambientStyle = useMemo(() => {
        const colorMap = {
            healthy: { color: '#84cc16', bright: '#bef264', glow: '15px' }, // Lime
            warning: { color: '#eab308', bright: '#facc15', glow: '20px' }, // Yellow
            critical: { color: '#ef4444', bright: '#ff2222', glow: '30px' } // Red
        };
        const active = colorMap[healthState];

        if (!isBudgetInView) {
            return {
                '--glow-color': active.color,
                '--glow-color-bright': active.bright,
                '--glow-size': '0px',
                borderColor: 'rgba(255,255,255,0.1)',
                boxShadow: 'none',
                transition: 'all 0.5s ease',
                background: 'transparent'
            } as React.CSSProperties;
        }

        return {
            '--glow-color': active.color,
            '--glow-color-bright': active.bright,
            '--glow-size': active.glow,
            borderColor: active.color,
            boxShadow: "0 0 " + active.glow + " " + active.color,
            transition: 'all 1s ease',
            animation: healthState === 'critical' ? 'pulse-border-v2 3s infinite ease-in-out' : undefined
        } as React.CSSProperties;
    }, [healthState, isBudgetInView]);

    return (
        <motion.div
            className="w-full h-full overflow-y-auto overflow-x-hidden pt-32 px-4 pb-28 scroll-smooth no-scrollbar"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >

            {/* Main Content Wrapper */}
            <div className="pt-4 pb-32 space-y-4">

                <motion.div
                    ref={budgetCardRef}
                    key={metrics.thisMonthTotal}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-0"
                >
                    <div
                        style={ambientMode ? ambientStyle : {}}
                        className={"relative rounded-3xl border p-4 transition-all duration-1000 overflow-hidden group mb-4 " + (ambientMode ? 'bg-card' : 'bg-card border-slate-800 shadow-lg')}
                    >
                        {ambientMode && (
                            <div className="absolute inset-0 pointer-events-none z-0">
                                {/* Background Gradient matching the color */}
                                <div
                                    className="absolute inset-0 opacity-15 transition-colors duration-1000"
                                    style={{
                                        background: "radial-gradient(circle at 50% 50%, var(--glow-color), transparent 70%)"
                                    }}
                                />
                            </div>
                        )}

                        {/* Original BG Backing if needed */}
                        <div className={"absolute inset-0 rounded-3xl pointer-events-none transition-all duration-500 bg-card/80 backdrop-blur-sm z-0"} />

                        {(() => {
                            // Calculate view-specific values
                            const currentTotal = budgetView === 'monthly' ? metrics.thisMonthTotal : budgetView === 'weekly' ? metrics.thisWeekTotal : metrics.todayTotal;
                            const currentBudget = budgetView === 'monthly' ? monthlyBudget : budgetView === 'weekly' ? monthlyBudget / 4 : monthlyBudget / 30;
                            const percentage = currentBudget > 0 ? (currentTotal / currentBudget) * 100 : 0;
                            const isOverBudget = percentage > 100;
                            const statusColor = isOverBudget ? '#ef4444' : '#10b981'; // Red-500 : Emerald-500
                            const glowColor = isOverBudget ? 'rgba(239, 68, 68, 1)' : 'var(--glow-color)'; // Override glow for red state

                            return (
                                <>
                                    {/* Header Row: Title & Tabs */}
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className={"p-2 rounded-xl bg-gradient-to-br " + (isOverBudget ? 'from-red-500/20 to-red-600/10' : 'from-emerald-500/20 to-emerald-600/10')}>
                                                <Wallet className={"w-5 h-5 " + (isOverBudget ? 'text-red-400' : 'text-emerald-400')} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                                    {budgetView} Budget
                                                </h3>
                                                <p className="text-[10px] font-medium text-slate-400">
                                                    {budgetView === 'monthly' ? 'This Month' : budgetView === 'weekly' ? 'This Week' : 'Today'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex bg-slate-900/50 rounded-lg p-1 border border-white/5 backdrop-blur-sm">
                                            {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                                                <button
                                                    key={view}
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent card click
                                                        HapticsService.selection();
                                                        setBudgetView(view);
                                                    }}
                                                    className={"px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all " + (
                                                        budgetView === view
                                                            ? isOverBudget
                                                                ? 'bg-red-500/20 text-red-400 shadow-sm'
                                                                : 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                                    )}
                                                >
                                                    {view === 'daily' ? 'Day' : view === 'weekly' ? 'Week' : 'Month'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Main Numbers Row */}
                                    <div className="flex items-end justify-between mb-5 relative z-10">
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-heading font-black text-white tracking-tight leading-none">
                                                    €<CountUp value={currentTotal} decimals={2} />
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-400 mt-1 pl-1 relative z-20">
                                                of €{Math.round(currentBudget)} limit
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div
                                                className={"text-3xl font-black tracking-tight leading-none transition-colors duration-500 " + (isOverBudget ? 'text-red-500' : 'text-emerald-500')}
                                                style={{ textShadow: isOverBudget ? '0 0 20px rgba(239, 68, 68, 0.3)' : '0 0 20px rgba(16, 185, 129, 0.3)' }}
                                            >
                                                <CountUp value={percentage} decimals={0} suffix="%" />
                                            </div>
                                            <div className={"text-xs font-bold uppercase tracking-wider mt-1 " + (isOverBudget ? 'text-red-400/80' : 'text-emerald-400/80')}>
                                                {isOverBudget ? 'Over Budget' : 'Used'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-4 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5 relative z-10 mb-2">
                                        <motion.div
                                            className="h-full rounded-full opacity-100 relative overflow-hidden"
                                            initial={{ width: 0 }}
                                            animate={{ width: Math.min(percentage, 100) + "%" }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            style={{
                                                backgroundColor: statusColor,
                                                boxShadow: "0 0 15px " + statusColor,
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                                        </motion.div>
                                    </div>

                                    {isOverBudget && (
                                        <div className="flex items-start gap-2 mt-3 text-xs font-medium text-red-400 bg-red-500/5 p-2 rounded-lg border border-red-500/10 relative z-20">
                                            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                            <p>You have exceeded your {budgetView} budget by €{(currentTotal - currentBudget).toFixed(2)}.</p>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        {suggestions.length > 0 && (
                            <div className="relative z-10 mt-3 border-t border-white/10 pt-3">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentTipIndex}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.5 }}
                                        className="flex items-start gap-3"
                                    >
                                        <div className={"p-1.5 rounded-lg " + (
                                            suggestions[currentTipIndex].severity === 'danger' ? 'bg-red-500/10 text-red-400' :
                                                suggestions[currentTipIndex].severity === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-emerald-500/10 text-emerald-400'
                                        )}>
                                            {React.createElement(suggestions[currentTipIndex].icon, { size: 14 })}
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-300 font-medium leading-tight">{suggestions[currentTipIndex].text}</p>
                                            {suggestions[currentTipIndex].subtext && <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{suggestions[currentTipIndex].subtext}</p>}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        )}

                        <div className="relative z-10 border-t border-white/5 pt-4">
                            <div className="flex flex-col gap-4 mb-4 relative z-10 w-full">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                        <PieIcon className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                            Spending
                                        </h3>
                                        <div
                                            onClick={() => {
                                                if (selectedCategory) {
                                                    HapticsService.selection();
                                                    setSelectedCategory(null);
                                                }
                                            }}
                                            className={"flex items-center gap-1 text-[10px] font-medium transition-colors " + (selectedCategory ? 'text-indigo-400 cursor-pointer hover:text-indigo-300' : 'text-slate-400')}
                                        >
                                            {selectedCategory ? (
                                                <span className="flex items-center gap-1">
                                                    Distribution <ArrowRight size={10} /> {selectedCategory}
                                                </span>
                                            ) : (
                                                "Distribution Overview"
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5 w-full">
                                    {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                                        <button
                                            key={view}
                                            onClick={() => {
                                                HapticsService.selection();
                                                setPieView(view);
                                            }}
                                            className={"flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all " + (
                                                pieView === view
                                                    ? 'bg-indigo-500/20 text-indigo-400 shadow-sm ring-1 ring-indigo-500/10'
                                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                            )}
                                        >
                                            {view === 'daily' ? 'Day' : view === 'weekly' ? 'Week' : 'Month'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Dual Pie Chart Logic */}
                        <div className={`grid gap-4 relative z-20 ${childSupportMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {[
                                {
                                    title: 'Total Distribution',
                                    data: (() => {
                                        // Global (Total) Mode
                                        if (childSupportMode) {
                                            if (pieView === 'daily') return metrics.globalTodayCategoryData;
                                            if (pieView === 'weekly') return metrics.globalThisWeekCategoryData;
                                            return metrics.globalCategoryData;
                                        }
                                        // Standard Mode (Context Only)
                                        if (pieView === 'daily') return metrics.todayCategoryData;
                                        if (pieView === 'weekly') return metrics.thisWeekCategoryData;
                                        return metrics.categoryData;
                                    })(),
                                    total: (() => {
                                        if (childSupportMode) {
                                            if (pieView === 'daily') return metrics.globalTotalToday;
                                            if (pieView === 'weekly') return metrics.globalThisWeekCategoryData.reduce((s, i) => s + i.value, 0);
                                            return metrics.globalTotal;
                                        }
                                        if (pieView === 'daily') return metrics.todayTotal;
                                        if (pieView === 'weekly') return metrics.thisWeekCategoryData.reduce((s, i) => s + i.value, 0);
                                        return metrics.thisMonthTotal;
                                    })(),
                                    id: 'total',
                                    colors: ['#84cc16', '#3b82f6', '#a855f7', '#22d3ee', '#f472b6'] // Standard
                                },
                                ...(childSupportMode ? [{
                                    title: 'Child Expenses',
                                    data: (() => {
                                        // Child Mode Always (Context)
                                        if (pieView === 'daily') return metrics.todayCategoryData; // Child Only in this mode
                                        if (pieView === 'weekly') return metrics.thisWeekCategoryData; // Child Only in this mode
                                        return metrics.childCategoryData; // Child Only in this mode
                                    })(),
                                    total: (() => {
                                        if (pieView === 'daily') return metrics.todayTotal;
                                        if (pieView === 'weekly') return metrics.thisWeekCategoryData.reduce((s, i) => s + i.value, 0);
                                        return metrics.childTotalSpent;
                                    })(),
                                    id: 'child',
                                    isEmpty: metrics.childCategoryData.length === 0, // Fallback check?
                                    colors: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4'] // Warm/Distinct
                                }] : [])
                            ].map((chartConfig: any) => (
                                <AnimatedSection key={chartConfig.id} triggerOnce={false} noSlide className="w-full">
                                    {({ isInView }: { isInView?: boolean } = {}) => (
                                        <div className="flex flex-col items-center gap-4 h-[350px] max-w-full mx-auto group">
                                            <h5 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-[-10px] z-10">{chartConfig.title}</h5>

                                            {/* Top: Pie Chart */}
                                            <div className="w-full h-2/3 relative flex items-center justify-center">
                                                {/* Center Hub */}
                                                <AnimatePresence>
                                                    {isInView && (
                                                        <motion.div
                                                            initial={{ scale: 0, opacity: 0, x: "-50%", y: "-50%" }}
                                                            animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%" }}
                                                            exit={{ scale: 0, opacity: 0, x: "-50%", y: "-50%" }}
                                                            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                                                            onClick={() => {
                                                                HapticsService.selection();
                                                                setSelectedCategory(null);
                                                            }}
                                                            className="absolute z-30 top-1/2 left-1/2 w-20 h-20 bg-slate-900 rounded-full border border-slate-700 flex flex-col items-center justify-center cursor-pointer group active:scale-95"
                                                        >
                                                            <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse-slow pointer-events-none"></div>
                                                            <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">
                                                                {selectedCategory ? 'Cat.' : 'Total'}
                                                            </span>
                                                            <span className={"font-heading font-bold text-white tabular-nums text-center leading-none whitespace-normal break-words w-full px-2 line-clamp-2 " + (selectedCategory ? 'text-[10px]' : 'text-xs')}>
                                                                {selectedCategory ? selectedCategory : "€" + chartConfig.total.toFixed(0)}
                                                            </span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart key={"pie-" + chartConfig.id + "-" + isInView} margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                                                        <defs>
                                                        </defs>
                                                        <Pie
                                                            data={chartConfig.data}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={50}
                                                            outerRadius={70}
                                                            paddingAngle={4}
                                                            dataKey="value"
                                                            stroke="none"
                                                            isAnimationActive={true}
                                                            animationDuration={1000}
                                                            shape={(props: any) => {
                                                                const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index } = props;
                                                                const isPlaceholder = (chartConfig as any).isEmpty;
                                                                const color = isPlaceholder ? '#1e293b' : chartConfig.colors[index % chartConfig.colors.length];

                                                                return (
                                                                    <Sector
                                                                        cx={cx}
                                                                        cy={cy}
                                                                        innerRadius={innerRadius}
                                                                        outerRadius={outerRadius}
                                                                        startAngle={startAngle}
                                                                        endAngle={endAngle}
                                                                        fill={color}
                                                                        cornerRadius={4}
                                                                        className="transition-all duration-300 outline-none"
                                                                    />
                                                                );
                                                            }}
                                                        >
                                                            {chartConfig.data.map((entry: any, index: number) => (
                                                                <Cell key={"cell-" + index} fill={(chartConfig as any).isEmpty ? '#1e293b' : chartConfig.colors[index % chartConfig.colors.length]} stroke="none" />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Bottom: Legend */}
                                            <div className="w-full h-1/3 overflow-y-auto scroller px-2">
                                                <div className="grid grid-cols-1 gap-x-2 gap-y-1.5">
                                                    {(chartConfig.data || []).map((entry: any, index: number) => {
                                                        const color = chartConfig.colors[index % chartConfig.colors.length];
                                                        const percentage = chartConfig.total > 0 ? ((entry.value / chartConfig.total) * 100) : 0;
                                                        return (
                                                            <div key={index} className="group cursor-pointer" onClick={() => setSelectedCategory(entry.name)}>
                                                                <div className="flex justify-between items-end mb-0.5">
                                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: "0 0 6px " + color }}></div>
                                                                        <span className="text-[9px] font-medium text-slate-300 capitalize truncate max-w-[80px]">{entry.name}</span>
                                                                    </div>
                                                                    <div className="flex items-baseline gap-1 shrink-0">
                                                                        <span className="text-[9px] font-bold text-white tabular-nums">
                                                                            <CountUp value={entry.value} prefix="€" decimals={0} />
                                                                        </span>
                                                                        <span className="text-[8px] text-slate-500 font-medium tabular-nums text-right">
                                                                            <CountUp value={percentage} suffix="%" decimals={0} />
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="h-0.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: isInView ? Math.min(percentage * 1.5, 100) + "%" : 0 }}
                                                                        transition={{ duration: 1, delay: index * 0.1 }}
                                                                        className="h-full rounded-full opacity-80"
                                                                        style={{ backgroundColor: color }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </AnimatedSection>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* BENTO GRID LAYOUT */}
                <div className="grid grid-cols-2 gap-3 mb-6">



                    {/* Monthly Insights (Expanded) */}
                    {/* Monthly Insights (Expanded) */}
                    <motion.div variants={itemVariants} className="col-span-2">
                        <SpotlightCard
                            onClick={isCoParentingMode ? onProvisionClick : undefined}
                            className={"rounded-3xl border border-slate-800 bg-card p-4 shadow-lg transition-all " + (isCoParentingMode ? 'cursor-pointer hover:border-slate-700' : '')}
                            spotlightColor="rgba(59, 130, 246, 0.1)" // Blue tint
                        >
                            <div className="mb-4 relative z-10">

                                <div className="flex flex-col gap-4 mb-4 relative z-10 w-full">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                            <Sparkles className="w-5 h-5 text-yellow-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                                Insights
                                            </h3>
                                            <p className="text-[10px] font-medium text-slate-400">
                                                Performance & Trends
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5 w-full">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setInsightView('daily'); }}
                                            className={"flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (insightView === 'daily' ? 'bg-blue-500/20 text-blue-400 shadow-sm ring-1 ring-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')}
                                        >
                                            Daily
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setInsightView('weekly'); }}
                                            className={"flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (insightView === 'weekly' ? 'bg-blue-500/20 text-blue-400 shadow-sm ring-1 ring-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')}
                                        >
                                            Weekly
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setInsightView('monthly'); }}
                                            className={"flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (insightView === 'monthly' ? 'bg-blue-500/20 text-blue-400 shadow-sm ring-1 ring-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')}
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
                                            <CountUp value={insightView === 'monthly' ? metrics.dailyAverage : insightView === 'weekly' ? metrics.weeklyAverage : metrics.todayTotal} prefix="€" decimals={0} />
                                        </p>
                                    </div>
                                    <div className="h-8 w-px bg-slate-800"></div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">
                                            {insightView === 'monthly' ? 'Forecast' : insightView === 'weekly' ? 'This Week' : 'Yesterday'}
                                        </p>
                                        <p className="text-xl font-bold text-blue-400 tabular-nums">
                                            <CountUp value={insightView === 'monthly' ? metrics.projectedTotal : insightView === 'weekly' ? metrics.thisWeekTotal : metrics.yesterdayTotal} prefix="€" decimals={0} />
                                        </p>
                                    </div>
                                    {isCoParentingMode && (
                                        <>
                                            <div className="h-8 w-px bg-slate-800"></div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">Evidence</p>
                                                <p className={"text-xl font-bold tabular-nums " + metrics.evidenceColor}>{metrics.evidenceLabel}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <VisibilitySensor threshold={0.2}>
                                {({ isVisible }: { isVisible: boolean }) => (
                                    <InsightsGauges
                                        insightView={insightView}
                                        metrics={metrics}
                                        isVisible={isVisible}
                                    />
                                )}
                            </VisibilitySensor>

                            {/* Smart Suggestions */}
                            {metrics.smartInsights.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 text-purple-400" />
                                        Smart Suggestions
                                    </h4>
                                    {metrics.smartInsights.map((insight, idx) => (
                                        <div key={idx} className={"p-3 rounded-xl border flex items-start gap-3 " + (insight.type === 'warning' ? 'bg-red-500/10 border-red-500/20' : insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-blue-500/10 border-blue-500/20')}>
                                            <div className={"mt-0.5 " + (insight.type === 'warning' ? 'text-red-400' : insight.type === 'success' ? 'text-emerald-400' : 'text-blue-400')}>
                                                {insight.icon}
                                            </div>
                                            <div>
                                                <p className={"text-xs font-bold " + (insight.type === 'warning' ? 'text-red-300' : insight.type === 'success' ? 'text-emerald-300' : 'text-blue-300')}>{insight.title}</p>
                                                <p className="text-[10px] text-slate-400 leading-relaxed">{insight.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SpotlightCard>
                    </motion.div>

                    {/* Co-Parenting Cards */}
                    {
                        childSupportMode && (
                            <div className="col-span-2 grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    {(() => {
                                        // Calculate Custody Data
                                        const today = new Date();
                                        const currentDay = today.getDay(); // 0 = Sunday
                                        const startOfWeek = new Date(today);
                                        startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1)); // Mon start

                                        const weekDays = Array.from({ length: 7 }, (_, i) => {
                                            const d = new Date(startOfWeek);
                                            d.setDate(startOfWeek.getDate() + i);
                                            return d;
                                        });

                                        const getDayStatus = (date: Date) => {
                                            const dateStr = date.toISOString().split('T')[0];
                                            const custody = (custodyDays || []).find(d => d.date === dateStr);
                                            return custody ? custody.status : null;
                                        };

                                        const monthDaysCount = (custodyDays || []).filter(d => {
                                            const dDate = new Date(d.date);
                                            return dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear() && d.status === 'me';
                                        }).length;

                                        return (
                                            <motion.div
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    HapticsService.selection();
                                                    onCustodyClick();
                                                }}
                                                className="w-full h-full relative rounded-3xl p-4 flex flex-col justify-between group transition-all cursor-pointer overflow-hidden border border-slate-800 bg-card shadow-lg"
                                            >
                                                <div className="relative z-10 flex flex-col justify-start gap-4 h-full">
                                                    {/* Header */}
                                                    <div className="flex justify-between items-start shrink-0">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="bg-purple-500/10 p-1.5 rounded-lg text-purple-400">
                                                                    <CalendarDays size={16} />
                                                                </div>
                                                                <h3 className="text-sm font-bold text-slate-200">Custody</h3>
                                                            </div>
                                                            {(() => {
                                                                const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
                                                                const todaysEvents = custodyDays.find(d => d.date === todayStr)?.activities || [];

                                                                if (todaysEvents.length > 0) {
                                                                    return (
                                                                        <div className="mt-1 animate-in fade-in slide-in-from-left-2">
                                                                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Happening Today</span>
                                                                            <p className="text-sm font-bold text-white leading-tight">{todaysEvents[0].title}</p>
                                                                            {todaysEvents.length > 1 && <p className="text-[10px] text-slate-500">+{todaysEvents.length - 1} more</p>}
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                        <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5" onClick={(e) => e.stopPropagation()}>
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => { HapticsService.selection(); setCustodyView('weekly'); }}
                                                                className={"px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded-md transition-all " + (custodyView === 'weekly' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                            >
                                                                Week
                                                            </motion.button>
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => { HapticsService.selection(); setCustodyView('monthly'); }}
                                                                className={"px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded-md transition-all " + (custodyView === 'monthly' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                            >
                                                                Month
                                                            </motion.button>
                                                        </div>
                                                    </div>

                                                    {/* Toggleable Body */}
                                                    <AnimatePresence mode="wait">
                                                        {custodyView === 'weekly' ? (
                                                            <motion.div
                                                                key="weekly"
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="w-full"
                                                            >
                                                                <div className="flex justify-between items-center bg-slate-800/20 p-2 rounded-xl border border-white/5">
                                                                    {weekDays.map((d, i) => {
                                                                        const status = getDayStatus(d);
                                                                        const isToday = d.toDateString() === today.toDateString();
                                                                        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });

                                                                        return (
                                                                            <div key={i} className="flex flex-col items-center gap-1.5">
                                                                                <span className="text-[9px] font-medium text-slate-500 uppercase">{dayLabel}</span>
                                                                                <div
                                                                                    className={"w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all " + (
                                                                                        status === 'me' ? 'bg-purple-500 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)] scale-110' :
                                                                                            (status === 'partner' || status === 'split') ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' :
                                                                                                'bg-slate-800/50 border-slate-700 text-slate-500'
                                                                                    ) + (isToday ? ' ring-2 ring-white/20' : '')}
                                                                                >
                                                                                    {status === 'me' ? <Check size={14} strokeWidth={4} /> : status ? d.getDate() : d.getDate()}
                                                                                </div>
                                                                                {(() => {
                                                                                    const dStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
                                                                                    const hasEvent = (custodyDays.find(day => day.date === dStr)?.activities || []).length > 0;
                                                                                    return <div className={"w-1 h-1 rounded-full transition-colors " + (hasEvent ? 'bg-purple-400' : 'bg-transparent')}></div>;
                                                                                })()}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </motion.div>
                                                        ) : (
                                                            <AnimatedSection triggerOnce={false} noSlide className="w-full">
                                                                {({ isInView }: { isInView?: boolean } = {}) => (
                                                                    <div className="flex flex-col gap-3">
                                                                        <div className="flex bg-slate-800/50 p-0.5 rounded-lg w-fit self-center">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setMonthViewMode('share'); }}
                                                                                className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (monthViewMode === 'share' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                                            >
                                                                                Share
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setMonthViewMode('insights'); }}
                                                                                className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (monthViewMode === 'insights' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                                            >
                                                                                Insights
                                                                            </button>
                                                                        </div>

                                                                        {monthViewMode === 'share' ? (
                                                                            <div className="flex items-center justify-between gap-4 bg-slate-800/20 p-3 rounded-xl border border-white/5 animate-in fade-in slide-in-from-right-2">
                                                                                <div className="flex flex-col gap-2 flex-1">
                                                                                    <div>
                                                                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">My Share</p>
                                                                                        <div className="flex items-baseline gap-1">
                                                                                            <p className="text-2xl font-heading font-bold text-white">{monthDaysCount}</p>
                                                                                            <span className="text-xs text-slate-500">days</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="space-y-1">
                                                                                        <div className="flex justify-between text-[10px] font-medium">
                                                                                            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-slate-300">Me</span></div>
                                                                                            <span className="text-white tabular-nums">
                                                                                                <CountUp value={monthDaysCount} suffix="d" decimals={0} />
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex justify-between text-[10px] font-medium">
                                                                                            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-slate-300">Partner</span></div>
                                                                                            <span className="text-white tabular-nums">
                                                                                                <CountUp value={new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - monthDaysCount} suffix="d" decimals={0} />
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="h-20 w-20 relative shrink-0">
                                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                                        <PieChart key={"custody-pie-" + isInView}>
                                                                                            <Pie
                                                                                                data={[
                                                                                                    { name: 'Me', value: monthDaysCount },
                                                                                                    { name: 'Partner', value: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - monthDaysCount }
                                                                                                ]}
                                                                                                cx="50%"
                                                                                                cy="50%"
                                                                                                innerRadius={22}
                                                                                                outerRadius={35}
                                                                                                paddingAngle={3}
                                                                                                dataKey="value"
                                                                                                startAngle={90}
                                                                                                endAngle={-270}
                                                                                                stroke="none"
                                                                                                isAnimationActive={isInView}
                                                                                                animationDuration={1500}
                                                                                            >
                                                                                                <Cell key="me" fill="#10b981" />
                                                                                                <Cell key="partner" fill="#3b82f6" />
                                                                                            </Pie>
                                                                                        </PieChart>
                                                                                    </ResponsiveContainer>
                                                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                                        <span className="text-[10px] font-bold text-slate-300">
                                                                                            <CountUp value={(monthDaysCount / new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()) * 100} suffix="%" decimals={0} />
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            // Insights View - Weekend Split & Parenting Pulse
                                                                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-2">
                                                                                {/* Weekend Split */}
                                                                                <div>
                                                                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-2">Weekend Split</p>
                                                                                    {(() => {
                                                                                        const weekendDays = custodyDays.filter(d => {
                                                                                            const date = new Date(d.date);
                                                                                            const day = date.getDay();
                                                                                            return day === 0 || day === 6; // Sun or Sat
                                                                                        });
                                                                                        const totalWeekends = weekendDays.length || 1;
                                                                                        const myWeekends = weekendDays.filter(d => d.status === 'me').length;
                                                                                        const partnerWeekends = weekendDays.filter(d => d.status === 'partner').length;

                                                                                        return (
                                                                                            <div className="flex h-2 rounded-full overflow-hidden w-full bg-slate-800">
                                                                                                <div style={{ width: ((myWeekends / totalWeekends) * 100) + "%" }} className="bg-emerald-500 h-full" />
                                                                                                <div style={{ width: ((partnerWeekends / totalWeekends) * 100) + "%" }} className="bg-blue-500 h-full" />
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                    <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                                                                                        <span>You</span>
                                                                                        <span>Partner</span>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Parenting Pulse */}
                                                                                {(() => {
                                                                                    // Metrics Calculation
                                                                                    const totalDays = custodyDays.length;
                                                                                    const myDays = custodyDays.filter(d => d.status === 'me').length;
                                                                                    const balance = totalDays > 0 ? myDays / totalDays : 0.5;

                                                                                    // 1. Equity Score (Target 50/50)
                                                                                    const equityRaw = 1 - (Math.abs(balance - 0.5) * 2);
                                                                                    const equityScore = Math.round(equityRaw * 100);

                                                                                    // 2. Stability Score (Weekend Consistency)
                                                                                    let stabilityScore = 85;
                                                                                    if (balance > 0.8 || balance < 0.2) stabilityScore = 40;

                                                                                    // 3. Harmony Score
                                                                                    const harmonyScore = Math.round((equityScore + stabilityScore) / 2);

                                                                                    let status: 'optimum' | 'good' | 'attention' | 'critical' = 'good';
                                                                                    let title = 'Steady Pulse';
                                                                                    let message = 'Your co-parenting rhythm is stable. Consistency builds security for everyone.';
                                                                                    let color = 'text-emerald-400';
                                                                                    let bgColor = 'bg-emerald-500/10';
                                                                                    let borderColor = 'border-emerald-500/20';

                                                                                    if (harmonyScore < 50) {
                                                                                        status = 'critical';
                                                                                        title = 'Action Needed';
                                                                                        message = 'Schedule is currently lopsided. Consider renegotiating days for better balance.';
                                                                                        color = 'text-red-400';
                                                                                        bgColor = 'bg-red-500/10';
                                                                                        borderColor = 'border-red-500/20';
                                                                                    } else if (harmonyScore < 75) {
                                                                                        status = 'attention';
                                                                                        title = 'Uneven Rhythm';
                                                                                        message = 'Minor friction detected. A small adjustment could help.';
                                                                                        color = 'text-orange-400';
                                                                                        bgColor = 'bg-orange-500/10';
                                                                                        borderColor = 'border-orange-500/20';
                                                                                    } else if (harmonyScore > 90) {
                                                                                        status = 'optimum';
                                                                                        title = 'In Sync';
                                                                                        message = 'Outstanding cooperation! Healthy partnership.';
                                                                                        color = 'text-cyan-400';
                                                                                        bgColor = 'bg-cyan-500/10';
                                                                                        borderColor = 'border-cyan-500/20';
                                                                                    }

                                                                                    const metrics = [
                                                                                        { label: 'Equity', score: equityScore, color: 'bg-blue-500' },
                                                                                        { label: 'Stability', score: stabilityScore, color: 'bg-purple-500' },
                                                                                        { label: 'Harmony', score: harmonyScore, color: 'bg-pink-500' },
                                                                                    ];

                                                                                    return (
                                                                                        <>
                                                                                            <motion.button
                                                                                                whileTap={{ scale: 0.98 }}
                                                                                                onClick={(e) => { e.stopPropagation(); setShowCoParentingModal(true); }}
                                                                                                className={"w-full rounded-2xl p-4 border relative overflow-hidden group mt-4 transition-all hover:bg-opacity-20 text-left " + bgColor + " " + borderColor}
                                                                                            >
                                                                                                <div className="flex items-start gap-3 mb-4">
                                                                                                    <div className={"p-2 rounded-lg border " + bgColor + " " + borderColor}>
                                                                                                        <Activity className={"w-4 h-4 " + color} />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <div className="flex items-center gap-2 mb-0.5">
                                                                                                            <h4 className={"text-sm font-bold " + color}>{title}</h4>
                                                                                                            <span className={"text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold " + bgColor + " " + borderColor + " " + color}>{status}</span>
                                                                                                        </div>
                                                                                                        <p className="text-[10px] text-slate-400 leading-tight max-w-[200px]">{message}</p>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="space-y-3">
                                                                                                    {metrics.map((m) => (
                                                                                                        <div key={m.label} className="group/bar">
                                                                                                            <div className="flex justify-between items-end mb-1">
                                                                                                                <span className="text-[10px] font-medium text-slate-500 group-hover/bar:text-slate-300 transition-colors uppercase tracking-wide">{m.label}</span>
                                                                                                                <span className="text-[10px] font-bold text-slate-300 tabular-nums">{m.score}/100</span>
                                                                                                            </div>
                                                                                                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                                                                                                <motion.div
                                                                                                                    initial={{ width: 0 }}
                                                                                                                    whileInView={{ width: m.score + "%" }}
                                                                                                                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                                                                                                    className={"h-full rounded-full " + m.color}
                                                                                                                />
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </motion.button>
                                                                                            <CoParentingDetailsModal
                                                                                                isOpen={showCoParentingModal}
                                                                                                onClose={() => setShowCoParentingModal(false)}
                                                                                                metrics={{ equity: equityScore, stability: stabilityScore, harmony: harmonyScore }}
                                                                                                custodyDays={custodyDays}
                                                                                            />
                                                                                        </>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </AnimatedSection>
                                                        )}
                                                    </AnimatePresence>

                                                    {/* Upcoming Activities */}
                                                    <div className="mt-3 pt-3 border-t border-white/5">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Upcoming</p>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onCustodyClick?.(); }}
                                                                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                                            >
                                                                <Plus size={10} />
                                                            </button>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {(() => {
                                                                const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
                                                                const upcoming = custodyDays
                                                                    .filter(d => d.date > todayStr)
                                                                    .flatMap(d => (d.activities || []).map(a => ({ ...a, date: d.date })))
                                                                    .sort((a, b) => a.date.localeCompare(b.date))
                                                                    .slice(0, 3);

                                                                if (upcoming.length === 0) {
                                                                    return <p className="text-[10px] text-slate-600 italic">No upcoming activities.</p>;
                                                                }

                                                                return upcoming.map((acc, idx) => (
                                                                    <div key={acc.id + "-" + idx} className="flex items-center gap-2">
                                                                        <div className={"w-1.5 h-1.5 rounded-full " + (
                                                                            acc.type === 'birthday' ? 'bg-pink-400' :
                                                                                acc.type === 'sport' ? 'bg-orange-400' :
                                                                                    acc.type === 'school' ? 'bg-blue-400' : 'bg-slate-400'
                                                                        )}></div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex justify-between items-baseline">
                                                                                <span className="text-[10px] text-slate-300 font-medium truncate">{acc.title}</span>
                                                                                <span className="text-[9px] text-slate-500 font-mono ml-2 shrink-0">
                                                                                    {new Date(acc.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )
                    }


                    <div className="col-span-2">
                        <div className="h-full relative rounded-3xl border border-slate-800 bg-card p-4 flex flex-col min-h-[280px] overflow-hidden shadow-lg">
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex flex-col gap-4 mb-2">
                                    <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-blue-400" />
                                        Trends
                                    </h3>
                                    <div className="w-full flex justify-end">
                                        <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => { HapticsService.selection(); setChartView('week'); }}
                                                className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (chartView === 'week' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                            >
                                                Week
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => { HapticsService.selection(); setChartView('month'); }}
                                                className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (chartView === 'month' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                            >
                                                Month
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => { HapticsService.selection(); setChartView('year'); }}
                                                className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (chartView === 'year' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                            >
                                                Year
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <VisibilitySensor threshold={0.4}>
                                        {({ isVisible }: { isVisible: boolean }) => (
                                            <TrendsChart
                                                isVisible={isVisible}
                                                activeData={chartView === 'week' ? metrics.weekData : chartView === 'month' ? metrics.monthData : metrics.yearData}
                                                categories={categories}
                                                chartView={chartView}
                                            />
                                        )}
                                    </VisibilitySensor>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Goal Breakdown (500ms) */}
                    {
                        isProMode && goals && goals.some(g => g.isEnabled) ? (
                            <div className="col-span-2"><AnimatedSection delay={0} triggerOnce={false} variants={{ hidden: { opacity: 1 }, visible: { opacity: 1 } }}>
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

                                    // Calculate Achievements (Moved inside Goal Breakdown)
                                    const achievements = useMemo(() => {
                                        const badges = [
                                            {
                                                id: 'goal_setter',
                                                label: 'Goal Setter',
                                                icon: <Target className="w-5 h-5" />,
                                                unlocked: goals && goals.some(g => g.isEnabled),
                                                color: 'text-purple-400',
                                                bgColor: 'bg-purple-500/10',
                                                borderColor: 'border-purple-500/20'
                                            },
                                            {
                                                id: 'budget_master',
                                                label: 'Budget Master',
                                                icon: <Shield className="w-5 h-5" />,
                                                unlocked: metrics.thisMonthTotal < monthlyBudget * 0.9,
                                                color: 'text-emerald-400',
                                                bgColor: 'bg-emerald-500/10',
                                                borderColor: 'border-emerald-500/20'
                                            },
                                            {
                                                id: 'trend_setter',
                                                label: 'Trend Setter',
                                                icon: <TrendingDown className="w-5 h-5" />,
                                                unlocked: metrics.thisWeekTotal < metrics.lastWeekTotal,
                                                color: 'text-blue-400',
                                                bgColor: 'bg-blue-500/10',
                                                borderColor: 'border-blue-500/20'
                                            },
                                            {
                                                id: 'consistent_tracker',
                                                label: 'Consistent',
                                                icon: <FileText className="w-5 h-5" />,
                                                unlocked: receipts.some(r => {
                                                    const diff = new Date().getTime() - new Date(r.date).getTime();
                                                    return diff < 48 * 60 * 60 * 1000; // 48 hours
                                                }),
                                                color: 'text-yellow-400',
                                                bgColor: 'bg-yellow-500/10',
                                                borderColor: 'border-yellow-500/20'
                                            },
                                            {
                                                id: 'clean_sheet',
                                                label: 'Clean Sheet',
                                                icon: <Sparkles className="w-5 h-5" />,
                                                unlocked: goals && goals.some(g => g.isEnabled) && !goals.some(g => {
                                                    let total = 0;
                                                    const currentMonth = new Date().getMonth();
                                                    receipts.forEach(r => {
                                                        if (new Date(r.date).getMonth() === currentMonth) {
                                                            r.items.forEach(i => {
                                                                if (i.goalType === g.type) total += i.price * (i.quantity || 1);
                                                            });
                                                        }
                                                    });
                                                    return total > 80;
                                                }),
                                                color: 'text-pink-400',
                                                bgColor: 'bg-pink-500/10',
                                                borderColor: 'border-pink-500/20'
                                            },
                                            {
                                                id: 'early_bird',
                                                label: 'Early Bird',
                                                description: 'You made a purchase between 5 AM and 9 AM. Starting the day early!',
                                                icon: <Coffee className="w-5 h-5" />,
                                                unlocked: receipts.some(r => {
                                                    const h = new Date(r.date).getHours();
                                                    return h < 9 && h >= 5;
                                                }),
                                                color: 'text-orange-400',
                                                bgColor: 'bg-orange-500/10',
                                                borderColor: 'border-orange-500/20'
                                            },
                                            {
                                                id: 'night_owl',
                                                label: 'Night Owl',
                                                description: 'You made a purchase between 9 PM and 4 AM. Late night spender!',
                                                icon: <Tv className="w-5 h-5" />,
                                                unlocked: receipts.some(r => {
                                                    const h = new Date(r.date).getHours();
                                                    return h >= 21 || h < 4;
                                                }),
                                                color: 'text-indigo-400',
                                                bgColor: 'bg-indigo-500/10',
                                                borderColor: 'border-indigo-500/20'
                                            },
                                            {
                                                id: 'high_roller',
                                                label: 'High Roller',
                                                description: 'You spent over €100 in a single transaction. Big spender alert!',
                                                icon: <Car className="w-5 h-5" />,
                                                unlocked: receipts.some(r => r.total > 100),
                                                color: 'text-cyan-400',
                                                bgColor: 'bg-cyan-500/10',
                                                borderColor: 'border-cyan-500/20'
                                            },
                                            {
                                                id: 'penny_pincher',
                                                label: 'Penny Pincher',
                                                description: 'You made a purchase under €5. Every cent counts!',
                                                icon: <PiggyBank className="w-5 h-5" />,
                                                unlocked: receipts.some(r => r.total < 5 && r.total > 0),
                                                color: 'text-lime-400',
                                                bgColor: 'bg-lime-500/10',
                                                borderColor: 'border-lime-500/20'
                                            },
                                            {
                                                id: 'weekend_warrior',
                                                label: 'Weekender',
                                                description: 'You spent money on a Saturday or Sunday. Weekend vibes!',
                                                icon: <Beer className="w-5 h-5" />,
                                                unlocked: receipts.some(r => {
                                                    const d = new Date(r.date).getDay();
                                                    return d === 0 || d === 6;
                                                }),
                                                color: 'text-red-400',
                                                bgColor: 'bg-red-500/10',
                                                borderColor: 'border-red-500/20'
                                            }
                                        ];
                                        return badges;
                                    }, [goals, metrics, monthlyBudget, receipts]);

                                    const unlockedCount = achievements.filter(a => a.unlocked).length;
                                    const totalAchievements = achievements.length;
                                    const discountThreshold = 5;
                                    const discountUnlocked = unlockedCount >= discountThreshold;
                                    const discountProgress = Math.min((unlockedCount / discountThreshold) * 100, 100);

                                    return (
                                        <div className="rounded-3xl border border-slate-800 bg-card p-4 shadow-lg transition-all relative overflow-hidden group">
                                            {/* Background Gradient */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                                            <div className="mb-4 relative z-10">
                                                <div className="flex flex-wrap items-center justify-between gap-y-2">
                                                    <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                                        <Target className="w-4 h-4 text-purple-400" />
                                                        Goal Breakdown
                                                    </h3>
                                                    <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5 ml-auto">
                                                        {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                                                            <button
                                                                key={view}
                                                                onClick={(e) => { e.stopPropagation(); setGoalView(view); }}
                                                                className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (goalView === view ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                            >
                                                                {view.charAt(0).toUpperCase() + view.slice(1)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={"relative z-10 w-full " + (goals.filter(g => g.isEnabled).length === 1 ? 'flex justify-center py-8' : 'grid grid-cols-4 gap-4')}>
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
                                                        <motion.button
                                                            key={goal.id}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedGoal(goal); }}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/60 hover:border-white/10 transition-all duration-300 w-full"
                                                        >
                                                            <div className="mb-2">
                                                                <GoalGauge
                                                                    goal={goal}
                                                                    total={total}
                                                                    isInView={isInView}
                                                                    trend={trend}
                                                                    intensity={intensity}
                                                                    showIndicators={showIndicators}
                                                                />
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>

                                            {
                                                goals.filter(g => g.isEnabled).every(g => {
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
                                                )
                                            }

                                            {/* Merged Achievements Section */}
                                            <div className="mt-8 pt-8 border-t border-white/5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                                        Achievements
                                                    </h3>
                                                    <span className="text-xs text-slate-500 font-medium">{unlockedCount}/{totalAchievements} Unlocked</span>
                                                </div>

                                                <div className="grid grid-cols-5 gap-2">
                                                    {achievements.map((badge) => (
                                                        <motion.button
                                                            key={badge.id}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedAchievement(badge);
                                                            }}
                                                            className="flex flex-col items-center gap-2 group cursor-pointer"
                                                        >
                                                            <div className={"w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-500 " + (
                                                                badge.unlocked
                                                                    ? badge.bgColor + " " + badge.borderColor + " " + badge.color + " shadow-[0_0_15px_rgba(0,0,0,0.3)] group-hover:scale-110"
                                                                    : 'bg-slate-800/50 border-white/5 text-slate-600 grayscale opacity-50'
                                                            )}>
                                                                {badge.icon}
                                                            </div>
                                                            <span className={"text-[9px] font-bold uppercase tracking-wide text-center transition-colors " + (
                                                                badge.unlocked ? 'text-slate-300' : 'text-slate-600'
                                                            )}>
                                                                {badge.label}
                                                            </span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                            </AnimatedSection></div>
                        ) : (
                            isProMode ? (
                                <div className="col-span-2">
                                    <motion.div
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            HapticsService.selection();
                                            onHabitsClick();
                                        }}
                                        className="rounded-3xl border border-slate-800 bg-card p-4 shadow-lg relative overflow-hidden flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all"
                                    >
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
                                    </motion.div>
                                </div>
                            ) : null
                        )
                    }

                    {/* 4. Financial Snapshot (Grid of 3) */}
                    {/* 4. Financial Snapshot (Grid of 3) - Premium Redesign */}
                    {/* 4. Financial Snapshot (Grid of 3) - Premium Redesign */}
                    {/* 4. Financial Snapshot (Bento Layout) - Premium Redesign */}
                    <div className="col-span-2">
                        <div className="relative rounded-3xl overflow-hidden group shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10 border border-white/5">
                            {/* Deep, Rich Gradient Background - Obsidian/Deep Space Theme */}
                            <div className="absolute inset-0 bg-[#0B0F17]"></div>
                            {/* Subtle noise texture or gradient mesh */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-50"></div>

                            {/* Radial Glow Effects */}
                            <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[100%] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                            <div className="absolute bottom-[-50%] left-[-20%] w-[80%] h-[80%] bg-blue-500/5 rounded-full blur-[60px] pointer-events-none"></div>

                            <div className="relative z-10 p-5">
                                {/* Header (Compact) */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)] backdrop-blur-md">
                                            <Wallet className="text-indigo-400 w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white text-xs font-bold leading-none">Financial Snapshot</span>
                                            <span className="text-indigo-300/50 text-[9px] uppercase tracking-wider font-bold leading-none mt-0.5">Real-time Overview</span>
                                        </div>
                                    </div>
                                    {/* Pulse Indicator */}
                                    <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5">
                                        <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></div>
                                        <span className="text-[9px] font-bold text-indigo-300">LIVE</span>
                                    </div>
                                </div>

                                {/* Bento Layout */}
                                <div className="flex flex-col md:flex-row gap-3">
                                    {/* HERO SECTION (Left) - Status/Alert/Forecast */}
                                    {(() => {
                                        const heroMetric = aiMetrics.find(m => ['Alert', 'Status', 'Forecast'].includes(m.label)) || aiMetrics[0];
                                        const gridMetrics = aiMetrics.filter(m => m !== heroMetric);

                                        return (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        HapticsService.selection();
                                                        setSelectedSnapshotMetric(heroMetric as any);
                                                    }}
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
                                                            {heroMetric.trend && heroMetric.trend !== 'neutral' && (
                                                                <div className={"flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border " + (
                                                                    heroMetric.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                                )}>
                                                                    {(heroMetric as any).trendLabel || (heroMetric.trend === 'up' ? 'Safe' : 'Risk')}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {(heroMetric as any).detail && (
                                                            <p className="text-[9px] text-slate-500 leading-tight opacity-70 line-clamp-1 text-left">{(heroMetric as any).detail}</p>
                                                        )}
                                                    </div>
                                                </button>

                                                {/* GRID SECTION (Right) - 2x2 */}
                                                <div className="flex-1 grid grid-cols-2 gap-2">
                                                    {gridMetrics.slice(0, 4).map((metric, i) => {
                                                        const isUp = metric.trend === 'up';
                                                        const isDown = metric.trend === 'down';
                                                        const trendColor = isUp ? 'text-red-400' : isDown ? 'text-emerald-400' : 'text-slate-500'; // Context dependent? Up is bad for spending usually
                                                        // Context check:
                                                        // Freq: Up = bad (red)
                                                        // Weekend: Up = bad (red)
                                                        // Daily Avg: Up = bad (red)
                                                        // Top Cat: Neutral

                                                        // Let's assume 'up' in aiMetrics (for spending) is BAD/Warning usually, unless 'improvement'
                                                        // Actually, let's trust the color logic I just wrote: Red = Up/Bad for spending.

                                                        return (
                                                            <button
                                                                key={i}
                                                                onClick={() => {
                                                                    HapticsService.selection();
                                                                    setSelectedSnapshotMetric(metric as any);
                                                                }}
                                                                className="text-left relative p-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/10 backdrop-blur-md transition-all duration-300 group/item flex flex-col justify-between min-h-[80px]"
                                                            >
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate pr-1">{metric.label}</p>
                                                                    {metric.trend !== 'neutral' ? (
                                                                        isUp ? <TrendingUp size={12} className="text-amber-400" /> : <TrendingDown size={12} className="text-emerald-400" />
                                                                    ) : (
                                                                        <Minus size={12} className="text-slate-600" />
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    <div className="text-sm font-heading font-bold text-slate-200 tracking-tight leading-none mb-1">
                                                                        {!isNaN(parseFloat(metric.value.replace(/[^0-9.-]/g, ''))) && /[0-9]/.test(metric.value) ? (
                                                                            <CountUp
                                                                                prefix={metric.value.includes('€') ? '€' : ''}
                                                                                suffix={metric.value.includes('%') ? '%' : ''}
                                                                                value={parseFloat(metric.value.replace(/[^0-9.-]/g, ''))}
                                                                                decimals={metric.value.includes('.') ? 1 : 0}
                                                                            />
                                                                        ) : (
                                                                            metric.value
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center justify-between w-full">
                                                                        {(metric as any).detail && (
                                                                            <p className="text-[9px] text-slate-500 leading-none truncate opacity-70 max-w-[70px]">
                                                                                {(metric as any).detail.split(':')[0]}
                                                                            </p>
                                                                        )}
                                                                        {(metric as any).trendLabel && (
                                                                            <span className={"text-[8px] font-bold px-1 rounded " + (isUp ? 'bg-amber-500/10 text-amber-500' : isDown ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700/30 text-slate-500')}>
                                                                                {(metric as any).trendLabel}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-2"><AnimatedSection delay={0} triggerOnce={false} variants={{ hidden: { opacity: 1 }, visible: { opacity: 1 } }}>
                        {({ isInView }: { isInView?: boolean } = {}) => (
                            <div className="h-full relative rounded-3xl border border-slate-800 bg-card p-4 overflow-hidden shadow-lg">

                                <div className="relative z-10">
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
                                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" style={{ width: (isInView ? store.percentage : 0) + "%" }}></div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-slate-500 text-center py-4">No data</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </AnimatedSection></div>

                    {/* 6. Category Breakdown (Linear Bars) */}
                    <div className="col-span-2 relative rounded-3xl border border-slate-800 bg-card p-4 transition-all duration-300 overflow-hidden group shadow-lg hover:border-slate-700">

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wide">Spending Breakdown</h3>
                                <ShoppingBag className="text-slate-600 w-4 h-4" />
                            </div>
                            <div className="space-y-4">
                                {(metrics.categoryData || []).slice(0, 4).map((d, i) => (
                                    <AnimatedSection key={i} delay={0} triggerOnce={false} variants={{ hidden: { opacity: 1 }, visible: { opacity: 1 } }}>
                                        {({ isInView }: { isInView?: boolean } = {}) => (
                                            <motion.div
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
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
                                                        style={{ width: (isInView ? d.percentage : 0) + "%", backgroundColor: getCategoryColor(d.name) || '#94a3b8', color: getCategoryColor(d.name) || '#94a3b8' }}
                                                    ></div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatedSection>
                                ))}
                                {metrics.categoryData.length === 0 && (
                                    <p className="text-slate-500 text-xs text-center py-2">No spending data yet.</p>
                                )}
                            </div>
                        </div>
                    </div >

                    {/* 7. Recent Log (Compact List) */}
                    < div className="col-span-2" >
                        <h3 className="text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-3 ml-1 mt-2">Recent Logs</h3>
                        <div className="space-y-2">
                            {(receipts || []).slice(0, 3).map(r => (
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    key={r.id}
                                    onClick={() => onViewReceipt?.(r)}
                                    className="w-full bg-surface border border-white/5 rounded-2xl p-3 flex justify-between items-center shadow-sm hover:border-white/15 hover:bg-surfaceHighlight transition-all duration-300 text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={"w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 " + (
                                            r.type === 'bill'
                                                ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                                                : 'bg-surfaceHighlight text-slate-400 border border-white/5'
                                        )}>
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
                                        <span className={"font-mono text-sm font-bold tracking-tight tabular-nums " + (r.type === 'bill' ? 'text-indigo-400' : 'text-white')}>
                                            €{r.items.reduce((acc, i) => (!ageRestricted || !i.isRestricted ? acc + i.price : acc), 0).toFixed(2)}
                                        </span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div >

                </div >



                {/* Drill Down Modal */}
                {
                    drillDown && (
                        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
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
                                                            style={{ width: width + "%", backgroundColor: getCategoryColor(drillDown.category) || '#818cf8', color: getCategoryColor(drillDown.category) || '#818cf8' }}
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
                {/* Goal Details Modal */}
                <GoalDetailsModal
                    isOpen={!!selectedGoal}
                    onClose={() => setSelectedGoal(null)}
                    goal={selectedGoal}
                    receipts={receipts}
                />

                {/* Achievement Details Modal */}
                <AnimatePresence>
                    {selectedAchievement && (
                        <AchievementDetailsModal
                            achievement={selectedAchievement}
                            onClose={() => setSelectedAchievement(null)}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedSnapshotMetric && (
                        <SnapshotDetailsModal
                            metric={selectedSnapshotMetric}
                            onClose={() => setSelectedSnapshotMetric(null)}
                        />
                    )}
                </AnimatePresence>

                {
                    showCoParentingModal && (
                        <CoParentingDetailsModal
                            isOpen={showCoParentingModal}
                            onClose={() => setShowCoParentingModal(false)}
                            metrics={{
                                equity: metrics.equity,
                                stability: metrics.stability,
                                harmony: metrics.harmony
                            }}
                            custodyDays={custodyDays}
                        />
                    )
                }
            </div >
        </motion.div >
    );
};

export default Dashboard;