import mongoose, { Schema } from "mongoose";

/**
 * Verified User Model (No permanent accounts)
 * - Stores hashed email for booking identity
 * - Auto-expires after 24 hours via TTL index
 * - Used for booking limits per verified email
 */
const VerifiedUserSchema = new Schema(
  {
    hashedEmail: { type: String, required: true, unique: true },
    verifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// TTL index - automatically delete after 24 hours
VerifiedUserSchema.index({ verifiedAt: 1 }, { expireAfterSeconds: 86400 });

export const VerifiedUser =
  mongoose.models.VerifiedUser ||
  mongoose.model("VerifiedUser", VerifiedUserSchema);
