import { type NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

interface ExtractedContent {
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  links: Array<{ text: string; href: string }>;
  images: Array<{ src: string; alt: string }>;
  business?: {
    name?: string;
    industry?: string;
    type?: string;
    location?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  services?: Array<{
    title: string;
    description: string;
  }>;
  navigation?: Array<{
    text: string;
    href: string;
  }>;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  url: string;
}

function safeString(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

function extractBusinessInfo(
  text: string,
  url: string
): ExtractedContent["business"] {
  const business: ExtractedContent["business"] = {};

  // Extract business name from domain or title
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    business.name =
      domain.split(".")[0].charAt(0).toUpperCase() +
      domain.split(".")[0].slice(1);
  } catch {
    business.name = "Business";
  }

  // Detect industry keywords
  const industryKeywords = {
    restaurant: ["restaurant", "food", "dining", "menu", "cuisine"],
    healthcare: ["health", "medical", "doctor", "clinic", "hospital"],
    legal: ["law", "legal", "attorney", "lawyer", "court"],
    "real estate": ["real estate", "property", "homes", "realtor"],
    technology: ["tech", "software", "development", "IT", "digital"],
    marketing: ["marketing", "advertising", "seo", "social media"],
    education: ["education", "school", "university", "learning"],
    finance: ["finance", "banking", "investment", "accounting"],
    retail: ["shop", "store", "retail", "ecommerce", "buy"],
    consulting: ["consulting", "advisory", "strategy", "business"],
  };

  const lowerText = text.toLowerCase();
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      business.industry = industry;
      break;
    }
  }

  return business;
}

function extractContactInfo(text: string): ExtractedContent["contact"] {
  const contact: ExtractedContent["contact"] = {};

  // Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    contact.email = emails[0];
  }

  // Phone regex (various formats)
  const phoneRegex =
    /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    contact.phone = phones[0];
  }

  return contact;
}

function extractServices($: cheerio.CheerioAPI): ExtractedContent["services"] {
  const services: ExtractedContent["services"] = [];

  // Look for service sections
  const serviceSelectors = [
    ".service",
    ".services",
    "[class*='service']",
    ".offering",
    ".offerings",
    ".feature",
    ".features",
  ];

  serviceSelectors.forEach((selector) => {
    $(selector).each((_, element) => {
      const $el = $(element);
      const title = $el.find("h1, h2, h3, h4, h5, h6").first().text().trim();
      const description = $el.find("p").first().text().trim();

      if (title && title.length > 0) {
        services.push({
          title: safeString(title),
          description: safeString(description) || "Service description",
        });
      }
    });
  });

  // If no services found, create default ones
  if (services.length === 0) {
    services.push(
      {
        title: "Professional Service",
        description:
          "High-quality professional services tailored to your needs.",
      },
      {
        title: "Expert Consultation",
        description:
          "Expert advice and consultation to help you achieve your goals.",
      },
      {
        title: "Custom Solutions",
        description:
          "Customized solutions designed specifically for your requirements.",
      }
    );
  }

  return services;
}

function extractNavigation(
  $: cheerio.CheerioAPI
): ExtractedContent["navigation"] {
  const navigation: ExtractedContent["navigation"] = [];

  // Look for navigation elements
  const navSelectors = [
    "nav a",
    ".nav a",
    ".navigation a",
    ".menu a",
    "header a",
  ];

  navSelectors.forEach((selector) => {
    $(selector).each((_, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      const href = $el.attr("href") || "#";

      if (text && text.length > 0 && text.length < 50) {
        navigation.push({
          text: safeString(text),
          href: safeString(href),
        });
      }
    });
  });

  // Remove duplicates
  const uniqueNav = navigation.filter(
    (item, index, self) => index === self.findIndex((t) => t.text === item.text)
  );

  return uniqueNav.slice(0, 6); // Limit to 6 items
}

function extractColors($: cheerio.CheerioAPI): ExtractedContent["colors"] {
  const colors: ExtractedContent["colors"] = {};

  // Try to extract colors from CSS
  const styles = $("style").text();
  const cssLinks = $("link[rel='stylesheet']");

  // Look for common color patterns
  const colorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g;
  const foundColors = styles.match(colorRegex) || [];

  if (foundColors.length > 0) {
    colors.primary = foundColors[0];
    if (foundColors.length > 1) colors.secondary = foundColors[1];
    if (foundColors.length > 2) colors.accent = foundColors[2];
  }

  return colors;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let validUrl: string;
    try {
      const urlObj = new URL(url);
      validUrl = urlObj.toString();
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch the website content
    const response = await fetch(validUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract content
    const extractedContent: ExtractedContent = {
      title: safeString(
        $("title").text() || $("h1").first().text() || "Website"
      ),
      description: safeString(
        $("meta[name='description']").attr("content") ||
          $("meta[property='og:description']").attr("content") ||
          ""
      ),
      headings: [],
      paragraphs: [],
      links: [],
      images: [],
      url: validUrl,
    };

    // Extract headings
    $("h1, h2, h3, h4, h5, h6").each((_, element) => {
      const text = $(element).text().trim();
      if (text && text.length > 0) {
        extractedContent.headings.push(safeString(text));
      }
    });

    // Extract paragraphs
    $("p").each((_, element) => {
      const text = $(element).text().trim();
      if (text && text.length > 20) {
        extractedContent.paragraphs.push(safeString(text));
      }
    });

    // Extract links
    $("a[href]").each((_, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      const href = $el.attr("href");

      if (text && href && text.length > 0 && text.length < 100) {
        extractedContent.links.push({
          text: safeString(text),
          href: safeString(href),
        });
      }
    });

    // Extract images
    $("img[src]").each((_, element) => {
      const $el = $(element);
      const src = $el.attr("src");
      const alt = $el.attr("alt") || "";

      if (src) {
        extractedContent.images.push({
          src: safeString(src),
          alt: safeString(alt),
        });
      }
    });

    // Extract business information
    const allText = $.text();
    extractedContent.business = extractBusinessInfo(allText, validUrl);
    extractedContent.contact = extractContactInfo(allText);
    extractedContent.services = extractServices($);
    extractedContent.navigation = extractNavigation($);
    extractedContent.colors = extractColors($);

    // Enhance description if empty
    if (!extractedContent.description) {
      const firstParagraph = extractedContent.paragraphs[0];
      if (firstParagraph && firstParagraph.length > 50) {
        extractedContent.description = firstParagraph.substring(0, 160) + "...";
      } else {
        extractedContent.description = `Professional ${
          extractedContent.business?.industry || "business"
        } services`;
      }
    }

    return NextResponse.json(extractedContent);
  } catch (error) {
    console.error("Error fetching website content:", error);
    return NextResponse.json(
      { error: "Failed to fetch website content" },
      { status: 500 }
    );
  }
}
