# Specification: Subscription Model & Paywall Updates

Status: FINALIZED

## 1. Executive Summary
Update the TrueTrack subscription model to better align with target market purchasing power while optimizing API costs and feature gating. This involves adjusting pricing, introducing a free trial, tiering the AI models based on subscription status, tightening free usage limits, and moving high-value features behind the paywall.

## 2. Problem Statement
- **Pricing Misalignment:** Need to adjust the pricing model.
- **Cost Inefficiency:** Serving all requests with Gemini Pro is expensive for free users.
- **Conversion Friction:** A lack of a free trial and generous free limits (4/day, 10/week) reduce the urgency to upgrade.
- **Value Proposition:** The most valuable feature (Legal PDF Export) is currently freely available, removing a major monetization lever.

## 3. Requirements

### 3.1 Subscriptions & Pricing
- Update pricing to €6.99/mo and €29.99/yr.
- Add a 7-day free trial exclusively to the Annual plan.
- Update the paywall modal to be a dual-plan selector, with the Annual plan pre-selected by default.

### 3.2 Feature Gating & Limits
- **Legal Export:** Gate the PDF Legal Export feature behind the Premium subscription constraint.
- **Usage Limits:** Decrease free tier message limits from 4/day and 10/week to 3/day and 7/week.

### 3.3 AI Model Routing
- Implement dynamic model routing for AI requests.
- **Free Users:** Route to `gemini-flash` for 80% cost reduction.
- **Premium Users:** Maintain access to the superior `gemini-pro` model.

## 4. Implementation Strategy
1. **RevenueCat Configuration:** Update RevenueCat products to reflect new pricing and add the 7-day trial to the annual product.
2. **Paywall UI Update:** Redesign the paywall modal to support dual plans, highlighting the annual discount and free trial.
3. **Usage Limits Logic:** Update the `chatProcessing` or `limitWatcher` utility to enforce the 3/day and 7/week limits.
4. **AI Routing:** Update the central AI integration utility to select the specific Gemini model string based on the user's `isPremium` status.
5. **Feature Gating:** Wrap the PDF Legal Export button/action with premium checks and trigger the paywall modal if unauthorized.

## 5. Verification Plan
- **Mock/Sandbox Payments:** Verify displaying the new prices and purchasing the trial works.
- **Model Check:** Check API payload to verify `gemini-flash` is called for free users and `gemini-pro` for Pro users.
- **Limit Test:** Simulate >3 daily interactions and confirm paywall triggers.
- **Export Test:** Verify free users hit a paywall on trying to export PDF.
