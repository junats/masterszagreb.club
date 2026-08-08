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

    // Load flyer images into background slideshow strictly for active & upcoming events (>= today)
    if (CONFIG.EVENTS_JSON_URL) {
        const parseDateString = (dateString) => {
            if (!dateString || dateString === 'DATE PENDING' || dateString === 'TBC') return null;
            const dotParts = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
            if (dotParts) {
                return new Date(parseInt(dotParts[3], 10), parseInt(dotParts[2], 10) - 1, parseInt(dotParts[1], 10));
            }
            const isoParts = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (isoParts) {
                return new Date(parseInt(isoParts[1], 10), parseInt(isoParts[2], 10) - 1, parseInt(isoParts[3], 10));
            }
            const fallback = new Date(dateString);
            return isNaN(fallback.getTime()) ? null : fallback;
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        fetch(CONFIG.EVENTS_JSON_URL)
            .then(res => res.ok ? res.json() : [])
            .then(events => {
                if (Array.isArray(events)) {
                    // Extract strictly valid active & upcoming flyer image paths
                    const activeFlyers = events
                        .filter(e => {
                            if (!e.image || typeof e.image !== 'string') return false;
                            const eDate = parseDateString(e.date);
                            if (!eDate) return false;
                            return eDate >= today;
                        })
                        .map(e => e.image);

                    if (activeFlyers.length > 0) {
                        bgRotator.setFlyerImages(activeFlyers);
                    }
                }
            })
            .catch(err => {
                console.warn('Events JSON load error:', err.message);
            });
    }

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

    // ── CRT Glitch Effect — logo only ──
    const svgLogo = document.getElementById('svgLogo');
    if (svgLogo) {
        function triggerRandomGlitch() {
            svgLogo.classList.add('glitch');
            setTimeout(() => {
                svgLogo.classList.remove('glitch');
            }, 800);

            const nextGlitch = 15000 + Math.random() * 10000;
            setTimeout(triggerRandomGlitch, nextGlitch);
        }
        setTimeout(triggerRandomGlitch, 8000);
    }

    // (Stickman logic successfully removed)
});
