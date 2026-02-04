import React from 'react';
import { Home, Scan, History, Settings as SettingsIcon, LifeBuoy, HeartHandshake } from 'lucide-react';
import { ViewState } from '@common/types';
import { HapticService } from '../services/HapticService';
import { ImpactStyle } from '@capacitor/haptics';
import { useLanguage } from '../contexts/LanguageContext';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isVisible: boolean;
  childSupportMode?: boolean;
  helpEnabled: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, isVisible, childSupportMode, helpEnabled }) => {
  const { t } = useLanguage();

  if (!isVisible) return null;

  const navItems = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: Home, hidden: false },
    { id: 'scan', label: t('navigation.scan'), icon: Scan, hidden: false },
    { id: 'support', label: t('navigation.help'), icon: LifeBuoy, hidden: !helpEnabled },
    { id: 'settings', label: t('navigation.settings'), icon: SettingsIcon, hidden: false },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-3xl bg-[#0B1221]/40 border-t border-white/10 pb-safe pt-2 px-2 h-auto min-h-[80px] z-50 transition-all duration-300 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-center max-w-md mx-auto h-full pb-2">
        {navItems.filter(item => !item.hidden).map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                HapticService.selection();
                setView(item.id as ViewState);
              }}
              className={`group flex flex-col items-center justify-center space-y-1.5 flex-1 min-w-0 outline-none active:scale-95 transition-transform duration-100`}
            >
              <div className={`p-2 rounded-full transition-all duration-500 ease-out relative ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'
                } `}>
                {/* Active Glow Background */}
                <div className={`absolute inset-1 bg-primary/20 rounded-full blur-sm transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'} `}></div>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />


              </div>
              <span className={`text-xs font-medium truncate w-full text-center transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'
                } `}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;