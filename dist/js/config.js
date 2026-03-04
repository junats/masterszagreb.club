// Configuration and Constants

export const CONFIG = {
    // Array of new background images from the assests folder
    backgroundImages: [
        'assests/club-01.webp',
        'assests/club-04.webp',
        'assests/club-05.webp',
        'assests/club-06.webp',
        'assests/club-07.webp',
        'assests/club-08.webp',
        'assests/club-09.webp',
        'assests/club-10.webp',
        'assests/club-11.webp',
        'assests/club-12.webp',
        'assests/club-12a.webp',
        'assests/club-13.webp',
        'assests/club-14.webp'
    ],
    // Background rotation timing in ms
    rotationIntervalMs: 8000,
    transitionDurationMs: 1000,
    fadeHalfPointMs: 500,
    
    // Audio loops for reactive logo border (drop your files in assests/ and add them here)
    // All loops in this array will play simultaneously and mix together.
    audioLoops: [
        { url: 'assests/loop.mp3', volume: 1.0 }, // Increased from 0.5 to 1.0 (louder)
        // Add more tracks here to mix them in:
        // { url: 'assests/bass.mp3', volume: 0.8 },
        // { url: 'assests/synth.mp3', volume: 0.6 }
    ],

    // ── Google Sheets CMS ──────────────────────────────────────────────
    // 1. Create a Google Sheet with columns: title | date | time | description
    // 2. File → Share → Publish to web → select CSV → Publish
    // 3. Paste the published URL below
    SHEETS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSixLX4iaHIwcfqdtp4qUyLWdZKJ7ltHgzZ-VmJf4Mf9CVV3rPcLqsk9F-XgRLGUoeXi0FMJIdpOxw_/pub?output=csv',

    // How long (minutes) to cache fetched events in localStorage
    EVENTS_CACHE_MINUTES: 5,

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
