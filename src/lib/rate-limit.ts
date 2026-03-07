import "server-only";

/**
 * Redis-based rate limiter (with fallback to in-memory)
 * 
 * Primary: Upstash Redis for distributed rate limiting
 * Fallback: In-memory store if Redis unavailable
 * 
 * OTP Rate Limiting:
 * - 4 OTPs per email (user) per 24 hours
 * - 6 OTPs per IP address per 24 hours (across all users)
 * - Redis enables this across all instances
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Track if Redis is active (checked on first use)
let redisActive: boolean | null = null;

/**
 * Check if Redis is available
 */
function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Redis-based rate limit check
 */
async function checkRateLimitRedis(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      return true; // Fallback if not configured
    }

    const key = `rate:${identifier}`;
    
    const response = await fetch(`${url}/incr/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Redis rate limit check failed:", response.statusText);
      return true; // Fallback: allow on error
    }

    const data = (await response.json()) as { result?: number };
    const count = data.result || 0;

    // If this is the first request, set expiration
    if (count === 1) {
      await fetch(`${url}/expire/${key}/${windowSeconds}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {}); // Non-critical
    }

    redisActive = true;
    return count <= maxRequests;
  } catch (error) {
    console.error("Redis connection error, falling back to in-memory:", error);
    redisActive = false;
    return checkRateLimitInMemory(identifier, maxRequests, windowSeconds * 1000);
  }
}

/**
 * In-memory fallback rate limiter
 * WARNING: Does not replicate across instances, resets on restart
 */
function checkRateLimitInMemory(
  identifier: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    // Create new entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

// Cleanup old in-memory entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 600000);

/**
 * Generic rate limit check (uses Redis if available, falls back to in-memory)
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  if (isRedisConfigured()) {
    return checkRateLimitRedis(identifier, maxRequests, Math.ceil(windowMs / 1000));
  }
  return checkRateLimitInMemory(identifier, maxRequests, windowMs);
}

/**
 * OTP request rate limit
 *
 * Rules:
 * - 4 OTPs per email (user) per 24 hours
 * - 6 OTPs per IP address per 24 hours (across all users from that IP)
 * - Redis for distributed enforcement
 *
 * @param email - User email
 * @param ipAddress - Client IP address
 * @returns Object with `allowed` flag and optional `limitType` ("user" | "ip")
 */
export async function checkOTPRateLimit(
  email: string,
  ipAddress: string
): Promise<{ allowed: boolean; limitType?: "user" | "ip" }> {
  // User-based limit: 4 OTPs per email per 24 hours
  const userIdentifier = `otp:user:${email}`;
  const userAllowed = isRedisConfigured()
    ? await checkRateLimitRedis(userIdentifier, 4, 24 * 60 * 60)
    : checkRateLimitInMemory(userIdentifier, 4, 24 * 60 * 60 * 1000);

  if (!userAllowed) {
    return { allowed: false, limitType: "user" };
  }

  // IP-based limit: 6 OTPs per IP per 24 hours (across all users)
  const ipIdentifier = `otp:ip:${ipAddress}`;
  const ipAllowed = isRedisConfigured()
    ? await checkRateLimitRedis(ipIdentifier, 6, 24 * 60 * 60)
    : checkRateLimitInMemory(ipIdentifier, 6, 24 * 60 * 60 * 1000);

  if (!ipAllowed) {
    return { allowed: false, limitType: "ip" };
  }

  return { allowed: true };
}

/**
 * Booking rate limit: 10 requests per minute per IP
 */
export async function checkBookingRateLimit(identifier: string): Promise<boolean> {
  if (isRedisConfigured()) {
    return checkRateLimitRedis(`booking:${identifier}`, 10, 60);
  }
  return checkRateLimitInMemory(`booking:${identifier}`, 10, 60 * 1000);
}

/**
 * Business registration rate limit: 3 per hour per IP
 */
export async function checkBusinessRegistrationRateLimit(identifier: string): Promise<boolean> {
  if (isRedisConfigured()) {
    return checkRateLimitRedis(`business:${identifier}`, 3, 60 * 60);
  }
  return checkRateLimitInMemory(`business:${identifier}`, 3, 60 * 60 * 1000);
}

/**
 * General API rate limit: 100 requests per minute
 */
export async function checkApiRateLimit(identifier: string): Promise<boolean> {
  if (isRedisConfigured()) {
    return checkRateLimitRedis(`api:${identifier}`, 100, 60);
  }
  return checkRateLimitInMemory(`api:${identifier}`, 100, 60 * 1000);
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return "unknown";
}
