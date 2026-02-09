import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Lock, Check, RefreshCw } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';

interface PaywallProps {
    isOpen: boolean;
    onClose: () => void;
    reason?: 'daily_limit' | 'weekly_limit';
    dailyRemaining?: number;
    weeklyRemaining?: number;
}

const Paywall: React.FC<PaywallProps> = ({
    isOpen,
    onClose,
    reason,
    dailyRemaining = 0,
    weeklyRemaining = 0,
}) => {
    const { upgradeToPro } = useUser();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePurchase = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await subscriptionService.purchasePro();
            if (result.success && result.isPro) {
                upgradeToPro();
                onClose();
            }
        } catch (e: any) {
            console.error('Purchase failed:', e);
            setError(e.message || 'Purchase failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        setIsRestoring(true);
        setError(null);
        try {
            const result = await subscriptionService.restorePurchases();
            if (result.success && result.isPro) {
                upgradeToPro();
                onClose();
            } else {
                setError('No active subscription found.');
            }
        } catch (e: any) {
            console.error('Restore failed:', e);
            setError('Could not restore purchases.');
        } finally {
            setIsRestoring(false);
        }
    };

    const features = [
        'Unlimited receipt scans',
        'AI-powered item insights',
        'Priority support',
        'Export to PDF/CSV',
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-lg bg-gradient-to-b from-[#1C1C1E] to-[#0D0D0D] rounded-t-[24px] sm:rounded-[24px] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with close button */}
                        <div className="relative p-6 pb-0">
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Hero */}
                        <div className="px-6 pt-4 pb-6 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                                <Sparkles size={40} className="text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">
                                Unlock TrueTrack Pro
                            </h2>

                            {/* Show limit message */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                                <Lock size={14} className="text-red-400" />
                                <span className="text-sm text-red-300">
                                    {reason === 'daily_limit'
                                        ? 'Daily upload limit reached'
                                        : 'Weekly upload limit reached'}
                                </span>
                            </div>

                            <p className="text-slate-400 text-sm">
                                Free plan: {dailyRemaining} uploads left today, {weeklyRemaining} this week
                            </p>
                        </div>

                        {/* Features */}
                        <div className="px-6 pb-6">
                            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
                                {features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <Check size={12} className="text-emerald-400" />
                                        </div>
                                        <span className="text-white text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="px-6 pb-4">
                            <div className="text-center mb-4">
                                <span className="text-4xl font-bold text-white">€7</span>
                                <span className="text-slate-400">/month</span>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handlePurchase}
                                disabled={isLoading || isRestoring}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw size={20} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        Unlock Unlimited
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-8 flex flex-col items-center gap-3">
                            <button
                                onClick={handleRestore}
                                disabled={isLoading || isRestoring}
                                className="text-slate-400 text-sm hover:text-white transition-colors disabled:opacity-50"
                            >
                                {isRestoring ? 'Restoring...' : 'Restore Purchases'}
                            </button>
                            <button
                                onClick={onClose}
                                className="text-slate-500 text-sm hover:text-slate-400 transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Paywall;
