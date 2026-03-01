# Specification: Nightclub Website AI-Friendly Refactor & Assets Integration
Status: FINALIZED

## 1. Executive Summary
The MASTERS nightclub website codebase needs to be refactored to improve its architecture, making it highly modular and usable for future developers and AI agents to build upon. Additionally, the website's background image rotation needs to be updated to utilize the new WebP images provided in the `assests` folder.

## 2. Problem Statement
- **Monolithic Scripts**: Currently, logic is grouped into large files like `main.js` and `bg-effect.js` which mix state management, DOM manipulation, and visual effects. This monolithic structure is difficult for AI agents to safely modify without unintended side effects.
- **Hardcoded Assets**: The background images are hardcoded to old `.jpg` files instead of using the newly provided, optimized `.webp` formats in the `assests` directory.

## 3. Requirements

### 3.1 Functional Requirements
- **Background Asset Integration**: Update the background rotation logic to consume the images located in the `assests/` folder (`IMG_0780.webp` through `IMG_0789.webp`).
- **Codebase Modularization**: Break down monolithic JavaScript files (`main.js`, `bg-effect.js`) into modular, single-responsibility ES6 modules.
- **AI-Friendly Architecture**:
  - Clear separation of concerns: State, Configuration, DOM Manipulation, and Effects.
  - Consistent naming conventions.
  - Well-documented inline comments for AI parsing.
- **Maintained Functionality**: All existing visual effects (Three.js distortions, matrix typing, Audio Reactive Logo) must continue to function exactly as they do now.

### 3.2 Technical Constraints
- Must retain the Vanilla HTML/CSS/JS stack, unless otherwise specified.
- Use native ES6 Modules (`import`/`export`).

## 4. Implementation Strategy
1. **Asset Migration**: Update the `backgroundImages` array to point to the `assests/` folder.
2. **Modularization Setup**: Set `type="module"` in `index.html` for script tags.
3. **Refactoring Scope**:
   - Extract the Matrix Event System into its own module (`js/matrix.js` or `js/events.js`).
   - Extract the Matrix Background Reveal into its own module (`js/reveal.js`).
   - Extract the Background Rotator into its own module (`js/background.js`).
4. **Verification**: Confirm that the refactored modules successfully import, run without console errors, and retain all visual fidelity.

## 5. Verification Plan
- **Asset Visual Check**: Run the app locally and observe that the backgrounds cycle through the new `assests/IMG_*.webp` files.
- **Console Check**: Ensure zero module loading errors or undefined reference errors in the browser console.
- **Functionality Check**: Verify the `Matrix Event System` triggers correctly. Verify the `BackgroundEffect` displacement works on mouse hover.
