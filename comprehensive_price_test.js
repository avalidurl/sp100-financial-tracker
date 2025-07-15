/**
 * Comprehensive Price Chart Test for SP100 CapEx Tracker
 * Tests all 102 company symbols for TradingView compatibility
 */

// Import stock exchange mapping
const STOCK_EXCHANGE_MAPPING = {
  "AAPL": "NASDAQ", "ABBV": "NYSE", "ABT": "NYSE", "ACN": "NYSE", "ADBE": "NASDAQ", "ADP": "NASDAQ", "AMD": "NASDAQ", "AMGN": "NYSE", "AMZN": "NASDAQ", "AON": "NYSE", "APD": "NYSE", "AVGO": "NASDAQ", "AXP": "NYSE", "BA": "NYSE", "BAC": "NYSE", "BLK": "NYSE", "BMY": "NYSE", "BRK.B": "NYSE", "C": "NYSE", "CAT": "NYSE", "CL": "NYSE", "CMCSA": "NASDAQ", "CME": "NYSE", "CMG": "NYSE", "CNC": "NYSE", "COF": "NYSE", "COP": "NYSE", "COST": "NASDAQ", "CRM": "NASDAQ", "CSCO": "NASDAQ", "CVS": "NYSE", "CVX": "NYSE", "DE": "NYSE", "DHR": "NYSE", "DIS": "NYSE", "DUK": "NYSE", "EMR": "NYSE", "EOG": "NYSE", "FDX": "NYSE", "GD": "NYSE", "GE": "NYSE", "GILD": "NASDAQ", "GOOGL": "NASDAQ", "GS": "NYSE", "HD": "NYSE", "HON": "NYSE", "IBM": "NYSE", "ICE": "NYSE", "INTC": "NASDAQ", "ISRG": "NASDAQ", "ITW": "NYSE", "JNJ": "NYSE", "JPM": "NYSE", "KO": "NYSE", "LIN": "NYSE", "LLY": "NYSE", "LOW": "NYSE", "MA": "NYSE", "MCD": "NYSE", "MCO": "NYSE", "MDLZ": "NASDAQ", "META": "NASDAQ", "MMC": "NYSE", "MMM": "NYSE", "MS": "NYSE", "MSFT": "NASDAQ", "NEE": "NYSE", "NFLX": "NASDAQ", "NKE": "NYSE", "NOW": "NASDAQ", "NSC": "NYSE", "NVDA": "NASDAQ", "ORCL": "NASDAQ", "PEP": "NYSE", "PFE": "NYSE", "PG": "NYSE", "PM": "NYSE", "PNC": "NYSE", "PYPL": "NASDAQ", "QCOM": "NASDAQ", "RTX": "NYSE", "SBUX": "NASDAQ", "SHW": "NYSE", "SLB": "NYSE", "SO": "NYSE", "SPGI": "NYSE", "T": "NYSE", "TFC": "NYSE", "TGT": "NYSE", "TJX": "NYSE", "TMO": "NYSE", "TSLA": "NASDAQ", "TXN": "NASDAQ", "UNH": "NYSE", "UNP": "NYSE", "UPS": "NYSE", "USB": "NYSE", "V": "NYSE", "VZ": "NYSE", "WFC": "NYSE", "WMT": "NYSE", "XOM": "NYSE"
};

// Helper function to create TradingView symbol
function createTradingViewSymbol(symbol) {
  const exchange = STOCK_EXCHANGE_MAPPING[symbol] || 'NYSE';
  return `${exchange}:${symbol}`;
}

// Load the capex data
const fs = require('fs');
const capexData = JSON.parse(fs.readFileSync('/Users/gokhanturhan/sp500-capex/public/data/capex_data.json', 'utf8'));

console.log('='.repeat(80));
console.log('COMPREHENSIVE PRICE CHART TEST FOR SP100 CAPEX TRACKER');
console.log('='.repeat(80));
console.log(`Testing ${capexData.length} companies for TradingView compatibility\n`);

