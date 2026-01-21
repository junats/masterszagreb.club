import { supabase } from '../lib/supabaseClient';
import { User, SubscriptionTier } from '../types';
import { Preferences } from '@capacitor/preferences';

// Mock Data Storage Key
const MOCK_STORAGE_KEY = 'truetrack_mock_users';
const SESSION_KEY = 'truetrack_session';

// --- MOCK IMPLEMENTATION (Runs if no API Keys) ---
const mockAuthService = {
  async signUp(email: string, password: string, name: string): Promise<{ user: User | null; error: string | null }> {
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
    users.push({ ...newUser, password: password });
    await Preferences.set({ key: MOCK_STORAGE_KEY, value: JSON.stringify(users) });
    await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(newUser) });

    return { user: newUser, error: null };
  },

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    const { value: stored } = await Preferences.get({ key: MOCK_STORAGE_KEY });
    const users = stored ? JSON.parse(stored) : [];
    const normalizedEmail = email.toLowerCase().trim();
    const rawPassword = password;

    let usersList = users;
    if (!Array.isArray(usersList)) {
      console.warn("MockAuth: Users storage was corrupt (not an array). Resetting.");
      usersList = [];
    }

    if (usersList.length === 0) {
      console.log("MockAuth: Empty database. Auto-registering first user.");
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: normalizedEmail || 'admin@example.com', // Fallback if email is empty
        name: 'Admin User',
        tier: SubscriptionTier.PRO
      };
      // Use provided password or default
      const finalPassword = rawPassword || 'password';

      usersList.push({ ...newUser, password: finalPassword });

      await Preferences.set({ key: MOCK_STORAGE_KEY, value: JSON.stringify(usersList) });
      await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(newUser) });

      return { user: newUser, error: null };
    }

    const userExists = usersList.find((u: any) => u.email === normalizedEmail);

    if (!userExists) {
      return { user: null, error: "Email not registered." };
    }

    // Simple mock auth check
    const foundUser = usersList.find((u: any) => u.email === normalizedEmail && u.password === rawPassword);

    if (foundUser) {
      const { password, ...safeUser } = foundUser;
      await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(safeUser) });
      return { user: safeUser, error: null };
    }

    return { user: null, error: "Incorrect password." };
  },

  async signOut(): Promise<void> {
    await Preferences.remove({ key: SESSION_KEY });
  },

  async getUser(): Promise<User | null> {
    const { value: session } = await Preferences.get({ key: SESSION_KEY });
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
  },

  async getSessionFromUrl(url: string) {
    console.log("MockAuth: getSessionFromUrl called with", url);
    return { data: { session: null }, error: "Mock mode does not support deep linking" };
  },

  async inviteCoParent(email: string) {
    console.log(`MockAuth: inviteCoParent called for ${email}`);
    alert(`(Mock Mode) Invite sent to ${email}`);
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
      // HANDLE MISSING SESSION (Email Confirmation Enabled)
      if (!data.session) {
        console.warn("AuthService: SignUp succeeded but NO SESSION. Email verification likely required.");

        // Check if user accidentally tried to sign up again for existing email
        if (data.user.identities && data.user.identities.length === 0) {
          return { user: null, error: "This email is already registered. Try signing in." };
        }

        // Otherwise, it's a true new pending user
        return {
          user: null,
          error: "Success! Please check your email to confirm your account."
        };
      }

      if (data.session) {
        // MANUAL PERSISTENCE BACKUP (SignUp)
        try {
          await Preferences.set({
            key: 'truetrack-backup-session',
            value: JSON.stringify(data.session)
          });
        } catch (e) {
          console.error("AuthService: Failed to save manual backup (SignUp)", e);
        }
      }

      const newUser: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || name,
        tier: SubscriptionTier.FREE
      };
      return { user: newUser, error: null };
    }
    return { user: null, error: "Registration failed. Please try again." };
  },

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    if (!supabase) return { user: null, error: "Database not connected" };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { user: null, error: error.message };

    if (data.user && data.session) {
      // MANUAL PERSISTENCE BACKUP
      try {
        await Preferences.set({
          key: 'truetrack-backup-session',
          value: JSON.stringify(data.session)
        });
      } catch (e) {
        console.error("AuthService: Failed to save manual backup", e);
      }

      // Fetch profile table if it exists, otherwise use metadata
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || 'User',
        tier: (data.user.user_metadata?.tier as SubscriptionTier) || SubscriptionTier.FREE
      };
      return { user, error: null };
    }
    return { user: null, error: "Login failed (No Session)" };
  },

  async signOut(): Promise<void> {
    return supabase.auth.signOut();
  },

  async inviteCoParent(email: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Must be logged in to invite.");

    // 1. Insert into DB (for our tracking)
    const { error: dbError } = await supabase
      .from('coparent_invites')
      .insert({
        invited_email: email,
        invited_by: user.id
      });

    if (dbError) throw dbError;

    // 2. Call Edge Function (sends the actual email)
    const { data: funcData, error: funcError } = await supabase.functions.invoke('send-invite', {
      body: { email }
    });

    if (funcError) {
      console.error("Invite network failed:", funcError);
      throw new Error("Network error sending email. " + (funcError.message || "Unknown"));
    }

    if (funcData && funcData.error) {
      console.error("Invite function logic failed:", funcData);
      throw new Error("Email sending failed: " + funcData.error);
    }
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
    const redirectTo = 'com.truetrack.app://login-callback';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: false, // Force browser (Capacitor)
      }
    });
    if (error) return { user: null, error: error.message };
    return { user: null, error: null }; // OAuth redirects
  },

  async signInWithApple(): Promise<{ user: User | null; error: string | null }> {
    if (!supabase) return { user: null, error: "Database not connected" };
    const redirectTo = 'com.truetrack.app://login-callback';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
        skipBrowserRedirect: false
      }
    });
    if (error) return { user: null, error: error.message };
    return { user: null, error: null }; // OAuth redirects
  },

  async getSessionFromUrl(url: string) {
    if (!supabase) return { data: { session: null }, error: "No Supabase" };

    console.log("AuthService: Processing OAuth Callback URL", url);

    const codeMatch = url.match(/[?&#]code=([^&#]+)/);

    if (codeMatch && codeMatch[1]) {
      console.log("AuthService: Detected PKCE code. Exchanging...");
      const code = codeMatch[1];

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("AuthService: Exchange failed", error);
          return { data: { session: null }, error: error.message };
        }
        if (data.session) {
          console.log("AuthService: Exchange success. Session retrieved.");
          return { data: { session: data.session }, error: null };
        }
      } catch (e: any) {
        console.error("AuthService: Exchange exception", e);
        return { data: { session: null }, error: e.message || "Unknown error" };
      }
    }

    const errorMatch = url.match(/[?&#]error_description=([^&#]+)/) || url.match(/[?&#]error=([^&#]+)/);
    if (errorMatch && errorMatch[1]) {
      const err = decodeURIComponent(errorMatch[1]);
      console.error("AuthService: Provider returned error", err);
      return { data: { session: null }, error: err };
    }

    console.warn("AuthService: No code or error found in URL.");
    return { data: { session: null }, error: "Invalid Callback URL" };
  },

};

// --- DYNAMIC SERVICE PROXY ---
const MOCK_MODE_KEY = 'force_mock_mode';
let cachedService: typeof mockAuthService | null = null;

async function getService(): Promise<typeof mockAuthService> {
  if (cachedService) return cachedService;

  if (!supabase) {
    cachedService = mockAuthService;
    return cachedService;
  }

  try {
    const prefPromise = Preferences.get({ key: MOCK_MODE_KEY });
    const timeoutPromise = new Promise<{ value: string | null }>(resolve => setTimeout(() => resolve({ value: null }), 600));

    const { value } = await Promise.race([prefPromise, timeoutPromise]);

    if (value === 'false') {
      cachedService = realAuthService;
    } else {
      cachedService = mockAuthService;
    }
    return cachedService;
  } catch (e) {
    console.error("AuthService: Failed to check mode preference", e);
    return realAuthService;
  }
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
    return service.getUser();
  },

  async signInWithGoogle() {
    const service = await getService();
    return service.signInWithGoogle();
  },

  async signInWithApple() {
    const service = await getService();
    return service.signInWithApple();
  },

  async getSessionFromUrl(url: string) {
    const service = await getService();
    // @ts-ignore
    if (service.getSessionFromUrl) {
      // @ts-ignore
      return service.getSessionFromUrl(url);
    }
    return { data: { session: null }, error: "Not implemented in current service" };
  },

  async setMockMode(enable: boolean) {
    await Preferences.set({ key: MOCK_MODE_KEY, value: enable ? 'true' : 'false' });
  },

  async isMockMode(): Promise<boolean> {
    const service = await getService();
    return service === mockAuthService;
  },

  async inviteCoParent(email: string) {
    const service = await getService();
    // @ts-ignore
    if (service.inviteCoParent) {
      // @ts-ignore
      return service.inviteCoParent(email);
    }
    console.warn("AuthService: inviteCoParent not implemented in current service mode.");
  },

  async getServiceMode(): Promise<'mock' | 'real'> {
    const service = await getService();
    return service === mockAuthService ? 'mock' : 'real';
  }
};

export const isMockMode = !supabase;