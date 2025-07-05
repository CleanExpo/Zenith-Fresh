import { Resend } from 'resend';

// Lazy initialization of Resend client to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not configured');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  delayDays: number;
  trigger: string;
  segment?: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  templates: EmailTemplate[];
  isActive: boolean;
  segments: string[];
}

// Email templates for onboarding sequence
export const ONBOARDING_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome & Health Report',
    subject: '🎉 Your Website Health Report is Ready!',
    content: `
      <h1>Welcome to Zenith!</h1>
      <p>Thanks for analyzing your website with us. Here's a quick summary of your results:</p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2>Your Website Score: {{overall_score}}/100</h2>
        <p>{{score_interpretation}}</p>
      </div>
      <h3>Quick Wins to Improve Your Score:</h3>
      <ul>
        {{#quick_wins}}
        <li>{{.}}</li>
        {{/quick_wins}}
      </ul>
      <a href="{{dashboard_url}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
        View Full Report
      </a>
    `,
    delayDays: 0,
    trigger: 'website_analyzed'
  },
  {
    id: 'day3_tips',
    name: 'Day 3: SEO Tips',
    subject: '3 SEO Tips to Boost Your Website Traffic',
    content: `
      <h1>Ready to improve your SEO?</h1>
      <p>Hi {{first_name}},</p>
      <p>It's been 3 days since you analyzed {{website}}. Here are 3 actionable SEO tips you can implement today:</p>
      
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>💡 Tip #1: Optimize Your Title Tags</h3>
        <p>Make sure each page has a unique, descriptive title under 60 characters.</p>
      </div>
      
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>📝 Tip #2: Add Meta Descriptions</h3>
        <p>Write compelling 150-160 character descriptions for each page.</p>
      </div>
      
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>🏃‍♂️ Tip #3: Improve Page Speed</h3>
        <p>Compress images and enable browser caching for faster load times.</p>
      </div>
      
      <a href="{{dashboard_url}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
        Track Your Progress
      </a>
    `,
    delayDays: 3,
    trigger: 'website_analyzed'
  },
  {
    id: 'day7_competitor',
    name: 'Day 7: Competitor Analysis Tease',
    subject: 'See How You Stack Up Against Competitors 👀',
    content: `
      <h1>Curious about your competition?</h1>
      <p>Hi {{first_name}},</p>
      <p>You've been working on improving {{website}} for a week now. Want to see how you compare to your competitors?</p>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center;">
        <h2>🏆 Competitor Analysis Available</h2>
        <p>Discover:</p>
        <ul style="text-align: left; margin: 20px 0;">
          <li>How your SEO compares to top competitors</li>
          <li>Keywords they're ranking for that you're not</li>
          <li>Their traffic and engagement metrics</li>
          <li>Opportunities to outrank them</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="{{upgrade_url}}" style="background: #fbbf24; color: #1f2937; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0;">
          Unlock Competitor Analysis
        </a>
      </p>
      
      <p><small>Limited time: 50% off your first month!</small></p>
    `,
    delayDays: 7,
    trigger: 'website_analyzed',
    segment: 'free_users'
  },
  {
    id: 'day14_case_study',
    name: 'Day 14: Success Story',
    subject: 'How Sarah Increased Her Traffic by 150% 📈',
    content: `
      <h1>Real Results from Real Users</h1>
      <p>Hi {{first_name}},</p>
      <p>I wanted to share an inspiring success story from one of our users:</p>
      
      <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0;">
        <blockquote style="font-style: italic; margin: 0;">
          "Zenith's analysis revealed critical SEO issues we didn't know existed. Our organic traffic increased 150% in 3 months!"
        </blockquote>
        <p style="margin: 10px 0 0 0;"><strong>- Sarah Chen, Marketing Director at TechStart Inc.</strong></p>
      </div>
      
      <h3>What Sarah did:</h3>
      <ol>
        <li>Fixed her website's technical SEO issues</li>
        <li>Optimized content based on competitor gaps</li>
        <li>Monitored progress with weekly reports</li>
        <li>Implemented our automated recommendations</li>
      </ol>
      
      <p>You can achieve similar results! Your website {{website}} has great potential.</p>
      
      <p style="text-align: center;">
        <a href="{{dashboard_url}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Start Optimizing Today
        </a>
      </p>
    `,
    delayDays: 14,
    trigger: 'website_analyzed'
  },
  {
    id: 'day21_upgrade',
    name: 'Day 21: Final Upgrade Push',
    subject: 'Last Chance: Your Website Optimization Discount Expires Tomorrow',
    content: `
      <h1>Don't Miss Out!</h1>
      <p>Hi {{first_name}},</p>
      <p>Your 50% discount for premium website optimization expires in 24 hours.</p>
      
      <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <h2 style="color: #dc2626; margin: 0 0 10px 0;">⏰ Offer Expires Tomorrow</h2>
        <p style="font-size: 18px; margin: 0;">Save 50% on your first month</p>
      </div>
      
      <p>Since analyzing {{website}}, you could have:</p>
      <ul>
        <li>✅ Identified all competitor keyword opportunities</li>
        <li>✅ Received automated weekly optimization reports</li>
        <li>✅ Tracked your improvement progress</li>
        <li>✅ Got priority support for technical issues</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="{{upgrade_url}}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0;">
          Claim 50% Discount Now
        </a>
      </p>
      
      <p><small>This offer won't be available again. Upgrade now or continue with free basic reports.</small></p>
    `,
    delayDays: 21,
    trigger: 'website_analyzed',
    segment: 'free_users'
  }
];

