import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  try {
    // Check if we've already processed this event (idempotency)
    const { data: existingEvent } = await supabase
      .from('stripe_webhook_events')
      .select('processed')
      .eq('stripe_event_id', event.id)
      .single()

    if (existingEvent?.processed) {
      console.log(`Event ${event.id} already processed, skipping`)
      return NextResponse.json({ received: true })
    }

    // Store the event for idempotency
    await supabase
      .from('stripe_webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        data: event.data.object,
      })

    // Process the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabase)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabase)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    await supabase
      .from('stripe_webhook_events')
      .update({ processed: true })
      .eq('stripe_event_id', event.id)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const customerId = subscription.customer as string
  const userId = subscription.metadata.userId

  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  // Get or create subscription record
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  const subscriptionData = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: subscription.status as any,
    current_period_start: subscription.start_date
      ? new Date(subscription.start_date * 1000).toISOString()
      : null,
    current_period_end: subscription.ended_at
      ? new Date(subscription.ended_at * 1000).toISOString()
      : null,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    plan_id: subscription.metadata.planId || 'unknown',
  }

  if (existingSubscription) {
    await supabase
      .from('subscriptions')
      .update(subscriptionData)
      .eq('stripe_subscription_id', subscription.id)
  } else {
    await supabase
      .from('subscriptions')
      .insert(subscriptionData)
  }

  // Handle add-ons
  const addons = JSON.parse(subscription.metadata.addons || '[]')
  
  // Clear existing add-ons
  await supabase
    .from('subscription_addons')
    .delete()
    .eq('subscription_id', existingSubscription?.id)

  // Add new add-ons
  if (addons.length > 0 && existingSubscription) {
    const addonData = addons.map((addonId: string) => ({
      subscription_id: existingSubscription.id,
      addon_id: addonId,
      quantity: 1,
    }))

    await supabase
      .from('subscription_addons')
      .insert(addonData)
  }

  console.log(`Processed subscription ${subscription.id} for user ${userId}`)
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id)

  console.log(`Marked subscription ${subscription.id} as canceled`)
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  if ((invoice as any).subscription) {
    const subscriptionId = typeof (invoice as any).subscription === 'string' 
      ? (invoice as any).subscription 
      : (invoice as any).subscription.id
    
    await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('stripe_subscription_id', subscriptionId)
  }

  console.log(`Payment succeeded for invoice ${invoice.id}`)
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  if ((invoice as any).subscription) {
    const subscriptionId = typeof (invoice as any).subscription === 'string' 
      ? (invoice as any).subscription 
      : (invoice as any).subscription.id
    
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', subscriptionId)
  }

  console.log(`Payment failed for invoice ${invoice.id}`)
}
