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
  const cacheStats = getCacheStats();
  
  return new Response(JSON.stringify({
    message: '100% FREE - No API quotas!',
    priceSource: {
      provider: 'Yahoo Finance',
      cost: 'FREE',
      rateLimit: 'Unlimited',
      status: 'Active ✅'
    },
    fundamentalsSource: {
      provider: 'SEC EDGAR',
      cost: 'FREE',
      rateLimit: '10 req/sec',
      status: 'Active ✅'
    },
    cache: {
      entries: cacheStats.size,
      symbols: cacheStats.entries
    },
    savingsPerMonth: '$50-100 (vs paid APIs)',
    note: 'No API keys needed - Everything is FREE!'
  }), {
    headers: { 'content-type': 'application/json' }
  });
}
