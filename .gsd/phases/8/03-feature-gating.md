---
phase: 8
plan: 3
wave: 3
depends_on: ["8.2"]
files_modified:
  - frontend/src/components/LegalExportSettings.tsx
  - frontend/src/components/ExportModal.tsx
autonomous: true

must_haves:
  truths:
    - "Legal Export feature is fully gated behind the Premium subscription"
    - "Non-premium users are prompted with the Paywall when trying to use it"
  artifacts:
    - "Premium checks added to the export buttons"
---

# Plan 8.3: Feature Gating for Legal Export

<objective>
Gate the PDF Legal Export feature behind the Premium subscription constraint.

Purpose: Legal Export is the core differentiator and outcome-driven feature; gating it provides the strongest monetization lever.
Output: Paywall triggers inserted into the export flow.
</objective>

<context>
Load for context:
- .gsd/SPEC_SUBSCRIPTION.md
- frontend/src/components/LegalExportSettings.tsx
- frontend/src/components/ExportModal.tsx
- frontend/src/hooks/usePremiumStatus.ts
</context>

<tasks>

<task type="auto">
  <name>Gate Legal Export UI</name>
  <files>frontend/src/components/LegalExportSettings.tsx, frontend/src/components/ExportModal.tsx</files>
  <action>
    Identify where the "Export PDF", "Legal Export", or "Generate Report" buttons are.
    Import `usePremiumStatus`.
    If `isPremium` is false, clicking these buttons should NOT trigger the export. 
    Instead, it should open the Paywall modal, preventing the generation of the PDF.
  </action>
  <verify>npm run build passes without errors.</verify>
  <done>Trying to export without premium triggers the Paywall.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Export triggers the Paywall for free users
- [ ] Export works normally for premium users
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
