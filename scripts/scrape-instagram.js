#!/usr/bin/env node

/**
 * scrape-instagram.js
 *
 * Fetches posts from the masters.zagreb Instagram account via the Apify
 * Instagram Scraper actor, filters strictly for EVENT FLYERS only (posts
 * with dates, lineups, DJ names, etc.), and saves them to:
 *   - data/events.json         (active/upcoming events)
 *   - data/events-archive.json (all-time archive)
 *   - assests/events/          (flyer images)
 *
 * Usage:
 *   node scripts/scrape-instagram.js
 *   node scripts/scrape-instagram.js --limit 30
 *
 * Required .env:
 *   APIFY_API_TOKEN   - Apify API token
 *   INSTAGRAM_HANDLE  - Instagram handle to scrape (default: masters.zagreb)
 *   MAX_POSTS         - Max posts to fetch (default: 30)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parseCaption } = require('./parse-caption');

// ── Environment Loader ─────────────────────────────────────────────────
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return;
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
loadEnv();

// ── Configuration ─────────────────────────────────────────────────────
const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const INSTAGRAM_HANDLE = process.env.INSTAGRAM_HANDLE || 'masters.zagreb';
const MAX_POSTS = parseInt(process.env.MAX_POSTS || '30', 10);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const EVENTS_JSON = path.join(DATA_DIR, 'events.json');
const ARCHIVE_JSON = path.join(DATA_DIR, 'events-archive.json');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'assests', 'events');

// Blacklisted post shortcodes
const BLACKLISTED_POSTS = ['DZFaIa6jJhP', 'DZ5aOaBoRai', 'DZngsFIInSt', 'DaN2ipGIh1l'];

// ── Flyer Detection ────────────────────────────────────────────────────
/**
 * Determines whether an Instagram post is an event flyer rather than
 * a photo of people / sports watch party / generic content.
 *
 * A post is considered a flyer when:
 *   1. It is a still image (not video/reel)
 *   2. The caption has a parseable date or strong lineup/club event keywords
 *   3. It is NOT an off-topic sports broadcast, food/restaurant promo, or casual party photo
 *
 * A post is REJECTED when:
 *   - It is a video (Reels)
 *   - The caption is empty or purely hashtags/mentions
 *   - It is a sports screening / watch party (e.g. Bok Bok)
 *   - It is merchandise or food/beverage promotion
 *   - It is a recap/photos from past night
 */
