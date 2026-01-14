import mongoose, { Schema } from "mongoose";

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  APPROVE = "APPROVE",
  CANCEL = "CANCEL",
  LOGIN = "LOGIN",
}

const AuditLogSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    userId: { type: String, required: true },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
    },
    resource: { type: String }, // "booking", "staff", "service", etc.
    resourceId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

AuditLogSchema.index({ businessId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1 });

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
