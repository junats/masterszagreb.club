// Simple Logo & Auto-Pong Game System

class AudioReactiveLogo {
    constructor(canvasId, logoPath, audioElement) {
        this.canvas = document.getElementById(canvasId);
        this.logoElement = document.getElementById('svgLogo');
        this.audioElement = audioElement;
        
        // Three.js setup for Pong only
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            alpha: true,
            antialias: true 
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.camera.position.z = 50;
        
        // Audio setup
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.audioSource = null;
        this.isAudioInitialized = false;
        
        // State
        this.isPongActive = false;
        
        // Pong game
        this.pong = {
            ball: { x: 0, y: 0, vx: 0.3, vy: 0.2, radius: 1 },
            leftPaddle: { x: -20, y: 0, width: 1, height: 8 },
            rightPaddle: { x: 20, y: 0, width: 1, height: 8 },
            bounds: { top: 15, bottom: -15, left: -25, right: 25 }
        };
        
        this.particles = null;
        this.time = 0;
        
        this.init();
    }
    
    init() {
        this.setupLights();
        this.setupInteractions();
        this.animate();
        
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);
    }
    
    setupInteractions() {
        this.logoElement.addEventListener('click', () => this.togglePong());
    }
    
    togglePong() {
        if (this.isPongActive) {
            // Hide Pong, show logo
            this.isPongActive = false;
            this.canvas.style.display = 'none';
            this.logoElement.style.display = 'block';
            if (this.particles) {
                this.scene.remove(this.particles);
                this.particles = null;
            }
        } else {
            // Hide logo, show Pong
            this.isPongActive = true;
            this.logoElement.style.display = 'none';
            this.canvas.style.display = 'block';
            this.resetPong();
            this.createPongParticles();
        }
    }
    
    resetPong() {
        this.pong.ball.x = 0;
        this.pong.ball.y = 0;
        this.pong.ball.vx = (Math.random() > 0.5 ? 1 : -1) * 0.3;
        this.pong.ball.vy = (Math.random() - 0.5) * 0.2;
        
        // Create Pong particles
        this.createPongParticles();
    }
    
    createPongParticles() {
        const particleCount = 150;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Ball particles (30)
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            positions[i * 3] = Math.cos(angle) * this.pong.ball.radius;
            positions[i * 3 + 1] = Math.sin(angle) * this.pong.ball.radius;
            positions[i * 3 + 2] = 0;
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
            sizes[i] = 0.5;
        }
        
        // Left paddle particles (60)
        for (let i = 30; i < 90; i++) {
            const idx = i - 30;
            positions[i * 3] = this.pong.leftPaddle.x;
            positions[i * 3 + 1] = (idx / 60 - 0.5) * this.pong.leftPaddle.height;
            positions[i * 3 + 2] = 0;
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
            sizes[i] = 0.5;
        }
        
        // Right paddle particles (60)
        for (let i = 90; i < 150; i++) {
            const idx = i - 90;
            positions[i * 3] = this.pong.rightPaddle.x;
            positions[i * 3 + 1] = (idx / 60 - 0.5) * this.pong.rightPaddle.height;
            positions[i * 3 + 2] = 0;
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
            sizes[i] = 0.5;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            sizeAttenuation: true
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    updatePong() {
        if (!this.isPongActive || !this.particles) return;
        
        // Update ball
        this.pong.ball.x += this.pong.ball.vx;
        this.pong.ball.y += this.pong.ball.vy;
        
        // Ball collision with top/bottom
        if (this.pong.ball.y > this.pong.bounds.top || this.pong.ball.y < this.pong.bounds.bottom) {
            this.pong.ball.vy *= -1;
        }
        
        // Ball collision with left paddle
        if (this.pong.ball.x < this.pong.leftPaddle.x + 1 && 
            this.pong.ball.y > this.pong.leftPaddle.y - this.pong.leftPaddle.height/2 &&
            this.pong.ball.y < this.pong.leftPaddle.y + this.pong.leftPaddle.height/2) {
            this.pong.ball.vx = Math.abs(this.pong.ball.vx);
            this.pong.ball.vy += (this.pong.ball.y - this.pong.leftPaddle.y) * 0.05;
        }
        
        // Ball collision with right paddle
        if (this.pong.ball.x > this.pong.rightPaddle.x - 1 && 
            this.pong.ball.y > this.pong.rightPaddle.y - this.pong.rightPaddle.height/2 &&
            this.pong.ball.y < this.pong.rightPaddle.y + this.pong.rightPaddle.height/2) {
            this.pong.ball.vx = -Math.abs(this.pong.ball.vx);
            this.pong.ball.vy += (this.pong.ball.y - this.pong.rightPaddle.y) * 0.05;
        }
        
        // Reset ball if out of bounds
        if (this.pong.ball.x < this.pong.bounds.left || this.pong.ball.x > this.pong.bounds.right) {
            this.pong.ball.x = 0;
            this.pong.ball.y = 0;
            this.pong.ball.vx = (Math.random() > 0.5 ? 1 : -1) * 0.3;
            this.pong.ball.vy = (Math.random() - 0.5) * 0.2;
        }
        
        // AI paddles
        this.pong.leftPaddle.y += (this.pong.ball.y - this.pong.leftPaddle.y) * 0.07;
        this.pong.leftPaddle.y = Math.max(this.pong.bounds.bottom + this.pong.leftPaddle.height/2, 
                                          Math.min(this.pong.bounds.top - this.pong.leftPaddle.height/2, 
                                                  this.pong.leftPaddle.y));
        
        this.pong.rightPaddle.y += (this.pong.ball.y - this.pong.rightPaddle.y) * 0.08;
        this.pong.rightPaddle.y = Math.max(this.pong.bounds.bottom + this.pong.rightPaddle.height/2, 
                                           Math.min(this.pong.bounds.top - this.pong.rightPaddle.height/2, 
                                                   this.pong.rightPaddle.y));
        
        // Update particle positions
        const positions = this.particles.geometry.attributes.position.array;
        
        // Ball particles
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            positions[i * 3] = this.pong.ball.x + Math.cos(angle) * this.pong.ball.radius;
            positions[i * 3 + 1] = this.pong.ball.y + Math.sin(angle) * this.pong.ball.radius;
        }
        
        // Left paddle particles
        for (let i = 30; i < 90; i++) {
            const idx = i - 30;
            positions[i * 3] = this.pong.leftPaddle.x;
            positions[i * 3 + 1] = this.pong.leftPaddle.y + (idx / 60 - 0.5) * this.pong.leftPaddle.height;
        }
        
        // Right paddle particles
        for (let i = 90; i < 150; i++) {
            const idx = i - 90;
            positions[i * 3] = this.pong.rightPaddle.x;
            positions[i * 3 + 1] = this.pong.rightPaddle.y + (idx / 60 - 0.5) * this.pong.rightPaddle.height;
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
    }
    
    initAudio() {
        if (this.isAudioInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
            this.audioSource.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.isAudioInitialized = true;
        } catch (error) {
            console.error('Error initializing audio:', error);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.016;
        
        if (this.isPongActive) {
            this.updatePong();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    playAudio() {
        this.initAudio();
        this.audioElement.play();
    }
    
    pauseAudio() {
        this.audioElement.pause();
    }
    
    setVolume(value) {
        this.audioElement.volume = value;
    }
}

window.AudioReactiveLogo = AudioReactiveLogo;
