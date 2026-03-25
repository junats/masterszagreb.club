#!/usr/bin/env node

/**
 * scrape-instagram.js
 * 
 * Scrapes public Instagram posts from masters.zagreb and generates:
 *   - data/events.json  (structured event data)
 *   - assests/events/*   (downloaded flyer images as WebP)
 *
 * Usage:
 *   node scripts/scrape-instagram.js
 *   node scripts/scrape-instagram.js --limit 5
 *
 * Environment Variables:
 *   INSTAGRAM_HANDLE  - Override default handle (default: masters.zagreb)
 *   MAX_POSTS         - Max posts to scrape (default: 12)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { parseCaption } = require('./parse-caption');

// ── Configuration ─────────────────────────────────────────────────────
const INSTAGRAM_HANDLE = process.env.INSTAGRAM_HANDLE || 'masters.zagreb';
const MAX_POSTS = parseInt(process.env.MAX_POSTS || '12', 10);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const EVENTS_JSON = path.join(DATA_DIR, 'events.json');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'assests', 'events');

// User-Agent to mimic a real browser
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// ── Helpers ───────────────────────────────────────────────────────────

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
}

/**
 * Make an HTTPS GET request and return the response body as a string.
 */
function fetchUrl(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const requester = parsedUrl.protocol === 'https:' ? https : http;

        const reqOptions = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': options.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity',
                'Cache-Control': 'no-cache',
                ...(options.headers || {}),
            },
        };

        const req = requester.request(reqOptions, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location, options).then(resolve).catch(reject);
            }

            if (res.statusCode !== 200) {
                // Consume response to free up socket
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
 * Download an image and save it locally. Returns the relative path.
 */
async function downloadImage(imageUrl, postId) {
    ensureDir(IMAGES_DIR);

    const ext = 'jpg'; // Instagram serves JPEG by default
    const filename = `post-${postId}.${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);
    const relativePath = `assests/events/${filename}`;

    // Skip if already downloaded
    if (fs.existsSync(filepath)) {
        console.log(`  ⏭️  Image already exists: ${filename}`);
        return relativePath;
    }

    try {
        const buffer = await fetchUrl(imageUrl, {
            accept: 'image/webp,image/jpeg,image/png,*/*',
        });
        fs.writeFileSync(filepath, buffer);
        console.log(`  📸 Downloaded: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
        return relativePath;
    } catch (err) {
        console.error(`  ❌ Failed to download image for ${postId}: ${err.message}`);
        return null;
    }
}

// ── Instagram Scraping Strategies ─────────────────────────────────────

/**
 * Strategy 1: Fetch via the GraphQL profile endpoint.
 * Instagram exposes a public JSON endpoint for profiles.
 */
async function fetchViaGraphQL() {
    console.log('📡 Trying GraphQL approach...');

    // First, get the profile page to extract user ID and other metadata
    const profileUrl = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;
    const html = await fetchUrl(profileUrl);
    const htmlStr = html.toString('utf-8');

    // Try to find the shared_data JSON embedded in the page
    let userData = null;

    // Method A: Look for window._sharedData
    const sharedDataMatch = htmlStr.match(/window\._sharedData\s*=\s*({.+?});\s*<\/script>/);
    if (sharedDataMatch) {
        try {
            const sharedData = JSON.parse(sharedDataMatch[1]);
            userData = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
        } catch (e) {
            console.log('  ⚠️  Could not parse _sharedData');
        }
    }

    // Method B: Look for __additionalData or similar embedded JSON
    if (!userData) {
        const additionalMatch = htmlStr.match(/"user":\s*({[^}]*"edge_owner_to_timeline_media"[^]*?})\s*[,}]/);
        if (additionalMatch) {
            try {
                // This is tricky — we need to find the right JSON boundary
                userData = JSON.parse(additionalMatch[1]);
            } catch (e) {
                // Continue to next strategy
            }
        }
    }

    // Method C: Look for any JSON blob with timeline media
    if (!userData) {
        const jsonBlobMatch = htmlStr.match(/"edge_owner_to_timeline_media"\s*:\s*({.+?})\s*,"edge_saved_media"/);
        if (jsonBlobMatch) {
            try {
                const mediaData = JSON.parse(jsonBlobMatch[1]);
                return extractPostsFromEdges(mediaData.edges || []);
            } catch (e) {
                // Continue
            }
        }
    }

    if (userData && userData.edge_owner_to_timeline_media) {
        return extractPostsFromEdges(userData.edge_owner_to_timeline_media.edges);
    }

    throw new Error('GraphQL approach failed — no user data found in HTML');
}

/**
 * Strategy 2: Try the ?__a=1&__d=dis API endpoint
 */
