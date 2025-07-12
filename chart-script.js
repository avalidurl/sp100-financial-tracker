class ChartDashboard {
    constructor() {
        this.data = [];
        this.colors = [
            '#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea',
            '#c2410c', '#0891b2', '#be123c', '#059669', '#7c3aed',
            '#ea580c', '#0284c7', '#be185d', '#047857', '#7c2d12'
        ];
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.renderAllCharts();
        } catch (error) {
            this.showError();
        }
    }

    async loadData() {
        try {
            const capexResponse = await fetch('/data/capex_data.json');
            
            if (!capexResponse.ok) {
                throw new Error(`Failed to fetch capex data: ${capexResponse.status}`);
            }

            this.data = await capexResponse.json();
            
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
        } catch (error) {
            console.error('Error loading chart data:', error);
            throw error;
        }
    }

    setupEventListeners() {
        const ethAddress = document.getElementById('eth-address');
        ethAddress.addEventListener('click', () => {
            navigator.clipboard.writeText(ethAddress.textContent);
        });
    }

    renderAllCharts() {
        const loading = document.getElementById('loading');
        const chartsContainer = document.getElementById('charts-container');

        loading.classList.add('hidden');
        chartsContainer.classList.remove('hidden');

        // Render all charts
        this.renderTopSpendersChart();
        this.renderSectorPieChart();
        this.renderScatterChart();
        this.renderBubbleChart();
        this.renderSectorRankingsChart();
        this.renderEfficiencyChart();
        this.renderHeatmapChart();
    }

    // 1. Top Spenders Bar Chart
    renderTopSpendersChart() {
        const canvas = document.getElementById('top-spenders-chart');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 400;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const top10 = this.data.slice(0, 10);
        const maxCapex = Math.max(...top10.map(c => Math.abs(c.capex)));
        const barHeight = 30;
        const barSpacing = 5;
        const chartWidth = canvas.width - 200;
        const startY = 50;

        // Title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Top 10 Companies by Capital Expenditure', canvas.width / 2, 30);

        top10.forEach((company, index) => {
            const barWidth = Math.max((Math.abs(company.capex) / maxCapex) * chartWidth, 5);
            const y = startY + index * (barHeight + barSpacing);

            // Bar background
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(150, y, chartWidth, barHeight);

            // Bar
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fillRect(150, y, barWidth, barHeight);

            // Company symbol
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(company.symbol, 140, y + barHeight / 2 + 4);

            // Value
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'left';
            if (barWidth > 80) {
                ctx.fillText(this.formatCurrency(company.capex), 160, y + barHeight / 2 + 3);
            } else {
                ctx.fillStyle = '#333';
                ctx.fillText(this.formatCurrency(company.capex), 160 + barWidth + 5, y + barHeight / 2 + 3);
            }
        });
    }

    // 2. Sector Pie Chart
    renderSectorPieChart() {
        const canvas = document.getElementById('sector-pie-chart');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 600;
        canvas.height = 400;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate sector totals
        const sectorTotals = {};
        this.data.forEach(company => {
            const sector = company.sector;
            const capex = Math.abs(company.capex);
            sectorTotals[sector] = (sectorTotals[sector] || 0) + capex;
        });

        const sectors = Object.entries(sectorTotals).sort(([,a], [,b]) => b - a);
        const total = sectors.reduce((sum, [,value]) => sum + value, 0);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 + 20;
        const radius = 120;

        // Title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Capital Expenditure by Sector', centerX, 30);

        let currentAngle = -Math.PI / 2;

        sectors.forEach(([sector, value], index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Add percentage label
            if (sliceAngle > 0.2) {
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                const percentage = ((value / total) * 100).toFixed(1);
                ctx.fillText(`${percentage}%`, labelX, labelY);
            }

            currentAngle += sliceAngle;
        });

        // Legend
        sectors.forEach(([sector, value], index) => {
            const legendY = 50 + index * 20;
            const legendX = canvas.width - 180;
            
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fillRect(legendX, legendY, 15, 15);
            
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${sector}: ${this.formatCurrency(value)}`, legendX + 20, legendY + 12);
        });
    }

    // 3. Capex vs Revenue Scatter Plot
    renderScatterChart() {
        const canvas = document.getElementById('scatter-chart');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 400;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const margin = 80;
        const chartWidth = canvas.width - 2 * margin;
        const chartHeight = canvas.height - 2 * margin;

        const maxRevenue = Math.max(...this.data.map(c => c.revenue));
        const maxCapex = Math.max(...this.data.map(c => Math.abs(c.capex)));

        // Title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Capital Expenditure vs Revenue', canvas.width / 2, 30);

        // Axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(margin, canvas.height - margin);
        ctx.lineTo(canvas.width - margin, canvas.height - margin);
        ctx.stroke();

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, canvas.height - margin);
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Revenue', canvas.width / 2, canvas.height - 20);
        
        ctx.save();
        ctx.translate(20, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Capital Expenditure', 0, 0);
        ctx.restore();

        // Plot points
        this.data.forEach((company, index) => {
            const x = margin + (company.revenue / maxRevenue) * chartWidth;
            const y = canvas.height - margin - (Math.abs(company.capex) / maxCapex) * chartHeight;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }

    // 4. Market Cap vs Capex Bubble Chart
    renderBubbleChart() {
        const canvas = document.getElementById('bubble-chart');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 400;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const margin = 80;
        const chartWidth = canvas.width - 2 * margin;
        const chartHeight = canvas.height - 2 * margin;

        const maxMarketCap = Math.max(...this.data.map(c => c.market_cap));
        const maxCapex = Math.max(...this.data.map(c => Math.abs(c.capex)));

        // Title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Market Cap vs Capital Expenditure (Bubble Size = Market Cap)', canvas.width / 2, 30);

        // Axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(margin, canvas.height - margin);
        ctx.lineTo(canvas.width - margin, canvas.height - margin);
        ctx.stroke();

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, canvas.height - margin);
        ctx.stroke();

        // Plot bubbles
        this.data.slice(0, 20).forEach((company, index) => {
            const x = margin + (company.market_cap / maxMarketCap) * chartWidth;
            const y = canvas.height - margin - (Math.abs(company.capex) / maxCapex) * chartHeight;
            const radius = 3 + (company.market_cap / maxMarketCap) * 15;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = this.colors[index % this.colors.length] + '80';
            ctx.fill();
            ctx.strokeStyle = this.colors[index % this.colors.length];
            ctx.lineWidth = 2;
            ctx.stroke();

            // Add company symbol for large bubbles
            if (radius > 8) {
                ctx.fillStyle = '#333';
                ctx.font = 'bold 8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(company.symbol, x, y + 2);
            }
        });
    }

    // 5. Sector Rankings Bar Chart
    renderSectorRankingsChart() {
        const canvas = document.getElementById('sector-rankings-chart');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 400;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate sector totals
        const sectorTotals = {};
        this.data.forEach(company => {
            const sector = company.sector;
            const capex = Math.abs(company.capex);
            sectorTotals[sector] = (sectorTotals[sector] || 0) + capex;
        });

        const sectors = Object.entries(sectorTotals).sort(([,a], [,b]) => b - a);
        const maxTotal = Math.max(...sectors.map(([,total]) => total));

        const barHeight = 30;
        const barSpacing = 10;
        const chartWidth = canvas.width - 300;
        const startY = 50;

        // Title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Total Capital Expenditure by Sector', canvas.width / 2, 30);

        sectors.forEach(([sector, total], index) => {
            const barWidth = (total / maxTotal) * chartWidth;
            const y = startY + index * (barHeight + barSpacing);

            // Bar
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fillRect(200, y, barWidth, barHeight);

            // Sector name
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(sector, 190, y + barHeight / 2 + 4);

            // Value
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'left';
            if (barWidth > 100) {
                ctx.fillText(this.formatCurrency(total), 210, y + barHeight / 2 + 3);
            } else {
                ctx.fillStyle = '#333';
                ctx.fillText(this.formatCurrency(total), 210 + barWidth + 5, y + barHeight / 2 + 3);
            }
        });
    }

    // 6. Investment Efficiency Chart
    renderEfficiencyChart() {
        const canvas = document.getElementById('efficiency-chart');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 400;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate efficiency (capex/market_cap ratio)
        const efficiency = this.data
            .filter(c => c.market_cap > 0)
            .map(c => ({
                symbol: c.symbol,
                efficiency: Math.abs(c.capex) / c.market_cap,
                capex: c.capex
            }))
            .sort((a, b) => b.efficiency - a.efficiency)
            .slice(0, 15);

        const maxEfficiency = Math.max(...efficiency.map(c => c.efficiency));
        const barHeight = 20;
        const barSpacing = 5;
        const chartWidth = canvas.width - 200;
        const startY = 50;

        // Title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Investment Intensity (Capex/Market Cap Ratio)', canvas.width / 2, 30);

        efficiency.forEach((company, index) => {
            const barWidth = (company.efficiency / maxEfficiency) * chartWidth;
            const y = startY + index * (barHeight + barSpacing);

            // Bar
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fillRect(120, y, barWidth, barHeight);

            // Company symbol
            ctx.fillStyle = '#333';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(company.symbol, 110, y + barHeight / 2 + 3);

            // Percentage
            ctx.fillStyle = '#333';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'left';
            const percentage = (company.efficiency * 100).toFixed(1);
            ctx.fillText(`${percentage}%`, 130 + barWidth + 5, y + barHeight / 2 + 3);
        });
    }

    // 7. Investment Heatmap
    renderHeatmapChart() {
        const canvas = document.getElementById('heatmap-chart');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 400;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate sector efficiency
        const sectorData = {};
        this.data.forEach(company => {
            const sector = company.sector;
            if (!sectorData[sector]) {
                sectorData[sector] = { totalCapex: 0, totalMarketCap: 0, count: 0 };
            }
            sectorData[sector].totalCapex += Math.abs(company.capex);
            sectorData[sector].totalMarketCap += company.market_cap;
            sectorData[sector].count++;
        });

        const sectors = Object.entries(sectorData)
            .map(([sector, data]) => ({
                sector,
                efficiency: data.totalCapex / data.totalMarketCap,
                avgCapex: data.totalCapex / data.count
            }))
            .sort((a, b) => b.efficiency - a.efficiency);

        const maxEfficiency = Math.max(...sectors.map(s => s.efficiency));
        const cellWidth = 80;
        const cellHeight = 40;
        const startX = 50;
        const startY = 80;

        // Title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sector Investment Intensity Heatmap', canvas.width / 2, 30);

        // Legend
        ctx.font = '12px Arial';
        ctx.fillText('Intensity: Low', 50, 60);
        ctx.fillText('High', canvas.width - 50, 60);

        // Draw gradient legend
        const gradient = ctx.createLinearGradient(150, 50, canvas.width - 100, 50);
        gradient.addColorStop(0, '#e0f2fe');
        gradient.addColorStop(1, '#0c4a6e');
        ctx.fillStyle = gradient;
        ctx.fillRect(150, 45, canvas.width - 250, 15);

        // Draw heatmap cells
        sectors.forEach((sector, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            const x = startX + col * (cellWidth + 10);
            const y = startY + row * (cellHeight + 10);

            // Calculate color intensity
            const intensity = sector.efficiency / maxEfficiency;
            const red = Math.floor(255 - intensity * 200);
            const green = Math.floor(255 - intensity * 150);
            const blue = Math.floor(255 - intensity * 100);

            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
            ctx.fillRect(x, y, cellWidth, cellHeight);

            // Border
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellWidth, cellHeight);

            // Sector name
            ctx.fillStyle = intensity > 0.5 ? '#fff' : '#333';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            const words = sector.sector.split(' ');
            words.forEach((word, wordIndex) => {
                ctx.fillText(word, x + cellWidth / 2, y + 15 + wordIndex * 10);
            });

            // Efficiency percentage
            ctx.font = 'bold 9px Arial';
            ctx.fillText(`${(intensity * 100).toFixed(1)}%`, x + cellWidth / 2, y + cellHeight - 5);
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
    new ChartDashboard();
});