'use client';

import React from 'react';
import { Header } from '../../../components/layout/header';
import { Footer } from '../../../components/layout/header';
import { 
  Zap, 
  Brain, 
  Target, 
  Shield, 
  Globe, 
  Sparkles,
  MessageCircle,
  BarChart3,
  Users,
  Workflow,
  CheckCircle,
  ArrowRight,
  Bot,
  Mic,
  Eye,
  FileText,
  PenTool,
  Camera
} from 'lucide-react';

export default function AgenticWorkforcePage() {
  const clientAgents = [
    {
      name: 'AnalystAgent',
      icon: <BarChart3 className="w-6 h-6" />,
      description: 'Continuous market intelligence and competitive analysis',
      capabilities: ['Market research', 'Trend analysis', 'Competitor monitoring']
    },
    {
      name: 'StrategistAgent', 
      icon: <Target className="w-6 h-6" />,
      description: 'Data-driven strategy development and optimization',
      capabilities: ['Strategic planning', 'Campaign optimization', 'ROI analysis']
    },
    {
      name: 'ContentAgent',
      icon: <PenTool className="w-6 h-6" />,
      description: 'SEO-optimized writing across all content formats',
      capabilities: ['Blog articles', 'Website copy', 'Social content', 'Email campaigns']
    },
    {
      name: 'MediaAgent',
      icon: <Camera className="w-6 h-6" />,
      description: 'Creative generation with DALL-E and Midjourney integration',
      capabilities: ['Visual assets', 'Video content', 'Brand graphics', 'Social media visuals']
    },
    {
      name: 'UI/UXEngineerAgent',
      icon: <Bot className="w-6 h-6" />,
      description: 'Conversational website builder with natural language interface',
      capabilities: ['React components', 'Responsive design', 'Accessibility compliance']
    },
    {
      name: 'SocialMediaAgent',
      icon: <MessageCircle className="w-6 h-6" />,
      description: 'Complete social lifecycle management across all platforms',
      capabilities: ['Content scheduling', 'Community management', 'Engagement automation']
    }
  ];

  const internalAgents = [
    {
      name: 'PerformanceAgent',
      icon: <Zap className="w-6 h-6" />,
      description: 'Platform performance guardian with real-time monitoring',
      capabilities: ['Performance optimization', 'Error detection', 'System health monitoring']
    },
    {
      name: 'QAAgent',
      icon: <Shield className="w-6 h-6" />,
      description: 'Automated quality assurance engineer',
      capabilities: ['Code testing', 'Quality validation', 'Bug detection']
    },
    {
      name: 'SelfHealingAgent',
      icon: <Brain className="w-6 h-6" />,
      description: 'Autonomous platform doctor that fixes issues automatically',
      capabilities: ['Error diagnosis', 'Auto-resolution', 'System recovery']
    },
    {
      name: 'InnovationAgent',
      icon: <Sparkles className="w-6 h-6" />,
      description: 'Weekly innovation briefs and tech advancement monitoring',
      capabilities: ['Tech scouting', 'Innovation reports', 'Competitive intelligence']
    }
  ];

  const features = [
    {
      icon: <Mic className="w-8 h-8 text-blue-400" />,
      title: 'Voice-Enabled Interface',
      description: 'Talk directly to your AI agents using natural conversation. The Zenith Orb provides real-time speech-to-text and text-to-speech for seamless interaction.'
    },
    {
      icon: <Eye className="w-8 h-8 text-green-400" />,
      title: 'Human-in-the-Loop Approval',
      description: 'All agent outputs require your approval before going live. Review, edit, and approve content through our revolutionary Approval Center.'
    },
    {
      icon: <Globe className="w-8 h-8 text-purple-400" />,
      title: 'Multilingual Intelligence',
      description: 'Agents understand and respond in 50+ languages with cultural adaptation for global market penetration.'
    },
    {
      icon: <Workflow className="w-8 h-8 text-orange-400" />,
      title: 'Agent Orchestration',
      description: 'Delegate high-level goals and watch agents collaborate autonomously to achieve them with real-time progress tracking.'
    }
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <div className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <p className="text-base font-semibold leading-7 text-blue-400">The Future of Automation</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-6xl">
                Your Autonomous Digital Workforce
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Zenith&rsquo;s Agentic Workforce is a revolutionary new paradigm in digital strategy. Delegate your high-level business goals, and our autonomous AI agents will analyze, strategize, create, and deploy solutions to achieve them.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <a
                  href="/dashboard"
                  className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 flex items-center gap-2"
                >
                  Start Your Mission
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#how-it-works" className="text-sm font-semibold leading-6 text-white">
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Revolutionary Features */}
        <div className="py-24 sm:py-32 bg-gray-800/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-blue-400">Revolutionary Technology</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                World&rsquo;s First Voice-Enabled Autonomous Digital Agency
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex flex-col">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gray-900 border border-gray-700">
                        {feature.icon}
                      </div>
                      {feature.title}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Client-Facing Agents */}
        <div className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-green-400">Division A: Client-Facing</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Your Autonomous Digital Agency
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Specialized AI agents that handle every aspect of your digital presence, from strategy to execution.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
              {clientAgents.map((agent, index) => (
                <div key={index} className="flex gap-x-4 rounded-xl bg-gray-800/50 p-6 border border-gray-700">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-600/20 border border-green-600/50">
                    {agent.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold leading-7 text-white">{agent.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-300">{agent.description}</p>
                    <ul className="mt-4 space-y-1">
                      {agent.capabilities.map((capability, capIndex) => (
                        <li key={capIndex} className="flex items-center text-xs text-gray-400">
                          <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                          {capability}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Internal Agents */}
        <div className="py-24 sm:py-32 bg-gray-800/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-purple-400">Division B: Internal Operations</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Your Autonomous COO
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Self-healing, self-improving agents that manage platform operations and ensure peak performance.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-8">
              {internalAgents.map((agent, index) => (
                <div key={index} className="flex gap-x-4 rounded-xl bg-gray-800/50 p-6 border border-gray-700">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-purple-600/20 border border-purple-600/50">
                    {agent.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold leading-7 text-white">{agent.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-300">{agent.description}</p>
                    <ul className="mt-4 space-y-1">
                      {agent.capabilities.map((capability, capIndex) => (
                        <li key={capIndex} className="flex items-center text-xs text-gray-400">
                          <CheckCircle className="w-3 h-3 text-purple-400 mr-2" />
                          {capability}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div id="how-it-works" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-blue-400">How It Works</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                From Goal to Execution in Minutes
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Simply tell us your business goal using voice or text, and our agents will handle the rest.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
                <div className="lg:col-span-4">
                  <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">1</div>
                      <h3 className="mt-6 text-base font-semibold leading-7 text-white">Delegate Your Goal</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-300">
                        Use voice or text to tell us what you want to achieve. Our Intent Analysis Agent clarifies your requirements.
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">2</div>
                      <h3 className="mt-6 text-base font-semibold leading-7 text-white">Agent Orchestration</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-300">
                        Our orchestrator breaks down your goal and assigns specialized agents to execute each component.
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">3</div>
                      <h3 className="mt-6 text-base font-semibold leading-7 text-white">Review & Approve</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-300">
                        All agent outputs go to your Approval Center where you can review, edit, and approve before publication.
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-green-600 text-white font-bold text-lg">4</div>
                      <h3 className="mt-6 text-base font-semibold leading-7 text-white">Deploy & Monitor</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-300">
                        Approved content goes live automatically while agents continue monitoring performance and optimizing results.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 sm:py-32 bg-gray-800/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to Transform Your Business?
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Join the revolution. Delegate your business goals to our autonomous AI workforce and watch your digital presence transform.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <a
                  href="/dashboard"
                  className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 flex items-center gap-2"
                >
                  Start Your First Mission
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a href="/contact" className="text-sm font-semibold leading-6 text-white">
                  Contact Sales <span aria-hidden="true">→</span>
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
