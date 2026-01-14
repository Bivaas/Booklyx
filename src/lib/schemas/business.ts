import { z } from "zod";

/**
 * Sanitize HTML/script content to prevent XSS
 */
const sanitizeHTML = (str: string) => {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
};

/**
 * Business registration schema with security validations
 */
export const businessRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters")
    .transform(sanitizeHTML),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .transform((val) => val.toLowerCase()),
  email: z.string().email("Invalid email address"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .transform((val) => (val ? sanitizeHTML(val) : val)),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional().transform((val) => (val ? sanitizeHTML(val) : val)),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  timezone: z.string().default("UTC"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#3b82f6"),
});

export type BusinessRegistration = z.infer<typeof businessRegistrationSchema>;

/**
 * Service creation schema with sanitization
 */
export const serviceSchema = z.object({
  name: z
    .string()
    .min(1, "Service name is required")
    .max(100)
    .transform(sanitizeHTML),
  description: z
    .string()
    .max(500)
    .optional()
    .transform((val) => (val ? sanitizeHTML(val) : val)),
  duration: z.number().min(5, "Duration must be at least 5 minutes").max(480),
  price: z.number().min(0).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#3b82f6"),
});

export type ServiceCreate = z.infer<typeof serviceSchema>;

/**
 * Staff creation schema
 */
export const staffSchema = z.object({
  name: z.string().min(1).max(100).transform(sanitizeHTML),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional().transform((val) => (val ? sanitizeHTML(val) : val)),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#3b82f6"),
});

export type StaffCreate = z.infer<typeof staffSchema>;
