import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Lock, CheckCircle2 } from 'lucide-react';

interface Achievement {
    id: string;
    label: string;
    icon?: React.ReactNode;
    unlocked: boolean;
    color: string;
    bgColor: string;
    borderColor: string;
    description?: string; // Also add description as optional based on usage
}
// ...


interface AchievementDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    achievement: Achievement | null;
}

export const AchievementDetailsModal: React.FC<AchievementDetailsModalProps> = ({ isOpen, onClose, achievement }) => {
    if (!achievement) return null;

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
                            className="bg-[#0f172a] border border-white/10 w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl relative"
                        >
                            <div className={`absolute top-0 inset-x-0 h-32 ${achievement.unlocked ? achievement.bgColor.replace('/10', '/20') : 'bg-slate-800/50'} pointer-events-none`} />

                            {/* Close Button */}
                            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 transition-colors z-10">
                                <X size={16} />
                            </button>

                            <div className="relative pt-12 px-6 pb-8 flex flex-col items-center text-center">
                                {/* Icon Halo */}
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 mb-4 shadow-xl ${achievement.unlocked
                                    ? `${achievement.bgColor} ${achievement.borderColor} ${achievement.color}`
                                    : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                                    {/* Clone icon with larger size */}
                                    {achievement.icon && React.cloneElement(achievement.icon as React.ReactElement, { size: 40 } as any)}
                                </div>

                                <h2 className="text-xl font-heading font-bold text-white mb-1">{achievement.label}</h2>
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide mb-4 ${achievement.unlocked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-white/5'}`}>
                                    {achievement.unlocked ? (
                                        <><CheckCircle2 size={12} /> Unlocked</>
                                    ) : (
                                        <><Lock size={12} /> Locked</>
                                    )}
                                </div>

                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {achievement.unlocked ? achievement["description"] : "Keep consistent to unlock this."}
                                </p>

                                {/* Extensive Details */}
                                <div className="w-full space-y-3 mt-6 text-left">
                                    <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Why it matters</h4>
                                        <p className="text-xs text-slate-300">
                                            {achievement.id === 'early_bird' ? "Morning spending habits correlate with 20% better daily budget adherence." :
                                                achievement.id === 'night_owl' ? "Late night spending is often impulsive. Tracking this helps identify triggers." :
                                                    achievement.id === 'high_roller' ? "Large transactions can derail monthly goals. Awareness is key." :
                                                        "Building positive financial habits creates long-term wealth stability."}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Frequency</h4>
                                            <p className="text-sm font-bold text-white tabular-nums">Top 5%</p>
                                        </div>
                                        <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Next Level</h4>
                                            <p className="text-sm font-bold text-white">Elite</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
};
