# Journal

This file tracks significant milestones and decisions across sessions.

## 2026-03-04 — Security Audit & True Static Architecture

**Context:** The user requested a "massive security check" after we integrated a Google Sheets CMS.

**Root cause (vulnerabilities):** The legacy Node/Express server and Telegram bot had unauthenticated endpoints, open CORS, and file-based race conditions. The frontend lacked a Content Security Policy (CSP), Subresource Integrity (SRI), and used `innerHTML` unsafe patterns. 

**Fix:** 
- Nucleated the entire `server/` directory, confirming the shift to a purely static architecture driven by Google Sheets.
- Hardened `index.html` with an aggressive CSP (allowing only specific Google domains for the CSV fetch), SRI hashes for Three.js, and modern security headers.
- Patched `matrix-events.js` to utilize safe `textContent` and DOM node creation.

**Decision:** Relying solely on a published Google Sheets CSV vastly minimizes the attack surface, eliminating the need for scaling or maintaining a backend API node server.

---

## 2026-03-04 — Favicon Fix & State Update

**Context:** Build was completing successfully but favicon was invisible in browser tabs.

**Root cause:** `master-logo.svg` uses white text on a transparent background — invisible on light browser tab bars.

**Fix:** Created a dedicated `favicon.svg` with `#0a0a0a` dark background and a bold italic "M" lettermark. Updated `index.html` and build script.

**Decision:** Used SVG favicon (modern browser support is excellent) rather than generating `.ico` files. The original `master-logo.svg` is preserved for in-page use.
