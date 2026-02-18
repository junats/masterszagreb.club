#!/bin/bash

BASE_DIR="/Users/mark/.gemini/antigravity/brain/6954714a-8006-4f7c-a8da-93178c6113b4"
OUTPUT_DIR="$BASE_DIR/final_screenshots"
mkdir -p "$OUTPUT_DIR"

BG_COLOR="0A0E1A"

# 13-inch iPad (2048 x 2732)
IPAD_FILES=(
    "appstore_ipad_1_dashboard_1771447907988.png"
    "appstore_ipad_2_coparenting_1771447933048.png"
    "appstore_ipad_3_history_v2_1771448032207.png"
    "appstore_ipad_4_calendar_1771448003947.png"
)

# 6.5-inch iPhone (1242 x 2688)
IPHONE_6_5_FILES=(
    "appstore_iphone_6_5_coparenting_v2_1771448055058.png"
    "appstore_iphone_6_5_dashboard_1771447949828.png"
    "appstore_iphone_6_5_history_1771447966268.png"
    "appstore_iphone_6_5_calendar_v2_1771448071180.png"
)

# 6.7-inch iPhone (1290 x 2796)
IPHONE_6_7_FILES=(
    "appstore_screenshot_1_dashboard_v2_1771443197266.png"
    "appstore_screenshot_2_history_1771443147252.png"
    "appstore_screenshot_3_coparenting_1771443297038.png"
    "appstore_screenshot_4_calendar_1771443242383.png"
)

echo "Processing iPad screenshots..."
for f in "${IPAD_FILES[@]}"; do
    sips --resampleWidth 2048 "$BASE_DIR/$f" --out "$OUTPUT_DIR/ipad_$f"
    sips -p 2732 2048 --padColor "$BG_COLOR" "$OUTPUT_DIR/ipad_$f"
done

echo "Processing iPhone 6.5\" screenshots..."
for f in "${IPHONE_6_5_FILES[@]}"; do
    sips --resampleWidth 1242 "$BASE_DIR/$f" --out "$OUTPUT_DIR/iphone65_$f"
    sips -p 2688 1242 --padColor "$BG_COLOR" "$OUTPUT_DIR/iphone65_$f"
done

echo "Processing iPhone 6.7\" screenshots..."
for f in "${IPHONE_6_7_FILES[@]}"; do
    sips --resampleWidth 1290 "$BASE_DIR/$f" --out "$OUTPUT_DIR/iphone67_$f"
    sips -p 2796 1290 --padColor "$BG_COLOR" "$OUTPUT_DIR/iphone67_$f"
done

echo "Done! Final images are in $OUTPUT_DIR"
