# Specification: RevenueCat Integration

Status: FINALIZED

## 1. Executive Summary
Integrate RevenueCat into TrueTrack to handle cross-platform (iOS/Android) subscriptions and in-app purchases. This integration will provide a robust way to manage user entitlements and synchronize subscription status with our Supabase backend.

## 2. Problem Statement
TrueTrack needs a reliable way to:
1.  Manage premium subscriptions across Apple App Store and Google Play Store.
2.  Validate receipts and track user entitlements without complex server-side implementation.
3.  Synchronize subscription status with Supabase for feature gating in the frontend.

## 3. Requirements

### 3.1 Functional Requirements
- **Entitlement Management:** Users must be able to purchase a "Premium" subscription.
- **Cross-Platform Sync:** Subscriptions purchased on iOS should be available on Android (and vice versa) if the user is logged in.
- **Paywall UI:** Display a premium paywall when a user attempts to access restricted features.
- **Subscription Status:** Frontend must know if the user is currently "Premium".

### 3.2 Technical Constraints
- SDK: `@revenuecat/purchases-capacitor`
- Backend: RevenueCat Webhooks (eventually) to sync with Supabase.
- Localization: Ensure prices are localized via the RevenueCat SDK.

## 4. Implementation Strategy
1.  **Dashboard Setup:** Create project in RevenueCat, configure Apple and Google API keys.
2.  **Product Configuration:** Define "Monthly Premium" and "Yearly Premium" products in RevenueCat.
3.  **SDK Integration:** Install and initialize `@revenuecat/purchases-capacitor`.
4.  **Auth Integration:** Use Supabase `user_id` as the RevenueCat `appUserID`.
5.  **Entitlement Logic:** Create a hook `usePremiumStatus` to check current entitlements.

## 5. Verification Plan
### Automated Tests
- Mock RevenueCat SDK in Vitest to verify `usePremiumStatus` logic.
- Verify initialization logic with unit tests.

### Manual Verification
- Test payment flow in iOS Sandbox.
- Test payment flow in Android Sandbox.
- VerifySupabase user record is updated/gated based on status (if webhook implemented).
