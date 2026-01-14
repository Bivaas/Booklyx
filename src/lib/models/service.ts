import mongoose, { Schema } from "mongoose";

const ServiceSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true },
    description: { type: String },
    duration: { type: Number, required: true }, // in minutes
    price: { type: Number, default: 0 },
    color: { type: String, default: "#60a5fa" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ServiceSchema.index({ businessId: 1 });

export const Service =
  mongoose.models.Service || mongoose.model("Service", ServiceSchema);
