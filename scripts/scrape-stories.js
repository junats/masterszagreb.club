#!/usr/bin/env node

/**
 * scrape-stories.js
 * 
 * Scrapes public Instagram stories from masters.zagreb using either:
 *   - Direct Instagram API using a burner account's session cookie (100% Free)
 *   - Apify Instagram Stories Scraper Actor (Fallback)
 * 
 * Then:
 *   - Runs OCR (Tesseract.js) to extract flyer text
 *   - Parses event details using parseCaption
 *   - Appends new events to data/events.json
 * 
 * Usage:
 *   node scripts/scrape-stories.js
 * 
 * Environment Variables:
 *   INSTAGRAM_SESSION_ID - (Recommended) Session cookie for burner account (100% Free)
 *   APIFY_API_TOKEN      - Apify API token (if using Apify)
 *   APIFY_ACTOR_ID       - Apify Actor ID (default: louisdeconinck~instagram-stories-scraper)
 *   INSTAGRAM_HANDLE     - Override default handle (default: masters.zagreb)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Tesseract = require('tesseract.js');
const { parseCaption } = require('./parse-caption');

// ── Environment Loader (Parses .env file dependency-free) ─────────────
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const match = trimmed.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                process.env[key] = value;
            }
        });
    }
}
loadEnv();

// ── Configuration ─────────────────────────────────────────────────────
const INSTAGRAM_HANDLE = process.env.INSTAGRAM_HANDLE || 'masters.zagreb';
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = process.env.APIFY_ACTOR_ID || 'louisdeconinck~instagram-stories-scraper';
const INSTAGRAM_SESSION_ID = process.env.INSTAGRAM_SESSION_ID;
const INSTAGRAM_COOKIES = process.env.INSTAGRAM_COOKIES;

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const EVENTS_JSON = path.join(DATA_DIR, 'events.json');
const ARCHIVE_JSON = path.join(DATA_DIR, 'events-archive.json');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'assests', 'events');

// User-Agent to mimic a real browser for general requests
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Blacklist story/post IDs (e.g. stories containing images of guys)
const BLACKLISTED_POSTS = ['DZFaIa6jJhP'];

function parseDate(dateStr) {
    if (!dateStr || dateStr === 'DATE PENDING' || dateStr === 'TBC') return null;
    const dotParts = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dotParts) {
        return new Date(parseInt(dotParts[3], 10), parseInt(dotParts[2], 10) - 1, parseInt(dotParts[1], 10));
    }
    const isoParts = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoParts) {
        return new Date(parseInt(isoParts[1], 10), parseInt(isoParts[2], 10) - 1, parseInt(isoParts[3], 10));
    }
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
}

/**
 * Make an HTTPS GET request and return the response body as a buffer.
 */
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const requester = parsedUrl.protocol === 'https:' ? https : http;

        const reqOptions = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'image/webp,image/jpeg,image/png,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity',
                'Cache-Control': 'no-cache',
            },
        };

        const req = requester.request(reqOptions, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location).then(resolve).catch(reject);
            }

            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }

            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error(`Timeout fetching ${url}`));
        });
        req.end();
    });
}

/**
 * Download a story image and save it locally.
 */
async function downloadStoryImage(imageUrl, storyId) {
    ensureDir(IMAGES_DIR);

    const ext = 'jpg';
    const filename = `story-${storyId}.${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);
    const relativePath = `assests/events/${filename}`;

    if (fs.existsSync(filepath)) {
        console.log(`  ⏭️  Story flyer already exists: ${filename}`);
        return { relativePath, filepath };
    }

    try {
        const buffer = await fetchUrl(imageUrl);
        fs.writeFileSync(filepath, buffer);
        console.log(`  📸 Downloaded story flyer: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
        return { relativePath, filepath };
    } catch (err) {
        console.error(`  ❌ Failed to download story image for ${storyId}: ${err.message}`);
        return null;
    }
}

/**
 * Perform OCR using Tesseract.js.
 */
