# Phase 9 Research: UI Polish & Audio Cleanup

## Music Loop Removal
- Since this project is built with Vanilla HTML/JS and has been refactored to ES6 modules, the music loop could be implemented in a few places:
  1. An `<audio>` or `<video>` tag in `index.html` with the `loop` attribute.
  2. JavaScript logic in a file like `js/main.js` or `js/events.js` that instantiates an `Audio` object.
  3. The SoundCloud iframe in `index.html` (though it's commented out in the latest index.html).
  4. The `audio-logo.js` file (which may handle audio-reactive features and play a background track).
- **Action**: Locate where the audio is triggered and remove it or disable autoplay/looping.

## "EVENTS" Label
- The hamburger menu is defined in `index.html` with `#morphToggleBtn.morph-menu-btn`.
- To add an "EVENTS" label to the left:
  - Add a span or text node before the button or inside a shared flex container.
  - Apply styling to ensure it vertically aligns with the hamburger menu.
  - Position it fixed to the top right, with a right offset accounting for the hamburger menu width.
