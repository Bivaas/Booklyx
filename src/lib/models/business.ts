import mongoose, { Schema } from "mongoose";

export enum BusinessStatus {
  PENDING = "pending",
  APPROVED = "approved",
  SUSPENDED = "suspended",
}

const BusinessSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true },
    description: { type: String },
    logo: { type: String },
    website: { type: String },
    phone: { type: String },
    address: { type: String },
    timezone: { type: String, default: "UTC" },
    color: { type: String, default: "#3b82f6" }, // primary brand color
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: Object.values(BusinessStatus),
      default: BusinessStatus.PENDING,
    },
    approvedAt: { type: Date },
    approvedBy: { type: String }, // Admin user ID who approved
    suspendedAt: { type: Date },
    suspendedReason: { type: String },
  },
  { timestamps: true }
);

BusinessSchema.index({ ownerId: 1 });
BusinessSchema.index({ slug: 1 });
BusinessSchema.index({ status: 1 });
BusinessSchema.index({ status: 1, createdAt: -1 });

export const Business =
  mongoose.models.Business || mongoose.model("Business", BusinessSchema);
