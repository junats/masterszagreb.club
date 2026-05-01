/**
 * Instagram Daily Sync Bot for MASTERS Nightclub
 * 
 * This script runs daily via cron or GitHub Actions.
 * It uses the Apify Instagram Scraper actor to fetch recent posts,
 * identifies event-related posts, and forwards them to the Google Sheets CMS Webhook.
 */

const axios = require('axios');

// Configuration - Use Environment Variables
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || 'YOUR_APIFY_TOKEN';
const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME || 'masters_nightclub';
const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || 'YOUR_WEBHOOK_URL_FROM_PHASE_7';

async function fetchRecentInstagramPosts() {
    console.log(`Starting Instagram fetch for @${INSTAGRAM_USERNAME}...`);
    try {
        // Example logic for calling Apify Instagram Scraper
        // The actual actor ID and input format will depend on the specific Apify actor used
        const apifyUrl = `https://api.apify.com/v2/acts/apify~instagram-post-scraper/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;
        
        const input = {
            username: [INSTAGRAM_USERNAME],
            resultsLimit: 5 // Get last 5 posts
        };

        const response = await axios.post(apifyUrl, input);
        const posts = response.data;
        
        console.log(`Successfully fetched ${posts.length} posts.`);
        return posts;
    } catch (error) {
        console.error("Error fetching Instagram posts:", error.message);
        return [];
    }
}

function parseEventFromPost(post) {
    // Basic heuristic: check if the caption contains dates or keywords like "DJ", "Lineup", "Tickets"
    const caption = post.caption || "";
    const isEvent = caption.match(/lineup|dj|tonight|tickets|event|party/i);
    
    if (isEvent) {
        // Extremely naive parsing - in reality you might use an LLM or regex to extract date and title
        return {
            title: "Instagram Event Update", // Extracted title
            date: new Date(post.timestamp).toLocaleDateString('en-GB'), // DD/MM/YYYY format expected by CMS
            description: caption.substring(0, 200) + "..." // Truncated caption
        };
    }
    return null;
}

async function syncToCMS(events) {
    if (!events || events.length === 0) {
        console.log("No new events found to sync.");
        return;
    }

    console.log(`Syncing ${events.length} events to CMS...`);
    for (const event of events) {
        try {
            await axios.post(GOOGLE_SHEET_WEBHOOK_URL, event);
            console.log(`Successfully synced event: ${event.title}`);
        } catch (error) {
            console.error(`Failed to sync event: ${event.title}`, error.message);
        }
    }
}

async function run() {
    const posts = await fetchRecentInstagramPosts();
    const newEvents = posts.map(parseEventFromPost).filter(Boolean);
    await syncToCMS(newEvents);
    console.log("Instagram sync completed successfully.");
}

// Execute the script
if (require.main === module) {
    run();
}

module.exports = { run, fetchRecentInstagramPosts, parseEventFromPost, syncToCMS };
