import mongoose, { Schema } from "mongoose";

const StaffSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    services: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StaffSchema.index({ businessId: 1 });
StaffSchema.index({ userId: 1, businessId: 1 }, { unique: true });

export const Staff =
  mongoose.models.Staff || mongoose.model("Staff", StaffSchema);
