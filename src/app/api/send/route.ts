import { BookingConfirmationEmail } from '@/components/ui/email-template';
import { Resend } from 'resend';
import env from '@/lib/env';

const resend = new Resend(env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      to,
      customerName,
      businessName,
      serviceName,
      startTime,
      bookingId,
      price,
    } = body;

    if (!to || !customerName || !businessName || !serviceName || !startTime || !bookingId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || 'noreply@example.com',
      to: to,
      subject: `Booking Confirmed - ${businessName}`,
      react: BookingConfirmationEmail({
        customerName,
        businessName,
        serviceName,
        startTime,
        bookingId,
        price,
      }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Email send error:', error);
    return Response.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}