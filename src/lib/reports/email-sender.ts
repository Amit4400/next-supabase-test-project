export interface EmailReportData {
  to: string
  userName: string
  organizationName?: string
  period: {
    start: string
    end: string
  }
  pdfBuffer: Buffer
}

export async function sendReportEmail(data: EmailReportData) {
  try {
    // Brevo email integration
    const BREVO_API_KEY = process.env.BREVO_API_KEY
    const FROM_EMAIL = process.env.FROM_EMAIL || 'reports@yourdomain.com'
    const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not configured')
    }

    // Convert PDF buffer to base64 for Brevo
    const pdfBase64 = data.pdfBuffer.toString('base64')
    console.log('PDF buffer size:', data.pdfBuffer.length, 'bytes')
    console.log('Base64 length:', pdfBase64.length, 'characters')
    console.log('PDF buffer is Buffer:', Buffer.isBuffer(data.pdfBuffer))
    console.log('First 50 chars of base64:', pdfBase64.substring(0, 50))

    const emailPayload = {
      sender: {
        name: 'Report Team',
        email: FROM_EMAIL
      },
      to: [
        {
          email: data.to,
          name: data.userName
        }
      ],
      subject: `Weekly Report - ${data.period.start} to ${data.period.end}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Weekly Report
          </h1>
          
          <p>Hi ${data.userName},</p>
          
          <p>Your weekly report for ${data.organizationName ? data.organizationName : 'your account'} 
          covering the period from ${data.period.start} to ${data.period.end} is ready.</p>
          
          <p>The detailed report is attached as a PDF file.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Report Summary</h3>
            <ul style="color: #6c757d;">
              <li>Period: ${data.period.start} to ${data.period.end}</li>
              <li>Format: PDF (A4)</li>
              <li>Generated: ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          
          <p>If you have any questions about this report, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>
          The Report Team</p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          <p style="font-size: 12px; color: #6c757d;">
            This is an automated report. Please do not reply to this email.
          </p>
        </div>
      `,
      attachment: [
        {
          content: pdfBase64,
          name: `weekly-report-${data.period.start}-${data.period.end}.pdf`,
          type: 'application/pdf'
        }
      ]
    }

    console.log('Sending email payload:', {
      ...emailPayload,
      attachment: emailPayload.attachment.map(att => ({
        ...att,
        content: `${att.content.substring(0, 50)}... (${att.content.length} chars)`
      }))
    })

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Brevo API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`Brevo API error: ${response.status} - ${errorData.message || 'Unknown error'}`)
    }

    const result = await response.json()
    console.log('Email sent successfully via Brevo:', result)
    return result
  } catch (error) {
    console.error('Failed to send report email:', error)
    throw error
  }
}