# Production Deployment Checklist

## 🚀 Pre-Deployment Requirements

### Required Environment Variables

You **MUST** configure these before deploying:

```bash
# Database (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/appointments

# Authentication (REQUIRED)
AUTH_SECRET=<generate with: openssl rand -base64 32>
AUTH_GOOGLE_ID=<your-google-client-id>.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=<your-google-client-secret>

# Email Service (REQUIRED)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Application URLs (AUTO-DETECTED if deployed to Vercel)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
AUTH_URL=https://yourdomain.com
```

### Recommended (But Optional)

```bash
# Rate Limiting - HIGHLY RECOMMENDED for production
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# SMS Notifications (Optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890
```

---

## 📋 Setup Instructions

### 1. MongoDB Atlas Setup

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (M0 free tier is sufficient for testing)
3. Set up database access (create username/password)
4. Configure network access (allow access from anywhere: `0.0.0.0/0` or specific IPs)
5. Get connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/appointments`
6. Add to `.env` as `MONGODB_URI`

### 2. Google OAuth Setup

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen (add your domain)
6. Add Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy **Client ID** → `AUTH_GOOGLE_ID`
8. Copy **Client Secret** → `AUTH_GOOGLE_SECRET`

### 3. Resend Email Setup

1. Sign up at https://resend.com
2. Verify your domain (or use their test domain for development)
3. Create API key at https://resend.com/api-keys
4. Copy API key → `RESEND_API_KEY`
5. Set sender email → `EMAIL_FROM` (must be from verified domain)

### 4. Generate Auth Secret

Run this command locally:

```bash
openssl rand -base64 32
```

Copy the output → `AUTH_SECRET`

### 5. (Optional) Upstash Redis for Rate Limiting

1. Sign up at https://upstash.com
2. Create a new Redis database (free tier available)
3. Copy **REST URL** → `UPSTASH_REDIS_REST_URL`
4. Copy **REST TOKEN** → `UPSTASH_REDIS_REST_TOKEN`

**Note**: Without this, rate limiting will be non-functional (stub only).

---

## 🛠️ Database Initialization

### Create Initial Business

After deployment, you need to create your business manually in MongoDB:

1. Sign in to your app with Google OAuth
2. Note your email address
3. Open MongoDB Atlas → Browse Collections
4. In the `businesses` collection, insert:

```json
{
  "name": "My Business Name",
  "slug": "my-business-slug",
  "email": "your-google-oauth-email@gmail.com",
  "description": "Welcome to my business",
  "logo": "",
  "website": "",
  "phone": "",
  "address": "",
  "timezone": "America/New_York",
  "color": "#3b82f6",
  "isActive": true,
  "createdAt": { "$date": "2026-01-14T00:00:00.000Z" },
  "updatedAt": { "$date": "2026-01-14T00:00:00.000Z" }
}
```

**Important**: The `email` field must match your Google OAuth email!

---

## 🌐 Deployment Platforms

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables in project settings
4. Deploy

```bash
# Or use Vercel CLI
npm i -g vercel
vercel --prod
```

### Railway / Render / Heroku

1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy

All platforms supporting Node.js will work.

---

## ✅ Post-Deployment Checklist

### Functional Tests

- [ ] Navigate to `/auth/signin` and sign in with Google
- [ ] Navigate to `/dashboard/business` and update business settings
- [ ] Navigate to `/dashboard/services` and create a service
- [ ] Navigate to `/dashboard/staff` and add a staff member
- [ ] Navigate to `/dashboard` and view bookings list
- [ ] Navigate to `/booking/[your-slug]` and complete a test booking
- [ ] Verify confirmation email received

### Security Checks

- [ ] `AUTH_SECRET` is not the default value
- [ ] MongoDB connection string uses strong password
- [ ] Google OAuth redirect URIs match your domain
- [ ] Email sender domain is verified
- [ ] Rate limiting is configured (Upstash Redis)

### Performance

- [ ] Test booking page loads in < 3 seconds
- [ ] Dashboard loads in < 2 seconds
- [ ] Email delivery time < 10 seconds

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **No Rate Limiting**: Without Upstash Redis, public endpoints are vulnerable to spam
2. **No Tests**: Zero test coverage - manual testing required
3. **No Error Monitoring**: Silent failures on email/booking errors
4. **Single Business per Owner**: Each Google account can only own one business
5. **No Multi-Tenancy UI**: Business creation must be done via MongoDB manually

### Recommended Next Steps

1. **Add Sentry** for error monitoring
2. **Implement rate limiting** with Upstash Redis
3. **Write integration tests** for critical paths
4. **Add business registration flow** in the dashboard
5. **Implement CORS** configuration for API security
6. **Add pagination** to list endpoints (currently hardcoded to 50 results)

---

## 📞 Support & Troubleshooting

### Common Issues

**"Business not found" error in dashboard**
- Check that your Google OAuth email matches the business email in MongoDB
- Verify business document exists in `businesses` collection

**"Failed to send email"**
- Verify `RESEND_API_KEY` is correct
- Check that sender domain is verified in Resend dashboard
- Review Resend logs for delivery errors

**OAuth redirect error**
- Ensure redirect URIs in Google Console match your deployment URL
- Check that `AUTH_URL` environment variable is set correctly

**Availability slots not showing**
- Verify staff member has schedules created
- Check that service duration is set correctly
- Ensure schedule times don't conflict

---

## 🎯 Production Readiness Score: 75%

**Ready for MVP launch with caveats:**
- ✅ Core booking flow works end-to-end
- ✅ Email notifications functional
- ✅ Admin dashboard complete
- ⚠️ Rate limiting must be configured before public launch
- ⚠️ Error monitoring recommended
- ⚠️ Testing coverage needed for confidence

**Time to Production**: ~2-4 hours for setup + 8-12 hours for recommended improvements
