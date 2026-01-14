import mongoose, { Schema } from "mongoose";

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

const BookingSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff" },
    customerId: { type: String, required: true }, // user ID or email for guests
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    notes: { type: String },
    bookedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

BookingSchema.index({ businessId: 1, startTime: 1 });
BookingSchema.index({ customerId: 1 });
BookingSchema.index({ staffId: 1, startTime: 1 });

export const Booking =
  mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
