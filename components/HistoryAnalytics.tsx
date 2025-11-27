import React, { useMemo, useState } from 'react';
import { Receipt, Category } from '../types';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Activity, Wallet, Baby } from 'lucide-react';

interface HistoryAnalyticsProps {
    receipts: Receipt[];
    ageRestricted: boolean;
    categoryBudgets: Record<string, number>;
}

const COLORS = {
    [Category.NECESSITY]: '#38bdf8', // Sky
    [Category.FOOD]: '#4ade80',      // Green
    [Category.LUXURY]: '#f472b6',    // Pink
    [Category.HOUSEHOLD]: '#818cf8', // Indigo
    [Category.HEALTH]: '#fb7185',    // Rose
    [Category.TRANSPORT]: '#facc15', // Yellow
    [Category.EDUCATION]: '#6366f1', // Indigo
    [Category.OTHER]: '#94a3b8',     // Slate
};

const HistoryAnalytics: React.FC<HistoryAnalyticsProps> = ({ receipts, ageRestricted, categoryBudgets }) => {
    const [activeTab, setActiveTab] = useState<'trend' | 'child' | 'dist' | 'sources' | 'budgets'>('trend');

    // 1. Trend Data (Stacked Area: Essentials vs Luxury/Other)
    const trendData = useMemo(() => {
        const data: Record<string, { name: string; essentials: number; discretionary: number }> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize last 6 months
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(2)}`;
            data[key] = { name: key, essentials: 0, discretionary: 0 };
        }

        receipts.forEach(r => {
            const d = new Date(r.date);
            const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(2)}`;
            if (data.hasOwnProperty(key)) {
                r.items.forEach(item => {
                    if (ageRestricted && item.isRestricted) return;

                    const isEssential = [Category.FOOD, Category.NECESSITY, Category.HEALTH, Category.EDUCATION, Category.HOUSEHOLD, Category.TRANSPORT].includes(item.category);

                    if (isEssential) {
                        data[key].essentials += item.price;
                    } else {
                        data[key].discretionary += item.price;
                    }
                });
            }
        });

        return Object.values(data);
    }, [receipts, ageRestricted]);

    // 1b. Child Trend Data (Area Chart)
    const childTrendData = useMemo(() => {
        const data: Record<string, { name: string; child: number }> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(2)}`;
            data[key] = { name: key, child: 0 };
        }

        receipts.forEach(r => {
            const d = new Date(r.date);
            const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(2)}`;
            if (data.hasOwnProperty(key)) {
                r.items.forEach(item => {
                    if (ageRestricted && item.isRestricted) return;
                    if (item.isChildRelated) {
                        data[key].child += item.price;
                    }
                });
            }
        });

        return Object.values(data);
    }, [receipts, ageRestricted]);

    // 2. Category Data (Donut)
    const categoryData = useMemo(() => {
        const data: Record<string, number> = {};
        let total = 0;

        receipts.forEach(r => {
            r.items.forEach(item => {
                if (ageRestricted && item.isRestricted) return;
                const cat = item.category || Category.OTHER;
                data[cat] = (data[cat] || 0) + item.price;
                total += item.price;
            });
        });

        return {
            data: Object.entries(data)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value),
            total
        };
    }, [receipts, ageRestricted]);

    // 3. Top Stores (Horizontal Bar)
    const storeData = useMemo(() => {
        const data: Record<string, number> = {};

        receipts.forEach(r => {
            const validTotal = r.items.reduce((sum, item) =>
                (!ageRestricted || !item.isRestricted) ? sum + item.price : sum, 0);
            if (validTotal > 0) {
                data[r.storeName] = (data[r.storeName] || 0) + validTotal;
            }
        });

        return Object.entries(data)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
    }, [receipts, ageRestricted]);

    // 4. Budget Data
    const budgetData = useMemo(() => {
        const data: { name: string; actual: number; budget: number; percent: number }[] = [];

        // Calculate actuals
        const actuals: Record<string, number> = {};
        receipts.forEach(r => {
            r.items.forEach(item => {
                if (ageRestricted && item.isRestricted) return;
                const cat = item.category || Category.OTHER;
                actuals[cat] = (actuals[cat] || 0) + item.price;
            });
        });

        // Combine with budgets
        Object.values(Category).forEach(cat => {
            const budget = categoryBudgets[cat] || 0;
            if (budget > 0 || actuals[cat] > 0) {
                const actual = actuals[cat] || 0;
                data.push({
                    name: cat,
                    actual,
                    budget,
                    percent: budget > 0 ? (actual / budget) * 100 : 0
                });
            }
        });

        return data.sort((a, b) => b.percent - a.percent);
    }, [receipts, ageRestricted, categoryBudgets]);

    if (receipts.length === 0) return null;

    return (
        <div className="mb-4 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
            {/* Tabs */}
            <div className="flex p-1 bg-surface border border-white/10 rounded-xl mb-3 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('trend')}
                    className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'trend' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <TrendingUp size={14} /> Trend
                </button>
                <button
                    onClick={() => setActiveTab('child')}
                    className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'child' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Baby size={14} /> Child
                </button>
                <button
                    onClick={() => setActiveTab('dist')}
                    className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'dist' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <PieIcon size={14} /> Dist
                </button>
                <button
                    onClick={() => setActiveTab('sources')}
                    className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'sources' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Activity size={14} /> Sources
                </button>
                <button
                    onClick={() => setActiveTab('budgets')}
                    className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'budgets' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Wallet size={14} /> Budgets
                </button>
            </div>

            {/* Chart Container */}
            <div className="bg-surface border border-white/5 rounded-3xl p-4 shadow-sm min-h-[256px] relative">

                {activeTab === 'trend' && (
                    <div className="h-64 w-full animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Spending Composition</h4>
                        </div>
                        <div className="h-[85%]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorEssentials" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorDiscretionary" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <Area type="monotone" dataKey="discretionary" name="Wants" stackId="1" stroke="#f472b6" fill="url(#colorDiscretionary)" />
                                    <Area type="monotone" dataKey="essentials" name="Needs" stackId="1" stroke="#34d399" fill="url(#colorEssentials)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === 'child' && (
                    <div className="h-64 w-full animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Child Spending Trend</h4>
                        </div>
                        <div className="h-[85%]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={childTrendData}>
                                    <defs>
                                        <linearGradient id="colorChild" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <Area type="monotone" dataKey="child" name="Child Expenses" stroke="#10b981" fill="url(#colorChild)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === 'dist' && (
                    <div className="h-64 w-full animate-in fade-in duration-300 relative">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Category Breakdown</h4>
                        </div>
                        <div className="h-[90%]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData.data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} stroke="rgba(0,0,0,0.2)" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4 pr-20">
                                <span className="text-[10px] text-slate-500 font-medium uppercase">Total</span>
                                <span className="text-lg font-heading font-bold text-white tabular-nums">€{categoryData.total.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sources' && (
                    <div className="h-64 w-full animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Top Merchants</h4>
                        </div>
                        <div className="h-[90%]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={storeData} margin={{ left: 0, right: 30 }}>
                                    <defs>
                                        <linearGradient id="colorSource" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#06b6d4" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                    </defs>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="value" name="Spend (€)" fill="url(#colorSource)" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === 'budgets' && (
                    <div className="h-full w-full animate-in fade-in duration-300 overflow-y-auto no-scrollbar pb-2">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Budget vs Actual</h4>
                            <span className="text-[10px] text-slate-500 font-medium">Set limits in Settings</span>
                        </div>
                        <div className="space-y-4">
                            {budgetData.map((item) => {
                                const isOverBudget = item.actual > item.budget && item.budget > 0;
                                const barColor = isOverBudget ? 'bg-red-500' : 'bg-emerald-500';
                                const widthPercent = Math.min((item.actual / (item.budget || item.actual || 1)) * 100, 100);

                                return (
                                    <div key={item.name} className="space-y-1.5">
                                        <div className="flex justify-between items-end text-xs">
                                            <span className="font-bold text-slate-300">{item.name}</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`font-mono font-bold ${isOverBudget ? 'text-red-400' : 'text-white'}`}>€{item.actual.toFixed(0)}</span>
                                                <span className="text-slate-500">/</span>
                                                <span className="text-slate-500 font-mono">€{item.budget}</span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                                style={{ width: `${widthPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {budgetData.length === 0 && (
                                <p className="text-center text-slate-500 text-xs py-8">No spending data or budgets set.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryAnalytics;
