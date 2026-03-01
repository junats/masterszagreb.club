import { CONFIG } from './config.js';

export class MatrixEventManager {
    constructor() {
        this.matrixActive = false;
        this.events = [];
        this.matrixInterval = null;
        
        // DOM Elements
        this.matrixContainer = document.getElementById('matrixContainer');
        this.matrixCanvas = document.getElementById('matrixCanvas');
        this.eventMessages = document.getElementById('eventMessages');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const eventsToggleBtn = document.getElementById('eventsToggleBtn');
        if (eventsToggleBtn) {
            eventsToggleBtn.addEventListener('click', () => this.toggleMatrix());
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.matrixActive) {
                this.toggleMatrix();
            }
        });
    }

    toggleMatrix() {
        this.matrixActive = !this.matrixActive;
        const eventsToggleBtn = document.getElementById('eventsToggleBtn');
        
        if (this.matrixActive) {
            this.matrixContainer.classList.add('active');
            if (eventsToggleBtn) eventsToggleBtn.classList.add('active');
            this.startMatrixRain();
            this.loadEvents();
        } else {
            this.matrixContainer.classList.remove('active');
            if (eventsToggleBtn) eventsToggleBtn.classList.remove('active');
            this.stopMatrixRain();
            this.clearMessages();
        }
    }

    startMatrixRain() {
        // Keeping it clean without falling letters
        if (this.matrixCanvas) {
            this.matrixCanvas.innerHTML = '';
        }
    }

    stopMatrixRain() {
        if (this.matrixInterval) {
            clearInterval(this.matrixInterval);
            this.matrixInterval = null;
        }
        if (this.matrixCanvas) {
            this.matrixCanvas.innerHTML = '';
        }
    }

    async loadEvents() {
        if (!this.eventMessages) return;
        this.eventMessages.innerHTML = '<div class="loading-indicator">ACCESSING EVENT DATABASE...</div>';
        
        try {
            // Try to fetch from backend
            const response = await fetch(CONFIG.API_URL);
            if (response.ok) {
                this.events = await response.json();
            } else {
                throw new Error('Backend not available');
            }
        } catch (error) {
            // Fallback to demo events
            console.log('Using demo events:', error.message);
            this.events = this.getDemoEvents();
        }
        
        this.displayEvents();
    }

    getDemoEvents() {
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

    displayEvents() {
        this.eventMessages.innerHTML = '';
        
        if (this.events.length === 0) {
            this.typeOutText(this.eventMessages, 'NO EVENTS SCHEDULED', 0);
            return;
        }
        
        // Type out events one by one with delays
        let currentDelay = 500; // Initial delay
        
        this.events.forEach((event, index) => {
            // Add separator
            if (index > 0) {
                setTimeout(() => {
                    const separator = document.createElement('div');
                    separator.className = 'event-separator';
                    separator.textContent = '─'.repeat(60);
                    this.eventMessages.appendChild(separator);
                }, currentDelay);
                currentDelay += 300;
            }
            
            // Title
            setTimeout(() => {
                const titleEl = document.createElement('div');
                titleEl.className = 'event-message event-title';
                this.eventMessages.appendChild(titleEl);
                this.typeOutText(titleEl, `> ${event.title}`, 30);
            }, currentDelay);
            currentDelay += (event.title.length * 30) + 200;
            
            // Date
            setTimeout(() => {
                const dateEl = document.createElement('div');
                dateEl.className = 'event-message event-date';
                this.eventMessages.appendChild(dateEl);
                this.typeOutText(dateEl, `[${this.formatDate(event.date)}]`, 20);
            }, currentDelay);
            const formattedDate = this.formatDate(event.date);
            currentDelay += (formattedDate.length * 20) + 200;
            
            // Description
            setTimeout(() => {
                const descEl = document.createElement('div');
                descEl.className = 'event-message event-description';
                this.eventMessages.appendChild(descEl);
                this.typeOutText(descEl, event.description, 25);
            }, currentDelay);
            currentDelay += (event.description.length * 25) + 500;
        });
    }

    typeOutText(element, text, speed = 30) {
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

    formatDate(dateString) {
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

    clearMessages() {
        if (this.eventMessages) {
            this.eventMessages.innerHTML = '';
        }
    }
}
