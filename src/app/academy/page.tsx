// src/app/academy/page.tsx
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
                <Link href="/academy" className="text-sm font-semibold leading-6 text-white">Academy</Link>
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

const CourseCard = ({ title, description, level, duration, modules, isLocked = false }) => (
    <div className={`rounded-2xl p-8 ring-1 ${isLocked ? 'bg-gray-800/50 ring-white/5' : 'bg-white/5 ring-white/10'}`}>
        <h3 className={`text-lg font-semibold leading-7 ${isLocked ? 'text-gray-400' : 'text-white'}`}>{title}</h3>
        <div className="mt-2 flex items-center gap-x-2">
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                level === 'Beginner' ? 'bg-green-400/10 text-green-400 ring-green-400/20' : 
                level === 'Intermediate' ? 'bg-yellow-400/10 text-yellow-400 ring-yellow-400/20' : 
                'bg-red-400/10 text-red-400 ring-red-400/20'}`
            }>{level}</span>
            <span className="text-xs text-gray-400">{duration}</span>
            <span className="text-xs text-gray-400">&bull; {modules} Modules</span>
        </div>
        <p className={`mt-4 text-sm leading-6 ${isLocked ? 'text-gray-500' : 'text-gray-300'}`}>{description}</p>
        <div className="mt-6">
            {isLocked ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                    Upgrade to Business to Unlock
                </div>
            ) : (
                 <Link href="#" className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold shadow-sm hover:bg-blue-500">Start Course</Link>
            )}
        </div>
    </div>
);

// Main Zenith Academy Page Component
export default function AcademyPage() {
    
    const courses = [
        {
            title: "Zenith 101: Mastering Your Dashboard",
            description: "Learn how to navigate the Command Center, interpret your Zenith Health Score, and take your first steps towards an optimized digital presence.",
            level: "Beginner",
            duration: "45 Mins",
            modules: 6,
        },
        {
            title: "The E-E-A-T Playbook: Building Unshakeable Trust",
            description: "A deep dive into Google's Experience, Expertise, Authoritativeness, and Trust framework. Learn actionable strategies to improve your content and rankings.",
            level: "Intermediate",
            duration: "1.5 Hours",
            modules: 8,
        },
        {
            title: "Autonomous SEO: The Competitive Playbook",
            description: "Unlock the full potential of your Analyst and Strategist Agents. Learn to perform deep competitive analysis and build data-driven SEO strategies that dominate your market.",
            level: "Advanced",
            duration: "3 Hours",
            modules: 12,
            isLocked: true,
        },
        {
            title: "Generative Content Creation",
            description: "Master the Content and Media Agents. Go from a simple idea to a fully-realized, multi-platform marketing campaign with AI-generated copy, images, and videos.",
            level: "Advanced",
            duration: "2.5 Hours",
            modules: 10,
            isLocked: true,
        },
    ];

    return (
        <div className="bg-gray-900 text-white font-sans">
            <Header />
            <main>
                {/* Hero Section */}
                <div className="relative isolate overflow-hidden pt-14">
                    <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#9333ea] to-[#4f46e5] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
                    </div>

                    <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
                        <div className="mx-auto max-w-3xl text-center">
                            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">The Zenith Academy</h1>
                            <p className="mt-6 text-lg leading-8 text-gray-300">
                                Go beyond the tools. The Academy is your personalized path to market leadership, powered by AI-driven training, actionable playbooks, and a community of experts.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Link href="/dashboard" className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-blue-500">Access Your Learning Path</Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Training Agent Feature Section */}
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                     <div className="mx-auto max-w-2xl lg:text-center">
                        <p className="text-base font-semibold leading-7 text-purple-400">Your Personal AI Tutor</p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Meet Your Training Agent</h2>
                        <p className="mt-6 text-lg leading-8 text-gray-300">
                           Our conversational AI guide doesn&apos;t just show you static videos. It analyzes your goals and your platform usage to build a dynamic, personalized curriculum just for you. Ask it anything, anytime.
                        </p>
                    </div>
                </div>

                {/* Courses Section */}
                <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
                    <h2 className="text-3xl font-bold tracking-tight text-center sm:text-4xl">Featured Courses & Playbooks</h2>
                    <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                        {courses.map((course) => (
                            <CourseCard key={course.title} {...course} />
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
