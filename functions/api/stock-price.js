import { checkRateLimit } from './rate-limit.js';
import { getCachedPrice, setCachedPrice } from './cache.js';
import { trackQuotaUsage } from './quota-status.js';

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

  // Check cache first
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
    let resultData = null;

    // Try Alpha Vantage first
    if (env.ALPHA_VANTAGE_API_KEY) {
      trackQuotaUsage('alphaVantage');
      const alphaData = await fetchFromAlphaVantage(symbol, env.ALPHA_VANTAGE_API_KEY);
      if (alphaData) {
        resultData = alphaData;
      }
    }

    // Try Finnhub as backup
    if (!resultData && env.FINNHUB_API_KEY) {
      trackQuotaUsage('finnhub');
      const finnhubData = await fetchFromFinnhub(symbol, env.FINNHUB_API_KEY);
      if (finnhubData) {
        resultData = finnhubData;
      }
    }

    // Fallback to free Yahoo Finance (no key needed)
    if (!resultData) {
      const yahooData = await fetchFromYahoo(symbol);
      if (yahooData) {
        resultData = yahooData;
      }
    }

    if (resultData) {
      // Cache the result
      setCachedPrice(symbol, resultData);
      
      return new Response(JSON.stringify(resultData), {
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unable to fetch stock price' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}

async function fetchFromAlphaVantage(symbol, apiKey) {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Check for quota exceeded or other errors
    if (data['Note'] || data['Information'] || data['Error Message']) {
      console.warn(`Alpha Vantage quota/error for ${symbol}:`, data['Note'] || data['Information'] || data['Error Message']);
      return null; // This triggers fallback to Finnhub
    }
    
    const quote = data['Global Quote'];
    
    if (quote && quote['05. price']) {
      return {
        price: parseFloat(quote['05. price']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        source: 'Alpha Vantage',
        symbol: symbol
      };
    }
  } catch (error) {
    console.warn(`Alpha Vantage failed for ${symbol}:`, error);
  }
  return null;
}

async function fetchFromFinnhub(symbol, apiKey) {
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.c) {
      return {
        price: data.c,
        changePercent: data.dp || 0,
        source: 'Finnhub',
        symbol: symbol
      };
    }
  } catch (error) {
    console.warn(`Finnhub failed for ${symbol}:`, error);
  }
  return null;
}

async function fetchFromYahoo(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (result?.meta?.regularMarketPrice) {
      return {
        price: result.meta.regularMarketPrice,
        changePercent: result.meta.regularMarketChangePercent || 0,
        source: 'Yahoo Finance',
        symbol: symbol
      };
    }
  } catch (error) {
    console.warn(`Yahoo Finance failed for ${symbol}:`, error);
  }
  return null;
}
