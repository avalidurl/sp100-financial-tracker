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

def get_real_time_market_cap(symbol):
    """Get real-time market cap for a company"""
    url = f"{BASE_URL}/market-capitalization/{symbol}?apikey={API_KEY}"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            return data[0].get('marketCap', 0)
        return 0
    except requests.RequestException as e:
        print(f"Error fetching market cap for {symbol}: {e}")
        return 0

def get_company_profile(symbol):
    """Get company profile including current market cap"""
    url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            profile = data[0]
            return {
                'market_cap': profile.get('mktCap', 0),
                'price': profile.get('price', 0),
                'currency': profile.get('currency', 'USD'),
                'exchange': profile.get('exchangeShortName', '')
            }
        return None
    except requests.RequestException as e:
        print(f"Error fetching profile for {symbol}: {e}")
        return None

def update_market_caps():
    """Update market caps for all companies in our dataset"""
    print("Loading existing capex data...")
    
    # Load existing data
    data_path = '../public/data/capex_data.json'
    if not os.path.exists(data_path):
        print("No existing capex data found!")
        return
    
    with open(data_path, 'r') as f:
        companies = json.load(f)
    
    print(f"Updating market caps for {len(companies)} companies...")
    
    updated_companies = []
    failed_updates = []
    
    for i, company in enumerate(companies):
        symbol = company['symbol']
        print(f"Updating market cap for {symbol} ({i+1}/{len(companies)})")
        
        try:
            # Try market cap endpoint first
            market_cap = get_real_time_market_cap(symbol)
            
            # If that fails, try company profile endpoint
            if market_cap == 0:
                profile = get_company_profile(symbol)
                if profile:
                    market_cap = profile['market_cap']
            
            if market_cap > 0:
                company['market_cap'] = market_cap
                company['market_cap_updated'] = datetime.now().isoformat()
                updated_companies.append(company)
                print(f"  ✓ Updated {symbol}: ${market_cap:,.0f}")
            else:
                print(f"  ✗ Failed to get market cap for {symbol}")
                failed_updates.append(symbol)
                # Keep the old market cap if update fails
                updated_companies.append(company)
                
        except Exception as e:
            print(f"  ✗ Error updating {symbol}: {e}")
            failed_updates.append(symbol)
            # Keep the old data if update fails
            updated_companies.append(company)
        
        # Rate limiting - FMP allows 250 calls per day
        time.sleep(0.5)
    
    # Sort by market cap (descending) to see current rankings
    updated_companies.sort(key=lambda x: x.get('market_cap', 0), reverse=True)
    
    # Save updated data
    os.makedirs('../public/data', exist_ok=True)
    
    with open(data_path, 'w') as f:
        json.dump(updated_companies, f, indent=2)
    
    # Update metadata
    with open('../public/data/last_updated.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_companies': len(updated_companies),
            'successful_updates': len(updated_companies) - len(failed_updates),
            'failed_updates': failed_updates,
            'update_type': 'market_cap_only'
        }, f, indent=2)
    
    print(f"\nMarket cap update complete!")
    print(f"✓ Successfully updated: {len(updated_companies) - len(failed_updates)} companies")
    if failed_updates:
        print(f"✗ Failed updates: {len(failed_updates)} companies")
        print(f"Failed symbols: {', '.join(failed_updates)}")
    
    # Show top 10 by market cap
    print(f"\nTop 10 companies by market cap:")
    for i, company in enumerate(updated_companies[:10]):
        market_cap = company.get('market_cap', 0)
        print(f"{i+1:2d}. {company['symbol']:5s} - ${market_cap:>12,.0f} ({company['name']})")

if __name__ == "__main__":
    update_market_caps()