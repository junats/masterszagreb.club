# Phase 8 Research: Mobile Events UI & Instagram Bot

## Mobile Navigation UI
- **Viewport Goal**: 80% of vertical viewport on mobile (`80vh`).
- **Glass Effect**: CSS `backdrop-filter: blur(10px)` combined with a semi-transparent background like `background: rgba(20, 20, 20, 0.4)`.
- **Scrollbar**: Set `overflow-y: auto` to allow scrolling of events. The scrollbar can be styled with `::-webkit-scrollbar` pseudo-elements for a cleaner look.

## Instagram Bot
- **Official API**: Instagram Graph API requires a Facebook Developer account, app review, and an Instagram Professional account linked to a Facebook Page.
- **Scraping Alternatives**: Tools like Apify (Instagram Scraper actor) or Instaloader (Python).
- **Architecture**:
  - Since the events are currently pulled from a Google Sheet (as implemented in Phase 7), the Instagram bot should run as a scheduled job.
  - **Option 1**: A Google Apps Script running on a time-driven trigger. It can fetch from a RapidAPI endpoint or Apify API, then append to the sheet.
  - **Option 2**: A GitHub Actions workflow running a Node.js/Python script that hits Apify and posts to the Google Sheet (via Google Sheets API or the Webhook from Phase 7).
- **Recommendation**: Write a Node.js script `scripts/instagram-bot.js` that can be run daily via GitHub Actions or locally via cron. It will fetch Instagram data (via a scraper API or official API) and POST to the webhook created in Phase 7 to append the events.
