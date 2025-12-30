# Slotify Backend API

RESTful API for Slotify - Multi-tenant Appointment Booking Platform

## 🚀 Features

- ✅ JWT Authentication with refresh tokens
- ✅ Google OAuth 2.0 integration
- ✅ Multi-tenancy architecture
- ✅ Email verification & password reset
- ✅ Business onboarding workflow
- ✅ Service & staff management
- ✅ Advanced appointment booking with availability calculator
- ✅ Appointment cancellation & rescheduling
- ✅ Automated email reminders (24h & 2h before)
- ✅ In-app notifications
- ✅ Image upload with Cloudinary
- ✅ Rate limiting for security

## 📋 Prerequisites

- Node.js v16+ and npm
- MongoDB Atlas account (free tier)
- Gmail account for SMTP
- Google OAuth credentials
- Cloudinary account (free tier)

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Create `.env` file in the backend directory:

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/slotify?retryWrites=true&w=majority

# JWT Secrets (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_ACCESS_SECRET=your_super_secret_access_token_key_min_32_characters
JWT_REFRESH_SECRET=your_super_secret_refresh_token_key_min_32_characters

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=Slotify <noreply@slotify.com>

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend
FRONTEND_URL=http://localhost:3000

# Session
SESSION_SECRET=your_session_secret_min_32_characters
```

### 3. Setup External Services

#### MongoDB Atlas

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Whitelist IP address (0.0.0.0/0 for development)
5. Get connection string

#### Gmail SMTP

1. Enable 2-factor authentication on your Gmail account
2. Generate app-specific password at https://myaccount.google.com/apppasswords
3. Use this password in EMAIL_PASSWORD

#### Google OAuth

1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins: http://localhost:5000, http://localhost:3000
6. Add authorized redirect: http://localhost:5000/api/auth/google/callback

#### Cloudinary

1. Create account at https://cloudinary.com
2. Get cloud name, API key, and API secret from dashboard

## 🏃 Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server will run on http://localhost:5000

## 📡 API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /google` - Google OAuth login
- `GET /google/callback` - Google OAuth callback
- `GET /verify-email/:token` - Verify email
- `POST /resend-verification` - Resend verification email
- `POST /forgot-password` - Request password reset
- `POST /reset-password/:token` - Reset password
- `POST /change-password` - Change password (auth required)
- `POST /refresh-token` - Refresh access token
- `POST /logout` - Logout (auth required)
- `GET /me` - Get current user (auth required)
- `GET /check-email` - Check email availability

### Users (`/api/users`)

- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `PUT /settings` - Update notification preferences
- `DELETE /account` - Delete account

### Business (`/api/business`)

- `POST /` - Create business (admin)
- `GET /:id` - Get business by ID
- `GET /slug/:slug` - Get business by slug (public)
- `PUT /:id` - Update business (admin)
- `POST /:id/images` - Upload business images (admin)
- `PUT /:id/hours` - Update working hours (admin)
- `PUT /:id/holidays` - Update holidays (admin)
- `PUT /:id/settings` - Update booking settings (admin)
- `PUT /:id/onboarding` - Update onboarding step (admin)
- `GET /category/:category` - Get businesses by category (public)

### Services (`/api/services`)

- `POST /` - Create service (admin)
- `GET /` - Get services (filter by businessId)
- `GET /:id` - Get service by ID
- `PUT /:id` - Update service (admin)
- `PATCH /:id/toggle` - Toggle active status (admin)
- `DELETE /:id` - Delete service (admin)

### Staff (`/api/staff`)

- `POST /` - Add staff member (admin)
- `GET /` - Get staff members
- `GET /:id` - Get staff by ID
- `PUT /:id` - Update staff (admin)
- `PUT /:id/availability` - Update availability (staff/admin)
- `PUT /:id/services` - Assign services (admin)
- `DELETE /:id` - Remove staff (admin)
- `GET /:id/schedule` - Get staff schedule

### Appointments (`/api/appointments`)

- `POST /` - Create appointment
- `GET /` - Get appointments (with filters)
- `GET /:id` - Get appointment by ID
- `POST /:id/cancel` - Cancel appointment
- `POST /:id/reschedule` - Reschedule appointment
- `GET /available-slots` - Get available time slots (public)
- `POST /:id/complete` - Mark as completed (staff/admin)
- `POST /:id/no-show` - Mark as no-show (admin)

### Notifications (`/api/notifications`)

- `GET /` - Get notifications
- `PUT /:id/read` - Mark as read
- `PUT /read-all` - Mark all as read
- `DELETE /:id` - Delete notification

## 🔒 Authentication

Protected routes require JWT token in Authorization header:

```
Authorization: Bearer <your_access_token>
```

Or in cookies as `accessToken`.

## 🏗️ Project Structure

```
backend/
├── config/
│   ├── database.js         # MongoDB connection
│   ├── cloudinary.js       # Cloudinary setup
│   └── passport.js         # Google OAuth config
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── businessController.js
│   ├── serviceController.js
│   ├── staffController.js
│   ├── appointmentController.js
│   └── notificationController.js
├── middleware/
│   ├── auth.js                      # JWT verification
│   ├── validateBusinessAccess.js    # Multi-tenancy
│   ├── errorHandler.js              # Global error handler
│   └── upload.js                    # Multer config
├── models/
│   ├── User.js
│   ├── Business.js
│   ├── Service.js
│   ├── Staff.js
│   ├── Appointment.js
│   └── Notification.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── businessRoutes.js
│   ├── serviceRoutes.js
│   ├── staffRoutes.js
│   ├── appointmentRoutes.js
│   └── notificationRoutes.js
├── utils/
│   ├── tokenService.js              # JWT generation
│   ├── emailService.js              # Email templates
│   ├── availabilityCalculator.js   # Slot calculator
│   ├── reminderScheduler.js        # Cron jobs
│   └── validators.js                # Input validation
├── .env
├── .gitignore
├── package.json
└── server.js                        # Entry point
```

## 🧪 Testing

Test API endpoints with:

- Postman
- Thunder Client (VS Code extension)
- cURL

Import Postman collection (to be created) for pre-configured requests.

## 🚢 Deployment

### Render.com (Recommended - Free Tier)

1. Push code to GitHub
2. Create account on Render.com
3. Create new Web Service
4. Connect GitHub repository
5. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables from .env
7. Deploy!

### Environment Variables for Production

Update these in production:

- `NODE_ENV=production`
- `MONGODB_URI` - Production MongoDB URL
- `FRONTEND_URL` - Production frontend URL
- `GOOGLE_CALLBACK_URL` - Production callback URL
- All secrets should be regenerated

## 📝 Notes

- Rate limiting is enabled on auth endpoints
- Reminder scheduler runs automatically on server start
- Images are stored on Cloudinary (not local filesystem)
- All business data is filtered by businessId (multi-tenancy)
- Passwords are hashed with bcrypt (salt rounds: 10)
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days

## 🐛 Troubleshooting

**MongoDB connection failed:**

- Check connection string format
- Verify IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

**Email not sending:**

- Verify Gmail app password (not regular password)
- Check firewall isn't blocking SMTP port 587
- Ensure 2FA is enabled on Gmail account

**Google OAuth not working:**

- Verify authorized origins and redirects in Google Console
- Check client ID and secret are correct
- Ensure Google+ API is enabled

## 📄 License

MIT
