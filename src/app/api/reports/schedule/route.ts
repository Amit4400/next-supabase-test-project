import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateWeeklyReport } from '@/lib/reports/report-generator'

export async function POST(request: NextRequest) {
  try {
    // This endpoint would typically be called by a cron job or scheduler
    // For demo purposes, we'll generate reports for all active users
    
    const supabase = await createServiceClient()
    
    // Get all users with active subscriptions
    const { data: users, error } = await supabase
      .from('subscriptions')
      .select(`
        user_id,
        users!inner(*)
      `)
      .eq('status', 'active')
      .or('status.eq.trialing')

    if (error) throw error

    const results = []
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const periodStart = weekAgo.toISOString().split('T')[0]
    const periodEnd = now.toISOString().split('T')[0]

    for (const subscription of users || []) {
      try {
        const result = await generateWeeklyReport({
          userId: subscription.user_id,
          periodStart,
          periodEnd,
          reportType: 'weekly',
        })
        
        results.push({
          userId: subscription.user_id,
          success: true,
          reportId: result.reportId,
        })
      } catch (error) {
        console.error(`Failed to generate report for user ${subscription.user_id}:`, error)
        results.push({
          userId: subscription.user_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} users`,
      results,
      period: { start: periodStart, end: periodEnd },
    })
  } catch (error) {
    console.error('Error in scheduled report generation:', error)
    return NextResponse.json(
      { error: 'Failed to process scheduled reports' },
      { status: 500 }
    )
  }
}
