import { CONFIG } from './config.js';

const CLUB_COLOR_THEMES = [
    {
        name: 'electric-cyan',
        hueRotate: '175deg',
        gradient: 'linear-gradient(135deg, rgba(0, 242, 254, 0.4), rgba(79, 172, 254, 0.2), rgba(0, 0, 0, 0.5))'
    },
    {
        name: 'matrix-emerald',
        hueRotate: '95deg',
        gradient: 'linear-gradient(135deg, rgba(0, 255, 65, 0.45), rgba(0, 200, 80, 0.2), rgba(0, 0, 0, 0.5))'
    },
    {
        name: 'deep-violet',
        hueRotate: '275deg',
        gradient: 'linear-gradient(135deg, rgba(147, 51, 234, 0.45), rgba(219, 39, 119, 0.25), rgba(0, 0, 0, 0.5))'
    },
    {
        name: 'cobalt-blue',
        hueRotate: '220deg',
        gradient: 'linear-gradient(135deg, rgba(37, 99, 235, 0.45), rgba(6, 182, 212, 0.25), rgba(0, 0, 0, 0.5))'
    },
    {
        name: 'amber-gold',
        hueRotate: '45deg',
        gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.45), rgba(239, 68, 68, 0.2), rgba(0, 0, 0, 0.5))'
    },
    {
        name: 'neon-magenta',
        hueRotate: '315deg',
        gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.45), rgba(168, 85, 247, 0.25), rgba(0, 0, 0, 0.5))'
    },
    {
        name: 'acid-lime-cyan',
        hueRotate: '130deg',
        gradient: 'linear-gradient(135deg, rgba(132, 204, 22, 0.4), rgba(20, 184, 166, 0.25), rgba(0, 0, 0, 0.5))'
    },
    {
        name: 'plasma-indigo',
        hueRotate: '250deg',
        gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.45), rgba(59, 130, 246, 0.25), rgba(0, 0, 0, 0.5))'
    }
];

export class BackgroundRotator {
    constructor() {
        this.busy = false;
        this.rotationTimer = null;
        this.colorThemeIndex = 0;
        this.gsap = window.gsap || null;
        
        // Active scraped Instagram event flyers
        this.flyerImages = [...(CONFIG.flyerImages || CONFIG.backgroundImages || [])];
        this.flyerIndex = 0;

        // Atmospheric nightclub vibe images
        this.clubImages = [...(CONFIG.clubImages || [])];
        this.lastClubImage = null;

        // Current state: start with Instagram event flyer
        this.isCurrentlyFlyer = true;
        
        this.grainOverlay = document.querySelector('.grain-overlay');
        this.svgLogo = document.getElementById('svgLogo');
        
        // Initial slide: first Instagram event flyer
        if (this.flyerImages.length > 0) {
            this._applySlide(this.flyerImages[0], true);
        } else if (this.clubImages.length > 0) {
            this._applySlide(this.clubImages[0], false);
        }
    }

    _applyColorTheme(isFlyer) {
        if (isFlyer) {
            if (window.gsap) {
                window.gsap.to(document.documentElement, {
                    '--club-hue': '0deg',
                    duration: 0.6,
                    ease: 'sine.out'
                });
            } else {
                document.documentElement.style.setProperty('--club-hue', '0deg');
            }
            document.documentElement.style.setProperty('--club-gradient', 'none');
        } else {
            const theme = CLUB_COLOR_THEMES[this.colorThemeIndex % CLUB_COLOR_THEMES.length];
            this.colorThemeIndex++;
            if (window.gsap) {
                window.gsap.to(document.documentElement, {
                    '--club-hue': theme.hueRotate,
                    duration: 0.8,
                    ease: 'power2.out'
                });
            } else {
                document.documentElement.style.setProperty('--club-hue', theme.hueRotate);
            }
            document.documentElement.style.setProperty('--club-gradient', theme.gradient);
        }
    }

    _setBg(src) {
        if (src) {
            document.body.style.setProperty('--bg-image', `url('${src}')`);
        } else {
            document.body.style.removeProperty('--bg-image');
        }
    }

