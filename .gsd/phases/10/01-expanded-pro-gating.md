---
phase: 10
plan: 1
wave: 1
depends_on: []
files_modified: [
  'frontend/src/components/Settings.tsx',
  'frontend/src/components/dashboard/GoalBreakdown.tsx'
]
autonomous: true
user_setup: []

must_haves:
  truths: 
    - "Free users cannot enable Goals & Habits, Help & Support, or Financial Snapshots."
    - "Clicking these settings as a Free user opens the subscription Paywall and does not change the state."
    - "These features default to 'off' for all users (or are strictly gated if previously enabled by a free user)."
    - "Parental Control is also confirmed off by default."
  artifacts: 
    - "frontend/src/components/Settings.tsx updated"
    - "frontend/src/components/dashboard/GoalBreakdown.tsx updated"
---

# Plan 10.1: Gate Help, Goals, Habits, and Snapshots

<objective>
Restrict "Help & Support", "Goals & Habits", and "Financial Snapshots" to Pro users, and ensure they (along with Parental Control) default to off.

Purpose: Increase conversion value by placing these advanced features behind the paywall, encouraging power users to subscribe.
Output: Modified `Settings.tsx` and `GoalBreakdown.tsx` to intercept actions and enforce default states.
</objective>

<context>
Load for context:
- frontend/src/components/Settings.tsx
- frontend/src/components/dashboard/GoalBreakdown.tsx
</context>

<tasks>

<task type="auto">
  <name>Gate Features in Settings.tsx</name>
  <files>frontend/src/components/Settings.tsx</files>
  <action>
    1. Check the default state initialization for `ageRestricted` (Parental Control), "Help & Support" (may be `enableSupport` or similar), "Goals & Habits" (if managed here), and "Financial Snapshots" (`enableSnapshots` or similar). Ensure their initial unpersisted defaults are `false`.
    2. For each of these features' UI elements (list items, buttons, or toggles):
       - If it's a toggle: Update the `onChange` handler to check `isProMode`. If `!isProMode`, call `e.preventDefault()`, set `setShowPaywall(true)`, and `return`.
       - If it's a clickable row (like Help & Support): Update the `onClick` handler to check `isProMode`. If `!isProMode`, `setShowPaywall(true)` and `return`.
    3. Add a visual `<Crown size={14} className="text-purple-400" />` to the labels of these features to indicate they are premium.

    AVOID: Silently failing. Always show the paywall so the user knows *why* they can't access it.
  </action>
  <verify>npm run build</verify>
  <done>Settings UI correctly gates the specified features.</done>
</task>

<task type="auto">
  <name>Gate Habits in GoalBreakdown.tsx</name>
  <files>frontend/src/components/dashboard/GoalBreakdown.tsx</files>
  <action>
    Locate the interactive elements related to Habits (e.g., the button mapped to `onHabitsClick` or the container itself).
    Ensure that attempting to interact with or enable Habits relies on `isProMode`. If the user is free, trigger the Paywall (via `setShowSubscriptionModal(true)` which is already present).
    Ensure the state defaults to off/locked for free users.
  </action>
  <verify>npm run build</verify>
  <done>Dashboard Goal/Habits UI correctly gates the feature.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Parental Control, Help, Goals, Habits, and Snapshots default to off.
- [ ] Free users cannot enable or access these features.
- [ ] Paywall modal opens when free users interact with these features.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
