import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { FeatureFlag } from '@/components/FeatureFlag';
import { isFeatureEnabled } from '@/lib/feature-flags';

export const metadata: Metadata = {
  title: 'Dashboard - Zenith Platform',
  description: 'Your Zenith Platform dashboard',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  // Server-side feature flag check
  const hasTeamManagement = isFeatureEnabled('TEAM_MANAGEMENT', session.user?.email, session.user?.id);
  const hasAIAnalysis = isFeatureEnabled('AI_CONTENT_ANALYSIS', session.user?.email, session.user?.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome back, {session.user?.name || session.user?.email}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Core Features - Always Available */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Website Health Analyzer</h2>
          <p className="text-gray-600 mb-4">Analyze your website's performance and health.</p>
          <a href="/tools/website-analyzer" className="text-blue-600 hover:underline">
            Launch Analyzer →
          </a>
        </div>

        {/* Team Management - Feature Flagged */}
        {hasTeamManagement && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Team Management</h2>
            <p className="text-gray-600 mb-4">Manage your team and collaborate on projects.</p>
            <a href="/team" className="text-blue-600 hover:underline">
              Manage Team →
            </a>
          </div>
        )}

        {/* AI Content Analysis - Feature Flagged */}
        {hasAIAnalysis && (
          <div className="bg-white rounded-lg shadow p-6 border-2 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">AI Content Analysis</h2>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                BETA
              </span>
            </div>
            <p className="text-gray-600 mb-4">AI-powered content optimization and insights.</p>
            <a href="/tools/ai-analysis" className="text-purple-600 hover:underline">
              Try AI Analysis →
            </a>
          </div>
        )}

        {/* Client-side feature flag example */}
        <FeatureFlag feature="COMPETITIVE_INTELLIGENCE">
          <div className="bg-white rounded-lg shadow p-6 border-2 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Competitive Intelligence</h2>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                ALPHA
              </span>
            </div>
            <p className="text-gray-600 mb-4">Track competitors and market trends.</p>
            <a href="/tools/competitive-intel" className="text-red-600 hover:underline">
              Coming Soon →
            </a>
          </div>
        </FeatureFlag>
      </div>

      {/* Feature Flag Status (Dev Only) */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Feature Flag Status (Dev Only)</h3>
          <div className="text-sm space-y-1">
            <div>Team Management: {hasTeamManagement ? '✅ Enabled' : '❌ Disabled'}</div>
            <div>AI Analysis: {hasAIAnalysis ? '✅ Enabled' : '❌ Disabled'}</div>
          </div>
        </div>
      )}
    </div>
  );
}