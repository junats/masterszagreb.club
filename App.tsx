
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ReceiptScanner from './components/ReceiptScanner';
import HistoryView from './components/HistoryView';
import Settings from './components/Settings';
import SupportView from './components/SupportView';
import AuthScreen from './components/AuthScreen';
import ProvisionAnalysis from './components/ProvisionAnalysis';
import { ViewState, Receipt, User, SubscriptionTier } from './types';
import { authService, isMockMode } from './services/authService';
import { Database, X } from 'lucide-react';

const getReceiptSignature = (r: Receipt) => {
  const cleanStore = r.storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanRef = (r.referenceCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const priceCents = Math.round(r.total * 100);
  return `${cleanStore}|${r.date}|${priceCents}|${r.type || 'receipt'}|${cleanRef}`;
};

import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';

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
  const [monthlyBudget, setMonthlyBudget] = useState(1000);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [ageRestricted, setAgeRestricted] = useState(false);
  const [showDevBanner, setShowDevBanner] = useState(true);

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
          const parsed = JSON.parse(savedReceipts) as Receipt[];
          const uniqueMap = new Map<string, Receipt>();
          parsed.forEach(r => {
            const sig = getReceiptSignature(r);
            if (!uniqueMap.has(sig)) {
              uniqueMap.set(sig, r);
            }
          });
          setReceipts(Array.from(uniqueMap.values()));
        }

        const { value: savedSettings } = await Preferences.get({ key: SETTINGS_STORAGE_KEY });
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.budget !== undefined) setMonthlyBudget(parsed.budget);
          if (parsed.categoryBudgets !== undefined) setCategoryBudgets(parsed.categoryBudgets);
          if (parsed.ageRestricted !== undefined) setAgeRestricted(parsed.ageRestricted);
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
      await Preferences.set({ key: SETTINGS_STORAGE_KEY, value: JSON.stringify({ budget: monthlyBudget, categoryBudgets, ageRestricted }) });
    };
    saveSettings();
  }, [monthlyBudget, categoryBudgets, ageRestricted]);

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

      return [...confirmedNewReceipts, ...prev];
    });
    setCurrentView('dashboard');
  };

  const handleDeleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateReceipt = (updatedReceipt: Receipt) => {
    setReceipts(prev => prev.map(r => r.id === updatedReceipt.id ? updatedReceipt : r));
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setCurrentView('dashboard');
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setUser(null);
    setAgeRestricted(false);
    setCurrentView('dashboard');
  };

  const handleUpgrade = () => {
    if (user) {
      const upgradedUser = { ...user, tier: SubscriptionTier.PRO };
      setUser(upgradedUser);
      localStorage.setItem('truetrack_session', JSON.stringify(upgradedUser));
    }
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
          <Dashboard
            key={`dashboard-${receipts.length}-${monthlyBudget}-${ageRestricted}`}
            receipts={receipts}
            monthlyBudget={monthlyBudget}
            ageRestricted={ageRestricted}
            onViewReceipt={handleViewReceipt}
            onProvisionClick={() => setCurrentView('provision')}
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
          />
        );
      case 'support':
        return <SupportView />;


      // ... existing imports

      // Inside App component renderView switch:
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
            user={user}
            onSignOut={handleSignOut}
            onUpgrade={handleUpgrade}
          />
        );
      default:
        // Force re-render when switching back to dashboard to trigger animations
        return <Dashboard receipts={receipts} monthlyBudget={monthlyBudget} ageRestricted={ageRestricted} onViewReceipt={handleViewReceipt} onProvisionClick={() => setCurrentView('provision')} />;
    }
  };

  return (
    <div className="h-screen w-full bg-background relative overflow-hidden flex flex-col pt-14 safe-area-top">
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {isMockMode && showDevBanner && (
        <div className="bg-indigo-900/90 text-indigo-100 text-[10px] py-1 px-3 text-center border-b border-indigo-500/30 flex items-center justify-between relative z-50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mx-auto">
            <Database size={12} className="text-indigo-400" />
            <span>Running in <strong>Mock Mode</strong>. Data is not saved to cloud.</span>
          </div>
          <button onClick={() => setShowDevBanner(false)} className="absolute right-2 p-1 hover:text-white">
            <X size={12} />
          </button>
        </div>
      )}

      <main className="flex-1 w-full max-w-md mx-auto relative z-10 h-full">
        <div key={currentView} className="h-full animate-fade-in">
          {renderView()}
        </div>
      </main>

      <Navigation currentView={currentView} setView={setCurrentView} isVisible={!!user} />
    </div>
  );
};

export default App;
