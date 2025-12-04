
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import ReceiptScanner from './components/ReceiptScanner';
import HistoryView from './components/HistoryView';
import Settings from './components/Settings';
import SupportView from './components/SupportView';
import AuthScreen from './components/AuthScreen';
import ProvisionAnalysis from './components/ProvisionAnalysis';
import SettlementView from './components/SettlementView';
import CustodyCalendar from './components/CustodyCalendar';
import { ViewState, Receipt, User, SubscriptionTier, CategoryDefinition, Category, RecurringExpense, CustodyDay, Goal, GoalType } from './types';
import { authService, isMockMode } from './services/authService';
import { Database, X } from 'lucide-react';

const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: 'necessity', name: 'Necessity', color: '#38bdf8' }, // Sky
  { id: 'food', name: 'Food', color: '#4ade80' },           // Green
  { id: 'luxury', name: 'Luxury', color: '#f472b6' },       // Pink
  { id: 'household', name: 'Household', color: '#818cf8' }, // Indigo
  { id: 'health', name: 'Health', color: '#fb7185' },       // Rose
  { id: 'transport', name: 'Transport', color: '#facc15' }, // Yellow
  { id: 'education', name: 'Education', color: '#6366f1' }, // Indigo
  { id: 'other', name: 'Other', color: '#94a3b8' },         // Slate
];

const DEFAULT_GOALS: Goal[] = [
  { id: 'junk_food', type: GoalType.JUNK_FOOD, name: 'Stop Junk Food', isEnabled: false, keywords: ['mcdonalds', 'kfc', 'burger king', 'pizza', 'chips', 'candy', 'chocolate', 'takeaway', 'fast food'], streak: 0, emoji: '🍔' },
  { id: 'alcohol', type: GoalType.ALCOHOL, name: 'Reduce Alcohol', isEnabled: false, keywords: ['beer', 'wine', 'vodka', 'whiskey', 'liquor', 'alcohol', 'pub', 'bar', 'off license'], streak: 0, emoji: '🍺' },
  { id: 'smoking', type: GoalType.SMOKING, name: 'Quit Smoking', isEnabled: false, keywords: ['cigarettes', 'tobacco', 'vape', 'smoke', 'nicotine', 'cigar'], streak: 0, emoji: '🚬' },
  { id: 'gaming', type: GoalType.GAMING, name: 'Limit Gaming', isEnabled: false, keywords: ['steam', 'playstation', 'xbox', 'nintendo', 'game', 'twitch', 'fortnite', 'roblox'], streak: 0, emoji: '🎮' },
  { id: 'gambling', type: GoalType.GAMBLING, name: 'Stop Gambling', isEnabled: false, keywords: ['bet', 'casino', 'lottery', 'lotto', 'poker', 'bookmakers', 'ladbrokes', 'paddy power'], streak: 0, emoji: '🎰' },
  { id: 'caffeine', type: GoalType.CAFFEINE, name: 'Cut Caffeine', isEnabled: false, keywords: ['coffee', 'starbucks', 'costa', 'espresso', 'latte', 'caffeine', 'energy drink', 'red bull', 'monster'], streak: 0, emoji: '☕' },
  { id: 'sugar', type: GoalType.SUGAR, name: 'Reduce Sugar', isEnabled: false, keywords: ['sugar', 'cake', 'cookies', 'donuts', 'sweets', 'soda', 'coke', 'pepsi', 'ice cream'], streak: 0, emoji: '🍩' },
  { id: 'online_shopping', type: GoalType.ONLINE_SHOPPING, name: 'Limit Online Shopping', isEnabled: false, keywords: ['amazon', 'ebay', 'temu', 'shein', 'asos', 'online order'], streak: 0, emoji: '🛍️' },
  { id: 'fast_fashion', type: GoalType.FAST_FASHION, name: 'Avoid Fast Fashion', isEnabled: false, keywords: ['zara', 'h&m', 'primark', 'shein', 'boohoo', 'forever 21'], streak: 0, emoji: '👗' },
  { id: 'ride_sharing', type: GoalType.RIDE_SHARING, name: 'Less Ride Sharing', isEnabled: false, keywords: ['uber', 'lyft', 'taxi', 'bolt', 'freenow'], streak: 0, emoji: '🚕' },
  { id: 'streaming', type: GoalType.STREAMING, name: 'Control Subscriptions', isEnabled: false, keywords: ['netflix', 'spotify', 'disney', 'hulu', 'prime video', 'apple tv', 'youtube premium'], streak: 0, emoji: '📺' },
  { id: 'savings', type: GoalType.SAVINGS, name: 'Boost Savings', isEnabled: false, keywords: [], streak: 0, emoji: '💰' },
];

