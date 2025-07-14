# SP100 CapEx Tracker - Claude Code Context

## Project Overview
A real-time S&P 100 Capital Expenditure tracking dashboard that displays company investment data with market cap integration. Built with vanilla JavaScript frontend and Python data collection scripts.

## Architecture
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework)
- **Backend**: Python scripts for data collection
- **Data Source**: Financial Modeling Prep API
- **Hosting**: Vercel (static site)
- **Automation**: GitHub Actions for data updates

## Key Files & Directories
```
/
├── index.html              # Main dashboard
├── chart.html             # Chart visualizations  
├── insights.html          # Data insights page
├── script.js              # Main app logic
├── chart-script.js        # Chart functionality
├── insights-script.js     # Insights logic
├── styles.css             # Global styles
├── data/
│   ├── capex_data.json    # Company data (auto-updated)
│   └── last_updated.json  # Update metadata
├── scripts/
│   ├── fetch_data.py      # Main data collection
│   ├── update_market_caps.py  # Market cap updates
│   ├── update_caps_curl.py    # Alternative updater
│   └── security_check.py      # Security verification
├── .github/workflows/     # Automation workflows
├── .env.example          # Environment template
└── CLAUDE.md             # This file
```

## Development Workflow

### Local Development Setup
```bash
# 1. Clone repository
git clone <repo-url>
cd sp100-capex

# 2. Setup environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Configure API key
cp .env.example .env
nano .env  # Add your FMP_API_KEY

# 4. Run security check
python3 scripts/security_check.py

# 5. Test data collection
cd scripts && python fetch_data.py

# 6. Serve locally
python -m http.server 8000
```

### Data Update Workflows
- **Daily Market Caps**: Mon-Fri 6 PM UTC (GitHub Actions)
- **Weekly Full Data**: Sundays 2 AM UTC (GitHub Actions)
- **Manual Updates**: Use GitHub workflow dispatch

### Common Commands
```bash
# Update market caps only
cd scripts && python update_market_caps.py

# Full data refresh (102 companies)
cd scripts && python fetch_data.py

# Security verification
python scripts/security_check.py

# Check data integrity
python -c "import json; data=json.load(open('data/capex_data.json')); print(f'Companies: {len(data)}')"

# Local development server
python -m http.server 8000
```

## API Dependencies

### Financial Modeling Prep API
- **Rate Limits**: 250 calls/day (free tier)
- **Current Usage**: ~102 calls for full update, ~102 for daily caps
- **Endpoints Used**:
  - `/sp500_constituent` - S&P 500 company list
  - `/cash-flow-statement/{symbol}` - Capital expenditure data
  - `/profile/{symbol}` - Real-time market cap data

### Environment Variables
- `FMP_API_KEY`: Financial Modeling Prep API key (REQUIRED)
- `DEBUG`: Enable debug logging (optional)

## Security Implementation

### 🔒 CRITICAL SECURITY MEASURES
- **NO hardcoded API keys** anywhere in code
- **Environment variables only** for sensitive data
- **Comprehensive .gitignore** prevents secret exposure
- **Automated security scanning** with security_check.py
- **GitHub Secrets** for CI/CD workflows

### Security Verification
```bash
# Run comprehensive security check
python3 scripts/security_check.py

# Manual API key leak check
grep -r "YOUR_API_KEY_PATTERN" . --exclude-dir=.git

# Verify .env is gitignored
git status  # Should not show .env file
```

## Data Structure

