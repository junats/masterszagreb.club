# TrueTrack Roadmap

## Current Milestone: Local AI Workflow

### Phase 1: Core Setup ✅
- [x] Install Ollama
- [x] Create `fix.sh` script
- [x] Create `debate.py` script
- [x] Create `gentest.py` script
- [x] Create `autofix.py` script
- [x] Create `setup_aliases.sh`

### Phase 2: Documentation ✅
- [x] Update README with GSD + Local AI docs
- [x] Create ORCHESTRATION.md guide
- [x] Create `/orchestrate` workflow

### Phase 3: Testing Setup ✅
- [x] Configure Vitest in vite.config.ts
- [x] Add test script to package.json
- [x] Resolve React duplicate package issue (Migrated to npm workspaces)
- [x] Verify test generation works end-to-end

### Phase 4: Integration ✅
- [x] Test full agentic loop (debate → fix → gentest → autofix)
- [x] Document lessons learned

### Phase 5: Dashboard Polish ✅
- [x] Fix Co-Parenting "Daily" tab data (Timezone/ISO logic)
- [x] Fix Co-Parenting "Weekly" tab data
- [x] Fix Dashboard Pull-to-Refresh sensitivity (accidental skeleton triggers)
- [x] Verify all dashboard tabs populate correctly

### Phase 6: RevenueCat Integration ✅
- [x] Configure RevenueCat Dashboard & Projects
- [x] Install SDK (`@revenuecat/purchases-capacitor`)
- [x] Implement `usePremiumStatus` hook
- [x] Build Paywall UI
- [x] Verify Sandbox Payments
- [x] Connect App Store Products & Entitlements

### Phase 7: App Store Submission ✅
- [x] Generate App Store Assets (Screenshots, Acc Delete)
- [x] Create Privacy Policy
- [x] Configure App Store Connect (Pricing, Availability)
- [x] Submit for Review

### Phase 8: Subscription Model Updates
*Goal: Implement new pricing strategy (€6.99/mo, €29.99/yr), add an annual free trial, gate features, and optimize AI models to drive revenue.*

- [x] **8.1 Configure Subscriptions and Paywall**
  - Implement dual-plan UI in `Paywall.tsx`.
  - Provide guidance on updating App Store Connect and RevenueCat.
- [x] **8.2 Route AI Models and Update Usage Limits**
  - Conditionally trigger `gemini-1.5-flash` or `gemini-1.5-pro` based on subscription tier.
  - Tweak free tier constraints to 3/day and 7/week.
- [x] **8.3 Feature Gating for Legal Export**
  - Block free users from exporting PDF reports.

### Phase 9: Parental Control Gating
*Goal: Restrict the 18+ content filtering (parental controls) to Pro users to increase conversion from families.*

- [x] **9.1 Gate Parental Control Toggle**
  - Update `Settings.tsx` so the `ageRestricted` toggle triggers the paywall for free users.

### Phase 10: Expanded Pro Feature Gating
*Goal: Turn off various features by default and restrict them to Pro users to increase conversion value.*

- [x] **10.1 Gate Help, Goals, Habits, and Snapshots**
  - Ensure Parental Control, Help & Support, Goals, Habits, and Financial Snapshots default to `false`.
  - Update UI components to trigger the Paywall when a free user attempts to access or enable these features.

### Phase 11: Paywall UI Polish
*Goal: Remove debug artifacts and ensure seamless fallback pricing display.*

- [x] **11.1 Paywall UI Polish (Hide Debug, Fix Fallback Pricing)**
  - Remove "System Debug Info" from `Paywall.tsx`.
  - Ensure the fallback UI renders dual selectable cards for Monthly and Yearly plans (with 7-day trial) when offerings are not yet loaded.

### Phase 12: Paywall Formatting & Pro Toggle Hardening
*Goal: Localize pricing, ensure Yearly benefit visibility, and force inactive features off.*

- [x] **12.1 Paywall Format & Toggles**
  - Use European comma format for prices (`€6,99`).
  - Ensure the Yearly benefit is presented clearly on the paywall even if the SDK only syncs the Monthly tier.
  - Automatically force Pro-locked toggles in `Settings.tsx` to `false` when a user's subscription evaluates to `false`.

