// src/lib/agents/review-campaign-agent.ts
import { z } from 'zod';

// Interface definitions for the ReviewCampaignAgent
export interface ReviewCampaignAgent {
  id: string;
  name: 'ReviewCampaignAgent';
  capabilities: string[];
  tools: ReviewCampaignTools;
  triggers: ReviewCampaignTriggers;
  workflows: ReviewCampaignWorkflows;
}

export interface ReviewCampaignTools {
  emailService: {
    sendPersonalizedReviewRequest: (params: ReviewRequestParams) => Promise<void>;
    trackEmailStatus: (emailId: string) => Promise<EmailStatus>;
  };
  mediaAgentIntegration: {
    requestTestimonialGraphic: (params: TestimonialGraphicParams) => Promise<string>;
    getGraphicStatus: (taskId: string) => Promise<GraphicStatus>;
  };
  socialMediaAgentIntegration: {
    createSocialProofCampaign: (params: SocialProofParams) => Promise<string>;
    scheduleTestimonialPosts: (params: TestimonialPostParams) => Promise<void>;
  };
  zenithHealthScore: {
    getUserScore: (userId: string) => Promise<number>;
    getScoreHistory: (userId: string) => Promise<ScoreHistory[]>;
    detectMilestones: (userId: string) => Promise<Milestone[]>;
  };
}

export interface ReviewCampaignTriggers {
  freeUserTrigger: {
    condition: 'website_health_check_completed';
    threshold: 70; // Score above 70
    cooldown: '30_days'; // Prevent spam
  };
  paidClientTrigger: {
    conditions: [
      'health_score_increase_10_points',
      'major_project_completion',
      'service_duration_90_days'
    ];
    cooldown: '60_days';
  };
}

// Zod schemas for validation
export const ReviewRequestSchema = z.object({
  userId: z.string(),
  userEmail: z.string().email(),
  userName: z.string(),
  triggerType: z.enum(['FREE_USER', 'PAID_CLIENT']),
  contextData: z.object({
    healthScore: z.number().optional(),
    milestone: z.string().optional(),
    serviceDuration: z.number().optional(),
  }),
});

export const TestimonialExtractionSchema = z.object({
  reviewId: z.string(),
  reviewText: z.string(),
  rating: z.number().min(1).max(5),
  authorName: z.string(),
  authorTitle: z.string().optional(),
  authorCompany: z.string().optional(),
});

export const TestimonialGraphicSchema = z.object({
  quote: z.string(),
  authorName: z.string(),
  authorTitle: z.string(),
  designStyle: z.enum(['futuristic', 'professional', 'modern', 'minimalist']),
  brandColors: z.array(z.string()),
});

// Type definitions
export type ReviewRequestParams = z.infer<typeof ReviewRequestSchema>;
export type TestimonialExtraction = z.infer<typeof TestimonialExtractionSchema>;
export type TestimonialGraphicParams = z.infer<typeof TestimonialGraphicSchema>;

export interface EmailStatus {
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  timestamp: Date;
}

export interface GraphicStatus {
  status: 'pending' | 'generating' | 'completed' | 'failed';
  imageUrl?: string;
  taskId: string;
}

export interface SocialProofParams {
  testimonialGraphicUrl: string;
  quote: string;
  authorName: string;
  authorCompany?: string;
  platforms: string[];
}

export interface TestimonialPostParams {
  platforms: ('twitter' | 'linkedin' | 'instagram')[];
  content: string;
  imageUrl: string;
  scheduledTime?: Date;
}

export interface ScoreHistory {
  score: number;
  date: Date;
  category: string;
}

export interface Milestone {
  type: 'score_increase' | 'project_completion' | 'service_anniversary';
  description: string;
  achievedAt: Date;
  significance: 'minor' | 'major' | 'critical';
}

