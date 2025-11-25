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

let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase client initialized.");
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
  }
} else {
  console.log("Supabase credentials missing. App will run in Mock Mode.");
}

export { supabase };