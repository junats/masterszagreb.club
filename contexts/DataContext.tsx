import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Receipt, CategoryDefinition, Goal, RecurringExpense, CustodyDay, GoalType } from '../types'; // Adjust imports
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

interface DataContextType {
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

    // Meta
    isDataLoaded: boolean;
    dataVersion: number;
    generateDummyData: (scenario?: 'good' | 'average' | 'bad') => void;
    spendRatio: number;
}

import { useUser } from './UserContext';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: contextUser, signOut } = useUser();

    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [monthlyBudget, setMonthlyBudget] = useState(300);
    const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
    const [ageRestricted, setAgeRestricted] = useState(false);
    const [childSupportMode, setChildSupportMode] = useState(false);
    const [categories, setCategories] = useState<CategoryDefinition[]>(DEFAULT_CATEGORIES);
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
    const [custodyDays, setCustodyDays] = useState<CustodyDay[]>([]);
    const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
    const [ambientMode, setAmbientMode] = useState(false);
    const [showGlobalAmbient, setShowGlobalAmbient] = useState(true);
    const [helpEnabled, setHelpEnabled] = useState(false);
    const [isProMode, setIsProMode] = useState(false);
    const [dataVersion, setDataVersion] = useState(0);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

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
                    if (parsed.isProMode !== undefined) setIsProMode(parsed.isProMode);
                }

                const { value: savedCustody } = await Preferences.get({ key: 'truetrack_custody' });
                if (savedCustody) {
                    setCustodyDays(JSON.parse(savedCustody));
                }
            } catch (e) {
                console.error("Failed to load data", e);
            } finally {
                setIsDataLoaded(true);
            }
        };
        loadData();
    }, []);

    // --- Persistence Effects ---
    useEffect(() => {
        const saveReceipts = async () => {
            await Preferences.set({ key: RECEIPT_STORAGE_KEY, value: JSON.stringify(receipts) });
        };
        saveReceipts();
    }, [receipts]);

    useEffect(() => {
        const saveSettings = async () => {
            await Preferences.set({ key: SETTINGS_STORAGE_KEY, value: JSON.stringify({ budget: monthlyBudget, categoryBudgets, ageRestricted, childSupportMode, categories, recurringExpenses, goals, ambientMode, showGlobalAmbient, isProMode }) });
            await Preferences.set({ key: 'truetrack_custody', value: JSON.stringify(custodyDays) });
        };
        saveSettings();
    }, [monthlyBudget, categoryBudgets, ageRestricted, childSupportMode, categories, recurringExpenses, goals, custodyDays, ambientMode, showGlobalAmbient, isProMode]);

    // --- Widget Sync ---
    useEffect(() => {
        const syncWidget = async () => {
            try {
                await WidgetService.updateWidgetData(receipts, monthlyBudget);
            } catch (e) {
                console.error("Widget sync failed:", e);
            }
        };
        syncWidget();
    }, [receipts, monthlyBudget]);

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

        setReceipts(prev => {
            const existingSignatures = new Set(prev.map(r => getReceiptSignature(r)));
            const existingImageHashes = new Set(prev.map(r => r.imageHash).filter(Boolean));
            const existingFileHashes = new Set(prev.map(r => r.fileHash).filter(Boolean));
            const existingTransactionIds = new Set(prev.map(r => r.transactionId).filter(Boolean));

            const findWeakMatch = (r: Receipt) => {
                return prev.find(existing =>
                    existing.date === r.date &&
                    Math.abs(existing.total - r.total) < 0.01 &&
                    existing.id !== r.id
                );
            };

            for (const receipt of newReceipts) {
                const sig = getReceiptSignature(receipt);
                const imgHash = receipt.imageHash;
                const fHash = receipt.fileHash;
                const txId = receipt.transactionId;

                const isDuplicateSig = existingSignatures.has(sig);
                const isDuplicateImageHash = imgHash ? existingImageHashes.has(imgHash) : false;
                const isDuplicateFileHash = fHash ? existingFileHashes.has(fHash) : false;
                const isDuplicateTxId = txId ? existingTransactionIds.has(txId) : false;

                if (isDuplicateSig || isDuplicateImageHash || isDuplicateFileHash || isDuplicateTxId) {
                    duplicateCount++;
                    console.log(`Duplicate blocked: Sig=${isDuplicateSig}, ImgHash=${isDuplicateImageHash}, FileHash=${isDuplicateFileHash}, TxId=${isDuplicateTxId}`);
                    continue;
                }

                const weakMatch = findWeakMatch(receipt);
                if (weakMatch) {
                    const confirmMessage = `Potential duplicate detected:\n\nStore: ${receipt.storeName}\nDate: ${receipt.date}\nTotal: €${receipt.total.toFixed(2)}\n\nThis matches an existing receipt from "${weakMatch.storeName}".\n\nDo you want to add it anyway?`;
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

            // This effect needs to handle alerts outside the render cycle technically, 
            // but for now we follow the existing pattern. 
            // We can move alerts to a useEffect if we want to be pure.
            if (duplicateCount > 0) {
                setTimeout(() => {
                    alert(`${duplicateCount} duplicate receipt(s) were removed.`);
                }, 100);
            }

            const updatedReceipts = [...confirmedNewReceipts, ...prev];
            return updatedReceipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });

        setDataVersion(v => v + 1);
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
        alert('All receipts deleted.');
    };

    // --- Cloud Sync ---
    const syncCustody = async (manual: boolean = false) => {
        if (!supabase) {
            alert("Sync unavailable: App is running in Mock Mode (No Database Connection).");
            return;
        }

        // FETCH FRESH USER directly to avoid stale closure issues
        // const currentUser = await authService.getUser(); // Too silent

        // TIMEOUT WRAPPER: If Supabase hangs here, we must fail gracefully to stop the spinner.
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase Auth Timeout")), 5000));

        let currentUser = null;
        let authError = null;

        try {
            // @ts-ignore
            const result: any = await Promise.race([getUserPromise, timeoutPromise]);
            currentUser = result.data?.user;
            authError = result.error;
        } catch (e: any) {
            console.error("Sync Auth Hang:", e);
            if (manual) alert("Sync Failed: Connection timed out. Please restart the app.");
            return; // Exit to stop spinner
        }

        if (authError || !currentUser) {
            if (manual) {
                console.warn("Sync aborted: Supabase Auth Error:", authError);
                // Alert the ACTUAL error from Supabase
                const errorMsg = authError?.message || "No user found (Null)";
                alert(`Sync Auth Error: ${errorMsg}\n\nPlease sign in again.`);

                await signOut(); // Force logout to clean up state
            }
            return;
        }

        // Use currentUser.id for the query
        // The original logic used 'user.id' from the closure, which might be null.
        const userId = currentUser.id;

        try {
            const { data, error } = await supabase
                .from('custody_days')
                .select('*')
                .eq('user_id', currentUser.id);

            if (error) throw error;

            if (data) {
                // 1. Merge Remote -> Local
                // Create a map starting with LOCAL data
                const mergedMap = new Map(custodyDays.map(d => [d.date, d]));

                // Overwrite/Add REMOTE data (Server wins on conflict usually, but for empty server, local stays)
                data.forEach((row: any) => {
                    mergedMap.set(row.date, {
                        date: row.date,
                        status: row.status,
                        activities: row.activities || []
                    });
                });

                const mergedArray = Array.from(mergedMap.values());
                setCustodyDays(mergedArray);

                // 2. Push Merged -> Remote
                // This ensures non-empty local data is sent to the empty server
                if (mergedArray.length > 0) {
                    const updates = mergedArray.map((d: any) => ({
                        date: d.date,
                        status: d.status,
                        activities: d.activities,
                        user_id: currentUser.id, // Fixed: Use currentUser.id, not user.id
                        updated_at: new Date().toISOString()
                    }));

                    const { error: upsertError } = await supabase.from('custody_days').upsert(updates, { onConflict: 'date,user_id' });
                    if (upsertError) {
                        console.error('Sync push failed:', upsertError);
                        if (manual) alert("Sync Error: " + upsertError.message);
                    } else {
                        // Success feedback
                        if (manual) alert(`Synced! Merged ${data.length} remote days. Pushed ${updates.length} local days.`);
                    }
                } else {
                    if (manual) alert(`Synced! Pulled ${data.length} remote days. No local changes to push.`);
                }
            }
        } catch (err) {
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
                    if (error) console.error('Failed to save custody day:', error);
                });
            }
        }
    };

    const generateDummyData = (scenario: 'good' | 'average' | 'bad' = 'average') => {
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
                alert(`Generated ${scenario} data: ${newReceipts.length} receipts.`);
                setDataVersion(v => v + 1);
            }, 50);
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
            isDataLoaded,
            dataVersion,
            generateDummyData,
            spendRatio,
            syncCustody
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
