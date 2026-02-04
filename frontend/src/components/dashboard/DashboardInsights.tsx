import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { SpotlightCard } from '../SpotlightCard';
import { CountUp } from '../CountUp';
import { InsightsGauges } from '../InsightsGauges';
import { useLanguage } from '../../contexts/LanguageContext';
import { HapticsService } from '../../services/haptics';

import { ProBlurGuard } from '../ProBlurGuard';
import { useUser } from '../../contexts/UserContext';
import { SubscriptionTier } from '@common/types';

const VisibilitySensor = ({ children, threshold = 0.5 }: { children: (props: { isVisible: boolean }) => React.ReactNode, threshold?: number }) => {
    const ref = useRef(null);
    const isVisible = useInView(ref, { amount: threshold });
    return <div ref={ref} className="w-full h-full">{children({ isVisible })}</div>;
};

interface DashboardInsightsProps {
    isCoParentingMode: boolean;
    onProvisionClick?: () => void;
    insightView: 'daily' | 'weekly' | 'monthly' | 'yearly';
    setInsightView: (view: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
    metrics: any;
    isProMode: boolean;
    setShowSubscriptionModal: (show: boolean) => void;
}

export const DashboardInsights: React.FC<DashboardInsightsProps> = ({
    isCoParentingMode,
    onProvisionClick,
    insightView,
    setInsightView,
    metrics,
    isProMode,
    setShowSubscriptionModal
}) => {
    const { t } = useLanguage();

    const itemVariants = {
        hidden: { opacity: 1, y: 0 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0 }
        }
    };

    return (
        <motion.div variants={itemVariants} className="col-span-2">
            <ProBlurGuard isPro={isProMode} onClick={() => setShowSubscriptionModal(true)} label="Advanced Insights" className="rounded-3xl h-full" visualStyle="simple">
                <SpotlightCard
                    onClick={isCoParentingMode ? onProvisionClick : undefined}
                    className={"rounded-3xl border border-slate-800 bg-card p-4 shadow-lg transition-all " + (isCoParentingMode ? 'cursor-pointer hover:border-slate-700' : '')}
                    spotlightColor="rgba(59, 130, 246, 0.1)" // Blue tint
                >
                    <div className="mb-4 relative z-10">

                        <div className="flex items-center justify-between mb-4 relative z-10 w-full">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                    <Sparkles className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                        {t('dashboard.insights')}
                                    </h3>
                                    <p className="text-xxs font-medium text-slate-400">
                                        {t('dashboard.metrics.performance')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                                <button
                                    onClick={(e) => { e.stopPropagation(); HapticsService.selection(); setInsightView('daily'); }}
                                    className={"px-3 py-1 text-xxs font-bold uppercase tracking-wide rounded-md transition-all " + (insightView === 'daily' ? 'bg-blue-500/20 text-blue-400 shadow-sm ring-1 ring-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')}
                                >
                                    D
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); HapticsService.selection(); setInsightView('weekly'); }}
                                    className={"px-3 py-1 text-xxs font-bold uppercase tracking-wide rounded-md transition-all " + (insightView === 'weekly' ? 'bg-blue-500/20 text-blue-400 shadow-sm ring-1 ring-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')}
                                >
                                    W
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); HapticsService.selection(); setInsightView('monthly'); }}
                                    className={"px-3 py-1 text-xxs font-bold uppercase tracking-wide rounded-md transition-all " + (insightView === 'monthly' ? 'bg-blue-500/20 text-blue-400 shadow-sm ring-1 ring-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')}
                                >
                                    M
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4">
                            <div className="text-right">
                                <p className="text-xxs text-slate-500 uppercase tracking-wide font-bold">
                                    {insightView === 'monthly' ? t('dashboard.chart.dailyAvg') : insightView === 'weekly' ? t('dashboard.chart.weeklyAvg') : t('history.today')}
                                </p>
                                <p className="text-xl font-bold text-white tabular-nums">
                                    <CountUp value={insightView === 'monthly' ? metrics.dailyAverage : insightView === 'weekly' ? metrics.weeklyAverage : metrics.todayTotal} prefix="€" decimals={0} />
                                </p>
                            </div>
                            <div className="h-8 w-px bg-slate-800"></div>
                            <div className="text-right">
                                <p className="text-xxs text-slate-500 uppercase tracking-wide font-bold">
                                    {insightView === 'monthly' ? t('financial.forecast') : insightView === 'weekly' ? t('labels.thisWeek') : t('popups.dailySpending.yesterday')}
                                </p>
                                <p className="text-xl font-bold text-blue-400 tabular-nums">
                                    <CountUp value={insightView === 'monthly' ? metrics.projectedTotal : insightView === 'weekly' ? metrics.thisWeekTotal : metrics.yesterdayTotal} prefix="€" decimals={0} />
                                </p>
                            </div>
                            {isCoParentingMode && (
                                <>
                                    <div className="h-8 w-px bg-slate-800"></div>
                                    <div className="text-right">
                                        <p className="text-xxs text-slate-500 uppercase tracking-wide font-bold">{t('evidence.title')}</p>
                                        <p className={"text-xl font-bold tabular-nums " + metrics.evidenceColor}>{metrics.evidenceLabel}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <VisibilitySensor threshold={0.2}>
                            {({ isVisible }: { isVisible: boolean }) => (
                                <InsightsGauges
                                    insightView={insightView}
                                    metrics={metrics}
                                    isVisible={isVisible}
                                />
                            )}
                        </VisibilitySensor>

                        {/* Smart Suggestions */}
                        {metrics.smartInsights.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                <h4 className="text-xxs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-purple-400" />
                                    {t('dashboard.insightsData.smartSuggestions')}
                                </h4>
                                {metrics.smartInsights.map((insight: any, idx: number) => (
                                    <div key={idx} className={"p-3 rounded-xl border flex items-start gap-3 " + (insight.type === 'warning' ? 'bg-red-500/10 border-red-500/20' : insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-blue-500/10 border-blue-500/20')}>
                                        <div className={"mt-0.5 " + (insight.type === 'warning' ? 'text-red-400' : insight.type === 'success' ? 'text-emerald-400' : 'text-blue-400')}>
                                            {insight.icon}
                                        </div>
                                        <div>
                                            <p className={"text-xxs font-bold " + (insight.type === 'warning' ? 'text-red-300' : insight.type === 'success' ? 'text-emerald-300' : 'text-blue-300')}>{insight.title}</p>
                                            <p className="text-xxs text-slate-400 leading-relaxed">{insight.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </SpotlightCard>

            </ProBlurGuard>
        </motion.div >
    );
};
