
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Receipt, Category, CategoryDefinition, Goal, GoalType, CustodyDay, User, Achievement } from '../types';
import { Target, TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, PieChart as PieIcon, Shield, ShieldCheck, Calendar, Wallet, ArrowRight, Sparkles, Trophy, Pizza, Beer, Cigarette, Gamepad2, Dices, Coffee, Cookie, ShoppingCart, Shirt, Car, Tv, PiggyBank, ShoppingBag, X, Bell, FileText, Store, ArrowUp, BarChart3, Check, Hash, ArrowUpRight, CalendarDays, Activity, Users, Gift, Plus, CheckCircle2, Award, Brain, ArrowDown, Flame, Banknote, Coins, Sunrise, Medal, Crown, HeartHandshake, CalendarCheck, PartyPopper, Scale, Heart, Baby, GraduationCap, Cake, Dribbble, Palette, Stethoscope } from 'lucide-react';
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
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { FinancialSnapshot } from './FinancialSnapshot';
import { SpendingDistribution } from './SpendingDistribution';
import { BudgetOverview } from './BudgetOverview';
import SnapshotDetailsModal from './SnapshotDetailsModal';
import { ProBlurGuard } from './ProBlurGuard';
import SubscriptionModal from './SubscriptionModal';
import { useLanguage } from '../contexts/LanguageContext';

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
    items: { name: string; price: number; date: string; store: string; category: string }[];
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
    const { t } = useLanguage();

    const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [chartView, setChartView] = useState<'week' | 'month' | 'year'>('week');


    const [insightView, setInsightView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [goalView, setGoalView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [custodyView, setCustodyView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
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
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

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

    // Achievement Description Helper
    const getAchievementDescription = (achievementId: string): string => {
        const descriptions: Record<string, string> = {
            // Goal & Budget
            'goal_setter': 'You\'ve enabled goal tracking to monitor your spending habits. Keep it up!',
            'budget_master': 'Excellent work! You\'ve stayed under 90% of your monthly budget.',
            'budget_hero': 'Outstanding! You\'re using less than 75% of your budget. You\'re a budgeting champion!',
            'frugal_genius': 'Incredible! You\'ve used less than half your budget. You\'re a master of frugality!',

            // Trends
            'trend_setter': 'Your spending this week is lower than last week. Great progress!',
            'downward_spiral': 'Amazing! You\'ve reduced spending by over 20% this week. Keep the momentum!',

            // Tracking Consistency
            'consistent_tracker': 'You\'ve been consistently tracking your expenses. Well done!',
            'daily_logger': 'You\'ve tracked expenses on 5 out of the last 7 days. Consistency is key!',
            'week_warrior': 'You\'ve logged 10+ receipts this week. You\'re on fire!',

            // Goal Compliance
            'clean_sheet': 'Amazing! You\'ve kept all your goal spending under €80 this month.',
            'goal_crusher': 'You\'ve maintained 2+ goal streaks for a week. Incredible discipline!',

            // Spending Milestones
            'high_roller': 'You\'ve made a purchase over €100. Remember to track big expenses!',
            'big_spender': 'Whoa! A €200+ purchase. Make sure it aligns with your goals.',
            'penny_pincher': 'You\'ve made 10+ small purchases under €10. Every penny counts!',

            // Time-based
            'weekend_warrior': 'You\'ve tracked expenses on the weekend. Stay consistent!',
            'early_bird': 'Welcome aboard! You\'ve logged your first 5 receipts.',
            'veteran': 'You\'ve tracked 50 receipts! You\'re a TrueTrack veteran.',
            'centurion': 'Legendary! 100 receipts tracked. You\'re a tracking master!',

            // Co-Parenting
            'coparent_hero': 'You\'ve tracked 30+ custody days! You\'re committed to co-parenting excellence.',
            'calendar_keeper': 'You\'ve started adding activities to your custody calendar. Great organization!',
            'activity_planner': 'You\'ve planned 10+ activities for your child. You\'re an amazing parent!',
            'fair_share': 'Your spending equity is within 10% of 50/50. Fair and balanced!',
            'harmony_keeper': 'Your harmony score is 80+! You\'re maintaining excellent co-parenting relations.',
            'child_first': 'You\'ve tracked 20+ child-related expenses. Your child comes first!',
            'event_master': 'You\'ve planned 3+ special events (birthdays, school). Creating memories!',

            // Category
            'health_conscious': 'You\'ve spent €50+ on health. Investing in wellness!',
            'education_investor': 'You\'ve invested €100+ in education. Knowledge is power!'
        };
        return descriptions[achievementId] || 'Keep up the great work tracking your expenses!';
    };

    // Goal Gauge Component
    const GoalGauge = ({ goal, total, isInView = true, trend, intensity, showIndicators }: { goal: Goal, total: number, isInView?: boolean, trend?: 'up' | 'down' | 'flat', intensity?: 'low' | 'medium' | 'high', showIndicators?: boolean }) => {
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
                                isAnimationActive={isInView}
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
    const daysInMonth = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(), []);

    const metrics = useDashboardMetrics(
        receipts || [],
        monthlyBudget || 0,
        daysInMonth,
        childSupportMode,
        dateFilter,
        ageRestricted
    );


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
            goals,
            t // Pass translation function
        );
    }, [metrics.thisMonthTotal, monthlyBudget, metrics.sourceReceipts, custodyDays, metrics.lastMonthTotal, goals, t]);

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
                { label: t('dashboard.currentSpend'), value: "€" + totalSpent.toFixed(0) },
                { label: t('dashboard.remainingBudget'), value: "€" + Math.max(0, monthlyBudget - totalSpent).toFixed(0) },
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
                    { label: t('dashboard.totalSpent'), value: "€" + metrics.thisMonthTotal.toFixed(0) },
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
                        { label: t('dashboard.weekdayTotal'), value: "€" + (totalSpent - weekendSpend).toFixed(0) }
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
            className="w-full h-full pt-0 px-4 pb-4 scroll-smooth no-scrollbar"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >

            {/* Main Content Wrapper */}
            <div className="pt-0 pb-32 space-y-4">

                <motion.div
                    ref={budgetCardRef}
                    key={metrics.thisMonthTotal}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-0"
                >
                    <SpotlightCard
                        style={ambientMode ? ambientStyle : {}}
                        className={"relative rounded-3xl border p-4 transition-all duration-1000 overflow-hidden group mb-4 " + (ambientMode ? 'bg-card' : 'bg-card border-slate-800 shadow-lg')}
                    >

                        <BudgetOverview
                            metrics={metrics}
                            budgetView={budgetView}
                            setBudgetView={setBudgetView}
                            monthlyBudget={monthlyBudget || 0}
                        />

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
                            <VisibilitySensor threshold={0.2}>
                                {({ isVisible }: { isVisible: boolean }) => (
                                    <>
                                        <SpendingDistribution
                                            metrics={metrics}
                                            pieView={pieView}
                                            setPieView={setPieView}
                                            getCategoryColor={getCategoryColor}
                                            onCategoryClick={setSelectedCategory}
                                            selectedCategory={selectedCategory}
                                            childSupportMode={childSupportMode}
                                            isVisible={isVisible}
                                        />
                                    </>
                                )}
                            </VisibilitySensor>
                        </div>
                    </SpotlightCard>
                </motion.div>

                {/* BENTO GRID LAYOUT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">

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
                                                                <h3 className="text-sm font-bold text-slate-200">Co-parenting</h3>
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
                                                                onClick={() => { HapticsService.selection(); setCustodyView('daily'); }}
                                                                className={"px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded-md transition-all " + (custodyView === 'daily' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                            >
                                                                D
                                                            </motion.button>
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => { HapticsService.selection(); setCustodyView('weekly'); }}
                                                                className={"px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded-md transition-all " + (custodyView === 'weekly' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                            >
                                                                W
                                                            </motion.button>
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => { HapticsService.selection(); setCustodyView('monthly'); }}
                                                                className={"px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded-md transition-all " + (custodyView === 'monthly' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                            >
                                                                M
                                                            </motion.button>
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => { HapticsService.selection(); setCustodyView('yearly'); }}
                                                                className={"px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded-md transition-all " + (custodyView === 'yearly' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                            >
                                                                Y
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
                                                        ) : custodyView === 'yearly' ? (
                                                            <motion.div
                                                                key="yearly"
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="w-full space-y-4"
                                                            >
                                                                {/* Year-to-Date Summary */}
                                                                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4 rounded-xl border border-purple-500/20">
                                                                    <p className="text-[10px] text-purple-300 font-medium uppercase tracking-wide mb-2">Year to Date</p>
                                                                    <div className="flex items-baseline gap-2 mb-1">
                                                                        <p className="text-3xl font-heading font-bold text-white">
                                                                            {(() => {
                                                                                const yearStart = new Date(today.getFullYear(), 0, 1);
                                                                                return custodyDays.filter(day => {
                                                                                    const d = new Date(day.date);
                                                                                    return d >= yearStart && d <= today && day.withYou;
                                                                                }).length;
                                                                            })()}
                                                                        </p>
                                                                        <span className="text-sm text-slate-400">days with you</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-400">
                                                                        {Math.round(((() => {
                                                                            const yearStart = new Date(today.getFullYear(), 0, 1);
                                                                            const daysWithYou = custodyDays.filter(day => {
                                                                                const d = new Date(day.date);
                                                                                return d >= yearStart && d <= today && day.withYou;
                                                                            }).length;
                                                                            const daysPassed = Math.ceil((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
                                                                            return (daysWithYou / daysPassed) * 100;
                                                                        })()))}% of {Math.ceil((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24))} days
                                                                    </p>
                                                                </div>

                                                                {/* AI Trend Analysis */}
                                                                <div className="space-y-3">
                                                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Trend Analysis</p>

                                                                    {/* This Week */}
                                                                    <div className="bg-slate-800/30 p-3 rounded-lg border border-white/5">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-semibold text-slate-300">This Week</span>
                                                                            <span className={"text-xs font-bold " + ((() => {
                                                                                const weekStart = new Date(today);
                                                                                weekStart.setDate(today.getDate() - today.getDay());
                                                                                const weekDays = custodyDays.filter(day => {
                                                                                    const d = new Date(day.date);
                                                                                    return d >= weekStart && d <= today && day.withYou;
                                                                                }).length;
                                                                                return weekDays >= 4 ? 'text-emerald-400' : weekDays >= 2 ? 'text-amber-400' : 'text-red-400';
                                                                            })())}>
                                                                                {(() => {
                                                                                    const weekStart = new Date(today);
                                                                                    weekStart.setDate(today.getDate() - today.getDay());
                                                                                    const weekDays = custodyDays.filter(day => {
                                                                                        const d = new Date(day.date);
                                                                                        return d >= weekStart && d <= today && day.withYou;
                                                                                    }).length;
                                                                                    return weekDays >= 4 ? '✓ Positive' : weekDays >= 2 ? '~ Average' : '✗ Low';
                                                                                })()}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-400">
                                                                            {(() => {
                                                                                const weekStart = new Date(today);
                                                                                weekStart.setDate(today.getDate() - today.getDay());
                                                                                const weekDays = custodyDays.filter(day => {
                                                                                    const d = new Date(day.date);
                                                                                    return d >= weekStart && d <= today && day.withYou;
                                                                                }).length;
                                                                                return `${weekDays} of 7 days • ${Math.round((weekDays / 7) * 100)}%`;
                                                                            })()}
                                                                        </p>
                                                                    </div>

                                                                    {/* This Month */}
                                                                    <div className="bg-slate-800/30 p-3 rounded-lg border border-white/5">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-semibold text-slate-300">This Month</span>
                                                                            <span className={"text-xs font-bold " + (monthDaysCount >= 15 ? 'text-emerald-400' : monthDaysCount >= 10 ? 'text-amber-400' : 'text-red-400')}>
                                                                                {monthDaysCount >= 15 ? '✓ Positive' : monthDaysCount >= 10 ? '~ Average' : '✗ Low'}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-400">
                                                                            {monthDaysCount} of {new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()} days • {Math.round((monthDaysCount / new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()) * 100)}%
                                                                        </p>
                                                                    </div>

                                                                    {/* Year Overall */}
                                                                    <div className="bg-slate-800/30 p-3 rounded-lg border border-white/5">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-semibold text-slate-300">Year Overall</span>
                                                                            <span className={"text-xs font-bold " + ((() => {
                                                                                const yearStart = new Date(today.getFullYear(), 0, 1);
                                                                                const daysWithYou = custodyDays.filter(day => {
                                                                                    const d = new Date(day.date);
                                                                                    return d >= yearStart && d <= today && day.withYou;
                                                                                }).length;
                                                                                const daysPassed = Math.ceil((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
                                                                                const pct = (daysWithYou / daysPassed) * 100;
                                                                                return pct >= 50 ? 'text-emerald-400' : pct >= 35 ? 'text-amber-400' : 'text-red-400';
                                                                            })())}>
                                                                                {(() => {
                                                                                    const yearStart = new Date(today.getFullYear(), 0, 1);
                                                                                    const daysWithYou = custodyDays.filter(day => {
                                                                                        const d = new Date(day.date);
                                                                                        return d >= yearStart && d <= today && day.withYou;
                                                                                    }).length;
                                                                                    const daysPassed = Math.ceil((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
                                                                                    const pct = (daysWithYou / daysPassed) * 100;
                                                                                    return pct >= 50 ? '✓ Positive' : pct >= 35 ? '~ Average' : '✗ Needs Attention';
                                                                                })()}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-400">
                                                                            {(() => {
                                                                                const yearStart = new Date(today.getFullYear(), 0, 1);
                                                                                const daysWithYou = custodyDays.filter(day => {
                                                                                    const d = new Date(day.date);
                                                                                    return d >= yearStart && d <= today && day.withYou;
                                                                                }).length;
                                                                                const daysPassed = Math.ceil((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
                                                                                return `${daysWithYou} of ${daysPassed} days • ${Math.round((daysWithYou / daysPassed) * 100)}%`;
                                                                            })()}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* AI Insight */}
                                                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                                                    <div className="flex items-start gap-2">
                                                                        <Sparkles size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                                                        <div>
                                                                            <p className="text-xs font-semibold text-blue-300 mb-1">AI Insight</p>
                                                                            <p className="text-[10px] text-slate-300 leading-relaxed">
                                                                                {(() => {
                                                                                    const yearStart = new Date(today.getFullYear(), 0, 1);
                                                                                    const daysWithYou = custodyDays.filter(day => {
                                                                                        const d = new Date(day.date);
                                                                                        return d >= yearStart && d <= today && day.withYou;
                                                                                    }).length;
                                                                                    const daysPassed = Math.ceil((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
                                                                                    const yearPct = (daysWithYou / daysPassed) * 100;
                                                                                    const weekStart = new Date(today);
                                                                                    weekStart.setDate(today.getDate() - today.getDay());
                                                                                    const weekDays = custodyDays.filter(day => {
                                                                                        const d = new Date(day.date);
                                                                                        return d >= weekStart && d <= today && day.withYou;
                                                                                    }).length;
                                                                                    const weekPct = (weekDays / 7) * 100;
                                                                                    const monthPct = (monthDaysCount / new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()) * 100;

                                                                                    if (weekPct > 50 && monthPct > 50 && yearPct > 50) {
                                                                                        return "You're maintaining strong custody time across all periods. Keep up the consistent presence!";
                                                                                    } else if (weekPct > 50 && monthPct > 40 && yearPct < 40) {
                                                                                        return "Recent improvements are promising! This week and month show positive trends, though the year overall needs attention. Continue this momentum.";
                                                                                    } else if (weekPct < 40 && monthPct < 40 && yearPct < 40) {
                                                                                        return "Custody time is below target across all periods. Consider discussing schedule adjustments with your co-parent.";
                                                                                    } else if (weekPct < 40 && yearPct > 50) {
                                                                                        return "This week is lower than usual, but your year-to-date average is solid. Temporary dip or pattern change?";
                                                                                    } else {
                                                                                        return "Mixed trends detected. Focus on maintaining consistency week-to-week for better long-term balance.";
                                                                                    }
                                                                                })()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
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
                                                                                    const now = new Date();
                                                                                    const currentMonth = now.getMonth();
                                                                                    const currentYear = now.getFullYear();

                                                                                    // Get Week currentWeekStart
                                                                                    const currentWeekStart = new Date(now);
                                                                                    const day = currentWeekStart.getDay() || 7;
                                                                                    if (day !== 1) currentWeekStart.setHours(-24 * (day - 1));
                                                                                    currentWeekStart.setHours(0, 0, 0, 0);

                                                                                    const filteredDays = custodyDays.filter(d => {
                                                                                        const dDate = new Date(d.date);
                                                                                        // Handle manual parse
                                                                                        let targetDate = dDate;
                                                                                        if (d.date.includes('-') && !d.date.includes('T')) {
                                                                                            const parts = d.date.split('-');
                                                                                            targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                                                                                        }

                                                                                        if (custodyView === 'monthly') {
                                                                                            return targetDate.getMonth() === currentMonth && targetDate.getFullYear() === currentYear;
                                                                                        } else {
                                                                                            return targetDate >= currentWeekStart;
                                                                                        }
                                                                                    });

                                                                                    const totalDays = filteredDays.length;
                                                                                    const myDays = filteredDays.filter(d => d.status === 'me').length;
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

                                                    {/* Live Activity Feed */}
                                                    {(() => {
                                                        const { recentChanges } = useData();
                                                        if (!recentChanges || recentChanges.length === 0) return null;

                                                        const getEventIcon = (type?: string) => {
                                                            if (!type) return <CalendarDays size={14} className="text-slate-400" />;
                                                            const lower = type.toLowerCase();
                                                            if (lower.includes('birthday') || lower.includes('bday')) return <Cake size={14} className="text-pink-400" />;
                                                            if (lower.includes('sport') || lower.includes('soccer')) return <Dribbble size={14} className="text-orange-400" />;
                                                            if (lower.includes('school')) return <GraduationCap size={14} className="text-blue-400" />;
                                                            if (lower.includes('playdate')) return <Palette size={14} className="text-purple-400" />;
                                                            if (lower.includes('doctor') || lower.includes('health')) return <Stethoscope size={14} className="text-green-400" />;
                                                            return <CalendarDays size={14} className="text-slate-400" />;
                                                        };

                                                        const getRelativeTime = (timestamp: string) => {
                                                            const now = new Date();
                                                            const then = new Date(timestamp);
                                                            const diffMs = now.getTime() - then.getTime();
                                                            const diffMins = Math.floor(diffMs / 60000);
                                                            const diffHours = Math.floor(diffMins / 60);
                                                            const diffDays = Math.floor(diffHours / 24);

                                                            if (diffMins < 1) return 'Just now';
                                                            if (diffMins < 60) return `${diffMins}m ago`;
                                                            if (diffHours < 24) return `${diffHours}h ago`;
                                                            return `${diffDays}d ago`;
                                                        };

                                                        const getChangeColor = (type: string) => {
                                                            switch (type) {
                                                                case 'added': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' };
                                                                case 'modified': return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' };
                                                                case 'deleted': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' };
                                                                case 'custody_changed': return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' };
                                                                default: return { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400' };
                                                            }
                                                        };

                                                        const getChangeLabel = (type: string) => {
                                                            switch (type) {
                                                                case 'added': return 'Added';
                                                                case 'modified': return 'Updated';
                                                                case 'deleted': return 'Removed';
                                                                case 'custody_changed': return 'Custody';
                                                                default: return 'Changed';
                                                            }
                                                        };

                                                        return (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="mb-3 rounded-xl bg-purple-500/5 border border-purple-500/10 overflow-hidden"
                                                            >
                                                                <div className="p-2.5 border-b border-purple-500/10 flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                                                                            <Bell className="w-3 h-3" />
                                                                        </div>
                                                                        <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">Recent Activity</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            useData().setRecentChanges?.([]);
                                                                        }}
                                                                        className="p-1 text-purple-500/50 hover:text-purple-400 transition-colors"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                                <div className="max-h-40 overflow-y-auto p-2 space-y-1.5 scroll-smooth">
                                                                    {recentChanges.slice(0, 5).map((change) => {
                                                                        const colors = getChangeColor(change.type);
                                                                        return (
                                                                            <motion.div
                                                                                key={change.id}
                                                                                initial={{ opacity: 0, x: -10 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                className={`flex items-start gap-2 p-2 rounded-lg border ${colors.bg} ${colors.border}`}
                                                                            >
                                                                                <span className="text-sm mt-0.5">{getEventIcon(change.eventType)}</span>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                                                        <span className={`text-[9px] font-bold uppercase tracking-wide ${colors.text}`}>
                                                                                            {getChangeLabel(change.type)}
                                                                                        </span>
                                                                                        <span className="text-[8px] text-slate-500">•</span>
                                                                                        <span className="text-[8px] text-slate-500 font-medium">
                                                                                            {getRelativeTime(change.timestamp)}
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="text-[10px] text-slate-300 font-medium leading-tight truncate">
                                                                                        {change.eventTitle || change.custodyStatus || 'Event'}
                                                                                        {change.date && ` - ${new Date(change.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                                                                        {change.startTime && ` at ${change.startTime}`}
                                                                                    </p>
                                                                                </div>
                                                                            </motion.div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })()}

                                                    {/* Upcoming Activities */}
                                                    <div className="mt-4 pt-4 border-t border-white/5">
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
                    {/* Trends Chart (Moved to Top) */}
                    <ProBlurGuard isPro={isProMode} onClick={() => setShowSubscriptionModal(true)} label="Advanced Analytics" className={!isProMode ? "col-span-2 rounded-3xl" : "col-span-2"}>
                        <div className="flex flex-col gap-6">
                            <div className="col-span-2">
                                <SpotlightCard className="h-full relative rounded-3xl border border-slate-800 bg-card p-4 flex flex-col min-h-[280px] shadow-lg">
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-blue-400" />
                                                {t('dashboard.trends')}
                                            </h3>
                                            <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => { HapticsService.selection(); setChartView('week'); }}
                                                    className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (chartView === 'week' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                >
                                                    {t('charts.week')}
                                                </motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => { HapticsService.selection(); setChartView('month'); }}
                                                    className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (chartView === 'month' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                >
                                                    {t('charts.month')}
                                                </motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => { HapticsService.selection(); setChartView('year'); }}
                                                    className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (chartView === 'year' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                >
                                                    {t('charts.year')}
                                                </motion.button>
                                            </div>
                                        </div>
                                        <div className="flex-1 w-full">
                                            <AnimatedSection className="w-full h-full" noSlide>
                                                {({ isInView }: { isInView?: boolean } = {}) => (
                                                    <TrendsChart
                                                        isVisible={!!isInView}
                                                        activeData={chartView === 'week' ? metrics.weekData : chartView === 'month' ? metrics.monthData : metrics.yearData}
                                                        categories={categories}
                                                        chartView={chartView}
                                                        layoutId={isCoParentingMode ? 'coparent' : 'single'}
                                                    />
                                                )}
                                            </AnimatedSection>
                                        </div>
                                    </div>

                                </SpotlightCard>
                            </div>



                            {/* Monthly Insights (Expanded) */}
                            {/* Monthly Insights (Expanded) */}
                            <motion.div variants={itemVariants} className="col-span-2">
                                <SpotlightCard
                                    onClick={isCoParentingMode ? onProvisionClick : undefined}
                                    className={"rounded-3xl border border-slate-800 bg-card p-4 shadow-lg transition-all " + (isCoParentingMode ? 'cursor-pointer hover:border-slate-700' : '')}
                                    spotlightColor="rgba(59, 130, 246, 0.1)" // Blue tint
                                >
                                    <div className="mb-4 relative z-10">

                                        <div className="flex items-center justify-between mb-4 relative z-10 w-full">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                                    <Sparkles className="w-5 h-5 text-yellow-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                                        {t('dashboard.insights')}
                                                    </h3>
                                                    <p className="text-[10px] font-medium text-slate-400">
                                                        {t('dashboard.performance')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setInsightView('daily'); }}
                                                    className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (insightView === 'daily' ? 'bg-blue-500/20 text-blue-400 shadow-sm ring-1 ring-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')}
                                                >
                                                    D
                                                </button>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setInsightView('weekly'); }}
                                                    className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (insightView === 'weekly' ? 'bg-blue-500/20 text-blue-400 shadow-sm ring-1 ring-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')}
                                                >
                                                    W
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setInsightView('monthly'); }}
                                                    className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (insightView === 'monthly' ? 'bg-blue-500/20 text-blue-400 shadow-sm ring-1 ring-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')}
                                                >
                                                    M
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

                                    </div>
                                </SpotlightCard>
                            </motion.div>

                            {/* Co-Parenting Cards */}




                            {/* 4. Financial Snapshot - Unified Design */}
                            <div className="col-span-2">
                                <SpotlightCard className="relative rounded-3xl overflow-hidden group shadow-lg border border-slate-800 bg-card">

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
                                                                const trendColor = isUp ? 'text-red-400' : isDown ? 'text-emerald-400' : 'text-slate-500';
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
                                </SpotlightCard>
                            </div>

                            {/* Top Categories Card (Moved to bottom) */}



                            {/* Goal Breakdown (500ms) */}
                            <div className="col-span-2">
                                <AnimatedSection delay={0} triggerOnce={false} variants={{ hidden: { opacity: 1 }, visible: { opacity: 1 } }}>
                                    {({ isInView }: { isInView?: boolean } = {}) => {
                                        // Logic:
                                        // 1. If has goals enabled -> Show Grid (Blurred if Free)
                                        // 2. If NO goals enabled -> Show CTA (Clean for all, but action is locked if Free)

                                        const hasEnabledGoals = goals && goals.some(g => g.isEnabled);

                                        if (!hasEnabledGoals) {
                                            return (
                                                <div className="col-span-2">
                                                    <motion.div
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            HapticsService.selection();
                                                            if (!isProMode) {
                                                                setShowSubscriptionModal(true);
                                                            } else {
                                                                onHabitsClick();
                                                            }
                                                        }}
                                                        className="rounded-3xl border border-slate-800 bg-card p-4 shadow-lg relative overflow-hidden flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all"
                                                    >
                                                        <div>
                                                            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2 uppercase tracking-wide mb-1">
                                                                <Target className={"w-4 h-4 " + (isProMode ? "text-purple-400" : "text-slate-500")} />
                                                                {isProMode ? "Track Your Habits" : "Goal Tracking"}
                                                            </h3>
                                                            <p className="text-xs text-slate-500">
                                                                {isProMode ? "Enable goals in settings to track spending." : "Upgrade to Pro to track spending goals."}
                                                            </p>
                                                        </div>
                                                        <div className={"w-8 h-8 rounded-full flex items-center justify-center " + (isProMode ? "bg-purple-500/10" : "bg-slate-800/50")}>
                                                            {isProMode ? <ArrowRight size={16} className="text-purple-400" /> : <Shield size={14} className="text-slate-500" />}
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            );
                                        }

                                        // Has Goals - Show Charts (Blurred if Free)
                                        return (() => {
                                            // Extract Logic for View filtering (unchanged)
                                            const filteredGoalReceipts = receipts.filter(r => {
                                                const now = new Date();
                                                const rDate = new Date(r.date);
                                                if (goalView === 'daily') return rDate.toDateString() === now.toDateString();
                                                if (goalView === 'weekly') {
                                                    const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7);
                                                    return rDate >= oneWeekAgo;
                                                }
                                                return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
                                            });

                                            // Calculate Previous Period Data (unchanged)
                                            // ... simplified for injection, reusing existing memo logic would be better but component structure is deep.
                                            // To avoid duplication complexity, I will keep the original heavy logic inside.

                                            // RE-CALCULATION BLOCK (Duplicated because original was inline)
                                            // Optimized: moved logic inside to match context
                                            const previousGoalReceipts = receipts.filter(r => {
                                                const now = new Date();
                                                const rDate = new Date(r.date);
                                                if (goalView === 'daily') {
                                                    const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);
                                                    return rDate.toDateString() === yesterday.toDateString();
                                                } else if (goalView === 'weekly') {
                                                    const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7);
                                                    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(now.getDate() - 14);
                                                    return rDate >= twoWeeksAgo && rDate < oneWeekAgo;
                                                } else {
                                                    const lastMonth = new Date(); lastMonth.setMonth(now.getMonth() - 1);
                                                    return rDate.getMonth() === lastMonth.getMonth() && rDate.getFullYear() === lastMonth.getFullYear();
                                                }
                                            });

                                            // Achievements Logic (Recalculated)
                                            const achievements = [
                                                // Goal & Budget Achievements
                                                { id: 'goal_setter', label: 'Goal Setter', icon: <Target className="w-5 h-5" />, unlocked: goals.some(g => g.isEnabled), color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
                                                { id: 'budget_master', label: 'Budget Master', icon: <Shield className="w-5 h-5" />, unlocked: metrics.thisMonthTotal < monthlyBudget * 0.9, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
                                                { id: 'budget_hero', label: 'Budget Hero', icon: <Award className="w-5 h-5" />, unlocked: metrics.thisMonthTotal < monthlyBudget * 0.75, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
                                                { id: 'frugal_genius', label: 'Frugal Genius', icon: <Brain className="w-5 h-5" />, unlocked: metrics.thisMonthTotal < monthlyBudget * 0.5, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' },

                                                // Trend Achievements
                                                { id: 'trend_setter', label: 'Trend Setter', icon: <TrendingDown className="w-5 h-5" />, unlocked: metrics.thisWeekTotal < metrics.lastWeekTotal, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
                                                { id: 'downward_spiral', label: 'Downward Spiral', icon: <ArrowDown className="w-5 h-5" />, unlocked: metrics.thisWeekTotal < metrics.lastWeekTotal * 0.8, color: 'text-teal-400', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/20' },

                                                // Tracking Consistency
                                                { id: 'consistent_tracker', label: 'Consistent', icon: <FileText className="w-5 h-5" />, unlocked: receipts.some(r => (new Date().getTime() - new Date(r.date).getTime()) < 48 * 60 * 60 * 1000), color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
                                                { id: 'daily_logger', label: 'Daily Logger', icon: <Calendar className="w-5 h-5" />, unlocked: (() => { const last7Days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toDateString(); }); return last7Days.filter(day => receipts.some(r => new Date(r.date).toDateString() === day)).length >= 5; })(), color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
                                                { id: 'week_warrior', label: 'Week Warrior', icon: <Zap className="w-5 h-5" />, unlocked: receipts.filter(r => (new Date().getTime() - new Date(r.date).getTime()) < 7 * 24 * 60 * 60 * 1000).length >= 10, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },

                                                // Goal Compliance
                                                { id: 'clean_sheet', label: 'Clean Sheet', icon: <Sparkles className="w-5 h-5" />, unlocked: !goals.some(g => { let total = 0; const currentMonth = new Date().getMonth(); receipts.forEach(r => { if (new Date(r.date).getMonth() === currentMonth) (r.items || []).forEach(i => { if (i.goalType === g.type) total += i.price * (i.quantity || 1); }); }); return total > 80; }), color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
                                                { id: 'goal_crusher', label: 'Goal Crusher', icon: <Flame className="w-5 h-5" />, unlocked: goals.filter(g => g.isEnabled && g.streak >= 7).length >= 2, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20' },

                                                // Spending Milestones
                                                { id: 'high_roller', label: 'High Roller', icon: <Car className="w-5 h-5" />, unlocked: receipts.some(r => r.total > 100), color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
                                                { id: 'big_spender', label: 'Big Spender', icon: <Banknote className="w-5 h-5" />, unlocked: receipts.some(r => r.total > 200), color: 'text-fuchsia-400', bgColor: 'bg-fuchsia-500/10', borderColor: 'border-fuchsia-500/20' },
                                                { id: 'penny_pincher', label: 'Penny Pincher', icon: <Coins className="w-5 h-5" />, unlocked: receipts.filter(r => r.total < 10).length >= 10, color: 'text-lime-400', bgColor: 'bg-lime-500/10', borderColor: 'border-lime-500/20' },

                                                // Time-based
                                                { id: 'weekend_warrior', label: 'Weekender', icon: <Beer className="w-5 h-5" />, unlocked: receipts.some(r => { const d = new Date(r.date).getDay(); return d === 0 || d === 6; }), color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
                                                { id: 'early_bird', label: 'Early Bird', icon: <Sunrise className="w-5 h-5" />, unlocked: receipts.length >= 5, color: 'text-sky-400', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/20' },
                                                { id: 'veteran', label: 'Veteran', icon: <Medal className="w-5 h-5" />, unlocked: receipts.length >= 50, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
                                                { id: 'centurion', label: 'Centurion', icon: <Crown className="w-5 h-5" />, unlocked: receipts.length >= 100, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },

                                                // Co-Parenting Achievements
                                                { id: 'coparent_hero', label: 'Co-Parent Hero', icon: <HeartHandshake className="w-5 h-5" />, unlocked: isCoParentingMode && custodyDays.filter(d => d.status !== 'none').length >= 30, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
                                                { id: 'calendar_keeper', label: 'Calendar Keeper', icon: <CalendarCheck className="w-5 h-5" />, unlocked: isCoParentingMode && custodyDays.some(d => d.activities && d.activities.length > 0), color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
                                                { id: 'activity_planner', label: 'Activity Planner', icon: <PartyPopper className="w-5 h-5" />, unlocked: isCoParentingMode && custodyDays.flatMap(d => d.activities || []).length >= 10, color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
                                                { id: 'fair_share', label: 'Fair Share', icon: <Scale className="w-5 h-5" />, unlocked: isCoParentingMode && Math.abs(metrics.equity - 50) < 10, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
                                                { id: 'harmony_keeper', label: 'Harmony Keeper', icon: <Heart className="w-5 h-5" />, unlocked: isCoParentingMode && metrics.harmony >= 80, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20' },
                                                { id: 'child_first', label: 'Child First', icon: <Baby className="w-5 h-5" />, unlocked: receipts.flatMap(r => r.items).filter(i => i.isChildRelated).length >= 20, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
                                                { id: 'event_master', label: 'Event Master', icon: <Sparkles className="w-5 h-5" />, unlocked: isCoParentingMode && custodyDays.flatMap(d => d.activities || []).filter(a => a.type === 'birthday' || a.type === 'school').length >= 3, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' },

                                                // Category Achievements
                                                { id: 'health_conscious', label: 'Health Conscious', icon: <Heart className="w-5 h-5" />, unlocked: receipts.flatMap(r => r.items).filter(i => i.category === 'Health').reduce((sum, i) => sum + i.price, 0) > 50, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
                                                { id: 'education_investor', label: 'Education Investor', icon: <GraduationCap className="w-5 h-5" />, unlocked: receipts.flatMap(r => r.items).filter(i => i.category === 'Education').reduce((sum, i) => sum + i.price, 0) > 100, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
                                            ];

                                            const unlockedCount = achievements.filter(a => a.unlocked).length;

                                            return (
                                                <div className="rounded-3xl border border-slate-800 bg-card p-4 shadow-lg transition-all relative overflow-hidden group">
                                                    {/* Background Gradient */}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                                                    <div className="mb-4 relative z-10">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                                                <Target className="w-4 h-4 text-purple-400" />
                                                                Goal Breakdown
                                                            </h3>
                                                            <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                                                                {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                                                                    <button
                                                                        key={view}
                                                                        onClick={(e) => { e.stopPropagation(); setGoalView(view); }}
                                                                        className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (goalView === view ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                                    >
                                                                        {view === 'daily' ? 'D' : view === 'weekly' ? 'W' : 'M'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={"relative z-10 w-full " + (goals.filter(g => g.isEnabled).length === 1 ? 'flex justify-center py-8' : 'flex flex-col gap-3')}>
                                                        {goals.filter(g => g.isEnabled).map(goal => {
                                                            let total = 0;
                                                            filteredGoalReceipts.forEach(r => {
                                                                (r.items || []).forEach(i => {
                                                                    const matchesKeyword = goal.keywords.some(k => i.name.toLowerCase().includes(k) || r.storeName.toLowerCase().includes(k));
                                                                    if (i.goalType === goal.type || matchesKeyword) total += i.price * (i.quantity || 1);
                                                                });
                                                            });

                                                            let prevTotal = 0;
                                                            previousGoalReceipts.forEach(r => {
                                                                (r.items || []).forEach(i => {
                                                                    const matchesKeyword = goal.keywords.some(k => i.name.toLowerCase().includes(k) || r.storeName.toLowerCase().includes(k));
                                                                    if (i.goalType === goal.type || matchesKeyword) prevTotal += i.price * (i.quantity || 1);
                                                                });
                                                            });

                                                            let trend: 'up' | 'down' | 'flat' = 'flat';
                                                            if (total > prevTotal * 1.1) trend = 'up';
                                                            else if (total < prevTotal * 0.9) trend = 'down';

                                                            let intensity: 'low' | 'medium' | 'high' = 'low';
                                                            if (total > 80) intensity = 'high';
                                                            else if (total > 50) intensity = 'medium';

                                                            const goalColor = GOAL_COLORS[goal.type] || '#a855f7';

                                                            return (
                                                                <motion.button
                                                                    key={goal.id}
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedGoal(goal); }}
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/50 hover:border-white/10 transition-all duration-200 w-full"
                                                                >
                                                                    {/* Icon */}
                                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${goalColor}15` }}>
                                                                        {(() => {
                                                                            const iconProps = { size: 20, style: { color: goalColor } };
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
                                                                        })()}
                                                                    </div>

                                                                    {/* Content */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <p className="text-sm font-semibold text-slate-200 truncate">{goal.name}</p>
                                                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                                <p className="text-lg font-heading font-bold" style={{ color: goalColor }}>
                                                                                    €{total.toFixed(0)}
                                                                                </p>
                                                                                {trend !== 'flat' && (
                                                                                    <div className={trend === 'up' ? 'text-red-400' : 'text-emerald-400'}>
                                                                                        {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Progress Bar */}
                                                                        <div className="relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                                                            <motion.div
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${Math.min((total / 100) * 100, 100)}%` }}
                                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                                className="h-full rounded-full"
                                                                                style={{
                                                                                    backgroundColor: total > 80 ? '#ef4444' : total > 50 ? '#eab308' : goalColor
                                                                                }}
                                                                            />
                                                                        </div>

                                                                        {/* Footer */}
                                                                        <div className="flex items-center justify-between mt-2">
                                                                            <p className="text-[10px] text-slate-500">
                                                                                {goalView === 'daily' ? 'Today' : goalView === 'weekly' ? 'This week' : 'This month'} • Target: €100
                                                                            </p>
                                                                            {goal.streak > 0 && (
                                                                                <div className="flex items-center gap-1">
                                                                                    <Flame size={10} className="text-emerald-400" />
                                                                                    <span className="text-[10px] font-bold text-emerald-400">{goal.streak}d</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </motion.button>

                                                            );
                                                        })}
                                                    </div>

                                                    {/* Achievements Snippet */}
                                                    <div className="mt-8 pt-8 border-t border-white/5">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                                                <Trophy className="w-4 h-4 text-yellow-500" />
                                                                Achievements
                                                            </h3>
                                                            <span className="text-xs text-slate-500 font-medium">{unlockedCount} Unlocked</span>
                                                        </div>
                                                        <div className="grid grid-cols-5 gap-2">
                                                            {achievements.slice(0, 10).map((badge) => (
                                                                <button
                                                                    key={badge.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        HapticsService.selection();
                                                                        // Convert badge to Achievement type
                                                                        const achievement: Achievement = {
                                                                            id: badge.id,
                                                                            title: badge.label,
                                                                            description: getAchievementDescription(badge.id),
                                                                            date: new Date().toISOString(),
                                                                            icon: badge.icon,
                                                                            type: badge.id.includes('budget') ? 'budget' : badge.id.includes('streak') || badge.id.includes('consistent') ? 'streak' : 'saving'
                                                                        };
                                                                        setSelectedAchievement(achievement);
                                                                    }}
                                                                    className="flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                                                >
                                                                    <div className={"w-8 h-8 rounded-full flex items-center justify-center border transition-all " + (badge.unlocked ? badge.bgColor + " " + badge.borderColor + " " + badge.color + " hover:scale-110" : "bg-slate-800 text-slate-600 border-slate-700")}>
                                                                        {React.cloneElement(badge.icon as any, { size: 14 })}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    }}
                                </AnimatedSection>
                            </div>

                            <div className="col-span-2">
                                <AnimatedSection delay={0.1} className="h-full">
                                    {({ isInView }: { isInView?: boolean } = {}) => (
                                        <SpotlightCard className="h-full p-4 flex flex-col gap-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                                    <BarChart3 size={18} />
                                                </div>
                                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Categories</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {metrics.categoryData.slice(0, 5).map((cat, idx) => (
                                                    <div key={cat.name} className="group/bar">
                                                        <div className="flex justify-between items-end mb-1">
                                                            <span className="text-xs font-medium text-slate-300 group-hover/bar:text-white transition-colors flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(cat.name) }}></div>
                                                                {cat.name}
                                                            </span>
                                                            <div className="flex items-end gap-1.5">
                                                                <span className="text-sm font-bold text-white tabular-nums">€{cat.value.toFixed(0)}</span>
                                                                <span className="text-[10px] text-slate-500 font-medium">{cat.percentage.toFixed(0)}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: isInView ? `${cat.percentage}%` : 0 }}
                                                                transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                                                                className="h-full rounded-full"
                                                                style={{ backgroundColor: getCategoryColor(cat.name) }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                {metrics.categoryData.length === 0 && (
                                                    <p className="text-xs text-slate-500 italic text-center py-4">No spending data yet.</p>
                                                )}
                                            </div>
                                        </SpotlightCard>
                                    )}
                                </AnimatedSection>
                            </div>
                            {/* 4. Financial Snapshot (Grid of 3) */}
                            {/* 4. Financial Snapshot (Grid of 3) - Premium Redesign */}
                            {/* 4. Financial Snapshot (Grid of 3) - Premium Redesign */}


                            <div className="col-span-2"><AnimatedSection delay={0} triggerOnce={false} variants={{ hidden: { opacity: 1 }, visible: { opacity: 1 } }}>
                                {({ isInView }: { isInView?: boolean } = {}) => (
                                    <SpotlightCard className="h-full p-4 flex flex-col gap-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                                <ShoppingBag size={18} />
                                            </div>
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Vendors</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {metrics.topStores.length > 0 ? (
                                                (metrics.topStores || []).map((store, idx) => (
                                                    <div key={idx} className="group/bar">
                                                        <div className="flex justify-between items-end mb-1">
                                                            <span className="text-xs font-medium text-slate-300 group-hover/bar:text-white transition-colors flex items-center gap-2">
                                                                <span className="truncate max-w-[150px]">{store.name}</span>
                                                            </span>
                                                            <div className="flex items-end gap-1.5">
                                                                <span className="text-sm font-bold text-white tabular-nums">€{store.value.toFixed(0)}</span>
                                                                <span className="text-[10px] text-slate-500 font-medium">{store.percentage.toFixed(0)}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: isInView ? `${store.percentage}%` : 0 }}
                                                                transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                                                                className="h-full rounded-full"
                                                                style={{ backgroundColor: '#6366f1' }} // Indigo for vendors to match icon
                                                            />
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-xs text-slate-500 text-center py-4">No data</div>
                                            )}
                                        </div>
                                    </SpotlightCard>
                                )}
                            </AnimatedSection>
                            </div>
                        </div>
                    </ProBlurGuard>
                </div >

                {/* Goal Details Modal */}
                < GoalDetailsModal
                    isOpen={!!selectedGoal}
                    onClose={() => setSelectedGoal(null)}
                    goal={selectedGoal}
                    receipts={receipts}
                />

                {/* Achievement Details Modal */}
                <AnimatePresence>
                    {
                        selectedAchievement && (
                            <AchievementDetailsModal
                                isOpen={!!selectedAchievement}
                                achievement={selectedAchievement}
                                onClose={() => setSelectedAchievement(null)}
                            />
                        )
                    }
                </AnimatePresence >

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

                {/* Subscription Modal */}
                <SubscriptionModal
                    isOpen={showSubscriptionModal}
                    onClose={() => setShowSubscriptionModal(false)}
                    onUpgrade={() => {
                        // This will be called by SubscriptionModal after mock purchase
                        // SubscriptionModal already calls setIsProMode(true)
                        // We just need to close the modal
                        setShowSubscriptionModal(false);
                    }}
                />
            </div >
        </motion.div >
    );
};

export default Dashboard;