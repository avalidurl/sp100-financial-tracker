#!/usr/bin/env node

/**
 * Script to fetch earnings data for all companies
 * 
 * RECOMMENDED API: Financial Modeling Prep (FMP)
 * - Free tier: 250 API calls per day (enough for most updates)
 * - Get free key at: https://site.financialmodelingprep.com/developer/docs
 * 
 * Usage:
 *   export FMP_API_KEY="your_key_here"
 *   node fetch-earnings.js
 * 
 * For large datasets, you can run this script over multiple days.
 * The script tracks which companies already have earnings and skips them.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// Load .env file if it exists
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#') && line.includes('=')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=');
                process.env[key] = value;
            }
        });
    }
}

loadEnv();

// Load existing data
const capexData = JSON.parse(fs.readFileSync('./data/capex_data.json', 'utf8'));

// API Keys (loaded from .env file)
const FMP_API_KEY = process.env.FMP_API_KEY || '';
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';

// Track API usage
let apiCallCount = 0;
const MAX_CALLS_PER_MINUTE = 10; // Rate limiting
const companiesProcessed = [];
const companiesFailed = [];

/**
 * Make HTTPS GET request
 */
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Failed to parse JSON response'));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch earnings from Financial Modeling Prep (RECOMMENDED - Most reliable)
 * Free tier: 250 calls/day
 * https://site.financialmodelingprep.com/developer/docs
 */
async function fetchEarningsFromFMP(symbol) {
    if (!FMP_API_KEY) {
        throw new Error('FMP_API_KEY not set');
    }
    
    const url = `https://financialmodelingprep.com/api/v3/income-statement/${symbol}?limit=1&apikey=${FMP_API_KEY}`;
    const data = await httpsGet(url);
    
    if (data && data[0] && data[0].netIncome) {
        apiCallCount++;
        return {
            earnings: data[0].netIncome,
            year: new Date(data[0].date).getFullYear(),
            source: 'FMP'
        };
    }
    return null;
}

/**
 * Fetch earnings from Alpha Vantage
 * Free tier: 25 calls/day
 */
async function fetchEarningsFromAlphaVantage(symbol) {
    if (!ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not set');
    }
    
    const url = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const data = await httpsGet(url);
    
    if (data && data.annualReports && data.annualReports[0]) {
        apiCallCount++;
        const report = data.annualReports[0];
        return {
            earnings: parseInt(report.netIncome),
            year: new Date(report.fiscalDateEnding).getFullYear(),
            source: 'AlphaVantage'
        };
    }
    return null;
}

/**
 * Fetch earnings from Yahoo Finance (Free, no API key needed)
 * Note: This is less reliable and may require adjustments
 */
