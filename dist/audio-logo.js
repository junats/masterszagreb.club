// Hipster Dot-Matrix Logo Particle Engine (Canvas Only)

class LogoParticleSystem {
    constructor(canvasId, logoId) {
        this.canvas = document.getElementById(canvasId);
        this.logo = document.getElementById(logoId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.baseParticles = [];
        this.active = true; // Always running to render the logo
        this.mode = 'idle'; // 'idle' (solid logo), 'dissolve', 'float', 'assemble'
        this.time = 0;
        this.boxAlpha = 1.0; // Opacity of the background box and outline
        this.imgAlpha = 1.0; // Opacity of the sharp vector image (for cross-fading)
        this.glitchTimeout = null;
        
        // Dimensions matching the CSS logo size (150px desktop, computed mobile)
        this.logoWidth = 150;
        this.logoHeight = 327; // Proportional starting height
        this.imageLoaded = false;

        // Hide original SVG image permanently
        if (this.logo) {
            this.logo.style.setProperty('display', 'none', 'important');
        }

        // Show canvas permanently
        this.canvas.style.display = 'block';

        this.init();
    }

    init() {
        this.img = new Image();
        this.img.src = 'master-logo.svg';
        this.img.onload = () => {
            this.prepareParticles();
            this.imageLoaded = true;
            this.startStaticLogo();
        };
    }

    prepareParticles() {
        const offscreen = document.createElement('canvas');
        offscreen.width = this.img.naturalWidth || 110;
        offscreen.height = this.img.naturalHeight || 240;
        const octx = offscreen.getContext('2d');

        octx.drawImage(this.img, 0, 0, offscreen.width, offscreen.height);

        const imgData = octx.getImageData(0, 0, offscreen.width, offscreen.height);
        const pixels = imgData.data;

        this.baseParticles = [];

        // Scan pixels with a step of 2 to generate dense transition particles
        const step = 2; 
        for (let y = 0; y < offscreen.height; y += step) {
            for (let x = 0; x < offscreen.width; x += step) {
                const idx = (y * offscreen.width + x) * 4;
                const alpha = pixels[idx + 3];

                if (alpha > 40) {
                    this.baseParticles.push({
                        nx: x / offscreen.width, // Normalized X
                        ny: y / offscreen.height, // Normalized Y
                        r: pixels[idx],
                        g: pixels[idx + 1],
                        b: pixels[idx + 2],
                        alpha: alpha / 255
                    });
                }
            }
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupClickDetector();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        
        // Reset scale and set scale factor
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);

        // Dynamically compute dimensions matching CSS rules (150px desktop, 100px mobile)
        const isMobile = window.innerWidth <= 768;
        this.logoWidth = isMobile ? 100 : 150;
        
        // Compute height preserving original aspect ratio
        const aspect = this.img.naturalWidth && this.img.naturalHeight ? (this.img.naturalHeight / this.img.naturalWidth) : (240 / 110);
        this.logoHeight = this.logoWidth * aspect;

        if (this.mode === 'idle') {
            this.drawStaticLogo();
        }
    }

    setupClickDetector() {
        window.addEventListener('click', (e) => {
            const clickX = e.clientX;
            const clickY = e.clientY;

            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            // Bounding box of the logo including the 20px padding
            if (Math.abs(clickX - centerX) < (this.logoWidth / 2 + 20) && Math.abs(clickY - centerY) < (this.logoHeight / 2 + 20)) {
                this.triggerGlitchBurst();
            }
        });
    }

    triggerGlitchBurst() {
        if (this.mode !== 'idle') return;
        
        // Temporarily jitter and color-shift particles for a glitch effect
        const originalMode = this.mode;
        this.mode = 'glitch';
        setTimeout(() => {
            this.mode = originalMode;
        }, 300);
    }

    startStaticLogo() {
        this.mode = 'idle';
        this.tick();
    }

    drawStaticLogo() {
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        const centerX = window.innerWidth / 2 - this.logoWidth / 2;
        const centerY = window.innerHeight / 2 - this.logoHeight / 2;

        if (this.imageLoaded) {
            // 1. Draw original black background box with 20px padding
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(centerX - 20, centerY - 20, this.logoWidth + 40, this.logoHeight + 40);

            // 2. Draw white border outline with 20px padding
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(centerX - 20, centerY - 20, this.logoWidth + 40, this.logoHeight + 40);

            // 3. Draw original SVG crisp (retina supported)
            this.ctx.drawImage(this.img, centerX, centerY, this.logoWidth, this.logoHeight);
        }
    }

    /**
     * Dissolve logo into dispersing particles, slowing down to enter a float loop.
     */
    dissolve() {
        if (!this.imageLoaded) return;
        
        if (this.glitchTimeout) clearTimeout(this.glitchTimeout);
        
        // 1. Enter hectic glitch-out state first
        this.mode = 'glitch-out';
        
        this.glitchTimeout = setTimeout(() => {
            if (this.mode !== 'glitch-out') return;
            
            this.mode = 'dissolve';
            
            const centerX = window.innerWidth / 2 - this.logoWidth / 2;
            const centerY = window.innerHeight / 2 - this.logoHeight / 2;

            this.particles = this.baseParticles.map(bp => {
                const angle = Math.random() * Math.PI * 2;
                // Hectic explosion range / dispersion velocity
                const speed = 4 + Math.random() * 18; 
                return {
                    x: centerX + bp.nx * this.logoWidth,
                    y: centerY + bp.ny * this.logoHeight,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: bp.alpha * (0.2 + Math.random() * 0.8), // Different opacities
                    timeOffset: Math.random() * 100,
                    // Particles are different sizes (randomly 2px to 7.5px)
                    size: 2 + Math.random() * 5.5,
                    r: bp.r,
                    g: bp.g,
                    b: bp.b
                };
            });
        }, 350); // 350ms glitch duration before particle burst
    }

    /**
     * Reassemble floating particles back into the logo shape.
     */
    assemble() {
        if (!this.imageLoaded) return;
        if (this.glitchTimeout) clearTimeout(this.glitchTimeout);
        
        this.mode = 'assemble';

        const centerX = window.innerWidth / 2 - this.logoWidth / 2;
        const centerY = window.innerHeight / 2 - this.logoHeight / 2;

        if (this.particles.length === 0) {
            this.particles = this.baseParticles.map(bp => {
                const angle = Math.random() * Math.PI * 2;
                const distance = 400 + Math.random() * 500;
                return {
                    x: window.innerWidth / 2 + Math.cos(angle) * distance,
                    y: window.innerHeight / 2 + Math.sin(angle) * distance,
                    tx: centerX + bp.nx * this.logoWidth,
                    ty: centerY + bp.ny * this.logoHeight,
                    alpha: 0,
                    targetAlpha: bp.alpha,
                    size: 3 + Math.random() * 2,
                    r: bp.r,
                    g: bp.g,
                    b: bp.b
                };
            });
        } else {
            this.particles.forEach((p, idx) => {
                const bp = this.baseParticles[idx] || this.baseParticles[0];
                p.tx = centerX + bp.nx * this.logoWidth;
                p.ty = centerY + bp.ny * this.logoHeight;
                p.targetAlpha = bp.alpha;
            });
        }
    }

    tick() {
        if (!this.active) return;
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        this.time += 0.015;
        let activeCount = 0;
        let transitionToFloat = true;

        const centerX = window.innerWidth / 2 - this.logoWidth / 2;
        const centerY = window.innerHeight / 2 - this.logoHeight / 2;

        // Transition the opacity of the outline/background box
        if (this.mode === 'idle') {
            this.boxAlpha = 1.0;
            this.imgAlpha = 1.0;
        } else if (this.mode === 'glitch-out') {
            this.boxAlpha = Math.max(0, this.boxAlpha - 0.08);
            this.imgAlpha = Math.max(0, this.imgAlpha - 0.12);
        } else if (this.mode === 'dissolve') {
            this.boxAlpha = 0.0;
            this.imgAlpha = 0.0;
        } else if (this.mode === 'float') {
            this.boxAlpha = 0.0;
            this.imgAlpha = 0.0;
        } else if (this.mode === 'assemble') {
            this.boxAlpha = Math.min(1.0, this.boxAlpha + 0.04);
            // Slowly crossfade the original sharp logo image back in
            this.imgAlpha = Math.min(1.0, this.imgAlpha + 0.035);
        }

        if (this.mode === 'idle') {
            this.drawStaticLogo();
        } else if (this.mode === 'glitch-out') {
            // Draw background and border with massive glitch jitter
            if (this.boxAlpha > 0) {
                const jitterX = (Math.random() - 0.5) * 12;
                const jitterY = (Math.random() - 0.5) * 12;
                this.ctx.fillStyle = `rgba(0, 0, 0, ${this.boxAlpha})`;
                this.ctx.fillRect(centerX - 20 + jitterX, centerY - 20 + jitterY, this.logoWidth + 40, this.logoHeight + 40);
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * this.boxAlpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(centerX - 20 + jitterX, centerY - 20 + jitterY, this.logoWidth + 40, this.logoHeight + 40);
            }
            // Dense particles with extreme color splitting and jitter
            this.baseParticles.forEach(bp => {
                const jitterX = (Math.random() - 0.5) * 15;
                const jitterY = (Math.random() - 0.5) * 15;
                const r = Math.random() > 0.4 ? 255 : 0;
                const g = Math.random() > 0.4 ? 255 : 255;
                const b = Math.random() > 0.4 ? 255 : 65;
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${bp.alpha * 0.9})`;
                const size = 3 + Math.random() * 3;
                this.ctx.fillRect(centerX + bp.nx * this.logoWidth + jitterX, centerY + bp.ny * this.logoHeight + jitterY, size, size);
            });
        } else if (this.mode === 'glitch') {
            // Interactive click glitch
            if (this.boxAlpha > 0) {
                const jitterX = (Math.random() - 0.5) * 4;
                const jitterY = (Math.random() - 0.5) * 4;
                this.ctx.fillStyle = `rgba(0, 0, 0, ${this.boxAlpha})`;
                this.ctx.fillRect(centerX - 20 + jitterX, centerY - 20 + jitterY, this.logoWidth + 40, this.logoHeight + 40);
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * this.boxAlpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(centerX - 20 + jitterX, centerY - 20 + jitterY, this.logoWidth + 40, this.logoHeight + 40);
            }
            this.baseParticles.forEach(bp => {
                const jitterX = (Math.random() - 0.5) * 8;
                const jitterY = (Math.random() - 0.5) * 8;
                const r = Math.random() > 0.5 ? 255 : 0;
                const g = Math.random() > 0.5 ? 255 : 255;
                const b = Math.random() > 0.5 ? 255 : 65;
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${bp.alpha * 0.8})`;
                this.ctx.fillRect(centerX + bp.nx * this.logoWidth + jitterX, centerY + bp.ny * this.logoHeight + jitterY, 3.5, 3.5);
            });
        } else {
            // Draw background box and border with fading opacity during transition
            if (this.boxAlpha > 0) {
                this.ctx.fillStyle = `rgba(0, 0, 0, ${this.boxAlpha})`;
                this.ctx.fillRect(centerX - 20, centerY - 20, this.logoWidth + 40, this.logoHeight + 40);
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * this.boxAlpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(centerX - 20, centerY - 20, this.logoWidth + 40, this.logoHeight + 40);
            }

            // Draw the sharp vector logo with fading globalAlpha during crossfade
            if (this.imgAlpha > 0 && this.imageLoaded) {
                this.ctx.globalAlpha = this.imgAlpha;
                this.ctx.drawImage(this.img, centerX, centerY, this.logoWidth, this.logoHeight);
                this.ctx.globalAlpha = 1.0;
            }

            // Update and draw transition particles
            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];

                if (this.mode === 'dissolve') {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vx *= 0.97;
                    p.vy *= 0.97;

                    // Hectic jitter
                    p.x += (Math.random() - 0.5) * 3;
                    p.y += (Math.random() - 0.5) * 3;

                    // Fade down to ambient alpha (0.2)
                    p.alpha += (0.2 - p.alpha) * 0.03;

                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    if (speed > 0.05) {
                        transitionToFloat = false;
                    }
                    activeCount++;

                } else if (this.mode === 'float') {
                    // Spread apart further in background float state, make it hectic
                    p.x += Math.sin(p.timeOffset + this.time) * 0.8;
                    p.y += Math.cos(p.timeOffset + this.time) * 0.8;
                    p.x += (Math.random() - 0.5) * 1.5; // Hectic Brownian drift
                    p.y += (Math.random() - 0.5) * 1.5;
                    p.alpha = 0.2;
                    activeCount++;

                } else if (this.mode === 'assemble') {
                    const dx = p.tx - p.x;
                    const dy = p.ty - p.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    p.x += dx * 0.045;
                    p.y += dy * 0.045;

                    p.alpha += (p.targetAlpha - p.alpha) * 0.05;

                    if (distance > 0.5) {
                        p.x += (Math.random() - 0.5) * 0.6;
                        p.y += (Math.random() - 0.5) * 0.6;
                        activeCount++;
                    }
                }

                // Draw particle (fade out particles as the sharp logo fades in)
                let renderAlpha = p.alpha;
                if (this.mode === 'assemble') {
                    renderAlpha *= (1.0 - this.imgAlpha);
                }

                if (renderAlpha > 0) {
                    this.ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${renderAlpha})`;
                    this.ctx.fillRect(p.x, p.y, p.size, p.size);
                }
            }

            // Mode transitions
            if (this.mode === 'dissolve' && transitionToFloat) {
                this.mode = 'float';
            }

            if (this.mode === 'assemble' && activeCount === 0) {
                this.mode = 'idle';
                this.particles = [];
            }
        }

        if (window.gsap && !this._hasGsapTicker) {
            this._hasGsapTicker = true;
            window.gsap.ticker.add(() => this.tick());
        } else if (!window.gsap) {
            requestAnimationFrame(() => this.tick());
        }
    }
}

// Attach to window
window.LogoParticleSystem = LogoParticleSystem;
