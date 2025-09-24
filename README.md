# Next.js + Supabase + Stripe Demo

A comprehensive demonstration of modern web development featuring Next.js App Router, Supabase with Row Level Security, Stripe integration, and automated reporting.

## 🚀 Features

### 1. Next.js App Router + Supabase (TypeScript)
- **Complete Database Schema**: Comprehensive schema with users, organizations, subscriptions, and more
- **Row Level Security (RLS)**: 1-2 RLS policies demonstrating data isolation
- **TypeScript Integration**: Full type safety with generated database types
- **Authentication**: Supabase Auth with automatic user creation

### 2. Stripe Checkout + Customer Portal
- **Trial Flow**: 14-day free trials for all plans
- **Webhook Handling**: Signature verification and idempotent database writes
- **Plan & Add-ons**: Multiple subscription tiers with optional add-ons
- **Customer Portal**: Self-service billing management

### 3. Auto-Report System
- **Weekly Email Reports**: Automated A4 PDF generation and email delivery
- **Scheduled Reports**: Automatic weekly reports every Monday at 9 AM via Vercel Cron
- **Idempotent Generation**: Prevents duplicate reports by account+period
- **PDF Generation**: Professional reports using jsPDF
- **Email Delivery**: Brevo integration for reliable email delivery

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe (Checkout, Webhooks, Customer Portal)
- **Email**: Brevo
- **PDF**: jsPDF
- **Validation**: Zod

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account
- Brevo account (for email)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd test-project
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp env.example .env.local
```

Fill in your environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Brevo
BREVO_API_KEY=your_brevo_api_key_here
FROM_EMAIL=reports@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Execute the SQL to create all tables, policies, and functions

### 4. Stripe Webhook Setup

1. In your Stripe dashboard, go to Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your `.env.local`

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── stripe/        # Stripe integration
│   │   └── reports/       # Report generation
│   ├── dashboard/         # User dashboard
│   ├── pricing/           # Stripe checkout
│   ├── reports/           # Report management
│   └── rls-demo/          # RLS demonstration
├── components/            # React components
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Supabase client setup
│   ├── stripe/           # Stripe configuration
│   └── reports/          # Report generation logic
└── database.types.ts     # Generated database types
```

## 🔐 Row Level Security (RLS)

The application demonstrates RLS with the following policies:

1. **Users**: Can only view/update their own profile
2. **Organizations**: Owners can manage, members can view
3. **Sensitive Data**: Users can only access data from organizations they're members of
4. **Subscriptions**: Users can only see their own subscription data

Visit `/rls-demo` to see RLS in action.

## 💳 Stripe Integration

### Features Demonstrated:
- **Checkout Sessions**: Create subscriptions with trials
- **Webhook Processing**: Idempotent event handling
- **Customer Portal**: Self-service billing management
- **Plan & Add-ons**: Multiple subscription tiers

### Plans Available:
- **Basic**: $10/month (14-day trial)
- **Pro**: $25/month (14-day trial)
- **Enterprise**: $50/month (14-day trial)

### Add-ons:
- **Extra Storage**: $5/month
- **Priority Support**: $10/month
- **Custom Branding**: $20/month

## 📊 Auto-Report System

### Features:
- **Weekly Reports**: Automated generation and email delivery
- **Scheduled Reports**: Automatic weekly reports every Monday at 9 AM
- **PDF Generation**: A4 format with professional styling
- **Idempotent**: Prevents duplicate reports by account+period
- **Email Delivery**: Brevo integration with HTML templates

### Scheduling Configuration:
- **Vercel Cron Jobs**: Automatic weekly reports via `vercel.json`
- **Schedule**: Every Monday at 9 AM UTC (`0 9 * * 1`)
- **Endpoint**: `/api/reports/schedule` processes all active subscribers
- **Manual Trigger**: `curl -X POST https://yourdomain.com/api/reports/schedule`

### Report Contents:
- User and organization information
- Usage metrics (projects, users, storage, API calls)
- Subscription details and add-ons
- Period coverage and generation timestamp

## 🧪 Testing

### RLS Demo
1. Sign up with different email addresses
2. Create test organizations and sensitive data
3. Verify that users can only see data they're authorized to access

### Stripe Integration
1. Use Stripe test cards for checkout
2. Test webhook retries to verify idempotency
3. Access customer portal to manage subscriptions

### Report Generation
1. Generate reports for different periods
2. Verify idempotent behavior (same period won't create duplicates)
3. Check email delivery and PDF generation

## 🔧 API Endpoints

### Stripe
- `POST /api/stripe/create-checkout-session` - Create checkout session
- `POST /api/stripe/create-portal-session` - Create customer portal session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

### Reports
- `POST /api/reports/generate` - Generate a new report
- `POST /api/reports/schedule` - Process scheduled reports (cron)
- `GET /api/reports/download/[reportId]` - Download report PDF

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `BREVO_API_KEY` | Brevo API key | Yes |
| `FROM_EMAIL` | Sender email address | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
- Ensure environment variables are set
- Update `NEXT_PUBLIC_APP_URL` to your domain
- Configure Stripe webhook URL to your domain

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Brevo Documentation](https://developers.brevo.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the environment variables are correctly set
2. Verify the database schema is properly applied
3. Ensure Stripe webhooks are configured correctly
4. Check the browser console and server logs for errors

For additional help, please open an issue in the repository.