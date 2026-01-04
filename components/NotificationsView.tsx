import React, { useState, useEffect } from 'react';
import { Bell, Calendar, TrendingUp, Users, X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, PanInfo } from 'framer-motion';
import { useData } from '../contexts/DataContext';

import { useLanguage } from '../contexts/LanguageContext';

interface NotificationsViewProps { }

const NotificationsView: React.FC<NotificationsViewProps> = () => {
    const { markAllNotificationsAsRead } = useData();
    const { t } = useLanguage();

    // Mark all notifications as read when viewing this screen
    useEffect(() => {
        markAllNotificationsAsRead();
    }, [markAllNotificationsAsRead]);

    // Recent alerts with persistence
    const [recentAlerts, setRecentAlerts] = useState<Array<{ id: number, message: string, type: string, time: string }>>([]);

    // Notifications with persistence
    const [notifications, setNotifications] = useState<Array<any>>([]);

    // Load from storage on mount
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const { Preferences } = await import('@capacitor/preferences');

                // Load recent alerts
                const { value: savedAlerts } = await Preferences.get({ key: 'truetrack_recent_alerts' });
                if (savedAlerts) {
                    setRecentAlerts(JSON.parse(savedAlerts));
                } else {
                    // Default mock data only if nothing saved
                    setRecentAlerts([
                        { id: 1, message: t('notificationsView.widgetSuccess'), type: 'success', time: '1m ago' },
                        { id: 2, message: t('notificationsView.proActivated'), type: 'success', time: '5m ago' },
                        { id: 3, message: t('notificationsView.budgetExceeded', { amount: 891 }), type: 'error', time: '2h ago' },
                        { id: 4, message: t('notificationsView.custodySynced'), type: 'info', time: '3h ago' },
                    ]);
                }

                // Load notifications
                const { value: savedNotifications } = await Preferences.get({ key: 'truetrack_notifications' });
                if (savedNotifications) {
                    const parsed = JSON.parse(savedNotifications);
                    // Restore icon references
                    const withIcons = parsed.map((n: any) => ({
                        ...n,
                        icon: n.type === 'custody' ? Calendar : n.type === 'budget' ? TrendingUp : Users
                    }));
                    setNotifications(withIcons);
                } else {
                    // Default mock data only if nothing saved
                    setNotifications([
                        {
                            id: 1,
                            type: 'custody',
                            title: t('notificationsView.custodyTransition'),
                            message: t('notificationsView.custodyDesc'),
                            time: '2 hours ago',
                            icon: Calendar,
                            color: 'text-blue-400',
                            bgColor: 'bg-blue-500/10'
                        },
                        {
                            id: 2,
                            type: 'budget',
                            title: t('notificationsView.budgetAlert'),
                            message: t('notificationsView.budgetDesc', { amount: 891 }),
                            time: '5 hours ago',
                            icon: TrendingUp,
                            color: 'text-red-400',
                            bgColor: 'bg-red-500/10'
                        },
                        {
                            id: 3,
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

    // Save to storage when notifications change
    useEffect(() => {
        const saveNotifications = async () => {
            try {
                const { Preferences } = await import('@capacitor/preferences');

                // Save recent alerts
                await Preferences.set({
                    key: 'truetrack_recent_alerts',
                    value: JSON.stringify(recentAlerts)
                });

                // Save notifications (without icon functions)
                const toSave = notifications.map(n => ({
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    time: n.time,
                    color: n.color,
                    bgColor: n.bgColor
                }));
                await Preferences.set({
                    key: 'truetrack_notifications',
                    value: JSON.stringify(toSave)
                });
            } catch (e) {
                console.error('Failed to save notifications:', e);
            }
        };

        if (notifications.length > 0 || recentAlerts.length > 0) {
            saveNotifications();
        }
    }, [notifications, recentAlerts]);

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={14} className="text-emerald-400" />;
            case 'error': return <AlertCircle size={14} className="text-red-400" />;
            case 'warning': return <AlertTriangle size={14} className="text-amber-400" />;
            default: return <Info size={14} className="text-blue-400" />;
        }
    };

    const getAlertColor = (type: string) => {
        switch (type) {
            case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
            case 'error': return 'bg-red-500/10 border-red-500/20';
            case 'warning': return 'bg-amber-500/10 border-amber-500/20';
            default: return 'bg-blue-500/10 border-blue-500/20';
        }
    };

    const handleDismissAlert = (id: number) => {
        setRecentAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    const handleDismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    return (
        <div className="flex flex-col h-full px-4">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-white mb-1">{t('notificationsView.title')}</h1>
                <p className="text-sm text-slate-400">{t('notificationsView.subtitle')}</p>
            </div>

            {/* Recent Alerts (Toast-style with swipe to delete) */}
            <div className="mb-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('notificationsView.recent')}</h2>
                <div className="space-y-2">
                    {recentAlerts.map((alert) => (
                        <motion.div
                            key={alert.id}
                            drag="x"
                            dragConstraints={{ left: -100, right: 0 }}
                            dragElastic={0.1}
                            onDragEnd={(e, info: PanInfo) => {
                                if (info.offset.x < -80) {
                                    handleDismissAlert(alert.id);
                                }
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm ${getAlertColor(alert.type)} cursor-grab active:cursor-grabbing`}
                        >
                            {getAlertIcon(alert.type)}
                            <p className="flex-1 text-xs font-medium text-white">{alert.message}</p>
                            <span className="text-[10px] text-slate-500">{alert.time}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 mb-4"></div>

            {/* Main Notifications List */}
            <div className="flex-1 overflow-y-auto">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('notificationsView.all')}</h2>
                <div className="space-y-3">
                    {notifications.map((notification) => {
                        const Icon = notification.icon;
                        return (
                            <div
                                key={notification.id}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className={`${notification.bgColor} ${notification.color} p-2.5 rounded-lg flex-shrink-0`}>
                                        <Icon size={20} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-semibold text-sm mb-1">
                                            {notification.title}
                                        </h3>
                                        <p className="text-slate-400 text-xs mb-2">
                                            {notification.message}
                                        </p>
                                        <span className="text-slate-500 text-xs">
                                            {notification.time}
                                        </span>
                                    </div>

                                    {/* Dismiss */}
                                    <button
                                        onClick={() => handleDismissNotification(notification.id)}
                                        className="text-slate-500 hover:text-white transition-colors p-1"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Empty State (if no notifications) */}
            {notifications.length === 0 && recentAlerts.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="bg-white/5 p-4 rounded-full mb-4">
                        <Bell size={32} className="text-slate-500" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{t('notificationsView.noNotifications')}</h3>
                    <p className="text-slate-400 text-sm max-w-xs">
                        {t('notificationsView.caughtUp')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default NotificationsView;
