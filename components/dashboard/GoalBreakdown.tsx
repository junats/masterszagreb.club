import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ArrowRight, Shield, Trophy, TrendingUp, TrendingDown, Flame, FileText, Calendar, Zap, Sparkles, Award, Brain, ArrowDown, Car, Banknote, Coins, Beer, Sunrise, Medal, Crown, HeartHandshake, CalendarCheck, PartyPopper, Scale, Heart, Baby, GraduationCap } from 'lucide-react';
import { HapticsService } from '../../services/haptics';
import { Goal, GoalType, Receipt, Achievement, CustodyDay } from '../../types';
import { ProBlurGuard } from '../ProBlurGuard';
import { SpotlightCard } from '../SpotlightCard';
import AnimatedSection from '../AnimatedSection';
import { useLanguage } from '../../contexts/LanguageContext';

// Constant for Colors
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

interface GoalBreakdownProps {
    goals: Goal[];
    receipts: Receipt[];
    metrics: any;
    isProMode: boolean;
    setShowSubscriptionModal: (show: boolean) => void;
    onHabitsClick: () => void;
    goalView: 'daily' | 'weekly' | 'monthly';
    setGoalView: (view: 'daily' | 'weekly' | 'monthly') => void;
    setSelectedGoal: (goal: Goal | null) => void;
    setSelectedAchievement: (achievement: Achievement | null) => void;
    isCoParentingMode: boolean;
    custodyDays: CustodyDay[];
    monthlyBudget: number;
}

