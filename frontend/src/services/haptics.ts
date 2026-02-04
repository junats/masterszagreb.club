import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const HapticsService = {
    async impactLight() {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            // Ignore errors (e.g. on web if not supported)
        }
    },

    async impactMedium() {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {
            // Ignore
        }
    },

    async impactHeavy() {
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {
            // Ignore
        }
    },

    async notificationSuccess() {
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {
            // Ignore
        }
    },

    async notificationWarning() {
        try {
            await Haptics.notification({ type: NotificationType.Warning });
        } catch (e) {
            // Ignore
        }
    },

    async notificationError() {
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch (e) {
            // Ignore
        }
    },

    async selection() {
        try {
            await Haptics.selectionStart();
            await Haptics.selectionChanged();
            await Haptics.selectionEnd();
        } catch (e) {
            // Ignore
        }
    },

    async vibrate() {
        try {
            await Haptics.vibrate();
        } catch (e) {
            // Ignore
        }
    }
};
