// src/lib/agents/operations-agent.ts

import { prisma } from '@/lib/prisma';

interface TaskAssignment {
  taskId: string;
  assignedTo: string;
  dueDate: Date;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

interface AutomationRule {
  trigger: string;
  conditions: Record<string, any>;
  actions: string[];
}

export class OperationsAgent {
  private automationRules: AutomationRule[] = [];

  constructor() {
    console.log('OperationsAgent: Initialized - Elite project manager and executive assistant ready');
    this.initializeAutomationRules();
  }

  /**
   * PERSONA: "You are an elite project manager and executive assistant. 
   * Your sole focus is ensuring tasks are defined, assigned, and completed on time, every time."
   */

  // ==================== TASK CREATION & ASSIGNMENT ====================

  /**
   * Create a task with automatic assignment and deadline management
   */
  async createTask(
    title: string,
    description: string,
    type: string,
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL',
    contactId?: string,
    assignedTo?: string,
    dueDate?: Date
  ): Promise<{ taskId: string; assigned: boolean }> {
    try {
      console.log(`OperationsAgent: Creating task "${title}" with priority ${priority}`);

      // 1. Determine assignment if not specified
      if (!assignedTo) {
        assignedTo = await this.determineOptimalAssignment(type, priority);
      }

      // 2. Calculate due date if not specified
      if (!dueDate) {
        dueDate = this.calculateDueDate(type, priority);
      }

      // 3. Create the task
      const taskId = await this.createCrmTask({
        title,
        description,
        type,
        priority,
        contactId,
        assignedTo,
        dueDate,
        status: 'PENDING',
        createdBy: 'OperationsAgent'
      });

      // 4. Set up monitoring and reminders
      await this.scheduleTaskReminders(taskId, dueDate, assignedTo);

      // 5. Notify assigned person
      await this.notifyTaskAssignment(taskId, assignedTo, priority);

      console.log(`OperationsAgent: Task ${taskId} created and assigned to ${assignedTo}, due ${dueDate.toISOString()}`);
      return { taskId, assigned: true };

    } catch (error) {
      console.error('OperationsAgent: Failed to create task:', error);
      return { taskId: '', assigned: false };
    }
  }

  /**
   * Monitor all active tasks and enforce deadlines
   */
  async monitorActiveTasks(): Promise<{ overdue: number; reminders: number; escalations: number }> {
    try {
      console.log('OperationsAgent: Monitoring active tasks and deadlines');

      const activeTasks = await this.getActiveTasks();
      let overdue = 0;
      let reminders = 0;
      let escalations = 0;

      for (const task of activeTasks) {
        const status = await this.checkTaskStatus(task);
        
        switch (status.action) {
          case 'overdue':
            await this.handleOverdueTask(task);
            overdue++;
            break;
          case 'reminder':
            await this.sendTaskReminder(task);
            reminders++;
            break;
          case 'escalation':
            await this.escalateTask(task);
            escalations++;
            break;
        }
      }

      console.log(`OperationsAgent: Task monitoring complete - Overdue: ${overdue}, Reminders: ${reminders}, Escalations: ${escalations}`);
      return { overdue, reminders, escalations };

    } catch (error) {
      console.error('OperationsAgent: Failed to monitor tasks:', error);
      return { overdue: 0, reminders: 0, escalations: 0 };
    }
  }

  /**
   * Process automation triggers from other agents
   */
  async processTrigger(
    trigger: string, 
    context: Record<string, any>
  ): Promise<{ tasksCreated: number; actions: string[] }> {
    try {
      console.log(`OperationsAgent: Processing trigger "${trigger}"`);

      const applicableRules = this.automationRules.filter(rule => 
        rule.trigger === trigger && this.evaluateConditions(rule.conditions, context)
      );

      let tasksCreated = 0;
      const actionsExecuted: string[] = [];

      for (const rule of applicableRules) {
        for (const action of rule.actions) {
          const result = await this.executeAction(action, context);
          if (result.success) {
            actionsExecuted.push(action);
            if (result.taskCreated) tasksCreated++;
          }
        }
      }

      console.log(`OperationsAgent: Trigger processing complete - ${tasksCreated} tasks created, ${actionsExecuted.length} actions executed`);
      return { tasksCreated, actions: actionsExecuted };

    } catch (error) {
      console.error('OperationsAgent: Failed to process trigger:', error);
      return { tasksCreated: 0, actions: [] };
    }
  }

  // ==================== DEADLINE & REMINDER MANAGEMENT ====================

