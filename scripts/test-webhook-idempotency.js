/**
 * Test script to demonstrate Stripe webhook idempotency
 * 
 * This script simulates receiving the same webhook event multiple times
 * to show that the system handles it idempotently (no duplicate processing)
 * 
 * Usage: node scripts/test-webhook-idempotency.js
 */

const crypto = require('crypto')

// Mock webhook event data
const mockEvent = {
  id: 'evt_test_webhook',
  type: 'customer.subscription.created',
  data: {
    object: {
      id: 'sub_test_123',
      customer: 'cus_test_123',
      status: 'trialing',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      trial_start: Math.floor(Date.now() / 1000),
      trial_end: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60),
      metadata: {
        userId: 'user_test_123',
        planId: 'pro',
        addons: '["extra_storage"]'
      }
    }
  }
}

// Create webhook signature
function createSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')
}

async function testWebhookIdempotency() {
  const webhookUrl = 'http://localhost:3000/api/stripe/webhook'
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret'
  const payload = JSON.stringify(mockEvent)
  const signature = createSignature(payload, webhookSecret)
  
  const headers = {
    'Content-Type': 'application/json',
    'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=${signature}`
  }

  console.log('🧪 Testing Stripe Webhook Idempotency')
  console.log('=====================================')
  console.log(`Event ID: ${mockEvent.id}`)
  console.log(`Event Type: ${mockEvent.type}`)
  console.log(`Webhook URL: ${webhookUrl}`)
  console.log('')

  // Send the same webhook event multiple times
  for (let i = 1; i <= 3; i++) {
    console.log(`📤 Sending webhook event #${i}...`)
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: payload
      })

      const result = await response.text()
      
      if (response.ok) {
        console.log(`✅ Event #${i} processed successfully`)
        console.log(`   Response: ${result}`)
      } else {
        console.log(`❌ Event #${i} failed with status ${response.status}`)
        console.log(`   Error: ${result}`)
      }
    } catch (error) {
      console.log(`❌ Event #${i} failed with error: ${error.message}`)
    }
    
    console.log('')
    
    // Wait a bit between requests
    if (i < 3) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log('🔍 Expected Behavior:')
  console.log('- First event should be processed normally')
  console.log('- Subsequent events should be recognized as duplicates')
  console.log('- No duplicate database records should be created')
  console.log('- Each event should return success (idempotent)')
  console.log('')
  console.log('💡 Check your database to verify:')
  console.log('- stripe_webhook_events table should have one record')
  console.log('- subscriptions table should have one record')
  console.log('- subscription_addons table should have one record')
}

// Run the test
if (require.main === module) {
  testWebhookIdempotency().catch(console.error)
}

module.exports = { testWebhookIdempotency }
