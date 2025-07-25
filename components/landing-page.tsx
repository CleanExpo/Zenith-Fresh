"use client";

import type React from "react";

import Link from "next/link";
import Image from "next/image";
import { StickyHeader } from "./sticky-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useRouter } from "next/navigation";
import {
  Cpu,
  Bot,
  Users,
  CheckCircle,
  Rocket,
  Lightbulb,
  Briefcase,
  Code,
  Search,
  Edit3,
  Share2,
  Send,
  Star,
  Brain,
} from "lucide-react";

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
  </svg>
);

export default function LandingPage() {
  const router = useRouter();

  const handleCTAClick = () => {
    // Check if user is logged in
    const userData = localStorage.getItem("zenith_user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.loggedIn) {
        router.push("/dashboard");
        return;
      }
    }
    // Redirect to login if not authenticated
    router.push("/login");
  };

  const features = [
    {
      icon: <Bot className="h-10 w-10 text-neon-green mb-4" />,
      title: "ContentCuratorAgent",
      description:
        "Autonomously scours the internet for industry news, rewrites and enhances it into valuable, SEO-optimized content, and generates custom images.",
      details: [
        "Automated Content Discovery",
        "AI-Powered Rewriting & Enhancement",
        "Custom Image Generation",
        "SEO & GEO Focus",
      ],
    },
    {
      icon: <Users className="h-10 w-10 text-neon-green mb-4" />,
      title: "CommunityManagerAgent",
      description:
        "Fosters engagement by automating community management tasks, distributing content, and interacting with your audience across platforms.",
      details: [
        "Automated Social Posting",
        "Community Engagement Features",
        "Multi-Platform Distribution",
        "Brand Voice Consistency",
      ],
    },
  ];

  const howItWorksSteps = [
    {
      icon: <Search className="h-8 w-8 text-electric-blue" />,
      title: "Scrape & Score",
      description:
        "Evaluates quality and relevance of articles daily from across the web.",
    },
    {
      icon: <Edit3 className="h-8 w-8 text-electric-blue" />,
      title: "Rewrite & Enhance",
      description:
        "Processes content to match your brand identity and generates visual assets.",
    },
    {
      icon: <Share2 className="h-8 w-8 text-electric-blue" />,
      title: "Format & Distribute",
      description:
        "Optimizes content for blogs, X (Twitter), LinkedIn, and other channels.",
    },
    {
      icon: <Send className="h-8 w-8 text-electric-blue" />,
      title: "Publish & Engage",
      description:
        "Autonomously publishes approved content and engages with your community.",
    },
  ];

  const targetAudiences = [
    {
      icon: <Code className="h-8 w-8 text-neon-green" />,
      name: "Developers",
      benefits: [
        "Rapidly deploy AI-powered sites",
        "Focus on core logic, not content",
        "Integrate seamlessly with existing tools",
        "Reduce development overhead by up to 90%",
      ],
    },
    {
      icon: <Briefcase className="h-8 w-8 text-neon-green" />,
      name: "Digital Agencies",
      benefits: [
        "Deliver results faster for clients",
        "Scale content production effortlessly",
        "Offer cutting-edge AI solutions",
        "Improve client retention and satisfaction",
      ],
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-neon-green" />,
      name: "Business Owners",
      benefits: [
        "Build your brand while you sleep",
        "Dominate SEO and GEO rankings",
        "Save time and resources on content",
        "Achieve rapid online growth",
      ],
    },
  ];

  const testimonials = [
    {
      quote:
        "Zenith.engineer slashed our deployment time by 90%! We launched our AI-powered content hub in days, not months. Truly revolutionary.",
      name: "Alex Chen",
      title: "CTO, Innovatech Solutions",
      avatar: "/professional-male-avatar-tech.png",
      companyLogo: "/innovatech-logo.png",
      result: "90% faster deployment, 3x more client projects delivered",
    },
    {
      quote:
        "The autonomous content engine is a game-changer. Our SEO rankings have skyrocketed, and we're reaching a wider audience than ever before.",
      name: "Sarah Miller",
      title: "Marketing Director, GrowthPro Agency",
      avatar: "/professional-female-avatar-marketing.png",
      companyLogo: "/growthpro-logo.png",
      result: "400% increase in organic traffic, #1 rankings for 50+ keywords",
    },
    {
      quote:
        "As a small business owner, I don't have time for complex website management. Zenith makes it incredibly easy to maintain a powerful online presence.",
      name: "David Kim",
      title: "Founder, SparkleClean Co.",
      avatar: "/professional-male-avatar.png",
      companyLogo: "/sparkleclean-logo.png",
      result: "200% more leads, 5-star Google rating, 60% revenue growth",
    },
  ];

  const faqItems = [
    {
      q: "What is Generative Engine Optimization (GEO)?",
      a: "GEO is optimizing your content to be discoverable and favorable by generative AI models like ChatGPT, ensuring your brand is accurately represented and recommended in AI-driven search and content generation.",
    },
    {
      q: "How long does it take to set up?",
      a: "You can deploy an AI-powered application and start generating content in minutes. Our platform is designed for rapid deployment and ease of use.",
    },
    {
      q: "Is Zenith.engineer suitable for non-technical users?",
      a: "Yes! While powerful enough for developers, our interface is intuitive, allowing business owners and marketers to leverage AI without needing to code.",
    },
    {
      q: "What kind of support do you offer?",
      a: "We offer comprehensive documentation, email support, and premium support plans for dedicated assistance to ensure your success.",
    },
    {
      q: "Can I integrate Zenith.engineer with my existing website?",
      a: "Absolutely. Zenith.engineer can work alongside your current setup or help you build a new, AI-augmented site from scratch. We offer flexible integration options.",
    },
  ];

  const pricingTiers = [
    {
      name: "New Website",
      price: "$1,895",
      period: "one-time",
      features: [
        "Complete AI-powered website",
        "SEO & GEO optimization",
        "Custom content generation",
        "Mobile-responsive design",
        "30-day support included",
      ],
      cta: "Get Started",
      popular: false,
      accent: "electric-blue",
    },
    {
      name: "Monthly Health Check",
      price: "$275",
      period: "/mo",
      features: [
        "Ongoing website monitoring",
        "SEO performance tracking",
        "Content optimization",
        "Monthly reports",
        "Priority support",
      ],
      cta: "Start Monitoring",
      popular: true,
      accent: "neon-green",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      features: [
        "Custom AI solutions",
        "Dedicated account manager",
        "Advanced analytics",
        "24/7 premium support",
        "Custom integrations",
      ],
      cta: "Talk to Sales",
      popular: false,
      accent: "electric-blue",
    },
  ];

  const clientLogos = [
    "/placeholder.svg?width=150&height=50",
    "/placeholder.svg?width=150&height=50",
    "/placeholder.svg?width=150&height=50",
    "/placeholder.svg?width=150&height=50",
    "/placeholder.svg?width=150&height=50",
  ];

  return (
    <div
      className="bg-slate-950 text-slate-100 min-h-screen selection:bg-neon-green selection:text-slate-900"
      style={{
        backgroundImage: "url('/images/zenith-bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <StickyHeader />
      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
            <div className="inline-block rounded-full bg-neon-green/10 px-4 py-1.5 text-sm font-semibold tracking-wider uppercase text-neon-green mb-6">
              Build Your Brand While You Sleep
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              <span className="block">Deploy AI Websites</span>
              <span className="block text-electric-blue">
                In Minutes, Not Months
              </span>
            </h1>
            <p className="max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
              Zenith.engineer leverages autonomous AI agents to build, optimize,
              and manage websites that dominate SEO & GEO rankings. Experience
              up to 90% reduction in deployment time.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
              <Button
                size="lg"
                className="bg-electric-blue hover:bg-cyan-500 text-slate-900 font-bold text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-all animate-pulse-glow"
                onClick={handleCTAClick}
              >
                Start Your Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-neon-green text-neon-green hover:bg-neon-green hover:text-slate-900 font-bold text-lg px-10 py-7 bg-transparent"
              >
                See Demo
              </Button>
            </div>
            <div className="text-sm text-slate-400">
              Trusted by{" "}
              <span className="font-bold text-neon-green">10,000+</span>{" "}
              developers & agencies worldwide.
            </div>
            <div className="mt-16 max-w-4xl mx-auto">
              <Image
                src="/placeholder.svg?width=1200&height=600"
                width={1200}
                height={600}
                alt="Zenith.engineer Dashboard Mockup"
                className="rounded-xl shadow-2xl border-2 border-electric-blue/30"
              />
            </div>
          </div>
        </section>

        {/* Client Logos Section */}
        <section className="py-16 bg-slate-950/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-center text-sm font-semibold uppercase text-slate-400 tracking-wider mb-8">
              Powering Growth For Industry Leaders
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
              {clientLogos.map((logo, index) => (
                <Image
                  key={index}
                  src={logo || "/placeholder.svg"}
                  width={150}
                  height={50}
                  alt={`Client Logo ${index + 1}`}
                  className="opacity-60 hover:opacity-100 transition-opacity duration-300"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Features Showcase Section */}
        <section id="features" className="py-20 md:py-28 bg-slate-900">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Autonomous Content & Community Engine
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Our dual AI agents work tirelessly to create, optimize, and
                distribute content, building your online presence automatically.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="bg-slate-800/50 border-slate-700 hover:border-neon-green/50 transition-all duration-300 transform hover:scale-[1.02] shadow-xl hover:shadow-neon-green/20"
                >
                  <CardHeader className="items-center text-center">
                    {feature.icon}
                    <CardTitle className="text-2xl font-semibold text-neon-green">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-slate-300">
                    <p className="mb-6">{feature.description}</p>
                    <ul className="space-y-2 text-left">
                      {feature.details.map((detail, i) => (
                        <li key={i} className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-neon-green mr-2 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-20 md:py-28 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Your Daily Autonomous Workflow
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Zenith.engineer automates the entire content lifecycle, from
                discovery to engagement, in four simple steps.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {howItWorksSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex flex-col items-center text-center p-6 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-electric-blue/50 transition-all duration-300 shadow-lg hover:shadow-electric-blue/20"
                >
                  <div className="bg-electric-blue/10 p-4 rounded-full mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-electric-blue">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="max-w-3xl mx-auto">
              <Image
                src="/placeholder.svg?width=1000&height=500"
                width={1000}
                height={500}
                alt="Zenith.engineer Workflow Visualization"
                className="rounded-lg shadow-xl border-2 border-electric-blue/30"
              />
            </div>
          </div>
        </section>

        {/* Target Audience Benefits Section */}
        <section id="target-audience" className="py-20 md:py-28 bg-slate-900">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built For Your Success
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Whether you're a developer, agency, or business owner,
                Zenith.engineer empowers you to achieve rapid online growth.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {targetAudiences.map((audience) => (
                <Card
                  key={audience.name}
                  className="bg-slate-800/50 border-slate-700 flex flex-col"
                >
                  <CardHeader className="items-center text-center">
                    <div className="bg-neon-green/10 p-3 rounded-full mb-3">
                      {audience.icon}
                    </div>
                    <CardTitle className="text-2xl font-semibold text-neon-green">
                      {audience.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-3">
                      {audience.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start">
                          <Rocket className="h-5 w-5 text-neon-green mr-3 mt-1 flex-shrink-0" />
                          <span className="text-slate-300">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section
          id="testimonials"
          className="py-20 md:py-28 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Loved by Innovators
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Hear what our users say about transforming their businesses with
                Zenith.engineer.
              </p>
            </div>
            <Carousel
              opts={{ align: "start", loop: true }}
              className="w-full max-w-4xl mx-auto"
            >
              <div className="flex justify-end mb-4">
                <div className="flex gap-2">
                  <CarouselPrevious className="text-electric-blue bg-slate-800 hover:bg-slate-700 border-slate-700 hover:text-electric-blue static translate-y-0" />
                  <CarouselNext className="text-electric-blue bg-slate-800 hover:bg-slate-700 border-slate-700 hover:text-electric-blue static translate-y-0" />
                </div>
              </div>
              <CarouselContent>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem
                    key={index}
                    className="md:basis-1/2 lg:basis-1/1"
                  >
                    <Card className="h-full bg-slate-800/70 border-slate-700 p-8 flex flex-col justify-between shadow-xl">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Star className="w-6 h-6 text-yellow-400" />
                          <div className="bg-neon-green/10 px-3 py-1 rounded-full">
                            <span className="text-neon-green text-sm font-semibold">
                              {testimonial.result}
                            </span>
                          </div>
                        </div>
                        <p className="text-lg text-slate-200 italic mb-6">
                          &quot;{testimonial.quote}&quot;
                        </p>
                      </div>
                      <div className="flex items-center mt-auto">
                        <Image
                          src={testimonial.avatar || "/placeholder.svg"}
                          alt={testimonial.name}
                          width={50}
                          height={50}
                          className="rounded-full mr-4 border-2 border-electric-blue"
                        />
                        <div>
                          <p className="font-semibold text-electric-blue">
                            {testimonial.name}
                          </p>
                          <p className="text-sm text-slate-400">
                            {testimonial.title}
                          </p>
                          <Image
                            src={testimonial.companyLogo || "/placeholder.svg"}
                            alt={`${testimonial.name}'s company logo`}
                            width={100}
                            height={30}
                            className="mt-1 opacity-70"
                          />
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-28 bg-slate-900">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Choose the plan that fits your needs. Start free, scale as you
                grow.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={`flex flex-col bg-slate-800/50 border-slate-700 ${
                    tier.popular
                      ? `border-2 border-${tier.accent} shadow-2xl shadow-${tier.accent}/30`
                      : ""
                  } transition-all duration-300 hover:shadow-lg hover:shadow-${
                    tier.accent
                  }/20`}
                >
                  {tier.popular && (
                    <div
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-${tier.accent} text-slate-900 px-4 py-1 text-sm font-semibold rounded-full shadow-md`}
                    >
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="text-center pt-10">
                    <CardTitle
                      className={`text-2xl font-bold text-${tier.accent}`}
                    >
                      {tier.name}
                    </CardTitle>
                    <CardDescription className="text-4xl font-extrabold my-4">
                      {tier.price}
                      {tier.period && (
                        <span className="text-base font-normal text-slate-400">
                          {tier.period}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <CheckIcon
                            className={`h-5 w-5 text-${tier.accent} mr-2 flex-shrink-0`}
                          />
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-6">
                    <Button
                      size="lg"
                      className={`w-full font-semibold ${
                        tier.popular
                          ? `bg-${tier.accent} hover:bg-opacity-80 text-slate-900`
                          : `bg-transparent border border-${tier.accent} text-${tier.accent} hover:bg-${tier.accent} hover:text-slate-900`
                      }`}
                      onClick={handleCTAClick}
                    >
                      {tier.cta}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <p className="text-center mt-8 text-slate-400">
              New websites include 30-day support. Monthly plans can be canceled
              anytime.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          className="py-20 md:py-28 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-slate-700"
                >
                  <AccordionTrigger className="text-lg font-medium hover:text-electric-blue py-4 text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 pb-4 text-base">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-28 bg-slate-900">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Brain className="h-16 w-16 text-electric-blue mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6">
              Ready to Revolutionize Your Online Presence?
            </h2>
            <p className="max-w-xl md:max-w-2xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
              Join thousands of forward-thinking businesses. Deploy faster, rank
              higher, and build your brand autonomously with Zenith.engineer.
            </p>
            <Button
              size="lg"
              className="bg-neon-green hover:bg-lime-400 text-slate-900 font-bold text-xl px-12 py-8 shadow-lg hover:shadow-xl transition-all animate-pulse-glow"
              onClick={handleCTAClick}
            >
              Build Your AI Website Now
            </Button>
            <p className="mt-6 text-sm text-slate-400">
              Get started with a new website or monthly monitoring today.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto px-4 md:px-6 text-center md:text-left">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div>
              <Link
                href="#"
                className="flex items-center justify-center md:justify-start gap-2 mb-4 md:mb-0"
                prefetch={false}
              >
                <Cpu className="h-7 w-7 text-electric-blue" />
                <span className="text-xl font-bold text-slate-100">
                  Zenith.
                </span>
                <span className="text-xl font-bold text-electric-blue">
                  engineer
                </span>
              </Link>
              <p className="text-sm text-slate-400 mt-2">
                AI-Augmented Website Builder for SEO & GEO.
              </p>
            </div>
            <nav className="flex flex-col md:flex-row justify-center gap-4 md:gap-6 text-sm">
              <Link
                href="#features"
                className="text-slate-300 hover:text-electric-blue"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-slate-300 hover:text-electric-blue"
              >
                Pricing
              </Link>
              <Link
                href="/terms"
                className="text-slate-300 hover:text-electric-blue"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-slate-300 hover:text-electric-blue"
              >
                Privacy
              </Link>
            </nav>
            <div className="text-center md:text-right text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Zenith.engineer. All rights
              reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