async function fetchViaWebAPI() {
    console.log('📡 Trying Web API approach...');
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${INSTAGRAM_HANDLE}`;

    const buffer = await fetchUrl(url, {
        accept: 'application/json',
        headers: {
            'X-IG-App-ID': '936619743392459',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    const data = JSON.parse(buffer.toString('utf-8'));
    const user = data?.data?.user;

    if (!user || !user.edge_owner_to_timeline_media) {
        throw new Error('Web API returned no media data');
    }

    return extractPostsFromEdges(user.edge_owner_to_timeline_media.edges);
}

/**
 * Strategy 3: Parse HTML page for meta tags and embedded post data
 */
async function fetchViaHTMLParsing() {
    console.log('📡 Trying HTML parsing approach...');

    const profileUrl = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;
    const html = await fetchUrl(profileUrl);
    const htmlStr = html.toString('utf-8');

    const posts = [];

    // Look for all script tags with type="application/json" or embedded JSON
    const scriptMatches = htmlStr.matchAll(/<script[^>]*>([^<]*edge_owner_to_timeline_media[^<]*)<\/script>/g);
    for (const match of scriptMatches) {
        try {
            const json = JSON.parse(match[1]);
            const edges = findEdgesInObject(json);
            if (edges && edges.length > 0) {
                return extractPostsFromEdges(edges);
            }
        } catch (e) {
            continue;
        }
    }

    // Fallback: look for require("ScheduledServerJS").handle calls with media data
    const handleMatches = htmlStr.matchAll(/handle\(({[^]*?edge_owner_to_timeline_media[^]*?})\)/g);
    for (const match of handleMatches) {
        try {
            // This is a rough parse — might need adjustment
            const json = JSON.parse(match[1]);
            const edges = findEdgesInObject(json);
            if (edges && edges.length > 0) {
                return extractPostsFromEdges(edges);
            }
        } catch (e) {
            continue;
        }
    }

    throw new Error('HTML parsing found no post data');
}

/**
 * Recursively find edge_owner_to_timeline_media.edges in a nested object.
 */
function findEdgesInObject(obj, depth = 0) {
    if (depth > 10 || !obj || typeof obj !== 'object') return null;

    if (obj.edge_owner_to_timeline_media && Array.isArray(obj.edge_owner_to_timeline_media.edges)) {
        return obj.edge_owner_to_timeline_media.edges;
    }

    for (const key of Object.keys(obj)) {
        const result = findEdgesInObject(obj[key], depth + 1);
        if (result) return result;
    }

    return null;
}

/**
 * Extract raw post data from GraphQL edge objects.
 */
function extractPostsFromEdges(edges) {
    return edges.slice(0, MAX_POSTS).map(edge => {
        const node = edge.node;
        return {
            id: node.shortcode || node.id,
            caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
            imageUrl: node.display_url || node.thumbnail_src || '',
            thumbnailUrl: node.thumbnail_src || node.display_url || '',
            timestamp: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toISOString() : new Date().toISOString(),
            isVideo: node.is_video || false,
            likes: node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0,
            postUrl: `https://www.instagram.com/p/${node.shortcode}/`,
        };
    });
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n🔍 Scraping Instagram: @${INSTAGRAM_HANDLE}`);
    console.log(`   Max posts: ${MAX_POSTS}\n`);

    ensureDir(DATA_DIR);

    // Try each strategy in order
    let rawPosts = null;
    const strategies = [fetchViaWebAPI, fetchViaGraphQL, fetchViaHTMLParsing];

    for (const strategy of strategies) {
        try {
            rawPosts = await strategy();
            if (rawPosts && rawPosts.length > 0) {
                console.log(`✅ Found ${rawPosts.length} posts\n`);
                break;
            }
        } catch (err) {
            console.log(`  ⚠️  ${err.message}\n`);
        }
    }

    if (!rawPosts || rawPosts.length === 0) {
        console.error('❌ All scraping strategies failed. Keeping existing data.');
        process.exit(1);
    }

    // Process posts into events
    const events = [];
    for (const post of rawPosts) {
        console.log(`Processing: ${post.id}`);

        // Parse caption into structured event data
        const parsed = parseCaption(post.caption, post.timestamp);

        // Download flyer image
        let imagePath = null;
        if (post.imageUrl && !post.isVideo) {
            imagePath = await downloadImage(post.imageUrl, post.id);
        }

        events.push({
            title: parsed.title,
            date: parsed.date,
            time: parsed.time,
            description: parsed.description,
            image: imagePath,
            instagramUrl: post.postUrl,
            scrapedAt: new Date().toISOString(),
        });
    }

    // Load existing events to merge (preserve manually edited ones)
    let existingEvents = [];
    if (fs.existsSync(EVENTS_JSON)) {
        try {
            existingEvents = JSON.parse(fs.readFileSync(EVENTS_JSON, 'utf-8'));
        } catch (e) {
            console.log('⚠️  Could not parse existing events.json, overwriting');
        }
    }

    // Write events.json
    fs.writeFileSync(EVENTS_JSON, JSON.stringify(events, null, 2));
    console.log(`\n✅ Wrote ${events.length} events to data/events.json`);

    // Summary
    const withImages = events.filter(e => e.image).length;
    const withDates = events.filter(e => e.date).length;
    console.log(`   📸 ${withImages} with images`);
    console.log(`   📅 ${withDates} with parsed dates`);
    console.log(`\n🎉 Done!\n`);
}

main().catch(err => {
    console.error('💥 Fatal error:', err.message);
    process.exit(1);
});
