import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Check, Users2, Wallet2, Phone, Clock, Flame, Pencil, TrendingUp, ArrowRightLeft, ShoppingBag, CalendarCheck, Repeat, BarChart3, Lightbulb } from 'lucide-react';
import { HapticsService } from '../../services/haptics';
import { CustodyDay } from '@common/types';
import { getLocalYYYYMMDD } from '../../utils/dateUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';

export interface CoParentingWidgetProps {
    custodyDays: CustodyDay[];
    onCustodyClick: () => void;
}

export const CoParentingWidget: React.FC<CoParentingWidgetProps> = ({ custodyDays, onCustodyClick }) => {
    const { t } = useLanguage();
    const { receipts } = useData();

    const today = new Date();
    const todayStr = getLocalYYYYMMDD(today);

    // === Helpers ===
    const getDayStatus = (date: Date) => {
        const dateStr = getLocalYYYYMMDD(date);
        const custody = (custodyDays || []).find(d => d.date === dateStr || d.date?.startsWith(dateStr));
        return custody ? custody.status : null;
    };

    const getDailySpend = (date: Date) => {
        const dateStr = getLocalYYYYMMDD(date);
        return (receipts || [])
            .filter(r => r.date === dateStr || r.date?.startsWith(dateStr))
            .reduce((sum, r) => sum + r.total, 0);
    };

    // === Week Data ===
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });

    // === Month Stats ===
    const monthStats = useMemo(() => {
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const meDays = (custodyDays || []).filter(d => {
            const dDate = new Date(d.date);
            return dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear() && d.status === 'me';
        }).length;
        const partnerDays = (custodyDays || []).filter(d => {
            const dDate = new Date(d.date);
            return dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear() && d.status === 'partner';
        }).length;
        const splitDays = (custodyDays || []).filter(d => {
            const dDate = new Date(d.date);
            return dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear() && d.status === 'split';
        }).length;
        return { meDays, partnerDays, splitDays, daysInMonth };
    }, [custodyDays, today.getMonth(), today.getFullYear()]);

    // === Month Calendar Grid ===
    const monthCalendar = useMemo(() => {
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        const calendar: (Date | null)[] = [];
        for (let i = 0; i < startingDayOfWeek; i++) calendar.push(null);
        for (let day = 1; day <= daysInMonth; day++) calendar.push(new Date(year, month, day));
        return calendar;
    }, [today.getMonth(), today.getFullYear()]);

    // === Today's Events ===
    const todayData = (custodyDays || []).find(d => d.date === todayStr || d.date?.startsWith(todayStr));
    const todaysEvents = todayData?.activities || [];

    // === Expanded AI Insights (10 types) ===
    const insights = useMemo(() => {
        const result: Array<{ icon: React.ReactNode; title: string; suggestion: string; color: string }> = [];
        const todaySpend = getDailySpend(today);

        // 1. Spending correlation — high spend on custody day
        if (todaySpend > 50 && todayData?.status === 'me') {
            result.push({
                icon: <Wallet2 size={16} />,
                title: 'Higher Spend Day',
                suggestion: `€${todaySpend.toFixed(0)} spent today. Custody days average higher — consider batch cooking or free activities.`,
                color: 'emerald'
            });
        }

        // 2. Upcoming streak — 3+ consecutive custody days
        let streak = 0;
        for (let i = 1; i <= 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            if (getDayStatus(d) === 'me') streak++;
            else break;
        }
        if (streak >= 3) {
            result.push({
                icon: <Flame size={16} />,
                title: `${streak}-Day Streak Ahead`,
                suggestion: `You have the kids for ${streak} more days. Plan meals and activities ahead to stay on budget.`,
                color: 'orange'
            });
        }

        // 3. Upcoming event within 7 days
        const upcomingEvents = (custodyDays || [])
            .filter(d => {
                const date = new Date(d.date);
                return date > today && date <= new Date(today.getTime() + 7 * 86400000);
            })
            .flatMap(d => d.activities || [])
            .slice(0, 1);
        if (upcomingEvents.length > 0) {
            result.push({
                icon: <Clock size={16} />,
                title: 'Upcoming Event',
                suggestion: `Don't forget: "${upcomingEvents[0].title}" is coming up this week.`,
                color: 'blue'
            });
        }

        // 4. Weekly spend comparison — custody days vs non-custody
        const last7 = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            return d;
        });
        const custodySpend = last7.filter(d => getDayStatus(d) === 'me').reduce((s, d) => s + getDailySpend(d), 0);
        const nonCustodySpend = last7.filter(d => getDayStatus(d) !== 'me').reduce((s, d) => s + getDailySpend(d), 0);
        const custodyDayCount = last7.filter(d => getDayStatus(d) === 'me').length;
        const nonCustodyDayCount = 7 - custodyDayCount;
        if (custodyDayCount > 0 && nonCustodyDayCount > 0) {
            const avgCustody = custodySpend / custodyDayCount;
            const avgNon = nonCustodySpend / nonCustodyDayCount;
            if (avgCustody > avgNon * 1.5 && avgCustody > 20) {
                result.push({
                    icon: <TrendingUp size={16} />,
                    title: 'Custody Day Spending',
                    suggestion: `You spend €${avgCustody.toFixed(0)}/day with kids vs €${avgNon.toFixed(0)} without. Plan ahead to balance!`,
                    color: 'amber'
                });
            }
        }

        // 5. Top spending category on custody days (last 30 days)
        const last30CustodyDates = new Set(
            (custodyDays || [])
                .filter(d => {
                    const date = new Date(d.date);
                    return date >= new Date(today.getTime() - 30 * 86400000) && date <= today && d.status === 'me';
                })
                .map(d => d.date)
        );
        if (last30CustodyDates.size > 3) {
            const categorySpend: Record<string, number> = {};
            (receipts || []).forEach(r => {
                if (last30CustodyDates.has(r.date)) {
                    (r.items || []).forEach(item => {
                        const cat = item.category || 'Other';
                        categorySpend[cat] = (categorySpend[cat] || 0) + item.price;
                    });
                }
            });
            const topCat = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0];
            if (topCat && topCat[1] > 30) {
                result.push({
                    icon: <ShoppingBag size={16} />,
                    title: `Top: ${topCat[0]}`,
                    suggestion: `${topCat[0]} is your biggest custody-day expense at €${topCat[1].toFixed(0)} this month.`,
                    color: 'pink'
                });
            }
        }

        // 6. Transition day prep — custody switches tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const todayStatus = todayData?.status;
        const tomorrowStatus = getDayStatus(tomorrow);
        if (todayStatus && tomorrowStatus && todayStatus !== tomorrowStatus) {
            const direction = tomorrowStatus === 'me' ? 'picking up' : 'dropping off';
            result.push({
                icon: <ArrowRightLeft size={16} />,
                title: 'Transition Tomorrow',
                suggestion: `Tomorrow is a handover day — you're ${direction} the kids. Prepare bags and schedules tonight.`,
                color: 'violet'
            });
        }

        // 7. Monthly balance check — split deviation
        if (monthStats.meDays + monthStats.partnerDays > 10) {
            const total = monthStats.meDays + monthStats.partnerDays;
            const myPct = (monthStats.meDays / total) * 100;
            if (Math.abs(myPct - 50) > 15) {
                const who = myPct > 50 ? 'You' : 'Partner';
                result.push({
                    icon: <BarChart3 size={16} />,
                    title: 'Custody Imbalance',
                    suggestion: `${who} has ${Math.round(Math.max(myPct, 100 - myPct))}% of custody this month. Worth discussing schedule adjustments?`,
                    color: 'red'
                });
            }
        }

        // 8. Recurring store on custody days
        if (last30CustodyDates.size > 3) {
            const storeCount: Record<string, number> = {};
            (receipts || []).forEach(r => {
                if (last30CustodyDates.has(r.date) && r.storeName) {
                    storeCount[r.storeName] = (storeCount[r.storeName] || 0) + 1;
                }
            });
            const topStore = Object.entries(storeCount).sort((a, b) => b[1] - a[1])[0];
            if (topStore && topStore[1] >= 3) {
                result.push({
                    icon: <Repeat size={16} />,
                    title: `Frequent: ${topStore[0]}`,
                    suggestion: `You've shopped at ${topStore[0]} ${topStore[1]} times on custody days. Buying in bulk could save money.`,
                    color: 'cyan'
                });
            }
        }

        // 9. Weekend vs weekday pattern
        const weekendCustody = (custodyDays || []).filter(d => {
            const day = new Date(d.date).getDay();
            return (day === 0 || day === 6) && d.status === 'me';
        }).length;
        const weekdayCustody = (custodyDays || []).filter(d => {
            const day = new Date(d.date).getDay();
            return day >= 1 && day <= 5 && d.status === 'me';
        }).length;
        const totalCustody = weekendCustody + weekdayCustody;
        if (totalCustody > 10) {
            const weekendPct = (weekendCustody / totalCustody) * 100;
            if (weekendPct > 60) {
                result.push({
                    icon: <CalendarCheck size={16} />,
                    title: 'Weekend Parent',
                    suggestion: `${Math.round(weekendPct)}% of your custody is on weekends. Weekend activities tend to cost more — plan free ones!`,
                    color: 'indigo'
                });
            } else if (weekendPct < 20 && totalCustody > 15) {
                result.push({
                    icon: <CalendarCheck size={16} />,
                    title: 'Weekday Parent',
                    suggestion: `Most of your custody is weekdays. School routines help with budgeting — leverage that structure.`,
                    color: 'indigo'
                });
            }
        }

        // 10. Fallback — quality time or stay connected
        if (result.length < 2) {
            if (todayData?.status === 'me') {
                result.push({
                    icon: <Users2 size={16} />,
                    title: 'Quality Time',
                    suggestion: 'Make today count! Free activities like parks, cooking together, or board games create the best memories.',
                    color: 'purple'
                });
            } else {
                result.push({
                    icon: <Phone size={16} />,
                    title: 'Stay Connected',
                    suggestion: 'A quick video call or goodnight message keeps the bond strong on non-custody days.',
                    color: 'blue'
                });
            }
        }

        return result.slice(0, 4);
    }, [custodyDays, receipts, todayStr]);

    // Color map for insight badges
    const colorMap: Record<string, string> = {
        emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
        orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
        blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
        amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        pink: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
        violet: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
        red: 'bg-red-500/15 text-red-400 border-red-500/20',
        cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
        indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
        purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    };

    return (
        <div className="col-span-2">
            <div className="w-full relative rounded-3xl p-4 flex flex-col gap-3 border border-slate-800 bg-card shadow-lg overflow-hidden">

                {/* === Header === */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div className="bg-purple-500/10 p-1.5 rounded-lg text-purple-400">
                                <Calendar size={16} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-200">{t('dashboard.coParenting')}</h3>
                        </div>
                        {todaysEvents.length > 0 && (
                            <div className="ml-8 animate-in fade-in slide-in-from-left-2">
                                <p className="text-xs font-semibold text-white leading-tight">{todaysEvents[0].title}</p>
                                {todaysEvents.length > 1 && (
                                    <p className="text-[10px] text-slate-500">+{todaysEvents.length - 1} more</p>
                                )}
                            </div>
                        )}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            HapticsService.selection();
                            onCustodyClick();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 rounded-xl border border-purple-500/20 text-xs font-bold transition-all"
                    >
                        <Pencil size={13} />
                        {t('coParenting.manage') || 'Edit'}
                    </motion.button>
                </div>

                {/* === Weekly Strip === */}
                <div className="flex justify-between items-center bg-slate-800/30 p-2.5 rounded-xl border border-white/5">
                    {weekDays.map((d, i) => {
                        const status = getDayStatus(d);
                        const isToday = d.toDateString() === today.toDateString();
                        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
                        const hasEvent = (custodyDays || []).find(day => day.date === getLocalYYYYMMDD(d))?.activities?.length;

                        return (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-medium text-slate-500 uppercase">{dayLabel}</span>
                                <div
                                    className={
                                        "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all " +
                                        (status === 'me' ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_8px_rgba(59,130,246,0.3)]' :
                                            status === 'partner' ? 'bg-purple-500/25 border-purple-500/50 text-purple-300' :
                                                status === 'split' ? 'bg-yellow-500/25 border-yellow-500/50 text-yellow-300' :
                                                    'bg-slate-800/50 border-slate-700 text-slate-600') +
                                        (isToday ? ' ring-2 ring-white/30 scale-110' : '')
                                    }
                                >
                                    {status === 'me' ? <Check size={14} strokeWidth={3} /> : d.getDate()}
                                </div>
                                <div className={"w-1 h-1 rounded-full " + (hasEvent ? 'bg-purple-400' : 'bg-transparent')} />
                            </div>
                        );
                    })}
                </div>

                {/* === Month Summary === */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/15 text-center">
                        <p className="text-[10px] text-blue-300 font-medium uppercase tracking-wide">You</p>
                        <p className="text-xl font-bold text-white mt-0.5">{monthStats.meDays}</p>
                        <p className="text-[10px] text-blue-400">{Math.round((monthStats.meDays / monthStats.daysInMonth) * 100)}%</p>
                    </div>
                    <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/15 text-center">
                        <p className="text-[10px] text-purple-300 font-medium uppercase tracking-wide">Partner</p>
                        <p className="text-xl font-bold text-white mt-0.5">{monthStats.partnerDays}</p>
                        <p className="text-[10px] text-purple-400">{Math.round((monthStats.partnerDays / monthStats.daysInMonth) * 100)}%</p>
                    </div>
                    <div className="bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/15 text-center">
                        <p className="text-[10px] text-yellow-300 font-medium uppercase tracking-wide">Split</p>
                        <p className="text-xl font-bold text-white mt-0.5">{monthStats.splitDays}</p>
                        <p className="text-[10px] text-yellow-400">{Math.round((monthStats.splitDays / monthStats.daysInMonth) * 100)}%</p>
                    </div>
                </div>

                {/* === Compact Visualizations === */}
                <div className="grid grid-cols-2 gap-2">

                    {/* GitHub Grid */}
                    <div className="bg-slate-800/30 p-3 rounded-xl border border-white/5 flex flex-col">
                        <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mb-2 text-center">Grid</p>
                        <div className="grid grid-cols-7 gap-1 flex-1">
                            {monthCalendar.map((date, idx) => {
                                if (!date) return <div key={`e-${idx}`} className="aspect-square rounded-sm" />;
                                const status = getDayStatus(date);
                                const isToday = date.toDateString() === today.toDateString();
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.01 }}
                                        className={
                                            "aspect-square rounded-sm " +
                                            (status === 'me' ? 'bg-blue-500' :
                                                status === 'partner' ? 'bg-purple-500/60' :
                                                    status === 'split' ? 'bg-yellow-500/60' :
                                                        'bg-slate-700/40') +
                                            (isToday ? ' ring-1 ring-white/60 ring-offset-1 ring-offset-slate-900' : '')
                                        }
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Orbital Ring Mini */}
                    <div className="bg-slate-800/30 p-2.5 rounded-xl border border-white/5 flex flex-col items-center">
                        <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Orbital</p>
                        <div className="relative w-[72px] h-[72px]">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-sm font-bold text-white leading-none">{monthStats.meDays}</div>
                                    <div className="text-[7px] uppercase tracking-widest text-slate-500">days</div>
                                </div>
                            </div>
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 overflow-visible">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#0f172a" strokeWidth="8" />
                                {monthCalendar.filter(d => d !== null).map((date, idx, arr) => {
                                    if (!date) return null;
                                    const status = getDayStatus(date);
                                    const total = arr.length;
                                    const sectorSize = (2 * Math.PI) / total;
                                    const gap = 0.05;
                                    const startAngle = idx * sectorSize;
                                    const endAngle = (idx + 1) * sectorSize - gap;
                                    const radius = 42;
                                    const x1 = 50 + radius * Math.cos(startAngle);
                                    const y1 = 50 + radius * Math.sin(startAngle);
                                    const x2 = 50 + radius * Math.cos(endAngle);
                                    const y2 = 50 + radius * Math.sin(endAngle);
                                    const color = status === 'me' ? '#3b82f6' : status === 'split' ? '#eab308' : status === 'partner' ? '#a855f7' : '#1e293b';
                                    const d = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
                                    return (
                                        <motion.path
                                            key={idx}
                                            d={d}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth={status === 'me' ? 8 : 6}
                                            strokeLinecap="round"
                                            strokeOpacity={status ? 1 : 0.3}
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            transition={{ delay: idx * 0.01, duration: 0.15 }}
                                        />
                                    );
                                })}
                            </svg>
                        </div>
                    </div>

                </div>

                {/* DNA Helix Full Width */}
                <div className="bg-slate-800/30 p-3 rounded-xl border border-white/5 flex flex-col items-center">
                    <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mb-1">DNA</p>
                    <svg viewBox="0 0 300 60" className="w-full h-[60px] overflow-visible">
                        {monthCalendar.filter(d => d !== null).map((date, idx, arr) => {
                            if (!date) return null;
                            const status = getDayStatus(date);
                            const x = (idx / arr.length) * 280 + 10;
                            const phase = (idx / 12) * Math.PI * 2;
                            const y1 = 30 + Math.sin(phase) * 18;
                            const y2 = 30 - Math.sin(phase) * 18;
                            const cosVal = Math.cos(phase);
                            const depthScale = 0.5 + ((cosVal + 1) / 2) * 0.5;
                            const opacity = 0.3 + ((cosVal + 1) / 2) * 0.7;
                            const isMe = status === 'me';
                            const isPartner = status === 'partner';
                            const color = isMe ? '#3b82f6' : '#64748b';
                            const partnerColor = isPartner ? '#a855f7' : '#1e293b';
                            return (
                                <g key={idx}>
                                    {Math.abs(cosVal) < 0.95 && (
                                        <motion.line
                                            x1={x} y1={y1} x2={x} y2={y2}
                                            stroke="#475569" strokeWidth={0.5} strokeOpacity={0.3}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.015 }}
                                        />
                                    )}
                                    <motion.circle
                                        cx={x} cy={y1} r={2}
                                        fill={color} fillOpacity={opacity}
                                        initial={{ scale: 0 }} animate={{ scale: depthScale }}
                                        transition={{ delay: idx * 0.015 }}
                                    />
                                    <motion.circle
                                        cx={x} cy={y2} r={2}
                                        fill={partnerColor} fillOpacity={opacity}
                                        initial={{ scale: 0 }} animate={{ scale: depthScale }}
                                        transition={{ delay: idx * 0.015 }}
                                    />
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* === AI Insights === */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 px-1">
                        <Lightbulb size={12} className="text-amber-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Smart Insights</span>
                    </div>
                    {insights.map((insight, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className={`p-2.5 rounded-xl border ${colorMap[insight.color] || colorMap.purple}`}
                        >
                            <div className="flex items-start gap-2.5">
                                <div className="mt-0.5 shrink-0">{insight.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white">{insight.title}</p>
                                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{insight.suggestion}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {insights.length === 0 && (
                        <div className="bg-slate-800/20 p-3 rounded-xl border border-white/5 text-center">
                            <p className="text-xs text-slate-500">No insights yet. Add custody data to get started!</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
