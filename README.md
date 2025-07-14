# 📊 S&P 100 Capital Expenditure Tracker

> Real-time dashboard tracking capital expenditures and market capitalizations for S&P 100 companies with automated daily updates.

[![Security Status](https://img.shields.io/badge/Security-Verified-green.svg)](./CLAUDE.md)
[![API Status](https://img.shields.io/badge/API-Financial%20Modeling%20Prep-blue.svg)](https://financialmodelingprep.com/)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)

## ✨ Features

### 📈 **Real-Time Data**
- **Daily market cap updates** (Mon-Fri 6 PM UTC)
- **Weekly financial data refresh** (Sundays 2 AM UTC)
- **102 S&P companies** tracked continuously

### 📊 **Interactive Dashboard**
- **Sortable company list** by CapEx, Market Cap, Revenue, Sector
- **Advanced filtering** by sector and search functionality
- **Live statistics** showing totals, averages, and trends

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
- **Python 3.9+** for data collection scripts
- **Financial Modeling Prep API key** (free tier available)
- **Modern web browser** for dashboard access

### ⚡ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/avalidurl/sp100-capex.git
   cd sp100-capex
   ```

2. **Setup Python environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure API key**
   ```bash
   cp .env.example .env
   nano .env  # Add your FMP_API_KEY
   ```

4. **Run security verification**
   ```bash
   python3 scripts/security_check.py
   ```

5. **Collect initial data**
   ```bash
   cd scripts && python fetch_data.py
   ```

6. **Start local server**
   ```bash
   python -m http.server 8000
   ```

7. **Open dashboard**
   ```
   http://localhost:8000
   ```

## 🔒 Security

This project implements **military-grade security** for API key management:

- ✅ **Zero hardcoded secrets** in any code files
- ✅ **Environment variable protection** with comprehensive .gitignore
- ✅ **Automated security scanning** with built-in verification tools
- ✅ **GitHub Secrets integration** for CI/CD workflows
- ✅ **Clean git history** with no credential exposure

### Security Verification
```bash
# Run comprehensive security check
python3 scripts/security_check.py

# Manual verification
grep -r "your_secret_pattern" . --exclude-dir=.git
```

## 📁 Project Structure

```
sp100-capex/
├── 🏠 Frontend
│   ├── index.html              # Main dashboard
│   ├── chart.html             # Chart visualizations
│   ├── insights.html          # Analytics page
│   ├── script.js              # Core functionality
│   ├── chart-script.js        # Chart logic
│   ├── insights-script.js     # Analytics logic
│   └── styles.css             # Global styles
│
├── 📊 Data
│   ├── data/capex_data.json   # Company financial data
│   └── data/last_updated.json # Update metadata
│
├── 🐍 Scripts
│   ├── scripts/fetch_data.py          # Main data collection
│   ├── scripts/update_market_caps.py  # Daily market cap updates
│   ├── scripts/update_caps_curl.py    # Alternative updater
│   └── scripts/security_check.py      # Security verification
│
├── ⚙️ Configuration
│   ├── .env.example           # Environment template
│   ├── .gitignore            # Security exclusions
│   ├── requirements.txt      # Python dependencies
│   ├── vercel.json           # Deployment config
│   └── CLAUDE.md             # Development context
│
└── 🤖 Automation
    └── .github/workflows/
        ├── update_data.yml           # Weekly data refresh
        └── update_market_caps.yml    # Daily market cap updates
```

## 🔧 API Integration

### Financial Modeling Prep API
- **Base URL**: `https://financialmodelingprep.com/api/v3`
- **Rate Limits**: 250 calls/day (free tier)
- **Current Usage**: ~102 calls for market caps, ~102 for full refresh

### Key Endpoints
```python
# Company list
GET /sp500_constituent?apikey={key} # Used for SP100 data

# Financial data  
GET /cash-flow-statement/{symbol}?period=annual&limit=5&apikey={key}

# Market cap data
GET /profile/{symbol}?apikey={key}
```

## 📊 Data Schema

### Company Record Structure
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "capex": -11100000000,           // Negative = investment
  "year": 2024,
  "revenue": 394328000000,
  "sector": "Technology", 
  "market_cap": 3153843528000,
  "market_cap_updated": "2024-12-07T10:30:00Z"
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect GitHub repository** to Vercel
2. **Configure build settings**:
   - Build Command: `echo "Static site - no build needed"`
   - Output Directory: `./`
3. **Deploy automatically** on git push

### GitHub Actions Setup
1. **Add repository secret**: `FMP_API_KEY`
2. **Enable workflows** in repository settings
3. **Automated updates**:
   - Daily market caps: Mon-Fri 6 PM UTC
   - Weekly data refresh: Sundays 2 AM UTC

## 🛠️ Development

### Common Commands
```bash
# Update market caps only (fast)
cd scripts && python update_market_caps.py

# Full data refresh (slower, more API calls)
cd scripts && python fetch_data.py

# Security check before commits
python scripts/security_check.py

# Data validation
python -c "import json; data=json.load(open('data/capex_data.json')); print(f'✓ {len(data)} companies loaded')"
```

### Data Update Workflows
- **Manual Updates**: Run Python scripts locally
- **Automated Updates**: GitHub Actions handle scheduling
- **Emergency Updates**: Use GitHub workflow dispatch

## 🐛 Troubleshooting

### Common Issues

**API Rate Limits**
```bash
# Check current usage
echo "Today's API calls: $(grep -c "$(date +%Y-%m-%d)" ~/.fmp_api_log 2>/dev/null || echo 0)/250"
```

**Missing Data**
```bash
# Verify API key
python3 -c "import os; print('✓' if os.environ.get('FMP_API_KEY') else '✗ FMP_API_KEY not set')"

# Test API connectivity  
python3 -c "import requests, os; print(requests.get(f'https://financialmodelingprep.com/api/v3/profile/AAPL?apikey={os.environ.get(\"FMP_API_KEY\")}').status_code)"
```

**Security Alerts**
```bash
# Run full security audit
python scripts/security_check.py

# Check git tracking
git status  # Should not show .env
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Run security check**: `python scripts/security_check.py`
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Financial Modeling Prep** for providing comprehensive financial data API
- **Vercel** for seamless static site hosting
- **GitHub Actions** for automated workflow management

## 📊 Project Stats

- **102 Companies** tracked continuously
- **7 Chart Types** for data visualization  
- **2 Update Frequencies** (daily caps, weekly data)
- **250 API Calls/Day** efficient usage within free tier
- **100% Security Score** with automated verification

---

<div align="center">

**[🚀 Live Dashboard](https://sp100-capex.vercel.app)** • **[📖 Documentation](./CLAUDE.md)** • **[🔒 Security Guide](./CLAUDE.md#security-implementation)**

Made with 💼 for financial analysis and 🔒 security

</div>