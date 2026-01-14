# Appointment Booking System (Booklyx)

A secure, modern appointment booking platform with business approval workflow, email OTP verification, and resource protection.

## 🚀 Key Features

### For Customers
- **Email OTP Verification** - No account required, verify via 6-digit code
- **Public Booking** - Browse approved businesses and book appointments
- **Email Confirmations** - Automatic booking confirmation emails
- **Rate Limited** - Protected against spam and abuse

### For Business Owners
- **Business Registration** - Submit business for admin approval
- **Admin Dashboard** - Manage bookings, services, and staff
- **Real-time Availability** - Dynamic slot generation (no database bloat)
- **Multi-Service Support** - Offer multiple services with different durations
- **Google OAuth** - Easy authentication

### For Administrators
- **Business Approval System** - Review and approve/suspend businesses
- **Analytics Dashboard** - View system stats and activity
- **Lightweight Admin Panel** - MongoDB aggregation-based analytics

### Security Features ✅
- ✅ **Input Validation** - Zod schemas on all API endpoints
- ✅ **XSS Prevention** - HTML sanitization for user inputs
- ✅ **Rate Limiting** - In-memory rate limiter (Redis-free)
- ✅ **OTP Verification** - Required before booking
- ✅ **Booking Limits** - Max 7 bookings per email per day per business
- ✅ **Business Approval** - Only approved businesses appear publicly
- ✅ **No Sensitive Logging** - Production-safe error handling

## 📚 Documentation

- **[SECURITY.md](./SECURITY.md)** - Security features and best practices
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Detailed implementation guide
- **[.env.example](./.env.example)** - Environment variable template

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, MongoDB (mongoose + native)
- **Authentication**: NextAuth 4 + Google OAuth
- **Email**: Resend with React email templates
- **Validation**: Zod 4 schemas with sanitization
- **Security**: In-memory rate limiting, OTP verification

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or MongoDB Atlas)
- Google OAuth credentials
- Resend API key (for emails)

### Installation

```bash
# Clone and install
git clone <repo>
cd booklyx
npm install

# Setup environment
cp .env.example .env

# Required environment variables:
# MONGODB_URI - MongoDB connection string
# AUTH_SECRET - Generate with: openssl rand -base64 64
# AUTH_GOOGLE_ID - From Google Cloud Console
# AUTH_GOOGLE_SECRET - From Google Cloud Console
# RESEND_API_KEY - From Resend.com
# EMAIL_FROM - Verified sender email
# ADMIN_EMAILS - Comma-separated admin emails

# Start development server
npm run dev
```

### Post-Install: Create MongoDB Indexes

After first run, execute in MongoDB shell:

```javascript
db.otps.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 300 })
db.verifiedusers.createIndex({ "verifiedAt": 1 }, { expireAfterSeconds: 86400 })
db.businesses.createIndex({ "status": 1 })
db.businesses.createIndex({ "status": 1, "createdAt": -1 })
db.bookings.createIndex({ "businessId": 1, "startTime": 1 })
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔄 User Flows

### Customer Booking Flow
1. Browse public businesses at `/booking/[slug]`
2. Select service and time slot
3. Enter email → Request OTP via `POST /api/otp/request`
4. Verify OTP → Get verification token via `POST /api/otp/verify`
5. Submit booking with token → `POST /api/bookings`
6. Receive confirmation email

### Business Registration Flow
1. Sign in with Google OAuth
2. Register business via `POST /api/business` (status: PENDING)
3. Admin reviews in admin dashboard
4. Admin approves via `POST /api/admin/business-approval`
5. Business status → APPROVED
6. Business appears in public listings

### Admin Workflow
1. Sign in with admin email (from ADMIN_EMAILS)
2. Access `/api/admin/business-approval` to view pending businesses
3. Approve or suspend businesses
4. View analytics at `/api/admin/analytics`

## Project Routes

### Public Routes
| Route | Purpose |
|-------|---------|
| `/` | Home page |
| `/booking/[slug]` | Public booking page (APPROVED businesses only) |
| `/auth/signin` | Google OAuth sign-in |

### Protected Routes (Business Owners)
| Route | Purpose |
|-------|---------|
| `/dashboard` | Admin dashboard |
| `/dashboard/services` | Manage services |
| `/dashboard/staff` | Manage staff |
| `/dashboard/business` | Business settings |

### Admin-Only Routes
| Route | Purpose |
|-------|---------|
| `/api/admin/business-approval` | Approve/suspend businesses |
| `/api/admin/analytics` | System analytics |

## Database Models

### Core Models
- **Business** - Business profiles with status (PENDING/APPROVED/SUSPENDED)
- **Service** - Services with pricing and duration
- **Staff** - Team members with schedules
- **Schedule** - Availability templates (not individual slots)
- **Booking** - Appointments with conflict prevention
- **User** - Business owners (via NextAuth) with roles

### Security Models
- **OTP** - Email verification codes (TTL: 5 minutes)
- **VerifiedUser** - Temporary verified emails (TTL: 24 hours)

### NextAuth Models (Auto-created)
- accounts, sessions, users, verification_tokens

## API Endpoints

### Public
- `POST /api/otp/request` - Request OTP for email verification
- `POST /api/otp/verify` - Verify OTP and get token
- `POST /api/bookings` - Create booking (requires verification token)
- `GET /api/business/[slug]` - Get business details (APPROVED only)

### Protected (Business Owners)
- `POST /api/business` - Register new business (→ PENDING status)
- `GET /api/business` - Get own business details
- `PATCH /api/business/[slug]` - Update business settings
- `GET /api/bookings` - List bookings for business
- `PATCH /api/bookings/[id]` - Update booking status
- `POST /api/services` - Create service (requires APPROVED business)
- `GET /api/services` - List services
- `PATCH /api/services/[id]` - Update service
- `POST /api/staff` - Create staff member
- `GET /api/staff` - List staff
- `POST /api/schedules` - Create schedule template

### Admin-Only
- `POST /api/admin/business-approval` - Approve or suspend business
- `GET /api/admin/business-approval?status=pending` - List businesses by status
- `GET /api/admin/analytics` - System analytics (aggregation-based)

## Environment Variables

**Required:**
```env
MONGODB_URI=mongodb+srv://...
AUTH_SECRET=<64-char-random-string>
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
ADMIN_EMAILS=admin@example.com
```

**Optional:**
```env
AUTH_GOOGLE_ID=<google-oauth-id>
AUTH_GOOGLE_SECRET=<google-oauth-secret>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

