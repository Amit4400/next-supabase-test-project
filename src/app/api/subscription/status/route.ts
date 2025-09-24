import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription (any status)
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_addons(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subscriptionError)
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    // If no main subscription, check for standalone add-ons
    if (!subscription) {
      const { data: addonData, error: addonError } = await supabase
        .from('subscription_addons')
        .select(`
          *,
          subscriptions!inner(*)
        `)
        .eq('subscriptions.user_id', user.id)

      if (addonError) {
        console.error('Error fetching add-ons:', addonError)
        return NextResponse.json(
          { error: 'Failed to fetch add-ons' },
          { status: 500 }
        )
      }

      if (addonData && addonData.length > 0) {
        // Create a virtual subscription for standalone add-ons
        const virtualSubscription = {
          id: 'standalone-addons',
          user_id: user.id,
          plan_id: 'addons-only',
          status: 'active',
          stripe_subscription_id: 'standalone',
          current_period_start: addonData[0].subscriptions.current_period_start,
          current_period_end: addonData[0].subscriptions.current_period_end,
          trial_end: null,
          created_at: addonData[0].subscriptions.created_at,
          updated_at: addonData[0].subscriptions.updated_at,
          subscription_addons: addonData.map(item => ({
            id: item.id,
            subscription_id: item.subscription_id,
            addon_id: item.addon_id,
            quantity: item.quantity,
            created_at: item.created_at,
            updated_at: item.updated_at
          }))
        }

        return NextResponse.json({
          hasActiveSubscription: true,
          subscription: virtualSubscription,
        })
      }
    }

    return NextResponse.json({
      hasActiveSubscription: !!subscription,
      subscription: subscription || null,
    })
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    )
  }
}
