import { CONFIG } from './config.js';

export class MatrixEventManager {
    constructor() {
        this.matrixActive = false;
        this.events = [];
        this.matrixInterval = null;
        this.gsap = window.gsap || null;
        
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
            
            if (window.gsap) {
                const tl = window.gsap.timeline();
                tl.fromTo(this.matrixContainer, 
                    { autoAlpha: 0, scale: 0.95, y: 35 }, 
                    { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: 'power3.out' }
                ).fromTo('.matrix-dialog-header',
                    { opacity: 0, y: -15 },
                    { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
                    '-=0.25'
                );
            }

            if (logo) {
                logo.classList.add('events-active');
                logo.setAttribute('aria-expanded', 'true');
                if (window.gsap) {
                    window.gsap.fromTo(logo, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
                    window.gsap.to(logo, {
                        boxShadow: '0 0 28px rgba(0, 255, 65, 0.65)',
                        borderColor: 'rgba(0, 255, 65, 1)',
                        duration: 1,
                        repeat: -1,
                        yoyo: true,
                        ease: 'sine.inOut'
                    });
                }
            }
            this.startMatrixRain();
            this.loadEvents();
        } else {
            if (window.gsap) {
                window.gsap.to(this.matrixContainer, {
                    autoAlpha: 0,
                    scale: 0.96,
                    y: 20,
                    duration: 0.25,
                    ease: 'power2.in',
                    onComplete: () => {
                        document.body.classList.remove('events-open');
                        this.matrixContainer.classList.remove('active');
                    }
                });
            } else {
                document.body.classList.remove('events-open');
                this.matrixContainer.classList.remove('active');
            }

            if (logo) {
                logo.classList.remove('events-active');
                logo.setAttribute('aria-expanded', 'false');
                if (window.gsap) {
                    window.gsap.killTweensOf(logo);
                    window.gsap.to(logo, {
                        boxShadow: '0 0 0px rgba(0,0,0,0)',
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        duration: 0.3
                    });
                }
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

        if (window.gsap) {
            window.gsap.fromTo(loadingEl, { opacity: 0.3 }, { opacity: 1, duration: 0.6, repeat: -1, yoyo: true, ease: 'power1.inOut' });
        }
        
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
                    if (!pool.some(e => e.id === item.id || (e.title === item.title && e.date === item.date))) {
                        pool.push(item);
                    }
                }
            }

            if (pool.length > 0) {
                this.events = pool;
                this.displayEvents();
            } else {
                this.renderSyntheticEvents();
            }
        } catch (err) {
            console.warn('Events loading warning:', err.message);
            this.renderSyntheticEvents();
        }
    }

    renderSyntheticEvents() {
        if (!this.eventMessages) return;
        this.eventMessages.textContent = '';
        
        const now = new Date();
        const { friStr, satStr } = this.getWeekendDates(now);

        const syntheticUpcoming = [
            {
                title: 'MASTERS CLUB NIGHT // FRIDAY',
                date: friStr,
                description: 'Pure vinyl underground house and techno on our audiophile soundsystem. Covered heated summer terrace & dancefloor.',
                image: 'assests/club-01.webp'
            },
            {
                title: 'WEEKEND ODYSSEY // SATURDAY',
                date: satStr,
                description: 'Zagreb underground selectors taking over the booth until dawn. Minimal, electro, and deep grooves.',
                image: 'assests/club-05.webp'
            }
        ];

        this.events = syntheticUpcoming;
        this.displayEvents();
    }

    parseDateString(dateString) {
        if (!dateString || dateString === 'DATE PENDING' || dateString === 'TBC') return null;
        const dotParts = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (dotParts) {
            return new Date(parseInt(dotParts[3], 10), parseInt(dotParts[2], 10) - 1, parseInt(dotParts[1], 10));
        }
        const isoParts = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (isoParts) {
            return new Date(parseInt(isoParts[1], 10), parseInt(isoParts[2], 10) - 1, parseInt(isoParts[3], 10));
        }
        const fallback = new Date(dateString);
        return isNaN(fallback.getTime()) ? null : fallback;
    }

    displayEvents() {
        if (!this.eventMessages) return;
        this.eventMessages.textContent = '';

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        const upcomingEvents = [];
        const pastEvents = [];

        for (const item of this.events) {
            const parsed = this.parseDateString(item.date);
            if (parsed && parsed >= today) {
                upcomingEvents.push({ ...item, _dateObj: parsed });
            } else if (parsed && parsed < today) {
                pastEvents.push({ ...item, _dateObj: parsed });
            } else {
                upcomingEvents.push({ ...item, _dateObj: new Date(2099, 0, 1) });
            }
        }

        upcomingEvents.sort((a, b) => a._dateObj.getTime() - b._dateObj.getTime());
        pastEvents.sort((a, b) => b._dateObj.getTime() - a._dateObj.getTime());

        if (upcomingEvents.length === 0 && pastEvents.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-search-state';
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

        // GSAP Stagger Entrance for All Event Cards
        if (window.gsap) {
            window.gsap.fromTo('.event-card', 
                { autoAlpha: 0, y: 30, scale: 0.95 },
                { 
                    autoAlpha: 1, 
                    y: 0, 
                    scale: 1, 
                    duration: 0.45, 
                    stagger: 0.04, 
                    ease: 'back.out(1.1)',
                    clearProps: 'transform'
                }
            );
        }
    }

    getNightclubFallback(index, seed = '') {
        const list = (CONFIG.clubImages && CONFIG.clubImages.length > 0)
            ? CONFIG.clubImages
            : [
                'assests/club-01.webp', 'assests/club-05.webp', 'assests/club-06.webp',
                'assests/club-09.webp', 'assests/club-10.webp', 'assests/club-11.webp',
                'assests/club-12.webp', 'assests/club-13.webp', 'assests/club-14.webp'
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
        if (!window.gsap) {
            card.style.opacity = '0';
        }

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

        // GSAP Micro-interaction on Hover
        if (window.gsap) {
            card.addEventListener('mouseenter', () => {
                window.gsap.to(card, { scale: 1.02, y: -3, duration: 0.25, ease: 'power2.out' });
                window.gsap.to(flyerImg, { scale: 1.06, duration: 0.35, ease: 'power2.out' });
            });
            card.addEventListener('mouseleave', () => {
                window.gsap.to(card, { scale: 1, y: 0, duration: 0.25, ease: 'power2.out' });
                window.gsap.to(flyerImg, { scale: 1, duration: 0.35, ease: 'power2.out' });
            });
        } else {
            setTimeout(() => { card.style.opacity = '1'; }, 100 + index * 60);
        }

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

        const pad = (n) => String(n).padStart(2, '0');
        const friStr = `${pad(fri.getDate())}.${pad(fri.getMonth() + 1)}.${fri.getFullYear()}`;
        const satStr = `${pad(sat.getDate())}.${pad(sat.getMonth() + 1)}.${sat.getFullYear()}`;

        return { friStr, satStr };
    }

    clearMessages() {
        if (this.eventMessages) {
            this.eventMessages.textContent = '';
        }
    }
}
