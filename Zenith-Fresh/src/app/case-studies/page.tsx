import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { 
  ArrowUpIcon,
  ClockIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case Studies - Real Results from Real Businesses',
  description: 'Discover how businesses across industries achieved remarkable growth with Zenith. See real results: 67% average revenue increase, 54% conversion lift.',
  keywords: ['case studies', 'success stories', 'customer results', 'website optimization results', 'business growth', 'ROI improvement'],
  openGraph: {
    title: 'Zenith Case Studies - Real Results from Real Businesses',
    description: 'Discover how businesses achieved remarkable growth with AI-powered website optimization. Real results, proven success.',
    url: 'https://zenith.engineer/case-studies',
  },
  twitter: {
    title: 'Zenith Case Studies - Real Results from Real Businesses',
    description: 'Discover how businesses achieved remarkable growth with AI-powered website optimization. Real results, proven success.',
  },
  alternates: {
    canonical: '/case-studies',
  },
};

const caseStudies = [
  {
    id: 'ecommerce-retailer',
    title: 'E-commerce Giant Increases Revenue by 43%',
    company: 'GlobalShop',
    industry: 'E-commerce',
    image: '/case-studies/globalshop.jpg', // Placeholder
    summary: 'How a leading e-commerce retailer used Zenith to optimize their website performance and boost conversion rates.',
    challenge: 'High bounce rates and slow page load times were affecting customer experience and sales.',
    solution: 'Implemented comprehensive performance optimization and AI-driven UX improvements.',
    results: {
      revenue: '+43%',
      pageSpeed: '+62%',
      conversion: '+28%',
      bounceRate: '-35%'
    },
    testimonial: {
      quote: "Zenith transformed our online presence. The AI-powered insights helped us identify issues we didn't even know existed, and the results speak for themselves.",
      author: "Sarah Johnson",
      role: "VP of Digital Marketing"
    },
    tags: ['E-commerce', 'Performance', 'AI Optimization'],
    readTime: '8 min read',
    featured: true
  },
  {
    id: 'saas-startup',
    title: 'SaaS Startup Improves Trial Conversion by 89%',
    company: 'TechFlow',
    industry: 'SaaS',
    image: '/case-studies/techflow.jpg', // Placeholder
    summary: 'A fast-growing SaaS startup leveraged competitive intelligence to outperform competitors.',
    challenge: 'Low trial-to-paid conversion rates and difficulty competing with established players.',
    solution: 'Used competitive analysis and optimization strategies to improve user onboarding flow.',
    results: {
      conversion: '+89%',
      churn: '-45%',
      ltv: '+67%',
      acquisition: '+34%'
    },
    testimonial: {
      quote: "The competitive intelligence features gave us insights that completely changed our strategy. We now outperform competitors who have been in the market for years.",
      author: "Mike Chen",
      role: "Co-founder & CEO"
    },
    tags: ['SaaS', 'Competitive Intelligence', 'Conversion Optimization'],
    readTime: '6 min read',
    featured: true
  },
  {
    id: 'healthcare-provider',
    title: 'Healthcare Provider Enhances Patient Experience',
    company: 'HealthFirst Medical',
    industry: 'Healthcare',
    image: '/case-studies/healthfirst.jpg', // Placeholder
    summary: 'How a healthcare provider improved patient satisfaction and appointment bookings.',
    challenge: 'Complex website navigation was frustrating patients and reducing online appointments.',
    solution: 'Streamlined user experience with accessibility improvements and mobile optimization.',
    results: {
      appointments: '+56%',
      satisfaction: '+41%',
      accessibility: '+78%',
      mobile: '+52%'
    },
    testimonial: {
      quote: "Patient satisfaction scores have never been higher. The website improvements made it so much easier for our patients to find information and book appointments.",
      author: "Dr. Lisa Rodriguez",
      role: "Chief Medical Officer"
    },
    tags: ['Healthcare', 'Accessibility', 'User Experience'],
    readTime: '7 min read',
    featured: false
  },
  {
    id: 'financial-services',
    title: 'Financial Services Firm Boosts Lead Generation',
    company: 'WealthAdvisors',
    industry: 'Financial Services',
    image: '/case-studies/wealthadvisors.jpg', // Placeholder
    summary: 'A financial services firm used SEO optimization to increase qualified leads.',
    challenge: 'Low organic search visibility was limiting lead generation potential.',
    solution: 'Comprehensive SEO strategy with content optimization and technical improvements.',
    results: {
      leads: '+73%',
      organic: '+91%',
      ranking: '+84%',
      engagement: '+38%'
    },
    testimonial: {
      quote: "Our organic search performance has exceeded all expectations. The quality of leads we're getting now is significantly higher than before.",
      author: "Robert Kim",
      role: "Director of Marketing"
    },
    tags: ['Financial Services', 'SEO', 'Lead Generation'],
    readTime: '5 min read',
    featured: false
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing Company Modernizes Digital Presence',
    company: 'IndustrialTech',
    industry: 'Manufacturing',
    image: '/case-studies/industrialtech.jpg', // Placeholder
    summary: 'How a traditional manufacturing company transformed their digital marketing strategy.',
    challenge: 'Outdated website and poor mobile experience were hampering B2B sales efforts.',
    solution: 'Complete website redesign with B2B optimization and lead nurturing improvements.',
    results: {
      inquiries: '+125%',
      mobile: '+89%',
      engagement: '+67%',
      sales: '+45%'
    },
    testimonial: {
      quote: "We went from having virtually no online presence to generating 40% of our leads digitally. The transformation has been remarkable.",
      author: "James Thompson",
      role: "VP of Sales & Marketing"
    },
    tags: ['Manufacturing', 'B2B', 'Digital Transformation'],
    readTime: '9 min read',
    featured: false
  },
  {
    id: 'nonprofit',
    title: 'Nonprofit Increases Donations by 156%',
    company: 'GlobalAid Foundation',
    industry: 'Nonprofit',
    image: '/case-studies/globalaid.jpg', // Placeholder
    summary: 'A nonprofit organization optimized their donation process and storytelling approach.',
    challenge: 'Complex donation process and poor mobile experience were limiting contributions.',
    solution: 'Simplified donation flow with emotional storytelling and trust signal optimization.',
    results: {
      donations: '+156%',
      donors: '+89%',
      retention: '+67%',
      mobile: '+123%'
    },
    testimonial: {
      quote: "The impact on our mission has been incredible. We're now able to help twice as many families thanks to the increased donations through our website.",
      author: "Maria Gonzalez",
      role: "Executive Director"
    },
    tags: ['Nonprofit', 'Donation Optimization', 'Mobile'],
    readTime: '6 min read',
    featured: false
  }
];

