class SP500CapexApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.insights = [];
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.updateStats();
            this.render();
        } catch (error) {
            this.showError();
        }
    }

    async loadData() {
        const [capexResponse, updateResponse] = await Promise.all([
            fetch('./data/capex_data.json'),
            fetch('./data/last_updated.json')
        ]);

        this.data = await capexResponse.json();
        this.filteredData = [...this.data];
        
        const updateInfo = await updateResponse.json();
        this.updateLastUpdated(updateInfo.timestamp);
        
        // Generate insights from data
        this.generateInsights();
    }

    setupEventListeners() {
        const search = document.getElementById('search');
        const sortBy = document.getElementById('sort-by');
        const filterSector = document.getElementById('filter-sector');
        const ethAddress = document.getElementById('eth-address');

        search.addEventListener('input', (e) => {
            this.filterData();
        });

        sortBy.addEventListener('change', (e) => {
            this.sortData(e.target.value);
        });

        filterSector.addEventListener('change', (e) => {
            this.filterData();
        });

        ethAddress.addEventListener('click', () => {
            navigator.clipboard.writeText(ethAddress.textContent);
        });
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
        
        this.updateStats();
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
    }

    renderList() {
        const list = document.getElementById('company-list');
        const loading = document.getElementById('loading');
        
        loading.classList.add('hidden');
        list.classList.remove('hidden');

        list.innerHTML = this.filteredData.map((company, index) => `
            <div class="company-card">
                <div class="rank-number">#${index + 1}</div>
                <div class="company-info">
                    <div class="company-name">${company.name}</div>
                    <div class="company-symbol">${company.symbol} • ${company.sector}</div>
                </div>
                <div class="company-metrics">
                    <div class="capex-amount">${this.formatCurrency(company.capex)}</div>
                    <div class="company-year">${company.year} Annual</div>
                    <div class="revenue-amount">Revenue: ${this.formatCurrency(company.revenue)}</div>
                    <div class="market-cap-amount">Market Cap: ${this.formatCurrency(company.market_cap)}</div>
                </div>
            </div>
        `).join('');
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

document.addEventListener('DOMContentLoaded', () => {
    new SP500CapexApp();
});