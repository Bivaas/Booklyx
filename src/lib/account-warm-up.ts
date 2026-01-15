import "server-only";

/**
 * Account warm-up policy enforcement
 * New accounts must be at least 15 minutes old and email verified before creating bookings
 */

export interface WarmupCheckResult {
  allowed: boolean;
  minutesRemaining: number;
  reason?: string;
}

/**
 * Check if user account meets warm-up requirements
 * Requirements:
 * - Account must be at least 15 minutes old
 * - Email must be verified
 */
export function checkAccountWarmup(
  accountCreatedAt: Date | undefined | null,
  emailVerified: boolean
): WarmupCheckResult {
  // Must have email verified
  if (!emailVerified) {
    return {
      allowed: false,
      minutesRemaining: 15,
      reason: "Email verification required",
    };
  }

  // Must have accountCreatedAt timestamp
  if (!accountCreatedAt) {
    return {
      allowed: false,
      minutesRemaining: 15,
      reason: "Account initialization required",
    };
  }

  // Check age requirement: 15 minutes minimum
  const WARMUP_MINUTES = 15;
  const createdAtMs = new Date(accountCreatedAt).getTime();
  const nowMs = Date.now();
  const ageMs = nowMs - createdAtMs;
  const ageMinutes = ageMs / (1000 * 60);

  if (ageMinutes < WARMUP_MINUTES) {
    const minutesRemaining = Math.ceil(WARMUP_MINUTES - ageMinutes);
    return {
      allowed: false,
      minutesRemaining,
      reason: `Account requires ${minutesRemaining} more minute${minutesRemaining !== 1 ? "s" : ""} of age`,
    };
  }

  return {
    allowed: true,
    minutesRemaining: 0,
  };
}

/**
 * Format warm-up error message for API response
 */
export function getWarmupErrorMessage(minutesRemaining: number): string {
  return `Your account is new and requires verification time. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""}.`;
}
