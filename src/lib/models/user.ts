import mongoose, { Schema } from "mongoose";

export enum Role {
  ADMIN = "admin",
  OWNER = "owner",
  STAFF = "staff",
  CUSTOMER = "customer",
}

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    password: { type: String }, // Hashed password for email/password login
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.CUSTOMER,
    },
    businessId: { type: Schema.Types.ObjectId, ref: "Business" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    // Email OTP verification fields
    emailVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    // Session invalidation on password change
    passwordChangedAt: { type: Date },
    // Remember me tokens
    rememberMeTokens: [
      {
        token: String,
        createdAt: { type: Date, default: Date.now, expires: 2592000 }, // 30 days
      },
    ],
    // MFA fields
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: String,
    mfaBackupCodes: [String],
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ businessId: 1, role: 1 });
UserSchema.index({ emailVerified: 1 });
UserSchema.index({ "rememberMeTokens.createdAt": 1 }, { sparse: true });

export const User =
  mongoose.models.User || mongoose.model("User", UserSchema);
