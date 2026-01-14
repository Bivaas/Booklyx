import * as React from 'react';

interface BookingConfirmationProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  startTime: string;
  bookingId: string;
  price?: number;
}

export function BookingConfirmationEmail({
  customerName,
  businessName,
  serviceName,
  startTime,
  bookingId,
  price,
}: BookingConfirmationProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        borderRadius: '8px 8px 0 0',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px' }}>Booking Confirmed! ✓</h1>
      </div>

      <div style={{
        padding: '30px',
        backgroundColor: '#f9fafb',
        borderRadius: '0 0 8px 8px'
      }}>
        <p style={{ color: '#374151', fontSize: '16px', marginBottom: '24px' }}>
          Hi <strong>{customerName}</strong>,
        </p>

        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          Your appointment has been successfully booked. Here are the details:
        </p>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Business</p>
            <p style={{ margin: '0', color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>{businessName}</p>
          </div>

          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service</p>
            <p style={{ margin: '0', color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>{serviceName}</p>
          </div>

          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</p>
            <p style={{ margin: '0', color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>{startTime}</p>
          </div>

          {price !== undefined && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</p>
              <p style={{ margin: '0', color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>${(price / 100).toFixed(2)}</p>
            </div>
          )}

          <div>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Booking ID</p>
            <p style={{ margin: '0', color: '#667eea', fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>{bookingId}</p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{ margin: '0', color: '#1e40af', fontSize: '14px' }}>
            <strong>Important:</strong> Please save your booking ID for future reference. You can use it to reschedule or cancel your appointment if needed.
          </p>
        </div>

        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          If you need to reschedule or cancel, please contact {businessName} at least 24 hours in advance.
        </p>

        <div style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '20px',
          marginTop: '20px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '12px'
        }}>
          <p style={{ margin: '0' }}>This is an automated email. Please do not reply to this address.</p>
          <p style={{ margin: '8px 0 0 0' }}>Thank you for choosing {businessName}!</p>
        </div>
      </div>
    </div>
  );
}

interface CancellationEmailProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  startTime: string;
}

export function CancellationEmail({
  customerName,
  businessName,
  serviceName,
  startTime,
}: CancellationEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
        padding: '20px',
        borderRadius: '8px 8px 0 0',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px' }}>Booking Cancelled</h1>
      </div>

      <div style={{
        padding: '30px',
        backgroundColor: '#f9fafb',
        borderRadius: '0 0 8px 8px'
      }}>
        <p style={{ color: '#374151', fontSize: '16px', marginBottom: '24px' }}>
          Hi <strong>{customerName}</strong>,
        </p>

        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          Your appointment has been cancelled. Here are the details:
        </p>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Business</p>
            <p style={{ margin: '0', color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>{businessName}</p>
          </div>

          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service</p>
            <p style={{ margin: '0', color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>{serviceName}</p>
          </div>

          <div>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cancelled Date & Time</p>
            <p style={{ margin: '0', color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>{startTime}</p>
          </div>
        </div>

        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          If you would like to rebook or have questions, please visit our booking page or contact {businessName} directly.
        </p>

        <div style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '20px',
          marginTop: '20px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '12px'
        }}>
          <p style={{ margin: '0' }}>This is an automated email. Please do not reply to this address.</p>
          <p style={{ margin: '8px 0 0 0' }}>Thank you for your understanding.</p>
        </div>
      </div>
    </div>
  );
}