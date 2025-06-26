/**
 * Enterprise Quote and Contract Management Service
 * Handles enterprise sales processes, quotes, contracts, and procurement workflows
 */

import { prisma } from '@/lib/prisma';
import { StripeHelpers } from '@/lib/stripe';
import { QuoteStatus, ContractStatus, BillingInterval } from '@prisma/client';
// import { generatePDF } from '@/lib/utils/pdf';

export class EnterpriseService {
  /**
   * Create enterprise quote
   */
  static async createQuote(params: {
    userId: string;
    planId?: string;
    title: string;
    description?: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      billingInterval?: string;
    }>;
    validDays?: number;
    terms?: string;
    notes?: string;
    currency?: string;
  }) {
    const {
      userId,
      planId,
      title,
      description,
      lineItems,
      validDays = 30,
      terms,
      notes,
      currency = 'usd'
    } = params;

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const subtotalInCents = StripeHelpers.toCents(subtotal);
    
    // Get user for tax calculation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { billingAddress: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate tax if applicable
    let taxAmount = 0;
    if (user.billingAddress) {
      const taxRate = StripeHelpers.getTaxRate(user.billingAddress.country);
      taxAmount = Math.round(subtotalInCents * (taxRate / 100));
    }

    const totalAmount = subtotalInCents + taxAmount;
    const validUntil = new Date(Date.now() + (validDays * 24 * 60 * 60 * 1000));

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        userId,
        planId,
        quoteNumber: StripeHelpers.generateQuoteNumber(),
        title,
        description,
        subtotal: subtotalInCents,
        taxAmount,
        totalAmount,
        currency,
        validUntil,
        terms,
        notes
      }
    });

    // Create line items
    const quoteLineItems = await Promise.all(
      lineItems.map(item =>
        prisma.quoteLineItem.create({
          data: {
            quoteId: quote.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: StripeHelpers.toCents(item.unitPrice),
            totalPrice: StripeHelpers.toCents(item.quantity * item.unitPrice),
            billingInterval: item.billingInterval
          }
        })
      )
    );

    // Generate PDF
    const quotePdfUrl = await this.generateQuotePDF(quote.id);
    
    // Update quote with PDF URL
    const updatedQuote = await prisma.quote.update({
      where: { id: quote.id },
      data: { quotePdfUrl },
      include: {
        lineItems: true,
        user: {
          include: { billingAddress: true }
        }
      }
    });

    return updatedQuote;
  }

  /**
   * Update quote status
   */
  static async updateQuoteStatus(quoteId: string, status: QuoteStatus, reason?: string) {
    const updateData: any = { status };

    if (status === 'ACCEPTED') {
      updateData.approvedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = reason;
    }

    const quote = await prisma.quote.update({
      where: { id: quoteId },
      data: updateData,
      include: {
        lineItems: true,
        user: true
      }
    });

    // If accepted, create contract
    if (status === 'ACCEPTED') {
      await this.createContractFromQuote(quoteId);
    }

    return quote;
  }

  /**
   * Create contract from accepted quote
   */
  static async createContractFromQuote(quoteId: string) {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        lineItems: true,
        user: true
      }
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== 'ACCEPTED') {
      throw new Error('Quote must be accepted to create contract');
    }

    // Determine contract terms
    const startDate = new Date();
    const billingInterval = this.determineBillingInterval(quote.lineItems);
    const isMonthly = billingInterval === 'MONTHLY';
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + (isMonthly ? 1 : 1)); // Default 1 year

    const contract = await prisma.contract.create({
      data: {
        userId: quote.userId,
        quoteId: quote.id,
        contractNumber: StripeHelpers.generateContractNumber(),
        title: `Enterprise Agreement - ${quote.title}`,
        description: quote.description,
        startDate,
        endDate,
        autoRenew: true,
        renewalTermMonths: 12,
        totalValue: quote.totalAmount,
        currency: quote.currency,
        billingInterval,
        terms: this.generateContractTerms(quote)
      }
    });

    // Generate contract PDF
    const contractPdfUrl = await this.generateContractPDF(contract.id);
    
    // Update contract with PDF URL
    const updatedContract = await prisma.contract.update({
      where: { id: contract.id },
      data: { contractPdfUrl },
      include: {
        quote: {
          include: {
            lineItems: true
          }
        },
        user: true
      }
    });

    return updatedContract;
  }

  /**
   * Sign contract
   */
  static async signContract(contractId: string, params: {
    customerSignatory: string;
    vendorSignatory: string;
    signatureDate?: Date;
    dataProcessingAddendum?: boolean;
    businessAssociateAgreement?: boolean;
  }) {
    const {
      customerSignatory,
      vendorSignatory,
      signatureDate = new Date(),
      dataProcessingAddendum = false,
      businessAssociateAgreement = false
    } = params;

    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: 'ACTIVE',
        signedAt: signatureDate,
        signedByCustomer: customerSignatory,
        signedByVendor: vendorSignatory,
        dataProcessingAddendum,
        businessAssociateAgreement
      },
      include: {
        quote: true,
        user: true
      }
    });

    // Generate signed contract PDF
    const signedContractPdfUrl = await this.generateContractPDF(contractId, true);
    
    await prisma.contract.update({
      where: { id: contractId },
      data: { contractPdfUrl: signedContractPdfUrl }
    });

    return contract;
  }

  /**
   * Create procurement workflow
   */
  static async createProcurementWorkflow(params: {
    userId: string;
    quoteId: string;
    purchaseOrderNumber: string;
    approvers: Array<{
      name: string;
      email: string;
      role: string;
      level: number;
    }>;
    requirements: {
      securityReview?: boolean;
      legalReview?: boolean;
      budgetApproval?: boolean;
      technicalReview?: boolean;
    };
    deliverables: Array<{
      name: string;
      description: string;
      dueDate: Date;
    }>;
  }) {
    const { userId, quoteId, purchaseOrderNumber, approvers, requirements, deliverables } = params;

    // Procurement workflow model not implemented
    throw new Error('Procurement workflow not implemented - Prisma model missing');
  }

  /**
   * Process approval step
   */
  static async processApproval(workflowId: string, approverEmail: string, approved: boolean, comments?: string) {
    // Procurement workflow model not implemented
    throw new Error('Procurement workflow not implemented - Prisma model missing');
  }

  /**
   * Generate quote PDF
   */
  static async generateQuotePDF(quoteId: string): Promise<string> {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        lineItems: true,
        user: {
          include: { billingAddress: true }
        }
      }
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    const pdfData = {
      type: 'quote',
      title: `Quote ${quote.quoteNumber}`,
      customer: {
        name: quote.user.name || 'Customer',
        email: quote.user.email,
        address: quote.user.billingAddress
      },
      quote,
      lineItems: quote.lineItems,
      subtotal: StripeHelpers.formatAmount(quote.subtotal, quote.currency),
      taxAmount: quote.taxAmount ? StripeHelpers.formatAmount(quote.taxAmount, quote.currency) : null,
      totalAmount: StripeHelpers.formatAmount(quote.totalAmount, quote.currency)
    };

    // return generatePDF(pdfData);
    throw new Error('PDF generation not implemented');
  }

  /**
   * Generate contract PDF
   */
  static async generateContractPDF(contractId: string, signed = false): Promise<string> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        quote: {
          include: { lineItems: true }
        },
        user: {
          include: { billingAddress: true }
        }
      }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    const pdfData = {
      type: 'contract',
      title: `Contract ${contract.contractNumber}`,
      customer: {
        name: contract.user.name || 'Customer',
        email: contract.user.email,
        address: contract.user.billingAddress
      },
      contract,
      quote: contract.quote,
      signed,
      totalValue: StripeHelpers.formatAmount(contract.totalValue, contract.currency)
    };

    // return generatePDF(pdfData);
    throw new Error('PDF generation not implemented');
  }

  /**
   * Send approval requests
   */
  private static async sendApprovalRequests(workflowId: string) {
    // Implementation would send emails to approvers
    // This is a placeholder for the email service integration
    console.log(`Sending approval requests for workflow ${workflowId}`);
  }

  /**
   * Determine billing interval from line items
   */
  private static determineBillingInterval(lineItems: any[]): BillingInterval {
    const intervals = lineItems.map(item => item.billingInterval).filter(Boolean);
    
    if (intervals.includes('monthly')) return 'MONTHLY';
    if (intervals.includes('quarterly')) return 'QUARTERLY';
    if (intervals.includes('yearly')) return 'YEARLY';
    
    return 'YEARLY'; // Default for enterprise contracts
  }

  /**
   * Generate contract terms
   */
  private static generateContractTerms(quote: any): string {
    return `
ENTERPRISE SOFTWARE LICENSE AGREEMENT

This Enterprise Software License Agreement ("Agreement") is entered into as of the contract signing date ("Effective Date") between Zenith Platform, Inc. ("Company") and the customer ("Customer").

1. GRANT OF LICENSE
Subject to the terms and conditions of this Agreement, Company hereby grants to Customer a non-exclusive, non-transferable license to use the Zenith Platform software and services as described in Quote ${quote.quoteNumber}.

2. TERM AND TERMINATION
This Agreement shall commence on the Effective Date and continue for the initial term specified, unless earlier terminated in accordance with this Agreement.

3. FEES AND PAYMENT
Customer agrees to pay the fees specified in the Quote. All fees are non-refundable except as expressly provided herein.

4. CONFIDENTIALITY
Each party acknowledges that it may have access to confidential information of the other party and agrees to maintain such information in confidence.

5. DATA PROTECTION
Company agrees to implement appropriate technical and organizational measures to protect Customer data in accordance with applicable data protection laws.

6. SERVICE LEVEL AGREEMENT
Company commits to maintaining the service availability and performance levels as specified in the Quote and service level agreement.

7. LIMITATION OF LIABILITY
EXCEPT FOR BREACHES OF CONFIDENTIALITY OR DATA PROTECTION OBLIGATIONS, IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.

8. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.

9. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements and understandings.

By signing below, the parties agree to be bound by the terms and conditions of this Agreement.
    `.trim();
  }
}

// Add procurement workflow model to the database schema (would need to be added to schema.prisma)
interface ProcurementWorkflow {
  id: string;
  userId: string;
  quoteId: string;
  purchaseOrderNumber: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvers: any[];
  requirements: any;
  deliverables: any[];
  currentStep: number;
  totalSteps: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default EnterpriseService;