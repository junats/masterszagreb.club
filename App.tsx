import React, { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import Navigation from './components/Navigation';
import Header from './components/Header';
import IntroTour from './components/IntroTour';
import { ViewState } from './types';
import { isMockMode } from './services/authService';
import { Database, X } from 'lucide-react';
import { AmbientBackground } from './components/AmbientBackground';
import { HapticService } from './services/HapticService';
import { ImpactStyle } from '@capacitor/haptics';
import { UserProvider, useUser } from './contexts/UserContext';
import { DataProvider, useData } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import ViewStateHandler from './components/ViewStateHandler';
import LoadingScreen from './components/LoadingScreen';
import AuthScreen from './components/AuthScreen';
import ErrorBoundary from './components/ErrorBoundary';

// Constants moved to defaults.ts, ensuring cleaner App.tsx

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [direction, setDirection] = useState(0);
  const [showTour, setShowTour] = useState(false);

  const { user, isAuthLoading, showDevBanner, setShowDevBanner, isMockMode, generateDummyData } = useUser();
  const { t } = useLanguage();
  const {
    isDataLoaded,
    ambientMode,
    showGlobalAmbient,
    spendRatio,
    ageRestricted,
    helpEnabled,
    childSupportMode
  } = useData();

  // Check Tour & Request Permissions
  useEffect(() => {
    const init = async () => {
      const { value } = await Preferences.get({ key: 'has_seen_tour' });
      if (!value) {
        setTimeout(() => setShowTour(true), 1000);
      }

      // Request Notification Permissions
      import('./services/notificationService').then(({ NotificationService }) => {
        NotificationService.requestPermissions();
      });
    };
    init();
  }, []);

  // Listen for Notification Clicks
  useEffect(() => {
    import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Notification action performed', notification);
        // Default to Custody/Calendar view for now since most notifs are calendar updates
        setCurrentView('custody');
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
    return <LoadingScreen />;
  }

  if (!user && !isAuthLoading) {
    // If we're not loading and no user, we might be in a weird state or AuthScreen is handled inside ViewState?
    // Actually, AuthScreen was conditionally rendered before. Let's make sure it's handled.
    // The original code had `if (!user) return <AuthScreen />`

    // We need to import AuthScreen dynamically or include it
    // Re-adding AuthScreen import
    return <AuthScreen />;
  }


  return (
    <div className={`app-container h-[100dvh] w-full overflow-hidden bg-background text-white relative flex flex-col ${isMockMode ? 'border-2 border-amber-500' : ''}`}
      style={{
        // Define layout constants for internal components to use via CSS
        ['--header-height' as any]: '72px',
        ['--nav-height' as any]: '84px',
        ['--safe-area-top' as any]: 'env(safe-area-inset-top, 20px)', // Fallback for browsers
      }}
    >
      {ambientMode && showGlobalAmbient && <AmbientBackground spendRatio={spendRatio} />}

      {user && (
        <Header
          user={user}
          currentView={currentView}
          onAvatarClick={() => setCurrentView('settings')}
          ageRestricted={ageRestricted}
          onNavigate={handleSetView}
        />
      )}

      {isMockMode && showDevBanner && (
        <div className="bg-indigo-900/90 text-indigo-100 text-[10px] py-1 px-3 text-center border-b border-indigo-500/30 flex items-center justify-between relative z-50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mx-auto">
            <Database size={12} className="text-indigo-400" />
            <span>{t('misc.mockMode')}</span>
            <button onClick={() => generateDummyData()} className="ml-2 bg-indigo-500/20 hover:bg-indigo-500/40 px-2 py-0.5 rounded text-[9px] font-bold border border-indigo-500/30 transition-colors">
              {t('misc.seedData')}
            </button>
          </div>
          <button onClick={() => setShowDevBanner(false)} className="absolute right-2 p-1 hover:text-white">
            <X size={12} />
          </button>
        </div>
      )}

      {/* 
          Main Layout Container:
          Standardizes the scrolling area and accounts for fixed Header and Navigation.
          Centralized padding logic allows removing all individual component padding.
      */}
      <main
        className="flex-1 w-full max-w-lg mx-auto relative z-10 h-full overflow-y-auto overflow-x-hidden custom-scrollbar"
        style={{
          paddingTop: 'calc(var(--header-height) + var(--safe-area-top))',
          paddingBottom: 'calc(var(--nav-height) + env(safe-area-inset-bottom, 20px) + 20px)',
        }}
      >
        <ViewStateHandler currentView={currentView} setCurrentView={setCurrentView} direction={direction} />
      </main>

      <Navigation currentView={currentView} setView={handleSetView} isVisible={true} childSupportMode={childSupportMode} helpEnabled={helpEnabled} />
      {showTour && <IntroTour onComplete={handleTourComplete} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <UserProvider>
        <DataProvider>
          <LanguageProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </LanguageProvider>
        </DataProvider>
      </UserProvider>
    </ToastProvider>
  );
};

export default App;