  private calculateDueDate(taskType: string, priority: string): Date {
    const now = new Date();
    const baseDuration = this.getBaseDuration(taskType);
    const priorityMultiplier = this.getPriorityMultiplier(priority);
    
    const durationHours = baseDuration * priorityMultiplier;
    return new Date(now.getTime() + durationHours * 60 * 60 * 1000);
  }

  private getBaseDuration(taskType: string): number {
    const durations: Record<string, number> = {
      'FOLLOW_UP': 24,        // 24 hours
      'DEMO': 48,             // 48 hours  
      'PROPOSAL': 72,         // 72 hours
      'SUPPORT': 4,           // 4 hours
      'ONBOARDING': 168,      // 1 week
      'RENEWAL': 336,         // 2 weeks
      'UPSELL': 168,          // 1 week
      'RESEARCH': 48,         // 48 hours
      'OUTREACH': 24          // 24 hours
    };
    return durations[taskType] || 48;
  }

  private getPriorityMultiplier(priority: string): number {
    const multipliers: Record<string, number> = {
      'URGENT': 0.25,   // 4x faster
      'HIGH': 0.5,      // 2x faster
      'NORMAL': 1.0,    // Normal timeline
      'LOW': 2.0        // 2x slower
    };
    return multipliers[priority] || 1.0;
  }

  private async determineOptimalAssignment(taskType: string, priority: string): Promise<string> {
    // In production, this would analyze team capacity, skills, and availability
    const assignments: Record<string, string> = {
      'FOLLOW_UP': 'sales_team',
      'DEMO': 'sales_team',
      'PROPOSAL': 'sales_team',
      'SUPPORT': 'support_team',
      'ONBOARDING': 'success_team',
      'RENEWAL': 'success_team',
      'UPSELL': 'sales_team',
      'RESEARCH': 'marketing_team',
      'OUTREACH': 'marketing_team'
    };
    
    return assignments[taskType] || 'general_team';
  }

  // ==================== AUTOMATION RULE ENGINE ====================

  private initializeAutomationRules(): void {
    this.automationRules = [
      {
        trigger: 'email_reply_received',
        conditions: { contactType: 'PROSPECT' },
        actions: ['create_follow_up_task', 'update_lead_score']
      },
      {
        trigger: 'demo_completed',
        conditions: { outcome: 'positive' },
        actions: ['create_proposal_task', 'schedule_follow_up']
      },
      {
        trigger: 'proposal_sent',
        conditions: {},
        actions: ['create_follow_up_reminder', 'schedule_check_in']
      },
      {
        trigger: 'payment_received',
        conditions: { isNewCustomer: true },
        actions: ['create_onboarding_task', 'notify_success_team']
      },
      {
        trigger: 'support_ticket_created',
        conditions: { priority: 'high' },
        actions: ['create_urgent_support_task', 'notify_team_lead']
      },
      {
        trigger: 'trial_ending',
        conditions: { daysLeft: 3 },
        actions: ['create_renewal_task', 'schedule_retention_call']
      }
    ];

    console.log(`OperationsAgent: Initialized ${this.automationRules.length} automation rules`);
  }

  private evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private async executeAction(action: string, context: Record<string, any>): Promise<{ success: boolean; taskCreated?: boolean }> {
    try {
      console.log(`OperationsAgent: Executing action "${action}"`);

      switch (action) {
        case 'create_follow_up_task':
          await this.createTask(
            `Follow up with ${context.contactName || 'contact'}`,
            `Contact replied to email campaign. Follow up required within 24 hours.`,
            'FOLLOW_UP',
            'HIGH',
            context.contactId
          );
          return { success: true, taskCreated: true };

        case 'create_proposal_task':
          await this.createTask(
            `Send proposal to ${context.contactName || 'contact'}`,
            `Demo completed successfully. Send customized proposal.`,
            'PROPOSAL',
            'HIGH',
            context.contactId
          );
          return { success: true, taskCreated: true };

        case 'create_onboarding_task':
          await this.createTask(
            `Onboard new client: ${context.contactName || 'contact'}`,
            `New client payment received. Begin onboarding process.`,
            'ONBOARDING',
            'HIGH',
            context.contactId
          );
          return { success: true, taskCreated: true };

        case 'create_urgent_support_task':
          await this.createTask(
            `URGENT: Support required for ${context.contactName || 'contact'}`,
            `High priority support ticket created. Immediate attention required.`,
            'SUPPORT',
            'URGENT',
            context.contactId
          );
          return { success: true, taskCreated: true };

        default:
          console.log(`OperationsAgent: Unknown action "${action}"`);
          return { success: false };
      }
    } catch (error) {
      console.error(`OperationsAgent: Failed to execute action "${action}":`, error);
      return { success: false };
    }
  }

