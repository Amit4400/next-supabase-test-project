import { NextRequest, NextResponse } from 'next/server'
import { STRIPE_PLANS, STRIPE_ADDONS } from '@/lib/stripe/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      plans: STRIPE_PLANS,
      addons: STRIPE_ADDONS,
    })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}
