# Appointment Booking System

A production-ready B2B SaaS appointment booking platform built with Next.js, React, MongoDB, and Auth.js.

## Features

- **Multi-tenant Architecture**: Each business gets its own isolated booking space with custom branding
- **Authentication & Authorization**: OAuth (Google) + email login via Auth.js with RBAC (Owner, Staff, Customer)
- **Booking Management**: 
  - Availability calculation with conflict resolution
  - Automatic time slot blocking
  - Booking status workflow (Pending → Confirmed → Completed/Cancelled)
- **Staff Management**: Schedule multiple staff members with service assignments
- **Notifications**: Email confirmations and cancellations via Resend
- **Audit Logging**: Track admin actions and business events
- **Rate Limiting**: Prevent booking spam with time-based limits
- **Security**: Zod validation, CSRF protection, secure session handling

## Tech Stack

### Frontend
- **Next.js 16** (App Router, Server Components)
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **shadcn/ui** for headless components

### Backend
- **Next.js API Routes** & Server Actions
- **MongoDB** (Atlas free tier) for flexible schema
- **Mongoose 8** for ODM and validation
- **Auth.js** for authentication
- **Zod** for schema validation
- **Resend** for email notifications

### Infrastructure
- **Vercel** for deployment (native Next.js support)
- **MongoDB Atlas** for database hosting

## Project Structure

```
src/
├── app/
│   ├── (booking)/          # Public tenant booking pages
│   ├── api/
│   │   ├── auth/           # Auth.js routes
│   │   ├── bookings/       # Booking CRUD endpoints
│   │   └── availability/   # Slot availability check
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   └── globals.css         # Tailwind & theme
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── auth.ts             # Auth.js configuration
│   ├── db.ts               # MongoDB connection
│   ├── env.ts              # Environment validation
│   ├── models/             # Mongoose schemas
│   │   ├── business.ts
│   │   ├── user.ts
│   │   ├── booking.ts
│   │   ├── service.ts
│   │   ├── staff.ts
│   │   ├── schedule.ts
│   │   └── audit-log.ts
│   ├── schemas/            # Zod validation
│   ├── notifications.ts    # Email service
│   └── rate-limit.ts       # Rate limiting config
└── middleware.ts           # RBAC enforcement
```

## Environment Setup

1. **Copy env template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Configure required variables**:
   - `MONGODB_URI`: MongoDB Atlas connection string (free tier)
   - `AUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `AUTH_GOOGLE_ID` & `AUTH_GOOGLE_SECRET`: From Google OAuth Console
   - `RESEND_API_KEY`: From Resend dashboard
   - `EMAIL_FROM`: Sender email address

3. **(Optional) SMS Notifications**:
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

## Installation

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Public Booking Pages

Customers can book directly via tenant-aware URLs:

```
https://yourapp.com/acme-salon        # Dynamic booking page
https://yourapp.com/green-clinic      # Per-business branding & services
```

Each page displays the business's:
- Logo, colors, and branding
- Available services
- Staff schedules
- Real-time availability slots

## API Endpoints

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings?businessId=<id>` - List bookings
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id` - Update status (confirm/cancel)

### Availability
- `POST /api/availability` - Check available slots

### Authentication
- `GET/POST /api/auth/*` - Auth.js routes (signin, signout, callback)

## Database Models

### Business
- name, email, ownerId, description, logo, website, phone, address, timezone, color

### User
- email, name, role (owner/staff/customer), businessId, isActive, lastLogin

### Service
- businessId, name, description, duration (minutes), price, color

### Staff
- businessId, userId, name, email, services[], isAvailable

### Schedule
- staffId, businessId, dayOfWeek, startTime, endTime, isRecurring

### Booking
- businessId, serviceId, staffId, customerId, customerName, customerEmail, customerPhone, startTime, endTime, status, notes

### AuditLog
- businessId, userId, action, resource, resourceId, details, ipAddress, userAgent

## Security Measures

1. **Authentication**: OAuth via Google + secure session handling (Auth.js)
2. **Input Validation**: Zod schemas on all API inputs
3. **CSRF Protection**: Built-in via Auth.js
4. **Rate Limiting**: Booking endpoint limited to 5/hour per user
5. **Audit Logging**: Track all admin actions
6. **Time-based Locks**: Prevent double-booking with conflict detection
7. **Authorization**: RBAC enforcement via middleware

## Future Enhancements

- [ ] SMS reminders via Twilio
- [ ] Multi-timezone support
- [ ] Recurring bookings
- [ ] Payment processing (Stripe)
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Video call integrations
- [ ] Automated cancellation rules
- [ ] Staff availability templates
- [ ] Customer ratings & reviews
- [ ] Analytics dashboard

## Deployment

1. **Push to GitHub**
2. **Connect Vercel project**
3. **Set environment variables in Vercel dashboard**
4. **Deploy**: Vercel auto-deploys on push to main

```bash
# Quick deploy
vercel deploy --prod
```

## License

MIT
