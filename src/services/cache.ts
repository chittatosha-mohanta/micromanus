import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds
const CACHE_PREFIX = 'micromanus:cache:';

export interface CachedResponse {
  response: string;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  model: string;
  timestamp: number;
}

/**
 * Generate a deterministic hash for a prompt + model combination.
 * This enables semantic caching — same prompt + model returns cached response.
 */
export function generatePromptHash(prompt: string, model: string): string {
  const normalized = `${model}:${prompt.trim().toLowerCase()}`;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Get a cached response for a given prompt hash.
 */
export async function getCachedResponse(
  promptHash: string
): Promise<CachedResponse | null> {
  try {
    const cached = await redis.get<CachedResponse>(`${CACHE_PREFIX}${promptHash}`);
    return cached;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Store a response in cache with TTL.
 */
export async function setCachedResponse(
  promptHash: string,
  data: CachedResponse,
  ttl: number = CACHE_TTL
): Promise<void> {
  try {
    await redis.set(`${CACHE_PREFIX}${promptHash}`, data, { ex: ttl });
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Invalidate a specific cache entry.
 */
export async function invalidateCache(promptHash: string): Promise<void> {
  try {
    await redis.del(`${CACHE_PREFIX}${promptHash}`);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Rate limiting using Redis sliding window.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 20,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `micromanus:ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  try {
    // Remove expired entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const count = await redis.zcard(key);

    if (count >= maxRequests) {
      const oldestEntry = await redis.zrange(key, 0, 0, { withScores: true });
      const resetAt = oldestEntry.length > 0
        ? Number((oldestEntry[0] as any).score) + windowSeconds * 1000
        : now + windowSeconds * 1000;
      return { allowed: false, remaining: 0, resetAt };
    }

    // Add new request
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await redis.expire(key, windowSeconds);

    return {
      allowed: true,
      remaining: maxRequests - count - 1,
      resetAt: now + windowSeconds * 1000,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open — allow request if Redis is down
    return { allowed: true, remaining: maxRequests, resetAt: now + windowSeconds * 1000 };
  }
}

export { redis };
