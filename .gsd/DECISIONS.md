## Phase 17 Decisions

**Date:** 2026-03-01

### Scope
- Create completely new high-converting marketing assets for the App Store.
- Capture real UI screenshots of TrueTrack from iPhone and iPad (currently using placeholder iPad images).
- Output must differentiate iPad (productivity/power) vs iPhone (simplicity).
- Use dynamic positioning, 3D rotations, and depth/shadows.

### Approach
- Chose: Use the `pencil` MCP server to directly generate and compose these marketing frames inside a `.pen` design file, rather than hand-coding robust CSS/HTML templates or requiring manual Figma legwork. 
- Reason: The user wants me to handle all image generation and composition natively within the toolset. `pencil` is perfect for exact typography, gradient backgrounds, and device frame overlays.

### Constraints
- Copy should stick to the "Modern Families" angle (rather than overly aggressive divorce/conflict terminology).
- Needs to produce completely finished PNG files ready for App Store Connect.
