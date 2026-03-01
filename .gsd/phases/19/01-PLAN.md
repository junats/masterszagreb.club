---
phase: 19
plan: 1
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/HistoryView.tsx
autonomous: true

must_haves:
  truths:
    - "Receipt details view has all categories and child indicators directly beneath the date"
    - "Receipt stats row (Total, Pie Chart, Categories count) is removed/optimized to save space"
    - "Back button has sufficient bottom spacing so it doesn't overlap with the modal content"
  artifacts:
    - "frontend/src/components/HistoryView.tsx is updated with the new layout"
---

# Plan 19.1: Optimize Receipt History View Layout

<objective>
Optimize the receipt details view in `HistoryView.tsx` to save vertical space. The user wants the categories and child indicators moved directly beneath the year/month/day and to ensure the back button has bottom spacing.

Purpose: Improve mobile UX by making the receipt view more compact and easier to read without scrolling past large stat blocks for every single receipt.
Output: A cleaner, more space-efficient detailed receipt view.
</objective>

<context>
Load for context:
- .gsd/ROADMAP.md
- frontend/src/components/HistoryView.tsx
</context>

<tasks>

<task type="auto">
  <name>Optimize Receipt Data Layout and Back Button Spacing</name>
  <files>frontend/src/components/HistoryView.tsx</files>
  <action>
    - In `HistoryView.tsx`, locate the "Row 1 — Store Name + Date" section.
    - Move the Categories count badge and the Child percentage badge into the flex container right beneath the date string.
    - Move the "Total" display to the right side of the "Row 1" header (using flex-between).
    - Delete the entire "Row 2 — Stats Row" which previously took up significant vertical space.
    - Increase the `pt-12` padding on the main scrollable container to `pt-16` or `pt-20` to guarantee the absolute-positioned Back button has enough bottom spacing before the receipt card starts.
    AVOID: Breaking the Share and Delete actions. Keep them in "Row 3" (now Row 2).
  </action>
  <verify>npm run typecheck passes in frontend directory.</verify>
  <done>Layout matches user requirements: categories and child indicators are beneath the date, and the back button has bottom spacing.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] UI compactness in browser/preview
- [ ] Back button does not overlap receipt card
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
