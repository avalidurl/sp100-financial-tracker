import requests
import json
import time
import os
from datetime import datetime

API_KEY = os.environ.get('FMP_API_KEY')
if not API_KEY:
    print("ERROR: FMP_API_KEY environment variable not set!")
    exit(1)

BASE_URL = "https://financialmodelingprep.com/api/v3"

def get_company_symbols():
    """Get company symbols from existing capex data"""
    try:
        with open('../public/data/capex_data.json', 'r') as f:
            capex_data = json.load(f)
        return [(company['symbol'], company['name']) for company in capex_data]
    except FileNotFoundError:
        print("ERROR: capex_data.json not found. Run fetch_data.py first.")
        return []

def get_company_news(symbol, company_name):
    """Get recent news for a company"""
    url = f"{BASE_URL}/stock_news?tickers={symbol}&limit=5&apikey={API_KEY}"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        news_articles = []
        for article in data:
            if article.get('symbol') == symbol:
                news_articles.append({
                    'title': article.get('title', ''),
                    'link': article.get('url', ''),
                    'summary': article.get('text', '')[:200] + '...',
                    'source': article.get('site', 'Unknown'),
                    'published': article.get('publishedDate', ''),
                    'timestamp': datetime.now().isoformat()
                })
        
        return news_articles[:3]  # Limit to 3 recent articles
    except requests.RequestException as e:
        print(f"Error fetching news for {symbol}: {e}")
        return []

def main():
    print("Fetching news data for all companies...")
    
    companies = get_company_symbols()
    if not companies:
        print("No companies found to process")
        return
    
    news_data = {
        'timestamp': datetime.now().isoformat(),
        'companies': {},
        'total_companies': 0,
        'total_articles': 0
    }
    
    total_articles = 0
    
    for i, (symbol, company_name) in enumerate(companies):
        print(f"Processing {symbol} ({i+1}/{len(companies)})")
        
        try:
            news_articles = get_company_news(symbol, company_name)
            
            if news_articles:
                news_data['companies'][symbol] = {
                    'symbol': symbol,
                    'name': company_name,
                    'news': news_articles,
                    'updated': datetime.now().isoformat()
                }
                total_articles += len(news_articles)
                print(f"  ✓ Found {len(news_articles)} articles")
            else:
                print(f"  ⚠ No news found for {symbol}")
                
        except Exception as e:
            print(f"Error processing {symbol}: {e}")
        
        # Rate limiting - respect API limits
        time.sleep(0.3)
    
    news_data['total_companies'] = len(news_data['companies'])
    news_data['total_articles'] = total_articles
    
    # Ensure directory exists
    os.makedirs('../data', exist_ok=True)
    
    # Save news data
    with open('../data/company_news.json', 'w') as f:
        json.dump(news_data, f, indent=2)
    
    print(f"News data collection complete!")
    print(f"Companies with news: {len(news_data['companies'])}")
    print(f"Total articles: {total_articles}")

if __name__ == "__main__":
    main()