# Privacy Policy for TrueTrack

**Last Updated:** February 17, 2026

## 1. Introduction

TrueTrack ("we," "us," or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and share information when you use the TrueTrack mobile application ("App") and related services.

By using TrueTrack, you agree to the collection and use of information in accordance with this policy.

## 2. Information We Collect

### A. Personal Information
- **Account Information:** Email address and authentication data provided during registration via Supabase Auth.
- **Financial Data:** Expenses, receipts, budgets, and spending categories you input or that are extracted from receipts.
- **Receipt Images:** Photos of receipts captured using your device camera or selected from your photo library.

### B. Device Permissions

| Permission | Purpose | When Used |
|-----------|---------|-----------|
| **Camera** | Scanning and photographing receipts for expense tracking | When you tap "Scan Receipt" |
| **Photo Library** | Selecting existing receipt photos for processing | When you choose a photo from your library |
| **Location** (optional) | Looking up nearby support services (family law offices, mediation centers) | Only in the Support tab, if enabled |
| **Notifications** (optional) | Calendar and custody schedule reminders | If you enable notifications |

### C. Automatically Collected Data
- Non-identifiable usage analytics (features used, crash logs) to improve app performance.
- Device type and operating system version for compatibility purposes.

## 3. How We Use Your Information

- **Receipt Processing:** Receipt images are sent to **Google Gemini AI** for analysis. The AI extracts structured data (date, merchant, total, line items, category). Receipt images are processed in real-time and are **not stored on Google's servers** after processing. Images are **not used to train AI models**.
- **Expense Tracking:** Extracted receipt data powers your dashboard, budget tracking, spending trends, and financial insights.
- **Co-Parenting Features:** Custody schedules and shared expense tracking, if enabled.
- **Subscription Management:** Purchase history and entitlement status are managed through **RevenueCat** to process in-app subscriptions.
- **Support Services Lookup:** If you use the Support tab, your approximate location may be used to find nearby relevant services. Location data is **not stored** and is used only for the duration of the lookup.

## 4. Data Storage and Security

### Where Your Data Is Stored

| Data Type | Storage Location | Details |
|-----------|-----------------|---------|
| Account & authentication | **Supabase** (hosted on AWS) | Cloud-based, encrypted at rest |
| Receipts & financial data | **Device local storage** (Capacitor Preferences) | Stored on your device only |
| Custody schedules | **Supabase** (cloud sync) + device local storage | Synced for co-parenting features |
| Subscription status | **RevenueCat** servers | Purchase verification and entitlement management |
| Receipt images | **Device only** (temporary) | Sent to Google AI for processing, not persisted on any server |

### Security Measures
- Industry-standard encryption (SSL/TLS) for all data in transit.
- Supabase provides encryption at rest for cloud-stored data.
- Biometric authentication (Face ID/Touch ID), if enabled, uses on-device biometrics only — biometric data is **never** transmitted to our servers.

## 5. Third-Party Services

We integrate the following third-party services:

| Service | Provider | Purpose | Data Shared |
|---------|----------|---------|-------------|
| **Supabase** | Supabase Inc. | Authentication, database, cloud sync | Account info, custody data |
| **Google Gemini AI** | Google LLC | Receipt image analysis and data extraction | Receipt images (transient, not stored) |
| **RevenueCat** | RevenueCat Inc. | In-app purchase and subscription management | Anonymous user ID, purchase events |
| **Apple App Store** | Apple Inc. | App distribution and payment processing | Payment info (managed by Apple) |

We do **not** sell your personal data to any third party.

## 6. Data Retention

- **Account data** is retained as long as your account is active.
- **Receipt images** are processed transiently and are not stored on any server after analysis.
- **Local data** (receipts, budgets) remains on your device until you delete it or uninstall the app.
- **Deleted accounts** have all associated cloud data permanently removed within 30 days.

## 7. Your Rights

- **Access & Correction:** View and edit your data within the app settings.
- **Data Export:** Export your receipt data from the app (Pro feature).
- **Account Deletion:** Delete your account and all associated data directly within the app (Settings > Account > Delete Account). This action is permanent and irreversible.
- **Withdraw Consent:** You can revoke camera, location, or notification permissions at any time through your device settings.

## 8. Children's Privacy

TrueTrack is not intended for children under 13. We do not knowingly collect personal data from children under 13. If we discover that a child under 13 has provided us with personal information, we will promptly delete it.

## 9. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy within the app. Your continued use of TrueTrack after changes constitutes acceptance of the updated policy.

## 10. Contact Us

If you have questions about this Privacy Policy or wish to exercise your data rights, contact us at:

**Email:** support@truetrack.app  
**Location:** Zagreb, Croatia
