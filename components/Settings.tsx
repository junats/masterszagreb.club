import React, { useState } from 'react';
import { User as UserIcon, Users, Bell, Shield, LogOut, ChevronRight, Wallet, Lock, FileDown, Database, Star, PieChart } from 'lucide-react';
import { Receipt, User, SubscriptionTier, Category } from '../types';
import SubscriptionModal from './SubscriptionModal';

interface SettingsProps {
    monthlyBudget: number;
    setMonthlyBudget: (budget: number) => void;
    categoryBudgets: Record<string, number>;
    setCategoryBudgets: (budgets: Record<string, number>) => void;
    ageRestricted: boolean;
    setAgeRestricted: (restricted: boolean) => void;
    user: User;
    onSignOut: () => void;
    onUpgrade: () => void;
}

const Settings: React.FC<SettingsProps> = ({
    monthlyBudget,
    setMonthlyBudget,
    categoryBudgets,
    setCategoryBudgets,
    ageRestricted,
    setAgeRestricted,
    user,
    onSignOut,
    onUpgrade
}) => {
    const [showPaywall, setShowPaywall] = useState(false);

    const handleToggleRestricted = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (user.tier !== SubscriptionTier.PRO && !e.target.checked === false) { // Trying to turn ON
            e.preventDefault();
            setShowPaywall(true);
        } else {
            setAgeRestricted(e.target.checked);
        }
    };

    const handleExportData = () => {
        if (user.tier !== SubscriptionTier.PRO) {
            setShowPaywall(true);
            return;
        }

        const receiptsData = localStorage.getItem('truetrack_receipts');
        if (!receiptsData) {
            alert("No data to export.");
            return;
        }

        try {
            const receipts: Receipt[] = JSON.parse(receiptsData);
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Date,Store,Category,Item Name,Price,Restricted\n";

            receipts.forEach(r => {
                r.items.forEach(i => {
                    const row = [
                        r.date,
                        `"${r.storeName.replace(/"/g, '""')}"`,
                        i.category,
                        `"${i.name.replace(/"/g, '""')}"`,
                        i.price.toFixed(2),
                        i.isRestricted ? "Yes" : "No"
                    ].join(",");
                    csvContent += row + "\n";
                });
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `truetrack_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Export failed", e);
            alert("Failed to export data.");
        }
    };

    return (
        <>
            <div className="flex flex-col h-full px-4 pt-4 pb-24 overflow-y-auto no-scrollbar bg-background">
                <div className="mb-6">
                    <h1 className="text-2xl font-heading font-bold text-white tracking-tight">Settings</h1>
                    <p className="text-slate-400 text-sm font-medium">Manage your account and preferences</p>
                </div>

                {/* Profile Card */}
                <div className="bg-surface p-5 rounded-3xl border border-white/5 flex items-center gap-4 mb-6 relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:border-white/10">
                    {user.tier === SubscriptionTier.PRO && (
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500/10 to-transparent w-2/3 h-full pointer-events-none"></div>
                    )}

                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-inner ring-1 ring-white/10 z-10 ${user.tier === SubscriptionTier.PRO
                        ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-700'
                        }`}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="z-10 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-heading font-bold tracking-tight text-lg">{user.name}</h3>
                            {user.tier === SubscriptionTier.PRO ? (
                                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm tracking-wide">PRO</span>
                            ) : (
                                <span className="bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide">FREE</span>
                            )}
                        </div>
                        <p className="text-slate-400 text-xs truncate max-w-[180px] font-medium">{user.email}</p>
                    </div>
                </div>

                {/* Subscription Upsell (If Free) */}
                {user.tier === SubscriptionTier.FREE && (
                    <button
                        onClick={() => setShowPaywall(true)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 p-4 rounded-2xl shadow-lg mb-6 flex items-center justify-between group border border-white/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                    >
                        <div className="text-left">
                            <p className="text-white font-heading font-bold text-sm flex items-center gap-1.5">
                                <Star size={14} className="fill-yellow-400 text-yellow-400 animate-pulse" />
                                Upgrade to Pro
                            </p>
                            <p className="text-indigo-100 text-xs mt-0.5 font-medium">Unlock Parental Controls & Exports</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-xl text-white group-hover:bg-white/30 transition-colors duration-300">
                            <ChevronRight size={16} />
                        </div>
                    </button>
                )}

                <div className="space-y-6">
                    {/* Spending Configuration */}
                    <section>
                        <h4 className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Finances</h4>
                        <div className="bg-surface rounded-2xl overflow-hidden border border-white/5 shadow-sm hover:border-white/10 transition-all duration-300 mb-4">
                            <div className="w-full p-4 border-b border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/20 p-2 rounded-xl text-primary">
                                            <Wallet size={18} />
                                        </div>
                                        <div>
                                            <span className="text-slate-200 text-sm font-bold block">Monthly Budget</span>
                                            <span className="text-slate-500 text-xs font-medium">Target limit for all spending</span>
                                        </div>
                                    </div>
                                    <span className="text-white font-mono font-bold tabular-nums">€{monthlyBudget}</span>
                                </div>

                                {/* Range Slider */}
                                <div className="px-1 pb-1">
                                    <input
                                        type="range"
                                        min="100"
                                        max="3000"
                                        step="50"
                                        value={monthlyBudget}
                                        onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-medium">
                                        <span>€100</span>
                                        <span>€3000</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category Budgets */}
                        <div className="bg-surface rounded-2xl overflow-hidden border border-white/5 shadow-sm hover:border-white/10 transition-all duration-300">
                            <button
                                onClick={() => {
                                    const el = document.getElementById('category-budgets');
                                    if (el) el.classList.toggle('hidden');
                                }}
                                className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
                                        <PieChart size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-slate-200 text-sm font-bold block">Category Budgets</span>
                                        <span className="text-slate-500 text-xs font-medium">Set limits per category</span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-600" />
                            </button>

                            <div id="category-budgets" className="hidden border-t border-white/5 bg-black/20 p-4 space-y-3">
                                {Object.values(Category).map(cat => (
                                    <div key={cat} className="flex items-center justify-between">
                                        <span className="text-slate-400 text-xs font-medium w-24">{cat}</span>
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="range"
                                                min="0"
                                                max="1000"
                                                step="10"
                                                value={categoryBudgets[cat] || 0}
                                                onChange={(e) => setCategoryBudgets({ ...categoryBudgets, [cat]: Number(e.target.value) })}
                                                className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                            />
                                            <span className="text-white font-mono text-xs w-12 text-right">€{categoryBudgets[cat] || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Pro Features */}
                    <section>
                        <div className="flex items-center justify-between mb-3 ml-1">
                            <h4 className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">Pro Controls</h4>
                            {user.tier === SubscriptionTier.PRO && (
                                <div className="flex items-center gap-1">
                                    <Shield size={10} className="text-amber-500" />
                                    <span className="text-[10px] text-amber-500 font-bold tracking-wide">Active</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-surface rounded-2xl overflow-hidden border border-white/5 shadow-sm hover:border-white/10 transition-all duration-300">
                            <div className="w-full flex items-center justify-between p-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${user.tier === SubscriptionTier.PRO ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>
                                        <Lock size={18} />
                                    </div>
                                    <div className={user.tier !== SubscriptionTier.PRO ? 'opacity-50' : ''}>
                                        <span className="text-slate-200 text-sm font-bold block">Parental Control</span>
                                        <span className="text-xs text-slate-500 font-medium block">Omit restricted items (18+)</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={ageRestricted}
                                        onChange={handleToggleRestricted}
                                    />
                                    <div className={`w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${user.tier === SubscriptionTier.PRO ? 'peer-checked:bg-rose-500 peer-checked:shadow-[0_0_10px_rgba(244,63,94,0.4)]' : ''}`}></div>
                                </label>
                            </div>

                            {/* Data Export (Proof) */}
                            <button
                                onClick={handleExportData}
                                className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300 border-b border-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${user.tier === SubscriptionTier.PRO ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                        <FileDown size={18} />
                                    </div>
                                    <div className={`text-left ${user.tier !== SubscriptionTier.PRO ? 'opacity-50' : ''}`}>
                                        <span className="text-slate-200 text-sm font-bold block">Export Data</span>
                                        <span className="text-xs text-slate-500 font-medium">Download CSV for proof</span>
                                    </div>
                                </div>
                                {user.tier !== SubscriptionTier.PRO ? <Lock size={14} className="text-slate-500" /> : <ChevronRight className="text-slate-600" size={16} />}
                            </button>
                        </div>
                    </section>

                    {/* General Settings */}
                    <section>
                        <h4 className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">General</h4>
                        <div className="bg-surface rounded-2xl overflow-hidden border border-white/5 shadow-sm hover:border-white/10 transition-all duration-300">
                            <button className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
                                        <Users size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-slate-200 text-sm font-bold block">Family Group</span>
                                        <span className="text-xs text-slate-500 font-medium">Manage members</span>
                                    </div>
                                </div>
                                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">Soon</span>
                            </button>
                            <button className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-500/20 p-2 rounded-xl text-slate-400">
                                        <Database size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-slate-200 text-sm font-bold block">Privacy & Data</span>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-600" size={16} />
                            </button>

                            {/* Demo Data Generator */}
                            <button
                                onClick={() => {
                                    if (confirm("This will add realistic demo receipts to your history. Continue?")) {
                                        const now = new Date();
                                        const twoDaysAgo = new Date(now);
                                        twoDaysAgo.setDate(now.getDate() - 2);
                                        const fiveDaysAgo = new Date(now);
                                        fiveDaysAgo.setDate(now.getDate() - 5);

                                        // Helper to format as YYYY-MM-DD for consistency with manual entry
                                        const toLocalISO = (d: Date) => {
                                            const offset = d.getTimezoneOffset() * 60000;
                                            return new Date(d.getTime() - offset).toISOString().slice(0, 10);
                                        };

                                        const demoReceipts: Receipt[] = [
                                            {
                                                id: `demo_${Date.now()}_1`,
                                                storeName: "Tesco Extra",
                                                date: toLocalISO(now), // Today
                                                total: 85.50,
                                                scannedAt: new Date().toISOString(),
                                                type: 'receipt',
                                                items: [
                                                    { name: "Milk 2L", price: 2.50, category: Category.FOOD, quantity: 2 },
                                                    { name: "Bread", price: 1.80, category: Category.FOOD, quantity: 1 },
                                                    { name: "Diapers Size 4", price: 15.00, category: Category.NECESSITY, isChildRelated: true, quantity: 1 },
                                                    { name: "Baby Wipes", price: 3.50, category: Category.NECESSITY, isChildRelated: true, quantity: 2 },
                                                    { name: "Wine Bottle", price: 12.00, category: Category.LUXURY, isRestricted: true, quantity: 1 },
                                                    { name: "Chicken Breast", price: 8.50, category: Category.FOOD, quantity: 1 },
                                                    { name: "Vegetables", price: 5.20, category: Category.FOOD, quantity: 1 },
                                                    { name: "Lego Set", price: 25.00, category: Category.LUXURY, isChildRelated: true, quantity: 1 },
                                                    { name: "Shampoo", price: 4.50, category: Category.HEALTH, quantity: 1 },
                                                    { name: "Batteries", price: 7.50, category: Category.HOUSEHOLD, quantity: 1 }
                                                ]
                                            },
                                            {
                                                id: `demo_${Date.now()}_2`,
                                                storeName: "Shell Station",
                                                date: toLocalISO(twoDaysAgo), // 2 days ago
                                                total: 65.00,
                                                scannedAt: new Date().toISOString(),
                                                type: 'receipt',
                                                items: [
                                                    { name: "Unleaded Fuel", price: 55.00, category: Category.TRANSPORT, quantity: 1 },
                                                    { name: "Coffee", price: 3.50, category: Category.FOOD, quantity: 1 },
                                                    { name: "Sandwich", price: 6.50, category: Category.FOOD, quantity: 1 }
                                                ]
                                            },
                                            {
                                                id: `demo_${Date.now()}_3`,
                                                storeName: "Little Stars Kindergarten",
                                                date: toLocalISO(fiveDaysAgo), // 5 days ago
                                                total: 450.00,
                                                scannedAt: new Date().toISOString(),
                                                type: 'bill',
                                                referenceCode: "KINDER-2023-11",
                                                items: [
                                                    { name: "Monthly Tuition", price: 400.00, category: Category.EDUCATION, isChildRelated: true, quantity: 1 },
                                                    { name: "Meal Plan", price: 50.00, category: Category.FOOD, isChildRelated: true, quantity: 1 }
                                                ]
                                            }
                                        ];

                                        // Load existing, append demo, save
                                        const existing = localStorage.getItem('truetrack_receipts');
                                        const parsed = existing ? JSON.parse(existing) : [];
                                        const combined = [...parsed, ...demoReceipts];
                                        localStorage.setItem('truetrack_receipts', JSON.stringify(combined));

                                        // Also update Preferences for consistency if app uses it
                                        import('@capacitor/preferences').then(({ Preferences }) => {
                                            Preferences.set({ key: 'truetrack_receipts', value: JSON.stringify(combined) });
                                            alert("Demo data added! Go to History to see the charts.");
                                            window.location.reload();
                                        });
                                    }
                                }}
                                className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300 border-b border-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
                                        <Database size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-slate-200 text-sm font-bold block">Generate Demo Data</span>
                                        <span className="text-xs text-slate-500 font-medium">Populate realistic receipts</span>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-600" size={16} />
                            </button>

                            <div className="w-full flex items-center justify-between p-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="bg-amber-500/20 p-2 rounded-xl text-amber-400">
                                        <Bell size={18} />
                                    </div>
                                    <span className="text-slate-200 text-sm font-bold">Notifications</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:shadow-[0_0_10px_rgba(56,189,248,0.3)]"></div>
                                </label>
                            </div>
                        </div>
                    </section>

                    <button
                        onClick={onSignOut}
                        className="w-full py-4 text-red-400 text-sm font-bold hover:bg-red-500/10 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 border border-transparent hover:border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>

                <SubscriptionModal
                    isOpen={showPaywall}
                    onClose={() => setShowPaywall(false)}
                    onUpgrade={() => {
                        onUpgrade();
                        setShowPaywall(false);
                    }}
                />
            </div>
        </>
    );
};

export default Settings;