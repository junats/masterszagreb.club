import { supabase } from '../lib/supabaseClient';
import { User, SubscriptionTier } from '../types';
import { Preferences } from '@capacitor/preferences';

// Mock Data Storage Key
// Mock Data Storage Key
const MOCK_STORAGE_KEY = 'truetrack_mock_users';
const SESSION_KEY = 'truetrack_session';

// --- MOCK IMPLEMENTATION (Runs if no API Keys) ---
const mockAuthService = {
  async signUp(email: string, password: string, name: string): Promise<{ user: User | null; error: string | null }> {
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Removed delay

    const { value: stored } = await Preferences.get({ key: MOCK_STORAGE_KEY });
    const users = stored ? JSON.parse(stored) : [];
    const normalizedEmail = email.toLowerCase().trim();

    if (users.find((u: any) => u.email === normalizedEmail)) {
      return { user: null, error: "User already exists" };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      email: normalizedEmail,
      name,
      tier: SubscriptionTier.FREE
    };

    // Save "Password" (In reality, we just check existence in mock)
    users.push({ ...newUser, password: password.trim() });
    await Preferences.set({ key: MOCK_STORAGE_KEY, value: JSON.stringify(users) });
    await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(newUser) });

    return { user: newUser, error: null };
  },

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Removed delay

    const { value: stored } = await Preferences.get({ key: MOCK_STORAGE_KEY });
    const users = stored ? JSON.parse(stored) : [];
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPassword = password.trim(); // Fix for mobile auto-spacing

    console.log(`MockAuth: Attempting sign in for '${normalizedEmail}'`);

    let usersList = users;
    if (!Array.isArray(usersList)) {
      console.warn("MockAuth: Users storage was corrupt (not an array). Resetting.");
      usersList = [];
    }

    console.log(`MockAuth: Stored users count: ${usersList.length}`);

    if (usersList.length === 0) {
      console.log("MockAuth: Empty database. Auto-registering first user.");
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: normalizedEmail || 'admin@example.com', // Fallback if email is empty
        name: 'Admin User',
        tier: SubscriptionTier.PRO
      };
      // Use provided password or default
      const finalPassword = normalizedPassword || 'password';

      usersList.push({ ...newUser, password: finalPassword });

      await Preferences.set({ key: MOCK_STORAGE_KEY, value: JSON.stringify(usersList) });
      await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(newUser) });

      console.log("MockAuth: Auto-registration successful.");
      return { user: newUser, error: null };
    }

    // Debug: Log available emails
    const userExists = usersList.find((u: any) => u.email === normalizedEmail);

    if (!userExists) {
      console.log('MockAuth: Email not found in database.');
      return { user: null, error: "Email not registered." };
    }

    console.log(`MockAuth: Checking password for ${normalizedEmail}`);
    console.log(`MockAuth: Input password length: ${normalizedPassword.length}`);
    console.log(`MockAuth: Stored password length: ${userExists.password.length}`);
    // console.log(`MockAuth: Input: '${normalizedPassword}', Stored: '${userExists.password}'`); // Uncomment if desperate

    // Simple mock auth check
    // Note: We compare against trimmed password now
    const foundUser = usersList.find((u: any) => u.email === normalizedEmail && u.password === normalizedPassword);

    if (foundUser) {
      const { password, ...safeUser } = foundUser;
      await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(safeUser) });
      return { user: safeUser, error: null };
    }

    console.log('MockAuth: Password incorrect.');
    return { user: null, error: "Incorrect password." };
  },

  async signOut(): Promise<void> {
    await Preferences.remove({ key: SESSION_KEY });
  },

  async getUser(): Promise<User | null> {
    console.log('MockAuth: getUser called');
    const { value: session } = await Preferences.get({ key: SESSION_KEY });
    console.log('MockAuth: getUser session found:', !!session);
    return session ? JSON.parse(session) : null;
  },

  async getCurrentSession(): Promise<User | null> {
    return this.getUser();
  },

  async signInWithGoogle(): Promise<{ user: User | null; error: string | null }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: User = {
      id: `user_google_${Date.now()}`,
      email: 'mock.google@example.com',
      name: 'Mock Google User',
      tier: SubscriptionTier.FREE
    };
    await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(mockUser) });
    return { user: mockUser, error: null };
  },

  async signInWithApple(): Promise<{ user: User | null; error: string | null }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: User = {
      id: `user_apple_${Date.now()}`,
      email: 'mock.apple@example.com',
      name: 'Mock Apple User',
      tier: SubscriptionTier.FREE
    };
    await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(mockUser) });
    return { user: mockUser, error: null };
  }
};

