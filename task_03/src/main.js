// Utility functions
async function fetchWithRetry(url, options = {}) {
    const { retries = 3, backoffMs = 1000, timeoutMs = 5000, signal } = options;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            // Merge signals if both provided
            const mergedSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

            const response = await fetch(url, {
                ...options,
                signal: mergedSignal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw error; // Don't retry on abort
            }

            if (attempt === retries) {
                throw error;
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, attempt)));
        }
    }
}

// Cache implementation
class Cache {
    constructor(ttlMs = 5 * 60 * 1000) { // 5 minutes default
        this.cache = new Map();
        this.ttl = ttlMs;
    }

    set(key, value) {
        const expiry = Date.now() + this.ttl;
        this.cache.set(key, { value, expiry });

        // Also store in localStorage for persistence
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify({ value, expiry }));
        } catch (e) {
            // localStorage might be full or disabled
        }
    }

    get(key) {
        // Check memory cache first
        let item = this.cache.get(key);
        if (!item) {
            // Check localStorage
            try {
                const stored = localStorage.getItem(`cache_${key}`);
                if (stored) {
                    item = JSON.parse(stored);
                    this.cache.set(key, item); // Restore to memory
                }
            } catch (e) {
                // localStorage error
            }
        }

        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            try {
                localStorage.removeItem(`cache_${key}`);
            } catch (e) {}
            return null;
        }

        return item.value;
    }

    clear() {
        this.cache.clear();
        // Clear localStorage cache items
        try {
            for (let key in localStorage) {
                if (key.startsWith('cache_')) {
                    localStorage.removeItem(key);
                }
            }
        } catch (e) {}
    }
}

// Global cache instance
const cache = new Cache();

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Main application
class App {
    constructor() {
        this.items = [];
        this.filteredItems = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchQuery = '';
        this.isLoading = false;
        this.error = null;
        this.currentController = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadItems();
    }

    bindEvents() {
        const searchInput = document.getElementById('search');
        const refreshBtn = document.getElementById('refresh');

        searchInput.addEventListener('input', debounce((e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.currentPage = 1;
            this.loadItems();
        }, 300));

        refreshBtn.addEventListener('click', () => {
            cache.clear();
            this.loadItems();
        });
    }

    async loadItems() {
        // Cancel previous request
        if (this.currentController) {
            this.currentController.abort();
        }

        this.currentController = new AbortController();
        this.isLoading = true;
        this.error = null;
        this.render();

        try {
            const cacheKey = `items_${this.searchQuery}`;
            let data = cache.get(cacheKey);

            if (!data) {
                const response = await fetchWithRetry('./data.json', {
                    signal: this.currentController.signal,
                    retries: 2,
                    backoffMs: 500,
                    timeoutMs: 3000
                });
                data = await response.json();

                // Filter by search query
                if (this.searchQuery) {
                    data = data.filter(item =>
                        item.title.toLowerCase().includes(this.searchQuery) ||
                        item.description.toLowerCase().includes(this.searchQuery)
                    );
                }

                cache.set(cacheKey, data);
            }

            this.items = data;
            console.log(data);
            
            this.filteredItems = data;
            this.paginateItems();
        } catch (error) {
            if (error.name === 'AbortError') {
                return; // Request was cancelled
            }
            this.error = error.message;
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    paginateItems() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        this.filteredItems = this.items.slice(start, end);
    }

    changePage(page) {
        this.currentPage = page;
        this.paginateItems();
        this.render();
    }

    render() {
        this.renderStatus();
        this.renderList();
        this.renderPagination();
    }

    renderStatus() {
        const statusEl = document.getElementById('status');
        statusEl.innerHTML = '';

        if (this.isLoading) {
            statusEl.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Загрузка...</p>
                </div>
            `;
        } else if (this.error) {
            statusEl.innerHTML = `
                <div class="error">
                    <p>Ошибка: ${this.error}</p>
                    <button onclick="app.loadItems()">Повторить</button>
                </div>
            `;
        } else if (this.items.length === 0) {
            statusEl.innerHTML = `
                <div class="empty">
                    <p>Ничего не найдено</p>
                </div>
            `;
        }
    }

    renderList() {
        const listEl = document.getElementById('list');

        if (this.isLoading) {
            listEl.innerHTML = Array(6).fill().map(() => `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-image"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-rating"></div>
                    <div class="skeleton skeleton-description"></div>
                    <div class="skeleton skeleton-description"></div>
                </div>
            `).join('');
            return;
        }

        listEl.innerHTML = this.filteredItems.map(item => `
            <div class="item-card">
                <img src="${item.image}" alt="${item.title}" class="item-image" loading="lazy">
                <div class="item-content">
                    <h3 class="item-title">${item.title} (${item.year})</h3>
                    <div class="item-rating">
                        <span class="stars">${'★'.repeat(Math.floor(item.rating))}</span>
                        <span class="rating-value">${item.rating}/10</span>
                    </div>
                    <p class="item-description">${item.description}</p>
                    <span class="item-type">${item.type === 'movie' ? 'Фильм' : 'Игра'}</span>
                </div>
            </div>
        `).join('');
    }

    renderPagination() {
        const paginationEl = document.getElementById('pagination');
        const totalPages = Math.ceil(this.items.length / this.itemsPerPage);

        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        let buttons = [];

        // Previous button
        buttons.push(`<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="app.changePage(${this.currentPage - 1})">‹</button>`);

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            buttons.push(`<button class="page-btn" onclick="app.changePage(1)">1</button>`);
            if (startPage > 2) {
                buttons.push('<span>...</span>');
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(`<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="app.changePage(${i})">${i}</button>`);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons.push('<span>...</span>');
            }
            buttons.push(`<button class="page-btn" onclick="app.changePage(${totalPages})">${totalPages}</button>`);
        }

        // Next button
        buttons.push(`<button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="app.changePage(${this.currentPage + 1})">›</button>`);

        paginationEl.innerHTML = buttons.join('');
    }
}

// Initialize app
const app = new App();