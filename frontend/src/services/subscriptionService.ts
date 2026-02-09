import { Purchases, PurchasesOfferings, PurchasesPackage, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { SubscriptionTier } from '@common/types';

// TODO: Replace with actual RevenueCat API Keys
const API_KEY_IOS = 'test_QvsZgFCWansgQRkURkIvHfbcQRj';
const API_KEY_ANDROID = 'goog_REPLACE_WITH_YOUR_KEY';

export const subscriptionService = {

    async initialize(): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            console.log("SubscriptionService: Web detected, skipping RevenueCat init.");
            return;
        }

        try {
            console.log("SubscriptionService: Initializing RevenueCat...");
            await Purchases.setLogLevel({ level: "DEBUG" }); // Use "WARN" or "ERROR" for production

            if (Capacitor.getPlatform() === 'ios') {
                await Purchases.configure({ apiKey: API_KEY_IOS });
            } else if (Capacitor.getPlatform() === 'android') {
                await Purchases.configure({ apiKey: API_KEY_ANDROID });
            }

            // identify user if logged in? optional for now
        } catch (error) {
            console.error("SubscriptionService Init Failed:", error);
        }
    },

    async getCustomerInfo(): Promise<SubscriptionTier> {
        if (!Capacitor.isNativePlatform()) {
            // Mock for web
            const isPro = localStorage.getItem('mock_pro_mode') === 'true';
            return isPro ? SubscriptionTier.PRO : SubscriptionTier.FREE;
        }

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            // Check for 'pro' entitlement. Ensure your Entitlement in RevenueCat is named 'pro'
            if (customerInfo.entitlements.active['pro']) {
                return SubscriptionTier.PRO;
            }
            return SubscriptionTier.FREE;
        } catch (error) {
            console.error("Error fetching customer info:", error);
            return SubscriptionTier.FREE;
        }
    },

    async getOfferings(): Promise<PurchasesOfferings | null> {
        if (!Capacitor.isNativePlatform()) return null;
        try {
            const offerings = await Purchases.getOfferings();
            return offerings;
        } catch (error) {
            console.error("Error fetching offerings:", error);
            return null;
        }
    },

    async purchasePro(): Promise<{ success: boolean; isPro: boolean }> {
        if (!Capacitor.isNativePlatform()) {
            console.log("Web Mock Purchase: Success");
            localStorage.setItem('mock_pro_mode', 'true');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true, isPro: true };
        }

        try {
            const offerings = await Purchases.getOfferings();
            const packageToPurchase = offerings.current?.monthly || offerings.current?.availablePackages[0];

            if (!packageToPurchase) {
                throw new Error("No packages available in current offering");
            }

            const { customerInfo } = await Purchases.purchasePackage({ aPackage: packageToPurchase });

            const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
            return { success: true, isPro };
        } catch (error: any) {
            if (error.userCancelled) {
                console.log("User cancelled purchase");
                return { success: false, isPro: false };
            }
            console.error("Purchase failed:", error);
            throw error; // Rethrow to handle in UI
        }
    },

    async restorePurchases(): Promise<{ success: boolean; isPro: boolean }> {
        if (!Capacitor.isNativePlatform()) {
            return { success: true, isPro: true };
        }

        try {
            const customerInfo = await Purchases.restorePurchases();
            const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
            return { success: true, isPro };
        } catch (error) {
            console.error("Restore failed:", error);
            return { success: false, isPro: false };
        }
    }
};