function isEventFlyer(post, parsed) {
    // Always skip videos — flyers are graphic images
    if (post.isVideo) return false;

    const caption = (post.caption || '').trim();

    // Empty caption → not a flyer
    if (!caption) return false;

    // Caption that's purely hashtags/mentions → not a flyer
    const nonTagWords = caption.replace(/#\S+/g, '').replace(/@\S+/g, '').trim();
    if (nonTagWords.length < 10) return false;

    const lc = caption.toLowerCase();

    // Skip sports / football watch party broadcasts (e.g. Bok Bok restaurant)
    const NON_CLUB_TERMS = [
        'bok bok', 'utakmic', 'nogomet', 'zmajev', 'hrvatska –', 'panama',
        'vatren', 'navijan', 'prijenos', 'prvenstv', 'okršaj', 'gledanje'
    ];
    if (NON_CLUB_TERMS.some(t => lc.includes(t))) return false;

    // Skip merchandise, food & drinks, general promos
    const MERCH_FOOD_TERMS = ['t-shirt', 'majica', 'merch', 'ćevab', 'cevabdzinic', 'hrana', 'burger'];
    if (MERCH_FOOD_TERMS.some(t => lc.includes(t))) return false;

    // Skip obvious post-event recaps ("thanks for coming", "what a night", "photos from", etc.)
    const RECAP_PHRASES = [
        'thanks for', 'thank you for', 'hvala svima', 'what a night', 'what a party',
        'dancefloor', 'dance floor', 'what an evening', 'see you next', 'see you soon',
        'photos from', 'foto', 'last night', 'prošle noći', 'galerija', 'album'
    ];
    if (RECAP_PHRASES.some(p => lc.includes(p))) return false;

    // A flyer must announce an event with music / lineup / DJ / club night info
    const EVENT_KEYWORDS = [
        'dj ', 'lineup', 'line-up', 'line up', 'b2b', 'live set', 'open format',
        'all night long', 'resident', 'curated', 'grooves', 'techno', 'house',
        'electro', 'minimal', 'records', 'vinyl', 'vinil', 'label', 'kolektiv',
        'collective', 'selektor', 'selector', 'nastup', 'tickets', 'karte',
        'free entry', 'besplatan ulaz', 'entry', 'ulaz', 'doors open', 'vrata otvaraju',
        'terrace', 'terasa', 'masters', 'tonight', 'večeras', 'sutra', 'tomorrow',
        'this friday', 'this saturday', 'this sunday', 'ovaj petak', 'ovu subotu', 'ovaj vikend'
    ];

    const hasEventKeyword = EVENT_KEYWORDS.some(kw => lc.includes(kw));

    // If parseCaption found a date AND has an event keyword -> definitely a flyer
    if (parsed.date && hasEventKeyword) return true;

    // Strong lineup / club session indicators
    const STRONG_LINEUP_KEYWORDS = [
        'b2b', 'lineup', 'line-up', 'live set', 'all night long', 'resident',
        'kolektiv', 'collective', 'selektor', 'vinila', 'vinyl'
    ];
    if (STRONG_LINEUP_KEYWORDS.some(kw => lc.includes(kw)) && (lc.includes('masters') || lc.includes('house') || lc.includes('techno') || lc.includes('terasa') || lc.includes('terrace'))) {
        return true;
    }

    // No clear event signal → skip
    return false;
}

// ── Helpers ───────────────────────────────────────────────────────────

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

function fetchBuffer(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const requester = parsedUrl.protocol === 'https:' ? https : http;
        const req = requester.request(
            {
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Accept': 'image/webp,image/jpeg,image/png,*/*',
                },
            },
            (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return fetchBuffer(res.headers.location).then(resolve).catch(reject);
                }
                if (res.statusCode !== 200) {
                    res.resume();
                    return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                }
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks)));
                res.on('error', reject);
            }
        );
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
        req.end();
    });
}

async function downloadImage(imageUrl, postId) {
    ensureDir(IMAGES_DIR);

    const filename = `post-${postId}.jpg`;
    const filepath = path.join(IMAGES_DIR, filename);
    const relativePath = `assests/events/${filename}`;

    // Also mirror to dist/ if it exists
    const distDir = path.join(PROJECT_ROOT, 'dist', 'assests', 'events');
    const distFilepath = path.join(distDir, filename);

    if (fs.existsSync(filepath)) {
        console.log(`  ⏭️  Already downloaded: ${filename}`);
        if (fs.existsSync(path.join(PROJECT_ROOT, 'dist'))) {
            ensureDir(distDir);
            if (!fs.existsSync(distFilepath)) {
                fs.copyFileSync(filepath, distFilepath);
                console.log(`  🔄 Synced to dist: ${filename}`);
            }
        }
        return relativePath;
    }

    try {
        const buffer = await fetchBuffer(imageUrl);
        fs.writeFileSync(filepath, buffer);
        console.log(`  📸 Downloaded: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);

        if (fs.existsSync(path.join(PROJECT_ROOT, 'dist'))) {
            ensureDir(distDir);
            fs.writeFileSync(distFilepath, buffer);
        }
        return relativePath;
    } catch (err) {
        console.error(`  ❌ Image download failed for ${postId}: ${err.message}`);
        return null;
    }
}

// ── Instagram Web API & Apify Scraping ─────────────────────────────────

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Fetch timeline posts directly from Instagram Web API using session cookies.
 * Extremely fast (< 1s), extracts carousels/sidecars, and always returns up-to-date posts.
 */
async function fetchViaDirectWebAPI() {
    const cookies = process.env.INSTAGRAM_COOKIES;
    const sessionId = process.env.INSTAGRAM_SESSION_ID;
    if (!cookies && !sessionId) {
        throw new Error('No Instagram cookies/session available for direct Web API');
    }

    console.log(`📡 Fetching timeline directly via Instagram Web API (@${INSTAGRAM_HANDLE})...`);
    const cookieHeader = cookies || `sessionid=${sessionId}`;
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${INSTAGRAM_HANDLE}`;

    const res = await axios.get(url, {
        headers: {
            'User-Agent': USER_AGENT,
            'Cookie': cookieHeader,
            'X-IG-App-ID': '936619743392459',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://www.instagram.com/'
        },
        timeout: 15000
    });

    const user = res.data?.data?.user;
    if (!user) throw new Error('User profile data missing in Instagram response');

    const edges = user.edge_owner_to_timeline_media?.edges || [];
    console.log(`✅ Direct Instagram API returned ${edges.length} timeline posts\n`);

    const posts = [];
    for (const edge of edges) {
        const node = edge.node;
        const caption = node.edge_media_to_caption?.edges[0]?.node?.text || '';
        const isVideo = node.is_video || node.__typename === 'GraphVideo';
        const shortcode = node.shortcode || node.id;
        const timestamp = node.taken_at_timestamp 
            ? new Date(node.taken_at_timestamp * 1000).toISOString()
            : new Date().toISOString();

        // Check if this post is a carousel with multiple slides
        const sidecarChildren = node.edge_sidecar_to_children?.edges || [];
        if (sidecarChildren.length > 1) {
            // Find the best flyer slide (prefer graphic flyers over portraits)
            for (let i = 0; i < sidecarChildren.length; i++) {
                const child = sidecarChildren[i].node;
                const childUrl = child.display_url || child.thumbnail_src;
                if (childUrl) {
                    posts.push({
                        id: `${shortcode}_s${i+1}`,
                        shortcode: shortcode,
                        caption: caption,
                        imageUrl: childUrl,
                        timestamp: timestamp,
                        isVideo: child.is_video || false,
                        postUrl: `https://www.instagram.com/p/${shortcode}/`,
                        isSlide: true
                    });
                }
            }
        } else {
            const displayUrl = node.display_url || node.thumbnail_src || '';
            posts.push({
                id: shortcode,
                shortcode: shortcode,
                caption: caption,
                imageUrl: displayUrl,
                timestamp: timestamp,
                isVideo: isVideo,
                postUrl: `https://www.instagram.com/p/${shortcode}/`
            });
        }
    }

    return posts;
}

