import mongoose, { Schema } from "mongoose";

/**
 * OTP Model for email verification
 * - Stores hashed email only (no plaintext) to reduce PII exposure
 * - 6-digit numeric OTP
 * - Valid for 5 minutes
 * - Max 3 verification attempts
 * - Auto-expires via TTL index on expiresAt
 */
const OTPSchema = new Schema(
  {
    emailHash: { type: String, required: true },
    hashedOTP: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Index for querying by hashed email; TTL uses expiresAt so we can vary lifetimes without drift
OTPSchema.index({ emailHash: 1, verified: 1 });
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL on expiresAt chosen to align with per-record expiry

export const OTP = mongoose.models.OTP || mongoose.model("OTP", OTPSchema);
