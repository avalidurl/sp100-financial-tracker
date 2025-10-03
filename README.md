# 📊 S&P 100 Capital Expenditure Tracker

> Real-time dashboard tracking comprehensive financial metrics and market capitalizations for S&P 100 companies with automated updates. **100% FREE** data sources!

[![Data Source](https://img.shields.io/badge/Data-SEC%20EDGAR%20(FREE)-success.svg)](https://www.sec.gov/edgar)
[![Price Data](https://img.shields.io/badge/Prices-Yahoo%20Finance%20(FREE)-blue.svg)](https://finance.yahoo.com/)
[![Deployment](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-orange.svg)](https://pages.cloudflare.com/)
[![Automation](https://img.shields.io/badge/CI-GitHub%20Actions-blue.svg)](https://github.com/features/actions)
[![Cost](https://img.shields.io/badge/Cost-$0/month-brightgreen.svg)](#-cost-breakdown)

## ✨ Features

### 💰 **100% FREE Data Stack**
- **SEC EDGAR** for comprehensive financial statements (unlimited, official)
- **Yahoo Finance** for real-time stock prices (unlimited, no API key)
- **No paid APIs** - save $50-100+/month vs competitors
- **No API keys required** for core functionality

### 📊 **Enhanced Company Cards**
Each company displays **8+ financial metrics**:
- 💰 **Revenue** - Total sales
- 💵 **Earnings** (Net Income) - Bottom line profit
- ⚙️ **Operating Income** - Operating profit before taxes
- 💸 **Free Cash Flow** - Cash available after CapEx
- 🏗️ **CapEx** - Capital expenditures (investments)
- 📊 **Total Assets** - Balance sheet assets
- 📈 **Debt-to-Equity Ratio** - Leverage analysis
- 📉 **Profit Margin** - Profitability percentage
- 💎 **Market Cap** - Current market valuation

### 🤖 **Automated Updates**
- **Weekly financial data** - Every Monday at 6 AM UTC (after SEC weekend filings)
- **Daily market caps** - Weekdays at 10 PM UTC (after market close)
- **GitHub Actions** - Efficient automation (~60 min/month, $0 cost)
- **Smart commits** - Only updates when data actually changes

### 📈 **Interactive Dashboard**
- **Sortable list** by CapEx, Revenue, Earnings, Market Cap, Sector
- **Advanced filtering** by sector and search functionality
- **Live statistics** showing totals, averages, and trends
- **Responsive design** - Works on desktop, tablet, and mobile

### 📉 **Chart Visualizations**
- **7 different chart types** including scatter plots, bar charts, pie charts
- **CapEx vs Market Cap** correlation analysis
- **Sector-wise breakdowns** and comparisons
- **Top performers** ranking and insights

### 🎯 **Insights & Analytics**
- **Investment efficiency** metrics and analysis
- **Sector performance** comparisons
- **Market cap correlations** with business metrics
- **Statistical summaries** and trend identification

## 🚀 Quick Start

### 📋 Prerequisites
- **Modern web browser** for dashboard access
- **Python 3.9+** (optional, only for manual data updates)
- **No API keys required!** 🎉

### ⚡ Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/avalidurl/sp100-capex.git
   cd sp100-capex
   ```

2. **Start local server**
   ```bash
   python -m http.server 8000
   # Or use any static file server
   ```

3. **Open dashboard**
   ```
   http://localhost:8000
   ```

### 🔄 Manual Data Updates (Optional)

If you want to fetch fresh data manually:

```bash
# Install Python dependencies
pip install requests

# Fetch comprehensive financial data from SEC EDGAR
python3 fetch-comprehensive-data.py

# Or update market caps only
python3 -c "exec(open('.github/workflows/update-market-caps.yml').read().split('python3 << \\'PYTHON_SCRIPT\\'')[1].split('PYTHON_SCRIPT')[0])"
```

**Note**: Automated updates via GitHub Actions handle this for you!

## 📁 Project Structure

```
sp100-capex/
├── 🏠 Frontend
│   ├── index.html                    # Main dashboard
│   ├── chart.html                    # Chart visualizations
│   ├── insights.html                 # Analytics page
│   ├── script.js                     # Core functionality (enhanced cards)
│   ├── chart-script.js               # Chart logic
│   ├── insights-script.js            # Analytics logic
│   └── styles.css                    # Enhanced card styles
│
├── 📊 Data
│   ├── data/capex_data.json          # Company financial data (101/102 companies)
│   ├── data/last_updated.json        # Update timestamps
│   └── public/data/                  # Mirror for Cloudflare Pages
│
├── 🐍 Data Fetching Scripts
│   ├── fetch-comprehensive-data.py   # Main SEC EDGAR fetcher
│   ├── fetch-earnings-free.py        # Earnings-only fetcher
│   ├── explore-sec-data.py           # SEC data explorer
│   └── (legacy scripts for reference)
│
├── ☁️ Cloudflare Functions (API Routes)
│   └── functions/
│       └── api/
│           ├── stock-price.js        # Real-time prices (Yahoo Finance)
│           ├── quota-status.js       # API status (all free!)
│           ├── cache.js              # 5-min price caching
│           └── rate-limit.js         # Abuse protection
│
├── 🤖 Automation
│   └── .github/workflows/
│       ├── update-financial-data.yml # Weekly SEC EDGAR updates
│       └── update-market-caps.yml    # Daily Yahoo Finance updates
│
└── 📚 Documentation
    ├── SEC-EDGAR-GUIDE.md            # How to use SEC EDGAR data
    ├── PRICE-DATA-SOURCES.md         # Price data explanation
    ├── GITHUB-ACTIONS-BILLING-CHECK.md # Cost analysis
    └── EARNINGS-SETUP.md             # Setup guide
```

## 🏛️ Data Sources

### SEC EDGAR (Financial Statements)
- **URL**: https://www.sec.gov/edgar
- **Cost**: 100% FREE, unlimited
- **Rate Limit**: 10 requests/second
- **Data**: Official company filings (10-K annual reports)
- **Metrics**: Revenue, Earnings, CapEx, Operating Income, Balance Sheet, Cash Flow

### Yahoo Finance (Stock Prices)
- **URL**: https://finance.yahoo.com/
- **Cost**: 100% FREE, unlimited
- **Rate Limit**: None (reasonable use)
- **Data**: Real-time stock prices, market caps, volume
- **Metrics**: Current price, market capitalization, day high/low

### Data Freshness
- **Financial statements**: Latest annual 10-K filing (updated weekly)
- **Market caps**: Updated daily after market close
- **Stock prices**: Real-time via Cloudflare Functions

## 📊 Data Schema

### Company Record Structure
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "sector": "Technology",
  "year": 2024,
  "period": "2024-Q4 (Annual)",
  
  // Income Statement
  "revenue": 394328000000,
  "earnings": 99803000000,
  "operating_income": 123216000000,
  "gross_profit": 169148000000,
  
  // Cash Flow Statement
  "capex": -10959000000,              // Negative = investment
  "operating_cash_flow": 118254000000,
  "free_cash_flow": 107295000000,     // Calculated: OpCF + CapEx
  
  // Balance Sheet
  "total_assets": 364980000000,
  "total_liabilities": 279414000000,
  "stockholders_equity": 85566000000,
  "long_term_debt": 106611000000,
  "cash": 61555000000,
  
  // Calculated Metrics
  "debt_to_equity": 1.25,              // Long-term Debt / Equity
  "profit_margin": 25.3,               // (Earnings / Revenue) * 100
  "operating_margin": 31.2,            // (Operating Income / Revenue) * 100
  
  // Market Data (updated daily)
  "market_cap": 3450000000000,
  "market_cap_updated": "2025-01-08T22:00:00Z",
  
  // Additional
  "rd_expense": 31300000000,
  "shares_outstanding": 15204100000
}
```

## 🚀 Deployment

### Cloudflare Pages (Current Deployment)

**Automatic deployment on every git push:**

1. **Connect GitHub repository** to Cloudflare Pages
2. **Configure build settings**:
   - Build Command: (none - static site)
   - Build Output Directory: `/`
   - Root Directory: `/`
3. **Deploy automatically** on git push to `master`

**Custom Functions (API Routes):**
- Cloudflare Pages Functions in `functions/` directory
- Serverless functions for stock prices and API status
- Global edge deployment (275+ locations)

### GitHub Actions Setup

**Already configured! No action needed.**

Workflows automatically:
- ✅ Fetch financial data from SEC EDGAR (Mondays 6 AM UTC)
- ✅ Update market caps from Yahoo Finance (Weekdays 10 PM UTC)
- ✅ Commit changes to git (only if data changed)
- ✅ Trigger Cloudflare Pages deployment

**Cost**: $0/month (public repo = unlimited free minutes)

## 💰 Cost Breakdown

### Current Architecture (100% FREE!)
| Service | Usage | Cost |
|---------|-------|------|
| SEC EDGAR | Unlimited financial data | **$0** ✅ |
| Yahoo Finance | Unlimited price data | **$0** ✅ |
| GitHub Actions | 60 min/month (public repo) | **$0** ✅ |
| Cloudflare Pages | Unlimited bandwidth | **$0** ✅ |
| Cloudflare Functions | 100k requests/day (free tier) | **$0** ✅ |
| **TOTAL** | | **$0/month** 🎉 |

**vs Paid Alternatives:**
- Financial APIs (Bloomberg, FMP, etc.): $30-100/month
- Private GitHub repo: $4-6/month for Actions
- **You save: $408-1,272/year with this stack!** 💰

## 🛠️ Development

### Common Commands

```bash
# Fetch comprehensive financial data (all metrics)
python3 fetch-comprehensive-data.py

# Explore available metrics for a company
python3 explore-sec-data.py AAPL

# Test locally
python -m http.server 8000

# Check linter
# (No linter errors! ✅)

# Validate JSON data
python3 -c "import json; data=json.load(open('data/capex_data.json')); print(f'✓ {len(data)} companies loaded')"
```

### Data Update Workflows

- **Automated Updates**: GitHub Actions handle scheduling (recommended)
- **Manual Updates**: Run Python scripts locally when needed
- **Emergency Updates**: Use GitHub Actions "workflow_dispatch" manual trigger

### Monitoring

Check automation status:
- GitHub Actions: https://github.com/avalidurl/sp100-capex/actions
- Cloudflare Pages: https://dash.cloudflare.com/
- API Quota Status: https://[your-domain]/api/quota-status

## 🐛 Troubleshooting

### Common Issues

**No Data Showing**
```bash
# Check if data files exist
ls -lh data/capex_data.json

# Validate JSON
python3 -c "import json; json.load(open('data/capex_data.json'))"

# Check browser console for errors
# Open DevTools (F12) → Console tab
```

**GitHub Actions Failing**
```bash
# Check workflow runs
# Visit: https://github.com/avalidurl/sp100-capex/actions

# Test locally
python3 fetch-comprehensive-data.py

# Check SEC EDGAR rate limit (10 req/sec)
# Script already respects this with 0.15s delay
```

**Market Caps Not Updating**
```bash
# Check last update timestamp
cat data/last_updated.json

# Manually trigger workflow
# Go to Actions → "Update Market Caps" → "Run workflow"

# Test Yahoo Finance connectivity
python3 -c "import requests; r=requests.get('https://query1.finance.yahoo.com/v8/finance/chart/AAPL'); print(r.status_code)"
```

**Cloudflare Pages Not Deploying**
```bash
# Check deployment status
# Visit: Cloudflare Dashboard → Pages → sp100-capex

# Verify git push succeeded
git log --oneline -5

# Check for build errors in Cloudflare logs
```

## 📚 Documentation

- **[SEC EDGAR Guide](./SEC-EDGAR-GUIDE.md)** - How to leverage SEC data
- **[Price Data Sources](./PRICE-DATA-SOURCES.md)** - Understanding price data
- **[GitHub Actions Billing](./GITHUB-ACTIONS-BILLING-CHECK.md)** - Cost analysis
- **[Earnings Setup](./EARNINGS-SETUP.md)** - Data fetching setup

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** and test locally
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open Pull Request**

### Development Guidelines

- ✅ Use semantic commit messages
- ✅ Test changes locally before pushing
- ✅ Ensure no linter errors
- ✅ Update documentation if needed
- ✅ Keep data fetching 100% free (no paid APIs)

## 🎯 Roadmap

### ✅ Completed
- [x] 100% FREE data stack (SEC EDGAR + Yahoo Finance)
- [x] Enhanced company cards (8+ metrics)
- [x] Automated GitHub Actions workflows
- [x] Optimized API usage (98% reduction)
- [x] Comprehensive financial data (101/102 companies)
- [x] Real-time price updates
- [x] Debt-to-Equity, Profit Margin calculations

### 🚧 In Progress
- [ ] Add automated testing (unit + integration)
- [ ] Implement error monitoring (Sentry)
- [ ] Add workflow failure notifications

### 🔮 Future Ideas
- [ ] Historical data tracking (quarterly trends)
- [ ] Company comparison tool (side-by-side)
- [ ] Export to CSV/Excel functionality
- [ ] Mobile app (React Native)
- [ ] Real-time WebSocket price updates

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SEC (U.S. Securities and Exchange Commission)** for providing free, unlimited access to company financials
- **Yahoo Finance** for real-time stock price data
- **Cloudflare Pages** for global edge hosting and serverless functions
- **GitHub Actions** for free CI/CD automation

## 📊 Project Stats

- **102 Companies** tracked continuously
- **8+ Metrics** per company card
- **500+ Data Points** available per company from SEC EDGAR
- **2 Update Frequencies** (weekly financial data, daily market caps)
- **100% Free** - no paid APIs or subscriptions
- **$0/month Cost** for hosting and automation
- **~60 min/month** GitHub Actions usage (within free tier)

---

<div align="center">

**[🚀 Live Dashboard](https://sp100-capex.pages.dev)** • **[📖 Documentation](./SEC-EDGAR-GUIDE.md)** • **[🏛️ SEC EDGAR](https://www.sec.gov/edgar)**

Made with 💰 for financial analysis and 📊 powered by 100% FREE data sources

**Zero cost. Unlimited data. No API keys needed.** 🎉

</div>
