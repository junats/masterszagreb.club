// Three.js Logo Animation System
// Loads the logo image as a texture and renders it as a 3D object
// You can manipulate the logo mesh directly using Three.js

class LogoAnimator3D {
    constructor(canvasId, logoPath) {
        this.canvas = document.getElementById(canvasId);
        this.logoPath = logoPath;
        
        // Three.js setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 120 / 160, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            alpha: true,
            antialias: true 
        });
        
        this.renderer.setSize(120, 160);
        this.renderer.setClearColor(0x000000, 0);
        this.camera.position.z = 30;
        
        // Animation state
        this.isHovered = false;
        this.isActive = false;
        this.time = 0;
        
        // Objects
        this.logoMesh = null;
        this.particles = null;
        this.energyField = null;
        this.rings = [];
        
        this.init();
    }
    
    init() {
        // Load logo texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(this.logoPath, (texture) => {
            this.createLogoMesh(texture);
            this.createParticles();
            this.createEnergyField();
            this.createRings();
            this.setupLights();
            this.animate();
        }, undefined, (error) => {
            console.error('Error loading logo texture:', error);
        });
    }
    
    createLogoMesh(texture) {
        // Create a plane geometry for the logo
        const aspect = texture.image.width / texture.image.height;
        const width = 12;
        const height = width / aspect;
        
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.logoMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.logoMesh);
        
        console.log('Logo mesh created and added to scene');
    }
    
    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const particleCount = 150;
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Create particles in a cylindrical distribution around logo
            const angle = Math.random() * Math.PI * 2;
            const radius = 8 + Math.random() * 5;
            const height = (Math.random() - 0.5) * 20;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            velocities.push({
                angle: angle,
                radius: radius,
                height: height,
                speed: 0.01 + Math.random() * 0.02,
                verticalSpeed: (Math.random() - 0.5) * 0.05
            });
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x00ff41,
            size: 0.3,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.particles.userData.velocities = velocities;
        this.scene.add(this.particles);
    }
    
    createEnergyField() {
        // Wireframe sphere around logo
        const geometry = new THREE.SphereGeometry(15, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff41,
            wireframe: true,
            transparent: true,
            opacity: 0.05
        });
        
        this.energyField = new THREE.Mesh(geometry, material);
        this.scene.add(this.energyField);
    }
    
    createRings() {
        // Create rotating rings
        for (let i = 0; i < 3; i++) {
            const geometry = new THREE.TorusGeometry(10 + i * 3, 0.2, 16, 100);
            const material = new THREE.MeshBasicMaterial({
                color: i === 0 ? 0x00ff41 : i === 1 ? 0x00ffff : 0xff00ff,
                transparent: true,
                opacity: 0.2
            });
            
            const ring = new THREE.Mesh(geometry, material);
            ring.rotation.x = Math.PI / 2;
            ring.userData.speed = 0.005 + i * 0.003;
            ring.userData.axis = i % 2 === 0 ? 'z' : 'y';
            this.rings.push(ring);
            this.scene.add(ring);
        }
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const pointLight1 = new THREE.PointLight(0xffffff, 1, 50);
        pointLight1.position.set(10, 10, 20);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 50);
        pointLight2.position.set(-10, -10, 20);
        this.scene.add(pointLight2);
        
        // Hide all effects
        if (this.particles) this.particles.material.opacity = 0;
        if (this.energyField) this.energyField.material.opacity = 0;
        this.rings.forEach(ring => ring.material.opacity = 0);
    }
    
    updateLogoMesh() {
        if (!this.logoMesh) return;
        
        // Logo stays completely static - no animations
    }
    
    updateParticles() {
        // Disabled - no particle animations
    }
    
    updateEnergyField() {
        // Disabled - no energy field animations
    }
    
    updateRings() {
        // Disabled - no ring animations
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Only render, no updates or animations
        this.renderer.render(this.scene, this.camera);
    }
    
    setHovered(hovered) {
        this.isHovered = hovered;
    }
    
    setActive(active) {
        this.isActive = active;
        
        // Burst effect
        if (active && this.particles) {
            const velocities = this.particles.userData.velocities;
            velocities.forEach(v => {
                v.speed *= 2;
                v.verticalSpeed *= 2;
            });
        }
    }
    
    // Public API for custom Three.js manipulation
    getScene() {
        return this.scene;
    }
    
    getCamera() {
        return this.camera;
    }
    
    getRenderer() {
        return this.renderer;
    }
    
    getLogoMesh() {
        return this.logoMesh;
    }
    
    addObject(object) {
        this.scene.add(object);
    }
    
    removeObject(object) {
        this.scene.remove(object);
    }
}

// Initialize
let logoAnimator3D;

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (typeof THREE !== 'undefined') {
            // Initialize with canvas ID and refined logo path
            logoAnimator3D = new LogoAnimator3D('logoCanvas3D', 'logo-refined.png');
            
            const logoContainer = document.getElementById('logo');
            
            // Hover effects
            logoContainer.addEventListener('mouseenter', () => {
                logoAnimator3D.setHovered(true);
            });
            
            logoContainer.addEventListener('mouseleave', () => {
                logoAnimator3D.setHovered(false);
            });
            
            // Expose globally
            window.logoAnimator3D = logoAnimator3D;
            
            console.log('✅ Three.js logo animator initialized!');
            console.log('📦 Access scene: window.logoAnimator3D.getScene()');
            console.log('🎨 Access logo mesh: window.logoAnimator3D.getLogoMesh()');
            console.log('📷 Access camera: window.logoAnimator3D.getCamera()');
        } else {
            console.error('❌ Three.js not loaded');
        }
    });
}

