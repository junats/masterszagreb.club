import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
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
import IntroTour from './components/IntroTour';
import { ViewState, Receipt, User, SubscriptionTier, CategoryDefinition, Category, RecurringExpense, CustodyDay, Goal, GoalType, ChildEvent } from './types';
import { authService, isMockMode } from './services/authService';
import { Database, X, Shield } from 'lucide-react';
import { AmbientBackground } from './components/AmbientBackground';
import { WidgetService } from './services/widgetService';
import { HapticService } from './services/HapticService';
import { ImpactStyle } from '@capacitor/haptics';

const RECEIPT_STORAGE_KEY = 'truetrack_receipts';
const SETTINGS_STORAGE_KEY = 'truetrack_settings';

const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: 'necessity', name: 'Necessity', color: '#38bdf8' }, // Sky
  { id: 'food', name: 'Food', color: '#4ade80' },           // Green
  { id: 'dining', name: 'Dining', color: '#f97316' },       // Orange
  { id: 'alcohol', name: 'Alcohol', color: '#ef4444' },     // Red
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
  return `${cleanStore}| ${r.date}| ${priceCents}| ${r.type || 'receipt'}| ${cleanRef} `;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState(300);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [ageRestricted, setAgeRestricted] = useState(false);
  const [showDevBanner, setShowDevBanner] = useState(false);
  const [childSupportMode, setChildSupportMode] = useState(false);
  const [categories, setCategories] = useState<CategoryDefinition[]>(DEFAULT_CATEGORIES);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [custodyDays, setCustodyDays] = useState<CustodyDay[]>([]);
  const [childEvents, setChildEvents] = useState<ChildEvent[]>([]);
  const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
  const [showTour, setShowTour] = useState(false);
  const [ambientMode, setAmbientMode] = useState(true); // Master switch
  const [showGlobalAmbient, setShowGlobalAmbient] = useState(true); // App background specific
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [direction, setDirection] = useState(0);

  const handleViewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setCurrentView('history');
  };

  // Helper to handle view changes with direction
  const handleSetView = (newView: ViewState) => {
    HapticService.impact(ImpactStyle.Light);
    const navOrder = ['dashboard', 'scan', 'history', ...(childSupportMode ? ['support'] : []), 'settings'];
    const currentIndex = navOrder.indexOf(currentView);
    const newIndex = navOrder.indexOf(newView);

    if (currentIndex !== -1 && newIndex !== -1) {
      setDirection(newIndex > currentIndex ? 1 : -1);
    } else {
      setDirection(0);
    }
    setCurrentView(newView);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      scale: 1,
      opacity: 1,
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
      zIndex: 2, // Entering slide is on top
      boxShadow: '-5px 0 25px rgba(0,0,0,0.5)' // Shadow for depth
    }),
    center: {
      zIndex: 1,
      x: 0,
      scale: 1,
      opacity: 1,
      position: 'relative' as const,
      width: '100%',
      height: '100%',
      boxShadow: 'none'
    },
    exit: (direction: number) => ({
      zIndex: 0, // Exiting slide is behind
      x: direction < 0 ? '20%' : '-20%', // Parallax effect (moves less)
      scale: 0.95, // Slight scale down
      opacity: 0.8, // Slight fade
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
      boxShadow: 'none'
    })
  };

  useEffect(() => {
    const checkTour = async () => {
      const { value } = await Preferences.get({ key: 'has_seen_tour' });
      if (!value) {
        // Delay slightly to allow app to settle
        setTimeout(() => setShowTour(true), 1000);
      }
    };
    checkTour();
  }, []);

  const handleTourComplete = async () => {
    setShowTour(false);
    await Preferences.set({ key: 'has_seen_tour', value: 'true' });
  };

  // Calculate Spend Ratio for Ambient Background (Must be before early returns)
  const spendRatio = React.useMemo(() => {
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
          if (parsed.ambientMode !== undefined) setAmbientMode(parsed.ambientMode);
          if (parsed.showGlobalAmbient !== undefined) setShowGlobalAmbient(parsed.showGlobalAmbient);
        }

        const { value: savedCustody } = await Preferences.get({ key: 'truetrack_custody' });
        if (savedCustody) {
          setCustodyDays(JSON.parse(savedCustody));
        }

        const { value: savedEvents } = await Preferences.get({ key: 'truetrack_child_events' });
        if (savedEvents) {
          setChildEvents(JSON.parse(savedEvents));
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
      await Preferences.set({ key: SETTINGS_STORAGE_KEY, value: JSON.stringify({ budget: monthlyBudget, categoryBudgets, ageRestricted, childSupportMode, categories, recurringExpenses, goals, ambientMode, showGlobalAmbient }) });
      await Preferences.set({ key: 'truetrack_custody', value: JSON.stringify(custodyDays) });
      await Preferences.set({ key: 'truetrack_child_events', value: JSON.stringify(childEvents) });
    };
    saveSettings();
  }, [monthlyBudget, categoryBudgets, ageRestricted, childSupportMode, categories, recurringExpenses, goals, custodyDays, ambientMode, showGlobalAmbient, childEvents]);

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
          alert(`Added ${newReceipts.length} recurring expense(s): \n${newReceipts.map(r => r.storeName).join(', ')} `);
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
          console.log(`Duplicate blocked: Sig = ${isDuplicateSig}, ImgHash = ${isDuplicateImageHash}, FileHash = ${isDuplicateFileHash}, TxId = ${isDuplicateTxId} `);
          continue;
        }

        // 2. Weak Check (Potential Duplicate -> Ask User)
        const weakMatch = findWeakMatch(receipt);
        if (weakMatch) {
          // We can't use window.confirm inside the loop easily for multiple items without blocking UI weirdly.
          // For simplicity in this iteration, we'll use confirm() which blocks execution.
          // In a real app, we'd queue these for a custom modal.
          const confirmMessage = `Potential duplicate detected: \n\nStore: ${receipt.storeName} \nDate: ${receipt.date} \nTotal: €${receipt.total.toFixed(2)} \n\nThis matches an existing receipt from "${weakMatch.storeName}".\n\nDo you want to add it anyway ? `;

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
      // --- NECESSITY ---
      { name: 'Rent Payment', price: 1200.00, store: 'Landlord', category: Category.NECESSITY, goalType: undefined },
      { name: 'Electricity Bill', price: 145.50, store: 'Electric Ireland', category: Category.NECESSITY, goalType: undefined },
      { name: 'Gas Bill', price: 85.20, store: 'Bord Gais', category: Category.NECESSITY, goalType: undefined },
      { name: 'Internet Bill', price: 60.00, store: 'Virgin Media', category: Category.NECESSITY, goalType: undefined },
      { name: 'Mobile Phone Bill', price: 45.00, store: 'Vodafone', category: Category.NECESSITY, goalType: undefined },
      { name: 'Car Insurance', price: 80.00, store: 'AXA', category: Category.NECESSITY, goalType: undefined },
      { name: 'Work Boots', price: 110.00, store: 'Workwear Store', category: Category.NECESSITY, goalType: undefined },

      // --- FOOD (Groceries) ---
      { name: 'Weekly Groceries', price: 154.32, store: 'Tesco', category: Category.FOOD, goalType: undefined },
      { name: 'Milk & Bread', price: 5.50, store: 'Spar', category: Category.FOOD, goalType: undefined },
      { name: 'Chicken Fillets', price: 12.00, store: 'Lidl', category: Category.FOOD, goalType: undefined },
      { name: 'Fresh Vegetables', price: 8.45, store: 'Aldi', category: Category.FOOD, goalType: undefined },
      { name: 'Cereal & Milk', price: 6.75, store: 'Dunnes Stores', category: Category.FOOD, goalType: undefined },
      { name: 'Butcher Meat Pack', price: 45.00, store: 'Local Butcher', category: Category.FOOD, goalType: undefined },
      { name: 'Fruit Basket', price: 15.00, store: 'SuperValu', category: Category.FOOD, goalType: undefined },

      // --- DINING (Restaurants/Takeaway/Cafe) ---
      { name: 'Big Mac Meal', price: 9.50, store: 'McDonalds', category: Category.DINING, goalType: GoalType.JUNK_FOOD },
      { name: 'Pepperoni Pizza', price: 18.00, store: 'Dominos', category: Category.DINING, goalType: GoalType.JUNK_FOOD },
      { name: 'Chicken Bucket', price: 24.00, store: 'KFC', category: Category.DINING, goalType: GoalType.JUNK_FOOD },
      { name: 'Whopper Meal', price: 10.20, store: 'Burger King', category: Category.DINING, goalType: GoalType.JUNK_FOOD },
      { name: 'Cappuccino & Muffin', price: 8.50, store: 'Starbucks', category: Category.DINING, goalType: GoalType.CAFFEINE },
      { name: 'Latte', price: 4.20, store: 'Costa Coffee', category: Category.DINING, goalType: GoalType.CAFFEINE },
      { name: 'Sushi Platter', price: 32.00, store: 'Sushi Bar', category: Category.DINING, goalType: undefined },
      { name: 'Indian Takeaway', price: 45.50, store: 'Spice of India', category: Category.DINING, goalType: undefined },
      { name: 'Thai Curry', price: 16.50, store: 'Camile Thai', category: Category.DINING, goalType: undefined },
      { name: 'Burrito Bowl', price: 11.50, store: 'Boojum', category: Category.DINING, goalType: undefined },
      { name: 'Brunch with Friends', price: 28.00, store: 'Local Cafe', category: Category.DINING, goalType: undefined },

      // --- ALCOHOL ---
      { name: 'Heineken Slab (24)', price: 45.00, store: 'Tesco', category: Category.ALCOHOL, goalType: GoalType.ALCOHOL },
      { name: 'Guinness 8 Pack', price: 16.00, store: 'SuperValu', category: Category.ALCOHOL, goalType: GoalType.ALCOHOL },
      { name: 'Bottle of Vodka', price: 28.00, store: 'Off License', category: Category.ALCOHOL, goalType: GoalType.ALCOHOL },
      { name: 'Gin & Tonic Mix', price: 35.00, store: 'Off License', category: Category.ALCOHOL, goalType: GoalType.ALCOHOL },
      { name: 'Craft Beer Flight', price: 18.00, store: 'Brewery Bar', category: Category.ALCOHOL, goalType: GoalType.ALCOHOL },
      { name: 'Bottle of Red Wine', price: 14.00, store: 'Lidl', category: Category.ALCOHOL, goalType: GoalType.ALCOHOL },
      { name: 'Prosecco', price: 12.00, store: 'Aldi', category: Category.ALCOHOL, goalType: GoalType.ALCOHOL },
      { name: 'Whiskey Bottle', price: 45.00, store: 'Jameson Distillery', category: Category.ALCOHOL, goalType: GoalType.ALCOHOL },

      // --- LUXURY ---
      { name: 'Cinema Tickets', price: 24.00, store: 'Odeon', category: Category.LUXURY, goalType: undefined },
      { name: 'Netflix Subscription', price: 15.99, store: 'Netflix', category: Category.LUXURY, goalType: GoalType.STREAMING },
      { name: 'Spotify Premium', price: 10.99, store: 'Spotify', category: Category.LUXURY, goalType: GoalType.STREAMING },
      { name: 'Video Game', price: 69.99, store: 'GameStop', category: Category.LUXURY, goalType: GoalType.GAMING },
      { name: 'Steam Wallet', price: 20.00, store: 'Steam', category: Category.LUXURY, goalType: GoalType.GAMING },
      { name: 'Designer T-Shirt', price: 85.00, store: 'Brown Thomas', category: Category.LUXURY, goalType: GoalType.FAST_FASHION },
      { name: 'New Headphones', price: 150.00, store: 'Currys', category: Category.LUXURY, goalType: undefined },
      { name: 'Concert Tickets', price: 220.00, store: 'Ticketmaster', category: Category.LUXURY, goalType: undefined },
      { name: 'Lego Set', price: 120.00, store: 'Smyths Toys', category: Category.LUXURY, goalType: undefined },
      { name: 'Perfume', price: 90.00, store: 'Boots', category: Category.LUXURY, goalType: undefined },
      { name: 'Online Bet', price: 50.00, store: 'Paddy Power', category: Category.LUXURY, goalType: GoalType.GAMBLING },
      { name: 'Lottery Ticket', price: 10.00, store: 'Newsagent', category: Category.LUXURY, goalType: GoalType.GAMBLING },

      // --- HOUSEHOLD ---
      { name: 'Cleaning Supplies', price: 25.00, store: 'Tesco', category: Category.HOUSEHOLD, goalType: undefined },
      { name: 'Toilet Paper Bulk', price: 12.00, store: 'Lidl', category: Category.HOUSEHOLD, goalType: undefined },
      { name: 'Laundry Detergent', price: 14.00, store: 'Dunnes', category: Category.HOUSEHOLD, goalType: undefined },
      { name: 'New Pillows', price: 30.00, store: 'IKEA', category: Category.HOUSEHOLD, goalType: undefined },
      { name: 'Kitchen Utensils', price: 45.00, store: 'Homestore', category: Category.HOUSEHOLD, goalType: undefined },
      { name: 'Batteries', price: 8.00, store: 'Dealz', category: Category.HOUSEHOLD, goalType: undefined },
      { name: 'Light Bulbs', price: 12.00, store: 'Woodies', category: Category.HOUSEHOLD, goalType: undefined },

      // --- HEALTH ---
      { name: 'Prescription Meds', price: 25.00, store: 'Boots Pharmacy', category: Category.HEALTH, goalType: undefined },
      { name: 'Vitamins', price: 18.00, store: 'Holland & Barrett', category: Category.HEALTH, goalType: undefined },
      { name: 'GP Visit', price: 60.00, store: 'Medical Centre', category: Category.HEALTH, goalType: undefined },
      { name: 'Dentist Checkup', price: 80.00, store: 'Dental Practice', category: Category.HEALTH, goalType: undefined },
      { name: 'Gym Membership', price: 45.00, store: 'Flyefit', category: Category.HEALTH, goalType: undefined },
      { name: 'Protein Powder', price: 55.00, store: 'Supplement Store', category: Category.HEALTH, goalType: undefined },

      // --- TRANSPORT ---
      { name: 'Petrol Refill', price: 75.00, store: 'Circle K', category: Category.TRANSPORT, goalType: undefined },
      { name: 'Diesel Refill', price: 80.00, store: 'Applegreen', category: Category.TRANSPORT, goalType: undefined },
      { name: 'Bus Leap Card', price: 20.00, store: 'Dublin Bus', category: Category.TRANSPORT, goalType: undefined },
      { name: 'Train Ticket', price: 35.00, store: 'Irish Rail', category: Category.TRANSPORT, goalType: undefined },
      { name: 'Uber Ride', price: 18.50, store: 'Uber', category: Category.TRANSPORT, goalType: GoalType.RIDE_SHARING },
      { name: 'Taxi Fare', price: 22.00, store: 'FreeNow', category: Category.TRANSPORT, goalType: GoalType.RIDE_SHARING },
      { name: 'Car Wash', price: 12.00, store: 'Maxol', category: Category.TRANSPORT, goalType: undefined },
      { name: 'Parking Fee', price: 15.00, store: 'Q-Park', category: Category.TRANSPORT, goalType: undefined },

      // --- EDUCATION ---
      { name: 'School Books', price: 120.00, store: 'Easons', category: Category.EDUCATION, goalType: undefined },
      { name: 'School Uniform', price: 85.00, store: 'Marks & Spencer', category: Category.EDUCATION, goalType: undefined },
      { name: 'Stationery', price: 15.00, store: 'Reads', category: Category.EDUCATION, goalType: undefined },
      { name: 'Music Lessons', price: 40.00, store: 'Music School', category: Category.EDUCATION, goalType: undefined },
      { name: 'Online Course', price: 29.99, store: 'Udemy', category: Category.EDUCATION, goalType: undefined },

      // --- OTHER ---
      { name: 'Birthday Gift', price: 50.00, store: 'Amazon', category: Category.OTHER, goalType: GoalType.ONLINE_SHOPPING },
      { name: 'Charity Donation', price: 20.00, store: 'Concern', category: Category.OTHER, goalType: undefined },
      { name: 'Bank Fees', price: 6.00, store: 'AIB', category: Category.OTHER, goalType: undefined },
      { name: 'Post Office', price: 12.00, store: 'An Post', category: Category.OTHER, goalType: undefined },

      // --- PETS ---
      { name: 'Dog Food', price: 45.00, store: 'PetMania', category: Category.HOUSEHOLD, goalType: undefined },
      { name: 'Vet Visit', price: 85.00, store: 'Local Vet', category: Category.HEALTH, goalType: undefined },
      { name: 'Cat Litter', price: 12.00, store: 'Maxi Zoo', category: Category.HOUSEHOLD, goalType: undefined },

      // --- BEAUTY & GROOMING ---
      { name: 'Haircut', price: 25.00, store: 'Barber Shop', category: Category.NECESSITY, goalType: undefined },
      { name: 'Salon Visit', price: 120.00, store: 'Hair Salon', category: Category.LUXURY, goalType: undefined },
      { name: 'Skincare', price: 45.00, store: 'Space NK', category: Category.LUXURY, goalType: undefined },

      // --- TRAVEL ---
      { name: 'Flight Booking', price: 150.00, store: 'Ryanair', category: Category.LUXURY, goalType: undefined },
      { name: 'Hotel Stay', price: 200.00, store: 'Booking.com', category: Category.LUXURY, goalType: undefined },
      { name: 'Airbnb', price: 180.00, store: 'Airbnb', category: Category.LUXURY, goalType: undefined },

      // --- CAR MAINTENANCE ---
      { name: 'NCT Booking', price: 55.00, store: 'NCT', category: Category.TRANSPORT, goalType: undefined },
      { name: 'Car Service', price: 250.00, store: 'Mechanic', category: Category.TRANSPORT, goalType: undefined },
      { name: 'Tyres', price: 180.00, store: 'Tyre Centre', category: Category.TRANSPORT, goalType: undefined },
    ];

    const newReceipts: Receipt[] = [];
    const now = new Date();

    // Generate receipts for the last 30 days (Broad Spectrum)
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      // Random number of receipts per day (0 to 5)
      // More receipts on weekends (Fri/Sat/Sun)
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
      const dailyCount = isWeekend ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < dailyCount; i++) {
        const product = dummyProducts[Math.floor(Math.random() * dummyProducts.length)];

        // Add some variance to price (±20%)
        const variance = 1 + (Math.random() * 0.4 - 0.2);
        const finalPrice = parseFloat((product.price * variance).toFixed(2));

        // Add some child related items occasionally (20% chance)
        const isChild = Math.random() < 0.2;

        newReceipts.push({
          id: `dummy_${Date.now()}_${dayOffset}_${i} `,
          storeName: product.store,
          date: dateStr,
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
    }

    setReceipts(prev => [...newReceipts, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    // Generate Random Category Budgets
    const newCategoryBudgets: Record<string, number> = {};
    categories.forEach(cat => {
      // Random budget between 100 and 600
      newCategoryBudgets[cat.id] = Math.floor(Math.random() * 500) + 100;
    });
    setCategoryBudgets(newCategoryBudgets);

    alert("Added comprehensive dummy data for the last 30 days!");
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
    return (
      <div className="fixed top-0 left-0 w-full h-[100dvh] z-[9999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden">
        {/* Ambient Background for Loading */}
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-700" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-6">
            {/* Glow behind logo */}
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
            {/* Logo with animated fill */}
            <Shield
              className="w-12 h-12 text-white animate-[pulse_3s_ease-in-out_infinite]"
              strokeWidth={1.5}
              style={{
                fill: 'rgba(56, 189, 248, 0.2)', // Initial fill
                animation: 'fillPulse 3s ease-in-out infinite'
              }}
            />
            <style>{`
@keyframes fillPulse {
  0 %, 100 % { fill: rgba(56, 189, 248, 0.1); }
  50 % { fill: rgba(56, 189, 248, 0.6); }
}
`}</style>
          </div>
          <h1 className="text-xl font-heading font-bold text-white tracking-tight">TrueTrack</h1>
        </div>

        {/* Loading Dots - Positioned at bottom */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="flex flex-col h-full">
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
                  boxShadow: '0 44px 12px rgba(0,0,0,0.5)',
                  border: '2px solid white'
                }}
              >
                DEBUG: Force Widget Update
              </button>
            </div> */}
            <Dashboard
              key={`dashboard - ${receipts.length} -${monthlyBudget} -${ageRestricted} `}
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
              onHabitsClick={() => setCurrentView('settings')}
              goals={goals}
              custodyDays={custodyDays}
              ambientMode={ambientMode}
              childEvents={childEvents}
              setChildEvents={setChildEvents}
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
            ageRestricted={ageRestricted}
            userId="user-1" // Hardcoded for now as per App structure
            categories={categories}
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
            setReceipts={setReceipts}
            onSeedData={generateDummyData}
            ambientMode={ambientMode}
            setAmbientMode={(value) => {
              console.log('App: setAmbientMode called', value);
              setAmbientMode(value);
            }}
            showGlobalAmbient={showGlobalAmbient}
            setShowGlobalAmbient={setShowGlobalAmbient}
          />
        );
      default:
        // Force re-render when switching back to dashboard to trigger animations
        return <Dashboard receipts={receipts} monthlyBudget={monthlyBudget} ageRestricted={ageRestricted} onViewReceipt={handleViewReceipt} onProvisionClick={() => setCurrentView('provision')} goals={goals} ambientMode={ambientMode} />;
    }
  };



  return (
    <div
      className="h-screen w-full bg-background relative overflow-hidden flex flex-col pt-safe safe-area-top"
      onTouchStart={(e) => {
        const touch = e.touches[0];
        // Ignore swipes starting in the bottom navigation area (approx 90px)
        if (touch.clientY > window.innerHeight - 90) return;

        setTouchStart({ x: touch.clientX, y: touch.clientY, time: Date.now() });
      }}
      onTouchEnd={(e) => {
        if (!touchStart) return;

        const touch = e.changedTouches[0];
        const diffX = touchStart.x - touch.clientX;
        const diffY = touchStart.y - touch.clientY;
        const timeDiff = Date.now() - touchStart.time;

        setTouchStart(null);

        // Optimized Thresholds
        const minSwipeDistance = 30; // Reduced from 50
        const maxTime = 800; // Increased from 500

        // Dominant Axis Check (Horizontal > Vertical * 1.2)
        if (
          Math.abs(diffX) > minSwipeDistance &&
          Math.abs(diffX) > Math.abs(diffY) * 1.2 &&
          timeDiff < maxTime
        ) {
          const navOrder = ['dashboard', 'scan', 'history', ...(childSupportMode ? ['support'] : []), 'settings'];
          const currentIndex = navOrder.indexOf(currentView);

          if (currentIndex === -1) return;

          if (diffX > 0) {
            // Swipe Left -> Next Tab
            if (currentIndex < navOrder.length - 1) {
              setDirection(1);
              setCurrentView(navOrder[currentIndex + 1] as ViewState);
            }
          } else {
            // Swipe Right -> Previous Tab
            if (currentIndex > 0) {
              setDirection(-1);
              setCurrentView(navOrder[currentIndex - 1] as ViewState);
            }
          }
        }
      }}
    >
      {ambientMode && showGlobalAmbient && <AmbientBackground spendRatio={spendRatio} />}


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

      <main
        className="flex-1 w-full max-w-md mx-auto relative z-10 h-full"
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentView}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", ease: "circOut", duration: 0.3 }
            }}
            className={`h-full w-full ${showGlobalAmbient ? '' : 'bg-background'}`}
          >
            <ErrorBoundary>
              {renderView()}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      <Navigation currentView={currentView} setView={handleSetView} isVisible={!!user} childSupportMode={childSupportMode} />
      {/* Intro Tour Overlay */}
      {showTour && <IntroTour onComplete={handleTourComplete} />}
    </div>
  );
};

export default App;
