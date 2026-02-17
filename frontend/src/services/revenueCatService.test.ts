/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RevenueCatService } from './revenueCatService';
import { Purchases } from '@revenuecat/purchases-capacitor';

// Mock import.meta.env
beforeEach(() => {
    vi.stubEnv('VITE_REVENUECAT_APPLE_KEY', 'apple_test_key');
    vi.stubEnv('VITE_REVENUECAT_GOOGLE_KEY', 'google_test_key');
});

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: vi.fn(() => 'ios'),
    }
}));

// Mock dependencies that cause issues in Node
vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        }
    }
}));

vi.mock('./authService', () => ({
    isMockMode: false,
    authService: {
        getUser: vi.fn(),
    }
}));

vi.mock('@common/types', () => ({
    SubscriptionTier: { PRO: 'pro', FREE: 'free' }
}));

vi.mock('@revenuecat/purchases-capacitor', () => ({
    Purchases: {
        configure: vi.fn(),
        setLogLevel: vi.fn(),
        getOfferings: vi.fn(),
        purchasePackage: vi.fn(),
        getCustomerInfo: vi.fn(),
        restorePurchases: vi.fn(),
    },
    LOG_LEVEL: {
        DEBUG: 0,
    }
}));

describe('RevenueCatService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize correctly', async () => {
        await RevenueCatService.initialize('test-user');
        expect(Purchases.configure).toHaveBeenCalledWith(expect.objectContaining({
            appUserID: 'test-user',
        }));
    });

    it('should fetch offerings', async () => {
        const mockOfferings = {
            current: {
                availablePackages: [{ identifier: 'test-pkg' }]
            }
        };
        vi.mocked(Purchases.getOfferings).mockResolvedValue(mockOfferings as any);

        const packages = await RevenueCatService.getOfferings();
        expect(packages).toHaveLength(1);
        expect(packages[0].identifier).toBe('test-pkg');
    });

    it('should return empty array if no offerings found', async () => {
        vi.mocked(Purchases.getOfferings).mockResolvedValue({ current: null } as any);
        const packages = await RevenueCatService.getOfferings();
        expect(packages).toHaveLength(0);
    });
});
