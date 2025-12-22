import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled_v1';

export const NotificationService = {
    async requestPermissions(): Promise<boolean> {
        try {
            const { display } = await LocalNotifications.requestPermissions();
            if (display === 'granted') {
                await Preferences.set({ key: NOTIFICATIONS_ENABLED_KEY, value: 'true' });
                return true;
            }
        } catch (e) {
            console.warn("Notification permissions failed:", e);
        }
        return false;
    },

    async checkPermissions(): Promise<boolean> {
        try {
            const { display } = await LocalNotifications.checkPermissions();
            return display === 'granted';
        } catch (e) {
            return false;
        }
    },

    async scheduleTestNotification() {
        // Auth Guard: Only send if logged in
        const { authService } = await import('./authService');
        const sessionUser = await authService.getCurrentSession();
        if (!sessionUser) {
            console.log('NotificationService: Skipping test notification, no active session.');
            return;
        }

        if (!(await this.checkPermissions())) {
            const granted = await this.requestPermissions();
            if (!granted) return;
        }

        await LocalNotifications.schedule({
            notifications: [{
                title: "TrueTrack Notification",
                body: "This is a test notification from TrueTrack.",
                id: Math.floor(Math.random() * 100000),
                schedule: { at: new Date(Date.now() + 1000 * 5) }, // 5 sec
                sound: 'beep.wav',
                attachments: undefined,
                actionTypeId: '',
                extra: null
            }]
        });
    },

    async sendCalendarUpdateNotification(newCount: number, updatedCount: number, partnerName: string = 'Partner') {
        const { authService } = await import('./authService');

        // Auth Guard: Only send if logged in
        const sessionUser = await authService.getCurrentSession();
        if (!sessionUser) {
            console.log('NotificationService: Skipping notification, no active session.');
            return;
        }

        if (!(await this.checkPermissions())) {
            const granted = await this.requestPermissions();
            if (!granted) {
                console.warn("Notification skipped: Permissions not granted.");
                return;
            }
        }

        if (newCount === 0 && updatedCount === 0) return;

        const title = "Calendar Updated";
        const body = newCount > 0
            ? `${partnerName} added ${newCount} new event${newCount > 1 ? 's' : ''}.`
            : `${partnerName} updated ${updatedCount} event${updatedCount > 1 ? 's' : ''}.`;

        await LocalNotifications.schedule({
            notifications: [{
                title,
                body,
                id: Math.floor(Math.random() * 100000),
                schedule: { at: new Date(Date.now() + 100) }, // Immediate
                smallIcon: 'ic_stat_icon_config_sample', // Default fallback
            }]
        });
    },

    async sendDetailedCalendarNotification(changes: {
        type: 'added' | 'modified' | 'deleted' | 'custody_changed';
        eventTitle?: string;
        eventType?: string;
        date?: string;
        startTime?: string;
        endTime?: string;
        oldDate?: string;
        oldTime?: string;
        custodyStatus?: string;
    }[]) {
        const { authService } = await import('./authService');

        // Auth Guard: Only send if logged in
        const sessionUser = await authService.getCurrentSession();
        if (!sessionUser) {
            console.log('NotificationService: Skipping notification, no active session.');
            return;
        }

        if (!(await this.checkPermissions())) {
            const granted = await this.requestPermissions();
            if (!granted) {
                console.warn("Notification skipped: Permissions not granted.");
                return;
            }
        }

        if (changes.length === 0) return;

        // Helper to get emoji for event type
        const getEventEmoji = (type?: string) => {
            if (!type) return '📅';
            const lower = type.toLowerCase();
            if (lower.includes('birthday') || lower.includes('bday')) return '🎂';
            if (lower.includes('sport') || lower.includes('soccer') || lower.includes('football')) return '⚽';
            if (lower.includes('school') || lower.includes('education')) return '🏫';
            if (lower.includes('playdate') || lower.includes('play')) return '🎨';
            if (lower.includes('doctor') || lower.includes('health')) return '🏥';
            return '📅';
        };

        // Helper to format date nicely
        const formatDate = (dateStr?: string) => {
            if (!dateStr) return '';
            try {
                const d = new Date(dateStr);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } catch {
                return dateStr;
            }
        };

        // Helper to format time
        const formatTime = (timeStr?: string) => {
            if (!timeStr) return '';
            return timeStr;
        };

        // Create notifications for each change (batch if needed)
        const notifications = changes.slice(0, 5).map(change => {
            let title = "Calendar Updated";
            let body = "";

            const emoji = getEventEmoji(change.eventType);
            const formattedDate = formatDate(change.date);
            const formattedTime = formatTime(change.startTime);

            switch (change.type) {
                case 'added':
                    title = "New Event Added";
                    body = `${emoji} ${change.eventTitle || 'Event'}`;
                    if (formattedDate) body += ` on ${formattedDate}`;
                    if (formattedTime) body += ` at ${formattedTime}`;
                    break;

                case 'modified':
                    title = "Event Updated";
                    body = `${emoji} ${change.eventTitle || 'Event'}`;
                    if (change.oldDate && change.date && change.oldDate !== change.date) {
                        body += ` moved to ${formattedDate}`;
                    } else if (change.oldTime && change.startTime && change.oldTime !== change.startTime) {
                        body += ` time changed to ${formattedTime}`;
                    } else {
                        body += ` was updated`;
                    }
                    break;

                case 'deleted':
                    title = "Event Removed";
                    body = `${emoji} ${change.eventTitle || 'Event'}`;
                    if (formattedDate) body += ` from ${formattedDate}`;
                    body += ` was deleted`;
                    break;

                case 'custody_changed':
                    title = "Custody Updated";
                    body = `👥 ${change.custodyStatus || 'Status changed'}`;
                    if (formattedDate) body += ` on ${formattedDate}`;
                    break;
            }

            return {
                title,
                body,
                id: Math.floor(Math.random() * 100000),
                schedule: { at: new Date(Date.now() + 100) },
                smallIcon: 'ic_stat_icon_config_sample',
            };
        });

        await LocalNotifications.schedule({ notifications });
    },

    async sendNotification(title: string, body: string) {
        if (!(await this.checkPermissions())) {
            const granted = await this.requestPermissions();
            if (!granted) return;
        }

        await LocalNotifications.schedule({
            notifications: [{
                title,
                body,
                id: Math.floor(Math.random() * 100000),
                schedule: { at: new Date(Date.now() + 100) },
                smallIcon: 'ic_stat_icon_config_sample',
            }]
        });
    }
};