async function fetchEarningsFromYahoo(symbol) {
    try {
        const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=defaultKeyStatistics,financialData,incomeStatementHistory`;
        const data = await httpsGet(url);
        
        if (data?.quoteSummary?.result?.[0]?.incomeStatementHistory?.incomeStatementHistory?.[0]) {
            const statement = data.quoteSummary.result[0].incomeStatementHistory.incomeStatementHistory[0];
            if (statement.netIncome?.raw) {
                apiCallCount++;
                return {
                    earnings: statement.netIncome.raw,
                    year: new Date(statement.endDate?.raw * 1000).getFullYear(),
                    source: 'Yahoo'
                };
            }
        }
    } catch (error) {
        // Yahoo Finance often blocks automated requests
        console.log(`  Yahoo Finance blocked/failed for ${symbol}`);
    }
    return null;
}

/**
 * Fetch earnings with fallback strategy
 */
async function fetchEarnings(symbol) {
    console.log(`Fetching earnings for ${symbol}...`);
    
    // Try FMP first (most reliable)
    if (FMP_API_KEY) {
        try {
            const result = await fetchEarningsFromFMP(symbol);
            if (result) {
                console.log(`  ✓ Found from FMP: $${(result.earnings / 1e9).toFixed(2)}B`);
                return result.earnings;
            }
        } catch (error) {
            console.log(`  FMP failed: ${error.message}`);
        }
        await sleep(200); // Rate limiting
    }
    
    // Try Alpha Vantage
    if (ALPHA_VANTAGE_API_KEY) {
        try {
            const result = await fetchEarningsFromAlphaVantage(symbol);
            if (result) {
                console.log(`  ✓ Found from Alpha Vantage: $${(result.earnings / 1e9).toFixed(2)}B`);
                return result.earnings;
            }
        } catch (error) {
            console.log(`  Alpha Vantage failed: ${error.message}`);
        }
        await sleep(1000); // Alpha Vantage requires slower rate
    }
    
    // Try Yahoo Finance (free but unreliable)
    try {
        const result = await fetchEarningsFromYahoo(symbol);
        if (result) {
            console.log(`  ✓ Found from Yahoo: $${(result.earnings / 1e9).toFixed(2)}B`);
            return result.earnings;
        }
    } catch (error) {
        console.log(`  Yahoo failed: ${error.message}`);
    }
    
    return null;
}

/**
 * Main function
 */
async function main() {
    console.log('='.repeat(60));
    console.log('EARNINGS DATA FETCHER');
    console.log('='.repeat(60));
    console.log(`Total companies to process: ${capexData.length}`);
    console.log('');
    
    if (!FMP_API_KEY && !ALPHA_VANTAGE_API_KEY) {
        console.error('ERROR: No API keys configured!');
        console.error('Please set at least one of:');
        console.error('  - FMP_API_KEY (Financial Modeling Prep - RECOMMENDED)');
        console.error('  - ALPHA_VANTAGE_API_KEY');
        console.error('');
        console.error('Get free API keys from:');
        console.error('  - https://site.financialmodelingprep.com/developer/docs (250 calls/day)');
        console.error('  - https://www.alphavantage.co/support/#api-key (25 calls/day)');
        process.exit(1);
    }
    
    // Process each company
    for (let i = 0; i < capexData.length; i++) {
        const company = capexData[i];
        
        console.log(`\n[${i + 1}/${capexData.length}] ${company.name} (${company.symbol})`);
        
        // Skip if already has earnings
        if (company.earnings) {
            console.log(`  ⊘ Already has earnings data: $${(company.earnings / 1e9).toFixed(2)}B`);
            companiesProcessed.push(company.symbol);
            continue;
        }
        
        try {
            const earnings = await fetchEarnings(company.symbol);
            
            if (earnings) {
                company.earnings = earnings;
                companiesProcessed.push(company.symbol);
            } else {
                console.log(`  ✗ No earnings data found`);
                companiesFailed.push(company.symbol);
            }
            
            // Rate limiting: pause every 10 requests
            if ((i + 1) % 10 === 0) {
                console.log('\n⏸ Pausing for rate limiting...');
                await sleep(2000);
            }
            
        } catch (error) {
            console.error(`  ✗ Error: ${error.message}`);
            companiesFailed.push(company.symbol);
        }
    }
    
    // Save updated data
    console.log('\n' + '='.repeat(60));
    console.log('SAVING DATA...');
    console.log('='.repeat(60));
    
    fs.writeFileSync('./data/capex_data.json', JSON.stringify(capexData, null, 2));
    fs.writeFileSync('./public/data/capex_data.json', JSON.stringify(capexData, null, 2));
    
    console.log('✓ Saved to ./data/capex_data.json');
    console.log('✓ Saved to ./public/data/capex_data.json');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total companies: ${capexData.length}`);
    console.log(`✓ Processed: ${companiesProcessed.length}`);
    console.log(`✗ Failed: ${companiesFailed.length}`);
    console.log(`API calls made: ${apiCallCount}`);
    
    if (companiesFailed.length > 0) {
        console.log('\nFailed companies:');
        companiesFailed.forEach(symbol => console.log(`  - ${symbol}`));
    }
    
    console.log('\nDone! ✨');
}

// Run the script
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

