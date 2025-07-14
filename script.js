class SP100CapexApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.insights = [];
        this.displayedData = [];
        this.itemsPerPage = 10;
        this.currentPage = 1;
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
    }

    loadMore() {
        this.currentPage++;
        this.updateDisplayedData();
        this.render();
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
                    </div>
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
                            </div>
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
        const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
        const day = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = easternTime.getHours();
        const minute = easternTime.getMinutes();
        const currentTime = hour * 60 + minute; // minutes since midnight
        
        // Market hours: Monday-Friday 9:30 AM - 4:00 PM ET
        const marketOpen = 9 * 60 + 30;  // 9:30 AM
        const marketClose = 16 * 60;     // 4:00 PM
        
        const isWeekday = day >= 1 && day <= 5;
        const isDuringHours = currentTime >= marketOpen && currentTime < marketClose;
        const isOpen = isWeekday && isDuringHours;
        
        const statusText = isOpen ? '🟢 Markets Open' : '🔴 Markets Closed';
        const timeText = easternTime.toLocaleString('en-US', {
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

document.addEventListener('DOMContentLoaded', () => {
    window.app = new SP100CapexApp();
});