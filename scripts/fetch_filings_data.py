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

def get_company_filings(symbol, company_name):
    """Get recent SEC filings for a company"""
    url = f"{BASE_URL}/sec_filings/{symbol}?limit=10&apikey={API_KEY}"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        filings = []
        for filing in data:
            # Focus on major filing types
            form_type = filing.get('type', '')
            if form_type in ['10-K', '10-Q', '8-K', 'DEF 14A', 'SC 13G']:
                filings.append({
                    'form': form_type,
                    'date': filing.get('date', ''),
                    'accessionNumber': filing.get('accessionNumber', ''),
                    'url': filing.get('finalLink', ''),
                    'timestamp': datetime.now().isoformat()
                })
        
        return filings[:5]  # Limit to 5 recent filings
    except requests.RequestException as e:
        print(f"Error fetching filings for {symbol}: {e}")
        return []

def main():
    print("Fetching SEC filings data for all companies...")
    
    companies = get_company_symbols()
    if not companies:
        print("No companies found to process")
        return
    
    filings_data = {
        'timestamp': datetime.now().isoformat(),
        'companies': {},
        'total_companies': 0,
        'total_filings': 0
    }
    
    total_filings = 0
    
    for i, (symbol, company_name) in enumerate(companies):
        print(f"Processing {symbol} ({i+1}/{len(companies)})")
        
        try:
            filings = get_company_filings(symbol, company_name)
            
            if filings:
                filings_data['companies'][symbol] = {
                    'symbol': symbol,
                    'name': company_name,
                    'filings': filings,
                    'updated': datetime.now().isoformat()
                }
                total_filings += len(filings)
                print(f"  ✓ Found {len(filings)} filings")
            else:
                print(f"  ⚠ No filings found for {symbol}")
                
        except Exception as e:
            print(f"Error processing {symbol}: {e}")
        
        # Rate limiting - respect API limits
        time.sleep(0.3)
    
    filings_data['total_companies'] = len(filings_data['companies'])
    filings_data['total_filings'] = total_filings
    
    # Ensure directory exists
    os.makedirs('../data', exist_ok=True)
    
    # Save filings data
    with open('../data/company_filings.json', 'w') as f:
        json.dump(filings_data, f, indent=2)
    
    print(f"SEC filings data collection complete!")
    print(f"Companies with filings: {len(filings_data['companies'])}")
    print(f"Total filings: {total_filings}")

if __name__ == "__main__":
    main()