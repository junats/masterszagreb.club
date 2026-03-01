---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified: ["frontend/src/components/ReceiptScanner.tsx", "frontend/package.json"]
autonomous: true
must_haves:
  truths:
    - "Images captured from camera are compressed before sending to API"
    - "Images uploaded from file are compressed before sending to API"
  artifacts:
    - "browser-image-compression dependency added"
---

# Plan 1.1: Implement Client-Side Image Compression

<objective>
Drastically reduce payload size and Gemini API token consumption by downscaling and compressing images on the client before sending them to the Supabase Edge Function.
Purpose: Survive 10,000 users on Gemini API by shrinking 4K photos (costing many tiles/tokens) into 1024px maximum edge images.
Output: Integrated compression logic in ReceiptScanner.tsx
</objective>

<context>
Load for context:
- frontend/src/components/ReceiptScanner.tsx
</context>

<tasks>
<task type="auto">
  <name>Install Compression Library</name>
  <files>frontend/package.json</files>
  <action>
    Run `npm install browser-image-compression` in the frontend directory.
  </action>
  <verify>cat frontend/package.json | grep browser-image-compression</verify>
  <done>Dependency is present in package.json.</done>
</task>

<task type="auto">
  <name>Implement Compression Logic</name>
  <files>frontend/src/components/ReceiptScanner.tsx</files>
  <action>
    Import `imageCompression`.
    Create a helper function `compressImage(file: File)` that returns a compressed file.
    Options: `maxSizeMB: 1`, `maxWidthOrHeight: 1024`, `useWebWorker: true`.
    Update `takePicture` and `handleFileUpload` to process the blob/file through `compressImage` BEFORE converting to base64.
    AVOID: Modifying the UI/Camera logic. Only intercept the file right before base64 stringification.
  </action>
  <verify>Check console logs locally that payload is smaller.</verify>
  <done>Images are reliably shrunk before the API call is constructed.</done>
</task>
</tasks>
