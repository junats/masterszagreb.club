import React, { useMemo, useState } from 'react';
import { Receipt, Category } from '../types';
import { ShoppingBag, X, ShieldCheck, FileText, Calendar, Store, ArrowUp, BarChart3, Check, Shield, Sparkles, TrendingUp, TrendingDown, Minus, Wallet, Hash, ArrowUpRight, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  receipts: Receipt[];
  monthlyBudget: number;
  ageRestricted: boolean;
}

interface DrillDownState {
    category: string;
    items: { name: string; price: number; date: string; store: string }[];
}

type DateFilter = 'all' | 'this_month' | 'last_month';

const Dashboard: React.FC<DashboardProps> = ({ receipts, monthlyBudget, ageRestricted }) => {
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  
  // Calculate Metrics
  const metrics = useMemo(() => {
    // 1. Filter Receipts based on Date Filter
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filteredReceipts = receipts.filter(r => {
        const d = new Date(r.date);
        if (dateFilter === 'this_month') {
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        } else if (dateFilter === 'last_month') {
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        }
        return true;
    });

    let totalSpent = 0;
    let provisionTotal = 0; // Essentials only
    const categoryTotals: Record<string, number> = {};
    const categoryItems: Record<string, DrillDownState['items']> = {};
    let luxuryTotal = 0;
    
    // For Dynamic Insight
    const storeTotals: Record<string, number> = {};

    filteredReceipts.forEach(r => {
      const validItems = r.items.filter(item => !ageRestricted || !item.isRestricted);
      const effectiveReceiptTotal = validItems.reduce((sum, item) => sum + item.price, 0);

      if (validItems.length === 0 && r.items.length > 0) return;

      totalSpent += effectiveReceiptTotal;
      storeTotals[r.storeName] = (storeTotals[r.storeName] || 0) + effectiveReceiptTotal;

      validItems.forEach(item => {
        const cat = item.category || Category.OTHER;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + item.price;
        
        if (!categoryItems[cat]) categoryItems[cat] = [];
        categoryItems[cat].push({ name: item.name, price: item.price, date: r.date, store: r.storeName });

        if (cat === Category.LUXURY) {
            luxuryTotal += item.price;
            if(!categoryItems['Luxury']) categoryItems['Luxury'] = [];
            categoryItems['Luxury'].push({ name: item.name, price: item.price, date: r.date, store: r.storeName });
        } else {
             // Essentials Calculation
             if ([Category.NECESSITY, Category.FOOD, Category.HEALTH, Category.HOUSEHOLD, Category.TRANSPORT, Category.EDUCATION].includes(cat)) {
                provisionTotal += item.price;
             }
        }
      });
    });

    const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      percentage: totalSpent > 0 ? (value / totalSpent) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    // Sort drilldown items
    Object.keys(categoryItems).forEach(key => {
        categoryItems[key].sort((a, b) => b.price - a.price);
    });

    const provisionRatio = totalSpent > 0 ? (provisionTotal / totalSpent) * 100 : 0;
    
    // Evidence Health Components
    const volumeCount = filteredReceipts.length;
    
    // Top Stores (Top 3)
    const topStores = Object.entries(storeTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, val]) => ({ name, value: val, percentage: totalSpent > 0 ? (val/totalSpent)*100 : 0 }));

    // Avg Receipt
    const avgReceipt = filteredReceipts.length > 0 ? totalSpent / filteredReceipts.length : 0;
    
    // Max Receipt
    const maxSingleReceipt = filteredReceipts.length > 0 
        ? Math.max(...filteredReceipts.map(r => r.items.reduce((s, i) => !ageRestricted || !i.isRestricted ? s + i.price : s, 0))) 
        : 0;

    // Recent Spending Trend (Last 5 logs)
    const recentLogs = [...filteredReceipts].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).reverse();
    const maxLogValue = Math.max(...recentLogs.map(r => r.total), 1);

    // --- SPENDING PREDICTION / INSIGHT LOGIC ---
    let spendingInsight = "Scan more receipts to generate insights.";
    let trendDirection: 'up' | 'down' | 'flat' = 'flat';

    if (filteredReceipts.length >= 3) {
        // Compare average of last 3 logs vs global average
        const recentSubset = recentLogs.slice(-3);
        const recentAvg = recentSubset.reduce((sum, r) => sum + r.total, 0) / recentSubset.length;
        
        const diffPercent = avgReceipt > 0 ? ((recentAvg - avgReceipt) / avgReceipt) * 100 : 0;

        // Budget Logic (Priority)
        const budgetUsedPercent = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

        if (budgetUsedPercent > 100) {
             spendingInsight = "You have exceeded your monthly budget.";
             trendDirection = 'up';
        } else if (budgetUsedPercent > 85) {
             spendingInsight = "You are approaching your budget limit.";
             trendDirection = 'up';
        } else if (diffPercent > 20) {
            spendingInsight = "Recent spending is higher than average.";
            trendDirection = 'up';
        } else if (diffPercent < -20) {
            spendingInsight = "You are spending less than usual.";
            trendDirection = 'down';
        } else {
            spendingInsight = "Your spending habits are stable.";
            trendDirection = 'flat';
        }
    }

    return { 
        totalSpent, 
        provisionTotal,
        provisionRatio,
        categoryData, 
        luxuryTotal, 
        categoryItems,
        topStores,
        avgReceipt,
        maxSingleReceipt,
        recentLogs,
        maxLogValue,
        volumeCount,
        spendingInsight,
        trendDirection,
        filteredCount: filteredReceipts.length
    };
  }, [receipts, ageRestricted, monthlyBudget, dateFilter]);

  const toggleDateFilter = () => {
      if (dateFilter === 'all') setDateFilter('this_month');
      else if (dateFilter === 'this_month') setDateFilter('last_month');
      else setDateFilter('all');
  };

  const getDateFilterLabel = () => {
      switch(dateFilter) {
          case 'this_month': return 'This Month';
          case 'last_month': return 'Last Month';
          default: return 'All Time';
      }
  };

  const COLORS: Record<string, string> = {
    [Category.NECESSITY]: '#38bdf8', // Sky
    [Category.FOOD]: '#4ade80',      // Green
    [Category.LUXURY]: '#f472b6',    // Pink
    [Category.HOUSEHOLD]: '#818cf8', // Indigo
    [Category.HEALTH]: '#fb7185',    // Rose
    [Category.TRANSPORT]: '#facc15', // Yellow
    [Category.EDUCATION]: '#6366f1', // Indigo
    [Category.OTHER]: '#94a3b8',     // Slate
  };

  const budgetProgress = monthlyBudget > 0 ? (metrics.totalSpent / monthlyBudget) * 100 : 0;

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-24 overflow-y-auto no-scrollbar bg-[#0b1120]">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Shield className="w-5 h-5 text-white fill-white/20" />
             <h1 className="text-xl font-bold text-white tracking-tight">TrueTrack</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
             <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
             <p className="text-slate-400 text-xs font-medium">Safe Harbor Active • Records Secure</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
             {ageRestricted && (
                 <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">
                     <ShieldCheck className="text-amber-500 w-4 h-4" />
                 </div>
             )}
             <button 
                onClick={toggleDateFilter}
                className="bg-surface border border-slate-700 rounded-full h-8 px-3 flex items-center justify-center gap-2 transition-colors hover:bg-slate-700 active:scale-95"
             >
                 <Calendar className="text-primary w-3.5 h-3.5" />
                 <span className="text-[10px] font-bold text-white uppercase tracking-wide">{getDateFilterLabel()}</span>
             </button>
        </div>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        
        {/* 1. Main Provisioning Card (Full Width) */}
        <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider mb-1">Verified Provision</p>
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        €{metrics.provisionTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                            {metrics.provisionRatio.toFixed(0)}%
                        </span>
                        <span className="text-indigo-200 text-xs">of outgoing funds spent on Child/Home</span>
                    </div>
                </div>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <ShieldCheck className="text-white w-6 h-6" />
                </div>
            </div>
            {/* Progress Bar for Budget inside Main Card */}
            <div className="relative z-10 mt-6">
                 <div className="flex justify-between text-[10px] text-indigo-100 mb-1">
                    <span>Monthly Budget Usage</span>
                    <span>{Math.round(budgetProgress)}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                     <div 
                        className={`h-full rounded-full transition-all duration-500 ${budgetProgress > 100 ? 'bg-red-300' : 'bg-white'}`} 
                        style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                     ></div>
                 </div>
            </div>
        </div>

        {/* 2. Evidence Health Check */}
        <div className="col-span-1 bg-surface border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
             <div className="flex items-center gap-2 mb-3">
                 <FileText className="text-blue-400 w-4 h-4" />
                 <span className="text-slate-400 text-xs font-medium">Evidence Health</span>
             </div>
             
             <div className="space-y-3">
                 {/* Consistency Check */}
                 <div className="flex items-center gap-2 text-[10px]">
                     <div className={`w-3 h-3 rounded-full flex items-center justify-center ${metrics.volumeCount > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
                        {metrics.volumeCount > 0 && <Check size={8} strokeWidth={4} />}
                     </div>
                     <span className="text-slate-300">Started Logging</span>
                 </div>
                 
                 {/* Volume Check */}
                 <div>
                     <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                         <span>Log Volume</span>
                         <span>{metrics.volumeCount}</span>
                     </div>
                     <div className="h-1 bg-slate-800 rounded-full w-full">
                         <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min((metrics.volumeCount/20)*100, 100)}%` }}></div>
                     </div>
                 </div>

                 {/* Ratio Check */}
                 <div>
                     <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                         <span>Provision Focus</span>
                         <span>{metrics.provisionRatio.toFixed(0)}%</span>
                     </div>
                     <div className="h-1 bg-slate-800 rounded-full w-full">
                         <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${metrics.provisionRatio}%` }}></div>
                     </div>
                 </div>
             </div>
        </div>

        {/* 3. Spending Trends */}
        <div className="col-span-1 bg-surface border border-slate-700/50 rounded-2xl p-4 flex flex-col relative overflow-hidden">
             <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    <BarChart3 className="text-purple-400 w-4 h-4" />
                    <span className="text-slate-400 text-xs font-medium">Trend</span>
                 </div>
                 {metrics.trendDirection === 'up' && <TrendingUp size={14} className="text-red-400" />}
                 {metrics.trendDirection === 'down' && <TrendingDown size={14} className="text-emerald-400" />}
                 {metrics.trendDirection === 'flat' && <Minus size={14} className="text-slate-400" />}
             </div>
             
             {/* Textual Insight */}
             <div className="mb-3">
                 <div className="flex items-start gap-1.5">
                    <Sparkles size={10} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-slate-300 leading-tight">{metrics.spendingInsight}</p>
                 </div>
             </div>

             <div className="flex-1 flex items-end justify-between gap-1 pt-1">
                 {metrics.recentLogs.length > 0 ? metrics.recentLogs.map((log, idx) => {
                     const heightPercent = (log.total / metrics.maxLogValue) * 100;
                     return (
                         <div key={idx} className="flex flex-col items-center gap-1 w-full">
                             <div 
                                className="w-full bg-purple-500/30 rounded-t-sm transition-all hover:bg-purple-500"
                                style={{ height: `${Math.max(heightPercent, 10)}%` }}
                             ></div>
                         </div>
                     )
                 }) : (
                     <div className="w-full text-center text-[10px] text-slate-500 italic mt-2">
                         No data
                     </div>
                 )}
             </div>
        </div>

        {/* 4. Financial Snapshot (Grid of 3) - REPLACES Old Avg Log Box */}
        <div className="col-span-2 bg-surface border border-slate-700/50 rounded-2xl p-4">
             <div className="flex items-center gap-2 mb-3">
                 <Wallet className="text-emerald-400 w-4 h-4" />
                 <span className="text-slate-400 text-xs font-medium">Financial Snapshot ({getDateFilterLabel()})</span>
             </div>
             <div className="grid grid-cols-3 gap-2">
                {/* Avg Spend */}
                <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 mb-0.5">Average</p>
                    <p className="text-sm font-bold text-white">€{metrics.avgReceipt.toFixed(0)}</p>
                </div>
                {/* Max Spend */}
                <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 mb-0.5">Highest</p>
                    <div className="flex items-center gap-1">
                        <p className="text-sm font-bold text-white">€{metrics.maxSingleReceipt.toFixed(0)}</p>
                        <ArrowUpRight size={10} className="text-red-400" />
                    </div>
                </div>
                {/* Count */}
                <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 mb-0.5">Logs</p>
                    <div className="flex items-center gap-1">
                        <p className="text-sm font-bold text-white">{metrics.filteredCount}</p>
                        <Hash size={10} className="text-blue-400" />
                    </div>
                </div>
             </div>
        </div>

        {/* 5. Top Vendors (Top 3) */}
        <div className="col-span-1 bg-surface border border-slate-700/50 rounded-2xl p-4">
             <div className="flex items-center gap-2 mb-2">
                 <Store className="text-slate-400 w-3 h-3" />
                 <span className="text-slate-400 text-xs font-medium">Top Vendors</span>
             </div>
             <div className="space-y-2">
                 {metrics.topStores.length > 0 ? metrics.topStores.map((store, i) => (
                     <div key={i} className="relative">
                         <div className="flex justify-between text-[10px] z-10 relative">
                             <span className="text-slate-200 truncate max-w-[60%]">{store.name}</span>
                             <span className="text-slate-400">€{store.value.toFixed(0)}</span>
                         </div>
                         <div className="h-1 w-full bg-slate-800 rounded-full mt-0.5">
                             <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${store.percentage}%` }}></div>
                         </div>
                     </div>
                 )) : (
                     <span className="text-[10px] text-slate-500">No data yet</span>
                 )}
             </div>
        </div>

        {/* 6. Category Breakdown (Linear Bars) */}
        <div className="col-span-2 bg-surface border border-slate-700/50 rounded-2xl p-5">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Spending Breakdown</h3>
                 <ShoppingBag className="text-slate-600 w-4 h-4" />
             </div>
             <div className="space-y-4">
                {metrics.categoryData.slice(0, 4).map((d, i) => (
                    <div key={i} onClick={() => {
                        const items = metrics.categoryItems[d.name] || [];
                        if(items.length > 0) setDrillDown({ category: d.name, items });
                    }} className="cursor-pointer group">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[d.name] }}></div>
                                <span className="text-slate-200 font-medium group-hover:text-white transition-colors">{d.name}</span>
                            </div>
                            <span className="text-slate-400 font-mono">€{d.value.toFixed(0)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full rounded-full transition-all duration-500" 
                                style={{ width: `${d.percentage}%`, backgroundColor: COLORS[d.name] }}
                            ></div>
                        </div>
                    </div>
                ))}
                {metrics.categoryData.length === 0 && (
                    <p className="text-slate-500 text-xs text-center py-2">No spending data yet.</p>
                )}
             </div>
        </div>

        {/* 7. Recent Log (Compact List) */}
        <div className="col-span-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1 mt-2">Recent Logs</h3>
            <div className="space-y-2">
                {receipts.slice(0, 3).map(r => (
                    <div key={r.id} className="bg-surface border border-slate-700/50 rounded-xl p-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                                r.type === 'bill' 
                                ? 'bg-indigo-900/50 text-indigo-300' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                                {r.type === 'bill' ? <FileText size={14} /> : r.storeName.charAt(0)}
                            </div>
                            <div>
                                <p className="text-slate-200 text-xs font-medium">{r.storeName}</p>
                                <p className="text-[10px] text-slate-500">{new Date(r.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {ageRestricted && r.items.some(i => i.isRestricted) && (
                                <AlertTriangle className="text-amber-500 w-3 h-3" />
                            )}
                            <span className={`font-mono text-xs font-medium ${r.type === 'bill' ? 'text-indigo-400' : 'text-white'}`}>
                                €{r.items.reduce((acc, i) => (!ageRestricted || !i.isRestricted ? acc + i.price : acc), 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* Drill Down Modal */}
      {drillDown && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-surface w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300">
                  <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 sticky top-0 z-10 backdrop-blur-md">
                      <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">{drillDown.category}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {drillDown.items.length} items • Total: <span className="text-emerald-400 font-mono font-bold">€{drillDown.items.reduce((acc, i) => acc + i.price, 0).toFixed(2)}</span>
                        </p>
                      </div>
                      <button onClick={() => setDrillDown(null)} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                          <X size={18} />
                      </button>
                  </div>
                  
                  <div className="p-4 overflow-y-auto custom-scrollbar">
                      <div className="space-y-4 mb-4">
                          {drillDown.items.slice(0, 5).map((item, idx) => {
                             const maxPrice = Math.max(...drillDown.items.map(i => i.price));
                             const width = maxPrice > 0 ? (item.price / maxPrice) * 100 : 0;
                             
                             return (
                                 <div key={idx} className="space-y-1">
                                     <div className="flex justify-between text-xs text-slate-400">
                                         <span>{item.name.substring(0, 15)}...</span>
                                         <span>€{item.price.toFixed(2)}</span>
                                     </div>
                                     <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full opacity-80" 
                                            style={{ width: `${width}%`, backgroundColor: COLORS[drillDown.category] || '#818cf8' }}
                                        ></div>
                                     </div>
                                 </div>
                             )
                          })}
                      </div>

                      <div className="space-y-1 pt-4 border-t border-slate-800">
                          <div className="flex justify-between items-center px-2 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <span>Item / Date</span>
                              <span>Price</span>
                          </div>
                          {drillDown.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800 transition-colors border border-slate-700/30">
                                  <div className="flex flex-col gap-0.5">
                                      <p className="text-slate-200 font-medium truncate max-w-[200px]">{item.name}</p>
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                        <Calendar size={10} />
                                        <span>{new Date(item.date).toLocaleDateString()}</span>
                                        <span className="text-slate-700">•</span>
                                        <span className="text-slate-400">{item.store}</span>
                                      </div>
                                  </div>
                                  <span className="text-emerald-400 font-mono font-medium">€{item.price.toFixed(2)}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;