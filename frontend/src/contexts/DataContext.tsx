import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Receipt, CategoryDefinition, Goal, RecurringExpense, CustodyDay, GoalType, Achievement } from '@common/types'; // Adjust imports
import { Preferences } from '@capacitor/preferences';
import { WidgetService } from '../services/widgetService';
import { authService } from '../services/authService';

// --- Constants (Moved from App.tsx) ---
const RECEIPT_STORAGE_KEY = 'truetrack_receipts';
const SETTINGS_STORAGE_KEY = 'truetrack_settings';

const DEFAULT_CATEGORIES: CategoryDefinition[] = [
    { id: 'necessity', name: 'Necessity', color: '#38bdf8' },
    { id: 'food', name: 'Food', color: '#4ade80' },
    { id: 'dining', name: 'Dining', color: '#f97316' },
    { id: 'alcohol', name: 'Alcohol', color: '#ef4444' },
    { id: 'luxury', name: 'Luxury', color: '#f472b6' },
    { id: 'household', name: 'Household', color: '#818cf8' },
    { id: 'health', name: 'Health', color: '#fb7185' },
    { id: 'transport', name: 'Transport', color: '#facc15' },
    { id: 'education', name: 'Education', color: '#6366f1' },
    { id: 'child', name: 'Child', color: '#ec4899' },
    { id: 'other', name: 'Other', color: '#94a3b8' },
];

// Enhanced Default Goals List
const DEFAULT_GOALS: Goal[] = [
    // Existing
    { id: 'junk_food', type: GoalType.JUNK_FOOD, name: 'Stop Junk Food', isEnabled: false, keywords: ['mcdonalds', 'kfc', 'burger king', 'pizza', 'chips', 'candy', 'chocolate', 'takeaway', 'fast food', 'five guys', 'subway', 'dominos', 'papa johns'], streak: 0, emoji: '🍔' },
    { id: 'alcohol', type: GoalType.ALCOHOL, name: 'Reduce Alcohol', isEnabled: false, keywords: ['beer', 'wine', 'vodka', 'whiskey', 'liquor', 'alcohol', 'pub', 'bar', 'off license', 'brewery', 'gin', 'rum', 'cider'], streak: 0, emoji: '🍺' },
    { id: 'smoking', type: GoalType.SMOKING, name: 'Quit Smoking', isEnabled: false, keywords: ['tobacco', 'cigarettes', 'cigar', 'vape', 'smoke', 'nicotine'], streak: 0, emoji: '🚬' },
    { id: 'gaming', type: GoalType.GAMING, name: 'Less Gaming', isEnabled: false, keywords: ['steam', 'playstation', 'xbox', 'nintendo', 'game', 'epic games', 'riot games', 'blizzard'], streak: 0, emoji: '🎮' },
    // Shopping / Impulse
    { id: 'impulse_buy', type: GoalType.ONLINE_SHOPPING, name: 'Impulse Control', isEnabled: true, keywords: ['amazon', 'temu', 'shein', 'wish', 'aliexpress', 'ebay', 'etsy'], streak: 7, emoji: '🧠' },
    { id: 'tech_spend', type: GoalType.ONLINE_SHOPPING, name: 'Tech Detox', isEnabled: false, keywords: ['apple', 'currys', 'pc world', 'steam', 'game', 'amazon', 'best buy', 'samsung'], streak: 0, emoji: '🔌' },
    { id: 'fast_fashion', type: GoalType.FAST_FASHION, name: 'Avoid Fast Fashion', isEnabled: false, keywords: ['zara', 'h&m', 'primark', 'shein', 'boohoo', 'forever 21', 'uniqlo', 'mango', 'asos'], streak: 0, emoji: '👗' },
    // Lifestyle
    { id: 'subscriptions', type: GoalType.STREAMING, name: 'Sub Fatigue', isEnabled: true, keywords: ['netflix', 'spotify', 'apple', 'adobe', 'prime', 'hulu', 'disney', 'hbo', 'youtube'], streak: 30, emoji: '📉' },
    { id: 'late_night', type: GoalType.JUNK_FOOD, name: 'Late Night Eats', isEnabled: true, keywords: ['uber eats', 'deliveroo', 'just eat', 'dominos', 'mcdonalds', 'grubhub', 'doordash'], streak: 3, emoji: '🌙' },
    { id: 'gambling', type: GoalType.GAMBLING, name: 'Stop Gambling', isEnabled: false, keywords: ['bet', 'casino', 'lottery', 'lotto', 'poker', 'bookmakers', 'ladbrokes', 'paddy power', 'draftkings', 'fanduel'], streak: 0, emoji: '🎰' },
    { id: 'caffeine', type: GoalType.CAFFEINE, name: 'Cut Caffeine', isEnabled: false, keywords: ['coffee', 'starbucks', 'costa', 'espresso', 'latte', 'caffeine', 'energy drink', 'red bull', 'monster', 'nespresso', 'tim hortons'], streak: 0, emoji: '☕' },
    { id: 'sugar', type: GoalType.SUGAR, name: 'Reduce Sugar', isEnabled: false, keywords: ['sugar', 'cake', 'cookies', 'donuts', 'sweets', 'soda', 'coke', 'pepsi', 'ice cream', 'candy', 'chocolate'], streak: 0, emoji: '🍩' },
    { id: 'ride_sharing', type: GoalType.RIDE_SHARING, name: 'Walk More', isEnabled: false, keywords: ['uber', 'lyft', 'taxi', 'bolt', 'freenow', 'grab'], streak: 0, emoji: '🚶' },
    { id: 'savings', type: GoalType.SAVINGS, name: 'Boost Savings', isEnabled: true, keywords: [], streak: 15, emoji: '💰' },
];

