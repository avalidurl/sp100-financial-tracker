#!/usr/bin/env python3
"""
Script to fetch earnings data for all companies using Financial Modeling Prep API

RECOMMENDED: Financial Modeling Prep (FMP)
- Free tier: 250 API calls per day
- Most reliable data
- Get free key at: https://site.financialmodelingprep.com/developer/docs

Usage:
    export FMP_API_KEY="your_key_here"
    python3 fetch-earnings.py

Alternative: Use --batch mode to split across multiple days
    python3 fetch-earnings.py --batch 50
"""

import json
import os
import sys
import time
import requests
from typing import Optional, Dict
from pathlib import Path

# Load .env file if it exists
def load_env():
    env_path = Path('.env')
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

load_env()

# Load configuration
FMP_API_KEY = os.environ.get('FMP_API_KEY', '')
DATA_FILE = './data/financial_data.json'
PUBLIC_DATA_FILE = './public/data/financial_data.json'

# Rate limiting
RATE_LIMIT_DELAY = 0.2  # 200ms between calls (5 calls/second max)
BATCH_SIZE = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[1] == '--batch' else None

class EarningsFetcher:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_calls = 0
        self.processed = []
        self.failed = []
        
    def fetch_earnings_fmp(self, symbol: str) -> Optional[Dict]:
        """Fetch earnings from Financial Modeling Prep"""
        if not self.api_key:
            raise ValueError("FMP_API_KEY not set")
        
        url = f"https://financialmodelingprep.com/api/v3/income-statement/{symbol}?limit=1&apikey={self.api_key}"
        
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data and len(data) > 0 and 'netIncome' in data[0]:
                self.api_calls += 1
                return {
                    'earnings': data[0]['netIncome'],
                    'year': data[0].get('calendarYear', 2024),
                    'source': 'FMP'
                }
        except Exception as e:
            print(f"    FMP API error: {str(e)}")
        
        return None
    
    def process_companies(self, companies: list, start_idx: int = 0, batch_size: Optional[int] = None):
        """Process companies and fetch earnings"""
        
        end_idx = min(start_idx + batch_size, len(companies)) if batch_size else len(companies)
        
        print("=" * 70)
        print("EARNINGS DATA FETCHER - Financial Modeling Prep")
        print("=" * 70)
        print(f"Processing companies {start_idx + 1} to {end_idx} of {len(companies)}")
        print()
        
        if not self.api_key:
            print("ERROR: FMP_API_KEY not set!")
            print()
            print("Get a free API key (250 calls/day) from:")
            print("https://site.financialmodelingprep.com/developer/docs")
            print()
            print("Then set it as an environment variable:")
            print("  export FMP_API_KEY='your_key_here'")
            sys.exit(1)
        
        for i in range(start_idx, end_idx):
            company = companies[i]
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
                result = self.fetch_earnings_fmp(symbol)
                
                if result:
                    company['earnings'] = result['earnings']
                    earnings_b = result['earnings'] / 1_000_000_000
                    print(f"  ✓ Fetched: ${earnings_b:.2f}B (FY{result['year']})")
                    self.processed.append(symbol)
                else:
                    print(f"  ✗ No data available")
                    self.failed.append(symbol)
                
                # Rate limiting
                time.sleep(RATE_LIMIT_DELAY)
                
            except Exception as e:
                print(f"  ✗ Error: {str(e)}")
                self.failed.append(symbol)
            
            # Progress update every 25 companies
            if (i + 1) % 25 == 0:
                print()
                print(f"Progress: {self.api_calls} API calls used")
                print()
        
        return companies
    
    def save_data(self, companies: list):
        """Save updated data to JSON files"""
        print()
        print("=" * 70)
        print("SAVING DATA...")
        print("=" * 70)
        
        # Save with pretty formatting
        json_data = json.dumps(companies, indent=2, ensure_ascii=False)
        
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            f.write(json_data)
        print(f"✓ Saved to {DATA_FILE}")
        
        with open(PUBLIC_DATA_FILE, 'w', encoding='utf-8') as f:
            f.write(json_data)
        print(f"✓ Saved to {PUBLIC_DATA_FILE}")
    
    def print_summary(self, total_companies: int):
        """Print summary statistics"""
        print()
        print("=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"Total companies: {total_companies}")
        print(f"✓ Processed: {len(self.processed)}")
        print(f"✗ Failed: {len(self.failed)}")
        print(f"API calls used: {self.api_calls} / 250 daily limit")
        print(f"Remaining: {250 - self.api_calls}")
        
        if self.failed:
            print()
            print("Failed companies (may need manual review):")
            for symbol in self.failed[:10]:  # Show first 10
                print(f"  - {symbol}")
            if len(self.failed) > 10:
                print(f"  ... and {len(self.failed) - 10} more")
        
        print()
        print("Done! ✨")


def main():
    """Main execution"""
    # Load existing data
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            companies = json.load(f)
    except FileNotFoundError:
        print(f"Error: {DATA_FILE} not found!")
        sys.exit(1)
    
    # Initialize fetcher
    fetcher = EarningsFetcher(FMP_API_KEY)
    
    # Check if batch mode
    if BATCH_SIZE:
        print(f"Batch mode: Processing {BATCH_SIZE} companies at a time")
        # Find first company without earnings
        start_idx = 0
        for i, company in enumerate(companies):
            if 'earnings' not in company or not company['earnings']:
                start_idx = i
                break
        
        companies = fetcher.process_companies(companies, start_idx, BATCH_SIZE)
    else:
        # Process all companies
        companies = fetcher.process_companies(companies)
    
    # Save data
    fetcher.save_data(companies)
    
    # Print summary
    fetcher.print_summary(len(companies))
    
    # Check if more companies need processing
    remaining = sum(1 for c in companies if 'earnings' not in c or not c['earnings'])
    if remaining > 0:
        print()
        print(f"⚠️  {remaining} companies still need earnings data")
        print(f"Run this script again tomorrow or use --batch mode:")
        print(f"  python3 fetch-earnings.py --batch 50")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nFatal error: {str(e)}")
        sys.exit(1)

