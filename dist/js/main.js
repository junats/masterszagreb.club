import { BackgroundRotator } from './background-rotator.js';
import { BackgroundRevealSystem } from './background-reveal.js';
import { MatrixEventManager } from './matrix-events.js';
import { AudioBorder } from './audio-border.js';
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

    // Matrix Events (Google Sheets CMS)
    const matrixEvents = new MatrixEventManager();

    // Initialize Audio-Reactive Logo Border
    const audioBorder = new AudioBorder();
    audioBorder.init();

    // Initialize SoundCloud Manager
    const scManager = new SoundCloudManager(); // Added initialization

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

    // Random CRT TV glitch effect for logo
    const svgLogo = document.getElementById('svgLogo');
    if (svgLogo) {
        function triggerRandomGlitch() {
            svgLogo.classList.add('glitch');
            setTimeout(() => {
                svgLogo.classList.remove('glitch');
            }, 600);
            const nextGlitch = 3000 + Math.random() * 4000;
            setTimeout(triggerRandomGlitch, nextGlitch);
        }
        setTimeout(triggerRandomGlitch, 3000);
    }

    // (Stickman logic successfully removed)
});
