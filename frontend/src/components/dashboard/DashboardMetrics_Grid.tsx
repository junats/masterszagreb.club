import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { HapticsService } from '../../services/haptics';
import { SpotlightCard } from '../SpotlightCard';
import { CountUp } from '../CountUp';
import { useLanguage } from '../../contexts/LanguageContext';
import { EmptyState } from '../EmptyState';

interface DashboardMetricsGridProps {
    aiMetrics: any[];
    setSelectedSnapshotMetric: (metric: any) => void;
    isProMode: boolean;
    setShowSubscriptionModal: (show: boolean) => void;
}

import { ProBlurGuard } from '../ProBlurGuard';
import { SubscriptionTier } from '@common/types';

export const DashboardMetrics_Grid: React.FC<DashboardMetricsGridProps> = ({
    aiMetrics,
    setSelectedSnapshotMetric,
    isProMode,
    setShowSubscriptionModal
}) => {
    const { t } = useLanguage();

    if (!aiMetrics || aiMetrics.length === 0) return (
        <div className="col-span-1 md:col-span-2">
            <SpotlightCard className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-800 bg-card">
                <div className="relative z-10 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <Wallet className="text-indigo-400 w-3.5 h-3.5" />
                        </div>
                        <span className="text-white text-xxs font-bold">{t('dashboard.metrics.financialSnapshot')}</span>
                    </div>
                    <EmptyState
                        icon={Wallet}
                        title={t('emptyStates.metrics.title')}
                        description={t('emptyStates.metrics.description')}
                        iconColor="text-indigo-400"
                        iconBg="bg-indigo-500/10"
                    />
                </div>
            </SpotlightCard>
        </div>
    );

    const heroMetric = aiMetrics.find(m => ['Alert', 'Status', 'Forecast'].includes(m.label)) || aiMetrics[0];
    const gridMetrics = aiMetrics.filter(m => m !== heroMetric);

    return (
        <div className="col-span-1 md:col-span-2">
            <ProBlurGuard isPro={isProMode} onClick={() => setShowSubscriptionModal(true)} label="Financial Snapshot" className="rounded-3xl h-full" visualStyle="simple">
                <SpotlightCard className="relative rounded-3xl overflow-hidden group shadow-lg border border-slate-800 bg-card">

                    <div className="relative z-10 p-5">
                        {/* Header (Compact) */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)] backdrop-blur-md">
                                    <Wallet className="text-indigo-400 w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white text-xxs font-bold leading-none">{t('dashboard.metrics.financialSnapshot')}</span>
                                    <span className="text-indigo-300/50 text-xxs uppercase tracking-wider font-bold leading-none mt-0.5">{t('financial.realTimeOverview')}</span>
                                </div>
                            </div>
                            {/* Pulse Indicator */}
                            <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5">
                                <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></div>
                                <span className="text-xxs font-bold text-indigo-300">{t('financial.live')}</span>
                            </div>
                        </div>

                        {/* Bento Layout */}
                        <div className="flex flex-col md:flex-row gap-3">
                            {/* HERO SECTION (Left) - Status/Alert/Forecast */}
                            <button
                                onClick={() => {
                                    HapticsService.selection();
                                    setSelectedSnapshotMetric(heroMetric);
                                }}
                                className={"flex-1 md:max-w-[40%] relative p-3 rounded-xl border transition-all duration-300 group/hero overflow-hidden flex flex-col justify-between gap-3 " + (
                                    heroMetric.label === 'Alert' ?
                                        'bg-red-500/10 border-red-500/20 hover:bg-red-500/15 hover:border-red-500/30' :
                                        'bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20 backdrop-blur-xl'
                                )}>

                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <div className={"p-1.5 rounded-lg " + (
                                            heroMetric.label === 'Alert' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-300'
                                        )}>
                                            <heroMetric.icon size={14} />
                                        </div>
                                        <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest">{t('financial.currentStatus')}</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <div className={"text-2xl font-heading font-light tracking-tight leading-none " + (
                                            heroMetric.label === 'Alert' ? 'text-red-400' : 'text-white'
                                        )}>
                                            {heroMetric.value}
                                        </div>
                                        {heroMetric.trend && heroMetric.trend !== 'neutral' && (
                                            <div className={"flex items-center gap-1 text-xxs font-bold px-1.5 py-0.5 rounded-full border " + (
                                                heroMetric.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            )}>
                                                {(heroMetric as any).trendLabel || (heroMetric.trend === 'up' ? 'Safe' : 'Risk')}
                                            </div>
                                        )}
                                    </div>
                                    {(heroMetric as any).detail && (
                                        <p className="text-xxs text-slate-500 leading-tight opacity-70 line-clamp-1 text-left">{(heroMetric as any).detail}</p>
                                    )}
                                </div>
                            </button>

                            {/* GRID SECTION (Right) - 2x2 */}
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                {gridMetrics.slice(0, 4).map((metric, i) => {
                                    const isUp = metric.trend === 'up';
                                    const isDown = metric.trend === 'down';

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                HapticsService.selection();
                                                setSelectedSnapshotMetric(metric);
                                            }}
                                            className="text-left relative p-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/10 backdrop-blur-md transition-all duration-300 group/item flex flex-col justify-between min-h-[80px]"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-xxs font-bold text-slate-500 uppercase tracking-wider truncate pr-1">{metric.label}</p>
                                                {metric.trend !== 'neutral' ? (
                                                    isUp ? <TrendingUp size={12} className="text-amber-400" /> : <TrendingDown size={12} className="text-emerald-400" />
                                                ) : (
                                                    <Minus size={12} className="text-slate-600" />
                                                )}
                                            </div>

                                            <div>
                                                <div className="text-sm font-heading font-bold text-slate-200 tracking-tight leading-none mb-1">
                                                    {!isNaN(parseFloat(metric.value.replace(/[^0-9.-]/g, ''))) && /[0-9]/.test(metric.value) ? (
                                                        <CountUp
                                                            prefix={metric.value.includes('€') ? '€' : ''}
                                                            suffix={metric.value.includes('%') ? '%' : ''}
                                                            value={parseFloat(metric.value.replace(/[^0-9.-]/g, ''))}
                                                            decimals={metric.value.includes('.') ? 1 : 0}
                                                        />
                                                    ) : (
                                                        metric.value
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between w-full">
                                                    {(metric as any).detail && (
                                                        <p className="text-xxs text-slate-500 leading-none truncate opacity-70 max-w-[70px]">
                                                            {(metric as any).detail.split(':')[0]}
                                                        </p>
                                                    )}
                                                    {(metric as any).trendLabel && (
                                                        <span className={"text-[8px] font-bold px-1 rounded " + (isUp ? 'bg-amber-500/10 text-amber-500' : isDown ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700/30 text-slate-500')}>
                                                            {(metric as any).trendLabel}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </SpotlightCard>
            </ProBlurGuard>
        </div>
    );
};
