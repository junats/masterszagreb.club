import React, { useMemo, useState } from 'react';
import { Receipt, Category } from '../types';
import { TrendingUp, ShoppingBag, Sparkles, X, Activity, TrendingDown, ShieldCheck, FileText, AlertTriangle, ArrowUpRight, ArrowDownRight, Calendar, Receipt as ReceiptIcon, Shield, Calculator, Store } from 'lucide-react';

interface DashboardProps {
  receipts: Receipt[];
  monthlyBudget: number;
  ageRestricted: boolean;
}

interface DrillDownState {
    category: string;
    items: { name: string; price: number; date: string; store: string }[];
}

const Dashboard: React.FC<DashboardProps> = ({ receipts, monthlyBudget, ageRestricted }) => {
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
  
  // Calculate Metrics
  const metrics = useMemo(() => {
    let totalSpent = 0;
    let provisionTotal = 0; // Essentials only
    const categoryTotals: Record<string, number> = {};
    const categoryItems: Record<string, DrillDownState['items']> = {};
    let luxuryTotal = 0;
    
    // For Dynamic Insight
    const storeTotals: Record<string, number> = {};
    let mostExpensiveItem = { name: '', price: 0, store: '' };

    receipts.forEach(r => {
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

        if (item.price > mostExpensiveItem.price) {
            mostExpensiveItem = { name: item.name, price: item.price, store: r.storeName };
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
    
    // Evidence Score Calculation (0-100)
    const volumeScore = Math.min(receipts.length, 20) * 2.5;
    const qualityScore = Math.min(provisionRatio, 100) * 0.5;
    const numericEvidenceScore = Math.round(volumeScore + qualityScore);

    let evidenceLabel = 'Starting';
    let evidenceColor = 'text-slate-400';
    let evidenceStroke = 'stroke-slate-400';

    if (numericEvidenceScore > 30) { 
        evidenceLabel = 'Building'; 
        evidenceColor = 'text-amber-400'; 
        evidenceStroke = 'stroke-amber-400';
    }
    if (numericEvidenceScore > 60) { 
        evidenceLabel = 'Strong'; 
        evidenceColor = 'text-blue-400'; 
        evidenceStroke = 'stroke-blue-400';
    }
    if (numericEvidenceScore > 85) { 
        evidenceLabel = 'Ironclad'; 
        evidenceColor = 'text-emerald-400'; 
        evidenceStroke = 'stroke-emerald-400';
    }

    // Top Store Calculation
    const topStoreEntry = Object.entries(storeTotals).sort((a, b) => b[1] - a[1])[0];
    const topStore = topStoreEntry ? { name: topStoreEntry[0], amount: topStoreEntry[1] } : null;

    // Avg Receipt
    const avgReceipt = receipts.length > 0 ? totalSpent / receipts.length : 0;

    return { 
        totalSpent, 
        provisionTotal,
        provisionRatio,
        categoryData, 
        luxuryTotal, 
        categoryItems,
        mostExpensiveItem,
        evidenceScore: numericEvidenceScore,
        evidenceLabel,
        evidenceColor,
        evidenceStroke,
        topStore,
        avgReceipt
    };
  }, [receipts, ageRestricted]);

  // Price Watch Logic
  const priceWatch = useMemo(() => {
    const allItems: {name: string, price: number, store: string}[] = [];
    receipts.forEach(r => {
        r.items.forEach(i => {
            if (!ageRestricted || !i.isRestricted) {
                allItems.push({ name: i.name.toLowerCase().trim(), price: i.price, store: r.storeName });
            }
        })
    });
    const grouped: Record<string, {store: string, price: number}[]> = {};
    allItems.forEach(item => {
        if (!grouped[item.name]) grouped[item.name] = [];
        grouped[item.name].push({ store: item.store, price: item.price });
    });
    const opportunities: { item: string, cheaperStore: string, cheaperPrice: number, expensiveStore: string, expensivePrice: number, savings: number }[] = [];
    Object.entries(grouped).forEach(([name, occurences]) => {
        const uniqueStores = Array.from(new Set(occurences.map(o => o.store))).map(storeName => {
            return occurences.find(o => o.store === storeName)!;
        });
        if (uniqueStores.length > 1) {
            uniqueStores.sort((a, b) => a.price - b.price);
            const cheapest = uniqueStores[0];
            const mostExpensive = uniqueStores[uniqueStores.length - 1];
            if (mostExpensive.price > cheapest.price) {
                opportunities.push({
                    item: name,
                    cheaperStore: cheapest.store,
                    cheaperPrice: cheapest.price,
                    expensiveStore: mostExpensive.store,
                    expensivePrice: mostExpensive.price,
                    savings: mostExpensive.price - cheapest.price
                });
            }
        }
    });
    return opportunities.sort((a, b) => b.savings - a.savings).slice(0, 3);
  }, [receipts, ageRestricted]);

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
             <div className="bg-surface border border-slate-700 rounded-full h-8 w-8 flex items-center justify-center">
                 <Calendar className="text-slate-400 w-4 h-4" />
             </div>
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
                            {metrics.provisionRatio.toFixed(0)}% of Total Spend
                        </span>
                        <span className="text-indigo-200 text-xs">on essentials</span>
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

        {/* 2. Evidence Strength (Square) - QUANTIFIED GAUGE */}
        <div className="col-span-1 bg-surface border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl"></div>
             <div className="flex items-center gap-2 mb-2 z-10 relative">
                 <FileText className={`${metrics.evidenceColor} w-4 h-4`} />
                 <span className="text-slate-400 text-xs font-medium">Log Strength</span>
             </div>
             
             <div className="flex flex-col justify-end h-full z-10 relative">
                 <div className="flex items-end justify-between">
                     <div>
                        <span className={`text-xl font-bold tracking-tight block ${metrics.evidenceColor}`}>
                            {metrics.evidenceLabel}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1">{receipts.length} verified logs</p>
                     </div>
                     
                     {/* Radial Progress Gauge (SVG) */}
                     <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                strokeDasharray={2 * Math.PI * 20}
                                strokeDashoffset={2 * Math.PI * 20 * (1 - metrics.evidenceScore / 100)}
                                className={`${metrics.evidenceStroke} transition-all duration-1000 ease-out`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-[10px] font-bold text-white">{metrics.evidenceScore}</span>
                     </div>
                 </div>
             </div>
        </div>

        {/* 3. Deal Alerts / Opportunities */}
        <div className="col-span-1 bg-surface border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl"></div>
             <div className="flex items-center gap-2 mb-2">
                 <Sparkles className="text-amber-400 w-4 h-4" />
                 <span className="text-slate-400 text-xs font-medium">Opportunities</span>
             </div>
             <div>
                 <span className="text-xl font-bold text-white tracking-tight">
                    {priceWatch.length}
                 </span>
                 <p className="text-[10px] text-slate-500 mt-1">Potential savings found</p>
             </div>
        </div>

        {/* 4. Quick Stats (New Boxes replacing Graph) */}
        <div className="col-span-1 bg-surface border border-slate-700/50 rounded-2xl p-4">
             <div className="flex items-center gap-2 mb-2">
                 <Calculator className="text-blue-400 w-4 h-4" />
                 <span className="text-slate-400 text-xs font-medium">Avg. Log</span>
             </div>
             <p className="text-lg font-bold text-white tracking-tight">€{metrics.avgReceipt.toFixed(0)}</p>
        </div>

        <div className="col-span-1 bg-surface border border-slate-700/50 rounded-2xl p-4">
             <div className="flex items-center gap-2 mb-2">
                 <Store className="text-purple-400 w-4 h-4" />
                 <span className="text-slate-400 text-xs font-medium">Top Store</span>
             </div>
             <p className="text-lg font-bold text-white tracking-tight truncate">
                {metrics.topStore ? metrics.topStore.name.substring(0,8) : 'N/A'}
             </p>
        </div>

        {/* 5. Category Breakdown (Progress Bars replacing Pie Chart) */}
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

        {/* 6. Smart Suggestions (Contextual) */}
        {priceWatch.length > 0 && (
            <div className="col-span-2 bg-gradient-to-r from-emerald-900/30 to-emerald-800/10 border border-emerald-500/20 rounded-2xl p-4">
                 <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="text-emerald-400 w-4 h-4" />
                    <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Top Saving Opportunity</h3>
                 </div>
                 <div className="flex justify-between items-center">
                     <div>
                         <p className="text-slate-200 text-sm font-medium">{priceWatch[0].item}</p>
                         <p className="text-[10px] text-slate-400">
                             Buy at <span className="text-emerald-400">{priceWatch[0].cheaperStore}</span> instead of {priceWatch[0].expensiveStore}
                         </p>
                     </div>
                     <div className="text-right">
                         <span className="block text-lg font-bold text-white">Save €{priceWatch[0].savings.toFixed(2)}</span>
                     </div>
                 </div>
            </div>
        )}

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
                             // Simple Bar Visualization for Drilldown
                             const maxPrice = Math.max(...drillDown.items.map(i => i.price));
                             const width = (item.price / maxPrice) * 100;
                             
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