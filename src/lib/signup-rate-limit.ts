/**
 * Signup Rate Limiting (Pre-OTP)
 * 
 * Prevents automated signup abuse using Redis or in-memory fallback
 * - Max 1 signup attempt per device per 24 hours
 * - Max 2 signup attempts per IP per 24 hours
 * - Blocks silently when exceeded
 */

interface SignupRateLimitEntry {
  count: number;
  resetAt: number;
}

const signupLimitStore = new Map<string, SignupRateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of signupLimitStore.entries()) {
    if (entry.resetAt < now) {
      signupLimitStore.delete(key);
    }
  }
}, 600000);

/**
 * Check if signup is allowed for a device
 * Max 1 signup per device per 24 hours
 */
export function checkSignupDeviceLimit(deviceFingerprint: string): boolean {
  const now = Date.now();
  const key = `signup-device:${deviceFingerprint}`;
  const entry = signupLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new entry
    signupLimitStore.set(key, {
      count: 1,
      resetAt: now + 24 * 60 * 60 * 1000, // 24 hours
    });
    return true;
  }

  if (entry.count >= 1) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

/**
 * Check if signup is allowed for an IP
 * Max 2 signups per IP per 24 hours
 */
export function checkSignupIPLimit(ip: string): boolean {
  const now = Date.now();
  const key = `signup-ip:${ip}`;
  const entry = signupLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new entry
    signupLimitStore.set(key, {
      count: 1,
      resetAt: now + 24 * 60 * 60 * 1000, // 24 hours
    });
    return true;
  }

  if (entry.count >= 2) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

/**
 * Validate signup limits (both device and IP)
 * Returns true if allowed, false if rate limited
 * Blocks silently
 */
export function validateSignupLimits(
  deviceFingerprint: string,
  ip: string
): boolean {
  // Check device limit (stricter)
  if (!checkSignupDeviceLimit(deviceFingerprint)) {
    return false;
  }

  // Check IP limit
  if (!checkSignupIPLimit(ip)) {
    return false;
  }

  return true;
}
