#!/usr/bin/env python3
"""
Script to determine stock exchange mappings for S&P 500 companies
Based on research and known exchange listings
"""

import json

# Load the capex data
with open('public/data/capex_data.json', 'r') as f:
    data = json.load(f)

# Extract symbols
symbols = [item['symbol'] for item in data]

# Known exchange mappings based on research
# NASDAQ companies (primarily tech companies)
nasdaq_symbols = {
    'NVDA', 'MSFT', 'AAPL', 'AMZN', 'GOOGL', 'META', 'AVGO', 'TSLA', 'NFLX',
    'ORCL', 'COST', 'CSCO', 'CRM', 'AMD', 'ADBE', 'QCOM', 'INTC', 'NOW',
    'ISRG', 'GILD', 'CMCSA', 'ADP', 'SBUX', 'PYPL', 'MDLZ', 'TXN'
}

# NYSE companies (traditional blue-chips, banks, industrials)
nyse_symbols = {
    'BRK.B', 'JPM', 'WMT', 'LLY', 'V', 'XOM', 'MA', 'JNJ', 'PG', 'HD',
    'BAC', 'ABBV', 'KO', 'PM', 'UNH', 'GE', 'CVX', 'WFC', 'IBM', 'MS',
    'AXP', 'LIN', 'GS', 'DIS', 'MCD', 'RTX', 'T', 'ACN', 'CAT',
    'PEP', 'VZ', 'BA', 'BLK', 'TMO', 'C', 'SPGI', 'AMGN', 'NEE', 'HON',
    'DHR', 'PFE', 'COF', 'UNP', 'DE', 'TJX', 'LOW', 'COP', 'NKE', 'MMC',
    'ICE', 'SO', 'CME', 'BMY', 'DUK', 'MCO', 'SHW', 'UPS', 'MMM', 'CVS',
    'GD', 'EMR', 'PNC', 'AON', 'ITW', 'CMG', 'USB', 'CL', 'EOG', 'APD',
    'NSC', 'TFC', 'FDX', 'SLB', 'TGT', 'CNC', 'ABT'
}

# Create the mapping
exchange_mapping = {}

for symbol in symbols:
    if symbol in nasdaq_symbols:
        exchange_mapping[symbol] = 'NASDAQ'
    elif symbol in nyse_symbols:
        exchange_mapping[symbol] = 'NYSE'
    else:
        # Default to NYSE for unknown symbols (most traditional companies)
        exchange_mapping[symbol] = 'NYSE'
        print(f"Warning: Unknown symbol {symbol}, defaulting to NYSE")

# Print JavaScript object
print("const STOCK_EXCHANGE_MAPPING = {")
for symbol, exchange in sorted(exchange_mapping.items()):
    print(f'  "{symbol}": "{exchange}",')
print("};")

# Print summary
print(f"\n// Summary:")
print(f"// Total symbols: {len(symbols)}")
print(f"// NASDAQ: {len([s for s in symbols if exchange_mapping[s] == 'NASDAQ'])}")
print(f"// NYSE: {len([s for s in symbols if exchange_mapping[s] == 'NYSE'])}")

# Verify all symbols are accounted for
nasdaq_count = len([s for s in symbols if exchange_mapping[s] == 'NASDAQ'])
nyse_count = len([s for s in symbols if exchange_mapping[s] == 'NYSE'])
print(f"// Verification: {nasdaq_count + nyse_count} == {len(symbols)}")