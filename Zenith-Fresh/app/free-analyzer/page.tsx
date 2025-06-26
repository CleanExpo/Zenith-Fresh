import { Metadata } from 'next';
import { PublicWebsiteAnalyzer } from '@/components/tools/PublicWebsiteAnalyzer';
import { WebsiteAnalyzerErrorBoundary } from '@/components/error-boundaries';

export const metadata: Metadata = {
  title: 'Free Website Health Analyzer - Zenith Platform',
  description: 'Free comprehensive website performance analysis - no signup required',
};

export default function FreeAnalyzerPage() {
  return (
    <WebsiteAnalyzerErrorBoundary section="scan">
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Free Website Health Analyzer</h1>
            <p className="text-xl text-gray-200">
              Analyze any website's performance instantly - no signup required!
            </p>
            <p className="text-sm text-gray-300 mt-2">
              Get comprehensive insights on performance, SEO, security, and accessibility.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
              <PublicWebsiteAnalyzer />
            </div>
          </div>

          <div className="mt-8 text-center text-gray-300">
            <p className="text-sm">
              100% Free • No Email Required • Instant Results
            </p>
          </div>
        </div>
      </div>
    </WebsiteAnalyzerErrorBoundary>
  );
}