import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { PieChart as PieChartIcon, X } from 'lucide-react';
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
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <g style={{ outline: 'none' }}>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 4} startAngle={startAngle} endAngle={endAngle} fill={fill} cornerRadius={4} style={{ outline: 'none' }} />
            <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={innerRadius - 2} outerRadius={outerRadius + 8} fill={fill} opacity={0.1} cornerRadius={6} style={{ outline: 'none' }} />
        </g>
    );
};

interface ChartConfig {
    title: string;
    data: any[];
    total: number;
    id: string;
    colors: string[];
    isEmpty: boolean;
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
    const [activeIndex, setActiveIndex] = useState<{ [key: string]: number | null }>({});
    const [selectedChart, setSelectedChart] = useState<ChartConfig | null>(null);

    // Derive Chart Data
    const activeCharts: ChartConfig[] = [
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

            {/* Charts Grid — Compact, no legend */}
            <div className="grid grid-cols-2 gap-3">
                {activeCharts.map(chartConfig => {
                    return (
                        <div
                            key={chartConfig.id}
                            className="flex flex-col bg-slate-900/40 border border-white/5 rounded-2xl p-3 backdrop-blur-sm relative overflow-hidden group hover:border-white/10 transition-colors cursor-pointer active:scale-[0.97] outline-none focus:outline-none"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                            onClick={() => setSelectedChart(chartConfig)}
                        >
                            <h5 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2 text-left flex items-center gap-1.5">
                                <div className="w-1 h-2.5 rounded-full bg-indigo-500/50"></div>
                                {chartConfig.title}
                            </h5>

                            {/* Compact Chart */}
                            <div className="w-full h-28 relative flex-shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart key={`${chartConfig.id}-${pieView}-${isVisible}`} style={{ outline: 'none' }}>
                                        <Pie
                                            data={chartConfig.data}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="72%"
                                            outerRadius="100%"
                                            paddingAngle={4}
                                            cornerRadius={6}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                            stroke="none"
                                            isAnimationActive={isVisible}
                                            animationDuration={1500}
                                            animationBegin={0}
                                            style={{ outline: 'none' }}
                                        >
                                            {chartConfig.data.map((entry: any, index: number) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={chartConfig.id === 'child' ? chartConfig.colors[index % chartConfig.colors.length] : getCategoryColor(entry.name)}
                                                    strokeWidth={0}
                                                    style={{ outline: 'none' }}
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Center Label */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{t('common.total')}</p>
                                    <p className="text-lg font-bold text-white leading-none tracking-tight">
                                        €{chartConfig.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            </div>

                            {/* Tap hint */}
                            <p className="text-[8px] text-slate-600 text-center mt-1 uppercase tracking-widest">{t('common.tapToView') || 'Tap for details'}</p>
                        </div>
                    );
                })}
            </div>

            {/* Glass Detail Popup */}
            {selectedChart && createPortal(
                <div
                    className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedChart(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="w-full max-w-sm bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Popup Header */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                                    <PieChartIcon size={16} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">{selectedChart.title}</h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        {pieView === 'daily' ? t('dashboard.daily') : pieView === 'weekly' ? t('dashboard.weekly') : t('dashboard.monthly')}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedChart(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Large Pie Chart */}
                        <div className="w-full h-56 relative px-5">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart style={{ outline: 'none' }}>
                                    <Pie
                                        // @ts-ignore
                                        activeIndex={activeIndex[selectedChart.id] !== undefined && activeIndex[selectedChart.id] !== null ? activeIndex[selectedChart.id]! : -1}
                                        activeShape={renderActiveShape}
                                        data={selectedChart.data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="65%"
                                        outerRadius="100%"
                                        paddingAngle={3}
                                        cornerRadius={6}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                        stroke="none"
                                        onMouseEnter={(_, index) => onPieEnter(selectedChart.id, _, index)}
                                        onMouseLeave={() => onPieLeave(selectedChart.id)}
                                        isAnimationActive={true}
                                        animationDuration={800}
                                        style={{ outline: 'none' }}
                                    >
                                        {selectedChart.data.map((entry: any, index: number) => (
                                            <Cell
                                                key={`popup-cell-${index}`}
                                                fill={selectedChart.id === 'child' ? selectedChart.colors[index % selectedChart.colors.length] : getCategoryColor(entry.name)}
                                                className="cursor-pointer"
                                                strokeWidth={0}
                                                style={{ outline: 'none' }}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Total */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeIndex[selectedChart.id] !== null && activeIndex[selectedChart.id] !== undefined ? 'active' : 'total'}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col items-center"
                                    >
                                        {(() => {
                                            const idx = activeIndex[selectedChart.id];
                                            const hasActive = idx !== null && idx !== undefined;
                                            const activeItem = hasActive ? selectedChart.data[idx!] : null;
                                            const displayTotal = activeItem ? activeItem.value : selectedChart.total;
                                            const displayLabel = activeItem
                                                ? t(`categories.${activeItem.name.toLowerCase()}`, { defaultValue: activeItem.name })
                                                : t('common.total');
                                            const displayColor = activeItem
                                                ? (selectedChart.id === 'child' ? selectedChart.colors[idx! % selectedChart.colors.length] : getCategoryColor(activeItem.name))
                                                : '#64748b';
                                            return (
                                                <>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: displayColor }}>
                                                        {displayLabel}
                                                    </p>
                                                    <p className="text-3xl font-bold text-white leading-none tracking-tight">
                                                        €{displayTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                    </p>
                                                </>
                                            );
                                        })()}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Full Legend */}
                        <div className="px-5 pb-5 pt-3 space-y-1.5 max-h-60 overflow-y-auto">
                            {selectedChart.data.map((entry: any, i: number) => {
                                const entryColor = selectedChart.id === 'child' ? selectedChart.colors[i % selectedChart.colors.length] : getCategoryColor(entry.name);
                                const isActive = activeIndex[selectedChart.id] === i;
                                const percent = selectedChart.total > 0 ? (entry.value / selectedChart.total) * 100 : 0;

                                return (
                                    <motion.div
                                        key={i}
                                        initial="initial"
                                        animate="visible"
                                        className={"flex flex-col gap-1.5 p-2.5 rounded-xl transition-all " + (isActive ? "bg-white/10" : "bg-white/[0.02] hover:bg-white/5")}
                                        onMouseEnter={() => onPieEnter(selectedChart.id, null, i)}
                                        onMouseLeave={() => onPieLeave(selectedChart.id)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entryColor }}></div>
                                                <span className={"text-sm font-semibold truncate " + (isActive ? "text-white" : "text-slate-300")}>
                                                    {t(`categories.${entry.name.toLowerCase()}`, { defaultValue: entry.name })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={"text-sm font-bold tabular-nums " + (isActive ? "text-white" : "text-slate-200")}>
                                                    €{entry.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 tabular-nums w-10 text-right">{percent.toFixed(1)}%</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                variants={{
                                                    initial: { width: 0 },
                                                    visible: { width: `${percent}%`, transition: { duration: 0.8, ease: "easeOut", delay: 0.05 + (i * 0.08) } }
                                                }}
                                                className="h-full rounded-full"
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
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
};
