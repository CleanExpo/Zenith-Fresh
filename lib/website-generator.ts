import { prisma } from "./prisma";

export interface WebsiteSection {
  id: string;
  title: string;
  content: string;
  type:
    | "hero"
    | "about"
    | "services"
    | "benefits"
    | "testimonials"
    | "pricing"
    | "contact"
    | "faq"
    | "cta"
    | "footer"
    | "features"
    | "stats"
    | "process"
    | "team";
  order: number;
}

export interface GeneratedWebsite {
  sections: WebsiteSection[];
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    ogImage: string;
  };
  styles: string;
  scripts: string;
}

export class WebsiteGenerator {
  static async generateWebsite(
    originalUrl: string,
    analysisData: any = {}
  ): Promise<string> {
    try {
      const domain = new URL(originalUrl).hostname;
      const businessName = this.extractBusinessName(domain);
      const industry = this.detectIndustry(domain, analysisData);
      const colorScheme = this.generateColorScheme(industry);
      const content = this.generateConversionContent(
        businessName,
        industry,
        analysisData
      );

      const html = this.generateProfessionalHTML(
        businessName,
        industry,
        domain,
        colorScheme,
        content,
        analysisData
      );

      // Store the generated website
      const generatedWebsite = await prisma.generatedWebsite.create({
        data: {
          files: { "index.html": html },
          audit: { originalUrl, analysisData },
        },
      });

      // Return a proper URL that points to our page route
      // For now, use localhost for development, can be made configurable later
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      return `${baseUrl}/generated-website/${generatedWebsite.id}`;
    } catch (error) {
      console.error("Website generation error:", error);
      throw new Error("Failed to generate website");
    }
  }

  private static extractBusinessName(domain: string): string {
    const name = domain.split(".")[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[-_]/g, " ");
  }

  private static detectIndustry(domain: string, analysisData: any): string {
    const domainLower = domain.toLowerCase();
    if (domainLower.includes("tech") || domainLower.includes("software"))
      return "Technology";
    if (domainLower.includes("health") || domainLower.includes("medical"))
      return "Healthcare";
    if (domainLower.includes("law") || domainLower.includes("legal"))
      return "Legal Services";
    if (domainLower.includes("finance") || domainLower.includes("bank"))
      return "Financial Services";
    if (domainLower.includes("real") || domainLower.includes("property"))
      return "Real Estate";
    if (domainLower.includes("edu") || domainLower.includes("school"))
      return "Education";
    if (domainLower.includes("restaurant") || domainLower.includes("food"))
      return "Food & Hospitality";
    if (domainLower.includes("fitness") || domainLower.includes("gym"))
      return "Fitness & Wellness";
    if (domainLower.includes("consulting") || domainLower.includes("consult"))
      return "Consulting";
    if (domainLower.includes("carsi") || domainLower.includes("restoration"))
      return "Restoration Training";
    return "Professional Services";
  }

