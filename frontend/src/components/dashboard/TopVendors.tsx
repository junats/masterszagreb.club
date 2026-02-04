import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { SpotlightCard } from '../SpotlightCard';
import AnimatedSection from '../AnimatedSection';
import { useLanguage } from '../../contexts/LanguageContext';

import { ProBlurGuard } from '../ProBlurGuard';
import { useUser } from '../../contexts/UserContext';
import { SubscriptionTier } from '@common/types';

interface TopVendorsProps {
    metrics: any;
    isProMode: boolean;
    setShowSubscriptionModal: (show: boolean) => void;
}

export const TopVendors: React.FC<TopVendorsProps> = ({ metrics, isProMode, setShowSubscriptionModal }) => {
    const { t } = useLanguage();

    return (
        <div className="col-span-2">
            <ProBlurGuard isPro={isProMode} onClick={() => setShowSubscriptionModal(true)} label="Top Vendors" className="h-full rounded-3xl" visualStyle="simple">
                <AnimatedSection delay={0} triggerOnce={false} disableEntrance variants={{ hidden: { opacity: 1 }, visible: { opacity: 1 } }}>
                    {({ isInView }: { isInView?: boolean } = {}) => (
                        <SpotlightCard className="h-full p-4 flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    <ShoppingBag size={18} />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t('provision.topVendors')}</h3>
                            </div>
                            <div className="space-y-4">
                                {metrics.topStores.length > 0 ? (
                                    (metrics.topStores || []).map((store: any, idx: number) => (
                                        <div key={idx} className="group/bar">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xxs font-medium text-slate-300 group-hover/bar:text-white transition-colors flex items-center gap-2">
                                                    <span className="truncate max-w-[150px]">{store.name}</span>
                                                </span>
                                                <div className="flex items-end gap-1.5">
                                                    <span className="text-sm font-bold text-white tabular-nums">€{store.value.toFixed(0)}</span>
                                                    <span className="text-[10px] text-slate-500 font-medium">{store.percentage.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: isInView ? `${store.percentage}% ` : 0 }}
                                                    transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: '#6366f1' }} // Indigo for vendors to match icon
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xxs text-slate-500 text-center py-4">{t('provision.noData')}</div>
                                )}
                            </div>
                        </SpotlightCard>
                    )}
                </AnimatedSection>
            </ProBlurGuard>
        </div>
    );
};
