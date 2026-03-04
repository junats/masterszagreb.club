# App State

**Phase:** General Maintenance
**Task:** Updating Deprecated Meta Tags
**Status:** Complete
**What was just accomplished:**
- Added `<meta name="mobile-web-app-capable" content="yes">` to `index.html`.
- Kept the Apple specific `<meta name="apple-mobile-web-app-capable" content="yes">` for legacy iOS support, fulfilling the browser's requirement for the modern tag while retaining full compatibility.
- Rebuilt the project to update `dist/index.html`.

**Next steps:**
- The console should no longer show the deprecation warning.
- Waiting on the user for the next task (likely connecting the Google Sheets CMS frontend).
