---
name: icon-generator
description: Generate app icons, splash screens, and marketing assets for iOS, Android, and web.
---

# Icon & Asset Generator Skill

Generate all required app icons and assets for iOS, Android, and marketing.

## iOS App Icon Requirements

| Size | Scale | Usage |
|------|-------|-------|
| 20x20 | 1x, 2x, 3x | Notifications |
| 29x29 | 1x, 2x, 3x | Settings |
| 40x40 | 2x, 3x | Spotlight |
| 60x60 | 2x, 3x | App Icon |
| 76x76 | 1x, 2x | iPad |
| 83.5x83.5 | 2x | iPad Pro |
| 1024x1024 | 1x | App Store |

**File Format:** PNG, no alpha, no rounded corners (iOS applies automatically)

## Android App Icon Requirements

| Type | Sizes |
|------|-------|
| mipmap-mdpi | 48x48 |
| mipmap-hdpi | 72x72 |
| mipmap-xhdpi | 96x96 |
| mipmap-xxhdpi | 144x144 |
| mipmap-xxxhdpi | 192x192 |
| Play Store | 512x512 |

**Adaptive Icon:** Foreground (108x108) + Background (108x108)

## Splash Screen / Launch Image

| Platform | Sizes |
|----------|-------|
| iOS | 1242x2688, 1125x2436, 828x1792, 750x1334 |
| Android | 1080x1920, 720x1280, 480x800 |

## Marketing Assets

| Asset | Size | Usage |
|-------|------|-------|
| App Preview | 1290x2796 | App Store screenshots |
| Feature Graphic | 1024x500 | Play Store banner |
| Social Card | 1200x630 | Open Graph / Twitter |
| Favicon | 32x32, 16x16 | Web |

## Commands

### Using Agent (Cloud)
```
/generate-icons "Create app icon with shield + dollar sign, dark blue gradient"
```

### Using Local Script
```bash
# Generate all iOS sizes from a 1024x1024 source
node scripts/generate_icons.js --source icon-1024.png --platform ios

# Generate all Android sizes
node scripts/generate_icons.js --source icon-1024.png --platform android

# Generate both platforms
node scripts/generate_icons.js --source icon-1024.png --platform all
```

### Using AI Image Generation
```
# In chat with agent:
"Generate a 1024x1024 app icon with:
- Shield symbol representing protection
- Dollar sign for finance
- Dark blue to purple gradient background
- Minimal, modern design
- No text"
```

## Design Guidelines

1. **Simplicity**: Icon should be recognizable at 29x29
2. **No Text**: Avoid text in app icons
3. **Single Focus**: One main element, not multiple
4. **Contrast**: Must be visible on light AND dark backgrounds
5. **No Photos**: Use vector-style graphics

## File Structure

```
assets/
├── icons/
│   ├── ios/
│   │   ├── Icon-20.png, Icon-20@2x.png, Icon-20@3x.png
│   │   ├── Icon-29.png, Icon-29@2x.png, Icon-29@3x.png
│   │   ├── Icon-40@2x.png, Icon-40@3x.png
│   │   ├── Icon-60@2x.png, Icon-60@3x.png
│   │   ├── Icon-76.png, Icon-76@2x.png
│   │   ├── Icon-83.5@2x.png
│   │   └── Icon-1024.png
│   └── android/
│       ├── mipmap-mdpi/ic_launcher.png
│       ├── mipmap-hdpi/ic_launcher.png
│       ├── mipmap-xhdpi/ic_launcher.png
│       ├── mipmap-xxhdpi/ic_launcher.png
│       ├── mipmap-xxxhdpi/ic_launcher.png
│       └── playstore-icon.png
├── splash/
│   ├── ios/
│   └── android/
└── marketing/
    ├── app-store-preview.png
    ├── feature-graphic.png
    └── social-card.png
```
