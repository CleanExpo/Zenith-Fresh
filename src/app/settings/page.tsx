// src/app/page.tsx
'use client';

import React from 'react';

// SVG Icon Helper Component
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        {path}
    </svg>
);

const CheckIcon = () => <Icon path={<path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />} className="w-5 h-5 text-blue-500" />;

/**
 * This is the main landing page component for Zenith.
 * It is fully styled using Tailwind CSS utility classes to create a modern, professional look.
 * @returns {JSX.Element} The landing page component.
 */
export default function LandingPage() {
    const stats = [
        { name: "Active Users", value: "15,842" },
        { name: "API Calls Today", value: "2,847,593" },
        { name: "Avg Response", value: "47ms" },
        { name: "Uptime", value: "99.99%" },
    ];

    const features = [
        { name: "Real-time Analytics", description: "Track every metric with sub-50ms latency." },
        { name: "Bank-Grade Security", description: "SOC2 compliant with end-to-end encryption." },
        { name: "Global CDN", description: "Deploy to 300+ edge locations instantly." },
    ];

    const testimonials = [
        { quote: "Cut our deployment time by 90%", author: "Sarah Chen", role: "CTO at TechStart", initial: "S" },
        { quote: "Best developer experience ever", author: "Marcus Johnson", role: "Lead Dev at Scale", initial: "M" },
        { quote: "Our secret weapon for rapid scaling", author: "Elena Rodriguez", role: "Founder of NextGen", initial: "E" },
    ];
    
    return (
        <div className="bg-gray-900 text-white font-sans">
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
                            <a href="#" className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">See Magic in 30 Seconds</a>
                            <a href="#" className="text-sm font-semibold leading-6">Start Free Trial <span aria-hidden="true">→</span></a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-gray-900 py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:max-w-none">
                        <dl className="grid grid-cols-1 gap-x-8 gap-y-10 text-center lg:grid-cols-4 lg:text-left">
                            {stats.map((stat) => (
                                <div key={stat.name}>
                                    <dt className="text-sm leading-6 text-gray-300">{stat.name}</dt>
                                    <dd className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{stat.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 md:mt-24 lg:px-8">
                <div className="mx-auto max-w-2xl lg:max-w-none">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Enterprise Features, Startup Speed</h2>
                        <p className="mt-4 text-lg leading-8 text-gray-300">Every feature is live and battle-tested in production.</p>
                    </div>
                    <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.name} className="flex flex-col bg-white/5 p-8">
                                <dt className="text-sm font-semibold leading-6 text-gray-300">{feature.name}</dt>
                                <dd className="order-first text-3xl font-semibold tracking-tight">{feature.description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>

            {/* Command Center CTA */}
            <div className="relative isolate mt-16 sm:mt-20 lg:mt-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="relative flex flex-col items-center gap-y-10 rounded-2xl bg-blue-600/10 px-6 py-20 ring-1 ring-white/10 sm:flex-row sm:gap-y-0 lg:gap-x-10 lg:px-24">
                        <div className="flex-auto">
                            <h2 className="text-3xl font-bold tracking-tight">Try the Zenith Command Center</h2>
                            <p className="mt-4 text-lg leading-8 text-gray-300">Experience our AI-powered website analysis and optimization sandbox. Analyze any website and get real-time recommendations with competitive insights.</p>
                            <ul className="mt-6 space-y-2 text-gray-300">
                                <li className="flex gap-x-3"><CheckIcon />No signup required</li>
                                <li className="flex gap-x-3"><CheckIcon />Analyze any website</li>
                                <li className="flex gap-x-3"><CheckIcon />Real competitive insights</li>
                            </ul>
                        </div>
                        <div className="flex-none">
                            <a href="#" className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100">Launch Command Center</a>
                        </div>
                    </div>
                </div>
            </div>
            
             {/* Testimonials */}
            <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 lg:px-8">
                <div className="mx-auto grid max-w-2xl grid-cols-1 grid-rows-1 gap-8 text-sm leading-6 text-gray-300 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                    {testimonials.map((testimonial) => (
                        <figure key={testimonial.author} className="rounded-2xl bg-white/5 p-6 shadow-sm ring-1 ring-white/10">
                            <blockquote className="text-white"><p>“{testimonial.quote}”</p></blockquote>
                            <figcaption className="mt-6 flex items-center gap-x-4">
                                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-indigo-500">
                                    {testimonial.initial}
                                </div>
                                <div>
                                    <div className="font-semibold text-white">{testimonial.author}</div>
                                    <div className="text-gray-400">{testimonial.role}</div>
                                </div>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>

            {/* Final CTA Section */}
            <div className="mx-auto my-24 max-w-7xl px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to <span className="text-blue-500">10x</span> Your Development?</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-300">Join thousands of developers building the future with Zenith.</p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <a href="#" className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-blue-500">Start Building Now</a>
                        <a href="#" className="text-sm font-semibold leading-6">Schedule Demo <span aria-hidden="true">→</span></a>
                    </div>
                </div>
            </div>

        </div>
    );
}
