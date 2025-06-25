import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans - Choose the Right Plan for Your Business',
  description: 'Transparent pricing for Zenith\'s AI-powered website optimization platform. Start with a free trial, scale as you grow. No hidden fees or long-term contracts.',
  keywords: ['pricing', 'plans', 'website optimization pricing', 'AI optimization cost', 'free trial', 'enterprise pricing'],
  openGraph: {
    title: 'Zenith Pricing - Choose the Right Plan for Your Business',
    description: 'Transparent pricing for AI-powered website optimization. Start free, scale as you grow.',
    url: 'https://zenith.engineer/pricing',
  },
  twitter: {
    title: 'Zenith Pricing - Choose the Right Plan for Your Business',
    description: 'Transparent pricing for AI-powered website optimization. Start free, scale as you grow.',
  },
  alternates: {
    canonical: '/pricing',
  },
};

const tiers = [
  {
    name: 'Starter',
    id: 'tier-starter',
    href: '/auth/signin?plan=starter',
    priceMonthly: '$29',
    priceYearly: '$290',
    description: 'Perfect for small businesses and startups.',
    features: [
      '5 websites',
      'Weekly scans',
      'Basic analytics',
      'Email support',
      'SEO insights',
      'Performance monitoring',
    ],
    limitations: [
      'Advanced AI features',
      'Team collaboration',
      'Custom reports',
      'API access',
    ],
    mostPopular: false,
  },
  {
    name: 'Professional',
    id: 'tier-professional',
    href: '/auth/signin?plan=professional',
    priceMonthly: '$79',
    priceYearly: '$790',
    description: 'Best for growing businesses with multiple websites.',
    features: [
      '25 websites',
      'Daily scans',
      'Advanced analytics',
      'Priority support',
      'AI-powered insights',
      'Competitive intelligence',
      'Team collaboration',
      'Custom reports',
      'Performance optimization',
      'Security monitoring',
    ],
    limitations: [
      'Enterprise integrations',
      'White-label reports',
    ],
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '/contact?plan=enterprise',
    priceMonthly: 'Custom',
    priceYearly: 'Custom',
    description: 'Advanced features for large organizations.',
    features: [
      'Unlimited websites',
      'Real-time monitoring',
      'Advanced AI orchestration',
      'Dedicated support',
      'Custom integrations',
      'White-label reports',
      'Advanced team management',
      'SLA guarantees',
      'Custom deployment',
      'API access',
      'Advanced security',
      'Compliance reporting',
    ],
    limitations: [],
    mostPopular: false,
  },
];

const faqs = [
  {
    question: 'How does the free trial work?',
    answer: 'Start with a 14-day free trial with full access to Professional features. No credit card required. Cancel anytime.',
  },
  {
    question: 'Can I change plans at any time?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise customers. All payments are processed securely through Stripe.',
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No setup fees. Pay only for your subscription. Enterprise customers get dedicated onboarding included.',
  },
  {
    question: 'Do you offer volume discounts?',
    answer: 'Yes, we offer volume discounts for agencies and large organizations. Contact our sales team for custom pricing.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'You can export all your data before canceling. We keep your data for 30 days after cancellation in case you want to reactivate.',
  },
];

export default function Pricing() {
  return (
    <MarketingLayout>
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Pricing</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Choose the right plan for your business
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Start with a free trial. Scale as you grow. No hidden fees or long-term contracts.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="mt-16 flex justify-center">
            <fieldset className="grid grid-cols-2 gap-x-1 rounded-full bg-gray-100 p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200">
              <legend className="sr-only">Payment frequency</legend>
              <label className="cursor-pointer rounded-full px-2.5 py-1 text-gray-500">
                <input type="radio" name="frequency" value="monthly" className="sr-only" />
                <span>Monthly</span>
              </label>
              <label className="cursor-pointer rounded-full bg-blue-600 px-2.5 py-1 text-white">
                <input type="radio" name="frequency" value="annually" className="sr-only" defaultChecked />
                <span>Annually (Save 17%)</span>
              </label>
            </fieldset>
          </div>

          {/* Pricing Cards */}
          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {tiers.map((tier, tierIdx) => (
              <div
                key={tier.id}
                className={`${
                  tier.mostPopular
                    ? 'lg:z-10 lg:rounded-b-none bg-white ring-2 ring-blue-600'
                    : 'lg:mt-8 bg-white/60 ring-1 ring-gray-200'
                } flex flex-col justify-between rounded-3xl p-8 xl:p-10`}
              >
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3
                      id={tier.id}
                      className={`${
                        tier.mostPopular ? 'text-blue-600' : 'text-gray-900'
                      } text-lg font-semibold leading-8`}
                    >
                      {tier.name}
                    </h3>
                    {tier.mostPopular ? (
                      <p className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600">
                        Most popular
                      </p>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">
                      {tier.priceYearly}
                    </span>
                    {tier.priceYearly !== 'Custom' && (
                      <span className="text-sm font-semibold leading-6 text-gray-600">/year</span>
                    )}
                  </p>
                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckIcon className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                    {tier.limitations.map((limitation) => (
                      <li key={limitation} className="flex gap-x-3 text-gray-400">
                        <XMarkIcon className="h-6 w-5 flex-none text-gray-300" aria-hidden="true" />
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={tier.href}
                  aria-describedby={tier.id}
                  className={`${
                    tier.mostPopular
                      ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-500'
                      : 'text-blue-600 ring-1 ring-inset ring-blue-200 hover:ring-blue-300'
                  } mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}
                >
                  {tier.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Compare all features
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Choose the plan that fits your needs. All plans include our core optimization features.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
              <div className="lg:col-span-1">
                <h3 className="text-lg font-semibold leading-8 text-gray-900">Core Features</h3>
              </div>
              <div className="lg:col-span-3">
                <div className="grid grid-cols-3 gap-6 sm:gap-8">
                  <div className="text-center">
                    <h4 className="text-sm font-semibold leading-6 text-gray-900">Starter</h4>
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-semibold leading-6 text-gray-900">Professional</h4>
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-semibold leading-6 text-gray-900">Enterprise</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
            Frequently asked questions
          </h2>
          <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
            {faqs.map((faq) => (
              <div key={faq.question} className="pt-6">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  {faq.question}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-200">
              Join thousands of businesses optimizing their websites with Zenith.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/signin"
                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="text-base font-semibold leading-6 text-white hover:text-blue-200"
              >
                Contact Sales <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}