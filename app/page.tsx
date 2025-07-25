"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import React from "react";

// Lucide icons
import {
  Cpu,
  Users,
  Zap,
  ShieldCheck,
  Clock,
  BarChart3,
  Lightbulb,
  Briefcase,
  Code,
  Layers,
  TrendingUp,
  BrainCircuit,
  CheckCircle2,
  GitCompareArrows,
  Rocket,
  Network,
  Sparkles,
  Star,
  PlayCircle,
  Lock,
  Server,
  LifeBuoy,
  BookOpen,
  Github,
  MessageSquare,
  TerminalSquare,
  Puzzle,
  Key,
  FileText,
  Search,
  Share2,
} from "lucide-react";

// Carousel UI components
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";

const AnimatedGridBackground = () => (
  <div className="absolute inset-0 z-0 h-full w-full bg-slate-950">
    <div
      className="absolute inset-0 h-full w-full animate-grid-pan"
      style={{
        backgroundImage:
          "linear-gradient(to right, #083344 1px, transparent 1px), linear-gradient(to bottom, #083344 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
    <div className="absolute inset-0 z-10 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
  </div>
);

const HeroAICoreVisualizationV4 = () => {
  return (
    <div className="relative h-full w-full flex items-center justify-center p-4 min-h-[800px]">
      {/* Static background elements for depth */}
      <div className="absolute w-[650px] h-[650px] md:w-[750px] md:h-[750px] rounded-full border border-electric-blue/10 opacity-50"></div>
      <div className="absolute w-[500px] h-[500px] md:w-[600px] md:h-[600px] rounded-full border border-neon-green/10 opacity-40"></div>

      <svg
        viewBox="0 0 800 800"
        className="absolute w-full h-full opacity-60"
        style={{ filter: "blur(1px)" }}
      >
        {/* Orbiting paths with animation */}
        <circle
          cx="400"
          cy="400"
          r="350"
          fill="none"
          stroke="#0891b2"
          strokeWidth="0.7"
          strokeDasharray="4 8"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 400 400"
            to="360 400 400"
            dur="50s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx="400"
          cy="400"
          r="280"
          fill="none"
          stroke="#0891b2"
          strokeWidth="0.7"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 400 400"
            to="0 400 400"
            dur="40s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx="400"
          cy="400"
          r="200"
          fill="none"
          stroke="#84cc16"
          strokeWidth="0.7"
          strokeDasharray="6 6"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 400 400"
            to="360 400 400"
            dur="30s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      <BrainCircuit className="relative z-10 w-40 h-40 md:w-56 md:h-56 text-electric-blue opacity-100 animate-pulse [animation-duration:2s]" />

      {/* Central Core Pulses */}
      <div className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full bg-electric-blue/10 animate-pulse [animation-duration:3.5s]"></div>
      <div className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full bg-neon-green/10 animate-pulse [animation-duration:3.5s] [animation-delay:0.7s]"></div>

      {/* Data Particles - more dynamic */}
      {[...Array(25)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            backgroundColor: i % 2 === 0 ? "#84cc16" : "#0891b2", // neon-green or electric-blue
            opacity: Math.random() * 0.6 + 0.4,
            transformOrigin: "400px 400px", // Center of the 800x800 SVG
            animation: `orbit-particle ${
              6 + i * 0.4
            }s linear infinite, pulse-particle ${
              1.5 + Math.random() * 1
            }s ease-in-out infinite alternate`,
            // @ts-ignore
            "--orbit-radius-particle": `${100 + (i % 5) * 60}px`,
            "--start-angle-particle": `${i * (360 / 25)}deg`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes orbit-particle {
          from {
            transform: rotate(var(--start-angle-particle))
              translateX(var(--orbit-radius-particle))
              rotate(-var(--start-angle-particle));
          }
          to {
            transform: rotate(calc(var(--start-angle-particle) + 360deg))
              translateX(var(--orbit-radius-particle))
              rotate(-calc(var(--start-angle-particle) + 360deg));
          }
        }
        @keyframes pulse-particle {
          from {
            transform: scale(0.6);
            opacity: 0.4;
          }
          to {
            transform: scale(1.4);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

const allTestimonials = {
  agencyOwners: [
    {
      quote:
        "Zenith is miles ahead in terms of features, ease of use, speed, and product innovation! It's my go-to for delivering AI-powered client sites rapidly.",
      name: "Joe Fletcher",
      title: "Founder of Fletcher Digital",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      stars: 5,
      companyLogo: "/innovatech-logo.png",
    },
    {
      quote:
        "We onboarded Zenith for a key client, and the results were staggering. Within 60 days, organic traffic was up 150%. The client is ecstatic, and so are we.",
      name: "Sarah Miller",
      title: "Marketing Director, GrowthPro Agency",
      avatar: "https://randomuser.me/api/portraits/women/45.jpg",
      stars: 5,
      companyLogo: "/growthpro-logo.png",
    },
    {
      quote:
        "Switching to Zenith has streamlined our entire workflow. From client onboarding to deployment, everything just flows. What used to take us days now takes hours. It’s like having a superpower for scaling creative work.",
      name: "Amir Khalid",
      title: "Partner at Webstorm Collective",
      avatar: "https://randomuser.me/api/portraits/men/76.jpg",
      stars: 5,
      companyLogo: "/webstorm-logo.png",
    },
  ],
  designersDevelopers: [
    {
      quote:
        "I'm able to make edits to the AI-generated code directly from the platform - it speeds up my projects by allowing clients to review real time, and note changes. If you're a web designer or developer, it will definitely speed up your work.",
      name: "Kanesha Harper",
      title: "Founder at The Arch Effect",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      stars: 5,
      companyLogo: "/sparkleclean-logo.png",
    },
    {
      quote:
        "The API and SDKs are fantastic. Zenith gives me the power of autonomous AI without sacrificing control. I can extend and customize to my heart's content.",
      name: "Lena Ivanova",
      title: "Lead Developer, FutureProofed.dev",
      avatar: "https://randomuser.me/api/portraits/women/22.jpg",
      stars: 5,
      companyLogo: "/developer-tools-logo.png",
    },
    {
      quote:
        "Zenith has transformed how I handle client feedback. Clients can interact with live mockups, suggest changes inline, and I can push updates instantly. It feels like we’re co-creating in real-time—without the back-and-forth emails and PDF markups.",
      name: "Brian Yuen",
      title: "Freelance UI Engineer",
      avatar: "https://randomuser.me/api/portraits/men/64.jpg",
      stars: 5,
      companyLogo: "/freelancer-network-logo.png",
    },
    {
      quote:
        "With Zenith, prototyping is lightning fast. I can spin up a tailored layout with AI suggestions and get client approvals in the same day. This speed gives me a serious edge over traditional workflow tools.",
      name: "Julia Mendes",
      title: "Web Designer at PixelGlow",
      avatar: "https://randomuser.me/api/portraits/women/38.jpg",
      stars: 5,
      companyLogo: "/pixelglow-logo.png",
    },
    {
      quote:
        "I’ve tried dozens of tools, but Zenith nails the balance between automation and control. It doesn’t lock me into rigid templates—I can tweak every pixel while letting AI do the heavy lifting. It’s a dream for developers who care about craft and speed.",
      name: "Tariq Boone",
      title: "Full-Stack Developer & Consultant",
      avatar: "https://randomuser.me/api/portraits/men/50.jpg",
      stars: 5,
      companyLogo: "/customdevs-logo.png",
    },
  ],
};

// Merge every testimonial group that exists into one flat array
const unifiedTestimonials = Object.values(allTestimonials).flat();

// Collect unique company-logo paths (skip undefined / null)
const uniqueCompanyLogos = Array.from(
  new Set(
    unifiedTestimonials
      .map((t: any) => t.companyLogo)
      .filter((logo) => Boolean(logo))
  )
);

export default function ZenithLandingPageV8() {
  const integrationLogos = [
    {
      name: "WordPress",
      src: "/wordpress-logo.png",
      icon: <Puzzle className="w-8 h-8 text-slate-400" />,
    },
    {
      name: "Shopify",
      src: "/shopify-logo.png",
      icon: <Puzzle className="w-8 h-8 text-slate-400" />,
    },
    {
      name: "HubSpot",
      src: "/hubspot-logo.png",
      icon: <Puzzle className="w-8 h-8 text-slate-400" />,
    },
    {
      name: "Google Analytics",
      src: "/google-analytics-logo.png",
      icon: <BarChart3 className="w-8 h-8 text-slate-400" />,
    },
    {
      name: "Salesforce",
      src: "/salesforce-logo.png",
      icon: <Users className="w-8 h-8 text-slate-400" />,
    },
    {
      name: "Zapier",
      src: "/zapier-logo.png",
      icon: <Zap className="w-8 h-8 text-slate-400" />,
    },
    {
      name: "Slack",
      src: "/slack-logo.png",
      icon: <MessageSquare className="w-8 h-8 text-slate-400" />,
    },
    {
      name: "GitHub",
      src: "/github-logo.png",
      icon: <Github className="w-8 h-8 text-slate-400" />,
    },
  ];

  const securityFeatures = [
    {
      icon: <Lock className="h-8 w-8 text-neon-green" />,
      title: "End-to-End Encryption",
      description: "All data secured, in transit and at rest.",
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-neon-green" />,
      title: "SOC 2 Type II Compliant",
      description: "Audited for security, availability, and confidentiality.",
    },
    {
      icon: <Server className="h-8 w-8 text-neon-green" />,
      title: "Robust Infrastructure",
      description: "Built on scalable, resilient cloud architecture.",
    },
    {
      icon: <Key className="h-8 w-8 text-neon-green" />,
      title: "Advanced Access Controls",
      description: "Granular permissions and role-based access.",
    },
  ];

  const developerFeatures = [
    {
      icon: <TerminalSquare className="h-8 w-8 text-electric-blue" />,
      title: "Powerful APIs & SDKs",
      description: "Integrate and extend Zenith with ease.",
    },
    {
      icon: <Puzzle className="h-8 w-8 text-electric-blue" />,
      title: "Extensible Agent Framework",
      description: "Customize AI behaviors or build new agents.",
    },
    {
      icon: <FileText className="h-8 w-8 text-electric-blue" />,
      title: "Comprehensive Documentation",
      description: "Clear guides and examples to get you started.",
    },
    {
      icon: <Github className="h-8 w-8 text-electric-blue" />,
      title: "Version Control & CI/CD",
      description: "Seamlessly fit Zenith into your dev workflows.",
    },
  ];

  const getStartedSteps = [
    {
      step: 1,
      title: "Connect Your Vision",
      description:
        "Define your goals and brand identity. Zenith's AI understands your needs instantly.",
      icon: <Lightbulb className="h-10 w-10 text-neon-green" />,
    },
    {
      step: 2,
      title: "Deploy Your Agents",
      description:
        "Launch ContentCurator and CommunityManager with a single click. No complex setup.",
      icon: <Rocket className="h-10 w-10 text-neon-green" />,
    },
    {
      step: 3,
      title: "Watch Your Empire Grow",
      description:
        "Zenith works autonomously, building content, engaging users, and climbing rankings 24/7.",
      icon: <TrendingUp className="h-10 w-10 text-neon-green" />,
    },
  ];

  const supportChannels = [
    {
      icon: <BookOpen className="h-8 w-8 text-electric-blue" />,
      title: "Knowledge Base",
      description: "Extensive articles and tutorials.",
    },
    {
      icon: <Users className="h-8 w-8 text-electric-blue" />,
      title: "Community Forum",
      description: "Connect with other Zenith users.",
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-electric-blue" />,
      title: "Priority Support",
      description: "Dedicated help for Pro & Enterprise.",
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-200">
      <AnimatedGridBackground />

      <main className="relative z-10">
        {/* Header */}
        <header className="container mx-auto flex h-24 items-center justify-between px-4 md:px-6 sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Cpu className="h-8 w-8 text-electric-blue" />
            <span className="font-heading text-2xl font-bold">
              ZENITH.ENGINEER
            </span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="font-heading text-sm hover:text-electric-blue transition-colors"
            >
              Features
            </a>
            <a
              href="#free-tools"
              className="font-heading text-sm hover:text-electric-blue transition-colors"
            >
              Free Tools
            </a>
            <a
              href="#difference"
              className="font-heading text-sm hover:text-electric-blue transition-colors"
            >
              Difference
            </a>
            <a
              href="#impact"
              className="font-heading text-sm hover:text-electric-blue transition-colors"
            >
              Impact
            </a>
            <a
              href="#testimonials"
              className="font-heading text-sm hover:text-electric-blue transition-colors"
            >
              Proof
            </a>
          </nav>
          <Link
            className="bg-electric-blue font-heading text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 px-4 py-2 rounded-md"
            href="/login"
          >
            Deploy Now
          </Link>
        </header>

        {/* 1. Hero Section */}
        <section className="container mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 items-center px-4 md:px-6 py-6 md:py-8">
          <div className="lg:col-span-3 flex flex-col items-start text-left">
            <h1 className="font-heading text-5xl md:text-7xl xl:text-8xl font-bold tracking-wider">
              SCAN. REPORT.
              <br />
              <span className="text-electric-blue animate-text-glow">
                REBUILD.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-400">
              Enter any website URL and get a complete analysis of UI/UX and SEO
              issues, plus an automatically generated, modern replacement site.
              Transform any website into a high-performing digital asset in
              minutes.
            </p>
            <div className="mt-8 flex gap-4">
              <Button
                size="lg"
                className="bg-electric-blue font-heading text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 px-8 py-6 text-lg"
              >
                Start Your Free Trial
              </Button>
            </div>
          </div>
          <div className="lg:col-span-2 h-auto">
            {" "}
            {/* Adjusted height to auto for responsiveness */}
            <HeroAICoreVisualizationV4 />
          </div>
        </section>

        {/* 2. Problem & Agitation */}
        <section className="py-16 md:py-24 bg-slate-900/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                Your Website Has Hidden Problems.
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
                Most websites are riddled with SEO issues, UX problems, and
                outdated practices that kill conversions and rankings. Manual
                audits take weeks and cost thousands.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-6 border-t-2 border-red-500/50">
                <Clock className="h-8 w-8 text-red-400 mb-3 mx-auto" />
                <h3 className="font-heading text-xl font-semibold">
                  Weeks of Manual Auditing
                </h3>
                <p className="text-sm text-slate-500">to find what's broken</p>
              </div>
              <div className="text-center p-6 border-t-2 border-red-500/50">
                <Layers className="h-8 w-8 text-red-400 mb-3 mx-auto" />
                <h3 className="font-heading text-xl font-semibold">
                  Expensive Consultants
                </h3>
                <p className="text-sm text-slate-500">
                  charging thousands for basic reports
                </p>
              </div>
              <div className="text-center p-6 border-t-2 border-red-500/50">
                <BarChart3 className="h-8 w-8 text-red-400 mb-3 mx-auto" />
                <h3 className="font-heading text-xl font-semibold">
                  Lost Revenue Daily
                </h3>
                <p className="text-sm text-slate-500">
                  from hidden issues killing performance
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. The Zenith Solution */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="inline-block p-4 bg-electric-blue/10 rounded-full mb-6">
              <Zap className="h-12 w-12 text-electric-blue" />
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
              Enter a URL. Get a{" "}
              <span className="text-electric-blue animate-text-glow">
                Complete Transformation
              </span>
              .
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-slate-300">
              Zenith.engineer analyzes any website in seconds, identifies every
              issue, and automatically generates a modern, optimized
              replacement. No consultants, no weeks of waiting.
            </p>
          </div>
        </section>

        {/* 4. Core Features (Dual-Agent AI) */}
        <section id="features" className="py-16 md:py-24 bg-slate-900/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                Your Three-Step Website Revolution
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
                From broken website to high-performing digital asset in three
                automated steps.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
              <div className="text-center lg:text-left">
                <Search className="h-12 w-12 text-neon-green mb-4 mx-auto lg:mx-0" />
                <h3 className="font-heading text-3xl font-semibold text-neon-green mb-4">
                  1. Deep Scan Analysis
                </h3>
                <p className="text-slate-400 mb-4">
                  Our AI crawls every page, analyzing UI/UX issues, SEO
                  problems, performance bottlenecks, and accessibility concerns.
                  Get the same insights as Semrush, Ahrefs, and Sitebulb
                  combined.
                </p>
                <ul className="text-left space-y-2 inline-block">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-neon-green mr-2" />{" "}
                    Complete SEO Audit
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-neon-green mr-2" />{" "}
                    UI/UX Issue Detection
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-neon-green mr-2" />{" "}
                    Performance Analysis
                  </li>
                </ul>
              </div>
              <div className="text-center lg:text-left">
                <FileText className="h-12 w-12 text-electric-blue mb-4 mx-auto lg:mx-0" />
                <h3 className="font-heading text-3xl font-semibold text-electric-blue mb-4">
                  2. Actionable Report
                </h3>
                <p className="text-slate-400 mb-4">
                  Get a detailed report with direct links to problem areas and
                  2-3 specific solutions for each issue. No vague
                  recommendations—clear, actionable fixes you can implement
                  immediately.
                </p>
                <ul className="text-left space-y-2 inline-block">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-electric-blue mr-2" />{" "}
                    Issue Prioritization
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-electric-blue mr-2" />{" "}
                    Direct Page Links
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-electric-blue mr-2" />{" "}
                    Solution Examples
                  </li>
                </ul>
              </div>
              <div className="text-center lg:text-left">
                <Rocket className="h-12 w-12 text-neon-green mb-4 mx-auto lg:mx-0" />
                <h3 className="font-heading text-3xl font-semibold text-neon-green mb-4">
                  3. Auto-Rebuild
                </h3>
                <p className="text-slate-400 mb-4">
                  Click "Create New Website" and watch our AI scrape your
                  content, understand your business, and generate a completely
                  modern, SEO-optimized site following best practices.
                </p>
                <ul className="text-left space-y-2 inline-block">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-neon-green mr-2" />{" "}
                    Content Intelligence
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-neon-green mr-2" />{" "}
                    Modern Design System
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-neon-green mr-2" />{" "}
                    SEO-Optimized Structure
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. The Zenith Difference (Comparison Grid) */}
        <section id="difference" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <GitCompareArrows className="h-12 w-12 text-electric-blue mx-auto mb-4" />
              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                The Zenith{" "}
                <span className="text-electric-blue animate-text-glow">
                  Difference
                </span>
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
                Why settle for ordinary when you can command the extraordinary?
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
              {/* Headers */}
              <div className="p-4 font-heading text-slate-400">Vector</div>
              <div className="p-4 font-heading text-center text-neon-green bg-slate-800/30 rounded-t-lg md:rounded-tr-lg md:rounded-tl-none">
                Zenith.engineer
              </div>
              <div className="p-4 font-heading text-center text-slate-500">
                Manual / Basic Automation
              </div>

              {/* Rows */}
              {[
                {
                  vector: "Analysis Speed",
                  zenith: "Complete Scan in Seconds",
                  other: "Weeks of Manual Work",
                },
                {
                  vector: "Issue Detection",
                  zenith: "AI-Powered Deep Analysis",
                  other: "Surface-Level Checks",
                },
                {
                  vector: "Solution Quality",
                  zenith: "Specific, Actionable Fixes",
                  other: "Vague Recommendations",
                },
                {
                  vector: "Website Rebuilding",
                  zenith: "Automated Modern Redesign",
                  other: "Expensive Custom Development",
                },
                {
                  vector: "Cost Efficiency",
                  zenith: "One-Click Transformation",
                  other: "Thousands in Consultant Fees",
                },
                {
                  vector: "Time to Results",
                  zenith: "Minutes to New Site",
                  other: "Months of Back-and-Forth",
                },
              ].map((item, index) => (
                <React.Fragment key={index}>
                  <div className="p-4 rounded-none border-t-0 border-l-0 border-r-0 md:border-r">
                    {item.vector}
                  </div>
                  <div className="p-4 text-center text-neon-green rounded-none border-t-0 border-l-0 border-r-0 md:border-r">
                    {item.zenith}
                  </div>
                  <div className="p-4 text-center text-slate-500 rounded-none border-t-0 border-l-0 border-r-0">
                    {item.other}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Quantifiable Impact */}
        <section id="impact" className="py-16 md:py-24 bg-slate-900/30">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <TrendingUp className="h-12 w-12 text-neon-green mx-auto mb-4" />
            <h2 className="font-heading text-4xl md:text-5xl font-bold">
              Engineer{" "}
              <span className="text-neon-green">Exponential Growth</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400 mb-12">
              This isn't just about saving time; it's about unlocking
              unprecedented performance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="font-heading text-5xl font-bold text-neon-green">
                90%
              </div>
              <div className="text-slate-400 text-sm mt-1">
                Reduction in Deployment Time
              </div>
              <div className="font-heading text-5xl font-bold text-neon-green">
                5x
              </div>
              <div className="text-slate-400 text-sm mt-1">
                Increase in Content Output
              </div>
              <div className="font-heading text-5xl font-bold text-neon-green">
                300%
              </div>
              <div className="text-slate-400 text-sm mt-1">
                Average Boost in Organic Traffic
              </div>
            </div>
          </div>
        </section>

        {/* 7. Use Cases */}
        <section id="use-cases" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                Engineered For <span className="text-neon-green">Your</span>{" "}
                Success
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
                No matter your role, Zenith.engineer provides the leverage you
                need to outperform.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Code className="h-10 w-10 text-neon-green mb-4" />
              <h3 className="font-heading text-2xl font-semibold text-neon-green mb-2">
                For Web Agencies
              </h3>
              <p className="text-slate-400 text-sm">
                Deliver comprehensive audits and modern rebuilds to clients in
                minutes. Win more pitches with instant analysis and professional
                site transformations. Scale your services without hiring more
                analysts.
              </p>
              <Briefcase className="h-10 w-10 text-neon-green mb-4" />
              <h3 className="font-heading text-2xl font-semibold text-neon-green mb-2">
                For Business Owners
              </h3>
              <p className="text-slate-400 text-sm">
                Discover what's killing your website's performance and get a
                modern replacement instantly. No technical knowledge
                required—just enter your URL and get actionable insights plus a
                new site.
              </p>
              <Lightbulb className="h-10 w-10 text-neon-green mb-4" />
              <h3 className="font-heading text-2xl font-semibold text-neon-green mb-2">
                For Developers
              </h3>
              <p className="text-slate-400 text-sm">
                Skip the tedious audit phase and jump straight to building. Get
                detailed technical reports and modern site architectures
                generated automatically. Focus on implementation, not analysis.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Coming Soon: Free Tools Suite */}
        <section id="free-tools" className="py-16 md:py-24 bg-slate-900/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <div className="inline-block p-4 bg-neon-green/10 rounded-full mb-6">
                <Sparkles className="h-12 w-12 text-neon-green" />
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
                Free <span className="text-neon-green">Analysis Tools</span>{" "}
                Coming Soon
              </h2>
              <p className="max-w-3xl mx-auto text-xl text-slate-300 mb-8">
                Get instant insights with our suite of free website analysis
                tools. Drive organic traffic, qualify leads, and showcase
                technical expertise—all while providing immediate value to your
                audience.
              </p>
              <div className="inline-block bg-electric-blue/10 px-6 py-3 rounded-full">
                <span className="text-electric-blue font-semibold">
                  Expected Impact: 2,400% ROI from organic search traffic
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {/* Priority 1: Website Speed Comparison */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-neon-green/50 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-neon-green text-slate-900 text-xs font-bold px-2 py-1 rounded-full">
                  PRIORITY 1
                </div>
                <Zap className="h-10 w-10 text-neon-green mb-4" />
                <h3 className="font-heading text-xl font-semibold text-neon-green mb-3">
                  Website Speed Comparison
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Compare any site's speed against competitors with instant
                  results. Identify performance bottlenecks and optimization
                  opportunities.
                </p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Real-time speed analysis</li>
                  <li>• Competitor benchmarking</li>
                  <li>• Performance recommendations</li>
                  <li>• Mobile & desktop metrics</li>
                </ul>
              </div>

              {/* Priority 2: SEO Maturity Assessment */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-neon-green/50 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-neon-green text-slate-900 text-xs font-bold px-2 py-1 rounded-full">
                  PRIORITY 2
                </div>
                <Search className="h-10 w-10 text-neon-green mb-4" />
                <h3 className="font-heading text-xl font-semibold text-neon-green mb-3">
                  SEO Maturity Assessment
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Full site audit with actionable fixes. Get a comprehensive SEO
                  health check with specific improvement recommendations.
                </p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Complete SEO audit</li>
                  <li>• Actionable fix recommendations</li>
                  <li>• Technical SEO analysis</li>
                  <li>• Content optimization tips</li>
                </ul>
              </div>

              {/* Priority 3: Website ROI Calculator */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-neon-green/50 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-neon-green text-slate-900 text-xs font-bold px-2 py-1 rounded-full">
                  PRIORITY 3
                </div>
                <BarChart3 className="h-10 w-10 text-neon-green mb-4" />
                <h3 className="font-heading text-xl font-semibold text-neon-green mb-3">
                  Website ROI Calculator
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Show potential return from using our platform. Calculate the
                  financial impact of website optimization and AI automation.
                </p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• ROI projections</li>
                  <li>• Cost-benefit analysis</li>
                  <li>• Performance impact metrics</li>
                  <li>• Custom business scenarios</li>
                </ul>
              </div>
            </div>

            {/* Mini Tools Suite */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-8">
              <div className="text-center mb-8">
                <div className="inline-block bg-electric-blue/10 px-4 py-2 rounded-full mb-4">
                  <span className="text-electric-blue font-semibold text-sm">
                    PRIORITY 4
                  </span>
                </div>
                <h3 className="font-heading text-2xl font-semibold text-electric-blue mb-3">
                  Mini Tools Suite
                </h3>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  A comprehensive collection of instant design and optimization
                  tools to help you create better websites faster.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="bg-electric-blue/10 p-3 rounded-full mb-3 mx-auto w-fit">
                    <Sparkles className="h-6 w-6 text-electric-blue" />
                  </div>
                  <h4 className="font-semibold text-electric-blue text-sm mb-1">
                    Color Palette Generator
                  </h4>
                  <p className="text-xs text-slate-500">
                    AI-powered color schemes
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-electric-blue/10 p-3 rounded-full mb-3 mx-auto w-fit">
                    <FileText className="h-6 w-6 text-electric-blue" />
                  </div>
                  <h4 className="font-semibold text-electric-blue text-sm mb-1">
                    Font Pairing Helper
                  </h4>
                  <p className="text-xs text-slate-500">
                    Perfect typography combinations
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-electric-blue/10 p-3 rounded-full mb-3 mx-auto w-fit">
                    <ShieldCheck className="h-6 w-6 text-electric-blue" />
                  </div>
                  <h4 className="font-semibold text-electric-blue text-sm mb-1">
                    Accessibility Scorer
                  </h4>
                  <p className="text-xs text-slate-500">
                    WCAG compliance checker
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-electric-blue/10 p-3 rounded-full mb-3 mx-auto w-fit">
                    <Cpu className="h-6 w-6 text-electric-blue" />
                  </div>
                  <h4 className="font-semibold text-electric-blue text-sm mb-1">
                    Mobile Checker
                  </h4>
                  <p className="text-xs text-slate-500">
                    Responsive design validator
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-electric-blue/10 p-3 rounded-full mb-3 mx-auto w-fit">
                    <Layers className="h-6 w-6 text-electric-blue" />
                  </div>
                  <h4 className="font-semibold text-electric-blue text-sm mb-1">
                    Social Image Resizer
                  </h4>
                  <p className="text-xs text-slate-500">
                    Perfect social media formats
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <div className="inline-block bg-slate-800/50 border border-slate-700 rounded-lg px-8 py-6">
                <h4 className="font-heading text-lg font-semibold text-neon-green mb-2">
                  Why Free Tools?
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                  <div className="flex flex-col items-center">
                    <TrendingUp className="h-6 w-6 text-electric-blue mb-2" />
                    <span className="text-slate-400">
                      Drive Organic Traffic
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Users className="h-6 w-6 text-electric-blue mb-2" />
                    <span className="text-slate-400">Qualify Leads</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Lightbulb className="h-6 w-6 text-electric-blue mb-2" />
                    <span className="text-slate-400">Showcase Expertise</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Share2 className="h-6 w-6 text-electric-blue mb-2" />
                    <span className="text-slate-400">Encourage Sharing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Technology Deep Dive */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <BrainCircuit className="h-12 w-12 text-electric-blue mx-auto mb-4" />
              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                The{" "}
                <span className="text-electric-blue animate-text-glow">
                  Intelligence
                </span>{" "}
                Engine
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
                Powered by a symphony of cutting-edge AI, built for autonomous
                performance.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  name: "Autonomous Agents",
                  desc: "Self-learning AI for complex, evolving tasks.",
                },
                {
                  name: "Proprietary LLMs",
                  desc: "Hyper-tuned for content, SEO, and GEO.",
                },
                {
                  name: "Predictive Analytics",
                  desc: "Anticipating trends and optimizing strategy.",
                },
                {
                  name: "GEO Core",
                  desc: "Ensuring visibility in generative AI search.",
                },
              ].map((tech, index) => (
                <div key={index} className="text-center">
                  <Sparkles className="h-8 w-8 text-electric-blue mb-3 mx-auto" />
                  <h3 className="font-heading text-xl font-semibold text-electric-blue mt-3 mb-1">
                    {tech.name}
                  </h3>
                  <p className="text-slate-400 text-xs">{tech.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. Testimonial Showcase - Carousel Style */}
        <section id="testimonials" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                Trusted by Innovators{" "}
                <span className="text-electric-blue">Worldwide</span>
                <Sparkles className="inline-block h-8 w-8 md:h-10 md:w-10 text-neon-green ml-2" />
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
                Hear what our users are saying about Zenith.engineer.
              </p>
            </div>

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto"
            >
              <CarouselContent className="-ml-4">
                {unifiedTestimonials.map((testimonial, index) => (
                  <CarouselItem
                    key={index}
                    className="pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                  >
                    <div className="p-1 h-full">
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg flex flex-col h-full transition-all duration-300 hover:border-electric-blue/50 hover:shadow-electric-blue/20">
                        <div className="flex mb-3">
                          {[...Array(testimonial.stars || 5)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-5 w-5 text-yellow-400 fill-yellow-400"
                            />
                          ))}
                        </div>

                        {testimonial.type === "video" ? (
                          <div className="relative aspect-video mb-4 rounded-md overflow-hidden group">
                            <Image
                              src={
                                testimonial.videoThumbnail ||
                                "/placeholder.svg?height=202&width=360&query=video+testimonial+thumbnail" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg"
                              }
                              alt={`Video testimonial by ${testimonial.name}`}
                              layout="fill"
                              objectFit="cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                              <PlayCircle className="h-16 w-16 text-white/90 hover:text-white transition-colors" />
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-300 italic mb-6 text-sm leading-relaxed flex-grow">
                            &ldquo;{testimonial.quote}&rdquo;
                          </p>
                        )}

                        <div className="mt-auto">
                          <div className="flex items-center">
                            <Image
                              src={
                                testimonial.avatar ||
                                "/placeholder.svg?height=40&width=40&query=user+avatar"
                              }
                              alt={testimonial.name}
                              width={40}
                              height={40}
                              className="rounded-full mr-3 border-2 border-neon-green"
                            />
                            <div>
                              <p className="font-heading text-base font-semibold text-neon-green">
                                {testimonial.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {testimonial.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Buttons moved below */}
              <div className="flex justify-center gap-4 mt-6">
                <CarouselPrevious className="text-electric-blue bg-slate-800 hover:bg-slate-700 border-slate-700 hover:text-electric-blue disabled:opacity-50 h-10 w-10 md:h-12 md:w-12" />
                <CarouselNext className="text-electric-blue bg-slate-800 hover:bg-slate-700 border-slate-700 hover:text-electric-blue disabled:opacity-50 h-10 w-10 md:h-12 md:w-12" />
              </div>
            </Carousel>
          </div>
        </section>

        {/* 11. REWORKED: Unified Command Center */}
        <section id="ecosystem" className="py-16 md:py-24 bg-slate-900/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Network className="h-12 w-12 text-neon-green mx-auto mb-4" />
              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                Your Unified{" "}
                <span className="text-neon-green">Command Center</span>
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
                Zenith orchestrates your entire tool stack, turning disparate
                apps into a cohesive, autonomous system.
              </p>
            </div>
            <div className="relative h-96 md:h-[500px] flex items-center justify-center">
              <div className="absolute z-10 flex flex-col items-center justify-center w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-800 border-2 border-electric-blue shadow-2xl shadow-electric-blue/30">
                <Cpu className="h-10 w-10 md:h-12 md:w-12 text-electric-blue mb-1" />
                <span className="font-heading text-sm md:text-lg">
                  Zenith Core
                </span>
              </div>
              {integrationLogos.map((logo, i) => (
                <div
                  key={logo.name}
                  className="absolute transition-transform duration-500 ease-out hover:scale-125"
                  style={{
                    transform: `rotate(${
                      i * (360 / integrationLogos.length)
                    }deg) translate(140px) rotate(-${
                      i * (360 / integrationLogos.length)
                    }deg) translateZ(0)`,
                    // Responsive translation for larger screens
                    ...(typeof window !== "undefined" &&
                      window.innerWidth >= 768 && {
                        transform: `rotate(${
                          i * (360 / integrationLogos.length)
                        }deg) translate(220px) rotate(-${
                          i * (360 / integrationLogos.length)
                        }deg) translateZ(0)`,
                      }),
                  }}
                >
                  <div
                    className="p-2 bg-slate-700/60 rounded-full backdrop-blur-md shadow-lg flex items-center justify-center w-12 h-12 md:w-14 md:h-14"
                    title={logo.name}
                  >
                    {logo.icon}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center mt-10 text-sm text-slate-500">
              And many more, plus a robust API for limitless custom
              integrations.
            </p>
          </div>
        </section>

        {/* 12. The Zenith Roadmap */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Rocket className="h-12 w-12 text-electric-blue mx-auto mb-4" />
              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                Engineering The{" "}
                <span className="text-electric-blue animate-text-glow">
                  Future, Together
                </span>
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
                We're constantly innovating. Here's a glimpse of what's next.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="font-heading text-xl font-semibold text-electric-blue mb-2">
                AI-Powered A/B Testing
              </div>
              <div className="text-slate-400 text-sm">
                Autonomous optimization of site elements for conversion.
              </div>
              <div className="font-heading text-xl font-semibold text-electric-blue mb-2">
                Hyper-Personalization Engine
              </div>
              <div className="text-slate-400 text-sm">
                Dynamically tailoring content for individual visitors.
              </div>
              <div className="font-heading text-xl font-semibold text-electric-blue mb-2">
                Decentralized Web Tools
              </div>
              <div className="text-slate-400 text-sm">
                Pioneering autonomous solutions for Web3.
              </div>
            </div>
          </div>
        </section>

        {/* 13. NEW: Security & Reliability */}
        <section id="security" className="py-16 md:py-24 bg-slate-900/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <ShieldCheck className="h-12 w-12 text-neon-green mx-auto mb-4" />
              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                Secure, Reliable,{" "}
                <span className="text-neon-green">Enterprise-Ready</span>
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
                Trust Zenith with your most critical digital assets. We're built
                for performance and peace of mind.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="text-center">
                  {feature.icon}
                  <h3 className="font-heading text-xl font-semibold text-neon-green mt-3 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 14. NEW: Developer-First Platform */}
        <section id="for-developers" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Code className="h-12 w-12 text-electric-blue mx-auto mb-4" />
              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                A{" "}
                <span className="text-electric-blue animate-text-glow">
                  Developer's
                </span>{" "}
                Playground
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
                Unleash the full power of Zenith with tools designed for
                ultimate flexibility and control.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {developerFeatures.map((feature, index) => (
                <div key={index} className="text-center">
                  {feature.icon}
                  <h3 className="font-heading text-xl font-semibold text-electric-blue mt-3 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 15. NEW: Get Started in 3 Steps */}
        <section id="get-started" className="py-16 md:py-24 bg-slate-900/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Rocket className="h-12 w-12 text-neon-green mx-auto mb-4" />
              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                Launch Your Autonomous Future in{" "}
                <span className="text-neon-green">3 Simple Steps</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
              {/* Connecting lines (desktop only) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 border-b-2 border-dashed border-neon-green/30 transform -translate-y-1/2 -z-10"></div>
              <div className="hidden md:block absolute top-1/2 left-1/3 w-1/3 h-1 border-b-2 border-dashed border-neon-green/30 transform -translate-y-1/2 -z-10"></div>

              {getStartedSteps.map((step, index) => (
                <div key={index} className="text-center relative">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-neon-green text-slate-900 font-bold rounded-full h-10 w-10 flex items-center justify-center text-xl font-heading shadow-lg">
                    {step.step}
                  </div>
                  <div className="pt-12">
                    <div className="mb-4 inline-block p-3 bg-neon-green/10 rounded-full">
                      {step.icon}
                    </div>
                    <h3 className="font-heading text-2xl font-semibold text-neon-green mb-2">
                      {step.title}
                    </h3>
                    <p className="text-slate-400 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 16. NEW: Community & Support */}
        <section id="support" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <LifeBuoy className="h-12 w-12 text-electric-blue mx-auto mb-4" />
              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                We've Got{" "}
                <span className="text-electric-blue animate-text-glow">
                  Your Back
                </span>
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
                Comprehensive resources and a thriving community to ensure your
                success with Zenith.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {supportChannels.map((channel, index) => (
                <div key={index} className="text-center">
                  {channel.icon}
                  <h3 className="font-heading text-xl font-semibold text-electric-blue mt-3 mb-1">
                    {channel.title}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {channel.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 17. Final CTA & Unified Trust Signals */}
        <section className="py-24 md:py-32 bg-slate-900/30">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="font-heading text-5xl md:text-7xl font-bold">
              Stop Building.
              <br />
              Start{" "}
              <span className="text-electric-blue animate-text-glow">
                Engineering Victory.
              </span>
            </h2>
            <p className="mt-8 max-w-2xl mx-auto text-xl text-slate-300">
              The future of the web isn't about more code, it's about smarter
              systems. Zenith.engineer is your unfair advantage. Deploy your
              first autonomous agent today.
            </p>
            <Button
              size="lg"
              className="mt-10 bg-neon-green font-heading text-slate-950 hover:bg-lime-400 shadow-lg shadow-lime-500/40 px-12 py-8 text-2xl"
            >
              Claim Your Free Trial & Deploy AI
            </Button>
            <div className="mt-10 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 text-sm text-slate-400">
              <span className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-neon-green mr-2" /> No
                credit card required
              </span>
              <span className="flex items-center">
                <ShieldCheck className="h-5 w-5 text-neon-green mr-2" />{" "}
                Enterprise-grade security
              </span>
              <span className="flex items-center">
                <Users className="h-5 w-5 text-neon-green mr-2" /> 24/7 Expert
                Support
              </span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-cyan-500/20 py-8">
          <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <div className="flex items-center gap-2">
              <Cpu className="h-6 w-6 text-electric-blue" />
              <span className="font-heading text-lg font-bold">
                ZENITH.ENGINEER
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-4 md:mt-0">
              &copy; {new Date().getFullYear()} Zenith Autonomous Systems. All
              Rights Reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
