import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Lightbulb, Divide } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface SnapshotMetric {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'neutral';
    icon: any;
    detail?: string;
    popup?: {
        title: string;
        description: string;
        insight: string;
        items?: { label: string; value: string; subtext?: string }[];
    }
}

interface SnapshotDetailsModalProps {
    metric: SnapshotMetric | null;
    onClose: () => void;
}

const SnapshotDetailsModal: React.FC<SnapshotDetailsModalProps> = ({ metric, onClose }) => {
    if (!metric || !metric.popup) return null;

    const { title, description, insight, items } = metric.popup;
    const Icon = metric.icon;

    return (
        <AnimatePresence>
            {metric && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:translate-x-[-50%] md:w-[400px] z-[70] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Header Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

                        <div className="p-6 relative z-10">
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={16} />
                            </button>

                            {/* Header Icon & Title */}
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 ring-1 ring-indigo-500/20 shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]">
                                    <Icon size={32} />
                                </div>
                                <h2 className="text-xl font-heading font-bold text-white mb-1">{title}</h2>
                                <p className="text-3xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                    {metric.value}
                                </p>
                            </div>

                            {/* Description */}
                            <div className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
                                {description}
                            </div>

                            {/* Breakdown List */}
                            {items && items.length > 0 && (
                                <div className="bg-slate-950/50 rounded-xl border border-white/5 p-4 mb-6">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Breakdown</h4>
                                    <div className="space-y-3">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">{item.label}</span>
                                                        {item.subtext && <span className="text-[10px] text-slate-500">{item.subtext}</span>}
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-slate-400">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Insight Box */}
                            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4 flex gap-3">
                                <Lightbulb className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wide mb-1">AI Insight</h4>
                                    <p className="text-xs text-indigo-200/80 leading-relaxed font-medium">
                                        {insight}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SnapshotDetailsModal;
