/**
 * Test file to verify exchange mappings
 * Run with: node test_exchange_mapping.js
 */

const { STOCK_EXCHANGE_MAPPING, getExchangePrefix, createTradingViewSymbol } = require('./stock_exchange_mapping.js');

// Test known mappings
const testCases = [
  // NASDAQ companies
  { symbol: 'AAPL', expected: 'NASDAQ', company: 'Apple Inc.' },
  { symbol: 'MSFT', expected: 'NASDAQ', company: 'Microsoft Corporation' },
  { symbol: 'GOOGL', expected: 'NASDAQ', company: 'Alphabet Inc.' },
  { symbol: 'AMZN', expected: 'NASDAQ', company: 'Amazon.com Inc.' },
  { symbol: 'TSLA', expected: 'NASDAQ', company: 'Tesla Inc.' },
  { symbol: 'META', expected: 'NASDAQ', company: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', expected: 'NASDAQ', company: 'NVIDIA Corporation' },
  { symbol: 'INTC', expected: 'NASDAQ', company: 'Intel Corporation' },
  { symbol: 'TXN', expected: 'NASDAQ', company: 'Texas Instruments Inc.' },
  { symbol: 'PYPL', expected: 'NASDAQ', company: 'PayPal Holdings Inc.' },
  
  // NYSE companies
  { symbol: 'JPM', expected: 'NYSE', company: 'JPMorgan Chase & Co.' },
  { symbol: 'WMT', expected: 'NYSE', company: 'Walmart Inc.' },
  { symbol: 'KO', expected: 'NYSE', company: 'Coca-Cola Co.' },
  { symbol: 'PG', expected: 'NYSE', company: 'Procter & Gamble Co.' },
  { symbol: 'JNJ', expected: 'NYSE', company: 'Johnson & Johnson' },
  { symbol: 'BRK.B', expected: 'NYSE', company: 'Berkshire Hathaway Inc.' },
  { symbol: 'V', expected: 'NYSE', company: 'Visa Inc.' },
  { symbol: 'MA', expected: 'NYSE', company: 'Mastercard Inc.' },
  { symbol: 'XOM', expected: 'NYSE', company: 'Exxon Mobil Corporation' },
  { symbol: 'ABT', expected: 'NYSE', company: 'Abbott Laboratories' },
];

console.log('Testing Stock Exchange Mappings...\n');

let passed = 0;
let failed = 0;

testCases.forEach(test => {
  const actual = getExchangePrefix(test.symbol);
  const tradingViewSymbol = createTradingViewSymbol(test.symbol);
  
  if (actual === test.expected) {
    console.log(`✅ ${test.symbol} (${test.company}): ${actual} → ${tradingViewSymbol}`);
    passed++;
  } else {
    console.log(`❌ ${test.symbol} (${test.company}): Expected ${test.expected}, got ${actual}`);
    failed++;
  }
});

console.log(`\n📊 Test Results:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total mappings: ${Object.keys(STOCK_EXCHANGE_MAPPING).length}`);

// Summary statistics
const exchanges = Object.values(STOCK_EXCHANGE_MAPPING);
const nasdaqCount = exchanges.filter(e => e === 'NASDAQ').length;
const nyseCount = exchanges.filter(e => e === 'NYSE').length;

console.log(`\n📋 Exchange Distribution:`);
console.log(`NASDAQ: ${nasdaqCount} companies`);
console.log(`NYSE: ${nyseCount} companies`);

// Sample TradingView URLs
console.log(`\n🔗 Sample TradingView URLs:`);
console.log(`Apple: https://www.tradingview.com/symbols/${createTradingViewSymbol('AAPL')}/`);
console.log(`JPMorgan: https://www.tradingview.com/symbols/${createTradingViewSymbol('JPM')}/`);
console.log(`Tesla: https://www.tradingview.com/symbols/${createTradingViewSymbol('TSLA')}/`);
console.log(`Berkshire: https://www.tradingview.com/symbols/${createTradingViewSymbol('BRK.B')}/`);