  private static generateColorScheme(industry: string): any {
    const schemes: { [key: string]: any } = {
      Technology: {
        primary: "#3b82f6",
        secondary: "#1d4ed8",
        accent: "#06b6d4",
        background: "#f8fafc",
        text: "#1e293b",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        cardBg: "#ffffff",
        cardBorder: "#e2e8f0",
      },
      Healthcare: {
        primary: "#10b981",
        secondary: "#059669",
        accent: "#34d399",
        background: "#f0fdf4",
        text: "#064e3b",
        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        cardBg: "#ffffff",
        cardBorder: "#d1fae5",
      },
      "Legal Services": {
        primary: "#8b5cf6",
        secondary: "#7c3aed",
        accent: "#a78bfa",
        background: "#faf5ff",
        text: "#581c87",
        gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
        cardBg: "#ffffff",
        cardBorder: "#e9d5ff",
      },
      "Financial Services": {
        primary: "#ef4444",
        secondary: "#dc2626",
        accent: "#f87171",
        background: "#fef2f2",
        text: "#7f1d1d",
        gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        cardBg: "#ffffff",
        cardBorder: "#fecaca",
      },
      "Restoration Training": {
        primary: "#f97316",
        secondary: "#ea580c",
        accent: "#fb923c",
        background: "#fff7ed",
        text: "#9a3412",
        gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        cardBg: "#ffffff",
        cardBorder: "#fed7aa",
      },
      Education: {
        primary: "#06b6d4",
        secondary: "#0891b2",
        accent: "#22d3ee",
        background: "#f0f9ff",
        text: "#164e63",
        gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
        cardBg: "#ffffff",
        cardBorder: "#a5f3fc",
      },
      "Food & Hospitality": {
        primary: "#f59e0b",
        secondary: "#d97706",
        accent: "#fbbf24",
        background: "#fffbeb",
        text: "#92400e",
        gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        cardBg: "#ffffff",
        cardBorder: "#fde68a",
      },
      "Fitness & Wellness": {
        primary: "#ec4899",
        secondary: "#db2777",
        accent: "#f472b6",
        background: "#fdf2f8",
        text: "#831843",
        gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        cardBg: "#ffffff",
        cardBorder: "#fbcfe8",
      },
      Consulting: {
        primary: "#6366f1",
        secondary: "#4f46e5",
        accent: "#818cf8",
        background: "#f5f3ff",
        text: "#3730a3",
        gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        cardBg: "#ffffff",
        cardBorder: "#c7d2fe",
      },
      "Professional Services": {
        primary: "#0891b2",
        secondary: "#0e7490",
        accent: "#06b6d4",
        background: "#f0f9ff",
        text: "#164e63",
        gradient: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
        cardBg: "#ffffff",
        cardBorder: "#a5f3fc",
      },
    };

    return schemes[industry] || schemes["Professional Services"];
  }

