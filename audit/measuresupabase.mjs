#!/usr/bin/env node
/**
 * Simple Supabase latency measurement script.
 * It uses a dynamic import() so it works even if Node initially treats the file as CJS.
 * Make sure you have a .env file with SUPABASE_URL and SUPABASE_ANON_KEY.
 */

(async () => {
  // Load env vars (dotenv will automatically read .env if it exists)
  // If you already have a .env, you may skip installing dotenv.
  try {
    await import('dotenv/config');
  } catch (_) {
    // dotenv is optional – if not installed, Node will just use process.env as is.
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY – edit .env with your real values.');
    process.exit(1);
  }

  // Dynamically import the Supabase client (works in both ESM & CJS contexts)
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(supabaseUrl, supabaseKey);

  /** Helper – measure elapsed ms for an async function */
  async function measure(label, fn) {
    const start = Date.now();
    await fn();
    const end = Date.now();
    console.log(`${label}: ${end - start} ms`);
  }

  // Two simple queries (adjust table names if they differ in your schema)
  await measure('fetch receipts (limit 10)', async () => {
    await supabase.from('receipts').select('*').limit(10);
  });

  await measure('fetch user profile', async () => {
    await supabase.from('users').select('*').single();
  });
})();
