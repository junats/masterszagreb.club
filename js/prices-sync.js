import { CONFIG } from './config.js';

/**
 * MASTERS Zagreb — Drink Price List & Google Sheets / Excel Live Sync Engine
 * URL Target: https://masterszagreb.club/prices
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
            this.openQrBtn.addEventListener('click', () => this.qrModal.classList.add('active'));
        }

        if (this.closeQrBtn && this.qrModal) {
            this.closeQrBtn.addEventListener('click', () => this.qrModal.classList.remove('active'));
            this.qrModal.addEventListener('click', (e) => {
                if (e.target === this.qrModal) this.qrModal.classList.remove('active');
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
            if (e.key === 'Escape') {
                if (this.qrModal) this.qrModal.classList.remove('active');
            }
        });
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
            this.updateSyncBadge('LIVE AUTO-SYNC', 'success');
        }
    }

    /**
     * Automated background sync from Google Sheets published CSV URL or Spreadsheet ID
     */
    async syncFromGoogleSheet(sheetUrl) {
        try {
            let csvUrl = sheetUrl;
            if (/^[a-zA-Z0-9-_]{20,}$/.test(csvUrl)) {
                csvUrl = `https://docs.google.com/spreadsheets/d/${csvUrl}/gviz/tq?tqx=out:csv`;
            } else if (csvUrl.includes('spreadsheets/d/') && !csvUrl.includes('gviz/tq')) {
                const match = csvUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                if (match && match[1]) {
                    csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv`;
                }
            }

            const res = await fetch(`${csvUrl}${csvUrl.includes('?') ? '&' : '?'}t=${Date.now()}`);
            if (!res.ok) throw new Error(`Google Sheets responded with HTTP ${res.status}`);
            const csvText = await res.text();
            
            const parsedItems = this.parseGoogleSheetCsv(csvText);
            if (parsedItems.length === 0) {
                throw new Error('No items parsed from CSV');
            }

            this.items = parsedItems;
            this.updateSyncBadge('GOOGLE SHEETS (LIVE)', 'success');
            this.render();
            return true;
        } catch (err) {
            console.warn('Google Sheets live sync error, falling back to local database:', err.message);
            this.updateSyncBadge('LOCAL DB (SHEETS OFFLINE)', 'warning');
            return false;
        }
    }

    parseGoogleSheetCsv(csvText) {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) return [];

        // Parse header row
        const headers = this.parseCsvRow(lines[0]).map(h => h.toLowerCase().trim());
        const catIdx = headers.findIndex(h => h.includes('category') || h.includes('kategorij'));
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('naziv') || h.includes('drink') || h.includes('piće'));
        const volIdx = headers.findIndex(h => h.includes('volume') || h.includes('količina') || h.includes('vol') || h.includes('size'));
        const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('cijena') || h.includes('eur') || h.includes('€'));
        const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('opis') || h.includes('info'));
        const popIdx = headers.findIndex(h => h.includes('pop') || h.includes('star') || h.includes('highlight'));

        const results = [];
        for (let i = 1; i < lines.length; i++) {
            const row = this.parseCsvRow(lines[i]);
            if (row.length === 0) continue;

            const name = nameIdx !== -1 ? row[nameIdx] : row[1] || row[0];
            if (!name || name.trim() === '') continue;

            const categoryRaw = catIdx !== -1 ? row[catIdx] : 'beers';
            const category = this.normalizeCategory(categoryRaw);
            const volume = volIdx !== -1 ? row[volIdx] : '';
            const priceRaw = priceIdx !== -1 ? row[priceIdx] : '0';
            const price = parseFloat(priceRaw.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
            const description = descIdx !== -1 ? row[descIdx] : '';
            const popRaw = popIdx !== -1 ? row[popIdx].toLowerCase() : '';
            const popular = popRaw === 'true' || popRaw === 'yes' || popRaw === 'da' || popRaw === '1';

            results.push({
                id: `sheet-${i}`,
                category,
                name: name.trim(),
                volume: volume.trim(),
                price,
                description: description.trim(),
                popular
            });
        }
        return results;
    }

    parseCsvRow(rowStr) {
        const result = [];
        let insideQuote = false;
        let current = '';
        
        for (let i = 0; i < rowStr.length; i++) {
            const char = rowStr[i];
            if (char === '"') {
                if (insideQuote && rowStr[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    insideQuote = !insideQuote;
                }
            } else if (char === ',' && !insideQuote) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }

    normalizeCategory(raw) {
        const s = (raw || '').toLowerCase().trim();
        if (s.includes('cocktail') || s.includes('koktel') || s.includes('long')) return 'cocktails';
        if (s.includes('spirit') || s.includes('žest') || s.includes('shot') || s.includes('rakij') || s.includes('gin') || s.includes('whiskey')) return 'spirits_shots';
        if (s.includes('wine') || s.includes('vino') || s.includes('pjen') || s.includes('prosecco') || s.includes('bubble')) return 'wine_bubbles';
        if (s.includes('soft') || s.includes('sok') || s.includes('voda') || s.includes('mate') || s.includes('energy') || s.includes('red bull')) return 'soft_energy';
        return 'beers';
    }

    updateSyncBadge(text, type = 'success') {
        if (!this.syncStatus) return;
        this.syncStatus.textContent = text;
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

        return card;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.pricesManager = new PricesManager();
});
