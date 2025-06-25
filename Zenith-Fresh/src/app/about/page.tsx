import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { 
  RocketLaunchIcon,
  LightBulbIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Pioneering the Future of Website Optimization',
  description: 'Learn about Zenith\'s mission to democratize AI-powered website optimization. Meet our team of experts from Google and Meta who are transforming digital experiences.',
  keywords: ['about zenith', 'company story', 'team', 'AI optimization experts', 'website optimization company', 'digital transformation'],
  openGraph: {
    title: 'About Zenith - Pioneering the Future of Website Optimization',
    description: 'Learn about our mission to democratize AI-powered website optimization and meet our expert team.',
    url: 'https://zenith.engineer/about',
  },
  twitter: {
    title: 'About Zenith - Pioneering the Future of Website Optimization',
    description: 'Learn about our mission to democratize AI-powered website optimization and meet our expert team.',
  },
  alternates: {
    canonical: '/about',
  },
};

const values = [
  {
    name: 'Innovation First',
    description: 'We push the boundaries of what\'s possible with AI and machine learning to deliver cutting-edge solutions.',
    icon: LightBulbIcon,
  },
  {
    name: 'Customer Success',
    description: 'Your success is our success. We\'re committed to helping you achieve your business goals.',
    icon: ChartBarIcon,
  },
  {
    name: 'Security & Privacy',
    description: 'We prioritize the security and privacy of your data with enterprise-grade protection.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Continuous Improvement',
    description: 'We\'re always learning, adapting, and improving our platform based on user feedback.',
    icon: CogIcon,
  },
];

const team = [
  {
    name: 'Sarah Chen',
    role: 'CEO & Co-founder',
    bio: 'Former VP of Engineering at Google with 15+ years in AI and machine learning. Led teams that built search algorithms used by billions.',
    image: '/team/sarah-chen.jpg', // Placeholder
  },
  {
    name: 'Marcus Rodriguez',
    role: 'CTO & Co-founder',
    bio: 'Previously Principal Engineer at Meta, specializing in large-scale distributed systems and performance optimization.',
    image: '/team/marcus-rodriguez.jpg', // Placeholder
  },
  {
    name: 'Dr. Emily Watson',
    role: 'Head of AI Research',
    bio: 'PhD in Computer Science from Stanford. Published 50+ papers on machine learning and natural language processing.',
    image: '/team/emily-watson.jpg', // Placeholder
  },
  {
    name: 'David Kim',
    role: 'VP of Product',
    bio: '10+ years in product management at successful SaaS companies. Expert in user experience and product strategy.',
    image: '/team/david-kim.jpg', // Placeholder
  },
];

const stats = [
  { name: 'Founded', value: '2022' },
  { name: 'Team Members', value: '50+' },
  { name: 'Customers Served', value: '10,000+' },
  { name: 'Countries', value: '25+' },
];

const milestones = [
  {
    year: '2022',
    title: 'Company Founded',
    description: 'Zenith was founded with a mission to democratize AI-powered website optimization.',
  },
  {
    year: '2023',
    title: 'Series A Funding',
    description: 'Raised $15M Series A to accelerate product development and market expansion.',
  },
  {
    year: '2023',
    title: '1,000 Customers',
    description: 'Reached our first major milestone of 1,000 active customers worldwide.',
  },
  {
    year: '2024',
    title: 'Enterprise Platform',
    description: 'Launched enterprise-grade features with SOC 2 compliance and advanced security.',
  },
  {
    year: '2024',
    title: 'AI Orchestration',
    description: 'Introduced industry-first AI orchestration platform for automated optimization.',
  },
];

export default function About() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">About Zenith</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Pioneering the future of website optimization
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We're on a mission to make AI-powered website optimization accessible to businesses of all sizes. 
            Our platform combines cutting-edge technology with intuitive design to deliver real results.
          </p>
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our Story</h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Zenith was born from a simple observation: most businesses struggle to optimize their websites 
              effectively due to the complexity and cost of existing solutions. Our founders, veterans of 
              Google and Meta, saw an opportunity to democratize access to enterprise-grade optimization tools.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
              <h3 className="mt-6 text-lg font-semibold text-gray-900">The Problem</h3>
              <p className="mt-4 text-gray-600">
                Website optimization was too complex, expensive, and time-consuming for most businesses. 
                Existing tools required deep technical expertise and significant resources.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <LightBulbIcon className="h-8 w-8 text-blue-600" />
              <h3 className="mt-6 text-lg font-semibold text-gray-900">The Vision</h3>
              <p className="mt-4 text-gray-600">
                We envisioned a platform that would make AI-powered optimization accessible to everyone, 
                from startups to Fortune 500 companies, with no technical expertise required.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              <h3 className="mt-6 text-lg font-semibold text-gray-900">The Solution</h3>
              <p className="mt-4 text-gray-600">
                Zenith combines advanced AI algorithms with an intuitive interface, providing 
                enterprise-grade optimization tools that anyone can use effectively.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our Values</h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              These core values guide everything we do, from product development to customer support.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
              {values.map((value) => (
                <div key={value.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <value.icon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                    {value.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{value.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-600 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">By the numbers</h2>
            <p className="mt-6 text-lg leading-8 text-blue-200">
              Our growth reflects the trust our customers place in us.
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

      {/* Team Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Meet our team</h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              We're a diverse team of engineers, designers, and business leaders united by our passion for innovation.
            </p>
          </div>
          <div className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            {team.map((person) => (
              <div key={person.name} className="flex flex-col lg:flex-row lg:items-start lg:gap-x-8">
                <div className="w-48 h-48 bg-gray-200 rounded-2xl flex-shrink-0 mb-6 lg:mb-0 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Photo</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold leading-8 text-gray-900">{person.name}</h3>
                  <p className="text-base leading-7 text-blue-600">{person.role}</p>
                  <p className="mt-4 text-base leading-7 text-gray-600">{person.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our journey</h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Key milestones in our mission to transform website optimization.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={milestone.year} className="relative flex gap-x-4">
                  <div className={`absolute left-0 top-0 flex w-6 justify-center ${index < milestones.length - 1 ? 'h-full' : 'h-6'}`}>
                    <div className="w-px bg-gray-200" />
                  </div>
                  <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600 ring-1 ring-blue-600" />
                  </div>
                  <div className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
                    <div className="font-medium text-gray-900">{milestone.title}</div>
                    <div className="text-blue-600 font-semibold">{milestone.year}</div>
                    <div className="mt-1 text-gray-600">{milestone.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Join us on our mission
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-200">
              Whether you're looking to optimize your website or join our team, we'd love to hear from you.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/signin"
                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
              >
                Start Free Trial
              </Link>
              <Link
                href="/careers"
                className="text-base font-semibold leading-6 text-white hover:text-blue-200"
              >
                View Careers <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}