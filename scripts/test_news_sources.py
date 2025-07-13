#!/usr/bin/env python3
"""
Test various free news sources for company information
"""
import requests
import json
import xml.etree.ElementTree as ET
from datetime import datetime
import os

def test_alpha_vantage_news():
    """Test Alpha Vantage news API"""
    print("🔍 Testing Alpha Vantage News API...")
    
    # You'd need to get a free API key from Alpha Vantage
    api_key = "demo"  # Replace with real key
    url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&limit=5&apikey={api_key}"
    
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if "Error Message" in data:
            print(f"❌ Error: {data['Error Message']}")
        elif "feed" in data:
            print(f"✅ Found {len(data['feed'])} articles")
            return True
        else:
            print(f"⚠️ Unexpected structure: {list(data.keys())}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    return False

def test_marketwatch_rss():
    """Test MarketWatch RSS feeds"""
    print("🔍 Testing MarketWatch RSS...")
    
    # MarketWatch has RSS feeds for different sections
    urls = [
        "https://feeds.marketwatch.com/marketwatch/realtimeheadlines/",
        "https://feeds.marketwatch.com/marketwatch/topstories/"
    ]
    
    for url in urls:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                print(f"✅ MarketWatch RSS accessible: {url}")
                # Parse XML to see structure
                root = ET.fromstring(response.content)
                items = root.findall(".//item")
                print(f"   Found {len(items)} articles")
                if items:
                    title = items[0].find("title")
                    if title is not None:
                        print(f"   Sample: {title.text[:60]}...")
                return True
        except Exception as e:
            print(f"❌ Failed {url}: {e}")
    
    return False

def test_seeking_alpha_rss():
    """Test Seeking Alpha RSS feeds"""
    print("🔍 Testing Seeking Alpha RSS...")
    
    # Seeking Alpha has company-specific RSS feeds
    urls = [
        "https://seekingalpha.com/api/sa/combined/AAPL.xml",
        "https://seekingalpha.com/feed.xml"
    ]
    
    for url in urls:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                print(f"✅ Seeking Alpha RSS accessible: {url}")
                return True
        except Exception as e:
            print(f"❌ Failed {url}: {e}")
    
    return False

def test_reddit_api():
    """Test Reddit API for financial mentions"""
    print("🔍 Testing Reddit API...")
    
    # Reddit has a public API for subreddit posts
    urls = [
        "https://www.reddit.com/r/stocks/search.json?q=AAPL&sort=new&limit=5",
        "https://www.reddit.com/r/investing/search.json?q=Apple&sort=new&limit=5"
    ]
    
    headers = {"User-Agent": "SP100-CapEx-Tracker/1.0"}
    
    for url in urls:
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                posts = data.get("data", {}).get("children", [])
                print(f"✅ Reddit API accessible: {len(posts)} posts found")
                if posts:
                    title = posts[0]["data"]["title"]
                    print(f"   Sample: {title[:60]}...")
                return True
        except Exception as e:
            print(f"❌ Failed {url}: {e}")
    
    return False

def test_sec_filings():
    """Test SEC EDGAR RSS feeds"""
    print("🔍 Testing SEC EDGAR RSS...")
    
    # SEC has RSS feeds for company filings
    # Note: Need to identify company CIK numbers
    urls = [
        "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000320193&type=8-K&dateb=&count=10&output=atom",  # Apple CIK
    ]
    
    headers = {"User-Agent": "SP100-CapEx-Tracker contact@example.com"}
    
    for url in urls:
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                print(f"✅ SEC RSS accessible")
                return True
        except Exception as e:
            print(f"❌ Failed SEC: {e}")
    
    return False

def test_newsapi_org():
    """Test NewsAPI.org free tier"""
    print("🔍 Testing NewsAPI.org...")
    
    # NewsAPI has a free tier with 100 requests/day
    api_key = "your_newsapi_key_here"  # Would need to register
    url = f"https://newsapi.org/v2/everything?q=Apple+stock&apiKey={api_key}&pageSize=5"
    
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if data.get("status") == "ok":
            articles = data.get("articles", [])
            print(f"✅ NewsAPI.org: {len(articles)} articles found")
            return True
        else:
            print(f"❌ NewsAPI.org error: {data.get('message', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ NewsAPI.org failed: {e}")
    
    return False

def main():
    """Test all news sources"""
    print("🗞️  Testing Free News Sources for SP100 Companies\\n")
    
    sources = [
        ("Alpha Vantage", test_alpha_vantage_news),
        ("MarketWatch RSS", test_marketwatch_rss),
        ("Seeking Alpha RSS", test_seeking_alpha_rss),
        ("Reddit API", test_reddit_api),
        ("SEC EDGAR RSS", test_sec_filings),
        ("NewsAPI.org", test_newsapi_org),
    ]
    
    results = {}
    
    for name, test_func in sources:
        print(f"\\n{'='*50}")
        try:
            results[name] = test_func()
        except Exception as e:
            print(f"❌ {name} test crashed: {e}")
            results[name] = False
        print(f"{'='*50}")
    
    print(f"\\n📊 SUMMARY:")
    print(f"{'='*50}")
    for name, success in results.items():
        status = "✅ WORKS" if success else "❌ FAILED"
        print(f"{name:20} {status}")
    
    print(f"\\n💡 RECOMMENDATIONS:")
    working_sources = [name for name, success in results.items() if success]
    if working_sources:
        print(f"✅ Working sources: {', '.join(working_sources)}")
        print("📋 Next steps:")
        print("   1. Get API keys for working services")
        print("   2. Test rate limits and data quality")
        print("   3. Implement the most reliable option")
    else:
        print("❌ No sources working - may need alternative approach")
        print("🔄 Consider:")
        print("   - Web scraping with BeautifulSoup")
        print("   - Paid tier for FMP or other services")
        print("   - Manual curation of top companies")

if __name__ == "__main__":
    main()