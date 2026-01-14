import { z } from "zod";

export const bookingRequestSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  serviceId: z.string().min(1, "Service ID is required"),
  staffId: z.string().optional(),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z.string().optional(),
  startTime: z.coerce.date(),
  notes: z.string().optional(),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export const bookingStatusUpdateSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed"]),
});

export type BookingStatusUpdate = z.infer<typeof bookingStatusUpdateSchema>;
