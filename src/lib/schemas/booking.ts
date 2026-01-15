import { z } from "zod";

// Sanitize string input to prevent XSS
const sanitizeString = (str: string) => 
  str.replace(/[<>]/g, "").trim();

export const bookingRequestSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  serviceId: z.string().min(1, "Service ID is required"),
  staffId: z.string().optional(),
  customerName: z.string().min(1, "Name is required").transform(sanitizeString),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z.string()
    .min(1, "Phone number is required")
    .regex(/^[\d+\-\s()]+$/, "Invalid phone number format")
    .transform(sanitizeString),
  startTime: z.coerce.date(),
  notes: z.string().optional().transform((val) => val ? sanitizeString(val) : val),
  verificationToken: z.string().min(1, "Email verification required"),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export const bookingStatusUpdateSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed"]),
});

export type BookingStatusUpdate = z.infer<typeof bookingStatusUpdateSchema>;
