import React from 'react';
import { Home, ScanLine, History, Settings, LifeBuoy } from 'lucide-react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isVisible: boolean;
  childSupportMode: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, isVisible, childSupportMode }) => {
  if (!isVisible) return null;

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, hidden: false },
    { id: 'scan', label: 'Scan', icon: ScanLine, hidden: false },
    { id: 'history', label: 'History', icon: History, hidden: false },
    { id: 'support', label: 'Help', icon: LifeBuoy, hidden: !childSupportMode },
    { id: 'settings', label: 'Settings', icon: Settings, hidden: false },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-white/5 pb-safe pt-2 px-2 h-auto min-h-[80px] z-50 transition-all duration-300">
      <div className="flex justify-between items-center max-w-md mx-auto h-full pb-2">
        {navItems.filter(item => !item.hidden).map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`group flex flex-col items-center justify-center space-y-1.5 flex-1 min-w-0 outline-none`}
            >
              <div className={`p-2 rounded-full transition-all duration-500 ease-out relative ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'
                }`}>
                {/* Active Glow Background */}
                <div className={`absolute inset-0 bg-primary/20 rounded-full blur-md transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}></div>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
              </div>
              <span className={`text-[10px] font-medium truncate w-full text-center transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'
                }`}>
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