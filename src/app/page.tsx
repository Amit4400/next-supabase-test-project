import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Next.js + Supabase + Stripe Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive demonstration of modern web development with Next.js App Router, 
            Supabase with Row Level Security, Stripe integration, and automated reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Supabase + RLS */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Supabase + RLS</h3>
            <p className="text-gray-600 mb-4">
              Complete database schema with Row Level Security policies. 
              See how users can only access data they're authorized to view.
            </p>
            <Link
              href="/rls-demo"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View RLS Demo →
            </Link>
          </div>

          {/* Stripe Integration */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Stripe Integration</h3>
            <p className="text-gray-600 mb-4">
              Full Stripe Checkout with trial flow, webhook handling, 
              and customer portal. Includes plan and add-on examples.
            </p>
            <Link
              href="/pricing"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Pricing →
            </Link>
          </div>

          {/* Auto Reports */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto Reports</h3>
            <p className="text-gray-600 mb-4">
              Weekly email reports with A4 PDF generation. 
              Idempotent by account and period to prevent duplicates.
            </p>
            <Link
              href="/reports"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Reports →
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Database & Security</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Complete Supabase schema with RLS policies</li>
                <li>• User authentication and authorization</li>
                <li>• Organization-based data isolation</li>
                <li>• Sensitive data protection with RLS</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Payments & Billing</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Stripe Checkout with 14-day trials</li>
                <li>• Multiple plans and add-ons</li>
                <li>• Webhook signature verification</li>
                <li>• Idempotent webhook processing</li>
                <li>• Customer portal integration</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Reporting System</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Automated weekly email reports</li>
                <li>• A4 PDF generation with jsPDF</li>
                <li>• Idempotent report generation</li>
                <li>• Email delivery via Resend</li>
                <li>• Report download and management</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Stack</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Next.js 15 with App Router</li>
                <li>• TypeScript for type safety</li>
                <li>• Tailwind CSS for styling</li>
                <li>• Supabase for backend services</li>
                <li>• Stripe for payments</li>
                <li>• Resend for email delivery</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Getting Started</h2>
          <div className="text-blue-800 space-y-4">
            <p>
              <strong>1. Set up your environment:</strong> Copy <code className="bg-blue-100 px-2 py-1 rounded">env.example</code> to <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code> and fill in your API keys.
            </p>
            <p>
              <strong>2. Run the database schema:</strong> Execute the <code className="bg-blue-100 px-2 py-1 rounded">schema.sql</code> file in your Supabase project.
            </p>
            <p>
              <strong>3. Configure Stripe webhooks:</strong> Point your webhook endpoint to <code className="bg-blue-100 px-2 py-1 rounded">/api/stripe/webhook</code>.
            </p>
            <p>
              <strong>4. Start the development server:</strong> Run <code className="bg-blue-100 px-2 py-1 rounded">npm run dev</code> and explore the features!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}