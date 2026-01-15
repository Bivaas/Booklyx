import mongoose, { Document, Schema } from "mongoose";

export interface IDevice extends Document {
  userId: mongoose.Types.ObjectId;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  lastUsed: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const deviceSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deviceName: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  lastUsed: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for faster queries
deviceSchema.index({ userId: 1, ipAddress: 1 });
deviceSchema.index({ userId: 1, createdAt: -1 });

export const Device =
  mongoose.models.Device || mongoose.model<IDevice>("Device", deviceSchema);