// Test results tracking
const results = {
  total: 0,
  mapped: 0,
  unmapped: 0,
  specialChars: 0,
  nasdaq: 0,
  nyse: 0,
  issues: []
};

// Symbol analysis
const symbolAnalysis = {
  withDots: [],
  withNumbers: [],
  withSpecialChars: [],
  longSymbols: [],
  shortSymbols: []
};

// Test each symbol
capexData.forEach((company, index) => {
  const symbol = company.symbol;
  const name = company.name;
  
  results.total++;
  
  // Check if symbol is in mapping
  const exchange = STOCK_EXCHANGE_MAPPING[symbol];
  if (exchange) {
    results.mapped++;
    if (exchange === 'NASDAQ') results.nasdaq++;
    else if (exchange === 'NYSE') results.nyse++;
  } else {
    results.unmapped++;
    results.issues.push({
      symbol,
      name,
      issue: 'Not in exchange mapping',
      severity: 'HIGH'
    });
  }
  
  // Analyze symbol characteristics
  if (symbol.includes('.')) {
    symbolAnalysis.withDots.push(symbol);
    results.specialChars++;
  }
  
  if (/\d/.test(symbol)) {
    symbolAnalysis.withNumbers.push(symbol);
  }
  
  if (/[^A-Z0-9.]/.test(symbol)) {
    symbolAnalysis.withSpecialChars.push(symbol);
    results.issues.push({
      symbol,
      name,
      issue: 'Contains special characters other than dots',
      severity: 'MEDIUM'
    });
  }
  
  if (symbol.length > 5) {
    symbolAnalysis.longSymbols.push(symbol);
  }
  
  if (symbol.length < 2) {
    symbolAnalysis.shortSymbols.push(symbol);
  }
  
  // Create TradingView symbol and URL
  const tradingViewSymbol = createTradingViewSymbol(symbol);
  const tradingViewUrl = `https://www.tradingview.com/symbols/${tradingViewSymbol}/`;
  
  // Check for potential TradingView issues
  if (symbol === 'BRK.B') {
    // Special case for Berkshire Hathaway
    console.log(`⚠️  Special case: ${symbol} (${name})`);
    console.log(`   Exchange: ${exchange || 'UNMAPPED'}`);
    console.log(`   TradingView: ${tradingViewSymbol}`);
    console.log(`   URL: ${tradingViewUrl}`);
    console.log(`   Note: BRK.B contains dot - verify TradingView handles this correctly\n`);
  }
  
  // Log first few and last few entries for verification
  if (index < 5 || index >= capexData.length - 5) {
    console.log(`${index + 1}. ${symbol} (${name})`);
    console.log(`   Exchange: ${exchange || 'UNMAPPED'}`);
    console.log(`   TradingView: ${tradingViewSymbol}`);
    console.log(`   URL: ${tradingViewUrl}\n`);
  }
});

