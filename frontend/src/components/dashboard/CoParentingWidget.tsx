import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, Users2, BarChart2, Lightbulb, Wallet2, Star, Phone, MessageCircle, Clock, Flame, CircleDot, Dna, Waves, Grid3X3, DollarSign, Activity } from 'lucide-react';
import { HapticsService } from '../../services/haptics';
import { CustodyDay } from '@common/types';
import { getLocalYYYYMMDD } from '../../utils/dateUtils';
import { CountUp } from '../CountUp';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CoParentingDetailsModal } from '../CoParentingDetailsModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import AnimatedSection from '../AnimatedSection';

interface CoParentingWidgetProps {
    custodyDays: CustodyDay[];
    onCustodyClick: () => void;
}

// Internal Tooltip Component
const ChartTooltip: React.FC<{
    data: { date: Date; status: string; spend: number; activities: any[] };
    position: { x: number; y: number };
}> = ({ data, position }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15 }}
            style={{
                left: Math.min(Math.max(position.x, 60), 240), // Clamp to prevent overflow
                top: Math.max(position.y - 80, 10),
            }}
            className="absolute z-50 pointer-events-none transform -translate-x-1/2 min-w-[140px]"
        >
            <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-white/10 shadow-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-slate-200">
                        {data.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${data.status === 'me' ? 'bg-blue-500/20 text-blue-300' :
                        data.status === 'partner' ? 'bg-purple-500/20 text-purple-300' :
                            data.status === 'split' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-slate-700 text-slate-400'
                        }`}>
                        {data.status === 'me' ? 'You' : data.status}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Wallet2 size={12} className="text-emerald-400" />
                        <span className="text-xs font-medium text-white">
                            ${data.spend.toFixed(2)}
                        </span>
                    </div>
                </div>

                {data.activities.length > 0 && (
                    <div className="flex items-start gap-1.5 mt-0.5">
                        <Activity size={12} className="text-orange-400 mt-0.5" />
                        <div className="flex flex-col">
                            {data.activities.slice(0, 2).map((act, idx) => (
                                <span key={idx} className="text-xxs text-slate-300 truncate max-w-[100px]">
                                    {act.title}
                                </span>
                            ))}
                            {data.activities.length > 2 && (
                                <span className="text-xxs text-slate-500">+{data.activities.length - 2} more</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {/* Arrow */}
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900/90 rotate-45 border-r border-b border-white/10"></div>
        </motion.div>
    );
};

export const CoParentingWidget: React.FC<CoParentingWidgetProps> = ({ custodyDays, onCustodyClick }) => {
    const { t } = useLanguage();
    const { receipts } = useData();
    const [custodyView, setCustodyView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [monthViewMode, setMonthViewMode] = useState<'share' | 'insights'>('share');
    const [monthVizMode, setMonthVizMode] = useState<'github' | 'streak' | 'orbital' | 'wave' | 'dna'>('github');
    const [showCoParentingModal, setShowCoParentingModal] = useState(false);

    // Interaction State
    const [hoveredNode, setHoveredNode] = useState<{
        date: Date;
        status: string;
        spend: number;
        activities: any[];
        x: number;
        y: number;
    } | null>(null);

    const today = new Date();

    const getDayStatus = (date: Date) => {
        const dateStr = getLocalYYYYMMDD(date);
        const custody = (custodyDays || []).find(d => {
            if (!d.date) return false;
            return d.date === dateStr || d.date.startsWith(dateStr);
        });
        return custody ? custody.status : null;
    };

    const getDayActivities = (date: Date) => {
        const dateStr = getLocalYYYYMMDD(date);
        const custody = (custodyDays || []).find(d => {
            if (!d.date) return false;
            return d.date === dateStr || d.date.startsWith(dateStr);
        });
        return custody?.activities || [];
    };

    const getDailySpend = (date: Date) => {
        const dateStr = getLocalYYYYMMDD(date);
        return (receipts || [])
            .filter(r => r.date === dateStr || r.date.startsWith(dateStr))
            .reduce((sum, r) => sum + r.total, 0);
    };

    // Helper: Generate AI-powered smart insights
    const generateSmartInsights = () => {
        const insights: Array<{ icon: React.ReactNode; title: string; suggestion: string }> = [];
        const todayStr = getLocalYYYYMMDD(today);
        const todayDay = custodyDays.find(d => d.date === todayStr || d.date.startsWith(todayStr));

        // 1. Spending Correlation Insight
        const todaySpend = getDailySpend(today);

        if (todaySpend > 50 && todayDay?.status === 'me') {
            insights.push({
                icon: <Wallet2 size={20} className="text-emerald-400" />,
                title: 'Higher Spend Day',
                suggestion: `You've spent $${todaySpend.toFixed(0)} today while with the kids. Tracking these patterns helps budget better!`
            });
        }

        // 2. Upcoming Streak Insight
        // Simple lookahead for consecutive days
        let streak = 0;
        for (let i = 1; i <= 5; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            if (getDayStatus(d) === 'me') streak++;
            else break;
        }

        if (streak >= 3) {
            insights.push({
                icon: <Flame size={20} className="text-orange-400" />,
                title: `${streak}-Day Streak Incoming`,
                suggestion: `You have the kids for the next ${streak} days! Good time to plan a mini-adventure or meal prep.`
            });
        }

        // 3. Activity Insight
        const upcomingEvents = custodyDays
            .filter(d => {
                const date = new Date(d.date);
                return date > today && date <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            })
            .flatMap(d => d.activities || [])
            .slice(0, 1);

        if (upcomingEvents.length > 0) {
            insights.push({
                icon: <Clock size={20} className="text-blue-400" />,
                title: 'Upcoming Event',
                suggestion: `Don't forget: ${upcomingEvents[0].title} is coming up soon!`
            });
        }

        // Fallback generic
        if (insights.length < 2) {
            if (todayDay?.status === 'me') {
                insights.push({
                    icon: <Users2 size={20} className="text-purple-400" />,
                    title: 'Quality Time',
                    suggestion: 'Make today special! Plan a fun activity or simply enjoy being present together.'
                });
            } else {
                insights.push({
                    icon: <Phone size={20} className="text-blue-400" />,
                    title: 'Stay Connected',
                    suggestion: 'Send a quick message or schedule a video call to stay connected.'
                });
            }
        }

        return insights.slice(0, 3);
    };

    // Helper: Generate calendar grid for monthly view
    const generateMonthCalendar = () => {
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const calendar: (Date | null)[] = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendar.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            calendar.push(new Date(year, month, day));
        }
        return calendar;
    };

    const dailyInsights = generateSmartInsights();
    const monthCalendar = generateMonthCalendar();

    const currentDay = today.getDay(); // 0 = Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1)); // Mon start

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });

    const monthDaysCount = (custodyDays || []).filter(d => {
        const dDate = new Date(d.date);
        return dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear() && d.status === 'me';
    }).length;

    return (
        <div className="col-span-2 grid grid-cols-2 gap-3">
            <div className="col-span-2">
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
                                        <Calendar size={16} />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-200">{t('dashboard.coParenting')}</h3>
                                </div>
                                {(() => {
                                    const todayStr = getLocalYYYYMMDD(today);
                                    const todaysEvents = custodyDays.find(d => d.date === todayStr)?.activities || [];

                                    if (todaysEvents.length > 0) {
                                        return (
                                            <div className="mt-1 animate-in fade-in slide-in-from-left-2">
                                                <span className="text-xxs font-bold text-purple-400 uppercase tracking-wide">{t('labels.justNow')}</span>
                                                <p className="text-sm font-bold text-white leading-tight">{todaysEvents[0].title}</p>
                                                {todaysEvents.length > 1 && <p className="text-xxs text-slate-500">{t('dashboard.activity.moreEvents', { count: todaysEvents.length - 1 })}</p>}
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
                                    className={"px-2 py-0.5 text-xxs font-bold uppercase tracking-wide rounded-md transition-all " + (custodyView === 'daily' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                >
                                    D
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { HapticsService.selection(); setCustodyView('weekly'); }}
                                    className={"px-2 py-0.5 text-xxs font-bold uppercase tracking-wide rounded-md transition-all " + (custodyView === 'weekly' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                >
                                    W
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { HapticsService.selection(); setCustodyView('monthly'); }}
                                    className={"px-2 py-0.5 text-xxs font-bold uppercase tracking-wide rounded-md transition-all " + (custodyView === 'monthly' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                >
                                    M
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { HapticsService.selection(); setCustodyView('yearly'); }}
                                    className={"px-2 py-0.5 text-xxs font-bold uppercase tracking-wide rounded-md transition-all " + (custodyView === 'yearly' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                >
                                    Y
                                </motion.button>
                            </div>
                        </div>

                        {/* Toggleable Body */}
                        <AnimatePresence mode="wait">
                            {custodyView === 'daily' ? (
                                <motion.div
                                    key="daily"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full"
                                >
                                    <div className="flex flex-col gap-2">
                                        {dailyInsights.map((insight, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-3 rounded-xl border border-purple-500/20"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">{insight.icon}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-white mb-1">{insight.title}</p>
                                                        <p className="text-xs text-slate-400 leading-relaxed">{insight.suggestion}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {dailyInsights.length === 0 && (
                                            <div className="bg-slate-800/20 p-4 rounded-xl border border-white/5 text-center">
                                                <p className="text-sm text-slate-400">No insights for today. Check back tomorrow!</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : custodyView === 'weekly' ? (
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
                                                    <span className="text-xxs font-medium text-slate-500 uppercase">{dayLabel}</span>
                                                    <div
                                                        className={"w-7 h-7 rounded-full flex items-center justify-center text-xxs font-bold border transition-all " + (
                                                            status === 'me' ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)] scale-110' :
                                                                status === 'partner' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' :
                                                                    status === 'split' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' :
                                                                        'bg-slate-800/50 border-slate-700 text-slate-500'
                                                        ) + (isToday ? ' ring-2 ring-white/20' : '')}
                                                    >
                                                        {status === 'me' ? <Check size={14} strokeWidth={4} /> : status ? d.getDate() : d.getDate()}
                                                    </div>
                                                    {(() => {
                                                        const dStr = getLocalYYYYMMDD(d);
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
                                        <p className="text-xxs text-purple-300 font-medium uppercase tracking-wide mb-2">{t('dashboard.coparenting.yearToDate')}</p>
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
                                            <span className="text-sm text-slate-400">{t('dashboard.coparenting.daysWithYou')}</span>
                                        </div>
                                        <p className="text-xxs text-slate-400">
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
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="monthly"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full"
                                >
                                    <div className="flex flex-col gap-3">
                                        {/* Visualization Toggle */}
                                        <div className="flex items-center justify-center gap-1 mb-3">
                                            {[
                                                { id: 'github', icon: Grid3X3, label: 'Grid' },
                                                { id: 'streak', icon: Flame, label: 'Streak' },
                                                { id: 'wave', icon: Waves, label: 'Wave' },
                                                { id: 'orbital', icon: CircleDot, label: 'Orbit' },
                                                { id: 'dna', icon: Dna, label: 'DNA' },
                                            ].map((viz) => (
                                                <button
                                                    key={viz.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        HapticsService.selection();
                                                        setMonthVizMode(viz.id as typeof monthVizMode);
                                                    }}
                                                    className={`p-2 rounded-lg transition-all ${monthVizMode === viz.id ? 'bg-purple-500/30 text-purple-300' : 'bg-slate-800/30 text-slate-500 hover:text-slate-300'}`}
                                                    title={viz.label}
                                                >
                                                    <viz.icon size={16} />
                                                </button>
                                            ))}
                                        </div>

                                        {/* Visualization Content */}
                                        <div
                                            className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 p-3 rounded-xl border border-white/5 min-h-[260px] flex flex-col relative overflow-hidden group"
                                            onMouseLeave={() => setHoveredNode(null)}
                                        >

                                            {/* Header & Legend */}
                                            <div className="flex flex-col items-center justify-center py-2 relative z-10 pointer-events-none">
                                                <p className="text-sm font-semibold text-white mb-3 shadow-black drop-shadow-md">
                                                    {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </p>
                                                {/* Premium Legend */}
                                                <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-1.5 rounded-full border border-white/5 shadow-sm backdrop-blur-sm pointer-events-auto">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">You</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div>
                                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Split</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>
                                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Partner</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 flex items-center justify-center relative p-2">

                                                <AnimatePresence mode="wait">
                                                    {/* GitHub Grid Visualization */}
                                                    {monthVizMode === 'github' && (
                                                        <motion.div
                                                            key="github"
                                                            initial="hidden"
                                                            animate="visible"
                                                            exit="hidden"
                                                            variants={{
                                                                visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
                                                                hidden: { opacity: 0 }
                                                            }}
                                                            className="space-y-1"
                                                        >
                                                            <div className="grid grid-cols-7 gap-2 mb-2">
                                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                                                    <div key={idx} className="text-center text-xs font-medium text-slate-500">{day}</div>
                                                                ))}
                                                            </div>
                                                            <div className="grid grid-cols-7 gap-2">
                                                                {monthCalendar.map((date, idx) => {
                                                                    if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;
                                                                    const status = getDayStatus(date);
                                                                    const isToday = date.toDateString() === today.toDateString();
                                                                    return (
                                                                        <motion.div
                                                                            key={idx}
                                                                            variants={{
                                                                                hidden: { opacity: 0, scale: 0.5 },
                                                                                visible: { opacity: 1, scale: 1 }
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                                const containerRect = e.currentTarget.closest('.group')?.getBoundingClientRect();
                                                                                if (containerRect) {
                                                                                    setHoveredNode({
                                                                                        date,
                                                                                        status: status || 'none',
                                                                                        spend: getDailySpend(date),
                                                                                        activities: getDayActivities(date),
                                                                                        x: rect.left - containerRect.left + rect.width / 2,
                                                                                        y: rect.top - containerRect.top
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className={
                                                                                "aspect-square rounded-md flex items-center justify-center text-sm font-semibold transition-all hover:ring-2 hover:ring-white/30 cursor-crosshair " +
                                                                                (status === 'me' ? 'bg-blue-500 text-white' :
                                                                                    status === 'partner' ? 'bg-purple-500/60 text-white' :
                                                                                        status === 'split' ? 'bg-yellow-500/60 text-white' :
                                                                                            'bg-slate-700/30 text-slate-600') +
                                                                                (isToday ? ' ring-2 ring-white/50' : '')
                                                                            }
                                                                        >
                                                                            {date.getDate()}
                                                                        </motion.div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {/* Streak/Flame Visualization - Premium */}
                                                    {monthVizMode === 'streak' && (
                                                        <motion.div
                                                            key="streak"
                                                            initial="hidden"
                                                            animate="visible"
                                                            exit="hidden"
                                                            variants={{
                                                                visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
                                                                hidden: { opacity: 0 }
                                                            }}
                                                            className="flex items-end justify-center h-24 w-full px-4 overflow-hidden relative"
                                                        >
                                                            {/* Skyline Background Gradient */}
                                                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none" />

                                                            {monthCalendar.filter(d => d !== null).map((date, idx) => {
                                                                if (!date) return null;
                                                                const status = getDayStatus(date);
                                                                const isMe = status === 'me';
                                                                const isPartner = status === 'partner';
                                                                const isSplit = status === 'split';

                                                                // Use varying heights for visual interest even within same status
                                                                const baseHeight = isMe ? 64 : isSplit ? 40 : isPartner ? 24 : 4;
                                                                const randomOffset = (idx % 3) * 4;
                                                                const height = `h-[${baseHeight + randomOffset}px]`;

                                                                return (
                                                                    <motion.div
                                                                        key={idx}
                                                                        variants={{
                                                                            hidden: { opacity: 0, height: 0 },
                                                                            visible: { opacity: 1, height: baseHeight + randomOffset }
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            const containerRect = e.currentTarget.closest('.group')?.getBoundingClientRect();
                                                                            if (containerRect) {
                                                                                setHoveredNode({
                                                                                    date,
                                                                                    status: status || 'none',
                                                                                    spend: getDailySpend(date),
                                                                                    activities: getDayActivities(date),
                                                                                    x: rect.left - containerRect.left + rect.width / 2,
                                                                                    y: rect.top - containerRect.top
                                                                                });
                                                                            }
                                                                        }}
                                                                        className={
                                                                            "flex-1 transition-all relative group/bar hover:brightness-125 cursor-crosshair " +
                                                                            (isMe ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] z-10' :
                                                                                isSplit ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)] z-10' :
                                                                                    isPartner ? 'bg-purple-900/80' :
                                                                                        'bg-slate-800/30')
                                                                        }
                                                                        style={{ height: baseHeight + randomOffset }}
                                                                    />
                                                                );
                                                            })}
                                                        </motion.div>
                                                    )}

                                                    {/* Wave Visualization - Premium */}
                                                    {monthVizMode === 'wave' && (
                                                        <motion.div
                                                            key="wave"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="w-full h-full flex items-center justify-center p-2"
                                                        >
                                                            <svg viewBox="0 0 300 80" className="w-full h-24 overflow-visible">
                                                                <defs>
                                                                    <linearGradient id="waveGradientBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                                                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                                                                        <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
                                                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                                    </linearGradient>
                                                                    <filter id="glowBlue" x="-50%" y="-50%" width="200%" height="200%">
                                                                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                                                        <feMerge>
                                                                            <feMergeNode in="coloredBlur" />
                                                                            <feMergeNode in="SourceGraphic" />
                                                                        </feMerge>
                                                                    </filter>
                                                                </defs>

                                                                {(() => {
                                                                    const validDays = monthCalendar.filter(d => d !== null);
                                                                    // Catmull-Rom like smoothing or just simple Bezier could be better, but standard L is fine for now if smoothed via CSS or just high enough resolution. 
                                                                    // Will use simple line for robustness.
                                                                    const points = validDays.map((date, idx) => {
                                                                        if (!date) return [0, 0];
                                                                        const status = getDayStatus(date);
                                                                        const x = (idx / (validDays.length - 1)) * 300;
                                                                        const amplitude = status === 'me' ? 35 : status === 'split' ? 15 : status === 'partner' ? -15 : 0;
                                                                        const y = 40 - amplitude;
                                                                        return [x, y];
                                                                    });

                                                                    const linePath = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
                                                                    const areaPath = `${linePath} L ${300} 80 L 0 80 Z`;

                                                                    return (
                                                                        <>
                                                                            <motion.path
                                                                                d={areaPath}
                                                                                fill="url(#waveGradientBlue)"
                                                                                initial={{ opacity: 0 }}
                                                                                animate={{ opacity: 1 }}
                                                                                transition={{ duration: 1 }}
                                                                            />
                                                                            <motion.path
                                                                                d={linePath}
                                                                                fill="none"
                                                                                stroke="#60a5fa"
                                                                                strokeWidth="3"
                                                                                filter="url(#glowBlue)"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                initial={{ pathLength: 0 }}
                                                                                animate={{ pathLength: 1 }}
                                                                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                                                            />
                                                                            {/* Invisible touch targets for tooltips */}
                                                                            {validDays.map((date, idx) => {
                                                                                if (!date) return null;
                                                                                const status = getDayStatus(date);
                                                                                const [x, y] = points[idx];
                                                                                return (
                                                                                    <rect
                                                                                        key={idx}
                                                                                        x={x - 10}
                                                                                        y={0}
                                                                                        width={20}
                                                                                        height={80}
                                                                                        fill="transparent"
                                                                                        className="cursor-crosshair"
                                                                                        onMouseEnter={() => {
                                                                                            setHoveredNode({
                                                                                                date,
                                                                                                status: status || 'none',
                                                                                                spend: getDailySpend(date),
                                                                                                activities: getDayActivities(date),
                                                                                                x: (x / 300) * 280 + 10,
                                                                                                y: y + 80
                                                                                            });
                                                                                        }}
                                                                                    />
                                                                                );
                                                                            })}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </svg>
                                                        </motion.div>
                                                    )}

                                                    {/* Orbital Visualization - Premium */}
                                                    {monthVizMode === 'orbital' && (
                                                        <motion.div
                                                            key="orbital"
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.8 }}
                                                            className="relative w-full aspect-square max-w-[200px] mx-auto"
                                                        >
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                <div className="relative">
                                                                    <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
                                                                    <div className="text-center">
                                                                        <div className="text-2xl font-bold text-white">{monthDaysCount}</div>
                                                                        <div className="text-[9px] uppercase tracking-widest text-slate-500">Days</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 overflow-visible">
                                                                {/* Track Background */}
                                                                <circle cx="50" cy="50" r="42" fill="none" stroke="#0f172a" strokeWidth="8" />

                                                                {monthCalendar.filter(d => d !== null).map((date, idx, arr) => {
                                                                    if (!date) return null;
                                                                    const status = getDayStatus(date);

                                                                    // Calculate arc segments
                                                                    const total = arr.length;
                                                                    // Add tiny gap? 
                                                                    const gap = 0.05;
                                                                    const sectorSize = (2 * Math.PI) / total;

                                                                    const startAngle = idx * sectorSize - Math.PI / 2;
                                                                    const endAngle = (idx + 1) * sectorSize - Math.PI / 2 - gap;

                                                                    const radius = 42;
                                                                    const x1 = 50 + radius * Math.cos(startAngle);
                                                                    const y1 = 50 + radius * Math.sin(startAngle);
                                                                    const x2 = 50 + radius * Math.cos(endAngle);
                                                                    const y2 = 50 + radius * Math.sin(endAngle);

                                                                    // Color logic
                                                                    const color = status === 'me' ? '#3b82f6' : status === 'split' ? '#eab308' : status === 'partner' ? '#a855f7' : '#1e293b';
                                                                    const opacity = status ? 1 : 0.3;

                                                                    // SVG Path for Arc
                                                                    const largeArc = sectorSize > Math.PI ? 1 : 0;
                                                                    const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

                                                                    return (
                                                                        <motion.path
                                                                            key={idx}
                                                                            d={d}
                                                                            fill="none"
                                                                            stroke={color}
                                                                            strokeWidth={status === 'me' ? 8 : 6}
                                                                            strokeLinecap="round"
                                                                            strokeOpacity={opacity}
                                                                            className="cursor-pointer hover:stroke-[10] hover:stroke-white transition-all"
                                                                            initial={{ pathLength: 0, opacity: 0 }}
                                                                            animate={{ pathLength: 1, opacity: 1 }}
                                                                            transition={{ delay: idx * 0.015, duration: 0.2 }}
                                                                            onMouseEnter={(e) => {
                                                                                setHoveredNode({
                                                                                    date,
                                                                                    status: status || 'none',
                                                                                    spend: getDailySpend(date),
                                                                                    activities: getDayActivities(date),
                                                                                    x: 100 + (x1 + x2) / 2, // Approx
                                                                                    y: 50 + (y1 + y2) / 2
                                                                                });
                                                                            }}
                                                                        />
                                                                    );
                                                                })}
                                                            </svg>
                                                        </motion.div>
                                                    )}

                                                    {/* DNA Helix Visualization - Premium */}
                                                    {monthVizMode === 'dna' && (
                                                        <motion.div
                                                            key="dna"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="w-full h-full flex items-center justify-center"
                                                        >
                                                            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
                                                                {monthCalendar.filter(d => d !== null).map((date, idx, arr) => {
                                                                    if (!date) return null;
                                                                    const status = getDayStatus(date);
                                                                    const period = 20;
                                                                    const x = (idx / arr.length) * 280 + 10;
                                                                    const phase = (idx / period) * Math.PI * 2;
                                                                    const y1 = 50 + Math.sin(phase) * 30;
                                                                    const y2 = 50 - Math.sin(phase) * 30;

                                                                    const cosVal = Math.cos(phase); // Depth: -1 (back) to 1 (front)
                                                                    const depthScale = 0.5 + ((cosVal + 1) / 2) * 0.5;
                                                                    const opacity = 0.3 + ((cosVal + 1) / 2) * 0.7;

                                                                    const isToday = date.toDateString() === today.toDateString();
                                                                    const isMe = status === 'me';
                                                                    // const isSplit = status === 'split';
                                                                    const isPartner = status === 'partner';

                                                                    const color = isMe ? '#3b82f6' : '#64748b';
                                                                    const partnerColor = isPartner ? '#a855f7' : '#1e293b';

                                                                    return (
                                                                        <g key={idx}>
                                                                            {/* Rung line */}
                                                                            {Math.abs(cosVal) < 0.95 && (
                                                                                <motion.line
                                                                                    x1={x} y1={y1} x2={x} y2={y2}
                                                                                    stroke="#475569"
                                                                                    strokeWidth={1}
                                                                                    strokeOpacity={0.4}
                                                                                    initial={{ opacity: 0 }}
                                                                                    animate={{ opacity: 1 }}
                                                                                    transition={{ delay: idx * 0.02 }}
                                                                                />
                                                                            )}

                                                                            {/* Top Strand Node */}
                                                                            <motion.circle
                                                                                cx={x} cy={y1}
                                                                                r={isToday ? 6 : 3}
                                                                                fill={color}
                                                                                fillOpacity={opacity}
                                                                                className="cursor-pointer hover:stroke-white hover:stroke-2"
                                                                                initial={{ scale: 0 }}
                                                                                animate={{ scale: depthScale }}
                                                                                transition={{ delay: idx * 0.02 }}
                                                                                onMouseEnter={() => {
                                                                                    setHoveredNode({
                                                                                        date,
                                                                                        status: status || 'none',
                                                                                        spend: getDailySpend(date),
                                                                                        activities: getDayActivities(date),
                                                                                        x: (x / 300) * 280 + 10,
                                                                                        y: y1 + 60
                                                                                    });
                                                                                }}
                                                                            />

                                                                            {/* Bottom Strand Node */}
                                                                            <motion.circle
                                                                                cx={x} cy={y2}
                                                                                r={isToday ? 6 : 3}
                                                                                fill={partnerColor}
                                                                                fillOpacity={opacity}
                                                                                initial={{ scale: 0 }}
                                                                                animate={{ scale: depthScale }}
                                                                                transition={{ delay: idx * 0.02 }}
                                                                            />
                                                                        </g>
                                                                    );
                                                                })}
                                                            </svg>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <AnimatePresence>
                                                    {hoveredNode && (
                                                        <ChartTooltip data={hoveredNode} position={hoveredNode} />
                                                    )}
                                                </AnimatePresence>

                                            </div> {/* End of visualization container content wrapper */}
                                        </div> {/* End of main visualization card */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                                                <p className="text-xxs text-blue-300 font-medium uppercase tracking-wide mb-1">You</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-xl font-heading font-bold text-white">{monthDaysCount}</p>
                                                    <span className="text-xxs text-slate-500">days</span>
                                                </div>
                                                <p className="text-xxs text-blue-400 mt-0.5">{Math.round((monthDaysCount / new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()) * 100)}%</p>
                                            </div>
                                            <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                                                <p className="text-xxs text-purple-300 font-medium uppercase tracking-wide mb-1">Partner</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-xl font-heading font-bold text-white">
                                                        {(() => {
                                                            const partnerDays = custodyDays.filter(d => {
                                                                const dDate = new Date(d.date);
                                                                return dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear() && d.status === 'partner';
                                                            }).length;
                                                            return partnerDays;
                                                        })()}
                                                    </p>
                                                    <span className="text-xxs text-slate-500">days</span>
                                                </div>
                                                <p className="text-xxs text-purple-400 mt-0.5">
                                                    {(() => {
                                                        const partnerDays = custodyDays.filter(d => {
                                                            const dDate = new Date(d.date);
                                                            return dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear() && d.status === 'partner';
                                                        }).length;
                                                        return Math.round((partnerDays / new Date(today.getFullYear(), today.getFullYear(), today.getMonth() + 1, 0).getDate()) * 100);
                                                    })()}%
                                                </p>
                                            </div>
                                        </div>
                                        {dailyInsights.length > 0 && (
                                            <div className="w-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-3 rounded-xl border border-purple-500/20">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-lg">{dailyInsights[0].icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-white mb-1">{dailyInsights[0].title}</p>
                                                        <p className="text-xxs text-slate-400 leading-relaxed">{dailyInsights[0].suggestion}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
