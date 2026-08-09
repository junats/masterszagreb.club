import { CONFIG } from './config.js';

export class BackgroundRotator {
    constructor() {
        this.busy = false;
        this.rotationTimer = null;
        this.gsap = window.gsap || null;
        
        // Active & recent event flyers only
        this.flyerImages = [...(CONFIG.flyerImages || CONFIG.backgroundImages || [])];
        this.flyerIndex = 0;
        
        // Decoupled rich trippy backdrop state
        this.backdropState = {
            opacity: 1,
            scale: 1.08,
            tx: 0,
            ty: 0,
            blur: 10,
            brightness: 0.40,
            contrast: 1.25,
            saturate: 1.4,
            hue: 0
        };

        // Center flyer state
        this.flyerState = {
            opacity: 1,
            scale: 1.0,
            blur: 0,
            brightness: 0.95
        };

        this.ambientTweens = [];
        this.grainOverlay = document.querySelector('.grain-overlay');
        this.svgLogo = document.getElementById('svgLogo');
        
        // Initial slide
        if (this.flyerImages.length > 0) {
            this._applySlide(this.flyerImages[0]);
        }

        // Start continuous trippy ambient backdrop breathing & liquid drift
        this._startContinuousTrippyBackdrop();
    }

    _updateCssVariables() {
        const root = document.documentElement;
        root.style.setProperty('--backdrop-opacity', this.backdropState.opacity);
        root.style.setProperty('--backdrop-scale', this.backdropState.scale);
        root.style.setProperty('--backdrop-tx', `${this.backdropState.tx}px`);
        root.style.setProperty('--backdrop-ty', `${this.backdropState.ty}px`);
        root.style.setProperty('--backdrop-blur', `${this.backdropState.blur}px`);
        root.style.setProperty('--backdrop-brightness', this.backdropState.brightness);
        root.style.setProperty('--backdrop-contrast', this.backdropState.contrast);
        root.style.setProperty('--backdrop-saturate', this.backdropState.saturate);
        root.style.setProperty('--backdrop-hue', `${this.backdropState.hue}deg`);

        root.style.setProperty('--flyer-opacity', this.flyerState.opacity);
        root.style.setProperty('--flyer-scale', this.flyerState.scale);
        root.style.setProperty('--flyer-blur', `${this.flyerState.blur}px`);
        root.style.setProperty('--flyer-brightness', this.flyerState.brightness);
    }

    _startContinuousTrippyBackdrop() {
        if (!window.gsap) return;

        // Continuous smooth 60fps CSS variables sync
        window.gsap.ticker.add(() => {
            this._updateCssVariables();
        });

        // 1. Organic liquid breathing scale
        const scaleTween = window.gsap.to(this.backdropState, {
            scale: 1.18,
            duration: 8.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });

        // 2. Liquid asynchronous X/Y drift (Lissajous path)
        const xTween = window.gsap.to(this.backdropState, {
            tx: 25,
            duration: 13.0,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });

        const yTween = window.gsap.to(this.backdropState, {
            ty: 18,
            duration: 17.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });

        // 3. Hypnotic psychedelic chromatic color wave (slow continuous hue oscillation)
        const hueTween = window.gsap.to(this.backdropState, {
            hue: 55,
            duration: 21.0,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });

        // 4. Undulating saturation & contrast pulse
        const satTween = window.gsap.to(this.backdropState, {
            saturate: 2.3,
            contrast: 1.45,
            duration: 11.0,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });

        this.ambientTweens = [scaleTween, xTween, yTween, hueTween, satTween];
    }

    _setImages(src) {
        if (src) {
            document.documentElement.style.setProperty('--backdrop-image', `url('${src}')`);
            document.documentElement.style.setProperty('--flyer-image', `url('${src}')`);
            document.body.style.setProperty('--bg-image', `url('${src}')`);
        }
    }

    _applySlide(src) {
        this._setImages(src);
        this.backdropState.opacity = 1;
        this.backdropState.brightness = 0.40;
        this.backdropState.blur = 10;
        this.flyerState = { opacity: 1, scale: 1.0, blur: 0, brightness: 0.95 };
        this._updateCssVariables();
        document.body.classList.add('showing-flyer');
    }

