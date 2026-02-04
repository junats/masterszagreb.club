import React from 'react';
import { User, ViewState } from '@common/types';
import { ShieldCheck, HeartHandshake, Bell } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
    user: User | null;
    currentView: ViewState;
    onAvatarClick: () => void;
    ageRestricted: boolean; // Add to props if needed for Shield icon
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
        <header className="fixed top-0 left-0 right-0 z-[60] bg-[#0B1221]/90 backdrop-blur-3xl border-b border-white/10 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
            style={{ height: 'calc(var(--header-height) + var(--safe-area-top))' }}>
            {/* Safe Area Spacer */}
            <div style={{ height: 'var(--safe-area-top)' }} />

            {/* Content Area - Vertically Centered */}
            <div className="flex items-center justify-between px-6" style={{ height: 'var(--header-height)' }}>
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="TrueTrack Logo" className="w-8 h-8 rounded-lg" />
                    <div>
                        <h1 className="text-xl font-heading font-bold text-white tracking-tight leading-none">{title}</h1>
                        <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mt-1">{subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/50 border border-white/5 hover:bg-slate-700/50 transition-colors"
                    >
                        <Bell className="w-5 h-5 text-slate-400" />
                        {unreadNotificationCount > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0B1221]" />
                        )}
                    </button>

                    {/* Avatar / Profile Link */}
                    <div className="relative group cursor-pointer" onClick={onAvatarClick}>
                        <div className={`w-9 h-9 rounded-full border border-white/10 flex items-center justify-center overflow-hidden transition-transform active:scale-95 ${user?.tier === SubscriptionTier.PRO ? 'ring-2 ring-amber-500/30' : ''} ${childSupportMode ? 'ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : ''} shadow-lg`}>
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                    {(user?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {childSupportMode && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0B1221] flex items-center justify-center">
                                <HeartHandshake size={8} className="text-black" />
                            </div>
                        )}
                    </div>
                    {ageRestricted && (
                        <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="text-amber-500 w-4 h-4" />
                        </div>
                    )}
                </div>
            </div>

            <NotificationCenter isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} onNavigate={onNavigate} />
        </header>
    );
};

export default Header;
