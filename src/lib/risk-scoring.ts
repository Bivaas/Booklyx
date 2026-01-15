import "server-only";

/**
 * Risk scoring system to prevent email API quota exhaustion
 * Tracks suspicious activities and disables email sending when threshold exceeded
 */

// Risk score thresholds
export const RISK_SCORE_THRESHOLDS = {
  DISABLED_EMAIL: 50, // Disable email sending above this score
  CRITICAL: 100, // Critical risk level
} as const;

export interface RiskAssessment {
  isAllowed: boolean;
  score: number;
  emailDisabled: boolean;
  reason?: string;
}

/**
 * Assess if user can send emails based on risk score
 * Email sending disabled if score >= DISABLED_EMAIL threshold
 */
export function assessRiskForEmailSending(
  riskScore: number,
  emailSendingDisabled: boolean
): RiskAssessment {
  // Check if admin has disabled email sending
  if (emailSendingDisabled) {
    return {
      isAllowed: false,
      score: riskScore,
      emailDisabled: true,
      reason: "Email sending temporarily disabled due to security policies",
    };
  }

  // Check if risk score exceeds threshold
  if (riskScore >= RISK_SCORE_THRESHOLDS.DISABLED_EMAIL) {
    return {
      isAllowed: false,
      score: riskScore,
      emailDisabled: true,
      reason: "Account requires security verification",
    };
  }

  return {
    isAllowed: true,
    score: riskScore,
    emailDisabled: false,
  };
}

/**
 * Increment user risk score for suspicious activities
 * Activities that increase risk:
 * - Failed OTP attempts (+5 each)
 * - Multiple signup attempts (+10 each)
 * - Unusual patterns (+15 each)
 */
export function calculateRiskIncrement(activity: "failed_otp" | "signup_attempt" | "unusual_pattern"): number {
  const increments = {
    failed_otp: 5,
    signup_attempt: 10,
    unusual_pattern: 15,
  };
  return increments[activity];
}

/**
 * Get risk level description
 */
export function getRiskLevelDescription(score: number): string {
  if (score < 25) return "Low";
  if (score < 50) return "Medium";
  if (score < 100) return "High";
  return "Critical";
}