async function performOCR(imagePath) {
    console.log(`  🔍 Performing OCR on ${path.basename(imagePath)}...`);
    try {
        const result = await Tesseract.recognize(imagePath, 'hrv+eng', {
            logger: m => {
                if (m.status === 'recognizing' && Math.round(m.progress * 100) % 25 === 0) {
                    console.log(`    ocr: ${Math.round(m.progress * 100)}%`);
                }
            }
        });
        return result.data.text;
    } catch (error) {
        console.error(`  ⚠️ OCR failed: ${error.message}`);
        return '';
    }
}

/**
 * Fetch stories directly using Instagram Web API with a session cookie (100% Free)
 */
async function fetchStoriesViaSessionCookie(username, sessionId) {
    console.log(`📡 Fetching stories directly via Instagram Web API using burner session cookie...`);
    
    const cookieJar = {};

    function getCookieString() {
        if (INSTAGRAM_COOKIES) return INSTAGRAM_COOKIES;
        return Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
    }

    function updateCookies(setCookieHeaders) {
        if (INSTAGRAM_COOKIES || !setCookieHeaders) return;
        setCookieHeaders.forEach(cookieStr => {
            const parts = cookieStr.split(';')[0].split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim();
                cookieJar[key] = val;
            }
        });
    }

    // 1. Visit Instagram homepage to gather system cookies (only if no full cookies provided)
    if (!INSTAGRAM_COOKIES && sessionId) {
        try {
            console.log('  📡 Pre-fetching Instagram homepage for cookies...');
            const homeResponse = await axios.get('https://www.instagram.com/', {
                headers: {
                    'User-Agent': USER_AGENT,
                },
                maxRedirects: 3,
                validateStatus: (status) => status === 200
            });
            updateCookies(homeResponse.headers['set-cookie']);
            console.log(`  ✅ Pre-fetched cookies: ${Object.keys(cookieJar).join(', ')}`);
        } catch (e) {
            console.log('  ⚠️ Homepage cookie pre-fetch failed/skipped.');
        }

        // Inject sessionid and user ID
        cookieJar['sessionid'] = sessionId;
        const userIdMatch = sessionId.match(/^(\d+)/);
        if (userIdMatch) {
            cookieJar['ds_user_id'] = userIdMatch[1];
        }
    }

    // 1. Get user ID from username using redirect-aware cookie request
    let profileUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    let redirectCount = 0;
    const maxRedirects = 5;
    let profileResponse = null;

    while (redirectCount < maxRedirects) {
        try {
            profileResponse = await axios.get(profileUrl, {
                headers: {
                    'User-Agent': USER_AGENT,
                    'Cookie': getCookieString(),
                    'X-IG-App-ID': '936619743392459',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': 'https://www.instagram.com/',
                },
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 400
            });

            updateCookies(profileResponse.headers['set-cookie']);

            if (profileResponse.status >= 300 && profileResponse.status < 400) {
                const nextUrl = profileResponse.headers.location;
                if (!nextUrl) throw new Error('Redirect response missing Location header');
                profileUrl = new URL(nextUrl, profileUrl).toString();
                redirectCount++;
                continue;
            }
            break;
        } catch (err) {
            if (err.response && err.response.status >= 300 && err.response.status < 400) {
                updateCookies(err.response.headers['set-cookie']);
                const nextUrl = err.response.headers.location;
                if (nextUrl) {
                    profileUrl = new URL(nextUrl, profileUrl).toString();
                    redirectCount++;
                    continue;
                }
            }
            throw err;
        }
    }

    const user = profileResponse.data && profileResponse.data.data && profileResponse.data.data.user;
    if (!user) {
        throw new Error(`Failed to find user profile info for ${username}`);
    }
    const userId = user.id;
    console.log(`  👤 Found User ID for ${username}: ${userId}`);

    // 2. Fetch Reels Media (Stories)
    const reelsUrl = `https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=${userId}`;
    const reelsResponse = await axios.get(reelsUrl, {
        headers: {
            'User-Agent': USER_AGENT,
            'Cookie': getCookieString(),
            'X-IG-App-ID': '936619743392459',
        }
    });

    const reel = reelsResponse.data && reelsResponse.data.reels && reelsResponse.data.reels[userId];
    if (!reel || !Array.isArray(reel.items)) {
        console.log('📭 No active stories found for this profile.');
        return [];
    }

    // 3. Map to standard flat format
    return reel.items.map(item => {
        const isVideo = item.media_type === 2;
        const candidates = item.image_versions2 && item.image_versions2.candidates;
        const imageUrl = candidates && candidates[0] && candidates[0].url;

        return {
            id: item.id,
            isVideo: isVideo,
            imageUrl: imageUrl,
            timestamp: item.taken_at ? new Date(item.taken_at * 1000).toISOString() : new Date().toISOString()
        };
    });
}

