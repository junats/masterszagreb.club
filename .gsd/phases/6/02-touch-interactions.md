---
phase: 6
plan: 2
wave: 1
depends_on: []
files_modified: ['js/bg-effect.js']
autonomous: true

must_haves:
  truths:
    - "ThreeJS displacement reacts to touch events on mobile, OR degrades gracefully."
  artifacts: []
---

# Plan 6.2: Touch Interaction Compatibility

<objective>
Ensure the complex Javascript interactions (specifically the Background Effect distortion) perform correctly when users tap or drag fingers on the screen, rather than relying strictly on mouse hovers.
Purpose: `mousemove` doesn't exist natively on mobile without translation, causing the background to feel dead compared to desktop.
Output: Touch listeners added to the BackgroundEffect class.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- js/bg-effect.js
</context>

<tasks>

<task type="auto">
  <name>Implement Touch Listeners for WebGL Background</name>
  <files>js/bg-effect.js</files>
  <action>
    Locate the `addEventListeners()` method in the `BackgroundEffect` class.
    Currently it limits interaction to `mousemove`. 
    1. Add a `touchmove` listener alongside it.
    2. In the touch handler, capture `e.touches[0].clientX` and `clientY` to calculate the normalized device coordinates (exactly like the mouse handler).
    3. Ensure `event.preventDefault()` is NOT called if it blocks page scrolling, but since the canvas is fixed underneath, it might just need passive listening.
    
    AVOID: Binding touch events globally to the window without `{ passive: true }` as it impacts mobile scrolling performance.
  </action>
  <verify>grep_search for `touchmove` in `js/bg-effect.js`</verify>
  <done>The ThreeJS canvas reacts to finger drags on mobile devices.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `touchmove` event listener is successfully registered in `js/bg-effect.js`.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
