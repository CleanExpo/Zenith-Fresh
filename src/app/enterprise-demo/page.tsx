import { Metadata } from 'next';
import EnterpriseIntegrationDashboard from '@/components/enterprise/EnterpriseIntegrationDashboard';

export const metadata: Metadata = {
  title: 'Enterprise Integration Demo - Zenith',
  description: 'Comprehensive enterprise integration features including SSO, API management, webhooks, third-party integrations, and white-label capabilities.',
};

export default function EnterpriseIntegrationDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enterprise Integration Suite
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive B2B integration platform featuring SSO, API management, 
            webhooks, third-party integrations, and white-label capabilities for 
            enterprise customers.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg">
          <EnterpriseIntegrationDashboard />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">🔐 Enterprise SSO</h3>
            <p className="text-gray-600 text-sm">
              SAML 2.0, OAuth providers (Google Workspace, Microsoft 365, Okta), 
              and SCIM directory sync for seamless user management.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">🔑 API Management</h3>
            <p className="text-gray-600 text-sm">
              Secure API keys, rate limiting, usage analytics, and SDK generation 
              for TypeScript, Python, and Go.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">🎣 Webhook System</h3>
            <p className="text-gray-600 text-sm">
              Real-time event notifications with reliable delivery, retry logic, 
              and HMAC signature verification.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">🔗 Integrations</h3>
            <p className="text-gray-600 text-sm">
              Native integrations with Slack, Microsoft Teams, GitHub, and Zapier 
              for seamless workflow automation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">🎨 White Label</h3>
            <p className="text-gray-600 text-sm">
              Custom branding, domains, email templates, and onboarding flows 
              for a fully branded experience.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">📊 Analytics</h3>
            <p className="text-gray-600 text-sm">
              Comprehensive analytics for API usage, webhook deliveries, and 
              integration performance monitoring.
            </p>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🚀 Enterprise Ready Features
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>✅ Multi-tenant architecture</li>
              <li>✅ Enterprise-grade security</li>
              <li>✅ Audit logging and compliance</li>
              <li>✅ Role-based access control</li>
              <li>✅ Custom domain support</li>
            </ul>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>✅ Advanced rate limiting</li>
              <li>✅ Webhook retry mechanisms</li>
              <li>✅ Integration monitoring</li>
              <li>✅ Branded email templates</li>
              <li>✅ SDK auto-generation</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            This demo showcases the complete enterprise integration platform built for 
            Week 6 of the SaaS development roadmap. All features are production-ready 
            and designed for Fortune 500-grade enterprise deployments.
          </p>
        </div>
      </div>
    </div>
  );
}