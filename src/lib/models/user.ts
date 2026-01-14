import mongoose, { Schema } from "mongoose";

export enum Role {
  OWNER = "owner",
  STAFF = "staff",
  CUSTOMER = "customer",
}

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.CUSTOMER,
    },
    businessId: { type: Schema.Types.ObjectId, ref: "Business" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ businessId: 1, role: 1 });

export const User =
  mongoose.models.User || mongoose.model("User", UserSchema);
