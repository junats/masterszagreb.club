import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, SubscriptionTier } from '../types'; // Adjust path if needed
import { authService, isMockMode } from '../services/authService';
import { supabase } from '../lib/supabaseClient';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app'; // Added for Depp Links

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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [showDevBanner, setShowDevBanner] = useState(false);

    // Initial Auth Check
    useEffect(() => {
        const initAuth = async () => {
            console.log('UserContext: initAuth starting...');
            try {
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
                    return;
                }

                // 2. If valid session, get full user profile
                const currentUser = await authService.getUser();
                console.log('UserContext: initAuth currentUser:', currentUser);
                if (currentUser) {
                    setUser(currentUser);
                } else {
                    // Session exists but no profile? Weird, but safe to logout.
                    console.warn("UserContext: Session valid but no profile found.");
                    setUser(null);
                }
            } catch (e) {
                console.error('UserContext: initAuth error:', e);
                setUser(null);
            } finally {
                setIsAuthLoading(false);
                console.log('UserContext: initAuth finished');
                await SplashScreen.hide();
            }
        };
        initAuth();

        // 3. LISTEN FOR DYNAMIC CHANGES
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`UserContext: Auth Event: ${event}`);
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // Refresh user profile
                const u = await authService.getUser();
                if (u) setUser(u);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        // 4. DEEP LINK LISTENER (OAuth Callback)
        // 4. DEEP LINK LISTENER (OAuth Callback)
        App.addListener('appUrlOpen', async (data) => {
            console.log('UserContext: App opened with URL:', data.url);

            // Check if it's our login callback
            if (data.url.includes('login-callback')) {
                console.log('UserContext: Detected login callback. Initiating FAIL-SAFE sequence...');

                // FAIL-SAFE: If nothing happens in 4 seconds, BLINDLY RELOAD.
                // The user confirmed that "restarting" fixes the issue.
                // This timer guarantees that "restart" happens automatically.
                setTimeout(() => {
                    console.warn("UserContext: 4s Fail-safe timer hit. FORCING RELOAD.");
                    window.location.reload();
                }, 4000);

                // 1. Try manual exchange first (non-blocking)
                authService.getSessionFromUrl(data.url).catch(console.error);

                // 2. Poll for session (Supabase SDK takes time to persist/notify)
                // Validation loop: Check 10 times with 1s delay (10s window)
                // We wrap getSession in a timeout so the loop doesn't freeze.
                for (let i = 0; i < 10; i++) {
                    console.log(`UserContext: Session Check Attempt ${i + 1}/10...`);

                    try {
                        // Race against a 2s timeout
                        const checkPromise = supabase.auth.getSession();
                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));

                        const { data } = await Promise.race([checkPromise, timeoutPromise]) as any;

                        if (data?.session?.user) {
                            console.log("UserContext: Session FOUND! Setting user and RELOADING...");
                            await Preferences.set({ key: 'truetrack-backup-session', value: JSON.stringify(data.session) });
                            window.location.reload(); // Immediate reload on success
                            break;
                        }
                    } catch (e) {
                        console.warn(`UserContext: Attempt ${i + 1} failed/timed-out:`, e);
                    }

                    // Wait 1s before retry
                    if (i < 9) await new Promise(r => setTimeout(r, 1000));
                }
            }
        });


        // Safety timeout - IF Supabase hangs completely, we must eventually let the user in.
        const safetyTimeout = setTimeout(async () => {
            console.warn("UserContext: Auth Timed Out. Forcing Entry.");
            setIsAuthLoading(false);
            try {
                await SplashScreen.hide();
            } catch (e) {
                // Ignore splash screen errors
            }
        }, 8000);

        // Cleanup subscription
        return () => {
            subscription.unsubscribe();
            App.removeAllListeners();
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

        // Force clear all local persistence
        await Preferences.remove({ key: 'truetrack_session' });
        await Preferences.remove({ key: 'truetrack-backup-session' });

        setUser(null);
    };

    const signIn = (user: User) => {
        setUser(user);
    };

    const upgradeToPro = () => {
        if (user) {
            updateUser({ tier: SubscriptionTier.PRO });
            alert("Upgraded to Pro (Mock)!");
        }
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
            isMockMode
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
