---
phase: 8
plan: 1
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/PaywallModal.tsx
  - frontend/src/hooks/usePremiumStatus.ts
autonomous: false
user_setup:
  - service: revenuecat
    why: "Product configuration for new pricing and trial"
    dashboard_config:
      - task: "Ensure Monthly product is set to €6.99/mo (existing)"
        location: "RevenueCat Dashboard -> Products"
      - task: "Create Annual product (€29.99/yr with 7-day free trial)"
        location: "App Store Connect & RevenueCat Dashboard"
      - task: "Update Annual product to €29.99/yr with 7-day free trial"
        location: "RevenueCat Dashboard -> Products"

must_haves:
  truths:
    - "Paywall displays two plans: €6.99/mo and €29.99/yr"
    - "Annual plan is selected by default"
    - "7-day free trial is prominently displayed for the annual plan"
  artifacts:
    - "PaywallModal.tsx updated for dual-plan selection"
---

# Plan 8.1: Subscriptions and Paywall

<objective>
Update paywall UI for dual-plan selection (Monthly/Annual) and display the new pricing and trial terms. 

Purpose: Increase conversion with an annual plan default and a 7-day risk-free trial.
Output: Dual-plan modal UI and configured RevenueCat products.
</objective>

<context>
Load for context:
- .gsd/SPEC_SUBSCRIPTION.md
- frontend/src/components/PaywallModal.tsx
- frontend/src/hooks/usePremiumStatus.ts
</context>

<tasks>

<task type="checkpoint:human-action">
  <name>Configure RevenueCat Products</name>
  <action>
    1. In App Store Connect -> TrueTrack -> Subscriptions -> Subscription Group: Add a new Annual product (e.g., `truetrack_annual_2999`). 
    2. Set price to €29.99. 
    3. Add Introductory Offer -> Free Trial -> 7 Days.
    4. In RevenueCat Dashboard -> Products -> New: import the `truetrack_annual_2999` product.
    5. In RevenueCat -> Entitlements -> Premium: Attach the new Annual product to the Premium entitlement.
  </action>
  <verify>RevenueCat dashboard shows new prices and trial for Annual.</verify>
  <done>RevenueCat packages are correctly configured.</done>
</task>

<task type="auto">
  <name>Update Paywall UI</name>
  <files>frontend/src/components/PaywallModal.tsx</files>
  <action>
    Modify the modal to display both Monthly and Annual packages side-by-side or stacked.
    Pre-select the Annual package. 
    Highlight the 28% discount and the 7-day free trial for the Annual package.
    Ensure "Subscribe" button triggers the purchase for the selected package.
  </action>
  <verify>npm run build passes without type errors.</verify>
  <done>User can choose between two plans in the paywall.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] RevenueCat products are updated and fetched in the UI
- [ ] Paywall shows 2 plans with Annual defaulted
- [ ] Annual shows 7-day trial
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
