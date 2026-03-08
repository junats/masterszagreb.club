---
phase: 8
plan: 1
wave: 1
depends_on: []
files_modified: ["js/matrix-events.js"]
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Event dates are presented in Europe format (day, month, year)"
  artifacts:
    - "js/matrix-events.js applies the en-GB or equivalent date locale"
---

# Plan 8.1: Europe Date Format

<objective>
Update the date formatting in the matrix events display to utilize the European standard (Day, Month, Year).

Purpose: Present dates to users in the familiar European format as requested.
Output: Updated js/matrix-events.js file.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- js/matrix-events.js
</context>

<tasks>

<task type="auto">
  <name>Update locale formatting to European standard</name>
  <files>js/matrix-events.js</files>
  <action>
    Modify `formatDate` function inside `MatrixEventManager`.
    Change the locale string in `date.toLocaleDateString('en-US', options)` to `'en-GB'`.
    AVOID: modifying the `options` object explicitly to swap day and month, as simply changing the locale from `en-US` to `en-GB` organically produces the correct D/M/Y ordering.
  </action>
  <verify>grep -q "'en-GB'" js/matrix-events.js</verify>
  <done>matrix-events.js successfully utilizes a European locale for format strings</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Event dates are presented in Europe format (day, month, year)
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
