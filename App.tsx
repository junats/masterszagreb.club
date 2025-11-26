
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ReceiptScanner from './components/ReceiptScanner';
import HistoryView from './components/HistoryView';
import Settings from './components/Settings';
import SupportView from './components/SupportView';
import AuthScreen from './components/AuthScreen';
import { ViewState, Receipt, User, SubscriptionTier } from './types';
import { authService, isMockMode } from './services/authService';
import { Database, X } from 'lucide-react';

const getReceiptSignature = (r: Receipt) => {
  const cleanStore = r.storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanRef = (r.referenceCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const priceCents = Math.round(r.total * 100);
  return `${cleanStore}|${r.date}|${priceCents}|${r.type || 'receipt'}|${cleanRef}`;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(300);
  const [ageRestricted, setAgeRestricted] = useState<boolean>(false);
  const [showDevBanner, setShowDevBanner] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await authService.getUser();
      if (currentUser) {
        setUser(currentUser);
      }
      setIsAuthLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    const savedReceipts = localStorage.getItem('truetrack_receipts');
    if (savedReceipts) {
      try {
        const parsed = JSON.parse(savedReceipts) as Receipt[];
        const uniqueMap = new Map<string, Receipt>();
        parsed.forEach(r => {
          const sig = getReceiptSignature(r);
          if (!uniqueMap.has(sig)) {
            uniqueMap.set(sig, r);
          }
        });
        setReceipts(Array.from(uniqueMap.values()));
      } catch (e) {
        console.error("Failed to parse receipts", e);
      }
    }

    const savedSettings = localStorage.getItem('truetrack_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.budget !== undefined) setMonthlyBudget(parsed.budget);
        if (parsed.ageRestricted !== undefined) setAgeRestricted(parsed.ageRestricted);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('truetrack_receipts', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('truetrack_settings', JSON.stringify({ budget: monthlyBudget, ageRestricted }));
  }, [monthlyBudget, ageRestricted]);

  const handleScanComplete = (newReceipts: Receipt[]) => {
    let duplicateCount = 0;
    setReceipts(prev => {
      const existingSignatures = new Set(prev.map(r => getReceiptSignature(r)));
      const existingImageHashes = new Set(prev.map(r => r.imageHash).filter(Boolean));
      const existingFileHashes = new Set(prev.map(r => r.fileHash).filter(Boolean));

      const uniqueNewReceipts: Receipt[] = [];

      for (const receipt of newReceipts) {
        const sig = getReceiptSignature(receipt);
        const imgHash = receipt.imageHash;
        const fHash = receipt.fileHash;

        const isDuplicateSig = existingSignatures.has(sig);
        const isDuplicateImageHash = imgHash ? existingImageHashes.has(imgHash) : false;
        const isDuplicateFileHash = fHash ? existingFileHashes.has(fHash) : false;

        if (!isDuplicateSig && !isDuplicateImageHash && !isDuplicateFileHash) {
          existingSignatures.add(sig);
          if (imgHash) existingImageHashes.add(imgHash);
          if (fHash) existingFileHashes.add(fHash);
          uniqueNewReceipts.push(receipt);
        } else {
          duplicateCount++;
          console.log(`Duplicate detected: Sig=${isDuplicateSig}, ImgHash=${isDuplicateImageHash}, FileHash=${isDuplicateFileHash}`);
        }
      }
      if (duplicateCount > 0) {
        setTimeout(() => {
          alert(`${duplicateCount} duplicate receipt(s) were automatically removed.`);
        }, 500);
      }
      return [...uniqueNewReceipts, ...prev];
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

  if (isAuthLoading) {
    return <div className="h-screen w-full bg-background flex items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard receipts={receipts} monthlyBudget={monthlyBudget} ageRestricted={ageRestricted} />;
      case 'scan':
        return (
          <ReceiptScanner
            onScanComplete={handleScanComplete}
            onCancel={() => setCurrentView('dashboard')}
            ageRestricted={ageRestricted}
            userId={user.id}
          />
        );
      case 'history':
        return (
          <HistoryView
            receipts={receipts}
            ageRestricted={ageRestricted}
            onDelete={handleDeleteReceipt}
            onUpdate={handleUpdateReceipt}
          />
        );
      case 'support':
        return <SupportView />;
      case 'settings':
        return (
          <Settings
            monthlyBudget={monthlyBudget}
            setMonthlyBudget={setMonthlyBudget}
            ageRestricted={ageRestricted}
            setAgeRestricted={setAgeRestricted}
            user={user}
            onSignOut={handleSignOut}
            onUpgrade={handleUpgrade}
          />
        );
      default:
        return <Dashboard receipts={receipts} monthlyBudget={monthlyBudget} ageRestricted={ageRestricted} />;
    }
  };

  return (
    <div className="h-screen w-full bg-background relative overflow-hidden flex flex-col pt-16 safe-area-top">
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
        {renderView()}
      </main>

      <Navigation currentView={currentView} setView={setCurrentView} isVisible={!!user} />
    </div>
  );
};

export default App;
