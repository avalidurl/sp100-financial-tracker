#!/usr/bin/env python3
"""
Explore what financial data is available from SEC EDGAR for a company
This will show you ALL the metrics you can fetch for free!
"""

import requests
import json
import sys

def get_company_cik(symbol):
    """Get CIK for a ticker symbol"""
    url = "https://www.sec.gov/files/company_tickers.json"
    headers = {'User-Agent': 'sp100-financial-tracker explorer contact@example.com'}
    response = requests.get(url, headers=headers, timeout=10)
    
    if response.ok:
        tickers = response.json()
        for item in tickers.values():
            if item.get('ticker') == symbol:
                return str(item['cik_str']).zfill(10)
    return None

def explore_company_data(symbol):
    """Explore all available financial data for a company"""
    print(f"\n{'='*80}")
    print(f"SEC EDGAR DATA EXPLORER - {symbol}")
    print(f"{'='*80}\n")
    
    # Get CIK
    print(f"🔍 Looking up CIK for {symbol}...")
    cik = get_company_cik(symbol)
    
    if not cik:
        print(f"❌ Could not find CIK for {symbol}")
        return
    
    print(f"✓ Found CIK: {cik}\n")
    
    # Get company facts
    url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"
    headers = {'User-Agent': 'sp100-financial-tracker explorer contact@example.com'}
    
    print(f"📡 Fetching data from SEC EDGAR...")
    response = requests.get(url, headers=headers, timeout=10)
    
    if not response.ok:
        print(f"❌ Failed to fetch data (HTTP {response.status_code})")
        return
    
    data = response.json()
    
    # Extract available metrics
    print(f"✓ Data received!\n")
    print(f"{'='*80}")
    print(f"AVAILABLE FINANCIAL METRICS")
    print(f"{'='*80}\n")
    
    us_gaap = data.get('facts', {}).get('us-gaap', {})
    
    # Organize by category
    categories = {
        '💰 INCOME STATEMENT': [
            'Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax',
            'NetIncomeLoss', 'NetIncome', 'ProfitLoss',
            'GrossProfit', 'OperatingIncomeLoss', 
            'CostOfRevenue', 'CostOfGoodsAndServicesSold',
            'ResearchAndDevelopmentExpense',
            'SellingGeneralAndAdministrativeExpense',
            'InterestExpense', 'IncomeTaxExpenseBenefit',
            'EarningsPerShareBasic', 'EarningsPerShareDiluted'
        ],
        '📊 BALANCE SHEET': [
            'Assets', 'AssetsCurrent', 'AssetsNoncurrent',
            'Liabilities', 'LiabilitiesCurrent', 'LiabilitiesNoncurrent',
            'StockholdersEquity', 'CommonStockValue',
            'CashAndCashEquivalentsAtCarryingValue', 'Cash',
            'AccountsReceivableNetCurrent',
            'InventoryNet',
            'PropertyPlantAndEquipmentNet',
            'Goodwill', 'IntangibleAssetsNetExcludingGoodwill',
            'LongTermDebt', 'ShortTermBorrowings'
        ],
        '💵 CASH FLOW': [
            'NetCashProvidedByUsedInOperatingActivities',
            'NetCashProvidedByUsedInInvestingActivities',
            'NetCashProvidedByUsedInFinancingActivities',
            'PaymentsToAcquirePropertyPlantAndEquipment',  # This is CAPEX!
            'DepreciationDepletionAndAmortization',
            'StockIssuedDuringPeriodValueNewIssues',
            'PaymentsOfDividends'
        ],
        '📈 KEY METRICS': [
            'CommonStockSharesOutstanding',
            'WeightedAverageNumberOfSharesOutstandingBasic',
            'RetainedEarningsAccumulatedDeficit',
            'AccumulatedOtherComprehensiveIncomeLossNetOfTax'
        ]
    }
    
    available_metrics = {}
    
    for category, metrics in categories.items():
        found = []
        for metric in metrics:
            if metric in us_gaap:
                # Get latest value
                units = us_gaap[metric].get('units', {})
                usd_data = units.get('USD', [])
                shares_data = units.get('shares', [])
                pure_data = units.get('pure', [])
                
                latest_value = None
                latest_date = None
                
                if usd_data:
                    annual = [d for d in usd_data if d.get('form') == '10-K']
                    if annual:
                        latest = sorted(annual, key=lambda x: x.get('end', ''), reverse=True)[0]
                        latest_value = latest['val']
                        latest_date = latest['end']
                elif shares_data:
                    annual = [d for d in shares_data if d.get('form') == '10-K']
                    if annual:
                        latest = sorted(annual, key=lambda x: x.get('end', ''), reverse=True)[0]
                        latest_value = latest['val']
                        latest_date = latest['end']
                elif pure_data:
                    annual = [d for d in pure_data if d.get('form') == '10-K']
                    if annual:
                        latest = sorted(annual, key=lambda x: x.get('end', ''), reverse=True)[0]
                        latest_value = latest['val']
                        latest_date = latest['end']
                
                if latest_value is not None:
                    found.append((metric, latest_value, latest_date))
        
        if found:
            available_metrics[category] = found
    
    # Display results
    for category, metrics in available_metrics.items():
        print(f"\n{category}")
        print(f"{'-'*80}")
        for metric, value, date in metrics:
            # Format value
            if isinstance(value, (int, float)):
                if abs(value) > 1_000_000_000:
                    formatted = f"${value/1_000_000_000:.2f}B"
                elif abs(value) > 1_000_000:
                    formatted = f"${value/1_000_000:.2f}M"
                elif abs(value) > 1000:
                    formatted = f"${value/1000:.2f}K"
                else:
                    formatted = f"{value:,.2f}"
            else:
                formatted = str(value)
            
            year = date[:4] if date else "N/A"
            print(f"  • {metric:50s} {formatted:>15s} ({year})")
    
    # Summary
    total_metrics = sum(len(m) for m in available_metrics.values())
    print(f"\n{'='*80}")
    print(f"SUMMARY: Found {total_metrics} financial metrics available for {symbol}")
    print(f"{'='*80}\n")
    
    # Show all available GAAP fields
    print(f"\n💡 TIP: {len(us_gaap)} total US-GAAP fields available!")
    print(f"   You can fetch ANY financial metric filed with the SEC.\n")
    
    return available_metrics


if __name__ == '__main__':
    # Default to AAPL if no symbol provided
    symbol = sys.argv[1] if len(sys.argv) > 1 else 'AAPL'
    
    try:
        explore_company_data(symbol)
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

