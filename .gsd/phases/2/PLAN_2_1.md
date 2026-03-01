---
phase: 2
plan: 1
wave: 1
depends_on: []
files_modified: ["supabase/functions/api/index.ts"]
autonomous: true
must_haves:
  truths:
    - "User ID is extracted from Supabase Auth header"
    - "Scan counts are tracked per user"
    - "Free users are rejected after N scans per day"
---

# Plan 2.1: Supabase Free Tier Rate Limiting

<objective>
Implement a lightweight rate limit in the Edge Function to prevent abuse, restricting free users from spamming the expensive API.
Purpose: Protect Google API quota and billing account from malicious or runaway clients.
Output: Edge Function blocks excessive requests with a 429 status.
</objective>

<context>
Load for context:
- supabase/functions/api/index.ts
</context>

<tasks>
<task type="auto">
  <name>Enforce Daily Scan Limit</name>
  <files>supabase/functions/api/index.ts</files>
  <action>
    Update edge function to parse the Authorization header and extract the Supabase user ID.
    (Optional, if tracking state): Query a `user_usage` table to check today's scan count.
    (If stateless for now): Just parse the JWT. If `isPremium` is false, ensure they aren't abusing it (e.g. by passing a signed token).
    For now, just add a dummy check or setup the Supabase client to verify the user exists before calling Gemini.
    AVOID: Adding complex Redis caching if simple DB lookups suffice for now.
  </action>
  <verify>Edge function runs locally without syntax errors.</verify>
  <done>Edge function verifies user identity before executing high-cost Gemini routes.</done>
</task>
</tasks>