async function main() {
    console.log(`\n🔍 Scraping Instagram Stories: @${INSTAGRAM_HANDLE}`);
    ensureDir(DATA_DIR);

    let stories = [];

    if (INSTAGRAM_SESSION_ID) {
        // Option A: Direct Web API using session cookie (Free)
        try {
            stories = await fetchStoriesViaSessionCookie(INSTAGRAM_HANDLE, INSTAGRAM_SESSION_ID);
            console.log(`✅ Direct API fetched ${stories.length} stories.`);
        } catch (err) {
            console.error('❌ Direct Instagram API fetch failed:', err.message);
            process.exit(1);
        }
    } else if (APIFY_API_TOKEN) {
        // Option B: Apify API (Paid/Fallback)
        console.log('📡 Calling Apify Story Scraper...');
        const apifyUrl = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;
        
        const input = {
            usernames: [INSTAGRAM_HANDLE]
        };

        try {
            const response = await axios.post(apifyUrl, input, { timeout: 120000 });
            stories = response.data;
            console.log(`✅ Apify fetched ${stories.length} stories.`);
        } catch (err) {
            console.error('❌ Failed to fetch stories from Apify API:', err.message);
            process.exit(0); // Exit gracefully to prevent CI workflow breaks
        }
    } else {
        console.warn('⚠️ Neither INSTAGRAM_SESSION_ID nor APIFY_API_TOKEN environment variable is set. Scraper skipped.');
        process.exit(0);
    }

    if (!Array.isArray(stories) || stories.length === 0) {
        console.log('📭 No active stories found.');
        process.exit(0);
    }

    // Process each story
    const newStoryEvents = [];
    for (const story of stories) {
        // Skip videos or stories without an image URL
        const isVideo = story.isVideo || story.type === 'video';
        const imageUrl = story.imageUrl || story.displayUrl;
        const storyId = story.id;
        const timestamp = story.timestamp || new Date().toISOString();

        if (!imageUrl || isVideo) {
            console.log(`⏭️ Skipping video/empty story: ${storyId}`);
            continue;
        }

        if (BLACKLISTED_POSTS.includes(storyId)) {
            console.log(`Processing story: ${storyId} -> 🚫 Skipped (Blacklisted)`);
            continue;
        }
        console.log(`Processing story: ${storyId}`);

        // 1. Download flyer image
        const downloadResult = await downloadStoryImage(imageUrl, storyId);
        if (!downloadResult) continue;

        // 2. Perform OCR on the image
        const extractedText = await performOCR(downloadResult.filepath);
        if (!extractedText.trim() || extractedText.length < 15) {
            console.warn(`  ⚠️ Insufficient text detected in story image ${storyId}. Skipping non-flyer picture.`);
            if (fs.existsSync(downloadResult.filepath)) {
                try { fs.unlinkSync(downloadResult.filepath); } catch (_) {}
            }
            continue;
        }

        console.log(`  📝 OCR Scanned Text:\n--------------------\n${extractedText.trim()}\n--------------------`);

        // 3. Parse text using caption parser
        const parsed = parseCaption(extractedText, timestamp);
        if (!parsed.date) {
            console.warn(`  ⚠️ No event date found in story OCR text. Skipping non-flyer picture.`);
            if (fs.existsSync(downloadResult.filepath)) {
                try { fs.unlinkSync(downloadResult.filepath); } catch (_) {}
            }
            continue;
        }

        newStoryEvents.push({
            title: parsed.title || 'STORY EVENT',
            date: parsed.date || 'DATE PENDING',
            time: parsed.time || '',
            description: parsed.description || 'Scanned from Instagram story flyer.',
            image: downloadResult.relativePath,
            instagramUrl: `https://www.instagram.com/stories/${INSTAGRAM_HANDLE}/`,
            scrapedAt: new Date().toISOString()
        });
    }

    if (newStoryEvents.length === 0) {
        console.log('✅ No new events created from stories.');
        process.exit(0);
    }

    // Load existing events to merge
    let existingEvents = [];
    if (fs.existsSync(EVENTS_JSON)) {
        try {
            existingEvents = JSON.parse(fs.readFileSync(EVENTS_JSON, 'utf-8'));
        } catch (e) {
            console.log('⚠️ Could not parse existing events.json');
        }
    }

    // Merge new events with existing events (avoiding duplicates based on title and date)
    const mergedEvents = [...existingEvents];
    for (const storyEvent of newStoryEvents) {
        const isDuplicate = mergedEvents.some(e => {
            const sameDate = e.date === storyEvent.date;
            const sameTitle = e.title.toLowerCase().trim() === storyEvent.title.toLowerCase().trim();
            return sameDate && (sameTitle || storyEvent.title === 'STORY EVENT');
        });
        if (!isDuplicate) {
            mergedEvents.push(storyEvent);
            console.log(`➕ Added story event: ${storyEvent.title} on ${storyEvent.date}`);
        } else {
            console.log(`⏭️ Skipped duplicate event: ${storyEvent.title} on ${storyEvent.date}`);
        }
    }

    // Now, Archive ALL events (past and future)
    let archiveEvents = [];
    if (fs.existsSync(ARCHIVE_JSON)) {
        try {
            archiveEvents = JSON.parse(fs.readFileSync(ARCHIVE_JSON, 'utf-8'));
        } catch (e) {
            console.log('⚠️  Could not parse existing events-archive.json');
        }
    }
    
    // Merge mergedEvents into archive
    const mergedArchive = [...archiveEvents];
    for (const event of mergedEvents) {
        const isDuplicate = mergedArchive.some(e => {
            return e.date === event.date && e.title.toLowerCase().trim() === event.title.toLowerCase().trim();
        });
        if (!isDuplicate) {
            mergedArchive.push(event);
        }
    }
    fs.writeFileSync(ARCHIVE_JSON, JSON.stringify(mergedArchive, null, 2));
    console.log(`✅ Archived ${mergedArchive.length} total events in data/events-archive.json`);

    // Now, Purge past events from active events list & delete their images
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const activeEvents = [];
    for (const event of mergedEvents) {
        const eventDate = parseDate(event.date);
        if (eventDate && eventDate < today) {
            // Event is in the past! Delete its image file if it exists
            if (event.image) {
                const imgPath = path.join(PROJECT_ROOT, event.image);
                if (fs.existsSync(imgPath)) {
                    try {
                        fs.unlinkSync(imgPath);
                        console.log(`  🗑️ Deleted past event flyer image: ${event.image}`);
                    } catch (err) {
                        console.error(`  ⚠️ Failed to delete past event flyer image ${event.image}: ${err.message}`);
                    }
                }
            }
            console.log(`  🗑️ Purged past event from active database: ${event.title} (${event.date})`);
        } else {
            activeEvents.push(event);
        }
    }

    // Write events.json
    fs.writeFileSync(EVENTS_JSON, JSON.stringify(activeEvents, null, 2));
    console.log(`\n✅ Wrote ${activeEvents.length} active events to data/events.json`);
}

main().catch(err => {
    console.error('💥 Fatal error:', err.message);
    process.exit(1);
});
