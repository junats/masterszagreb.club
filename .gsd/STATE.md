# App State

**Phase:** Google Sheets CMS Polish
**Task:** Make events pane larger
**Status:** Complete
**What was just accomplished:**
- Updated parsing logic in `telegram-webhook.gs` to ignore empty messages and `/start` commands
- Fixed parsing in `telegram-webhook.gs` to support `DESCRIPTION:` and `DESC:` formats
- Increased `.matrix-container.active` height in `style.css` to 75vh on desktop and 85vh on mobile to show more events
- Rebuilt the application

**Next steps:**
- User verifies events pane sizing
- Continue with any remaining roadmap items
