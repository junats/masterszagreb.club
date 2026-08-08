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
        // Logo in top-left corner is the toggle trigger
        const logo = document.getElementById('svgLogo');
        if (logo) {
            logo.addEventListener('click', () => this.toggleMatrix());
        }

        // Close button inside dialog
        const closeBtn = document.getElementById('matrixCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (this.matrixActive) this.toggleMatrix();
            });
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
        const logo = document.getElementById('svgLogo');
        
        if (this.matrixActive) {
            document.body.classList.add('events-open');
            this.matrixContainer.classList.add('active');
            if (logo) {
                logo.classList.add('events-active');
                logo.setAttribute('aria-expanded', 'true');
            }
            this.startMatrixRain();
            this.loadEvents();
        } else {
            document.body.classList.remove('events-open');
            this.matrixContainer.classList.remove('active');
            if (logo) {
                logo.classList.remove('events-active');
                logo.setAttribute('aria-expanded', 'false');
            }
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

    // ── Events Loading (from active and archive Instagram JSON) ────────

    async loadEvents() {
        if (!this.eventMessages) return;
        this.eventMessages.textContent = '';
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-indicator';
        loadingEl.textContent = 'ACCESSING EVENT DATABASE...';
        this.eventMessages.appendChild(loadingEl);
        
        try {
            // Clean up old localStorage keys
            try {
                localStorage.removeItem('masters_events_cache');
                localStorage.removeItem('masters_events_cache_v2');
            } catch (e) {}

            // Fetch both active events and archived events
            const [activeRes, archiveRes] = await Promise.allSettled([
                fetch(`data/events.json?t=${Date.now()}`),
                fetch(`data/events-archive.json?t=${Date.now()}`)
            ]);

            const activeEvents = (activeRes.status === 'fulfilled' && activeRes.value.ok) 
                ? await activeRes.value.json() 
                : [];
            
            const archiveEvents = (archiveRes.status === 'fulfilled' && archiveRes.value.ok) 
                ? await archiveRes.value.json() 
                : [];

            // Combine and deduplicate
            const pool = Array.isArray(activeEvents) ? [...activeEvents] : [];
            if (Array.isArray(archiveEvents)) {
                for (const item of archiveEvents) {
                    const exists = pool.some(e => 
                        (e.date && e.date === item.date) || 
                        (e.title && e.title.toLowerCase().trim() === item.title.toLowerCase().trim())
                    );
                    if (!exists) pool.push(item);
                }
            }

            this.events = pool.length > 0 ? pool : this.getDemoEvents();
        } catch (error) {
            console.warn('Events fetch failed, using demo events:', error.message);
            this.events = this.getDemoEvents();
        }
        
        this.displayEvents();
    }

    // ── Fallback Demo Events ───────────────────────────────────────────

    getDemoEvents() {
        const now = new Date();
        const todayStr = this.formatDateISOLike(now);

        return [
            {
                title: "SUBOTA 8.8.  MOZER × SPINNSKI",
                date: todayStr,
                time: "23:00",
                description: "vinyl all night",
                image: "assests/events/post-DbodVNtI17B.jpg",
                instagramUrl: "https://www.instagram.com/p/DbodVNtI17B/"
            }
        ];
    }

    formatDateISOLike(d) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}.${month}.${d.getFullYear()}`;
    }

    // ── Display Logic (Next 5 Upcoming & Last 10 Past Events) ──────────

    displayEvents() {
        if (!this.eventMessages) return;
        this.eventMessages.textContent = '';

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        // 1. Next 5 Upcoming Events (on or after today, earliest first)
        const upcomingEvents = this.events
            .filter(e => {
                const eDate = this.parseDateString(e.date);
                return eDate && eDate >= today;
            })
            .sort((a, b) => {
                const dA = this.parseDateString(a.date);
                const dB = this.parseDateString(b.date);
                return dA - dB;
            })
            .slice(0, 5);

        // 2. Last 10 Past Events (before today, most recent first)
        const pastEvents = this.events
            .filter(e => {
                const eDate = this.parseDateString(e.date);
                return eDate && eDate < today;
            })
            .sort((a, b) => {
                const dA = this.parseDateString(a.date);
                const dB = this.parseDateString(b.date);
                return dB - dA; // most recent first
            })
            .slice(0, 10);

        if (upcomingEvents.length === 0 && pastEvents.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'loading-indicator';
            empty.textContent = 'NO EVENTS FOUND IN DATABASE';
            this.eventMessages.appendChild(empty);
            return;
        }

        // Render Section 1: Next 5 Upcoming Events
        if (upcomingEvents.length > 0) {
            const upcomingSection = document.createElement('div');
            upcomingSection.className = 'events-section';

            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'events-section-title';
            sectionTitle.innerHTML = `<span>NEXT EVENTS</span><span class="badge">[${upcomingEvents.length} UPCOMING]</span>`;
            upcomingSection.appendChild(sectionTitle);

            const grid = document.createElement('div');
            grid.className = 'events-grid';
            upcomingEvents.forEach((event, index) => {
                grid.appendChild(this.createEventCard(event, index, false));
            });
            upcomingSection.appendChild(grid);
            this.eventMessages.appendChild(upcomingSection);
        }

        // Render Section 2: Last 10 Past Events
        if (pastEvents.length > 0) {
            const pastSection = document.createElement('div');
            pastSection.className = 'events-section';

            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'events-section-title';
            sectionTitle.innerHTML = `<span>PAST EVENTS</span><span class="badge">[LAST ${pastEvents.length} ARCHIVES]</span>`;
            pastSection.appendChild(sectionTitle);

            const grid = document.createElement('div');
            grid.className = 'events-grid';
            pastEvents.forEach((event, index) => {
                grid.appendChild(this.createEventCard(event, index, true));
            });
            pastSection.appendChild(grid);
            this.eventMessages.appendChild(pastSection);
        }
    }

    getNightclubFallback(index, seed = '') {
        const list = (CONFIG.clubImages && CONFIG.clubImages.length > 0)
            ? CONFIG.clubImages
            : [
                'assests/club-01.webp', 'assests/club-04.webp', 'assests/club-05.webp',
                'assests/club-06.webp', 'assests/club-07.webp', 'assests/club-08.webp',
                'assests/club-09.webp', 'assests/club-10.webp', 'assests/club-11.webp',
                'assests/club-12.webp', 'assests/club-12a.webp', 'assests/club-13.webp',
                'assests/club-14.webp'
            ];
        let hash = 0;
        const str = String(seed || index);
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) | 0;
        }
        const idx = Math.abs(hash + index) % list.length;
        return list[idx];
    }

    createEventCard(event, index, isPast = false) {
        const card = document.createElement('div');
        card.className = `event-card ${isPast ? 'past-card' : ''}`;
        card.style.opacity = '0';

        // Select initial image: flyer image or atmospheric nightclub photo fallback
        const fallbackSrc = this.getNightclubFallback(index, event.title);
        const imageSrc = event.image || fallbackSrc;

        const flyerImg = document.createElement('img');
        flyerImg.src = imageSrc;
        flyerImg.alt = `${event.title} Flyer`;
        flyerImg.className = 'event-flyer-img';

        // If image fails to load, gracefully fall back to atmospheric nightclub shot
        flyerImg.onerror = () => {
            if (!flyerImg.dataset.failed) {
                flyerImg.dataset.failed = 'true';
                flyerImg.src = fallbackSrc;
            }
        };

        if (event.instagramUrl) {
            const flyerLink = document.createElement('a');
            flyerLink.href = event.instagramUrl;
            flyerLink.target = '_blank';
            flyerLink.rel = 'noopener noreferrer';
            flyerLink.className = 'event-flyer-link';
            flyerLink.appendChild(flyerImg);
            card.appendChild(flyerLink);
        } else {
            const flyerWrap = document.createElement('div');
            flyerWrap.className = 'event-flyer-link';
            flyerWrap.appendChild(flyerImg);
            card.appendChild(flyerWrap);
        }

        // Text metadata below the portrait image
        const textSection = document.createElement('div');
        textSection.className = 'event-card-text';

        const dateEl = document.createElement('div');
        dateEl.className = 'event-message event-date';
        dateEl.textContent = event.date || 'DATE TBD';
        textSection.appendChild(dateEl);

        const titleEl = document.createElement('div');
        titleEl.className = 'event-message event-title';
        titleEl.textContent = event.title;
        textSection.appendChild(titleEl);

        if (event.description) {
            const descEl = document.createElement('div');
            descEl.className = 'event-message event-description';
            descEl.textContent = event.description.length > 120 
                ? event.description.substring(0, 120) + '…' 
                : event.description;
            textSection.appendChild(descEl);
        }

        card.appendChild(textSection);

        setTimeout(() => { card.style.opacity = '1'; }, 100 + index * 60);
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