  private static generateConversionContent(
    businessName: string,
    industry: string,
    analysisData: any
  ): any {
    const seoScore = analysisData?.seoScore || 75;
    const performanceScore = analysisData?.performanceScore || 80;
    const accessibilityScore = analysisData?.accessibilityScore || 85;
    const bestPracticesScore = analysisData?.bestPracticesScore || 80;
    const issues = analysisData?.issues || [];
    const suggestions = analysisData?.suggestions || [];

    // Calculate overall score
    const overallScore = Math.round(
      (seoScore + performanceScore + accessibilityScore + bestPracticesScore) /
        4
    );

    // Generate industry-specific content based on analysis
    const contentThemes = this.getIndustryContentThemes(industry);

    return {
      hero: {
        headline: `Transform Your ${industry} Business with Professional Excellence`,
        subheadline: `Stop struggling with outdated methods. Get proven strategies, expert guidance, and results-driven solutions that actually convert visitors into customers.`,
        cta: "Get Your Free Consultation",
        stats: [
          { value: "500+", label: "Happy Clients" },
          { value: `${overallScore}%`, label: "Success Rate" },
          { value: "$2M+", label: "Revenue Generated" },
        ],
      },
      about: {
        title: "Why Choose Professional Excellence?",
        content: `In today's competitive ${industry.toLowerCase()} market, you need more than just a presence – you need a strategic advantage. Our proven methodology combines industry expertise with data-driven insights to deliver results that matter.`,
        features: [
          "Data-Driven Strategy",
          "Proven Results",
          "Expert Consultation",
          "Ongoing Support",
        ],
      },
      services: {
        title: "Comprehensive Solutions for Your Success",
        items: [
          {
            title: "Strategic Analysis & Planning",
            description:
              "Comprehensive market analysis and strategic planning to position your business for maximum growth and profitability.",
            icon: "📊",
          },
          {
            title: "Performance Optimization",
            description:
              "Technical optimization to improve your website's performance, user experience, and search engine rankings.",
            icon: "⚡",
          },
          {
            title: "Conversion Rate Optimization",
            description:
              "Data-driven approach to increase your conversion rates and maximize the value of every visitor.",
            icon: "🎯",
          },
          {
            title: "Ongoing Support & Maintenance",
            description:
              "Continuous monitoring, updates, and support to ensure your business maintains its competitive edge.",
            icon: "🛠️",
          },
        ],
      },
      process: {
        title: "Our Proven 4-Step Process",
        steps: [
          {
            number: "01",
            title: "Analysis & Discovery",
            description:
              "We conduct a comprehensive analysis of your current situation, market position, and growth opportunities.",
          },
          {
            number: "02",
            title: "Strategy Development",
            description:
              "Based on our findings, we develop a customized strategy tailored to your specific goals and market conditions.",
          },
          {
            number: "03",
            title: "Implementation",
            description:
              "We execute the strategy with precision, ensuring every element is optimized for maximum impact and results.",
          },
          {
            number: "04",
            title: "Optimization & Growth",
            description:
              "We continuously monitor, analyze, and optimize to ensure sustained growth and improved performance.",
          },
        ],
      },
      benefits: {
        title: "The Results You Can Expect",
        items: [
          {
            title: "Increased Revenue",
            description:
              "Our clients typically see a 25-40% increase in revenue within the first 6 months of implementation.",
            metric: "+40%",
          },
          {
            title: "Better Customer Engagement",
            description:
              "Improved user experience and targeted messaging lead to higher engagement and customer satisfaction.",
            metric: "+60%",
          },
          {
            title: "Enhanced Market Position",
            description:
              "Strategic positioning and optimization help you stand out in your market and attract better customers.",
            metric: "+50%",
          },
          {
            title: "Sustainable Growth",
            description:
              "Our systematic approach ensures long-term success and sustainable business growth.",
            metric: "+35%",
          },
        ],
      },
      testimonials: {
        title: "What Our Clients Say",
        items: [
          {
            quote: `"The transformation in our business has been incredible. We've seen a 40% increase in conversions and our revenue has grown significantly."`,
            author: "Sarah Johnson",
            position: "CEO, Tech Solutions Inc.",
            rating: 5,
          },
          {
            quote: `"Professional, results-driven, and truly understands our industry. The ROI has been exceptional."`,
            author: "Michael Chen",
            position: "Founder, Growth Partners",
            rating: 5,
          },
          {
            quote: `"Finally, a partner that delivers on their promises. Our business has never been stronger."`,
            author: "Emily Rodriguez",
            position: "Marketing Director, Innovation Labs",
            rating: 5,
          },
        ],
      },
      cta: {
        title: "Ready to Transform Your Business?",
        subtitle:
          "Join hundreds of successful businesses that have already achieved remarkable results with our proven methodology.",
        cta: "Start Your Transformation Today",
        guarantee: "30-Day Money-Back Guarantee",
      },
      faq: {
        title: "Frequently Asked Questions",
        items: [
          {
            question: "How quickly will I see results?",
            answer:
              "Most clients see measurable improvements within 30-60 days, with significant results typically achieved within 3-6 months.",
          },
          {
            question: "What makes your approach different?",
            answer:
              "We combine data-driven analysis with industry expertise and proven methodologies to deliver results that matter, not just temporary fixes.",
          },
          {
            question: "Do you work with businesses of all sizes?",
            answer:
              "Yes, we work with businesses ranging from startups to established enterprises, customizing our approach to your specific needs and goals.",
          },
          {
            question: "What ongoing support do you provide?",
            answer:
              "We provide continuous monitoring, regular optimization, and ongoing consultation to ensure your success continues long-term.",
          },
        ],
      },
    };
  }

