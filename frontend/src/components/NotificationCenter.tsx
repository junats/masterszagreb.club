import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, Calendar, TrendingUp, Users, X, CheckCircle, AlertCircle, AlertTriangle, Info, Trash2, Clock, Wallet, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { generateInsights } from '../services/insightService';

import { ViewState } from '@common/types';
// import { Button } from './ui/button'; // Not using component library button

import { ArrowRight } from 'lucide-react';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: ViewState) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, onNavigate }) => {
    const {
        markAllNotificationsAsRead,
        receipts,
        monthlyBudget,
        custodyDays,
        goals,
        user
    } = useData();
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);

    // Recent alerts with persistence
    const [recentAlerts, setRecentAlerts] = useState<Array<{ id: number, message: string, type: string, time: string, isRead?: boolean }>>([]);
    const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

    // Get Smart Insights
    const smartInsights = useMemo(() => {
        // Calculate spend
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const thisMonthReceipts = receipts.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });
        const currentSpent = thisMonthReceipts.reduce((sum, r) => sum + r.total, 0);

        // Calculate previous month spend for comparison if needed
        const prevMonthReceipts = receipts.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth - 1;
        });
        const prevMonthSpent = prevMonthReceipts.reduce((sum, r) => sum + r.total, 0);

        return generateInsights(
            currentSpent,
            monthlyBudget,
            receipts,
            custodyDays,
            prevMonthSpent,
            goals || [],
            t
        );
    }, [receipts, monthlyBudget, custodyDays, goals, t]);

    // Notifications state (can still be persistent for system messages)
    const [systemNotifications, setSystemNotifications] = useState<Array<any>>([]);

    useEffect(() => {
        if (isOpen) {
            // markAllNotificationsAsRead();
            // We'll handle individual read status instead of just clearing the dot on open
        }
    }, [isOpen]);

    const handleDismissInsight = (id: string) => {
        setDismissedInsights(prev => new Set([...prev, id]));
    };

    // Load persisted data
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const { Preferences } = await import('@capacitor/preferences');

                // Load recent alerts
                const { value: savedAlerts } = await Preferences.get({ key: 'truetrack_recent_alerts' });
                if (savedAlerts) {
                    setRecentAlerts(JSON.parse(savedAlerts));
                }

                // Load system notifications
                const { value: savedNotifications } = await Preferences.get({ key: 'truetrack_notifications' });
                if (savedNotifications) {
                    const parsed = JSON.parse(savedNotifications);
                    // Restore icon references
                    const withIcons = parsed.map((n: any) => ({
                        ...n,
                        icon: n.type === 'custody' ? Calendar : n.type === 'budget' ? TrendingUp : Users
                    }));
                    setSystemNotifications(withIcons);
                } else {
                    // Default seed if empty 
                    setSystemNotifications([
                        {
                            id: 1,
                            type: 'coparent',
                            title: t('notificationsView.coparentInvite'),
                            message: t('notificationsView.inviteDesc'),
                            time: '1 day ago',
                            icon: Users,
                            color: 'text-emerald-400',
                            bgColor: 'bg-emerald-500/10'
                        },
                    ]);
                }
            } catch (e) {
                console.error('Failed to load notifications:', e);
            }
        };
        loadNotifications();
    }, []);

    // Dismiss handlers
    const handleDismissAlert = async (id: number) => {
        const updated = recentAlerts.filter(alert => alert.id !== id);
        setRecentAlerts(updated);
        try {
            const { Preferences } = await import('@capacitor/preferences');
            await Preferences.set({ key: 'truetrack_recent_alerts', value: JSON.stringify(updated) });
        } catch (e) {
            console.error('Failed to save alerts:', e);
        }
    };

    const handleDismissSystemNotification = async (id: number) => {
        const updated = systemNotifications.filter(n => n.id !== id);
        setSystemNotifications(updated);
        try {
            const { Preferences } = await import('@capacitor/preferences');
            await Preferences.set({ key: 'truetrack_notifications', value: JSON.stringify(updated) });
        } catch (e) {
            console.error('Failed to save notifications:', e);
        }
    };

    const toggleNotificationRead = async (id: number, type: 'alert' | 'system') => {
        if (type === 'alert') {
            const updated = recentAlerts.map(a => a.id === id ? { ...a, isRead: !a.isRead } : a);
            setRecentAlerts(updated);
            const { Preferences } = await import('@capacitor/preferences');
            await Preferences.set({ key: 'truetrack_recent_alerts', value: JSON.stringify(updated) });
        } else {
            const updated = systemNotifications.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n);
            setSystemNotifications(updated);
            const { Preferences } = await import('@capacitor/preferences');
            await Preferences.set({ key: 'truetrack_notifications', value: JSON.stringify(updated) });
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);


    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.2 }}
                ref={containerRef}
                className="absolute top-16 left-4 right-4 max-w-sm ml-auto bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-2">
                        <Bell size={16} className="text-white" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t('notificationsView.title')}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                markAllNotificationsAsRead();
                                // Also mark all local items as read
                                setRecentAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
                                setSystemNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            }}
                            className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 transition-colors mr-2 px-2 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20"
                        >
                            {t('notificationsView.markAsRead')}
                        </button>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto p-4 space-y-6 scroll-smooth">

                    {/* section: Insights (Smart Notifications) */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <TrendingUp size={12} />
                            {t('dashboard.insights')}
                        </h3>
                        <div className="space-y-3">
                            {smartInsights.filter(i => !dismissedInsights.has(i.id)).length > 0 ? (
                                smartInsights.filter(i => !dismissedInsights.has(i.id)).map((insight) => (
                                    <div key={insight.id} className={`p-3 rounded-xl border flex flex-col gap-2 relative group ${insight.severity === 'danger' ? 'bg-red-500/10 border-red-500/20' :
                                        insight.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                                            insight.severity === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                                'bg-blue-500/10 border-blue-500/20'
                                        }`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 ${insight.severity === 'danger' ? 'text-red-400' :
                                                insight.severity === 'warning' ? 'text-amber-400' :
                                                    insight.severity === 'success' ? 'text-emerald-400' :
                                                        'text-blue-400'
                                                }`}>
                                                {insight.icon ? React.createElement(insight.icon, { size: 16 }) : <Info size={16} />}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${insight.severity === 'danger' ? 'text-red-300' :
                                                    insight.severity === 'warning' ? 'text-amber-300' :
                                                        insight.severity === 'success' ? 'text-emerald-300' :
                                                            'text-blue-300'
                                                    }`}>{insight.text}</p>
                                                <p className="text-xs text-slate-400 leading-tight mt-1">{insight.subtext}</p>
                                            </div>
                                        </div>

                                        {/* Dismiss Insight */}
                                        <button
                                            onClick={() => handleDismissInsight(insight.id)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition-opacity"
                                            title={t('notificationsView.dismiss')}
                                        >
                                            <X size={14} />
                                        </button>

                                        {/* Action Button */}
                                        {insight.action && (
                                            <div className="pl-7">
                                                <button
                                                    onClick={() => {
                                                        const targetView =
                                                            insight.action === 'calendar' ? 'custody' :
                                                                insight.action === 'budget' ? 'dashboard' :
                                                                    insight.action === 'history' ? 'history' :
                                                                        insight.action === 'goals' ? 'dashboard' : // Goals are on dashboard for now
                                                                            'dashboard';
                                                        onNavigate(targetView as ViewState);
                                                        onClose();
                                                    }}
                                                    className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${insight.severity === 'danger' ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30' :
                                                        insight.severity === 'warning' ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30' :
                                                            insight.severity === 'success' ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30' :
                                                                'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30'
                                                        }`}
                                                >
                                                    {insight.actionLabel || 'View'}
                                                    <ArrowRight size={10} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-500 italic text-center py-2">No new insights.</p>
                            )}
                        </div>
                    </div>

                    {/* Section: Recent Alerts (Toasts) */}
                    {recentAlerts.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Clock size={12} />
                                {t('notificationsView.recent')}
                            </h3>
                            <div className="space-y-2">
                                {recentAlerts.map((alert) => (
                                    <div key={alert.id} className="relative group">
                                        <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${alert.isRead ? 'bg-slate-800/30 border-white/5 saturate-[0.5]' : 'bg-slate-800/80 border-blue-500/20 shadow-lg shadow-blue-500/5'}`}>
                                            {!alert.isRead && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                            {alert.type === 'success' && <CheckCircle size={14} className="text-emerald-400" />}
                                            {alert.type === 'error' && <AlertCircle size={14} className="text-red-400" />}
                                            {alert.type === 'info' && <Info size={14} className="text-blue-400" />}
                                            <div className="flex-1">
                                                <p className={`text-xs font-medium ${alert.isRead ? 'text-slate-400' : 'text-slate-200'}`}>{alert.message}</p>
                                                <p className="text-[10px] text-slate-500">{alert.time}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 group-hover:opacity-100">
                                                <button
                                                    onClick={() => toggleNotificationRead(alert.id, 'alert')}
                                                    className={`p-1 transition-colors ${alert.isRead ? 'text-slate-600 hover:text-blue-400' : 'text-blue-400 hover:text-blue-300'}`}
                                                    title={alert.isRead ? t('notificationsView.markAsUnread') : t('notificationsView.markAsRead')}
                                                >
                                                    {alert.isRead ? <Clock size={14} /> : <CheckCircle size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDismissAlert(alert.id)}
                                                    className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                                                    title={t('notificationsView.delete')}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section: System Notifications */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Users size={12} />
                            {t('notificationsView.all')}
                        </h3>
                        {systemNotifications.length > 0 ? (
                            <div className="space-y-3">
                                {systemNotifications.map((notification) => {
                                    const Icon = notification.icon || Bell;
                                    return (
                                        <div
                                            key={notification.id}
                                            className={`border rounded-xl p-3 transition-colors group relative ${notification.isRead ? 'bg-slate-800/20 border-white/5 saturate-[0.5]' : 'bg-slate-800/60 border-indigo-500/20 shadow-lg shadow-indigo-500/5'}`}
                                        >
                                            {!notification.isRead && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
                                            <div className="flex items-start gap-3">
                                                <div className={`${notification.bgColor || 'bg-slate-700'} ${notification.color || 'text-white'} p-2 rounded-lg flex-shrink-0 transition-opacity ${notification.isRead ? 'opacity-50' : ''}`}>
                                                    <Icon size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-bold text-xs mb-0.5 ${notification.isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                                                        {notification.title}
                                                    </h3>
                                                    <p className={`text-xs leading-relaxed ${notification.isRead ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        {notification.message}
                                                    </p>
                                                    <span className="text-slate-600 text-[10px] mt-1 block">
                                                        {notification.time}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-100 group-hover:opacity-100">
                                                    <button
                                                        onClick={() => toggleNotificationRead(notification.id, 'system')}
                                                        className={`p-1 transition-colors ${notification.isRead ? 'text-slate-600 hover:text-blue-400' : 'text-blue-400 hover:text-blue-300'}`}
                                                        title={notification.isRead ? t('notificationsView.markAsUnread') : t('notificationsView.markAsRead')}
                                                    >
                                                        {notification.isRead ? <Clock size={14} /> : <CheckCircle size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDismissSystemNotification(notification.id)}
                                                        className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                                                        title={t('notificationsView.delete')}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 italic text-center py-2">{t('notificationsView.caughtUp')}</p>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default NotificationCenter;
