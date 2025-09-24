import jsPDF from 'jspdf'

export interface ReportData {
  user: {
    name: string
    email: string
  }
  organization?: {
    name: string
  }
  period: {
    start: string
    end: string
  }
  metrics: {
    totalProjects: number
    activeUsers: number
    storageUsed: number
    apiCalls: number
  }
  subscriptions: {
    plan: string
    status: string
    addons: string[]
  }
}

export function generateReportPDF(data: ReportData): Buffer {
  const doc = new jsPDF()
  
  // Set up the document
  doc.setFontSize(20)
  doc.text('Weekly Report', 20, 30)
  
  // User and organization info
  doc.setFontSize(12)
  doc.text(`User: ${data.user.name} (${data.user.email})`, 20, 50)
  
  if (data.organization) {
    doc.text(`Organization: ${data.organization.name}`, 20, 60)
  }
  
  doc.text(`Period: ${data.period.start} to ${data.period.end}`, 20, 70)
  
  // Metrics section
  doc.setFontSize(16)
  doc.text('Metrics', 20, 90)
  
  doc.setFontSize(12)
  const metricsY = 110
  doc.text(`Total Projects: ${data.metrics.totalProjects}`, 20, metricsY)
  doc.text(`Active Users: ${data.metrics.activeUsers}`, 20, metricsY + 10)
  doc.text(`Storage Used: ${data.metrics.storageUsed} GB`, 20, metricsY + 20)
  doc.text(`API Calls: ${data.metrics.apiCalls.toLocaleString()}`, 20, metricsY + 30)
  
  // Subscription section
  doc.setFontSize(16)
  doc.text('Subscription', 20, 160)
  
  doc.setFontSize(12)
  const subY = 180
  doc.text(`Plan: ${data.subscriptions.plan}`, 20, subY)
  doc.text(`Status: ${data.subscriptions.status}`, 20, subY + 10)
  
  if (data.subscriptions.addons.length > 0) {
    doc.text(`Add-ons: ${data.subscriptions.addons.join(', ')}`, 20, subY + 20)
  }
  
  // Footer
  doc.setFontSize(10)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 280)
  
  return Buffer.from(doc.output('arraybuffer'))
}
