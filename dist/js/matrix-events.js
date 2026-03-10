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

    // ── Google Sheets CSV Fetching ──────────────────────────────────────

    async loadEvents() {
        if (!this.eventMessages) return;
        this.eventMessages.textContent = '';
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-indicator';
        loadingEl.textContent = 'ACCESSING EVENT DATABASE...';
        this.eventMessages.appendChild(loadingEl);
        
        try {
            // Check localStorage cache first
            const cached = this.getCachedEvents();
            if (cached) {
                this.events = cached;
            } else if (CONFIG.SHEETS_CSV_URL) {
                // Fetch from published Google Sheet
                const response = await fetch(CONFIG.SHEETS_CSV_URL);
                if (!response.ok) throw new Error(`Sheet fetch failed: ${response.status}`);
                const csvText = await response.text();
                this.events = this.parseCSV(csvText);
                this.cacheEvents(this.events);
            } else {
                // No Sheet URL configured — use demo events
                console.log('No SHEETS_CSV_URL configured, using demo events');
                this.events = this.getDemoEvents();
            }
        } catch (error) {
            console.warn('Sheet fetch failed, using demo events:', error.message);
            this.events = this.getDemoEvents();
        }
        
        this.displayEvents();
    }

    /**
     * Parse CSV text from Google Sheets into event objects.
     * Expected columns: title, date, time, description
     * First row is treated as the header.
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        // Parse header to find column indices
        const headers = this.parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        const titleIdx = headers.indexOf('title');
        const dateIdx = headers.indexOf('date');
        const timeIdx = headers.indexOf('time');
        const descIdx = headers.indexOf('description');

        if (titleIdx === -1) {
            console.warn('CSV missing "title" column header');
            return [];
        }

        const events = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = this.parseCSVLine(lines[i]);
            const title = (cols[titleIdx] || '').trim();
            if (!title) continue; // skip empty rows

            events.push({
                title,
                date: (cols[dateIdx] || '').trim(),
                time: (cols[timeIdx] || '').trim(),
                description: (cols[descIdx] || '').trim()
            });
        }

        return events;
    }

    /**
     * Parse a single CSV line, respecting quoted fields with commas inside.
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // skip escaped quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
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
                title: 'TECHNO NIGHT',
                date: '2025-12-28',
                time: '22:00',
                description: 'Underground beats with DJ NEXUS. Doors open at 22:00.'
            },
            {
                title: 'NEW YEAR\'S EVE PARTY',
                date: '2025-12-31',
                time: '23:00',
                description: 'Ring in 2026 with the biggest party of the year. VIP tables available.'
            },
            {
                title: 'HOUSE SESSIONS',
                date: '2026-01-04',
                time: '21:00',
                description: 'Deep house vibes every Friday. Guest DJ from Berlin.'
            }
        ];
    }

    // ── Display ────────────────────────────────────────────────────────

    displayEvents() {
        this.eventMessages.textContent = '';
        
        if (this.events.length === 0) {
            this.typeOutText(this.eventMessages, 'NO EVENTS SCHEDULED', 0);
            return;
        }
        
        let currentDelay = 500;
        
        this.events.forEach((event, index) => {
            // Separator between events
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
            
            // Date + Time
            const dateTimeStr = event.time
                ? `[${this.formatDate(event.date)} — ${event.time}]`
                : `[${this.formatDate(event.date)}]`;
            setTimeout(() => {
                const dateEl = document.createElement('div');
                dateEl.className = 'event-message event-date';
                this.eventMessages.appendChild(dateEl);
                this.typeOutText(dateEl, dateTimeStr, 20);
            }, currentDelay);
            currentDelay += (dateTimeStr.length * 20) + 200;
            
            // Description
            if (event.description) {
                setTimeout(() => {
                    const descEl = document.createElement('div');
                    descEl.className = 'event-message event-description';
                    this.eventMessages.appendChild(descEl);
                    this.typeOutText(descEl, event.description, 25);
                }, currentDelay);
                currentDelay += (event.description.length * 25) + 500;
            }
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
        if (!dateString) return 'TBD';

        let date;

        // Handle DD.MM.YYYY format from Google Sheets (e.g. "06.02.2026")
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
}
