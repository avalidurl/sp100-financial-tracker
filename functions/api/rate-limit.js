// Simple rate limiting for API endpoints
const RATE_LIMIT = 60; // requests per minute
const WINDOW = 60 * 1000; // 1 minute in milliseconds

const requestCounts = new Map();

export function checkRateLimit(request) {
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const windowStart = now - WINDOW;
  
  // Clean old entries
  for (const [ip, requests] of requestCounts.entries()) {
    const filteredRequests = requests.filter(time => time > windowStart);
    if (filteredRequests.length === 0) {
      requestCounts.delete(ip);
    } else {
      requestCounts.set(ip, filteredRequests);
    }
  }
  
  // Check current IP
  const clientRequests = requestCounts.get(clientIP) || [];
  const recentRequests = clientRequests.filter(time => time > windowStart);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now);
  requestCounts.set(clientIP, recentRequests);
  
  return true; // OK to proceed
}