const getReceiptSignature = (r: Receipt) => {
  const cleanStore = r.storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanRef = (r.referenceCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const priceCents = Math.round(r.total * 100);
  return `${cleanStore}|${r.date}|${priceCents}|${r.type || 'receipt'}|${cleanRef}`;
};

import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import { WidgetService } from './services/widgetService';

const RECEIPT_STORAGE_KEY = 'truetrack_receipts';
const SETTINGS_STORAGE_KEY = 'truetrack_settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // ... (existing code)

  const handleViewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setCurrentView('history');
  };

  // ...
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState(300);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [ageRestricted, setAgeRestricted] = useState(false);
  const [showDevBanner, setShowDevBanner] = useState(true);
  const [childSupportMode, setChildSupportMode] = useState(false);
  const [categories, setCategories] = useState<CategoryDefinition[]>(DEFAULT_CATEGORIES);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [custodyDays, setCustodyDays] = useState<CustodyDay[]>([]);
  const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);

  // Update Widget Data whenever receipts or budget changes
  useEffect(() => {
    try {
      console.log('App.tsx: Triggering Widget Update', { receiptsCount: receipts.length, monthlyBudget });
      WidgetService.updateWidgetData(receipts, monthlyBudget);
    } catch (e) {
      console.error('App.tsx: Widget Update Failed', e);
    }
  }, [receipts, monthlyBudget]);

  // Initial Load
  useEffect(() => {
    const initAuth = async () => {
      console.log('App: initAuth starting...');
      try {
        const currentUser = await authService.getUser();
        console.log('App: initAuth currentUser:', currentUser);
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (e) {
        console.error('App: initAuth error:', e);
      } finally {
        setIsAuthLoading(false);
        console.log('App: initAuth finished');
        // Hide splash screen after auth check
        await SplashScreen.hide();
      }
    };
    initAuth();

    // Safety timeout: Force hide splash screen after 3s if auth hangs
    const safetyTimeout = setTimeout(async () => {
      console.log('App: Safety timeout triggered, hiding splash screen');
      await SplashScreen.hide();
    }, 3000);

    return () => clearTimeout(safetyTimeout);
  }, []);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

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
          } else {
            setReceipts([]);
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

  useEffect(() => {
    const saveReceipts = async () => {
      await Preferences.set({ key: RECEIPT_STORAGE_KEY, value: JSON.stringify(receipts) });
    };
    saveReceipts();
  }, [receipts]);

  useEffect(() => {
    const saveSettings = async () => {
      await Preferences.set({ key: SETTINGS_STORAGE_KEY, value: JSON.stringify({ budget: monthlyBudget, categoryBudgets, ageRestricted, childSupportMode, categories, recurringExpenses, goals }) });
      await Preferences.set({ key: 'truetrack_custody', value: JSON.stringify(custodyDays) });
    };
    saveSettings();
  }, [monthlyBudget, categoryBudgets, ageRestricted, childSupportMode, categories, recurringExpenses, goals, custodyDays]);

  // Check for recurring expenses on load
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
          // Create receipt
          const newReceipt: Receipt = {
            id: `recurring_${Date.now()}_${expense.id}`,
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
            type: 'bill', // Fixed type
            categoryId: expense.category // For backward compatibility
          };
          newReceipts.push(newReceipt);

          // Calculate next due date
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
          alert(`Added ${newReceipts.length} recurring expense(s):\n${newReceipts.map(r => r.storeName).join(', ')}`);
        }
      }
    };

    checkRecurring();
  }, [isDataLoaded, recurringExpenses]); // Added recurringExpenses to dependency array

  const handleScanComplete = (newReceipts: Receipt[]) => {
    let duplicateCount = 0;
    let potentialDuplicates: Receipt[] = [];
    let confirmedNewReceipts: Receipt[] = [];

    setReceipts(prev => {
      const existingSignatures = new Set(prev.map(r => getReceiptSignature(r)));
      const existingImageHashes = new Set(prev.map(r => r.imageHash).filter(Boolean));
      const existingFileHashes = new Set(prev.map(r => r.fileHash).filter(Boolean));
      const existingTransactionIds = new Set(prev.map(r => r.transactionId).filter(Boolean));

      // Helper to check for existing receipt with same Date + Total (Weak Match)
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

        // 1. Strong Checks (Definite Duplicates)
        const isDuplicateSig = existingSignatures.has(sig);
        const isDuplicateImageHash = imgHash ? existingImageHashes.has(imgHash) : false;
        const isDuplicateFileHash = fHash ? existingFileHashes.has(fHash) : false;
        const isDuplicateTxId = txId ? existingTransactionIds.has(txId) : false;

        if (isDuplicateSig || isDuplicateImageHash || isDuplicateFileHash || isDuplicateTxId) {
          duplicateCount++;
          console.log(`Duplicate blocked: Sig=${isDuplicateSig}, ImgHash=${isDuplicateImageHash}, FileHash=${isDuplicateFileHash}, TxId=${isDuplicateTxId}`);
          continue;
        }

        // 2. Weak Check (Potential Duplicate -> Ask User)
        const weakMatch = findWeakMatch(receipt);
        if (weakMatch) {
          // We can't use window.confirm inside the loop easily for multiple items without blocking UI weirdly.
          // For simplicity in this iteration, we'll use confirm() which blocks execution.
          // In a real app, we'd queue these for a custom modal.
          const confirmMessage = `Potential duplicate detected:\n\nStore: ${receipt.storeName}\nDate: ${receipt.date}\nTotal: €${receipt.total.toFixed(2)}\n\nThis matches an existing receipt from "${weakMatch.storeName}".\n\nDo you want to add it anyway?`;

          if (window.confirm(confirmMessage)) {
            confirmedNewReceipts.push(receipt);
            // Add to sets to prevent self-duplicates in this batch
            existingSignatures.add(sig);
            if (txId) existingTransactionIds.add(txId);
          } else {
            duplicateCount++;
          }
        } else {
          // No match found, add it
          confirmedNewReceipts.push(receipt);
          existingSignatures.add(sig);
          if (txId) existingTransactionIds.add(txId);
        }
      }

      if (duplicateCount > 0) {
        setTimeout(() => {
          alert(`${duplicateCount} duplicate receipt(s) were removed.`);
        }, 500);
      }

      const updatedReceipts = [...confirmedNewReceipts, ...prev];
      // Sort by date descending (newest first)
      return updatedReceipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    setCurrentView('dashboard');
  };

  const handleDeleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const handleDeleteAllReceipts = () => {
    setReceipts([]);
    alert('All receipts deleted.');
  };

  const handleUpdateReceipt = (updated: Receipt) => {
    setReceipts(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setUser(null);
    setReceipts([]);
    setCurrentView('dashboard');
  };

  const handleUpgrade = () => {
    if (user) {
      const updatedUser = { ...user, tier: SubscriptionTier.PRO };
      setUser(updatedUser);
      Preferences.set({ key: 'truetrack_session', value: JSON.stringify(updatedUser) });
      alert("Upgraded to Pro (Mock)!");
    }
  };

  // --- DEV TOOLS ---
  const generateDummyData = () => {
    const dummyProducts = [
      // JUNK FOOD
      { name: 'McDonalds Big Mac Meal', price: 9.50, store: 'McDonalds', category: Category.FOOD, goalType: GoalType.JUNK_FOOD },
      { name: 'Large Pepperoni Pizza', price: 18.00, store: 'Dominos', category: Category.FOOD, goalType: GoalType.JUNK_FOOD },
      { name: 'Family Size Chips', price: 3.50, store: 'Tesco', category: Category.FOOD, goalType: GoalType.JUNK_FOOD },
      { name: 'Chocolate Bar Multipack', price: 4.00, store: 'Spar', category: Category.FOOD, goalType: GoalType.JUNK_FOOD },

      // ALCOHOL
      { name: 'Heineken 12 Pack', price: 22.00, store: 'Tesco', category: Category.FOOD, goalType: GoalType.ALCOHOL },
      { name: 'Bottle of Vodka', price: 28.00, store: 'Off License', category: Category.FOOD, goalType: GoalType.ALCOHOL },
      { name: 'Craft Beer Selection', price: 15.00, store: 'Local Pub', category: Category.FOOD, goalType: GoalType.ALCOHOL },
      { name: 'Pinot Grigio Wine', price: 12.00, store: 'Lidl', category: Category.FOOD, goalType: GoalType.ALCOHOL },

      // SMOKING
      { name: 'Pack of Cigarettes', price: 16.50, store: 'Spar', category: Category.OTHER, goalType: GoalType.SMOKING },
      { name: 'Vape Juice', price: 8.00, store: 'Vape Shop', category: Category.OTHER, goalType: GoalType.SMOKING },
      { name: 'Disposable Vape', price: 10.00, store: 'Newsagent', category: Category.OTHER, goalType: GoalType.SMOKING },

      // GAMING
      { name: 'Steam Wallet Top-up', price: 20.00, store: 'Steam', category: Category.LUXURY, goalType: GoalType.GAMING },
      { name: 'PlayStation Plus Sub', price: 15.00, store: 'PlayStation', category: Category.LUXURY, goalType: GoalType.GAMING },
      { name: 'New Game Release', price: 69.99, store: 'GameStop', category: Category.LUXURY, goalType: GoalType.GAMING },
      { name: 'Robux Gift Card', price: 10.00, store: 'Tesco', category: Category.LUXURY, goalType: GoalType.GAMING },

      // GAMBLING
      { name: 'Lottery Ticket', price: 10.00, store: 'Newsagent', category: Category.LUXURY, goalType: GoalType.GAMBLING },
      { name: 'Online Bet Deposit', price: 50.00, store: 'Paddy Power', category: Category.LUXURY, goalType: GoalType.GAMBLING },
      { name: 'Casino Chips', price: 100.00, store: 'Casino', category: Category.LUXURY, goalType: GoalType.GAMBLING },

      // CAFFEINE
      { name: 'Starbucks Latte', price: 4.50, store: 'Starbucks', category: Category.FOOD, goalType: GoalType.CAFFEINE },
      { name: 'Monster Energy Drink', price: 2.50, store: 'Spar', category: Category.FOOD, goalType: GoalType.CAFFEINE },
      { name: 'Nespresso Pods', price: 25.00, store: 'Nespresso', category: Category.FOOD, goalType: GoalType.CAFFEINE },
      { name: 'Costa Cappuccino', price: 3.80, store: 'Costa', category: Category.FOOD, goalType: GoalType.CAFFEINE },

      // SUGAR
      { name: 'Coca Cola 2L', price: 3.00, store: 'Tesco', category: Category.FOOD, goalType: GoalType.SUGAR },
      { name: 'Ben & Jerrys Ice Cream', price: 6.50, store: 'Tesco', category: Category.FOOD, goalType: GoalType.SUGAR },
      { name: 'Bag of Sweets', price: 2.00, store: 'Newsagent', category: Category.FOOD, goalType: GoalType.SUGAR },
      { name: 'Donut Box', price: 12.00, store: 'Krispy Kreme', category: Category.FOOD, goalType: GoalType.SUGAR },

      // ONLINE SHOPPING
      { name: 'Amazon Order', price: 45.00, store: 'Amazon', category: Category.HOUSEHOLD, goalType: GoalType.ONLINE_SHOPPING },
      { name: 'Temu Gadgets', price: 25.00, store: 'Temu', category: Category.LUXURY, goalType: GoalType.ONLINE_SHOPPING },
      { name: 'eBay Purchase', price: 30.00, store: 'eBay', category: Category.OTHER, goalType: GoalType.ONLINE_SHOPPING },

      // FAST FASHION
      { name: 'Shein Haul', price: 80.00, store: 'Shein', category: Category.LUXURY, goalType: GoalType.FAST_FASHION },
      { name: 'Zara Dress', price: 49.99, store: 'Zara', category: Category.LUXURY, goalType: GoalType.FAST_FASHION },
      { name: 'Primark Clothes', price: 35.00, store: 'Primark', category: Category.NECESSITY, goalType: GoalType.FAST_FASHION },

      // RIDE SHARING
      { name: 'Uber Ride', price: 18.50, store: 'Uber', category: Category.TRANSPORT, goalType: GoalType.RIDE_SHARING },
      { name: 'Taxi Fare', price: 22.00, store: 'FreeNow', category: Category.TRANSPORT, goalType: GoalType.RIDE_SHARING },
      { name: 'Lyft Ride', price: 15.00, store: 'Lyft', category: Category.TRANSPORT, goalType: GoalType.RIDE_SHARING },

      // STREAMING
      { name: 'Netflix Subscription', price: 15.99, store: 'Netflix', category: Category.LUXURY, goalType: GoalType.STREAMING },
      { name: 'Spotify Premium', price: 10.99, store: 'Spotify', category: Category.LUXURY, goalType: GoalType.STREAMING },
      { name: 'Disney+ Monthly', price: 8.99, store: 'Disney+', category: Category.LUXURY, goalType: GoalType.STREAMING },

      // GENERAL / OTHER
      { name: 'Weekly Groceries', price: 120.00, store: 'Tesco', category: Category.FOOD, goalType: undefined },
      { name: 'Petrol Refill', price: 60.00, store: 'Shell', category: Category.TRANSPORT, goalType: undefined },
      { name: 'Electricity Bill', price: 150.00, store: 'Electric Ireland', category: Category.HOUSEHOLD, goalType: undefined },
      { name: 'Gym Membership', price: 40.00, store: 'Flyefit', category: Category.HEALTH, goalType: undefined },
      { name: 'School Uniform', price: 85.00, store: 'Marks & Spencer', category: Category.EDUCATION, goalType: undefined },
      { name: 'Pharmacy Meds', price: 25.00, store: 'Boots', category: Category.HEALTH, goalType: undefined },
    ];

    const newReceipts: Receipt[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Generate 40 receipts to ensure good coverage
    for (let i = 0; i < 40; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const date = new Date(currentYear, currentMonth, day);
      const product = dummyProducts[Math.floor(Math.random() * dummyProducts.length)];

      // Add some variance to price
      const finalPrice = parseFloat((product.price * (0.8 + Math.random() * 0.4)).toFixed(2));

      // Add some child related items occasionally
      const isChild = Math.random() > 0.8;

      newReceipts.push({
        id: `dummy_${Date.now()}_${i}`,
        storeName: product.store,
        date: date.toISOString().split('T')[0],
        total: finalPrice,
        items: [{
          name: product.name,
          price: finalPrice,
          quantity: 1,
          category: product.category,
          isChildRelated: isChild,
          goalType: product.goalType
        }],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
      });
    }

    setReceipts(prev => [...newReceipts, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    // Generate Random Category Budgets
    const newCategoryBudgets: Record<string, number> = {};
    categories.forEach(cat => {
      // Random budget between 100 and 600
      newCategoryBudgets[cat.id] = Math.floor(Math.random() * 500) + 100;
    });
    setCategoryBudgets(newCategoryBudgets);

    alert("Added 40 diverse dummy receipts and set random category budgets!");
  };

  const handleUpdateCustodyDay = (day: CustodyDay) => {
    setCustodyDays(prev => {
      const existing = prev.find(d => d.date === day.date);
      if (existing) {
        return prev.map(d => d.date === day.date ? day : d);
      }
      return [...prev, day];
    });
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setCurrentView('dashboard');
  };

  if (isAuthLoading || !isDataLoaded) {
    return <div className="h-screen w-full bg-background flex items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="flex flex-col h-full bg-slate-900">
            {/* Debug Button for Widget - MOVED TO TOP LEFT */}
            {/* <div style={{
              position: 'absolute',
              top: '60px',
              left: '20px',
              zIndex: 99999
            }}>
              <button
                onClick={async () => {
                  console.log('Manual Widget Update Triggered');

                  // 1. Check Global Capacitor Object
                  const cap = (window as any).Capacitor;
                  if (!cap) {
                    alert('CRITICAL: window.Capacitor is undefined!');
                    return;
                  }

                  // 2. Check Plugins List
                  const plugins = Object.keys(cap.Plugins || {});
                  console.log('Available Plugins:', plugins);

                  // 3. Check Specific Plugin
                  const plugin = cap.Plugins.TrueTrackWidget;
                  if (!plugin) {
                    alert('ERROR: TrueTrackWidget is NOT in Capacitor.Plugins\nAvailable: ' + plugins.join(', '));
                  } else {
                    console.log('SUCCESS: TrueTrackWidget found in Capacitor.Plugins');
                  }

                  try {
                    // 4. Test Service Ping
                    console.log('Testing via WidgetService.ping()...');
                    const pong = await WidgetService.ping();
                    console.log('Ping Result:', pong);
                    alert('Ping Success: ' + JSON.stringify(pong));

                    // 5. Test Echo
                    console.log('Testing Echo...');
                    const echoResult = await WidgetService.echo('Hello Native');
                    console.log('Echo Result:', echoResult);

                    // 6. Test Widget Update
                    const result = await WidgetService.updateWidgetData(receipts, monthlyBudget);
                    alert('Widget Update Sent!\nPath: ' + (result?.filePath || 'unknown'));

                  } catch (e: any) {
                    console.error('Widget Update Failed', e);
                    alert('Update Failed:\n' + (e.message || JSON.stringify(e)));
                  }
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc2626', // Red-600
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  border: '2px solid white'
                }}
              >
                DEBUG: Force Widget Update
              </button>
            </div> */}
            <Dashboard
              key={`dashboard-${receipts.length}-${monthlyBudget}-${ageRestricted}`}
              receipts={receipts}
              monthlyBudget={monthlyBudget}
              ageRestricted={ageRestricted}
              childSupportMode={childSupportMode}
              categories={categories}
              categoryBudgets={categoryBudgets}
              recurringExpenses={recurringExpenses}
              setRecurringExpenses={setRecurringExpenses}
              onViewReceipt={handleViewReceipt}
              onProvisionClick={() => setCurrentView('provision')}
              onSettlementClick={() => setCurrentView('settlement')}
              onCustodyClick={() => setCurrentView('custody')}
              goals={goals}
            />
          </div>
        );
      case 'custody':
        return (
          <CustodyCalendar
            custodyDays={custodyDays}
            onUpdateDay={handleUpdateCustodyDay}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'scan':
        return (
          <ReceiptScanner
            onScanComplete={handleScanComplete}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      case 'history':
        return (
          <HistoryView
            receipts={receipts}
            ageRestricted={ageRestricted}
            categoryBudgets={categoryBudgets}
            onDelete={handleDeleteReceipt}
            onUpdate={handleUpdateReceipt}
            selectedReceipt={selectedReceipt}
            onSelectReceipt={setSelectedReceipt}
            childSupportMode={childSupportMode}
          />
        );
      case 'support':
        return <SupportView />;


      // ... existing imports

      // Inside App component renderView switch:
      case 'settlement':
        return (
          <div className="p-4 text-white">
            <h1>INLINED DEBUG VIEW</h1>
            <button onClick={() => setCurrentView('dashboard')} className="bg-blue-500 p-2 rounded mt-4">Back</button>
          </div>
        );
      case 'provision':
        return (
          <ProvisionAnalysis
            receipts={receipts}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'settings':
        return (
          <Settings
            monthlyBudget={monthlyBudget}
            setMonthlyBudget={setMonthlyBudget}
            categoryBudgets={categoryBudgets}
            setCategoryBudgets={setCategoryBudgets}
            ageRestricted={ageRestricted}
            setAgeRestricted={setAgeRestricted}
            childSupportMode={childSupportMode}
            setChildSupportMode={setChildSupportMode}
            categories={categories}
            setCategories={setCategories}
            user={user}
            onSignOut={handleSignOut}
            onUpgrade={handleUpgrade}
            onDeleteAll={handleDeleteAllReceipts}
            goals={goals}
            setGoals={setGoals}
          />
        );
      default:
        // Force re-render when switching back to dashboard to trigger animations
        return <Dashboard receipts={receipts} monthlyBudget={monthlyBudget} ageRestricted={ageRestricted} onViewReceipt={handleViewReceipt} onProvisionClick={() => setCurrentView('provision')} goals={goals} />;
    }
  };

  return (
    <div className="h-screen w-full bg-background relative overflow-hidden flex flex-col pt-safe safe-area-top">
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {isMockMode && showDevBanner && (
        <div className="bg-indigo-900/90 text-indigo-100 text-[10px] py-1 px-3 text-center border-b border-indigo-500/30 flex items-center justify-between relative z-50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mx-auto">
            <Database size={12} className="text-indigo-400" />
            <span>Running in <strong>Mock Mode</strong>.</span>
            <button onClick={generateDummyData} className="ml-2 bg-indigo-500/20 hover:bg-indigo-500/40 px-2 py-0.5 rounded text-[9px] font-bold border border-indigo-500/30 transition-colors">
              SEED DATA
            </button>
          </div>
          <button onClick={() => setShowDevBanner(false)} className="absolute right-2 p-1 hover:text-white">
            <X size={12} />
          </button>
        </div>
      )}

      <main className="flex-1 w-full max-w-md mx-auto relative z-10 h-full">
        <div key={currentView} className="h-full animate-fade-in">
          <ErrorBoundary>
            {renderView()}
          </ErrorBoundary>
        </div>
      </main>

      <Navigation currentView={currentView} setView={setCurrentView} isVisible={!!user} childSupportMode={childSupportMode} />
    </div>
  );
};

export default App;
