
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Users, Bell, Shield, LogOut, ChevronRight, Wallet, Lock, FileDown, Database, Star, PieChart, Tag, Plus, Trash2, X as XIcon, Calendar, RefreshCw, FileText, Target, Trophy, Crown, AlertTriangle, AlertOctagon, Sparkles, Check, LifeBuoy } from 'lucide-react';
import { Receipt, User, SubscriptionTier, Category, CategoryDefinition, RecurringExpense, Goal, GoalType, CustodyDay } from '../types';
import { generateDemoData } from '../utils/demoData';
import { exportService } from '../services/exportService';
import { PDFService } from '../services/pdfService';
import { HapticsService } from '../services/haptics';
import { Preferences } from '@capacitor/preferences';
import SubscriptionModal from './SubscriptionModal';

import { useData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';

interface SettingsProps {
    // Most props removed.
    // onSignOut, onUpgrade logic can be handled inside via context or kept as props if they are just triggers.
    // Since App.tsx passed simple handlers, we can now use authService directly or context methods.
    // However, keeping simple UI callback props is fine if they coordinate view changes (like changing view after sign out).
    // App.tsx handleSignOut also cleared receipts/user state. Context `signOut` should handle user state.
    // Data context clearing might need a separate call.
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
};

const Settings: React.FC<SettingsProps> = () => {
    const {
        monthlyBudget, setMonthlyBudget,
        categoryBudgets, setCategoryBudgets,
        ageRestricted, setAgeRestricted,
        childSupportMode, setChildSupportMode,
        helpEnabled, setHelpEnabled,
        categories, setCategories,
        recurringExpenses, setRecurringExpenses,
        goals, setGoals,
        setReceipts, // For deleteAll
        generateDummyData,
        ambientMode, setAmbientMode,
        showGlobalAmbient, setShowGlobalAmbient,
        setCustodyDays,
        deleteAllReceipts,
        isProMode, setIsProMode
    } = useData();

    const { user, updateUser, signOut: contextSignOut, upgradeToPro } = useUser();

    // Map context values to names used in the component
    const onSeedData = generateDummyData;
    const onDeleteAll = deleteAllReceipts;
    const onUpgrade = upgradeToPro;
    const onUpdateUser = updateUser;
    const onSignOut = async () => {
        await contextSignOut();
    };


    const [showPaywall, setShowPaywall] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6'); // Default Blue

    // Temp state for Profile Editing
    const [tempNickname, setTempNickname] = useState(user?.nickname || user?.name || '');
    const [tempAvatar, setTempAvatar] = useState<string | undefined>(user?.avatarUrl || undefined);

    const [showRecurringModal, setShowRecurringModal] = useState(false);
    const [newExpenseName, setNewExpenseName] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState('');
    const [newExpenseCategory, setNewExpenseCategory] = useState('');
    const [newExpenseFrequency, setNewExpenseFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);

    const [showLegalExportModal, setShowLegalExportModal] = useState(false);
    const [exportStartDate, setExportStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);

    const handleAddRecurring = () => {
        if (!newExpenseName || !newExpenseAmount || !newExpenseCategory) return;

        const newExpense: RecurringExpense = {
            id: Date.now().toString(),
            name: newExpenseName,
            amount: parseFloat(newExpenseAmount),
            category: newExpenseCategory,
            frequency: newExpenseFrequency,
            nextDueDate: new Date(newExpenseDate).toISOString(),
            autoAdd: true
        };

        setRecurringExpenses([...recurringExpenses, newExpense]);
        setShowRecurringModal(false);
        setNewExpenseName('');
        setNewExpenseAmount('');
    };

    const handleDeleteRecurring = (id: string) => {
        if (confirm('Delete this recurring expense?')) {
            setRecurringExpenses(recurringExpenses.filter(e => e.id !== id));
        }
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        const newId = newCategoryName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newCategory: CategoryDefinition = {
            id: newId,
            name: newCategoryName,
            color: newCategoryColor
        };
        setCategories([...categories, newCategory]);
        setNewCategoryName('');
        setShowCategoryModal(false);
    };

    const handleDeleteCategory = (id: string) => {
        if (confirm('Are you sure you want to delete this category?')) {
            setCategories(categories.filter(c => c.id !== id));
        }
    };

    const handleToggleRestricted = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (user?.tier !== SubscriptionTier.PRO && !e.target.checked === false) { // Trying to turn ON
            e.preventDefault();
            setShowPaywall(true);
        } else {
            setAgeRestricted(e.target.checked);
        }
    };

    const handleExportData = async () => {
        if (user?.tier !== SubscriptionTier.PRO) {
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
            let csvContent = "Date,Store,Category,Item Name,Price,Restricted\n";

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

            // Native Export using Capacitor Filesystem & Share
            const fileName = `truetrack_export_${new Date().toISOString().split('T')[0]}.csv`;

            try {
                const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
                const { Share } = await import('@capacitor/share');

                // Write file to cache directory
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: csvContent,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8
                });

                // Share the file
                await Share.share({
                    title: 'TrueTrack Export',
                    text: 'Here is my spending data from TrueTrack.',
                    url: result.uri,
                    dialogTitle: 'Export Data'
                });

            } catch (nativeError) {
                console.warn("Native export failed, falling back to web download", nativeError);
                // Fallback for Web
                const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (e) {
            console.error("Export failed", e);
            alert("Failed to export data.");
        }
    };

    return (
        <>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 overflow-y-auto w-full max-w-md mx-auto relative pt-44 pb-24 px-4 custom-scrollbar"
            >
                <div className="pb-4 px-6 text-center">
                    <p className="text-[10px] text-slate-500 font-mono">TrueTrack v1.8 (Build {new Date().toLocaleTimeString()})</p>
                </div>

                {/* Content Container - No Overflow Clipping for Shadows/Badges */}
                <div className="relative z-10 p-3 flex flex-col gap-3">
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => {
                            console.log('Opening Edit Profile Modal');
                            setTempNickname(user?.nickname || user?.name || '');
                            setTempAvatar(user?.avatarUrl);
                            setShowAvatarModal(true);
                        }}
                    >
                        {/* Avatar Section */}
                        <div className="relative shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ring-1 ring-white/10 z-10 relative ${user?.tier === SubscriptionTier.PRO
                                ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                : 'bg-slate-700'
                                }`}>
                                {user?.avatarUrl ? (
                                    <img key={user.avatarUrl} src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    user?.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            {/* Editor Badge - Pop out effect */}
                            <div className="absolute -bottom-2 -right-2 bg-surface p-1.5 rounded-full border border-white/10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 scale-75 group-hover:scale-100 duration-300">
                                <div className="bg-slate-700 rounded-full p-1">
                                    <Plus size={10} className="text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Text Info */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="text-white font-heading font-bold tracking-tight text-lg truncate group-hover:text-primary transition-colors">{user?.nickname || user?.name}</h3>
                                {user?.tier === SubscriptionTier.PRO ? (
                                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm tracking-wide shrink-0">PRO</span>
                                ) : (
                                    <span className="bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide shrink-0">FREE</span>
                                )}
                            </div>
                            <p className="text-slate-400 text-xs truncate font-medium opacity-80">{user?.email}</p>

                            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Edit Profile</span>
                                <ChevronRight size={10} className="text-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Budget Slider Integration */}
                    <div className="w-full bg-black/20 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Wallet size={12} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Monthly Budget</span>
                            </div>
                            <span className="text-white font-mono font-bold text-xs tabular-nums">€{monthlyBudget}</span>
                        </div>
                        <input
                            type="range"
                            min="100"
                            max="5000"
                            step="50"
                            value={monthlyBudget}
                            onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>
                </div>

                {/* Subscription Upsell (If Free) */}
                {user?.tier === SubscriptionTier.FREE && (
                    <button
                        onClick={() => setShowPaywall(true)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 p-4 rounded-2xl shadow-lg mb-6 flex items-center justify-between group border border-white/10 transition-all duration-300 hover:shadow-[0_0_25px_rgba(79,70,229,0.25)]"
                    >
                        <div className="text-left">
                            <p className="text-white font-heading font-bold text-sm flex items-center gap-1.5">
                                <Star size={14} className="fill-yellow-400 text-yellow-400 animate-pulse" />
                                Upgrade to Pro
                            </p>
                            <p className="text-indigo-100 text-xs mt-0.5 font-medium">Unlock Ambient, Co-Parenting, Category Budgets, Goals & Habits</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-xl text-white group-hover:bg-white/30 transition-colors duration-300">
                            <ChevronRight size={16} />
                        </div>
                    </button>
                )}

                <div className="space-y-6">
                    {/* Pro Controls (Moved to Top & Consolidated) */}
                    <section>
                        <div className="flex items-center justify-between mb-3 ml-1">
                            <h4 className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">Pro Controls</h4>
                            {user?.tier === SubscriptionTier.PRO && (
                                <div className="flex items-center gap-1">
                                    <Shield size={10} className="text-amber-500" />
                                    <span className="text-[10px] text-amber-500 font-bold tracking-wide">Active</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-surface rounded-2xl overflow-hidden border border-white/5 shadow-sm hover:border-white/10 transition-all duration-300">
                            {/* Co-Parenting Features */}
                            <div className="w-full flex items-center justify-between p-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${childSupportMode ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <span className="text-slate-200 text-sm font-bold block">Co-Parenting Features</span>
                                        <span className="text-xs text-slate-500 font-medium block">Enable provision analysis & support</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={childSupportMode}
                                        onChange={(e) => {
                                            HapticsService.impactMedium();
                                            setChildSupportMode(e.target.checked);
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 peer-checked:shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
                                </label>
                            </div>

                            {/* Enable Goals/Pro Features */}
                            <div className="w-full flex items-center justify-between p-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${isProMode ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                                        <Target size={18} />
                                    </div>
                                    <div>
                                        <span className="text-slate-200 text-sm font-bold block">Goal Tracking</span>
                                        <span className="text-xs text-slate-500 font-medium block">Monitor habits & limits (Pro)</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isProMode}
                                        onChange={(e) => {
                                            if (user?.tier !== SubscriptionTier.PRO) {
                                                setShowPaywall(true);
                                                return;
                                            }
                                            HapticsService.impactMedium();
                                            setIsProMode(e.target.checked);
                                        }}
                                    />
                                    <div className={`w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${user?.tier === SubscriptionTier.PRO ? 'peer-checked:bg-purple-500' : ''}`}></div>
                                </label>
                            </div>

                            {/* Help & Support (Pro) */}
                            {setHelpEnabled && (
                                <div className={`w-full flex items-center justify-between p-4 border-b border-white/5 ${user?.tier !== SubscriptionTier.PRO ? 'opacity-60' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${helpEnabled ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>
                                            <LifeBuoy size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-200 text-sm font-bold block">Life Support</span>
                                                {user?.tier !== SubscriptionTier.PRO && <Lock size={12} className="text-amber-500" />}
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium block">Crisis resources & aid</span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={helpEnabled}
                                            onChange={(e) => {
                                                if (user?.tier !== SubscriptionTier.PRO) {
                                                    setShowPaywall(true);
                                                    return;
                                                }
                                                HapticsService.impactMedium();
                                                setHelpEnabled(e.target.checked);
                                            }}
                                        />
                                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 peer-checked:shadow-[0_0_15px_rgba(244,63,94,0.3)]"></div>
                                    </label>
                                </div>
                            )}

                            {/* Ambient Mode Toggle */}
                            {setAmbientMode && (
                                <div className={`w-full flex items-center justify-between p-4 border-b border-white/5 ${user?.tier !== SubscriptionTier.PRO ? 'opacity-60' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${ambientMode ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                                            <Star size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-200 text-sm font-bold block">Ambient Effects</span>
                                                {user?.tier !== SubscriptionTier.PRO && <Lock size={12} className="text-amber-500" />}
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium block">Enable dynamic lighting effects</span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={ambientMode}
                                            onChange={(e) => {
                                                if (user?.tier !== SubscriptionTier.PRO) {
                                                    setShowPaywall(true);
                                                    return;
                                                }
                                                HapticsService.impactMedium();
                                                setAmbientMode(e.target.checked);
                                            }}
                                        />
                                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 peer-checked:shadow-[0_0_15px_rgba(168,85,247,0.3)]"></div>
                                    </label>
                                </div>
                            )}

                            {/* Global App Background Toggle (Sub-option) */}
                            {setAmbientMode && setShowGlobalAmbient && ambientMode && (
                                <div className={`w-full flex items-center justify-between p-4 border-b border-white/5 pl-8 bg-white/5 ${user?.tier !== SubscriptionTier.PRO ? 'opacity-60' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${showGlobalAmbient ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                            <Sparkles size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-200 text-sm font-bold block">App Background</span>
                                                {user?.tier !== SubscriptionTier.PRO && <Lock size={12} className="text-amber-500" />}
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium block">Show effect on main screens</span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={showGlobalAmbient}
                                            onChange={(e) => {
                                                if (user?.tier !== SubscriptionTier.PRO) {
                                                    setShowPaywall(true);
                                                    return;
                                                }
                                                HapticsService.impactMedium();
                                                setShowGlobalAmbient(e.target.checked);
                                            }}
                                        />
                                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 peer-checked:shadow-[0_0_15px_rgba(99,102,241,0.3)]"></div>
                                    </label>
                                </div>
                            )}

                            {/* Parental Control */}
                            <div className="w-full flex items-center justify-between p-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${user?.tier === SubscriptionTier.PRO ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>
                                        <Lock size={18} />
                                    </div>
                                    <div className={user?.tier !== SubscriptionTier.PRO ? 'opacity-50' : ''}>
                                        <span className="text-slate-200 text-sm font-bold block">Parental Control</span>
                                        <span className="text-xs text-slate-500 font-medium block">Omit restricted items (18+)</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={ageRestricted}
                                        onChange={(e) => {
                                            HapticsService.impactMedium();
                                            handleToggleRestricted(e);
                                        }}
                                    />
                                    <div className={`w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${user?.tier === SubscriptionTier.PRO ? 'peer-checked:bg-rose-500 peer-checked:shadow-[0_0_15px_rgba(244,63,94,0.3)]' : ''}`}></div>
                                </label>
                            </div>

                            {/* Data Export (Proof) */}
                            <button
                                onClick={handleExportData}
                                className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${user?.tier === SubscriptionTier.PRO ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                        <FileDown size={18} />
                                    </div>
                                    <div className={`text-left ${user?.tier !== SubscriptionTier.PRO ? 'opacity-50' : ''}`}>
                                        <span className="text-slate-200 text-sm font-bold block">Export Data</span>
                                        <span className="text-xs text-slate-500 font-medium">Download CSV for proof</span>
                                    </div>
                                </div>
                            </button>

                            {/* Category Budgets (Pro) */}
                            <div className={`w-full p-4 border-b border-white/5 ${user?.tier !== SubscriptionTier.PRO ? 'opacity-60' : ''}`}>
                                <button
                                    onClick={() => {
                                        if (user?.tier !== SubscriptionTier.PRO) {
                                            setShowPaywall(true);
                                            return;
                                        }
                                        const el = document.getElementById('category-budgets');
                                        if (el) el.classList.toggle('hidden');
                                    }}
                                    className="w-full flex items-center justify-between transition-colors duration-300"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
                                            <PieChart size={18} />
                                        </div>
                                        <div className="text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-200 text-sm font-bold block">Category Budgets</span>
                                                {user?.tier !== SubscriptionTier.PRO && <Lock size={12} className="text-amber-500" />}
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium">Set limits per category</span>
                                        </div>
                                    </div>
                                    {user?.tier !== SubscriptionTier.PRO ? <Lock size={14} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-600" />}
                                </button>

                                <div id="category-budgets" className="hidden mt-4 space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 w-24">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                                <span className="text-slate-400 text-xs font-medium truncate">{cat.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1000"
                                                    step="10"
                                                    value={categoryBudgets[cat.id] || 0}
                                                    onChange={(e) => setCategoryBudgets({ ...categoryBudgets, [cat.id]: Number(e.target.value) })}
                                                    className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                                />
                                                <span className="text-white font-mono text-xs w-12 text-right">€{categoryBudgets[cat.id] || 0}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Goals & Habits (Pro) */}
                            <div className={`w-full p-4 ${user?.tier !== SubscriptionTier.PRO ? 'opacity-60' : ''}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-500/20 p-2 rounded-xl text-purple-400">
                                            <Target size={18} />
                                        </div>
                                        <div className="text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-200 text-sm font-bold block">Goals & Habits</span>
                                                {user?.tier !== SubscriptionTier.PRO && <Lock size={12} className="text-amber-500" />}
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium">Track lifestyle habits</span>
                                        </div>
                                    </div>
                                    {user?.tier !== SubscriptionTier.PRO && <Lock size={14} className="text-slate-500" />}
                                </div>

                                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                    {goals.map(goal => (
                                        <div
                                            key={goal.id}
                                            className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5"
                                            onClick={() => {
                                                if (user?.tier !== SubscriptionTier.PRO) {
                                                    setShowPaywall(true);
                                                } else {
                                                    HapticsService.impactLight();
                                                    const updatedGoals = goals.map(g =>
                                                        g.id === goal.id ? { ...g, isEnabled: !g.isEnabled } : g
                                                    );
                                                    setGoals(updatedGoals);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${goal.isEnabled ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                                                    {goal.type === GoalType.JUNK_FOOD && <span className="text-lg">🍔</span>}
                                                    {goal.type === GoalType.ALCOHOL && <span className="text-lg">🍺</span>}
                                                    {goal.type === GoalType.SMOKING && <span className="text-lg">🚬</span>}
                                                    {goal.type === GoalType.GAMING && <span className="text-lg">🎮</span>}
                                                    {goal.type === GoalType.GAMBLING && <span className="text-lg">🎲</span>}
                                                    {goal.type === GoalType.CAFFEINE && <span className="text-lg">☕</span>}
                                                    {goal.type === GoalType.SUGAR && <span className="text-lg">🍩</span>}
                                                    {goal.type === GoalType.ONLINE_SHOPPING && <span className="text-lg">🛍️</span>}
                                                    {goal.type === GoalType.FAST_FASHION && <span className="text-lg">👗</span>}
                                                    {goal.type === GoalType.RIDE_SHARING && <span className="text-lg">🚕</span>}
                                                    {goal.type === GoalType.STREAMING && <span className="text-lg">📺</span>}
                                                    {goal.type === GoalType.SAVINGS && <span className="text-lg">💰</span>}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${goal.isEnabled ? 'text-white' : 'text-slate-400'}`}>{goal.name}</p>
                                                    <p className="text-[10px] text-slate-500">
                                                        {goal.isEnabled ? `Tracking ${goal.streak} day streak` : 'Enable to track habits'}
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={goal.isEnabled}
                                                    readOnly
                                                    onChange={() => {
                                                        // Logic moved to parent click
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Category Management */}
                    <section>
                        <h4 className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Categories</h4>
                        <div className="bg-surface rounded-2xl overflow-hidden border border-white/5 shadow-sm hover:border-white/10 transition-all duration-300">
                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300 border-b border-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-500/20 p-2 rounded-xl text-purple-400">
                                        <Tag size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-slate-200 text-sm font-bold block">Manage Categories</span>
                                        <span className="text-xs text-slate-500 font-medium">Add or remove custom tags</span>
                                    </div>
                                </div>
                                <div className="bg-slate-800 p-1.5 rounded-lg text-slate-400">
                                    <Plus size={16} />
                                </div>
                            </button>

                            <div className="p-4 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></div>
                                            <span className="text-slate-200 text-sm font-medium">{cat.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="text-slate-600 hover:text-red-400 transition-colors p-2"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
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

                            {/* Comprehensive Seed Data (Dev) */}
                            {/* Comprehensive Seed Data (Dev) */}
                            {onSeedData && (
                                <div className="border-b border-white/5">
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById('seed-options');
                                            if (el) el.classList.toggle('hidden');
                                        }}
                                        className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
                                                <Database size={18} />
                                            </div>
                                            <div className="text-left">
                                                <span className="text-slate-200 text-sm font-bold block">Seed Data (Dev)</span>
                                                <span className="text-xs text-slate-500 font-medium">Generate scenario data</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-600" size={16} />
                                    </button>

                                    <div id="seed-options" className="hidden bg-black/20 p-2 space-y-1">
                                        {[
                                            { label: 'Good Scenario', type: 'good', color: 'text-emerald-400' },
                                            { label: 'Average Scenario', type: 'average', color: 'text-blue-400' },
                                            { label: 'Bad Scenario', type: 'bad', color: 'text-red-400' }
                                        ].map(opt => (
                                            <button
                                                key={opt.type}
                                                onClick={() => {
                                                    if (confirm(`Overwrite data with "${opt.label}"?`)) {
                                                        // Pass the scenario type to the callback
                                                        // Note: We need to update the prop type in SettingsProps first, or cast it for now
                                                        (onSeedData as any)(opt.type);
                                                    }
                                                }}
                                                className={`w-full text-left p-3 rounded-lg hover:bg-white/5 text-xs font-bold uppercase tracking-wider ${opt.color}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={async () => {
                                    try {
                                        const savedReceipts = localStorage.getItem('truetrack_receipts');
                                        if (!savedReceipts) {
                                            alert('No data to export.');
                                            return;
                                        }
                                        const receipts = JSON.parse(savedReceipts) as Receipt[];
                                        const csv = exportService.generateCSV(receipts);
                                        const filename = `truetrack_export_${new Date().toISOString().split('T')[0]}.csv`;
                                        await exportService.downloadCSV(csv, filename);
                                    } catch (e) {
                                        console.error('Export failed:', e);
                                        alert('Failed to export data.');
                                    }
                                }}
                                className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300 border-b border-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-500/20 p-2 rounded-xl text-purple-400">
                                        <FileDown size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-slate-200 text-sm font-bold block">Export Data</span>
                                        <span className="text-xs text-slate-500 font-medium">Download CSV backup</span>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-600" size={16} />
                            </button>

                            <button
                                onClick={() => setShowLegalExportModal(true)}
                                className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300 border-b border-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                                        <FileText size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-slate-200 text-sm font-bold block">Legal Export (PDF)</span>
                                        <span className="text-xs text-slate-500 font-medium">Generate formal report</span>
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
                                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:shadow-[0_0_15px_rgba(56,189,248,0.2)]"></div>
                                </label>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Danger Zone - Main Page Footer */}
                <div className="mt-8 mb-24 space-y-3">
                    {/* Sign Out Button */}
                    {/* Sign Out Button */}
                    <button
                        onClick={() => {
                            HapticsService.impactHeavy();
                            if (confirm('Are you sure you want to sign out?')) {
                                onSignOut();
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all font-bold text-sm shadow-sm mb-8"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>

                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 mt-8">Dev Tools</p>



                    <button
                        onClick={async () => {
                            const { keys } = await Preferences.keys();
                            if (keys.length === 0) {
                                alert("Storage Dump: EMPTY (No keys found)");
                                return;
                            }

                            // Dump all values
                            let dump = "Storage Keys:\n";
                            for (const key of keys) {
                                // truncate key for readability
                                dump += `- ${key}\n`;
                            }
                            alert(dump);
                        }}
                        className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mb-4"
                    >
                        <Database size={18} />
                        Debug Storage (List Keys)
                    </button>

                    <button
                        onClick={onDeleteAll}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} />
                        Delete All Data
                    </button>
                </div>
            </motion.div >
            {/* End of Main Content Scroll View */}

            {/* Modals */}
            <SubscriptionModal
                isOpen={showPaywall}
                onClose={() => setShowPaywall(false)}
                onUpgrade={() => {
                    onUpgrade();
                    setShowPaywall(false);
                }}
            />

            {/* Add Category Modal */}
            {
                showCategoryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                            >
                                <XIcon size={24} />
                            </button>

                            <h2 className="text-xl font-heading font-bold text-white mb-6">Add New Category</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Category Name</label>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="e.g. Gaming, Pets, Gifts"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Color Tag</label>
                                    <div className="flex gap-3 flex-wrap">
                                        {['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setNewCategoryColor(color)}
                                                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${newCategoryColor === color ? 'ring-2 ring-white scale-110' : ''}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddCategory}
                                    disabled={!newCategoryName.trim()}
                                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all mt-4"
                                >
                                    Create Category
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Recurring Expense Modal */}
            {
                showRecurringModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setShowRecurringModal(false)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                            >
                                <XIcon size={24} />
                            </button>

                            <h2 className="text-xl font-heading font-bold text-white mb-6">Add Subscription</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={newExpenseName}
                                        onChange={(e) => setNewExpenseName(e.target.value)}
                                        placeholder="e.g. Netflix, Gym"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Amount (€)</label>
                                        <input
                                            type="number"
                                            value={newExpenseAmount}
                                            onChange={(e) => setNewExpenseAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Frequency</label>
                                        <select
                                            value={newExpenseFrequency}
                                            onChange={(e) => setNewExpenseFrequency(e.target.value as any)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors appearance-none"
                                        >
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Category</label>
                                    <select
                                        value={newExpenseCategory}
                                        onChange={(e) => setNewExpenseCategory(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors appearance-none"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Next Due Date</label>
                                    <input
                                        type="date"
                                        value={newExpenseDate}
                                        onChange={(e) => setNewExpenseDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>

                                <button
                                    onClick={handleAddRecurring}
                                    disabled={!newExpenseName || !newExpenseAmount || !newExpenseCategory}
                                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all mt-4"
                                >
                                    Add Subscription
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Legal Export Modal */}
            {
                showLegalExportModal && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setShowLegalExportModal(false)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                            >
                                <XIcon size={24} />
                            </button>

                            <div className="mb-6">
                                <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                                    <FileText className="text-blue-400" />
                                    Legal Export
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">Generate a PDF report for legal/custody purposes.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={exportStartDate}
                                        onChange={(e) => setExportStartDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={exportEndDate}
                                        onChange={(e) => setExportEndDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <button
                                    onClick={async () => {
                                        try {
                                            const savedReceipts = localStorage.getItem('truetrack_receipts');
                                            if (!savedReceipts) {
                                                alert('No data to export.');
                                                return;
                                            }
                                            const receipts = JSON.parse(savedReceipts) as Receipt[];

                                            PDFService.generateLegalReport(
                                                receipts,
                                                user,
                                                { start: new Date(exportStartDate), end: new Date(exportEndDate) }
                                            );
                                            setShowLegalExportModal(false);
                                        } catch (e) {
                                            console.error('PDF Export failed:', e);
                                            alert('Failed to generate PDF.');
                                        }
                                    }}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all mt-4 flex items-center justify-center gap-2"
                                >
                                    <FileDown size={18} />
                                    Generate PDF
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
            {/* Edit Profile Modal (Refined with Save Logic) */}
            {
                showAvatarModal && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <button
                                onClick={() => setShowAvatarModal(false)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                            >
                                <XIcon size={24} />
                            </button>

                            <div className="mb-6">
                                <h2 className="text-xl font-heading font-bold text-white">Edit Profile</h2>
                                <p className="text-slate-400 text-sm mt-1">Customize your appearance</p>
                            </div>

                            <div className="space-y-6">
                                {/* Nickname Input */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nickname</label>
                                    <input
                                        type="text"
                                        value={tempNickname}
                                        onChange={(e) => setTempNickname(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors font-medium text-lg"
                                        placeholder="Enter nickname"
                                    />
                                </div>

                                {/* Avatar Selection */}
                                <div>
                                    {/* Preview */}
                                    <div className="flex justify-center mb-6">
                                        <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden relative shadow-lg">
                                            {tempAvatar ? (
                                                <img src={tempAvatar} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-500">{tempNickname.charAt(0).toUpperCase()}</div>
                                            )}
                                        </div>
                                    </div>

                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Choose Avatar</label>

                                    {/* Create generic avatar list for selection if not using emojis */}
                                    {/* Emoji Grid */}
                                    <div className="grid grid-cols-5 gap-3 mb-4">
                                        {['👻', '🤖', '👽', '🦊', '🦁', '🐯', '🐼', '🐨', '🐷', '🐸'].map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => {
                                                    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`;
                                                    // Fix for Unicode characters (emojis) in btoa
                                                    const base64 = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgString)))}`;
                                                    setTempAvatar(base64);
                                                    HapticsService.impactLight();
                                                }}
                                                className={`aspect-square bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95 border ${tempAvatar?.includes(window.btoa(unescape(encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`)))) ? 'border-primary ring-2 ring-primary/50' : 'border-white/5 hover:border-white/20'}`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Upload Option */}
                                    <div className="relative group cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    if (file.size > 2 * 1024 * 1024) {
                                                        alert("Image too large. Please select an image under 2MB.");
                                                        return;
                                                    }
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        if (typeof reader.result === 'string') {
                                                            setTempAvatar(reader.result);
                                                        }
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="w-full bg-white/5 border border-dashed border-white/20 rounded-xl py-4 flex flex-col items-center justify-center gap-2 group-hover:bg-white/10 transition-colors">
                                            <div className="bg-slate-700 p-2 rounded-full text-slate-300 group-hover:bg-slate-600 transition-colors">
                                                <Plus size={20} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200">Upload Custom Image</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Monthly Budget Setting */}
                                <div className="pt-2 border-t border-white/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Monthly Budget</label>
                                        <span className="text-white font-mono font-bold tabular-nums">€{monthlyBudget}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="100"
                                        max="5000"
                                        step="50"
                                        value={monthlyBudget}
                                        onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-medium">
                                        <span>€100</span>
                                        <span>€5000</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-2 flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            if (onUpdateUser) {

                                                onUpdateUser({
                                                    name: tempNickname, // Sync name with nickname so it displays in UI
                                                    nickname: tempNickname,
                                                    avatarUrl: tempAvatar
                                                });
                                                HapticsService.impactMedium();
                                                setShowAvatarModal(false);
                                            } else {
                                                console.error("Settings: onUpdateUser prop is missing!");
                                            }
                                        }}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check size={18} />
                                        Save Changes
                                    </button>

                                    <button
                                        onClick={() => {
                                            setTempAvatar(undefined); // Remove avatar
                                        }}
                                        className="w-full text-slate-500 text-xs font-bold hover:text-red-400 transition-colors py-2"
                                    >
                                        Reset Avatar to Default
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </>
    );
};

export default Settings;