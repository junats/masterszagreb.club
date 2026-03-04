---
phase: 7
plan: 1
wave: 1
depends_on: []
files_modified: []
autonomous: false
user_setup:
  - service: Google Apps Script
    why: "Listen for Twilio webhook payloads"
    dashboard_config:
      - task: "Create new App Script attached to the MASTERS Google Sheet"
      - task: "Deploy as Web App (Anyone with link can execute)"
  - service: Twilio
    why: "Provide the SMS phone number"
    dashboard_config:
      - task: "Buy a Twilio SMS number"
      - task: "Paste the Google Apps Script Web App URL into the 'A MESSAGE COMES IN' webhook configuration."
must_haves:
  truths:
    - "A text message sent to the Twilio number appends a new row to the linked Google Sheet."
  artifacts: []
---

# Plan 7.1: SMS to Google Sheets Webhook

<objective>
Enable the club owner to text event details to a dedicated phone number, which automatically updates the live Google CMS Sheet.
Purpose: Frictionless event management without opening laptops or Google Apps on mobile.
Output: A Javascript snippet the user pastes into Google Apps Script.
</objective>

<context>
Load for context:
- No local files modified (100% cloud architecture).
</context>

<tasks>

<task type="auto">
  <name>Generate Webhook Listener Script</name>
  <files>twilio-webhook.gs (new scratch file)</files>
  <action>
    Write a complete Google Apps Script `doPost(e)` function.
    1. Parse the inbound Twilio form data `e.parameter.Body`.
    2. Expect a format like: `TITLE: Techno Night | DATE: 2026-12-31 | TIME: 22:00 | DESC: Be there`
    3. Split the string by the `|` delimiter.
    4. Clean up the tags (TITLE:, DATE:, etc.).
    5. Call `SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().appendRow([title, date, time, desc]);`
    6. Return a `ContentService.createTextOutput('<Response></Response>').setMimeType(ContentService.MimeType.XML);` to satisfy Twilio's XML requirement.
  </action>
  <verify>Code inspection</verify>
  <done>Script handles formatting and appends exactly 4 columns.</done>
</task>

<task type="checkpoint:human-action">
  <name>User Configuration</name>
  <files>N/A</files>
  <action>
    Pause and let the user set up Twilio and Google Apps Script using the generated `.gs` code.
  </action>
  <verify>User confirms a test SMS successfully appeared on the public website.</verify>
  <done>End-to-end integration verified by human.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] User confirms SMS was received.
- [ ] Website reflects the new row.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
