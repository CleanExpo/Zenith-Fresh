'use client';

import { useState } from 'react';
import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions About Website Optimization',
  description: 'Find answers to common questions about Zenith\'s AI-powered website optimization platform. Learn about features, pricing, security, and technical support.',
  keywords: ['FAQ', 'frequently asked questions', 'zenith help', 'website optimization questions', 'support', 'pricing questions'],
  openGraph: {
    title: 'Zenith FAQ - Frequently Asked Questions',
    description: 'Find answers to common questions about AI-powered website optimization, features, pricing, and support.',
    url: 'https://zenith.engineer/faq',
  },
  twitter: {
    title: 'Zenith FAQ - Frequently Asked Questions',
    description: 'Find answers to common questions about AI-powered website optimization, features, pricing, and support.',
  },
  alternates: {
    canonical: '/faq',
  },
};

const faqCategories = [
  {
    name: 'Getting Started',
    faqs: [
      {
        question: 'How do I get started with Zenith?',
        answer: 'Getting started is easy! Sign up for a free 14-day trial, add your website URL, and our platform will automatically begin analyzing your site. You\'ll receive your first comprehensive report within minutes.',
      },
      {
        question: 'Do I need technical knowledge to use Zenith?',
        answer: 'Not at all! Zenith is designed for users of all technical levels. Our intuitive interface provides clear, actionable recommendations that anyone can understand and implement. Technical details are available for those who want them.',
      },
      {
        question: 'How long does it take to see results?',
        answer: 'You\'ll see initial insights immediately after adding your website. Most users see measurable improvements in their website performance within 2-4 weeks of implementing our recommendations.',
      },
      {
        question: 'Can I analyze competitor websites?',
        answer: 'Yes! Our Competitive Intelligence feature allows you to monitor and analyze competitor websites to identify opportunities and stay ahead of market trends.',
      },
    ],
  },
  {
    name: 'Features & Functionality',
    faqs: [
      {
        question: 'What types of analysis does Zenith perform?',
        answer: 'Zenith performs comprehensive analysis including SEO optimization, page speed performance, mobile responsiveness, security vulnerabilities, accessibility compliance, technical SEO audits, and Core Web Vitals monitoring.',
      },
      {
        question: 'How accurate are the AI recommendations?',
        answer: 'Our AI recommendations are based on millions of data points and proven optimization strategies. They maintain a 95%+ accuracy rate and are continuously improved through machine learning and user feedback.',
      },
      {
        question: 'Can I schedule automated scans?',
        answer: 'Yes! You can set up automated scans daily, weekly, or monthly. You\'ll receive notifications when issues are detected or when your website performance changes significantly.',
      },
      {
        question: 'Do you provide white-label reports?',
        answer: 'White-label reports are available on our Professional and Enterprise plans. You can customize reports with your branding and share them directly with clients or stakeholders.',
      },
    ],
  },
  {
    name: 'Pricing & Plans',
    faqs: [
      {
        question: 'How does the free trial work?',
        answer: 'Our 14-day free trial gives you full access to Professional features with no credit card required. You can analyze up to 5 websites and experience all our core functionality.',
      },
      {
        question: 'Can I change plans at any time?',
        answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing adjustments are prorated to your next billing cycle.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Enterprise customers. All payments are processed securely through Stripe.',
      },
      {
        question: 'Do you offer refunds?',
        answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied with Zenith, contact our support team for a full refund within 30 days of purchase.',
      },
      {
        question: 'Are there any setup fees or hidden costs?',
        answer: 'No setup fees or hidden costs. You pay only for your subscription. Enterprise customers receive dedicated onboarding and support at no additional charge.',
      },
    ],
  },
  {
    name: 'Technical & Security',
    faqs: [
      {
        question: 'How do you ensure data security?',
        answer: 'We maintain SOC 2 Type II compliance, use end-to-end encryption, and follow industry best practices for data protection. Your data is stored securely and never shared with third parties.',
      },
      {
        question: 'Do you offer API access?',
        answer: 'Yes, our REST API is available on Professional and Enterprise plans. You can integrate Zenith data into your existing workflows, dashboards, and applications.',
      },
      {
        question: 'What about GDPR compliance?',
        answer: 'Zenith is fully GDPR compliant. We provide data processing agreements, respect user privacy rights, and maintain strict data governance policies.',
      },
      {
        question: 'Can I export my data?',
        answer: 'Yes, you can export all your data in various formats including CSV, PDF, and JSON. This ensures you always have access to your historical data and reports.',
      },
      {
        question: 'What is your uptime guarantee?',
        answer: 'We guarantee 99.9% uptime with our enterprise-grade infrastructure. Our platform is monitored 24/7, and we have redundant systems to ensure continuous service.',
      },
    ],
  },
  {
    name: 'Support & Training',
    faqs: [
      {
        question: 'What support options are available?',
        answer: 'We offer email support for all users, priority support for Professional users, and dedicated support for Enterprise customers. Our support team typically responds within 24 hours.',
      },
      {
        question: 'Do you provide training or onboarding?',
        answer: 'Yes! We offer comprehensive onboarding for all new users, video tutorials, documentation, and personalized training sessions for Enterprise customers.',
      },
      {
        question: 'Can I get help implementing recommendations?',
        answer: 'Absolutely! Our team can provide implementation guidance, and we partner with certified agencies who can help execute the recommendations if needed.',
      },
      {
        question: 'Do you offer consulting services?',
        answer: 'Yes, we offer strategic consulting services for Enterprise customers. Our experts can help develop comprehensive optimization strategies tailored to your business goals.',
      },
    ],
  },
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Support</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Find answers to the most common questions about Zenith. 
            Can't find what you're looking for? Contact our support team.
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {faqCategories.map((category, categoryIndex) => (
              <div key={category.name} className={categoryIndex > 0 ? 'mt-20' : ''}>
                <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900 mb-8">
                  {category.name}
                </h2>
                <div className="space-y-6">
                  {category.faqs.map((faq, faqIndex) => {
                    const itemId = `${categoryIndex}-${faqIndex}`;
                    const isOpen = openItems.includes(itemId);
                    
                    return (
                      <div key={faqIndex} className="border-b border-gray-200 pb-6">
                        <button
                          className="flex w-full items-start justify-between text-left"
                          onClick={() => toggleItem(itemId)}
                        >
                          <span className="text-base font-semibold leading-7 text-gray-900">
                            {faq.question}
                          </span>
                          <span className="ml-6 flex h-7 items-center">
                            <ChevronDownIcon
                              className={`h-6 w-6 transform transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                              aria-hidden="true"
                            />
                          </span>
                        </button>
                        {isOpen && (
                          <div className="mt-4 pr-12">
                            <p className="text-base leading-7 text-gray-600">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Still have questions section */}
      <div className="bg-gray-50">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Still have questions?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Our support team is here to help. Get personalized assistance for your specific needs.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/contact"
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Contact Support
              </Link>
              <Link
                href="/contact?inquiry=demo"
                className="text-base font-semibold leading-6 text-gray-900 hover:text-blue-600"
              >
                Book a Demo <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Popular resources */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Popular Resources
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Explore these helpful resources to get the most out of Zenith.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            <article className="flex flex-col items-start">
              <div className="flex items-center gap-x-4 text-xs">
                <time className="text-gray-500">Getting Started</time>
                <span className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600">
                  Guide
                </span>
              </div>
              <div className="group relative">
                <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                  <Link href="/resources/getting-started">
                    <span className="absolute inset-0" />
                    Complete Setup Guide
                  </Link>
                </h3>
                <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
                  Step-by-step instructions to get your website optimization journey started with Zenith.
                </p>
              </div>
            </article>

            <article className="flex flex-col items-start">
              <div className="flex items-center gap-x-4 text-xs">
                <time className="text-gray-500">Best Practices</time>
                <span className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600">
                  Tips
                </span>
              </div>
              <div className="group relative">
                <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                  <Link href="/resources/optimization-tips">
                    <span className="absolute inset-0" />
                    Website Optimization Tips
                  </Link>
                </h3>
                <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
                  Expert tips and best practices for maximizing your website's performance and user experience.
                </p>
              </div>
            </article>

            <article className="flex flex-col items-start">
              <div className="flex items-center gap-x-4 text-xs">
                <time className="text-gray-500">Integration</time>
                <span className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600">
                  Documentation
                </span>
              </div>
              <div className="group relative">
                <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                  <Link href="/docs/api">
                    <span className="absolute inset-0" />
                    API Documentation
                  </Link>
                </h3>
                <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
                  Complete API reference for integrating Zenith into your existing workflows and applications.
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}