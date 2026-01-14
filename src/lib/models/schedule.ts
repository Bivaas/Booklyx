import mongoose, { Schema } from "mongoose";

const ScheduleSchema = new Schema(
  {
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    dayOfWeek: { type: Number, required: true }, // 0-6 (Sunday-Saturday)
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true }, // HH:mm
    isRecurring: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ScheduleSchema.index({ staffId: 1 });
ScheduleSchema.index({ businessId: 1, dayOfWeek: 1 });

export const Schedule =
  mongoose.models.Schedule || mongoose.model("Schedule", ScheduleSchema);
