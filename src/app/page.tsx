// src/app/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';

// Helper components that would be in their own files
const Header = () => (
    <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
            <div className="flex lg:flex-1">
                <Link href="/" className="-m-1.5 p-1.5">
                    <span className="sr-only">Zenith</span>
                    <img className="h-8 w-auto invert" src="https://i.imgur.com/gC3v66I.png" alt="Zenith Logo" />
                </Link>
            </div>
            <div className="hidden lg:flex lg:gap-x-12">
                <Link href="/features" className="text-sm font-semibold leading-6 text-white">Features</Link>
                <Link href="/pricing" className="text-sm font-semibold leading-6 text-white">Pricing</Link>
                <Link href="/community" className="text-sm font-semibold leading-6 text-white">Community</Link>
                <Link href="/faq" className="text-sm font-semibold leading-6 text-white">FAQ</Link>
            </div>
            <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                <Link href="/dashboard" className="text-sm font-semibold leading-6 text-white">Log in <span aria-hidden="true">&rarr;</span></Link>
            </div>
        </nav>
    </header>
);

const Footer = () => (
    <footer className="bg-gray-900" aria-labelledby="footer-heading">
        <h2 id="footer-heading" className="sr-only">Footer</h2>
        <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
            <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
                <p className="text-xs leading-5 text-gray-400">&copy; 2025 Zenith, Inc. All rights reserved.</p>
            </div>
        </div>
    </footer>
);


const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        {path}
    </svg>
);

const CheckIcon = () => <Icon path={<path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />} className="w-5 h-5 text-blue-500" />;

// Main Landing Page Component
export default function LandingPage() {
    const stats = [
        { name: "Active Users", value: "15,842" },
        { name: "API Calls Today", value: "2,847,593" },
        { name: "Avg Response", value: "47ms" },
        { name: "Uptime", value: "99.99%" },
    ];

    const testimonials = [
        { quote: "Cut our deployment time by 90%", author: "Sarah Chen", role: "CTO at TechStart", initial: "S" },
        { quote: "Best developer experience ever", author: "Marcus Johnson", role: "Lead Dev at Scale", initial: "M" },
        { quote: "Our secret weapon for rapid scaling", author: "Elena Rodriguez", role: "Founder of NextGen", initial: "E" },
    ];
    
    return (
        <div className="bg-gray-900 text-white font-sans">
            <Header />
            <main>
                {/* Hero Section */}
                <div className="relative isolate overflow-hidden pt-14">
                    <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#8085ff] to-[#4f46e5] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
                    </div>
                    <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
                        <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
                            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Build Apps That Think & Scale</h1>
                            <p className="mt-6 text-lg leading-8 text-gray-300">Deploy AI-powered applications in minutes, not months. See it work in 30 seconds.</p>
                            <div className="mt-10 flex items-center gap-x-6">
                                <Link href="/dashboard" className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-blue-500">See Magic in 30 Seconds</Link>
                                <Link href="/pricing" className="text-sm font-semibold leading-6">Start Free Trial <span aria-hidden="true">→</span></Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-10 text-center lg:grid-cols-4">
                        {stats.map((stat) => (
                            <div key={stat.name} className="flex flex-col items-center">
                                <dt className="text-sm leading-6 text-gray-300">{stat.name}</dt>
                                <dd className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{stat.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* NEW: Community & Content Engine Feature Section */}
                <div className="relative isolate mt-32 sm:mt-40">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-4xl text-center">
                            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Your Autonomous <span className="text-blue-500">Content & Community</span> Engine</h2>
                            <p className="mt-6 text-lg leading-8 text-gray-300">
                                Zenith goes beyond building. Our `ContentCuratorAgent` scours the internet for the latest industry news, rewriting and enhancing it into valuable content for your audience, while the `CommunityManagerAgent` fosters engagement in your own private hub.
                            </p>
                        </div>
                        <div className="mt-16 flex justify-center">
                             <div className="relative w-full max-w-4xl">
                                <div className="absolute -inset-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 opacity-25 blur"></div>
                                <div className="relative rounded-lg bg-gray-800/70 p-8 ring-1 ring-white/10">
                                    <h3 className="text-xl font-semibold mb-4">Daily Autonomous Workflow:</h3>
                                    <ol className="space-y-4 text-gray-300">
                                        <li className="flex gap-4"><span className="font-bold text-blue-400">1.</span><span><strong>Scrape &amp; Score:</strong> Agents find and score the best articles daily.</span></li>
                                        <li className="flex gap-4"><span className="font-bold text-blue-400">2.</span><span><strong>Rewrite &amp; Enhance:</strong> AI re-writes content with your brand voice and generates custom images.</span></li>
                                        <li className="flex gap-4"><span className="font-bold text-blue-400">3.</span><span><strong>Format &amp; Distribute:</strong> Posts are tailored for your blog, X, LinkedIn, and more.</span></li>
                                        <li className="flex gap-4"><span className="font-bold text-blue-400">4.</span><span><strong>Publish &amp; Engage:</strong> Approved content is autonomously posted to build your brand while you sleep.</span></li>
                                    </ol>
                                    <div className="mt-8 flex justify-center">
                                        <Link href="/features/content-engine" className="text-sm font-semibold leading-6">Explore the Content Engine <span aria-hidden="true">→</span></Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Testimonials Section */}
                <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:max-w-none">
                         <div className="text-center"><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Trusted by 10,000+ developers</h2></div>
                        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                            {testimonials.map((testimonial) => (
                                <figure key={testimonial.author} className="rounded-2xl bg-white/5 p-6 shadow-sm ring-1 ring-white/10">
                                    <blockquote className="text-white"><p>"{testimonial.quote}"</p></blockquote>
                                    <figcaption className="mt-6 flex items-center gap-x-4">
                                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-indigo-500">{testimonial.initial}</div>
                                        <div><div className="font-semibold text-white">{testimonial.author}</div><div className="text-gray-400">{testimonial.role}</div></div>
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Final CTA Section */}
                <div className="mx-auto my-32 max-w-7xl px-6 sm:my-40 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to 10x Your Development?</h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-300">Join thousands of developers building the future with Zenith.</p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link href="/pricing" className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-blue-500">Start Building Now</Link>
                            <Link href="/contact" className="text-sm font-semibold leading-6">Schedule Demo <span aria-hidden="true">→</span></Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
