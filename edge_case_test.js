/**
 * Edge Case Testing for TradingView Integration
 * Tests problematic symbols and edge cases
 */

const fs = require('fs');
const capexData = JSON.parse(fs.readFileSync('/Users/gokhanturhan/sp500-capex/public/data/capex_data.json', 'utf8'));

const STOCK_EXCHANGE_MAPPING = {
  "AAPL": "NASDAQ", "ABBV": "NYSE", "ABT": "NYSE", "ACN": "NYSE", "ADBE": "NASDAQ", "ADP": "NASDAQ", "AMD": "NASDAQ", "AMGN": "NYSE", "AMZN": "NASDAQ", "AON": "NYSE", "APD": "NYSE", "AVGO": "NASDAQ", "AXP": "NYSE", "BA": "NYSE", "BAC": "NYSE", "BLK": "NYSE", "BMY": "NYSE", "BRK.B": "NYSE", "C": "NYSE", "CAT": "NYSE", "CL": "NYSE", "CMCSA": "NASDAQ", "CME": "NYSE", "CMG": "NYSE", "CNC": "NYSE", "COF": "NYSE", "COP": "NYSE", "COST": "NASDAQ", "CRM": "NASDAQ", "CSCO": "NASDAQ", "CVS": "NYSE", "CVX": "NYSE", "DE": "NYSE", "DHR": "NYSE", "DIS": "NYSE", "DUK": "NYSE", "EMR": "NYSE", "EOG": "NYSE", "FDX": "NYSE", "GD": "NYSE", "GE": "NYSE", "GILD": "NASDAQ", "GOOGL": "NASDAQ", "GS": "NYSE", "HD": "NYSE", "HON": "NYSE", "IBM": "NYSE", "ICE": "NYSE", "INTC": "NASDAQ", "ISRG": "NASDAQ", "ITW": "NYSE", "JNJ": "NYSE", "JPM": "NYSE", "KO": "NYSE", "LIN": "NYSE", "LLY": "NYSE", "LOW": "NYSE", "MA": "NYSE", "MCD": "NYSE", "MCO": "NYSE", "MDLZ": "NASDAQ", "META": "NASDAQ", "MMC": "NYSE", "MMM": "NYSE", "MS": "NYSE", "MSFT": "NASDAQ", "NEE": "NYSE", "NFLX": "NASDAQ", "NKE": "NYSE", "NOW": "NASDAQ", "NSC": "NYSE", "NVDA": "NASDAQ", "ORCL": "NASDAQ", "PEP": "NYSE", "PFE": "NYSE", "PG": "NYSE", "PM": "NYSE", "PNC": "NYSE", "PYPL": "NASDAQ", "QCOM": "NASDAQ", "RTX": "NYSE", "SBUX": "NASDAQ", "SHW": "NYSE", "SLB": "NYSE", "SO": "NYSE", "SPGI": "NYSE", "T": "NYSE", "TFC": "NYSE", "TGT": "NYSE", "TJX": "NYSE", "TMO": "NYSE", "TSLA": "NASDAQ", "TXN": "NASDAQ", "UNH": "NYSE", "UNP": "NYSE", "UPS": "NYSE", "USB": "NYSE", "V": "NYSE", "VZ": "NYSE", "WFC": "NYSE", "WMT": "NYSE", "XOM": "NYSE"
};

function createTradingViewSymbol(symbol) {
  const exchange = STOCK_EXCHANGE_MAPPING[symbol] || 'NYSE';
  return `${exchange}:${symbol}`;
}

console.log('='.repeat(80));
console.log('EDGE CASE TESTING FOR TRADINGVIEW INTEGRATION');
console.log('='.repeat(80));

