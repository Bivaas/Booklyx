import "server-only";
import crypto from "crypto";

/**
 * Generate a 6-digit numeric OTP
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash an OTP or email using SHA-256
 * We use SHA-256 (not bcrypt) for OTPs since they're short-lived
 */
export function hashString(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Verify an OTP against a hash
 */
export function verifyHash(value: string, hash: string): boolean {
  return hashString(value) === hash;
}

/**
 * Hash email for user identity (deterministic)
 */
export function hashEmail(email: string): string {
  return hashString(email.toLowerCase().trim());
}

/**
 * Generate a random token for secure identifiers
 */
export function generateToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}
