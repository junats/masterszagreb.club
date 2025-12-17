import { createClient } from '@supabase/supabase-js';

// Robust helper to get env vars without crashing in different runtimes
const getEnv = (key: string): string | undefined => {
  try {
    // Check if process is defined (Node/Webpack environments)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    // Fallback for Vite environments if process is missing
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    console.warn(`Error accessing environment variable ${key}`, e);
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

import { Preferences } from '@capacitor/preferences';

let supabase: any = null;

// STORAGE SWITCH: Using localStorage to avoid Capacitor Bridge deadlocks on iOS.
const LocalStorageAdapter = {
  getItem: (key: string): string | null => {
    const val = localStorage.getItem(key);

    return val;
  },
  setItem: (key: string, value: string): void => {

    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  }
};

// DEADLOCK FIX: iOS WebKit 'navigator.locks' is broken. We MUST disable it.
if (typeof navigator !== 'undefined' && typeof window !== 'undefined') {
  try {
    // @ts-ignore
    const nav = navigator;
    // Define a dummy lock manager that just runs the callback immediately
    const safeLocks = {
      request: async (name: string, ...args: any[]) => {
        const fn = args[args.length - 1];
        return fn();
      },
      query: async () => ({ held: [], pending: [] })
    };

    Object.defineProperty(nav, 'locks', {
      value: safeLocks,
      configurable: true
    });
    console.log("Supabase Client: navigator.locks has been neutralized.");
  } catch (e) {
    console.warn("Supabase Client: Failed to neutralize navigator.locks", e);
  }
}

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: LocalStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storageKey: 'truetrack-auth-token',
        flowType: 'pkce',
        // lock option removed - we rely on global fix
      },
      global: {
        fetch: async (url, options) => {
          const u = url.toString();
          const endpoint = u.substring(u.lastIndexOf('/') + 1, u.indexOf('?') > -1 ? u.indexOf('?') : u.length);

          try {
            const res = await fetch(url, options);

            // HACK: Capture session if SDK hangs
            if (endpoint === 'token' && res.ok) {
              try {
                const clone = res.clone();
                const data = await clone.json();
                if (data.access_token) {
                  // @ts-ignore
                  window.SUPABASE_HACK_SESSION = data;
                }
              } catch (e) { /* ignore */ }
            }

            return res;
          } catch (e: any) {
            throw e;
          }
        }
      }
    });
    console.log("Supabase client initialized with CapacitorStorage (Explicit Key).");
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
  }
} else {
  console.log("Supabase credentials missing. App will run in Mock Mode.");
}

export { supabase };