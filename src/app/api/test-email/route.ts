import { NextRequest, NextResponse } from 'next/server'
import { sendReportEmail } from '@/lib/reports/email-sender'
import { generateReportPDF } from '@/lib/reports/pdf-generator'

export async function POST(request: NextRequest) {
  try {
    // Create test data
    const testData = {
      user: {
        name: 'Test User',
        email: 'test@example.com'
      },
      organization: {
        name: 'Test Organization'
      },
      period: {
        start: '2024-01-01',
        end: '2024-01-07'
      },
      metrics: {
        totalProjects: 5,
        activeUsers: 10,
        storageUsed: 2.5,
        apiCalls: 1500
      },
      subscriptions: {
        plan: 'Pro',
        status: 'active',
        addons: ['Extra Storage', 'Priority Support']
      }
    }

    // Generate PDF
    const pdfBuffer = generateReportPDF(testData)
    console.log('Generated PDF buffer size:', pdfBuffer.length, 'bytes')

    // Send email
    await sendReportEmail({
      to: 'amitsoftradix6@gmail.com',
      userName: testData.user.name,
      organizationName: testData.organization.name,
      period: testData.period,
      pdfBuffer,
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully',
      pdfSize: pdfBuffer.length 
    })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test email', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
