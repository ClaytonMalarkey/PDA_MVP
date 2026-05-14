/**
 * Rate Limiting Middleware — Anti-abuse protection
 * In-memory rate limiter (use Redis in production for distributed)
 */
const buckets = new Map(); // key -> { count, resetAt }

function rateLimit(opts = {}) {
  const windowMs = opts.windowMs || 60000; // 1 minute
  const max = opts.max || 100; // max requests per window
  const message = opts.message || 'Too many requests, slow down';

  return (req, res, next) => {
    const key = (req.userId || req.ip) + ':' + (opts.prefix || 'global');
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count++;

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bucket.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > max) {
      return res.status(429).json({ error: message, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) });
    }
    next();
  };
}

// Cleanup stale buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 300000);

// Preset limiters
const apiLimiter = rateLimit({ windowMs: 60000, max: 120, prefix: 'api' });
const authLimiter = rateLimit({ windowMs: 900000, max: 15, prefix: 'auth', message: 'Too many login attempts' });
const chatLimiter = rateLimit({ windowMs: 10000, max: 5, prefix: 'chat', message: 'Sending messages too fast' });
const purchaseLimiter = rateLimit({ windowMs: 60000, max: 10, prefix: 'purchase', message: 'Too many purchase attempts' });

module.exports = { rateLimit, apiLimiter, authLimiter, chatLimiter, purchaseLimiter };
