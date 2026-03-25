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
            if (CONFIG.EVENTS_JSON_URL) {
                console.log(`🔍 Accessing event database: ${CONFIG.EVENTS_JSON_URL}`);
                const response = await fetch(`${CONFIG.EVENTS_JSON_URL}?t=${Date.now()}`);
                
                if (!response.ok) {
                    throw new Error(`DB Error ${response.status}`);
                }

                const data = await response.json();
                this.events = data.events && data.events.length > 0 ? data.events : [];
                
                const indicator = document.getElementById('sync-indicator');
                const timestamp = document.getElementById('sync-timestamp');

                if (this.events.length > 0) {
                    console.log(`✅ Synced ${this.events.length} real events.`);
                    if (indicator) {
                        indicator.textContent = '● LIVE SYNC ACTIVE';
                        indicator.className = 'sync-status live';
                    }
                    if (timestamp) {
                        const date = data.lastUpdated ? new Date(data.lastUpdated) : new Date();
                        timestamp.textContent = `LAST UPDATED: ${date.toLocaleTimeString()}`;
                    }
                    this.cacheEvents(this.events);
                } else {
                    console.warn('⚠️ Event database is empty.');
                    throw new Error('Empty Database');
                }
            }
        } catch (error) {
            console.warn('⚠️ Offline/Mock Mode Active:', error.message);
            this.events = this.getMockEvents();
            const indicator = document.getElementById('sync-indicator');
            if (indicator) {
                indicator.textContent = '● OFFLINE / MOCK MODE';
                indicator.className = 'sync-status offline';
            }
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

    getMockEvents() {
        return [
            {
                id: "mock-1",
                title: "[MOCK] COMFORT ZONE — MOARE & MORNIK",
                date: "2026-04-03",
                time: "23:00",
                description: "DJ duo Comfort Zone performing All Night Long. House, Deep House, Electro.",
                image: "assests/club-01.webp",
                instagramUrl: "https://www.instagram.com/masters.zagreb/"
            },
            {
                id: "mock-2",
                title: "[MOCK] GREENLIGHT COLLECTIVE — PER HAMMAR",
                date: "2026-04-04",
                time: "23:00",
                description: "Per Hammar (Dirty Hands / Malmö), Andreas, Grenco, Ian Staraj.",
                image: "assests/club-04.webp",
                instagramUrl: "https://www.instagram.com/masters.zagreb/"
            },
            {
                id: "mock-3",
                title: "[MOCK] CARNERO — BORUT CVAJNER",
                date: "2026-04-10",
                time: "23:00",
                description: "Borut Cvajner, Carnero. Minimal techno and deep grooves.",
                image: "assests/club-05.webp",
                instagramUrl: "https://www.instagram.com/masters.zagreb/"
            },
            {
                id: "mock-4",
                title: "[MOCK] TANZEN — PETAR DUNDOV",
                date: "2026-04-17",
                time: "23:00",
                description: "Master of techno Petar Dundov returns to the booth for a special 3h set.",
                image: "assests/club-06.webp",
                instagramUrl: "https://www.instagram.com/masters.zagreb/"
            },
            {
                id: "mock-5",
                title: "[MOCK] SUBTILNO — D&B NIGHT",
                date: "2026-04-24",
                time: "22:00",
                description: "High energy Drum & Bass all night long with the Subtilno crew.",
                image: "assests/club-07.webp",
                instagramUrl: "https://www.instagram.com/masters.zagreb/"
            },
            {
                id: "mock-6",
                title: "[MOCK] MASTERS ALL NIGHTERS",
                date: "2026-05-01",
                time: "23:00",
                description: "Resident DJs exploring the deep crates of electronic history.",
                image: "assests/club-08.webp",
                instagramUrl: "https://www.instagram.com/masters.zagreb/"
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

            // Left: flyer image
            if (event.image) {
                const imgSide = document.createElement('div');
                imgSide.className = 'event-card-image';

                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'event-flyer-wrapper visible';

                const img = document.createElement('img');
                img.src = event.image;
                img.alt = `${event.title} flyer`;
                img.className = 'event-flyer';
                img.loading = 'lazy';
                
                // Fallback for expired Instagram CDN links
                img.onerror = () => {
                    console.warn(`⚠️ Flyer failed to load for "${event.title}":`, event.image);
                    img.src = 'assests/club-01.webp';
                    img.onerror = null; // Prevent infinite loop if fallback fails
                };

                const scanlines = document.createElement('div');
                scanlines.className = 'event-flyer-scanlines';

                imgWrapper.appendChild(img);
                imgWrapper.appendChild(scanlines);

                if (event.instagramUrl) {
                    const link = document.createElement('a');
                    link.href = event.instagramUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.className = 'event-flyer-link';
                    link.appendChild(imgWrapper);
                    imgSide.appendChild(link);
                } else {
                    imgSide.appendChild(imgWrapper);
                }

                this.startFlyerGlitch(imgWrapper);
                card.appendChild(imgSide);
            }

            // Right: text details
            const textSide = document.createElement('div');
            textSide.className = 'event-card-text';

            const titleEl = document.createElement('div');
            titleEl.className = 'event-message event-title';
            titleEl.textContent = event.title;
            textSide.appendChild(titleEl);

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
        if (!dateString) return 'TBD';

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

        if (isNaN(date.getTime())) return dateString.toUpperCase();

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
