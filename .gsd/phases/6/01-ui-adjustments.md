---
phase: 6
plan: 1
wave: 1
depends_on: []
files_modified: ['style.css', 'morph-menu.css']
autonomous: true

must_haves:
  truths:
    - "Central SVG logo scales down appropriately on screens <768px without horizontal overflow."
    - "Event pane maximizes visual space on mobile (using vh rather than hard heights)."
    - "Morph menu button avoids iOS/Android rounded corner safe-areas."
  artifacts: []
---

# Plan 6.1: Mobile UI & Layout Adjustments

<objective>
Optimize the CSS layout for screens under 768px.
Purpose: Ensure the premium nightclub feel is preserved on smartphones, text remains legible, and the interface fits modern device safe-areas.
Output: Updated media queries in standard CSS files.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- style.css
- morph-menu.css
</context>

<tasks>

<task type="auto">
  <name>Scale Central Elements</name>
  <files>style.css</files>
  <action>
    In the `@media (max-width: 768px)` block:
    1. Target `#svgLogo` and set `width: 80vw`, `max-width: 250px` to prevent overflow.
    2. Change `.matrix-container.active` height to `70vh` instead of the hardcoded `300px`.
    3. Add `touch-action: pan-y;` to `.event-messages` to guarantee smooth native scrolling on iOS.
    
    AVOID: Using `vh` for 100% height wrappers, as it causes jumps on mobile browsers when the address bar hides. (Using 70vh for a sub-container is fine).
  </action>
  <verify>grep_search checking for `70vh` inside style.css</verify>
  <done>CSS rules applied without breaking desktop scaling.</done>
</task>

<task type="auto">
  <name>Adjust Morph Button Safe-Areas</name>
  <files>morph-menu.css</files>
  <action>
    In the `@media (max-width: 768px)` block:
    Move `.morph-menu-btn` slightly further inward.
    Update `top: 25px; right: 25px;` (instead of 20px) to ensure no conflict with phone bezel curves.
  </action>
  <verify>grep_search checking for `top: 25px;` inside morph-menu.css under the media query.</verify>
  <done>Mobile padding increased.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Central SVG logo scales down appropriately on screens <768px
- [ ] Event pane uses 70vh
- [ ] Safe areas respected on the Morph Button
- [ ] `touch-action: pan-y` is applied to events container
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
