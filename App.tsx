import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ReceiptScanner from './components/ReceiptScanner';
import HistoryView from './components/HistoryView';
import Settings from './components/Settings';
import SupportView from './components/SupportView';
import AuthScreen from './components/AuthScreen';
import { ViewState, Receipt, User, SubscriptionTier } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  
  // User Authentication State
  const [user, setUser] = useState<User | null>(null);

  // Settings State
  const [monthlyBudget, setMonthlyBudget] = useState<number>(1000);
  const [ageRestricted, setAgeRestricted] = useState<boolean>(false);

  // Load user session on mount
  useEffect(() => {
      const session = localStorage.getItem('smartspend_user');
      if (session) {
          try {
              setUser(JSON.parse(session));
          } catch (e) {
              console.error("Invalid session");
          }
      }
  }, []);

  // Save user session whenever it changes
  useEffect(() => {
      if (user) {
          localStorage.setItem('smartspend_user', JSON.stringify(user));
      } else {
          localStorage.removeItem('smartspend_user');
      }
  }, [user]);

  // Load receipts and settings
  useEffect(() => {
    const savedReceipts = localStorage.getItem('smartspend_receipts');
    if (savedReceipts) {
      try {
        setReceipts(JSON.parse(savedReceipts));
      } catch (e) {
        console.error("Failed to parse receipts", e);
      }
    }

    const savedSettings = localStorage.getItem('smartspend_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.budget !== undefined) setMonthlyBudget(parsed.budget);
        // Only load ageRestricted if user is authorized (double check)
        if (parsed.ageRestricted !== undefined) setAgeRestricted(parsed.ageRestricted);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save receipts changes
  useEffect(() => {
    localStorage.setItem('smartspend_receipts', JSON.stringify(receipts));
  }, [receipts]);

  // Save settings changes
  useEffect(() => {
    localStorage.setItem('smartspend_settings', JSON.stringify({ budget: monthlyBudget, ageRestricted }));
  }, [monthlyBudget, ageRestricted]);

  const handleScanComplete = (newReceipts: Receipt[]) => {
    setReceipts(prev => [...newReceipts, ...prev]);
    setCurrentView('dashboard'); // Redirect to dashboard
  };
  
  const handleDeleteReceipt = (id: string) => {
      setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const handleLogin = (newUser: User) => {
      setUser(newUser);
      setCurrentView('dashboard');
  };

  const handleSignOut = () => {
      setUser(null);
      setAgeRestricted(false); // Reset sensitive settings on logout
      setCurrentView('dashboard'); // Will show auth screen next render
  };

  const handleUpgrade = () => {
      if (user) {
          const upgradedUser = { ...user, tier: SubscriptionTier.PRO };
          setUser(upgradedUser);
      }
  };

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
        return <HistoryView receipts={receipts} ageRestricted={ageRestricted} onDelete={handleDeleteReceipt} />;
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