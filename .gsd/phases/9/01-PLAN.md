---
phase: 9
plan: 1
wave: 1
depends_on: []
files_modified: ["js/matrix-events.js"]
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Dates entered as DD.MM.YYYY in Google Sheets render correctly in the event panel"
    - "Demo event dates still render correctly"
  artifacts:
    - "js/matrix-events.js parses DD.MM.YYYY format before passing to Date constructor"
---

# Plan 9.1: Fix DD.MM.YYYY Date Parsing

## Objective
Fix the `formatDate` method in `MatrixEventManager` to correctly parse dates entered in the Google Sheets format `DD.MM.YYYY` (e.g. `06.02.2026`).

Purpose: `new Date('06.02.2026')` is unpredictable across browsers — it may return Invalid Date or misinterpret day/month. The fix must manually split the dot-separated string and construct the Date correctly.

Output: Updated `js/matrix-events.js` with robust DD.MM.YYYY parsing.

## Context
- .gsd/SPEC.md
- js/matrix-events.js

## Tasks

<task type="auto">
  <name>Update formatDate to parse DD.MM.YYYY input</name>
  <files>js/matrix-events.js</files>
  <action>
    Modify the `formatDate(dateString)` method to:
    1. First check if `dateString` matches the pattern `DD.MM.YYYY` (digits separated by dots).
    2. If it matches, split on `.`, extract day/month/year, and construct `new Date(year, month - 1, day)`.
    3. If it does NOT match, fall through to the existing `new Date(dateString)` path for backward compatibility with ISO dates like `2025-12-28`.
    4. Keep the `en-GB` locale and existing options for formatting.
    AVOID: Using a regex that is too strict — the sheet may occasionally have single-digit days/months (e.g. `6.2.2026`).
    AVOID: Removing the fallback `new Date(dateString)` path, as the demo events use ISO format `YYYY-MM-DD`.
  </action>
  <verify>Open browser dev tools, trigger the matrix events panel, and confirm dates display correctly in European format (e.g. "FRI, 6 FEB 2026" or similar en-GB output).</verify>
  <done>DD.MM.YYYY dates from Google Sheets parse correctly. ISO dates from demo events still work. No NaN or "Invalid Date" in the UI.</done>
</task>

## Success Criteria
- [ ] `06.02.2026` renders as a valid February 6th date in European format
- [ ] Demo events with ISO dates (`2025-12-28`) still render correctly
- [ ] No console errors related to date parsing
