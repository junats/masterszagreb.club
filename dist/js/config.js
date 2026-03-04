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

    // API URL for events (update when backend is ready)
    API_URL: 'http://localhost:3000/api/events'
};
