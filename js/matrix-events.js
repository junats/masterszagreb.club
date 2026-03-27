import { CONFIG } from './config.js';

export class MatrixEventManager {
    constructor() {
        this.matrixActive = false;
        this.events = [];
        this.matrixInterval = null;
        
        // DOM Elements
        this.matrixContainer = document.getElementById('matrixContainer');
        this.matrixCanvas = document.getElementById('matrixCanvas');
        this.eventMessages = document.getElementById('event-messages');
        
        // Fallback for newer ID if needed
        if (!this.eventMessages) {
            this.eventMessages = document.getElementById('eventMessages');
        }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const morphToggleBtn = document.getElementById('morphToggleBtn');
        if (morphToggleBtn) {
            morphToggleBtn.addEventListener('click', () => this.toggleMatrix());
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
        const morphToggleBtn = document.getElementById('morphToggleBtn');
        
        if (this.matrixActive) {
            this.matrixContainer.classList.add('active');
            if (morphToggleBtn) morphToggleBtn.classList.add('active');
            this.startMatrixRain();
            this.loadEvents();
        } else {
            this.matrixContainer.classList.remove('active');
            if (morphToggleBtn) morphToggleBtn.classList.remove('active');
            this.stopMatrixRain();
            this.clearMessages();
        }
    }

    startMatrixRain() {
        if (this.matrixCanvas) {
            this.matrixCanvas.textContent = '';
        }
    }

    stopMatrixRain() {
        if (this.matrixInterval) {
            clearInterval(this.matrixInterval);
            this.matrixInterval = null;
        }
        if (this.matrixCanvas) {
            this.matrixCanvas.textContent = '';
        }
    }

    // ── Events Loading (from scraped Instagram JSON) ────────────────────

    async loadEvents() {
        if (!this.eventMessages) return;
        this.eventMessages.textContent = '';
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-indicator';
        loadingEl.textContent = 'ACCESSING EVENT DATABASE...';
        this.eventMessages.appendChild(loadingEl);
        
        try {
            // Always try to fetch fresh data (bypassing old cache)
            if (CONFIG.EVENTS_JSON_URL) {
                const response = await fetch(`${CONFIG.EVENTS_JSON_URL}?t=${Date.now()}`);
                if (!response.ok) throw new Error(`Events fetch failed: ${response.status}`);
                const events = await response.json();
                this.events = Array.isArray(events) ? events : [];
                this.cacheEvents(this.events);
            } else {
                this.events = this.getCachedEvents() || this.getDemoEvents();
            }
        } catch (error) {
            console.warn('Events fetch failed, using demo events:', error.message);
            this.events = this.getDemoEvents();
        }
        
        this.displayEvents();
    }

    // ── LocalStorage Cache ─────────────────────────────────────────────

    getCachedEvents() {
        try {
            const raw = localStorage.getItem('masters_events_cache');
            if (!raw) return null;
            const { events, timestamp } = JSON.parse(raw);
            const ageMinutes = (Date.now() - timestamp) / 60000;
            if (ageMinutes > CONFIG.EVENTS_CACHE_MINUTES) {
                localStorage.removeItem('masters_events_cache');
                return null;
            }
            return events;
        } catch {
            return null;
        }
    }

    cacheEvents(events) {
        try {
            localStorage.setItem('masters_events_cache', JSON.stringify({
                events,
                timestamp: Date.now()
            }));
        } catch {
            // localStorage full or unavailable — no big deal
        }
    }

    // ── Fallback Demo Events ───────────────────────────────────────────

    getDemoEvents() {
        return [
            {
                title: "COMFORT ZONE — MOARE & MORNIK",
                date: "2026-04-03",
                time: "23:00",
                description: "All Night Long set. Sound at the intersection of house, deep house, and electro.",
                image: "assests/club-01.webp",
                instagramUrl: "https://www.instagram.com/p/DWUXDt0CDf5/"
            },
            {
                title: "GREENLIGHT — PER HAMMAR",
                date: "2026-04-04",
                time: "23:00",
                description: "Per Hammar (Dirty Hands / Malmö), Andreas, Grenco, Ian Staraj. Dug-out vinyl and original re-edits.",
                image: "assests/club-04.webp",
                instagramUrl: "https://www.instagram.com/p/DWRSrghCJoI/"
            },
            {
                title: "CARNERO B2B BORUT CVAJNER",
                date: "2026-04-10",
                time: "23:00",
                description: "Carnero and Borut Cvajner go back-to-back for a night of deep grooves.",
                image: "assests/club-05.webp",
                instagramUrl: "https://www.instagram.com/p/DWOR1K8Db-2/"
            },
            {
                title: "GRUV HIPNOZA — DLV",
                date: "2026-05-09",
                time: "23:00",
                description: "Old school meets new techno. DLV vinyl-only set on the terrace.",
                image: "assests/club-06.webp",
                instagramUrl: "https://www.instagram.com/p/DWWrdt4DGaA/"
            },
            {
                title: "MINDBEND — DAV BIRTHDAY CELEBRATION",
                date: "2026-05-23",
                time: "23:00",
                description: "Mindbend returns with DAV and Tau Car for a special birthday celebration.",
                image: "assests/club-07.webp",
                instagramUrl: "https://www.instagram.com/p/DWUAcl0iqrR/"
            }
        ];
    }

    // ── Display ────────────────────────────────────────────────────────

    displayEvents() {
        this.eventMessages.textContent = '';
        
        if (this.events.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'event-message event-title';
            empty.textContent = 'NO EVENTS SCHEDULED';
            this.eventMessages.appendChild(empty);
            return;
        }

        // Grid container for all event cards
        const grid = document.createElement('div');
        grid.className = 'events-grid';
        this.eventMessages.appendChild(grid);

        // Show only the last 6 events
        const recentEvents = this.events.slice(-6);

        recentEvents.forEach((event, index) => {
            // Create card
            const card = document.createElement('div');
            card.className = 'event-card';
            card.style.opacity = '0';

            // Right: text details
            const textSide = document.createElement('div');
            textSide.className = 'event-card-text';

            if (event.instagramUrl) {
                const link = document.createElement('a');
                link.href = event.instagramUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'event-title-link';
                
                const titleEl = document.createElement('div');
                titleEl.className = 'event-message event-title';
                titleEl.textContent = event.title;
                link.appendChild(titleEl);
                textSide.appendChild(link);
            } else {
                const titleEl = document.createElement('div');
                titleEl.className = 'event-message event-title';
                titleEl.textContent = event.title;
                textSide.appendChild(titleEl);
            }


            const dateTimeStr = event.time
                ? `${this.formatDate(event.date)} — ${event.time}`
                : this.formatDate(event.date);
            const dateEl = document.createElement('div');
            dateEl.className = 'event-message event-date';
            dateEl.textContent = dateTimeStr;
            textSide.appendChild(dateEl);

            if (event.description) {
                const descEl = document.createElement('div');
                descEl.className = 'event-message event-description';
                descEl.textContent = event.description;
                textSide.appendChild(descEl);
            }

            card.appendChild(textSide);
            grid.appendChild(card);

            // Staggered fade-in
            setTimeout(() => {
                card.style.opacity = '1';
            }, 300 + index * 200);
        });
    }

    /**
     * Random CRT glitch effect on a flyer image wrapper.
     */
    startFlyerGlitch(wrapper) {
        function triggerGlitch() {
            wrapper.classList.add('flyer-glitch');
            setTimeout(() => wrapper.classList.remove('flyer-glitch'), 600);
            const next = 8000 + Math.random() * 12000; // every 8-20s
            setTimeout(triggerGlitch, next);
        }
        setTimeout(triggerGlitch, 3000 + Math.random() * 5000);
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
        if (!dateString || dateString === 'DATE PENDING') return 'DATE PENDING';

        let date;

        // Handle DD.MM.YYYY format (e.g. "06.02.2026")
        const dotParts = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (dotParts) {
            const day = parseInt(dotParts[1], 10);
            const month = parseInt(dotParts[2], 10) - 1; // months are 0-indexed
            const year = parseInt(dotParts[3], 10);
            date = new Date(year, month, day);
        } else {
            // Fallback for ISO dates (e.g. "2025-12-28") and other formats
            date = new Date(dateString);
        }

        if (isNaN(date.getTime())) return 'DATE PENDING';

        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        };
        return date.toLocaleDateString('en-GB', options).toUpperCase();
    }

    clearMessages() {
        if (this.eventMessages) {
            this.eventMessages.textContent = '';
        }
    }

    /**
     * Get flyer image paths from loaded events (for background slideshow integration).
     * @returns {string[]} Array of image paths
     */
    getFlyerImages() {
        return this.events
            .filter(e => e.image)
            .map(e => e.image);
    }
}
