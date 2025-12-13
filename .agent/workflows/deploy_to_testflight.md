---
description: Guide to deploying TrueTrack to TestFlight
---

# Deploying to TestFlight

This guide walks you through uploading your app to App Store Connect for TestFlight distribution.

## Prerequisites

1.  **Apple Developer Account**: You have this (paid).
2.  **Xcode**: Installed on your Mac.
3.  **Signing In**: Ensure you are signed into Xcode with your Developer Account (`Xcode > Settings > Accounts`).
4.  **Device**: It is best to have a real iOS device connected if possible, but "Any iOS Device (arm64)" works for archiving.

## Step 1: Prepare the Build (Already Done)

We have already:
1.  Updated the version to `1.0.0` in `package.json`.
2.  Synced the project (`npx cap sync`).
3.  Verified permissions in `Info.plist`.

## Step 2: Open Project in Xcode

1.  Run this command in your terminal (or open manually):
    ```bash
    npx cap open ios
    ```
2.  In Xcode, click on the **App** project in the left sidebar (the blue icon at the very top).

## Step 3: Configure Signing

1.  Select the **App** target in the main view (under "Targets").
2.  Go to the **Signing & Capabilities** tab.
3.  Under **Team**, select your **Apple Developer Team**.
    *   *Note*: If you see errors about "Bundle Identifier", ensure `com.truetrack.app` is registered in your Apple Developer Portal, or let Xcode "Automatically manage signing" to try and register it for you (if it's unique).

## Step 4: Create Content Archive

1.  In the top toolbar, select **Any iOS Device (arm64)** as the build target (instead of a specific simulator).
2.  Go to **Product > Archive**.
3.  Wait for the build to complete. This can take several minutes.

## Step 5: Upload to App Store

1.  Once the Archive is successful, the **Organizer** window will open.
2.  Select the latest archive (Version 1.0.0).
3.  Click **Distribute App**.
4.  Select **TestFlight & App Store** -> **Distribute**.
5.  Accept the defaults (Upload, auto-manage signing, upload symbols).
6.  Click **Export** or **Upload**.

## Step 6: Internal Testing (Team)

1.  Go to [App Store Connect](https://appstoreconnect.apple.com) > **My Apps** > **TrueTrack** > **TestFlight**.
2.  On the left, under **Testers & Groups**, click **App Store Connect Users** (or create a group like "Internal Team").
3.  Click **(+)** to add testers. They must be people with an Apple ID already listed in your Users & Access tab.
4.  **Result**: They receive an email immediately. No approval needed.

## Step 7: External Testing (Public Sharing)

To share with anyone (clients, friends) outside your dev team:

1.  On the left sidebar, click **External Testing** (or create a group named "Beta Testers").
2.  Click **(+)** to add a Build. Select version `1.0.0`.
    *   *Note*: The first time you do this, Apple will perform a **Beta App Review**. This usually takes 12-24 hours. Subsequent builds are usually instant.
3.  Once Approved (status changes from "Waiting for Review" to "Testing"):
    *   **Option A (Email)**: Click **(+)** next to Testers and add their email addresses. They get an invite code.
    *   **Option B (Public Link)**: Click **Enable Public Link** in the top right of the group page. copying this link allows anyone to install the app without you needing their email.
4.  Users must install the **TestFlight App** from the App Store, then tap your link or enters the code.

## Troubleshooting Common Issues

*   **"Missing Icon"**: Verify `AppIcon` in `Assets.xcassets` has all sizes filled.
*   **"Bundle ID in use"**: If `com.truetrack.app` is taken by someone else, you must change `appId` in `capacitor.config.json`, run `npx cap sync`, and update Bundle ID in Xcode > Signing.
*   **"Team is not enrolled in Apple Developer Program"**: You are using a **Personal Team** (free account).
    *   **Fix**: TestFlight requires a paid Apple Developer Program membership ($99/year).
    *   **Alternative**: If you just want to test on *your* device, simply connect your iPhone, select it in the top toolbar, and press the **Play/Run** button in Xcode. You don't need TestFlight for local testing.
