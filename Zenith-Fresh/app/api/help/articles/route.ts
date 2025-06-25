import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Sample articles to seed the database
const sampleArticles = [
  {
    title: 'Getting Started with Zenith Platform',
    slug: 'getting-started-guide',
    content: `
      <h2>Welcome to Zenith Platform</h2>
      <p>Zenith is your comprehensive AI-powered platform for website optimization, competitive intelligence, and business growth. This guide will help you get started quickly.</p>
      
      <h3>Step 1: Create Your First Project</h3>
      <p>Projects help you organize your website analysis efforts. To create a project:</p>
      <ol>
        <li>Click on "Projects" in the sidebar</li>
        <li>Click the "Create Project" button</li>
        <li>Enter your project name and website URL</li>
        <li>Click "Create"</li>
      </ol>
      
      <h3>Step 2: Run Your First Analysis</h3>
      <p>Once you have a project, you can start analyzing your website:</p>
      <ol>
        <li>Go to the Website Analyzer tool</li>
        <li>Select your project from the dropdown</li>
        <li>Choose the type of analysis you want to run</li>
        <li>Click "Start Analysis"</li>
      </ol>
      
      <h3>Step 3: Review Your Results</h3>
      <p>After the analysis completes, you'll see comprehensive insights including:</p>
      <ul>
        <li>Performance metrics and Core Web Vitals</li>
        <li>SEO optimization recommendations</li>
        <li>Accessibility compliance checks</li>
        <li>Security and technical analysis</li>
      </ul>
      
      <h3>Next Steps</h3>
      <p>Now that you've completed your first analysis, you can:</p>
      <ul>
        <li>Set up scheduled scans to monitor changes</li>
        <li>Invite team members to collaborate</li>
        <li>Export reports for stakeholders</li>
        <li>Explore competitive intelligence features</li>
      </ul>
    `,
    summary: 'Learn how to create your first project and run website analysis on Zenith Platform',
    category: 'getting-started',
    tags: ['onboarding', 'projects', 'website-analyzer', 'beginner'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    isFeatured: true
  },
  {
    title: 'Understanding Website Analysis Results',
    slug: 'understanding-analysis-results',
    content: `
      <h2>Interpreting Your Website Analysis</h2>
      <p>Zenith provides comprehensive website analysis across multiple dimensions. Here's how to understand and act on your results.</p>
      
      <h3>Performance Metrics</h3>
      <p>Performance is crucial for user experience and SEO. Key metrics include:</p>
      <ul>
        <li><strong>Largest Contentful Paint (LCP):</strong> Should be under 2.5 seconds</li>
        <li><strong>First Input Delay (FID):</strong> Should be under 100 milliseconds</li>
        <li><strong>Cumulative Layout Shift (CLS):</strong> Should be under 0.1</li>
        <li><strong>Page Load Time:</strong> Total time to fully load the page</li>
      </ul>
      
      <h3>SEO Analysis</h3>
      <p>SEO factors that impact your search engine rankings:</p>
      <ul>
        <li>Meta titles and descriptions</li>
        <li>Header structure (H1, H2, etc.)</li>
        <li>Image alt tags</li>
        <li>Internal and external links</li>
        <li>Schema markup</li>
      </ul>
      
      <h3>Accessibility Compliance</h3>
      <p>Ensuring your website is accessible to all users:</p>
      <ul>
        <li>Color contrast ratios</li>
        <li>Keyboard navigation</li>
        <li>Screen reader compatibility</li>
        <li>ARIA labels and roles</li>
      </ul>
      
      <h3>Security Analysis</h3>
      <p>Security checks to protect your website and users:</p>
      <ul>
        <li>SSL certificate status</li>
        <li>Security headers</li>
        <li>Mixed content warnings</li>
        <li>Vulnerability scanning</li>
      </ul>
      
      <h3>Taking Action</h3>
      <p>Use the prioritized recommendations to improve your website:</p>
      <ol>
        <li>Start with critical issues that impact user experience</li>
        <li>Address high-impact, low-effort improvements first</li>
        <li>Use the detailed explanations to understand each recommendation</li>
        <li>Re-run analysis after making changes to track progress</li>
      </ol>
    `,
    summary: 'Comprehensive guide to understanding your website analysis results and recommendations',
    category: 'features',
    tags: ['analysis', 'performance', 'seo', 'accessibility', 'security'],
    difficulty: 'intermediate',
    estimatedReadTime: 8,
    isFeatured: true
  },
  {
    title: 'Setting Up Team Collaboration',
    slug: 'team-collaboration-setup',
    content: `
      <h2>Collaborating with Your Team</h2>
      <p>Zenith makes it easy to work with your team on website optimization projects. Here's how to set up and manage team collaboration.</p>
      
      <h3>Creating a Team</h3>
      <p>To create a team:</p>
      <ol>
        <li>Go to the Teams section in your dashboard</li>
        <li>Click "Create Team"</li>
        <li>Enter your team name and description</li>
        <li>Set team permissions and settings</li>
      </ol>
      
      <h3>Inviting Team Members</h3>
      <p>Add team members by:</p>
      <ol>
        <li>Clicking "Invite Members" in your team dashboard</li>
        <li>Entering email addresses of team members</li>
        <li>Selecting appropriate roles and permissions</li>
        <li>Sending invitations</li>
      </ol>
      
      <h3>Team Roles and Permissions</h3>
      <ul>
        <li><strong>Admin:</strong> Full access to all team features and settings</li>
        <li><strong>Member:</strong> Can view and edit projects, run analyses</li>
        <li><strong>Viewer:</strong> Read-only access to projects and results</li>
      </ul>
      
      <h3>Sharing Projects</h3>
      <p>Share projects with your team:</p>
      <ol>
        <li>Open the project you want to share</li>
        <li>Click the "Share" button</li>
        <li>Select team members or teams to share with</li>
        <li>Set appropriate permissions</li>
      </ol>
      
      <h3>Collaborative Features</h3>
      <ul>
        <li>Shared project dashboards</li>
        <li>Team activity feeds</li>
        <li>Collaborative report building</li>
        <li>Commenting and discussions</li>
        <li>Notification management</li>
      </ul>
    `,
    summary: 'Learn how to set up teams, invite members, and collaborate on projects',
    category: 'collaboration',
    tags: ['teams', 'collaboration', 'permissions', 'sharing'],
    difficulty: 'beginner',
    estimatedReadTime: 6,
    isFeatured: false
  },
  {
    title: 'API Authentication and Getting Started',
    slug: 'api-authentication-guide',
    content: `
      <h2>Zenith Platform API</h2>
      <p>The Zenith API allows you to integrate our website analysis capabilities into your own applications and workflows.</p>
      
      <h3>Authentication</h3>
      <p>All API requests require authentication using API keys:</p>
      <ol>
        <li>Go to Settings > API Keys</li>
        <li>Click "Generate New API Key"</li>
        <li>Give your key a descriptive name</li>
        <li>Set appropriate scopes and permissions</li>
        <li>Copy and securely store your API key</li>
      </ol>
      
      <h3>Making Your First Request</h3>
      <pre><code>
curl -X GET "https://api.zenith.engineer/v1/projects" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"
      </code></pre>
      
      <h3>Available Endpoints</h3>
      <ul>
        <li><code>GET /v1/projects</code> - List all projects</li>
        <li><code>POST /v1/projects</code> - Create a new project</li>
        <li><code>POST /v1/analyses</code> - Start a website analysis</li>
        <li><code>GET /v1/analyses/{id}</code> - Get analysis results</li>
        <li><code>GET /v1/reports/{id}</code> - Download reports</li>
      </ul>
      
      <h3>Rate Limits</h3>
      <p>API rate limits depend on your subscription plan:</p>
      <ul>
        <li>Free: 100 requests per hour</li>
        <li>Pro: 1,000 requests per hour</li>
        <li>Enterprise: 10,000 requests per hour</li>
      </ul>
      
      <h3>Webhooks</h3>
      <p>Set up webhooks to receive notifications when analyses complete:</p>
      <ol>
        <li>Configure webhook URLs in your project settings</li>
        <li>Choose which events to receive</li>
        <li>Implement webhook handlers in your application</li>
      </ol>
      
      <h3>SDKs and Libraries</h3>
      <p>Official SDKs are available for:</p>
      <ul>
        <li>JavaScript/Node.js</li>
        <li>Python</li>
        <li>PHP</li>
        <li>Ruby</li>
      </ul>
    `,
    summary: 'Complete guide to authenticating and using the Zenith Platform API',
    category: 'api',
    tags: ['api', 'authentication', 'developers', 'integration'],
    difficulty: 'advanced',
    estimatedReadTime: 10,
    isFeatured: false
  },
  {
    title: 'Troubleshooting Common Issues',
    slug: 'troubleshooting-common-issues',
    content: `
      <h2>Common Issues and Solutions</h2>
      <p>Here are solutions to the most common issues users encounter on Zenith Platform.</p>
      
      <h3>Analysis Not Starting</h3>
      <p>If your website analysis isn't starting:</p>
      <ul>
        <li>Check that the URL is accessible and returns a 200 status</li>
        <li>Verify the URL doesn't require authentication</li>
        <li>Ensure the website isn't blocking our analysis tools</li>
        <li>Try using the HTTP version if HTTPS fails</li>
      </ul>
      
      <h3>Analysis Taking Too Long</h3>
      <p>If analysis seems stuck:</p>
      <ul>
        <li>Large websites can take 5-10 minutes to analyze</li>
        <li>Check your browser's developer console for errors</li>
        <li>Refresh the page to see if results have loaded</li>
        <li>Contact support if analysis exceeds 15 minutes</li>
      </ul>
      
      <h3>Incomplete Results</h3>
      <p>If some analysis sections are missing:</p>
      <ul>
        <li>Some checks may fail for protected or private content</li>
        <li>JavaScript-heavy sites may need additional time</li>
        <li>Check if the website has anti-bot protection</li>
        <li>Try running the analysis again</li>
      </ul>
      
      <h3>Login Issues</h3>
      <p>If you can't log in:</p>
      <ul>
        <li>Check your email and password are correct</li>
        <li>Try resetting your password</li>
        <li>Clear your browser cache and cookies</li>
        <li>Try logging in from an incognito/private window</li>
      </ul>
      
      <h3>Team Invitation Problems</h3>
      <p>If team invitations aren't working:</p>
      <ul>
        <li>Check the invited email address is correct</li>
        <li>Ask the invitee to check their spam folder</li>
        <li>Ensure the invitation hasn't expired (7 days)</li>
        <li>Try resending the invitation</li>
      </ul>
      
      <h3>Performance Issues</h3>
      <p>If the platform is running slowly:</p>
      <ul>
        <li>Check your internet connection</li>
        <li>Try refreshing the page</li>
        <li>Clear your browser cache</li>
        <li>Try using a different browser</li>
        <li>Check our status page for any known issues</li>
      </ul>
      
      <h3>Getting Additional Help</h3>
      <p>If these solutions don't help:</p>
      <ul>
        <li>Contact our support team through the help widget</li>
        <li>Include details about your browser and operating system</li>
        <li>Provide steps to reproduce the issue</li>
        <li>Include any error messages you see</li>
      </ul>
    `,
    summary: 'Solutions to the most common issues and problems users encounter',
    category: 'troubleshooting',
    tags: ['troubleshooting', 'issues', 'problems', 'solutions', 'support'],
    difficulty: 'beginner',
    estimatedReadTime: 7,
    isFeatured: true
  },
  {
    title: 'Understanding Your Billing and Subscription',
    slug: 'billing-and-subscription-guide',
    content: `
      <h2>Billing and Subscription Management</h2>
      <p>Everything you need to know about managing your Zenith Platform subscription and billing.</p>
      
      <h3>Subscription Plans</h3>
      <p>Zenith offers several subscription tiers:</p>
      <ul>
        <li><strong>Free:</strong> 5 analyses per month, basic features</li>
        <li><strong>Starter:</strong> 50 analyses per month, advanced reporting</li>
        <li><strong>Professional:</strong> 200 analyses per month, team collaboration</li>
        <li><strong>Business:</strong> 500 analyses per month, API access</li>
        <li><strong>Enterprise:</strong> Unlimited analyses, custom features</li>
      </ul>
      
      <h3>Upgrading Your Plan</h3>
      <p>To upgrade your subscription:</p>
      <ol>
        <li>Go to Settings > Billing</li>
        <li>Click "Upgrade Plan"</li>
        <li>Select your desired plan</li>
        <li>Enter payment information</li>
        <li>Confirm the upgrade</li>
      </ol>
      
      <h3>Payment Methods</h3>
      <p>We accept:</p>
      <ul>
        <li>Credit cards (Visa, MasterCard, American Express)</li>
        <li>Debit cards</li>
        <li>PayPal (for annual subscriptions)</li>
        <li>Bank transfers (Enterprise plans only)</li>
      </ul>
      
      <h3>Billing Cycles</h3>
      <p>Choose between monthly or annual billing:</p>
      <ul>
        <li>Monthly billing: Charged every month</li>
        <li>Annual billing: Charged once per year (20% discount)</li>
        <li>Enterprise: Custom billing terms available</li>
      </ul>
      
      <h3>Usage Tracking</h3>
      <p>Monitor your usage:</p>
      <ul>
        <li>View current month's analysis count</li>
        <li>See historical usage patterns</li>
        <li>Get notified when approaching limits</li>
        <li>Understand what counts as an analysis</li>
      </ul>
      
      <h3>Invoices and Receipts</h3>
      <p>Access your billing documents:</p>
      <ul>
        <li>Download invoices from the billing page</li>
        <li>Set up automatic email receipts</li>
        <li>Update billing contact information</li>
        <li>Add VAT or tax information</li>
      </ul>
      
      <h3>Cancellation and Refunds</h3>
      <p>If you need to cancel:</p>
      <ul>
        <li>Cancel anytime from your billing settings</li>
        <li>Continue using paid features until period ends</li>
        <li>Data remains accessible for 30 days after cancellation</li>
        <li>Refunds available within 14 days of initial purchase</li>
      </ul>
      
      <h3>Enterprise Billing</h3>
      <p>Enterprise customers get:</p>
      <ul>
        <li>Custom billing terms and NET payment options</li>
        <li>Volume discounts for large teams</li>
        <li>Purchase order support</li>
        <li>Dedicated account management</li>
      </ul>
    `,
    summary: 'Complete guide to managing your subscription, billing, and payment methods',
    category: 'billing',
    tags: ['billing', 'subscription', 'payment', 'pricing', 'invoices'],
    difficulty: 'beginner',
    estimatedReadTime: 8,
    isFeatured: false
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Check if we need to seed the database
    const articleCount = await prisma.helpArticle.count();
    if (articleCount === 0) {
      await seedArticles();
    }

    const where: any = {
      isPublished: true
    };

    if (category) {
      where.category = category;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    const articles = await prisma.helpArticle.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { helpfulVotes: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return NextResponse.json({ articles });

  } catch (error) {
    console.error('Error fetching help articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch help articles' },
      { status: 500 }
    );
  }
}

async function seedArticles() {
  console.log('Seeding help articles...');
  
  for (const articleData of sampleArticles) {
    try {
      await prisma.helpArticle.create({
        data: {
          title: articleData.title,
          slug: articleData.slug,
          content: articleData.content,
          summary: articleData.summary,
          category: articleData.category,
          tags: articleData.tags,
          difficulty: articleData.difficulty,
          estimatedReadTime: articleData.estimatedReadTime,
          isFeatured: articleData.isFeatured,
          isPublished: true,
          viewCount: Math.floor(Math.random() * 1000) + 100, // Random view count for demo
          helpfulVotes: Math.floor(Math.random() * 50) + 10, // Random votes for demo
          unhelpfulVotes: Math.floor(Math.random() * 10) + 1,
          publishedAt: new Date()
        }
      });
    } catch (error) {
      console.error(`Error seeding article ${articleData.title}:`, error);
    }
  }
  
  console.log('Help articles seeded successfully');
}