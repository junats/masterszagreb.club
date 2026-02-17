import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
    Calendar, Target, TrendingUp, TrendingDown, Clock, CheckCircle2,
    BarChart2, ShoppingCart, ArrowUp, AlertCircle, Star, Check
} from 'lucide-react';

import { useData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';
import { Receipt, Goal, GoalType, CustodyDay, Achievement } from '@common/types';
import { HapticsService } from '../services/haptics';
import { generateInsights } from '../services/insightService';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useLanguage } from '../contexts/LanguageContext';

// Components
import { SpotlightCard } from './SpotlightCard';
import { GoalDetailsModal } from './GoalDetailsModal';
import { AchievementDetailsModal } from './AchievementDetailsModal';
import { CoParentingDetailsModal } from './CoParentingDetailsModal';
import SnapshotDetailsModal from './SnapshotDetailsModal';
import { ProBlurGuard } from './ProBlurGuard';
import SubscriptionModal from './SubscriptionModal';

// Extracted Sub-Components
import { DashboardHeader } from './dashboard/DashboardHeader';
import { CoParentingWidget } from './dashboard/CoParentingWidget';
import { DashboardCharts } from './dashboard/DashboardCharts';
import { DashboardInsights } from './dashboard/DashboardInsights';
import { GoalBreakdown } from './dashboard/GoalBreakdown';
import { DashboardMetrics_Grid } from './dashboard/DashboardMetrics_Grid';
import { TopCategories } from './dashboard/TopCategories';
import { TopVendors } from './dashboard/TopVendors';
import { PullToRefresh } from './PullToRefresh';
import { DashboardSkeleton } from './DashboardSkeleton';

