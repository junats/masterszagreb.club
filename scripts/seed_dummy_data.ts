/**
 * TrueTrack - App Store Screenshot Seeding Utility
 * 
 * NOTE: TrueTrack handles its core data (receipts, budgets) via local device storage 
 * and securely syncs custody calendars. Therefore, traditional backend DB seeding 
 * does not fully populate the application UI for screenshots.
 * 
 * To seed the UI with perfect, premium dummy data for App Store screenshots:
 * 
 * 1. Run the application in Dev mode (\`npm run dev\`) or via the iOS Simulator.
 * 2. In the browser console or WebView debugger, dispatch the seed event:
 * 
 *    \`\`\`javascript
 *    // This will instruct the DataContext to generate and inject the 'appstore' preset
 *    import('../utils/seedData').then(({ generateScenarioData }) => {
 *        const data = generateScenarioData('appstore', 3);
 *        window.dispatchEvent(new CustomEvent('truetrack:seed_screenshots', { detail: data }));
 *    });
 *    \`\`\`
 * 
 * The app will instantly populate with realistic receipts, custody days, and goals.
 */

console.log('App Store Dummy Data seeding relies on frontend local storage injection.');
console.log('Please see scripts/seed_dummy_data.ts for Developer Console instructions.');
