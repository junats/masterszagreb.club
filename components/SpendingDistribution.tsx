import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { DashboardMetrics } from '../hooks/useDashboardMetrics';
import { useLanguage } from '../contexts/LanguageContext';

interface SpendingDistributionProps {
    metrics: DashboardMetrics;
    pieView: 'daily' | 'weekly' | 'monthly';
    setPieView: (view: 'daily' | 'weekly' | 'monthly') => void;
    getCategoryColor: (name: string) => string;
    onCategoryClick?: (category: any) => void;
    selectedCategory?: string | null;
    childSupportMode: boolean;
    isVisible?: boolean;
}

export const SpendingDistribution: React.FC<SpendingDistributionProps> = ({
    metrics,
    pieView,
    setPieView,
    getCategoryColor,
    onCategoryClick,
    selectedCategory,
    childSupportMode,
    isVisible = true
}) => {
    const { t } = useLanguage();

    // Derive Chart Data
    const activeCharts = [
        {
            title: t('chartLegends.expenses'),
            data: pieView === 'daily' ? metrics.todayCategoryData : pieView === 'weekly' ? metrics.thisWeekCategoryData : metrics.thisMonthCategoryData,
            total: pieView === 'daily' ? metrics.todayTotal : pieView === 'weekly' ? metrics.thisWeekTotal : metrics.thisMonthTotal,
            id: 'expenses',
            colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b'],
            isEmpty: false
        },
        ...(childSupportMode ? [{
            title: t('chartLegends.childSpend'),
            data: pieView === 'daily' ? metrics.todayChildCategoryData : pieView === 'weekly' ? metrics.thisWeekChildCategoryData : metrics.thisMonthChildCategoryData,
            total: pieView === 'daily' ? metrics.todayChildTotal : pieView === 'weekly' ? metrics.thisWeekChildTotal : metrics.thisMonthChildTotal,
            id: 'child',
            isEmpty: (pieView === 'daily' ? metrics.todayChildTotal : pieView === 'weekly' ? metrics.thisWeekChildTotal : metrics.thisMonthChildTotal) === 0,
            colors: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4']
        }] : [])
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Header with Toggles - Shared for the section */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    {/* Icon */}
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                        <PieChartIcon size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('labels.distribution')}</span>
                </div>
                <div className="flex bg-white/5 rounded-lg p-0.5">
                    {['daily', 'weekly', 'monthly'].map((v) => (
                        <button
                            key={v}
                            onClick={() => setPieView(v as any)}
                            className={"px-2 py-0.5 rounded-md text-[10px] uppercase font-bold transition-all " + (
                                pieView === v ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                            )}
                        >
                            {v === 'daily' ? t('days.day') : v === 'weekly' ? t('days.week') : t('days.mo')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Charts Grid - Side by Side on all screens if Coparenting */}
            <div className={"grid gap-2 " + (childSupportMode ? "grid-cols-2" : "grid-cols-1")}>
                {activeCharts.map(chartConfig => (
                    <div key={chartConfig.id} className="flex flex-col h-full bg-white/[0.02] border border-white/5 rounded-2xl p-2 backdrop-blur-sm relative overflow-hidden">
                        {activeCharts.length > 1 && (
                            <h5 className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1 text-center">{chartConfig.title}</h5>
                        )}

                        <div className={"flex-1 flex flex-col items-start justify-start " + (childSupportMode ? "gap-1" : "gap-4 md:flex-row")}>
                            {/* Chart */}
                            <div className={(childSupportMode ? "w-24 h-24 mx-auto" : "w-32 h-32 md:w-40 md:h-40") + " relative flex-shrink-0"}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart key={"pie-" + isVisible}>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-slate-900 border border-white/10 rounded-lg p-2 shadow-xl z-50">
                                                            <p className="text-[10px] font-bold text-white mb-0.5">{t(`categories.${payload[0].name.toLowerCase()}`, { defaultValue: payload[0].name })}</p>
                                                            <p className="text-[10px] text-slate-300">€{(payload[0].value as number).toFixed(2)}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Pie
                                            data={chartConfig.data}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={childSupportMode ? "65%" : "60%"} // Thinner donut for better fit
                                            outerRadius={childSupportMode ? "95%" : "100%"}
                                            paddingAngle={3}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                            stroke="none"
                                            onClick={(data) => onCategoryClick && onCategoryClick(data.name)}
                                            isAnimationActive={isVisible} // Trigger animation
                                        >
                                            {chartConfig.data.map((entry: any, index: number) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={chartConfig.id === 'child' ? chartConfig.colors[index % chartConfig.colors.length] : getCategoryColor(entry.name)}
                                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                                    stroke={selectedCategory === entry.name ? '#fff' : 'none'}
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Label */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-[8px] text-slate-500 font-medium uppercase leading-none">{t('common.total')}</p>
                                    <p className={"font-bold text-white leading-none mt-0.5 " + (childSupportMode ? "text-[10px]" : "text-sm")}>€{chartConfig.total.toFixed(0)}</p>
                                </div>
                            </div>

                            {/* Legend - Hide on small side-by-side to save space, or make compact */}
                            <div className="flex flex-col gap-1 w-full min-w-0 mt-1">
                                {chartConfig.data.slice(0, 3).map((entry: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-[9px]">
                                        <div className="flex items-center gap-1 min-w-0">
                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: chartConfig.id === 'child' ? chartConfig.colors[i % chartConfig.colors.length] : getCategoryColor(entry.name) }}></div>
                                            <span className="text-slate-400 truncate max-w-[50px]">{t(`categories.${entry.name.toLowerCase()}`, { defaultValue: entry.name })}</span>
                                        </div>
                                        <span className="text-slate-500 tabular-nums">€{entry.value.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
