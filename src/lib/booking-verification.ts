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
 * Check if user has exceeded daily booking limit for business
 * Limit: 7 bookings per user per day per business
 * @param email - User email
 * @param businessId - Business ID to check
 * @returns true if allowed, false if limit exceeded
 */
export async function canUserBookToday(
  email: string,
  businessId: string
): Promise<boolean> {
  const count = await getUserBookingCountToday(email, businessId);
  return count < 7; // Max 7 per day per business
}

/**
 * Validate user for booking
 * Consolidated check for all post-verification rules
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

    // 3. Check daily booking limit
    const count = await getUserBookingCountToday(email, businessId);
    if (count >= 7) {
      return {
        valid: false,
        error: "You have reached the maximum number of bookings for today",
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
