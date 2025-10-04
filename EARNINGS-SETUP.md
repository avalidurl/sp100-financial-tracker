# 📊 Add Earnings Data to All Companies

This guide will help you fetch earnings (net income) data for all 102 companies in your dataset.

## 🚀 Quick Start (5 minutes)

### Step 1: Get a Free API Key

**Recommended: Financial Modeling Prep (FMP)**
- **Free tier**: 250 API calls/day (perfect for 102 companies!)
- Get your key: https://site.financialmodelingprep.com/developer/docs
- Click "Get my Free API Key" → Sign up → Copy your API key

### Step 2: Set Your API Key

**On Mac/Linux:**
```bash
export FMP_API_KEY="your_api_key_here"
```

**On Windows (PowerShell):**
```powershell
$env:FMP_API_KEY="your_api_key_here"
```

### Step 3: Run the Script

**Option A: Python (Recommended)** 
```bash
cd /Users/gokhanturhan/Documents/GitHub/sp100-financial-tracker
python3 fetch-earnings.py
```

**Option B: Node.js**
```bash
cd /Users/gokhanturhan/Documents/GitHub/sp100-financial-tracker
node fetch-earnings.js
```

### Step 4: Verify & Deploy

The script will:
- ✅ Fetch earnings for all 102 companies
- ✅ Save to both `data/financial_data.json` and `public/data/financial_data.json`
- ✅ Show progress and summary

Then deploy:
```bash
git add .
git commit -m "Add earnings data for all companies"
git push
```

---

## 📋 What the Script Does

1. **Reads** your existing `financial_data.json`
2. **Fetches** net income (earnings) for each company from FMP API
3. **Adds** `earnings` field to each company object
4. **Skips** companies that already have earnings data
5. **Saves** updated JSON files
6. **Shows** summary: processed, failed, API calls used

---

## 🎯 Alternative APIs (if needed)

### Option 1: Financial Modeling Prep (BEST)
- **Free**: 250 calls/day
- **Signup**: https://site.financialmodelingprep.com/developer/docs
- **Pro**: Most reliable, comprehensive data

### Option 2: Alpha Vantage (LIMITED)
- **Free**: 25 calls/day ⚠️ (only ~25 companies per day)
- **Signup**: https://www.alphavantage.co/support/#api-key
- **Con**: Would take 4+ days to complete all companies

### Option 3: Yahoo Finance (Free, No Key)
- **Free**: Unlimited (but unreliable, often blocks automation)
- **No signup needed**
- **Con**: Frequently fails, data may be inconsistent

---

## 🔄 Batch Mode (If You Hit Rate Limits)

If you have more than 250 companies or hit daily limits:

```bash
# Process 50 companies at a time
python3 fetch-earnings.py --batch 50
```

Run this daily until all companies are processed. The script automatically resumes from where it left off.

---

## 📊 Expected Output

```
======================================================================
EARNINGS DATA FETCHER - Financial Modeling Prep
======================================================================
Processing companies 1 to 102 of 102

[1/102] NVIDIA Corporation (NVDA)
  ⊘ Already has earnings: $29.76B
[2/102] Microsoft Corporation (MSFT)
  ⊘ Already has earnings: $88.14B
[3/102] Apple Inc. (AAPL)
  ⊘ Already has earnings: $101.96B
[4/102] Amazon.com Inc. (AMZN)
  ⊘ Already has earnings: $30.43B
...
[7/102] Broadcom Inc. (AVGO)
  ✓ Fetched: $12.63B (FY2024)
...

======================================================================
SUMMARY
======================================================================
Total companies: 102
✓ Processed: 102
✗ Failed: 0
API calls used: 96 / 250 daily limit
Remaining: 154

Done! ✨
```

---

## 🚀 Deploy to Cloudflare Pages

After fetching earnings data:

```bash
# 1. Check what changed
git status

# 2. Stage all changes
git add data/financial_data.json public/data/financial_data.json

# 3. Commit
git commit -m "Add earnings data for all companies"

# 4. Push to deploy
git push origin main
```

Cloudflare Pages will automatically rebuild and deploy your site with the new earnings data!

---

## ❓ Troubleshooting

### "FMP_API_KEY not set"
- Make sure you exported the environment variable in your current terminal session
- Check: `echo $FMP_API_KEY` (should show your key)

### "API calls used: 250/250"
- You've hit the daily limit
- Wait 24 hours or run in batch mode tomorrow
- The script will resume where it left off

### Some companies failed
- Normal! Some companies may have limited data
- The script will list failed companies at the end
- You can manually add earnings for these later

### Python not found
- Install Python 3: https://www.python.org/downloads/
- Or use Node.js version: `node fetch-earnings.js`

---

## 🎉 That's It!

Your company cards will now show earnings data like this:

```
Apple Inc. (AAPL)
━━━━━━━━━━━━━━━━━━━
Capex: $11.10B
Revenue: $394.33B
Earnings: $101.96B  ← NEW!
Market Cap: $3.15T
```

Happy coding! 🚀

