import "server-only";

/**
 * IP-based booking limit tracking (cookie + heuristic approach)
 * 
 * This provides lightweight protection against abuse:
 * - Does NOT persist IP addresses
 * - Uses in-memory tracking (ephemeral)
 * - Supplements user-based limits
 * - Combines with HTTP-only cookies
 * 
 * Note: Not a replacement for verified user limits,
 * but adds an extra layer for users trying to bypass verification
 */

interface IPBookingEntry {
  count: number;
  resetAt: number;
  lastTimestamps: number[]; // Last 7 booking timestamps for burst detection
}

const ipBookingStore = new Map<string, IPBookingEntry>();

// Cleanup old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of ipBookingStore.entries()) {
    if (entry.resetAt < now) {
      ipBookingStore.delete(key);
    }
  }
}, 30 * 60 * 1000);

/**
 * Check if IP has exceeded booking limit for today
 * Limit: 10 bookings per IP per day
 * @param ip - Client IP (only kept in memory, never persisted)
 * @returns true if allowed, false if exceeded
 */
export function checkIPBookingLimit(ip: string): boolean {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const resetAt = new Date(today).getTime() + 24 * 60 * 60 * 1000; // Reset at midnight

  const entry = ipBookingStore.get(ip);

  // First booking or after reset
  if (!entry || entry.resetAt < now) {
    ipBookingStore.set(ip, {
      count: 1,
      resetAt,
      lastTimestamps: [now],
    });
    return true;
  }

  // Check if daily limit exceeded (10 per day)
  if (entry.count >= 10) {
    return false;
  }

  // Check for burst abuse (more than 5 bookings in 5 minutes)
  const recentBookings = entry.lastTimestamps.filter(
    (timestamp) => now - timestamp < 5 * 60 * 1000
  );
  if (recentBookings.length >= 5) {
    return false; // Likely automated abuse
  }

  // Allow booking, increment counter
  entry.count += 1;
  entry.lastTimestamps.push(now);

  // Keep only last 10 timestamps for memory efficiency
  if (entry.lastTimestamps.length > 10) {
    entry.lastTimestamps = entry.lastTimestamps.slice(-10);
  }

  return true;
}

/**
 * Get remaining bookings for IP today
 * Useful for client feedback
 */
export function getIPBookingRemaining(ip: string): number {
  const entry = ipBookingStore.get(ip);

  if (!entry) {
    return 10; // Fresh limit
  }

  const now = Date.now();
  if (entry.resetAt < now) {
    return 10; // Reset occurred
  }

  return Math.max(0, 10 - entry.count);
}

/**
 * Reset IP booking limit (admin use only, after manual verification)
 */
export function resetIPBookingLimit(ip: string): void {
  ipBookingStore.delete(ip);
}
