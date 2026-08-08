#!/usr/bin/env node

/**
 * instagram-auth.js
 * 
 * Verifies that the Instagram Session ID in .env works.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ── Environment Loader ────────────────────────────────────────────────
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

const INSTAGRAM_HANDLE = process.env.INSTAGRAM_HANDLE || 'masters.zagreb';
const INSTAGRAM_SESSION_ID = process.env.INSTAGRAM_SESSION_ID;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function testAuth() {
    console.log('🔍 Testing Instagram Authentication Setup...');
    console.log(`👤 Target Handle: @${INSTAGRAM_HANDLE}`);
    
    const FULL_COOKIES = process.env.INSTAGRAM_COOKIES;
    if (FULL_COOKIES) {
        console.log('🔑 Using full Cookie string from INSTAGRAM_COOKIES environment variable.');
    } else {
        console.log(`🔑 INSTAGRAM_SESSION_ID length: ${INSTAGRAM_SESSION_ID ? INSTAGRAM_SESSION_ID.length : 0}`);
    }
    console.log(`👤 INSTAGRAM_USER defined: ${process.env.INSTAGRAM_USER ? 'Yes' : 'No'}`);
    console.log(`🔒 INSTAGRAM_PASS defined: ${process.env.INSTAGRAM_PASS ? 'Yes' : 'No'}`);

    if ((!INSTAGRAM_SESSION_ID || INSTAGRAM_SESSION_ID.trim() === '') && (!FULL_COOKIES || FULL_COOKIES.trim() === '')) {
        console.error('❌ Error: Neither INSTAGRAM_SESSION_ID nor INSTAGRAM_COOKIES is configured in your .env file.');
        process.exit(1);
    }

    // Keep track of cookies in a local object (mimicking a cookie jar)
    const cookieJar = {};

    function getCookieString() {
        if (FULL_COOKIES) return FULL_COOKIES;
        return Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
    }

    function updateCookies(setCookieHeaders) {
        if (FULL_COOKIES || !setCookieHeaders) return;
        setCookieHeaders.forEach(cookieStr => {
            const parts = cookieStr.split(';')[0].split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim();
                cookieJar[key] = val;
            }
        });
    }

    // Visit homepage to gather cookies only if we don't have full cookies already
    if (!FULL_COOKIES && INSTAGRAM_SESSION_ID) {
        try {
            console.log('📡 Accessing Instagram homepage to collect system cookies...');
            const homeResponse = await axios.get('https://www.instagram.com/', {
                headers: {
                    'User-Agent': USER_AGENT,
                },
                maxRedirects: 3,
                validateStatus: (status) => status === 200
            });
            updateCookies(homeResponse.headers['set-cookie']);
            console.log(`  ✅ Collected system cookies: ${Object.keys(cookieJar).join(', ')}`);
        } catch (e) {
            console.log('  ⚠️ Homepage cookie pre-fetch failed/skipped, proceeding anyway...');
        }

        // Inject sessionid and extract ds_user_id
        cookieJar['sessionid'] = INSTAGRAM_SESSION_ID;
        const userIdMatch = INSTAGRAM_SESSION_ID.match(/^(\d+)/);
        if (userIdMatch) {
            cookieJar['ds_user_id'] = userIdMatch[1];
            console.log(`  🔑 Extracted User ID from session: ${userIdMatch[1]}`);
        }
    }

    let url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${INSTAGRAM_HANDLE}`;
    let redirectCount = 0;
    const maxRedirects = 5;

    while (redirectCount < maxRedirects) {
        try {
            console.log(`📡 Fetching (redirects: ${redirectCount})...`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': USER_AGENT,
                    'Cookie': getCookieString(),
                    'X-IG-App-ID': '936619743392459',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': 'https://www.instagram.com/',
                },
                maxRedirects: 0, // We handle redirects manually to pass cookies
                validateStatus: (status) => status >= 200 && status < 400
            });

            // If we get set-cookie headers, save them
            updateCookies(response.headers['set-cookie']);

            if (response.status >= 300 && response.status < 400) {
                const nextUrl = response.headers.location;
                if (!nextUrl) {
                    throw new Error(`Redirect response status ${response.status} missing Location header`);
                }
                console.log(`  ↪️ Redirected to: ${nextUrl}`);
                url = new URL(nextUrl, url).toString();
                redirectCount++;
                continue;
            }

            // Successful 200 response
            const user = response.data && response.data.data && response.data.data.user;
            if (user) {
                console.log(`\n✅ Success! Connected to profile: @${user.username}`);
                console.log(`🆔 User ID: ${user.id}`);
                console.log(`📝 Full Name: ${user.full_name || 'N/A'}`);
                console.log(`👥 Follower Count: ${user.edge_followed_by ? user.edge_followed_by.count : 'N/A'}`);
                return;
            } else {
                console.error('\n❌ Failed to retrieve user details. Response structure was unexpected.');
                console.log('Diagnostic Info:');
                console.log(`- Response status: ${response.status}`);
                console.log(`- Response type: ${typeof response.data}`);
                if (response.data && typeof response.data === 'object') {
                    console.log(`- Response keys: ${Object.keys(response.data).join(', ')}`);
                    console.log(`- Response JSON stringified (first 200 chars): ${JSON.stringify(response.data).substring(0, 200)}`);
                } else {
                    console.log(`- Response snippet (first 200 chars): "${String(response.data).substring(0, 200)}"`);
                }
                process.exit(1);
            }

        } catch (err) {
            // Check if axios rejected due to 3xx redirection
            if (err.response && err.response.status >= 300 && err.response.status < 400) {
                updateCookies(err.response.headers['set-cookie']);
                const nextUrl = err.response.headers.location;
                if (nextUrl) {
                    console.log(`  ↪️ Redirected to: ${nextUrl}`);
                    url = new URL(nextUrl, url).toString();
                    redirectCount++;
                    continue;
                }
            }
            console.error('\n❌ Authentication check failed:', err.message);
            if (err.response) {
                console.log(`- Status: ${err.response.status}`);
                console.log(`- Headers: ${JSON.stringify(err.response.headers, null, 2)}`);
            }
            process.exit(1);
        }
    }

    console.error(`\n❌ Exceeded maximum redirects (${maxRedirects}).`);
    process.exit(1);
}

testAuth();
