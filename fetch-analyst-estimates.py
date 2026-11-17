#!/usr/bin/env python3
"""
Fetch analyst estimates and price targets from Financial Modeling Prep
Adds forward-looking forecasts to financial data

This fetches:
- Estimated Revenue (next fiscal year)
- Estimated EPS (next fiscal year)
- Number of analysts
- Analyst price target (average)
- Analyst recommendation (Buy/Hold/Sell)

100% AUTOMATED - runs weekly via GitHub Actions
"""

import json
import time
import requests
import os
from typing import Optional, Dict

DATA_FILE = './data/financial_data.json'
PUBLIC_DATA_FILE = './public/data/financial_data.json'
RATE_LIMIT_DELAY = 0.3  # FMP free tier: ~3 calls/second max

class AnalystEstimatesFetcher:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("FMP_API_KEY environment variable not set")
        
        self.api_key = api_key
        self.api_calls = 0
        self.processed = []
        self.failed = []
        self.skipped = []
        
    def fetch_analyst_estimates(self, symbol: str) -> Optional[Dict]:
        """Fetch analyst estimates from FMP"""
        url = f"https://financialmodelingprep.com/api/v3/analyst-estimates/{symbol}"
        
        try:
            response = requests.get(
                url,
                params={"limit": 1, "apikey": self.api_key},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            
            self.api_calls += 1
            
            if data and len(data) > 0:
                estimate = data[0]
                return {
                    'estimated_revenue_avg': estimate.get('estimatedRevenueAvg'),
                    'estimated_revenue_low': estimate.get('estimatedRevenueLow'),
                    'estimated_revenue_high': estimate.get('estimatedRevenueHigh'),
                    'estimated_eps_avg': estimate.get('estimatedEpsAvg'),
                    'estimated_eps_low': estimate.get('estimatedEpsLow'),
                    'estimated_eps_high': estimate.get('estimatedEpsHigh'),
                    'number_of_analysts': estimate.get('numberAnalystEstimatedRevenue', 0),
                    'forecast_date': estimate.get('date')
                }
        except requests.HTTPError as e:
            status = e.response.status_code if e.response is not None else "error"
            print(f"    ❌ Analyst estimates error: HTTP {status}")
        except requests.RequestException:
            print("    ❌ Analyst estimates error: request failed")
        except Exception:
            print("    ❌ Analyst estimates error")
        
        return None
    
    def fetch_price_target(self, symbol: str) -> Optional[Dict]:
        """Fetch analyst price target consensus"""
        url = "https://financialmodelingprep.com/api/v3/price-target-consensus"
        
        try:
            response = requests.get(
                url,
                params={"symbol": symbol, "apikey": self.api_key},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            
            self.api_calls += 1
            
            if data and len(data) > 0:
                target = data[0]
                return {
                    'target_price': target.get('targetConsensus'),
                    'target_high': target.get('targetHigh'),
                    'target_low': target.get('targetLow'),
                    'target_median': target.get('targetMedian')
                }
        except requests.HTTPError as e:
            status = e.response.status_code if e.response is not None else "error"
            print(f"    ❌ Price target error: HTTP {status}")
        except requests.RequestException:
            print("    ❌ Price target error: request failed")
        except Exception:
            print("    ❌ Price target error")
        
        return None
    
    def fetch_analyst_recommendation(self, symbol: str) -> Optional[str]:
        """Fetch analyst recommendation (Buy/Hold/Sell)"""
        url = f"https://financialmodelingprep.com/api/v3/grade/{symbol}"
        
        try:
            response = requests.get(
                url,
                params={"limit": 1, "apikey": self.api_key},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            
            self.api_calls += 1
            
            if data and len(data) > 0:
                grade = data[0]
                return grade.get('newGrade', 'N/A')
        except requests.HTTPError as e:
            status = e.response.status_code if e.response is not None else "error"
            print(f"    ❌ Recommendation error: HTTP {status}")
        except requests.RequestException:
            print("    ❌ Recommendation error: request failed")
        except Exception:
            print("    ❌ Recommendation error")
        
        return None
    
    def process_companies(self, companies: list):
        """Process all companies and add analyst estimates"""
        total = len(companies)
        
        for idx, company in enumerate(companies, 1):
            symbol = company['ticker']
            name = company['name']
            
            # Skip if already has estimates (optional - remove if you want to refresh)
            if company.get('analyst_estimates'):
                print(f"[{idx}/{total}] ⏭️  {name} ({symbol}) - Already has estimates")
                self.skipped.append(symbol)
                continue
            
            print(f"\n[{idx}/{total}] 📊 Processing {name} ({symbol})...")
            
            try:
                # Fetch analyst estimates
                estimates = self.fetch_analyst_estimates(symbol)
                time.sleep(RATE_LIMIT_DELAY)
                
                # Fetch price target
                price_target = self.fetch_price_target(symbol)
                time.sleep(RATE_LIMIT_DELAY)
                
                # Fetch recommendation
                recommendation = self.fetch_analyst_recommendation(symbol)
                time.sleep(RATE_LIMIT_DELAY)
                
                # Combine all data
                if estimates or price_target or recommendation:
                    company['analyst_estimates'] = {
                        'estimated_revenue': estimates['estimated_revenue_avg'] if estimates else None,
                        'estimated_revenue_range': {
                            'low': estimates['estimated_revenue_low'] if estimates else None,
                            'high': estimates['estimated_revenue_high'] if estimates else None
                        } if estimates else None,
                        'estimated_eps': estimates['estimated_eps_avg'] if estimates else None,
                        'estimated_eps_range': {
                            'low': estimates['estimated_eps_low'] if estimates else None,
                            'high': estimates['estimated_eps_high'] if estimates else None
                        } if estimates else None,
                        'number_of_analysts': estimates['number_of_analysts'] if estimates else 0,
                        'target_price': price_target['target_price'] if price_target else None,
                        'target_price_range': {
                            'low': price_target['target_low'] if price_target else None,
                            'high': price_target['target_high'] if price_target else None
                        } if price_target else None,
                        'recommendation': recommendation,
                        'last_updated': estimates['forecast_date'] if estimates else None
                    }
                    
                    print(f"    ✅ Added analyst estimates")
                    if estimates and estimates['estimated_revenue_avg']:
                        print(f"       Revenue forecast: ${estimates['estimated_revenue_avg'] / 1e9:.2f}B")
                    if price_target and price_target['target_price']:
                        target_price = float(price_target['target_price'])
                        print(f"       Price target: ${target_price:.2f}")
                    if recommendation:
                        print("       Recommendation recorded")
                    
                    self.processed.append(symbol)
                else:
                    print(f"    ⚠️  No analyst data available")
                    self.failed.append(symbol)
                
            except Exception as e:
                print(f"    ❌ Error: {str(e)}")
                self.failed.append(symbol)
        
        return companies

def main():
    print("=" * 70)
    print("📈 ANALYST ESTIMATES & FORECASTS FETCHER")
    print("=" * 70)
    print("Source: Financial Modeling Prep (FMP)")
    print("Updates: Forward revenue, EPS estimates, price targets\n")
    
    # Get API key
    api_key = os.environ.get('FMP_API_KEY', '')
    if not api_key:
        print("❌ ERROR: FMP_API_KEY environment variable not set")
        print("\nTo fix:")
        print("  export FMP_API_KEY='your_api_key_here'")
        print("\nGet free API key: https://site.financialmodelingprep.com/developer/docs")
        return 1
    
    # Load existing data
    print(f"📂 Loading data from {DATA_FILE}...")
    try:
        with open(DATA_FILE, 'r') as f:
            companies = json.load(f)
        print(f"   ✓ Loaded {len(companies)} companies\n")
    except FileNotFoundError:
        print(f"   ❌ ERROR: {DATA_FILE} not found")
        return 1
    
    # Fetch analyst estimates
    fetcher = AnalystEstimatesFetcher(api_key)
    companies = fetcher.process_companies(companies)
    
    # Save updated data
    print("\n" + "=" * 70)
    print("💾 Saving updated data...")
    
    for file_path in [DATA_FILE, PUBLIC_DATA_FILE]:
        with open(file_path, 'w') as f:
            json.dump(companies, f, indent=2)
        print(f"   ✓ Saved to {file_path}")
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"✅ Processed:     {len(fetcher.processed)} companies")
    print(f"⏭️  Skipped:       {len(fetcher.skipped)} companies (already had data)")
    print(f"⚠️  Failed:        {len(fetcher.failed)} companies")
    print(f"🔌 API calls:     {fetcher.api_calls}")
    print(f"📈 Free tier:     {fetcher.api_calls}/250 daily quota used ({(fetcher.api_calls/250)*100:.1f}%)")
    
    if fetcher.failed:
        print(f"\n⚠️  Companies without analyst data: {', '.join(fetcher.failed)}")
    
    print("\n✨ Done! Analyst estimates added to financial data.")
    print("🚀 Commit and push to deploy to production.\n")
    
    return 0

if __name__ == '__main__':
    exit(main())

