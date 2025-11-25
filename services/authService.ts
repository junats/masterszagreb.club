import { supabase } from '../lib/supabaseClient';
import { User, SubscriptionTier } from '../types';

// Mock Data Storage Key
const MOCK_STORAGE_KEY = 'truetrack_mock_users';

export const isMockMode = !supabase;

// --- MOCK IMPLEMENTATION (Runs if no API Keys) ---
const mockAuthService = {
  async signUp(email: string, password: string, name: string): Promise<{ user: User | null; error: string | null }> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network

    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    const users = stored ? JSON.parse(stored) : [];

    if (users.find((u: any) => u.email === email)) {
      return { user: null, error: "User already exists" };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      tier: SubscriptionTier.FREE
    };

    // Save "Password" (In reality, we just check existence in mock)
    users.push({ ...newUser, password });
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem('truetrack_session', JSON.stringify(newUser));

    return { user: newUser, error: null };
  },

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    const users = stored ? JSON.parse(stored) : [];

    // Simple mock auth check
    const foundUser = users.find((u: any) => u.email === email && u.password === password);

    if (foundUser) {
      const { password, ...safeUser } = foundUser;
      localStorage.setItem('truetrack_session', JSON.stringify(safeUser));
      return { user: safeUser, error: null };
    }

    return { user: null, error: "Invalid email or password" };
  },

  async signOut(): Promise<void> {
    localStorage.removeItem('truetrack_session');
  },

  async getUser(): Promise<User | null> {
    const session = localStorage.getItem('truetrack_session');
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
    localStorage.setItem('truetrack_session', JSON.stringify(mockUser));
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
    localStorage.setItem('truetrack_session', JSON.stringify(mockUser));
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
export const authService = supabase ? realAuthService : mockAuthService;