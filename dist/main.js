// MASTERS Nightclub - Matrix Event System

// Rotating Background Images
const backgroundImages = [
    'uploaded_image_0_1766709570509.jpg',
    'uploaded_image_1_1766709570509.jpg',
    'uploaded_image_2_1766709570509.jpg',
    'uploaded_image_3_1766709570509.jpg',
    'uploaded_image_4_1766709570509.jpg'
];

let currentBgIndex = 0;
let isTransitioning = false;

function rotateBackground() {
    if (isTransitioning) return;
    isTransitioning = true;
    
    const grainOverlay = document.querySelector('.grain-overlay');
    const bodyAfter = document.body;
    
    // Fade to black
    grainOverlay.style.opacity = '0';
    bodyAfter.style.setProperty('--bg-opacity', '0');
    
    setTimeout(() => {
        // Change image while black
        currentBgIndex = (currentBgIndex + 1) % backgroundImages.length;
        const bgImage = backgroundImages[currentBgIndex];
        document.body.style.setProperty('--bg-image', `url('${bgImage}')`);
        
        // Fade back in
        setTimeout(() => {
            grainOverlay.style.opacity = '1';
            bodyAfter.style.setProperty('--bg-opacity', '1');
            isTransitioning = false;
        }, 500);
    }, 1000); // Black screen duration
    
    // Rotate every 8 seconds
    setTimeout(rotateBackground, 8000);
}

// Start rotation after initial load
setTimeout(rotateBackground, 8000);

// Advanced Background Reveal System
class BackgroundRevealSystem {
    constructor() {
        this.ambientSpots = [];
        this.maxAmbientSpots = 15; // Massive increase for overlapping
        this.mouseX = 50;
        this.mouseY = 50;
        this.isMouseActive = false;
        this.init();
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

// Initialize reveal system
const revealSystem = new BackgroundRevealSystem();

const API_URL = 'http://localhost:3000/api/events'; // Update this when backend is ready

// State
let matrixActive = false;
let events = [];
let matrixInterval = null;
let audioLogo = null;

// DOM Elements
const matrixContainer = document.getElementById('matrixContainer');
const matrixCanvas = document.getElementById('matrixCanvas');
const eventMessages = document.getElementById('eventMessages');
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeLabel = document.querySelector('.volume-label');
const playIcon = document.querySelector('.play-icon');
const pauseIcon = document.querySelector('.pause-icon');

// Initialize Audio-Reactive Logo (without audio player)
window.addEventListener('DOMContentLoaded', () => {
    if (typeof AudioReactiveLogo !== 'undefined') {
        // SoundCloud handles audio now
        console.log('✅ Logo system initialized!');
    }
    
    // Logo click to toggle Matrix events
    const svgLogo = document.getElementById('svgLogo');
    if (svgLogo) {
        svgLogo.addEventListener('click', toggleMatrix);
        
        // Random CRT TV glitch effect
        function triggerRandomGlitch() {
            svgLogo.classList.add('glitch');
            setTimeout(() => {
                svgLogo.classList.remove('glitch');
            }, 600); // Longer for CRT effect
            
            // Schedule next glitch randomly (3-7 seconds)
            const nextGlitch = 3000 + Math.random() * 4000;
            setTimeout(triggerRandomGlitch, nextGlitch);
        }
        
        // Start glitch loop
        setTimeout(triggerRandomGlitch, 3000);
    }
});

// Hamburger Menu Toggle
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuLinks = document.querySelectorAll('.mobile-menu-links a');

hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
});

// Close menu when clicking links
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburgerBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        hamburgerBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
    }
});

function toggleMatrix() {
    matrixActive = !matrixActive;
    
    if (matrixActive) {
        matrixContainer.classList.add('active');
        startMatrixRain();
        loadEvents();
    } else {
        matrixContainer.classList.remove('active');
        stopMatrixRain();
        clearMessages();
    }
}

// Terminal Typing Effect (no falling letters)
function startMatrixRain() {
    // No falling letters - just keep the canvas clean
    matrixCanvas.innerHTML = '';
}

function stopMatrixRain() {
    if (matrixInterval) {
        clearInterval(matrixInterval);
        matrixInterval = null;
    }
    matrixCanvas.innerHTML = '';
}

// Event Loading
async function loadEvents() {
    eventMessages.innerHTML = '<div class="loading-indicator">ACCESSING EVENT DATABASE...</div>';
    
    try {
        // Try to fetch from backend
        const response = await fetch(API_URL);
        if (response.ok) {
            events = await response.json();
        } else {
            throw new Error('Backend not available');
        }
    } catch (error) {
        // Fallback to demo events if backend is not ready
        console.log('Using demo events:', error.message);
        events = getDemoEvents();
    }
    
    displayEvents();
}

function getDemoEvents() {
    return [
        {
            title: 'TECHNO NIGHT',
            date: '2025-12-28 22:00',
            description: 'Underground beats with DJ NEXUS. Doors open at 22:00.'
        },
        {
            title: 'NEW YEAR\'S EVE PARTY',
            date: '2025-12-31 23:00',
            description: 'Ring in 2026 with the biggest party of the year. VIP tables available.'
        },
        {
            title: 'HOUSE SESSIONS',
            date: '2026-01-04 21:00',
            description: 'Deep house vibes every Friday. Guest DJ from Berlin.'
        }
    ];
}

function displayEvents() {
    eventMessages.innerHTML = '';
    
    if (events.length === 0) {
        typeOutText(eventMessages, 'NO EVENTS SCHEDULED', 0);
        return;
    }
    
    // Type out events one by one with delays
    let currentDelay = 500; // Initial delay
    
    events.forEach((event, index) => {
        // Add separator line before each event (except first)
        if (index > 0) {
            setTimeout(() => {
                const separator = document.createElement('div');
                separator.className = 'event-separator';
                separator.textContent = '─'.repeat(60);
                eventMessages.appendChild(separator);
            }, currentDelay);
            currentDelay += 300;
        }
        
        // Type out title
        setTimeout(() => {
            const titleEl = document.createElement('div');
            titleEl.className = 'event-message event-title';
            eventMessages.appendChild(titleEl);
            typeOutText(titleEl, `> ${event.title}`, 30);
        }, currentDelay);
        currentDelay += (event.title.length * 30) + 200;
        
        // Type out date
        setTimeout(() => {
            const dateEl = document.createElement('div');
            dateEl.className = 'event-message event-date';
            eventMessages.appendChild(dateEl);
            typeOutText(dateEl, `[${formatDate(event.date)}]`, 20);
        }, currentDelay);
        const formattedDate = formatDate(event.date);
        currentDelay += (formattedDate.length * 20) + 200;
        
        // Type out description
        setTimeout(() => {
            const descEl = document.createElement('div');
            descEl.className = 'event-message event-description';
            eventMessages.appendChild(descEl);
            typeOutText(descEl, event.description, 25);
        }, currentDelay);
        currentDelay += (event.description.length * 25) + 500;
    });
}

// Old-school terminal typing effect - character by character
function typeOutText(element, text, speed = 30) {
    let index = 0;
    element.textContent = '';
    element.classList.add('typing-cursor');
    
    const typeInterval = setInterval(() => {
        if (index < text.length) {
            element.textContent += text[index];
            index++;
        } else {
            clearInterval(typeInterval);
            element.classList.remove('typing-cursor');
        }
    }, speed);
}

function typeMessage(element) {
    // Legacy function - no longer used
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options).toUpperCase();
}

function clearMessages() {
    eventMessages.innerHTML = '';
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && matrixActive) {
        toggleMatrix();
    }
});

// Initialize
console.log('MASTERS system initialized...');
