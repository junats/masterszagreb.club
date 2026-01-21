import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Scale, Heart, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { CustodyDay } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

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
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-heading font-bold text-white">{t('coParenting.analysisTitle')}</h2>
                                        <p className="text-sm text-slate-400">{t('coParenting.analysisSubtitle')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto space-y-6">
                                {/* Score Cards */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: t('coParenting.harmony'), score: metrics.harmony, icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
                                        { label: t('coParenting.equity'), score: metrics.equity, icon: Scale, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                        { label: t('coParenting.stability'), score: metrics.stability, icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                                    ].map(stat => (
                                        <div key={stat.label} className={`p-3 rounded-2xl border border-white/5 ${stat.bg} flex flex-col items-center text-center`}>
                                            <stat.icon size={16} className={`mb-2 ${stat.color}`} />
                                            <span className="text-2xl font-bold text-white tabular-nums">{stat.score}</span>
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{stat.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Honest Advice Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">{t('coParenting.feedbackTitle')}</h3>
                                    {adviceList.map((item, i) => (
                                        <div key={i} className={`p-4 rounded-2xl border ${item.type === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                                            item.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20' :
                                                item.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                                    'bg-slate-800/50 border-white/5'
                                            }`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {item.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <ShieldAlert size={16} className={item.type === 'critical' ? 'text-red-400' : 'text-orange-400'} />}
                                                <h4 className={`text-sm font-bold ${item.type === 'critical' ? 'text-red-400' :
                                                    item.type === 'warning' ? 'text-orange-400' :
                                                        item.type === 'success' ? 'text-emerald-400' : 'text-slate-200'
                                                    }`}>{item.title}</h4>
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed opacity-90">
                                                "{item.text}"
                                            </p>
                                        </div>
                                    ))}
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
