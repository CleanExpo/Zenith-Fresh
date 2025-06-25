import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { WebsiteAnalyzerTool } from '@/components/tools/WebsiteAnalyzerTool';

export const metadata: Metadata = {
  title: 'Website Health Analyzer - Zenith Platform',
  description: 'Comprehensive website performance analysis with historical tracking',
};

export default async function WebsiteAnalyzerPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Website Health Analyzer</h1>
        <p className="text-gray-600 mt-2">
          Analyze your website's performance, Core Web Vitals, and technical SEO with comprehensive historical tracking.
        </p>
      </div>

      <WebsiteAnalyzerTool userId={session.user?.id || ''} />
    </div>
  );
}