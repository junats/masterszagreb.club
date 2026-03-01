// Three.js Background Effect with Displacement on Hover

class BackgroundEffect {
    constructor(canvasId, imageUrl) {
        this.canvas = document.getElementById(canvasId);
        this.imageUrl = imageUrl;
        
        // Three.js setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            alpha: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Mouse tracking
        this.mouse = new THREE.Vector2(0.5, 0.5);
        this.targetMouse = new THREE.Vector2(0.5, 0.5);
        
        // Displacement strength
        this.displacement = 0;
        this.targetDisplacement = 0;
        
        this.init();
    }
    
    init() {
        // Load texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(this.imageUrl, (texture) => {
            this.createMesh(texture);
            this.setupEventListeners();
            this.animate();
        });
    }
    
    createMesh(texture) {
        // Create shader material with EXTREME displacement effect
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: texture },
                uMouse: { value: this.mouse },
                uDisplacement: { value: 0 },
                uTime: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                uniform vec2 uMouse;
                uniform float uDisplacement;
                uniform float uTime;
                varying vec2 vUv;
                
                void main() {
                    vec2 uv = vUv;
                    
                    // Distance from mouse
                    float dist = distance(uv, uMouse);
                    
                    // MASSIVE displacement effect
                    float radius = 0.8; // Affects almost entire screen
                    float strength = uDisplacement * (1.0 - smoothstep(0.0, radius, dist));
                    
                    // Wave distortion - EXTREME
                    float angle = atan(uv.y - uMouse.y, uv.x - uMouse.x);
                    vec2 waveOffset = vec2(
                        cos(angle + uTime) * strength * 0.15,
                        sin(angle + uTime) * strength * 0.15
                    );
                    
                    // Apply wave distortion
                    vec2 distortedUv = uv + waveOffset;
                    
                    // EXTREME RGB split
                    vec2 rgbOffset = vec2(strength * 0.1);
                    float r = texture2D(uTexture, distortedUv + rgbOffset).r;
                    float g = texture2D(uTexture, distortedUv).g;
                    float b = texture2D(uTexture, distortedUv - rgbOffset).b;
                    
                    // EXTREME pixelation
                    float pixelSize = max(1.0, 1.0 + strength * 100.0);
                    vec2 pixelUv = floor(distortedUv * pixelSize) / pixelSize;
                    vec3 pixelColor = texture2D(uTexture, pixelUv).rgb;
                    
                    // Mix effects
                    vec3 rgbColor = vec3(r, g, b);
                    vec3 finalColor = mix(rgbColor, pixelColor, strength * 0.8);
                    
                    // MASSIVE brightness boost on hover
                    finalColor *= 0.4 + strength * 1.5;
                    
                    // Invert colors in center for dramatic effect
                    if (dist < 0.2 && strength > 0.5) {
                        finalColor = 1.0 - finalColor;
                    }
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            transparent: true
        });
        
        const geometry = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
        
        console.log('🎨 Background mesh created with EXTREME shader effects');
    }
    
    setupEventListeners() {
        // Track mouse on entire document
        let lastMoveTime = Date.now();
        
        document.addEventListener('mousemove', (e) => {
            this.targetMouse.x = e.clientX / window.innerWidth;
            this.targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
            this.targetDisplacement = 5.0; // EXTREME displacement
            lastMoveTime = Date.now();
            
            // Debug log
            if (Math.random() < 0.01) {
                console.log('Mouse:', this.targetMouse.x.toFixed(2), this.targetMouse.y.toFixed(2), 'Disp:', this.displacement.toFixed(2));
            }
        });
        
        // Gradually reduce when not moving
        setInterval(() => {
            if (Date.now() - lastMoveTime > 100) {
                this.targetDisplacement *= 0.85;
            }
        }, 50);
        
        // Window resize
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Very fast mouse follow
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.3;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.3;
        
        // Very fast displacement
        this.displacement += (this.targetDisplacement - this.displacement) * 0.3;
        
        // Update uniforms
        if (this.mesh) {
            this.mesh.material.uniforms.uMouse.value = this.mouse;
            this.mesh.material.uniforms.uDisplacement.value = this.displacement;
            this.mesh.material.uniforms.uTime.value += 0.05; // Faster wave animation
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize background effect
let bgEffect;

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (typeof THREE !== 'undefined') {
            bgEffect = new BackgroundEffect('bgCanvas', 'bg.jpg');
            window.bgEffect = bgEffect;
            console.log('✅ Background effect initialized!');
        }
    });
}
