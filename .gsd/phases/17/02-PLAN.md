---
phase: 17
plan: 2
wave: 1
---

# Plan 17.2: TrueTrack iPad App Store Assets

<context>
Generate 4 high-converting screenshot compositions for iPad using the Pencil MCP server. 
The focus is on workspace, split views, productivity, and power features.
</context>

<task>
1. Use `mcp_pencil_open_document` with `new` to create a new canvas for iPad assets.
2. Setup four 2048x2732 frames (iPad 12.9" App Store spec) with dark/navy gradient backgrounds and soft grain textures.
3. Call `mcp_pencil_batch_design` to build the typography (left-aligned, large negative space) for each of the 4 screens:
   - "Command Your Family Finances."
   - "Analyze Shared Spending Patterns."
   - "Export Court-Ready PDF Reports."
   - "Manage Complex Custody Schedules."
4. Generate/Load device frames for the iPad and place them into the compositions with a subtle 3D isometric rotation (5-8 degrees).
5. Export/snapshot the final compositions to the project directory.
</task>

<verify>
```bash
ls -l marketing_ipad_*.png
```
</verify>
