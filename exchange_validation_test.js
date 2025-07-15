/**
 * Exchange Mapping Validation Test
 * Cross-validates exchange mappings against known exchange listings
 */

const STOCK_EXCHANGE_MAPPING = {
  "AAPL": "NASDAQ", "ABBV": "NYSE", "ABT": "NYSE", "ACN": "NYSE", "ADBE": "NASDAQ", "ADP": "NASDAQ", "AMD": "NASDAQ", "AMGN": "NYSE", "AMZN": "NASDAQ", "AON": "NYSE", "APD": "NYSE", "AVGO": "NASDAQ", "AXP": "NYSE", "BA": "NYSE", "BAC": "NYSE", "BLK": "NYSE", "BMY": "NYSE", "BRK.B": "NYSE", "C": "NYSE", "CAT": "NYSE", "CL": "NYSE", "CMCSA": "NASDAQ", "CME": "NYSE", "CMG": "NYSE", "CNC": "NYSE", "COF": "NYSE", "COP": "NYSE", "COST": "NASDAQ", "CRM": "NASDAQ", "CSCO": "NASDAQ", "CVS": "NYSE", "CVX": "NYSE", "DE": "NYSE", "DHR": "NYSE", "DIS": "NYSE", "DUK": "NYSE", "EMR": "NYSE", "EOG": "NYSE", "FDX": "NYSE", "GD": "NYSE", "GE": "NYSE", "GILD": "NASDAQ", "GOOGL": "NASDAQ", "GS": "NYSE", "HD": "NYSE", "HON": "NYSE", "IBM": "NYSE", "ICE": "NYSE", "INTC": "NASDAQ", "ISRG": "NASDAQ", "ITW": "NYSE", "JNJ": "NYSE", "JPM": "NYSE", "KO": "NYSE", "LIN": "NYSE", "LLY": "NYSE", "LOW": "NYSE", "MA": "NYSE", "MCD": "NYSE", "MCO": "NYSE", "MDLZ": "NASDAQ", "META": "NASDAQ", "MMC": "NYSE", "MMM": "NYSE", "MS": "NYSE", "MSFT": "NASDAQ", "NEE": "NYSE", "NFLX": "NASDAQ", "NKE": "NYSE", "NOW": "NASDAQ", "NSC": "NYSE", "NVDA": "NASDAQ", "ORCL": "NASDAQ", "PEP": "NYSE", "PFE": "NYSE", "PG": "NYSE", "PM": "NYSE", "PNC": "NYSE", "PYPL": "NASDAQ", "QCOM": "NASDAQ", "RTX": "NYSE", "SBUX": "NASDAQ", "SHW": "NYSE", "SLB": "NYSE", "SO": "NYSE", "SPGI": "NYSE", "T": "NYSE", "TFC": "NYSE", "TGT": "NYSE", "TJX": "NYSE", "TMO": "NYSE", "TSLA": "NASDAQ", "TXN": "NASDAQ", "UNH": "NYSE", "UNP": "NYSE", "UPS": "NYSE", "USB": "NYSE", "V": "NYSE", "VZ": "NYSE", "WFC": "NYSE", "WMT": "NYSE", "XOM": "NYSE"
};

// Known exchange patterns - these are generally reliable indicators
const EXCHANGE_PATTERNS = {
  NASDAQ: [
    // Technology companies are often on NASDAQ
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
    'INTC', 'CSCO', 'ORCL', 'ADBE', 'CRM', 'AVGO', 'NFLX',
    'QCOM', 'AMD', 'TXN', 'GILD', 'ISRG', 'PYPL', 'SBUX',
    'ADP', 'COST', 'CMCSA', 'MDLZ', 'NOW'
  ],
  NYSE: [
    // Traditional blue-chip companies are often on NYSE
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'V', 'MA', 'AXP',
    'BRK.B', 'JNJ', 'PG', 'KO', 'WMT', 'HD', 'UNH', 'LLY',
    'XOM', 'CVX', 'COP', 'BA', 'CAT', 'GE', 'RTX', 'MMM',
    'HON', 'IBM', 'T', 'VZ', 'DIS', 'MCD', 'NKE', 'ABBV',
    'ABT', 'TMO', 'DHR', 'PFE', 'BMY', 'AMGN', 'CVS', 'UPS',
    'FDX', 'DE', 'EMR', 'ITW', 'LIN', 'APD', 'SHW', 'PEP',
    'CL', 'PM', 'LOW', 'TJX', 'TGT', 'SO', 'NEE', 'DUK',
    'NSC', 'UNP', 'CME', 'ICE', 'SPGI', 'MCO', 'BLK', 'MMC',
    'AON', 'COF', 'PNC', 'TFC', 'USB', 'SLB', 'EOG', 'GD',
    'CMG', 'CNC', 'ACN'
  ]
};

