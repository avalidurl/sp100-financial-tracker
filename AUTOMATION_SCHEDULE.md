# 🤖 Automated Data Update Schedule

## Overview
The SP100 CapEx tracker now automatically fetches fresh quarterly data without manual intervention.

## Update Schedule

### 📊 Full Quarterly Data Refresh
- **Frequency**: Twice weekly (Mondays & Thursdays)
- **Time**: 6 AM UTC 
- **Workflow**: `.github/workflows/update_data.yml`
- **What it does**:
  - Fetches latest quarterly capex for all 100 companies
  - Gets current revenue and financial data
  - Updates company profiles and sectors
  - Commits fresh data to repository
  - Triggers automatic Vercel deployment

### 💰 Daily Market Cap Updates  
- **Frequency**: Every weekday
- **Time**: 6 PM UTC (after US market close)
- **Workflow**: `.github/workflows/update_market_caps.yml`
- **What it does**:
  - Updates real-time market caps for all companies
  - Maintains current rankings by market value
  - Preserves quarterly capex data
  - Fast updates (only market cap endpoint)

## Data Freshness

| Data Type | Update Frequency | Freshness |
|-----------|------------------|-----------|
| **Quarterly CapEx** | Twice weekly | Latest Q1/Q2/Q3/Q4 data |
| **Market Caps** | Daily (weekdays) | Real-time market values |
| **Revenue** | Twice weekly | Latest quarterly reports |
| **Company Profiles** | Twice weekly | Current sector/name |

## Manual Triggers

Both workflows can be triggered manually via GitHub Actions:
1. Go to repository **Actions** tab
2. Select workflow (`Update S&P 100 Quarterly Data` or `Update Market Caps`)
3. Click **Run workflow**

## API Usage & Limits

- **FMP Free Tier**: 250 API calls/day
- **Full data refresh**: ~102 calls (once per company)
- **Market cap only**: ~102 calls (lighter endpoint)
- **Schedule optimized** to stay within limits

## What Changed

### ✅ Before (Stale Data)
- Annual 2024 capex data
- Updated weekly only
- Manual intervention required

### 🚀 After (Fresh Data)  
- **Latest quarterly capex** (Q1 2025, Q2 2025, etc.)
- **Twice weekly** data refresh
- **Daily market cap** updates
- **Fully automated** pipeline

## Benefits

1. **Current Investment Trends**: See latest quarterly capex, not year-old data
2. **Real-time Rankings**: Market caps update daily after market close  
3. **Zero Maintenance**: Runs automatically, no manual work needed
4. **Fast Updates**: New quarterly data appears within hours of earnings releases
5. **Reliable**: GitHub Actions ensures consistent updates even if you're offline

---

The website now truly serves its purpose: **tracking current corporate investment activity** with the latest quarterly data automatically refreshed twice weekly!