import { BackgroundRotator } from './background-rotator.js';
import { BackgroundRevealSystem } from './background-reveal.js';
import { MatrixEventManager } from './matrix-events.js';
import { BackgroundEffect } from './bg-effect.js';
import { CONFIG } from './config.js';

window.addEventListener('DOMContentLoaded', () => {
    console.log('MASTERS system initialized...');

    // Initialize Background Rotator
    const bgRotator = new BackgroundRotator();
    bgRotator.start();

    // Initialize Reveal System
    const revealSystem = new BackgroundRevealSystem();
    revealSystem.init();

    // Initialize Matrix Events
    const matrixEvents = new MatrixEventManager();

    // Hamburger Menu Toggle
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-links a');

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });

        // Close menu when clicking links
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target) && (!vinylBtn || !vinylBtn.contains(e.target))) {
                hamburgerBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
            }
        });
    }

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
