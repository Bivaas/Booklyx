import "server-only";
import env from "./env";
import { BookingConfirmationEmail, CancellationEmail } from "@/components/ui/email-template";

// Initialize Resend only if API key is available
let resend: any = null;

async function initResend() {
  if (!resend && env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    resend = new Resend(env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Send OTP verification email
 * 
 * Security: OTP is NEVER logged. Only non-sensitive status messages.
 */
export async function sendOTPEmail(email: string, otp: string) {
  const resendClient = await initResend();
  if (!resendClient) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Resend not configured");
    }
    return;
  }

  try {
    await resendClient.emails.send({
      from: env.EMAIL_FROM || "noreply@example.com",
      to: email,
      subject: "Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
    // Success is silent (no logging of email addresses)
  } catch (error) {
    // Log only that sending failed, never the email or error details
    if (process.env.NODE_ENV === "development") {
      console.error("OTP email send failed - Resend error");
    }
    throw error;
  }
}

/**
 * Send business approval notification
 */
export async function sendBusinessApprovalEmail(
  email: string,
  businessName: string,
  approved: boolean,
  reason?: string
) {
  const resendClient = await initResend();
  if (!resendClient) {
    console.warn("Resend not configured, skipping business approval email");
    return;
  }

  try {
    const subject = approved
      ? `Business Approved - ${businessName}`
      : `Business Application Update - ${businessName}`;

    const message = approved
      ? `Congratulations! Your business "${businessName}" has been approved and is now live on our platform.`
      : `Your business "${businessName}" application status has been updated. ${reason || ""}`;

    await resendClient.emails.send({
      from: env.EMAIL_FROM || "noreply@example.com",
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${approved ? "🎉 Business Approved!" : "Business Application Update"}</h2>
          <p>${message}</p>
          ${approved ? '<p>You can now start accepting bookings!</p>' : ''}
          <p>Thank you for using our platform.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send business approval email:", error);
  }
}

export async function sendBookingConfirmation(
  email: string,
  customerName: string,
  businessName: string,
  serviceName: string,
  startTime: Date,
  bookingId: string,
  price?: number
) {
  const resendClient = await initResend();
  if (!resendClient) {
    console.warn("Resend not configured, skipping email");
    return;
  }

  try {
    const formattedDate = startTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    await resendClient.emails.send({
      from: env.EMAIL_FROM || "noreply@example.com",
      to: email,
      subject: `Booking Confirmed - ${businessName}`,
      react: BookingConfirmationEmail({
        customerName,
        businessName,
        serviceName,
        startTime: formattedDate,
        bookingId,
        price,
      }),
    });
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error);
  }
}

export async function sendBookingCancellation(
  email: string,
  customerName: string,
  businessName: string,
  serviceName: string,
  startTime: Date
) {
  const resendClient = await initResend();
  if (!resendClient) {
    console.warn("Resend not configured, skipping email");
    return;
  }

  try {
    const formattedDate = startTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    await resendClient.emails.send({
      from: env.EMAIL_FROM || "noreply@example.com",
      to: email,
      subject: `Booking Cancelled - ${businessName}`,
      react: CancellationEmail({
        customerName,
        businessName,
        serviceName,
        startTime: formattedDate,
      }),
    });
  } catch (error) {
    console.error("Failed to send booking cancellation email:", error);
  }
}
