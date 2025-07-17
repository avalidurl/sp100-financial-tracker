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

def get_company_statements(symbol, company_name):
    """Get financial statements for a company"""
    statements = {}
    
    # Get income statement
    income_url = f"{BASE_URL}/income-statement/{symbol}?limit=1&apikey={API_KEY}"
    try:
        response = requests.get(income_url, timeout=30)
        response.raise_for_status()
        income_data = response.json()
        if income_data:
            statements['income'] = income_data[0]
    except requests.RequestException as e:
        print(f"Error fetching income statement for {symbol}: {e}")
        statements['income'] = None
    
    time.sleep(0.1)  # Small delay between requests
    
    # Get balance sheet
    balance_url = f"{BASE_URL}/balance-sheet-statement/{symbol}?limit=1&apikey={API_KEY}"
    try:
        response = requests.get(balance_url, timeout=30)
        response.raise_for_status()
        balance_data = response.json()
        if balance_data:
            statements['balance_sheet'] = balance_data[0]
    except requests.RequestException as e:
        print(f"Error fetching balance sheet for {symbol}: {e}")
        statements['balance_sheet'] = None
    
    time.sleep(0.1)  # Small delay between requests
    
    # Get cash flow statement
    cashflow_url = f"{BASE_URL}/cash-flow-statement/{symbol}?limit=1&apikey={API_KEY}"
    try:
        response = requests.get(cashflow_url, timeout=30)
        response.raise_for_status()
        cashflow_data = response.json()
        if cashflow_data:
            statements['cash_flow'] = cashflow_data[0]
    except requests.RequestException as e:
        print(f"Error fetching cash flow statement for {symbol}: {e}")
        statements['cash_flow'] = None
    
    return statements

def main():
    print("Fetching financial statements data for all companies...")
    
    companies = get_company_symbols()
    if not companies:
        print("No companies found to process")
        return
    
    statements_data = {
        'timestamp': datetime.now().isoformat(),
        'companies': {},
        'total_companies': 0
    }
    
    for i, (symbol, company_name) in enumerate(companies):
        print(f"Processing {symbol} ({i+1}/{len(companies)})")
        
        try:
            statements = get_company_statements(symbol, company_name)
            
            if any(statements.values()):  # If we got at least one statement
                statements_data['companies'][symbol] = {
                    'symbol': symbol,
                    'name': company_name,
                    'statements': statements,
                    'updated': datetime.now().isoformat()
                }
                print(f"  ✓ Retrieved statements")
            else:
                print(f"  ⚠ No statements found for {symbol}")
                
        except Exception as e:
            print(f"Error processing {symbol}: {e}")
        
        # Rate limiting - respect API limits
        time.sleep(0.5)
    
    statements_data['total_companies'] = len(statements_data['companies'])
    
    # Ensure directory exists
    os.makedirs('../data', exist_ok=True)
    
    # Save statements data
    with open('../data/company_statements.json', 'w') as f:
        json.dump(statements_data, f, indent=2)
    
    print(f"Financial statements data collection complete!")
    print(f"Companies with statements: {len(statements_data['companies'])}")

if __name__ == "__main__":
    main()