import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { 
  DocumentTextIcon,
  PlayIcon,
  BookOpenIcon,
  CodeBracketIcon,
  AcademicCapIcon,
  ChartBarIcon,
  LightBulbIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resources - Learn Website Optimization Best Practices',
  description: 'Comprehensive guides, tutorials, and insights on website optimization, SEO, performance, security, and AI-powered analysis. Expert knowledge from industry leaders.',
  keywords: ['website optimization guides', 'SEO tutorials', 'performance tips', 'security best practices', 'AI optimization', 'web development resources'],
  openGraph: {
    title: 'Zenith Resources - Learn Website Optimization Best Practices',
    description: 'Comprehensive guides and expert insights on website optimization, SEO, performance, and AI-powered analysis.',
    url: 'https://zenith.engineer/resources',
  },
  twitter: {
    title: 'Zenith Resources - Learn Website Optimization Best Practices',
    description: 'Comprehensive guides and expert insights on website optimization, SEO, performance, and AI-powered analysis.',
  },
  alternates: {
    canonical: '/resources',
  },
};

const featuredPost = {
  id: 1,
  title: 'The Complete Guide to Website Performance Optimization in 2024',
  href: '/resources/complete-guide-website-performance',
  description: 'Everything you need to know about optimizing your website for speed, SEO, and user experience in 2024.',
  imageUrl: '/blog/performance-guide-2024.jpg',
  date: 'Mar 16, 2024',
  datetime: '2024-03-16',
  category: { title: 'Guide', href: '/resources/category/guides' },
  author: {
    name: 'Sarah Chen',
    role: 'Head of Product',
    href: '#',
    imageUrl: '/team/sarah-chen.jpg',
  },
  readTime: '12 min read',
  featured: true,
};

const posts = [
  {
    id: 2,
    title: 'AI-Powered SEO: How Machine Learning is Changing Search Optimization',
    href: '/resources/ai-powered-seo',
    description: 'Discover how artificial intelligence is revolutionizing SEO strategies and what it means for your website.',
    imageUrl: '/blog/ai-seo.jpg',
    date: 'Mar 12, 2024',
    datetime: '2024-03-12',
    category: { title: 'SEO', href: '/resources/category/seo' },
    author: {
      name: 'Mike Rodriguez',
      role: 'Senior SEO Specialist',
      href: '#',
      imageUrl: '/team/mike-rodriguez.jpg',
    },
    readTime: '8 min read',
  },
  {
    id: 3,
    title: '10 Common Website Security Vulnerabilities and How to Fix Them',
    href: '/resources/website-security-vulnerabilities',
    description: 'Learn about the most common security issues affecting websites and practical steps to protect your site.',
    imageUrl: '/blog/security-guide.jpg',
    date: 'Mar 8, 2024',
    datetime: '2024-03-08',
    category: { title: 'Security', href: '/resources/category/security' },
    author: {
      name: 'Alex Thompson',
      role: 'Security Engineer',
      href: '#',
      imageUrl: '/team/alex-thompson.jpg',
    },
    readTime: '10 min read',
  },
  {
    id: 4,
    title: 'Mobile-First Design: Best Practices for 2024',
    href: '/resources/mobile-first-design',
    description: 'Essential strategies for creating mobile-optimized websites that convert visitors into customers.',
    imageUrl: '/blog/mobile-design.jpg',
    date: 'Mar 5, 2024',
    datetime: '2024-03-05',
    category: { title: 'Design', href: '/resources/category/design' },
    author: {
      name: 'Lisa Park',
      role: 'UX Designer',
      href: '#',
      imageUrl: '/team/lisa-park.jpg',
    },
    readTime: '6 min read',
  },
  {
    id: 5,
    title: 'Understanding Core Web Vitals: A Complete Guide',
    href: '/resources/core-web-vitals-guide',
    description: 'Master Google\'s Core Web Vitals metrics and learn how to optimize them for better search rankings.',
    imageUrl: '/blog/core-web-vitals.jpg',
    date: 'Feb 28, 2024',
    datetime: '2024-02-28',
    category: { title: 'Performance', href: '/resources/category/performance' },
    author: {
      name: 'David Kim',
      role: 'Performance Engineer',
      href: '#',
      imageUrl: '/team/david-kim.jpg',
    },
    readTime: '9 min read',
  },
  {
    id: 6,
    title: 'Competitive Analysis: Tools and Strategies for 2024',
    href: '/resources/competitive-analysis-guide',
    description: 'Learn how to effectively analyze your competition and identify opportunities for growth.',
    imageUrl: '/blog/competitive-analysis.jpg',
    date: 'Feb 24, 2024',
    datetime: '2024-02-24',
    category: { title: 'Strategy', href: '/resources/category/strategy' },
    author: {
      name: 'Emma Wilson',
      role: 'Marketing Strategist',
      href: '#',
      imageUrl: '/team/emma-wilson.jpg',
    },
    readTime: '7 min read',
  },
];

