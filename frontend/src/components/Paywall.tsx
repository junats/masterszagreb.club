import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Lock, Check, RefreshCw } from 'lucide-react';
import { RevenueCatService } from '../services/revenueCatService';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import LegalModal from './LegalModal';

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
    const { user } = useUser();
    const { t } = useLanguage();
    const { isPremium } = usePremiumStatus(user?.id);
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [offerings, setOfferings] = useState<PurchasesPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [debugTaps, setDebugTaps] = useState(0);
    const [showDebug, setShowDebug] = useState(false);
    const [showLegal, setShowLegal] = useState<{ file: string, title: string } | null>(null);

    // Fetch real offerings when paywall opens
    useEffect(() => {
        if (isOpen) {
            const fetchOfferings = async () => {
                const availablePackages = await RevenueCatService.getOfferings();
                setOfferings(availablePackages);
                if (availablePackages.length > 0) {
                    const annual = availablePackages.find(p => p.packageType === 'ANNUAL' || p.identifier.toLowerCase().includes('annual'));
                    setSelectedPackage(annual || availablePackages[0]);
                }
            };
            fetchOfferings();
        }
    }, [isOpen]);

    const handlePurchase = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const targetPkg = selectedPackage || offerings[0];
            if (!targetPkg) {
                throw new Error('No packages available for purchase.');
            }

            const result = await RevenueCatService.purchasePackage(targetPkg);
            if (result && RevenueCatService.hasActiveEntitlement(result)) {
                onClose();
            } else {
                console.log('💎 RevenueCat: Purchase succeeded but entitlement not found yet. Info:', result);
                // The update listener in usePremiumStatus will eventually close this if it arrives later
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
            const result = await RevenueCatService.restorePurchases();
            if (result && RevenueCatService.hasActiveEntitlement(result)) {
                alert('Purchases restored successfully!');
                onClose();
            } else {
                alert('No active subscription found. If you believe this is an error, please contact support.');
                setError('No active subscription found.');
            }
        } catch (e: any) {
            console.error('Restore failed:', e);
            alert('Could not restore purchases. Please try again later.');
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
                            <div
                                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 active:scale-95 transition-transform"
                                onClick={() => {
                                    setDebugTaps(prev => {
                                        if (prev + 1 >= 5) {
                                            setShowDebug(true);
                                            return 0;
                                        }
                                        return prev + 1;
                                    });
                                }}
                            >
                                <Sparkles size={40} className="text-white" />
                            </div>

                            <h2
                                className="text-2xl font-bold text-white mb-2"
                                onClick={() => {
                                    setDebugTaps(prev => {
                                        if (prev + 1 >= 5) {
                                            setShowDebug(true);
                                            return 0;
                                        }
                                        return prev + 1;
                                    });
                                }}
                            >
                                Unlock TrueTrack Pro
                            </h2>

                            {/* Show limit message */}
                            {reason && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                                    <Lock size={14} className="text-red-400" />
                                    <span className="text-sm text-red-300">
                                        {reason === 'daily_limit'
                                            ? 'Daily upload limit reached'
                                            : 'Weekly upload limit reached'}
                                    </span>
                                </div>
                            )}

                            {/* Debug Info */}
                            {showDebug && (
                                <div className="mt-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-left text-[10px] font-mono whitespace-pre overflow-x-auto">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-amber-400 font-bold uppercase tracking-wider">Debug System Info</div>
                                        <button onClick={() => setShowDebug(false)} className="text-slate-500 hover:text-white">Close</button>
                                    </div>
                                    {JSON.stringify(RevenueCatService.getDebugStatus(), null, 2)}
                                    <div className="mt-2 text-slate-500 italic">User ID: {user?.id?.substring(0, 8)}...</div>
                                    <div className="mt-1 text-slate-500 italic">Offerings Count: {offerings.length}</div>
                                </div>
                            )}

                            <p className="text-slate-400 text-sm mt-4">
                                {isPremium ? 'You already have Pro!' : `Free plan: ${dailyRemaining} uploads left today, ${weeklyRemaining} this week`}
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

                        {/* Offerings Selector (Dynamic) */}
                        <div className="px-6 pb-4">
                            {offerings.length > 0 ? (
                                <div className="space-y-3 mb-6">
                                    {offerings.map((pkg) => {
                                        const isAnnual = pkg.packageType === 'ANNUAL' || pkg.identifier.toLowerCase().includes('annual');
                                        const isSelected = selectedPackage?.identifier === pkg.identifier;
                                        return (
                                            <button
                                                key={pkg.identifier}
                                                onClick={() => setSelectedPackage(pkg)}
                                                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all relative overflow-hidden ${isSelected ? 'bg-orange-500/10 border-orange-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                            >
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 pointer-events-none" />
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-500'}`}>
                                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <span className="text-white font-bold">{pkg.packageType === 'ANNUAL' ? 'Yearly' : 'Monthly'}</span>
                                                        {isAnnual && (
                                                            <span className="bg-orange-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ml-2">SAVE 28%</span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 pl-6">
                                                        {isAnnual && <div className="text-emerald-400 font-medium text-xs mb-1">7-Day Free Trial</div>}
                                                        <div className="text-slate-400 text-xs">{pkg.product.description || (isAnnual ? 'Billed annually' : 'Billed monthly')}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-white font-bold text-lg">{pkg.product.priceString}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center mb-6">
                                    <span className="text-4xl font-bold text-white">€4.99</span>
                                    <span className="text-slate-400">/mo</span>
                                    <div className="mt-2 text-emerald-400 text-sm font-medium">Or €29.99/yr</div>
                                    <div className="mt-2">
                                        <button
                                            onClick={() => setShowDebug(true)}
                                            className="text-[10px] text-slate-600 space-x-1"
                                        >
                                            <span>•</span>
                                            <span>System Debug Info</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handlePurchase}
                                disabled={isLoading || isRestoring || (offerings.length > 0 && !selectedPackage)}
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
                                        {selectedPackage && (selectedPackage.packageType === 'ANNUAL' || selectedPackage.identifier.toLowerCase().includes('annual'))
                                            ? 'Start 7-Day Free Trial'
                                            : 'Subscribe Now'}
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

                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                <button
                                    onClick={() => setShowLegal({ file: 'terms_of_use.md', title: 'Terms of Use' })}
                                    className="hover:text-slate-300 transition-colors underline underline-offset-2"
                                >
                                    Terms of Use
                                </button>
                                <span>•</span>
                                <button
                                    onClick={() => setShowLegal({ file: 'privacy_policy.md', title: 'Privacy Policy' })}
                                    className="hover:text-slate-300 transition-colors underline underline-offset-2"
                                >
                                    Privacy Policy
                                </button>
                            </div>

                            <LegalModal
                                isOpen={!!showLegal}
                                onClose={() => setShowLegal(null)}
                                fileName={showLegal?.file || ''}
                                title={showLegal?.title || ''}
                            />

                            <p className="text-[9px] text-slate-600 text-center leading-relaxed max-w-xs">
                                Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Manage subscriptions in your Apple ID settings.
                            </p>

                            <button
                                onClick={onClose}
                                className="text-slate-500 text-sm hover:text-slate-400 transition-colors mt-1"
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
