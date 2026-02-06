import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Check, Users, Activity, Brain, Wallet, Sparkles } from 'lucide-react';
import { HapticsService } from '../../services/haptics';
import { CustodyDay } from '@common/types';
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

export const CoParentingWidget: React.FC<CoParentingWidgetProps> = ({ custodyDays, onCustodyClick }) => {
    const { t } = useLanguage();
    // Destructure receipts from useData to use in Evidence Score
    const { receipts } = useData();
    const [custodyView, setCustodyView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [monthViewMode, setMonthViewMode] = useState<'share' | 'insights'>('share');
    const [showCoParentingModal, setShowCoParentingModal] = useState(false);

    const today = new Date();

    // Helper: Generate AI-powered daily insights
    const generateDailyInsights = () => {
        const insights: Array<{ icon: string; title: string; suggestion: string }> = [];
        const todayStr = today.toISOString().split('T')[0];
        const todayDay = custodyDays.find(d => d.date === todayStr);
        const todayStatus = todayDay?.status;

        if (todayStatus === 'me') {
            insights.push({
                icon: '👨‍👧‍👦',
                title: 'Quality Time Today',
                suggestion: 'Make today special! Plan a fun activity or simply enjoy being present together.'
            });
        } else if (todayStatus === 'partner') {
            insights.push({
                icon: '📞',
                title: 'Stay Connected',
                suggestion: 'Send a quick message or schedule a video call to stay connected with your child.'
            });
        }

        const upcomingEvents = custodyDays
            .filter(d => {
                const date = new Date(d.date);
                return date > today && date <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            })
            .flatMap(d => d.activities || [])
            .slice(0, 1);

        if (upcomingEvents.length > 0) {
            insights.push({
                icon: '📅',
                title: 'Upcoming Event',
                suggestion: `Don't forget: ${upcomingEvents[0].title} is coming up soon!`
            });
        }

        insights.push({
            icon: '💬',
            title: 'Communication Tip',
            suggestion: 'Keep your co-parent informed about important updates or changes in routine.'
        });

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

    const dailyInsights = generateDailyInsights();
    const monthCalendar = generateMonthCalendar();

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
                                        <CalendarDays size={16} />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-200">{t('dashboard.coParenting')}</h3>
                                </div>
                                {(() => {
                                    const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
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
                                                    <span className="text-2xl">{insight.icon}</span>
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
                                        <div className="bg-slate-800/20 p-3 rounded-xl border border-white/5">
                                            <p className="text-xs font-bold text-white text-center mb-2">
                                                {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </p>
                                            <div className="grid grid-cols-7 gap-1 mb-1">
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                                    <div key={idx} className="text-center text-xxs font-medium text-slate-500">{day}</div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {monthCalendar.map((date, idx) => {
                                                    if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;
                                                    const status = getDayStatus(date);
                                                    const isToday = date.toDateString() === today.toDateString();
                                                    const dateStr = date.toISOString().split('T')[0];
                                                    const hasEvent = (custodyDays.find(d => d.date === dateStr)?.activities || []).length > 0;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={
                                                                "aspect-square rounded-md flex flex-col items-center justify-center text-xxs font-medium border transition-all " +
                                                                (status === 'me' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' :
                                                                    status === 'partner' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' :
                                                                        status === 'split' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' :
                                                                            'bg-slate-800/30 border-slate-700/50 text-slate-500') +
                                                                (isToday ? ' ring-2 ring-white/40 scale-110' : '')
                                                            }
                                                        >
                                                            <span>{date.getDate()}</span>
                                                            {hasEvent && <div className="w-1 h-1 rounded-full bg-orange-400 mt-0.5" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
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
                                            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-3 rounded-xl border border-purple-500/20">
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