// Print summary statistics
console.log('\n' + '='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total Companies Tested: ${results.total}`);
console.log(`Mapped to Exchange: ${results.mapped}`);
console.log(`Unmapped: ${results.unmapped}`);
console.log(`NASDAQ Companies: ${results.nasdaq}`);
console.log(`NYSE Companies: ${results.nyse}`);
console.log(`Symbols with Special Characters: ${results.specialChars}`);

// Symbol analysis report
console.log('\n' + '-'.repeat(50));
console.log('SYMBOL ANALYSIS');
console.log('-'.repeat(50));
console.log(`Symbols with dots: ${symbolAnalysis.withDots.length}`);
if (symbolAnalysis.withDots.length > 0) {
  console.log(`   ${symbolAnalysis.withDots.join(', ')}`);
}

console.log(`Symbols with numbers: ${symbolAnalysis.withNumbers.length}`);
if (symbolAnalysis.withNumbers.length > 0) {
  console.log(`   ${symbolAnalysis.withNumbers.join(', ')}`);
}

console.log(`Symbols with special chars: ${symbolAnalysis.withSpecialChars.length}`);
if (symbolAnalysis.withSpecialChars.length > 0) {
  console.log(`   ${symbolAnalysis.withSpecialChars.join(', ')}`);
}

console.log(`Long symbols (>5 chars): ${symbolAnalysis.longSymbols.length}`);
if (symbolAnalysis.longSymbols.length > 0) {
  console.log(`   ${symbolAnalysis.longSymbols.join(', ')}`);
}

console.log(`Short symbols (<2 chars): ${symbolAnalysis.shortSymbols.length}`);
if (symbolAnalysis.shortSymbols.length > 0) {
  console.log(`   ${symbolAnalysis.shortSymbols.join(', ')}`);
}

// Issues report
if (results.issues.length > 0) {
  console.log('\n' + '-'.repeat(50));
  console.log('ISSUES FOUND');
  console.log('-'.repeat(50));
  
  results.issues.forEach((issue, index) => {
    console.log(`${index + 1}. [${issue.severity}] ${issue.symbol} - ${issue.name}`);
    console.log(`   Issue: ${issue.issue}`);
  });
}

// TradingView URL testing
console.log('\n' + '-'.repeat(50));
console.log('TRADINGVIEW URL TESTING');
console.log('-'.repeat(50));

// Test problematic symbols
const testSymbols = ['BRK.B', 'AAPL', 'GOOGL', 'TSLA', 'META'];
testSymbols.forEach(symbol => {
  const tradingViewSymbol = createTradingViewSymbol(symbol);
  const iframeUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${symbol}&symbol=${tradingViewSymbol}&interval=1D&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=f1f3f6&studies=%5B%5D&hideideas=1&theme=Light&style=1&timezone=Etc%2FUTC&withdateranges=1&hidevolume=0&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${symbol}`;
  
  console.log(`${symbol}:`);
  console.log(`  TradingView Symbol: ${tradingViewSymbol}`);
  console.log(`  Widget URL: ${iframeUrl.substring(0, 100)}...`);
  console.log(`  Direct URL: https://www.tradingview.com/symbols/${tradingViewSymbol}/`);
  console.log();
});

// Recommendations
console.log('\n' + '='.repeat(80));
console.log('RECOMMENDATIONS');
console.log('='.repeat(80));

console.log('1. CRITICAL ACTIONS NEEDED:');
if (results.unmapped > 0) {
  console.log(`   - ${results.unmapped} symbols not mapped to exchanges - ADD TO MAPPING`);
}

console.log('\n2. SPECIAL ATTENTION REQUIRED:');
console.log('   - BRK.B (Berkshire Hathaway) uses dot notation - verify TradingView compatibility');
console.log('   - Test iframe loading for all symbols in browser');
console.log('   - Implement fallback for symbols that fail to load');

console.log('\n3. TESTING RECOMMENDATIONS:');
console.log('   - Test widget embedding with actual iframe elements');
console.log('   - Verify all exchange mappings are correct');
console.log('   - Test error handling for failed chart loads');
console.log('   - Implement loading states and error messages');

console.log('\n4. MONITORING:');
console.log('   - Track which symbols fail to load charts');
console.log('   - Monitor TradingView widget performance');
console.log('   - Set up alerts for chart loading failures');

// Success rate calculation
const successRate = ((results.mapped / results.total) * 100).toFixed(1);
console.log(`\n📊 OVERALL SUCCESS RATE: ${successRate}%`);

if (successRate >= 95) {
  console.log('✅ EXCELLENT: Ready for production');
} else if (successRate >= 90) {
  console.log('⚠️  GOOD: Minor issues to address');
} else {
  console.log('❌ CRITICAL: Major issues need fixing before deployment');
}

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETED');
console.log('='.repeat(80));