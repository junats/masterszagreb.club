import { Purchases, LOG_LEVEL, PurchasesOffering, PurchasesPackage, CustomerInfo, PurchasesError } from '@revenuecat/purchases-capacitor';
import { isMockMode } from './authService';
import { Capacitor } from '@capacitor/core';


export class RevenueCatService {
    private static initialized = false;
    private static initPromise: Promise<void> | null = null;

    static async initialize(userId: string): Promise<void> {
        if (isMockMode) return;
        if (this.initialized) return;

        // Ensure only one initialization happens at a time
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                console.log('🏗️ RevenueCat: Starting initialization...');
                await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

                const platform = Capacitor.getPlatform();
                console.log('🏗️ RevenueCat: Platform detected:', platform);

                const appleKey = (import.meta as any).env.VITE_REVENUECAT_APPLE_KEY;
                const googleKey = (import.meta as any).env.VITE_REVENUECAT_GOOGLE_KEY;

                console.log(`🏗️ RevenueCat: Keys state - Apple: ${appleKey ? (appleKey.startsWith('appl_') ? 'VALID_LOG' : 'LEGACY/INVALID') : 'MISSING'}, Google: ${googleKey ? (googleKey.startsWith('goog_') ? 'VALID_LOG' : 'LEGACY/INVALID') : 'MISSING'}`);

                const apiKey = platform === 'ios' ? appleKey : googleKey;

                if (!apiKey || apiKey.includes('EXAMPLE') || apiKey.startsWith('test_')) {
                    console.warn(`⚠️ RevenueCat: No valid production-ready API key for ${platform} (found: ${apiKey?.substring(0, 5)}...). Skipping initialization to prevent freezes.`);
                    this.initPromise = null;
                    return;
                }

                console.log(`🏗️ RevenueCat: Configuring with key ${apiKey.substring(0, 8)}...`);

                // Race the configuration against a 10s timeout
                const configPromise = Purchases.configure({
                    apiKey: apiKey,
                    appUserID: userId,
                });

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('RevenueCat timeout')), 10000)
                );

                await Promise.race([configPromise, timeoutPromise]);

                this.initialized = true;
                console.log('✅ RevenueCat: Initialized for user:', userId);
            } catch (e) {
                console.error('❌ RevenueCat: Initialization failed or timed out:', e);
                this.initPromise = null; // Reset promise to allow retry
            }
        })();

        return this.initPromise;
    }

    static hasActiveEntitlement(customerInfo: CustomerInfo | null): boolean {
        if (!customerInfo) return false;
        // Check for 'TrueTrack Pro' (configured in RC) and fallbacks
        const entitlements = customerInfo.entitlements.active;
        return !!(entitlements['TrueTrack Pro'] || entitlements['pro'] || entitlements['premium']);
    }

    static isReady(): boolean {
        return this.initialized && !isMockMode;
    }

    static getDebugStatus(): any {
        const platform = Capacitor.getPlatform();
        const appleKey = (import.meta as any).env.VITE_REVENUECAT_APPLE_KEY;
        const googleKey = (import.meta as any).env.VITE_REVENUECAT_GOOGLE_KEY;
        const currentKey = platform === 'ios' ? appleKey : googleKey;

        return {
            initialized: this.initialized,
            isMockMode: isMockMode,
            platform,
            hasAppleKey: !!appleKey,
            hasGoogleKey: !!googleKey,
            apiKeyPrefix: currentKey?.substring(0, 5) || 'NONE'
        };
    }

    /**
     * Detailed async debug info — queries the native bridge for raw offerings data.
     * Use this to diagnose why offerings are empty on device.
     */
    static async getDetailedDebugInfo(): Promise<any> {
        const base = this.getDebugStatus();
        if (!this.initialized || isMockMode) {
            return { ...base, rawOfferings: 'NOT_INITIALIZED', diagnosis: 'SDK not initialized — check API key and logs' };
        }
        try {
            const offerings = await Purchases.getOfferings();
            const allOfferingIds = Object.keys(offerings.all || {});
            const currentId = offerings.current?.identifier || null;
            const currentPackages = offerings.current?.availablePackages?.map((p: any) => ({
                id: p.identifier,
                productId: p.product?.identifier || 'unknown',
                price: p.product?.priceString || 'unknown',
            })) || [];

            // Build diagnosis
            let diagnosis = '';
            if (allOfferingIds.length === 0) {
                diagnosis = 'RevenueCat returned 0 offerings. Check: (1) Product exists in App Store Connect with status "Ready to Submit", (2) Product ID in RevenueCat matches ASC, (3) Bundle ID matches, (4) Shared Secret added in RevenueCat app settings.';
            } else if (!currentId) {
                diagnosis = `Found ${allOfferingIds.length} offering(s) [${allOfferingIds.join(', ')}] but NONE is set as "Current". Go to RevenueCat → Offerings → click the star to set one as Current.`;
            } else if (currentPackages.length === 0) {
                diagnosis = `Current offering "${currentId}" has 0 packages. Add a package with a valid product in RevenueCat → Offerings → ${currentId} → + New Package.`;
            } else {
                diagnosis = `OK: offering "${currentId}" with ${currentPackages.length} package(s).`;
            }

            // Check entitlements
            const customerInfo = await Purchases.getCustomerInfo();
            const activeEntitlements = Object.keys(customerInfo.customerInfo.entitlements.active);

            return {
                ...base,
                offeringsCount: allOfferingIds.length,
                allOfferingIds,
                currentOffering: currentId,
                currentPackages,
                activeEntitlements, // <--- Add this to debug
                diagnosis: diagnosis + (activeEntitlements.length > 0 ? `\n✅ Active Entitlements: ${activeEntitlements.join(', ')}` : '\n❌ No active entitlements found.'),
            };
        } catch (e: any) {
            return {
                ...base,
                rawError: e?.message || String(e),
                diagnosis: `getOfferings() threw an error: ${e?.message}. This usually means the API key is invalid or the app is not properly configured in RevenueCat.`,
            };
        }
    }

    static async getOfferings(): Promise<PurchasesPackage[]> {
        if (isMockMode) {
            console.log('🏗️ RevenueCat: getOfferings called in Mock Mode. Returning empty.');
            return [];
        }
        if (!this.initialized) {
            console.warn('🏗️ RevenueCat: getOfferings called before initialization. Initializing now...');
            // Try to initialize if possible? Usually this happens in UserContext, but defensive check
            return [];
        }
        try {
            console.log('🏗️ RevenueCat: Fetching offerings from native bridge...');
            const offerings = await Purchases.getOfferings();
            console.log('🏗️ RevenueCat: Native bridge returned offerings:', offerings);

            if (offerings.current === null) {
                console.warn('⚠️ RevenueCat: No "Current" offering set in the dashboard.');
                const allKeys = Object.keys(offerings.all);
                console.log('🏗️ RevenueCat: Available offering IDs:', allKeys);

                if (allKeys.length > 0) {
                    const firstOffering = offerings.all[allKeys[0]];
                    console.log(`🏗️ RevenueCat: Falling back to offering "${allKeys[0]}" which has ${firstOffering.availablePackages.length} packages.`);
                    return firstOffering.availablePackages;
                }
                return [];
            }

            if (offerings.current.availablePackages.length === 0) {
                console.warn('⚠️ RevenueCat: "Current" offering has 0 packages. Is there an issue with products/entitlements configuration?');
                return [];
            }

            console.log(`✅ RevenueCat: Found ${offerings.current.availablePackages.length} packages in "Current" offering.`);
            return offerings.current.availablePackages;
        } catch (e: any) {
            console.error('❌ RevenueCat: Error fetching offerings:', e);
            return [];
        }
    }

    static async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
        console.log('💎 RevenueCat: purchasePackage called for pkg:', pkg.identifier);
        if (isMockMode || !this.initialized) {
            console.warn('⚠️ RevenueCat: Cannot purchase. MockMode:', isMockMode, 'Initialized:', this.initialized);
            return null;
        }
        try {
            // Race the purchase against a 15s timeout
            const purchasePromise = Purchases.purchasePackage({ aPackage: pkg });
            const timeoutPromise = new Promise<{ customerInfo: CustomerInfo }>((_, reject) =>
                setTimeout(() => reject(new Error('Purchase request timed out (15s)')), 15000)
            );

            console.log('💎 RevenueCat: Sending native purchase request...');
            const result = await Promise.race([purchasePromise, timeoutPromise]);
            console.log('✅ RevenueCat: Purchase request resolved.');
            return result.customerInfo;
        } catch (e: any) {
            if (e.userCancelled) {
                console.log('ℹ️ RevenueCat: User cancelled purchase.');
            } else {
                console.error('❌ RevenueCat: Purchase failed or timed out:', e);
            }
            return null;
        }
    }

    static async getCustomerInfo(): Promise<CustomerInfo | null> {
        if (isMockMode || !this.initialized) return null;
        try {
            const result = await Purchases.getCustomerInfo();
            return (result as any).customerInfo || result;
        } catch (e) {
            console.error('Error fetching customer info:', e);
            return null;
        }
    }

    static async restorePurchases(): Promise<CustomerInfo | null> {
        if (isMockMode || !this.initialized) return null;
        try {
            const result = await Purchases.restorePurchases();
            return result.customerInfo;
        } catch (e) {
            console.error('Error restoring purchases:', e);
            return null;
        }
    }
}
