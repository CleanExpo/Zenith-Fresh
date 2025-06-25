import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { 
  ChartBarIcon, 
  CogIcon, 
  ShieldCheckIcon, 
  RocketLaunchIcon,
  UserGroupIcon,
  LightBulbIcon,
  EyeIcon,
  DocumentChartBarIcon,
  ClockIcon,
  BellIcon,
  CloudIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features - Complete Website Optimization Platform',
  description: 'Discover Zenith\'s comprehensive features: AI-powered analysis, competitive intelligence, team collaboration, enterprise security, and scalable infrastructure.',
  keywords: ['website features', 'AI analysis', 'competitive intelligence', 'team collaboration', 'enterprise security', 'website monitoring'],
  openGraph: {
    title: 'Zenith Features - Complete Website Optimization Platform',
    description: 'Discover comprehensive features for AI-powered website optimization and competitive intelligence.',
    url: 'https://zenith.engineer/features',
  },
  twitter: {
    title: 'Zenith Features - Complete Website Optimization Platform',
    description: 'Discover comprehensive features for AI-powered website optimization and competitive intelligence.',
  },
  alternates: {
    canonical: '/features',
  },
};

const mainFeatures = [
  {
    name: 'Website Health Analyzer',
    description: 'Comprehensive website analysis with actionable insights and recommendations.',
    icon: ChartBarIcon,
    features: [
      'SEO Performance Analysis',
      'Page Speed Optimization',
      'Mobile Responsiveness Check',
      'Security Vulnerability Scan',
      'Accessibility Compliance',
      'Technical SEO Audit',
      'Core Web Vitals Monitoring',
      'Structured Data Validation'
    ]
  },
  {
    name: 'Competitive Intelligence',
    description: 'Monitor competitors and discover market opportunities with AI-powered analysis.',
    icon: LightBulbIcon,
    features: [
      'Competitor Website Tracking',
      'Market Share Analysis',
      'Content Gap Identification',
      'Keyword Opportunity Discovery',
      'Backlink Analysis',
      'Social Media Monitoring',
      'Pricing Intelligence',
      'Feature Comparison Matrix'
    ]
  },
  {
    name: 'AI-Powered Optimization',
    description: 'Smart recommendations powered by machine learning and advanced algorithms.',
    icon: CogIcon,
    features: [
      'Automated A/B Testing',
      'Content Optimization Suggestions',
      'Conversion Rate Optimization',
      'Personalization Engine',
      'Predictive Analytics',
      'Smart Recommendations',
      'Performance Forecasting',
      'ROI Optimization'
    ]
  },
  {
    name: 'Team Collaboration',
    description: 'Work together seamlessly with advanced project management and collaboration tools.',
    icon: UserGroupIcon,
    features: [
      'Multi-user Workspaces',
      'Role-based Permissions',
      'Project Management',
      'Real-time Collaboration',
      'Task Assignment',
      'Progress Tracking',
      'Team Analytics',
      'Communication Hub'
    ]
  },
  {
    name: 'Enterprise Security',
    description: 'Bank-grade security with compliance and advanced threat protection.',
    icon: ShieldCheckIcon,
    features: [
      'SOC 2 Type II Compliance',
      'End-to-end Encryption',
      'Single Sign-On (SSO)',
      'Advanced Threat Detection',
      'Data Loss Prevention',
      'Audit Logging',
      'IP Whitelisting',
      'GDPR Compliance'
    ]
  },
  {
    name: 'Scalable Infrastructure',
    description: 'Auto-scaling architecture that grows with your business needs.',
    icon: RocketLaunchIcon,
    features: [
      'Auto-scaling Capability',
      'Global CDN Integration',
      'Load Balancing',
      '99.9% Uptime SLA',
      'Disaster Recovery',
      'Multi-region Deployment',
      'Performance Monitoring',
      'Capacity Planning'
    ]
  }
];

