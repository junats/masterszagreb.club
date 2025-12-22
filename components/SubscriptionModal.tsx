import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Shield, Lock, FileDown, Cloud, Zap, BarChart3 } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade?: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onUpgrade }) => {
    const [loading, setLoading] = useState(false);
    const { setIsProMode } = useData();

    if (!isOpen) return null;

    const handlePurchase = () => {
        setLoading(true);
        // Simulate payment processing (mock Apple Store purchase)
        setTimeout(() => {
            // Call onUpgrade first to update user.tier in UserContext
            if (onUpgrade) onUpgrade();
            // Then set Pro mode in DataContext
            setIsProMode(true);
            setLoading(false);
            onClose();
        }, 1500);
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center px-4 pt-16 pb-4 sm:p-0">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="bg-slate-900 w-full max-w-sm sm:max-w-md rounded-3xl border border-white/10 overflow-hidden relative z-10 animate-in slide-in-from-bottom-10 fade-in duration-300 shadow-2xl flex flex-col">
                {/* Compact Header */}
                <div className="h-24 bg-gradient-to-br from-indigo-600 to-purple-700 relative p-6 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg">
                            <Shield className="text-white w-5 h-5" fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-none">Upgrade to Pro</h2>
                            <p className="text-indigo-100/70 text-xs mt-1 font-medium">Unlock full potential</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="text-white/70 hover:text-white bg-black/20 rounded-full p-1.5 hover:bg-black/30 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[60vh]">
                    <div className="space-y-3 mb-6">
                        {[
                            { text: "Advanced Goal Tracking & Habits", icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10" },
                            { text: "Parental Mode (Filter 18+ items)", icon: Shield, color: "text-pink-400", bg: "bg-pink-500/10" },
                            { text: "Legal Data Export (CSV/PDF)", icon: FileDown, color: "text-blue-400", bg: "bg-blue-500/10" },
                            { text: "Detailed Vendor & Spend Insights", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
                            { text: "Cloud Backup & Device Sync", icon: Cloud, color: "text-cyan-400", bg: "bg-cyan-500/10" },
                            { text: "Priority Support", icon: Check, color: "text-emerald-400", bg: "bg-emerald-500/10" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm text-slate-200 p-2 rounded-xl hover:bg-white/5 transition-colors">
                                <div className={`${item.bg} p-2 rounded-lg ${item.color} shrink-0`}>
                                    <item.icon size={16} />
                                </div>
                                <span className="font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5 mb-4 flex items-center justify-between">
                        <div>
                            <span className="block text-white font-bold text-sm">Monthly Plan</span>
                            <span className="text-[10px] text-slate-500">Cancel anytime.</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-bold text-white">€4.99</span>
                            <span className="text-xs text-slate-500 font-medium">/mo</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePurchase}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : 'Subscribe Now'}
                    </button>

                    <div className="mt-3 flex justify-center gap-4 text-[9px] text-slate-500">
                        <button className="hover:text-slate-300">Restore</button>
                        <span>•</span>
                        <button className="hover:text-slate-300">Terms</button>
                        <span>•</span>
                        <button className="hover:text-slate-300">Privacy</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SubscriptionModal;