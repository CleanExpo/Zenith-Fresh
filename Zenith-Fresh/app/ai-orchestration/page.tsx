import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OrchestrationDashboard from '@/components/ai-orchestration/OrchestrationDashboard';

export const metadata: Metadata = {
  title: 'AI Agent Orchestration | Zenith Platform',
  description: 'Comprehensive AI model management and workflow orchestration platform',
};

export default async function AIOrchestrationPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-6">
      <OrchestrationDashboard />
    </div>
  );
}