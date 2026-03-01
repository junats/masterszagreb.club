---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Fix Date Logic

## Objective
Fix "Daily" and "Weekly" tabs in Co-Parenting Dashboard by standardizing date comparisons to ignore timezones.

## Context
- .gsd/SPEC.md
- src/components/dashboard/CoParentingWidget.tsx

## Tasks

<task type="auto">
  <name>Create Date Utilities</name>
  <files>src/utils/dateUtils.ts</files>
  <action>
    Create a robust date utility file.
    - Export `getLocalYYYYMMDD(date: Date): string`
    - Should return "2023-10-27" for local time, NOT UTC.
    - Example implementation:
      ```typescript
      export const getLocalYYYYMMDD = (date: Date): string => {
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - (offset * 60 * 1000));
        return local.toISOString().split('T')[0];
      };
      ```
  </action>
  <verify>Check file exists and imports are valid</verify>
  <done>File created with exported function</done>
</task>

<task type="auto">
  <name>Refactor Widget Date Logic</name>
  <files>src/components/dashboard/CoParentingWidget.tsx</files>
  <action>
    Refactor `CoParentingWidget.tsx` to use `getLocalYYYYMMDD`.
    - Import `getLocalYYYYMMDD` from `../../utils/dateUtils`
    - Replace `today.toISOString().split('T')[0]` with `getLocalYYYYMMDD(today)`
    - Update `generateDailyInsights` logic
    - Update `getDayStatus` logic
    - Update weekly view day matching
    - Ensure all comparisons use the clean YYYY-MM-DD string
  </action>
  <verify>Build succeeds</verify>
  <done>Daily/Weekly tabs populate with data</done>
</task>

## Success Criteria
- [ ] Daily tab shows insights for today
- [ ] Weekly tab shows bubbles with correct status
- [ ] No regression in Monthly view
