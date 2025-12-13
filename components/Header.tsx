import React from 'react';
import { User, ViewState } from '../types';
import { ShieldCheck } from 'lucide-react';

interface HeaderProps {
    user: User | null;
    currentView: ViewState;
    onAvatarClick: () => void;
    ageRestricted: boolean; // Add to props if needed for Shield icon
}

const getHeaderInfo = (view: ViewState): { title: string; subtitle: string } => {
    switch (view) {
        case 'dashboard':
            return { title: 'Dashboard', subtitle: 'Overview' };
        case 'scan':
            return { title: 'Scan Receipt', subtitle: 'Camera' };
        case 'history':
            return { title: 'History', subtitle: 'Transactions' };
        case 'settings':
            return { title: 'Settings', subtitle: 'Preferences' };
        case 'support':
            return { title: 'Help & Support', subtitle: 'Assistance' };
        case 'provision':
            return { title: 'Provision', subtitle: 'Analysis' };
        case 'custody':
            return { title: 'Custody', subtitle: 'Calendar' };
        case 'settlement':
            return { title: 'Settlement', subtitle: 'Report' };
        default:
            return { title: 'TrueTrack', subtitle: 'App' };
    }
};

const Header: React.FC<HeaderProps> = ({ user, currentView, onAvatarClick, ageRestricted }) => {
    const { title, subtitle } = getHeaderInfo(currentView);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B1221]/60 backdrop-blur-2xl border-b border-white/10 px-6 pb-4 pt-14 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-3">
                <img src="/logo.png" alt="TrueTrack Logo" className="w-8 h-8 rounded-lg" />
                <div>
                    <h1 className="text-xl font-heading font-bold text-white tracking-tight">{title}</h1>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{subtitle}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {/* Avatar / Profile Link */}
                <div className="relative group cursor-pointer" onClick={onAvatarClick}>
                    <div className={`w-9 h-9 rounded-full border border-white/10 flex items-center justify-center overflow-hidden transition-transform active:scale-95 ${user?.tier === 'PRO' ? 'ring-2 ring-amber-500/30' : ''} shadow-lg`}>
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                {(user?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
                {ageRestricted && (
                    <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="text-amber-500 w-4 h-4" />
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
