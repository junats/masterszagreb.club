export class BackgroundRevealSystem {
    constructor() {
        this.ambientSpots = [];
        this.maxAmbientSpots = 15; // Massive increase for overlapping
        this.mouseX = 50;
        this.mouseY = 50;
        this.isMouseActive = false;
    }
    
    init() {
        // Create ambient spots that randomly appear
        this.startAmbientAnimation();
        
        // Mouse tracking with distortion effect
        document.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX / window.innerWidth) * 100;
            this.mouseY = (e.clientY / window.innerHeight) * 100;
            this.isMouseActive = true;
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
        
        // Animate ambient spots
        setInterval(() => {
            this.updateAmbientSpots();
        }, 50);
        
        // Regenerate spots very frequently for overlapping
        setInterval(() => {
            if (this.ambientSpots.length < this.maxAmbientSpots) {
                this.createAmbientSpot();
            }
        }, 400); // Every 0.4s for maximum chaos
    }
    
    createAmbientSpot() {
        // Expanded vibrant color palette
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
        
        // Varied sizes for more dynamic effect
        const sizeVariation = Math.random();
        let size;
        if (sizeVariation < 0.3) {
            size = 100 + Math.random() * 100; // Small spots
        } else if (sizeVariation < 0.7) {
            size = 200 + Math.random() * 200; // Medium spots
        } else {
            size = 400 + Math.random() * 300; // Large spots
        }
        
        const spot = {
            x: Math.random() * 100,
            y: Math.random() * 100,
            targetX: Math.random() * 100,
            targetY: Math.random() * 100,
            size: size,
            blur: 10 + Math.random() * 30, // Varied blur: 10-40px
            opacity: 0,
            targetOpacity: 0.15 + Math.random() * 0.35, // 0.15-0.5
            speed: 0.01 + Math.random() * 0.04,
            lifetime: 0,
            maxLifetime: 2000 + Math.random() * 4000, // 2-6 seconds
            color: color
        };
        this.ambientSpots.push(spot);
    }
    
    updateAmbientSpots() {
        this.ambientSpots.forEach((spot, index) => {
            // Move towards target
            spot.x += (spot.targetX - spot.x) * spot.speed;
            spot.y += (spot.targetY - spot.y) * spot.speed;
            
            // Fade in/out based on lifetime
            spot.lifetime += 50;
            if (spot.lifetime < 1000) {
                // Fade in
                spot.opacity += (spot.targetOpacity - spot.opacity) * 0.05;
            } else if (spot.lifetime > spot.maxLifetime - 1000) {
                // Fade out
                spot.opacity *= 0.95;
            }
            
            // Remove dead spots
            if (spot.lifetime > spot.maxLifetime || spot.opacity < 0.01) {
                this.ambientSpots.splice(index, 1);
            }
            
            // Pick new target occasionally
            if (Math.random() < 0.01) {
                spot.targetX = Math.random() * 100;
                spot.targetY = Math.random() * 100;
            }
        });
        
        this.updateReveal();
    }
    
    updateReveal() {
        // Build gradient with varied ambient spots
        let gradients = [];
        
        // Add colored ambient spots with varied blur
        this.ambientSpots.forEach(spot => {
            const c = spot.color;
            // Provide a default blur value in case it wasn't set somehow
            const blur = spot.blur || 20;
            gradients.push(`radial-gradient(
                circle ${spot.size}px at ${spot.x}% ${spot.y}%,
                rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity}) 0%,
                rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity * 0.6}) 30%,
                rgba(${c.r}, ${c.g}, ${c.b}, ${spot.opacity * 0.3}) 60%,
                rgba(0, 0, 0, 0) 100%
            )`);
        });
        
        // Apply combined mask to ambient layer
        if (gradients.length > 0) {
            const maskImage = gradients.join(', ');
            document.documentElement.style.setProperty('--ambient-mask', maskImage);
        }
    }
}