const industries = ['All', 'E-commerce', 'SaaS', 'Healthcare', 'Financial Services', 'Manufacturing', 'Nonprofit'];

const stats = [
  { name: 'Average Revenue Increase', value: '67%' },
  { name: 'Average Conversion Lift', value: '54%' },
  { name: 'Average Page Speed Improvement', value: '78%' },
  { name: 'Client Satisfaction Rate', value: '98%' },
];

export default function CaseStudies() {
  const featuredCases = caseStudies.filter(cs => cs.featured);
  const otherCases = caseStudies.filter(cs => !cs.featured);

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Case Studies</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Real results from real businesses
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Discover how companies across industries have transformed their digital presence 
            and achieved remarkable growth with Zenith.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-600 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Proven impact across industries
            </h2>
            <p className="mt-6 text-lg leading-8 text-blue-200">
              Our clients consistently achieve exceptional results with Zenith's AI-powered optimization.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <dt className="text-base leading-7 text-blue-200">{stat.name}</dt>
                <dd className="order-first text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Case Studies */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Featured Success Stories
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Dive deep into our most impactful transformations.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            {featuredCases.map((caseStudy) => (
              <article key={caseStudy.id} className="flex flex-col items-start">
                <div className="relative w-full">
                  <div className="aspect-[16/9] w-full rounded-2xl bg-gray-100 object-cover sm:aspect-[2/1] lg:aspect-[3/2] flex items-center justify-center">
                    <span className="text-gray-500">Case Study Image</span>
                  </div>
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                </div>
                <div className="max-w-xl">
                  <div className="mt-8 flex items-center gap-x-4 text-xs">
                    <time className="text-gray-500">{caseStudy.readTime}</time>
                    <span className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600">
                      {caseStudy.industry}
                    </span>
                  </div>
                  <div className="group relative">
                    <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                      <Link href={`/case-studies/${caseStudy.id}`}>
                        <span className="absolute inset-0" />
                        {caseStudy.title}
                      </Link>
                    </h3>
                    <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
                      {caseStudy.summary}
                    </p>
                  </div>
                  
                  {/* Results Preview */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {Object.entries(caseStudy.results).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{value}</div>
                        <div className="text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      </div>
                    ))}
                  </div>

                  {/* Testimonial */}
                  <blockquote className="mt-6 border-l-4 border-blue-600 pl-4">
                    <p className="text-sm italic text-gray-600">"{caseStudy.testimonial.quote}"</p>
                    <footer className="mt-2">
                      <cite className="text-xs text-gray-500">
                        {caseStudy.testimonial.author}, {caseStudy.testimonial.role}
                      </cite>
                    </footer>
                  </blockquote>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* All Case Studies Grid */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              More Success Stories
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Explore additional case studies across different industries and use cases.
            </p>
          </div>

          {/* Industry Filter */}
          <div className="mt-16 flex flex-wrap justify-center gap-4">
            {industries.map((industry) => (
              <button
                key={industry}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                {industry}
              </button>
            ))}
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {otherCases.map((caseStudy) => (
              <article key={caseStudy.id} className="flex flex-col items-start bg-white rounded-2xl p-6 shadow-sm">
                <div className="relative w-full">
                  <div className="aspect-[16/9] w-full rounded-lg bg-gray-100 object-cover flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Case Study</span>
                  </div>
                </div>
                <div className="flex items-center gap-x-4 text-xs mt-4">
                  <time className="text-gray-500">{caseStudy.readTime}</time>
                  <span className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600">
                    {caseStudy.industry}
                  </span>
                </div>
                <div className="group relative mt-3">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                    <Link href={`/case-studies/${caseStudy.id}`}>
                      <span className="absolute inset-0" />
                      {caseStudy.title}
                    </Link>
                  </h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
                    {caseStudy.summary}
                  </p>
                </div>

                {/* Key Results */}
                <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                  {Object.entries(caseStudy.results).slice(0, 2).map(([key, value]) => (
                    <div key={key} className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-bold text-blue-600">{value}</div>
                      <div className="text-xs text-gray-600 capitalize">{key}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-1">
                  {caseStudy.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to write your success story?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-200">
              Join hundreds of businesses that have transformed their digital presence with Zenith. 
              Your success story could be next.
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