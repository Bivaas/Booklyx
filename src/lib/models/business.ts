import mongoose, { Schema } from "mongoose";

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
  },
  { timestamps: true }
);

BusinessSchema.index({ ownerId: 1 });
BusinessSchema.index({ slug: 1 });

export const Business =
  mongoose.models.Business || mongoose.model("Business", BusinessSchema);
