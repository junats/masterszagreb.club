import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Shield, Lock, FileDown, Cloud, Zap, BarChart3 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { RevenueCatService } from '../services/revenueCatService';
import LegalModal from './LegalModal';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade?: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onUpgrade }) => {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [debugTaps, setDebugTaps] = useState(0);
    const [showDebug, setShowDebug] = useState(false);
    const [offerings, setOfferings] = useState<any[]>([]);
    const [showLegal, setShowLegal] = useState<{ file: string, title: string } | null>(null);
    const [detailedDebug, setDetailedDebug] = useState<any>(null);
    const { setIsProModeWithTimestamp } = useData();
    const { showToast } = useToast();
    const { t } = useLanguage();

    useEffect(() => {
        if (isOpen) {
            RevenueCatService.getOfferings().then(setOfferings);
        }
    }, [isOpen]);

    // Fetch detailed debug when debug panel opens
    useEffect(() => {
        if (showDebug) {
            RevenueCatService.getDetailedDebugInfo().then(setDetailedDebug);
        }
    }, [showDebug]);

    if (!isOpen) return null;

    const handlePurchase = async () => {
        setLoading(true);
        try {
            const availablePackages = await RevenueCatService.getOfferings();
            const pkg = availablePackages[0];

            if (!pkg) {
                showToast(t('settings.subscription.noPlansFound'), 'error');
                return;
            }

            const result = await RevenueCatService.purchasePackage(pkg);
            if (result && RevenueCatService.hasActiveEntitlement(result)) {
                if (onUpgrade) onUpgrade();
                setIsProModeWithTimestamp(true);
                showToast(t('settings.subscription.success'), 'success');
                onClose();
            }
        } catch (error) {
            console.error("Purchase error:", error);
            showToast(t('settings.subscription.failed'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            const result = await RevenueCatService.restorePurchases();
            if (result && RevenueCatService.hasActiveEntitlement(result)) {
                if (onUpgrade) onUpgrade();
                setIsProModeWithTimestamp(true);
                showToast(t('settings.subscription.restoreSuccess'), 'success');
                onClose();
            } else {
                showToast(t('settings.subscription.noPurchasesFound'), 'info');
            }
        } catch (error) {
            console.error("Restore error:", error);
            showToast(t('settings.subscription.restoreFailed'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center px-4 pt-16 pb-4 sm:p-0">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={loading ? undefined : onClose}></div>

            <div className="bg-slate-900 w-full max-w-sm sm:max-w-md rounded-3xl border border-white/10 overflow-hidden relative z-10 animate-in slide-in-from-bottom-10 fade-in duration-300 shadow-2xl flex flex-col">
                {/* Compact Header */}
                <div className="h-24 bg-gradient-to-br from-indigo-600 to-purple-700 relative p-6 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg active:scale-95 transition-transform"
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
                            <Shield className="text-white w-5 h-5" fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-none">{t('settings.subscription.upgradeTitle')}</h2>
                            <p className="text-indigo-100/70 text-xs mt-1 font-medium">{t('settings.subscription.upgradeSubtitle')}</p>
                        </div>
                    </div>

                    <button onClick={onClose} disabled={loading} className="text-white/70 hover:text-white bg-black/20 rounded-full p-1.5 hover:bg-black/30 transition-colors disabled:opacity-50">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Features */}
                <div className="px-5 pt-5 pb-2 overflow-y-auto max-h-[40vh]">
                    <div className="space-y-3">
                        {[
                            { text: t('settings.subscription.features.goals'), icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10" },
                            { text: t('settings.subscription.features.parental'), icon: Shield, color: "text-pink-400", bg: "bg-pink-500/10" },
                            { text: t('settings.subscription.features.export'), icon: FileDown, color: "text-blue-400", bg: "bg-blue-500/10" },
                            { text: t('settings.subscription.features.insights'), icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
                            { text: t('settings.subscription.features.cloud'), icon: Cloud, color: "text-cyan-400", bg: "bg-cyan-500/10" },
                            { text: t('settings.subscription.features.support'), icon: Check, color: "text-emerald-400", bg: "bg-emerald-500/10" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm text-slate-200 p-2 rounded-xl hover:bg-white/5 transition-colors">
                                <div className={`${item.bg} p-2 rounded-lg ${item.color} shrink-0`}>
                                    <item.icon size={16} />
                                </div>
                                <span className="font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Debug Info */}
                    {showDebug && (
                        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-white/10 text-left text-[9px] font-mono whitespace-pre overflow-x-auto text-slate-300">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-indigo-400 font-bold uppercase tracking-widest">Debug Mode</span>
                                <button onClick={() => setShowDebug(false)} className="text-slate-500">✕</button>
                            </div>
                            {JSON.stringify(
                                detailedDebug || {
                                    ...RevenueCatService.getDebugStatus(),
                                    offeringsCount: offerings.length,
                                    loading: 'fetching diagnosis...',
                                }
                                , null, 2)}
                        </div>
                    )}
                </div>

                {/* Pinned Bottom: Pricing + CTA + Links */}
                <div className="px-5 pb-5 pt-3 shrink-0 border-t border-white/5 bg-slate-900">
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5 mb-4 flex items-center justify-between">
                        <div>
                            <span className="block text-white font-bold text-sm">{t('settings.subscription.monthlyPlan')}</span>
                            <span className="text-[10px] text-slate-500">{t('settings.subscription.cancelAnytime')}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-bold text-white">€4.99</span>
                            <span className="text-xs text-slate-500 font-medium">{t('settings.subscription.perMonth')}</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePurchase}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? t('settings.subscription.processing') : t('settings.subscription.subscribe')}
                    </button>

                    <div className="mt-3 flex justify-center gap-4 text-[9px] text-slate-500">
                        <button onClick={handleRestore} disabled={loading} className="hover:text-slate-300 disabled:opacity-50">{t('settings.subscription.restore')}</button>
                        <span>•</span>
                        <button onClick={() => setShowDebug(true)} className="hover:text-slate-300">System Info</button>
                        <span>•</span>
                        <button onClick={() => setShowLegal({ file: 'terms_of_use.md', title: t('settings.subscription.terms') })} className="hover:text-slate-300">{t('settings.subscription.terms')}</button>
                        <span>•</span>
                        <button onClick={() => setShowLegal({ file: 'privacy_policy.md', title: t('settings.subscription.privacy') })} className="hover:text-slate-300">{t('settings.subscription.privacy')}</button>
                    </div>

                    <LegalModal
                        isOpen={!!showLegal}
                        onClose={() => setShowLegal(null)}
                        fileName={showLegal?.file || ''}
                        title={showLegal?.title || ''}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
};


export default SubscriptionModal;