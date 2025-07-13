#!/usr/bin/env python3
import json
import subprocess
import time
import os
from datetime import datetime

API_KEY = os.environ.get('FMP_API_KEY')
if not API_KEY:
    print("ERROR: FMP_API_KEY environment variable not set!")
    exit(1)

def get_market_cap_curl(symbol):
    """Get market cap using curl"""
    try:
        result = subprocess.run([
            'curl', '-s', '--max-time', '10',
            f'https://financialmodelingprep.com/api/v3/profile/{symbol}?apikey={API_KEY}'
        ], capture_output=True, text=True)
        
        if result.returncode == 0 and 'mktCap' in result.stdout:
            import re
            match = re.search(r'"mktCap":\s*(\d+)', result.stdout)
            if match:
                return int(match.group(1))
        return 0
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return 0

def update_market_caps():
    """Update market caps for all companies"""
    print("Loading existing data...")
    
    # Load existing data
    data_path = '../public/data/capex_data.json'
    if not os.path.exists(data_path):
        print("No data file found!")
        return
    
    with open(data_path, 'r') as f:
        companies = json.load(f)
    
    print(f"Updating market caps for {len(companies)} companies...")
    
    updated = 0
    failed = 0
    
    for i, company in enumerate(companies):
        symbol = company['symbol']
        old_cap = company.get('market_cap', 0)
        
        print(f"Updating {symbol} ({i+1}/{len(companies)})...", end=' ')
        
        new_cap = get_market_cap_curl(symbol)
        if new_cap > 0:
            company['market_cap'] = new_cap
            company['market_cap_updated'] = datetime.now().isoformat()
            change = ((new_cap - old_cap) / old_cap * 100) if old_cap > 0 else 0
            print(f"${new_cap/1e12:.1f}T ({change:+.1f}%)")
            updated += 1
        else:
            print("FAILED")
            failed += 1
        
        # Rate limiting
        time.sleep(0.5)
    
    # Sort by market cap
    companies.sort(key=lambda x: x.get('market_cap', 0), reverse=True)
    
    # Save updated data
    with open(data_path, 'w') as f:
        json.dump(companies, f, indent=2)
    
    print(f"\\nUpdate complete! ✓ {updated} updated, ✗ {failed} failed")
    print("\\nTop 10 by market cap:")
    for i, company in enumerate(companies[:10]):
        cap = company.get('market_cap', 0)
        print(f"{i+1:2d}. {company['symbol']:5s} ${cap/1e12:.1f}T - {company['name']}")

if __name__ == "__main__":
    update_market_caps()