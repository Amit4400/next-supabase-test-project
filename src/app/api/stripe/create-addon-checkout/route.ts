import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_ADDONS } from '@/lib/stripe/server'
import { z } from 'zod'

const addonCheckoutSchema = z.object({
  addonId: z.enum(['extra_storage', 'priority_support', 'custom_branding']),
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
    const { addonId, successUrl, cancelUrl } = addonCheckoutSchema.parse(body)

    // Get user's Stripe customer ID
    let { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    // If no customer exists, create one
    if (customerError || !customer) {
      console.log('No existing customer found, creating new one for user:', user.id)
      
      const stripeCustomer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: user.id,
        },
      })
      
      // Insert the new customer into our database
      const { error: insertError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          stripe_customer_id: stripeCustomer.id,
        })
      
      if (insertError) {
        console.error('Error inserting customer:', insertError)
        return NextResponse.json(
          { error: 'Failed to create customer record' },
          { status: 500 }
        )
      }
      
      customer = { stripe_customer_id: stripeCustomer.id }
    }

    const addon = STRIPE_ADDONS[addonId]

    // Create checkout session for add-on
    const session = await stripe.checkout.sessions.create({
      customer: customer.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [
        {
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
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId: user.id,
          addonId,
          type: 'addon',
        },
      },
      metadata: {
        userId: user.id,
        addonId,
        type: 'addon',
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating add-on checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
