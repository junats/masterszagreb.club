import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const HapticService = {
    impact: async (style: ImpactStyle = ImpactStyle.Light) => {
        if (Capacitor.isNativePlatform()) {
            try {
                await Haptics.impact({ style });
            } catch (e) {
                console.error('Haptic impact failed:', e);
            }
        }
    },

    notification: async (type: NotificationType = NotificationType.Success) => {
        if (Capacitor.isNativePlatform()) {
            try {
                await Haptics.notification({ type });
            } catch (e) {
                console.error('Haptic notification failed:', e);
            }
        }
    },

    selection: async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                await Haptics.selectionStart();
                await Haptics.selectionChanged();
                await Haptics.selectionEnd();
            } catch (e) {
                console.error('Haptic selection failed:', e);
            }
        }
    }
};