  private static getIndustryContentThemes(industry: string): any {
    const themes: { [key: string]: any } = {
      Technology: {
        keywords: [
          "innovation",
          "digital transformation",
          "scalable solutions",
          "cutting-edge",
        ],
        painPoints: [
          "outdated systems",
          "technical debt",
          "scalability issues",
        ],
        benefits: [
          "increased efficiency",
          "reduced costs",
          "competitive advantage",
        ],
      },
      Healthcare: {
        keywords: [
          "patient care",
          "health outcomes",
          "medical excellence",
          "trusted care",
        ],
        painPoints: [
          "patient satisfaction",
          "operational efficiency",
          "compliance",
        ],
        benefits: [
          "improved outcomes",
          "better patient experience",
          "regulatory compliance",
        ],
      },
      "Legal Services": {
        keywords: [
          "legal expertise",
          "case success",
          "client advocacy",
          "professional representation",
        ],
        painPoints: ["case complexity", "client communication", "efficiency"],
        benefits: [
          "higher success rates",
          "client satisfaction",
          "operational efficiency",
        ],
      },
      "Financial Services": {
        keywords: [
          "financial growth",
          "investment success",
          "wealth management",
          "secure solutions",
        ],
        painPoints: [
          "market volatility",
          "client trust",
          "regulatory compliance",
        ],
        benefits: [
          "portfolio growth",
          "client retention",
          "regulatory compliance",
        ],
      },
      "Restoration Training": {
        keywords: [
          "professional training",
          "certification",
          "expert skills",
          "industry standards",
        ],
        painPoints: [
          "skill gaps",
          "certification requirements",
          "industry changes",
        ],
        benefits: [
          "professional certification",
          "career advancement",
          "industry recognition",
        ],
      },
      "Professional Services": {
        keywords: [
          "expert consultation",
          "strategic solutions",
          "professional excellence",
          "results-driven",
        ],
        painPoints: [
          "operational challenges",
          "growth limitations",
          "client acquisition",
        ],
        benefits: [
          "increased revenue",
          "operational efficiency",
          "client satisfaction",
        ],
      },
    };

    return themes[industry] || themes["Professional Services"];
  }

