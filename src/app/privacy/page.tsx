// src/app/privacy/page.tsx
// Privacy Policy page for Zenith Platform

export const metadata = {
  title: 'Privacy Policy | Zenith',
  description: 'Privacy policy for Zenith website health analysis platform',
};

export function generateViewport() {
  return {
    themeColor: '#000000',
    viewport: 'width=device-width, initial-scale=1'
  };
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="text-gray-300 mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              use our website analysis services, or contact us for support.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Account information (email, name)</li>
              <li>Website URLs you analyze</li>
              <li>Usage data and analytics</li>
              <li>Communication preferences</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">
              We use the information we collect to provide, maintain, and improve our services:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Provide website health analysis</li>
              <li>Send service updates and notifications</li>
              <li>Improve our platform and services</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="text-gray-300 mb-4">
              We implement appropriate security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@zenith.engineer" className="text-blue-400 hover:text-blue-300">
                privacy@zenith.engineer
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
