import { CONFIG } from './config.js';

export class BackgroundRotator {
    constructor() {
        this.busy = false;
        this.rotationTimer = null;
        this.interiorImages = [...CONFIG.backgroundImages];
        this.flyerImages = [];
        this.interiorIndex = 0;
        this.flyerIndex = 0;
        this.showingFlyer = false; // Alternation flag: start with interior
        
        this.grainOverlay = document.querySelector('.grain-overlay');
        
        if (this.interiorImages.length > 0) {
            this._setBg(this.interiorImages[0]);
        }
    }

    _setBg(src) {
        document.body.style.setProperty('--bg-image', `url('${src}')`);
    }

    _setOpacity(val) {
        document.body.style.setProperty('--bg-opacity', String(val));
        if (this.grainOverlay) {
            this.grainOverlay.style.opacity = String(val);
        }
    }

    _wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Add flyer images (kept separate for alternating pattern).
     */
    addFlyerImages(flyerPaths) {
        if (!CONFIG.FLYERS_IN_SLIDESHOW || !flyerPaths || flyerPaths.length === 0) return;

        const existing = new Set(this.flyerImages);
        let added = 0;
        for (const path of flyerPaths) {
            if (!existing.has(path)) {
                this.flyerImages.push(path);
                existing.add(path);
                added++;
            }
        }
        if (added > 0) {
            console.log(`🖼️ Added ${added} flyer image(s) to background slideshow`);
        }
    }

    start() {
        this._scheduleRotation();
    }

    _scheduleRotation() {
        if (this.rotationTimer) clearTimeout(this.rotationTimer);

        // Flyer slides get 8s, interior slides get 4s
        const dwell = this.showingFlyer ? 8000 : 4000;
        this.rotationTimer = setTimeout(() => this._doRotate(), dwell);
    }

    async _doRotate() {
        if (this.busy || !this.grainOverlay) {
            this._scheduleRotation();
            return;
        }
        
        this.busy = true;
        this.grainOverlay.style.transition = 'opacity 2.5s ease';

        // Fade out
        this._setOpacity(0);
        await this._wait(CONFIG.transitionDurationMs);

        // Toggle: flyer → interior → flyer → interior ...
        // If we have flyers, alternate. If no flyers, just cycle interiors.
        if (this.flyerImages.length > 0) {
            this.showingFlyer = !this.showingFlyer;
        }

        let nextImage;
        if (this.showingFlyer && this.flyerImages.length > 0) {
            nextImage = this.flyerImages[this.flyerIndex % this.flyerImages.length];
            this.flyerIndex++;
        } else {
            nextImage = this.interiorImages[this.interiorIndex % this.interiorImages.length];
            this.interiorIndex++;
        }

        this._setBg(nextImage);

        // Fade in
        await this._wait(50);
        this._setOpacity(1);
        await this._wait(CONFIG.fadeHalfPointMs);

        this.busy = false;
        this._scheduleRotation();
    }
}
