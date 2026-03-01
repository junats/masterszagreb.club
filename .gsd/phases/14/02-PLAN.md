---
phase: 14
plan: 2
wave: 2
depends_on: [ "14.1" ]
files_modified: []
autonomous: true
must_haves:
  truths:
    - "App is rendered in Apple Viewports (iPhone and iPad)."
    - "High-resolution screenshots are captured for App Store."
  artifacts:
    - "Screenshot files exist."
---

# Plan 14.2: High-Resolution Capture

<objective>
Capture pixel-perfect visual states of key screens (Dashboard, Scanner, Settings) in exact Apple Viewports (6.7" iPhone and 12.9" iPad) using the browser subagent, after injecting the premium dummy data scenario.

Purpose: To acquire raw marketing assets for the App Store.
Output: High resolution screenshot files.
</objective>

<context>
Load for context:
- .gsd/ROADMAP.md
- scripts/seed_dummy_data.ts
</context>

<tasks>

<task type="auto">
  <name>Start Dev Server & Capture Screenhots via Browser Subagent</name>
  <files>None</files>
  <action>
    Start the Vite development server on port 5173.
    Use the browser subagent to visit localhost:5173, inject the `appstore` seed data via developer console, and take full-page screenshots for an iPhone layout and an iPad layout.
  </action>
  <verify>Screenshot files exist in the project directory or artifacts.</verify>
  <done>Clean screenshots are safely stored and verified visually if possible.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Screenshots are high resolution and free of errors.
- [ ] The layouts correctly use the iPad and iPhone responsive designs.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
