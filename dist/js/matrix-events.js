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

    // ── Display Logic ──────────────────────────────────────────────

    displayEvents() {
        if (!this.eventMessages) return;
        this.eventMessages.textContent = '';
        
        const grid = document.createElement('div');
        grid.className = 'events-grid';
        this.eventMessages.appendChild(grid);

        // 1. Precise local date calculation for current weekend
        const now = new Date();
        const weekendDates = this.getWeekendDates(now);
        
        const topRow = [];
        const bottomRow = [];

        // Step A: Top row MUST be Friday, Saturday, Sunday of this week
        weekendDates.forEach(dateInfo => {
            const match = this.events.find(e => this.compareDates(e.date, dateInfo.iso));
            if (match) {
                topRow.push({ ...match, isTBA: false });
            } else {
                topRow.push({
                    title: "TBA — NIGHTCLUB EVENT",
                    date: dateInfo.iso,
                    description: "Schedule pending. See Instagram for details.",
                    instagramUrl: "https://www.instagram.com/masters.zagreb/",
                    isTBA: true
                });
            }
        });

        // Step B: Bottom row shows the next 3 future events AFTER Sunday
        const lastWeekendDay = this.parseDateString(weekendDates[2].iso);
        const futureEvents = this.events
            .filter(e => {
                const eDate = this.parseDateString(e.date);
                return eDate && eDate > lastWeekendDay;
            })
            .sort((a, b) => this.parseDateString(a.date) - this.parseDateString(b.date));

        bottomRow.push(...futureEvents.slice(0, 3));

        // Fill gaps if less than 3 upcoming events exist
        while (bottomRow.length < 3) {
            bottomRow.push({
                title: "UPCOMING EVENT",
                date: "TBC",
                description: "Scanning for next transmission...",
                isTBA: true
            });
        }

        // Render all 6 slots
        [...topRow, ...bottomRow].forEach((event, index) => {
            grid.appendChild(this.createEventCard(event, index));
        });
    }

    createEventCard(event, index) {
        const card = document.createElement('div');
        card.className = `event-card ${event.isTBA ? 'tba-card' : ''}`;
        card.style.opacity = '0';

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

        const dateStr = event.date === 'TBC' ? 'DATE TBC' : this.formatDate(event.date);
        const dateTimeStr = (event.time && event.date !== 'TBC') ? `${dateStr} — ${event.time}` : dateStr;
        
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
        setTimeout(() => { card.style.opacity = '1'; }, 200 + index * 100);
        return card;
    }

    // ── Date Helpers (Local Component Focused) ─────────────────────────

    getWeekendDates(now) {
        const day = now.getDay(); // 0(Sun) - 6(Sat)
        let offset = 0;
        
        // Always target the Friday of the current Monday-Sunday span
        switch(day) {
            case 1: offset = 4; break;  // Mon -> +4
            case 2: offset = 3; break;  // Tue -> +3
            case 3: offset = 2; break;  // Wed -> +2
            case 4: offset = 1; break;  // Thu -> +1
            case 5: offset = 0; break;  // Fri -> 0
            case 6: offset = -1; break; // Sat -> -1
            case 0: offset = -2; break; // Sun -> -2
        }

        const fri = new Date(now);
        fri.setDate(now.getDate() + offset);
        
        const sat = new Date(fri);
        sat.setDate(fri.getDate() + 1);
        
        const sun = new Date(fri);
        sun.setDate(fri.getDate() + 2);

        return [
            { iso: this.toISODate(fri) },
            { iso: this.toISODate(sat) },
            { iso: this.toISODate(sun) }
        ];
    }

    /**
     * Converts a Date object to YYYY-MM-DD using local time components.
     * Avoids .toISOString() which can shift dates by 1 day due to UTC conversion.
     */
    toISODate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * Parses date strings into local Date objects.
     */
    parseDateString(dateString) {
        if (!dateString || dateString === 'DATE PENDING' || dateString === 'TBC') return null;
        
        // DD.MM.YYYY
        const dotParts = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (dotParts) {
            return new Date(parseInt(dotParts[3]), parseInt(dotParts[2]) - 1, parseInt(dotParts[1]));
        }
        
        // YYYY-MM-DD
        const isoParts = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (isoParts) {
            return new Date(parseInt(isoParts[1]), parseInt(isoParts[2]) - 1, parseInt(isoParts[3]));
        }

        const fallback = new Date(dateString);
        return isNaN(fallback.getTime()) ? null : fallback;
    }

    compareDates(d1, d2) {
        const iso1 = this.toISODate(this.parseDateString(d1) || new Date(0));
        const iso2 = this.toISODate(this.parseDateString(d2) || new Date(0));
        return iso1 === iso2;
    }

    formatDate(dateString) {
        if (!dateString || dateString === 'DATE PENDING') return 'DATE PENDING';
        const date = this.parseDateString(dateString);
        if (!date) return 'DATE PENDING';

        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-GB', options).toUpperCase();
    }

    clearMessages() {
        if (this.eventMessages) this.eventMessages.textContent = '';
    }

    getFlyerImages() {
        return this.events.filter(e => e.image).map(e => e.image);
    }
}
