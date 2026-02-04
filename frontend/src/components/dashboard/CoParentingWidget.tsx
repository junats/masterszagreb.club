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
                                                    <span className="text-xxs font-medium text-slate-500 uppercase">{dayLabel}</span>
                                                    <div
                                                        className={"w-7 h-7 rounded-full flex items-center justify-center text-xxs font-bold border transition-all " + (
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
                                <AnimatedSection triggerOnce={false} noSlide className="w-full">
                                    {({ isInView }: { isInView?: boolean } = {}) => (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex bg-slate-800/50 p-0.5 rounded-lg w-fit self-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setMonthViewMode('share'); }}
                                                    className={"px-3 py-1 text-xxs font-bold uppercase tracking-wide rounded-md transition-all " + (monthViewMode === 'share' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                >
                                                    {t('dashboard.actions.share')}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setMonthViewMode('insights'); }}
                                                    className={"px-3 py-1 text-xxs font-bold uppercase tracking-wide rounded-md transition-all " + (monthViewMode === 'insights' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                                >
                                                    {t('dashboard.actions.insights')}
                                                </button>
                                            </div>

                                            {monthViewMode === 'share' ? (
                                                <div className="flex items-center justify-between gap-4 bg-slate-800/20 p-3 rounded-xl border border-white/5 animate-in fade-in slide-in-from-right-2">
                                                    <div className="flex flex-col gap-2 flex-1">
                                                        <div>
                                                            <p className="text-xxs text-slate-500 font-medium uppercase tracking-wide">{t('dashboard.coparenting.myShare')}</p>
                                                            <div className="flex items-baseline gap-1">
                                                                <p className="text-2xl font-heading font-bold text-white">{monthDaysCount}</p>
                                                                <span className="text-xxs text-slate-500">days</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="h-20 w-20 relative shrink-0">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart key={"custody-pie-" + isInView}>
                                                                <Pie
                                                                    data={[
                                                                        { name: t('dashboard.coparenting.me'), value: monthDaysCount },
                                                                        { name: t('dashboard.coparenting.partner'), value: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - monthDaysCount }
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
                                                            <span className="text-xxs font-bold text-slate-300">
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
                                                        <p className="text-xxs text-slate-500 font-medium uppercase tracking-wide mb-2">{t('dashboard.coparenting.weekendSplit')}</p>
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
                                                        <div className="flex justify-between text-xxs text-slate-400 mt-1">
                                                            <span>{t('dashboard.coparenting.you')}</span>
                                                            <span>{t('dashboard.coparenting.partner')}</span>
                                                        </div>
                                                    </div>

                                                    {/* Parenting Pulse / Evidence Score */}
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

                                                        // Filter Custody Days
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

                                                        // 3. Evidence Score (Gamification)
                                                        const thisMonthReceipts = receipts.filter(r => {
                                                            const d = new Date(r.date);
                                                            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                                                        });
                                                        const receiptPoints = Math.min(50, thisMonthReceipts.length * 10); // Max 50 pts (5 receipts)

                                                        const daysWithNotes = filteredDays.filter(d => d.activities && d.activities.length > 0).length;
                                                        const notePoints = Math.min(50, daysWithNotes * 10); // Max 50 pts (5 notes)

                                                        const evidenceScore = receiptPoints + notePoints;


                                                        // 4. Harmony Score (Avg of all)
                                                        const harmonyScore = Math.round((equityScore + stabilityScore + evidenceScore) / 3);

                                                        let status: 'optimum' | 'good' | 'attention' | 'critical' = 'good';
                                                        let title = t('dashboard.pulse.steady.title');
                                                        let message = t('dashboard.pulse.steady.message');
                                                        let color = 'text-emerald-400';
                                                        let bgColor = 'bg-emerald-500/10';
                                                        let borderColor = 'border-emerald-500/20';

                                                        if (harmonyScore < 50) {
                                                            status = 'critical';
                                                            title = t('dashboard.pulse.critical.title');
                                                            message = t('dashboard.pulse.critical.message');
                                                            color = 'text-red-400';
                                                            bgColor = 'bg-red-500/10';
                                                            borderColor = 'border-red-500/20';
                                                        } else if (harmonyScore < 75) {
                                                            status = 'attention';
                                                            title = t('dashboard.pulse.attention.title');
                                                            message = t('dashboard.pulse.attention.message');
                                                            color = 'text-orange-400';
                                                            bgColor = 'bg-orange-500/10';
                                                            borderColor = 'border-orange-500/20';
                                                        } else if (harmonyScore > 90) {
                                                            status = 'optimum';
                                                            title = t('dashboard.pulse.optimum.title');
                                                            message = t('dashboard.pulse.optimum.message');
                                                            color = 'text-cyan-400';
                                                            bgColor = 'bg-cyan-500/10';
                                                            borderColor = 'border-cyan-500/20';
                                                        }

                                                        const metrics = [
                                                            { label: t('dashboard.pulse.equity'), score: equityScore, color: 'bg-blue-500' },
                                                            { label: t('dashboard.pulse.stability'), score: stabilityScore, color: 'bg-purple-500' },
                                                            { label: t('dashboard.pulse.evidence'), score: evidenceScore, color: 'bg-amber-500' }, // New Metric
                                                            { label: t('dashboard.pulse.harmony'), score: harmonyScore, color: 'bg-pink-500' },
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
                                                                                <span className={"text-xxs px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold " + bgColor + " " + borderColor + " " + color}>{status}</span>
                                                                            </div>
                                                                            <p className="text-xxs text-slate-400 leading-tight max-w-[200px]">{message}</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-3">
                                                                        {metrics.map((m) => (
                                                                            <div key={m.label} className="group/bar">
                                                                                <div className="flex justify-between items-end mb-1">
                                                                                    <div className="flex items-center">
                                                                                        <span className="text-xxs font-medium text-slate-500 group-hover/bar:text-slate-300 transition-colors uppercase tracking-wide">{m.label}</span>
                                                                                        {m.label === t('dashboard.pulse.evidence') && (
                                                                                            <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold">
                                                                                                LVL {Math.ceil(m.score / 20) || 1}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <span className="text-xxs font-bold text-slate-300 tabular-nums">{m.score}/100</span>
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
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
