---
phase: 4
plan: 2
wave: 1
depends_on: []
files_modified: ["frontend/src/components/HistoryView.tsx"]
autonomous: true
must_haves:
  truths:
    - "Receipt detail header is visually larger and more impactful"
    - "Store name is prominently displayed with larger typography"
    - "Date and item count are displayed as secondary info in the header"
    - "Pie chart is larger and more readable"
    - "Share and Delete buttons are clearly visible action buttons"
    - "Total amount is hero-sized"
---

# Plan 4.2: Receipt Detail Header — Premium Impactful Redesign

<objective>
Transform the receipt detail header from a compact single-line layout into a large, impactful hero section with prominent store name, rich metadata, a bigger pie chart, and clear share/delete action buttons.

Purpose: When a user taps a receipt in the list, the detail view should feel important and data-rich — not cramped.
Output: Updated header section in HistoryView.tsx
</objective>

<context>
Load for context:
- frontend/src/components/HistoryView.tsx (lines 324-442)
- frontend/tailwind.config.js (color tokens)
</context>

<tasks>

<task type="auto">
  <name>Redesign Receipt Detail Header</name>
  <files>frontend/src/components/HistoryView.tsx</files>
  <action>
    Target the sticky header section (lines ~324-441).

    Replace the current single-line compact layout with a multi-row hero header:

    **Row 1 — Store Name (hero)**
    - Store name: `text-2xl font-heading font-bold text-white` (was text-lg)
    - Date underneath: `text-sm text-slate-400` showing formatted date
    - Add item count badge: small pill showing "5 items"

    **Row 2 — Stats Row (new)**
    Three equal columns with glassmorphism cards:
    - **Total**: Hero-sized amount (text-3xl) with currency symbol
    - **Child %**: Enlarged pie chart (from 36px to 56px) with percentage label below
    - **Categories**: Count of unique categories with a small icon

    **Row 3 — Action Buttons**
    Replace the tiny 14px icon buttons with proper pill-shaped action buttons:
    - Share button: `bg-primary/15 text-primary px-4 py-2 rounded-xl` with text label "Share"
    - Delete button: `bg-red-500/15 text-red-400 px-4 py-2 rounded-xl` with text label "Delete"
    - Both should have `flex-1` to space evenly

    **Container styling:**
    - Use `bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5`
    - Keep the gradient top bar
    - Add more vertical padding (p-5 instead of p-3)

    AVOID: Changing any logic for the pie chart SVG calculation — only change its width/height attributes and container sizing.
    AVOID: Removing or renaming any existing event handlers (handleShare, handleDelete).
    AVOID: Touching anything outside the sticky header section.
  </action>
  <verify>Build succeeds with `npm run build` in frontend directory</verify>
  <done>Header is visually larger with prominent store name, rich stats row, and clear action buttons</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Store name is large and prominent (text-2xl)
- [ ] Date is visible below store name
- [ ] Pie chart is larger (56px)
- [ ] Total amount is hero-sized (text-3xl)
- [ ] Share and Delete are proper pill buttons with labels
- [ ] Glass effect applied to header container
</verification>