export interface ReviewCampaignWorkflows {
  personalizedRequestWorkflow: PersonalizedRequestWorkflow;
  reviewTransformationWorkflow: ReviewTransformationWorkflow;
  socialAmplificationWorkflow: SocialAmplificationWorkflow;
  websiteEnhancementWorkflow: WebsiteEnhancementWorkflow;
}

export interface PersonalizedRequestWorkflow {
  steps: [
    'analyze_user_context',
    'generate_personalized_email',
    'send_review_request',
    'track_engagement',
    'follow_up_if_needed'
  ];
  templates: {
    freeUserTemplate: string;
    paidClientTemplate: string;
    followUpTemplate: string;
  };
}

export interface ReviewTransformationWorkflow {
  steps: [
    'monitor_review_submissions',
    'filter_positive_reviews',
    'extract_impactful_quotes',
    'request_testimonial_graphic',
    'validate_graphic_quality',
    'store_marketing_asset'
  ];
  qualityThresholds: {
    minimumRating: 4;
    minimumTextLength: 50;
    sentimentScore: 0.7;
  };
}

export interface SocialAmplificationWorkflow {
  steps: [
    'receive_testimonial_graphic',
    'generate_platform_specific_content',
    'submit_to_approval_center',
    'schedule_approved_posts',
    'track_engagement_metrics',
    'optimize_future_campaigns'
  ];
  platformStrategies: {
    twitter: { maxChars: 280; hashtagStrategy: string; postingTime: string };
    linkedin: { targetAudience: string; contentStyle: string; postingTime: string };
    instagram: { aspectRatio: string; storyStrategy: string; postingTime: string };
  };
}

export interface WebsiteEnhancementWorkflow {
  steps: [
    'analyze_review_themes',
    'identify_faq_opportunities',
    'generate_testimonial_widgets',
    'update_landing_page_content',
    'create_case_study_content',
    'implement_social_proof_elements'
  ];
  automationRules: {
    faqThreshold: 3; // Reviews mentioning same theme
    testimonialRotation: 'weekly';
    landingPageUpdates: 'monthly';
  };
}

// Implementation class
export class ReviewCampaignAgentImpl implements ReviewCampaignAgent {
  id = 'review-campaign-agent-001';
  name = 'ReviewCampaignAgent' as const;
  
  capabilities = [
    'Automated review request generation',
    'Personalized email campaigns',
    'Review sentiment analysis',
    'Testimonial graphic creation',
    'Social media campaign orchestration',
    'Website content enhancement',
    'Growth loop optimization',
    'Customer journey mapping'
  ];

  tools: ReviewCampaignTools;
  triggers: ReviewCampaignTriggers;
  workflows: ReviewCampaignWorkflows;

  constructor() {
    this.tools = this.initializeTools();
    this.triggers = this.initializeTriggers();
    this.workflows = this.initializeWorkflows();
  }

  private initializeTools(): ReviewCampaignTools {
    return {
      emailService: {
        sendPersonalizedReviewRequest: async (params: ReviewRequestParams) => {
          // Implementation for sending personalized review requests
          console.log(`Sending review request to ${params.userEmail}`);
        },
        trackEmailStatus: async (emailId: string) => {
          // Implementation for tracking email engagement
          return {
            delivered: true,
            opened: false,
            clicked: false,
            timestamp: new Date()
          };
        }
      },
      mediaAgentIntegration: {
        requestTestimonialGraphic: async (params: TestimonialGraphicParams) => {
          // Integration with MediaAgent for graphic generation
          return 'testimonial-task-001';
        },
        getGraphicStatus: async (taskId: string) => {
          return {
            status: 'completed' as const,
            imageUrl: '/testimonials/graphic-001.jpg',
            taskId
          };
        }
      },
      socialMediaAgentIntegration: {
        createSocialProofCampaign: async (params: SocialProofParams) => {
          // Integration with SocialMediaAgent
          return 'social-campaign-001';
        },
        scheduleTestimonialPosts: async (params: TestimonialPostParams) => {
          // Schedule posts across platforms
          console.log(`Scheduling posts for platforms: ${params.platforms.join(', ')}`);
        }
      },
      zenithHealthScore: {
        getUserScore: async (userId: string) => {
          // Get current Zenith Health Score
          return 85;
        },
        getScoreHistory: async (userId: string) => {
          return [
            { score: 75, date: new Date('2024-01-01'), category: 'SEO' },
            { score: 85, date: new Date('2024-02-01'), category: 'Overall' }
          ];
        },
        detectMilestones: async (userId: string) => {
          return [
            {
              type: 'score_increase',
              description: 'Health Score increased by 10 points',
              achievedAt: new Date(),
              significance: 'major'
            }
          ];
        }
      }
    };
  }

