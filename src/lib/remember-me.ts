import crypto from "crypto";

/**
 * Generate a remember me token
 */
export function generateRememberMeToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash remember me token for storage
 */
export function hashRememberMeToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Verify remember me token
 */
export function verifyRememberMeToken(
  storedHash: string,
  providedToken: string
): boolean {
  const providedHash = hashRememberMeToken(providedToken);
  const storedBuffer = Buffer.from(storedHash);
  const providedBuffer = Buffer.from(providedHash);
  if (storedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(storedBuffer, providedBuffer);
}

/**
 * Create remember me cookie value
 */
export function createRememberMeCookie(userId: string, token: string): string {
  return Buffer.from(`${userId}:${token}`).toString("base64");
}

/**
 * Parse remember me cookie
 */
export function parseRememberMeCookie(
  cookie: string
): { userId: string; token: string } | null {
  try {
    const decoded = Buffer.from(cookie, "base64").toString("utf-8");
    const [userId, token] = decoded.split(":");
    return { userId, token };
  } catch {
    return null;
  }
}
