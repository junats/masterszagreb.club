import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { HapticsService } from '../../services/haptics';
import { SpotlightCard } from '../SpotlightCard';
import { TrendsChart } from '../TrendsChart';
import AnimatedSection from '../AnimatedSection';
import { ProBlurGuard } from '../ProBlurGuard';
import { useLanguage } from '../../contexts/LanguageContext';

interface DashboardChartsProps {
    isProMode: boolean;
    setShowSubscriptionModal: (show: boolean) => void;
    chartView: 'week' | 'month' | 'year';
    setChartView: (view: 'week' | 'month' | 'year') => void;
    metrics: any;
    categories: any[];
    isCoParentingMode: boolean;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
    isProMode,
    setShowSubscriptionModal,
    chartView,
    setChartView,
    metrics,
    categories,
    isCoParentingMode
}) => {
    const { t } = useLanguage();

    return (
        <ProBlurGuard isPro={isProMode} onClick={() => setShowSubscriptionModal(true)} label="Advanced Analytics" className={!isProMode ? "col-span-2 rounded-3xl" : "col-span-2"}>
            <div className="flex flex-col gap-6">
                <div className="col-span-2">
                    <SpotlightCard className="h-full relative rounded-3xl border border-slate-800 bg-card p-4 flex flex-col min-h-[280px] shadow-lg">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-blue-400" />
                                    {t('dashboard.trends')}
                                </h3>
                                <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { HapticsService.selection(); setChartView('week'); }}
                                        className={"px-3 py-1 text-xxs font-bold uppercase tracking-wide rounded-md transition-all " + (chartView === 'week' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                    >
                                        {t('dashboard.chart.week')}
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { HapticsService.selection(); setChartView('month'); }}
                                        className={"px-3 py-1 text-xxs font-bold uppercase tracking-wide rounded-md transition-all " + (chartView === 'month' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                    >
                                        {t('dashboard.chart.month')}
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { HapticsService.selection(); setChartView('year'); }}
                                        className={"px-3 py-1 text-xxs font-bold uppercase tracking-wide rounded-md transition-all " + (chartView === 'year' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
                                    >
                                        {t('dashboard.chart.year')}
                                    </motion.button>
                                </div>
                            </div>
                            <div className="flex-1 w-full">
                                <AnimatedSection
                                    className="w-full h-full"
                                    noSlide
                                    disableEntrance
                                    rootMargin="-10% 0px"
                                    variants={{
                                        visible: { opacity: 1 },
                                        hidden: { opacity: 1 }
                                    }}
                                >
                                    {({ isInView }: { isInView?: boolean } = {}) => (
                                        <TrendsChart
                                            isVisible={!!isInView}
                                            activeData={chartView === 'week' ? metrics.weekData : chartView === 'month' ? metrics.monthData : metrics.yearData}
                                            categories={categories}
                                            chartView={chartView}
                                            layoutId={isCoParentingMode ? 'coparent' : 'single'}
                                        />
                                    )}
                                </AnimatedSection>
                            </div>
                        </div>

                    </SpotlightCard>
                </div>
            </div>
        </ProBlurGuard>
    );
};
