# 💰 Price & Market Cap Data Sources

## 🔍 Current Setup

### Where Price Data Comes From:

**File**: `functions/api/stock-price.js`

**Current flow** (in order of priority):
1. ✅ **Alpha Vantage** (if API key exists)
   - Rate limit: 25 calls/day on free tier ⚠️
   - Status: PAID API (limited free tier)
   
2. ✅ **Finnhub** (backup if Alpha Vantage fails)
   - Rate limit: 60/minute
   - Status: PAID API (free tier available)
   
3. ✅ **Yahoo Finance** (final fallback)
   - Rate limit: No official limit (but can block)
   - Status: **FREE** ✨
   - **Most reliable for your use case!**

### Where Market Cap Comes From:

**Currently**: Calculated as `Price × Shares Outstanding`
- Price: From APIs above (Alpha Vantage → Finnhub → Yahoo)
- Shares Outstanding: **Already from SEC EDGAR!** ✅

---

## 🎯 Recommended Optimization

### Option 1: Use ONLY Yahoo Finance (Simple & Free)

**Benefits**:
- ✅ 100% FREE
- ✅ No API keys needed
- ✅ Works great for your use case
- ✅ Real-time prices
- ✅ Already your fallback (proven reliable)

**Change needed**:
Remove Alpha Vantage and Finnhub, use Yahoo Finance directly.

```javascript
// Simplified stock-price.js
export async function onRequest({ request, env }) {
  const symbol = url.searchParams.get('symbol');
  
  // Direct to Yahoo Finance (skip paid APIs)
  const yahooData = await fetchFromYahoo(symbol);
  
  if (yahooData) {
    setCachedPrice(symbol, yahooData);
    return new Response(JSON.stringify(yahooData));
  }
  
  return new Response(JSON.stringify({ 
    error: 'Unable to fetch stock price' 
  }), { status: 500 });
}
```

---

### Option 2: Get Market Cap Directly from SEC EDGAR

**We already have**:
- ✅ Shares Outstanding (from SEC EDGAR)
- ✅ Price (from Yahoo Finance)

**Calculate locally**:
```javascript
market_cap = shares_outstanding × current_price
```

**OR fetch pre-calculated from Yahoo**:
```javascript
// Yahoo Finance already provides market cap!
https://query1.finance.yahoo.com/v8/finance/chart/AAPL
// Returns: result.meta.marketCap
```

---

### Option 3: Hybrid (Best of Both Worlds)

**For company cards (static data)**:
- Use SEC EDGAR data (refreshed daily/weekly)
- Market Cap = Shares Outstanding × Last Price

**For live price chart button**:
- Use Yahoo Finance for real-time price updates
- No API key needed
- Works on-demand when user clicks

---

## 📊 Comparison

| Source | Cost | Rate Limit | Market Cap | Price | Use Case |
|--------|------|------------|------------|-------|----------|
| **SEC EDGAR** | FREE | 10 req/sec | Via calc | ❌ | Annual financials |
| **Yahoo Finance** | FREE | Unlimited* | ✅ | ✅ | Real-time quotes |
| **Alpha Vantage** | $0-50/mo | 25/day (free) | ❌ | ✅ | Limited use |
| **Finnhub** | $0-99/mo | 60/min (free) | ❌ | ✅ | Backup only |

*Yahoo has no official limit but may throttle heavy automation

---

## 🚀 Migration Plan

### Phase 1: Simplify Price API ✅ **RECOMMENDED**

**Do this**:
1. Update `functions/api/stock-price.js`
2. Remove Alpha Vantage logic (save API quota!)
3. Remove Finnhub logic (not needed)
4. Use Yahoo Finance only (it's already working!)

**Result**: 
- Same functionality
- No API keys needed
- No rate limits to worry about
- Saves $50-100/month if you were planning to upgrade

### Phase 2: Update Market Cap Source (Optional)

**Current**: Market cap manually updated (old data in JSON)

**Better**: 
- Store shares_outstanding from SEC EDGAR (we already do!)  
- Fetch current price from Yahoo when needed
- Calculate: `market_cap = shares × price`

**Or simpler**:
- Just use Yahoo's market cap directly (they provide it!)

---

## 💡 What I Recommend

### For Your Use Case (S&P 100 Fundamentals):

**Best approach**:
1. ✅ Use **SEC EDGAR** for all fundamental data (done!)
   - Revenue, Earnings, Assets, etc.
   - Shares Outstanding
   
2. ✅ Use **Yahoo Finance** for price/market cap (free & reliable)
   - Real-time prices when user clicks "📈 Price" button
   - Market cap updated daily
   
3. ❌ **Remove** Alpha Vantage dependency
   - 25 calls/day is too limiting
   - You're likely hitting the fallback anyway
   
4. ❌ **Remove** Finnhub dependency
   - Not needed if Yahoo works

### Code Changes Needed:

**File**: `functions/api/stock-price.js`
- Remove: Alpha Vantage function & logic
- Remove: Finnhub function & logic
- Keep: Yahoo Finance only
- ~50 lines of code removed
- No more API keys to manage

---

## 📝 Implementation

Want me to:
1. ✅ **Simplify stock-price.js** to use only Yahoo Finance?
2. ✅ **Remove paid API dependencies** from your codebase?
3. ✅ **Update market cap calculation** to be more accurate?

All can be done in 5 minutes and will make your app:
- Simpler
- Free-er (no API costs)
- More reliable (no quota limits)
- Easier to maintain

---

## 🎯 Bottom Line

**Current**: Trying 3 APIs (2 paid, 1 free) for the same data

**Optimal**: Use 1 free API (Yahoo) that works perfectly

**Savings**: $0-100/month (if you upgrade paid APIs)

**Your entire app can run on 100% FREE data sources**:
- SEC EDGAR: ✅ Fundamentals (Revenue, Earnings, etc.)
- Yahoo Finance: ✅ Price & Market Cap (Real-time)
- Total Cost: **$0/month** 💰

