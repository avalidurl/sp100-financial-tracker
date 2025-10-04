#!/usr/bin/env python3
"""Update market caps from Yahoo Finance"""
import json
import requests
import time

print("📊 Updating market caps from Yahoo Finance...")

# Load current data
with open('data/financial_data.json', 'r') as f:
    companies = json.load(f)

updated_count = 0
failed = []

for i, company in enumerate(companies):
    symbol = company['symbol']
    print(f"[{i+1}/{len(companies)}] Fetching {symbol}...")
    
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        response = requests.get(url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0'
        })
        
        if response.ok:
            data = response.json()
            result = data.get('chart', {}).get('result', [{}])[0]
            meta = result.get('meta', {})
            
            price = meta.get('regularMarketPrice')
            market_cap = meta.get('marketCap')
            
            if market_cap:
                company['market_cap'] = market_cap
                company['market_cap_updated'] = time.strftime('%Y-%m-%dT%H:%M:%S')
                updated_count += 1
                print(f"  ✓ Updated: ${market_cap/1e9:.2f}B")
            elif price and 'shares_outstanding' in company:
                # Calculate from price x shares
                market_cap = int(price * company['shares_outstanding'])
                company['market_cap'] = market_cap
                company['market_cap_updated'] = time.strftime('%Y-%m-%dT%H:%M:%S')
                updated_count += 1
                print(f"  ✓ Calculated: ${market_cap/1e9:.2f}B")
            else:
                print(f"  ⊘ No market cap data")
                failed.append(symbol)
        else:
            print(f"  ✗ HTTP {response.status_code}")
            failed.append(symbol)
        
        time.sleep(0.1)  # Rate limiting
        
    except Exception as e:
        print(f"  ✗ Error: {str(e)}")
        failed.append(symbol)

# Save updated data
with open('data/financial_data.json', 'w') as f:
    json.dump(companies, f, indent=2)

with open('public/data/financial_data.json', 'w') as f:
    json.dump(companies, f, indent=2)

# Update timestamp
with open('data/last_updated.json', 'w') as f:
    json.dump({'market_caps': time.strftime('%Y-%m-%dT%H:%M:%S')}, f)

with open('public/data/last_updated.json', 'w') as f:
    json.dump({'market_caps': time.strftime('%Y-%m-%dT%H:%M:%S')}, f)

print(f"\n✅ Updated {updated_count}/{len(companies)} companies")
if failed:
    print(f"❌ Failed: {', '.join(failed[:5])}")