### capex_data.json Schema
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "capex": -11100000000,        // Negative = investment
  "year": 2024,
  "revenue": 394328000000,
  "sector": "Technology",
  "market_cap": 3153843528000,
  "market_cap_updated": "2024-12-07T10:30:00"
}
```

### Key Data Points
- **102 companies** (S&P 100 + top companies by market cap)
- **Real-time market caps** updated daily
- **Annual CapEx data** from latest financial statements
- **Sector classification** for filtering and analysis

## Frontend Features

### Main Dashboard (index.html)
- **Company list** with sorting/filtering
- **Search functionality** by company name
- **Sector filtering** dropdown
- **Market cap display** with real-time data
- **Statistics bar** with totals and averages

### Chart Dashboard (chart.html)
- **7 different visualizations**:
  1. CapEx vs Market Cap scatter plot
  2. CapEx by sector distribution
  3. Top 10 companies by CapEx
  4. Market cap rankings
  5. Sector allocation pie chart
  6. CapEx intensity analysis
  7. Revenue vs CapEx correlation

### Insights Page (insights.html)
- **Statistical analysis** of CapEx data
- **Sector comparisons** and trends
- **Investment efficiency** metrics
- **Market cap correlations**

## Deployment & Hosting

### Vercel Configuration
- **Static site hosting** (no server-side API calls)
- **Automatic deployments** on git push
- **No environment variables needed** for production (data pre-generated)

### GitHub Actions Automation
- **update_data.yml**: Weekly full data refresh
- **update_market_caps.yml**: Daily market cap updates
- **Secrets required**: FMP_API_KEY in GitHub repository secrets

## Troubleshooting

### Common Issues
- **API Rate Limits**: 250 calls/day limit, space out manual runs
- **Missing Data**: Check API key validity and run fetch_data.py
- **Security Alerts**: Run security_check.py to identify issues
- **Deployment Failures**: Check Vercel build logs and data files

### Debug Commands
```bash
# Test API connectivity
python3 -c "import os, requests; print(requests.get(f'https://financialmodelingprep.com/api/v3/profile/AAPL?apikey={os.environ.get(\"FMP_API_KEY\")}').status_code)"

# Validate JSON data
python3 -c "import json; json.load(open('data/capex_data.json')); print('✓ Valid JSON')"

# Check environment
env | grep FMP_API_KEY
```

## Recent Changes
- ✅ Implemented bulletproof API key security system
- ✅ Added comprehensive security verification tools
- ✅ Created automated GitHub Actions workflows
- ✅ Enhanced market cap data with real-time updates
- ✅ Added chart dashboard with 7 visualizations
- ✅ Split UI into separate Chart and Insights pages
- ✅ Cleaned git history to remove any exposed credentials

## Development Guidelines

### Code Standards
- **No hardcoded secrets** - Use environment variables only
- **Error handling** - All API calls must handle failures gracefully
- **Rate limiting** - Respect FMP API limits (250/day)
- **Data validation** - Verify API responses before processing

### Security Checklist
- [ ] Run `python scripts/security_check.py` before commits
- [ ] Verify `.env` is gitignored and not tracked
- [ ] Ensure GitHub Secrets are properly configured
- [ ] Test local development with environment variables
- [ ] Confirm no API keys in any committed files

This documentation provides Claude Code with complete context for working effectively with the sp100-capex project while maintaining the highest security standards.

## Third-Party Services & Attributions

### External APIs & Data Sources
- **Financial Modeling Prep**: Primary financial data API (capex, market cap, company info)
- **TradingView**: Live stock price charts and widgets (free embedding)
- **Yahoo Finance**: Backup price data source (via CORS proxy)
- **Google Finance**: Alternative price data (via CORS proxy) 
- **Finnhub**: Demo stock quotes API (fallback)

### Infrastructure & Services
- **Vercel**: Static site hosting and deployment
- **GitHub Actions**: Automated data update workflows
- **CORS Proxies**: corsproxy.io, api.allorigins.win, thingproxy.freeboard.io

### Development Dependencies
- **Python Requests**: HTTP client library for data collection scripts
- **GitHub Actions**: checkout@v4, setup-python@v4 marketplace actions

### Attribution Compliance
All services are properly attributed in website footers and documentation per their respective terms of service. The project uses only free tiers and publicly available APIs with appropriate rate limiting and usage patterns.
