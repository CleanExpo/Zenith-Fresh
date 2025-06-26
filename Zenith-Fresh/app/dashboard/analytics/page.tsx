import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { ProjectSelector } from '@/components/analytics/ProjectSelector';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Zenith Platform',
  description: 'Advanced analytics and performance insights for your projects',
};

interface AnalyticsPageProps {
  searchParams: {
    projectId?: string;
    url?: string;
  };
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  // Get user's projects for the project selector
  const userProjects = await prisma.project.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // If no projectId is specified, use the first project
  const selectedProjectId = searchParams.projectId || userProjects[0]?.id;

  if (!selectedProjectId && userProjects.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">No Projects Found</h2>
          <p className="text-blue-700 mb-4">
            You need to create a project first to view analytics.
          </p>
          <a 
            href="/tools/website-analyzer"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Project
          </a>
        </div>
      </div>
    );
  }

  if (!selectedProjectId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h2>
          <p className="text-gray-600">Please select a project to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Project Selector */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Performance insights and trends for your projects</p>
          </div>
          
          <ProjectSelector 
            projects={userProjects.map(p => ({ id: p.id, name: p.name }))}
            selectedProjectId={selectedProjectId}
          />
        </div>
      </div>

      {/* Analytics Dashboard Component */}
      <AnalyticsDashboard 
        projectId={selectedProjectId}
        url={searchParams.url}
      />
    </div>
  );
}