  private initializeTriggers(): ReviewCampaignTriggers {
    return {
      freeUserTrigger: {
        condition: 'website_health_check_completed',
        threshold: 70,
        cooldown: '30_days'
      },
      paidClientTrigger: {
        conditions: [
          'health_score_increase_10_points',
          'major_project_completion',
          'service_duration_90_days'
        ],
        cooldown: '60_days'
      }
    };
  }

  private initializeWorkflows(): ReviewCampaignWorkflows {
    return {
      personalizedRequestWorkflow: {
        steps: [
          'analyze_user_context',
          'generate_personalized_email',
          'send_review_request',
          'track_engagement',
          'follow_up_if_needed'
        ],
        templates: {
          freeUserTemplate: `Hi {userName}, we're thrilled your website scored {healthScore} on its health check! If you found this free tool valuable, would you consider leaving a quick review of your experience? It helps us improve and reach more people. {reviewLink}`,
          paidClientTemplate: `Hi {userName}, congratulations on {milestone}! We've loved being part of your journey. To help other businesses find their way, would you be open to sharing your experience with Zenith? {reviewLink}`,
          followUpTemplate: `Hi {userName}, we hope you're still enjoying the benefits of {service}. If you have a moment, we'd greatly appreciate your feedback to help other businesses discover Zenith. {reviewLink}`
        }
      },
      reviewTransformationWorkflow: {
        steps: [
          'monitor_review_submissions',
          'filter_positive_reviews',
          'extract_impactful_quotes',
          'request_testimonial_graphic',
          'validate_graphic_quality',
          'store_marketing_asset'
        ],
        qualityThresholds: {
          minimumRating: 4,
          minimumTextLength: 50,
          sentimentScore: 0.7
        }
      },
      socialAmplificationWorkflow: {
        steps: [
          'receive_testimonial_graphic',
          'generate_platform_specific_content',
          'submit_to_approval_center',
          'schedule_approved_posts',
          'track_engagement_metrics',
          'optimize_future_campaigns'
        ],
        platformStrategies: {
          twitter: {
            maxChars: 280,
            hashtagStrategy: '#ZenithSuccess #DigitalTransformation #AIAgents',
            postingTime: '9:00 AM EST'
          },
          linkedin: {
            targetAudience: 'Business owners and digital marketers',
            contentStyle: 'Professional and results-focused',
            postingTime: '8:00 AM EST'
          },
          instagram: {
            aspectRatio: '1:1 square format',
            storyStrategy: 'Behind-the-scenes customer success',
            postingTime: '6:00 PM EST'
          }
        }
      },
      websiteEnhancementWorkflow: {
        steps: [
          'analyze_review_themes',
          'identify_faq_opportunities',
          'generate_testimonial_widgets',
          'update_landing_page_content',
          'create_case_study_content',
          'implement_social_proof_elements'
        ],
        automationRules: {
          faqThreshold: 3,
          testimonialRotation: 'weekly',
          landingPageUpdates: 'monthly'
        }
      }
    };
  }

