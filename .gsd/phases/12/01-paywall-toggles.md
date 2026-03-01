---
phase: 12
plan: 1
wave: 1
depends_on: []
files_modified: [
  'frontend/src/components/Paywall.tsx',
  'frontend/src/contexts/DataContext.tsx'
]
autonomous: true
user_setup: []

must_haves:
  truths: 
    - "Paywall prices always display with a comma (e.g., 6,99) instead of a period."
    - "The Yearly plan is visibly presented on the Paywall, even if RevenueCat fails to return one in the offerings array."
    - "Pro-locked settings (Goals, Snapshots, Help, Parental Control) are forced to `false` in state if the user is not a Pro subscriber."
  artifacts: 
    - "frontend/src/components/Paywall.tsx updated"
    - "frontend/src/contexts/DataContext.tsx updated"
---

# Plan 12.1: Paywall Polish & Pro Toggle Hardening

<objective>
Fix the formatting of the pricing on the paywall to use European number formats (comma for decimals), ensure the Yearly plan fallback is always visible if RevenueCat misses it, and add state hardening to `DataContext.tsx` to force Pro toggles to `false` if the user's subscription is inactive.

Purpose: Localize the payment display, guarantee the upsell visibility, and prevent edge cases where free users retain Pro toggles due to lingering local storage states.
Output: Modified `Paywall.tsx` and `DataContext.tsx`.
</objective>

<context>
Load for context:
- frontend/src/components/Paywall.tsx
- frontend/src/contexts/DataContext.tsx
</context>

<tasks>

<task type="auto">
  <name>Format Pricing & Ensure Yearly Visibility</name>
  <files>frontend/src/components/Paywall.tsx</files>
  <action>
    - In `Paywall.tsx`, update the fallback UI strings from `6.99` and `29.99` to `6,99` and `29,99`.
    - In the `offerings.map` loop, format the RevenueCat string: `pkg.product.priceString.replace('.', ',')`.
    - To guarantee the Yearly benefit is seen, check if the loaded `offerings` array contains an annual package (`offerings.some(pkg => pkg.packageType === 'ANNUAL' || pkg.identifier.toLowerCase().includes('annual'))`). If it does NOT, but `offerings.length > 0`, explicitly render the Mock Annual Package JSX below the mapped offerings so the user still has a visual CTA for the Yearly trial.
  </action>
  <verify>npm run build</verify>
  <done>Pricing displays with commas, and a Yearly option is always present on screen.</done>
</task>

<task type="auto">
  <name>Force Pro Toggles Off for Free Users</name>
  <files>frontend/src/contexts/DataContext.tsx</files>
  <action>
    In `DataContext.tsx`, locate the `useEffect` that listens to `isPremium` (around line 181).
    Add logic: `if (isPremium === false) { setGoalsEnabled(false); setFinancialSnapshotEnabled(false); setHelpEnabled(false); setAgeRestricted(false); }`.
    This ensures that even if `Preferences.get` loads a `true` state from a previous trial, the app actively reverts them to `false` when the active subscription check fails.
  </action>
  <verify>npm run build</verify>
  <done>Pro toggles are forced to false when isPremium evaluates to false.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Prices show commas (6,99 euro).
- [ ] Yearly plan is visible.
- [ ] DataContext enforces `false` state for un-subscribed users.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
