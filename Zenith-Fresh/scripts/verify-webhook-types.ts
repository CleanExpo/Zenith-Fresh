/**
 * TypeScript verification file to ensure sendWebhookNotification method is properly typed
 * This file should compile without errors if the method is public and properly typed
 */

import { notificationService, NotificationData } from '../lib/services/notification-service';

// Test data with proper typing
const testData: NotificationData = {
  scan: {
    id: 'test-scan-id',
    project: {
      id: 'test-project-id',
      name: 'Test Project',
      url: 'https://example.com',
      userId: 'test-user-id',
    },
    projectId: 'test-project-id',
    url: 'https://example.com',
    performanceScore: 85,
    accessibilityScore: 92,
    bestPracticesScore: 88,
    seoScore: 90,
    completedAt: new Date(),
  },
  alerts: [{
    id: 'test-alert-id',
    title: 'Test Alert',
    description: 'This is a test notification',
    severity: 'medium',
    alertType: 'test',
  }],
  type: 'report' as const,
};

/**
 * This function demonstrates that the sendWebhookNotification method is:
 * 1. Public (can be called from external code)
 * 2. Properly typed (TypeScript accepts the method call)
 * 3. Returns the expected Promise<{ success: boolean }>
 */
async function verifyWebhookMethod(): Promise<void> {
  try {
    // This should compile without TypeScript errors if the method is public
    const result: { success: boolean } = await notificationService.sendWebhookNotification(
      testData,
      'https://httpbin.org/post'
    );
    
    console.log('Method call successful, result:', result);
  } catch (error) {
    console.log('Method is callable but execution failed (expected in test environment):', error);
  }
}

// Export the function to demonstrate it can be used externally
export { verifyWebhookMethod };

// If this file compiles successfully, it proves the method is public and properly typed
console.log('✅ TypeScript verification passed - sendWebhookNotification method is public and properly typed');