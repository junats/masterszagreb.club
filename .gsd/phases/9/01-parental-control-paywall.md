---
phase: 9
plan: 1
wave: 1
depends_on: []
files_modified: ['frontend/src/components/Settings.tsx']
autonomous: true
user_setup: []

must_haves:
  truths: 
    - "Free users cannot enable the '18+ Items (Show/Hide)' toggle."
    - "Clicking the toggle as a Free user opens the subscription Paywall."
  artifacts: 
    - "frontend/src/components/Settings.tsx updated"
---

# Plan 9.1: Gate Parental Control Toggle

<objective>
Restrict the "18+ Items (Show/Hide)" toggle to Pro users.

Purpose: Increase conversion from families who want explicit item filtering by placing this crucial feature behind the paywall.
Output: Modified `Settings.tsx` to intercept the toggle action.
</objective>

<context>
Load for context:
- frontend/src/components/Settings.tsx
</context>

<tasks>

<task type="auto">
  <name>Add isProMode check to ageRestricted toggle</name>
  <files>frontend/src/components/Settings.tsx</files>
  <action>
    Locate the `onChange` handler for the `ageRestricted` input checkbox.
    Update the `onChange` to check `isProMode`. If `!isProMode`, call `e.preventDefault()`, set `setShowPaywall(true)`, and `return`. 
    Only if they are Pro should `setAgeRestricted(e.target.checked)` be called.
    
    If helpful, add a distinctive visual cue (e.g., `<Crown size={14} className="text-purple-400 inline ml-2" />`) to the "18+ Items" label to indicate it's a premium feature.

    AVOID: Altering the initial state loading of `ageRestricted` which might be saved in preferences. Only block changing the state.
  </action>
  <verify>npm run build</verify>
  <done>Free users cannot toggle the setting and are prompted with the paywall.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Free users cannot enable the toggle.
- [ ] Paywall modal opens when free users click the toggle.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
