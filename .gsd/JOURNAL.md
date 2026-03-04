# Journal

This file tracks significant milestones and decisions across sessions.

## 2026-03-04 — Favicon Fix & State Update

**Context:** Build was completing successfully but favicon was invisible in browser tabs.

**Root cause:** `master-logo.svg` uses white text on a transparent background — invisible on light browser tab bars.

**Fix:** Created a dedicated `favicon.svg` with `#0a0a0a` dark background and a bold italic "M" lettermark. Updated `index.html` and build script.

**Decision:** Used SVG favicon (modern browser support is excellent) rather than generating `.ico` files. The original `master-logo.svg` is preserved for in-page use.
