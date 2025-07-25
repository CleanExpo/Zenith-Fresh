import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";

async function handleGenerateWebsite(
  request: NextRequest,
  context: { user: any }
) {
  try {
    const { websiteGenerationPrompt, multiPageAudit, analysisId } =
      await request.json();

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
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are a Senior Web Developer and UI/UX Designer.

Your task is to generate a complete, professional multi-page website for the provided business context and audit.

**CRITICAL DESIGN REQUIREMENTS:**
- Use a **dark blue/black background** with gradients and overlays.
- Use **neon blue/cyan accent colors** for buttons, links, and highlights.
- All sections must use **cards, shadows, and depth** for a modern look (no glassmorphism).
- Navigation bar and footer must be **sticky, modern, and dark** with a blurred or solid background (no glassmorphism).
- Use **large, bold headlines**, modern sans-serif fonts (Roboto), and generous padding/margin.
- **Each section must be separated by large vertical spacing and generous padding** (at least py-16 or py-20 for each section).
- **index.html MUST have at least 8-10 visually distinct, well-spaced sections, each wrapped in a <section> tag and using py-16 or py-20.**
- **Mimic the attached image as closely as possible in layout, color, and style.**
- Use Lucide React icons (https://lucide.dev/icons) for all icons, and include them via <script src="https://unpkg.com/lucide@latest"></script> in the <head>.
- No images, SVGs, or icons except for Lucide icons and Tailwind CSS.
- Use only Tailwind CSS and Google Fonts (Roboto).
- Every HTML file MUST include <script src="https://cdn.tailwindcss.com"></script> in the <head>.
- All styling must use Tailwind CSS classes only.
- The HTML must be valid and include <html>, <head>, and <body> tags.

**SECTION ORDER (Landing Page):**
1. Hero (large headline, subheadline, CTA buttons)
2. Features/Benefits (3–4 cards with Lucide icons)
3. Services Overview (cards or grid)
4. Statistics/Highlights (with numbers)
5. Testimonials/Social Proof (cards or tabs)
6. Partners/Clients (badges or cards)
7. Pricing/Plans (cards or grid)
8. Blog/Insights (2–3 post previews)
9. Call to Action (CTA)
10. Footer (with navigation, social links, and legal)

**ALL PAGES:**
- Must use the same dark, modern style.
- At least 3–4 sections per page.

**IMPORTANT:**
- No images, SVGs, or external assets except Tailwind, Lucide icons, and Google Fonts.
- All navigation links must work between pages.
- Return ONLY a valid JSON object with each file as a complete HTML document.
- No markdown code blocks, no explanations.

REQUIRED PAGES:
- index.html (Landing/Home with 10-12 unique, content-rich, modern, branded sections)
- about.html (About us page, detailed, professional copy)
- contact.html (Contact page with form, business info, and map placeholder)
- services.html (Services/products page, detailed, with at least 3-5 service cards)

TECHNICAL REQUIREMENTS:
- Each HTML file must be complete and standalone
- Use Tailwind CSS CDN (https://cdn.tailwindcss.com)
- Use Google Fonts (Roboto family)
- Include proper navigation between all pages (links must work)
- Modern, responsive, accessible design
- SEO optimized with proper meta tags
- Professional color scheme and branding
- Interactive elements and modern UI components

LANDING PAGE MUST INCLUDE (at least 10-12 sections):
- Hero section with compelling headline and subheadline
- Features/benefits section (detailed)
- Services overview (detailed)
- Testimonials/social proof (at least 3)
- About us preview
- Pricing or plans section
- Case studies or portfolio section
- Blog or insights section (with 2-3 sample posts)
- FAQ section
- Contact/CTA section
- Footer with navigation and social links
- Any other modern, relevant section

CONTENT REQUIREMENTS:
- Use realistic, professional, and detailed business copywriting
- Use placeholder images where appropriate (e.g., https://placehold.co/600x400)
- Fill each section with as much relevant content as possible
- Use the full token limit for maximum detail

RETURN FORMAT:
{
  "index.html": "<!DOCTYPE html><html>...</html>",
  "about.html": "<!DOCTYPE html><html>...</html>",
  "contact.html": "<!DOCTYPE html><html>...</html>",
  "services.html": "<!DOCTYPE html><html>...</html>"
}

No markdown code blocks
No explanatory text
Each value must be a complete HTML document
All navigation links must work between pages`,
              },
              {
                role: "user",
                content: websiteGenerationPrompt,
              },
            ],
            max_tokens: 16000,
            temperature: 0.7,
          }),
        }
      );

      if (response.ok) {
        const responseData = await response.json();

        // Get the content from OpenAI response
        const content = responseData.choices?.[0]?.message?.content;

        if (!content) {
          return NextResponse.json(
            { error: "No content received from OpenAI" },
            { status: 500 }
          );
        }

        // Try to parse the JSON object from the model's response
        let generatedFiles = null;
        try {
          // Clean the content - remove any markdown code blocks if present
          const cleanContent = content
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim();

          // Try to find and parse JSON
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            generatedFiles = JSON.parse(jsonMatch[0]);
          } else {
            generatedFiles = JSON.parse(cleanContent);
          }
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);

          return NextResponse.json(
            {
              error:
                "Failed to parse generated website files from OpenAI response.",
              details:
                parseError instanceof Error
                  ? parseError.message
                  : "Unknown parse error",
              rawContent: content.substring(0, 500) + "...", // First 500 chars for debugging
            },
            { status: 500 }
          );
        }

        // Validate that we have the expected structure
        if (!generatedFiles || typeof generatedFiles !== "object") {
          return NextResponse.json(
            {
              error: "Invalid response format from OpenAI",
              details: "Expected JSON object with HTML files",
            },
            { status: 500 }
          );
        }

        // Ensure we have at least index.html
        if (!generatedFiles["index.html"]) {
          return NextResponse.json(
            {
              error: "Missing required index.html file",
              details: "Generated response must include index.html",
              availableFiles: Object.keys(generatedFiles),
            },
            { status: 500 }
          );
        }

        // Validate that each file contains HTML and does not contain forbidden tags
        for (const [filename, content] of Object.entries(generatedFiles)) {
          if (
            typeof content !== "string" ||
            !content.includes("<!DOCTYPE html>")
          ) {
            console.warn(`File ${filename} may not be valid HTML`);
          }
          if (typeof content === "string" && /<img|<svg/i.test(content)) {
            return NextResponse.json(
              {
                error: `File ${filename} contains forbidden <img> or <svg> tags. Regenerate without any images or SVGs.`,
                details: filename,
              },
              { status: 400 }
            );
          }
          if (
            typeof content === "string" &&
            !content.includes('src="https://cdn.tailwindcss.com"')
          ) {
            return NextResponse.json(
              {
                error: `File ${filename} is missing the Tailwind CDN script in the <head>.`,
                details: filename,
              },
              { status: 400 }
            );
          }
          // Section/spacing linter for index.html
          if (filename === "index.html" && typeof content === "string") {
            const sectionCount = (content.match(/<section/gi) || []).length;
            const spacingCount = (content.match(/py-16|py-20/gi) || []).length;
            if (sectionCount < 8 || spacingCount < 8) {
              return NextResponse.json(
                {
                  error: `index.html must have at least 8 <section> tags and 8 sections with py-16 or py-20 for proper spacing.`,
                  details: { sectionCount, spacingCount },
                },
                { status: 400 }
              );
            }
          }
        }

        // Save to database
        const dbEntry = await prisma.generatedWebsite.create({
          data: {
            files: generatedFiles,
            audit: {
              totalPages: Object.keys(generatedFiles).length,
              seoScore: multiPageAudit?.seoScore || 95,
              contentScore: multiPageAudit?.contentScore || 92,
              technicalScore: multiPageAudit?.technicalScore || 88,
              criticalIssuesFixed:
                multiPageAudit?.siteWideIssues?.filter(
                  (issue: any) => issue.severity === "critical"
                ).length || 0,
              highIssuesFixed:
                multiPageAudit?.siteWideIssues?.filter(
                  (issue: any) => issue.severity === "high"
                ).length || 0,
            },
          },
        });

        // If analysisId is provided, update the analysis record with the generated website info
        if (analysisId) {
          try {
            await prisma.websiteAnalysis.update({
              where: {
                id: analysisId,
                userId: context.user.id, // Ensure user owns the analysis
              },
              data: {
                generatedSiteUrl: `/generated-website?id=${dbEntry.id}`,
                generatedAt: new Date(),
              },
            });
          } catch (updateError) {
            console.error(
              "Failed to update analysis with generated website:",
              updateError
            );
            // Don't fail the entire request if this update fails
          }
        }

        return NextResponse.json({
          success: true,
          id: dbEntry.id,
          generatedFiles,
          auditSummary: dbEntry.audit,
          message: `Professional multi-page website generated successfully with ${
            Object.keys(generatedFiles).length
          } pages`,
        });
      }

      // Handle specific error cases
      if (response.status === 401) {
        console.error("OpenAI API authentication failed - check API key");
        return NextResponse.json(
          {
            error: "OpenAI API authentication failed",
            details:
              "Please check your OpenAI API key in environment variables",
            solution: "Add OPENAI_API_KEY to your .env.local file",
          },
          { status: 401 }
        );
      }

      if (response.status === 429) {
        console.error("OpenAI API rate limit exceeded");
        return NextResponse.json(
          {
            error: "OpenAI API rate limit exceeded",
            details: "Too many requests to OpenAI API",
            solution: "Please try again in a few minutes",
          },
          { status: 429 }
        );
      }

      // Try to get error details from response
      try {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        return NextResponse.json(
          {
            error: "OpenAI API request failed",
            details: errorData.error?.message || "Unknown API error",
            solution: "Please check your API key and try again",
          },
          { status: response.status }
        );
      } catch (parseError) {
        console.error("Failed to parse OpenAI error response:", parseError);
        return NextResponse.json(
          {
            error: "Failed to generate website",
            details: `OpenAI API returned status ${response.status}`,
            solution: "Please check your API key and try again",
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Website generation failed:", error);
      return NextResponse.json(
        {
          error: "Website generation failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to process website generation request" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleGenerateWebsite);
