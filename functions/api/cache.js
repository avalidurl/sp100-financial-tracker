// Simple in-memory cache for stock prices
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedPrice(symbol) {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function setCachedPrice(symbol, data) {
  cache.set(symbol, {
    data,
    timestamp: Date.now()
  });
  
  // Cleanup old entries
  if (cache.size > 200) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys())
  };
}
