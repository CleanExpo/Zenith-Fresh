import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import TestimonialsSection from '@/components/marketing/TestimonialsSection';
import { 
  ChartBarIcon, 
  CogIcon, 
  ShieldCheckIcon, 
  RocketLaunchIcon,
  UserGroupIcon,
  LightBulbIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Website Health Analyzer',
    description: 'Comprehensive website analysis with SEO, performance, security, and accessibility insights.',
    icon: ChartBarIcon,
  },
  {
    name: 'Competitive Intelligence',
    description: 'Monitor competitors, track market trends, and identify growth opportunities.',
    icon: LightBulbIcon,
  },
  {
    name: 'AI-Powered Optimization',
    description: 'Smart recommendations powered by machine learning and AI analysis.',
    icon: CogIcon,
  },
  {
    name: 'Team Collaboration',
    description: 'Work together with your team on projects, share insights, and track progress.',
    icon: UserGroupIcon,
  },
  {
    name: 'Enterprise Security',
    description: 'Bank-grade security with SOC 2 compliance and enterprise-level protection.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Scalable Infrastructure',
    description: 'Auto-scaling architecture that grows with your business needs.',
    icon: RocketLaunchIcon,
  },
];

const benefits = [
  'Increase website performance by up to 40%',
  'Improve search rankings with AI-driven SEO insights',
  'Reduce security vulnerabilities by 95%',
  'Save 20+ hours per week on manual analysis',
  'Get actionable insights in real-time',
  'Scale your optimization efforts automatically',
];

const stats = [
  { name: 'Websites Analyzed', value: '50,000+' },
  { name: 'Performance Boost', value: '40%' },
  { name: 'Time Saved', value: '20hrs/week' },
  { name: 'Client Satisfaction', value: '98%' },
];

export default function Home() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
        
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Optimize Your Website with{' '}
              <span className="text-blue-600">AI-Powered Intelligence</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Transform your website performance with comprehensive analysis, competitive intelligence, 
              and AI-driven optimization. Get actionable insights that drive real business results.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/free-analyzer"
                className="rounded-md bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 flex items-center gap-2"
              >
                Try Free Analyzer - No Signup
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link
                href="/auth/signin"
                className="text-base font-semibold leading-6 text-gray-900 hover:text-blue-600"
              >
                Sign In <span aria-hidden="true">→</span>
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Powerful Features</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to optimize your website
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our comprehensive platform provides all the tools and insights you need to maximize your website's potential.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <feature.icon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Proven Results</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              See the impact on your business
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Join thousands of businesses that have transformed their online presence with Zenith.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-x-3">
                  <CheckIcon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                  <span className="text-base leading-7 text-gray-600">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <TestimonialsSection 
        maxTestimonials={3}
        title="Trusted by industry leaders"
        subtitle="See what our customers are saying about their results with Zenith."
      />

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to optimize your website?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-200">
              Start your free trial today and see the difference AI-powered optimization can make for your business.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/free-analyzer"
                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Try Free Analyzer Now
              </Link>
              <Link
                href="/auth/signin"
                className="text-base font-semibold leading-6 text-white hover:text-blue-200"
              >
                Sign In for Full Access <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}