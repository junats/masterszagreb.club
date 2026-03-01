import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, PieChart, Activity, Check } from 'lucide-react';
import { CustodyDay } from '@common/types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalYYYYMMDD } from '../../utils/dateUtils';

export interface CoParentingVisualsModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeVisual: 'grid' | 'orbital' | 'dna' | null;
    custodyDays: CustodyDay[];
    monthStats: { meDays: number; partnerDays: number; splitDays: number; daysInMonth: number };
    monthCalendar: (Date | null)[];
}

export const CoParentingVisualsModal: React.FC<CoParentingVisualsModalProps> = ({
    isOpen,
    onClose,
    activeVisual,
    custodyDays,
    monthStats,
    monthCalendar
}) => {
    const { t } = useLanguage();

    if (!activeVisual) return null;

    // Helpers
    const getDayStatus = (date: Date) => {
        const dateStr = getLocalYYYYMMDD(date);
        const custody = (custodyDays || []).find(d => d.date === dateStr || d.date?.startsWith(dateStr));
        return custody ? custody.status : null;
    };

    const titleMap = {
        grid: t('dashboard.coparenting.visuals.gridTitle') || 'Custody Grid',
        orbital: t('dashboard.coparenting.visuals.orbitalTitle') || 'Custody Orbital',
        dna: t('dashboard.coparenting.visuals.dnaTitle') || 'Custody DNA',
    };

    const descMap = {
        grid: t('dashboard.coparenting.visuals.gridDesc') || '',
        orbital: t('dashboard.coparenting.visuals.orbitalDesc') || '',
        dna: t('dashboard.coparenting.visuals.dnaDesc') || '',
    };

    const iconMap = {
        grid: <Calendar size={24} />,
        orbital: <PieChart size={24} />,
        dna: <Activity size={24} />
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0f172a] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
                        >
                            {/* Header */}
                            <div className="relative p-6 border-b border-white/5 bg-slate-900/50">
                                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800/50 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                                    <X size={16} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                        {iconMap[activeVisual]}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-heading font-bold text-white">{titleMap[activeVisual]}</h2>
                                        <p className="text-sm text-slate-400">{descMap[activeVisual]}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto w-full flex flex-col items-center justify-center min-h-[300px]">
                                {activeVisual === 'grid' && (
                                    <div className="w-full">
                                        <div className="grid grid-cols-7 gap-2">
                                            {monthCalendar.map((date, idx) => {
                                                if (!date) return <div key={`e-${idx}`} className="aspect-square rounded-xl" />;
                                                const status = getDayStatus(date);
                                                const isToday = date.toDateString() === new Date().toDateString();
                                                return (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.01 }}
                                                        className={
                                                            "aspect-square rounded-xl flex items-center justify-center text-sm font-bold relative " +
                                                            (status === 'me' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-white' :
                                                                status === 'partner' ? 'bg-purple-500/40 border border-purple-500/50 text-purple-200' :
                                                                    status === 'split' ? 'bg-yellow-500/40 border border-yellow-500/50 text-yellow-200' :
                                                                        'bg-slate-800/50 border border-slate-700 text-slate-500') +
                                                            (isToday ? ' ring-2 ring-white/60 ring-offset-2 ring-offset-[#0f172a]' : '')
                                                        }
                                                    >
                                                        {status === 'me' ? <Check size={20} strokeWidth={3} /> : date.getDate()}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {activeVisual === 'orbital' && (
                                    <div className="w-full flex-col flex items-center gap-8 py-4">
                                        <div className="relative w-64 h-64">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <div className="text-5xl font-bold text-white tracking-tighter">{monthStats.meDays}</div>
                                                <div className="text-sm uppercase tracking-widest text-blue-400 font-bold mt-1">{t('dashboard.coparenting.you') || 'You'}</div>
                                            </div>
                                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 overflow-visible drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                                                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="12" />
                                                {monthCalendar.filter(d => d !== null).map((date, idx, arr) => {
                                                    if (!date) return null;
                                                    const status = getDayStatus(date);
                                                    const total = arr.length;
                                                    const sectorSize = (2 * Math.PI) / total;
                                                    const gap = 0.03;
                                                    const startAngle = idx * sectorSize;
                                                    const endAngle = (idx + 1) * sectorSize - gap;
                                                    const radius = 42;
                                                    const x1 = 50 + radius * Math.cos(startAngle);
                                                    const y1 = 50 + radius * Math.sin(startAngle);
                                                    const x2 = 50 + radius * Math.cos(endAngle);
                                                    const y2 = 50 + radius * Math.sin(endAngle);
                                                    const color = status === 'me' ? '#3b82f6' : status === 'split' ? '#eab308' : status === 'partner' ? '#a855f7' : '#334155';
                                                    const d = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
                                                    return (
                                                        <motion.path
                                                            key={idx}
                                                            d={d}
                                                            fill="none"
                                                            stroke={color}
                                                            strokeWidth={status === 'me' ? 12 : 8}
                                                            strokeLinecap="round"
                                                            strokeOpacity={status ? 1 : 0.2}
                                                            initial={{ pathLength: 0, opacity: 0 }}
                                                            animate={{ pathLength: 1, opacity: 1 }}
                                                            transition={{ delay: idx * 0.02, duration: 0.3, type: "spring" }}
                                                        />
                                                    );
                                                })}
                                            </svg>
                                        </div>
                                        <div className="flex gap-6 w-full justify-center">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-sm text-slate-300 font-medium">You ({monthStats.meDays})</span></div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /><span className="text-sm text-slate-300 font-medium">Partner ({monthStats.partnerDays})</span></div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-sm text-slate-300 font-medium">Split ({monthStats.splitDays})</span></div>
                                        </div>
                                    </div>
                                )}

                                {activeVisual === 'dna' && (
                                    <div className="w-full flex-col flex items-center py-8">
                                        <svg viewBox="0 0 400 120" className="w-full h-auto overflow-visible">
                                            {monthCalendar.filter(d => d !== null).map((date, idx, arr) => {
                                                if (!date) return null;
                                                const status = getDayStatus(date);
                                                const x = (idx / arr.length) * 360 + 20;
                                                const phase = (idx / 12) * Math.PI * 2;
                                                const y1 = 60 + Math.sin(phase) * 40;
                                                const y2 = 60 - Math.sin(phase) * 40;
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
                                                                stroke="#475569" strokeWidth={1} strokeOpacity={0.4}
                                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                                transition={{ delay: idx * 0.02 }}
                                                            />
                                                        )}
                                                        <motion.circle
                                                            cx={x} cy={y1} r={isMe ? 5 : 3}
                                                            fill={color} fillOpacity={opacity}
                                                            initial={{ scale: 0 }} animate={{ scale: depthScale }}
                                                            transition={{ delay: idx * 0.02, type: "spring" }}
                                                            className={isMe ? 'drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]' : ''}
                                                        />
                                                        <motion.circle
                                                            cx={x} cy={y2} r={isPartner ? 5 : 3}
                                                            fill={partnerColor} fillOpacity={opacity}
                                                            initial={{ scale: 0 }} animate={{ scale: depthScale }}
                                                            transition={{ delay: idx * 0.02, type: "spring" }}
                                                            className={isPartner ? 'drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]' : ''}
                                                        />

                                                        {/* Day label if it's a 'me' day and in foreground */}
                                                        {isMe && cosVal > 0.5 && (
                                                            <motion.text
                                                                x={x} y={y1 > 60 ? y1 + 18 : y1 - 10}
                                                                fill="#f8fafc" fontSize="10"
                                                                fontWeight="bold"
                                                                textAnchor="middle"
                                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                                transition={{ delay: idx * 0.02 + 0.3 }}
                                                            >
                                                                {date.getDate()}
                                                            </motion.text>
                                                        )}
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                        <div className="mt-8 text-center px-4">
                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                This timeline represents the rhythm of your custody schedule.
                                                <span className="text-blue-400 font-semibold ml-1">Blue nodes</span> in the foreground indicate your custody days.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
