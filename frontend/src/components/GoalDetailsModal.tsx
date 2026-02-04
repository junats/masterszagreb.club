import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Brain, Target, Flame, Calendar, AlertTriangle } from 'lucide-react';
import { Goal, Receipt } from '@common/types';
import { CATEGORY_COLORS } from '../constants/colors';

interface GoalDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal | null;
    receipts: Receipt[]; // To calculate actual insights
}

export const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({ isOpen, onClose, goal, receipts }) => {
    if (!goal) return null;

    // --- PSEUDO-AI ANALYSIS ---
    const analysis = useMemo(() => {
        // Filter receipts for this goal (simplified logic based on keywords)
        const relevantReceipts = receipts.filter(r =>
            r.items.some(i =>
                goal.keywords.some(k => i.name.toLowerCase().includes(k.toLowerCase())) ||
                (r.storeName && goal.keywords.some(k => r.storeName.toLowerCase().includes(k.toLowerCase())))
            )
        );

        const totalSpent = relevantReceipts.reduce((sum, r) => sum + r.total, 0);
        const lastMonthReceipts = relevantReceipts.filter(r => new Date(r.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const lastMonthSpent = lastMonthReceipts.reduce((sum, r) => sum + r.total, 0);
        const projectedSavings = lastMonthSpent * 12; // Simple projection

        // Generate AI Insight Text based on patterns
        let insight = "Your spending pattern allows for better optimization. Reducing frequency could improve savings.";
        let mood: 'good' | 'neutral' | 'bad' = 'neutral';

        if (goal.streak > 10) {
            insight = "AI Analysis: Excellent discipline detected. You have successfully broken the habit loop for over 10 days. Dopamine baseline is likely resetting.";
            mood = 'good';
        } else if (lastMonthSpent > 200) {
            insight = "AI Warning: High velocity spending detected in this category. Impulse triggers appear to be active on weekends.";
            mood = 'bad';
        } else {
            insight = "AI Observation: Sporadic spending events detected. Consider replacing this habit with a low-cost alternative to boost dopamine naturally.";
        }

        return { totalSpent, lastMonthSpent, projectedSavings, insight, mood, count: relevantReceipts.length };
    }, [goal, receipts]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative"
                        >
                            {/* Decorative Background Gradients */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

                            {/* Header */}
                            <div className="relative p-6 pb-4 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-4xl">{goal.emoji}</span>
                                        <div>
                                            <h2 className="text-xl font-bold text-white leading-tight">{goal.name}</h2>
                                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">AI Goal Monitor</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Streak Badge */}
                            <div className="px-6 mb-6">
                                <div className={`flex items-center gap-3 p-3 rounded-xl border ${goal.streak > 0 ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/50 border-white/5'}`}>
                                    <div className={`p-2 rounded-lg ${goal.streak > 0 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                        <Flame size={20} fill={goal.streak > 0 ? "currentColor" : "none"} />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white tabular-nums">{goal.streak} Days</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Current Streak</p>
                                    </div>
                                </div>
                            </div>

                            {/* AI Insight Section */}
                            <div className="px-6 mb-6">
                                <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 p-4 rounded-2xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50" />
                                    <div className="flex items-start gap-3 mb-2">
                                        <Brain size={16} className="text-indigo-300 mt-0.5" />
                                        <p className="text-xs font-bold text-indigo-300 uppercase tracking-wide">TrueTrack AI Analysis</p>
                                    </div>
                                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                        "{analysis.insight}"
                                    </p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="px-6 mb-8 grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-800/30 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">30-Day Spend</p>
                                    <p className="text-lg font-bold text-white">€{analysis.lastMonthSpent.toFixed(0)}</p>
                                </div>
                                <div className="p-3 bg-slate-800/30 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Items Detected</p>
                                    <p className="text-lg font-bold text-white">{analysis.count}</p>
                                </div>
                                <div className="col-span-2 p-3 bg-slate-800/30 rounded-xl border border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Projected Annual Savings</p>
                                        <p className="text-sm text-slate-400">If goal is maintained</p>
                                    </div>
                                    <p className="text-xl font-bold text-emerald-400">€{analysis.projectedSavings.toFixed(0)}</p>
                                </div>
                            </div>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
