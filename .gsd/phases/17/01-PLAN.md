---
phase: 17
plan: 1
wave: 1
---

# Plan 17.1: TrueTrack iPhone App Store Assets

<context>
Generate 5 high-converting screenshot compositions for iPhone using the Pencil MCP server. 
The focus is on simplicity, 1 feature per screen, big text, and a modern family positioning.
</context>

<task>
1. Use `mcp_pencil_open_document` with `new` to create a new canvas for iPhone assets.
2. Setup five 1284x2778 frames (iPhone 6.7" App Store spec) with dark/navy gradient backgrounds and soft grain textures.
3. Call `mcp_pencil_batch_design` to build the typography (left-aligned, large negative space) for each of the 5 screens:
   - "End the Money Arguments."
   - "Track Every Shared Euro."
   - "Scan Receipts Using AI."
   - "Fair. Transparent. Documented."
   - "Sync Custody Calendars Instantly."
4. Generate/Load device frames and place them into the compositions with a subtle 3D isometric rotation (5-8 degrees) where appropriate.
5. Export/snapshot the final compositions to the project directory.
</task>

<verify>
```bash
ls -l marketing_iphone_*.png
```
</verify>
