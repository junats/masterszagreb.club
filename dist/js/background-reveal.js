export class BackgroundRevealSystem {
    constructor() {
        this.ambientSpots = [];
        this.maxAmbientSpots = 15;
        this.mouseX = 50;
        this.mouseY = 50;
        this.currentMouseX = 50;
        this.currentMouseY = 50;
        this.isMouseActive = false;
        this.gsap = window.gsap || null;
        this.tickerAttached = false;
    }
    
    init() {
        this.startAmbientAnimation();
        
        // Mouse tracking with smooth GSAP damping
        document.addEventListener('mousemove', (e) => {
            const targetX = (e.clientX / window.innerWidth) * 100;
            const targetY = (e.clientY / window.innerHeight) * 100;
            this.isMouseActive = true;

            if (window.gsap) {
                window.gsap.to(this, {
                    currentMouseX: targetX,
                    currentMouseY: targetY,
                    duration: 0.35,
                    ease: 'power2.out'
                });
            } else {
                this.currentMouseX = targetX;
                this.currentMouseY = targetY;
            }
            this.updateReveal();
        });
        
        document.addEventListener('mouseleave', () => {
            this.isMouseActive = false;
            document.body.classList.remove('mouse-active');
        });
    }
    
    startAmbientAnimation() {
        // Create initial ambient spots
        for (let i = 0; i < this.maxAmbientSpots; i++) {
            this.createAmbientSpot();
        }
        
        // Use GSAP Ticker for smooth 60fps rendering, fallback to setInterval
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
        
        // Periodically refresh dead spots
        setInterval(() => {
            if (this.ambientSpots.length < this.maxAmbientSpots) {
                this.createAmbientSpot();
            }
        }, 400);
    }
    
    createAmbientSpot() {
        // Expanded vibrant chromatic color palette
        const colors = [
            { r: 255, g: 0, b: 100 },    // Hot pink
            { r: 0, g: 255, b: 200 },    // Cyan
            { r: 255, g: 100, b: 0 },    // Orange
            { r: 150, g: 0, b: 255 },    // Purple
            { r: 255, g: 255, b: 0 },    // Yellow
            { r: 0, g: 200, b: 255 },    // Sky blue
            { r: 255, g: 50, b: 150 },   // Magenta
            { r: 0, g: 255, b: 100 },    // Neon green
            { r: 255, g: 0, b: 200 },    // Hot magenta
            { r: 100, g: 200, b: 255 },  // Light blue
            { r: 255, g: 150, b: 0 },    // Amber
            { r: 200, g: 0, b: 255 }     // Violet
        ];
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const sizeVariation = Math.random();
        let size;
        if (sizeVariation < 0.3) {
            size = 120 + Math.random() * 100; // Small spots
        } else if (sizeVariation < 0.7) {
            size = 220 + Math.random() * 200; // Medium spots
        } else {
            size = 420 + Math.random() * 320; // Large spots
        }
        
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const spot = {
            x: startX,
            y: startY,
            targetX: Math.random() * 100,
            targetY: Math.random() * 100,
            size: size,
            blur: 15 + Math.random() * 30,
            opacity: 0,
            targetOpacity: 0.18 + Math.random() * 0.35,
            speed: 0.015 + Math.random() * 0.035,
            lifetime: 0,
            maxLifetime: 2500 + Math.random() * 4500,
            color: color
        };

        // Smooth GSAP tweening for position and opacity
        if (window.gsap) {
            window.gsap.to(spot, {
                opacity: spot.targetOpacity,
                duration: 0.8 + Math.random() * 0.5,
                ease: 'sine.inOut'
            });
            window.gsap.to(spot, {
                x: spot.targetX,
                y: spot.targetY,
                duration: 3 + Math.random() * 4,
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
                // Fallback manual interpolation if GSAP is not present
                spot.x += (spot.targetX - spot.x) * spot.speed;
                spot.y += (spot.targetY - spot.y) * spot.speed;
                if (spot.lifetime < 1000) {
                    spot.opacity += (spot.targetOpacity - spot.opacity) * 0.05;
                } else if (spot.lifetime > spot.maxLifetime - 1000) {
                    spot.opacity *= 0.95;
                }
            } else if (spot.lifetime > spot.maxLifetime - 800 && !spot.isFadingOut) {
                spot.isFadingOut = true;
                window.gsap.to(spot, {
                    opacity: 0,
                    duration: 0.7,
                    ease: 'power2.in',
                    onComplete: () => {
                        const idx = this.ambientSpots.indexOf(spot);
                        if (idx !== -1) this.ambientSpots.splice(idx, 1);
                    }
                });
            }
            
            if (!window.gsap && (spot.lifetime > spot.maxLifetime || spot.opacity < 0.01)) {
                this.ambientSpots.splice(i, 1);
            }
        }
        
        this.updateReveal();
    }
    
    updateReveal() {
        let gradients = [];
        
        // Add colored ambient spots with varied radial masks
        this.ambientSpots.forEach(spot => {
            const c = spot.color;
            if (spot.opacity > 0.005) {
                gradients.push(`radial-gradient(
                    circle ${spot.size}px at ${spot.x}% ${spot.y}%,
                    rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity}) 0%,
                    rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity * 0.6}) 30%,
                    rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity * 0.3}) 60%,
                    rgba(0, 0, 0, 0) 100%
                )`);
            }
        });

        // Add interactive mouse spotlight if active
        if (this.isMouseActive) {
            gradients.push(`radial-gradient(
                circle 280px at ${this.currentMouseX}% ${this.currentMouseY}%,
                rgba(0, 255, 65, 0.4) 0%,
                rgba(0, 255, 200, 0.2) 40%,
                rgba(0, 0, 0, 0) 100%
            )`);
        }
        
        // Apply combined mask to ambient layer
        if (gradients.length > 0) {
            const maskImage = gradients.join(', ');
            document.documentElement.style.setProperty('--ambient-mask', maskImage);
        }
    }
}
