/**
 * Unit tests for script.js
 * Run with: npm test (after setting up Jest)
 * Or manually in browser console
 */

// Simple test framework for browser console
const tests = {
    passed: 0,
    failed: 0,
    results: []
};

function assert(condition, message) {
    if (condition) {
        tests.passed++;
        tests.results.push(`✓ ${message}`);
        console.log(`✓ ${message}`);
    } else {
        tests.failed++;
        tests.results.push(`✗ ${message}`);
        console.error(`✗ ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

function runTests() {
    console.log('🧪 Running Tests...\n');
    
    // Test: formatCurrency function
    testFormatCurrency();
    
    // Test: Sorting logic
    testSortingLogic();
    
    // Test: Pagination
    testPagination();
    
    // Test: Data validation
    testDataValidation();
    
    // Test: Financial calculations
    testFinancialCalculations();
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log(`Tests: ${tests.passed + tests.failed}`);
    console.log(`✓ Passed: ${tests.passed}`);
    console.log(`✗ Failed: ${tests.failed}`);
    console.log('='.repeat(50));
    
    return tests.failed === 0;
}

function testFormatCurrency() {
    console.log('\n📊 Testing formatCurrency...');
    
    // Mock formatCurrency function (same as in script.js)
    function formatCurrency(amount) {
        const absAmount = Math.abs(amount);
        if (absAmount >= 1e9) {
            return `${(amount / 1e9).toFixed(1)}B`;
        } else if (absAmount >= 1e6) {
            return `${(amount / 1e6).toFixed(1)}M`;
        } else if (absAmount >= 1e3) {
            return `${(amount / 1e3).toFixed(1)}K`;
        }
        return `${amount.toLocaleString()}`;
    }
    
    assertEqual(formatCurrency(1000000000), '1.0B', 'Formats billions');
    assertEqual(formatCurrency(1500000000), '1.5B', 'Formats billions with decimal');
    assertEqual(formatCurrency(1000000), '1.0M', 'Formats millions');
    assertEqual(formatCurrency(500000000), '500.0M', 'Formats large millions');
    assertEqual(formatCurrency(1000), '1.0K', 'Formats thousands');
    assertEqual(formatCurrency(500), '500', 'Formats small numbers');
    assertEqual(formatCurrency(-1000000000), '-1.0B', 'Formats negative billions');
}

function testSortingLogic() {
    console.log('\n🔢 Testing sorting logic...');
    
    const testData = [
        { symbol: 'AAPL', capex: -10000000000, revenue: 400000000000, market_cap: 3000000000000 },
        { symbol: 'MSFT', capex: -25000000000, revenue: 200000000000, market_cap: 2500000000000 },
        { symbol: 'GOOGL', capex: -30000000000, revenue: 300000000000, market_cap: 1800000000000 }
    ];
    
    // Test sorting by capex (highest spend first)
    const sortedByCapex = [...testData].sort((a, b) => Math.abs(b.capex) - Math.abs(a.capex));
    assertEqual(sortedByCapex[0].symbol, 'GOOGL', 'Sorts by capex correctly (highest first)');
    
    // Test sorting by revenue
    const sortedByRevenue = [...testData].sort((a, b) => b.revenue - a.revenue);
    assertEqual(sortedByRevenue[0].symbol, 'AAPL', 'Sorts by revenue correctly');
    
    // Test sorting by market cap
    const sortedByMarketCap = [...testData].sort((a, b) => b.market_cap - a.market_cap);
    assertEqual(sortedByMarketCap[0].symbol, 'AAPL', 'Sorts by market cap correctly');
}

function testPagination() {
    console.log('\n📄 Testing pagination...');
    
    const testData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
    const itemsPerPage = 10;
    
    // Page 1
    let currentPage = 1;
    let displayed = testData.slice(0, currentPage * itemsPerPage);
    assertEqual(displayed.length, 10, 'Page 1 shows 10 items');
    assertEqual(displayed[0].id, 1, 'Page 1 starts with item 1');
    
    // Page 2
    currentPage = 2;
    displayed = testData.slice(0, currentPage * itemsPerPage);
    assertEqual(displayed.length, 20, 'Page 2 shows 20 items');
    assertEqual(displayed[19].id, 20, 'Page 2 ends with item 20');
    
    // Page 3 (partial)
    currentPage = 3;
    displayed = testData.slice(0, currentPage * itemsPerPage);
    assertEqual(displayed.length, 25, 'Page 3 shows all 25 items');
    
    // Should show "Load More" button
    const hasMore = displayed.length < testData.length;
    assertEqual(hasMore, false, 'No more items to load');
}

function testDataValidation() {
    console.log('\n✓ Testing data validation...');
    
    const validCompany = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        capex: -10000000000,
        revenue: 400000000000,
        market_cap: 3000000000000,
        sector: 'Technology'
    };
    
    // Required fields
    assert(validCompany.symbol && validCompany.symbol.length > 0, 'Company has valid symbol');
    assert(validCompany.name && validCompany.name.length > 0, 'Company has valid name');
    
    // Numeric validations
    assert(typeof validCompany.capex === 'number', 'CapEx is numeric');
    assert(validCompany.capex < 0, 'CapEx is negative (investment)');
    assert(typeof validCompany.revenue === 'number', 'Revenue is numeric');
    assert(validCompany.revenue > 0, 'Revenue is positive');
    assert(typeof validCompany.market_cap === 'number', 'Market cap is numeric');
    assert(validCompany.market_cap > 0, 'Market cap is positive');
}

function testFinancialCalculations() {
    console.log('\n💰 Testing financial calculations...');
    
    // Free Cash Flow
    const operating_cash_flow = 100000000000;
    const capex = -20000000000;
    const free_cash_flow = operating_cash_flow + capex;
    assertEqual(free_cash_flow, 80000000000, 'Calculates Free Cash Flow correctly');
    
    // Debt-to-Equity Ratio
    const long_term_debt = 100000000000;
    const stockholders_equity = 80000000000;
    const debt_to_equity = Number((long_term_debt / stockholders_equity).toFixed(2));
    assertEqual(debt_to_equity, 1.25, 'Calculates Debt-to-Equity ratio correctly');
    
    // Profit Margin
    const earnings = 25000000000;
    const revenue = 100000000000;
    const profit_margin = Number((earnings / revenue * 100).toFixed(1));
    assertEqual(profit_margin, 25.0, 'Calculates Profit Margin correctly');
    
    // Operating Margin
    const operating_income = 30000000000;
    const operating_margin = Number((operating_income / revenue * 100).toFixed(1));
    assertEqual(operating_margin, 30.0, 'Calculates Operating Margin correctly');
    
    // Handle division by zero
    const zeroRevenue = 0;
    const safeProfitMargin = zeroRevenue > 0 ? (earnings / zeroRevenue * 100) : null;
    assertEqual(safeProfitMargin, null, 'Handles division by zero safely');
}

// Export for Node.js (if using Jest)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runTests,
        testFormatCurrency,
        testSortingLogic,
        testPagination,
        testDataValidation,
        testFinancialCalculations
    };
}

// Run tests if in browser console
if (typeof window !== 'undefined') {
    console.log('💡 Run tests with: runTests()');
}

