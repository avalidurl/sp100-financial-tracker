// Debug version to identify the data loading issue
class SP100CapexApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.insights = [];
        console.log('SP100CapexApp initialized');
        this.init();
    }

    async init() {
        console.log('Starting initialization...');
        try {
            console.log('About to load data...');
            await this.loadData();
            console.log('Data loaded successfully, setting up listeners...');
            this.setupEventListeners();
            this.updateStats();
            this.render();
            console.log('Initialization complete!');
        } catch (error) {
            console.error('Error initializing app:', error);
            console.error('Error stack:', error.stack);
            this.showError();
        }
    }

    async loadData() {
        console.log('Fetching capex data from /data/capex_data.json...');
        
        try {
            const capexResponse = await fetch('/data/capex_data.json');
            console.log('Capex response status:', capexResponse.status);
            console.log('Capex response ok:', capexResponse.ok);
            
            if (!capexResponse.ok) {
                throw new Error(`Failed to fetch capex data: ${capexResponse.status}`);
            }

            console.log('Parsing capex JSON...');
            this.data = await capexResponse.json();
            console.log('Capex data parsed, length:', this.data.length);
            this.filteredData = [...this.data];
            
            // Try to get update timestamp, but don't fail if it's missing
            try {
                console.log('Fetching last updated data...');
                const updateResponse = await fetch('/data/last_updated.json');
                console.log('Update response status:', updateResponse.status);
                
                if (updateResponse.ok) {
                    const updateInfo = await updateResponse.json();
                    console.log('Update info:', updateInfo);
                    this.updateLastUpdated(updateInfo.timestamp);
                } else {
                    console.log('Using current timestamp as fallback');
                    this.updateLastUpdated(new Date().toISOString());
                }
            } catch (updateError) {
                console.warn('Could not load update timestamp:', updateError);
                this.updateLastUpdated(new Date().toISOString());
            }
            
            // Generate insights from data
            console.log('Generating insights...');
            this.generateInsights();
            console.log('Insights generated');
            
        } catch (fetchError) {
            console.error('Fetch error details:', fetchError);
            throw fetchError;
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        const search = document.getElementById('search');
        const sortBy = document.getElementById('sort-by');
        const filterSector = document.getElementById('filter-sector');
        const ethAddress = document.getElementById('eth-address');

        console.log('Elements found:', {
            search: !!search,
            sortBy: !!sortBy, 
            filterSector: !!filterSector,
            ethAddress: !!ethAddress
        });

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

    updateStats() {
        console.log('Updating stats...');
        const totalCompanies = this.filteredData.length;
        const totalCapex = this.filteredData.reduce((sum, company) => sum + Math.abs(company.capex), 0);
        const avgCapex = totalCompanies > 0 ? totalCapex / totalCompanies : 0;

        const totalCompaniesEl = document.getElementById('total-companies');
        const totalCapexEl = document.getElementById('total-capex');
        const avgCapexEl = document.getElementById('avg-capex');

        console.log('Stats elements found:', {
            totalCompanies: !!totalCompaniesEl,
            totalCapex: !!totalCapexEl,
            avgCapex: !!avgCapexEl
        });

        if (totalCompaniesEl) totalCompaniesEl.textContent = totalCompanies;
        if (totalCapexEl) totalCapexEl.textContent = this.formatCurrency(totalCapex);
        if (avgCapexEl) avgCapexEl.textContent = this.formatCurrency(avgCapex);
    }

    render() {
        console.log('Rendering...');
        this.renderList();
    }

    renderList() {
        console.log('Rendering company list...');
        const list = document.getElementById('company-list');
        const loading = document.getElementById('loading');
        
        console.log('Render elements found:', {
            list: !!list,
            loading: !!loading
        });

        if (loading) {
            loading.classList.add('hidden');
            console.log('Loading hidden');
        }
        
        if (list) {
            list.classList.remove('hidden');
            console.log('Company list shown');

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
            
            console.log('Company list populated with', this.filteredData.length, 'companies');
        }
    }

    generateInsights() {
        // Simple insights generation
        this.insights = {
            totalCapex: this.data.reduce((sum, c) => sum + Math.abs(c.capex), 0),
            avgCapex: this.data.reduce((sum, c) => sum + Math.abs(c.capex), 0) / this.data.length,
        };
    }

    formatCurrency(amount) {
        const absAmount = Math.abs(amount);
        if (absAmount >= 1e9) {
            return `$${(amount / 1e9).toFixed(1)}B`;
        } else if (absAmount >= 1e6) {
            return `$${(amount / 1e6).toFixed(1)}M`;
        } else if (absAmount >= 1e3) {
            return `$${(amount / 1e3).toFixed(1)}K`;
        }
        return `$${amount.toLocaleString()}`;
    }

    updateLastUpdated(timestamp) {
        console.log('Updating last updated timestamp:', timestamp);
        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl) {
            const date = new Date(timestamp);
            lastUpdatedEl.textContent = 
                `Last updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        }
    }

    filterData() {
        // Simplified for debugging
        console.log('Filtering data...');
    }

    sortData(sortBy) {
        // Simplified for debugging
        console.log('Sorting data by:', sortBy);
    }

    showError() {
        console.log('Showing error...');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        
        console.log('Error elements found:', {
            loading: !!loading,
            error: !!error
        });
        
        if (loading) {
            loading.classList.add('hidden');
            console.log('Loading hidden for error');
        }
        
        if (error) {
            error.classList.remove('hidden');
            console.log('Error shown');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating SP100CapexApp...');
    new SP100CapexApp();
});