import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, SubscriptionTier } from '@common/types'; // Adjust path if needed
import { authService, isMockMode } from '../services/authService';
import { RevenueCatService } from '../services/revenueCatService';
import { supabase } from '../lib/supabaseClient';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app'; // Added for Depp Links

// Update ~/Projects/TrueTrack/frontend/src/contexts/UserContext.tsx
// In UserContext.tsx, add this function to the provider:

interface UserContextType {
    user: User | null;
    isAuthLoading: boolean;
    setUser: (user: User | null) => void;
    signIn: (user: User) => void;
    updateUser: (updates: Partial<User>) => Promise<void>;
    signOut: () => Promise<void>;
    upgradeToPro: () => void;
    showDevBanner: boolean;
    setShowDevBanner: (show: boolean) => void;
    isMockMode: boolean;
    generateDummyData: () => void; // This line should already be there
}




const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [showDevBanner, setShowDevBanner] = useState(false);

    // Initial Auth Check
    useEffect(() => {
        // Safety timeout - If initAuth hangs for more than 10 seconds, force clear and show login
        const safetyTimeout = setTimeout(async () => {
            console.warn("UserContext: Auth Timed Out (10s). FORCE CLEARING SESSION and Entry.");

            // Force clear potentially stuck session
            await Preferences.remove({ key: 'truetrack_session' });
            await Preferences.remove({ key: 'truetrack-backup-session' });
            await supabase?.auth.signOut(); // Best effort signout

            setIsAuthLoading(false);
            try {
                await SplashScreen.hide();
            } catch (e) { }
        }, 10000); // Increased to 10s to give more time

        const initAuth = async () => {
            console.log('UserContext: initAuth starting...');
            try {
                if (supabase) {
                    // 1. Check Supabase Session Integrity FIRST
                    const { data: { session }, error } = await supabase.auth.getSession();
                    console.log('UserContext: Supabase Session:', session?.user?.id, error);

                    if (error || !session) {
                        console.log("UserContext: No active session. Checking manual backup...");

                        // RETRY: Try to restore from manual backup
                        const { value: backupJson } = await Preferences.get({ key: 'truetrack-backup-session' });
                        if (backupJson) {
                            console.log("UserContext: Found backup session. Restoring...");
                            const { data: { session: restoredSession }, error: restoreError } = await supabase.auth.setSession(JSON.parse(backupJson));

                            if (restoredSession && !restoreError) {
                                console.log("UserContext: Manual restore SUCCESS.");
                                // Proceed to get user...
                                const currentUser = await authService.getUser();
                                if (currentUser) {
                                    setUser(currentUser);
                                    setIsAuthLoading(false);
                                    await SplashScreen.hide();
                                    clearTimeout(safetyTimeout); // Clear timeout on success
                                    return;
                                }
                            } else {
                                console.warn("UserContext: Manual restore failed:", restoreError);
                                await Preferences.remove({ key: 'truetrack-backup-session' }); // Bad backup
                            }
                        }

                        // Only clear if explicitly error'd out (e.g. refresh token invalid)
                        if (error) {
                            console.warn("UserContext: Session error. Clearing local state.", error);
                            await Preferences.remove({ key: 'truetrack_session' });
                            await Preferences.remove({ key: 'truetrack-backup-session' });
                            setUser(null);
                        }

                        setIsAuthLoading(false);
                        await SplashScreen.hide();
                        clearTimeout(safetyTimeout); // Clear timeout even if no session
                        return;
                    }

                    // 2. If valid session, get full user profile
                    const currentUser = await authService.getUser();
                    console.log('UserContext: initAuth currentUser:', currentUser);
                    if (currentUser) {
                        setUser(currentUser);
                        // Initialize RevenueCat
                        RevenueCatService.initialize(currentUser.id);
                    } else {
                        // Session exists but no profile? Weird, but safe to logout.
                        console.warn("UserContext: Session valid but no profile found.");
                        setUser(null);
                    }
                } else {
                    // NO SUPABASE - Assume Mock or just check authService
                    console.log("UserContext: Supabase is null. Checking authService (Mock?)");
                    const currentUser = await authService.getUser();
                    if (currentUser) setUser(currentUser);
                    else setUser(null);
                }
            } catch (e) {
                console.error('UserContext: initAuth error:', e);
                setUser(null);
            } finally {
                setIsAuthLoading(false);
                console.log('UserContext: initAuth finished');
                clearTimeout(safetyTimeout); // Always clear timeout when initAuth completes
                try { await SplashScreen.hide(); } catch (e) { }
            }
        };
        initAuth();

        // 3. LISTEN FOR DYNAMIC CHANGES (Only if Supabase exists)
        let subscription: any = null;
        if (supabase) {
            const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log(`UserContext: Auth Event: ${event}`);
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    // Refresh user profile
                    const u = await authService.getUser();
                    if (u) {
                        setUser(u);
                        // Initialize RevenueCat
                        RevenueCatService.initialize(u.id);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            });
            subscription = data.subscription;
        }

        // 4. DEEP LINK LISTENER (OAuth Callback & Email Confirmation)
        const appListener = App.addListener('appUrlOpen', async (data) => {
            console.log('UserContext: App opened with URL:', data.url);

            // Check if it's our login callback or an auth-related URL
            const isAuthFlow = data.url.includes('login-callback') ||
                data.url.includes('access_token=') ||
                data.url.includes('code=') ||
                data.url.includes('type=signup');

            if (isAuthFlow) {
                console.log('UserContext: Detected auth callback. Initiating FAIL-SAFE sequence...');

                // FAIL-SAFE: If nothing happens in 4 seconds, BLINDLY RELOAD.
                // This handles cases where the session might have arrived but state didn't update.
                const failSafe = setTimeout(() => {
                    console.warn("UserContext: 4s Fail-safe timer hit. FORCING RELOAD.");
                    window.location.reload();
                }, 4000);

                try {
                    // 1. Try manual exchange (some patterns need explicit handling)
                    await authService.getSessionFromUrl(data.url);

                    // 2. Poll for session (Supabase SDK takes time to persist/notify)
                    for (let i = 0; i < 8; i++) {
                        console.log(`UserContext: Session Check Attempt ${i + 1}/8...`);
                        const { data: { session } } = await supabase!.auth.getSession();

                        if (session?.user) {
                            console.log("UserContext: Session FOUND! Setting user and RELOADING...");
                            clearTimeout(failSafe);
                            await Preferences.set({ key: 'truetrack-backup-session', value: JSON.stringify(session) });

                            // Get full user and set it before reload for smoother transition
                            const u = await authService.getUser();
                            if (u) {
                                setUser(u);
                                // Initialize RevenueCat
                                RevenueCatService.initialize(u.id);
                            }

                            window.location.reload();
                            return;
                        }
                        await new Promise(r => setTimeout(r, 500)); // Poll every 500ms
                    }
                } catch (e) {
                    console.warn(`UserContext: Deep link processing failed:`, e);
                }
            }
        });

        // Cleanup subscription
        return () => {
            if (subscription) subscription.unsubscribe();
            appListener.then(handle => handle.remove()).catch(() => App.removeAllListeners());
            clearTimeout(safetyTimeout);
        };
    }, []);



    const updateUser = async (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);

        try {
            await Preferences.set({ key: 'truetrack_session', value: JSON.stringify(updatedUser) });

            // Update Mock Users if applicable
            const { value: storedUsersStr } = await Preferences.get({ key: 'truetrack_mock_users' });
            if (storedUsersStr) {
                let storedUsers = JSON.parse(storedUsersStr);
                if (Array.isArray(storedUsers)) {
                    const userIndex = storedUsers.findIndex((u: User) => u.id === user.id);
                    if (userIndex >= 0) {
                        storedUsers[userIndex] = { ...storedUsers[userIndex], ...updates };
                        await Preferences.set({ key: 'truetrack_mock_users', value: JSON.stringify(storedUsers) });
                    }
                }
            }
        } catch (e) {
            console.error("Failed to persist user update", e);
        }
    };

    const signOut = async () => {
        try {
            await authService.signOut();
        } catch (e) {
            console.error("SignOut service error (ignoring):", e);
        }

        // Set flag to prevent auto-login loop immediately after signing out
        await Preferences.set({ key: 'manual_logout_at', value: Date.now().toString() });

        // Force clear all local persistence
        await Preferences.remove({ key: 'truetrack_session' });
        await Preferences.remove({ key: 'truetrack-backup-session' });

        setUser(null);
    };

    const signIn = (user: User) => {
        console.log("UserContext: signIn called for", user.email);
        setUser(user);
        // Initialize RevenueCat
        RevenueCatService.initialize(user.id);
    };

    const upgradeToPro = () => {
        if (user) {
            updateUser({ tier: SubscriptionTier.PRO });
        }
    };

    const generateDummyData = () => {
        console.log("Generating dummy data...");
        // Add your dummy data generation logic here
    };

    return (
        <UserContext.Provider value={{
            user,
            isAuthLoading,
            setUser,
            signIn,
            updateUser,
            signOut,
            upgradeToPro,
            showDevBanner,
            setShowDevBanner,
            isMockMode,
            generateDummyData
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
