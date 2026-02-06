

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Users, UserX, X, Plus, Clock, Cake, Activity, GraduationCap, MoreHorizontal, Trash2, RefreshCw, Copy, Check, Share2, Download } from 'lucide-react';
import { CustodyDay, CustodyStatus, CalendarActivity } from '@common/types';

import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';

interface CustodyCalendarProps {
    onBack: () => void;
}

const CustodyCalendar: React.FC<CustodyCalendarProps> = ({ onBack }) => {
    const { custodyDays, updateCustodyDay, syncCustody } = useData();
    const { t } = useLanguage();
    const onUpdateDay = updateCustodyDay; // Alias for compatibility with existing logic

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [manageEvents, setManageEvents] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [newActivityTitle, setNewActivityTitle] = useState('');
    const [newActivityType, setNewActivityType] = useState<CalendarActivity['type']>('other');
    const [newActivityStartTime, setNewActivityStartTime] = useState('');
    const [newActivityEndTime, setNewActivityEndTime] = useState('');

    const [isSyncing, setIsSyncing] = useState(false);

    // --- Invite Modal Logic ---
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const handleInvite = async () => {
        if (!inviteEmail.includes('@')) {
            alert("Please enter a valid email.");
            return;
        }
        setIsInviting(true);

        try {
            // Use mailto: directly - most reliable method
            const inviteMessage = t('coParenting.emailBody', { email: inviteEmail });

            // Open email client with pre-filled message
            window.location.href = `mailto:${inviteEmail}?subject=Join me on TrueTrack&body=${encodeURIComponent(inviteMessage)}`;

            // Also try to save to database if possible
            try {
                const { authService } = await import('../services/authService');
                await authService.inviteCoParent(inviteEmail);
            } catch (dbError) {
                console.log("Database save failed (non-critical):", dbError);
            }

            alert(t('coParenting.messages.clientOpened', { email: inviteEmail }));
            setShowInviteModal(false);
            setInviteEmail('');
        } catch (e: any) {
            console.error("Invite failed:", e);
            alert(t('coParenting.messages.inviteFailed'));
        } finally {
            setIsInviting(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncCustody(true); // Forces manual mode (toasts enabled)
        } catch (e) {
            console.error("Sync failed:", e);
        } finally {
            setTimeout(() => setIsSyncing(false), 500); // Visual feedback
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        return { days, firstDay };
    };

    const { days, firstDay } = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getDayData = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return (custodyDays || []).find(d => d.date === dateStr);
    };

    const getStatusForDate = (day: number) => {
        return getDayData(day)?.status || 'none';
    };

    const handleDayClick = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentData = getDayData(day);

        if (manageEvents) {
            setSelectedDate(dateStr);
            setShowActivityModal(true);
            setNewActivityTitle('');
            setNewActivityStartTime('');
            setNewActivityEndTime('');
            setNewActivityType('other');
        } else {
            const currentStatus = currentData?.status || 'none';
            let nextStatus: CustodyStatus = 'none';
            if (currentStatus === 'none') nextStatus = 'me';
            else if (currentStatus === 'me') nextStatus = 'partner';
            else if (currentStatus === 'partner') nextStatus = 'split';
            else if (currentStatus === 'split') nextStatus = 'none';

            onUpdateDay({ ...currentData, date: dateStr, status: nextStatus, activities: currentData?.activities || [] });
        }
    };

    const handleAddActivity = () => {
        if (!selectedDate || !newActivityTitle.trim()) return;

        const currentData = (custodyDays || []).find(d => d.date === selectedDate) || { date: selectedDate, status: 'none', activities: [], withYou: false };
        const newActivity: CalendarActivity = {
            id: Math.random().toString(36).substr(2, 9),
            title: newActivityTitle,
            type: newActivityType,
            startTime: newActivityStartTime,
            endTime: newActivityEndTime
        };

        onUpdateDay({
            ...currentData,
            activities: [...(currentData.activities || []), newActivity]
        });

        setNewActivityTitle('');
        setNewActivityStartTime('');
        setNewActivityEndTime('');
    };

    const handleDeleteActivity = (activityId: string) => {
        if (!selectedDate) return;
        const currentData = (custodyDays || []).find(d => d.date === selectedDate);
        if (currentData) {
            onUpdateDay({
                ...currentData,
                activities: (currentData.activities || []).filter(a => a.id !== activityId)
            });
        }
    };

    const renderStatusIcon = (status: CustodyStatus) => {
        switch (status) {
            case 'me': return <User size={14} className="text-emerald-400" />;
            case 'partner': return <UserX size={14} className="text-blue-400" />;
            case 'split': return <Users size={14} className="text-amber-400" />;
            default: return null;
        }
    };

    const getStatusColor = (status: CustodyStatus) => {
        switch (status) {
            case 'me': return 'bg-emerald-500/20 border-emerald-500/30';
            case 'partner': return 'bg-blue-500/20 border-blue-500/30';
            case 'split': return 'bg-amber-500/20 border-amber-500/30';
            default: return 'hover:bg-white/5 border-transparent';
        }
    };

    // Calculate Stats for Current Month
    const stats = useMemo(() => {
        let me = 0, partner = 0, split = 0;
        const monthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        custodyDays.forEach(d => {
            if (d.date.startsWith(monthPrefix)) {
                if (d.status === 'me') me++;
                if (d.status === 'partner') partner++;
                if (d.status === 'split') split++;
            }
        });
        return { me, partner, split };
    }, [custodyDays, currentDate]);

    return (
        <div className="flex flex-col h-full bg-background text-white relative pt-0">
            {/* Toolbar (Visible below Global Header) */}
            <div className="px-4 py-4 flex flex-col gap-3 border-b border-white/5 bg-background/95 backdrop-blur-xl sticky top-0 z-40 shadow-lg shadow-black/20">
                {/* Row 1: Nav & Title */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={24} className="text-slate-300" />
                    </button>
                    <h1 className="text-xl font-heading font-bold flex items-center gap-2">
                        {t('coParenting.title')}
                    </h1>
                    {/* Placeholder for alignment, as invite button moved */}
                    <div className="w-10"></div>
                </div>

                {/* Action Row: Sync | Invite | iOS Cal | Manage */}
                <div className="grid grid-cols-4 gap-2">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="py-3 px-2 rounded-xl bg-surface border border-white/10 flex flex-col items-center justify-center gap-1 hover:bg-white/5 active:scale-95 transition-all"
                    >
                        <RefreshCw size={18} className={`text-blue-400 ${isSyncing ? "animate-spin" : ""}`} />
                        <span className="font-bold text-xs text-blue-100">{t('coParenting.sync')}</span>
                    </button>

                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="py-3 px-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center gap-1 hover:bg-indigo-500/20 active:scale-95 transition-all"
                    >
                        <User size={18} className="text-indigo-400" />
                        <span className="font-bold text-xs text-indigo-100">{t('coParenting.invite')}</span>
                    </button>

                    <button
                        onClick={async () => {
                            setIsSyncing(true);
                            try {
                                const { CalendarService } = await import('../services/calendarService');
                                await CalendarService.syncToIOSCalendar(custodyDays);
                                // Success - the share sheet will appear
                            } catch (error: any) {
                                console.error('iOS Calendar sync failed:', error);
                                alert(error.message || 'Failed to generate calendar file.');
                            } finally {
                                setIsSyncing(false);
                            }
                        }}
                        disabled={isSyncing}
                        className="py-3 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center gap-1 hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <CalendarIcon size={18} className="text-emerald-400" />
                        <span className="font-bold text-xs text-emerald-100">{t('coParenting.iosCal')}</span>
                    </button>

                    <button
                        onClick={() => setManageEvents(!manageEvents)}
                        className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${manageEvents
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-surface border-white/10 text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        {manageEvents ? <Check size={18} /> : <CalendarIcon size={18} />}
                        <span className="font-bold text-xs">{manageEvents ? t('coParenting.done') : t('coParenting.manage')}</span>
                    </button>
                </div>
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowInviteModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-card border border-slate-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl"
                        >
                            <h3 className="text-lg font-bold text-white mb-2">{t('coParenting.inviteTitle')}</h3>
                            <p className="text-white/60 text-sm mb-4">{t('coParenting.inviteDesc')}</p>

                            <input
                                type="email"
                                placeholder={t('coParenting.placeholderEmail')}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white mb-4 focus:ring-2 focus:ring-primary outline-none"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-white/70 hover:bg-white/5 transition-colors"
                                >
                                    {t('coParenting.cancel')}
                                </button>
                                <button
                                    onClick={handleInvite}
                                    disabled={isInviting}
                                    className="flex-1 bg-primary py-3 rounded-xl font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {isInviting ? t('coParenting.sending') : t('coParenting.shareInvite')}
                                </button>
                            </div>

                            <div className="mt-4 flex justify-center">
                                <button
                                    onClick={async () => {
                                        try {
                                            const link = `truetrack://invite?email=${encodeURIComponent(inviteEmail)}`;
                                            await import('@capacitor/clipboard').then(({ Clipboard }) => {
                                                Clipboard.write({ string: link });
                                            });
                                            alert('Link copied! Send it via iMessage or WhatsApp for best results.');
                                        } catch (e) {
                                            console.error("Clipboard error:", e);
                                            prompt("Copy this link manually:", `truetrack://invite?email=${encodeURIComponent(inviteEmail)}`);
                                        }
                                    }}
                                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <Copy size={12} /> Copy Link manually
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ... Rest of existing UI ... */}


            <div className="flex-1 overflow-y-auto p-4 pb-20">

                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6 bg-surface p-4 rounded-2xl border border-white/5">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft size={20} className="text-slate-400" />
                    </button>
                    <h2 className="text-xl font-bold text-white">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronRight size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center">
                        <p className="text-xs text-emerald-400 font-bold uppercase mb-1">{t('coParenting.me')}</p>
                        <p className="text-xl font-bold text-white">{stats.me}</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-center">
                        <p className="text-xs text-blue-400 font-bold uppercase mb-1">{t('coParenting.partner')}</p>
                        <p className="text-xl font-bold text-white">{stats.partner}</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-center">
                        <p className="text-xs text-amber-400 font-bold uppercase mb-1">{t('coParenting.split')}</p>
                        <p className="text-xl font-bold text-white">{stats.split}</p>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase py-2">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}
                    {Array.from({ length: days }).map((_, i) => {
                        const day = i + 1;
                        const dayData = getDayData(day);
                        const status = dayData?.status || 'none';
                        const hasActivities = (dayData?.activities || []).length > 0;

                        const isToday =
                            new Date().getDate() === day &&
                            new Date().getMonth() === currentDate.getMonth() &&
                            new Date().getFullYear() === currentDate.getFullYear();

                        return (
                            <button
                                key={day}
                                onClick={() => handleDayClick(day)}
                                className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all duration-200 ${getStatusColor(status)} ${isToday ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''} ${manageEvents ? 'hover:scale-105 active:scale-95 cursor-pointer ring-1 ring-purple-500/50' : ''}`}
                            >
                                <span className={`text-sm font-bold ${status !== 'none' ? 'text-white' : 'text-slate-400'}`}>{day}</span>

                                {hasActivities && (
                                    <div className="absolute top-1 right-1 flex gap-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm animate-pulse"></div>
                                    </div>
                                )}

                                <div className="mt-1">
                                    {renderStatusIcon(status)}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-2 flex justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-emerald-400" />
                        <span className="text-xs text-slate-400">{t('coParenting.me')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <UserX size={14} className="text-blue-400" />
                        <span className="text-xs text-slate-400">{t('coParenting.partner')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-amber-400" />
                        <span className="text-xs text-slate-400">{t('coParenting.split')}</span>
                    </div>
                </div>
            </div>

            {/* Activity Modal */}
            {showActivityModal && selectedDate && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pb-24 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-sm rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                        <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h3 className="font-heading font-bold text-lg text-white">
                                {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                            </h3>
                            <button
                                onClick={() => setShowActivityModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Existing Activities */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">{t('coParenting.activities')}</label>
                                {((custodyDays || []).find(d => d.date === selectedDate)?.activities || []).length > 0 ? (
                                    ((custodyDays || []).find(d => d.date === selectedDate)?.activities || []).map(activity => (
                                        <div key={activity.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 group">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-md ${activity.type === 'birthday' ? 'bg-pink-500/20 text-pink-400' :
                                                    activity.type === 'sport' ? 'bg-orange-500/20 text-orange-400' :
                                                        activity.type === 'school' ? 'bg-blue-500/20 text-blue-400' :
                                                            activity.type === 'playdate' ? 'bg-indigo-500/20 text-indigo-400' :
                                                                'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {activity.type === 'birthday' && <Cake size={14} />}
                                                    {activity.type === 'sport' && <Activity size={14} />}
                                                    {activity.type === 'school' && <GraduationCap size={14} />}
                                                    {activity.type === 'playdate' && <Users size={14} />}
                                                    {activity.type === 'other' && <MoreHorizontal size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-200">{activity.title}</p>
                                                    {(activity.startTime || activity.endTime) && (
                                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Clock size={8} />
                                                            {activity.startTime || '??:??'} {activity.endTime ? `- ${activity.endTime}` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteActivity(activity.id)}
                                                className="p-1.5 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-500 italic py-1 px-1">{t('coParenting.noActivities')}</p>
                                )}
                            </div>

                            {/* Add New Activity */}
                            <div className="pt-3 border-t border-white/10 space-y-2">
                                <input
                                    type="text"
                                    placeholder={t('coParenting.newActivity')}
                                    value={newActivityTitle}
                                    onChange={(e) => setNewActivityTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                                />
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg px-2 flex-1">
                                        <span className="text-xs text-slate-500 font-bold uppercase">{t('coParenting.from')}</span>
                                        <input
                                            type="time"
                                            value={newActivityStartTime}
                                            onChange={(e) => setNewActivityStartTime(e.target.value)}
                                            className="bg-transparent text-white focus:outline-none text-xs flex-1 w-full py-2"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg px-2 flex-1">
                                        <span className="text-xs text-slate-500 font-bold uppercase">{t('coParenting.to')}</span>
                                        <input
                                            type="time"
                                            value={newActivityEndTime}
                                            onChange={(e) => setNewActivityEndTime(e.target.value)}
                                            className="bg-transparent text-white focus:outline-none text-xs flex-1 w-full py-2"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 py-1">
                                    <div className="flex-1 overflow-x-auto pb-1 no-scrollbar">
                                        <div className="flex justify-between gap-1 mb-2">
                                            {[
                                                { type: 'birthday', icon: <Cake size={14} />, label: t('coParenting.types.birthday') },
                                                { type: 'sport', icon: <Activity size={14} />, label: t('coParenting.types.sport') },
                                                { type: 'school', icon: <GraduationCap size={14} />, label: t('coParenting.types.school') },
                                                { type: 'playdate', icon: <Users size={14} />, label: t('coParenting.types.playdate') },
                                                { type: 'other', icon: <MoreHorizontal size={14} />, label: t('coParenting.types.other') }
                                            ].map(t => (
                                                <button
                                                    key={t.type}
                                                    onClick={() => setNewActivityType(t.type as any)}
                                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all min-w-[50px] ${newActivityType === t.type
                                                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                                        : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {t.icon}
                                                    <span className="text-xs font-bold">{t.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddActivity}
                                        disabled={!newActivityTitle.trim()}
                                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-4 rounded-lg transition-colors shadow-lg shadow-purple-600/20"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustodyCalendar;
