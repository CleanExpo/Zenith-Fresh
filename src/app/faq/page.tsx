'use client';

import React from 'react';
import { Header } from '../../components/layout/header';
import { Footer } from '../../components/layout/header';

const faqs = [
  {
    question: "What is an Agentic Workforce?",
    answer: "It&rsquo;s a team of specialized AI agents that can autonomously execute complex tasks. Instead of just using a tool, you delegate a goal (like &lsquo;improve my SEO&rsquo;), and the agents work together to achieve it. Our agents can write content, create visuals, build websites, manage social media, and much more - all while you maintain control through our Approval Center."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-grade encryption for all sensitive data, including API keys and credentials. Our platform is built on a foundation of security and is SOC2 compliant. All agent outputs go through our Human-in-the-Loop approval workflow, so nothing goes live without your explicit approval."
  },
  {
    question: "How is this different from other AI tools?",
    answer: "Traditional AI tools require you to learn specific prompts and workflows. With Zenith, you simply tell us your business goal in natural language (or even voice), and our agents collaborate to achieve it. We&rsquo;re the world&rsquo;s first autonomous digital agency - you delegate outcomes, not tasks."
  },
  {
    question: "What can the Agentic Workforce do for my business?",
    answer: "Our agents can handle virtually any digital marketing task: create SEO-optimized content, design graphics and videos, build landing pages, manage social media campaigns, analyze competitors, optimize ad campaigns, manage your online reputation, and much more. Think of it as having an entire digital agency at your disposal."
  },
  {
    question: "How does the Approval Center work?",
    answer: "Every piece of content our agents create comes to your Approval Center for review before going live. You can preview, edit, approve, or reject any content. This ensures you maintain complete control while benefiting from AI efficiency. You can also set up auto-approval rules for trusted content types."
  },
  {
    question: "Can I talk to the AI agents using voice?",
    answer: "Yes! Our revolutionary Zenith Orb interface allows you to have natural conversations with your AI agents using voice commands. Simply click the orb and speak your goals - our Intent Analysis Agent will clarify requirements and get the right agents working for you."
  },
  {
    question: "What languages do you support?",
    answer: "Our Localization Agent supports 50+ languages with cultural adaptation. You can communicate with agents in your preferred language, and they can create content optimized for different markets and cultures worldwide."
  },
  {
    question: "How much does it cost?",
    answer: "We offer transparent, outcome-based pricing that&rsquo;s 60% lower than traditional agencies. For example, a complete website launch starts at $2,500 (vs $15,000 traditional), and social media campaigns start at $500/month (vs $3,000 agency retainers). Contact us for a custom quote based on your specific needs."
  },
  {
    question: "How quickly can the agents work?",
    answer: "Our agents can go from goal to execution in minutes. A typical workflow: you state your goal → agents analyze and break it down → specialized agents execute tasks → content appears in your Approval Center for review. Simple tasks can be completed within minutes, while complex projects typically take hours instead of weeks."
  },
  {
    question: "What if I don&rsquo;t like what the agents create?",
    answer: "No problem! You can reject any content through the Approval Center and provide feedback. The agents will revise their work based on your input. You&rsquo;re always in control, and nothing goes live without your approval."
  },
  {
    question: "Do I need technical knowledge to use this?",
    answer: "Not at all! Our platform is designed for business owners, not developers. You simply describe what you want to achieve in plain English (or your preferred language), and our agents handle all the technical implementation. The interface is intuitive and requires no coding or technical expertise."
  },
  {
    question: "Can the agents integrate with my existing tools?",
    answer: "Yes! Our agents can integrate with popular platforms like HubSpot, Salesforce, Google Analytics, Facebook Ads, Google Ads, and many more. We&rsquo;re constantly adding new integrations based on user demand."
  },
  {
    question: "What happens if something goes wrong?",
    answer: "We have multiple safety layers: Human-in-the-Loop approval, content preview, complete audit trails, and our SelfHealingAgent that monitors the platform 24/7. If any issues arise, our system can automatically diagnose and resolve them, or escalate to our support team."
  },
  {
    question: "How do I get started?",
    answer: "Simply sign up for an account and start with our Foundation Fast-Track onboarding. You&rsquo;ll be guided through connecting your accounts and setting up your first mission. You can start with a simple goal like &lsquo;improve my website&rsquo;s SEO&rsquo; and watch the agents work their magic!"
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! We offer a free trial so you can experience the power of autonomous AI agents firsthand. You&rsquo;ll get access to basic agent functions and can see how the Approval Center workflow keeps you in control while maximizing efficiency."
  }
];

export default function FAQPage() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Header />
      <main className="pt-24">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold leading-10 tracking-tight sm:text-5xl">
                Frequently Asked Questions
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Everything you need to know about the world&rsquo;s first autonomous digital agency
              </p>
            </div>
            
            <div className="divide-y divide-white/10">
              <dl className="mt-10 space-y-8 divide-y divide-white/10">
                {faqs.map((faq, index) => (
                  <div key={index} className="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
                    <dt className="text-base font-semibold leading-7 lg:col-span-5">
                      {faq.question}
                    </dt>
                    <dd className="mt-4 lg:col-span-7 lg:mt-0">
                      <p className="text-base leading-7 text-gray-300" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* CTA Section */}
            <div className="mt-20 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Still have questions?
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-300">
                Our team is here to help you get started with your autonomous digital workforce.
              </p>
              <div className="mt-8 flex items-center justify-center gap-x-6">
                <a
                  href="/contact"
                  className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Contact Support
                </a>
                <a href="/dashboard" className="text-sm font-semibold leading-6 text-white">
                  Start Free Trial <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
