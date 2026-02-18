import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Sector, Tooltip } from 'recharts';
import { PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { DashboardMetrics } from '../hooks/useDashboardMetrics';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

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

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 4} // Active scale up
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                cornerRadius={4}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={innerRadius - 2}
                outerRadius={outerRadius + 8}
                fill={fill}
                opacity={0.1}
                cornerRadius={6}
            />
        </g>
    );
};

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
    const [activeIndex, setActiveIndex] = useState<{ [key: string]: number | null }>({});

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

    const onPieEnter = (chartId: string, _: any, index: number) => {
        setActiveIndex(prev => ({ ...prev, [chartId]: index }));
    };

    const onPieLeave = (chartId: string) => {
        setActiveIndex(prev => ({ ...prev, [chartId]: null }));
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Header with Toggles */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                        <PieChartIcon size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">{t('labels.distribution')}</span>
                </div>
                <div className="flex bg-slate-900/50 rounded-lg p-0.5 border border-white/5">
                    {['daily', 'weekly', 'monthly'].map((v) => (
                        <button
                            key={v}
                            onClick={() => setPieView(v as any)}
                            className={"px-2.5 py-1 rounded-md text-[10px] uppercase font-bold transition-all " + (
                                pieView === v ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                            )}
                        >
                            {v === 'daily' ? 'D' : v === 'weekly' ? 'W' : 'M'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Charts Grid */}
            <div className="flex flex-col gap-3">
                {activeCharts.map(chartConfig => {
                    const activeIdx = activeIndex[chartConfig.id];
                    const hasActive = activeIdx !== undefined && activeIdx !== null;
                    const activeItem = hasActive ? chartConfig.data[activeIdx!] : null;
                    const displayTotal = activeItem ? activeItem.value : chartConfig.total;
                    const displayLabel = activeItem ? t(`categories.${activeItem.name.toLowerCase()}`, { defaultValue: activeItem.name }) : t('common.total');
                    const displayColor = activeItem
                        ? (chartConfig.id === 'child' ? chartConfig.colors[activeIdx! % chartConfig.colors.length] : getCategoryColor(activeItem.name))
                        : '#94a3b8';

                    return (
                        <div key={chartConfig.id} className="flex flex-col bg-slate-900/40 border border-white/5 rounded-[2rem] p-4 backdrop-blur-sm relative overflow-hidden group hover:border-white/10 transition-colors">
                            <h5 className="text-[11px] uppercase font-bold text-slate-500 tracking-widest mb-6 text-left flex items-center gap-2">
                                <div className="w-1 h-3 rounded-full bg-indigo-500/50"></div>
                                {chartConfig.title}
                            </h5>

                            <div className="flex flex-col gap-8">
                                {/* Chart */}
                                <div className="w-full h-48 relative flex-shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart key={`${chartConfig.id}-${pieView}-${isVisible}`}>
                                            <Pie
                                                // @ts-ignore
                                                activeIndex={hasActive ? activeIdx! : -1}
                                                activeShape={renderActiveShape}
                                                data={chartConfig.data}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="75%"
                                                outerRadius="100%"
                                                paddingAngle={4}
                                                cornerRadius={6}
                                                dataKey="value"
                                                startAngle={90}
                                                endAngle={-270}
                                                stroke="none"
                                                onMouseEnter={(_, index) => onPieEnter(chartConfig.id, _, index)}
                                                onMouseLeave={() => onPieLeave(chartConfig.id)}
                                                onClick={(data) => onCategoryClick && onCategoryClick(data.name)}
                                                isAnimationActive={isVisible}
                                                animationDuration={1500}
                                                animationBegin={0}
                                            >
                                                {chartConfig.data.map((entry: any, index: number) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={chartConfig.id === 'child' ? chartConfig.colors[index % chartConfig.colors.length] : getCategoryColor(entry.name)}
                                                        className="cursor-pointer transition-all duration-300"
                                                        strokeWidth={0}
                                                    />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>

                                    {/* Dynamic Center Label */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={hasActive ? 'active' : 'total'}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex flex-col items-center"
                                            >
                                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: hasActive ? displayColor : '#64748b' }}>
                                                    {displayLabel}
                                                </p>
                                                <p className="text-2xl font-bold text-white leading-none tracking-tight">
                                                    €{displayTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                </p>
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Legend with Animated Bars */}
                                <div className="grid grid-cols-1 gap-3 w-full px-2">
                                    {chartConfig.data.map((entry: any, i: number) => {
                                        const entryColor = chartConfig.id === 'child' ? chartConfig.colors[i % chartConfig.colors.length] : getCategoryColor(entry.name);
                                        const isActive = activeIdx === i;
                                        const percent = chartConfig.total > 0 ? (entry.value / chartConfig.total) * 100 : 0;

                                        return (
                                            <motion.div
                                                key={i}
                                                initial="initial"
                                                whileInView="visible"
                                                viewport={{ once: true }}
                                                className={"flex flex-col gap-1.5 cursor-pointer p-2 rounded-xl transition-all " + (isActive ? "bg-white/5" : "hover:bg-white/5")}
                                                onMouseEnter={() => onPieEnter(chartConfig.id, null, i)}
                                                onMouseLeave={() => onPieLeave(chartConfig.id)}
                                            >
                                                <div className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={"w-2.5 h-2.5 rounded-full shrink-0 transition-transform " + (isActive ? "scale-125 shadow-[0_0_8px_rgba(255,255,255,0.3)]" : "")} style={{ backgroundColor: entryColor }}></div>
                                                        <span className={"font-bold truncate max-w-[150px] leading-none " + (isActive ? "text-white" : "text-slate-300")}>
                                                            {t(`categories.${entry.name.toLowerCase()}`, { defaultValue: entry.name })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={"font-bold tabular-nums text-sm " + (isActive ? "text-white" : "text-slate-200")}>
                                                            €{entry.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-500 tabular-nums w-8 text-right underline decoration-slate-500/30 underline-offset-2">{percent.toFixed(0)}%</span>
                                                    </div>
                                                </div>

                                                {/* Animated Progress Bar */}
                                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                                                    <motion.div
                                                        variants={{
                                                            initial: { width: 0 },
                                                            visible: { width: `${percent}%`, transition: { duration: 1, ease: "easeOut", delay: 0.1 + (i * 0.1) } }
                                                        }}
                                                        className="absolute inset-y-0 left-0 rounded-full"
                                                        style={{
                                                            backgroundColor: entryColor,
                                                            boxShadow: isActive ? `0 0 10px ${entryColor}40` : 'none'
                                                        }}
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
};
