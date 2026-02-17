import { useState, useEffect } from 'react';
import { CustomerInfo, Purchases } from '@revenuecat/purchases-capacitor';
import { RevenueCatService } from '../services/revenueCatService';
import { isMockMode } from '../services/authService';

export const usePremiumStatus = (userId: string | undefined) => {
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

    useEffect(() => {
        if (!userId || isMockMode) {
            setLoading(false);
            return;
        }

        const checkStatus = async () => {
            try {
                // Ensure RevenueCat is initialized before trying to get info
                if (!RevenueCatService.isReady()) {
                    console.log('⏳ usePremiumStatus: Waiting for RevenueCat to be ready...');
                    let attempts = 0;
                    while (!RevenueCatService.isReady() && attempts < 10) {
                        await new Promise(r => setTimeout(r, 500));
                        attempts++;
                    }
                }

                if (RevenueCatService.isReady()) {
                    const info = await RevenueCatService.getCustomerInfo();
                    if (info) {
                        setCustomerInfo(info);
                        setIsPremium(RevenueCatService.hasActiveEntitlement(info));
                    }
                }
            } catch (e) {
                console.error('Error checking premium status:', e);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();

        // Listen for updates
        const listener = Purchases.addCustomerInfoUpdateListener((info) => {
            setCustomerInfo(info);
            setIsPremium(RevenueCatService.hasActiveEntitlement(info));
        });

        return () => {
            // Capacitor listeners are usually removed via the handle
            listener.then((handle: any) => {
                if (handle && typeof handle.remove === 'function') {
                    handle.remove();
                }
            }).catch(() => { });
        };
    }, [userId]);

    return { isPremium, loading, customerInfo };
};
