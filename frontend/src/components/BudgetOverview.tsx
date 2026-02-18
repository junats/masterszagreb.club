import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChevronRight, AlertTriangle, Wallet } from 'lucide-react';
import { DashboardMetrics } from '../hooks/useDashboardMetrics';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

interface BudgetOverviewProps {
    metrics: DashboardMetrics;
    budgetView: 'daily' | 'weekly' | 'monthly';
    setBudgetView: (view: 'daily' | 'weekly' | 'monthly') => void;
    monthlyBudget: number;
    isVisible?: boolean;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
    metrics,
    budgetView,
    setBudgetView,
    monthlyBudget,
    isVisible = true
}) => {
    const { t } = useLanguage();

    // Logic for progress bar and chart data
    const progressValue = budgetView === 'daily' ? metrics.todayTotal
        : budgetView === 'weekly' ? metrics.thisWeekTotal
            : metrics.thisMonthTotal;

    const progressTarget = budgetView === 'daily' ? monthlyBudget / 30
        : budgetView === 'weekly' ? monthlyBudget / 4
            : monthlyBudget;

    const progressRatio = progressTarget > 0 ? (progressValue / progressTarget) * 100 : 0;
    const isOverBudget = progressRatio > 100;
    const overSpend = Math.max(0, progressValue - progressTarget);

    // Dynamic width calculation for animation
    const barWidth = isVisible ? `${Math.min(progressRatio, 100)}%` : '0%';

    return (
        <div className="flex flex-col h-full relative overflow-hidden">

            <div className="flex items-center justify-between mb-4 z-10 relative px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Wallet size={14} />
                    </div>
                    <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest">{t('charts.budget')}</span>
                </div>
                <div className="flex bg-white/5 rounded-lg p-0.5">
                    {['daily', 'weekly', 'monthly'].map((v) => (
                        <button
                            key={v}
                            onClick={() => setBudgetView(v as any)}
                            className={"px-2 py-0.5 rounded-md text-xxs uppercase font-bold transition-all " + (
                                budgetView === v ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                            )}
                        >
                            {v === 'daily' ? t('dashboard.daily')[0] : v === 'weekly' ? t('dashboard.weekly')[0] : t('dashboard.monthly')[0]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-end">
                <div className="flex items-end justify-between mb-2">
                    <div>
                        <div className="flex items-end gap-1">
                            <span className="text-3xl font-heading font-light text-white tracking-tight">€{progressValue.toFixed(0)}</span>
                            <span className="text-sm font-medium text-slate-500 mb-1">/ {progressTarget.toFixed(0)}</span>
                        </div>
                    </div>
                    <div className={"text-xl font-bold font-mono " + (isOverBudget ? 'text-red-400' : 'text-emerald-400')}>
                        {progressRatio.toFixed(0)}%
                    </div>
                </div>

                {/* Progress Bar - Slim & Minimal with Animation */}
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mb-3 border border-white/5">
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: barWidth }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={"h-full rounded-full " + (
                            isOverBudget ? 'bg-red-500' : progressRatio > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                    />
                </div>

                {isOverBudget ? (
                    <div className="flex items-start gap-2 text-xxs font-medium text-red-400">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        <p>{t('insights.budgetExceededSubtext', { amount: overSpend.toFixed(0) })}</p>
                    </div>
                ) : (
                    <div className="flex justify-between text-xxs text-slate-500 font-medium">
                        <span>{t('dashboard.currentSpend')}</span>
                        <span>{t('dashboard.remainingBudget')}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