interface DashboardProps {
    onViewReceipt: (receipt: Receipt) => void;
    onProvisionClick: () => void;
    onSettlementClick: () => void;
    onCustodyClick: () => void;
    onHabitsClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
    onViewReceipt,
    onProvisionClick,
    onSettlementClick,
    onCustodyClick,
    onHabitsClick
}) => {
    const { receipts, monthlyBudget, goals, custodyDays, userSettings, addGoal, updateGoal, achievements, isProMode, setIsProMode, categories, childSupportMode, ageRestricted, goalsEnabled, financialSnapshotEnabled, isRefreshing, refreshData } = useData();
    const { user } = useUser();
    const { t } = useLanguage();

    const [budgetView, setBudgetView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [chartView, setChartView] = useState<'week' | 'month' | 'year'>('week');
    const [pieView, setPieView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [goalView, setGoalView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [insightView, setInsightView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly'); // New state for insights card

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [selectedSnapshotMetric, setSelectedSnapshotMetric] = useState<any | null>(null); // For popup
    const [showCoParentingModal, setShowCoParentingModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

    // Tip Rotation
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTipIndex(prev => (suggestions.length > 0 ? (prev + 1) % suggestions.length : 0));
        }, 8000);
        return () => clearInterval(interval);
    }, [receipts, monthlyBudget]); // Re-run if data changes to ensure synced suggestions

    // View Refs
    const budgetCardRef = useRef(null);
    const isBudgetInView = useInView(budgetCardRef, { amount: 0.3 });

    // --- Mode Logic ---
    const isCoParentingMode = childSupportMode; // Fallback to childSupportMode as main toggle since userSettings is unavailable
    const dateFilter = 'all'; // Simplified

    // --- Memoized Values ---

    const daysInMonth = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(), []);

    const metrics = useDashboardMetrics(
        receipts || [],
        monthlyBudget || 0,
        daysInMonth,
        childSupportMode,
        dateFilter,
        ageRestricted
    );

    // Ambient Health State Logic
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


    // AI Suggestions
    const suggestions = useMemo(() => {
        return generateInsights(
            metrics.thisMonthTotal,
            monthlyBudget,
            metrics.sourceReceipts, // Use mode-filtered receipts
            custodyDays,
            metrics.lastMonthTotal,
            goalsEnabled ? goals : [],
            t // Pass translation function
        );
    }, [metrics.thisMonthTotal, monthlyBudget, metrics.sourceReceipts, custodyDays, metrics.lastMonthTotal, goals, goalsEnabled, t]);


    // AI Smart Metrics (Financial Snapshot)
    const aiMetrics = useMemo(() => {
        const daysPassed = new Date().getDate();
        const totalSpent = metrics.thisMonthTotal;
        const dailyAvg = daysPassed > 0 ? totalSpent / daysPassed : 0;
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const projected = (dailyAvg * daysInMonth);

        // Biggest Purchase
        const biggestPurchase = Math.max(...(metrics.thisMonthReceipts || []).map(r => r.total), 0);
        const biggestReceipt = (metrics.thisMonthReceipts || []).find(r => r.total === biggestPurchase);

        // Top Category
        const topCatName = metrics.categoryData.length > 0 ? metrics.categoryData[0].name : null;
        const topCategory = topCatName ? t(`categories.${topCatName.toLowerCase()} `, { defaultValue: topCatName }) : '-';

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
        let statusLabel = t('status.forecast');
        let statusValue = "€" + projected.toFixed(0);
        let statusTrend = projected > monthlyBudget ? 'down' : 'up';
        let statusIcon = projected > monthlyBudget ? TrendingDown : TrendingUp;
        let statusDetail = metrics.spendingInsight;
        let statusPopup = {
            title: t('popups.budgetForecast.title'),
            description: t('popups.budgetForecast.description', { projected: projected.toFixed(0) }),
            insight: projected > monthlyBudget ? t('popups.budgetForecast.insightOver', { overage: (projected - monthlyBudget).toFixed(0) }) : t('popups.budgetForecast.insightUnder'),
            items: [
                { label: t('dashboard.currentSpend'), value: "€" + totalSpent.toFixed(0) },
                { label: t('dashboard.remainingBudget'), value: "€" + Math.max(0, monthlyBudget - totalSpent).toFixed(0) },
                { label: t('charts.target'), value: "€" + projected.toFixed(0) }
            ]
        };

        const latestReceipt = metrics.latestReceipt;
        // Priority 1: Just Added (Last 5 mins)
        if (latestReceipt && (new Date().getTime() - new Date(latestReceipt.date).getTime() < 5 * 60 * 1000)) {
            statusLabel = t('status.justAdded');
            statusValue = t('status.receiptAdded');
            statusTrend = 'up';
            statusIcon = CheckCircle2;
            statusDetail = `+€${latestReceipt.total.toFixed(2)} at ${latestReceipt.storeName} `;
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
            statusIcon = AlertCircle;
            statusDetail = `Exceeded by €${(metrics.thisMonthTotal - monthlyBudget).toFixed(0)} `;
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
        // Priority 3: Success / Warning (Existing logic)
        else if (warning) {
            statusLabel = t('status.alert');
            if (warning.id === 'late-night-habit') statusValue = t('status.lateSpending');
            else if (warning.id === 'weekend-splurge') statusValue = t('status.weekendSpike');
            else if (warning.id.startsWith('cat-drift')) statusValue = t('status.categoryDrift');
            else if (warning.id === 'budget-warning') statusValue = t('status.checkBudget');
            else if (warning.id === 'budget-critical') statusValue = t('status.overBudget');
            else statusValue = t('status.insightAlert');

            if (/over budget/i.test(warning.text)) statusValue = t('status.overBudget');

            statusTrend = 'down';
            statusIcon = AlertCircle;
            statusDetail = warning.text;
            statusPopup = {
                title: statusValue,
                description: warning.text,
                insight: warning.subtext || 'Review your recent transactions.',
                items: []
            };
        }
        else if (success) {
            statusLabel = t('status.status');
            statusValue = t('status.onTrack');
            statusTrend = 'up';
            statusIcon = CheckCircle2;
            statusDetail = success.text;
            statusPopup = {
                title: t('popups.goodProgress.title'),
                description: success.text,
                insight: success.subtext || t('popups.goodProgress.insight'),
                items: []
            };
        }

        const top3Cats = metrics.categoryData.slice(0, 3).map(c => ({
            label: t(`categories.${c.name.toLowerCase()} `, { defaultValue: c.name }),
            value: c.percentage.toFixed(0) + "% ",
            subtext: "€" + c.value.toFixed(0) + " "
        }));

        const dailyTarget = monthlyBudget / 30; // Approx
        const dailyTrendDiff = dailyAvg - dailyTarget;

        return [
            {
                label: t('labels.dailyAvg'),
                value: "€" + dailyAvg.toFixed(0) + " ",
                trend: dailyTrendDiff > 0 ? 'up' : 'down',
                trendLabel: dailyTrendDiff > 0 ? t('labels.aboveTarget') : t('status.onTrack'),
                icon: Calendar,
                detail: t('charts.target') + ": €" + dailyTarget.toFixed(0),
                popup: {
                    title: t('popups.dailySpending.title'),
                    description: t('popups.dailySpending.description', { dailyAvg: dailyAvg.toFixed(0), budget: monthlyBudget.toString(), target: (monthlyBudget / daysInMonth).toFixed(0) }),
                    insight: dailyAvg > (monthlyBudget / daysInMonth) ? t('popups.dailySpending.insightOver') : t('popups.dailySpending.insightUnder'),
                    items: [
                        { label: t('popups.dailySpending.today'), value: "€" + metrics.todayTotal.toFixed(0) },
                        { label: t('popups.dailySpending.yesterday'), value: "€" + (metrics.weekData[6]?.total || 0).toFixed(0) },
                        { label: t('popups.dailySpending.target'), value: "€" + (monthlyBudget / daysInMonth).toFixed(0) }
                    ]
                }
            },
            {
                label: statusLabel,
                value: statusValue,
                trend: statusTrend,
                trendLabel: statusTrend === 'down' ? t('labels.improving') : t('labels.attention'),
                icon: statusIcon,
                detail: statusDetail,
                popup: statusPopup
            },
            {
                label: t('labels.topCat'),
                value: topCategory,
                trend: 'neutral',
                trendLabel: t('labels.dominant'),
                icon: ShoppingCart,
                detail: (top3Cats[0]?.value || '0%') + " " + t('labels.ofTotal'),
                popup: {
                    title: t('popups.topCategories.title'),
                    description: t('popups.topCategories.description', { category: topCategory }),
                    insight: t('popups.topCategories.insight'),
                    items: top3Cats
                }
            },
            {
                label: t('labels.bigBuy'),
                value: "€" + biggestPurchase.toFixed(0),
                trend: 'neutral',
                trendLabel: t('labels.oneOff'),
                icon: ArrowUp,
                detail: biggestReceipt ? biggestReceipt.storeName : '-',
                popup: {
                    title: t('popups.biggestPurchase.title'),
                    description: biggestReceipt ? t('popups.biggestPurchase.description', { storeName: biggestReceipt.storeName, date: new Date(biggestReceipt.date).toLocaleDateString() }) : t('popups.biggestPurchase.noLargePurchases'),
                    insight: t('popups.biggestPurchase.insight'),
                    items: biggestReceipt ? [{ label: biggestReceipt.storeName, value: "€" + biggestReceipt.total.toFixed(2), subtext: new Date(biggestReceipt.date).toLocaleTimeString() }] : []
                }
            },
            {
                label: t('labels.weekend'),
                value: weekendPercent.toFixed(0) + "%",
                trend: weekendPercent > 40 ? 'up' : 'neutral',
                trendLabel: weekendPercent > 40 ? t('labels.high') : t('labels.balanced'),
                icon: Calendar,
                detail: t('labels.vsWeekday'),
                popup: {
                    title: t('popups.weekendVsWeekday.title'),
                    description: t('popups.weekendVsWeekday.description', { percent: weekendPercent.toFixed(0) }),
                    insight: weekendPercent > 40 ? t('popups.weekendVsWeekday.insightHigh') : t('popups.weekendVsWeekday.insightBalanced'),
                    items: [
                        { label: t('popups.weekendVsWeekday.weekendTotal'), value: "€" + weekendSpend.toFixed(0) },
                        { label: t('dashboard.weekdayTotal'), value: "€" + (totalSpent - weekendSpend).toFixed(0) }
                    ]
                }
            },
            {
                label: t('labels.freqPerDay'),
                value: frequency,
                trend: parseFloat(frequency) > 3 ? 'up' : 'neutral',
                trendLabel: parseFloat(frequency) > 3 ? t('labels.high') : t('labels.normal'),
                icon: BarChart2,
                detail: t('labels.transPerDay'),
                popup: {
                    title: t('popups.spendingFrequency.title'),
                    description: t('popups.spendingFrequency.description', { frequency }),
                    insight: parseFloat(frequency) > 3 ? t('popups.spendingFrequency.insightHigh') : t('popups.spendingFrequency.insightLow'),
                    items: [
                        { label: t('popups.spendingFrequency.totalTxns'), value: "" + (metrics.thisMonthReceipts || []).length },
                        { label: t('popups.spendingFrequency.daysPassed'), value: "" + daysPassed }
                    ]
                }
            }
        ];
    }, [metrics.thisMonthTotal, metrics.thisMonthReceipts, metrics.categoryData, monthlyBudget, suggestions, metrics.todayTotal, metrics.weekData, metrics.latestReceipt, metrics.spendingInsight, t]);


    // Ambient Style Logic
    const active = useMemo(() => {
        const colorMap = {
            healthy: { color: '#84cc16', bright: '#bef264', glow: '15px' }, // Lime
            warning: { color: '#eab308', bright: '#facc15', glow: '20px' }, // Yellow
            critical: { color: '#ef4444', bright: '#ff2222', glow: '30px' } // Red
        };
        return colorMap[healthState];
    }, [healthState]);

    const ambientStyle = useMemo(() => {
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
            '--glow-size': '2px', // Accents only
            borderColor: active.color,
            boxShadow: "0 0 10px -5px " + active.color, // Subtle shadow
            borderRadius: '1.5rem',
            transition: 'all 1s ease',
            animation: healthState === 'critical' ? 'pulse-border-v2 3s infinite ease-in-out' : undefined
        } as React.CSSProperties;
    }, [healthState, isBudgetInView, active]);

    const ambientMode = true; // Always enable ambient mode logic if user setting?

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const getCategoryColor = (name: string) => {
        const cat = categories.find(c => c.name === name);
        return cat?.color || '#94a3b8';
    };

    return (
        <PullToRefresh onRefresh={refreshData}>
            {isRefreshing ? (
                <DashboardSkeleton />
            ) : (
                <motion.div
                    className="w-full h-full pt-2 px-4 pb-4 scroll-smooth no-scrollbar"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >

                    {/* Main Content Wrapper */}
                    <div className="pt-0 pb-32 space-y-4">

                        <DashboardHeader
                            metrics={metrics}
                            budgetView={budgetView}
                            setBudgetView={setBudgetView}
                            monthlyBudget={monthlyBudget}
                            suggestions={suggestions}
                            currentTipIndex={currentTipIndex}
                            pieView={pieView}
                            setPieView={setPieView}
                            getCategoryColor={getCategoryColor}
                            setSelectedCategory={setSelectedCategory}
                            selectedCategory={selectedCategory}
                            childSupportMode={childSupportMode}
                            ambientMode={ambientMode}
                            ambientStyle={ambientStyle}
                            budgetCardRef={budgetCardRef}
                        />

                        {/* BENTO GRID LAYOUT */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">

                            {/* Co-Parenting Section (if enabled) */}
                            <CoParentingWidget
                                custodyDays={custodyDays}
                                onCustodyClick={onCustodyClick}
                            />

                            {/* Dashboard Charts */}
                            <DashboardCharts
                                isProMode={isProMode}
                                setShowSubscriptionModal={setShowSubscriptionModal}
                                chartView={chartView}
                                setChartView={setChartView}
                                metrics={metrics}
                                categories={categories}
                                isCoParentingMode={isCoParentingMode}
                            />



                            {/* Financial Snapshot */}
                            {financialSnapshotEnabled && (
                                <DashboardMetrics_Grid
                                    aiMetrics={aiMetrics}
                                    setSelectedSnapshotMetric={setSelectedSnapshotMetric}
                                    isProMode={isProMode}
                                    setShowSubscriptionModal={setShowSubscriptionModal}
                                />
                            )}

                            {/* Top Categories */}
                            <TopCategories
                                metrics={metrics}
                                getCategoryColor={getCategoryColor}
                                isProMode={isProMode}
                                setShowSubscriptionModal={setShowSubscriptionModal}
                            />

                            {/* Top Vendors */}
                            <TopVendors
                                metrics={metrics}
                                isProMode={isProMode}
                                setShowSubscriptionModal={setShowSubscriptionModal}
                            />

                            {/* Goal Breakdown */}
                            {goalsEnabled && (
                                <GoalBreakdown
                                    goals={goals}
                                    receipts={receipts}
                                    metrics={metrics}
                                    isProMode={isProMode}
                                    setShowSubscriptionModal={setShowSubscriptionModal}
                                    onHabitsClick={onHabitsClick}
                                    goalView={goalView}
                                    setGoalView={setGoalView}
                                    setSelectedGoal={setSelectedGoal}
                                    setSelectedAchievement={setSelectedAchievement}
                                    isCoParentingMode={isCoParentingMode}
                                    custodyDays={custodyDays}
                                    monthlyBudget={monthlyBudget}
                                />
                            )}

                        </div>
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
                            setShowSubscriptionModal(false);
                        }}
                    />
                </motion.div>
            )}
        </PullToRefresh>
    );
};

export default Dashboard;