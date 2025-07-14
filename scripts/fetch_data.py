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

def get_sp100_companies():
    """Get current S&P 100 companies list"""
    # Note: FMP doesn't have direct S&P 100 endpoint, so we'll use S&P 500 and take top 100 by market cap
    url = f"{BASE_URL}/sp500_constituent?apikey={API_KEY}"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching S&P 100 companies: {e}")
        return []

def get_company_capex(symbol):
    """Get latest quarterly capex data for a company"""
    url = f"{BASE_URL}/cash-flow-statement/{symbol}?period=quarterly&limit=5&apikey={API_KEY}"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            latest = data[0]  # Most recent quarter
            # Create a more descriptive period label
            date = latest.get('date', '')
            year = latest.get('calendarYear', 2025)
            quarter = latest.get('period', 'Q1')
            
            return {
                'symbol': symbol,
                'capex': latest.get('capitalExpenditure', 0),
                'year': year,
                'quarter': quarter,
                'period': f"{quarter} {year}",
                'date': date,
                'revenue': latest.get('revenue', 0)
            }
        return None
    except requests.RequestException as e:
        print(f"Error fetching data for {symbol}: {e}")
        return None

def get_real_time_market_cap(symbol):
    """Get real-time market cap for a company"""
    url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            profile = data[0]
            return profile.get('mktCap', 0)
        return 0
    except requests.RequestException as e:
        print(f"Error fetching market cap for {symbol}: {e}")
        return 0

def main():
    print("Fetching S&P 100 companies...")
    all_companies = get_sp100_companies()
    
    if not all_companies:
        print("Failed to fetch companies list")
        return
    
    # Take top 100 companies by market cap (already sorted in API response)
    companies = all_companies[:100]
    print(f"Processing top {len(companies)} companies by market cap...")
    
    capex_data = []
    failed_companies = []
    
    for i, company in enumerate(companies):
        symbol = company['symbol']
        print(f"Processing {symbol} ({i+1}/{len(companies)})")
        
        try:
            capex_info = get_company_capex(symbol)
            if capex_info:
                capex_info['name'] = company['name']
                capex_info['sector'] = company.get('sector', 'Unknown')
                
                # Get real-time market cap
                real_time_market_cap = get_real_time_market_cap(symbol)
                capex_info['market_cap'] = real_time_market_cap if real_time_market_cap > 0 else company.get('marketCap', 0)
                
                capex_data.append(capex_info)
                print(f"  ✓ Market cap: ${capex_info['market_cap']:,.0f}")
            else:
                failed_companies.append(symbol)
        except Exception as e:
            print(f"Error processing {symbol}: {e}")
            failed_companies.append(symbol)
        
        time.sleep(0.5)
    
    capex_data.sort(key=lambda x: abs(x['capex']), reverse=True)
    
    os.makedirs('../public/data', exist_ok=True)
    
    with open('../public/data/capex_data.json', 'w') as f:
        json.dump(capex_data, f, indent=2)
    
    with open('../public/data/last_updated.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_companies': len(capex_data),
            'failed_companies': failed_companies
        }, f, indent=2)
    
    print(f"S&P 100 data collection complete. {len(capex_data)} companies processed.")
    if failed_companies:
        print(f"Failed companies: {len(failed_companies)}")

if __name__ == "__main__":
    main()