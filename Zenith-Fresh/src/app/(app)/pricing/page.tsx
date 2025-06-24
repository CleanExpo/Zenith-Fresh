'use client';

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Pricing Plans</h1>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Starter</h3>
            <div className="text-3xl font-bold mb-4">$29<span className="text-sm text-gray-500">/month</span></div>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Basic optimization</li>
              <li>✓ 10 audits per month</li>
              <li>✓ Email support</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg shadow-md border-2 border-blue-200">
            <h3 className="text-xl font-semibold mb-4">Professional</h3>
            <div className="text-3xl font-bold mb-4">$79<span className="text-sm text-gray-500">/month</span></div>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Advanced optimization</li>
              <li>✓ 50 audits per month</li>
              <li>✓ Priority support</li>
              <li>✓ Custom reports</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Enterprise</h3>
            <div className="text-3xl font-bold mb-4">$199<span className="text-sm text-gray-500">/month</span></div>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Full optimization suite</li>
              <li>✓ Unlimited audits</li>
              <li>✓ 24/7 support</li>
              <li>✓ API access</li>
              <li>✓ White-label options</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}