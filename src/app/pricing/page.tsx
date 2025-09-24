'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Plan {
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  trial_days: number
}

interface Addon {
  name: string
  price: number
  interval: 'month' | 'year'
  description: string
}

interface PlansData {
  plans: Record<string, Plan>
  addons: Record<string, Addon>
}

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'enterprise'>('pro')
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [plansData, setPlansData] = useState<PlansData | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasActiveSubscription: boolean
    subscription: any
  } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plans
        const plansResponse = await fetch('/api/plans')
        const plansData = await plansResponse.json()
        setPlansData(plansData)

        // Fetch subscription status
        const subscriptionResponse = await fetch('/api/subscription/status')
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json()
          setSubscriptionStatus(subscriptionData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const handleCheckout = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          addons: selectedAddons,
        }),
      })

      const { sessionId } = await response.json()

      const stripe = await stripePromise
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          console.error('Error:', error)
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBillingPortal = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong!')
    } finally {
      setLoading(false)
    }
  }

  const handleAddonCheckout = async (addonId: string) => {
    setLoading(true)

    try {
      const response = await fetch('/api/stripe/create-addon-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addonId,
        }),
      })

      const { sessionId } = await response.json()

      const stripe = await stripePromise
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          console.error('Error:', error)
        }
      }
    } catch (error) {
      console.error('Error creating add-on checkout session:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    )
  }

  const calculateTotal = () => {
    if (!plansData) return 0

    const planPrice = plansData.plans[selectedPlan].price
    const addonPrice = selectedAddons.reduce((total, addonId) => {
      return total + plansData.addons[addonId].price
    }, 0)
    return planPrice + addonPrice
  }

  if (!plansData || subscriptionStatus === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    )
  }

  // Show different UI for existing subscribers
  if (subscriptionStatus.hasActiveSubscription) {
    const subscription = subscriptionStatus.subscription
    console.log(subscription);
    const currentPlan = plansData.plans[subscription.plan_id] ||
      plansData.addons[subscription.plan_id] ||
    {
      name: subscription.plan_id === 'extra_storage' ? 'Extra Storage' :
        subscription.plan_id === 'premium_support' ? 'Premium Support' :
          subscription.plan_id === 'advanced_analytics' ? 'Advanced Analytics' :
            subscription.plan_id
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Your Subscription
            </h1>
            <p className="text-xl text-gray-600">
              You already have an active subscription
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Current Plan: {currentPlan.name}
              </h2>
              <p className="text-gray-600">
                Status: <span className="capitalize font-medium text-green-600">{subscription.status}</span>
              </p>
              {subscription.current_period_end && (
                <p className="text-sm text-gray-500 mt-2">
                  Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>

            {subscription.subscription_addons && subscription.subscription_addons.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Add-ons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subscription.subscription_addons.map((addon: any) => (
                    <div key={addon.id} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">{addon.addon_id}</h4>
                      <p className="text-sm text-gray-600">Quantity: {addon.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleBillingPortal}
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Manage Billing'}
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Update your subscription, payment method, or view billing history
              </p>
            </div>
          </div>

          {/* Available Add-ons Section */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Available Add-ons</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(plansData.addons).map(([addonId, addon]) => {
                const isAlreadyActive = subscription.subscription_addons?.some(
                  (activeAddon: any) => activeAddon.addon_id === addonId
                )

                return (
                  <div
                    key={addonId}
                    className={`border-2 rounded-lg p-6 ${isAlreadyActive
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {addon.name}
                      </h3>
                      <p className="text-gray-600 mb-4">{addon.description}</p>
                      <div className="text-2xl font-bold text-gray-900 mb-4">
                        ${(addon.price / 100).toFixed(2)}
                        <span className="text-sm font-normal text-gray-500">/{addon.interval}</span>
                      </div>

                      {isAlreadyActive ? (
                        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
                          ✓ Already Active
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddonCheckout(addonId)}
                          disabled={loading}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Processing...' : 'Add to Subscription'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Start with a 14-day free trial. Cancel anytime.
          </p>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plansData && Object.entries(plansData.plans).map(([planId, plan]) => (
            <div
              key={planId}
              className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${selectedPlan === planId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              onClick={() => setSelectedPlan(planId as any)}
            >
              {selectedPlan === planId && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Selected
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${(plan.price / 100).toFixed(0)}
                </span>
                <span className="text-gray-600">/{plan.interval}</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="text-sm text-blue-600 font-medium">
                {plan.trial_days}-day free trial
              </div>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add-ons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plansData && Object.entries(plansData.addons).map(([addonId, addon]) => (
              <div
                key={addonId}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedAddons.includes(addonId)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => toggleAddon(addonId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{addon.name}</h3>
                  <span className="text-lg font-bold text-gray-900">
                    +${(addon.price / 100).toFixed(0)}/{addon.interval}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{addon.description}</p>
                {selectedAddons.includes(addonId) && (
                  <div className="mt-2 text-sm text-blue-600 font-medium">
                    ✓ Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total and Checkout */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Total</h2>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                ${(calculateTotal() / 100).toFixed(0)}
                <span className="text-lg text-gray-600">/month</span>
              </div>
              <div className="text-sm text-gray-600">After 14-day free trial</div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Start Free Trial'}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            You'll be redirected to Stripe to complete your subscription.
            Cancel anytime during your trial.
          </p>
        </div>
      </div>
    </div>
  )
}
