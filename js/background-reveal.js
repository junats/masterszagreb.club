export class BackgroundRevealSystem {
    constructor() {
        this.ambientSpots = [];
        this.maxAmbientSpots = 6;
        this.gsap = window.gsap || null;
        this.tickerAttached = false;
    }
    
    init() {
        this.startAmbientAnimation();
    }
    
    startAmbientAnimation() {
        // Create initial dark-friendly fluid spots
        for (let i = 0; i < this.maxAmbientSpots; i++) {
            this.createAmbientSpot();
        }
        
        // GSAP Ticker for silky 60fps liquid rendering
        if (window.gsap && !this.tickerAttached) {
            this.tickerAttached = true;
            window.gsap.ticker.add(() => {
                this.updateAmbientSpots();
            });
        } else {
            setInterval(() => {
                this.updateAmbientSpots();
            }, 30);
        }
        
        // Periodically refresh dead spots at a slow, organic pace
        setInterval(() => {
            if (this.ambientSpots.length < this.maxAmbientSpots) {
                this.createAmbientSpot();
            }
        }, 2000);
    }
    
    createAmbientSpot() {
        // Nocturnal, deep, dark-friendly palette for underground club atmosphere
        const darkFriendlyColors = [
            { r: 210, g: 15, b: 90 },    // Deep ruby / crimson magenta
            { r: 0, g: 180, b: 200 },    // Deep moody cyan
            { r: 0, g: 195, b: 75 },     // Toxic emerald / acid green
            { r: 135, g: 35, b: 225 },   // Midnight ultraviolet
            { r: 220, g: 105, b: 10 },   // Smoky ember gold
            { r: 25, g: 80, b: 225 },    // Deep cobalt blue
            { r: 180, g: 10, b: 150 },   // Velvet plum
            { r: 0, g: 150, b: 160 }     // Deep oceanic teal
        ];
        
        const color = darkFriendlyColors[Math.floor(Math.random() * darkFriendlyColors.length)];
        const sizeVariation = Math.random();
        let size;
        if (sizeVariation < 0.35) {
            size = 380 + Math.random() * 180; // Soft focused pool
        } else if (sizeVariation < 0.75) {
            size = 580 + Math.random() * 260; // Broad fluid haze
        } else {
            size = 850 + Math.random() * 400; // Giant atmospheric wash
        }
        
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const spot = {
            x: startX,
            y: startY,
            targetX: Math.random() * 100,
            targetY: Math.random() * 100,
            size: size,
            opacity: 0,
            // Calibrated subtle opacity: rich color without washing out dark blacks
            targetOpacity: 0.18 + Math.random() * 0.22,
            speed: 0.003 + Math.random() * 0.005,
            lifetime: 0,
            maxLifetime: 14000 + Math.random() * 14000,
            color: color
        };

        // Lissajous fluid curves: asynchronous X and Y durations for non-repeating liquid motion
        if (window.gsap) {
            window.gsap.to(spot, {
                opacity: spot.targetOpacity,
                duration: 3.5 + Math.random() * 2.0,
                ease: 'sine.inOut'
            });
            window.gsap.to(spot, {
                x: spot.targetX,
                duration: 14.0 + Math.random() * 10.0,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true
            });
            window.gsap.to(spot, {
                y: spot.targetY,
                duration: 18.0 + Math.random() * 10.0,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true
            });
        }

        this.ambientSpots.push(spot);
    }
    
    updateAmbientSpots() {
        for (let i = this.ambientSpots.length - 1; i >= 0; i--) {
            const spot = this.ambientSpots[i];
            spot.lifetime += 30;

            if (!window.gsap) {
                spot.x += (spot.targetX - spot.x) * spot.speed;
                spot.y += (spot.targetY - spot.y) * spot.speed;
                if (spot.lifetime < 3000) {
                    spot.opacity += (spot.targetOpacity - spot.opacity) * 0.015;
                } else if (spot.lifetime > spot.maxLifetime - 3000) {
                    spot.opacity *= 0.985;
                }
            } else if (spot.lifetime > spot.maxLifetime - 3000 && !spot.isFadingOut) {
                spot.isFadingOut = true;
                window.gsap.to(spot, {
                    opacity: 0,
                    duration: 3.0,
                    ease: 'sine.inOut',
                    onComplete: () => {
                        const idx = this.ambientSpots.indexOf(spot);
                        if (idx !== -1) this.ambientSpots.splice(idx, 1);
                    }
                });
            }
            
            if (!window.gsap && (spot.lifetime > spot.maxLifetime || spot.opacity < 0.005)) {
                this.ambientSpots.splice(i, 1);
            }
        }
        
        this.updateReveal();
    }
    
    updateReveal() {
        let fluidLightGradients = [];
        let trippyDistortGradients = [];
        
        this.ambientSpots.forEach((spot, idx) => {
            const c = spot.color;
            if (spot.opacity > 0.003) {
                // Ultra-smooth, 6-stop Gaussian fluid radial falloff for natural feathered edges
                fluidLightGradients.push(`radial-gradient(
                    circle ${spot.size}px at ${spot.x}% ${spot.y}%,
                    rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity}) 0%,
                    rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity * 0.72}) 20%,
                    rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity * 0.42}) 45%,
                    rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity * 0.18}) 70%,
                    rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity * 0.04}) 88%,
                    rgba(${c.r}, ${c.g}, ${c.b}, 0) 100%
                )`);

                // Dark-friendly chromatic distortion wave (subtle, non-jarring)
                if (idx % 2 === 0) {
                    trippyDistortGradients.push(`radial-gradient(
                        circle ${spot.size * 0.8}px at ${spot.x}% ${spot.y}%,
                        rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity * 0.35}) 0%,
                        rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity * 0.15}) 50%,
                        rgba(0, 0, 0, 0) 100%
                    )`);
                }
            }
        });
        
        if (fluidLightGradients.length > 0) {
            document.documentElement.style.setProperty('--ambient-lights', fluidLightGradients.join(', '));
            document.documentElement.style.setProperty('--ambient-mask', fluidLightGradients.join(', '));
        }

        if (trippyDistortGradients.length > 0) {
            document.documentElement.style.setProperty('--trippy-lights', trippyDistortGradients.join(', '));
        }
    }
}