See [.env.example](./.env.example) for complete template.

## Security Features

### Rate Limiting (In-Memory)
- OTP requests: 5 per 15 minutes per email
- Bookings: 10 per minute per IP
- Business registration: 3 per hour per IP
- General API: 100 per minute

### Input Validation
- All API inputs validated with Zod schemas
- HTML/XSS sanitization on user inputs
- Email format validation
- Slug format validation (alphanumeric + hyphens)

### Booking Protection
- Email OTP verification required
- Max 7 bookings per email per day per business
- Race condition prevention (conflict checking)
- Business must be APPROVED

### Data Privacy
- No permanent customer accounts
- Temporary verified users (24h TTL)
- OTP auto-expires (5 min TTL)
- Hashed email storage (SHA-256)

## MongoDB Indexes

**Critical indexes** (create after deployment):

```javascript
// TTL indexes (auto-cleanup)
db.otps.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 300 })
db.verifiedusers.createIndex({ "verifiedAt": 1 }, { expireAfterSeconds: 86400 })

// Performance indexes
db.businesses.createIndex({ "status": 1 })
db.businesses.createIndex({ "status": 1, "createdAt": -1 })
db.bookings.createIndex({ "businessId": 1, "startTime": 1 })
db.bookings.createIndex({ "customerId": 1 })
```

## Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Create MongoDB indexes (see above)
# Test OTP flow and business approval
```

### Production Checklist
- ✅ Set `NODE_ENV=production`
- ✅ Use strong `AUTH_SECRET` (64+ chars)
- ✅ Configure MongoDB Atlas (recommended)
- ✅ Set up Resend with verified domain
- ✅ Add admin emails to `ADMIN_EMAILS`
- ✅ Create MongoDB TTL indexes
- ✅ Test all critical flows

## Project Status

| Feature | Status |
|---------|--------|
| **Business Approval System** | ✅ Complete |
| **Email OTP Verification** | ✅ Complete |
| **Booking Limits** | ✅ Complete |
| **Rate Limiting** | ✅ Complete |
| **Input Sanitization** | ✅ Complete |
| **Admin Analytics** | ✅ Complete |
| **Dynamic Availability** | ✅ Complete |
| Public booking page | ✅ Complete |
| Email confirmations | ✅ Complete |
| Admin dashboard UI | ✅ Complete |
| Authentication | ✅ Complete |
| Booking API | ✅ Complete |
| Services API | ✅ Complete |
| Staff API | ⚠️ Partial |
| Schedules API | ⚠️ Partial |

## Architecture Decisions

### Why Mongoose + Native MongoDB?
- **Mongoose**: Better TypeScript support, schema validation
- **Native Client**: Required by NextAuth's MongoDBAdapter
- Both share same connection pool (no performance penalty)

### Why In-Memory Rate Limiting?
- No Redis dependency
- Sufficient for OTP/booking protection
- Simple deployment (no external services)
- For high scale, migrate to Upstash Redis

### Why No Customer Accounts?
- Privacy-friendly (GDPR compliant)
- Simpler UX (no passwords)
- Reduced database storage
- TTL indexes auto-cleanup

## Contributing

When adding new features:
1. Add Zod validation schema
2. Sanitize user inputs
3. Add rate limiting if sensitive
4. Use conditional logging (dev only)
5. Update documentation

## License

[Your License Here]

## Support

For detailed implementation notes, see:
- [SECURITY.md](./SECURITY.md) - Security implementation details
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Feature implementation guide

---

**Built with ❤️ using Next.js, MongoDB, and TypeScript**

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
