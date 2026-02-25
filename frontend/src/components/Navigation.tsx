import React from 'react';
import { Home, Scan, History, Settings as SettingsIcon, LifeBuoy, Heart } from 'lucide-react';
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
    <nav className="fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur-xl border-t border-white/10 pb-safe pt-2 px-2 h-auto min-h-[85px] z-50">
      <div className="flex justify-between items-center max-w-md mx-auto h-full pb-1">
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
              className="group flex flex-col items-center justify-start space-y-1 flex-1 min-w-0 outline-none active:opacity-50 transition-opacity duration-200"
            >
              <div className="relative p-1">
                {/* Notification Dot Logic (Optional) */}
                {/* <div className="absolute top-0 right-0 w-2 h-2 bg-systemRed rounded-full"></div> */}
                <Icon
                  size={26}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors duration-200 ${isActive ? 'text-systemBlue' : 'text-systemGray'}`}
                />
              </div>
              <span className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${isActive ? 'text-systemBlue' : 'text-systemGray'}`}>
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