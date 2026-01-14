# Appointment Booking System

A modern appointment booking platform that allows businesses to accept online bookings and manage their schedules.

## Features

- **Public Booking Page** - Customers can browse services and book appointments
- **Admin Dashboard** - Manage bookings, services, staff, and business settings
- **Email Confirmations** - Automatic booking confirmation emails
- **Multi-Business Support** - Each business has its own booking space
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Google OAuth** - Easy authentication for business owners
- **Real-time Availability** - Show available time slots instantly

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: NextAuth + Google OAuth
- **Email**: Resend with React email templates
- **Validation**: Zod schemas

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Google OAuth credentials (optional for development)
- Resend API key (optional for development)

### Installation

```bash
# Clone and install
git clone <repo>
cd appointment
npm install

# Setup environment
cp .env.example .env.local

# Fill in required variables:
# MONGODB_URI - MongoDB connection string
# AUTH_SECRET - Generate with: openssl rand -base64 32
# AUTH_GOOGLE_ID - From Google Cloud Console (optional)
# AUTH_GOOGLE_SECRET - From Google Cloud Console (optional)
# RESEND_API_KEY - From Resend.com (optional)
# EMAIL_FROM - Sender email address

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Customers
1. Visit `/booking/[business-slug]`
2. Select a service
3. Pick a date and time
4. Enter your information
5. Receive confirmation email

### For Business Owners
1. Sign in at `/auth/signin` with Google
2. Access dashboard at `/dashboard`
3. Manage bookings, services, and staff
4. Configure business settings

## Project Routes

| Route | Purpose |
|-------|---------|
| `/` | Home page |
| `/booking/[slug]` | Public booking page for a business |
| `/auth/signin` | Sign in with Google |
| `/dashboard` | Admin dashboard (protected) |
| `/dashboard/services` | Manage services |
| `/dashboard/staff` | Manage staff members |
| `/dashboard/business` | Business settings |

## Database Models

- **User** - Business owners and customers
- **Business** - Business profiles with branding
- **Service** - Services offered with pricing and duration
- **Staff** - Team members
- **Schedule** - Staff availability schedules
- **Booking** - Appointments with status tracking
- **AuditLog** - Activity logs

## API Endpoints

### Public
- `GET /api/business/[slug]` - Get business and services
- `POST /api/bookings` - Create booking
- `GET /api/availability` - Check available slots

### Protected (Admin)
- `GET /api/bookings` - List bookings
- `PATCH /api/bookings/[id]` - Update booking status

### To Be Implemented
- `/api/services/*` - Service CRUD
- `/api/staff/*` - Staff CRUD
- `/api/schedules/*` - Schedule management
- `PATCH /api/business/[id]` - Update business info

## Environment Variables

```
MONGODB_URI          # MongoDB connection
AUTH_SECRET          # NextAuth secret (required)
AUTH_GOOGLE_ID       # Google OAuth ID (optional)
AUTH_GOOGLE_SECRET   # Google OAuth secret (optional)
RESEND_API_KEY       # Resend email API key (optional)
EMAIL_FROM           # Sender email address (optional)
```

## Project Status

| Feature | Status |
|---------|--------|
| Public booking page | ✅ Complete |
| Email confirmations | ✅ Complete |
| Admin dashboard UI | ✅ Complete |
| Authentication | ✅ Complete |
| Booking management API | ✅ Complete |
| Services API | ⏳ To Do |
| Staff API | ⏳ To Do |
| Schedules API | ⏳ To Do |

## Deployment

### Vercel (Recommended)
```bash
# Push to GitHub
git push origin main

# Deploy to Vercel
vercel deploy

# Add environment variables in Vercel dashboard
```

### Other Platforms
Works with any platform supporting Node.js (Heroku, Railway, etc.)

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Contributing

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for development guidelines and next steps.

## License

MIT

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
