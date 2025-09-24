import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      const { data: insertData, error: insertError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          stripe_customer_id: stripeCustomer.id,
        })
        .select()
      
      if (insertError) {
        console.error('Error inserting customer:', insertError)
        console.error('User ID:', user.id)
        console.error('Stripe Customer ID:', stripeCustomer.id)
        console.error('Insert data:', insertData)
        return NextResponse.json(
          { error: 'Failed to create customer record', details: insertError.message },
          { status: 500 }
        )
      }
      
      console.log('Successfully created customer record:', insertData)
      
      customer = { stripe_customer_id: stripeCustomer.id }
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
