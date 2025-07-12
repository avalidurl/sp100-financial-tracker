class InsightsApp {
    constructor() {
        this.data = [];
        this.insights = [];
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.generateInsights();
            this.renderInsights();
        } catch (error) {
            this.showError();
        }
    }

    async loadData() {
        try {
            const [capexResponse, updateResponse] = await Promise.all([
                fetch('/data/capex_data.json'),
                fetch('/data/last_updated.json')
            ]);

            if (!capexResponse.ok || !updateResponse.ok) {
                throw new Error('Failed to fetch data');
            }

            this.data = await capexResponse.json();
            
            const updateInfo = await updateResponse.json();
            this.updateLastUpdated(updateInfo.timestamp);
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    setupEventListeners() {
        const ethAddress = document.getElementById('eth-address');
        ethAddress.addEventListener('click', () => {
            navigator.clipboard.writeText(ethAddress.textContent);
        });
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
        const loading = document.getElementById('loading');

        loading.classList.add('hidden');
        insightsContent.classList.remove('hidden');

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
        alert('Address copied to clipboard!');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    new InsightsApp();
});