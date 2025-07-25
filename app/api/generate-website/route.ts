import { type NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

// Safe string helper - never throws
function safeString(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return String(value);
}

// Safe lowercase helper - never throws
function safeLower(value: any): string {
  const str = safeString(value);
  return str.toLowerCase();
}

function generateKeywords(originalContent: any, enhancedContent: any): string {
  const keywords: string[] = [];

  const addKeyword = (value: any) => {
    const str = safeString(value).trim();
    if (str) {
      keywords.push(str);
    }
  };

  // Safely extract keywords
  try {
    addKeyword(originalContent?.business?.industry);
    addKeyword(originalContent?.business?.type);
    addKeyword(originalContent?.business?.location);
    addKeyword(enhancedContent?.business?.industry);
    addKeyword(enhancedContent?.business?.type);

    if (Array.isArray(originalContent?.services)) {
      originalContent.services.forEach((service: any) => {
        addKeyword(service?.title);
        addKeyword(service?.name);
      });
    }

    if (Array.isArray(enhancedContent?.services)) {
      enhancedContent.services.forEach((service: any) => {
        addKeyword(service?.title);
        addKeyword(service?.name);
      });
    }
  } catch (error) {
    console.error("Error generating keywords:", error);
  }

  return keywords.join(", ");
}

function getSchemaType(businessType: any): string {
  const type = safeLower(businessType).trim();

  if (type.includes("restaurant") || type.includes("food")) return "Restaurant";
  if (type.includes("agency") || type.includes("marketing"))
    return "Organization";
  if (
    type.includes("ecommerce") ||
    type.includes("e-commerce") ||
    type.includes("shop")
  )
    return "Store";
  if (type.includes("healthcare") || type.includes("medical"))
    return "MedicalOrganization";
  if (type.includes("legal") || type.includes("law")) return "LegalService";
  if (type.includes("real estate") || type.includes("property"))
    return "RealEstateAgent";
  if (type.includes("education") || type.includes("school"))
    return "EducationalOrganization";

  return "LocalBusiness";
}

function generateNavigation(navigation: any): string {
  if (!Array.isArray(navigation) || navigation.length === 0) {
    return `
      <li role="none"><a href="#services" role="menuitem">Services</a></li>
      <li role="none"><a href="#about" role="menuitem">About</a></li>
      <li role="none"><a href="#contact" role="menuitem">Contact</a></li>
    `;
  }

  return navigation
    .map((item) => {
      const title = safeString(
        item?.title || item?.text || item?.name || "Link"
      );
      const href = safeString(item?.href || item?.url || "#");
      return `<li role="none"><a href="${href}" role="menuitem">${title}</a></li>`;
    })
    .join("");
}

function getServiceIcon(title: any): string {
  const titleLower = safeLower(title);

  if (
    titleLower.includes("design") ||
    titleLower.includes("creative") ||
    titleLower.includes("art")
  )
    return "🎨";
  if (
    titleLower.includes("development") ||
    titleLower.includes("tech") ||
    titleLower.includes("software")
  )
    return "💻";
  if (
    titleLower.includes("marketing") ||
    titleLower.includes("seo") ||
    titleLower.includes("advertising")
  )
    return "📈";
  if (
    titleLower.includes("consulting") ||
    titleLower.includes("strategy") ||
    titleLower.includes("advice")
  )
    return "🎯";
  if (
    titleLower.includes("support") ||
    titleLower.includes("service") ||
    titleLower.includes("help")
  )
    return "🛠️";
  if (
    titleLower.includes("analytics") ||
    titleLower.includes("data") ||
    titleLower.includes("analysis")
  )
    return "📊";
  if (
    titleLower.includes("finance") ||
    titleLower.includes("accounting") ||
    titleLower.includes("money")
  )
    return "💰";
  if (
    titleLower.includes("health") ||
    titleLower.includes("medical") ||
    titleLower.includes("wellness")
  )
    return "🏥";
  if (
    titleLower.includes("education") ||
    titleLower.includes("training") ||
    titleLower.includes("learning")
  )
    return "📚";
  if (
    titleLower.includes("security") ||
    titleLower.includes("protection") ||
    titleLower.includes("safety")
  )
    return "🔒";

  return "⚡";
}

function generateServices(services: any): string {
  if (!Array.isArray(services) || services.length === 0) {
    return `
      <div class="service-card">
        <div class="service-icon">⚡</div>
        <h3 class="service-title">Professional Service</h3>
        <p class="service-description">We provide high-quality professional services tailored to your needs.</p>
      </div>
      <div class="service-card">
        <div class="service-icon">🎯</div>
        <h3 class="service-title">Strategic Solutions</h3>
        <p class="service-description">Our strategic approach ensures optimal results for your business goals.</p>
      </div>
      <div class="service-card">
        <div class="service-icon">🚀</div>
        <h3 class="service-title">Growth Focused</h3>
        <p class="service-description">We help accelerate your business growth with proven methodologies.</p>
      </div>
    `;
  }

  return services
    .map((service) => {
      const title = safeString(service?.title || service?.name || "Service");
      const description = safeString(
        service?.description ||
          service?.desc ||
          "Professional service description"
      );
      const icon = getServiceIcon(title);

      return `
        <div class="service-card">
          <div class="service-icon">${icon}</div>
          <h3 class="service-title">${title}</h3>
          <p class="service-description">${description}</p>
        </div>
      `;
    })
    .join("");
}

function generateAboutText(originalContent: any, enhancedContent: any): string {
  // Try enhanced content first
  if (enhancedContent?.aboutText) {
    return safeString(enhancedContent.aboutText);
  }

  // Try original content
  if (originalContent?.about) {
    return safeString(originalContent.about);
  }

  // Generate default
  const businessName = safeString(
    originalContent?.business?.name ||
      enhancedContent?.business?.name ||
      "Our Company"
  );
  const industry = safeString(
    originalContent?.business?.industry ||
      enhancedContent?.business?.industry ||
      "business"
  );

  return `${businessName} is a leading ${industry} company dedicated to providing exceptional services and solutions. With years of experience and a commitment to excellence, we help our clients achieve their goals through innovative approaches and personalized service. Our team of professionals is passionate about delivering results that exceed expectations.`;
}

function generateTestimonialsSection(testimonials: any): string {
  if (!Array.isArray(testimonials) || testimonials.length === 0) return "";

  return `
    <section class="testimonials" aria-labelledby="testimonials-heading">
      <div class="container">
        <h2 id="testimonials-heading" class="section-title">What Our Clients Say</h2>
        <div class="testimonials-grid">
          ${testimonials
            .map((testimonial) => {
              const text = safeString(
                testimonial?.text || testimonial?.quote || "Great service!"
              );
              const author = safeString(
                testimonial?.author || testimonial?.name || "Anonymous"
              );
              return `
                <div class="testimonial-card">
                  <p class="testimonial-text">"${text}"</p>
                  <p class="testimonial-author">- ${author}</p>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function generateTeamSection(team: any): string {
  if (!Array.isArray(team) || team.length === 0) return "";

  return `
    <section class="team" aria-labelledby="team-heading">
      <div class="container">
        <h2 id="team-heading" class="section-title">Our Team</h2>
        <div class="team-grid">
          ${team
            .map((member) => {
              const name = safeString(member?.name || "Team Member");
              const role = safeString(
                member?.role || member?.position || "Team Member"
              );
              const image = safeString(member?.image || member?.photo || "");

              return `
                <div class="team-card">
                  ${
                    image
                      ? `<img src="${image}" alt="${name}" class="team-image">`
                      : ""
                  }
                  <h3 class="team-name">${name}</h3>
                  <p class="team-role">${role}</p>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function generateContactInfo(contact: any): string {
  if (!contact) return "<p>Contact us for more information.</p>";

  const email = safeString(contact?.email || "");
  const phone = safeString(contact?.phone || "");
  const address = safeString(contact?.address || "");

  let html = "";
  if (email)
    html += `<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>`;
  if (phone)
    html += `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>`;
  if (address) html += `<p><strong>Address:</strong> ${address}</p>`;

  return html || "<p>Contact us for more information.</p>";
}

export async function POST(request: NextRequest) {
  try {
    const { websiteGenerationPrompt, multiPageAudit } = await request.json();

    if (!websiteGenerationPrompt) {
      return NextResponse.json(
        { error: "Website generation prompt is required" },
        { status: 400 }
      );
    }

    // Use OpenAI to generate the optimized website
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI API key is required for website generation",
          fallback:
            "Please add your OpenAI API key to generate optimized websites",
        },
        { status: 400 }
      );
    }

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a Senior Web Developer and SEO Expert. Create a complete, modern, SEO-optimized website based on the audit analysis provided. 

Your response should include:
1. Complete HTML structure for all pages
2. CSS styling for modern, responsive design
3. SEO-optimized meta tags and structured data
4. JavaScript for interactivity
5. Detailed implementation instructions
6. File structure and organization
7. Performance optimization recommendations

Focus on creating a website that scores 90+ on all SEO, content, and technical metrics.`,
              },
              {
                role: "user",
                content: websiteGenerationPrompt,
              },
            ],
            max_tokens: 4000,
            temperature: 0.3,
          }),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        const generatedWebsite = responseData.choices?.[0]?.message?.content;

        if (generatedWebsite) {
          return NextResponse.json({
            success: true,
            generatedWebsite,
            auditSummary: {
              totalPages: multiPageAudit?.totalPagesAnalyzed || 0,
              seoScore: multiPageAudit?.seoScore || 0,
              contentScore: multiPageAudit?.contentScore || 0,
              technicalScore: multiPageAudit?.technicalScore || 0,
              criticalIssuesFixed:
                multiPageAudit?.siteWideIssues?.filter(
                  (issue) => issue.severity === "critical"
                ).length || 0,
              highIssuesFixed:
                multiPageAudit?.siteWideIssues?.filter(
                  (issue) => issue.severity === "high"
                ).length || 0,
            },
            message:
              "Website generated successfully with all SEO issues addressed",
          });
        }
      }

      return NextResponse.json(
        {
          error: "Failed to generate website",
          details: "OpenAI API request failed",
        },
        { status: 500 }
      );
    } catch (error) {
      // console.error("Website generation failed:", error);
      return NextResponse.json(
        {
          error: "Website generation failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to process website generation request" },
      { status: 500 }
    );
  }
}

function generateHTML(
  originalContent: any,
  enhancedContent: any,
  analysisResult: any
): string {
  const businessName = safeString(
    enhancedContent?.business?.name ||
      originalContent?.business?.name ||
      "Your Business"
  );
  const title = safeString(
    enhancedContent?.title || originalContent?.title || businessName
  );
  const description = safeString(
    enhancedContent?.description ||
      originalContent?.description ||
      `Professional ${safeString(
        originalContent?.business?.industry || "business"
      )} services`
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <meta name="keywords" content="${generateKeywords(
      originalContent,
      enhancedContent
    )}">
    <meta name="author" content="${businessName}">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://example.com">
    <meta property="og:image" content="https://example.com/og-image.jpg">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="https://example.com/twitter-image.jpg">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://example.com">
    
    <!-- Preconnect for performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Modern CSS -->
    <link rel="stylesheet" href="styles.css">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "${getSchemaType(originalContent?.business?.type)}",
      "name": "${businessName}",
      "description": "${description}",
      "url": "https://example.com",
      "telephone": "${safeString(originalContent?.contact?.phone || "")}",
      "email": "${safeString(originalContent?.contact?.email || "")}",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "${safeString(
          originalContent?.contact?.address || ""
        )}"
      }
    }
    </script>
    
    <title>${title}</title>
</head>
<body>
    <!-- Skip to main content for accessibility -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <!-- Header -->
    <header class="header" role="banner">
        <nav class="nav" role="navigation" aria-label="Main navigation">
            <div class="nav-container">
                <div class="logo">
                    <h1>${businessName}</h1>
                </div>
                <ul class="nav-menu" role="menubar">
                    ${generateNavigation(
                      enhancedContent?.navigation || originalContent?.navigation
                    )}
                </ul>
                <button class="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main id="main-content" role="main">
        <!-- Hero Section -->
        <section class="hero" aria-labelledby="hero-heading">
            <div class="hero-container">
                <h1 id="hero-heading" class="hero-title">${safeString(
                  enhancedContent?.heroTitle || title
                )}</h1>
                <p class="hero-description">${safeString(
                  enhancedContent?.heroDescription || description
                )}</p>
                <div class="hero-actions">
                    <a href="#contact" class="btn btn-primary">Get Started</a>
                    <a href="#services" class="btn btn-secondary">Learn More</a>
                </div>
            </div>
        </section>

        <!-- Services Section -->
        <section id="services" class="services" aria-labelledby="services-heading">
            <div class="container">
                <h2 id="services-heading" class="section-title">Our Services</h2>
                <div class="services-grid">
                    ${generateServices(
                      enhancedContent?.services || originalContent?.services
                    )}
                </div>
            </div>
        </section>

        <!-- About Section -->
        <section id="about" class="about" aria-labelledby="about-heading">
            <div class="container">
                <h2 id="about-heading" class="section-title">About Us</h2>
                <div class="about-content">
                    <p>${generateAboutText(
                      originalContent,
                      enhancedContent
                    )}</p>
                </div>
            </div>
        </section>

        ${generateTestimonialsSection(
          enhancedContent?.testimonials || originalContent?.testimonials
        )}
        ${generateTeamSection(enhancedContent?.team || originalContent?.team)}

        <!-- Contact Section -->
        <section id="contact" class="contact" aria-labelledby="contact-heading">
            <div class="container">
                <h2 id="contact-heading" class="section-title">Contact Us</h2>
                <div class="contact-content">
                    <div class="contact-info">
                        ${generateContactInfo(originalContent?.contact)}
                    </div>
                    <form class="contact-form" role="form" aria-label="Contact form">
                        <div class="form-group">
                            <label for="name">Name *</label>
                            <input type="text" id="name" name="name" required aria-required="true">
                        </div>
                        <div class="form-group">
                            <label for="email">Email *</label>
                            <input type="email" id="email" name="email" required aria-required="true">
                        </div>
                        <div class="form-group">
                            <label for="message">Message *</label>
                            <textarea id="message" name="message" rows="5" required aria-required="true"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Send Message</button>
                    </form>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="footer" role="contentinfo">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>${businessName}</h3>
                    <p>${description}</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#services">Services</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Contact Info</h4>
                    ${generateContactInfo(originalContent?.contact)}
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- JavaScript -->
    <script src="script.js"></script>
</body>
</html>`;
}

function generateCSS(colors: any): string {
  return `/* Modern CSS Reset */
*, *::before, *::after {
    box-sizing: border-box;
}

* {
    margin: 0;
    padding: 0;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: ${safeString(colors?.text || "#1F2937")};
    background-color: ${safeString(colors?.background || "#FFFFFF")};
}

/* CSS Custom Properties */
:root {
    --primary-color: ${safeString(colors?.primary || "#3B82F6")};
    --secondary-color: ${safeString(colors?.secondary || "#10B981")};
    --accent-color: ${safeString(colors?.accent || "#F59E0B")};
    --background-color: ${safeString(colors?.background || "#FFFFFF")};
    --text-color: ${safeString(colors?.text || "#1F2937")};
    --text-light: #6B7280;
    --border-color: #E5E7EB;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --border-radius: 8px;
    --transition: all 0.3s ease;
}

/* Skip Link for Accessibility */
.skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: var(--primary-color);
    color: white;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 1000;
}

.skip-link:focus {
    top: 6px;
}

/* Container */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

/* Header */
.header {
    background: var(--background-color);
    box-shadow: var(--shadow);
    position: sticky;
    top: 0;
    z-index: 100;
}

.nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
}

.logo h1 {
    color: var(--primary-color);
    font-size: 1.5rem;
    font-weight: 700;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: var(--text-color);
    font-weight: 500;
    transition: var(--transition);
}

.nav-menu a:hover,
.nav-menu a:focus {
    color: var(--primary-color);
}

.nav-toggle {
    display: none;
    flex-direction: column;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
}

.nav-toggle span {
    width: 25px;
    height: 3px;
    background: var(--text-color);
    margin: 3px 0;
    transition: var(--transition);
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    padding: 4rem 0;
    text-align: center;
}

.hero-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
}

.hero-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    line-height: 1.2;
}

.hero-description {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.hero-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: var(--border-radius);
    text-decoration: none;
    font-weight: 600;
    transition: var(--transition);
    border: 2px solid transparent;
    cursor: pointer;
    font-size: 1rem;
}

.btn-primary {
    background: var(--accent-color);
    color: white;
}

.btn-primary:hover,
.btn-primary:focus {
    background: #D97706;
    transform: translateY(-2px);
}

.btn-secondary {
    background: transparent;
    color: white;
    border-color: white;
}

.btn-secondary:hover,
.btn-secondary:focus {
    background: white;
    color: var(--primary-color);
}

/* Sections */
section {
    padding: 4rem 0;
}

.section-title {
    font-size: 2.5rem;
    font-weight: 700;
    text-align: center;
    margin-bottom: 3rem;
    color: var(--text-color);
}

/* Services */
.services {
    background: #F9FAFB;
}

.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.service-card {
    background: white;
    padding: 2rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    text-align: center;
    transition: var(--transition);
}

.service-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
}

.service-icon {
    width: 60px;
    height: 60px;
    background: var(--primary-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    color: white;
    font-size: 1.5rem;
}

.service-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-color);
}

.service-description {
    color: var(--text-light);
    line-height: 1.6;
}

/* About */
.about-content {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
    font-size: 1.125rem;
    color: var(--text-light);
    line-height: 1.8;
}

/* Testimonials */
.testimonials {
    background: #F9FAFB;
}

.testimonials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.testimonial-card {
    background: white;
    padding: 2rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
}

.testimonial-text {
    font-style: italic;
    margin-bottom: 1rem;
    color: var(--text-light);
}

.testimonial-author {
    font-weight: 600;
    color: var(--text-color);
}

/* Team */
.team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.team-card {
    text-align: center;
    background: white;
    padding: 2rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
}

.team-image {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    margin: 0 auto 1rem;
    object-fit: cover;
}

.team-name {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-color);
}

.team-role {
    color: var(--text-light);
}

/* Contact */
.contact {
    background: #F9FAFB;
}

.contact-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    max-width: 1000px;
    margin: 0 auto;
}

.contact-info h3 {
    margin-bottom: 1rem;
    color: var(--text-color);
}

.contact-info p {
    margin-bottom: 0.5rem;
    color: var(--text-light);
}

.contact-form {
    background: white;
    padding: 2rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-color);
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius);
    font-size: 1rem;
    transition: var(--transition);
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--primary-color);
}

/* Footer */
.footer {
    background: var(--text-color);
    color: white;
    padding: 3rem 0 1rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.footer-section ul {
    list-style: none;
}

.footer-section ul li {
    margin-bottom: 0.5rem;
}

.footer-section a {
    color: #D1D5DB;
    text-decoration: none;
    transition: var(--transition);
}

.footer-section a:hover,
.footer-section a:focus {
    color: var(--primary-color);
}

.footer-bottom {
    border-top: 1px solid #374151;
    padding-top: 1rem;
    text-align: center;
    color: #9CA3AF;
}

/* Responsive Design */
@media (max-width: 768px) {
    .nav-menu {
        position: fixed;
        top: 70px;
        left: -100%;
        width: 100%;
        height: calc(100vh - 70px);
        background: var(--background-color);
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        padding-top: 2rem;
        transition: var(--transition);
        box-shadow: var(--shadow);
    }

    .nav-menu.active {
        left: 0;
    }

    .nav-toggle {
        display: flex;
    }

    .hero-title {
        font-size: 2rem;
    }

    .hero-actions {
        flex-direction: column;
        align-items: center;
    }

    .contact-content {
        grid-template-columns: 1fr;
    }

    .section-title {
        font-size: 2rem;
    }
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

.fade-in-up {
    animation: fadeInUp 0.6s ease-out;
}

/* Focus styles for accessibility */
*:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    :root {
        --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
    
    html {
        scroll-behavior: auto;
    }
}`;
}

function generateJavaScript(): string {
  return `// Modern JavaScript for enhanced functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            const isExpanded = navMenu.classList.contains('active');
            navToggle.setAttribute('aria-expanded', isExpanded);
        });

        // Close mobile menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Form submission handling
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            if (!name || !email || !message) {
                alert('Please fill in all required fields.');
                return;
            }
            
            if (!isValidEmail(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            
            // Simulate form submission
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            
            setTimeout(() => {
                alert('Thank you for your message! We will get back to you soon.');
                this.reset();
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 1000);
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.service-card, .testimonial-card, .team-card');
    animateElements.forEach(el => observer.observe(el));

    // Lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Keyboard navigation improvements
    document.addEventListener('keydown', function(e) {
        // Escape key closes mobile menu
        if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.focus();
        }
    });

    // Performance optimization: Debounced scroll handler
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(function() {
            // Add scroll-based functionality here if needed
            const scrollTop = window.pageYOffset;
            const header = document.querySelector('.header');
            
            if (header) {
                if (scrollTop > 100) {
                    header.style.background = 'rgba(255, 255, 255, 0.95)';
                    header.style.backdropFilter = 'blur(10px)';
                } else {
                    header.style.background = 'var(--background-color)';
                    header.style.backdropFilter = 'none';
                }
            }
        }, 10);
    });
});

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.error('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.error('ServiceWorker registration failed');
            });
    });
}

// Error handling for images
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.style.display = 'none';
        console.error('Image failed to load:', e.target.src);
    }
}, true);`;
}

function generateManifest(enhancedContent: any): string {
  const businessName = safeString(
    enhancedContent?.business?.name || "Your Business"
  );
  const description = safeString(
    enhancedContent?.description || "Professional business website"
  );

  return JSON.stringify(
    {
      name: businessName,
      short_name: businessName.split(" ")[0] || "Business",
      description: description,
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#3B82F6",
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
    null,
    2
  );
}

function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml`;
}

function generateSitemap(baseUrl: string): string {
  const url = safeString(baseUrl) || "https://example.com";
  const currentDate = new Date().toISOString().split("T")[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${url}#services</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${url}#about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${url}#contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
}
