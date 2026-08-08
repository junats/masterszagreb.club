import { CONFIG } from './config.js';

/**
 * MASTERS Zagreb — Drink Price List & Google Sheets / Excel Live Sync Engine
 * URL Target: https://masterszagreb.club/prices.html
 * Powered by GSAP 3 Animations
 */

export class PricesManager {
    constructor() {
        this.data = null;
        this.items = [];
        this.categories = [];
        this.activeCategory = 'all';
        this.searchQuery = '';
        this.sortBy = 'default';
        this.pollingTimer = null;
        this.gsap = window.gsap || null;
        
        this.initElements();
        this.initEvents();
        this.loadPrices();
        this.startAutoPolling();
    }

    initElements() {
        this.menuContainer = document.getElementById('drinksContainer');
        this.searchInput = document.getElementById('drinksSearch');
        this.filterPills = document.querySelectorAll('.category-pill');
        this.sortSelect = document.getElementById('sortSelect');
        this.syncStatus = document.getElementById('syncStatus');
        this.qrModal = document.getElementById('qrModal');
        this.openQrBtn = document.getElementById('openQrBtn');
        this.closeQrBtn = document.getElementById('closeQrBtn');
        this.itemsCountEl = document.getElementById('itemsCount');
    }

    initEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.render();
            });
        }

        if (this.filterPills) {
            this.filterPills.forEach(pill => {
                pill.addEventListener('click', () => {
                    this.filterPills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    if (window.gsap) {
                        window.gsap.fromTo(pill, { scale: 0.92 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' });
                    }
                    this.activeCategory = pill.dataset.category || 'all';
                    this.render();
                });
            });
        }

        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.render();
            });
        }

        if (this.openQrBtn && this.qrModal) {
            this.openQrBtn.addEventListener('click', () => this.openModal());
        }

        if (this.closeQrBtn && this.qrModal) {
            this.closeQrBtn.addEventListener('click', () => this.closeModal());
            this.qrModal.addEventListener('click', (e) => {
                if (e.target === this.qrModal) this.closeModal();
            });
        }

        // Auto-revalidate when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadPrices(false);
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.qrModal && this.qrModal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    openModal() {
        if (!this.qrModal) return;
        this.qrModal.classList.add('active');
        if (window.gsap) {
            const modalBox = this.qrModal.querySelector('.modal-box');
            window.gsap.fromTo(this.qrModal, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: 'power2.out' });
            if (modalBox) {
                window.gsap.fromTo(modalBox, 
                    { autoAlpha: 0, scale: 0.88, y: 25 }, 
                    { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.4)' }
                );
            }
        }
    }

    closeModal() {
        if (!this.qrModal) return;
        if (window.gsap) {
            const modalBox = this.qrModal.querySelector('.modal-box');
            if (modalBox) {
                window.gsap.to(modalBox, {
                    autoAlpha: 0,
                    scale: 0.92,
                    y: 15,
                    duration: 0.2,
                    ease: 'power2.in'
                });
            }
            window.gsap.to(this.qrModal, {
                autoAlpha: 0,
                duration: 0.22,
                ease: 'power2.in',
                onComplete: () => {
                    this.qrModal.classList.remove('active');
                }
            });
        } else {
            this.qrModal.classList.remove('active');
        }
    }

    startAutoPolling() {
        const interval = (CONFIG && CONFIG.sheetPollingIntervalMs) ? CONFIG.sheetPollingIntervalMs : 30000;
        if (this.pollingTimer) clearInterval(this.pollingTimer);
        this.pollingTimer = setInterval(() => {
            this.loadPrices(false);
        }, interval);
    }

    async loadPrices(showLoading = true) {
        if (showLoading && this.items.length === 0) {
            this.updateSyncBadge('SYNCING...', 'loading');
        }
        
        const sheetUrl = (CONFIG && CONFIG.googleSheetPricesUrl) ? CONFIG.googleSheetPricesUrl : '';

        // Attempt automated Google Sheets sync first if configured
        if (sheetUrl && !sheetUrl.includes('MASTERS_ZAGREB_DRINKS')) {
            const synced = await this.syncFromGoogleSheet(sheetUrl);
            if (synced) return;
        }

        // Otherwise load from local database
        try {
            const res = await fetch(`data/drinks.json?t=${Date.now()}`);
            if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
            const json = await res.json();
            this.data = json;
            this.items = json.items || [];
            this.categories = json.categories || [];
            this.updateSyncBadge('LIVE AUTO-SYNC', 'success');
            this.render();
        } catch (err) {
            console.warn('Local database fallback:', err.message);
            this.loadFallbackDataset();
        }
    }

    async syncFromGoogleSheet(url) {
        try {
            const res = await fetch(`${url}&_t=${Date.now()}`);
            if (!res.ok) throw new Error(`Sheets HTTP ${res.status}`);
            const csv = await res.text();
            
            const parsed = this.parseCsvToDrinks(csv);
            if (parsed && parsed.length > 0) {
                this.items = parsed;
                this.updateSyncBadge('SYNCED // GOOGLE SHEET', 'success');
                this.render();
                return true;
            }
        } catch (err) {
            console.warn('Google Sheets sync unavailable, using local database:', err.message);
        }
        return false;
    }

    parseCsvToDrinks(csvText) {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('piće') || h.includes('naziv') || h.includes('item'));
        const catIdx = headers.findIndex(h => h.includes('cat') || h.includes('kategorija') || h.includes('vrsta'));
        const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('cijena') || h.includes('eur') || h.includes('€'));
        const volIdx = headers.findIndex(h => h.includes('vol') || h.includes('količina') || h.includes('mjera') || h.includes('size'));
        const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('opis') || h.includes('info'));
        const popIdx = headers.findIndex(h => h.includes('pop') || h.includes('hit') || h.includes('top'));

        if (nameIdx === -1 || priceIdx === -1) return [];

        const items = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = this.parseCsvRow(lines[i]);
            if (cols.length <= Math.max(nameIdx, priceIdx)) continue;

            const name = cols[nameIdx]?.trim();
            const rawPrice = cols[priceIdx]?.trim().replace('€', '').replace(',', '.');
            const price = parseFloat(rawPrice);

            if (!name || isNaN(price)) continue;

            const category = (catIdx !== -1 && cols[catIdx]) ? cols[catIdx].trim().toLowerCase() : 'other';
            const volume = (volIdx !== -1 && cols[volIdx]) ? cols[volIdx].trim() : '';
            const description = (descIdx !== -1 && cols[descIdx]) ? cols[descIdx].trim() : '';
            const popular = (popIdx !== -1 && cols[popIdx]) 
                ? (cols[popIdx].toLowerCase() === 'true' || cols[popIdx].toLowerCase() === 'yes' || cols[popIdx] === '1') 
                : false;

            items.push({
                id: `sheet-${i}`,
                name: name,
                category: category,
                price: price,
                volume: volume,
                description: description,
                popular: popular
            });
        }
        return items;
    }

    parseCsvRow(row) {
        const result = [];
        let insideQuote = false;
        let entry = '';
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
                result.push(entry);
                entry = '';
            } else {
                entry += char;
            }
        }
        result.push(entry);
        return result;
    }

    loadFallbackDataset() {
        this.items = [
            { id: 'b1', name: 'Zmajsko Pozoj IPA', category: 'beers', price: 4.80, volume: '0.33L', description: 'Legendarni hrvatski West Coast IPA, snažna gorčina i citrusna aroma.', popular: true },
            { id: 'b2', name: 'Nova Runda C4 IPA', category: 'beers', price: 5.20, volume: '0.5L', description: 'Intenzivni IPA s 4 sorte hmelja. Čista klupska svježina.', popular: true },
            { id: 'b3', name: 'San Servolo Svijetlo', category: 'beers', price: 4.50, volume: '0.33L', description: 'Istarsko premium craft pivo od prirodne izvorske vode.', popular: false },
            { id: 'b4', name: 'Heineken / Ožujsko', category: 'beers', price: 4.00, volume: '0.33L', description: 'Klasični hladni lager za plesni podij.', popular: false },
            { id: 'b5', name: 'Somersby Jabuka Cider', category: 'beers', price: 4.20, volume: '0.33L', description: 'Osvježavajući gazirani voćni cider poslužen na ledu.', popular: false },
            { id: 'c1', name: 'Gin & Tonic // Masters Edition', category: 'cocktails', price: 7.50, volume: '0.3L', description: 'Old Pilot’s gin, premium tonik, dehidrirana limeta & klekove bobe.', popular: true },
            { id: 'c2', name: 'Dark & Stormy', category: 'cocktails', price: 7.00, volume: '0.3L', description: 'Kraken Black Spiced rum, Thomas Henry ginger beer, svježa limeta.', popular: true },
            { id: 'c3', name: 'Negroni Underground', category: 'cocktails', price: 8.00, volume: '0.2L', description: 'Campari, crveni vermut, craft gin, narančina kora.', popular: false },
            { id: 'c4', name: 'Cuba Libre', category: 'cocktails', price: 6.50, volume: '0.3L', description: 'Havana Club 3yo, Coca Cola, svježe cijeđena limeta.', popular: false },
            { id: 'c5', name: 'Aperol Spritz', category: 'cocktails', price: 6.50, volume: '0.25L', description: 'Aperol, prosecco, soda, svježa naranča.', popular: false },
            { id: 's1', name: 'Badakov Pelinkovac Antique', category: 'spirits_shots', price: 3.50, volume: '0.03L', description: 'Izvorni zagrebački biljni liker s komadom naranče.', popular: true },
            { id: 's2', name: 'Jägermeister', category: 'spirits_shots', price: 3.50, volume: '0.03L', description: 'Ledeno poslužen njemački biljni liker s 56 trava.', popular: false },
            { id: 's3', name: 'Old Pilot’s Gin (Zagreb)', category: 'spirits_shots', price: 5.00, volume: '0.03L', description: 'Višestruko nagrađivani zagrebački zanatski gin.', popular: true },
            { id: 's4', name: 'Jack Daniel’s No. 7', category: 'spirits_shots', price: 4.50, volume: '0.03L', description: 'Tennessee sour mash whiskey poslužen solo ili na ledu.', popular: false },
            { id: 's5', name: 'Jameson Irish Whiskey', category: 'spirits_shots', price: 4.20, volume: '0.03L', description: 'Trostruko destilirani glatki irski viski.', popular: false },
            { id: 's6', name: 'Tequila Jose Cuervo Especial', category: 'spirits_shots', price: 3.80, volume: '0.03L', description: 'Silver / Gold tequila poslužena sa soli & limunom.', popular: false },
            { id: 'w1', name: 'Graševina Krauthaker (Kvalitetno)', category: 'wine_bubbles', price: 3.50, volume: '0.1L', description: 'Svježe i suho slavonsko bijelo vino.', popular: false },
            { id: 'w2', name: 'Plavac Mali Tomić', category: 'wine_bubbles', price: 4.00, volume: '0.1L', description: 'Puno i aromatično dalmatinsko crno vino s Hvara.', popular: false },
            { id: 'w3', name: 'Prosecco DOC Brut', category: 'wine_bubbles', price: 4.50, volume: '0.1L', description: 'Osvježavajući pjenušac finih mjehurića.', popular: true },
            { id: 'w4', name: 'Gemišt (Graševina + Jamnica)', category: 'wine_bubbles', price: 3.20, volume: '0.2L', description: 'Kultni zagrebački klupski miks vina i mineralne vode.', popular: true },
            { id: 'nf1', name: 'Club-Mate (0.33L)', category: 'soft_energy', price: 4.00, volume: '0.33L', description: 'Kultno berlinsko piće od yerba mate čaja s prirodnim kofeinom.', popular: true },
            { id: 'nf2', name: 'Red Bull Energy Drink', category: 'soft_energy', price: 4.00, volume: '0.25L', description: 'Originalni energizirajući napitak za cjelonoćni rave.', popular: false },
            { id: 'nf3', name: 'Coca-Cola / Zero', category: 'soft_energy', price: 3.20, volume: '0.25L', description: 'Klasični gazirani osvježavajući napitak.', popular: false },
            { id: 'nf4', name: 'Jamnica Gazirana Mineralna', category: 'soft_energy', price: 2.50, volume: '0.25L', description: 'Prirodna gazirana mineralna voda.', popular: false },
            { id: 'nf5', name: 'Prirodna Voda Jana', category: 'soft_energy', price: 2.50, volume: '0.33L', description: 'Izvorska negazirana voda.', popular: false }
        ];
        this.updateSyncBadge('OFFLINE DATASET', 'fallback');
        this.render();
    }

    updateSyncBadge(text, type) {
        if (!this.syncStatus) return;
        const icon = type === 'success' ? '🟢' : (type === 'loading' ? '🟡' : '⚪');
        this.syncStatus.textContent = `${icon} ${text}`;
        this.syncStatus.className = `sync-badge ${type}`;
    }

    getCategoryTitle(catId) {
        const map = {
            'beers': { name: 'BEERS & CIDERS', sub: 'Točeno pivo & Craft selekcija' },
            'cocktails': { name: 'COCKTAILS & LONG DRINKS', sub: 'Klupski klasici & Signature miksevi' },
            'spirits_shots': { name: 'SPIRITS & SHOTS', sub: 'Domaća žestica, Gin, Vodka & Whiskey' },
            'wine_bubbles': { name: 'WINE & BUBBLES', sub: 'Lokalna vina & Pjenušci' },
            'soft_energy': { name: 'SOFT & ENERGY', sub: 'Club Mate, Red Bull & Bezalkoholna' }
        };
        return map[catId] || { name: catId.toUpperCase(), sub: '' };
    }

    render() {
        if (!this.menuContainer) return;
        this.menuContainer.textContent = '';

        let filtered = this.items.filter(item => {
            const matchesCat = this.activeCategory === 'all' || item.category === this.activeCategory;
            const matchesSearch = !this.searchQuery || 
                item.name.toLowerCase().includes(this.searchQuery) ||
                (item.description && item.description.toLowerCase().includes(this.searchQuery)) ||
                (item.volume && item.volume.toLowerCase().includes(this.searchQuery));
            return matchesCat && matchesSearch;
        });

        // Apply sorting
        if (this.sortBy === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (this.sortBy === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (this.sortBy === 'popular') {
            filtered.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
        }

        if (this.itemsCountEl) {
            this.itemsCountEl.textContent = `${filtered.length} ITEMS`;
        }

        if (filtered.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'empty-search-state';
            emptyEl.innerHTML = `
                <div class="empty-icon">🔍</div>
                <div class="empty-title">NO DRINKS MATCHING "${this.searchQuery.toUpperCase()}"</div>
                <div class="empty-subtitle">Try searching for Gin, Beer, Mate, Pelinkovac or select a different category pill.</div>
            `;
            this.menuContainer.appendChild(emptyEl);
            return;
        }

        // Group by category if viewing 'all' and no active price sort
        if (this.activeCategory === 'all' && (this.sortBy === 'default' || this.sortBy === 'popular')) {
            const categoryOrder = ['beers', 'cocktails', 'spirits_shots', 'wine_bubbles', 'soft_energy'];
            
            categoryOrder.forEach(catId => {
                const catItems = filtered.filter(i => i.category === catId);
                if (catItems.length === 0) return;

                const catInfo = this.getCategoryTitle(catId);
                const section = document.createElement('div');
                section.className = 'drinks-section';

                const header = document.createElement('div');
                header.className = 'section-header';
                header.innerHTML = `
                    <div class="section-title-wrap">
                        <span class="section-title">${catInfo.name}</span>
                        ${catInfo.sub ? `<span class="section-subtitle">${catInfo.sub}</span>` : ''}
                    </div>
                    <span class="section-count">${catItems.length} ITEMS</span>
                `;
                section.appendChild(header);

                const grid = document.createElement('div');
                grid.className = 'drinks-grid';
                catItems.forEach(item => grid.appendChild(this.createDrinkCard(item)));
                section.appendChild(grid);

                this.menuContainer.appendChild(section);
            });
        } else {
            // Flat grid for filtered / sorted view
            const grid = document.createElement('div');
            grid.className = 'drinks-grid';
            filtered.forEach(item => grid.appendChild(this.createDrinkCard(item)));
            this.menuContainer.appendChild(grid);
        }

        // GSAP Stagger Entrance for Drink Cards
        if (window.gsap) {
            window.gsap.fromTo('.drink-card',
                { autoAlpha: 0, y: 18, scale: 0.98 },
                {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.35,
                    stagger: 0.02,
                    ease: 'power2.out',
                    clearProps: 'transform'
                }
            );
        }
    }

    createDrinkCard(item) {
        const card = document.createElement('div');
        card.className = `drink-card ${item.popular ? 'popular' : ''}`;

        const topRow = document.createElement('div');
        topRow.className = 'drink-top-row';

        const nameWrap = document.createElement('div');
        nameWrap.className = 'drink-name-wrap';

        const nameEl = document.createElement('div');
        nameEl.className = 'drink-name';
        nameEl.textContent = item.name;
        nameWrap.appendChild(nameEl);

        if (item.volume) {
            const volEl = document.createElement('span');
            volEl.className = 'drink-volume';
            volEl.textContent = item.volume;
            nameWrap.appendChild(volEl);
        }
        topRow.appendChild(nameWrap);

        const priceEl = document.createElement('div');
        priceEl.className = 'drink-price';
        priceEl.textContent = `${item.price.toFixed(2)} €`;
        topRow.appendChild(priceEl);
        card.appendChild(topRow);

        if (item.description) {
            const descEl = document.createElement('div');
            descEl.className = 'drink-description';
            descEl.textContent = item.description;
            card.appendChild(descEl);
        }

        if (item.popular) {
            const badge = document.createElement('div');
            badge.className = 'popular-badge';
            badge.textContent = '★ CLUB FAVORITE';
            card.appendChild(badge);
        }

        // GSAP Hover Micro-interaction
        if (window.gsap) {
            card.addEventListener('mouseenter', () => {
                window.gsap.to(card, { y: -2, duration: 0.2, ease: 'power1.out' });
                window.gsap.to(priceEl, { scale: 1.08, duration: 0.2, ease: 'back.out(2)' });
            });
            card.addEventListener('mouseleave', () => {
                window.gsap.to(card, { y: 0, duration: 0.2, ease: 'power1.out' });
                window.gsap.to(priceEl, { scale: 1, duration: 0.2, ease: 'power1.out' });
            });
        }

        return card;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.pricesManager = new PricesManager();
});
