import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ReceiptScanner from './components/ReceiptScanner';
import HistoryView from './components/HistoryView';
import Settings from './components/Settings';
import SupportView from './components/SupportView';
import AuthScreen from './components/AuthScreen';
import { ViewState, Receipt, User, SubscriptionTier } from './types';
import { authService } from './services/authService';

// Helper to generate a unique signature for a receipt to detect duplicates
const getReceiptSignature = (r: Receipt) => {
    // String normalization: remove all non-alphanumeric chars for stricter comparison
    const cleanStore = r.storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanRef = (r.referenceCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    // Use Math.round to compare cents and avoid floating point issues
    const priceCents = Math.round(r.total * 100);
    
    return `${cleanStore}|${r.date}|${priceCents}|${r.type || 'receipt'}|${cleanRef}`;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  
  // User Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Settings State
  const [monthlyBudget, setMonthlyBudget] = useState<number>(300);
  const [ageRestricted, setAgeRestricted] = useState<boolean>(false);

  // Load user session on mount via Service
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

  // Load receipts and settings
  useEffect(() => {
    const savedReceipts = localStorage.getItem('truetrack_receipts');
    if (savedReceipts) {
      try {
        const parsed = JSON.parse(savedReceipts) as Receipt[];
        
        // Deduplicate on load
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

  // Save receipts changes (Sync to backend would happen here)
  useEffect(() => {
    localStorage.setItem('truetrack_receipts', JSON.stringify(receipts));
  }, [receipts]);

  // Save settings changes
  useEffect(() => {
    localStorage.setItem('truetrack_settings', JSON.stringify({ budget: monthlyBudget, ageRestricted }));
  }, [monthlyBudget, ageRestricted]);

  const handleScanComplete = (newReceipts: Receipt[]) => {
    let duplicateCount = 0;

    setReceipts(prev => {
        const existingSignatures = new Set(prev.map(r => getReceiptSignature(r)));
        const uniqueNewReceipts: Receipt[] = [];

        for (const receipt of newReceipts) {
            const sig = getReceiptSignature(receipt);
            if (!existingSignatures.has(sig)) {
                existingSignatures.add(sig); 
                uniqueNewReceipts.push(receipt);
            } else {
                duplicateCount++;
            }
        }

        if (duplicateCount > 0) {
            setTimeout(() => {
                alert(`${duplicateCount} receipt(s) were identified as duplicates and omitted.`);
            }, 100);
        }

        return [...uniqueNewReceipts, ...prev];
    });
    
    setCurrentView('dashboard');
  };
  
  const handleDeleteReceipt = (id: string) => {
      setReceipts(prev => prev.filter(r => r.id !== id));
  };
  
  // This allows manual tagging of 18+ items if AI misses them
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
          // In real app, we would update the backend here
          localStorage.setItem('truetrack_session', JSON.stringify(upgradedUser));
      }
  };

  // Show loading state while checking session
  if (isAuthLoading) {
      return <div className="h-screen w-full bg-background flex items-center justify-center text-slate-500">Loading...</div>;
  }

  // If not logged in, show Auth Screen
  if (!user) {
      return (
          <AuthScreen onLogin={handleLogin} />
      );
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
    <div className="h-screen w-full bg-background relative overflow-hidden flex flex-col">
      {/* Dynamic Background Gradient */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto relative z-10 h-full">
        {renderView()}
      </main>

      {/* Navigation - Only visible when logged in */}
      <Navigation currentView={currentView} setView={setCurrentView} isVisible={!!user} />
    </div>
  );
};

export default App;