// Behavioral trigger templates
export const BEHAVIORAL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'milestone_achieved',
    name: 'Milestone Achievement',
    subject: '🎉 Congratulations! You improved your website score!',
    content: `
      <h1>Amazing Progress!</h1>
      <p>Hi {{first_name}},</p>
      <p>Great news! Your website {{website}} just achieved a new milestone:</p>
      
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center;">
        <h2>🏆 Score Improved to {{new_score}}/100</h2>
        <p>That's a {{score_improvement}} point increase!</p>
      </div>
      
      <p>You're on the right track! Keep up the momentum with these next steps:</p>
      <ul>
        {{#next_recommendations}}
        <li>{{.}}</li>
        {{/next_recommendations}}
      </ul>
      
      <p style="text-align: center;">
        <a href="{{dashboard_url}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          View Detailed Progress
        </a>
      </p>
    `,
    delayDays: 0,
    trigger: 'score_improved'
  },
  {
    id: 'inactive_user',
    name: 'Re-engagement',
    subject: 'Your website is missing optimization opportunities',
    content: `
      <h1>We miss you!</h1>
      <p>Hi {{first_name}},</p>
      <p>It's been {{days_inactive}} days since you last checked your website optimization progress.</p>
      
      <p>While you've been away, your competitors might be:</p>
      <ul>
        <li>🔍 Stealing your search rankings</li>
        <li>📈 Improving their site speed</li>
        <li>💰 Converting your potential customers</li>
        <li>📱 Optimizing for mobile users</li>
      </ul>
      
      <p>Don't let them get ahead! Come back and see what needs attention on {{website}}.</p>
      
      <p style="text-align: center;">
        <a href="{{dashboard_url}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Check Your Website Now
        </a>
      </p>
      
      <p><small>Quick wins are waiting for you - it only takes 5 minutes!</small></p>
    `,
    delayDays: 0,
    trigger: 'user_inactive_7_days'
  }
];

export class EmailAutomation {
  constructor(private resendApiKey: string) {}

  async sendEmail(
    to: string,
    template: EmailTemplate,
    variables: Record<string, any>
  ): Promise<boolean> {
    try {
      // Replace template variables
      let subject = template.subject;
      let content = template.content;

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        content = content.replace(regex, value);
      });

      // Handle arrays in templates (Handlebars-style)
      content = content.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, arrayKey, itemTemplate) => {
        const array = variables[arrayKey];
        if (Array.isArray(array)) {
          return array.map(item => itemTemplate.replace(/{{\.}}/g, item)).join('');
        }
        return '';
      });

      const resendClient = getResendClient();
      await resendClient.emails.send({
        from: 'Zenith <noreply@zenith.engineer>',
        to,
        subject,
        html: content,
      });

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async scheduleEmail(
    userId: string,
    templateId: string,
    variables: Record<string, any>,
    delayDays: number
  ): Promise<void> {
    // In production, this would integrate with a job queue like Bull or AWS SQS
    // For now, we'll simulate with setTimeout (not recommended for production)
    
    const template = [...ONBOARDING_TEMPLATES, ...BEHAVIORAL_TEMPLATES]
      .find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Schedule the email (in production, use a proper job queue)
    setTimeout(async () => {
      const user = await this.getUserEmail(userId);
      if (user) {
        await this.sendEmail(user.email, template, variables);
      }
    }, delayDays * 24 * 60 * 60 * 1000);
  }

  private async getUserEmail(userId: string): Promise<{ email: string } | null> {
    // In production, fetch from database
    // This is a placeholder
    return { email: 'user@example.com' };
  }

  async triggerOnboardingSequence(
    userId: string,
    userEmail: string,
    website: string,
    healthScore: number
  ): Promise<void> {
    const variables = {
      first_name: userEmail.split('@')[0], // Simple extraction
      website,
      overall_score: healthScore,
      score_interpretation: this.getScoreInterpretation(healthScore),
      quick_wins: this.getQuickWins(healthScore),
      dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      upgrade_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
    };

    // Schedule all onboarding emails
    for (const template of ONBOARDING_TEMPLATES) {
      // Check if template applies to user segment
      if (template.segment === 'free_users') {
        // In production, check user's actual plan
        await this.scheduleEmail(userId, template.id, variables, template.delayDays);
      } else if (!template.segment) {
        // Templates without segment apply to all users
        await this.scheduleEmail(userId, template.id, variables, template.delayDays);
      }
    }
  }

  private getScoreInterpretation(score: number): string {
    if (score >= 90) return "Excellent! Your website is performing exceptionally well.";
    if (score >= 80) return "Great job! Your website has a strong foundation with minor areas for improvement.";
    if (score >= 70) return "Good work! There are several opportunities to enhance your performance.";
    if (score >= 60) return "Your website has potential! Let's work on some key improvements.";
    return "Significant opportunities for improvement! Let's get your website optimized.";
  }

  private getQuickWins(score: number): string[] {
    const allWins = [
      "Add meta descriptions to all pages",
      "Optimize image file sizes",
      "Enable browser caching",
      "Fix broken internal links",
      "Improve mobile responsiveness",
      "Update page titles for SEO",
      "Add alt text to images",
      "Implement structured data"
    ];

    // Return 3-4 random quick wins based on score
    const numWins = score > 70 ? 3 : 4;
    return allWins.slice(0, numWins);
  }

  async trackEmailEngagement(
    userId: string,
    templateId: string,
    action: 'opened' | 'clicked' | 'unsubscribed'
  ): Promise<void> {
    // Track engagement metrics for optimization
    // In production, store in analytics database
    console.log(`User ${userId} ${action} email ${templateId}`);
  }
}

export const emailAutomation = new EmailAutomation(process.env.RESEND_API_KEY || '');
