import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import Navigation from './components/Navigation';
import Header from './components/Header';
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
import { ViewState, Receipt, User, SubscriptionTier, CategoryDefinition, Category, RecurringExpense, CustodyDay, Goal, GoalType, CustodyStatus } from './types';
import { authService, isMockMode } from './services/authService';
import { Database, X, Shield } from 'lucide-react';
import { AmbientBackground } from './components/AmbientBackground';
import { WidgetService } from './services/widgetService';
import { HapticService } from './services/HapticService';
import { ImpactStyle } from '@capacitor/haptics';
import { UserProvider, useUser } from './contexts/UserContext';
import { DataProvider, useData } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext';

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
  { id: 'impulse_buy', type: GoalType.ONLINE_SHOPPING, name: 'Impulse Control', isEnabled: true, keywords: ['amazon', 'temu', 'shein', 'wish', 'aliexpress'], streak: 7, emoji: '🧠' }, // AI Based
  { id: 'subscriptions', type: GoalType.STREAMING, name: 'Sub Fatigue', isEnabled: true, keywords: ['netflix', 'spotify', 'apple', 'adobe', 'prime', 'hulu', 'disney'], streak: 30, emoji: '📉' }, // AI Based
  { id: 'late_night', type: GoalType.JUNK_FOOD, name: 'Late Night Eats', isEnabled: true, keywords: ['uber eats', 'deliveroo', 'just eat', 'dominos', 'mcdonalds'], streak: 3, emoji: '🌙' }, // AI Based
  { id: 'gambling', type: GoalType.GAMBLING, name: 'Stop Gambling', isEnabled: false, keywords: ['bet', 'casino', 'lottery', 'lotto', 'poker', 'bookmakers', 'ladbrokes', 'paddy power'], streak: 0, emoji: '🎰' },
  { id: 'caffeine', type: GoalType.CAFFEINE, name: 'Cut Caffeine', isEnabled: false, keywords: ['coffee', 'starbucks', 'costa', 'espresso', 'latte', 'caffeine', 'energy drink', 'red bull', 'monster'], streak: 0, emoji: '☕' },
  { id: 'sugar', type: GoalType.SUGAR, name: 'Reduce Sugar', isEnabled: false, keywords: ['sugar', 'cake', 'cookies', 'donuts', 'sweets', 'soda', 'coke', 'pepsi', 'ice cream'], streak: 0, emoji: '🍩' },
  { id: 'tech_spend', type: GoalType.ONLINE_SHOPPING, name: 'Tech Detox', isEnabled: false, keywords: ['apple', 'currys', 'pc world', 'steam', 'game', 'amazon'], streak: 0, emoji: '🔌' },
  { id: 'fast_fashion', type: GoalType.FAST_FASHION, name: 'Avoid Fast Fashion', isEnabled: false, keywords: ['zara', 'h&m', 'primark', 'shein', 'boohoo', 'forever 21'], streak: 0, emoji: '👗' },
  { id: 'ride_sharing', type: GoalType.RIDE_SHARING, name: 'Walk More', isEnabled: false, keywords: ['uber', 'lyft', 'taxi', 'bolt', 'freenow'], streak: 0, emoji: '🚶' },
  { id: 'savings', type: GoalType.SAVINGS, name: 'Boost Savings', isEnabled: true, keywords: [], streak: 15, emoji: '💰' },
];



const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    zIndex: 1
  }),
  center: {
    zIndex: 1,
    x: 0,
    position: 'relative' as const,
    width: '100%',
    height: '100%'
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    position: 'absolute' as const,
    width: '100%',
    height: '100%'
  })
};

// Helper code and unused imports will be cleaned up by linter or separately. 
// Focusing on ViewStateHandler changes here.

