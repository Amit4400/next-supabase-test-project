import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklyReport } from '@/lib/reports/report-generator'
import { z } from 'zod'

const generateReportSchema = z.object({
  organizationId: z.string().optional(),
  periodStart: z.string(),
  periodEnd: z.string(),
  reportType: z.string().default('weekly'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, periodStart, periodEnd, reportType } = generateReportSchema.parse(body)

    const result = await generateWeeklyReport({
      userId: user.id,
      organizationId,
      periodStart,
      periodEnd,
      reportType,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating report:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
