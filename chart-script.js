class InteractiveChartsApp {
    constructor() {
        this.data = [];
        this.charts = {};
        this.metricConfig = {
            capex: { label: 'CapEx', prefix: '$', suffix: '', formatter: this.formatCurrency },
            revenue: { label: 'Revenue', prefix: '$', suffix: '', formatter: this.formatCurrency },
            earnings: { label: 'Earnings', prefix: '$', suffix: '', formatter: this.formatCurrency },
            market_cap: { label: 'Market Cap', prefix: '$', suffix: '', formatter: this.formatCurrency },
            operating_income: { label: 'Operating Income', prefix: '$', suffix: '', formatter: this.formatCurrency },
            free_cash_flow: { label: 'Free Cash Flow', prefix: '$', suffix: '', formatter: this.formatCurrency },
            operating_cash_flow: { label: 'Operating Cash Flow', prefix: '$', suffix: '', formatter: this.formatCurrency },
            total_assets: { label: 'Total Assets', prefix: '$', suffix: '', formatter: this.formatCurrency },
            stockholders_equity: { label: 'Stockholders Equity', prefix: '$', suffix: '', formatter: this.formatCurrency },
            long_term_debt: { label: 'Long-term Debt', prefix: '$', suffix: '', formatter: this.formatCurrency },
            profit_margin: { label: 'Profit Margin', prefix: '', suffix: '%', formatter: this.formatPercent },
            debt_to_equity: { label: 'Debt-to-Equity', prefix: '', suffix: 'x', formatter: this.formatRatio }
        };
    }

    async init() {
        try {
            await this.loadData();
            this.populateSectorFilters();
            this.setupEventListeners();
            this.renderAllCharts();
        } catch (error) {
            console.error('Error initializing app:', error);
            alert('Failed to load financial data. Please try again later.');
        }
    }

    async loadData() {
        const response = await fetch('/data/financial_data.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
        this.data = await response.json();
        
        // Load timestamp
        try {
            const updateResponse = await fetch('/data/last_updated.json');
            if (updateResponse.ok) {
                const updateInfo = await updateResponse.json();
                const timestamp = updateInfo.timestamp || updateInfo.quarterly || updateInfo.market_caps || updateInfo.news_offhours;
                if (timestamp) {
                    this.updateLastUpdated(timestamp);
                }
            }
        } catch (error) {
            console.warn('Could not load update timestamp:', error);
        }
    }

    populateSectorFilters() {
        const sectors = [...new Set(this.data.map(company => company.sector))].sort();
        
        // Populate all sector filter dropdowns
        ['sector-filter', 'scatter-sector-filter'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                sectors.forEach(sector => {
                    const option = document.createElement('option');
                    option.value = sector;
                    option.textContent = sector;
                    select.appendChild(option);
                });
            }
        });
    }

    setupEventListeners() {
        // Metric Explorer Chart
        document.getElementById('metric-selector').addEventListener('change', () => this.renderMetricChart());
        document.getElementById('top-count').addEventListener('change', () => this.renderMetricChart());
        document.getElementById('sector-filter').addEventListener('change', () => this.renderMetricChart());

        // Sector Chart
        document.getElementById('sector-metric-selector').addEventListener('change', () => this.renderSectorChart());
        document.getElementById('sector-chart-type').addEventListener('change', () => this.renderSectorChart());

        // Scatter Plot
        document.getElementById('generate-scatter').addEventListener('click', () => this.renderScatterChart());
        document.getElementById('scatter-x-axis').addEventListener('change', () => this.renderScatterChart());
        document.getElementById('scatter-y-axis').addEventListener('change', () => this.renderScatterChart());
        document.getElementById('scatter-sector-filter').addEventListener('change', () => this.renderScatterChart());

        // Comparison Chart
        document.getElementById('compare-metric-1').addEventListener('change', () => this.renderComparisonChart());
        document.getElementById('compare-metric-2').addEventListener('change', () => this.renderComparisonChart());
        document.getElementById('compare-count').addEventListener('change', () => this.renderComparisonChart());
    }

    renderAllCharts() {
        this.renderMetricChart();
        this.renderSectorChart();
        this.renderScatterChart();
        this.renderComparisonChart();
    }

    renderMetricChart() {
        const metric = document.getElementById('metric-selector').value;
        const topCount = parseInt(document.getElementById('top-count').value);
        const sector = document.getElementById('sector-filter').value;

        // Filter data
        let filteredData = this.data;
        if (sector !== 'all') {
            filteredData = filteredData.filter(company => company.sector === sector);
        }

        // Sort and get top companies
        const sortedData = [...filteredData]
            .filter(company => company[metric] !== null && company[metric] !== undefined)
            .sort((a, b) => {
                const aVal = Math.abs(a[metric]);
                const bVal = Math.abs(b[metric]);
                return bVal - aVal;
            })
            .slice(0, topCount);

        const config = this.metricConfig[metric];
        
        // Destroy existing chart
        if (this.charts.metric) {
            this.charts.metric.destroy();
        }

        // Create new chart
        const ctx = document.getElementById('metric-chart').getContext('2d');
        this.charts.metric = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedData.map(c => c.name),
                datasets: [{
                    label: config.label,
                    data: sortedData.map(c => c[metric]),
                    backgroundColor: this.generateColors(sortedData.length),
                    borderColor: this.generateColors(sortedData.length, 0.8),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `${config.label}: ${config.formatter.call(this, value, config)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => config.formatter.call(this, value, config, true)
                        }
                    }
                }
            }
        });
    }

    renderSectorChart() {
        const metric = document.getElementById('sector-metric-selector').value;
        const chartType = document.getElementById('sector-chart-type').value;

        // Aggregate by sector
        const sectorTotals = {};
        this.data.forEach(company => {
            if (company[metric] !== null && company[metric] !== undefined) {
                if (!sectorTotals[company.sector]) {
                    sectorTotals[company.sector] = 0;
                }
                sectorTotals[company.sector] += Math.abs(company[metric]);
            }
        });

        const sectors = Object.keys(sectorTotals).sort((a, b) => sectorTotals[b] - sectorTotals[a]);
        const values = sectors.map(s => sectorTotals[s]);
        const config = this.metricConfig[metric];

        // Destroy existing chart
        if (this.charts.sector) {
            this.charts.sector.destroy();
        }

        // Create new chart
        const ctx = document.getElementById('sector-chart').getContext('2d');
        this.charts.sector = new Chart(ctx, {
            type: chartType,
            data: {
                labels: sectors,
                datasets: [{
                    label: config.label,
                    data: values,
                    backgroundColor: this.generateColors(sectors.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: chartType === 'bar' ? 'top' : 'right',
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y || context.parsed;
                                return `${context.label}: ${config.formatter.call(this, value, config)}`;
                            }
                        }
                    }
                },
                scales: chartType === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => config.formatter.call(this, value, config, true)
                        }
                    }
                } : {}
            }
        });
    }

    renderScatterChart() {
        const xMetric = document.getElementById('scatter-x-axis').value;
        const yMetric = document.getElementById('scatter-y-axis').value;
        const sector = document.getElementById('scatter-sector-filter').value;

        // Filter data
        let filteredData = this.data.filter(company => 
            company[xMetric] !== null && 
            company[xMetric] !== undefined &&
            company[yMetric] !== null && 
            company[yMetric] !== undefined
        );

        if (sector !== 'all') {
            filteredData = filteredData.filter(company => company.sector === sector);
        }

        const xConfig = this.metricConfig[xMetric];
        const yConfig = this.metricConfig[yMetric];

        // Destroy existing chart
        if (this.charts.scatter) {
            this.charts.scatter.destroy();
        }

        // Create new chart
        const ctx = document.getElementById('scatter-chart').getContext('2d');
        this.charts.scatter = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Companies',
                    data: filteredData.map(c => ({
                        x: c[xMetric],
                        y: c[yMetric],
                        company: c.name,
                        ticker: c.ticker
                    })),
                    backgroundColor: 'rgba(37, 99, 235, 0.6)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: (context) => {
                                const point = context[0].raw;
                                return `${point.company} (${point.ticker})`;
                            },
                            label: (context) => {
                                const point = context.raw;
                                return [
                                    `${xConfig.label}: ${xConfig.formatter.call(this, point.x, xConfig)}`,
                                    `${yConfig.label}: ${yConfig.formatter.call(this, point.y, yConfig)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: xConfig.label
                        },
                        ticks: {
                            callback: (value) => xConfig.formatter.call(this, value, xConfig, true)
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: yConfig.label
                        },
                        ticks: {
                            callback: (value) => yConfig.formatter.call(this, value, yConfig, true)
                        }
                    }
                }
            }
        });
    }

    renderComparisonChart() {
        const metric1 = document.getElementById('compare-metric-1').value;
        const metric2 = document.getElementById('compare-metric-2').value;
        const topCount = parseInt(document.getElementById('compare-count').value);

        // Get top companies by first metric
        const sortedData = [...this.data]
            .filter(company => 
                company[metric1] !== null && 
                company[metric1] !== undefined &&
                company[metric2] !== null && 
                company[metric2] !== undefined
            )
            .sort((a, b) => Math.abs(b[metric1]) - Math.abs(a[metric1]))
            .slice(0, topCount);

        const config1 = this.metricConfig[metric1];
        const config2 = this.metricConfig[metric2];

        // Destroy existing chart
        if (this.charts.comparison) {
            this.charts.comparison.destroy();
        }

        // Create new chart
        const ctx = document.getElementById('comparison-chart').getContext('2d');
        this.charts.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedData.map(c => c.name),
                datasets: [
                    {
                        label: config1.label,
                        data: sortedData.map(c => c[metric1]),
                        backgroundColor: 'rgba(37, 99, 235, 0.7)',
                        borderColor: 'rgba(37, 99, 235, 1)',
                        borderWidth: 2
                    },
                    {
                        label: config2.label,
                        data: sortedData.map(c => c[metric2]),
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                const config = context.datasetIndex === 0 ? config1 : config2;
                                return `${context.dataset.label}: ${config.formatter.call(this, value, config)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value, {}, true)
                        }
                    }
                }
            }
        });
    }

    formatCurrency(value, config, short = false) {
        if (value === null || value === undefined) return 'N/A';
        
        const absValue = Math.abs(value);
        const sign = value < 0 ? '-' : '';
        
        if (short) {
            if (absValue >= 1e12) return `${sign}$${(absValue / 1e12).toFixed(1)}T`;
            if (absValue >= 1e9) return `${sign}$${(absValue / 1e9).toFixed(1)}B`;
            if (absValue >= 1e6) return `${sign}$${(absValue / 1e6).toFixed(1)}M`;
            if (absValue >= 1e3) return `${sign}$${(absValue / 1e3).toFixed(1)}K`;
            return `${sign}$${absValue.toFixed(0)}`;
        }
        
        return `${sign}$${absValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }

    formatPercent(value, config, short = false) {
        if (value === null || value === undefined) return 'N/A';
        return `${value.toFixed(2)}%`;
    }

    formatRatio(value, config, short = false) {
        if (value === null || value === undefined) return 'N/A';
        return `${value.toFixed(2)}x`;
    }

    generateColors(count, alpha = 0.7) {
        const colors = [
            `rgba(37, 99, 235, ${alpha})`,   // blue
            `rgba(16, 185, 129, ${alpha})`,  // green
            `rgba(251, 146, 60, ${alpha})`,  // orange
            `rgba(139, 92, 246, ${alpha})`,  // purple
            `rgba(236, 72, 153, ${alpha})`,  // pink
            `rgba(234, 179, 8, ${alpha})`,   // yellow
            `rgba(239, 68, 68, ${alpha})`,   // red
            `rgba(6, 182, 212, ${alpha})`,   // cyan
            `rgba(132, 204, 22, ${alpha})`,  // lime
            `rgba(244, 63, 94, ${alpha})`    // rose
        ];
        
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    }

    updateLastUpdated(timestamp) {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            document.getElementById('last-updated').textContent = 'Last updated: Recently';
        } else {
            document.getElementById('last-updated').textContent = 
                `Last updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new InteractiveChartsApp();
    app.init();
});

