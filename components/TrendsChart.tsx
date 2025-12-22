import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar, PolarAngleAxis, PieChart, Pie, Cell, Sector } from 'recharts';
import { CategoryDefinition } from '../types';

// Custom Tooltip Component (Moved outside Dashboard)
export const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl">
                <p className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">{label}</p>
                <p className="text-white text-sm font-bold font-mono">
                    €{(data.total || 0).toFixed(2)}
                </p>
            </div>
        );
    }
    return null;
};

// Extracted TrendsChart Component
export const TrendsChart = ({ activeData, categories, isVisible, chartView, layoutId }: { activeData: any[], categories: CategoryDefinition[], isVisible: boolean, chartView: string, layoutId?: string }) => {
    // Simplified animation logic: Direct control via Props
    // We rely on the parent (AnimatedSection) to tell us when to be visible
    // Recharts will animate when 'isAnimationActive' becomes true or on mount

    // Calculate max value for stable axis
    const chartMax = useMemo(() => {
        if (!activeData.length) return 100;
        const maxVal = Math.max(...activeData.map(d => {
            return categories.reduce((sum, cat) => sum + (d[cat.name] || 0), 0);
        }));
        return Math.ceil(maxVal * 1.1);
    }, [activeData, categories]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            {isVisible ? (
                <AreaChart
                    data={activeData}
                    key={chartView + (layoutId || '')} // Force re-render when view or layout changes
                    margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        {categories.map((cat) => (
                            <linearGradient key={cat.id} id={`gradient-trend-${cat.name}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={cat.color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={cat.color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <XAxis dataKey="label" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} width={40} domain={[0, chartMax]} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} wrapperStyle={{ zIndex: 100 }} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    {categories.map((cat) => (
                        <Area
                            key={cat.id}
                            type="monotone"
                            dataKey={cat.name}
                            stackId="1"
                            stroke={cat.color}
                            fill={`url(#gradient-trend-${cat.name})`}
                            strokeWidth={2}
                            animationDuration={1500}
                            isAnimationActive={true}
                        />
                    ))}
                </AreaChart>
            ) : null}
        </ResponsiveContainer>
    );
};
