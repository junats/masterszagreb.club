import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChevronRight, AlertTriangle, Wallet } from 'lucide-react';
import { DashboardMetrics } from '../hooks/useDashboardMetrics';
import { useLanguage } from '../contexts/LanguageContext';

interface BudgetOverviewProps {
    metrics: DashboardMetrics;
    budgetView: 'daily' | 'weekly' | 'monthly';
    setBudgetView: (view: 'daily' | 'weekly' | 'monthly') => void;
    monthlyBudget: number;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
    metrics,
    budgetView,
    setBudgetView,
    monthlyBudget
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

    // Chart Data Selection (Placeholder if we want to add chart later, logic from Dashboard suggests specialized charts per view)

    return (
        <div className="flex flex-col h-full bg-slate-900 border border-white/5 rounded-2xl p-4 relative overflow-hidden group">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-15" style={{
                    background: `radial-gradient(circle at 50% 50%, ${isOverBudget ? '#ef4444' : '#10b981'}, transparent 70%)`
                }} />
            </div>

            <div className="flex items-center justify-between mb-4 z-10 relative">
                <div className="flex items-center gap-2">
                    <div className={"p-1.5 rounded-lg " + (isOverBudget ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-300')}>
                        <Wallet size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('charts.budget')}</span>
                </div>
                <div className="flex bg-white/5 rounded-lg p-0.5">
                    {['daily', 'weekly', 'monthly'].map((v) => (
                        <button
                            key={v}
                            onClick={() => setBudgetView(v as any)}
                            className={"px-2 py-0.5 rounded-md text-[10px] uppercase font-bold transition-all " + (
                                budgetView === v ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            )}
                        >
                            {v === 'daily' ? t('days.day') : v === 'weekly' ? t('days.week') : t('days.mo')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-end">
                <div className="flex items-end justify-between mb-1">
                    <div>
                        <div className="flex items-end gap-1">
                            <span className="text-3xl font-heading font-light text-white tracking-tight">€{progressValue.toFixed(0)}</span>
                            <span className="text-sm font-medium text-slate-500 mb-1">/ {progressTarget.toFixed(0)}</span>
                        </div>
                    </div>
                    <div className={"text-xl font-bold " + (isOverBudget ? 'text-red-500' : 'text-emerald-500')}>
                        {progressRatio.toFixed(0)}%
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                    <div
                        className={"h-full rounded-full transition-all duration-1000 " + (
                            isOverBudget ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : progressRatio > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                        style={{ width: `${Math.min(progressRatio, 100)}%` }}
                    />
                </div>

                {isOverBudget ? (
                    <div className="flex items-start gap-2 text-[10px] font-medium text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/10">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        <p>{t('insights.budgetExceededSubtext', { amount: overSpend.toFixed(0) })}</p>
                    </div>
                ) : (
                    <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{t('dashboard.currentSpend')}</span>
                        <span>{t('dashboard.remainingBudget')}</span>
                    </div>
                )}
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <div className={"w-24 h-24 rounded-full blur-3xl " + (isOverBudget ? 'bg-red-500' : 'bg-emerald-500')}></div>
            </div>
        </div>
    );
};
