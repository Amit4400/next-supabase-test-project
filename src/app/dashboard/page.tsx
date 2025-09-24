'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type Subscription = Database['public']['Tables']['subscriptions']['Row']
type SubscriptionAddon = Database['public']['Tables']['subscription_addons']['Row']

export default function DashboardPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [addons, setAddons] = useState<SubscriptionAddon[]>([])
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  const loadSubscriptionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get main subscription (any status)
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (sub) {
        setSubscription(sub)

        const { data: addonData } = await supabase
          .from('subscription_addons')
          .select('*')
          .eq('subscription_id', sub.id)

        setAddons(addonData || [])
      } else {
        // Check for standalone add-ons (add-ons without main subscription)
        const { data: addonData } = await supabase
          .from('subscription_addons')
          .select(`
            *,
            subscriptions!inner(*)
          `)
          .eq('subscriptions.user_id', user.id)

        if (addonData && addonData.length > 0) {
          // Create a virtual subscription for standalone add-ons
          setSubscription({
            id: 'standalone-addons',
            user_id: user.id,
            stripe_subscription_id: 'standalone',
            stripe_customer_id: addonData[0].subscriptions.stripe_customer_id || '',
            plan_id: 'addons-only',
            status: 'active' as const,
            current_period_start: addonData[0].subscriptions.current_period_start,
            current_period_end: addonData[0].subscriptions.current_period_end,
            trial_start: null,
            trial_end: null,
            created_at: addonData[0].subscriptions.created_at,
            updated_at: addonData[0].subscriptions.updated_at
          })
          setAddons(addonData.map(item => ({
            id: item.id,
            subscription_id: item.subscription_id,
            addon_id: item.addon_id,
            quantity: item.quantity,
            created_at: item.created_at,
            updated_at: item.updated_at
          })))
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCustomerPortal = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
    } finally {
      setPortalLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'trialing':
        return 'bg-blue-100 text-blue-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage your subscription and billing</p>
        </div>

        {!subscription ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No Active Subscription
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have an active subscription. Choose a plan to get started.
            </p>
            <a
              href="/pricing"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View Pricing Plans
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Subscription Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Subscription Details
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Plan</h3>
                  <p className="text-gray-600 capitalize">
                    {subscription.plan_id === 'addons-only' ? 'Add-ons Only' : 
                     subscription.plan_id === 'extra_storage' ? 'Extra Storage' :
                     subscription.plan_id === 'premium_support' ? 'Premium Support' :
                     subscription.plan_id === 'advanced_analytics' ? 'Advanced Analytics' :
                     subscription.plan_id}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Current Period</h3>
                  <p className="text-gray-600">
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </p>
                </div>

                {subscription.trial_end && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Trial Ends</h3>
                    <p className="text-gray-600">{formatDate(subscription.trial_end)}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Stripe Subscription ID</h3>
                  <p className="text-gray-600 font-mono text-sm">
                    {subscription.stripe_subscription_id === 'standalone' ? 'Multiple Add-ons' : subscription.stripe_subscription_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Add-ons */}
            {addons.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Add-ons</h2>
                <div className="space-y-3">
                  {addons.map((addon) => (
                    <div key={addon.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 capitalize">
                          {addon.addon_id.replace('_', ' ')}
                        </h3>
                        <p className="text-sm text-gray-600">Quantity: {addon.quantity}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        Added {formatDate(addon.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Manage Subscription</h2>
              <p className="text-gray-600 mb-6">
                Update your payment method, view invoices, or cancel your subscription.
              </p>
              <button
                onClick={openCustomerPortal}
                disabled={portalLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {portalLoading ? 'Opening...' : 'Open Customer Portal'}
              </button>
            </div>

            {/* Webhook Events Demo */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Webhook Events</h2>
              <p className="text-gray-600 mb-4">
                This section shows how Stripe webhooks are processed with idempotency.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">How it works:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Each webhook event is stored in the database with a unique ID</li>
                  <li>• If the same event is received twice, it's processed only once</li>
                  <li>• This prevents duplicate charges and data inconsistencies</li>
                  <li>• Check the stripe_webhook_events table to see processed events</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
