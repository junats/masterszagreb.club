---
phase: 8
plan: 2
wave: 2
depends_on: ["8.1"]
files_modified:
  - frontend/src/services/aiService.ts
  - frontend/src/components/Dashboard.tsx
autonomous: true

must_haves:
  truths:
    - "Free tier uses gemini-flash model"
    - "Premium tier uses gemini-pro model"
    - "Free limits set to 3 per day and 7 per week"
  artifacts:
    - "aiService routes models conditionally"
---

# Plan 8.2: Route AI Models and Update Usage Limits

<objective>
Implement dynamic model routing based on subscription status and adjust free tier usage limits.

Purpose: Optimize API costs by using a cheaper model for free users while incentivizing Pro with the superior model. Tighter limits hook the user but fast-track conversion.
Output: Conditional model routing in `aiService.ts` and updated limit checks.
</objective>

<context>
Load for context:
- .gsd/SPEC_SUBSCRIPTION.md
- frontend/src/services/aiService.ts
- frontend/src/components/Dashboard.tsx
- frontend/src/hooks/usePremiumStatus.ts
</context>

<tasks>

<task type="auto">
  <name>Dynamic Route Models</name>
  <files>frontend/src/services/aiService.ts</files>
  <action>
    Update the AI generation logic. Pass `isPremium` down to the service or fetch it within the service.
    Conditionally use the "gemini-1.5-flash" model (or currently configured flash equivalent) for free users.
    Use "gemini-1.5-pro" (or currently configured pro equivalent) for premium users.
  </action>
  <verify>npm run build passes.</verify>
  <done>Model string is dynamically selected based on `isPremium`.</done>
</task>

<task type="auto">
  <name>Update Usage Limits</name>
  <files>frontend/src/components/Dashboard.tsx</files>
  <action>
    Locate the usage limits logic (currently likely 4/day, 10/week).
    Change the daily limit to 3.
    Change the weekly limit to 7.
    Ensure that exceeding these limits correctly triggers the Paywall modal.
  </action>
  <verify>npm run build passes.</verify>
  <done>Limits updated to 3/day and 7/week.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] AI Service calls correct model based on premium status
- [ ] Limits are 3 daily, 7 weekly
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
