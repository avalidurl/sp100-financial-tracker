import { getCacheStats } from './cache.js';

// Simple quota tracking (resets daily)
const quotaTracker = new Map();
const DAILY_RESET = 24 * 60 * 60 * 1000; // 24 hours

function getQuotaStats() {
  const now = Date.now();
  const today = Math.floor(now / DAILY_RESET);
  
  // Clean old entries
  for (const [key, data] of quotaTracker.entries()) {
    if (data.day !== today) {
      quotaTracker.delete(key);
    }
  }
  
  return {
    alphaVantage: quotaTracker.get(`alpha_${today}`)?.count || 0,
    finnhub: quotaTracker.get(`finnhub_${today}`)?.count || 0,
    day: today
  };
}

export function trackQuotaUsage(provider) {
  const now = Date.now();
  const today = Math.floor(now / DAILY_RESET);
  const key = `${provider}_${today}`;
  
  const current = quotaTracker.get(key) || { count: 0, day: today };
  current.count++;
  quotaTracker.set(key, current);
}

export async function onRequest({ request, env }) {
  const quotaStats = getQuotaStats();
  const cacheStats = getCacheStats();
  
  return new Response(JSON.stringify({
    quota: {
      alphaVantage: {
        used: quotaStats.alphaVantage,
        limit: 25,
        remaining: Math.max(0, 25 - quotaStats.alphaVantage),
        status: quotaStats.alphaVantage >= 25 ? 'EXCEEDED' : 'OK'
      },
      finnhub: {
        used: quotaStats.finnhub,
        limit: 60, // per minute, but tracking daily for comparison
        status: 'OK' // Finnhub has generous limits
      }
    },
    cache: {
      entries: cacheStats.size,
      symbols: cacheStats.entries
    },
    fallbackChain: [
      'Alpha Vantage (25/day)',
      'Finnhub (60/minute)', 
      'Yahoo Finance (unlimited)',
      'Demo Data (always available)'
    ]
  }), {
    headers: { 'content-type': 'application/json' }
  });
}
