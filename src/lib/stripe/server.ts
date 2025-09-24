import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

export const STRIPE_PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 1000, // $10.00
    interval: 'month' as const,
    features: ['Up to 5 projects', 'Basic support', '1GB storage'],
    trial_days: 14,
  },
  pro: {
    name: 'Pro Plan',
    price: 2500, // $25.00
    interval: 'month' as const,
    features: ['Unlimited projects', 'Priority support', '10GB storage', 'Advanced analytics'],
    trial_days: 14,
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 5000, // $50.00
    interval: 'month' as const,
    features: ['Everything in Pro', 'Custom integrations', '100GB storage', 'Dedicated support'],
    trial_days: 14,
  },
} as const

export const STRIPE_ADDONS = {
  extra_storage: {
    name: 'Extra Storage',
    price: 500, // $5.00
    interval: 'month' as const,
    description: 'Additional 10GB of storage',
  },
  priority_support: {
    name: 'Priority Support',
    price: 1000, // $10.00
    interval: 'month' as const,
    description: '24/7 priority support',
  },
  custom_branding: {
    name: 'Custom Branding',
    price: 2000, // $20.00
    interval: 'month' as const,
    description: 'Remove branding and add your own',
  },
} as const

export type PlanId = keyof typeof STRIPE_PLANS
export type AddonId = keyof typeof STRIPE_ADDONS
