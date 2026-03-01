---
phase: 11
plan: 1
wave: 1
depends_on: []
files_modified: [
  'frontend/src/components/Paywall.tsx'
]
autonomous: true
user_setup: []

must_haves:
  truths: 
    - "The debug link ('System Debug Info') at the bottom of the paywall is removed."
    - "The fallback offerings array hardcodes the €6.99 monthly and €29.99 (with 7-day trial) yearly plans so they are always visible even if RevenueCat is slow to load."
  artifacts: 
    - "frontend/src/components/Paywall.tsx updated"
---

# Plan 11.1: Paywall UI Polish (Hide Debug, Fix Fallback Pricing)

<objective>
Refine the `Paywall.tsx` component to remove the exposed debug link and ensure that the fall-back pricing UI explicitly shows the selectable €6.99 Monthly and €29.99 Yearly plans with the 7-day trial if RevenueCat takes time to or fails to load.

Purpose: Improve user trust by showing consistent and accurate pricing options, and remove developer debug tools from the production UI.
Output: Modified `Paywall.tsx` with a robust fallback offerings array and the debug UI removed.
</objective>

<context>
Load for context:
- frontend/src/components/Paywall.tsx
</context>

<tasks>

<task type="auto">
  <name>Remove Debug Link</name>
  <files>frontend/src/components/Paywall.tsx</files>
  <action>
    Locate the "System Debug Info" button at the bottom of the fallback view (around line 254-260).
    Remove this button entirely to prevent users from accidentally triggering the debug overlay in production.
  </action>
  <verify>npm run build</verify>
  <done>Debug link is no longer present in the DOM.</done>
</task>

<task type="auto">
  <name>Fix Fallback Pricing Cards</name>
  <files>frontend/src/components/Paywall.tsx</files>
  <action>
    Currently, when `offerings.length === 0`, it shows a simple text `€6.99/mo` block instead of the selectable cards.
    Instead of rendering a different UI shape, we should populate `offerings` with a default array of mocked `PurchasesPackage` objects if the fetch fails or while loading, OR we can just hardcode the UI to render the two selectable cards natively if `offerings.length === 0`.
    Given the current code, it's safer to just change the `offerings.length === 0` fallback UI to look exactly like the mapped `offerings` UI but with static text for:
    - Monthly: €6.99
    - Yearly: €29.99 (SAVE 28%) + 7-Day Free Trial
    
    Update the JSX in the `else` block of `offerings.length > 0` to render these two mock cards. Make sure clicking them sets a mock selected package so the UI logic holds (e.g., `setSelectedPackage({ identifier: 'mock_annual' } as any)`).

    AVOID: Breaking the real `offerings.map` logic. Only change the static fallback.
  </action>
  <verify>npm run build</verify>
  <done>Fallback UI displays selectable €6.99 monthly and €29.99 yearly plans.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Debug link is gone.
- [ ] Fallback UI explicitly shows the €6.99 and €29.99 plans with trial copy.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
