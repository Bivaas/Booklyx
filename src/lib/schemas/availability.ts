import { z } from "zod";

export const availabilityRequestSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  serviceId: z.string().min(1, "Service ID is required"),
  staffId: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type AvailabilityRequest = z.infer<typeof availabilityRequestSchema>;