### Phase 13: iPad Optimization ✅
*Goal: Optimize the app interface for iPad ensuring the design utilizes the wider screen space following existing design guidelines.*

- [x] **13.1 Update App Global Layout**
  - Ensure Capacitor is configured for native iPad support.
  - Implement max-width constraints or responsive grids for main views.
- [x] **13.2 Dashboard Responsive Grid**
  - Convert single-column vertical lists to 2 or 3 columns on `md` and `lg` screens.
- [x] **13.3 Modals and Navigation**
  - Constrain modal widths so they don't stretch edge-to-edge on large screens.
  - Adapt navigation (e.g. bottom bar) for tablet proportions if needed.

### Phase 14: App Store Screenshot Production ✅
*Goal: Generate professional, high-resolution screenshots for iPhone and iPad using perfect dummy data for App Store listing.*

- [x] **14.1 Test Data Seeding**
  - Create and inject beautiful, realistic dummy data (receipts, expenses, co-parenting schedules).
  - Ensure UI components look populated and premium.
- [x] **14.2 High-Resolution Capture**
  - Use browser subagent to render app in exact Apple Viewports (6.7" iPhone and 12.9" iPad).
  - Capture pixel-perfect visual states of the Dashboard, Scanner, and other key screens.
- [x] **14.3 Export & Handoff**
  - Provide raw UI captures for Figma composition with marketing copy.

### Phase 15: Final Security Audit ✅
*Goal: Ensure the application is secure for production release by auditing database permissions, package dependencies, and exposed secrets.*

- [x] **15.1 Dependency Vulnerability Check**
  - Run `npm audit` across workspaces.
- [x] **15.2 Supabase RLS Policy Review**
  - Verify Row Level Security is enabled and correctly configured for all tables.
- [x] **15.3 Secrets & Environment Variable Check**
### Phase 16: App Store Marketing Assets ✅
*Goal: Transform raw device captures into professional, high-converting App Store marketing compositions with styling, fonts, and device frames.*

- [x] **16.1 Design Composition Setup**
  - Initialize an HTML/CSS canvas template to mount and style the App Store compositions.
- [x] **16.2 Generate Framed Screenshots**
  - Add device mockups (iPhone/iPad) framing the raw captured screenshots.
- [x] **16.3 Graphics & Typography**
  - Add background gradients, premium lighting effects, and descriptive marketing text (e.g., "Effortless Expense Tracking").

### Phase 17: App Store Assets Redesign (Iteration 2)
*Goal: Generate high-converting marketing assets natively using the Pencil MCP server. Emphasize deep 3D composition, left-aligned typography, and targeted messaging for iPhone (simplicity) and iPad (power).*

- [x] **17.1 Asset Generation (iPhone)**
  - Use Pencil to generate 5 screenshot compositions for iPhone following the 6-step formula (excluding social proof for now).
- [x] **17.2 Asset Generation (iPad)**
  - Use Pencil to generate 4 screenshot compositions for iPad emphasizing workspace and split-view power.
- [x] **17.3 Export & Review**
  - Export the `.pen` canvasses to PNG format suitable for App Store Connect.

### Phase 18: Co-Parenting Visualization Details
*Goal: Enhance the Co-Parenting dashboard widget by adding detailed modal popups when clicking on the Grid, Orbital, or DNA compact visualizations.*

- [x] **18.1 Co-Parenting Detailed Visuals Modal**
  - Create the `CoParentingVisualsModal` component.
  - Update `CoParentingWidget` to manage modal state and trigger clicks.
  - Add associated translation keys for the modals.

### Phase 19: Receipt View Optimization
*Goal: Optimize the vertical space in the receipt details view by moving stats to the header and fixing back button spacing.*

- [ ] **19.1 Optimize Receipt Data Layout**
  - Move categories list and child indicators directly beneath the date.
  - Remove large Stats Row.
  - Add bottom padding to the Back button.