  private static generateProfessionalHTML(
    businessName: string,
    industry: string,
    domain: string,
    colors: any,
    content: any,
    analysisData: any
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${businessName} - Professional ${industry} Solutions</title>
  <meta name="description" content="${content.hero.subheadline}" />
  <meta name="keywords" content="${businessName}, ${industry}, professional services, business growth, optimization" />
  <meta property="og:title" content="${businessName} - Professional ${industry} Solutions" />
  <meta property="og:description" content="${content.hero.subheadline}" />
  <meta property="og:image" content="https://via.placeholder.com/1200x630/${colors.primary.replace(
    "#",
    ""
  )}/ffffff?text=${encodeURIComponent(businessName)}" />
  
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: ${colors.text};
      background: ${colors.background};
      overflow-x: hidden;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    /* Header */
    header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      z-index: 1000;
      padding: 1rem 0;
      transition: all 0.3s ease;
    }

    header.scrolled {
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.8rem;
      font-weight: 800;
      color: ${colors.primary};
      text-decoration: none;
    }

    .nav-menu {
      display: flex;
      list-style: none;
      gap: 2rem;
    }

    .nav-menu a {
      text-decoration: none;
      color: ${colors.text};
      font-weight: 500;
      transition: color 0.3s ease;
    }

    .nav-menu a:hover {
      color: ${colors.primary};
    }

    .cta-button {
      background: ${colors.gradient};
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 50px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }

    /* Hero Section */
    .hero {
      background: ${colors.gradient};
      color: white;
      padding: 8rem 0 5rem 0;
      text-align: center;
      position: relative;
      overflow: hidden;
      min-height: 100vh;
      display: flex;
      align-items: center;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
      opacity: 0.3;
    }

    .hero-content {
      position: relative;
      z-index: 2;
      width: 100%;
    }

    .hero h1 {
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-weight: 900;
      margin-bottom: 2rem;
      line-height: 1.1;
      animation: fadeInUp 1s ease;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .hero p {
      font-size: clamp(1.1rem, 2vw, 1.4rem);
      margin-bottom: 3rem;
      opacity: 0.95;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
      animation: fadeInUp 1s ease 0.2s both;
      line-height: 1.6;
    }

    .hero .cta-button {
      font-size: 1.2rem;
      padding: 1.2rem 3rem;
      animation: fadeInUp 1s ease 0.4s both;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }

    .stats {
      display: flex;
      justify-content: center;
      gap: 3rem;
      margin-top: 4rem;
      animation: fadeInUp 1s ease 0.6s both;
      flex-wrap: wrap;
    }

    .stat-item {
      text-align: center;
      background: rgba(255,255,255,0.1);
      padding: 1.5rem 2rem;
      border-radius: 15px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      min-width: 150px;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 800;
      color: ${colors.accent};
      display: block;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 500;
    }

    /* Sections */
    .section {
      padding: 6rem 0;
      background: ${colors.background};
    }

    .section-title {
      text-align: center;
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 800;
      margin-bottom: 1.5rem;
      color: ${colors.primary};
      position: relative;
    }

    .section-title::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 4px;
      background: ${colors.gradient};
      border-radius: 2px;
    }

    .section-subtitle {
      text-align: center;
      font-size: 1.2rem;
      color: #64748b;
      margin-bottom: 4rem;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.6;
    }

    /* About Section */
    .about {
      background: ${colors.cardBg};
    }

    .about-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5rem;
      align-items: center;
    }

    .about-text h2 {
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 800;
      margin-bottom: 2rem;
      color: ${colors.primary};
      line-height: 1.2;
    }

    .about-text p {
      font-size: 1.2rem;
      color: #64748b;
      margin-bottom: 2.5rem;
      line-height: 1.7;
    }

    .features-list {
      list-style: none;
    }

    .features-list li {
      padding: 1rem 0;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      font-size: 1.1rem;
      color: #374151;
    }

    .features-list li::before {
      content: '✓';
      color: ${colors.accent};
      font-weight: bold;
      font-size: 1.5rem;
      background: ${colors.accent}20;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .about-image {
      background: ${colors.gradient};
      height: 450px;
      border-radius: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 5rem;
      animation: float 6s ease-in-out infinite;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    /* Services Section */
    .services {
      background: ${colors.background};
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2.5rem;
    }

    .service-card {
      background: ${colors.cardBg};
      padding: 3rem 2.5rem;
      border-radius: 25px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      transition: all 0.4s ease;
      text-align: center;
      border: 1px solid ${colors.cardBorder};
      position: relative;
      overflow: hidden;
    }

    .service-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: ${colors.gradient};
    }

    .service-card:hover {
      transform: translateY(-15px);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    }

    .service-icon {
      font-size: 4rem;
      margin-bottom: 2rem;
      display: block;
    }

    .service-card h3 {
      font-size: 1.6rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: ${colors.primary};
    }

    .service-card p {
      color: #64748b;
      line-height: 1.7;
      font-size: 1.1rem;
    }

    /* Process Section */
    .process {
      background: white;
    }

    .process-steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .process-step {
      text-align: center;
      padding: 2rem;
    }

    .step-number {
      background: ${colors.gradient};
      color: white;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0 auto 1.5rem;
    }

    .process-step h3 {
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: ${colors.primary};
    }

    .process-step p {
      color: #64748b;
    }

    /* Benefits Section */
    .benefits {
      background: #f8fafc;
    }

    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }

    .benefit-card {
      background: white;
      padding: 2.5rem;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .benefit-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: ${colors.gradient};
    }

    .benefit-metric {
      font-size: 3rem;
      font-weight: 900;
      color: ${colors.accent};
      margin-bottom: 1rem;
    }

    .benefit-card h3 {
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: ${colors.primary};
    }

    .benefit-card p {
      color: #64748b;
    }

    /* Testimonials Section */
    .testimonials {
      background: white;
    }

    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
    }

    .testimonial-card {
      background: #f8fafc;
      padding: 2.5rem;
      border-radius: 20px;
      position: relative;
    }

    .testimonial-card::before {
      content: '"';
      font-size: 4rem;
      color: ${colors.accent};
      position: absolute;
      top: 1rem;
      left: 1.5rem;
      font-family: serif;
    }

    .testimonial-quote {
      font-size: 1.1rem;
      color: #374151;
      margin-bottom: 1.5rem;
      padding-left: 2rem;
    }

    .testimonial-author {
      font-weight: 700;
      color: ${colors.primary};
    }

    .testimonial-position {
      font-size: 0.9rem;
      color: #64748b;
    }

    .testimonial-rating {
      color: #fbbf24;
      margin-top: 0.5rem;
    }

    /* CTA Section */
    .cta-section {
      background: ${colors.gradient};
      color: white;
      text-align: center;
      padding: 5rem 0;
    }

    .cta-section h2 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 1rem;
    }

    .cta-section p {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .cta-section .cta-button {
      background: white;
      color: ${colors.primary};
      font-size: 1.1rem;
      padding: 1rem 3rem;
    }

    .guarantee {
      margin-top: 1rem;
      font-size: 0.9rem;
      opacity: 0.8;
    }

    /* FAQ Section */
    .faq {
      background: #f8fafc;
    }

    .faq-grid {
      max-width: 800px;
      margin: 0 auto;
    }

    .faq-item {
      background: white;
      margin-bottom: 1rem;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .faq-question {
      padding: 1.5rem;
      cursor: pointer;
      font-weight: 600;
      color: ${colors.primary};
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.3s ease;
    }

    .faq-question:hover {
      background: #f1f5f9;
    }

    .faq-answer {
      padding: 0 1.5rem 1.5rem;
      color: #64748b;
      display: none;
    }

    .faq-answer.active {
      display: block;
    }

    .faq-toggle {
      transition: transform 0.3s ease;
    }

    .faq-toggle.active {
      transform: rotate(180deg);
    }

    /* Footer */
    footer {
      background: #1e293b;
      color: white;
      padding: 3rem 0 1rem;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .footer-section h3 {
      color: ${colors.accent};
      margin-bottom: 1rem;
    }

    .footer-section p,
    .footer-section a {
      color: #cbd5e1;
      text-decoration: none;
      line-height: 1.8;
    }

    .footer-section a:hover {
      color: ${colors.accent};
    }

    .footer-bottom {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid #334155;
      color: #94a3b8;
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-20px);
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .container {
        padding: 0 1rem;
      }

      .hero h1 {
        font-size: 2.5rem;
      }

      .hero p {
        font-size: 1.1rem;
      }

      .stats {
        flex-direction: column;
        gap: 1.5rem;
      }

      .about-content {
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      .section-title {
        font-size: 2rem;
      }

      .nav-menu {
        display: none;
      }
    }

    /* Scroll Animations */
    .fade-in {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.6s ease;
    }

    .fade-in.visible {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header id="header">
    <div class="container">
      <div class="header-content">
        <a href="#" class="logo">${businessName}</a>
        <nav>
          <ul class="nav-menu">
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#process">Process</a></li>
            <li><a href="#testimonials">Testimonials</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
        <a href="#contact" class="cta-button">Get Started</a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <h1>${content.hero.headline}</h1>
        <p>${content.hero.subheadline}</p>
        <a href="#contact" class="cta-button">${content.hero.cta}</a>
        <div class="stats">
          ${content.hero.stats
            .map(
              (stat: any) => `
            <div class="stat-item">
              <span class="stat-value">${stat.value}</span>
              <span class="stat-label">${stat.label}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </div>
  </section>

  <!-- About Section -->
  <section id="about" class="section about">
    <div class="container">
      <div class="about-content">
        <div class="about-text">
          <h2>${content.about.title}</h2>
          <p>${content.about.content}</p>
          <ul class="features-list">
            ${content.about.features
              .map(
                (feature: any) => `
              <li>${feature}</li>
            `
              )
              .join("")}
          </ul>
        </div>
        <div class="about-image">
          <i class="fas fa-chart-line"></i>
        </div>
      </div>
    </div>
  </section>

  <!-- Services Section -->
  <section id="services" class="section services">
    <div class="container">
      <h2 class="section-title">${content.services.title}</h2>
      <div class="services-grid">
        ${content.services.items
          .map(
            (service: any) => `
          <div class="service-card fade-in">
            <span class="service-icon">${service.icon}</span>
            <h3>${service.title}</h3>
            <p>${service.description}</p>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  </section>

  <!-- Process Section -->
  <section id="process" class="section process">
    <div class="container">
      <h2 class="section-title">${content.process.title}</h2>
      <div class="process-steps">
        ${content.process.steps
          .map(
            (step) => `
          <div class="process-step fade-in">
            <div class="step-number">${step.number}</div>
            <h3>${step.title}</h3>
            <p>${step.description}</p>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  </section>

  <!-- Benefits Section -->
  <section class="section benefits">
    <div class="container">
      <h2 class="section-title">${content.benefits.title}</h2>
      <div class="benefits-grid">
        ${content.benefits.items
          .map(
            (benefit) => `
          <div class="benefit-card fade-in">
            <div class="benefit-metric">${benefit.metric}</div>
            <h3>${benefit.title}</h3>
            <p>${benefit.description}</p>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  </section>

  <!-- Testimonials Section -->
  <section id="testimonials" class="section testimonials">
    <div class="container">
      <h2 class="section-title">${content.testimonials.title}</h2>
      <div class="testimonials-grid">
        ${content.testimonials.items
          .map(
            (testimonial) => `
          <div class="testimonial-card fade-in">
            <p class="testimonial-quote">${testimonial.quote}</p>
            <div class="testimonial-author">${testimonial.author}</div>
            <div class="testimonial-position">${testimonial.position}</div>
            <div class="testimonial-rating">
              ${"★".repeat(testimonial.rating)}
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="cta-section">
    <div class="container">
      <h2>${content.cta.title}</h2>
      <p>${content.cta.subtitle}</p>
      <a href="#contact" class="cta-button">${content.cta.cta}</a>
      <div class="guarantee">${content.cta.guarantee}</div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="section faq">
    <div class="container">
      <h2 class="section-title">${content.faq.title}</h2>
      <div class="faq-grid">
        ${content.faq.items
          .map(
            (item, index) => `
          <div class="faq-item fade-in">
            <div class="faq-question" onclick="toggleFAQ(${index})">
              ${item.question}
              <i class="fas fa-chevron-down faq-toggle" id="toggle-${index}"></i>
            </div>
            <div class="faq-answer" id="answer-${index}">
              ${item.answer}
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section id="contact" class="section">
    <div class="container">
      <h2 class="section-title">Get Started Today</h2>
      <p class="section-subtitle">Ready to transform your business? Let's discuss how we can help you achieve your goals.</p>
      <div style="text-align: center;">
        <a href="mailto:contact@${domain}" class="cta-button">Contact Us</a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>${businessName}</h3>
          <p>Professional ${industry.toLowerCase()} solutions that deliver results. Transform your business with our proven methodology.</p>
        </div>
        <div class="footer-section">
          <h3>Services</h3>
          <p><a href="#services">Strategic Analysis</a></p>
          <p><a href="#services">Performance Optimization</a></p>
          <p><a href="#services">Conversion Optimization</a></p>
          <p><a href="#services">Ongoing Support</a></p>
        </div>
        <div class="footer-section">
          <h3>Contact</h3>
          <p>Email: contact@${domain}</p>
          <p>Phone: +1 (555) 123-4567</p>
          <p>Address: Professional Business District</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <script>
    // Header scroll effect
    window.addEventListener('scroll', function() {
      const header = document.getElementById('header');
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // FAQ toggle
    function toggleFAQ(index) {
      const answer = document.getElementById('answer-' + index);
      const toggle = document.getElementById('toggle-' + index);
      
      if (answer.classList.contains('active')) {
        answer.classList.remove('active');
        toggle.classList.remove('active');
      } else {
        // Close all other FAQs
        document.querySelectorAll('.faq-answer').forEach(ans => ans.classList.remove('active'));
        document.querySelectorAll('.faq-toggle').forEach(tog => tog.classList.remove('active'));
        
        answer.classList.add('active');
        toggle.classList.add('active');
      }
    }

    // Scroll animations
    function checkScroll() {
      const elements = document.querySelectorAll('.fade-in');
      elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add('visible');
        }
      });
    }

    window.addEventListener('scroll', checkScroll);
    window.addEventListener('load', checkScroll);

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  </script>
</body>
</html>
    `;
  }
}
