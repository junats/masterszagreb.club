
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Users, Bell, Shield, LogOut, ChevronRight, Wallet, Lock, FileDown, Database, Star, PieChart, Tag, Plus, Trash2, X as XIcon, Calendar, RefreshCw, FileText, Target, Trophy, Crown, AlertTriangle, AlertOctagon, Sparkles, Check, LifeBuoy, Activity } from 'lucide-react';
import { Receipt, User, SubscriptionTier, Category, CategoryDefinition, RecurringExpense, Goal, GoalType, CustodyDay } from '@common/types';
import { generateDemoData } from '../utils/demoData';
import { exportService } from '../services/exportService';
import { PDFService } from '../services/pdfService';
import { HapticsService } from '../services/haptics';
import { WidgetService } from '../services/widgetService';
import { Preferences } from '@capacitor/preferences';
import { authService } from '../services/authService';
import SubscriptionModal from './SubscriptionModal';
import LegalModal from './LegalModal';
import { ShieldCheck } from 'lucide-react';

import { useData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { biometricService } from '../services/biometricService';
import { useLanguage } from '../contexts/LanguageContext';

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
        receipts, // For widget update
        custodyDays, // For widget update
        setReceipts, // For deleteAll
        generateDummyData,
        ambientMode, setAmbientMode,
        showGlobalAmbient, setShowGlobalAmbient,
        setCustodyDays,
        deleteAllReceipts,
        isProMode, setIsProMode,
        proActivatedAt,
        goalsEnabled, setGoalsEnabled,
        addGoal,
        updateGoal,
        financialSnapshotEnabled,
        setFinancialSnapshotEnabled
    } = useData();

    const { user, updateUser, signOut: contextSignOut, upgradeToPro } = useUser();
    const { language, setLanguage, t } = useLanguage();

    // Map context values to names used in the component
    const onSeedData = generateDummyData;
    const onDeleteAll = deleteAllReceipts;
    const onUpgrade = upgradeToPro;
    const onUpdateUser = updateUser;
    const onSignOut = async () => {
        await contextSignOut();
    };

    const { showToast } = useToast();
    const [showSeedConfirmModal, setShowSeedConfirmModal] = useState(false);
    const [seedScenario, setSeedScenario] = useState<'good' | 'average' | 'bad'>('average');


    const [showPaywall, setShowPaywall] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6'); // Default Blue

    const [showLegal, setShowLegal] = useState<{ file: string, title: string } | null>(null);

    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    // Initial Biometric Check
    React.useEffect(() => {
        const checkBiometric = async () => {
            const { available } = await biometricService.isAvailable();
            setBiometricAvailable(available);
            const enabled = await biometricService.isEnabled();
            setBiometricEnabled(enabled);
        };
        checkBiometric();
    }, []);

    const handleToggleBiometric = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const shouldEnable = e.target.checked;
        HapticsService.impactMedium();

        if (shouldEnable) {
            // To enable, we typically want to verify identity first
            const verified = await biometricService.verifyIdentity();
            if (verified) {
                // If verified, we still need the password to store it.
                // For now, we'll enable the toggle, and in AuthScreen we'll capture password on next login.
                // Actually, let's ask for the password now if we want it to work immediately.
                const pwd = prompt(t('settings.biometricPrompt'));
                if (pwd && user?.email) {
                    try {
                        await biometricService.saveCredentials(user.email, pwd);
                        await biometricService.setEnabled(true);
                        setBiometricEnabled(true);
                        showToast(t('settings.security.faceIdKeywords.success'), 'success');
                    } catch (err) {
                        showToast(t('settings.security.faceIdKeywords.failed'), 'error');
                        setBiometricEnabled(false);
                    }
                } else {
                    setBiometricEnabled(false);
                }
            } else {
                setBiometricEnabled(false);
            }
        } else {
            await biometricService.deleteCredentials();
            setBiometricEnabled(false);
            showToast(t('settings.security.faceIdKeywords.disabled'), 'info');
        }
    };

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
        if (confirm(t('settings.recurring.deleteConfirm'))) {
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
        if (confirm(t('settings.categories.deleteConfirm'))) {
            setCategories(categories.filter(c => c.id !== id));
        }
    };

    const handleToggleRestricted = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isProMode && !e.target.checked === false) { // Trying to turn ON
            e.preventDefault();
            setShowPaywall(true);
        } else {
            setAgeRestricted(e.target.checked);
        }
    };

    const handleExportData = async () => {
        if (!isProMode) {
            setShowPaywall(true);
            return;
        }

        const receiptsData = localStorage.getItem('truetrack_receipts');
        if (!receiptsData) {
            alert(t('settings.data.noData'));
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
                    title: t('settings.proFeatures.exportTitle'),
                    text: t('settings.proFeatures.exportMessage'),
                    url: result.uri,
                    dialogTitle: t('settings.proFeatures.exportDialogTitle')
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
            alert(t('settings.data.exportFail'));
        }
    };

    return (
        <>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 w-full max-w-md mx-auto relative pt-0 px-4 custom-scrollbar"
            >
                <div className="pb-4 px-6 text-center">
                    {/* App Version moved to bottom */}
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
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ring-1 ring-white/10 z-10 relative ${isProMode
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
                                {isProMode ? (
                                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm tracking-wide shrink-0">{t('settings.profile.pro')}</span>
                                ) : (
                                    <span className="bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide shrink-0">{t('settings.profile.free')}</span>
                                )}
                            </div>
                            <p className="text-slate-400 text-xs truncate font-medium opacity-80">{user?.email}</p>

                            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{t('settings.profile.edit')}</span>
                                <ChevronRight size={10} className="text-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Budget Slider Integration */}
                    <div className="w-full bg-black/20 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Wallet size={12} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('settings.budget.monthly')}</span>
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
                {!isProMode && (
                    <button
                        onClick={() => setShowPaywall(true)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 p-4 rounded-2xl shadow-lg mb-6 flex items-center justify-between group border border-white/10 transition-all duration-300 hover:shadow-[0_0_25px_rgba(79,70,229,0.25)]"
                    >
                        <div className="text-left">
                            <p className="text-white font-heading font-bold text-sm flex items-center gap-1.5">
                                <Star size={14} className="fill-yellow-400 text-yellow-400 animate-pulse" />
                                {t('settings.proFeatures.upgrade')}
                            </p>
                            <p className="text-indigo-100 text-xs mt-0.5 font-medium">{t('settings.proFeatures.unlockDesc')}</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-xl text-white group-hover:bg-white/30 transition-colors duration-300">
                            <ChevronRight size={16} />
                        </div>
                    </button>
                )}

                <div className="space-y-6">
                    {/* Pro Controls (Moved to Top & Consolidated) */}
                    {/* Pro Controls (Moved to Top & Consolidated) */}
                    <section>
                        <div className="flex items-center justify-between mb-2 ml-4">
                            <h4 className="text-[13px] text-systemGray uppercase tracking-wide">{t('settings.proFeatures.title')}</h4>
                            {isProMode && (
                                <div className="flex items-center gap-1">
                                    <Shield size={12} className="text-systemOrange" />
                                    <span className="text-[11px] text-systemOrange font-medium">{t('settings.proFeatures.active')}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-card rounded-[20px] overflow-hidden border border-white/5 shadow-sm">
                            {/* Ambient Mode Toggle (Moved to Top) */}
                            <div className="w-full flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 hover:bg-surfaceHighlight transition-colors duration-300">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-[10px] ${ambientMode ? 'bg-purple-500/20 text-purple-400' : 'bg-systemGray5 text-systemGray'}`}>
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <span className="text-white text-[17px] font-normal block">{t('settings.proFeatures.ambient')}</span>
                                        <span className="text-[13px] text-systemGray block leading-tight mt-0.5">{t('settings.proFeatures.ambientDesc')}</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={ambientMode}
                                        onChange={(e) => {
                                            HapticsService.impactLight();
                                            setAmbientMode(e.target.checked);
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-systemGray4 rounded-full peer peer-checked:bg-purple-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform after:duration-200 peer-checked:after:translate-x-5"></div>
                                </label>
                            </div>

                            {/* Global Ambient Background */}
                            <div className="w-full flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 hover:bg-surfaceHighlight transition-colors duration-300">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-[10px] ${showGlobalAmbient ? 'bg-cyan-500/20 text-cyan-400' : 'bg-systemGray5 text-systemGray'}`}>
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <span className="text-white text-[17px] font-normal block">{t('settings.proFeatures.appBg')}</span>
                                        <span className="text-[13px] text-systemGray block leading-tight mt-0.5">{t('settings.proFeatures.appBgDesc')}</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={showGlobalAmbient}
                                        onChange={(e) => {
                                            HapticsService.impactLight();
                                            setShowGlobalAmbient(e.target.checked);
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-systemGray4 rounded-full peer peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform after:duration-200 peer-checked:after:translate-x-5"></div>
                                </label>
                            </div>

                            {/* 18+ Parental Control Toggle (Moved to Top) */}
                            <div className="w-full flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 hover:bg-surfaceHighlight transition-colors duration-300">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-[10px] ${ageRestricted ? 'bg-rose-500/20 text-rose-400' : 'bg-systemGray5 text-systemGray'}`}>
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <span className="text-white text-[17px] font-normal block">{t('settings.proFeatures.parental')}</span>
                                        <span className="text-[13px] text-systemGray block leading-tight mt-0.5">{t('settings.proFeatures.parentalDesc')}</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={ageRestricted}
                                        onChange={handleToggleRestricted}
                                    />
                                    <div className="w-11 h-6 bg-systemGray4 rounded-full peer peer-checked:bg-rose-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform after:duration-200 peer-checked:after:translate-x-5"></div>
                                </label>
                            </div>

                            {/* Co-Parenting Features */}
                            <div className="w-full flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-[10px] ${childSupportMode ? 'bg-systemBlue/10 text-systemBlue' : 'bg-systemGray5 text-systemGray'}`}>
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <span className="text-white text-[17px] font-normal block">{t('settings.proFeatures.coParentingFeatures')}</span>
                                        <span className="text-[13px] text-systemGray block leading-tight mt-0.5">{t('settings.proFeatures.coParentingDesc')}</span>
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
                                    <div className="w-11 h-6 bg-systemGray4 rounded-full peer peer-checked:bg-systemGreen after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform after:duration-200 peer-checked:after:translate-x-5"></div>
                                </label>
                            </div>

                            {/* Help & Support (Location-Based) */}
                            <div className="w-full flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-[10px] ${helpEnabled ? 'bg-systemOrange/10 text-systemOrange' : 'bg-systemGray5 text-systemGray'}`}>
                                        <LifeBuoy size={20} />
                                    </div>
                                    <div>
                                        <span className="text-white text-[17px] font-normal block">{t('settings.proFeatures.helpSupport')}</span>
                                        <span className="text-[13px] text-systemGray block leading-tight mt-0.5">{t('settings.proFeatures.helpSupportDesc')}</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={helpEnabled}
                                        onChange={(e) => {
                                            HapticsService.impactMedium();
                                            setHelpEnabled(e.target.checked);
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-systemGray4 rounded-full peer peer-checked:bg-systemGreen after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform after:duration-200 peer-checked:after:translate-x-5"></div>
                                </label>
                            </div>
                            {/* Enable Goals/Pro Features */}
                            <div className="w-full flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-[10px] ${goalsEnabled ? 'bg-systemPurple/10 text-systemPurple' : 'bg-systemGray5 text-systemGray'}`}>
                                        <Target size={20} />
                                    </div>
                                    <div>
                                        <span className="text-white text-[17px] font-normal block">{t('settings.proFeatures.goals')}</span>
                                        <span className="text-[13px] text-systemGray block leading-tight mt-0.5">{t('settings.proFeatures.goalsDesc')}</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={goalsEnabled}
                                        onChange={(e) => {
                                            if (!isProMode) {
                                                setShowPaywall(true);
                                                return;
                                            }
                                            HapticsService.impactMedium();
                                            setGoalsEnabled(e.target.checked);
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-systemGray4 rounded-full peer peer-checked:bg-systemGreen after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform after:duration-200 peer-checked:after:translate-x-5"></div>
                                </label>
                            </div>

                            {/* Goals List (Collapsible) - Keeping logic but styling */}
                            {goalsEnabled && isProMode && (
                                <div className="bg-secondarySystemBackground dark:bg-secondarySystemBackground-dark p-0 m-0 border-b border-black/5 dark:border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                                    {goals.map(goal => (
                                        <div
                                            key={goal.id}
                                            className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 last:border-0 pl-12"
                                            onClick={() => {
                                                HapticsService.impactLight();
                                                const updatedGoals = goals.map(g =>
                                                    g.id === goal.id ? { ...g, isEnabled: !g.isEnabled } : g
                                                );
                                                setGoals(updatedGoals);
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-[17px]">{goal.emoji}</span>
                                                <span className="text-black dark:text-white text-[15px]">{goal.name}</span>
                                            </div>
                                            <div className="w-5 h-5 rounded-full border-2 border-systemGray4 flex items-center justify-center">
                                                {goal.isEnabled && <div className="w-3 h-3 bg-systemGreen rounded-full"></div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Financial Snapshot */}
                            <div className="w-full flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-[10px] ${financialSnapshotEnabled ? 'bg-systemCyan/10 text-systemCyan' : 'bg-systemGray5 text-systemGray'}`}>
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white text-[17px] font-normal block">Financial Snapshot</span>
                                            {!isProMode && <Lock size={12} className="text-systemOrange" />}
                                        </div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={financialSnapshotEnabled} onChange={(e) => { if (!isProMode) return setShowPaywall(true); setFinancialSnapshotEnabled(e.target.checked); }} />
                                    <div className="w-11 h-6 bg-systemGray4 rounded-full peer peer-checked:bg-systemGreen after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform after:duration-200 peer-checked:after:translate-x-5"></div>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Security Settings */}
                    < section >
                        <h4 className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">{t('settings.security.title')}</h4>
                        <div className="bg-card rounded-3xl overflow-hidden border border-slate-800 shadow-lg hover:border-slate-700 transition-all duration-300">
                            {/* Face ID / Biometric Login */}
                            <div className="w-full flex items-center justify-between p-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${biometricEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                        <Lock size={18} />
                                    </div>
                                    <div>
                                        <span className="text-slate-200 text-sm font-bold block">{t('settings.security.biometric')}</span>
                                        <span className="text-xs text-slate-500 font-medium block">{t('settings.security.biometricDesc')}</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={biometricEnabled}
                                        onChange={handleToggleBiometric}
                                        disabled={!biometricAvailable}
                                    />
                                    <div className="w-11 h-6 bg-systemGray4 rounded-full peer peer-checked:bg-systemBlue after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform after:duration-200 peer-checked:after:translate-x-5"></div>
                                </label>
                            </div>

                            {/* Remember Session */}
                            <div className="w-full flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
                                        <RefreshCw size={18} />
                                    </div>
                                    <div>
                                        <span className="text-slate-200 text-sm font-bold block">{t('settings.security.stayLoggedIn')}</span>
                                        <span className="text-xs text-slate-500 font-medium block">{t('settings.security.stayLoggedInDesc')}</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={true}
                                        readOnly
                                    />
                                    <div className="w-11 h-6 bg-systemGray4 rounded-full peer peer-checked:bg-systemGreen after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform after:duration-200 peer-checked:after:translate-x-5"></div>
                                </label>
                            </div>
                        </div>
                    </section >

                    {/* Category Management */}
                    < section >
                        <h4 className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">{t('settings.categories.title')}</h4>
                        <div className="bg-card rounded-3xl overflow-hidden border border-slate-800 shadow-lg hover:border-slate-700 transition-all duration-300">
                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300 border-b border-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-500/20 p-2 rounded-xl text-purple-400">
                                        <Tag size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-slate-200 text-sm font-bold block">{t('settings.categories.manage')}</span>
                                        <span className="text-xs text-slate-500 font-medium">{t('settings.categories.manageDesc')}</span>
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
                    </section >





                    {/* General Settings */}
                    < section >
                        <h4 className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">{t('settings.general.title')}</h4>
                        <div className="bg-card rounded-3xl overflow-hidden border border-slate-800 shadow-lg hover:border-slate-700 transition-all duration-300">
                            {/* Language Selector */}
                            <div className="w-full p-4 border-b border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                                            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <span className="text-slate-200 text-sm font-bold block">{t('settings.language.title')}</span>
                                            <span className="text-xs text-slate-500 font-medium">{t('settings.language.desc')}</span>
                                        </div>
                                    </div>
                                </div>
                                <select
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 font-medium hover:border-white/20"
                                    value={language}
                                    onChange={async (e) => {
                                        HapticsService.impactLight();
                                        await setLanguage(e.target.value);
                                        const languageNames: Record<string, string> = {
                                            'en': 'English',
                                            'hr': 'Hrvatski',
                                            'es': 'Español',
                                            'fr': 'Français',
                                            'de': 'Deutsch',
                                            'it': 'Italiano',
                                            'sv': 'Svenska',
                                            'no': 'Norsk',
                                            'da': 'Dansk'
                                        };
                                        showToast(`Language changed to ${languageNames[e.target.value]}`, 'success');
                                    }}
                                >
                                    <option value="en">🇬🇧 English</option>
                                    <option value="hr">🇭🇷 Hrvatski</option>
                                    <option value="es">🇪🇸 Español</option>
                                    <option value="fr">🇫🇷 Français</option>
                                    <option value="de">🇩🇪 Deutsch</option>
                                    <option value="it">🇮🇹 Italiano</option>
                                    <option value="sv">🇸🇪 Svenska</option>
                                    <option value="no">🇳🇴 Norsk</option>
                                    <option value="da">🇩🇰 Dansk</option>
                                </select>
                            </div>

                            <button className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
                                        <Users size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-slate-200 text-sm font-bold block">{t('settings.general.family')}</span>
                                        <span className="text-xs text-slate-500 font-medium">{t('settings.general.familyDesc')}</span>
                                    </div>
                                </div>
                                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">{t('settings.general.soon')}</span>
                            </button>
                            <div className="border-b border-white/5">
                                <div className="flex items-center gap-3 p-4">
                                    <div className="bg-slate-500/20 p-2 rounded-xl text-slate-400">
                                        <Database size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-slate-200 text-sm font-bold block">{t('settings.general.privacy')}</span>
                                    </div>
                                </div>
                                <div className="px-4 pb-4 flex flex-col gap-2">
                                    <button
                                        onClick={() => setShowLegal({ file: 'privacy_policy.md', title: t('settings.legal.privacyPolicy') || 'Privacy Policy' })}
                                        className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-emerald-400" />
                                            <span className="text-xs text-slate-300 font-medium">{t('settings.legal.privacyPolicy') || 'Privacy Policy'}</span>
                                        </div>
                                        <ChevronRight className="text-slate-600" size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowLegal({ file: 'terms_of_use.md', title: t('settings.legal.terms') || 'Terms of Use' })}
                                        className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText size={14} className="text-blue-400" />
                                            <span className="text-xs text-slate-300 font-medium">{t('settings.legal.terms') || 'Terms of Use'}</span>
                                        </div>
                                        <ChevronRight className="text-slate-600" size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* 18+ Ambient Mode and 18+ toggles moved to Pro Controls section above */}

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
                                                <span className="text-slate-200 text-sm font-bold block">{t('settings.data.seed')}</span>
                                                <span className="text-xs text-slate-500 font-medium">{t('settings.data.seedDesc', { scenario: '' }).replace('()', '')}</span>
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
                                                    setSeedScenario(opt.type as any);
                                                    setShowSeedConfirmModal(true);
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
                                onClick={() => setShowLegalExportModal(true)}
                                className="w-full flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors duration-300 border-b border-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                                        <FileText size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-slate-200 text-sm font-bold block">{t('settings.modals.legalExport')}</span>
                                        <span className="text-xs text-slate-500 font-medium">{t('settings.modals.generateFormalReport')}</span>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-600" size={16} />
                            </button>

                            <div className="w-full flex items-center justify-between p-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="bg-amber-500/20 p-2 rounded-xl text-amber-400">
                                        <Bell size={18} />
                                    </div>
                                    <span className="text-slate-200 text-sm font-bold">{t('settings.notificationsLabel')}</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:shadow-[0_0_15px_rgba(56,189,248,0.2)]"></div>
                                </label>
                            </div>
                        </div>
                    </section >

                    {/* Subscription Management Section */}
                    < section className="mb-6" >
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Crown size={16} className="text-purple-400" />
                            {t('settings.subscription.title')}
                        </h2>

                        <div className="bg-slate-800/30 rounded-2xl border border-white/5 p-4">
                            {/* Current Status */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">{t('settings.subscription.currentPlan')}</p>
                                    <p className="text-lg font-bold text-white mt-1">
                                        {isProMode ? (
                                            <span className="flex items-center gap-2">
                                                <Crown size={18} className="text-purple-400" />
                                                Pro
                                            </span>
                                        ) : (
                                            'Free'
                                        )}
                                    </p>
                                    {isProMode && proActivatedAt && (
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            {t('settings.subscription.activeSince')} {new Date(proActivatedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                {isProMode && (
                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1">
                                        <p className="text-xs font-bold text-purple-400">{t('settings.subscription.pricePerMonth', { price: '4.99' })}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {isProMode ? (
                                <button
                                    onClick={() => {
                                        HapticsService.impactMedium();
                                        if (confirm(t('settings.subscription.cancelConfirm'))) {
                                            setIsProMode(false);
                                            updateUser({ tier: SubscriptionTier.FREE });
                                            showToast(t('settings.subscription.cancelSuccess'), 'info');
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all font-medium text-sm"
                                >
                                    <XIcon size={16} />
                                    {t('settings.subscription.cancel')}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        HapticsService.impactMedium();
                                        setShowPaywall(true);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-sm transition-all shadow-lg shadow-purple-500/20"
                                >
                                    <Crown size={16} />
                                    {t('settings.subscription.upgrade')}
                                </button>
                            )}
                        </div>
                    </section >

                </div >

                {/* Danger Zone - Main Page Footer */}
                < div className="mt-8 mb-24 space-y-3" >
                    {/* Sign Out Button */}
                    {/* Sign Out Button */}
                    <button
                        onClick={() => {
                            HapticsService.impactHeavy();
                            if (confirm(t('settings.account.signOutConfirm'))) {
                                onSignOut();
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all font-bold text-sm shadow-sm mb-8"
                    >
                        <LogOut size={16} />
                        {t('settings.account.signOut')}
                    </button>

                    {/* Delete Account Button */}
                    <button
                        onClick={() => {
                            HapticsService.impactHeavy();
                            if (confirm(t('settings.account.deleteConfirm') || "Are you sure you want to delete your account? This action cannot be undone and will delete all your data.")) {
                                // Double confirm
                                if (confirm(t('settings.account.deleteDoubleConfirm') || "LAST WARNING: All your receipts, expenses, and data will be permanently deleted.")) {
                                    // Call delete account service
                                    // We'll implement this via context or service directly
                                    authService.deleteAccount().catch(err => {
                                        console.error("Account deletion failed", err);
                                        alert("Failed to delete account: " + err.message);
                                    });
                                }
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-bold text-sm shadow-sm"
                    >
                        <Trash2 size={16} />
                        {t('settings.account.delete') || "Delete Account"}
                    </button>

                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 mt-8">{t('settings.uicalc.devTools')}</p>

                    {/* Test Widget Button */}
                    <button
                        onClick={async () => {
                            HapticsService.impactMedium();
                            try {
                                console.log('🧪 Test Widget button clicked');

                                await WidgetService.updateWidgetData(receipts, monthlyBudget, custodyDays);

                                console.log('✅ Widget test completed successfully!');
                                showToast(t('settings.uicalc.widgetUpdateSuccess'), 'success');
                            } catch (error: any) {
                                console.error('❌ Widget test failed:', error);
                                showToast(`${t('settings.uicalc.widgetUpdateFail')} ${error?.message || 'Unknown error'}`, 'error');
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all text-sm font-medium mb-3"
                    >
                        <Trophy size={16} />
                        {t('settings.uicalc.testWidget')}
                    </button>


                    <button
                        onClick={async () => {
                            const { keys } = await Preferences.keys();
                            if (keys.length === 0) {
                                alert(t('settings.uicalc.storageDumpEmpty'));
                                return;
                            }

                            // Dump all values
                            let dump = t('settings.uicalc.storageKeysTitle') + "\n";
                            for (const key of keys) {
                                // truncate key for readability
                                dump += `- ${key}\n`;
                            }
                            alert(dump);
                        }}
                        className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mb-4"
                    >
                        <Database size={18} />
                        {t('settings.uicalc.debugStorage')}
                    </button>

                    <button
                        onClick={onDeleteAll}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} />
                        {t('settings.data.delete')}
                    </button>

                    <div className="pt-8 pb-4 px-6 text-center">
                        <p className="text-[10px] text-slate-600 font-mono">TrueTrack v1.8 (Build {new Date().toLocaleTimeString()})</p>
                    </div>
                </div >
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

                            <h2 className="text-xl font-heading font-bold text-white mb-6">{t('settings.modals.addCategory')}</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('settings.modals.categoryName')}</label>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder={t('settings.categories.placeholder')}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('settings.modals.colorTag')}</label>
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
                                    {t('settings.modals.createCategory')}
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

                            <h2 className="text-xl font-heading font-bold text-white mb-6">{t('settings.modals.addSubscription')}</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('settings.recurring.name')}</label>
                                    <input
                                        type="text"
                                        value={newExpenseName}
                                        onChange={(e) => setNewExpenseName(e.target.value)}
                                        placeholder={t('settings.recurring.expenseNamePlaceholder')}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('settings.recurring.amount')} (€)</label>
                                        <input
                                            type="number"
                                            value={newExpenseAmount}
                                            onChange={(e) => setNewExpenseAmount(e.target.value)}
                                            placeholder={t('settings.recurring.amountPlaceholder')}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('settings.recurring.frequency')}</label>
                                        <select
                                            value={newExpenseFrequency}
                                            onChange={(e) => setNewExpenseFrequency(e.target.value as any)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors appearance-none"
                                        >
                                            <option value="weekly">{t('settings.recurring.frequencyWeekly')}</option>
                                            <option value="monthly">{t('settings.recurring.frequencyMonthly')}</option>
                                            <option value="yearly">{t('settings.recurring.frequencyYearly')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('charts.category')}</label>
                                    <select
                                        value={newExpenseCategory}
                                        onChange={(e) => setNewExpenseCategory(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors appearance-none"
                                    >
                                        <option value="">{t('settings.categories.selectCategoryPlaceholder')}</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('settings.modals.nextDueDate')}</label>
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
                                    {t('settings.modals.addSubscription')}
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
                                    {t('settings.modals.legalExport')}
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">{t('settings.modals.generatePdf')}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <button
                                        onClick={() => {
                                            const now = new Date();
                                            const start = new Date(now.getFullYear(), now.getMonth(), 1);
                                            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
                                            setExportStartDate(start.toISOString().split('T')[0]);
                                            setExportEndDate(end.toISOString().split('T')[0]);
                                            HapticsService.impactLight();
                                        }}
                                        className="bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold py-2 rounded-lg border border-white/5 transition-all"
                                    >
                                        {t('settings.modals.thisMonth') || 'THIS MONTH'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const end = new Date();
                                            const start = new Date(end);
                                            start.setFullYear(end.getFullYear() - 1); // 1 year ago
                                            setExportStartDate(start.toISOString().split('T')[0]);
                                            setExportEndDate(end.toISOString().split('T')[0]);
                                            HapticsService.impactLight();
                                        }}
                                        className="bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold py-2 rounded-lg border border-white/5 transition-all"
                                    >
                                        {t('settings.modals.allTime') || 'ALL TIME'}
                                    </button>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('settings.modals.startDate')}</label>
                                        <input
                                            type="date"
                                            value={exportStartDate}
                                            onChange={(e) => setExportStartDate(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('settings.modals.endDate')}</label>
                                        <input
                                            type="date"
                                            value={exportEndDate}
                                            onChange={(e) => setExportEndDate(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        try {
                                            console.log('📄 Starting PDF Export Flow...');

                                            // Fallback to localStorage if context is empty (migration safety)
                                            let currentReceipts = receipts || [];
                                            if (!currentReceipts || currentReceipts.length === 0) {
                                                const raw = localStorage.getItem('truetrack_receipts');
                                                if (raw) {
                                                    try {
                                                        currentReceipts = JSON.parse(raw);
                                                    } catch (e) {
                                                        console.error('Failed to parse localStorage receipts:', e);
                                                    }
                                                }
                                            }

                                            // Filter for date range
                                            const start = new Date(exportStartDate);
                                            const end = new Date(exportEndDate);
                                            start.setHours(0, 0, 0, 0);
                                            end.setHours(23, 59, 59, 999);

                                            let filteredReceipts = currentReceipts.filter(r => {
                                                const rDate = new Date(r.date);
                                                return rDate >= start && rDate <= end;
                                            });

                                            // Allow export even with 0 receipts if they want custody/activities report
                                            if (filteredReceipts.length === 0) {
                                                const confirmed = window.confirm("No receipts found in this range. Do you want to generate the report anyway to see co-parenting data?");
                                                if (!confirmed) return;
                                            }

                                            // 18+ Filter for Legal Export
                                            if (ageRestricted) {
                                                filteredReceipts = filteredReceipts.map(r => ({
                                                    ...r,
                                                    items: r.items.filter(i => !i.isRestricted)
                                                }));
                                            }

                                            console.log('🚀 Generating PDF...');
                                            await PDFService.generateLegalReport(
                                                filteredReceipts,
                                                user,
                                                custodyDays,
                                                { start, end }
                                            );

                                            setShowLegalExportModal(false);
                                        } catch (e) {
                                            console.error('❌ PDF Export failed:', e);
                                            alert(`${t('settings.data.exportFail') || 'Failed to generate PDF'}: ${e instanceof Error ? e.message : 'Unknown error'}`);
                                        }
                                    }}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all mt-4 flex items-center justify-center gap-2"
                                >
                                    <FileDown size={18} />
                                    {t('settings.modals.generatePdf')}
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
                                <h2 className="text-xl font-heading font-bold text-white">{t('settings.profile.edit')}</h2>
                                <p className="text-slate-400 text-sm mt-1">{t('settings.profile.customize')}</p>
                            </div>

                            <div className="space-y-6">
                                {/* Nickname Input */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('settings.profile.nickname')}</label>
                                    <input
                                        type="text"
                                        value={tempNickname}
                                        onChange={(e) => setTempNickname(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors font-medium text-lg"
                                        placeholder={t('settings.profile.nicknamePlaceholder')}
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

                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{t('settings.profile.chooseAvatar')}</label>

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
                                                        alert(t('settings.profile.imageTooLarge'));
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
                                            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200">{t('settings.profile.upload')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Monthly Budget Setting */}
                                <div className="pt-2 border-t border-white/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.budget.monthly')}</label>
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
                                        {t('settings.profile.save')}
                                    </button>

                                    <button
                                        onClick={() => {
                                            setTempAvatar(undefined); // Remove avatar
                                        }}
                                        className="w-full text-slate-500 text-xs font-bold hover:text-red-400 transition-colors py-2"
                                    >
                                        {t('settings.profile.reset')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Seed Data Confirmation Modal */}
            {
                showSeedConfirmModal && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-surface w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
                            <h2 className="text-xl font-heading font-bold text-white mb-2">{t('settings.modals.overwriteTitle')}</h2>
                            <p className="text-slate-400 text-sm mb-6">
                                {t('settings.modals.overwriteDesc', { scenario: seedScenario }).replace('()', '')}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={async () => {
                                        HapticsService.impactHeavy();
                                        // Close modal immediately to feel responsive
                                        setShowSeedConfirmModal(false);

                                        // Show loading toast? Or just wait? 
                                        // generateDummyData is fast (50ms in mock), but let's be safe.
                                        const count = await generateDummyData(seedScenario);

                                        showToast(t('settings.data.seedSuccess', { scenario: seedScenario, count: count }), 'success');
                                    }}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Database size={18} />
                                    {t('settings.modals.overwriteData')}
                                </button>

                                <button
                                    onClick={() => setShowSeedConfirmModal(false)}
                                    className="w-full bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-3.5 rounded-xl transition-all"
                                >
                                    {t('settings.modals.cancel')}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            <LegalModal
                isOpen={!!showLegal}
                onClose={() => setShowLegal(null)}
                fileName={showLegal?.file || ''}
                title={showLegal?.title || ''}
            />
        </>
    );
};

export default Settings;