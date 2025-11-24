import React from 'react';
import { Home, ScanLine, History, Settings, LifeBuoy } from 'lucide-react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isVisible: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, isVisible }) => {
  if (!isVisible) return null;

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'scan', label: 'Scan', icon: ScanLine },
    { id: 'history', label: 'History', icon: History },
    { id: 'support', label: 'Help', icon: LifeBuoy },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-slate-700 pb-safe pt-2 px-2 h-20 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto h-full pb-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`flex flex-col items-center justify-center space-y-1 flex-1 min-w-0 transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-full ${isActive ? 'bg-primary/10' : ''} transition-all`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;