const additionalFeatures = [
  {
    category: 'Analytics & Reporting',
    icon: DocumentChartBarIcon,
    features: [
      'Custom Dashboards',
      'White-label Reports',
      'Automated Reporting',
      'Data Export (CSV, PDF)',
      'Historical Data Analysis',
      'Performance Benchmarking'
    ]
  },
  {
    category: 'Monitoring & Alerts',
    icon: BellIcon,
    features: [
      'Real-time Monitoring',
      'Custom Alert Rules',
      'Multi-channel Notifications',
      'Uptime Monitoring',
      'Performance Alerts',
      'Security Notifications'
    ]
  },
  {
    category: 'Integrations',
    icon: CloudIcon,
    features: [
      'Google Analytics Integration',
      'Search Console Connection',
      'CRM Synchronization',
      'Marketing Tool Integration',
      'Webhook Support',
      'REST API Access'
    ]
  },
  {
    category: 'Automation',
    icon: ClockIcon,
    features: [
      'Scheduled Scans',
      'Automated Workflows',
      'Smart Scheduling',
      'Batch Processing',
      'Auto-remediation',
      'Workflow Orchestration'
    ]
  }
];

const competitorComparison = {
  competitors: ['Zenith', 'SEMrush', 'Ahrefs', 'Screaming Frog', 'GTmetrix'],
  features: [
    { name: 'AI-Powered Analysis', zenith: true, semrush: false, ahrefs: false, frog: false, gtmetrix: false },
    { name: 'Real-time Monitoring', zenith: true, semrush: true, ahrefs: false, frog: false, gtmetrix: true },
    { name: 'Team Collaboration', zenith: true, semrush: true, ahrefs: true, frog: false, gtmetrix: false },
    { name: 'White-label Reports', zenith: true, semrush: true, ahrefs: false, frog: false, gtmetrix: false },
    { name: 'API Access', zenith: true, semrush: true, ahrefs: true, frog: false, gtmetrix: true },
    { name: 'Enterprise Security', zenith: true, semrush: true, ahrefs: false, frog: false, gtmetrix: false },
    { name: 'Auto-scaling', zenith: true, semrush: false, ahrefs: false, frog: false, gtmetrix: false },
    { name: 'Competitive Intelligence', zenith: true, semrush: true, ahrefs: true, frog: false, gtmetrix: false },
  ]
};

export default function Features() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Features</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to optimize your online presence
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Discover how Zenith's comprehensive feature set gives you the competitive edge 
            you need to succeed in today's digital landscape.
          </p>
        </div>
      </div>

      {/* Main Features */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Core Platform Features
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our comprehensive platform provides all the tools you need to analyze, optimize, and scale your digital presence.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
              {mainFeatures.map((feature) => (
                <div key={feature.name} className="bg-white rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center gap-x-3">
                    <feature.icon className="h-8 w-8 text-blue-600" aria-hidden="true" />
                    <h3 className="text-xl font-semibold leading-7 text-gray-900">{feature.name}</h3>
                  </div>
                  <p className="mt-4 text-base leading-7 text-gray-600">{feature.description}</p>
                  <ul className="mt-6 space-y-2">
                    {feature.features.map((item) => (
                      <li key={item} className="flex items-center gap-x-2 text-sm text-gray-600">
                        <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Advanced Capabilities
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Extended functionality to power your business growth and operational excellence.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-8">
            {additionalFeatures.map((category) => (
              <div key={category.category} className="bg-gray-50 rounded-2xl p-8">
                <div className="flex items-center gap-x-3 mb-6">
                  <category.icon className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
                </div>
                <ul className="space-y-3">
                  {category.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-x-2 text-sm text-gray-600">
                      <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Competitor Comparison */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How we compare
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              See how Zenith stacks up against other solutions in the market.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Feature
                      </th>
                      {competitorComparison.competitors.map((competitor) => (
                        <th key={competitor} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {competitor}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {competitorComparison.features.map((feature, index) => (
                      <tr key={feature.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {feature.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {feature.zenith ? (
                            <CheckCircleIcon className="h-5 w-5 text-blue-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {feature.semrush ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {feature.ahrefs ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {feature.frog ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {feature.gtmetrix ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Experience the full power of Zenith
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-200">
              Start your free trial today and discover how our comprehensive feature set can transform your business.
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
                Book a Demo <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}