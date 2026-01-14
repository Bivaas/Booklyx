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
