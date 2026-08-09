import { BackgroundRotator } from './background-rotator.js';
import { BackgroundRevealSystem } from './background-reveal.js';
import { MatrixEventManager } from './matrix-events.js';
import { BackgroundEffect } from './bg-effect.js';
import { CONFIG } from './config.js';
import { SoundCloudManager } from './soundcloud.js'; // Added import

window.addEventListener('DOMContentLoaded', () => {
    console.log('MASTERS system initialized...');

    // Initialize Background Rotator
    const bgRotator = new BackgroundRotator();
    bgRotator.start();

    // Initialize Reveal System
    const revealSystem = new BackgroundRevealSystem();
    revealSystem.init();

    // Matrix Events (scraped from Instagram @masters.zagreb)
    const matrixEvents = new MatrixEventManager();

    // Load flyer images into background slideshow: last 3 events and next 3 events
    const parseDateString = (dateString, fallbackTimestamp) => {
        if (dateString && dateString !== 'DATE PENDING' && dateString !== 'TBC') {
            const dotParts = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
            if (dotParts) {
                return new Date(parseInt(dotParts[3], 10), parseInt(dotParts[2], 10) - 1, parseInt(dotParts[1], 10));
            }
            const isoParts = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (isoParts) {
                return new Date(parseInt(isoParts[1], 10), parseInt(isoParts[2], 10) - 1, parseInt(isoParts[3], 10));
            }
            const fallback = new Date(dateString);
            if (!isNaN(fallback.getTime())) return fallback;
        }
        if (fallbackTimestamp) {
            const fbDate = new Date(fallbackTimestamp);
            if (!isNaN(fbDate.getTime())) return fbDate;
        }
        return null;
    };

    Promise.allSettled([
        fetch(`data/events.json?t=${Date.now()}`),
        fetch(`data/events-archive.json?t=${Date.now()}`)
    ])
        .then(async ([activeRes, archiveRes]) => {
            const activeEvents = (activeRes.status === 'fulfilled' && activeRes.value.ok)
                ? await activeRes.value.json()
                : [];
            const archiveEvents = (archiveRes.status === 'fulfilled' && archiveRes.value.ok)
                ? await archiveRes.value.json()
                : [];

            // Combine and deduplicate
            const pool = [];
            const seen = new Set();
            for (const item of [...activeEvents, ...archiveEvents]) {
                if (!item || !item.image || typeof item.image !== 'string') continue;
                // Only use valid flyer image files (not club photos)
                if (item.image.includes('club-')) continue;

                const key = item.id || item.image || (item.title + item.date);
                if (!seen.has(key)) {
                    seen.add(key);
                    pool.push(item);
                }
            }

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

            // Separate past events and upcoming events
            const pastEvents = [];
            const upcomingEvents = [];

            pool.forEach(ev => {
                const dateObj = parseDateString(ev.date, ev.scrapedAt) || new Date(0);
                ev._parsedDate = dateObj;
                if (dateObj >= today) {
                    upcomingEvents.push(ev);
                } else {
                    pastEvents.push(ev);
                }
            });

            // Sort upcoming: soonest first
            upcomingEvents.sort((a, b) => a._parsedDate - b._parsedDate);

            // Sort past: most recent first
            pastEvents.sort((a, b) => b._parsedDate - a._parsedDate);

            // Select up to 3 upcoming events and up to 3 most recent past events
            let selectedUpcoming = upcomingEvents.slice(0, 3);
            let selectedPast = pastEvents.slice(0, 3);

            // If we have fewer than 3 upcoming, backfill from past events up to 6 total (or 5, 4, etc.)
            if (selectedUpcoming.length < 3) {
                const needed = 6 - selectedUpcoming.length;
                selectedPast = pastEvents.slice(0, Math.min(needed, pastEvents.length));
            } else if (selectedPast.length < 3) {
                const needed = 6 - selectedPast.length;
                selectedUpcoming = upcomingEvents.slice(0, Math.min(needed, upcomingEvents.length));
            }

            // Arrange chronologically: [older past -> recent past -> soonest upcoming -> future upcoming]
            const chronologicalList = [
                ...selectedPast.reverse(),
                ...selectedUpcoming
            ];

            const flyerImages = chronologicalList.map(e => e.image);

            if (flyerImages.length > 0) {
                bgRotator.setFlyerImages(flyerImages);
            }
        })
        .catch(err => {
            console.warn('Events loading for slideshow warning:', err.message);
        });

    // Audio-Reactive Logo Border functionality has been completely removed as per Phase 9.

    // Initialize SoundCloud Manager (COMMENTED OUT FOR NOW)
    // const scManager = new SoundCloudManager(); 

    // COMMENTED OUT: Hamburger Menu Toggle (awaiting CMS)
    /*
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-links a');

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });

        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target) && (!vinylBtn || !vinylBtn.contains(e.target))) {
                hamburgerBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
            }
        });
    }
    */

    // Initialize Three.js Background Effect (from bg-effect.js) if canvas is present
    if (typeof THREE !== 'undefined' && document.getElementById('bgCanvas')) {
        const bgEffect = new BackgroundEffect('bgCanvas', CONFIG.backgroundImages[0]);
        window.bgEffect = bgEffect;
        console.log('✅ Background effect initialized!');
    }

    // ── CRT Glitch Effect — logo only using GSAP ──
    const svgLogo = document.getElementById('svgLogo');
    if (svgLogo) {
        function triggerRandomGlitch() {
            if (window.gsap) {
                const tl = window.gsap.timeline();
                tl.to(svgLogo, {
                    x: () => (Math.random() - 0.5) * 8,
                    y: () => (Math.random() - 0.5) * 6,
                    filter: 'contrast(1.8) brightness(1.5) drop-shadow(3px 0 0 rgba(255, 0, 80, 0.8)) drop-shadow(-3px 0 0 rgba(0, 255, 255, 0.8))',
                    duration: 0.08,
                    repeat: 3,
                    yoyo: true,
                    ease: 'none'
                }).to(svgLogo, {
                    x: 0,
                    y: 0,
                    filter: 'contrast(1.1) brightness(1.05)',
                    duration: 0.15,
                    ease: 'power2.out'
                });
            }

            const nextGlitch = 15000 + Math.random() * 10000;
            setTimeout(triggerRandomGlitch, nextGlitch);
        }
        setTimeout(triggerRandomGlitch, 8000);
    }
});
