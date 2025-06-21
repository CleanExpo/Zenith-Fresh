'use client';

import { motion } from 'framer-motion';
import { Scale, Shield, FileText, Calendar, Mail, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';

const TermsPage = () => {
  const sections = [
    {
      id: 'agreement',
      title: 'Agreement to Terms',
      content: `By accessing and using Zenith Platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, then you may not access the Service.`
    },
    {
      id: 'description',
      title: 'Description of Service',
      content: `Zenith Platform is an AI-powered development platform that provides tools, APIs, and services for building, deploying, and scaling applications. Our services include but are not limited to AI automation, analytics, security features, and deployment infrastructure.`
    },
    {
      id: 'accounts',
      title: 'User Accounts',
      content: `When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for keeping your account information current. You are fully responsible for all activities that occur under your account.`
    },
    {
      id: 'usage',
      title: 'Acceptable Use',
      content: `You may not use our Service: (a) for any unlawful purpose or to solicit others to unlawful acts; (b) to violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances; (c) to infringe upon or violate our intellectual property rights or the intellectual property rights of others; (d) to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate; (e) to submit false or misleading information; (f) to upload or transmit viruses or any other type of malicious code.`
    },
    {
      id: 'payment',
      title: 'Payment Terms',
      content: `Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as expressly stated in these Terms. We reserve the right to change our pricing at any time, with 30 days notice for existing customers.`
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property Rights',
      content: `The Service and its original content, features, and functionality are and will remain the exclusive property of Zenith Platform and its licensors. The Service is protected by copyright, trademark, and other laws.`
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      content: `Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.`
    },
    {
      id: 'termination',
      title: 'Termination',
      content: `We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.`
    },
    {
      id: 'disclaimers',
      title: 'Disclaimers',
      content: `The information on this Service is provided on an "as is" basis. To the fullest extent permitted by law, we exclude all representations, warranties, and conditions relating to our Service and the use of this Service.`
    },
    {
      id: 'limitation',
      title: 'Limitation of Liability',
      content: `In no event shall Zenith Platform, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.`
    },
    {
      id: 'governing-law',
      title: 'Governing Law',
      content: `These Terms shall be interpreted and governed by the laws of the State of California, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.`
    },
    {
      id: 'changes',
      title: 'Changes to Terms',
      content: `We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 p-0.5 mx-auto mb-6">
              <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                <Scale className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="relative px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6" />
                Quick Navigation
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                  >
                    {index + 1}. {section.title}
                  </a>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Terms Content */}
      <div className="relative px-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              id={section.id}
            >
              <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {index + 1}. {section.title}
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  {section.content}
                </p>
              </Card>
            </motion.div>
          ))}

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Mail className="w-6 h-6" />
                Contact Information
              </h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2">
                  <p>• Email: legal@zenith.engineer</p>
                  <p>• Address: 123 Innovation Drive, San Francisco, CA 94105</p>
                  <p>• Phone: +1 (555) 123-4567</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Related Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <ExternalLink className="w-6 h-6" />
                Related Documents
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <a 
                  href="/privacy" 
                  className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Shield className="w-5 h-5" />
                  Privacy Policy
                </a>
                <a 
                  href="/contact" 
                  className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Contact Us
                </a>
                <a 
                  href="/security" 
                  className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Shield className="w-5 h-5" />
                  Security Policy
                </a>
                <a 
                  href="/support" 
                  className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Support Center
                </a>
              </div>
            </Card>
          </motion.div>

          {/* Effective Date */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
              <Calendar className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Effective Date</h3>
              <p className="text-gray-300">
                These Terms of Service are effective as of {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} and will remain in effect except with respect to any changes in its provisions in the future, which will be in effect immediately after being posted on this page.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
