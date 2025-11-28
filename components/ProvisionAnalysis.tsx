import React, { useMemo } from 'react';
import { Receipt, Category } from '../types';
import { ArrowLeft, ShieldCheck, TrendingUp, TrendingDown, AlertTriangle, Baby, ShoppingBag, Zap, BrainCircuit, CheckCircle2, XCircle } from 'lucide-react';

interface ProvisionAnalysisProps {
    receipts: Receipt[];
    onBack: () => void;
}

const ProvisionAnalysis: React.FC<ProvisionAnalysisProps> = ({ receipts, onBack }) => {
    const metrics = useMemo(() => {
        let total = 0;
        let provisionTotal = 0;
        let childTotal = 0;
        let luxuryTotal = 0;
        let essentialTotal = 0;

        const catBreakdown: Record<string, number> = {};
        const childItems: { name: string; price: number; date: string }[] = [];
        const luxuryItems: { name: string; price: number; date: string }[] = [];

        receipts.forEach(r => {
            r.items.forEach(i => {
                total += i.price;

                // Category breakdown
                catBreakdown[i.category] = (catBreakdown[i.category] || 0) + i.price;

                // Child Logic
                if (i.isChildRelated) {
                    childTotal += i.price;
                    childItems.push({ name: i.name, price: i.price, date: r.date });
                }

                // Provision Logic (Essentials + Child)
                const isEssential = [Category.FOOD, Category.HOUSEHOLD, Category.HEALTH, Category.EDUCATION, Category.NECESSITY].includes(i.category);

                if (i.isChildRelated || isEssential) {
                    provisionTotal += i.price;
                }

                if (isEssential) {
                    essentialTotal += i.price;
                }

                // Luxury Logic
                if (i.category === Category.LUXURY) {
                    luxuryTotal += i.price;
                    luxuryItems.push({ name: i.name, price: i.price, date: r.date });
                }
            });
        });

        const provisionScore = total > 0 ? (provisionTotal / total) * 100 : 0;
        const childScore = total > 0 ? (childTotal / total) * 100 : 0;
        const luxuryScore = total > 0 ? (luxuryTotal / total) * 100 : 0;

        // Sort items
        childItems.sort((a, b) => b.price - a.price);
        luxuryItems.sort((a, b) => b.price - a.price);

        return {
            total,
            provisionTotal,
            childTotal,
            luxuryTotal,
            provisionScore,
            childScore,
            luxuryScore,
            catBreakdown,
            childItems,
            luxuryItems
        };
    }, [receipts]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 50) return 'text-blue-400';
        if (score >= 30) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 50) return 'Good';
        if (score >= 30) return 'Fair';
        return 'Needs Improvement';
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-4 pt-4 pb-2 flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full bg-surface border border-white/10 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-heading font-bold text-white">AI Provision Analysis</h1>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32 space-y-6">

                {/* 1. Main Score Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 shadow-xl relative overflow-hidden border border-white/10">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                    <div className="relative z-10 text-center">
                        <p className="text-indigo-100 text-xs font-heading font-semibold uppercase tracking-widest mb-2 opacity-80">Certified Provision Score</p>
                        <div className="flex justify-center items-baseline gap-1">
                            <span className="text-6xl font-heading font-bold text-white tracking-tighter tabular-nums">
                                {metrics.provisionScore.toFixed(0)}
                            </span>
                            <span className="text-2xl font-bold text-indigo-200">%</span>
                        </div>
                        <div className="mt-2 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                            <ShieldCheck size={14} className="text-emerald-300" />
                            <span className="text-sm font-medium text-white">{getScoreLabel(metrics.provisionScore)}</span>
                        </div>
                        <p className="text-xs text-indigo-200 mt-4 max-w-[80%] mx-auto leading-relaxed">
                            Based on AI analysis of <strong>{receipts.length}</strong> receipts, <strong>{metrics.provisionScore.toFixed(0)}%</strong> of your spending is verified as essential for your household and children.
                        </p>
                    </div>
                </div>

                {/* 2. AI Insights (Mocked for now, but dynamic based on data) */}
                <div className="bg-surface border border-white/5 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <BrainCircuit className="text-purple-400 w-5 h-5" />
                        <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wide">AI Insights</h3>
                    </div>
                    <div className="space-y-3">
                        {metrics.childScore > 20 && (
                            <div className="flex gap-3 items-start p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <Baby className="text-emerald-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-emerald-100 mb-0.5">Strong Child Focus</p>
                                    <p className="text-xs text-emerald-200/70 leading-relaxed">
                                        You allocate <strong>{metrics.childScore.toFixed(0)}%</strong> of funds directly to child-related items. This is a strong indicator of responsible parenting.
                                    </p>
                                </div>
                            </div>
                        )}
                        {metrics.luxuryScore > 15 ? (
                            <div className="flex gap-3 items-start p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                <AlertTriangle className="text-rose-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-rose-100 mb-0.5">High Discretionary Spending</p>
                                    <p className="text-xs text-rose-200/70 leading-relaxed">
                                        <strong>{metrics.luxuryScore.toFixed(0)}%</strong> of spending is categorized as Luxury. Reducing dining out could improve your provision score.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3 items-start p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <CheckCircle2 className="text-blue-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-blue-100 mb-0.5">Efficient Budgeting</p>
                                    <p className="text-xs text-blue-200/70 leading-relaxed">
                                        Your discretionary spending is low ({metrics.luxuryScore.toFixed(0)}%), showing excellent financial discipline.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Detailed Breakdown Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Child Spend */}
                    <div className="bg-surface border border-white/5 rounded-3xl p-4">
                        <div className="flex items-center gap-2 mb-2 text-emerald-400">
                            <Baby size={18} />
                            <span className="text-xs font-bold uppercase">Child</span>
                        </div>
                        <p className="text-2xl font-bold text-white tabular-nums">€{metrics.childTotal.toFixed(0)}</p>
                        <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${metrics.childScore}%` }}></div>
                        </div>
                    </div>

                    {/* Luxury Spend */}
                    <div className="bg-surface border border-white/5 rounded-3xl p-4">
                        <div className="flex items-center gap-2 mb-2 text-rose-400">
                            <ShoppingBag size={18} />
                            <span className="text-xs font-bold uppercase">Luxury</span>
                        </div>
                        <p className="text-2xl font-bold text-white tabular-nums">€{metrics.luxuryTotal.toFixed(0)}</p>
                        <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: `${metrics.luxuryScore}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* 4. Top Child Items */}
                {metrics.childItems.length > 0 && (
                    <div className="bg-surface border border-white/5 rounded-3xl p-5 shadow-sm">
                        <h3 className="text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-4">Top Child Expenses</h3>
                        <div className="space-y-3">
                            {metrics.childItems.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                            <Baby size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{item.name}</p>
                                            <p className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-white tabular-nums">€{item.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Top Luxury Items (Leakage) */}
                {metrics.luxuryItems.length > 0 && (
                    <div className="bg-surface border border-white/5 rounded-3xl p-5 shadow-sm">
                        <h3 className="text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-4">Discretionary Leakage</h3>
                        <div className="space-y-3">
                            {metrics.luxuryItems.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                                            <ShoppingBag size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{item.name}</p>
                                            <p className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-white tabular-nums">€{item.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProvisionAnalysis;