export const GoalBreakdown: React.FC<GoalBreakdownProps> = ({
    goals,
    receipts,
    metrics,
    isProMode,
    setShowSubscriptionModal,
    onHabitsClick,
    goalView,
    setGoalView,
    setSelectedGoal,
    setSelectedAchievement,
    isCoParentingMode,
    custodyDays,
    monthlyBudget
}) => {
    const { t } = useLanguage();

    return (
        <div className="col-span-2">
            <AnimatedSection delay={0} triggerOnce={false} disableEntrance variants={{ hidden: { opacity: 1 }, visible: { opacity: 1 } }}>
                {({ isInView }: { isInView?: boolean } = {}) => {
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
                                            {isProMode ? t('goals.trackHabits') : t('goals.title')}
                                        </h3>
                                        <p className="text-xxs text-slate-500">
                                            {isProMode ? t('goals.enableDesc') : t('goals.upgradeDesc')}
                                        </p>
                                    </div>
                                    <div className={"w-8 h-8 rounded-full flex items-center justify-center " + (isProMode ? "bg-purple-500/10" : "bg-slate-800/50")}>
                                        {isProMode ? <ArrowRight size={16} className="text-purple-400" /> : <Shield size={14} className="text-slate-500" />}
                                    </div>
                                </motion.div>
                            </div>
                        );
                    }

                    // Has Goals
                    return (() => {
                        // Extract Logic for View filtering
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


                        const getAchievementDescription = (achievementId: string): string => {
                            const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                            const key = `achievements.${toCamelCase(achievementId)}.description`;
                            const translated = t(key);
                            return translated !== key ? translated : 'Keep up the great work tracking your expenses!';
                        };

                        // Achievements Logic
                        const achievements = [
                            { id: 'goal_setter', label: t('achievements.goalSetter.title'), icon: <Target className="w-5 h-5" />, unlocked: goals.some(g => g.isEnabled), color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
                            { id: 'budget_master', label: t('achievements.budgetMaster.title'), icon: <Shield className="w-5 h-5" />, unlocked: metrics.thisMonthTotal < monthlyBudget * 0.9, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
                            { id: 'budget_hero', label: t('achievements.budgetHero.title'), icon: <Award className="w-5 h-5" />, unlocked: metrics.thisMonthTotal < monthlyBudget * 0.75, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
                            { id: 'frugal_genius', label: t('achievements.frugalGenius.title'), icon: <Brain className="w-5 h-5" />, unlocked: metrics.thisMonthTotal < monthlyBudget * 0.5, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' },
                            { id: 'trend_setter', label: t('achievements.trendSetter.title'), icon: <TrendingDown className="w-5 h-5" />, unlocked: metrics.thisWeekTotal < metrics.lastWeekTotal, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
                            { id: 'downward_spiral', label: t('achievements.downwardSpiral.title'), icon: <ArrowDown className="w-5 h-5" />, unlocked: metrics.thisWeekTotal < metrics.lastWeekTotal * 0.8, color: 'text-teal-400', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/20' },
                            { id: 'consistent_tracker', label: t('achievements.consistentTracker.title'), icon: <FileText className="w-5 h-5" />, unlocked: receipts.some(r => (new Date().getTime() - new Date(r.date).getTime()) < 48 * 60 * 60 * 1000), color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
                            { id: 'daily_logger', label: t('achievements.dailyLogger.title'), icon: <Calendar className="w-5 h-5" />, unlocked: (() => { const last7Days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toDateString(); }); return last7Days.filter(day => receipts.some(r => new Date(r.date).toDateString() === day)).length >= 5; })(), color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
                            { id: 'week_warrior', label: t('achievements.weekWarrior.title'), icon: <Zap className="w-5 h-5" />, unlocked: receipts.filter(r => (new Date().getTime() - new Date(r.date).getTime()) < 7 * 24 * 60 * 60 * 1000).length >= 10, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },
                            { id: 'clean_sheet', label: t('achievements.cleanSheet.title'), icon: <Sparkles className="w-5 h-5" />, unlocked: !goals.some(g => { let total = 0; const currentMonth = new Date().getMonth(); receipts.forEach(r => { if (new Date(r.date).getMonth() === currentMonth) (r.items || []).forEach(i => { if (i.goalType === g.type) total += i.price * (i.quantity || 1); }); }); return total > 80; }), color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
                            { id: 'goal_crusher', label: t('achievements.goalCrusher.title'), icon: <Flame className="w-5 h-5" />, unlocked: goals.filter(g => g.isEnabled && g.streak >= 7).length >= 2, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20' },
                            { id: 'high_roller', label: t('achievements.highRoller.title'), icon: <Car className="w-5 h-5" />, unlocked: receipts.some(r => r.total > 100), color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
                            { id: 'big_spender', label: t('achievements.bigSpender.title'), icon: <Banknote className="w-5 h-5" />, unlocked: receipts.some(r => r.total > 200), color: 'text-fuchsia-400', bgColor: 'bg-fuchsia-500/10', borderColor: 'border-fuchsia-500/20' },
                            { id: 'penny_pincher', label: t('achievements.pennyPincher.title'), icon: <Coins className="w-5 h-5" />, unlocked: receipts.filter(r => r.total < 10).length >= 10, color: 'text-lime-400', bgColor: 'bg-lime-500/10', borderColor: 'border-lime-500/20' },
                            { id: 'weekend_warrior', label: t('achievements.weekender.title'), icon: <Beer className="w-5 h-5" />, unlocked: receipts.some(r => { const d = new Date(r.date).getDay(); return d === 0 || d === 6; }), color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
                            { id: 'early_bird', label: t('achievements.earlyBird.title'), icon: <Sunrise className="w-5 h-5" />, unlocked: receipts.length >= 5, color: 'text-sky-400', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/20' },
                            { id: 'veteran', label: t('achievements.veteran.title'), icon: <Medal className="w-5 h-5" />, unlocked: receipts.length >= 50, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
                            { id: 'centurion', label: t('achievements.centurion.title'), icon: <Crown className="w-5 h-5" />, unlocked: receipts.length >= 100, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
                            { id: 'coparent_hero', label: t('achievements.coparentHero.title'), icon: <HeartHandshake className="w-5 h-5" />, unlocked: isCoParentingMode && custodyDays.filter(d => d.status !== 'none').length >= 30, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
                            { id: 'calendar_keeper', label: t('achievements.calendarKeeper.title'), icon: <CalendarCheck className="w-5 h-5" />, unlocked: isCoParentingMode && custodyDays.some(d => d.activities && d.activities.length > 0), color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
                            { id: 'activity_planner', label: t('achievements.activityPlanner.title'), icon: <PartyPopper className="w-5 h-5" />, unlocked: isCoParentingMode && custodyDays.flatMap(d => d.activities || []).length >= 10, color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
                            { id: 'fair_share', label: t('achievements.fairShare.title'), icon: <Scale className="w-5 h-5" />, unlocked: isCoParentingMode && Math.abs(metrics.equity - 50) < 10, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
                            { id: 'harmony_keeper', label: t('achievements.harmonyKeeper.title'), icon: <Heart className="w-5 h-5" />, unlocked: isCoParentingMode && metrics.harmony >= 80, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20' },
                            { id: 'child_first', label: t('achievements.childFirst.title'), icon: <Baby className="w-5 h-5" />, unlocked: receipts.flatMap(r => r.items).filter(i => i.isChildRelated).length >= 20, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
                            { id: 'event_master', label: t('achievements.eventMaster.title'), icon: <Sparkles className="w-5 h-5" />, unlocked: isCoParentingMode && custodyDays.flatMap(d => d.activities || []).filter(a => a.type === 'birthday' || a.type === 'school').length >= 3, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' },
                            { id: 'health_conscious', label: t('achievements.healthConscious.title'), icon: <Heart className="w-5 h-5" />, unlocked: receipts.flatMap(r => r.items).filter(i => i.category === 'Health').reduce((sum, i) => sum + i.price, 0) > 50, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
                            { id: 'education_investor', label: t('achievements.educationInvestor.title'), icon: <GraduationCap className="w-5 h-5" />, unlocked: receipts.flatMap(r => r.items).filter(i => i.category === 'Education').reduce((sum, i) => sum + i.price, 0) > 100, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
                        ];

                        const unlockedCount = achievements.filter(a => a.unlocked).length;

                        return (
                            <ProBlurGuard isPro={isProMode} onClick={() => setShowSubscriptionModal(true)} label="Goals & Habits" className="rounded-3xl h-full" visualStyle="simple">
                                <SpotlightCard className="h-full p-4 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-card shadow-lg transition-all relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                                    <div className="mb-4 relative z-10">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                                <Target className="w-4 h-4 text-purple-400" />
                                                {t('goals.breakdown')}
                                            </h3>
                                            <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                                                {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                                                    <button
                                                        key={view}
                                                        onClick={(e) => { e.stopPropagation(); setGoalView(view); }}
                                                        className={"px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all " + (goalView === view ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                    >
                                                        {view === 'daily' ? t('dashboard.daily')[0] : view === 'weekly' ? t('dashboard.weekly')[0] : t('dashboard.monthly')[0]}
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

                                            const goalColor = GOAL_COLORS[goal.type] || '#a855f7';

                                            return (
                                                <motion.button
                                                    key={goal.id}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedGoal(goal); }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/50 hover:border-white/10 transition-all duration-200 w-full"
                                                >
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${goalColor} 15` }}>
                                                        {React.cloneElement(achievements.find(a => a.id === 'goal_setter')?.icon as any, { size: 20, style: { color: goalColor } })}
                                                    </div>

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

                                                        <div className="relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: isInView ? `${Math.min((total / 100) * 100, 100)}%` : 0 }}
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    backgroundColor: total > 80 ? '#ef4444' : total > 50 ? '#eab308' : goalColor
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between mt-2">
                                                            <p className="text-[10px] text-slate-500">
                                                                {goalView === 'daily' ? t('history.today') : goalView === 'weekly' ? t('labels.thisWeek') : t('labels.thisMonth')} • {t('goals.target')}: €100
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

                                    <div className="mt-8 pt-8 border-t border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                                <Trophy className="w-4 h-4 text-yellow-500" />
                                                {t('goals.achievements')}
                                            </h3>
                                            <span className="text-xxs text-slate-500 font-medium">{unlockedCount} {t('goals.unlocked')}</span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-2">
                                            {achievements.slice(0, 10).map((badge) => (
                                                <button
                                                    key={badge.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        HapticsService.selection();
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

                                </SpotlightCard>
                            </ProBlurGuard>
                        );
                    })()
                }}
            </AnimatedSection >
        </div >
    );
};
