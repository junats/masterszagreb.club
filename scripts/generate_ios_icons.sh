#!/bin/bash
# Generate all required iOS app icons from the source 1024x1024 icon

set -e

SOURCE_ICON="ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
APP_ICON_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"
WIDGET_ICON_DIR="ios/App/TrueTrackWidget/Assets.xcassets/AppIcon.appiconset"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Generating iOS App Icons"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check source exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

# Define all required sizes: "filename:pixel_size"
SIZES=(
    "AppIcon-20x20@1x.png:20"
    "AppIcon-20x20@2x.png:40"
    "AppIcon-20x20@3x.png:60"
    "AppIcon-29x29@1x.png:29"
    "AppIcon-29x29@2x.png:58"
    "AppIcon-29x29@3x.png:87"
    "AppIcon-40x40@1x.png:40"
    "AppIcon-40x40@2x.png:80"
    "AppIcon-40x40@3x.png:120"
    "AppIcon-60x60@2x.png:120"
    "AppIcon-60x60@3x.png:180"
    "AppIcon-76x76@1x.png:76"
    "AppIcon-76x76@2x.png:152"
    "AppIcon-83.5x83.5@2x.png:167"
)

echo ""
echo "Generating app icons from: $SOURCE_ICON"
echo ""

for SIZE_SPEC in "${SIZES[@]}"; do
    FILENAME="${SIZE_SPEC%%:*}"
    PIXELS="${SIZE_SPEC##*:}"
    OUTPUT="$APP_ICON_DIR/$FILENAME"
    
    echo "  → ${FILENAME} (${PIXELS}x${PIXELS})"
    sips -z "$PIXELS" "$PIXELS" "$SOURCE_ICON" --out "$OUTPUT" > /dev/null 2>&1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Generating Widget Icons"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Widget needs 3 variants of 1024x1024 (light, dark, tinted)
# Using same source for all variants
cp "$SOURCE_ICON" "$WIDGET_ICON_DIR/AppIcon.png"
echo "  → AppIcon.png (1024x1024 - light)"

cp "$SOURCE_ICON" "$WIDGET_ICON_DIR/AppIcon-dark.png"
echo "  → AppIcon-dark.png (1024x1024 - dark)"

cp "$SOURCE_ICON" "$WIDGET_ICON_DIR/AppIcon-tinted.png"
echo "  → AppIcon-tinted.png (1024x1024 - tinted)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✓ Done! Generated all iOS icons"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
