import React, { useState, useMemo } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Users, UserX } from 'lucide-react';
import { CustodyDay, CustodyStatus } from '../types';

interface CustodyCalendarProps {
    custodyDays: CustodyDay[];
    onUpdateDay: (day: CustodyDay) => void;
    onBack: () => void;
}

const CustodyCalendar: React.FC<CustodyCalendarProps> = ({ custodyDays, onUpdateDay, onBack }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

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

    const getStatusForDate = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return (custodyDays || []).find(d => d.date === dateStr)?.status || 'none';
    };

    const handleDayClick = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentStatus = getStatusForDate(day);

        let nextStatus: CustodyStatus = 'none';
        if (currentStatus === 'none') nextStatus = 'me';
        else if (currentStatus === 'me') nextStatus = 'partner';
        else if (currentStatus === 'partner') nextStatus = 'split';
        else if (currentStatus === 'split') nextStatus = 'none';

        onUpdateDay({ date: dateStr, status: nextStatus });
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
        <div className="flex flex-col h-full bg-background text-white">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 border-b border-white/10 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-300" />
                </button>
                <h1 className="text-lg font-heading font-bold flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-purple-400" />
                    Custody Calendar
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4">

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
                        <p className="text-xs text-emerald-400 font-bold uppercase mb-1">Me</p>
                        <p className="text-xl font-bold text-white">{stats.me}</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-center">
                        <p className="text-xs text-blue-400 font-bold uppercase mb-1">Partner</p>
                        <p className="text-xl font-bold text-white">{stats.partner}</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-center">
                        <p className="text-xs text-amber-400 font-bold uppercase mb-1">Split</p>
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
                        const status = getStatusForDate(day);
                        const isToday =
                            new Date().getDate() === day &&
                            new Date().getMonth() === currentDate.getMonth() &&
                            new Date().getFullYear() === currentDate.getFullYear();

                        return (
                            <button
                                key={day}
                                onClick={() => handleDayClick(day)}
                                className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all duration-200 ${getStatusColor(status)} ${isToday ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                            >
                                <span className={`text-sm font-bold ${status !== 'none' ? 'text-white' : 'text-slate-400'}`}>{day}</span>
                                <div className="mt-1">
                                    {renderStatusIcon(status)}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-8 flex justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-emerald-400" />
                        <span className="text-xs text-slate-400">Me</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <UserX size={14} className="text-blue-400" />
                        <span className="text-xs text-slate-400">Partner</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-amber-400" />
                        <span className="text-xs text-slate-400">Split</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustodyCalendar;
