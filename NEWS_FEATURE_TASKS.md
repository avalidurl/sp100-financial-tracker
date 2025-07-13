# Company News Feature Implementation Tasks

## 📰 Feature Goal
Add clickable company cards that show daily news summaries for each SP100 company.

## 🔍 Research Phase - FMP Stock News API

### API Endpoints to Test:
- **Stock News**: `https://financialmodelingprep.com/api/v3/stock_news?tickers=AAPL&limit=5&apikey={key}`
- **Company News**: `https://financialmodelingprep.com/api/v3/stock_news?page=0&limit=1000&apikey={key}`

### Key Questions:
- [ ] Does our FMP free tier include news API access?
- [ ] What's the rate limit for news API calls?
- [ ] What data structure do news articles have?
- [ ] Can we get company-specific news efficiently?

## 🎯 Implementation Tasks

### Phase 1: API Testing
- [ ] Test FMP stock news API with our key
- [ ] Document available fields (title, summary, url, date, etc.)
- [ ] Check rate limits and daily quotas
- [ ] Test with multiple company symbols

### Phase 2: Backend Integration  
- [ ] Create news fetching script in `/scripts/`
- [ ] Add news data to company data structure
- [ ] Implement caching strategy (daily fetch via GitHub Actions?)
- [ ] Handle API errors gracefully

### Phase 3: Frontend Implementation
- [ ] Add click handlers to company cards
- [ ] Design news modal/popup interface
- [ ] Implement loading states
- [ ] Add error handling for missing news
- [ ] Style news articles display

### Phase 4: Data Management
- [ ] Decide: Fetch on-demand vs pre-fetch daily
- [ ] Implement local storage caching
- [ ] Add news refresh mechanism
- [ ] Handle API rate limiting

## 🎨 UI/UX Design

### News Modal Layout:
```
┌─────────────────────────────────────┐
│ [X] Apple Inc. (AAPL) - Latest News │
├─────────────────────────────────────┤
│ 📰 Article 1 Title                  │
│ Summary text here...                │
│ [Read More] • 2 hours ago           │
├─────────────────────────────────────┤
│ 📰 Article 2 Title                  │
│ Summary text here...                │
│ [Read More] • 4 hours ago           │
└─────────────────────────────────────┘
```

### Required UI Elements:
- [ ] Modal backdrop and container
- [ ] Company header with symbol/name
- [ ] Article list with titles and summaries
- [ ] Timestamps and source links
- [ ] Loading spinner
- [ ] Error state display

## 🔧 Technical Implementation

### Data Structure:
```json
{
  "symbol": "AAPL",
  "news": [
    {
      "title": "Apple Reports Q4 Earnings",
      "summary": "Apple exceeded expectations...",
      "url": "https://...",
      "publishedDate": "2025-01-13T10:30:00Z",
      "source": "Reuters"
    }
  ],
  "lastUpdated": "2025-01-13T12:00:00Z"
}
```

### Files to Create/Modify:
- [ ] `/scripts/fetch_news.py` - News fetching script
- [ ] `/public/data/news_data.json` - News storage
- [ ] `script.js` - Add click handlers and modal
- [ ] `styles.css` - News modal styling
- [ ] `.github/workflows/update_news.yml` - Daily news updates

## 🚀 Deployment Strategy

### Option A: Real-time Fetching
- Fetch news when user clicks company
- Pros: Always fresh, no storage needed
- Cons: Slower UX, hits API limits faster

### Option B: Pre-fetched Daily Updates
- GitHub Actions fetch news daily
- Store in static JSON files
- Pros: Fast UX, efficient API usage
- Cons: News not real-time

### Recommended: Hybrid Approach
- Pre-fetch top 20 companies daily
- On-demand fetch for others
- Cache in localStorage for 1 hour

## 📊 Success Metrics
- [ ] News loads for 95%+ of companies
- [ ] Modal opens in <500ms
- [ ] API costs stay within free tier
- [ ] User engagement with news feature

## 🔄 Future Enhancements
- [ ] News sentiment analysis
- [ ] Company mention tracking
- [ ] News alerts for major events
- [ ] Social media integration
- [ ] News search functionality

---
**Created**: 2025-01-13  
**Status**: Research Phase  
**Next Step**: Test FMP news API capabilities