import { CONFIG } from './config.js';

export class BackgroundRotator {
    constructor() {
        this.currentBgIndex = 0;
        this.isTransitioning = false;
        
        // Ensure first background is set immediately
        if (CONFIG.backgroundImages.length > 0) {
            document.body.style.setProperty('--bg-image', `url('${CONFIG.backgroundImages[0]}')`);
        }
    }

    start() {
        // Start rotation after initial wait
        setTimeout(() => this.rotate(), CONFIG.rotationIntervalMs);
    }

    rotate() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        
        const grainOverlay = document.querySelector('.grain-overlay');
        const bodyAfter = document.body;
        
        if (!grainOverlay) {
            console.error('grain-overlay element not found in DOM');
            this.isTransitioning = false;
            return; // Safety fallback
        }
        
        // Fade to black
        grainOverlay.style.opacity = '0';
        bodyAfter.style.setProperty('--bg-opacity', '0');
        
        setTimeout(() => {
            // Change image while black
            this.currentBgIndex = (this.currentBgIndex + 1) % CONFIG.backgroundImages.length;
            const bgImage = CONFIG.backgroundImages[this.currentBgIndex];
            document.body.style.setProperty('--bg-image', `url('${bgImage}')`);
            
            // Fade back in
            setTimeout(() => {
                grainOverlay.style.opacity = '1';
                bodyAfter.style.setProperty('--bg-opacity', '1');
                this.isTransitioning = false;
            }, CONFIG.fadeHalfPointMs);
        }, CONFIG.transitionDurationMs); // Black screen duration
        
        // Schedule the next rotation
        setTimeout(() => this.rotate(), CONFIG.rotationIntervalMs);
    }
}
