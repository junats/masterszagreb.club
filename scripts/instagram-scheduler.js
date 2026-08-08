// Instagram Monthly Scheduler using node-cron
// Runs the Instagram scrapers once a month at 00:00 on the 1st of each month

const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

function runMonthlyScrape() {
  console.log(`[Scheduler] [${new Date().toISOString()}] Starting monthly Instagram event flyer sync...`);
  const scrapeScript = path.join(__dirname, 'scrape-instagram.js');
  const storiesScript = path.join(__dirname, 'scrape-stories.js');

  exec(`node "${scrapeScript}" && node "${storiesScript}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Scheduler] Scrape error: ${error.message}`);
      return;
    }
    if (stderr) console.error(`[Scheduler] stderr: ${stderr}`);
    console.log(`[Scheduler] Monthly scrape finished:\n${stdout}`);
  });
}

// Schedule: At 00:00 (midnight) on the 1st day of every month
cron.schedule('0 0 1 * *', () => {
  runMonthlyScrape();
});

// Keep the process alive
console.log('🗓️  Instagram monthly scheduler started. Trigger set to 00:00 on the 1st of every month.');

