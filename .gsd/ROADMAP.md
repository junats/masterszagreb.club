# MASTERS Nightclub Roadmap

## Current Milestone: MVP Refactoring & Asset Integration

### Phase 1: Background Asset Integration
*Goal: Point the background rotator to the newly provided `.webp` high-quality images in the `assests` folder.*
- [ ] Update background image array in `main.js` to use images from `assests/`.
- [ ] Confirm image loading paths are correct.

### Phase 2: ES6 Module Conversion
*Goal: Prepare the HTML to support modern JavaScript importing.*
- [ ] Create `js/` directory to organize modules.
- [ ] Update `index.html` script tags to use `type="module"`.

### Phase 3: Modularize Main Logic
*Goal: Break down `main.js` into distinct, AI-friendly modules.*
- [ ] Extract Configuration & Constants.
- [ ] Extract Matrix Events logic.
- [ ] Extract Background Reveal System.
- [ ] Recompose logic in a new `main.js` entrypoint.

### Phase 4: Modularize Effects Logic
*Goal: Ensure Three.js and other visual behaviors are compartmentalized.*
- [ ] Refactor `bg-effect.js` into an exportable Class/Module.
- [ ] Verify displacement functionality operates correctly.

### Phase 5: Verification & Cleanup
*Goal: Prove the refactor hasn't broken the visual identity.*
- [ ] Launch local server.
- [ ] Verify no browser console errors.
- [ ] Validate manual interaction (hover, click toggles).
