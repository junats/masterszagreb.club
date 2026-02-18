#!/bin/bash

BASE_DIR="/Users/mark/.gemini/antigravity/brain/6954714a-8006-4f7c-a8da-93178c6113b4"
FINAL_DIR="$BASE_DIR/final_screenshots"
mkdir -p "$FINAL_DIR"

BG_COLOR="0A0E1A"

# Clean up previous attempts in final_screenshots
rm -rf "$FINAL_DIR"
mkdir -p "$FINAL_DIR"

# Source files from the brain directory
# We'll use the ones generated in the previous steps

process_image() {
    local src="$1"
    local out_name="$2"
    local w="$3"
    local h="$4"
    
    echo "Processing $out_name ($w x $h)..."
    sips --resampleWidth "$w" "$src" --out "$FINAL_DIR/temp.png"
    sips -p "$h" "$w" --padColor "$BG_COLOR" "$FINAL_DIR/temp.png" --out "$FINAL_DIR/$out_name.jpg" -s format jpeg
    rm "$FINAL_DIR/temp.png"
}

# 13-inch iPad (2048 x 2732)
process_image "$BASE_DIR/appstore_ipad_1_dashboard_1771447907988.png" "ipad_1_dashboard" 2048 2732
process_image "$BASE_DIR/appstore_ipad_2_coparenting_1771447933048.png" "ipad_2_coparenting" 2048 2732
process_image "$BASE_DIR/appstore_ipad_3_history_v2_1771448032207.png" "ipad_3_history" 2048 2732
process_image "$BASE_DIR/appstore_ipad_4_calendar_1771448003947.png" "ipad_4_calendar" 2048 2732

# 6.5-inch iPhone (1242 x 2688)
process_image "$BASE_DIR/appstore_iphone_6_5_dashboard_1771447949828.png" "iphone65_1_dashboard" 1242 2688
process_image "$BASE_DIR/appstore_iphone_6_5_history_1771447966268.png" "iphone65_2_history" 1242 2688
process_image "$BASE_DIR/appstore_iphone_6_5_coparenting_v2_1771448055058.png" "iphone65_3_coparenting" 1242 2688
process_image "$BASE_DIR/appstore_iphone_6_5_calendar_v2_1771448071180.png" "iphone65_4_calendar" 1242 2688

# 6.7-inch iPhone (1284 x 2778) - Per User's Error Message
process_image "$BASE_DIR/appstore_screenshot_1_dashboard_v2_1771443197266.png" "iphone67_1_dashboard" 1284 2778
process_image "$BASE_DIR/appstore_screenshot_2_history_1771443147252.png" "iphone67_2_history" 1284 2778
process_image "$BASE_DIR/appstore_screenshot_3_coparenting_1771443297038.png" "iphone67_3_coparenting" 1284 2778
process_image "$BASE_DIR/appstore_screenshot_4_calendar_1771443242383.png" "iphone67_4_calendar" 1284 2778

# 6.7-inch iPhone (1290 x 2796) - Newer Pro Max
process_image "$BASE_DIR/appstore_screenshot_1_dashboard_v2_1771443197266.png" "iphone67_v2_1_dashboard" 1290 2796
process_image "$BASE_DIR/appstore_screenshot_2_history_1771443147252.png" "iphone67_v2_2_history" 1290 2796
process_image "$BASE_DIR/appstore_screenshot_3_coparenting_1771443297038.png" "iphone67_v2_3_coparenting" 1290 2796
process_image "$BASE_DIR/appstore_screenshot_4_calendar_1771443242383.png" "iphone67_v2_4_calendar" 1290 2796

echo "Done! Verified JPEG files are in $FINAL_DIR"