// --- REAL SUPABASE IMPLEMENTATION ---
const realAuthService = {
  async signUp(email: string, password: string, name: string): Promise<{ user: User | null; error: string | null }> {
    if (!supabase) return { user: null, error: "Database not connected" };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, tier: 'Free' }
      }
    });

    if (error) return { user: null, error: error.message };

    if (data.user) {
      const newUser: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || name,
        tier: SubscriptionTier.FREE
      };
      return { user: newUser, error: null };
    }
    return { user: null, error: "Unknown error" };
  },

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    if (!supabase) return { user: null, error: "Database not connected" };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { user: null, error: error.message };

    if (data.user) {
      // Fetch profile table if it exists, otherwise use metadata
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || 'User',
        tier: (data.user.user_metadata?.tier as SubscriptionTier) || SubscriptionTier.FREE
      };
      return { user, error: null };
    }
    return { user: null, error: "Login failed" };
  },

  async signOut(): Promise<void> {
    if (supabase) await supabase.auth.signOut();
  },

  async getUser(): Promise<User | null> {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || 'User',
        tier: (user.user_metadata?.tier as SubscriptionTier) || SubscriptionTier.FREE
      };
    }
    return null;
  },

  async getCurrentSession(): Promise<User | null> {
    return this.getUser();
  },

  async signInWithGoogle(): Promise<{ user: User | null; error: string | null }> {
    if (!supabase) return { user: null, error: "Database not connected" };
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) return { user: null, error: error.message };
    return { user: null, error: null }; // OAuth redirects, so no immediate user
  },

  async signInWithApple(): Promise<{ user: User | null; error: string | null }> {
    if (!supabase) return { user: null, error: "Database not connected" };
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) return { user: null, error: error.message };
    return { user: null, error: null }; // OAuth redirects
  }
};

// --- DYNAMIC SERVICE PROXY ---
const MOCK_MODE_KEY = 'force_mock_mode';

async function getService(): Promise<typeof mockAuthService> {
  // 1. Check if Supabase is even available
  if (!supabase) return mockAuthService;

  // 2. Check Preference for forced mock mode
  try {
    const { value } = await Preferences.get({ key: MOCK_MODE_KEY });
    if (value === 'true') return mockAuthService;
  } catch (e) {
    console.error("AuthService: Failed to check mode preference", e);
  }

  // 3. Default to Real if Supabase exists and no forced mock
  return realAuthService;
}

export const authService = {
  async signUp(email: string, password: string, name: string) {
    const service = await getService();
    return service.signUp(email, password, name);
  },

  async signIn(email: string, password: string) {
    const service = await getService();
    return service.signIn(email, password);
  },

  async signOut() {
    const service = await getService();
    return service.signOut();
  },

  async getUser() {
    const service = await getService();
    return service.getUser();
  },

  async getCurrentSession() {
    const service = await getService();
    return service.getUser(); // Both impls use getUser/getCurrentSession interchangeably now
  },

  async signInWithGoogle() {
    const service = await getService();
    return service.signInWithGoogle();
  },

  async signInWithApple() {
    const service = await getService();
    return service.signInWithApple();
  },

  // Helper to toggle mode
  async setMockMode(enable: boolean) {
    await Preferences.set({ key: MOCK_MODE_KEY, value: enable ? 'true' : 'false' });
  },

  async isMockMode(): Promise<boolean> {
    const service = await getService();
    return service === mockAuthService;
  }
};

// Export a helper to check mode synchronously (best guess) or async
export const isMockMode = !supabase; // Default fallback, but use authService.isMockMode() for accuracy