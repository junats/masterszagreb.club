import React, { useMemo } from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Goal, GoalType } from '@common/types';
import { Pizza, Beer, Cigarette, Gamepad2, Dices, Coffee, Cookie, ShoppingCart, Shirt, Car, Tv, PiggyBank, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CountUp } from '../CountUp';

// Goal Colors Mapping
const GOAL_COLORS: Record<string, string> = {
    [GoalType.JUNK_FOOD]: '#f97316', // Orange
    [GoalType.ALCOHOL]: '#ef4444',   // Red
    [GoalType.SMOKING]: '#64748b',   // Slate
    [GoalType.GAMING]: '#a855f7',    // Purple
    [GoalType.SAVINGS]: '#10b981',   // Emerald
    [GoalType.CAFFEINE]: '#d97706',  // Amber
    [GoalType.SUGAR]: '#ec4899',     // Pink
    [GoalType.ONLINE_SHOPPING]: '#3b82f6', // Blue
    [GoalType.GAMBLING]: '#e11d48',  // Rose
    [GoalType.FAST_FASHION]: '#d946ef', // Fuchsia
    [GoalType.RIDE_SHARING]: '#0ea5e9', // Sky
    [GoalType.STREAMING]: '#8b5cf6',    // Violet
};

interface GoalGaugeProps {
    goal: Goal;
    total: number;
    isInView?: boolean;
    trend?: 'up' | 'down' | 'flat';
    intensity?: 'low' | 'medium' | 'high';
    showIndicators?: boolean;
}

export const GoalGauge: React.FC<GoalGaugeProps> = ({ goal, total, isInView = true, trend, intensity, showIndicators }) => {
    let color = GOAL_COLORS[goal.type] || '#a855f7';

    // Traffic Light Logic
    if (showIndicators) {
        if (intensity === 'high') color = '#ef4444'; // Red
        else if (intensity === 'medium') color = '#eab308'; // Yellow
        else color = '#22c55e'; // Green
    }

    // Mock target for now (e.g., €100 limit per goal)
    const limit = 100;
    const percentage = Math.min((total / limit) * 100, 100);

    // Icon Mapping
    const getIcon = () => {
        const iconProps = { size: 20, style: { color: color } }; // Slightly smaller icon for 80px gauge
        switch (goal.type) {
            case GoalType.JUNK_FOOD: return <Pizza {...iconProps} />;
            case GoalType.ALCOHOL: return <Beer {...iconProps} />;
            case GoalType.SMOKING: return <Cigarette {...iconProps} />;
            case GoalType.GAMING: return <Gamepad2 {...iconProps} />;
            case GoalType.GAMBLING: return <Dices {...iconProps} />;
            case GoalType.CAFFEINE: return <Coffee {...iconProps} />;
            case GoalType.SUGAR: return <Cookie {...iconProps} />;
            case GoalType.ONLINE_SHOPPING: return <ShoppingCart {...iconProps} />;
            case GoalType.FAST_FASHION: return <Shirt {...iconProps} />;
            case GoalType.RIDE_SHARING: return <Car {...iconProps} />;
            case GoalType.STREAMING: return <Tv {...iconProps} />;
            case GoalType.SAVINGS: return <PiggyBank {...iconProps} />;
            default: return <Target {...iconProps} />;
        }
    };

    return (
        <div className="flex flex-col items-center relative">
            <div className="h-20 w-20 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="100%"
                        barSize={8}
                        data={[{ value: percentage, fill: color }]}
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
                            isAnimationActive={isInView}
                            animationDuration={1500}
                            animationEasing="ease-out"
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {getIcon()}
                </div>
            </div>
            <div className="flex items-center gap-1 mt-1">
                <span className={"text-xxs font-bold uppercase tracking-wide text-center " + (showIndicators && intensity === 'high' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-slate-400')}>
                    <CountUp value={total} prefix="€" decimals={0} />
                </span>
                {showIndicators && trend && (
                    <span className={(trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-emerald-400' : 'text-slate-500')}>
                        {trend === 'up' ? <TrendingUp size={10} /> : trend === 'down' ? <TrendingDown size={10} /> : <Minus size={10} />}
                    </span>
                )}
            </div>
        </div>
    );
};
