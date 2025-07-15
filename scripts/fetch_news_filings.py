#!/usr/bin/env python3
"""
Secure News and Filings Data Fetcher
Fetches real-time news and SEC filings for SP100 companies
API keys are stored securely in GitHub Secrets
"""

import os
import json
import requests
import time
from datetime import datetime, timedelta
from urllib.parse import quote
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SecureDataFetcher:
    def __init__(self):
        # Get API key from environment (GitHub Secrets)
        self.rss2json_key = os.environ.get('RSS2JSON_API_KEY')
        if not self.rss2json_key:
            raise ValueError("RSS2JSON_API_KEY environment variable not set")
        
        # Rate limiting
        self.sec_delay = 0.1  # 10 requests/second max for SEC
        self.rss_delay = 1.0  # Be nice to RSS2JSON
        
        # Load existing data
        self.load_company_data()
    
    def load_company_data(self):
        """Load existing company data"""
        try:
            with open('data/capex_data.json', 'r') as f:
                self.companies = json.load(f)
            logger.info(f"Loaded {len(self.companies)} companies")
        except FileNotFoundError:
            logger.error("capex_data.json not found")
            self.companies = []
    
    def fetch_company_news(self, symbol, company_name, max_articles=5):
        """Fetch news for a specific company using RSS2JSON"""
        try:
            # Create Google News RSS URL for company
            search_query = f"{company_name} {symbol} stock news"
            rss_url = f"https://news.google.com/rss/search?q={quote(search_query)}&hl=en-US&gl=US&ceid=US:en"
            
            # RSS2JSON API call
            api_url = f"https://api.rss2json.com/v1/api.json"
            params = {
                'api_key': self.rss2json_key,
                'rss_url': rss_url,
                'count': max_articles
            }
            
            response = requests.get(api_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status') != 'ok':
                logger.warning(f"RSS2JSON error for {symbol}: {data.get('message', 'Unknown error')}")
                return []
            
            articles = []
            for item in data.get('items', []):
                # Clean and format article data
                article = {
                    'title': item.get('title', '').strip(),
                    'link': item.get('link', ''),
                    'summary': item.get('description', '').strip()[:300] + '...' if len(item.get('description', '')) > 300 else item.get('description', ''),
                    'source': self.extract_source(item.get('title', '')),
                    'published': item.get('pubDate', ''),
                    'timestamp': datetime.now().isoformat()
                }
                
                # Skip articles without proper title or link
                if article['title'] and article['link']:
                    articles.append(article)
            
            logger.info(f"✅ {symbol}: {len(articles)} news articles")
            return articles[:max_articles]
            
        except Exception as e:
            logger.error(f"❌ News fetch failed for {symbol}: {str(e)}")
            return []
    
    def extract_source(self, title):
        """Extract news source from title"""
        # Common patterns in Google News titles
        if ' - ' in title:
            parts = title.split(' - ')
            if len(parts) >= 2:
                return parts[-1].strip()
        return 'News'
    
    def fetch_sec_filings(self, symbol, max_filings=10):
        """Fetch recent SEC filings for a company"""
        try:
            # SEC EDGAR API - completely free, no auth needed
            url = f"https://data.sec.gov/submissions/CIK{self.get_cik(symbol)}.json"
            
            headers = {
                'User-Agent': 'SP100-CapEx-Tracker contact@yoursite.com',  # SEC requires identification
                'Accept': 'application/json'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 404:
                logger.warning(f"⚠️ {symbol}: No SEC data found (not public or wrong CIK)")
                return []
                
            response.raise_for_status()
            data = response.json()
            
            # Extract recent filings
            filings = []
            recent_filings = data.get('filings', {}).get('recent', {})
            
            if not recent_filings:
                return []
            
            # Combine filing data
            forms = recent_filings.get('form', [])
            dates = recent_filings.get('filingDate', [])
            accession_numbers = recent_filings.get('accessionNumber', [])
            
            for i in range(min(len(forms), max_filings)):
                if i < len(dates) and i < len(accession_numbers):
                    filing = {
                        'form': forms[i],
                        'date': dates[i],
                        'accessionNumber': accession_numbers[i],
                        'url': f"https://www.sec.gov/Archives/edgar/data/{self.get_cik(symbol)}/{accession_numbers[i].replace('-', '')}/{accession_numbers[i]}-index.htm",
                        'timestamp': datetime.now().isoformat()
                    }
                    filings.append(filing)
            
            logger.info(f"✅ {symbol}: {len(filings)} SEC filings")
            return filings
            
        except Exception as e:
            logger.error(f"❌ SEC filings failed for {symbol}: {str(e)}")
            return []
    
    def get_cik(self, symbol):
        """Get CIK number for symbol - simplified mapping"""
        # This is a simplified approach - in production, you'd have a complete CIK mapping
        cik_mapping = {
            'AAPL': '0000320193',
            'MSFT': '0000789019',
            'GOOGL': '0001652044',
            'AMZN': '0001018724',
            'TSLA': '0001318605',
            'META': '0001326801',
            'NVDA': '0001045810',
            'BRK.B': '0001067983',
            'UNH': '0000731766',
            'JNJ': '0000200406'
            # Add more as needed
        }
        return cik_mapping.get(symbol, '0000000000')  # Default if not found
    
    def save_data(self, all_news, all_filings):
        """Save fetched data to JSON files"""
        timestamp = datetime.now().isoformat()
        
        # Save news data
        news_data = {
            'timestamp': timestamp,
            'companies': all_news,
            'total_companies': len(all_news),
            'total_articles': sum(len(company.get('news', [])) for company in all_news.values())
        }
        
        with open('data/company_news.json', 'w') as f:
            json.dump(news_data, f, indent=2)
        
        # Save filings data
        filings_data = {
            'timestamp': timestamp,
            'companies': all_filings,
            'total_companies': len(all_filings),
            'total_filings': sum(len(company.get('filings', [])) for company in all_filings.values())
        }
        
        with open('data/company_filings.json', 'w') as f:
            json.dump(filings_data, f, indent=2)
        
        # Update last_updated.json
        update_info = {
            'timestamp': timestamp,
            'news_companies': len(all_news),
            'filings_companies': len(all_filings),
            'total_articles': news_data['total_articles'],
            'total_filings': filings_data['total_filings']
        }
        
        with open('data/last_updated.json', 'w') as f:
            json.dump(update_info, f, indent=2)
        
        logger.info(f"💾 Saved data: {news_data['total_articles']} articles, {filings_data['total_filings']} filings")
    
    def run(self):
        """Main execution function"""
        logger.info("🚀 Starting secure data fetch...")
        
        all_news = {}
        all_filings = {}
        
        # Process each company
        for i, company in enumerate(self.companies):
            symbol = company['symbol']
            name = company['name']
            
            logger.info(f"📊 Processing {i+1}/{len(self.companies)}: {symbol} - {name}")
            
            # Fetch news
            news = self.fetch_company_news(symbol, name)
            if news:
                all_news[symbol] = {
                    'symbol': symbol,
                    'name': name,
                    'news': news,
                    'updated': datetime.now().isoformat()
                }
            
            # Add delay to be respectful
            time.sleep(self.rss_delay)
            
            # Fetch SEC filings
            filings = self.fetch_sec_filings(symbol)
            if filings:
                all_filings[symbol] = {
                    'symbol': symbol,
                    'name': name,
                    'filings': filings,
                    'updated': datetime.now().isoformat()
                }
            
            # Add delay for SEC API
            time.sleep(self.sec_delay)
            
            # Progress update
            if (i + 1) % 10 == 0:
                logger.info(f"📈 Progress: {i+1}/{len(self.companies)} companies processed")
        
        # Save all data
        self.save_data(all_news, all_filings)
        
        logger.info(f"✅ Fetch completed: {len(all_news)} companies with news, {len(all_filings)} with filings")

if __name__ == "__main__":
    try:
        fetcher = SecureDataFetcher()
        fetcher.run()
    except Exception as e:
        logger.error(f"💥 Fatal error: {str(e)}")
        exit(1)