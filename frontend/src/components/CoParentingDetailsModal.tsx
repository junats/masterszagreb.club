import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart2, Scale, Heart, Shield, Check } from 'lucide-react';
import { CustodyDay } from '@common/types';
import { useLanguage } from '../contexts/LanguageContext';
import { CountUp } from './CountUp';

interface CoParentingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    metrics: {
        equity: number;
        stability: number;
        harmony: number;
    };
    custodyDays: CustodyDay[];
}

export const CoParentingDetailsModal: React.FC<CoParentingDetailsModalProps> = ({ isOpen, onClose, metrics, custodyDays }) => {
    const { t } = useLanguage();

    if (!custodyDays) return null;

    // AI "Honest" Advice Generation
    const getHonestAdvice = () => {
        const { equity, stability, harmony } = metrics;
        const advice = [];

        if (harmony > 85) {
            advice.push({
                type: 'success',
                title: t('coParenting.advice.thrivingTitle'),
                text: t('coParenting.advice.thrivingDesc')
            });
        } else if (harmony < 50) {
            advice.push({
                type: 'critical',
                title: t('coParenting.advice.criticalTitle'),
                text: t('coParenting.advice.criticalDesc')
            });
        }

        if (equity < 40) {
            advice.push({
                type: 'warning',
                title: t('coParenting.advice.imbalanceTitle'),
                text: t('coParenting.advice.imbalanceDesc')
            });
        }

        if (stability < 60) {
            advice.push({
                type: 'warning',
                title: t('coParenting.advice.erraticTitle'),
                text: t('coParenting.advice.erraticDesc')
            });
        }

        if (advice.length === 0) {
            advice.push({
                type: 'info',
                title: t('coParenting.advice.progressTitle'),
                text: t('coParenting.advice.progressDesc')
            });
        }

        return advice;
    };

    const adviceList = getHonestAdvice();

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
                            className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]"
                        >
                            {/* Header */}
                            <div className="relative p-6 border-b border-white/5 bg-slate-900/50">
                                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800/50 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                                    <X size={16} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                        <BarChart2 size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-heading font-bold text-white">{t('coParenting.analysisTitle')}</h2>
                                        <p className="text-sm text-slate-400">{t('coParenting.analysisSubtitle')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto space-y-8">
                                {/* Premium Animated Score Rings */}
                                <div className="flex justify-between items-end px-2">
                                    {[
                                        { label: t('coParenting.equity'), score: metrics.equity, icon: Scale, color: 'blue', gradient: ['#3b82f6', '#60a5fa'] },
                                        { label: t('coParenting.harmony'), score: metrics.harmony, icon: Heart, color: 'pink', gradient: ['#ec4899', '#f472b6'], large: true },
                                        { label: t('coParenting.stability'), score: metrics.stability, icon: Shield, color: 'purple', gradient: ['#a855f7', '#c084fc'] },
                                    ].map((stat, idx) => (
                                        <div key={stat.label} className={`flex flex-col items-center gap-3 ${stat.large ? '-mt-4' : ''}`}>
                                            <div className="relative flex items-center justify-center">
                                                {/* Background Ring */}
                                                <svg
                                                    width={stat.large ? 120 : 88}
                                                    height={stat.large ? 120 : 88}
                                                    viewBox={stat.large ? "0 0 120 120" : "0 0 88 88"}
                                                    className="transform -rotate-90"
                                                >
                                                    <circle
                                                        cx={stat.large ? 60 : 44}
                                                        cy={stat.large ? 60 : 44}
                                                        r={stat.large ? 54 : 40}
                                                        stroke="currentColor"
                                                        strokeWidth={stat.large ? 8 : 6}
                                                        fill="transparent"
                                                        className={`text-slate-800`}
                                                    />
                                                    {/* Animated Progress Ring */}
                                                    <motion.circle
                                                        cx={stat.large ? 60 : 44}
                                                        cy={stat.large ? 60 : 44}
                                                        r={stat.large ? 54 : 40}
                                                        stroke={`url(#gradient-${stat.color})`}
                                                        strokeWidth={stat.large ? 8 : 6}
                                                        strokeLinecap="round"
                                                        fill="transparent"
                                                        initial={{ strokeDasharray: stat.large ? 339 : 251, strokeDashoffset: stat.large ? 339 : 251 }}
                                                        animate={{ strokeDashoffset: (stat.large ? 339 : 251) - ((stat.score / 100) * (stat.large ? 339 : 251)) }}
                                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                                    />
                                                    {/* Gradient Definition */}
                                                    <defs>
                                                        <linearGradient id={`gradient-${stat.color}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor={stat.gradient[0]} />
                                                            <stop offset="100%" stopColor={stat.gradient[1]} />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>

                                                {/* Score & Icon (Centered) */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <stat.icon
                                                        size={stat.large ? 24 : 18}
                                                        className={`mb-1 ${stat.color === 'pink' ? 'text-pink-400' : stat.color === 'blue' ? 'text-blue-400' : 'text-purple-400'}`}
                                                        strokeWidth={2.5}
                                                    />
                                                    <div className="flex items-baseline">
                                                        <CountUp
                                                            value={stat.score}
                                                            duration={1.5}
                                                            className={`font-heading font-bold text-white ${stat.large ? 'text-4xl' : 'text-2xl'}`}
                                                        />
                                                        <span className={`text-xs font-bold ml-0.5 ${stat.color === 'pink' ? 'text-pink-400' : stat.color === 'blue' ? 'text-blue-400' : 'text-purple-400'}`}>%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                                {/* Honest Advice Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-blue-400" />
                                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">{t('coParenting.feedbackTitle')}</h3>
                                    </div>
                                    <div className="grid gap-3">
                                        {adviceList.map((item, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 + (i * 0.1) }}
                                                className={`p-4 rounded-2xl border backdrop-blur-md relative overflow-hidden ${item.type === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                                                    item.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20' :
                                                        item.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                                            'bg-slate-800/40 border-white/5'
                                                    }`}
                                            >
                                                {/* Glass Reflection Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                                                <div className="relative flex gap-3">
                                                    <div className={`mt-0.5 shrink-0 ${item.type === 'critical' ? 'text-red-400' :
                                                        item.type === 'warning' ? 'text-orange-400' :
                                                            item.type === 'success' ? 'text-emerald-400' : 'text-slate-400'
                                                        }`}>
                                                        {item.type === 'success' ? <Check size={18} strokeWidth={2.5} /> : <Shield size={18} strokeWidth={2.5} />}
                                                    </div>
                                                    <div>
                                                        <h4 className={`text-sm font-bold mb-1 ${item.type === 'critical' ? 'text-red-400' :
                                                            item.type === 'warning' ? 'text-orange-400' :
                                                                item.type === 'success' ? 'text-emerald-400' : 'text-slate-200'
                                                            }`}>{item.title}</h4>
                                                        <p className="text-sm text-slate-300 leading-relaxed opacity-90 font-medium">
                                                            {item.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