    _setOpacity(val, duration = 0.6) {
        if (window.gsap) {
            return window.gsap.to(document.body, {
                '--bg-opacity': val,
                duration: duration,
                ease: 'power2.inOut',
                onUpdate: () => {
                    if (this.grainOverlay) {
                        this.grainOverlay.style.opacity = String(val);
                    }
                }
            });
        } else {
            document.body.style.setProperty('--bg-opacity', String(val));
            if (this.grainOverlay) {
                this.grainOverlay.style.opacity = String(val);
            }
            return Promise.resolve();
        }
    }

    _triggerLogoGlitch() {
        if (!this.svgLogo) return;

        if (window.gsap) {
            const tl = window.gsap.timeline();
            tl.to(this.svgLogo, {
                x: () => (Math.random() - 0.5) * 8,
                y: () => (Math.random() - 0.5) * 6,
                filter: 'contrast(2.2) brightness(1.6) drop-shadow(4px 0 0 rgba(255,0,80,0.9)) drop-shadow(-4px 0 0 rgba(0,255,255,0.9))',
                duration: 0.08,
                repeat: 3,
                yoyo: true,
                ease: 'steps(2)'
            }).to(this.svgLogo, {
                x: 0,
                y: 0,
                filter: 'contrast(1.1) brightness(1.05)',
                duration: 0.15,
                ease: 'power2.out'
            });
        } else {
            this.svgLogo.classList.remove('glitch');
            void this.svgLogo.offsetWidth;
            this.svgLogo.classList.add('glitch');
            setTimeout(() => {
                this.svgLogo.classList.remove('glitch');
            }, 800);
        }
    }

    _applySlide(src, isFlyer) {
        this.isCurrentlyFlyer = isFlyer;
        this._setBg(src);
        this._setOpacity(1, 0.4);
        this._applyColorTheme(isFlyer);
        
        if (isFlyer) {
            document.body.classList.add('showing-flyer');
            document.body.classList.remove('showing-club-glitch');
        } else {
            document.body.classList.remove('showing-flyer');
            document.body.classList.add('showing-club-glitch');
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

        if (this.flyerImages.length > 0 || this.clubImages.length > 0) {
            const dwell = this.isCurrentlyFlyer
                ? (CONFIG.eventIntervalMs || 8000)
                : (CONFIG.clubIntervalMs || 2600);
            this.rotationTimer = setTimeout(() => this._doRotate(), dwell);
        }
    }

    async _doRotate() {
        if (this.busy || !this.grainOverlay) {
            this._scheduleRotation();
            return;
        }
        
        this.busy = true;
        const fadeSec = (CONFIG.transitionDurationMs || 800) / 1000;

        // Trigger GSAP logo glitch shockwave
        this._triggerLogoGlitch();

        // GSAP Fade Out current slide
        if (window.gsap) {
            await new Promise(resolve => {
                window.gsap.to(document.body, {
                    '--bg-opacity': 0,
                    duration: fadeSec * 0.7,
                    ease: 'power2.inOut',
                    onComplete: resolve
                });
            });
        } else {
            this._setOpacity(0);
            await this._wait(CONFIG.transitionDurationMs || 800);
        }

        // Determine next slide (alternating flyer -> random club photo -> flyer)
        const next = this._getNextSlide();
        this.isCurrentlyFlyer = next.isFlyer;

        this._setBg(next.src);
        this._applyColorTheme(next.isFlyer);
        
        if (next.isFlyer) {
            document.body.classList.add('showing-flyer');
            document.body.classList.remove('showing-club-glitch');
        } else {
            document.body.classList.remove('showing-flyer');
            document.body.classList.add('showing-club-glitch');
        }

        // GSAP Fade In new slide
        if (window.gsap) {
            await new Promise(resolve => {
                window.gsap.to(document.body, {
                    '--bg-opacity': 1,
                    duration: fadeSec * 0.7,
                    ease: 'power2.out',
                    onComplete: resolve
                });
            });
        } else {
            await this._wait(50);
            this._setOpacity(1);
            await this._wait(CONFIG.fadeHalfPointMs || 400);
        }

        this.busy = false;
        this._scheduleRotation();
    }
}
