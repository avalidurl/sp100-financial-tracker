#!/usr/bin/env python3
"""
Fetch earnings data using FREE sources (no API key needed)
Uses SEC EDGAR API and Yahoo Finance as fallback

Usage:
    python3 fetch-earnings-free.py
"""

import json
import time
import requests
from typing import Optional, Dict

DATA_FILE = './data/financial_data.json'
PUBLIC_DATA_FILE = './public/data/financial_data.json'

# Rate limiting
RATE_LIMIT_DELAY = 0.1  # Be respectful to free APIs

class EarningsFetcher:
    def __init__(self):
        self.api_calls = 0
        self.processed = []
        self.failed = []
        self.session = requests.Session()
        # SEC requires user agent
        self.session.headers.update({
            'User-Agent': 'sp100-financial-tracker earnings-fetcher contact@example.com'
        })
    
    def fetch_from_sec_edgar(self, symbol: str, cik: Optional[str] = None) -> Optional[Dict]:
        """Fetch earnings from SEC EDGAR (completely free!)"""
        try:
            # First get CIK if not provided
            if not cik:
                ticker_url = f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={symbol}&type=10-K&dateb=&owner=exclude&count=1&search_text="
                # Try company tickers JSON endpoint
                cik_url = "https://www.sec.gov/files/company_tickers.json"
                response = self.session.get(cik_url, timeout=10)
                if response.ok:
                    tickers = response.json()
                    for item in tickers.values():
                        if item.get('ticker') == symbol:
                            cik = str(item['cik_str']).zfill(10)
                            break
            
            if not cik:
                return None
            
            # Get company facts (includes financial statements)
            facts_url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"
            response = self.session.get(facts_url, timeout=10)
            
            if not response.ok:
                return None
            
            data = response.json()
            
            # Try to find net income in GAAP facts
            facts = data.get('facts', {}).get('us-gaap', {})
            
            # Look for NetIncomeLoss (most common)
            net_income_data = facts.get('NetIncomeLoss', {}).get('units', {}).get('USD')
            
            if not net_income_data:
                # Try alternative keys
                for key in ['NetIncome', 'ProfitLoss', 'NetIncomeLossAvailableToCommonStockholdersBasic']:
                    net_income_data = facts.get(key, {}).get('units', {}).get('USD')
                    if net_income_data:
                        break
            
            if net_income_data:
                # Get the most recent annual filing (form 10-K)
                annual_data = [d for d in net_income_data if d.get('form') == '10-K']
                if annual_data:
                    latest = sorted(annual_data, key=lambda x: x.get('end', ''), reverse=True)[0]
                    self.api_calls += 1
                    return {
                        'earnings': latest['val'],
                        'year': latest['end'][:4],
                        'source': 'SEC EDGAR'
                    }
        
        except Exception as e:
            print(f"    SEC EDGAR error: {str(e)}")
        
        return None
    
    def fetch_from_yahoo(self, symbol: str) -> Optional[Dict]:
        """Fetch earnings from Yahoo Finance"""
        try:
            url = f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{symbol}?modules=incomeStatementHistory,defaultKeyStatistics"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if not response.ok:
                return None
            
            data = response.json()
            
            result = data.get('quoteSummary', {}).get('result', [])
            if not result:
                return None
            
            income_stmt = result[0].get('incomeStatementHistory', {}).get('incomeStatementHistory', [])
            
            if income_stmt and len(income_stmt) > 0:
                latest = income_stmt[0]
                net_income = latest.get('netIncome', {}).get('raw')
                
                if net_income:
                    self.api_calls += 1
                    return {
                        'earnings': net_income,
                        'year': latest.get('endDate', {}).get('fmt', '2024'),
                        'source': 'Yahoo Finance'
                    }
        
        except Exception as e:
            print(f"    Yahoo Finance error: {str(e)}")
        
        return None
    
    def fetch_earnings(self, symbol: str) -> Optional[int]:
        """Fetch earnings with fallback strategy"""
        # Try SEC EDGAR first (most reliable and free)
        result = self.fetch_from_sec_edgar(symbol)
        if result:
            print(f"  ✓ SEC EDGAR: ${result['earnings'] / 1e9:.2f}B (FY{result['year']})")
            return result['earnings']
        
        # Wait a bit before trying next source
        time.sleep(0.5)
        
        # Try Yahoo Finance
        result = self.fetch_from_yahoo(symbol)
        if result:
            year = result['year'] if isinstance(result['year'], str) else str(result['year'])
            print(f"  ✓ Yahoo Finance: ${result['earnings'] / 1e9:.2f}B ({year})")
            return result['earnings']
        
        return None
    
    def process_companies(self, companies: list):
        """Process all companies"""
        print("=" * 70)
        print("EARNINGS DATA FETCHER - FREE SOURCES (SEC EDGAR + Yahoo Finance)")
        print("=" * 70)
        print(f"Total companies: {len(companies)}")
        print("No API key required! 🎉")
        print()
        
        for i, company in enumerate(companies):
            symbol = company['symbol']
            name = company['name']
            
            print(f"[{i + 1}/{len(companies)}] {name} ({symbol})")
            
            # Skip if already has earnings
            if 'earnings' in company and company['earnings']:
                earnings_b = company['earnings'] / 1_000_000_000
                print(f"  ⊘ Already has earnings: ${earnings_b:.2f}B")
                self.processed.append(symbol)
                continue
            
            # Fetch earnings
            try:
                earnings = self.fetch_earnings(symbol)
                
                if earnings:
                    company['earnings'] = earnings
                    self.processed.append(symbol)
                else:
                    print(f"  ✗ No data found")
                    self.failed.append(symbol)
                
                # Rate limiting - be nice to free APIs
                time.sleep(RATE_LIMIT_DELAY)
                
            except Exception as e:
                print(f"  ✗ Error: {str(e)}")
                self.failed.append(symbol)
            
            # Progress update
            if (i + 1) % 25 == 0:
                print()
                print(f"Progress: {len(self.processed)}/{i + 1} successful")
                print()
        
        return companies
    
    def save_data(self, companies: list):
        """Save updated data"""
        print()
        print("=" * 70)
        print("SAVING DATA...")
        print("=" * 70)
        
        json_data = json.dumps(companies, indent=2, ensure_ascii=False)
        
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            f.write(json_data)
        print(f"✓ Saved to {DATA_FILE}")
        
        with open(PUBLIC_DATA_FILE, 'w', encoding='utf-8') as f:
            f.write(json_data)
        print(f"✓ Saved to {PUBLIC_DATA_FILE}")
    
    def print_summary(self, total_companies: int):
        """Print summary"""
        print()
        print("=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"Total companies: {total_companies}")
        print(f"✓ Successfully fetched: {len(self.processed)}")
        print(f"✗ Failed: {len(self.failed)}")
        
        if self.failed:
            print()
            print("Failed companies:")
            for symbol in self.failed[:20]:
                print(f"  - {symbol}")
            if len(self.failed) > 20:
                print(f"  ... and {len(self.failed) - 20} more")
        
        print()
        print("Done! ✨")


def main():
    """Main execution"""
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            companies = json.load(f)
    except FileNotFoundError:
        print(f"Error: {DATA_FILE} not found!")
        return 1
    
    fetcher = EarningsFetcher()
    companies = fetcher.process_companies(companies)
    fetcher.save_data(companies)
    fetcher.print_summary(len(companies))
    
    return 0


if __name__ == '__main__':
    try:
        exit(main())
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        exit(1)
    except Exception as e:
        print(f"\nFatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)

