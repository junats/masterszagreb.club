import React from 'react';
import { SubscriptionTier } from "@common/types";
import { User, ViewState } from '@common/types';
import { Heart, Bell, Star } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
    user: User | null;
    currentView: ViewState;
    onAvatarClick: () => void;
    ageRestricted: boolean; // Keep in props for now to avoid breaking App.tsx, but ignore
    onNavigate: (view: ViewState) => void;
}

const Header: React.FC<HeaderProps> = ({ user, currentView, onAvatarClick, ageRestricted, onNavigate }) => {
    const { childSupportMode, unreadNotificationCount } = useData();
    const { t } = useLanguage();
    const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);

    const getHeaderInfo = (view: ViewState): { title: string; subtitle: string } => {
        switch (view) {
            case 'dashboard':
                return { title: t('navigation.dashboard'), subtitle: t('navigation.dashboardSubtitle') };
            case 'scan':
                return { title: t('scanner.title'), subtitle: t('navigation.scanSubtitle') };
            case 'history':
                return { title: t('navigation.history'), subtitle: t('navigation.historySubtitle') };
            case 'settings':
                return { title: t('navigation.settings'), subtitle: t('navigation.settingsSubtitle') };
            case 'support':
                return { title: t('navigation.helpTitle'), subtitle: t('navigation.helpSubtitle') };
            case 'provision':
                return { title: t('navigation.provision'), subtitle: t('navigation.provisionSubtitle') };
            case 'custody':
                return { title: t('navigation.custody'), subtitle: t('navigation.custodySubtitle') };
            case 'settlement':
                return { title: t('navigation.settlement'), subtitle: t('navigation.settlementSubtitle') };
            default:
                return { title: 'TrueTrack', subtitle: t('common.app') };
        }
    };

    const { title, subtitle } = getHeaderInfo(currentView);

    return (
        <header className="fixed top-0 left-0 right-0 z-[60] bg-black/70 backdrop-blur-xl border-b border-white/10 transition-all duration-300"
            style={{ height: 'calc(var(--header-height) + var(--safe-area-top))' }}>
            {/* Safe Area Spacer */}
            <div style={{ height: 'var(--safe-area-top)' }} />

            {/* Content Area - Vertically Centered */}
            <div className="flex items-center justify-between px-4" style={{ height: 'var(--header-height)' }}>
                <div className="flex items-center gap-3">
                    {/* <img src="/logo.png" alt="TrueTrack Logo" className="w-8 h-8 rounded-lg shadow-sm" /> */}
                    <div>
                        <h1 className="text-[17px] font-semibold text-black dark:text-white tracking-tight leading-none">{title}</h1>
                        {/* Subtitle often omitted in iOS Large Title nav bars, but keeping small if needed */}
                        {subtitle && <p className="text-[11px] font-medium text-systemGray mt-0.5 uppercase tracking-wide">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all shadow-sm group"
                    >
                        <Bell className="w-5 h-5 text-systemBlue group-active:scale-90 transition-transform" />
                        {unreadNotificationCount > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-systemRed rounded-full border-2 border-white dark:border-black shadow-sm" />
                        )}
                    </button>

                    {/* Avatar / Profile Link */}
                    <div className="relative group cursor-pointer" onClick={onAvatarClick}>
                        <div className={`w-9 h-9 rounded-full border border-black/5 dark:border-white/10 flex items-center justify-center overflow-hidden transition-transform active:scale-95 shadow-sm`}>
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-systemGray4 dark:bg-systemGray2 flex items-center justify-center text-xs font-bold text-black dark:text-white">
                                    {(user?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {user?.tier === SubscriptionTier.PRO && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-systemYellow rounded-full border-1.5 border-white dark:border-black flex items-center justify-center shadow-md z-10 animate-in zoom-in duration-300">
                                <Star size={8} className="text-black" fill="currentColor" />
                            </div>
                        )}
                        {childSupportMode && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-systemGreen rounded-full border-1.5 border-white dark:border-black flex items-center justify-center shadow-md animate-in fade-in duration-500">
                                <Heart size={8} className="text-white" fill="currentColor" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <NotificationCenter isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} onNavigate={onNavigate} />
        </header>
    );
};

export default Header;
