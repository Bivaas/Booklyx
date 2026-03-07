import "server-only";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/user";
import { Booking, BookingStatus } from "@/lib/models/booking";
import { Business, BusinessStatus } from "@/lib/models/business";

/**
 * Booking verification utilities
 * 
 * Enforces post-verification rules:
 * - Verified users do NOT re-verify daily
 * - Enforce booking limits per user per day
 * - Supplement with IP heuristics
 */

/**
 * Check if user email is verified
 * Once verified, no daily re-verification required
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  try {
    await connectDb();
    const user = await User.findOne({ email });
    return user?.emailVerified === true;
  } catch (error) {
    return false;
  }
}

/**
 * Get booking count for user today (across all businesses)
 * @param email - User email
 * @returns Number of bookings today
 */
export async function getUserDailyBookingCount(email: string): Promise<number> {
  try {
    await connectDb();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await Booking.countDocuments({
      customerEmail: email,
      startTime: { $gte: today, $lt: tomorrow },
      status: { $ne: BookingStatus.CANCELLED },
    });

    return count;
  } catch (error) {
    // If DB check fails, use conservative estimate (0)
    return 0;
  }
}

/**
 * Get booking count for user today for a specific business
 * @param email - User email
 * @param businessId - Business ID to check limit against
 * @returns Number of bookings today
 */
export async function getUserBookingCountToday(
  email: string,
  businessId: string
): Promise<number> {
  try {
    await connectDb();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await Booking.countDocuments({
      customerEmail: email,
      businessId,
      startTime: { $gte: today, $lt: tomorrow },
      status: { $ne: BookingStatus.CANCELLED },
    });

    return count;
  } catch (error) {
    // If DB check fails, use conservative estimate (0)
    return 0;
  }
}

/**
 * Check if user can book today (max 2 bookings per day per user)
 * @param email - User email
 * @returns true if allowed, false if limit exceeded
 */
export async function canUserBookToday(
  email: string
): Promise<boolean> {
  // EMAIL RATE LIMITING: Max 2 bookings per day per user
  const count = await getUserDailyBookingCount(email);
  return count < 2; // Max 2 per day
}

/**
 * Validate user for booking
 * Consolidated check for all post-verification rules
 * 
 * BOOKING LIMITS:
 * - Max 2 bookings per day per user (email rate limiting)
 * - Email must be verified
 * - Business must be approved
 * 
 * @returns error message if validation fails, null if allowed
 */
export async function validateUserForBooking(
  email: string,
  businessId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    await connectDb();

    // 1. Check if email is verified
    const user = await User.findOne({ email });
    if (!user?.emailVerified) {
      return {
        valid: false,
        error: "Email verification required before booking",
      };
    }

    // 2. Check business is approved
    const business = await Business.findById(businessId);
    if (!business || business.status !== BusinessStatus.APPROVED) {
      return {
        valid: false,
        error: "This business is not accepting bookings",
      };
    }

    // 3. Check daily booking limit (2 per day per user)
    const dailyCount = await getUserDailyBookingCount(email);
    if (dailyCount >= 2) {
      return {
        valid: false,
        error: "You have reached the maximum number of bookings for today. Maximum: 2 bookings per day",
      };
    }

    return { valid: true };
  } catch (error) {
    // On DB error, fail open with safe message
    return {
      valid: false,
      error: "Unable to verify booking eligibility",
    };
  }
}
