import { z } from "zod";

/**
 * Validate email format and reject disposable/malformed addresses
 */
const validateEmail = (email: string) => {
  const trimmed = email.toLowerCase().trim();
  
  // Standard email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return false;
  }
  
  // Reject common disposable email domains
  const disposableDomains = [
    "tempmail.com",
    "throwaway.email",
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "temp-mail.org",
    "yopmail.com",
    "fake-mail.com",
  ];
  
  const domain = trimmed.split("@")[1];
  if (disposableDomains.includes(domain)) {
    return false;
  }
  
  return true;
};

/**
 * OTP request schema
 * Validates email and rate limiting context
 */
export const otpRequestSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .transform((val) => val.toLowerCase().trim())
    .refine(validateEmail, "Disposable or invalid email address"),
});

export type OTPRequest = z.infer<typeof otpRequestSchema>;

/**
 * OTP verification schema
 * Validates OTP code and email
 */
export const otpVerifySchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .transform((val) => val.toLowerCase().trim())
    .refine(validateEmail, "Invalid email address"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
});

export type OTPVerify = z.infer<typeof otpVerifySchema>;
