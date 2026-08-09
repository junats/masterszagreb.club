export const CONFIG = {
    // Verified active & upcoming scraped Instagram event flyers
    flyerImages: [
        'assests/events/post-DbodVNtI17B.jpg',
        'assests/events/post-Dbs8BJqIqBJ.jpg'
    ],
    // Authentic atmospheric nightclub photos
    clubImages: [
        'assests/club-01.webp',
        'assests/club-05.webp',
        'assests/club-06.webp',
        'assests/club-09.webp',
        'assests/club-10.webp',
        'assests/club-11.webp',
        'assests/club-12.webp',
        'assests/club-13.webp',
        'assests/club-14.webp'
    ],
    // Fallback backgroundImages property for backward compatibility
    backgroundImages: [
        'assests/events/post-DbodVNtI17B.jpg',
        'assests/events/post-Dbs8BJqIqBJ.jpg'
    ],
    // Background rotation timing in ms
    // Event flyer slides stay longer (8s) for readability; non-event club slides are shorter & punchier (2.6s)
    eventIntervalMs: 8000,
    clubIntervalMs: 2600,
    rotationIntervalMs: 7000, // fallback
    transitionDurationMs: 800,
    fadeHalfPointMs: 400,
    
    // Audio loops for reactive logo border (drop your files in assests/ and add them here)
    // All loops in this array will play simultaneously and mix together.
    audioLoops: [
        { url: 'assests/loop.mp3', volume: 1.0 }, // Increased from 0.5 to 1.0 (louder)
        // Add more tracks here to mix them in:
        // { url: 'assests/bass.mp3', volume: 0.8 },
        // { url: 'assests/synth.mp3', volume: 0.6 }
    ],

    // ── Instagram Events (scraped by GitHub Actions bot) ────────────────
    // The scraper runs on a cron schedule and commits data/events.json
    // with event data + flyer images extracted from @masters.zagreb posts.
    EVENTS_JSON_URL: 'data/events.json',

    // How long (minutes) to cache fetched events in localStorage
    EVENTS_CACHE_MINUTES: 5,

    // If true, flyer images from events are mixed into the BG slideshow
    FLYERS_IN_SLIDESHOW: true,

    // ── Google Sheets / Excel Live Price Sync ──────────────────────────
    // Whenever someone edits and saves the Google Sheet, prices update automatically.
    // Replace with your published Google Sheet CSV URL or Spreadsheet ID:
    googleSheetPricesUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_MASTERS_ZAGREB_DRINKS/pub?output=csv',
    
    // Auto-polling interval in milliseconds (30 seconds)
    sheetPollingIntervalMs: 30000,

    // ── SoundCloud Sets Rotation ───────────────────────────────────────
    // A curated list of "Masters Zagreb" or related DJ sets to cycle through.
    // The player will pick a random one on load, and use Next/Prev buttons to navigate.
    soundcloudSets: [
        'https://soundcloud.com/carlcox/carl-cox-global-episode-722',
        'https://soundcloud.com/petardundov/petar-dundov-at-dimensions',
        'https://soundcloud.com/awakenings/adam-beyer-at-awakenings-festival-2018',
        'https://soundcloud.com/drumcode/adam-beyer-live-at-awakenings'
    ]
};
