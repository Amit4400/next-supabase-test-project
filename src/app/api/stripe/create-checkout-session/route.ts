import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PLANS, STRIPE_ADDONS } from '@/lib/stripe/server'
import { z } from 'zod'

const checkoutSchema = z.object({
  planId: z.enum(['basic', 'pro', 'enterprise']),
  addons: z.array(z.enum(['extra_storage', 'priority_support', 'custom_branding'])).optional(),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, addons = [], successUrl, cancelUrl } = checkoutSchema.parse(body)

    const plan = STRIPE_PLANS[planId]
    
    // Get or create Stripe customer
    let stripeCustomerId: string
    
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: user.id,
        },
      })
      
      stripeCustomerId = customer.id
      
      await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          stripe_customer_id: customer.id,
        })
    }

    // Create price items for checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.features.join(', '),
          },
          unit_amount: plan.price,
          recurring: {
            interval: plan.interval,
          },
        },
        quantity: 1,
      },
    ]

    // Add add-ons
    for (const addonId of addons) {
      const addon = STRIPE_ADDONS[addonId]
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: addon.name,
            description: addon.description,
          },
          unit_amount: addon.price,
          recurring: {
            interval: addon.interval,
          },
        },
        quantity: 1,
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      subscription_data: {
        trial_period_days: plan.trial_days,
        metadata: {
          userId: user.id,
          planId,
          addons: JSON.stringify(addons),
        },
      },
      metadata: {
        userId: user.id,
        planId,
        addons: JSON.stringify(addons),
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
