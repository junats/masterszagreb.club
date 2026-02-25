# ROADMAP

## Phase 1: Client-Side Image Optimization
- [x] Install browser-image-compression library
- [x] Update `ReceiptScanner.tsx` to compress and downscale images before base64 conversion
- [x] Verify image quality remains sufficient for OCR extraction

## Phase 2: User-Level Rate Limiting
- [x] Create `scan_limits` table or user metadata field in Supabase to track daily scans
- [x] Update `supabase/functions/api/index.ts` to block requests if daily free limit exceeded
- [x] Ensure Premium users bypass standard limits

## Phase 3: OCR Caching Layer (Optional Future)
- [ ] Hash receipt images
- [ ] Lookup hash before calling Gemini
- [ ] Return cached JSON if match found