const getReceiptSignature = (r: Receipt) => {
    const cleanStore = r.storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanRef = (r.referenceCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const priceCents = Math.round(r.total * 100);
    return `${cleanStore}| ${r.date}| ${priceCents}| ${r.type || 'receipt'}| ${cleanRef} `;
};

import { supabase } from '../lib/supabaseClient';

export interface CalendarChange {
    id: string;
    type: 'added' | 'modified' | 'deleted' | 'custody_changed';
    eventTitle?: string;
    eventType?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    oldDate?: string;
    oldTime?: string;
    custodyStatus?: string;
    timestamp: string;
}

interface DataContextType {

    userSettings: any; // Define proper type
    addGoal: (goal: Goal) => void;
    updateGoal: (goalId: string, updates: Partial<Goal>) => void;
    achievements: Achievement[];
    lastPartnerChanges?: any; // Define proper type
    receipts: Receipt[];
    setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
    addReceipts: (newReceipts: Receipt[]) => void;
    updateReceipt: (updated: Receipt) => void;
    deleteReceipt: (id: string) => void;
    deleteAllReceipts: () => void;

    selectedReceipt: Receipt | null;
    setSelectedReceipt: (receipt: Receipt | null) => void;

    monthlyBudget: number;
    setMonthlyBudget: (budget: number) => void;

    categoryBudgets: Record<string, number>;
    setCategoryBudgets: (budgets: Record<string, number>) => void;

    categories: CategoryDefinition[];
    setCategories: (cats: CategoryDefinition[]) => void;

    recurringExpenses: RecurringExpense[];
    setRecurringExpenses: (expenses: RecurringExpense[]) => void;

    goals: Goal[];
    setGoals: (goals: Goal[]) => void;

    custodyDays: CustodyDay[];
    setCustodyDays: React.Dispatch<React.SetStateAction<CustodyDay[]>>;
    updateCustodyDay: (day: CustodyDay) => void;
    syncCustody: (manual?: boolean) => Promise<void>; // Setup Sync
    recentChanges: CalendarChange[];
    setRecentChanges: React.Dispatch<React.SetStateAction<CalendarChange[]>>;

    // Settings
    ageRestricted: boolean;
    setAgeRestricted: (val: boolean) => void;
    childSupportMode: boolean;
    setChildSupportMode: (val: boolean) => void;
    ambientMode: boolean;
    setAmbientMode: (val: boolean) => void;
    showGlobalAmbient: boolean;
    setShowGlobalAmbient: (val: boolean) => void;
    helpEnabled: boolean;
    setHelpEnabled: (val: boolean) => void;
    isProMode: boolean;
    setIsProMode: (val: boolean) => void;
    setIsProModeWithTimestamp: (val: boolean) => void;
    proActivatedAt: string | null;
    goalsEnabled: boolean;
    setGoalsEnabled: (val: boolean) => void;
    financialSnapshotEnabled: boolean;
    setFinancialSnapshotEnabled: (val: boolean) => void;

    // Notification tracking
    shownNotificationIds: Set<string>;
    markNotificationAsShown: (id: string) => void;
    unreadNotificationCount: number;
    markAllNotificationsAsRead: () => void;

    // Meta
    isDataLoaded: boolean;
    dataVersion: number;
    generateDummyData: (scenario?: 'good' | 'average' | 'bad') => Promise<number>;
    spendRatio: number;
}

import { useUser } from './UserContext';
import { useToast } from './ToastContext';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: contextUser, signOut } = useUser();

    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [monthlyBudget, setMonthlyBudget] = useState(300);
    const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
    const [ageRestricted, setAgeRestricted] = useState(false);
    const [childSupportMode, setChildSupportMode] = useState(true);
    const [categories, setCategories] = useState<CategoryDefinition[]>(DEFAULT_CATEGORIES);
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
    const [custodyDays, setCustodyDays] = useState<CustodyDay[]>([]);
    const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
    const [ambientMode, setAmbientMode] = useState(false);
    const [showGlobalAmbient, setShowGlobalAmbient] = useState(true);
    const [helpEnabled, setHelpEnabled] = useState(false);
    const [isProMode, setIsProMode] = useState(false);
    const [goalsEnabled, setGoalsEnabled] = useState(true); // Default to true, or match isProMode initially
    const [financialSnapshotEnabled, setFinancialSnapshotEnabled] = useState(true);
    const [proActivatedAt, setProActivatedAt] = useState<string | null>(null);
    const [dataVersion, setDataVersion] = useState(0);
    const [lastPartnerChanges, setLastPartnerChanges] = useState<string | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [recentChanges, setRecentChanges] = useState<CalendarChange[]>([]);
    const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set());
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    // --- Load Data ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const { value: savedReceipts } = await Preferences.get({ key: RECEIPT_STORAGE_KEY });
                if (savedReceipts) {
                    const parsed = JSON.parse(savedReceipts);
                    if (Array.isArray(parsed)) {
                        const uniqueMap = new Map<string, Receipt>();
                        parsed.forEach(r => {
                            const sig = getReceiptSignature(r);
                            if (!uniqueMap.has(sig)) {
                                uniqueMap.set(sig, r);
                            }
                        });
                        setReceipts(Array.from(uniqueMap.values()));
                    }
                }

                const { value: savedSettings } = await Preferences.get({ key: SETTINGS_STORAGE_KEY });
                if (savedSettings) {
                    const parsed = JSON.parse(savedSettings);

                    if (parsed.budget !== undefined) setMonthlyBudget(parsed.budget);
                    if (parsed.categoryBudgets !== undefined) setCategoryBudgets(parsed.categoryBudgets);
                    if (parsed.ageRestricted !== undefined) setAgeRestricted(parsed.ageRestricted);
                    if (parsed.childSupportMode !== undefined) setChildSupportMode(parsed.childSupportMode);
                    if (parsed.categories !== undefined) setCategories(parsed.categories);
                    if (parsed.recurringExpenses !== undefined) setRecurringExpenses(parsed.recurringExpenses);
                    if (parsed.goals !== undefined) setGoals(parsed.goals);
                    if (parsed.ambientMode !== undefined) setAmbientMode(parsed.ambientMode);
                    if (parsed.showGlobalAmbient !== undefined) setShowGlobalAmbient(parsed.showGlobalAmbient);
                    if (parsed.helpEnabled !== undefined) setHelpEnabled(parsed.helpEnabled);
                    if (parsed.isProMode !== undefined) {
                        console.log('📦 Loading Pro mode from storage:', parsed.isProMode);
                        setIsProMode(parsed.isProMode);
                        // Backwards compatibility: if goalsEnabled wasn't saved but isProMode was, assume goals align with pro mode
                        if (parsed.goalsEnabled === undefined) {
                            setGoalsEnabled(parsed.isProMode);
                        }
                    } else {
                        console.warn('⚠️ No Pro mode found in storage, defaulting to false');
                    }
                    if (parsed.goalsEnabled !== undefined) {
                        setGoalsEnabled(parsed.goalsEnabled);
                    }
                    if (parsed.proActivatedAt !== undefined) {
                        setProActivatedAt(parsed.proActivatedAt);
                    }
                }

                const { value: savedCustody } = await Preferences.get({ key: 'truetrack_custody' });
                if (savedCustody) {
                    setCustodyDays(JSON.parse(savedCustody));
                }

                // Load shown notification IDs
                const { value: savedNotificationIds } = await Preferences.get({ key: 'truetrack_shown_notifications' });
                if (savedNotificationIds) {
                    try {
                        const parsed = JSON.parse(savedNotificationIds);
                        if (Array.isArray(parsed)) {
                            setShownNotificationIds(new Set(parsed));
                        }
                    } catch (e) {
                        console.error('Failed to parse notification IDs:', e);
                    }
                }

                // Load unread notification count
                const { value: savedUnreadCount } = await Preferences.get({ key: 'truetrack_unread_notifications' });
                if (savedUnreadCount) {
                    try {
                        const count = parseInt(savedUnreadCount, 10);
                        if (!isNaN(count)) {
                            setUnreadNotificationCount(count);
                        }
                    } catch (e) {
                        console.error('Failed to parse unread count:', e);
                    }
                }
            } catch (e) {
                console.error("Failed to load data", e);
            } finally {
                setIsDataLoaded(true);
            }
        };
        loadData();
    }, []);

    const { showToast } = useToast();

    // --- Persistence Effects ---
    useEffect(() => {
        const saveReceipts = async () => {
            await Preferences.set({ key: RECEIPT_STORAGE_KEY, value: JSON.stringify(receipts) });
        };
        saveReceipts();
    }, [receipts]);

    // Immediate persistence for Pro mode (critical to prevent loss on background)
    useEffect(() => {
        // CRITICAL: Don't save until data is loaded, otherwise we'll overwrite with initial false value!
        if (!isDataLoaded) return;

        const savePro = async () => {
            try {
                const settings = {
                    budget: monthlyBudget,
                    categoryBudgets,
                    ageRestricted,
                    childSupportMode,
                    categories,
                    recurringExpenses,
                    goals,
                    ambientMode,
                    showGlobalAmbient,
                    helpEnabled,
                    isProMode,
                    proActivatedAt,
                    goalsEnabled,
                    financialSnapshotEnabled
                };
                await Preferences.set({ key: SETTINGS_STORAGE_KEY, value: JSON.stringify(settings) });
                console.log('✅ Pro mode saved immediately:', isProMode);
            } catch (e) {
                console.error('Failed to save Pro mode:', e);
            }
        };
        savePro();
    }, [monthlyBudget, categoryBudgets, ageRestricted, childSupportMode, categories, recurringExpenses, goals, ambientMode, showGlobalAmbient, helpEnabled, isProMode, goalsEnabled, financialSnapshotEnabled, proActivatedAt, isDataLoaded]);

    // Save custody days separately
    useEffect(() => {
        if (!isDataLoaded) return; // Don't save until data is loaded

        const saveCustody = async () => {
            try {
                await Preferences.set({ key: 'truetrack_custody', value: JSON.stringify(custodyDays) });
            } catch (e) {
                console.error('Failed to save custody days:', e);
            }
        };
        saveCustody();
    }, [custodyDays, isDataLoaded]);

    // Persist shown notification IDs (with cleanup to prevent unbounded growth)
    useEffect(() => {
        const saveNotificationIds = async () => {
            try {
                // Keep only the last 100 notification IDs to prevent unbounded growth
                const idsArray = Array.from(shownNotificationIds).slice(-100);
                await Preferences.set({ key: 'truetrack_shown_notifications', value: JSON.stringify(idsArray) });
            } catch (e) {
                console.error('Failed to save notification IDs:', e);
            }
        };
        saveNotificationIds();
    }, [shownNotificationIds]);

    // Persist unread notification count
    useEffect(() => {
        const saveUnreadCount = async () => {
            try {
                await Preferences.set({ key: 'truetrack_unread_notifications', value: unreadNotificationCount.toString() });
            } catch (e) {
                console.error('Failed to save unread count:', e);
            }
        };
        saveUnreadCount();
    }, [unreadNotificationCount]);

    // Auto-Sync when Co-Parenting Mode is enabled
    useEffect(() => {
        if (childSupportMode && isDataLoaded) {
            syncCustody(false);
        }
    }, [childSupportMode, isDataLoaded]);

    // Helper to mark notification as shown
    const markNotificationAsShown = (id: string) => {
        setShownNotificationIds(prev => new Set([...prev, id]));
    };

    // Wrapper for setIsProMode that also sets activation timestamp
    const setIsProModeWithTimestamp = (value: boolean) => {
        console.log('🔧 setIsProModeWithTimestamp called with:', value);
        console.log('📅 Current proActivatedAt:', proActivatedAt);

        setIsProMode(value);
        console.log('✅ setIsProMode called with:', value);

        if (value && !proActivatedAt) {
            // Only set timestamp on first activation
            const timestamp = new Date().toISOString();
            console.log('⏰ Setting proActivatedAt to:', timestamp);
            setProActivatedAt(timestamp);
        } else if (!value) {
            // Clear timestamp if Pro is disabled
            console.log('🗑️ Clearing proActivatedAt');
            setProActivatedAt(null);
        } else {
            console.log('ℹ️ Pro already activated, keeping existing timestamp:', proActivatedAt);
        }
    };

    // Helper to mark all notifications as read
    const markAllNotificationsAsRead = () => {
        setUnreadNotificationCount(0);
    };

    // --- Widget Sync ---
    useEffect(() => {
        const syncWidget = async () => {
            try {
                await WidgetService.updateWidgetData(receipts, monthlyBudget, custodyDays, isProMode);
            } catch (e) {
                console.error("Widget sync failed:", e);
            }
        };
        syncWidget();
    }, [receipts, monthlyBudget, custodyDays, isProMode]);

    // --- Recurring Expenses Check ---
    useEffect(() => {
        if (!isDataLoaded) return;

        const checkRecurring = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let newReceipts: Receipt[] = [];
            let updatedExpenses = [...recurringExpenses];
            let hasUpdates = false;

            updatedExpenses = updatedExpenses.map(expense => {
                const dueDate = new Date(expense.nextDueDate);
                dueDate.setHours(0, 0, 0, 0);

                if (dueDate <= today && expense.autoAdd) {
                    hasUpdates = true;
                    const newReceipt: Receipt = {
                        id: `recurring_${Date.now()}_${expense.id} `,
                        storeName: expense.name,
                        date: expense.nextDueDate.split('T')[0],
                        total: expense.amount,
                        items: [{
                            name: expense.name,
                            price: expense.amount,
                            quantity: 1,
                            category: expense.category
                        }],
                        scannedAt: new Date().toISOString(),
                        type: 'bill',
                        categoryId: expense.category
                    };
                    newReceipts.push(newReceipt);

                    const nextDate = new Date(dueDate);
                    if (expense.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                    if (expense.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                    if (expense.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

                    return { ...expense, nextDueDate: nextDate.toISOString() };
                }
                return expense;
            });

            if (hasUpdates) {
                setReceipts(prev => [...prev, ...newReceipts]);
                setRecurringExpenses(updatedExpenses);
                if (newReceipts.length > 0) {
                    alert(`Added ${newReceipts.length} recurring expense(s): \n${newReceipts.map(r => r.storeName).join(', ')} `);
                }
            }
        };

        checkRecurring();
    }, [isDataLoaded, recurringExpenses]);

    // --- Actions ---
    const addReceipts = (newReceipts: Receipt[]) => {
        let duplicateCount = 0;
        let confirmedNewReceipts: Receipt[] = [];

        const existingSignatures = new Set(receipts.map(r => getReceiptSignature(r)));
        const existingImageHashes = new Set(receipts.map(r => r.imageHash).filter(Boolean));
        const existingFileHashes = new Set(receipts.map(r => r.fileHash).filter(Boolean));
        const existingTransactionIds = new Set(receipts.map(r => r.transactionId).filter(Boolean));

        const findWeakMatch = (r: Receipt) => {
            return receipts.find(existing =>
                existing.date === r.date &&
                Math.abs(existing.total - r.total) < 0.01 &&
                existing.storeName.toLowerCase() === r.storeName.toLowerCase() &&
                existing.id !== r.id
            );
        };

        for (const receipt of newReceipts) {
            const sig = getReceiptSignature(receipt);
            const imgHash = receipt.imageHash;
            const fHash = receipt.fileHash;
            const txId = receipt.transactionId;
            const rRef = receipt.referenceCode;

            // Only hard block if it's the exact same file/image, or has same unique Transaction ID/Ref Code
            const isDuplicateImageHash = imgHash ? existingImageHashes.has(imgHash) : false;
            const isDuplicateFileHash = fHash ? existingFileHashes.has(fHash) : false;
            const isDuplicateTxId = txId ? existingTransactionIds.has(txId) : false;

            // Also hard block if Reference Code exists and is identical (strong identifier)
            const isDuplicateRef = rRef ? receipts.some(existing => existing.referenceCode === rRef && existing.storeName === receipt.storeName) : false;

            if (isDuplicateImageHash || isDuplicateFileHash || isDuplicateTxId || isDuplicateRef) {
                duplicateCount++;
                console.log(`Duplicate blocked: ImgHash=${isDuplicateImageHash}, FileHash=${isDuplicateFileHash}, TxId=${isDuplicateTxId}, Ref=${isDuplicateRef}`);
                continue;
            }

            const weakMatch = findWeakMatch(receipt);
            if (weakMatch) {
                const confirmMessage = `Potential duplicate detected:\n\nStore: ${receipt.storeName}\nDate: ${receipt.date}\nTotal: €${receipt.total.toFixed(2)}\n\nThis looks identical to an existing record.\n\nDo you want to add it anyway?`;
                if (window.confirm(confirmMessage)) {
                    confirmedNewReceipts.push(receipt);
                    existingSignatures.add(sig);
                    if (txId) existingTransactionIds.add(txId);
                } else {
                    duplicateCount++;
                }
            } else {
                confirmedNewReceipts.push(receipt);
                existingSignatures.add(sig);
                if (txId) existingTransactionIds.add(txId);
            }
        }

        if (duplicateCount > 0) {
            alert(`${duplicateCount} duplicate receipt(s) were removed.`);
        }

        if (confirmedNewReceipts.length > 0) {
            setReceipts(prev => {
                const updatedReceipts = [...confirmedNewReceipts, ...prev];
                return updatedReceipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
            setDataVersion(v => v + 1);
        }
    };

    const updateReceipt = (updated: Receipt) => {
        setReceipts(prev => prev.map(r => r.id === updated.id ? updated : r));
        setDataVersion(v => v + 1);
    };

    const deleteReceipt = (id: string) => {
        setReceipts(prev => prev.filter(r => r.id !== id));
        setDataVersion(v => v + 1);
    };

    const deleteAllReceipts = () => {
        setReceipts([]);
        setCustodyDays([]);
        alert('All data cleared (receipts & custody calendar).');
    };

    // --- Cloud Sync ---
    const syncCustody = async (manual: boolean = false) => {
        if (!supabase) {
            console.warn("Sync unavailable: App is running in Mock Mode (No Database Connection).");
            return;
        }

        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase Auth Timeout")), 5000));

        let currentUser = null;
        try {
            // @ts-ignore
            const result: any = await Promise.race([getUserPromise, timeoutPromise]);
            currentUser = result.data?.user;
        } catch (e: any) {
            console.error("Sync Auth Hang:", e);
            return;
        }

        if (!currentUser) return;

        try {
            // Step 1: Get the shared calendar ID for this user
            const { data: pairData, error: pairError } = await supabase
                .from('coparent_pairs')
                .select('id')
                .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
                .single();

            if (pairError) {
                console.error("Failed to get co-parent pair:", pairError);
                return;
            }

            if (!pairData) {
                console.warn("No co-parent pair found for user");
                return;
            }

            const sharedCalendarId = pairData.id;

            // Step 2: Fetch custody days using shared_calendar_id
            const { data, error } = await supabase
                .from('custody_days')
                .select('*')
                .eq('shared_calendar_id', sharedCalendarId);

            if (error) throw error;

            if (data) {
                const mergedMap = new Map<string, any>(custodyDays.map(d => [d.date, d]));
                let newFromRemote = 0;
                let updatedFromRemote = 0;
                const detectedChanges: CalendarChange[] = [];

                data.forEach((row: any) => {
                    const local = mergedMap.get(row.date);
                    const remoteActivities = row.activities || [];

                    if (!local) {
                        // New day from remote
                        newFromRemote++;
                        mergedMap.set(row.date, {
                            date: row.date,
                            status: row.status,
                            activities: remoteActivities
                        });

                        // Track new activities
                        remoteActivities.forEach((activity: any) => {
                            detectedChanges.push({
                                id: `${Date.now()}_${Math.random()}`,
                                type: 'added',
                                eventTitle: activity.title,
                                eventType: activity.type,
                                date: row.date,
                                startTime: activity.startTime,
                                endTime: activity.endTime,
                                timestamp: new Date().toISOString()
                            });
                        });

                        // Track custody status if not 'none'
                        if (row.status !== 'none') {
                            detectedChanges.push({
                                id: `${Date.now()}_${Math.random()}`,
                                type: 'custody_changed',
                                custodyStatus: row.status,
                                date: row.date,
                                timestamp: new Date().toISOString()
                            });
                        }
                    } else {
                        // Check for changes in existing day
                        const localActivities = local.activities || [];
                        let hasChanges = false;

                        // Detect custody status change
                        if (local.status !== row.status) {
                            hasChanges = true;
                            updatedFromRemote++;
                            detectedChanges.push({
                                id: `${Date.now()}_${Math.random()}`,
                                type: 'custody_changed',
                                custodyStatus: row.status,
                                date: row.date,
                                timestamp: new Date().toISOString()
                            });
                        }

                        // Detect activity changes
                        const localActivityMap = new Map(localActivities.map((a: any) => [a.id, a]));
                        const remoteActivityMap = new Map(remoteActivities.map((a: any) => [a.id, a]));

                        // Find new activities
                        remoteActivities.forEach((remoteActivity: any) => {
                            if (!localActivityMap.has(remoteActivity.id)) {
                                hasChanges = true;
                                detectedChanges.push({
                                    id: `${Date.now()}_${Math.random()}`,
                                    type: 'added',
                                    eventTitle: remoteActivity.title,
                                    eventType: remoteActivity.type,
                                    date: row.date,
                                    startTime: remoteActivity.startTime,
                                    endTime: remoteActivity.endTime,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        });

                        // Find deleted activities
                        localActivities.forEach((localActivity: any) => {
                            if (!remoteActivityMap.has(localActivity.id)) {
                                hasChanges = true;
                                detectedChanges.push({
                                    id: `${Date.now()}_${Math.random()}`,
                                    type: 'deleted',
                                    eventTitle: localActivity.title,
                                    eventType: localActivity.type,
                                    date: row.date,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        });

                        // Find modified activities
                        remoteActivities.forEach((remoteActivity: any) => {
                            const localActivity = localActivityMap.get(remoteActivity.id) as any;
                            if (localActivity) {
                                const titleChanged = localActivity.title !== remoteActivity.title;
                                const timeChanged = localActivity.startTime !== remoteActivity.startTime ||
                                    localActivity.endTime !== remoteActivity.endTime;

                                if (titleChanged || timeChanged) {
                                    hasChanges = true;
                                    detectedChanges.push({
                                        id: `${Date.now()}_${Math.random()}`,
                                        type: 'modified',
                                        eventTitle: remoteActivity.title,
                                        eventType: remoteActivity.type,
                                        date: row.date,
                                        startTime: remoteActivity.startTime,
                                        endTime: remoteActivity.endTime,
                                        oldTime: localActivity.startTime,
                                        timestamp: new Date().toISOString()
                                    });
                                }
                            }
                        });

                        if (hasChanges) {
                            updatedFromRemote++;
                            mergedMap.set(row.date, {
                                date: row.date,
                                status: row.status,
                                activities: remoteActivities
                            });
                        }
                    }
                });

                const mergedArray = Array.from(mergedMap.values());
                if (newFromRemote > 0 || updatedFromRemote > 0) {
                    setCustodyDays(mergedArray);

                    // Update recent changes (keep last 10)
                    setRecentChanges(prev => [...detectedChanges, ...prev].slice(0, 10));
                }

                if (mergedArray.length > 0) {
                    const updates = mergedArray.map((d: any) => ({
                        date: d.date,
                        status: d.status,
                        activities: d.activities,
                        user_id: currentUser.id,
                        shared_calendar_id: sharedCalendarId,
                        updated_at: new Date().toISOString()
                    }));

                    const { error: upsertError } = await supabase.from('custody_days').upsert(updates, { onConflict: 'date,user_id' });
                    if (upsertError) {
                        console.error('Sync push failed:', upsertError);
                    } else {
                        const hasChanges = detectedChanges.length > 0;
                        if (hasChanges) {
                            // Filter out already-shown notifications
                            const newChanges = detectedChanges.filter(change => !shownNotificationIds.has(change.id));

                            if (newChanges.length > 0) {
                                // Send detailed notifications only for new changes
                                import('../services/notificationService').then(({ NotificationService }) => {
                                    NotificationService.sendDetailedCalendarNotification(newChanges);
                                });

                                // Mark these notifications as shown
                                newChanges.forEach(change => markNotificationAsShown(change.id));

                                // Increment unread notification count
                                setUnreadNotificationCount(prev => prev + newChanges.length);

                                // Legacy message for backwards compatibility
                                let changeMsg = "";
                                const newCount = newChanges.filter(c => c.type === 'added').length;
                                const updatedCount = newChanges.filter(c => c.type === 'modified').length;

                                if (newCount > 0 && updatedCount > 0) {
                                    changeMsg = `Partner added ${newCount} and updated ${updatedCount} events`;
                                } else if (newCount > 0) {
                                    changeMsg = `Partner added ${newCount} new event${newCount > 1 ? 's' : ''}`;
                                } else if (updatedCount > 0) {
                                    changeMsg = `Partner updated ${updatedCount} event${updatedCount > 1 ? 's' : ''}`;
                                }
                                if (changeMsg) {
                                    setLastPartnerChanges(changeMsg);
                                }
                            }
                        }
                    }
                }
            }
        } catch (err: any) {
            console.error('Custody sync failed:', err);
        }
    };

    // Initial Sync on Load
    useEffect(() => {
        if (isDataLoaded) {
            syncCustody(false);
        }
    }, [isDataLoaded]);

    const updateCustodyDay = async (day: CustodyDay) => {
        // Detect changes before updating
        const existingDay = custodyDays.find(d => d.date === day.date);
        const localChanges: CalendarChange[] = [];

        if (existingDay) {
            // Check for custody status change
            if (existingDay.status !== day.status) {
                localChanges.push({
                    id: `${Date.now()}_${Math.random()}`,
                    type: 'custody_changed',
                    custodyStatus: day.status,
                    date: day.date,
                    timestamp: new Date().toISOString()
                });
            }

            // Check for activity changes
            const oldActivities = existingDay.activities || [];
            const newActivities = day.activities || [];
            const oldActivityMap = new Map(oldActivities.map((a: any) => [a.id, a]));
            const newActivityMap = new Map(newActivities.map((a: any) => [a.id, a]));

            // Find new activities
            newActivities.forEach((newActivity: any) => {
                if (!oldActivityMap.has(newActivity.id)) {
                    localChanges.push({
                        id: `${Date.now()}_${Math.random()}`,
                        type: 'added',
                        eventTitle: newActivity.title,
                        eventType: newActivity.type,
                        date: day.date,
                        startTime: newActivity.startTime,
                        endTime: newActivity.endTime,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            // Find deleted activities
            oldActivities.forEach((oldActivity: any) => {
                if (!newActivityMap.has(oldActivity.id)) {
                    localChanges.push({
                        id: `${Date.now()}_${Math.random()}`,
                        type: 'deleted',
                        eventTitle: oldActivity.title,
                        eventType: oldActivity.type,
                        date: day.date,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            // Find modified activities
            newActivities.forEach((newActivity: any) => {
                const oldActivity = oldActivityMap.get(newActivity.id) as any;
                if (oldActivity) {
                    const titleChanged = oldActivity.title !== newActivity.title;
                    const timeChanged = oldActivity.startTime !== newActivity.startTime ||
                        oldActivity.endTime !== newActivity.endTime;

                    if (titleChanged || timeChanged) {
                        localChanges.push({
                            id: `${Date.now()}_${Math.random()}`,
                            type: 'modified',
                            eventTitle: newActivity.title,
                            eventType: newActivity.type,
                            date: day.date,
                            startTime: newActivity.startTime,
                            endTime: newActivity.endTime,
                            oldTime: oldActivity.startTime,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            });
        } else {
            // New day - track all activities as added
            const newActivities = day.activities || [];
            newActivities.forEach((activity: any) => {
                localChanges.push({
                    id: `${Date.now()}_${Math.random()}`,
                    type: 'added',
                    eventTitle: activity.title,
                    eventType: activity.type,
                    date: day.date,
                    startTime: activity.startTime,
                    endTime: activity.endTime,
                    timestamp: new Date().toISOString()
                });
            });

            // Track custody status if not 'none'
            if (day.status !== 'none') {
                localChanges.push({
                    id: `${Date.now()}_${Math.random()}`,
                    type: 'custody_changed',
                    custodyStatus: day.status,
                    date: day.date,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Update recent changes if any detected
        if (localChanges.length > 0) {
            setRecentChanges(prev => [...localChanges, ...prev].slice(0, 10));
        }

        // Optimistic UI Update
        setCustodyDays(prev => {
            const existing = prev.find(d => d.date === day.date);
            if (existing) {
                return prev.map(d => d.date === day.date ? day : d);
            }
            return [...prev, day];
        });

        // Push to Supabase
        if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                supabase.from('custody_days').upsert({
                    date: day.date,
                    status: day.status,
                    activities: day.activities,
                    user_id: user.id,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'date,user_id' }).then(({ error }) => {
                    if (error) {
                        console.error('Failed to save custody day:', error);
                    } else {
                        // Send detailed notifications for local changes
                        if (localChanges.length > 0) {
                            import('../services/notificationService').then(({ NotificationService }) => {
                                NotificationService.sendDetailedCalendarNotification(localChanges);
                            });
                        }
                    }
                });
            }
        }
    };

    const generateDummyData = (scenario: 'good' | 'average' | 'bad' = 'average'): Promise<number> => {
        return new Promise((resolve) => {
            import('../utils/seedData').then(({ generateScenarioData }) => {
                setReceipts([]);
                setGoals([]);
                setCustodyDays([]);

                const { receipts: newReceipts, custodyDays: newCustodyDays, goals: newGoals, monthlyBudget: newBudget } = generateScenarioData(scenario, 3);

                setTimeout(() => {
                    setReceipts(newReceipts);
                    setCustodyDays(newCustodyDays);
                    setGoals(newGoals);
                    setMonthlyBudget(newBudget);
                    // alert removed - caller handles feedback
                    setDataVersion(v => v + 1);
                    resolve(newReceipts.length);
                }, 50);
            });
        });
    };

    const spendRatio = useMemo(() => {
        if (monthlyBudget <= 0) return 0;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const thisMonthTotal = receipts
            .filter(r => {
                const d = new Date(r.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((acc, r) => acc + r.total, 0);
        return thisMonthTotal / monthlyBudget;
    }, [receipts, monthlyBudget]);

    return (
        <DataContext.Provider value={{
            receipts, setReceipts, addReceipts, updateReceipt, deleteReceipt, deleteAllReceipts,
            selectedReceipt, setSelectedReceipt,
            monthlyBudget, setMonthlyBudget,
            categoryBudgets, setCategoryBudgets,
            categories, setCategories,
            recurringExpenses, setRecurringExpenses,
            goals, setGoals,
            custodyDays, setCustodyDays, updateCustodyDay,
            ageRestricted, setAgeRestricted,
            childSupportMode, setChildSupportMode,
            ambientMode, setAmbientMode,
            showGlobalAmbient, setShowGlobalAmbient,
            helpEnabled, setHelpEnabled,
            isProMode, setIsProMode,
            setIsProModeWithTimestamp,
            proActivatedAt,
            goalsEnabled,
            setGoalsEnabled,
            financialSnapshotEnabled,
            setFinancialSnapshotEnabled,

            shownNotificationIds,
            markNotificationAsShown,
            unreadNotificationCount,
            markAllNotificationsAsRead,
            lastPartnerChanges,
            setLastPartnerChanges,
            isDataLoaded,
            dataVersion,
            generateDummyData,
            spendRatio,
            syncCustody,
            recentChanges,
            setRecentChanges
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
