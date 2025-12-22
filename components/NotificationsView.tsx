import React, { useState } from 'react';
import { Bell, Calendar, TrendingUp, Users, X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, PanInfo } from 'framer-motion';

interface NotificationsViewProps { }

const NotificationsView: React.FC<NotificationsViewProps> = () => {
    // Mock recent alerts (toast-style notifications)
    const [recentAlerts, setRecentAlerts] = useState([
        { id: 1, message: 'Widget data updated successfully', type: 'success', time: '1m ago' },
        { id: 2, message: 'Pro mode activated', type: 'success', time: '5m ago' },
        { id: 3, message: 'Budget exceeded by €891', type: 'error', time: '2h ago' },
        { id: 4, message: 'Custody calendar synced', type: 'info', time: '3h ago' },
    ]);

    // Mock notifications data
    const notifications = [
        {
            id: 1,
            type: 'custody',
            title: 'Custody Transition Tomorrow',
            message: 'Child will be with co-parent starting tomorrow',
            time: '2 hours ago',
            icon: Calendar,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10'
        },
        {
            id: 2,
            type: 'budget',
            title: 'Budget Alert',
            message: 'You\'ve exceeded your monthly budget by €891',
            time: '5 hours ago',
            icon: TrendingUp,
            color: 'text-red-400',
            bgColor: 'bg-red-500/10'
        },
        {
            id: 3,
            type: 'coparent',
            title: 'Co-parent Invite',
            message: 'Sarah invited you to share custody calendar',
            time: '1 day ago',
            icon: Users,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10'
        },
    ];

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

    return (
        <div className="flex flex-col h-full px-4">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
                <p className="text-sm text-slate-400">Stay updated with important alerts</p>
            </div>

            {/* Recent Alerts (Toast-style with swipe to delete) */}
            <div className="mb-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Activity</h2>
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
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">All Notifications</h2>
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
                                    <button className="text-slate-500 hover:text-white transition-colors p-1">
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
                    <h3 className="text-white font-semibold mb-2">No notifications</h3>
                    <p className="text-slate-400 text-sm max-w-xs">
                        You're all caught up! We'll notify you of important updates.
                    </p>
                </div>
            )}
        </div>
    );
};

export default NotificationsView;
