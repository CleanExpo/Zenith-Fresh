import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import WebsiteAnalyzerDashboard from '../../../components/website-analyzer/WebsiteAnalyzerDashboard';

export const metadata: Metadata = {
  title: 'Website Health Analyzer - Zenith Platform',
  description: 'Comprehensive website performance and health analysis with automated monitoring',
};

export default async function WebsiteAnalyzerPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return <WebsiteAnalyzerDashboard />;
}