const resourceCategories = [
  {
    name: 'Guides & Tutorials',
    description: 'In-depth guides and step-by-step tutorials',
    icon: BookOpenIcon,
    count: 24,
    href: '/resources/category/guides',
  },
  {
    name: 'Video Content',
    description: 'Video tutorials and webinar recordings',
    icon: PlayIcon,
    count: 18,
    href: '/resources/category/videos',
  },
  {
    name: 'Documentation',
    description: 'Technical documentation and API references',
    icon: DocumentTextIcon,
    count: 32,
    href: '/resources/category/docs',
  },
  {
    name: 'Code Examples',
    description: 'Sample code and implementation examples',
    icon: CodeBracketIcon,
    count: 15,
    href: '/resources/category/code',
  },
  {
    name: 'Best Practices',
    description: 'Industry best practices and recommendations',
    icon: LightBulbIcon,
    count: 28,
    href: '/resources/category/best-practices',
  },
  {
    name: 'Security',
    description: 'Security guides and vulnerability reports',
    icon: ShieldCheckIcon,
    count: 12,
    href: '/resources/category/security',
  },
];

const topics = [
  'All Topics',
  'SEO',
  'Performance',
  'Security',
  'Design',
  'Strategy',
  'Analytics',
  'Mobile',
  'AI & ML',
];

export default function Resources() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Resources</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Learn, grow, and optimize with our expert insights
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Discover the latest trends, best practices, and actionable strategies 
            to improve your website performance and grow your business.
          </p>
        </div>
      </div>

      {/* Resource Categories */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Browse by category
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Find the right resources for your needs, organized by topic and format.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {resourceCategories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-x-4">
                  <category.icon className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    <p className="text-sm text-blue-600 mt-2">{category.count} resources</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Article */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Featured Article
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our most comprehensive guide to website optimization.
            </p>
          </div>
          <article className="mx-auto mt-16 max-w-2xl lg:mx-0 lg:max-w-none">
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
              <div className="relative">
                <div className="aspect-[3/2] overflow-hidden rounded-2xl bg-gray-100 lg:aspect-[3/2]">
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Featured Article Image
                  </div>
                </div>
              </div>
              <div className="mt-10 lg:mt-0">
                <div className="flex items-center gap-x-4 text-xs">
                  <time dateTime={featuredPost.datetime} className="text-gray-500">
                    {featuredPost.date}
                  </time>
                  <Link
                    href={featuredPost.category.href}
                    className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
                  >
                    {featuredPost.category.title}
                  </Link>
                  <span className="text-gray-500">{featuredPost.readTime}</span>
                </div>
                <div className="group relative max-w-xl">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                    <Link href={featuredPost.href}>
                      <span className="absolute inset-0" />
                      {featuredPost.title}
                    </Link>
                  </h3>
                  <p className="mt-5 text-sm leading-6 text-gray-600">{featuredPost.description}</p>
                </div>
                <div className="relative mt-8 flex items-center gap-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-500">
                      {featuredPost.author.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="text-sm leading-6">
                    <p className="font-semibold text-gray-900">
                      <Link href={featuredPost.author.href}>
                        <span className="absolute inset-0" />
                        {featuredPost.author.name}
                      </Link>
                    </p>
                    <p className="text-gray-600">{featuredPost.author.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* Latest Articles */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Latest Articles
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Stay up to date with the latest insights and trends in website optimization.
            </p>
          </div>

          {/* Topic Filter */}
          <div className="mt-16 flex flex-wrap justify-center gap-4">
            {topics.map((topic) => (
              <button
                key={topic}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="flex flex-col items-start bg-white rounded-2xl p-6 shadow-sm">
                <div className="relative w-full">
                  <div className="aspect-[16/9] w-full rounded-lg bg-gray-100 object-cover flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Article Image</span>
                  </div>
                </div>
                <div className="flex items-center gap-x-4 text-xs mt-4">
                  <time dateTime={post.datetime} className="text-gray-500">
                    {post.date}
                  </time>
                  <Link
                    href={post.category.href}
                    className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
                  >
                    {post.category.title}
                  </Link>
                  <span className="text-gray-500">{post.readTime}</span>
                </div>
                <div className="group relative mt-3">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                    <Link href={post.href}>
                      <span className="absolute inset-0" />
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">{post.description}</p>
                </div>
                <div className="relative mt-8 flex items-center gap-x-4">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-500">
                      {post.author.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="text-sm leading-6">
                    <p className="font-semibold text-gray-900">
                      <Link href={post.author.href}>
                        <span className="absolute inset-0" />
                        {post.author.name}
                      </Link>
                    </p>
                    <p className="text-gray-600">{post.author.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-16 text-center">
            <button className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500">
              Load More Articles
            </button>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Stay in the loop
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-200">
              Get the latest articles, guides, and insights delivered straight to your inbox.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <div className="flex gap-x-4">
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="min-w-0 flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-white/75 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6"
                  placeholder="Enter your email"
                />
                <button
                  type="submit"
                  className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}