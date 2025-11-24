import React, { useState } from 'react';
import { User as UserIcon, Users, Bell, Shield, LogOut, ChevronRight, Wallet, Lock, FileDown, Database, Star } from 'lucide-react';
import { Receipt, User, SubscriptionTier } from '../types';
import SubscriptionModal from './SubscriptionModal';

interface SettingsProps {
    monthlyBudget: number;
    setMonthlyBudget: (budget: number) => void;
    ageRestricted: boolean;
    setAgeRestricted: (restricted: boolean) => void;
    user: User;
    onSignOut: () => void;
    onUpgrade: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    monthlyBudget, 
    setMonthlyBudget, 
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

    const receiptsData = localStorage.getItem('smartspend_receipts');
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
        link.setAttribute("download", `smartspend_export_${new Date().toISOString().split('T')[0]}.csv`);
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
    <div className="flex flex-col h-full px-4 pt-4 pb-24 overflow-y-auto no-scrollbar">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-surface p-4 rounded-2xl border border-slate-700 flex items-center gap-4 mb-6 relative overflow-hidden">
        {user.tier === SubscriptionTier.PRO && (
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500/10 to-transparent w-2/3 h-full pointer-events-none"></div>
        )}
        
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 z-10 ${
            user.tier === SubscriptionTier.PRO 
            ? 'bg-gradient-to-br from-amber-400 to-orange-600 border-amber-500/20' 
            : 'bg-slate-700 border-slate-600'
        }`}>
            {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="z-10 flex-1">
            <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold">{user.name}</h3>
                {user.tier === SubscriptionTier.PRO ? (
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm">PRO</span>
                ) : (
                    <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-medium">FREE</span>
                )}
            </div>
            <p className="text-slate-400 text-xs truncate max-w-[180px]">{user.email}</p>
        </div>
      </div>

      {/* Subscription Upsell (If Free) */}
      {user.tier === SubscriptionTier.FREE && (
          <button 
            onClick={() => setShowPaywall(true)}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 p-4 rounded-2xl shadow-lg mb-6 flex items-center justify-between group"
          >
              <div className="text-left">
                  <p className="text-white font-bold text-sm flex items-center gap-1.5">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      Upgrade to Pro
                  </p>
                  <p className="text-indigo-100 text-xs mt-0.5">Unlock Parental Controls & Exports</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg text-white group-hover:bg-white/30 transition-colors">
                  <ChevronRight size={16} />
              </div>
          </button>
      )}

      <div className="space-y-6">
         {/* Spending Configuration */}
         <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Finances</h4>
            <div className="bg-surface rounded-xl overflow-hidden border border-slate-700/50">
                <div className="w-full flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg text-primary">
                            <Wallet size={18} />
                        </div>
                        <div>
                             <span className="text-slate-200 text-sm font-medium block">Monthly Budget (€)</span>
                        </div>
                    </div>
                    <input 
                        type="number" 
                        value={monthlyBudget}
                        onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-white focus:outline-none focus:border-primary text-sm font-mono"
                    />
                </div>
            </div>
        </section>

        {/* Pro Features */}
        <section>
            <div className="flex items-center justify-between mb-3 ml-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pro Controls</h4>
                {user.tier === SubscriptionTier.PRO && (
                    <div className="flex items-center gap-1">
                        <Shield size={10} className="text-amber-500" />
                        <span className="text-[10px] text-amber-500 font-medium">Active</span>
                    </div>
                )}
            </div>
            
            <div className="bg-surface rounded-xl overflow-hidden border border-slate-700/50">
                 <div className="w-full flex items-center justify-between p-4 border-b border-slate-800">
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${user.tier === SubscriptionTier.PRO ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-500'}`}>
                            <Lock size={18} />
                        </div>
                        <div className={user.tier !== SubscriptionTier.PRO ? 'opacity-50' : ''}>
                            <span className="text-slate-200 text-sm font-medium block">Parental Control</span>
                            <span className="text-xs text-slate-500 block">Omit restricted items (18+)</span>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={ageRestricted}
                            onChange={handleToggleRestricted}
                        />
                        <div className={`w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${user.tier === SubscriptionTier.PRO ? 'peer-checked:bg-rose-500' : ''}`}></div>
                    </label>
                </div>
                
                 {/* Data Export (Proof) */}
                <button 
                    onClick={handleExportData}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors border-b border-slate-800"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${user.tier === SubscriptionTier.PRO ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                            <FileDown size={18} />
                        </div>
                        <div className={`text-left ${user.tier !== SubscriptionTier.PRO ? 'opacity-50' : ''}`}>
                            <span className="text-slate-200 text-sm font-medium block">Export Data</span>
                            <span className="text-xs text-slate-500">Download CSV for proof</span>
                        </div>
                    </div>
                    {user.tier !== SubscriptionTier.PRO ? <Lock size={14} className="text-slate-500" /> : <ChevronRight className="text-slate-600" size={16} />}
                </button>
            </div>
        </section>

        {/* General Settings */}
        <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">General</h4>
            <div className="bg-surface rounded-xl overflow-hidden border border-slate-700/50">
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                            <Users size={18} />
                        </div>
                        <div className="text-left">
                            <span className="text-slate-200 text-sm font-medium block">Family Group</span>
                            <span className="text-xs text-slate-500">Manage members</span>
                        </div>
                    </div>
                    <span className="bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">Coming Soon</span>
                </button>
                 <button className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors border-b border-slate-800">
                    <div className="flex items-center gap-3">
                         <div className="bg-slate-500/20 p-2 rounded-lg text-slate-400">
                            <Database size={18} />
                        </div>
                        <div className="text-left">
                            <span className="text-slate-200 text-sm font-medium block">Privacy & Data</span>
                        </div>
                    </div>
                     <ChevronRight className="text-slate-600" size={16} />
                </button>
                <div className="w-full flex items-center justify-between p-4 border-b border-slate-800">
                     <div className="flex items-center gap-3">
                        <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400">
                            <Bell size={18} />
                        </div>
                        <span className="text-slate-200 text-sm font-medium">Notifications</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>
        </section>

        <button 
            onClick={onSignOut}
            className="w-full py-4 text-red-400 text-sm font-medium hover:bg-red-500/5 rounded-xl transition-colors flex items-center justify-center gap-2"
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