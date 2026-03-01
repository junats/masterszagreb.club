---
phase: 18
plan: 1
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/dashboard/CoParentingVisualsModal.tsx
  - frontend/src/components/dashboard/CoParentingWidget.tsx
  - frontend/src/i18n/en.json
autonomous: true

must_haves:
  truths:
    - "Clicking the Grid, Orbital, or DNA visualizations on the Co-Parenting widget opens a detailed modal popup."
    - "The detailed modal shows an expanded, high-quality rendering of the selected visualization type with relevant stats."
  artifacts:
    - "frontend/src/components/dashboard/CoParentingVisualsModal.tsx exists."
---

# Plan 18.1: Co-Parenting Detailed Visuals Modal

<objective>
Enhance the Co-Parenting dashboard widget so that clicking on the compact Grid, Orbital, or DNA visualizations opens a sleek modal with detailed data and an expanded chart.

Purpose: Users need to see more detailed breakdown of their custody days without cluttering the main dashboard widget.
Output: A new modal component, state wiring in the parent widget, and supporting translations.
</objective>

<context>
Load for context:
- frontend/src/components/dashboard/CoParentingWidget.tsx
- frontend/src/components/CoParentingDetailsModal.tsx (for styling reference of modals)
- frontend/src/i18n/en.json
</context>

<tasks>

<task type="auto">
  <name>Create CoParentingVisualsModal component</name>
  <files>frontend/src/components/dashboard/CoParentingVisualsModal.tsx</files>
  <action>
    Create a new React component using `framer-motion` for animations and `createPortal` for rendering, similar to `CoParentingDetailsModal.tsx`.
    Accept props: `isOpen (boolean)`, `onClose (() => void)`, `activeVisual ('grid' | 'orbital' | 'dna' | null)`, `custodyDays (CustodyDay[])`, `monthStats (object)`, and `monthCalendar ((Date | null)[])`.
    Implement a switch statement based on `activeVisual`:
    - 'grid': Render a larger month calendar grid showing custody status per day.
    - 'orbital': Render a larger, animated SVG orbital chart showing the breakdown of Me/Partner/Split days.
    - 'dna': Render an expanded SVG DNA timeline plot showing the custody transitions throughout the month.
    Include a styled close button and a title/subtitle pulled from translations.
    AVOID: Complex new logic for date generation. Pass the calculated `monthStats` and `monthCalendar` from the parent to keep this component purely presentational.
  </action>
  <verify>grep -q "CoParentingVisualsModal" frontend/src/components/dashboard/CoParentingVisualsModal.tsx</verify>
  <done>Component exists and supports the three visualization types.</done>
</task>

<task type="auto">
  <name>Update translations for visual modals</name>
  <files>frontend/src/i18n/en.json</files>
  <action>
    Add new keys under `dashboard.coparenting.visuals`:
    - `gridTitle`: "Custody Grid"
    - `gridDesc`: "Full month view of custody assignments."
    - `orbitalTitle`: "Custody Orbital"
    - `orbitalDesc`: "Proportional breakdown of custody share."
    - `dnaTitle`: "Custody DNA"
    - `dnaDesc`: "Timeline of custody transitions over time."
    (Add these precisely where `dashboard.coparenting` is located).
    AVOID: Modifying other languages for now, just establish the English base.
  </action>
  <verify>jq '.dashboard.coparenting.visuals.gridTitle' frontend/src/i18n/en.json</verify>
  <done>Translation keys exist in en.json.</done>
</task>

<task type="auto">
  <name>Wire up modals in CoParentingWidget</name>
  <files>frontend/src/components/dashboard/CoParentingWidget.tsx</files>
  <action>
    Add state: `const [activeVisual, setActiveVisual] = useState&lt;'grid' | 'orbital' | 'dna' | null&gt;(null);`.
    Update the container divs for Grid, Orbital, and DNA within `CoParentingWidget.tsx` to include `onClick={() => setActiveVisual('type')}`, `cursor-pointer`, and a hover state like `hover:bg-slate-800/50`.
    Mount `<CoParentingVisualsModal />` at the bottom of the component, passing the required props.
    AVOID: Breaking existing insights or general widget layout.
  </action>
  <verify>grep -q "setActiveVisual(" frontend/src/components/dashboard/CoParentingWidget.tsx</verify>
  <done>User can click visuals to trigger state update, and modal is rendered.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Clicking Grid, Orbital, or DNA changes state and opens the modal.
- [ ] Modal correctly displays the expanded view of the selected visual.
- [ ] Modal can be closed.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