    setFlyerImages(images) {
        if (Array.isArray(images) && images.length > 0) {
            this.flyerImages = [...images];
            this.flyerIndex = 0;
            this._applySlide(this.flyerImages[0]);
            this._scheduleRotation();
            console.log(`🖼️ Slideshow loaded ${images.length} event flyer(s):`, images);
        }
    }

    start() {
        this._scheduleRotation();
    }

    _scheduleRotation() {
        if (this.rotationTimer) clearTimeout(this.rotationTimer);

        if (this.flyerImages.length > 1) {
            const dwell = CONFIG.eventIntervalMs || 7500;
            this.rotationTimer = setTimeout(() => this._doRotate(), dwell);
        }
    }

    async _doRotate() {
        if (this.busy || !this.grainOverlay || this.flyerImages.length <= 1) {
            this._scheduleRotation();
            return;
        }
        
        this.busy = true;
        const nextIndex = (this.flyerIndex + 1) % this.flyerImages.length;
        const nextFlyer = this.flyerImages[nextIndex];

        if (window.gsap) {
            // Temporarily pause continuous background ambient drift during slide transition
            this.ambientTweens.forEach(t => t.pause());

            const tl = window.gsap.timeline({
                onUpdate: () => this._updateCssVariables()
            });

            // ══════════════════════════════════════════════════════════════
            // STAGE 1: ASYMMETRICAL ANIMATE OUT
            // - Main flyer exits quickly (0.50s, dissolves into soft blur)
            // - Backdrop goes through a super trippy warp: stretches outward (scale: 1.25),
            //   deepens into intense lens blur (36px), dims, and surges with chromatic saturation!
            // ══════════════════════════════════════════════════════════════
            tl.to(this.flyerState, {
                opacity: 0,
                scale: 0.93,
                blur: 7,
                brightness: 0.70,
                duration: 0.50,
                ease: 'power2.inOut'
            }, 0);

            tl.to(this.backdropState, {
                opacity: 0.30,
                scale: 1.25,
                blur: 36,
                brightness: 0.14,
                saturate: 2.8,
                hue: '+=60',
                duration: 1.15,
                ease: 'sine.inOut'
            }, 0.15);

            // ══════════════════════════════════════════════════════════════
            // STAGE 2: ASSET SWAP
            // ══════════════════════════════════════════════════════════════
            tl.add(() => {
                this.flyerIndex = nextIndex;
                this._setImages(nextFlyer);

                // Set entrance ready positions for flyer
                this.flyerState.scale = 1.06;
                this.flyerState.blur = 10;
                this.flyerState.brightness = 1.30; // Luminous exposure bloom
            });

            // ══════════════════════════════════════════════════════════════
            // STAGE 3: STAGGERED TRIPPY ANIMATE IN
            // - Backdrop rushes in first with a grand psychedelic shockwave (1.50s),
            //   returning from intense blur/scale to crisp ambient base
            // - Center Flyer enters +0.50s LATER, floating forward into razor-sharp focus
            // ══════════════════════════════════════════════════════════════
            tl.to(this.backdropState, {
                opacity: 1,
                scale: 1.08,
                blur: 10,
                brightness: 0.40,
                saturate: 1.4,
                contrast: 1.25,
                duration: 1.50,
                ease: 'power3.out'
            }, '+=0.05');

            tl.to(this.flyerState, {
                opacity: 1,
                scale: 1.0,
                blur: 0,
                brightness: 0.95,
                duration: 0.90,
                ease: 'power2.out'
            }, '-=0.95'); // Starts +0.50s after backdrop began entering

            await new Promise(resolve => {
                tl.eventCallback('onComplete', () => {
                    // Resume continuous trippy ambient backdrop breathing
                    this.ambientTweens.forEach(t => t.resume());
                    resolve();
                });
            });
        } else {
            // Fallback
            this.flyerIndex = nextIndex;
            this._applySlide(nextFlyer);
        }

        this.busy = false;
        this._scheduleRotation();
    }
}
