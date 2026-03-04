// Three.js Background Effect with Displacement on Hover

export class BackgroundEffect {
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
                    
                    float dist = distance(uv, uMouse);
                    float radius = 0.8; 
                    float strength = uDisplacement * (1.0 - smoothstep(0.0, radius, dist));
                    
                    float angle = atan(uv.y - uMouse.y, uv.x - uMouse.x);
                    vec2 waveOffset = vec2(
                        cos(angle + uTime) * strength * 0.15,
                        sin(angle + uTime) * strength * 0.15
                    );
                    
                    vec2 distortedUv = uv + waveOffset;
                    vec2 rgbOffset = vec2(strength * 0.1);
                    float r = texture2D(uTexture, distortedUv + rgbOffset).r;
                    float g = texture2D(uTexture, distortedUv).g;
                    float b = texture2D(uTexture, distortedUv - rgbOffset).b;
                    
                    float pixelSize = max(1.0, 1.0 + strength * 100.0);
                    vec2 pixelUv = floor(distortedUv * pixelSize) / pixelSize;
                    vec3 pixelColor = texture2D(uTexture, pixelUv).rgb;
                    
                    vec3 rgbColor = vec3(r, g, b);
                    vec3 finalColor = mix(rgbColor, pixelColor, strength * 0.8);
                    
                    finalColor *= 0.4 + strength * 1.5;
                    
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
    }
    
    setupEventListeners() {
        let lastMoveTime = Date.now();
        
        document.addEventListener('mousemove', (e) => {
            this.targetMouse.x = e.clientX / window.innerWidth;
            this.targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
            this.targetDisplacement = 5.0; 
            lastMoveTime = Date.now();
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.targetMouse.x = e.touches[0].clientX / window.innerWidth;
                this.targetMouse.y = 1.0 - (e.touches[0].clientY / window.innerHeight);
                this.targetDisplacement = 5.0; 
                lastMoveTime = Date.now();
            }
        }, { passive: true });
        
        setInterval(() => {
            if (Date.now() - lastMoveTime > 100) {
                this.targetDisplacement *= 0.85;
            }
        }, 50);
        
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.3;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.3;
        this.displacement += (this.targetDisplacement - this.displacement) * 0.3;
        
        if (this.mesh) {
            this.mesh.material.uniforms.uMouse.value = this.mouse;
            this.mesh.material.uniforms.uDisplacement.value = this.displacement;
            this.mesh.material.uniforms.uTime.value += 0.05; 
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}