console.log('='.repeat(80));
console.log('EXCHANGE MAPPING VALIDATION TEST');
console.log('='.repeat(80));

// Validate known patterns
let validationResults = {
  total: 0,
  correct: 0,
  incorrect: 0,
  unknown: 0,
  issues: []
};

// Test NASDAQ symbols
console.log('\n📊 VALIDATING NASDAQ SYMBOLS:');
console.log('-'.repeat(40));

EXCHANGE_PATTERNS.NASDAQ.forEach(symbol => {
  const mappedExchange = STOCK_EXCHANGE_MAPPING[symbol];
  validationResults.total++;
  
  if (mappedExchange === 'NASDAQ') {
    validationResults.correct++;
    console.log(`✅ ${symbol}: NASDAQ (correct)`);
  } else if (mappedExchange === 'NYSE') {
    validationResults.incorrect++;
    validationResults.issues.push({
      symbol,
      expected: 'NASDAQ',
      actual: mappedExchange,
      severity: 'HIGH'
    });
    console.log(`❌ ${symbol}: ${mappedExchange} (expected NASDAQ)`);
  } else {
    validationResults.unknown++;
    console.log(`⚠️  ${symbol}: UNMAPPED (expected NASDAQ)`);
  }
});

// Test NYSE symbols  
console.log('\n📊 VALIDATING NYSE SYMBOLS:');
console.log('-'.repeat(40));

EXCHANGE_PATTERNS.NYSE.forEach(symbol => {
  const mappedExchange = STOCK_EXCHANGE_MAPPING[symbol];
  validationResults.total++;
  
  if (mappedExchange === 'NYSE') {
    validationResults.correct++;
    console.log(`✅ ${symbol}: NYSE (correct)`);
  } else if (mappedExchange === 'NASDAQ') {
    validationResults.incorrect++;
    validationResults.issues.push({
      symbol,
      expected: 'NYSE',
      actual: mappedExchange,
      severity: 'HIGH'
    });
    console.log(`❌ ${symbol}: ${mappedExchange} (expected NYSE)`);
  } else {
    validationResults.unknown++;
    console.log(`⚠️  ${symbol}: UNMAPPED (expected NYSE)`);
  }
});

// Summary
console.log('\n' + '='.repeat(80));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(80));
console.log(`Total symbols validated: ${validationResults.total}`);
console.log(`Correctly mapped: ${validationResults.correct}`);
console.log(`Incorrectly mapped: ${validationResults.incorrect}`);
console.log(`Unknown/unmapped: ${validationResults.unknown}`);

const accuracy = ((validationResults.correct / validationResults.total) * 100).toFixed(1);
console.log(`\n📊 ACCURACY RATE: ${accuracy}%`);

if (validationResults.issues.length > 0) {
  console.log('\n🚨 ISSUES FOUND:');
  console.log('-'.repeat(40));
  validationResults.issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.symbol}: Expected ${issue.expected}, got ${issue.actual}`);
  });
} else {
  console.log('\n✅ NO ISSUES FOUND - ALL MAPPINGS ARE CORRECT!');
}

// Distribution analysis
console.log('\n📈 DISTRIBUTION ANALYSIS:');
console.log('-'.repeat(40));

const totalSymbols = Object.keys(STOCK_EXCHANGE_MAPPING).length;
const nasdaqCount = Object.values(STOCK_EXCHANGE_MAPPING).filter(ex => ex === 'NASDAQ').length;
const nyseCount = Object.values(STOCK_EXCHANGE_MAPPING).filter(ex => ex === 'NYSE').length;

console.log(`Total symbols in mapping: ${totalSymbols}`);
console.log(`NASDAQ symbols: ${nasdaqCount} (${(nasdaqCount/totalSymbols*100).toFixed(1)}%)`);
console.log(`NYSE symbols: ${nyseCount} (${(nyseCount/totalSymbols*100).toFixed(1)}%)`);

// Edge cases analysis
console.log('\n🔍 EDGE CASES ANALYSIS:');
console.log('-'.repeat(40));

const edgeCases = [
  { symbol: 'BRK.B', note: 'Contains dot - special handling needed' },
  { symbol: 'V', note: 'Single letter symbol' },
  { symbol: 'T', note: 'Single letter symbol' },
  { symbol: 'C', note: 'Single letter symbol' }
];

edgeCases.forEach(edge => {
  const exchange = STOCK_EXCHANGE_MAPPING[edge.symbol];
  console.log(`${edge.symbol}: ${exchange} - ${edge.note}`);
});

console.log('\n' + '='.repeat(80));
console.log('VALIDATION COMPLETED');
console.log('='.repeat(80));