import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReportPDF } from '@/lib/reports/pdf-generator'
import { gatherReportData } from '@/lib/reports/report-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get report details
    const { data: report, error: reportError } = await supabase
      .from('auto_reports')
      .select('*')
      .eq('id', params.reportId)
      .eq('user_id', user.id) // Ensure user can only access their own reports
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.status !== 'generated') {
      return NextResponse.json({ error: 'Report not ready' }, { status: 400 })
    }

    // Regenerate the PDF (in production, you'd serve from storage)
    const reportData = await gatherReportData({
      userId: user.id,
      organizationId: report.organization_id || undefined,
      periodStart: report.period_start,
      periodEnd: report.period_end,
      reportType: report.report_type,
    }, supabase)

    const pdfBuffer = generateReportPDF(reportData)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${params.reportId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error downloading report:', error)
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    )
  }
}