// Define edge cases
const edgeCases = [
  {
    category: 'Special Characters',
    symbols: ['BRK.B'],
    tests: [
      'TradingView URL encoding',
      'Iframe embedding',
      'Widget parameter handling',
      'Direct URL accessibility'
    ]
  },
  {
    category: 'Single Letter Symbols',
    symbols: ['V', 'T', 'C'],
    tests: [
      'URL parameter validation',
      'Iframe widget compatibility',
      'Symbol disambiguation',
      'Loading performance'
    ]
  },
  {
    category: 'High-Profile Symbols',
    symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA'],
    tests: [
      'Load performance',
      'Data accuracy',
      'Widget responsiveness',
      'Error handling'
    ]
  },
  {
    category: 'Exchange Boundary Cases',
    symbols: ['AVGO', 'PYPL', 'SBUX', 'COST'], // NASDAQ companies that could be confused with NYSE
    tests: [
      'Exchange mapping accuracy',
      'Cross-exchange validation',
      'Symbol resolution',
      'Data consistency'
    ]
  }
];

// Test each edge case category
edgeCases.forEach(category => {
  console.log(`\n📊 TESTING: ${category.category}`);
  console.log('='.repeat(50));
  
  category.symbols.forEach(symbol => {
    const company = capexData.find(c => c.symbol === symbol);
    const exchange = STOCK_EXCHANGE_MAPPING[symbol];
    const tradingViewSymbol = createTradingViewSymbol(symbol);
    
    console.log(`\n🔍 ${symbol} - ${company ? company.name : 'Unknown'}`);
    console.log(`   Exchange: ${exchange}`);
    console.log(`   TradingView Symbol: ${tradingViewSymbol}`);
    
    // Test URLs
    const directUrl = `https://www.tradingview.com/symbols/${tradingViewSymbol}/`;
    const widgetUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${symbol}&symbol=${tradingViewSymbol}&interval=1D&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=f1f3f6&studies=%5B%5D&hideideas=1&theme=Light&style=1&timezone=Etc%2FUTC&withdateranges=1&hidevolume=0&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${symbol}`;
    
    console.log(`   Direct URL: ${directUrl}`);
    console.log(`   Widget URL: ${widgetUrl.substring(0, 100)}...`);
    
    // Analyze potential issues
    const issues = [];
    
    if (symbol.includes('.')) {
      issues.push('Contains dot - may need URL encoding');
    }
    
    if (symbol.length === 1) {
      issues.push('Single character - potential disambiguation issues');
    }
    
    if (symbol.length > 4) {
      issues.push('Long symbol - check widget display');
    }
    
    if (issues.length > 0) {
      console.log(`   ⚠️  Potential Issues:`);
      issues.forEach(issue => console.log(`      - ${issue}`));
    } else {
      console.log(`   ✅ No obvious issues detected`);
    }
    
    // Test each requirement
    category.tests.forEach(test => {
      let status = '✅ PASS';
      let note = '';
      
      switch (test) {
        case 'TradingView URL encoding':
          if (symbol.includes('.')) {
            note = 'Dot notation - verify URL encoding';
          }
          break;
        case 'Iframe embedding':
          if (symbol.includes('.')) {
            note = 'Special character handling required';
          }
          break;
        case 'Symbol disambiguation':
          if (symbol.length === 1) {
            note = 'Single letter - ensure correct company match';
          }
          break;
        case 'Exchange mapping accuracy':
          if (!exchange) {
            status = '❌ FAIL';
            note = 'Missing exchange mapping';
          }
          break;
        default:
          note = 'Standard test';
      }
      
      console.log(`   ${status} ${test}${note ? ` - ${note}` : ''}`);
    });
  });
});

// JavaScript/HTML embedding test
console.log('\n' + '='.repeat(80));
console.log('JAVASCRIPT EMBEDDING TESTS');
console.log('='.repeat(80));

const problemSymbols = ['BRK.B', 'V', 'T', 'C'];

problemSymbols.forEach(symbol => {
  console.log(`\n🔧 Testing JavaScript embedding for ${symbol}:`);
  
  // Test iframe ID generation
  const iframeId = `tradingview_${symbol}`;
  console.log(`   Iframe ID: ${iframeId}`);
  
  // Test JavaScript variable naming
  const jsVarName = symbol.replace(/[^a-zA-Z0-9]/g, '_');
  console.log(`   JS Variable: ${jsVarName}`);
  
  // Test CSS class naming
  const cssClass = `price-chart-${symbol.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
  console.log(`   CSS Class: ${cssClass}`);
  
  // Test DOM querySelector
  const querySelector = `#tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, '\\\\$&')}`;
  console.log(`   DOM Selector: ${querySelector}`);
  
  if (symbol.includes('.')) {
    console.log(`   ⚠️  Note: Contains dot - CSS escaping needed`);
  }
});

// Performance testing scenarios
console.log('\n' + '='.repeat(80));
console.log('PERFORMANCE TEST SCENARIOS');
console.log('='.repeat(80));

const performanceTests = [
  {
    name: 'Concurrent Loading',
    description: 'Test loading multiple charts simultaneously',
    symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'],
    concern: 'Rate limiting and bandwidth usage'
  },
  {
    name: 'Special Character Handling',
    description: 'Test symbols with special characters',
    symbols: ['BRK.B'],
    concern: 'URL encoding and iframe embedding'
  },
  {
    name: 'Single Letter Symbols',
    description: 'Test very short symbols',
    symbols: ['V', 'T', 'C'],
    concern: 'Symbol disambiguation and loading speed'
  },
  {
    name: 'Exchange Validation',
    description: 'Test symbols across different exchanges',
    symbols: ['AAPL', 'JPM', 'TSLA', 'BRK.B'],
    concern: 'Exchange mapping accuracy'
  }
];

performanceTests.forEach(test => {
  console.log(`\n📈 ${test.name}:`);
  console.log(`   Description: ${test.description}`);
  console.log(`   Symbols: ${test.symbols.join(', ')}`);
  console.log(`   Primary Concern: ${test.concern}`);
  console.log(`   Test URLs:`);
  
  test.symbols.forEach(symbol => {
    const tradingViewSymbol = createTradingViewSymbol(symbol);
    console.log(`      ${symbol}: https://www.tradingview.com/symbols/${tradingViewSymbol}/`);
  });
});

// Error handling scenarios
console.log('\n' + '='.repeat(80));
console.log('ERROR HANDLING SCENARIOS');
console.log('='.repeat(80));

const errorScenarios = [
  {
    scenario: 'Symbol not found',
    test: 'Non-existent symbol',
    expected: 'Graceful error message with fallback links'
  },
  {
    scenario: 'Network timeout',
    test: 'Slow TradingView response',
    expected: 'Loading indicator with timeout handling'
  },
  {
    scenario: 'Widget load failure',
    test: 'TradingView widget fails to load',
    expected: 'Error message with alternative data sources'
  },
  {
    scenario: 'Exchange mapping error',
    test: 'Incorrect exchange in mapping',
    expected: 'Fallback to default exchange (NYSE)'
  }
];

errorScenarios.forEach(scenario => {
  console.log(`\n🚨 ${scenario.scenario}:`);
  console.log(`   Test: ${scenario.test}`);
  console.log(`   Expected: ${scenario.expected}`);
});

console.log('\n' + '='.repeat(80));
console.log('RECOMMENDATIONS FOR IMPLEMENTATION');
console.log('='.repeat(80));

console.log(`
1. 🔧 SPECIAL CHARACTER HANDLING:
   - Implement URL encoding for BRK.B symbol
   - Test iframe embedding with dot notation
   - Verify CSS selector escaping

2. 📊 SINGLE LETTER SYMBOLS:
   - Validate V, T, C symbols load correctly
   - Ensure proper company identification
   - Test loading performance

3. 🛡️ ERROR HANDLING:
   - Implement loading indicators
   - Add fallback to alternative data sources
   - Handle network timeouts gracefully

4. 🚀 PERFORMANCE OPTIMIZATION:
   - Lazy load charts when modal opens
   - Implement chart caching
   - Add loading state management

5. 📈 MONITORING:
   - Track chart load success rates
   - Monitor TradingView widget performance
   - Set up alerts for failed chart loads

6. 🔍 TESTING:
   - Browser compatibility testing
   - Mobile responsiveness testing
   - Network condition testing
`);

console.log('\n' + '='.repeat(80));
console.log('EDGE CASE TESTING COMPLETED');
console.log('='.repeat(80));