  // Core agent methods
  async executePersonalizedRequest(params: ReviewRequestParams): Promise<void> {
    const validation = ReviewRequestSchema.safeParse(params);
    if (!validation.success) {
      throw new Error(`Invalid request parameters: ${validation.error.message}`);
    }

    const { userId, userEmail, userName, triggerType, contextData } = validation.data;

    // Step 1: Analyze user context
    const userScore = await this.tools.zenithHealthScore.getUserScore(userId);
    const milestones = await this.tools.zenithHealthScore.detectMilestones(userId);

    // Step 2: Generate personalized email
    const template = triggerType === 'FREE_USER' 
      ? this.workflows.personalizedRequestWorkflow.templates.freeUserTemplate
      : this.workflows.personalizedRequestWorkflow.templates.paidClientTemplate;

    const personalizedEmail = template
      .replace('{userName}', userName)
      .replace('{healthScore}', userScore.toString())
      .replace('{milestone}', milestones[0]?.description || 'your success with Zenith')
      .replace('{reviewLink}', `https://zenith.engineer/review?user=${userId}`);

    // Step 3: Send review request
    await this.tools.emailService.sendPersonalizedReviewRequest({
      userId,
      userEmail,
      userName,
      triggerType,
      contextData: { ...contextData, healthScore: userScore }
    });

    console.log(`✅ Review campaign initiated for ${userName} (${triggerType})`);
  }

  async processNewReview(reviewData: TestimonialExtraction): Promise<void> {
    const validation = TestimonialExtractionSchema.safeParse(reviewData);
    if (!validation.success) {
      throw new Error(`Invalid review data: ${validation.error.message}`);
    }

    const { reviewText, rating, authorName, authorTitle } = validation.data;

    // Filter positive reviews only
    if (rating < this.workflows.reviewTransformationWorkflow.qualityThresholds.minimumRating) {
      console.log(`⚠️ Review rating ${rating} below threshold, skipping transformation`);
      return;
    }

    // Extract impactful quote (simplified - would use NLP in production)
    const sentences = reviewText.split('.').filter(s => s.trim().length > 20);
    const impactfulQuote = sentences[0]?.trim() + '.';

    if (!impactfulQuote || impactfulQuote.length < this.workflows.reviewTransformationWorkflow.qualityThresholds.minimumTextLength) {
      console.log(`⚠️ Quote too short, skipping transformation`);
      return;
    }

    // Request testimonial graphic from MediaAgent
    const graphicParams: TestimonialGraphicParams = {
      quote: impactfulQuote,
      authorName,
      authorTitle: authorTitle || 'Satisfied Customer',
      designStyle: 'futuristic',
      brandColors: ['#3B82F6', '#8B5CF6', '#06B6D4'] // Blue, Purple, Cyan
    };

    const taskId = await this.tools.mediaAgentIntegration.requestTestimonialGraphic(graphicParams);
    
    // Monitor graphic creation
    const graphicStatus = await this.tools.mediaAgentIntegration.getGraphicStatus(taskId);
    
    if (graphicStatus.status === 'completed' && graphicStatus.imageUrl) {
      // Create social proof campaign
      await this.tools.socialMediaAgentIntegration.createSocialProofCampaign({
        testimonialGraphicUrl: graphicStatus.imageUrl,
        quote: impactfulQuote,
        authorName,
        authorCompany: reviewData.authorCompany,
        platforms: ['twitter', 'linkedin', 'instagram']
      });

      console.log(`✅ Testimonial transformed and social campaign created for "${impactfulQuote.substring(0, 50)}..."`);
    }
  }

  async executeGrowthLoop(): Promise<void> {
    console.log('🔄 Executing autonomous growth loop...');
    
    // This method would be called periodically to:
    // 1. Monitor for trigger conditions
    // 2. Process new reviews
    // 3. Update website content
    // 4. Optimize campaigns based on performance
    
    console.log('✅ Growth loop execution complete');
  }
}

// Export singleton instance
export const reviewCampaignAgent = new ReviewCampaignAgentImpl();
