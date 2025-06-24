import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Zenith Platform',
  description: 'Comprehensive privacy policy for Zenith Platform - GDPR, CCPA compliant enterprise SaaS privacy policy.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-600 mb-8">
              <strong>Effective Date:</strong> June 24, 2025<br />
              <strong>Last Updated:</strong> June 24, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="mb-4">
                Zenith Platform ("we," "our," or "us") is committed to protecting your privacy and personal data. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
                use our enterprise SaaS platform and related services (collectively, the "Services").
              </p>
              <p className="mb-4">
                This policy complies with the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), 
                and other applicable data protection laws worldwide.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Personal Information</h3>
              <p className="mb-4">We collect the following categories of personal information:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Account Information:</strong> Name, email address, password, profile picture</li>
                <li><strong>Business Information:</strong> Company name, role, team information</li>
                <li><strong>Billing Information:</strong> Payment method details, billing address (processed securely via Stripe)</li>
                <li><strong>Communication Data:</strong> Support tickets, chat messages, email correspondence</li>
                <li><strong>Usage Data:</strong> Login times, feature usage, session duration, IP addresses</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Technical Information</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                <li><strong>Log Data:</strong> Server logs, error reports, performance metrics</li>
                <li><strong>Analytics Data:</strong> Page views, user interactions, conversion events</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies, analytics cookies, preference cookies</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Content and Files</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Documents, images, and files uploaded to our platform</li>
                <li>Project data, team communications, and collaboration content</li>
                <li>AI-generated content and analysis results</li>
                <li>Website health data and competitive analysis information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Service Provision</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Providing and maintaining the Zenith Platform services</li>
                <li>Processing AI-powered content analysis and generation</li>
                <li>Enabling team collaboration and project management</li>
                <li>Delivering website health monitoring and competitive intelligence</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Business Operations</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Processing payments and managing subscriptions</li>
                <li>Providing customer support and technical assistance</li>
                <li>Sending service updates, security alerts, and administrative messages</li>
                <li>Conducting security monitoring and fraud prevention</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.3 Improvement and Analytics</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Analyzing usage patterns to improve our services</li>
                <li>Conducting A/B testing and feature optimization</li>
                <li>Generating anonymized usage statistics and benchmarks</li>
                <li>Training and improving our AI models (with anonymized data only)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.4 Legal Basis for Processing (GDPR)</h3>
              <p className="mb-4">We process your personal data based on:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Contract Performance:</strong> To provide services under our Terms of Service</li>
                <li><strong>Legitimate Interest:</strong> For security, fraud prevention, and service improvement</li>
                <li><strong>Consent:</strong> For marketing communications and non-essential cookies</li>
                <li><strong>Legal Obligation:</strong> For compliance with applicable laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Third-Party Service Providers</h3>
              <p className="mb-4">We share information with trusted service providers who assist in delivering our services:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Payment Processing:</strong> Stripe (PCI DSS compliant payment processing)</li>
                <li><strong>Email Services:</strong> Resend (transactional email delivery)</li>
                <li><strong>Cloud Storage:</strong> Google Cloud Storage (file storage and backup)</li>
                <li><strong>Analytics:</strong> Google Analytics (anonymized usage analytics)</li>
                <li><strong>Monitoring:</strong> Sentry (error tracking and performance monitoring)</li>
                <li><strong>AI Services:</strong> OpenAI, Anthropic (content analysis and generation)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Business Transfers</h3>
              <p className="mb-4">
                In the event of a merger, acquisition, or sale of assets, personal information may be transferred 
                as part of the business transaction, subject to the same privacy protections.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 Legal Requirements</h3>
              <p className="mb-4">We may disclose information when required by law or to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Comply with legal obligations, court orders, or regulatory requirements</li>
                <li>Protect our rights, property, or safety, or that of our users</li>
                <li>Investigate potential violations of our Terms of Service</li>
                <li>Prevent fraud, security breaches, or illegal activities</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.4 No Sale of Personal Information</h3>
              <p className="mb-4">
                We do not sell, rent, or trade personal information to third parties for monetary consideration. 
                We do not engage in targeted advertising or data brokerage activities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Security Measures</h3>
              <p className="mb-4">We implement comprehensive security measures to protect your data:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Encryption:</strong> Data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication</li>
                <li><strong>Network Security:</strong> Firewall protection, intrusion detection, DDoS mitigation</li>
                <li><strong>Monitoring:</strong> 24/7 security monitoring and incident response</li>
                <li><strong>Compliance:</strong> SOC 2 Type II, ISO 27001 security standards</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Data Breach Response</h3>
              <p className="mb-4">
                In the event of a data breach, we will notify affected users and relevant authorities within 
                72 hours as required by GDPR and other applicable laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 GDPR Rights (EU Residents)</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Right of Access:</strong> Request copies of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                <li><strong>Right to Data Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interest</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for marketing communications</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 CCPA Rights (California Residents)</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Right to Know:</strong> Information about data collection and use</li>
                <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
                <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
                <li><strong>Right to Opt-Out:</strong> Opt-out of data sales (though we don't sell data)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.3 How to Exercise Your Rights</h3>
              <p className="mb-4">To exercise your privacy rights, contact us at:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Email:</strong> privacy@zenith.engineer</li>
                <li><strong>Data Protection Officer:</strong> dpo@zenith.engineer</li>
                <li><strong>In-App:</strong> Account Settings > Privacy Controls</li>
              </ul>
              <p className="mb-4">
                We will respond to your request within 30 days (GDPR) or 45 days (CCPA) and may require 
                identity verification for security purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">7.1 Cookie Categories</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Essential Cookies:</strong> Required for platform functionality and security</li>
                <li><strong>Analytics Cookies:</strong> Google Analytics for usage insights (anonymized)</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Performance Cookies:</strong> Monitor and improve platform performance</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.2 Cookie Management</h3>
              <p className="mb-4">
                You can manage cookie preferences through your browser settings or our cookie consent banner. 
                Disabling essential cookies may limit platform functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">8.1 Retention Periods</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Account Data:</strong> Retained while account is active + 7 years for legal compliance</li>
                <li><strong>Usage Logs:</strong> 2 years for security and analytics purposes</li>
                <li><strong>Support Data:</strong> 3 years for quality assurance and dispute resolution</li>
                <li><strong>Financial Records:</strong> 7 years for tax and audit requirements</li>
                <li><strong>Marketing Data:</strong> Until consent is withdrawn or 3 years of inactivity</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.2 Automated Deletion</h3>
              <p className="mb-4">
                We implement automated data deletion processes to ensure data is not retained longer than necessary. 
                Users can request immediate deletion of their data upon account closure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">9.1 Data Locations</h3>
              <p className="mb-4">
                Your data may be processed in the United States, European Union, and other countries where 
                our service providers operate. We ensure adequate protection through:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Adequacy decisions for countries with equivalent data protection laws</li>
                <li>Binding Corporate Rules and certification programs</li>
                <li>Additional safeguards for international transfers</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">9.2 Data Localization Options</h3>
              <p className="mb-4">
                Enterprise customers can request data localization in specific regions subject to 
                availability and additional terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="mb-4">
                Our services are not intended for children under 16 years of age. We do not knowingly collect 
                personal information from children under 16. If we discover that we have collected information 
                from a child under 16, we will delete it immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy to reflect changes in our practices, technology, legal requirements, 
                or other factors. We will notify users of material changes through:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Email notification to registered users</li>
                <li>In-app notifications for significant changes</li>
                <li>Updates to our website with effective date changes</li>
                <li>30-day advance notice for material changes affecting user rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">12.1 Privacy Inquiries</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Privacy Team:</strong> privacy@zenith.engineer</li>
                <li><strong>Data Protection Officer:</strong> dpo@zenith.engineer</li>
                <li><strong>Legal Department:</strong> legal@zenith.engineer</li>
                <li><strong>Security Team:</strong> security@zenith.engineer</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">12.2 Company Information</h3>
              <p className="mb-4">
                <strong>Zenith Platform, Inc.</strong><br />
                Legal Address: [To be updated with actual business address]<br />
                Business Registration: [To be updated with registration details]
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">12.3 Supervisory Authority</h3>
              <p className="mb-4">
                EU residents have the right to lodge a complaint with their local data protection authority 
                if they believe their rights have been violated.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Compliance Certifications</h2>
              <p className="mb-4">Zenith Platform maintains the following compliance certifications:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>SOC 2 Type II:</strong> Security, availability, and confidentiality controls</li>
                <li><strong>ISO 27001:</strong> Information security management system</li>
                <li><strong>GDPR Compliance:</strong> Full compliance with EU data protection regulation</li>
                <li><strong>CCPA Compliance:</strong> California consumer privacy act compliance</li>
                <li><strong>Privacy Shield:</strong> [If applicable] EU-US data transfer framework</li>
              </ul>
            </section>

            <div className="bg-gray-50 p-6 rounded-lg mt-8">
              <p className="text-sm text-gray-600">
                <strong>Last Updated:</strong> June 24, 2025<br />
                <strong>Version:</strong> 2.0 (Enterprise SaaS)<br />
                <strong>Review Cycle:</strong> Annually or upon material changes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