const ViewStateHandler: React.FC<{ currentView: ViewState, setCurrentView: (v: ViewState) => void, direction: number }> = ({ currentView, setCurrentView, direction }) => {
  // We only need setters or specific triggers if they are NOT handled by the components themselves.
  // Actually, standard components now self-manage data. We just render them.
  // We pass 'onBack' or navigation props where they are part of the specific View interface (like CustodyCalendar onBack).

  // ViewStateHandler doesn't even need to read all the data anymore, unless it needs it for the 'key' hack or specialized logic.
  // The 'key' hacking on Dashboard was likely to force re-render on data change. Context does this automatically.
  // So we can remove the 'useData' destructuring for the most part, or keep minimal if needed.

  const { user } = useUser();
  const {
    setSelectedReceipt,
    addReceipts,
  } = useData();

  const handleScanComplete = (receipts: Receipt[]) => {
    addReceipts(receipts);
    setCurrentView('history');
  };

  return (
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
        className="h-full w-full"
      >
        <ErrorBoundary>
          {(() => {
            switch (currentView) {
              case 'dashboard':
                return (
                  <div className="flex flex-col h-full">
                    <Dashboard
                      onViewReceipt={(receipt) => {
                        setSelectedReceipt(receipt);
                        setCurrentView('history');
                      }}
                      onProvisionClick={() => setCurrentView('provision')}
                      onSettlementClick={() => setCurrentView('settlement')}
                      onCustodyClick={() => setCurrentView('custody')}
                      onHabitsClick={() => setCurrentView('settings')}
                    />
                  </div>
                );
              case 'custody':
                return (
                  <CustodyCalendar
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
                    selectedReceipt={useData().selectedReceipt}
                    onSelectReceipt={setSelectedReceipt}
                  />
                );
              case 'support':
                return <SupportView />;
              case 'settlement':
                return (
                  <SettlementView onBack={() => setCurrentView('dashboard')} />
                );
              case 'provision':
                return (
                  <ProvisionAnalysis
                    onBack={() => setCurrentView('dashboard')}
                  />
                );
              case 'settings':
                return (
                  <Settings />
                );
              default:
                return (
                  <Dashboard
                    onViewReceipt={(receipt) => {
                      setSelectedReceipt(receipt);
                      setCurrentView('history');
                    }}
                    onProvisionClick={() => setCurrentView('provision')}
                    onSettlementClick={() => setCurrentView('settlement')}
                    onCustodyClick={() => setCurrentView('custody')}
                    onHabitsClick={() => setCurrentView('settings')}
                  />
                );
            }
          })()}
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
};


const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [direction, setDirection] = useState(0);
  const [showTour, setShowTour] = useState(false);

  const { user, isAuthLoading, showDevBanner, setShowDevBanner, isMockMode, setUser, signOut } = useUser();
  const {
    isDataLoaded,
    ambientMode,
    showGlobalAmbient,
    spendRatio,
    generateDummyData,
    ageRestricted,
    helpEnabled
  } = useData();





  useEffect(() => {
    const checkTour = async () => {
      const { value } = await Preferences.get({ key: 'has_seen_tour' });
      if (!value) {
        setTimeout(() => setShowTour(true), 1000);
      }
    };
    checkTour();

    // Listen for Deep Links (Email Confirmation & OAuth)
    // Listen for Deep Links (Email Confirmation & OAuth)
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appUrlOpen', async (data) => {


        if (data.url.includes('access_token') ||
          data.url.includes('refresh_token') ||
          data.url.includes('type=signup') ||
          data.url.includes('code=')) {


          try {
            // Let Supabase handle the URL (exchange code, etc.)
            const svcResult = await authService.getSessionFromUrl(data.url);

            if (!svcResult) {

              throw new Error("Service returned null");
            }



            const session = svcResult.data?.session;
            const error = svcResult.error;

            if (session) {
              if (user) {
                // FORCE RELOAD: The most reliable way to clear all "Not Logged In" states
                // and pick up the new session from LocalStorage/Supabase is to reload.
                setUser(user);
                window.location.reload();
              }
            } else {
              alert("Login Failed: " + (typeof error === 'object' ? error?.message : error));
              window.location.reload();
            }
          } catch (e: any) {
          }
        } else if (data.url.includes('error=')) {

        }
      });
    });
  }, []);

  const handleTourComplete = async () => {
    setShowTour(false);
    await Preferences.set({ key: 'has_seen_tour', value: 'true' });
  };

  const handleSetView = (newView: ViewState) => {
    HapticService.impact(ImpactStyle.Light);
    const navOrder = ['dashboard', 'scan', 'history', ...(helpEnabled ? ['support'] : []), 'settings'];
    const currentIndex = navOrder.indexOf(currentView);
    const newIndex = navOrder.indexOf(newView);

    if (currentIndex !== -1 && newIndex !== -1) {
      setDirection(newIndex > currentIndex ? 1 : -1);
    } else {
      setDirection(0);
    }
    setCurrentView(newView);
  };



  if (isAuthLoading || !isDataLoaded) {
    return (
      <div className="fixed top-0 left-0 w-full h-[100dvh] z-[9999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
            <Shield
              className="w-12 h-12 text-white animate-[pulse_3s_ease-in-out_infinite]"
              strokeWidth={1.5}
              style={{
                fill: 'rgba(56, 189, 248, 0.2)',
                animation: 'fillPulse 3s ease-in-out infinite'
              }}
            />
          </div>
          <h1 className="text-xl font-heading font-bold text-white tracking-tight">TrueTrack</h1>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className={`app-container h-full w-full overflow-hidden bg-background safe-area-top text-white relative flex flex-col pt-safe ${isMockMode ? 'border-2 border-amber-500' : ''}`}>
      {ambientMode && showGlobalAmbient && <AmbientBackground spendRatio={spendRatio} />}

      {user && (
        <Header
          user={user}
          currentView={currentView}
          onAvatarClick={() => setCurrentView('settings')}
          ageRestricted={ageRestricted}
        />
      )}

      {isMockMode && showDevBanner && (
        <div className="bg-indigo-900/90 text-indigo-100 text-[10px] py-1 px-3 text-center border-b border-indigo-500/30 flex items-center justify-between relative z-50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mx-auto">
            <Database size={12} className="text-indigo-400" />
            <span>Running in <strong>Mock Mode</strong>.</span>
            <button onClick={() => generateDummyData()} className="ml-2 bg-indigo-500/20 hover:bg-indigo-500/40 px-2 py-0.5 rounded text-[9px] font-bold border border-indigo-500/30 transition-colors">
              SEED DATA
            </button>
          </div>
          <button onClick={() => setShowDevBanner(false)} className="absolute right-2 p-1 hover:text-white">
            <X size={12} />
          </button>
        </div>
      )}

      <main className="flex-1 w-full max-w-md mx-auto relative z-10 h-full overflow-y-auto custom-scrollbar">
        <ViewStateHandler currentView={currentView} setCurrentView={setCurrentView} direction={direction} />
      </main>

      <Navigation currentView={currentView} setView={handleSetView} isVisible={true} childSupportMode={useData().childSupportMode} helpEnabled={helpEnabled} />
      {showTour && <IntroTour onComplete={handleTourComplete} />}
    </div>
  );
};



const App: React.FC = () => {
  return (
    <ToastProvider>
      <UserProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </UserProvider>
    </ToastProvider>
  );
};

export default App;
