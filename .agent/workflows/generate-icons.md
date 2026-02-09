---
description: Generate app icons and assets for iOS, Android, and marketing
---

# /generate-icons Workflow

Regenerate all iOS app icons from the source 1024x1024 icon.

## Quick Use

// turbo
```bash
./scripts/generate_ios_icons.sh
```

This generates:
- **14 iOS app icon sizes** (20pt through 180pt)
- **3 widget icons** (light/dark/tinted)

## Source Icon Location

`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024x1024)

## Output Locations

| Type | Directory |
|------|-----------|
| iOS App | `ios/App/App/Assets.xcassets/AppIcon.appiconset/` |
| Widget | `ios/App/TrueTrackWidget/Assets.xcassets/AppIcon.appiconset/` |
| Web | `frontend/public/` (favicon.png, logo.png) |

## Updating the Source Icon

1. Replace `AppIcon-512@2x.png` with your new 1024x1024 PNG
2. Run `/generate-icons`
3. Optionally update `frontend/public/favicon.png` and `logo.png` manually

## Size Reference

| Size | Scale | Usage |
|------|-------|-------|
| 20pt | 2x, 3x | Notifications |
| 29pt | 1x, 2x, 3x | Settings |
| 40pt | 1x, 2x, 3x | Spotlight |
| 60pt | 2x, 3x | App Icon (iPhone) |
| 76pt | 1x, 2x | App Icon (iPad) |
| 83.5pt | 2x | App Icon (iPad Pro) |
| 1024pt | 1x | App Store |
