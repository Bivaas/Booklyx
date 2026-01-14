import "server-only";

/**
 * In-memory rate limiter (lightweight, per-instance only)
 * Resets on server restart/cold start and does not replicate across instances.
 * Redis (or similar) is required for horizontal scaling; kept simple here for MVP.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 600000);

/**
 * Check rate limit for an identifier
 * @param identifier - Unique identifier (email, IP, etc.)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
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

/**
 * OTP request rate limit: 5 requests per 15 minutes per email
 */
export function checkOTPRateLimit(email: string): boolean {
  return checkRateLimit(`otp:${email}`, 5, 15 * 60 * 1000);
}

/**
 * Booking rate limit: 10 requests per minute per IP
 */
export function checkBookingRateLimit(identifier: string): boolean {
  return checkRateLimit(`booking:${identifier}`, 10, 60 * 1000);
}

/**
 * Business registration rate limit: 3 per hour per IP
 */
export function checkBusinessRegistrationRateLimit(identifier: string): boolean {
  return checkRateLimit(`business:${identifier}`, 3, 60 * 60 * 1000);
}

/**
 * General API rate limit: 100 requests per minute
 */
export function checkApiRateLimit(identifier: string): boolean {
  return checkRateLimit(`api:${identifier}`, 100, 60 * 1000);
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
