import { checkRateLimit } from './rate-limit.js';
import { getCachedPrice, setCachedPrice } from './cache.js';

/**
 * Stock Price API - 100% FREE using Yahoo Finance
 * No API keys needed! Simplified from previous multi-API approach.
 */
export async function onRequest({ request, env }) {
  // Rate limiting
  if (!checkRateLimit(request)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'content-type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol');
  
  if (!symbol) {
    return new Response(JSON.stringify({ error: 'Symbol parameter required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  // Check cache first (reduces API calls)
  const cachedData = getCachedPrice(symbol);
  if (cachedData) {
    return new Response(JSON.stringify({
      ...cachedData,
      cached: true
    }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  try {
    // Use Yahoo Finance directly (FREE, reliable, no API key needed)
    const yahooData = await fetchFromYahoo(symbol);
    
    if (yahooData) {
      // Cache the result
      setCachedPrice(symbol, yahooData);
      
      return new Response(JSON.stringify(yahooData), {
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Unable to fetch stock price from Yahoo Finance' 
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: String(error) 
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}

/**
 * Fetch stock price from Yahoo Finance
 * FREE - No API key required
 */
async function fetchFromYahoo(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; sp500-capex/1.0)'
      }
    });
    
    if (!response.ok) {
      console.warn(`Yahoo Finance returned ${response.status} for ${symbol}`);
      return null;
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (result?.meta?.regularMarketPrice) {
      return {
        price: result.meta.regularMarketPrice,
        changePercent: result.meta.regularMarketChangePercent || 0,
        source: 'Yahoo Finance (FREE)',
        symbol: symbol,
        marketCap: result.meta.marketCap || null,
        volume: result.meta.regularMarketVolume || null,
        dayHigh: result.meta.regularMarketDayHigh || null,
        dayLow: result.meta.regularMarketDayLow || null
      };
    }
    
    console.warn(`Invalid data structure from Yahoo Finance for ${symbol}`);
    return null;
  } catch (error) {
    console.warn(`Yahoo Finance failed for ${symbol}:`, error);
    return null;
  }
}
