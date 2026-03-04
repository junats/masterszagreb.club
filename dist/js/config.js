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
    
    // Audio loop for reactive logo border (drop your file in assests/ and update this path)
    audioBorderLoop: 'assests/loop.mp3',

    // ── Google Sheets CMS ──────────────────────────────────────────────
    // 1. Create a Google Sheet with columns: title | date | time | description
    // 2. File → Share → Publish to web → select CSV → Publish
    // 3. Paste the published URL below
    SHEETS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSixLX4iaHIwcfqdtp4qUyLWdZKJ7ltHgzZ-VmJf4Mf9CVV3rPcLqsk9F-XgRLGUoeXi0FMJIdpOxw_/pub?output=csv',

    // How long (minutes) to cache fetched events in localStorage
    EVENTS_CACHE_MINUTES: 5
};
