import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { CountUp } from './CountUp'; // Assuming CountUp is in the same directory
import { useLanguage } from '../contexts/LanguageContext';

interface InsightsGaugesProps {
    insightView: 'daily' | 'weekly' | 'monthly';
    metrics: any; // Using any for now to avoid large type import spread, but should ideally be typed
    isVisible: boolean; // Passed from parent VisibilitySensor or calculated internally if we move Sensor here
}

export const InsightsGauges: React.FC<InsightsGaugesProps> = ({ insightView, metrics, isVisible }) => {
    const { t } = useLanguage();
    const [animationReady, setAnimationReady] = useState(false);

    // Force delay for animation trigger to allow layout to settle
    useEffect(() => {
        if (isVisible) {
            const t = setTimeout(() => setAnimationReady(true), 150);
            return () => clearTimeout(t);
        } else {
            setAnimationReady(false);
        }
    }, [isVisible]);

    const gauges = useMemo(() => [
        { label: t('misc.education'), value: insightView === 'monthly' ? metrics.educationRatio : insightView === 'weekly' ? metrics.weeklyRatios.education : metrics.dailyRatios.education, color: '#818cf8' }, // Indigo
        { label: t('misc.food'), value: insightView === 'monthly' ? metrics.foodRatio : insightView === 'weekly' ? metrics.weeklyRatios.food : metrics.dailyRatios.food, color: '#fbbf24' }, // Amber
        { label: t('misc.activities'), value: insightView === 'monthly' ? metrics.luxuryRatio : insightView === 'weekly' ? metrics.weeklyRatios.activities : metrics.dailyRatios.activities, color: '#f472b6' }, // Pink
        { label: t('misc.health'), value: insightView === 'monthly' ? metrics.healthRatio : insightView === 'weekly' ? metrics.weeklyRatios.health : metrics.dailyRatios.health, color: '#34d399' } // Emerald
    ], [insightView, metrics, t]);

    return (
        <div className="grid grid-cols-4 gap-4">
            {gauges.map((gauge, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                    <div className="h-20 w-20 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                key={`${isVisible}-${animationReady}-${idx}`} // Force re-render on visibility change
                                cx="50%"
                                cy="50%"
                                innerRadius="65%"
                                outerRadius="100%"
                                barSize={8}
                                data={[{ value: Math.min((isVisible && animationReady) ? gauge.value : 0, 100), fill: gauge.color }]}
                                startAngle={90}
                                endAngle={-270}
                            >
                                <PolarAngleAxis
                                    type="number"
                                    domain={[0, 100]}
                                    angleAxisId={0}
                                    tick={false}
                                />
                                <RadialBar
                                    background={{ fill: '#1e293b' }}
                                    dataKey="value"
                                    cornerRadius={10}
                                    isAnimationActive={true}
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-sm font-bold" style={{ color: gauge.color }}>
                                <CountUp value={gauge.value} suffix="%" decimals={0} />
                            </span>
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide mt-1 font-bold text-center">{gauge.label}</span>
                </div>
            ))}
        </div>
    );
};
