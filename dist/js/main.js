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
            if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
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

    // === Stickman Movie Scenes ===
    const sceneStage = document.getElementById('sceneStage');
    if (sceneStage) {
        const scenes = ['scene-chill', 'scene-rave', 'scene-salsa', 'scene-robot', 'scene-groove'];
        const hoverMoves = ['hover-highfive', 'hover-jump', 'hover-spin', 'hover-wave', 'hover-lean', 'hover-headbang'];
        let currentScene = -1;
        let currentHover = '';

        function switchScene() {
            let next;
            do { next = Math.floor(Math.random() * scenes.length); } while (next === currentScene);
            currentScene = next;
            scenes.forEach(s => sceneStage.classList.remove(s));
            sceneStage.classList.add(scenes[currentScene]);
            setTimeout(switchScene, 6000 + Math.random() * 4000);
        }

        // Random hover interaction on each mouseenter
        const sceneBtn = document.getElementById('eventsToggleBtn');
        if (sceneBtn) {
            sceneBtn.addEventListener('mouseenter', () => {
                // Remove old hover class
                hoverMoves.forEach(h => sceneStage.classList.remove(h));
                // Pick a random hover interaction
                currentHover = hoverMoves[Math.floor(Math.random() * hoverMoves.length)];
                sceneStage.classList.add(currentHover);
            });
            sceneBtn.addEventListener('mouseleave', () => {
                hoverMoves.forEach(h => sceneStage.classList.remove(h));
            });
        }

        setTimeout(switchScene, 1000);
    }
});
