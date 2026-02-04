import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { SpotlightCard } from '../SpotlightCard';
import AnimatedSection from '../AnimatedSection';
import { useLanguage } from '../../contexts/LanguageContext';

import { ProBlurGuard } from '../ProBlurGuard';
import { useUser } from '../../contexts/UserContext';
import { SubscriptionTier } from '@common/types';

interface TopCategoriesProps {
    metrics: any;
    getCategoryColor: (name: string) => string;
    isProMode: boolean;
    setShowSubscriptionModal: (show: boolean) => void;
}

export const TopCategories: React.FC<TopCategoriesProps> = ({ metrics, getCategoryColor, isProMode, setShowSubscriptionModal }) => {
    const { t } = useLanguage();

    return (
        <div className="col-span-2">
            <ProBlurGuard isPro={isProMode} onClick={() => setShowSubscriptionModal(true)} label="Top Categories" className="h-full rounded-3xl" visualStyle="simple">
                <AnimatedSection delay={0.1} className="h-full" disableEntrance>
                    {({ isInView }: { isInView?: boolean } = {}) => (
                        <SpotlightCard className="h-full p-4 flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    <BarChart3 size={18} />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t('popups.topCategories.title')}</h3>
                            </div>
                            <div className="space-y-4">
                                {metrics.categoryData.slice(0, 5).map((cat: any, idx: number) => (
                                    <div key={cat.name} className="group/bar">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xxs font-medium text-slate-300 group-hover/bar:text-white transition-colors flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(cat.name) }}></div>
                                                {t(`categories.${cat.name.toLowerCase()} `, { defaultValue: cat.name })}
                                            </span>
                                            <div className="flex items-end gap-1.5">
                                                <span className="text-sm font-bold text-white tabular-nums">€{cat.value.toFixed(0)}</span>
                                                <span className="text-[10px] text-slate-500 font-medium">{cat.percentage.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: isInView ? `${cat.percentage}% ` : 0 }}
                                                transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: getCategoryColor(cat.name) }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {metrics.categoryData.length === 0 && (
                                    <p className="text-xxs text-slate-500 italic text-center py-4">{t('provision.noSpending')}</p>
                                )}
                            </div>
                        </SpotlightCard>
                    )}
                </AnimatedSection>
            </ProBlurGuard>
        </div>
    );
};
