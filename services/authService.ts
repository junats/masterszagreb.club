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
    console.log(`MockAuth: Stored users count: ${users.length}`);

    if (users.length === 0) {
      return { user: null, error: "No registered users found. Please sign up first." };
    }

    // Debug: Log available emails
    const userExists = users.find((u: any) => u.email === normalizedEmail);

    if (!userExists) {
      console.log('MockAuth: Email not found in database.');
      return { user: null, error: "Email not registered." };
    }

    // Simple mock auth check
    // Note: We compare against trimmed password now
    const foundUser = users.find((u: any) => u.email === normalizedEmail && u.password === normalizedPassword);

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

// Export the correct service based on configuration
const isForceMock = typeof window !== 'undefined' && localStorage.getItem('force_mock_mode') === 'true';
export const authService = (supabase && !isForceMock) ? realAuthService : mockAuthService;
export const isMockMode = !supabase || isForceMock;