# Booklyx

A secure appointment booking platform with business approval, email-verified accounts, and role-based access.

## Features

### For Customers
- **Verified Accounts** — Register with email + OTP verification, then sign in to book
- **Public Booking Pages** — Browse approved businesses at `/<slug>` and book appointments
- **Email Confirmations** — Automatic booking confirmation emails via Resend
- **Abuse Prevention** — Rate limiting and 1 booking per user per business per day

### For Business Owners
- **Business Registration** — Submit your business for admin approval
- **Owner Dashboard** — Manage bookings, services, staff, and schedules
- **Dynamic Availability** — Slot generation from schedule templates (no database bloat)
- **Multi-Service Support** — Multiple services with distinct pricing and duration

### For Administrators
- **Business Approval** — Review, approve, or suspend businesses
- **Analytics** — System stats via MongoDB aggregation
- **Role Management** — ADMIN, OWNER, STAFF, CUSTOMER roles

### Security
- Input validation with Zod schemas on all API endpoints
- XSS prevention via HTML sanitization
- In-memory rate limiting (Redis-free)
- OTP email verification at signup (codes expire in 5 minutes)
- Booking limits: 1 per user per business per day
- Account warm-up period (15 minutes) before first booking
- Only approved businesses appear publicly
- Production fail-fast for missing critical env vars

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes, MongoDB (Mongoose + native client)
- **Auth**: NextAuth 4 (Google OAuth + email/password credentials)
- **Email**: Resend with React email templates
- **Validation**: Zod 4, react-hook-form

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Google OAuth credentials
- Resend API key

### Installation

```bash
npm install
cp .env.example .env
npm run dev
```

### Required Environment Variables

```env
MONGODB_URI=mongodb+srv://...
AUTH_SECRET=<generate with: openssl rand -base64 64>
AUTH_GOOGLE_ID=<from Google Cloud Console>
AUTH_GOOGLE_SECRET=<from Google Cloud Console>
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
ADMIN_EMAILS=admin@example.com
```

### MongoDB Indexes

Create after first run:

```javascript
db.otps.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 300 })
db.verifiedusers.createIndex({ "verifiedAt": 1 }, { expireAfterSeconds: 86400 })
db.businesses.createIndex({ "status": 1 })
db.businesses.createIndex({ "status": 1, "createdAt": -1 })
db.bookings.createIndex({ "businessId": 1, "startTime": 1 })
db.bookings.createIndex({ "customerId": 1 })
```

## User Flows

### Customer Booking
1. Register an account at `/auth/register` (email + password + OTP verification)
2. Sign in at `/auth/signin`
3. Browse approved businesses on the homepage
4. Visit `/<slug>` to view a business's booking page
5. Select service, date, and time slot
6. Enter contact details (must use registered email)
7. Receive confirmation email

### Business Registration
1. Sign in (Google OAuth or email/password)
2. Go to Dashboard > Business and submit your business details
3. Admin reviews and approves (status: PENDING → APPROVED)
4. Business appears in public listings and can accept bookings

### Admin
1. Sign in with an email listed in `ADMIN_EMAILS`
2. Approve or suspend businesses from the admin dashboard
3. View system analytics

## Routes

### Public
| Route | Purpose |
|-------|---------|
| `/` | Homepage with business directory |
| `/[slug]` | Public booking page (approved businesses) |
| `/auth/signin` | Sign in (Google OAuth or credentials) |
| `/auth/register` | Account registration with OTP |
| `/docs` | Help and documentation |

### Dashboard (Authenticated)
| Route | Purpose |
|-------|---------|
| `/dashboard` | Bookings overview |
| `/dashboard/business` | Business profile / registration |
| `/dashboard/services` | Manage services (Owner) |
| `/dashboard/staff` | Manage staff (Owner) |
| `/dashboard/schedules` | Manage schedules (Owner) |
| `/dashboard/profile` | User profile |
| `/dashboard/admin` | Business approvals (Admin) |
| `/dashboard/analytics` | System analytics (Admin) |

## API Endpoints

### Auth
- `POST /api/auth/signup` — Register (email, password, name)
- `POST /api/auth/request-otp` — Request email OTP
- `POST /api/auth/verify-otp` — Verify OTP
- `GET /api/auth/profile` — Get/update profile

### Bookings
- `POST /api/bookings` — Create booking (requires verified account)
- `GET /api/bookings?businessId=<id>` — List bookings (owner/admin)
- `PATCH /api/bookings/[id]` — Update booking status

### Business
- `POST /api/business` — Register business (→ PENDING)
- `GET /api/businesses` — List approved businesses
- `GET /api/business/[slug]` — Get business details

### Services & Staff
- `POST|GET /api/services` — Create / list services
- `PATCH|DELETE /api/services/[id]` — Update / delete service
- `POST|GET /api/staff` — Create / list staff
- `PATCH|DELETE /api/staff/[id]` — Update / delete staff
- `POST|GET /api/schedules` — Create / list schedules

### Admin
- `POST /api/admin/business-approval` — Approve or suspend business
- `GET /api/admin/business-approval?status=pending` — List by status
- `GET /api/admin/analytics` — System analytics

### Availability
- `POST /api/availability` — Check available time slots

## Database Models

| Model | Purpose |
|-------|---------|
| **Business** | Profiles with status (PENDING/APPROVED/SUSPENDED), ownerId |
| **Service** | Services with pricing and duration |
| **Staff** | Team members linked to services |
| **Schedule** | Availability templates (day, start/end time) |
| **Booking** | Appointments with conflict prevention |
| **User** | Accounts with roles (ADMIN/OWNER/STAFF/CUSTOMER) |
| **OTP** | Email verification codes (5-minute TTL) |
| **VerifiedUser** | Verified email records (24-hour TTL) |

## Deployment

```bash
vercel deploy --prod
```

### Production Checklist
- Set `NODE_ENV=production`
- Use strong `AUTH_SECRET` (64+ chars)
- Configure MongoDB Atlas
- Set up Resend with verified domain
- Add admin emails to `ADMIN_EMAILS`
- Create MongoDB TTL indexes

## Development

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run linter
```

## Contributing

1. Add Zod validation for new API inputs
2. Sanitize user-provided strings
3. Add rate limiting for sensitive endpoints
4. Use conditional logging (dev only)

## License

MIT
