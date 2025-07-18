// @ts-nocheck
// Temporary stub - email functionality disabled for deployment
export async function sendEmail(params: any): Promise<{ success: boolean; messageId: string }> {
  console.log('Email sending disabled for deployment:', params);
  return { success: true, messageId: 'stub' };
} 