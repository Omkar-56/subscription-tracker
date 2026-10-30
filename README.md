# Subtrack

Subtrack is a modern, personal subscription and recurring-bill tracker that helps you stay on top of recurring expenses, detect silent price hikes, track free trial deadlines, and forecast your monthly commitments.

---

## Key Features

- **Centralized Ledger**: Manage all your recurring expenses across weekly, monthly, quarterly, and yearly billing cycles with multi-currency conversion.
- **Visual Analytics**: Interactive spend breakdowns across 7 core categories, 12-month spend trends, and a 12-month future renewal forecast.
- **Price-Hike Sentinel**: Automatically detects when subscription rates increase and highlights affected services.
- **Free Trial Guard**: Track trial cancellation deadlines with step-by-step cancellation instructions and reminders before trial charges land.
- **AI Receipt & Invoice Parser**: Upload receipts, invoices, or screenshots (PDF, images, text) to automatically detect and log subscriptions powered by Google Gemini.
- **Automated Email Reminders**: Receive automated Gmail notifications 1–3 days before upcoming renewals or trial deadlines.
- **Authentication**: Secure sign-in with Email & Password or Google OAuth.

---

## Core Categories

Subscriptions are organized into 7 clear categories:
1. **Entertainment** (Streaming video, music, TV)
2. **Software / AI** (Developer tools, SaaS, cloud infrastructure, AI services)
3. **Gaming** (Consoles, game passes, gaming subscriptions)
4. **News and Media** (Publications, magazines, newsletters)
5. **Education** (Courses, learning platforms, academic services)
6. **Health & Fitness** (Gyms, wellness, fitness trackers)
7. **Other** (Utilities, miscellaneous services)

---

## Tech Stack

- **Frontend**: React 19, Next.js, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, PostgreSQL, JWT Authentication
- **AI Integration**: Google Gemini API
- **Email Service**: Nodemailer (Gmail SMTP)
- **Deployment**: Cloudflare Workers (Full Stack: Next.js Static Assets + Express API Worker + Cron Trigger)

---

## Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env     # Configure DATABASE_URL, JWT_SECRET, etc.
npm install
npm run migrate          # Initializes schema & migrations
npm run dev              # Runs on http://localhost:4000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev              # Runs on http://localhost:3000
```

---

## Cloudflare Workers Deployment

This application is configured as a full-stack Cloudflare Worker using **Cloudflare Workers Static Assets** (for Next.js frontend delivery at the edge) and **Node.js compatibility (`nodejs_compat`)** for the Express backend API and scheduled cron reminders.

### Step 1: Install Wrangler & Log In
```bash
npm install
npx wrangler login
```

### Step 2: Configure Environment Variables & Secrets
Set your production secrets directly in Cloudflare Workers using Wrangler:
```bash
# Database connection string (e.g. Supabase, Neon, or Cloudflare Hyperdrive)
npx wrangler secret put DATABASE_URL

# Auth Secret
npx wrangler secret put JWT_SECRET

# Google Gemini API Key (for receipt parsing)
npx wrangler secret put GEMINI_API_KEY

# Email Notification Secrets (Nodemailer / Gmail)
npx wrangler secret put SMTP_USER
npx wrangler secret put SMTP_PASS
npx wrangler secret put EMAIL_FROM

# Optional secrets
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put CRON_SECRET
```

### Step 3: Run Database Migrations
Before first run, apply the database schema to your hosted PostgreSQL database (e.g. Supabase / Neon):
```bash
npm run migrate
```
*(Note: Ensure your `DATABASE_URL` is set in `backend/.env` or passed via environment variable when running migrations).*

### Step 4: Build and Deploy to Cloudflare Workers
Build the frontend static export and deploy both the assets and the API Worker with one command:
```bash
npm run deploy
```

Once deployed, Cloudflare will output your live URL (e.g. `https://subtrack.<your-subdomain>.workers.dev`).

### Local Worker Preview
To preview the full-stack worker and static assets locally using Wrangler:
```bash
# Copy and populate .dev.vars for local secrets
cp .dev.vars.example .dev.vars

# Run full-stack worker preview
npm run preview
```