/**
 * Fallback: Fetch posts from masters.zagreb using Apify Instagram Scraper actor.
 */
async function fetchViaApify() {
    if (!APIFY_TOKEN) {
        throw new Error('APIFY_API_TOKEN is not set in .env');
    }

    console.log('📡 Calling Apify Instagram Scraper fallback...');
    console.log(`   Profile: https://www.instagram.com/${INSTAGRAM_HANDLE}/`);
    console.log(`   Limit:   ${MAX_POSTS} posts\n`);

    const url = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

    const input = {
        directUrls: [`https://www.instagram.com/${INSTAGRAM_HANDLE}/`],
        resultsType: 'posts',
        resultsLimit: MAX_POSTS,
    };

    const response = await axios.post(url, input, {
        timeout: 180000,
        headers: { 'Content-Type': 'application/json' },
    });

    const items = response.data;
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Apify returned no items');
    }

    console.log(`✅ Apify returned ${items.length} posts\n`);

    return items.map(item => ({
        id: item.shortCode || item.id || String(item.timestamp),
        caption: item.caption || item.alt || '',
        imageUrl: item.displayUrl || item.imageUrl || '',
        timestamp: item.timestamp || new Date().toISOString(),
        isVideo: item.isVideo || item.type === 'Video' || false,
        postUrl: item.url || `https://www.instagram.com/p/${item.shortCode}/`,
    }));
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n🎉 Masters Zagreb — Instagram Event Scraper`);
    console.log(`   Account: @${INSTAGRAM_HANDLE}`);
    console.log(`   Max posts: ${MAX_POSTS}\n`);

    ensureDir(DATA_DIR);
    ensureDir(IMAGES_DIR);

    // Fetch posts: try direct Web API first, fallback to Apify
    let rawPosts;
    try {
        rawPosts = await fetchViaDirectWebAPI();
    } catch (err) {
        console.warn(`⚠️ Direct Web API failed (${err.message}). Trying Apify...`);
        try {
            rawPosts = await fetchViaApify();
        } catch (apifyErr) {
            console.error(`❌ Apify fetch failed: ${apifyErr.message}`);
            console.warn('⚠️ Keeping existing data unchanged.');
            process.exit(0);
        }
    }

    // Process: parse captions and filter for event flyers only
    const events = [];
    let skippedBlacklist = 0;
    let skippedNotFlyer = 0;
    let skippedVideo = 0;

    for (const post of rawPosts) {
        // Skip blacklisted posts
        if (BLACKLISTED_POSTS.includes(post.id)) {
            console.log(`  🚫 Blacklisted: ${post.id}`);
            skippedBlacklist++;
            continue;
        }

        // Parse caption
        const parsed = parseCaption(post.caption, post.timestamp);

        // Filter: only event flyers
        if (!isEventFlyer(post, parsed)) {
            if (post.isVideo) {
                console.log(`  🎬 Skipped video: ${post.id}`);
                skippedVideo++;
            } else {
                console.log(`  🙅 Not a flyer: ${post.id} — "${(post.caption || '').slice(0, 60).replace(/\n/g, ' ')}…"`);
                skippedNotFlyer++;
            }
            continue;
        }

        console.log(`  ✅ Event flyer: ${post.id} — ${parsed.date || '(date TBD)'} — ${parsed.title}`);

        // Download flyer image (works for both photos and videos — Apify always provides displayUrl)
        let imagePath = null;
        if (post.imageUrl) {
            imagePath = await downloadImage(post.imageUrl, post.id);
        }

        events.push({
            title: parsed.title,
            date: parsed.date || '',
            time: parsed.time,
            description: parsed.description,
            image: imagePath,
            instagramUrl: post.postUrl,
            scrapedAt: new Date().toISOString(),
        });
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Event flyers found: ${events.length}`);
    console.log(`   🙅 Non-flyers skipped: ${skippedNotFlyer}`);
    console.log(`   🎬 Videos skipped:     ${skippedVideo}`);
    console.log(`   🚫 Blacklisted:        ${skippedBlacklist}\n`);

    if (events.length === 0) {
        console.warn('⚠️  No event flyers found. Keeping existing data unchanged.');
        process.exit(0);
    }

    // ── Archive all events (past and future) ──────────────────────────
    let archiveEvents = [];
    if (fs.existsSync(ARCHIVE_JSON)) {
        try {
            archiveEvents = JSON.parse(fs.readFileSync(ARCHIVE_JSON, 'utf-8'));
        } catch (e) {
            console.log('⚠️  Could not parse existing events-archive.json');
        }
    }

    const mergedArchive = [...archiveEvents];
    for (const event of events) {
        const isDuplicate = mergedArchive.some(e =>
            (e.date && e.date === event.date) ||
            (e.title && e.title.toLowerCase().trim() === event.title.toLowerCase().trim())
        );
        if (!isDuplicate) {
            mergedArchive.push(event);
        }
    }
    fs.writeFileSync(ARCHIVE_JSON, JSON.stringify(mergedArchive, null, 2));
    console.log(`✅ Archive: ${mergedArchive.length} total events → data/events-archive.json`);

    // ── Filter strictly for active/upcoming events (>= today) ───────────
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Load existing events only if they have future/today dates
    let existingEvents = [];
    if (fs.existsSync(EVENTS_JSON)) {
        try {
            existingEvents = JSON.parse(fs.readFileSync(EVENTS_JSON, 'utf-8'));
        } catch (e) {
            console.log('⚠️  Could not parse existing events.json');
        }
    }

    const allEventsPool = [...events];
    for (const existing of existingEvents) {
        const isDuplicate = allEventsPool.some(e =>
            (e.date && e.date === existing.date) ||
            (e.title && e.title.toLowerCase().trim() === existing.title.toLowerCase().trim())
        );
        if (!isDuplicate) {
            allEventsPool.push(existing);
        }
    }

    const activeEvents = [];
    for (const event of allEventsPool) {
        const eventDate = parseDate(event.date);

        // Keep strictly active and upcoming events (on or after today)
        if (eventDate && eventDate >= today) {
            activeEvents.push(event);
            console.log(`  🟢 Active/Upcoming event: ${event.title} (${event.date})`);
        } else {
            console.log(`  🗑️  Purged past/expired event: ${event.title} (${event.date || 'no date'})`);
        }
    }

    // Sort active events chronologically by date
    activeEvents.sort((a, b) => {
        const dA = parseDate(a.date) || new Date(0);
        const dB = parseDate(b.date) || new Date(0);
        return dA - dB;
    });

    // ── Write events.json ──────────────────────────────────────────────
    fs.writeFileSync(EVENTS_JSON, JSON.stringify(activeEvents, null, 2));
    console.log(`✅ Active & upcoming events: ${activeEvents.length} → data/events.json`);

    const withImages = activeEvents.filter(e => e.image).length;
    console.log(`   📸 ${withImages} with flyer images`);
    console.log(`\n🎉 Done!\n`);
}

main().catch(err => {
    console.error('💥 Fatal error:', err.message);
    process.exit(1);
});
