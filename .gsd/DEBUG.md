# Debug Session: Xcode Cloud Pods Error

## Symptom
Xcode Cloud archive fails with:
`Unable to open base configuration reference file '/Volumes/workspace/repository/ios/App/Pods/Target Support Files/Pods-App/Pods-App.release.xcconfig'. App.xcodeproj:1`

**When:** Archiving the iOS app in Xcode Cloud.
**Expected:** The archive builds successfully.
**Actual:** Build fails because it cannot find the CocoaPods configuration files.

## Evidence
- The `ios/App/Pods` directory is ignored by Git, which is correct.
- Xcode Cloud does not automatically know to install node modules or run Capacitor sync/pod install.
- Checked for `ios/App/ci_scripts/ci_post_clone.sh` and it does not exist.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Missing `ci_post_clone.sh` in Xcode Cloud to run `npm install` and `pod install` | 99% | UNTESTED |

## Attempts

### Attempt 1
**Testing:** H1 — Missing `ci_post_clone.sh`
**Action:** Create `ios/App/ci_scripts/ci_post_clone.sh` and make it executable, which will tell Xcode Cloud to install Node, dependencies, and sync iOS pods.
**Result:** Pending Xcode Cloud run.
**Conclusion:** UNTESTED

## Resolution
**Root Cause:**
1. Missing `ci_post_clone.sh` to install web assets and run `pod install`.
2. Hardcoded `@rollup/rollup-darwin-arm64` dependency causing x64 build server to crash.
3. Xcode Cloud heavily caching `Podfile.lock` ignoring Git commits.

**Fix:**
Created script that installs node, forces `rm -rf ios/App/Pods` and `Podfile.lock`, runs `npm run build:mobile`, then syncs.

**Verified:** Build 25 succeeded completely on Xcode Cloud.
