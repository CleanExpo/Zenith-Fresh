import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Zenith Platform',
  description: 'Comprehensive Terms of Service for Zenith Platform - Enterprise SaaS terms and conditions.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-600 mb-8">
              <strong>Effective Date:</strong> June 24, 2025<br />
              <strong>Last Updated:</strong> June 24, 2025<br />
              <strong>Version:</strong> 2.0 (Enterprise SaaS)
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement and Acceptance</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">1.1 Binding Agreement</h3>
              <p className="mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you ("Customer," "you," or "your") 
                and Zenith Platform, Inc. ("Zenith," "we," "us," or "our") governing your use of the Zenith Platform and all 
                related services, software, APIs, and documentation (collectively, the "Services").
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">1.2 Acceptance of Terms</h3>
              <p className="mb-4">
                By accessing, using, or signing up for the Services, you acknowledge that you have read, understood, and agree 
                to be bound by these Terms. If you are entering into this agreement on behalf of a company or other legal entity, 
                you represent that you have the authority to bind such entity to these Terms.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">1.3 Capacity to Contract</h3>
              <p className="mb-4">
                You must be at least 18 years old and have the legal capacity to enter into this agreement. 
                If you are under 18, you may only use our Services with the involvement of a parent or guardian.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Platform Overview</h3>
              <p className="mb-4">
                Zenith Platform is an enterprise-grade SaaS solution providing:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>AI-powered content generation and analysis</li>
                <li>Website health monitoring and competitive intelligence</li>
                <li>Team collaboration and project management tools</li>
                <li>Advanced analytics and business intelligence</li>
                <li>API integrations and automation workflows</li>
                <li>Enterprise security and compliance features</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Service Availability</h3>
              <p className="mb-4">
                We strive to maintain 99.9% uptime for our Services. However, we do not guarantee uninterrupted access 
                and may need to suspend Services for maintenance, updates, or unforeseen circumstances.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Service Modifications</h3>
              <p className="mb-4">
                We reserve the right to modify, enhance, or discontinue any aspect of our Services at any time. 
                We will provide reasonable notice for material changes that may affect your use of the Services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Management</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Account Registration</h3>
              <p className="mb-4">
                To access our Services, you must create an account by providing accurate, complete, and current information. 
                You are responsible for maintaining the confidentiality of your account credentials and for all activities 
                that occur under your account.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Account Security</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Use strong, unique passwords for your account</li>
                <li>Enable two-factor authentication when available</li>
                <li>Promptly notify us of any unauthorized access or security breaches</li>
                <li>Do not share your account credentials with others</li>
                <li>Log out of your account when using shared or public devices</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.3 Team Accounts</h3>
              <p className="mb-4">
                Team accounts allow multiple users to collaborate under a single subscription. The account owner is 
                responsible for managing team members, permissions, and billing for the entire team.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.4 Account Suspension</h3>
              <p className="mb-4">
                We may suspend or terminate your account if you violate these Terms, engage in fraudulent activities, 
                or fail to pay applicable fees. We will provide notice when reasonably possible.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Permitted Uses</h3>
              <p className="mb-4">You may use our Services for lawful business purposes, including:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Content creation and analysis for your business</li>
                <li>Website monitoring and competitive research</li>
                <li>Team collaboration and project management</li>
                <li>Business analytics and reporting</li>
                <li>Integration with your existing business systems</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Prohibited Activities</h3>
              <p className="mb-4">You agree not to use our Services to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Violate any laws, regulations, or third-party rights</li>
                <li>Transmit harmful, offensive, or illegal content</li>
                <li>Attempt to gain unauthorized access to our systems or other users' data</li>
                <li>Reverse engineer, decompile, or disassemble our software</li>
                <li>Use our Services for competitive intelligence against us</li>
                <li>Spam, phish, or engage in other deceptive practices</li>
                <li>Upload viruses, malware, or other malicious code</li>
                <li>Exceed rate limits or attempt to overload our systems</li>
                <li>Create derivative works based on our Services</li>
                <li>Resell or redistribute our Services without authorization</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 AI Content Guidelines</h3>
              <p className="mb-4">When using our AI-powered features:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Do not generate content that infringes on intellectual property rights</li>
                <li>Do not create misleading, defamatory, or harmful content</li>
                <li>Review and verify AI-generated content before publication</li>
                <li>Comply with applicable laws regarding AI-generated content disclosure</li>
                <li>Do not attempt to train competing AI models using our Services</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.4 Enforcement</h3>
              <p className="mb-4">
                We reserve the right to investigate potential violations of this Acceptable Use Policy and take 
                appropriate action, including content removal, account suspension, or legal action.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Subscription and Billing</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Subscription Plans</h3>
              <p className="mb-4">
                We offer various subscription plans with different features and usage limits. Current pricing and 
                plan details are available on our website and may be updated from time to time.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Billing Terms</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Payment Schedule:</strong> Subscriptions are billed monthly or annually in advance</li>
                <li><strong>Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled</li>
                <li><strong>Price Changes:</strong> We provide 30 days notice for price increases</li>
                <li><strong>Taxes:</strong> Prices exclude applicable taxes, which are your responsibility</li>
                <li><strong>Currency:</strong> All prices are in US Dollars unless otherwise specified</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.3 Payment Processing</h3>
              <p className="mb-4">
                Payments are processed securely through Stripe. By providing payment information, you authorize us 
                to charge your payment method for applicable fees. You must maintain valid payment information.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.4 Failed Payments</h3>
              <p className="mb-4">
                If payment fails, we may suspend your access to paid features. We will attempt to collect payment 
                and notify you of failed payment attempts. Accounts may be downgraded or suspended for non-payment.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.5 Refund Policy</h3>
              <p className="mb-4">
                We offer a 30-day money-back guarantee for new subscriptions. Refunds are processed at our discretion 
                for service outages or billing errors. No refunds are provided for partial months or usage-based charges.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.6 Enterprise Agreements</h3>
              <p className="mb-4">
                Large organizations may enter into separate Enterprise License Agreements with custom terms, 
                pricing, and service level agreements. Contact our sales team for enterprise pricing.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Our Intellectual Property</h3>
              <p className="mb-4">
                Zenith Platform and all related software, technologies, content, and materials are owned by us or our 
                licensors and are protected by copyright, trademark, patent, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 License to Use</h3>
              <p className="mb-4">
                Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license to access and 
                use our Services for your internal business purposes during your subscription period.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.3 Your Content</h3>
              <p className="mb-4">
                You retain ownership of all content, data, and materials you upload to our Services ("Your Content"). 
                You grant us a limited license to use Your Content to provide the Services, including processing, 
                storing, and displaying Your Content as necessary.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.4 AI-Generated Content</h3>
              <p className="mb-4">
                Content generated by our AI features is provided to you under a license for your use. You are 
                responsible for ensuring that any AI-generated content complies with applicable laws and does not 
                infringe on third-party rights.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.5 Feedback and Suggestions</h3>
              <p className="mb-4">
                Any feedback, suggestions, or ideas you provide about our Services become our property and may be 
                used without restriction or compensation.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.6 DMCA Compliance</h3>
              <p className="mb-4">
                We respect intellectual property rights and comply with the Digital Millennium Copyright Act (DMCA). 
                If you believe your content has been infringed, please contact us at dmca@zenith.engineer.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Protection and Privacy</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">7.1 Privacy Policy</h3>
              <p className="mb-4">
                Our Privacy Policy explains how we collect, use, and protect your personal information. 
                By using our Services, you agree to our Privacy Policy.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.2 Data Processing</h3>
              <p className="mb-4">
                We process your data to provide the Services, including AI analysis, analytics, and collaboration features. 
                We implement appropriate technical and organizational measures to protect your data.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.3 Data Portability</h3>
              <p className="mb-4">
                You can export your data from our Services at any time through our data export tools. 
                We provide data in standard formats when technically feasible.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.4 Data Retention</h3>
              <p className="mb-4">
                We retain your data for as long as your account is active and for a reasonable period thereafter 
                for business and legal purposes. You can request data deletion at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Level Agreement</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">8.1 Uptime Commitment</h3>
              <p className="mb-4">
                We commit to maintaining 99.9% uptime for our core Services, measured monthly. 
                Scheduled maintenance and circumstances beyond our control are excluded from this calculation.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.2 Performance Standards</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>API Response Time:</strong> 95% of API calls respond within 2 seconds</li>
                <li><strong>Data Processing:</strong> Standard analysis completed within 24 hours</li>
                <li><strong>Support Response:</strong> Initial response within 24 hours for standard support</li>
                <li><strong>Security Updates:</strong> Critical security patches applied within 72 hours</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.3 Service Credits</h3>
              <p className="mb-4">
                If we fail to meet our uptime commitment, eligible customers may receive service credits. 
                Credits are calculated as a percentage of monthly fees and applied to future invoices.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.4 Limitations</h3>
              <p className="mb-4">
                Service level commitments do not apply to free plans, beta features, or outages caused by 
                third-party services, force majeure events, or customer misuse.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Support and Maintenance</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">9.1 Support Channels</h3>
              <p className="mb-4">We provide customer support through:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Email support (support@zenith.engineer)</li>
                <li>In-app chat and help system</li>
                <li>Knowledge base and documentation</li>
                <li>Video tutorials and webinars</li>
                <li>Priority support for enterprise customers</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">9.2 Support Scope</h3>
              <p className="mb-4">Our support includes:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Technical assistance with platform features</li>
                <li>Account and billing support</li>
                <li>API integration guidance</li>
                <li>Troubleshooting and error resolution</li>
                <li>Best practices and optimization advice</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">9.3 Maintenance Windows</h3>
              <p className="mb-4">
                We perform scheduled maintenance during off-peak hours and provide advance notice. 
                Emergency maintenance may be performed without notice when necessary to maintain security or stability.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">10.1 Disclaimer of Warranties</h3>
              <p className="mb-4">
                OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, 
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">10.2 Limitation of Damages</h3>
              <p className="mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL ZENITH BE LIABLE FOR ANY 
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT 
                LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">10.3 Liability Cap</h3>
              <p className="mb-4">
                OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE 
                SERVICES SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SERVICES IN THE TWELVE (12) 
                MONTHS PRECEDING THE CLAIM.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">10.4 Essential Purpose</h3>
              <p className="mb-4">
                You acknowledge that the limitations of liability set forth in this section are an essential 
                element of the agreement between the parties and that we would not provide the Services without 
                such limitations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">11.1 Customer Indemnification</h3>
              <p className="mb-4">
                You agree to indemnify, defend, and hold harmless Zenith and its affiliates, officers, directors, 
                employees, and agents from and against any claims, damages, losses, and expenses arising out of:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Your use of the Services in violation of these Terms</li>
                <li>Your Content or any third-party claims related to Your Content</li>
                <li>Your violation of any law or regulation</li>
                <li>Your violation of any third-party rights</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">11.2 Zenith Indemnification</h3>
              <p className="mb-4">
                We will defend you against any third-party claim that our Services infringe a valid patent, 
                copyright, or trademark, and will pay damages finally awarded against you for such claim, 
                provided you promptly notify us and allow us to control the defense.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Termination</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">12.1 Termination by You</h3>
              <p className="mb-4">
                You may terminate your account at any time by canceling your subscription through your account 
                settings or by contacting us. Termination will be effective at the end of your current billing period.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">12.2 Termination by Us</h3>
              <p className="mb-4">We may terminate your access to the Services:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>For material breach of these Terms</li>
                <li>For non-payment of fees</li>
                <li>For violation of our Acceptable Use Policy</li>
                <li>If required by law or regulation</li>
                <li>If we discontinue the Services</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">12.3 Effect of Termination</h3>
              <p className="mb-4">
                Upon termination, your access to the Services will cease, and we may delete your account and data 
                after a reasonable grace period. Provisions that by their nature should survive termination will 
                continue to apply.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">12.4 Data Export</h3>
              <p className="mb-4">
                Before termination, you may export your data using our data export tools. We will retain your data 
                for 30 days after termination to allow for data recovery, after which it will be permanently deleted.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Dispute Resolution</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">13.1 Informal Resolution</h3>
              <p className="mb-4">
                Before pursuing formal dispute resolution, we encourage you to contact us directly to resolve 
                any concerns. We will work in good faith to address your issues promptly.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.2 Binding Arbitration</h3>
              <p className="mb-4">
                Any disputes arising out of or relating to these Terms or the Services will be resolved through 
                binding arbitration in accordance with the Commercial Arbitration Rules of the American Arbitration 
                Association, rather than in court.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.3 Class Action Waiver</h3>
              <p className="mb-4">
                You agree that any arbitration will be conducted on an individual basis and not as a class action, 
                collective arbitration, or representative proceeding.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.4 Governing Law</h3>
              <p className="mb-4">
                These Terms are governed by the laws of the State of Delaware, without regard to conflict of law 
                principles. Any disputes not subject to arbitration will be resolved in the courts of Delaware.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. General Provisions</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">14.1 Entire Agreement</h3>
              <p className="mb-4">
                These Terms, together with our Privacy Policy and any additional terms for specific Services, 
                constitute the entire agreement between you and us regarding the Services.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">14.2 Amendment</h3>
              <p className="mb-4">
                We may modify these Terms at any time by posting updated terms on our website. Material changes 
                will be communicated through email or in-app notifications with 30 days advance notice.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">14.3 Severability</h3>
              <p className="mb-4">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will 
                continue in full force and effect.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">14.4 Force Majeure</h3>
              <p className="mb-4">
                Neither party will be liable for any failure to perform due to causes beyond their reasonable 
                control, including natural disasters, war, terrorism, or government actions.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">14.5 Assignment</h3>
              <p className="mb-4">
                You may not assign these Terms without our written consent. We may assign these Terms in 
                connection with a merger, acquisition, or sale of assets.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">14.6 No Waiver</h3>
              <p className="mb-4">
                Our failure to enforce any provision of these Terms will not constitute a waiver of our right 
                to enforce such provision in the future.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">15.1 Legal Inquiries</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Legal Department:</strong> legal@zenith.engineer</li>
                <li><strong>Terms Questions:</strong> terms@zenith.engineer</li>
                <li><strong>General Counsel:</strong> counsel@zenith.engineer</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">15.2 Company Information</h3>
              <p className="mb-4">
                <strong>Zenith Platform, Inc.</strong><br />
                Legal Address: [To be updated with actual business address]<br />
                Business Registration: [To be updated with registration details]<br />
                Phone: [To be updated with business phone number]
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">15.3 Notice Delivery</h3>
              <p className="mb-4">
                Legal notices may be delivered to you via email to your registered email address or through 
                in-app notifications. Notices to us should be sent to legal@zenith.engineer.
              </p>
            </section>

            <div className="bg-gray-50 p-6 rounded-lg mt-8">
              <p className="text-sm text-gray-600">
                <strong>Document Information:</strong><br />
                Version: 2.0 (Enterprise SaaS)<br />
                Effective Date: June 24, 2025<br />
                Last Updated: June 24, 2025<br />
                Review Cycle: Annually or upon material changes<br />
                Legal Jurisdiction: Delaware, United States
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