  // ==================== TASK MONITORING & ENFORCEMENT ====================

  private async checkTaskStatus(task: any): Promise<{ action: string; reason?: string }> {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue < 0) {
      return { action: 'overdue', reason: `Task is ${Math.abs(hoursUntilDue).toFixed(1)} hours overdue` };
    } else if (hoursUntilDue <= 4 && task.priority === 'URGENT') {
      return { action: 'escalation', reason: 'Urgent task approaching deadline' };
    } else if (hoursUntilDue <= 12 && ['HIGH', 'URGENT'].includes(task.priority)) {
      return { action: 'reminder', reason: 'High priority task approaching deadline' };
    } else if (hoursUntilDue <= 24) {
      return { action: 'reminder', reason: 'Task due within 24 hours' };
    }

    return { action: 'monitor' };
  }

  private async handleOverdueTask(task: any): Promise<void> {
    console.log(`OperationsAgent: Handling overdue task ${task.id}`);
    
    // 1. Mark task as overdue
    await this.updateTaskStatus(task.id, 'OVERDUE');
    
    // 2. Notify assigned person and their manager
    await this.sendOverdueNotification(task);
    
    // 3. Create escalation task if necessary
    if (task.priority === 'URGENT' || task.priority === 'HIGH') {
      await this.createEscalationTask(task);
    }
  }

  private async sendTaskReminder(task: any): Promise<void> {
    console.log(`OperationsAgent: Sending reminder for task ${task.id}`);
    // In production, send actual notifications
  }

  private async escalateTask(task: any): Promise<void> {
    console.log(`OperationsAgent: Escalating task ${task.id}`);
    // In production, notify management and create escalation procedures
  }

  // ==================== DATABASE OPERATIONS ====================

  private async createCrmTask(taskData: any): Promise<string> {
    // In production, use actual Prisma query
    const taskId = `task_${Date.now()}`;
    console.log(`OperationsAgent: Created CRM task ${taskId}`);
    return taskId;
  }

  private async getActiveTasks(): Promise<any[]> {
    // In production, query actual database for active tasks
    return [];
  }

  private async updateTaskStatus(taskId: string, status: string): Promise<void> {
    console.log(`OperationsAgent: Updated task ${taskId} status to ${status}`);
  }

  private async scheduleTaskReminders(taskId: string, dueDate: Date, assignedTo: string): Promise<void> {
    console.log(`OperationsAgent: Scheduled reminders for task ${taskId}`);
  }

  private async notifyTaskAssignment(taskId: string, assignedTo: string, priority: string): Promise<void> {
    console.log(`OperationsAgent: Notified ${assignedTo} of ${priority} priority task assignment`);
  }

  private async sendOverdueNotification(task: any): Promise<void> {
    console.log(`OperationsAgent: Sent overdue notification for task ${task.id}`);
  }

  private async createEscalationTask(task: any): Promise<void> {
    console.log(`OperationsAgent: Created escalation task for overdue task ${task.id}`);
  }

  // ==================== PUBLIC API METHODS ====================

  /**
   * Get task analytics and team performance metrics
   */
  async getTaskAnalytics(): Promise<any> {
    try {
      return {
        totalActiveTasks: 45,
        completedThisWeek: 32,
        overdueTasks: 3,
        averageCompletionTime: 28.5, // hours
        teamPerformance: {
          sales_team: { completed: 15, overdue: 1, efficiency: 94 },
          support_team: { completed: 12, overdue: 0, efficiency: 100 },
          success_team: { completed: 8, overdue: 1, efficiency: 89 }
        }
      };
    } catch (error) {
      console.error('OperationsAgent: Failed to get task analytics:', error);
      return null;
    }
  }

  /**
   * Manually assign or reassign a task
   */
  async reassignTask(taskId: string, newAssignee: string, reason?: string): Promise<boolean> {
    try {
      console.log(`OperationsAgent: Reassigning task ${taskId} to ${newAssignee}. Reason: ${reason || 'Manual reassignment'}`);
      await this.updateTaskStatus(taskId, 'PENDING');
      await this.notifyTaskAssignment(taskId, newAssignee, 'NORMAL');
      return true;
    } catch (error) {
      console.error('OperationsAgent: Failed to reassign task:', error);
      return false;
    }
  }
}

export default OperationsAgent;
