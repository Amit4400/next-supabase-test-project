import { createServiceClient } from '@/lib/supabase/server'
import { generateReportPDF, ReportData } from './pdf-generator'
import { sendReportEmail } from './email-sender'

export interface GenerateReportParams {
  userId: string
  organizationId?: string
  periodStart: string
  periodEnd: string
  reportType: string
}

export async function generateWeeklyReport(params: GenerateReportParams) {
  const supabase = await createServiceClient()
  
  try {
    // Check if report already exists (idempotency)
    const { data: existingReport } = await supabase
      .from('auto_reports')
      .select('*')
      .eq('user_id', params.userId)
      .eq('organization_id', params.organizationId)
      .eq('report_type', params.reportType)
      .eq('period_start', params.periodStart)
      .eq('period_end', params.periodEnd)
      .single()

    if (existingReport && existingReport.status === 'generated') {
      console.log('Report already exists and is generated, skipping...')
      return {
        success: true,
        reportId: existingReport.id,
        message: 'Report already exists',
        fileUrl: existingReport.file_url,
      }
    }

    // Create or update report record
    const reportData = {
      user_id: params.userId,
      organization_id: params.organizationId,
      report_type: params.reportType,
      period_start: params.periodStart,
      period_end: params.periodEnd,
      status: 'pending' as const,
    }

    let reportId: string
    if (existingReport) {
      await supabase
        .from('auto_reports')
        .update({ ...reportData, status: 'pending' })
        .eq('id', existingReport.id)
      reportId = existingReport.id
    } else {
      const { data: newReport, error } = await supabase
        .from('auto_reports')
        .insert(reportData)
        .select()
        .single()
      
      if (error) throw error
      reportId = newReport.id
    }

    // Gather report data
    const reportData_gathered = await gatherReportData(params, supabase)
    
    // Generate PDF
    const pdfBuffer = generateReportPDF(reportData_gathered)
    
    // For demo purposes, we'll store the PDF in a simple way
    // In production, you'd upload to S3, Supabase Storage, etc.
    const fileName = `report-${reportId}-${Date.now()}.pdf`
    
    // Update report with generated status
    await supabase
      .from('auto_reports')
      .update({
        status: 'generated',
        file_url: `/api/reports/download/${reportId}`,
        generated_at: new Date().toISOString(),
      })
      .eq('id', reportId)

    // Send email
    await sendReportEmail({
      to: reportData_gathered.user.email,
      userName: reportData_gathered.user.name,
      organizationName: reportData_gathered.organization?.name,
      period: reportData_gathered.period,
      pdfBuffer,
    })

    return {
      success: true,
      reportId,
      message: 'Report generated and sent successfully',
      fileUrl: `/api/reports/download/${reportId}`,
    }
  } catch (error) {
    console.error('Error generating report:', error)
    
    // Update report status to failed
    await supabase
      .from('auto_reports')
      .update({ status: 'failed' })
      .eq('user_id', params.userId)
      .eq('organization_id', params.organizationId)
      .eq('report_type', params.reportType)
      .eq('period_start', params.periodStart)
      .eq('period_end', params.periodEnd)

    throw error
  }
}

export async function gatherReportData(params: GenerateReportParams, supabase: any): Promise<ReportData> {
  // Get user data
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.userId)
    .single()

  // Get organization data if provided
  let organization = null
  if (params.organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', params.organizationId)
      .single()
    organization = org
  }

  // Get subscription data
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      subscription_addons(*)
    `)
    .eq('user_id', params.userId)
    .single()

  // Mock metrics (in a real app, you'd query actual data)
  const metrics = {
    totalProjects: Math.floor(Math.random() * 50) + 10,
    activeUsers: Math.floor(Math.random() * 20) + 5,
    storageUsed: Math.floor(Math.random() * 100) + 10,
    apiCalls: Math.floor(Math.random() * 10000) + 1000,
  }

  return {
    user: {
      name: user?.full_name || user?.email || 'Unknown User',
      email: user?.email || 'unknown@example.com',
    },
    organization: organization ? {
      name: organization.name,
    } : undefined,
    period: {
      start: params.periodStart,
      end: params.periodEnd,
    },
    metrics,
    subscriptions: {
      plan: subscription?.plan_id || 'No active plan',
      status: subscription?.status || 'inactive',
      addons: subscription?.subscription_addons?.map((addon: any) => addon.addon_id) || [],
    },
  }
}
