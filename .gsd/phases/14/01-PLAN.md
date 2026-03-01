---
phase: 14
plan: 1
wave: 1
depends_on: []
files_modified: []
autonomous: true
must_haves:
  truths:
    - "Test data is beautifully seeded into the application."
    - "App components look populated and premium."
  artifacts:
    - "Database population script exists and is successfully executed."
---

# Plan 14.1: Test Data Seeding

<objective>
Generate professional, realistic dummy data (receipts, expenses, co-parenting schedules) to ensure the UI components look populated and premium for App Store Screenshots.

Purpose: To provide an appealing and vibrant UI state that accurately reflects the value of TrueTrack out of the box.
Output: A test data script or seeded environment ready for high-resolution capture.
</objective>

<context>
Load for context:
- .gsd/ROADMAP.md
- Supabase seed files or scripts handling dummy data generation.
</context>

<tasks>

<task type="auto">
  <name>Create Data Seeding Script</name>
  <files>supabase/seed.sql or scripts/seed_dummy_data.ts</files>
  <action>
    Develop a script to inject beautiful, realistic dummy data (receipts, expenses, co-parenting schedules) into the local/staging database.
    AVOID: Using clearly fake data like "Test 1", "John Doe". Use realistic, professional-looking details.
  </action>
  <verify>Run the seeding script and confirm it executes without errors.</verify>
  <done>Script execution finishes cleanly, and the database contains the required dummy data records.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Test data is correctly injected into the database.
- [ ] The app frontend displays the data beautifully without breaking layouts.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
