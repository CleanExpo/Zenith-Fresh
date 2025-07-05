/**
 * Email Node Executor
 * Handles email sending within workflows
 */

import { NodeExecutor, WorkflowNode, ExecutionContext, NodeMetadata } from '../workflow-engine';
import { logger } from '@/lib/monitoring/enhanced-sentry';
import { Resend } from 'resend';

interface EmailConfig {
  to: string | string[];
  from?: string;
  subject: string;
  content: string;
  contentType?: 'text' | 'html';
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export class EmailExecutor implements NodeExecutor {
  private resend: Resend | null = null;

  constructor() {
    // Lazy initialization - resend client created when needed
  }

  private getResendClient(): Resend {
    if (!this.resend) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error('RESEND_API_KEY environment variable is not configured');
      }
      this.resend = new Resend(apiKey);
    }
    return this.resend;
  }

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    try {
      const config = node.config as EmailConfig;
      
      logger.info('Email node executed', {
        nodeId: node.id,
        executionId: context.executionId,
        to: Array.isArray(config.to) ? config.to.length : 1
      });

      const result = await this.sendEmail(config, context);

      return {
        success: true,
        messageId: result.id,
        recipients: config.to,
        subject: config.subject,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Email execution failed', {
        nodeId: node.id,
        executionId: context.executionId,
        error: error.message
      });
      throw error;
    }
  }

  private async sendEmail(config: EmailConfig, context: ExecutionContext): Promise<any> {
    const to = this.interpolateRecipients(config.to, context);
    const from = this.interpolateString(config.from || 'noreply@zenith.engineer', context);
    const subject = this.interpolateString(config.subject, context);
    const content = this.interpolateString(config.content, context);

    const emailData: any = {
      from,
      to,
      subject
    };

    // Set content based on type
    if (config.contentType === 'html') {
      emailData.html = content;
    } else {
      emailData.text = content;
    }

    // Add CC and BCC if specified
    if (config.cc) {
      emailData.cc = this.interpolateRecipients(config.cc, context);
    }

    if (config.bcc) {
      emailData.bcc = this.interpolateRecipients(config.bcc, context);
    }

    // Add attachments if specified
    if (config.attachments && config.attachments.length > 0) {
      emailData.attachments = config.attachments.map(attachment => ({
        filename: this.interpolateString(attachment.filename, context),
        content: attachment.content,
        content_type: attachment.contentType
      }));
    }

    try {
      const resendClient = this.getResendClient();
      const result = await resendClient.emails.send(emailData);
      return result.data;
    } catch (error) {
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private interpolateString(template: string, context: ExecutionContext): string {
    if (typeof template !== 'string') return String(template);
    
    let result = template;
    const variables = { ...context.variables, ...context.nodeOutputs };
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  private interpolateRecipients(
    recipients: string | string[],
    context: ExecutionContext
  ): string | string[] {
    if (Array.isArray(recipients)) {
      return recipients.map(recipient => this.interpolateString(recipient, context));
    } else {
      return this.interpolateString(recipients, context);
    }
  }

  async validate(node: WorkflowNode): Promise<boolean> {
    const config = node.config as EmailConfig;
    
    if (!config.to) {
      throw new Error('Email recipient (to) is required');
    }

    if (!config.subject) {
      throw new Error('Email subject is required');
    }

    if (!config.content) {
      throw new Error('Email content is required');
    }

    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = Array.isArray(config.to) ? config.to : [config.to];
    
    for (const recipient of recipients) {
      if (!emailRegex.test(recipient) && !recipient.includes('{{')) {
        throw new Error(`Invalid email format: ${recipient}`);
      }
    }

    return true;
  }

  getMetadata(): NodeMetadata {
    return {
      category: 'Communication',
      description: 'Send emails with dynamic content and recipients',
      inputs: [
        {
          name: 'data',
          type: 'object',
          required: false,
          description: 'Data to include in email template'
        }
      ],
      outputs: [
        {
          name: 'messageId',
          type: 'string',
          description: 'Unique identifier for the sent email'
        },
        {
          name: 'recipients',
          type: 'array',
          description: 'List of email recipients'
        },
        {
          name: 'sentAt',
          type: 'string',
          description: 'ISO timestamp when email was sent'
        }
      ],
      config: [
        {
          name: 'to',
          type: 'string',
          required: true,
          description: 'Recipient email address(es)'
        },
        {
          name: 'from',
          type: 'string',
          required: false,
          description: 'Sender email address',
          defaultValue: 'noreply@zenith.engineer'
        },
        {
          name: 'subject',
          type: 'string',
          required: true,
          description: 'Email subject line'
        },
        {
          name: 'content',
          type: 'text',
          required: true,
          description: 'Email content/body'
        },
        {
          name: 'contentType',
          type: 'select',
          required: false,
          description: 'Content type (text or HTML)',
          defaultValue: 'text'
        }
      ]
    };
  }
}
