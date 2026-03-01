---
phase: 4
plan: 1
wave: 1
depends_on: []
files_modified: ["frontend/src/components/ReceiptScanner.tsx"]
autonomous: true
must_haves:
  truths:
    - "Review Scan modal uses glassmorphism matching app design system"
    - "Modal background uses backdrop-blur and semi-transparent bg instead of opaque #1C1C1E"
    - "Input fields use frosted glass styling"
    - "Item cards use glass effect with subtle borders"
---

# Plan 4.1: Review Scan Modal — Glass Effect Redesign

<objective>
Transform the "Review Scan" modal from its current opaque iOS-style sheet into a premium glassmorphism design that matches the rest of TrueTrack's dark glass aesthetic.

Purpose: Visual consistency — the scan review is one of the most-used screens and currently looks like a different app compared to the rest of the polished UI.
Output: Updated modal styling in ReceiptScanner.tsx
</objective>

<context>
Load for context:
- frontend/src/components/ReceiptScanner.tsx (lines 720-900)
- frontend/tailwind.config.js (color tokens: background, surface, surfaceHighlight, primary)
</context>

<tasks>

<task type="auto">
  <name>Apply Glassmorphism to Review Scan Modal</name>
  <files>frontend/src/components/ReceiptScanner.tsx</files>
  <action>
    Target the Review Modal section starting at the `createPortal` block (~line 720).

    1. **Modal container** (line ~724): Replace `bg-secondarySystemBackground dark:bg-[#1C1C1E]` with `bg-slate-900/80 backdrop-blur-2xl`. Keep rounded corners and overflow hidden.

    2. **Drag handle bar** (line ~727): Replace `bg-secondarySystemBackground dark:bg-[#1C1C1E]` with `bg-transparent`.

    3. **Header** (line ~732): Replace `bg-secondarySystemBackground dark:bg-[#1C1C1E]` with `bg-white/5 backdrop-blur-md`. Update border to `border-white/10`.

    4. **Input fields** (lines ~757, ~766, ~780): Replace `bg-black/40 border border-white/10` with `bg-white/5 border border-white/10 backdrop-blur-sm`. Add subtle focus glow: `focus:ring-1 focus:ring-primary/50`.

    5. **Item cards** (line ~795): Replace `bg-white/5` with `bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] transition-all duration-200`.

    6. **Footer** (line ~887): Replace `bg-surfaceHighlight/50` with `bg-white/5 backdrop-blur-md border-white/10`.

    7. **Save button** (line ~890): Keep the emerald gradient but add `shadow-lg shadow-emerald-500/30` for more pop.

    AVOID: Changing any logic, state, or translations. Only touch className strings.
    AVOID: Using `bg-surface` or any opaque background — everything must be semi-transparent.
  </action>
  <verify>Build succeeds with `npm run build` in frontend directory</verify>
  <done>Modal has glass effect with backdrop blur throughout, matching app design system</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Modal background is translucent with visible blur
- [ ] All input fields have glass styling
- [ ] Item cards have subtle glass hover effects
- [ ] Save button has prominent shadow glow
</verification>
