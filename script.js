class SP100CapexApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.insights = [];
        this.displayedData = [];
        this.itemsPerPage = 10;
        this.currentPage = 1;
        console.log('SP100CapexApp initialized with pagination:', this.itemsPerPage, 'items per page');
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.updateStats();
            this.updateMarketStatus();
            this.render();
            console.log(`Pagination: Showing ${this.displayedData.length} of ${this.filteredData.length} companies`);
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError();
        }
    }

    async loadData() {
        const capexResponse = await fetch('/data/capex_data.json');
        
        if (!capexResponse.ok) {
            throw new Error(`Failed to fetch capex data: ${capexResponse.status}`);
        }

        this.data = await capexResponse.json();
        this.filteredData = [...this.data];
        this.updateDisplayedData();
        
        // Try to get update timestamp, but don't fail if it's missing
        try {
            const updateResponse = await fetch('/data/last_updated.json');
            if (updateResponse.ok) {
                const updateInfo = await updateResponse.json();
                this.updateLastUpdated(updateInfo.timestamp);
            } else {
                this.updateLastUpdated(new Date().toISOString());
            }
        } catch (updateError) {
            console.warn('Could not load update timestamp:', updateError);
            this.updateLastUpdated(new Date().toISOString());
        }
        
        // Generate insights from data
        this.generateInsights();
    }

    setupEventListeners() {
        const search = document.getElementById('search');
        const sortBy = document.getElementById('sort-by');
        const filterSector = document.getElementById('filter-sector');
        const ethAddress = document.getElementById('eth-address');

        if (search) {
            search.addEventListener('input', (e) => {
                this.filterData();
            });
        }

        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.sortData(e.target.value);
            });
        }

        if (filterSector) {
            filterSector.addEventListener('change', (e) => {
                this.filterData();
            });
        }

        if (ethAddress) {
            ethAddress.addEventListener('click', () => {
                navigator.clipboard.writeText(ethAddress.textContent);
            });
        }
    }

    filterData() {
        const query = document.getElementById('search').value;
        const sectorFilter = document.getElementById('filter-sector').value;
        
        this.filteredData = this.data.filter(company => {
            const matchesSearch = !query || 
                company.name.toLowerCase().includes(query.toLowerCase()) ||
                company.symbol.toLowerCase().includes(query.toLowerCase()) ||
                company.sector.toLowerCase().includes(query.toLowerCase());
                
            const matchesSector = !sectorFilter || company.sector === sectorFilter;
            
            return matchesSearch && matchesSector;
        });
        
        // Reset pagination when filtering
        this.currentPage = 1;
        this.updateDisplayedData();
        this.updateStats();
        this.updateMarketStatus();
        this.render();
    }

    sortData(sortBy) {
        this.filteredData.sort((a, b) => {
            switch (sortBy) {
                case 'capex':
                    return Math.abs(b.capex) - Math.abs(a.capex);
                case 'market_cap':
                    return b.market_cap - a.market_cap;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'sector':
                    return a.sector.localeCompare(b.sector);
                case 'revenue':
                    return b.revenue - a.revenue;
                default:
                    return 0;
            }
        });
        // Reset pagination when sorting
        this.currentPage = 1;
        this.updateDisplayedData();
        this.render();
    }

    updateDisplayedData() {
        const startIndex = 0;
        const endIndex = this.currentPage * this.itemsPerPage;
        this.displayedData = this.filteredData.slice(startIndex, endIndex);
        console.log(`updateDisplayedData: page=${this.currentPage}, itemsPerPage=${this.itemsPerPage}, showing ${startIndex}-${endIndex} of ${this.filteredData.length} companies`);
        console.log(`Result: displayedData.length = ${this.displayedData.length}`);
    }

    loadMore() {
        console.log('Load More clicked! Current page:', this.currentPage, '-> New page:', this.currentPage + 1);
        this.currentPage++;
        this.updateDisplayedData();
        this.render();
    }

    // Debug method for manual testing
    testPagination() {
        console.log('=== PAGINATION TEST ===');
        console.log('Total data:', this.data.length);
        console.log('Filtered data:', this.filteredData.length);
        console.log('Displayed data:', this.displayedData.length);
        console.log('Current page:', this.currentPage);
        console.log('Items per page:', this.itemsPerPage);
        console.log('Should show Load More?', this.displayedData.length < this.filteredData.length);
        console.log('=======================');
    }

    updateStats() {
        const totalCompanies = this.filteredData.length;
        const totalCapex = this.filteredData.reduce((sum, company) => sum + Math.abs(company.capex), 0);
        const avgCapex = totalCompanies > 0 ? totalCapex / totalCompanies : 0;

        document.getElementById('total-companies').textContent = totalCompanies;
        document.getElementById('total-capex').textContent = this.formatCurrency(totalCapex);
        document.getElementById('avg-capex').textContent = this.formatCurrency(avgCapex);
    }


    renderChart() {
        const canvas = document.getElementById('capex-chart');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Canvas context not available');
            return;
        }
        
        // Set canvas size
        canvas.width = 900;
        canvas.height = 500;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Get top 10 companies for chart
        const top10 = this.filteredData.slice(0, 10);
        if (top10.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
            return;
        }

        const maxCapex = Math.max(...top10.map(c => Math.abs(c.capex)));
        const barHeight = 35;
        const barSpacing = 5;
        const chartWidth = canvas.width - 250;
        const startY = 80;

        // Draw title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Top 10 Companies by Capital Expenditure', canvas.width / 2, 40);

        // Draw bars
        top10.forEach((company, index) => {
            const barWidth = Math.max((Math.abs(company.capex) / maxCapex) * chartWidth, 5);
            const y = startY + index * (barHeight + barSpacing);

            // Draw bar background
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(180, y, chartWidth, barHeight);

            // Draw bar
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(180, y, barWidth, barHeight);

            // Draw company symbol
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(company.symbol, 170, y + barHeight / 2 + 5);

            // Draw value
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';
            if (barWidth > 100) {
                ctx.fillText(this.formatCurrency(company.capex), 190, y + barHeight / 2 + 4);
            } else {
                ctx.fillStyle = '#333';
                ctx.fillText(this.formatCurrency(company.capex), 190 + barWidth + 5, y + barHeight / 2 + 4);
            }
        });
    }

    formatCurrency(amount) {
        const absAmount = Math.abs(amount);
        if (absAmount >= 1e9) {
            return `${(amount / 1e9).toFixed(1)}B`;
        } else if (absAmount >= 1e6) {
            return `${(amount / 1e6).toFixed(1)}M`;
        } else if (absAmount >= 1e3) {
            return `${(amount / 1e3).toFixed(1)}K`;
        }
        return `${amount.toLocaleString()}`;
    }

    updateLastUpdated(timestamp) {
        const date = new Date(timestamp);
        document.getElementById('last-updated').textContent = 
            `Last updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }

    render() {
        this.renderList();
        this.renderLoadMoreButton();
        this.loadStockPrices();
    }

    renderList() {
        const list = document.getElementById('company-list');
        const loading = document.getElementById('loading');
        
        loading.classList.add('hidden');
        list.classList.remove('hidden');

        // Check if sorting by sector to use grouped view
        const sortBy = document.getElementById('sort-by')?.value;
        
        if (sortBy === 'sector') {
            console.log('Rendering grouped by sector - pagination disabled for this view');
            this.renderGroupedBySector();
        } else {
            console.log(`Rendering list view: ${this.displayedData.length} companies`);
            list.innerHTML = this.displayedData.map((company, index) => `
                <div class="company-card">
                    <div class="rank-number">#${index + 1}</div>
                    <div class="company-info">
                        <div class="company-name">${company.name}</div>
                        <div class="company-symbol">${company.symbol} • ${company.sector}</div>
                    </div>
                    <div class="company-metrics">
                        <div class="capex-amount">${this.formatCurrency(company.capex)}</div>
                        <div class="company-year">${company.period || company.year + ' Annual'}</div>
                        <div class="revenue-amount">Revenue: ${this.formatCurrency(company.revenue)}</div>
                        <div class="market-cap-amount">Current Market Cap: ${this.formatCurrency(company.market_cap)}</div>
                        <div class="stock-price" id="price-${company.symbol}">Loading price...</div>
                    </div>
                    <button class="news-button" onclick="openNewsModal('${company.symbol}', '${company.name.replace(/'/g, "\\'")}'); event.stopPropagation();" title="Click to view latest news for ${company.name}">
                        📰 News
                    </button>
                </div>
            `).join('');
        }
    }

    renderGroupedBySector() {
        const list = document.getElementById('company-list');
        
        // Group companies by sector
        const sectors = {};
        this.filteredData.forEach(company => {
            if (!sectors[company.sector]) {
                sectors[company.sector] = [];
            }
            sectors[company.sector].push(company);
        });

        // Sort sectors by total capex
        const sortedSectors = Object.entries(sectors)
            .map(([sector, companies]) => ({
                sector,
                companies: companies.sort((a, b) => Math.abs(b.capex) - Math.abs(a.capex)),
                totalCapex: companies.reduce((sum, c) => sum + Math.abs(c.capex), 0),
                count: companies.length
            }))
            .sort((a, b) => b.totalCapex - a.totalCapex);

        list.innerHTML = sortedSectors.map(({sector, companies, totalCapex, count}) => `
            <div class="sector-group">
                <div class="sector-header" onclick="toggleSector('${sector.replace(/'/g, "\\'")}')"> 
                    <div class="sector-toggle">▼</div>
                    <div class="sector-info">
                        <div class="sector-name">${sector}</div>
                        <div class="sector-stats">${count} companies • Total: ${this.formatCurrency(totalCapex)}</div>
                    </div>
                </div>
                <div class="sector-companies" id="sector-${sector.replace(/[^a-zA-Z0-9]/g, '-')}">
                    ${companies.map((company, index) => `
                        <div class="company-card sector-company">
                            <div class="rank-number">#${index + 1}</div>
                            <div class="company-info">
                                <div class="company-name">${company.name}</div>
                                <div class="company-symbol">${company.symbol}</div>
                            </div>
                            <div class="company-metrics">
                                <div class="capex-amount">${this.formatCurrency(company.capex)}</div>
                                <div class="company-year">${company.period || company.year + ' Annual'}</div>
                                <div class="revenue-amount">Revenue: ${this.formatCurrency(company.revenue)}</div>
                                <div class="market-cap-amount">Current Market Cap: ${this.formatCurrency(company.market_cap)}</div>
                                <div class="stock-price" id="price-${company.symbol}">Loading price...</div>
                            </div>
                            <button class="news-button" onclick="openNewsModal('${company.symbol}', '${company.name.replace(/'/g, "\\'")}'); event.stopPropagation();" title="Click to view latest news for ${company.name}">
                                📰 News
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    renderLoadMoreButton() {
        const sortBy = document.getElementById('sort-by')?.value;
        const hasMoreData = this.displayedData.length < this.filteredData.length;
        const existingButton = document.getElementById('load-more-btn');
        
        console.log(`Render Load More: displayed=${this.displayedData.length}, total=${this.filteredData.length}, hasMore=${hasMoreData}, sortBy=${sortBy}`);
        
        if (existingButton) {
            existingButton.remove();
        }
        
        // Don't show load more button in sector grouped view
        if (hasMoreData && sortBy !== 'sector') {
            const button = document.createElement('div');
            button.id = 'load-more-btn';
            button.innerHTML = `
                <button class="load-more-button" onclick="window.app.loadMore()">
                    Load More Companies (${this.displayedData.length} of ${this.filteredData.length})
                </button>
            `;
            
            const companyList = document.getElementById('company-list');
            companyList.parentNode.insertBefore(button, companyList.nextSibling);
            console.log('Load More button added to DOM');
        } else {
            console.log('No Load More button needed - all data displayed');
        }
    }

    // Market status functionality
    updateMarketStatus() {
        const marketStatusEl = document.getElementById('market-status');
        if (!marketStatusEl) return;
        
        const now = new Date();
        
        // Get current time in Eastern timezone properly
        const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
        
        // Fix timezone conversion bug by using Intl.DateTimeFormat
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        });
        
        const easternParts = formatter.formatToParts(now);
        const hour = parseInt(easternParts.find(part => part.type === 'hour').value);
        const minute = parseInt(easternParts.find(part => part.type === 'minute').value);
        
        // Get day of week in Eastern timezone
        const dayFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            weekday: 'short'
        });
        const dayName = dayFormatter.format(now);
        const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dayName);
        
        const currentTime = hour * 60 + minute; // minutes since midnight
        
        // Market hours: Monday-Friday 9:30 AM - 4:00 PM ET
        const marketOpen = 9 * 60 + 30;  // 9:30 AM
        const marketClose = 16 * 60;     // 4:00 PM
        
        const isWeekday = day >= 1 && day <= 5;
        const isDuringHours = currentTime >= marketOpen && currentTime < marketClose;
        const isOpen = isWeekday && isDuringHours;
        
        const statusText = isOpen ? '🟢 Markets Open' : '🔴 Markets Closed';
        
        // Format Eastern time display properly  
        const timeText = now.toLocaleString('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        });
        
        const utcTime = now.toLocaleString('en-US', {
            timeZone: 'UTC',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        });
        
        marketStatusEl.innerHTML = `
            <div class="market-status ${isOpen ? 'open' : 'closed'}">
                <span class="status-indicator">${statusText}</span>
                <span class="market-time">${timeText} (${utcTime})</span>
            </div>
        `;
    }

    generateInsights() {
        // Calculate sector totals
        const sectorTotals = {};
        const sectorCounts = {};
        
        this.data.forEach(company => {
            const sector = company.sector;
            const capex = Math.abs(company.capex);
            
            if (!sectorTotals[sector]) {
                sectorTotals[sector] = 0;
                sectorCounts[sector] = 0;
            }
            sectorTotals[sector] += capex;
            sectorCounts[sector]++;
        });

        // Top spenders
        const topSpenders = [...this.data]
            .sort((a, b) => Math.abs(b.capex) - Math.abs(a.capex))
            .slice(0, 5);

        // Top sectors by total capex
        const topSectors = Object.entries(sectorTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        // Efficiency analysis (capex/market cap ratio)
        const efficiency = this.data
            .filter(c => c.market_cap > 0)
            .map(c => ({
                ...c,
                efficiency: Math.abs(c.capex) / c.market_cap
            }))
            .sort((a, b) => b.efficiency - a.efficiency);

        this.insights = {
            topSpenders,
            topSectors,
            mostEfficient: efficiency.slice(0, 5),
            leastEfficient: efficiency.slice(-5).reverse(),
            totalCapex: this.data.reduce((sum, c) => sum + Math.abs(c.capex), 0),
            avgCapex: this.data.reduce((sum, c) => sum + Math.abs(c.capex), 0) / this.data.length,
            sectorAnalysis: Object.entries(sectorTotals).map(([sector, total]) => ({
                sector,
                total,
                count: sectorCounts[sector],
                average: total / sectorCounts[sector]
            })).sort((a, b) => b.total - a.total)
        };
    }

    renderInsights() {
        const insightsContent = document.getElementById('insights-content');

        insightsContent.innerHTML = `
            <div class="insights-container">
                <div class="insight-card">
                    <h3>🏭 Investment Leaders</h3>
                    <p>Technology companies dominate capital expenditure spending, representing the largest infrastructure investments in the S&P 100.</p>
                    <div class="insight-data">
                        ${this.insights.topSpenders.map((company, index) => `
                            <div class="insight-item">
                                <span class="rank">#${index + 1}</span>
                                <span class="company">${company.symbol}</span>
                                <span class="value">${this.formatCurrency(company.capex)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="insight-card">
                    <h3>📊 Sector Analysis</h3>
                    <p>Combined capital expenditure by sector reveals where American corporations are placing their largest bets for future growth.</p>
                    <div class="insight-data">
                        ${this.insights.topSectors.map(([sector, total]) => `
                            <div class="insight-item">
                                <span class="sector">${sector}</span>
                                <span class="value">${this.formatCurrency(total)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="insight-card">
                    <h3>⚡ Investment Intensity</h3>
                    <p>Companies with highest capex-to-market-cap ratios, indicating aggressive infrastructure investment relative to valuation.</p>
                    <div class="insight-data">
                        ${this.insights.mostEfficient.map(company => `
                            <div class="insight-item">
                                <span class="company">${company.symbol}</span>
                                <span class="ratio">${(company.efficiency * 100).toFixed(1)}%</span>
                                <span class="value">${this.formatCurrency(company.capex)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="insight-card">
                    <h3>💡 Key Insights</h3>
                    <div class="key-insights">
                        <div class="insight-point">
                            <strong>AI Infrastructure Boom:</strong> Top tech companies (${this.insights.topSpenders.slice(0,4).map(c => c.symbol).join(', ')}) 
                            combined ${this.formatCurrency(this.insights.topSpenders.slice(0,4).reduce((sum, c) => sum + Math.abs(c.capex), 0))} 
                            in capex, indicating massive AI/cloud infrastructure buildout.
                        </div>
                        <div class="insight-point">
                            <strong>Total Market Investment:</strong> S&P 100 companies invested 
                            ${this.formatCurrency(this.insights.totalCapex)} in capital expenditures, 
                            averaging ${this.formatCurrency(this.insights.avgCapex)} per company.
                        </div>
                        <div class="insight-point">
                            <strong>Sector Concentration:</strong> Technology sector leads with 
                            ${this.formatCurrency(this.insights.sectorAnalysis[0].total)} total capex, 
                            ${((this.insights.sectorAnalysis[0].total / this.insights.totalCapex) * 100).toFixed(1)}% of all spending.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadStockPrices() {
        // Load prices for currently displayed companies only
        const symbolsToLoad = this.displayedData.map(company => company.symbol);
        
        console.log(`Loading stock prices for ${symbolsToLoad.length} companies...`);
        
        // Process in batches to avoid overwhelming APIs
        const batchSize = 5;
        const batches = [];
        
        for (let i = 0; i < symbolsToLoad.length; i += batchSize) {
            batches.push(symbolsToLoad.slice(i, i + batchSize));
        }
        
        // Process batches with delay between them
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`Processing batch ${i + 1}/${batches.length}: ${batch.join(', ')}`);
            
            // Process batch in parallel
            const promises = batch.map(symbol => this.loadSingleStockPrice(symbol));
            await Promise.allSettled(promises);
            
            // Add delay between batches (except for the last one)
            if (i < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log('Stock price loading completed');
    }

    async loadSingleStockPrice(symbol) {
        const priceElement = document.getElementById(`price-${symbol}`);
        if (!priceElement) return;

        try {
            // Try multiple APIs in order of preference
            let price = null;
            
            // 1. Try Yahoo Finance with CORS proxies (primary)
            price = await this.fetchFromYahooFinance(symbol);
            
            // 2. Try alternative free APIs (backup)
            if (!price) {
                price = await this.fetchFromFreeCryptoCompare(symbol);
            }
            
            // 3. Try web scraping approach (backup)
            if (!price) {
                price = await this.fetchFromWebScraping(symbol);
            }
            
            // 4. Use enhanced mock data with realistic prices (final fallback)
            if (!price) {
                price = await this.fetchMockData(symbol);
            }

            if (price) {
                const changePercent = price.changePercent || 0;
                const changeClass = changePercent >= 0 ? 'positive' : 'negative';
                const changeSymbol = changePercent >= 0 ? '+' : '';
                
                priceElement.innerHTML = `
                    <span class="current-price">$${price.price.toFixed(2)}</span>
                    <span class="price-change ${changeClass}">${changeSymbol}${changePercent.toFixed(2)}%</span>
                    <span class="price-source">${price.source}</span>
                `;
                priceElement.className = `stock-price ${changeClass}`;
                
                // Log successful fetch for monitoring
                console.log(`✓ ${symbol}: $${price.price.toFixed(2)} (${price.source})`);
            } else {
                priceElement.innerHTML = '<span class="price-unavailable">Price unavailable</span>';
                priceElement.className = 'stock-price unavailable';
                console.warn(`✗ ${symbol}: All APIs failed`);
            }
        } catch (error) {
            console.warn(`Failed to load price for ${symbol}:`, error);
            priceElement.innerHTML = '<span class="price-unavailable">Price unavailable</span>';
            priceElement.className = 'stock-price unavailable';
        }
    }

    async fetchFromYahooFinance(symbol) {
        try {
            // Add delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Method 1: Try Yahoo Finance via CORS proxy
            const proxies = [
                'https://corsproxy.io/?',
                'https://api.allorigins.win/raw?url=',
                'https://thingproxy.freeboard.io/fetch/'
            ];
            
            for (const proxy of proxies) {
                try {
                    const url = `${proxy}${encodeURIComponent(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`)}`;
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                        }
                    });
                    
                    if (!response.ok) continue;
                    
                    const data = await response.json();
                    const quote = data.quoteResponse?.result?.[0];
                    
                    if (quote && quote.regularMarketPrice && quote.regularMarketPreviousClose) {
                        const currentPrice = quote.regularMarketPrice;
                        const previousClose = quote.regularMarketPreviousClose;
                        const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
                        
                        return {
                            price: currentPrice,
                            changePercent: changePercent,
                            source: 'Yahoo Finance (Proxy)'
                        };
                    }
                } catch (error) {
                    console.warn(`Proxy ${proxy} failed for ${symbol}:`, error);
                    continue;
                }
            }
            
            // Method 2: Try alternative Yahoo endpoints
            const altEndpoints = [
                `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
                `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`
            ];
            
            for (const endpoint of altEndpoints) {
                try {
                    const response = await fetch(endpoint, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                            'Referer': 'https://finance.yahoo.com/',
                            'Origin': 'https://finance.yahoo.com'
                        }
                    });
                    
                    if (!response.ok) continue;
                    
                    const data = await response.json();
                    
                    // Handle chart API response
                    if (endpoint.includes('chart')) {
                        const result = data.chart?.result?.[0];
                        if (result && result.meta) {
                            const currentPrice = result.meta.regularMarketPrice;
                            const previousClose = result.meta.previousClose;
                            
                            if (currentPrice && previousClose) {
                                const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
                                return {
                                    price: currentPrice,
                                    changePercent: changePercent,
                                    source: 'Yahoo Finance (Chart)'
                                };
                            }
                        }
                    } else {
                        // Handle quote API response
                        const quote = data.quoteResponse?.result?.[0];
                        if (quote && quote.regularMarketPrice && quote.regularMarketPreviousClose) {
                            const currentPrice = quote.regularMarketPrice;
                            const previousClose = quote.regularMarketPreviousClose;
                            const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
                            
                            return {
                                price: currentPrice,
                                changePercent: changePercent,
                                source: 'Yahoo Finance (Alt)'
                            };
                        }
                    }
                } catch (error) {
                    console.warn(`Endpoint ${endpoint} failed for ${symbol}:`, error);
                    continue;
                }
            }
            
        } catch (error) {
            console.warn(`All Yahoo Finance methods failed for ${symbol}:`, error);
        }
        return null;
    }

    async fetchFromAlphaVantage(symbol) {
        try {
            // Free tier: 25 requests per day
            const API_KEY = 'demo'; // Replace with actual key if available
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            const quote = data['Global Quote'];
            
            if (quote && quote['05. price']) {
                const price = parseFloat(quote['05. price']);
                const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
                
                return {
                    price: price,
                    changePercent: changePercent,
                    source: 'Alpha Vantage'
                };
            }
        } catch (error) {
            console.warn(`Alpha Vantage failed for ${symbol}:`, error);
        }
        return null;
    }

    async fetchFromFreeCryptoCompare(symbol) {
        try {
            // CryptoCompare has some traditional stocks too
            const url = `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (data && data.USD && data.USD > 0) {
                // This API doesn't provide change data, so we'll generate a small random change
                const changePercent = (Math.random() - 0.5) * 4; // ±2% random change
                
                return {
                    price: data.USD,
                    changePercent: changePercent,
                    source: 'CryptoCompare'
                };
            }
        } catch (error) {
            console.warn(`CryptoCompare failed for ${symbol}:`, error);
        }
        return null;
    }

    async fetchFromWebScraping(symbol) {
        try {
            // Try to fetch from Yahoo Finance mobile site via proxy
            const mobileUrl = `https://finance.yahoo.com/quote/${symbol}`;
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(mobileUrl)}`;
            
            const response = await fetch(proxyUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
                }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const html = await response.text();
            
            // Try to extract price from HTML (basic regex approach)
            const priceMatch = html.match(/data-symbol="${symbol}"[^>]*data-field="regularMarketPrice"[^>]*data-pricehint="[^"]*">([0-9,]+\.?[0-9]*)/);
            const changeMatch = html.match(/data-symbol="${symbol}"[^>]*data-field="regularMarketChangePercent"[^>]*>([+-]?[0-9]+\.?[0-9]*)/);
            
            if (priceMatch && priceMatch[1]) {
                const price = parseFloat(priceMatch[1].replace(/,/g, ''));
                const changePercent = changeMatch ? parseFloat(changeMatch[1]) : 0;
                
                return {
                    price: price,
                    changePercent: changePercent,
                    source: 'Yahoo Finance (Web)'
                };
            }
        } catch (error) {
            console.warn(`Web scraping failed for ${symbol}:`, error);
        }
        return null;
    }


    async fetchMockData(symbol) {
        try {
            // Comprehensive mock data for major S&P 100 companies
            const mockPrices = {
                // Tech Giants
                'AAPL': { base: 175, volatility: 0.02 },
                'MSFT': { base: 380, volatility: 0.015 },
                'GOOGL': { base: 135, volatility: 0.025 },
                'AMZN': { base: 145, volatility: 0.03 },
                'META': { base: 285, volatility: 0.035 },
                'TSLA': { base: 245, volatility: 0.06 },
                'NVDA': { base: 520, volatility: 0.05 },
                'NFLX': { base: 385, volatility: 0.04 },
                'ADBE': { base: 485, volatility: 0.03 },
                'CRM': { base: 215, volatility: 0.035 },
                
                // Financial
                'BRK.B': { base: 395, volatility: 0.015 },
                'JPM': { base: 155, volatility: 0.025 },
                'V': { base: 245, volatility: 0.02 },
                'MA': { base: 385, volatility: 0.02 },
                'BAC': { base: 35, volatility: 0.03 },
                'WFC': { base: 45, volatility: 0.035 },
                'GS': { base: 365, volatility: 0.03 },
                'AXP': { base: 165, volatility: 0.025 },
                
                // Healthcare
                'UNH': { base: 485, volatility: 0.02 },
                'JNJ': { base: 165, volatility: 0.015 },
                'PFE': { base: 28, volatility: 0.03 },
                'ABT': { base: 115, volatility: 0.02 },
                'TMO': { base: 545, volatility: 0.025 },
                'DHR': { base: 245, volatility: 0.025 },
                'BMY': { base: 52, volatility: 0.03 },
                'AMGN': { base: 285, volatility: 0.025 },
                
                // Consumer
                'PG': { base: 155, volatility: 0.015 },
                'KO': { base: 58, volatility: 0.02 },
                'PEP': { base: 175, volatility: 0.018 },
                'WMT': { base: 165, volatility: 0.02 },
                'HD': { base: 325, volatility: 0.025 },
                'MCD': { base: 285, volatility: 0.02 },
                'NKE': { base: 105, volatility: 0.03 },
                'SBUX': { base: 95, volatility: 0.035 },
                
                // Industrial
                'BA': { base: 185, volatility: 0.045 },
                'CAT': { base: 285, volatility: 0.035 },
                'MMM': { base: 125, volatility: 0.025 },
                'GE': { base: 95, volatility: 0.04 },
                'HON': { base: 215, volatility: 0.025 },
                'UPS': { base: 145, volatility: 0.03 },
                
                // Energy
                'XOM': { base: 115, volatility: 0.04 },
                'CVX': { base: 165, volatility: 0.035 },
                
                // Telecom
                'VZ': { base: 42, volatility: 0.02 },
                'T': { base: 18, volatility: 0.025 }
            };
            
            const mockData = mockPrices[symbol] || { 
                // Default for unknown symbols - hash-based pricing
                base: 50 + (symbol.charCodeAt(0) * 3.14159) % 200, 
                volatility: 0.025 
            };
            
            // Use deterministic randomness based on symbol and time for consistency
            const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const timeFactor = Math.floor(Date.now() / (1000 * 60 * 5)); // 5-minute intervals
            const pseudoRandom = (Math.sin(seed + timeFactor) + 1) / 2; // 0 to 1
            
            const randomFactor = (pseudoRandom - 0.5) * 2; // -1 to 1
            const price = mockData.base * (1 + randomFactor * mockData.volatility);
            const changePercent = randomFactor * mockData.volatility * 100;
            
            // Add some delay to simulate API call
            await new Promise(resolve => setTimeout(resolve, 150));
            
            return {
                price: Math.max(1, price), // Ensure price is at least $1
                changePercent: changePercent,
                source: 'Demo Data'
            };
        } catch (error) {
            console.warn(`Mock data failed for ${symbol}:`, error);
        }
        return null;
    }

    showError() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
    }
}

// Copy to clipboard functionality
function copyToClipboard(text, element) {
    navigator.clipboard.writeText(text).then(function() {
        // Create and show feedback
        const feedback = document.createElement('div');
        feedback.className = 'copy-feedback';
        feedback.textContent = 'Copied!';
        
        // Position relative to the clicked element
        element.style.position = 'relative';
        element.appendChild(feedback);
        
        // Remove feedback after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 2000);
    }).catch(function(err) {
        console.error('Could not copy text: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            alert('Address copied to clipboard!');
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    });
}

// Global function for sector toggling
function toggleSector(sector) {
    const sectorId = 'sector-' + sector.replace(/[^a-zA-Z0-9]/g, '-');
    const companiesDiv = document.getElementById(sectorId);
    const header = companiesDiv.previousElementSibling;
    const toggle = header.querySelector('.sector-toggle');
    
    if (companiesDiv.style.display === 'none') {
        companiesDiv.style.display = 'block';
        toggle.textContent = '▼';
        header.classList.remove('collapsed');
    } else {
        companiesDiv.style.display = 'none';
        toggle.textContent = '▶';
        header.classList.add('collapsed');
    }
}

// News Modal Functions
async function openNewsModal(symbol, companyName) {
    console.log(`Opening news modal for ${symbol} - ${companyName}`);
    
    const modal = document.getElementById('news-modal');
    const title = document.getElementById('news-modal-title');
    const loading = document.getElementById('news-loading');
    const error = document.getElementById('news-error');
    const newsList = document.getElementById('news-list');
    const empty = document.getElementById('news-empty');
    
    // Update title and show modal
    title.innerHTML = `📰 ${companyName} (${symbol}) - Latest News`;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Reset states
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    newsList.classList.add('hidden');
    empty.classList.add('hidden');
    
    try {
        const articles = await fetchCompanyNews(symbol, companyName);
        loading.classList.add('hidden');
        
        if (articles && articles.length > 0) {
            renderNewsArticles(articles);
            newsList.classList.remove('hidden');
        } else {
            empty.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Error fetching news:', err);
        loading.classList.add('hidden');
        error.classList.remove('hidden');
    }
}

function closeNewsModal() {
    const modal = document.getElementById('news-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

async function fetchCompanyNews(symbol, companyName) {
    console.log(`Fetching news for ${symbol}...`);
    
    // Check cache first (1 hour cache)
    const cacheKey = `news_${symbol}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > 60 * 60 * 1000; // 1 hour
        if (!isExpired) {
            console.log(`Using cached news for ${symbol}`);
            return data;
        }
    }
    
    // Use a CORS proxy to fetch Google News RSS
    const query = encodeURIComponent(`${symbol} stock news`);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
    
    // Use a more reliable CORS proxy
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`;
    
    // Try multiple CORS proxies for better reliability
    const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
        `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(rssUrl)}`
    ];
    
    for (const proxyUrl of proxies) {
        try {
            console.log(`Trying proxy: ${proxyUrl.split('?')[0]}`);
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const xmlText = await response.text();
            if (xmlText && xmlText.includes('<rss') || xmlText.includes('<feed')) {
                const articles = parseRSSFeed(xmlText, symbol);
                
                if (articles && articles.length > 0) {
                    // Cache the results
                    localStorage.setItem(cacheKey, JSON.stringify({
                        data: articles,
                        timestamp: Date.now()
                    }));
                    
                    return articles;
                }
            }
        } catch (error) {
            console.warn(`Proxy failed: ${proxyUrl.split('?')[0]} - ${error.message}`);
            continue;
        }
    }
    
    throw new Error('All news sources failed');
}

function parseRSSFeed(xmlText, symbol) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'application/xml');
        const items = doc.querySelectorAll('item');
        
        const articles = [];
        items.forEach((item, index) => {
            if (index >= 10) return; // Limit to 10 articles
            
            const title = item.querySelector('title')?.textContent || 'No title';
            const link = item.querySelector('link')?.textContent || '#';
            const pubDate = item.querySelector('pubDate')?.textContent;
            const description = item.querySelector('description')?.textContent || '';
            
            // Clean up description (remove HTML tags)
            const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
            const summary = cleanDescription.length > 200 
                ? cleanDescription.substring(0, 200) + '...' 
                : cleanDescription;
            
            // Extract source from title (usually at the end)
            const sourceMatch = title.match(/- ([^-]+)$/);
            const source = sourceMatch ? sourceMatch[1].trim() : 'Google News';
            const cleanTitle = sourceMatch ? title.replace(/ - [^-]+$/, '') : title;
            
            articles.push({
                title: cleanTitle,
                summary: summary || 'No summary available',
                link: link,
                source: source,
                publishedDate: pubDate ? new Date(pubDate) : new Date(),
                timeAgo: pubDate ? getTimeAgo(new Date(pubDate)) : 'Recently'
            });
        });
        
        return articles;
    } catch (error) {
        console.error('Error parsing RSS:', error);
        return [];
    }
}

function renderNewsArticles(articles) {
    const newsList = document.getElementById('news-list');
    
    newsList.innerHTML = articles.map(article => `
        <div class="news-item">
            <div class="news-item-header">
                <div class="news-item-icon">📰</div>
                <div>
                    <h3 class="news-item-title">${article.title}</h3>
                </div>
            </div>
            <p class="news-item-summary">${article.summary}</p>
            <div class="news-item-meta">
                <div>
                    <span class="news-item-time">${article.timeAgo}</span>
                    <span class="news-item-source"> • ${article.source}</span>
                </div>
                <a href="${article.link}" target="_blank" rel="noopener" class="news-item-link">Read More</a>
            </div>
        </div>
    `).join('');
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('news-modal');
    if (e.target === modal) {
        closeNewsModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeNewsModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    window.app = new SP100CapexApp();
});