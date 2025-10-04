#!/usr/bin/env python3
"""
Fetch comprehensive financial data from SEC EDGAR
Replaces multiple APIs with single FREE source

This fetches:
- Revenue, Earnings (already have)
- Operating Income
- Operating Cash Flow
- Total Assets
- Total Liabilities
- Stockholders Equity
- Long-term Debt
- Cash & Equivalents
- R&D Expense
- Gross Profit
- Shares Outstanding

Plus calculates:
- Free Cash Flow
- Debt-to-Equity Ratio
- Operating Margin
- Profit Margin
"""

import json
import time
import requests
from typing import Optional, Dict

DATA_FILE = './data/capex_data.json'
PUBLIC_DATA_FILE = './public/data/capex_data.json'
RATE_LIMIT_DELAY = 0.15

class ComprehensiveDataFetcher:
    def __init__(self):
        self.api_calls = 0
        self.processed = []
        self.failed = []
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'sp100-financial-tracker comprehensive-fetcher contact@example.com'
        })
        
        # Map friendly names to SEC EDGAR GAAP fields
        self.metrics_map = {
            'revenue': ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues'],
            'earnings': ['NetIncomeLoss', 'NetIncome', 'ProfitLoss'],
            'operating_income': ['OperatingIncomeLoss'],
            'gross_profit': ['GrossProfit'],
            'operating_cash_flow': ['NetCashProvidedByUsedInOperatingActivities'],
            'total_assets': ['Assets'],
            'total_liabilities': ['Liabilities'],
            'stockholders_equity': ['StockholdersEquity'],
            'long_term_debt': ['LongTermDebt', 'LongTermDebtNoncurrent'],
            'cash': ['CashAndCashEquivalentsAtCarryingValue', 'Cash'],
            'rd_expense': ['ResearchAndDevelopmentExpense'],
            'shares_outstanding': ['CommonStockSharesOutstanding'],
            'capex': ['PaymentsToAcquirePropertyPlantAndEquipment']
        }
    
    def get_company_cik(self, symbol: str) -> Optional[str]:
        """Get CIK for a ticker symbol"""
        try:
            url = "https://www.sec.gov/files/company_tickers.json"
            response = self.session.get(url, timeout=10)
            
            if response.ok:
                tickers = response.json()
                for item in tickers.values():
                    if item.get('ticker') == symbol:
                        return str(item['cik_str']).zfill(10)
        except Exception as e:
            print(f"    Error getting CIK: {str(e)}")
        
        return None
    
    def extract_latest_value(self, data: dict, field_names: list) -> Optional[float]:
        """Extract latest annual value for a metric"""
        us_gaap = data.get('facts', {}).get('us-gaap', {})
        
        for field_name in field_names:
            if field_name not in us_gaap:
                continue
            
            units = us_gaap[field_name].get('units', {})
            
            # Try USD first
            usd_data = units.get('USD', [])
            if usd_data:
                annual = [d for d in usd_data if d.get('form') == '10-K']
                if annual:
                    latest = sorted(annual, key=lambda x: x.get('end', ''), reverse=True)[0]
                    return latest['val']
            
            # Try shares
            shares_data = units.get('shares', [])
            if shares_data:
                annual = [d for d in shares_data if d.get('form') == '10-K']
                if annual:
                    latest = sorted(annual, key=lambda x: x.get('end', ''), reverse=True)[0]
                    return latest['val']
        
        return None
    
    def fetch_comprehensive_data(self, symbol: str) -> Optional[Dict]:
        """Fetch all metrics from SEC EDGAR"""
        try:
            cik = self.get_company_cik(symbol)
            if not cik:
                return None
            
            url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"
            response = self.session.get(url, timeout=15)
            
            if not response.ok:
                return None
            
            data = response.json()
            self.api_calls += 1
            
            # Extract all metrics
            result = {}
            for metric, field_names in self.metrics_map.items():
                value = self.extract_latest_value(data, field_names)
                if value is not None:
                    result[metric] = value
            
            return result if result else None
            
        except Exception as e:
            print(f"    SEC EDGAR error: {str(e)}")
            return None
    
    def process_companies(self, companies: list):
        """Process all companies and add comprehensive data"""
        print("=" * 80)
        print("COMPREHENSIVE DATA FETCHER - SEC EDGAR (100% FREE)")
        print("=" * 80)
        print(f"Total companies: {len(companies)}")
        print()
        print("Fetching:")
        print("  • Revenue, Earnings, CapEx")
        print("  • Operating Income, Gross Profit")
        print("  • Operating Cash Flow")
        print("  • Total Assets, Liabilities, Equity")
        print("  • Long-term Debt, Cash")
        print("  • R&D Expense, Shares Outstanding")
        print()
        print("Plus calculating: Free Cash Flow, Debt/Equity, Margins")
        print("=" * 80)
        print()
        
        for i, company in enumerate(companies):
            symbol = company['symbol']
            name = company['name']
            
            print(f"[{i + 1}/{len(companies)}] {name} ({symbol})")
            
            try:
                # Fetch comprehensive data
                data = self.fetch_comprehensive_data(symbol)
                
                if data:
                    # Update company with fetched data
                    if 'revenue' in data:
                        company['revenue'] = int(data['revenue'])
                    if 'earnings' in data:
                        company['earnings'] = int(data['earnings'])
                    if 'capex' in data:
                        # CapEx is usually positive in GAAP, make it negative
                        capex_val = abs(int(data['capex']))
                        company['capex'] = -capex_val if capex_val > 0 else capex_val
                    
                    # Add new metrics
                    if 'operating_income' in data:
                        company['operating_income'] = int(data['operating_income'])
                    if 'gross_profit' in data:
                        company['gross_profit'] = int(data['gross_profit'])
                    if 'operating_cash_flow' in data:
                        company['operating_cash_flow'] = int(data['operating_cash_flow'])
                    if 'total_assets' in data:
                        company['total_assets'] = int(data['total_assets'])
                    if 'total_liabilities' in data:
                        company['total_liabilities'] = int(data['total_liabilities'])
                    if 'stockholders_equity' in data:
                        company['stockholders_equity'] = int(data['stockholders_equity'])
                    if 'long_term_debt' in data:
                        company['long_term_debt'] = int(data['long_term_debt'])
                    if 'cash' in data:
                        company['cash'] = int(data['cash'])
                    if 'rd_expense' in data:
                        company['rd_expense'] = int(data['rd_expense'])
                    if 'shares_outstanding' in data:
                        company['shares_outstanding'] = int(data['shares_outstanding'])
                    
                    # Calculate derived metrics
                    if 'operating_cash_flow' in company and 'capex' in company:
                        company['free_cash_flow'] = company['operating_cash_flow'] + company['capex']
                    
                    if 'long_term_debt' in company and 'stockholders_equity' in company and company['stockholders_equity'] > 0:
                        company['debt_to_equity'] = round(company['long_term_debt'] / company['stockholders_equity'], 2)
                    
                    if 'operating_income' in company and 'revenue' in company and company['revenue'] > 0:
                        company['operating_margin'] = round(company['operating_income'] / company['revenue'] * 100, 1)
                    
                    if 'earnings' in company and 'revenue' in company and company['revenue'] > 0:
                        company['profit_margin'] = round(company['earnings'] / company['revenue'] * 100, 1)
                    
                    # Show what was updated
                    updates = []
                    if 'earnings' in company:
                        updates.append(f"Earnings ${company['earnings']/1e9:.1f}B")
                    if 'operating_income' in company:
                        updates.append(f"OpInc ${company['operating_income']/1e9:.1f}B")
                    if 'free_cash_flow' in company:
                        updates.append(f"FCF ${company['free_cash_flow']/1e9:.1f}B")
                    if 'debt_to_equity' in company:
                        updates.append(f"D/E {company['debt_to_equity']}")
                    
                    print(f"  ✓ {', '.join(updates)}")
                    self.processed.append(symbol)
                else:
                    print(f"  ✗ No data available")
                    self.failed.append(symbol)
                
                # Rate limiting
                time.sleep(RATE_LIMIT_DELAY)
                
            except Exception as e:
                print(f"  ✗ Error: {str(e)}")
                self.failed.append(symbol)
            
            # Progress update
            if (i + 1) % 25 == 0:
                print()
                print(f"Progress: {len(self.processed)}/{i + 1} successful, {self.api_calls} API calls")
                print()
        
        return companies
    
    def save_data(self, companies: list):
        """Save updated data"""
        print()
        print("=" * 80)
        print("SAVING DATA...")
        print("=" * 80)
        
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
        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Total companies: {total_companies}")
        print(f"✓ Successfully processed: {len(self.processed)}")
        print(f"✗ Failed: {len(self.failed)}")
        print(f"API calls made: {self.api_calls}")
        
        if self.failed:
            print()
            print("Failed companies:")
            for symbol in self.failed[:10]:
                print(f"  - {symbol}")
            if len(self.failed) > 10:
                print(f"  ... and {len(self.failed) - 10} more")
        
        print()
        print("✨ All data now from SEC EDGAR (100% FREE!)") 
        print("   No more paid API dependencies!")
        print()


def main():
    """Main execution"""
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            companies = json.load(f)
    except FileNotFoundError:
        print(f"Error: {DATA_FILE} not found!")
        return 1
    
    fetcher = ComprehensiveDataFetcher()
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

