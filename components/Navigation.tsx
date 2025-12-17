import React from 'react';
import { Home, Scan, History, Settings as SettingsIcon, LifeBuoy, HeartHandshake } from 'lucide-react';
import { ViewState } from '../types';
import { HapticService } from '../services/HapticService';
import { ImpactStyle } from '@capacitor/haptics';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isVisible: boolean;
  childSupportMode?: boolean;
  helpEnabled: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, isVisible, childSupportMode, helpEnabled }) => {
  if (!isVisible) return null;

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, hidden: false },
    { id: 'scan', label: 'Scan', icon: Scan, hidden: false },
    { id: 'history', label: 'History', icon: History, hidden: false },
    { id: 'support', label: 'Help', icon: LifeBuoy, hidden: !helpEnabled },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, hidden: false },
  ] as const;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t pb-safe pt-2 px-2 h-auto min-h-[80px] z-50 transition-all duration-300 ${childSupportMode ? 'bg-emerald-950/80 border-emerald-500/30' : 'bg-[#0B1221]/60 border-white/10'}`}>
      {childSupportMode && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center gap-1">
          <HeartHandshake size={10} /> CO-PARENTING
        </div>
      )}
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
                <div className={`absolute inset-0 bg-primary/20 rounded-full blur-md transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'} `}></div>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
              </div>
              <span className={`text-[10px] font-medium truncate w-full text-center transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'
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