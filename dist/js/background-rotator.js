import { CONFIG } from './config.js';

export class BackgroundRotator {
    constructor() {
        this.busy = false;
        this.rotationTimer = null;
        
        // Active scraped Instagram event flyers
        this.flyerImages = [...(CONFIG.flyerImages || CONFIG.backgroundImages || [])];
        this.flyerIndex = 0;

        // Atmospheric nightclub vibe images
        this.clubImages = [...(CONFIG.clubImages || [])];
        this.lastClubImage = null;

        // Current state: start with Instagram event flyer
        this.isCurrentlyFlyer = true;
        
        this.grainOverlay = document.querySelector('.grain-overlay');
        this.flyerOverlay = document.getElementById('flyerOverlay');
        this.svgLogo = document.getElementById('svgLogo');
        
        // Initial slide: first Instagram event flyer
        if (this.flyerImages.length > 0) {
            this._applySlide(this.flyerImages[0], true);
        } else if (this.clubImages.length > 0) {
            this._applySlide(this.clubImages[0], false);
        }
    }

    _setBg(src) {
        if (src) {
            document.body.style.setProperty('--bg-image', `url('${src}')`);
        } else {
            document.body.style.removeProperty('--bg-image');
        }
    }

    _setFlyerBg(src) {
        if (this.flyerOverlay) {
            if (src) {
                this.flyerOverlay.style.backgroundImage = `url('${src}')`;
                this.flyerOverlay.style.setProperty('--flyer-image', `url('${src}')`);
                document.body.style.setProperty('--flyer-image', `url('${src}')`);
            } else {
                this.flyerOverlay.style.backgroundImage = 'none';
                this.flyerOverlay.style.setProperty('--flyer-image', 'none');
                document.body.style.removeProperty('--flyer-image');
            }
        }
    }

    _setFlyerOpacity(val) {
        if (this.flyerOverlay) {
            this.flyerOverlay.style.opacity = String(val);
        }
    }

    _setOpacity(val) {
        document.body.style.setProperty('--bg-opacity', String(val));
        if (this.grainOverlay) {
            this.grainOverlay.style.opacity = String(val);
        }
    }

    _applySlide(src, isFlyer) {
        this._setBg(src);
        this._setFlyerBg(src);
        this._setFlyerOpacity(1);
        this._setOpacity(1);
        
        if (isFlyer) {
            document.body.classList.add('showing-flyer');
        } else {
            document.body.classList.remove('showing-flyer');
        }
    }

    _wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Pick a random atmospheric nightclub photo, avoiding repetition.
     */
    _getRandomClubImage() {
        if (this.clubImages.length === 0) return null;
        if (this.clubImages.length === 1) return this.clubImages[0];

        const candidates = this.clubImages.filter(img => img !== this.lastClubImage);
        const picked = candidates[Math.floor(Math.random() * candidates.length)];
        this.lastClubImage = picked;
        return picked;
    }

    /**
     * Get the next slide by alternating between flyer and random nightclub photo.
     */
    _getNextSlide() {
        if (this.isCurrentlyFlyer) {
            // Transition from flyer -> random nightclub photo
            const clubImg = this._getRandomClubImage();
            if (clubImg) {
                this.isCurrentlyFlyer = false;
                return { src: clubImg, isFlyer: false };
            }
        }

        // Transition from nightclub photo -> next Instagram event flyer
        if (this.flyerImages.length > 0) {
            this.flyerIndex = (this.flyerIndex + 1) % this.flyerImages.length;
            const flyerImg = this.flyerImages[this.flyerIndex];
            this.isCurrentlyFlyer = true;
            return { src: flyerImg, isFlyer: true };
        }

        // Fallback to random club image if no flyers
        const fallback = this._getRandomClubImage() || this.clubImages[0];
        this.isCurrentlyFlyer = false;
        return { src: fallback, isFlyer: false };
    }

    setFlyerImages(images) {
        if (Array.isArray(images) && images.length > 0) {
            this.flyerImages = [...images];
            this.flyerIndex = 0;
            console.log(`🖼️ Background set to ${images.length} Instagram flyer(s) alternating with ${this.clubImages.length} nightclub photos`);
        }
    }

    start() {
        this._scheduleRotation();
    }

    _scheduleRotation() {
        if (this.rotationTimer) clearTimeout(this.rotationTimer);

        // Rotate if we have at least one flyer and club images, or multiple slides
        if (this.flyerImages.length > 0 || this.clubImages.length > 0) {
            const dwell = CONFIG.rotationIntervalMs || 7000;
            this.rotationTimer = setTimeout(() => this._doRotate(), dwell);
        }
    }

    async _doRotate() {
        if (this.busy || !this.grainOverlay) {
            this._scheduleRotation();
            return;
        }
        
        this.busy = true;
        const transitionSec = (CONFIG.transitionDurationMs || 1000) / 1000;
        this.grainOverlay.style.transition = `opacity ${transitionSec}s ease`;
        if (this.flyerOverlay) {
            this.flyerOverlay.style.transition = `opacity ${transitionSec}s ease`;
        }

        // Trigger subtle logo glitch animation on slide change
        if (this.svgLogo) {
            this.svgLogo.classList.remove('glitch');
            void this.svgLogo.offsetWidth;
            this.svgLogo.classList.add('glitch');
            setTimeout(() => {
                this.svgLogo.classList.remove('glitch');
            }, 800);
        }

        // Fade out current slide
        this._setOpacity(0);
        this._setFlyerOpacity(0);
        await this._wait(CONFIG.transitionDurationMs || 1000);

        // Determine next slide (alternating flyer -> random club photo -> flyer)
        const next = this._getNextSlide();

        this._setBg(next.src);
        this._setFlyerBg(next.src);
        
        if (next.isFlyer) {
            document.body.classList.add('showing-flyer');
        } else {
            document.body.classList.remove('showing-flyer');
        }

        // Fade in new slide with center overlay ALWAYS visible (opacity = 1)
        await this._wait(50);
        this._setOpacity(1);
        this._setFlyerOpacity(1);
        await this._wait(CONFIG.fadeHalfPointMs || 500);

        this.busy = false;
        this._scheduleRotation();
    }
}
