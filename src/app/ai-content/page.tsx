/**
 * AI-Powered Content Analysis Page
 * Advanced content optimization and analysis using multiple AI models
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AIPoweredContentAnalysis from '@/components/AIPoweredContentAnalysis';

export const metadata: Metadata = {
  title: 'AI Content Analysis | Zenith Platform',
  description: 'Advanced AI-powered content analysis, optimization, and strategy recommendations using OpenAI GPT-4, Claude 3.5, and Google AI.',
  keywords: [
    'AI content analysis',
    'content optimization',
    'SEO content',
    'content strategy',
    'AI writing',
    'content performance',
    'readability analysis',
    'content gaps',
    'content calendar',
    'competitive content analysis'
  ]
};

export default async function AIContentPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/ai-content');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  AI Content Analysis
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl">
                  Leverage advanced AI models including OpenAI GPT-4, Claude 3.5, and Google AI 
                  to analyze, optimize, and generate high-performing content strategies.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>GPT-4</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Claude 3.5</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Google AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  🧠
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Content Gaps</h3>
                <p className="text-sm text-gray-600">AI-powered gap analysis</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  ⚡
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Optimization</h3>
                <p className="text-sm text-gray-600">AI optimization recommendations</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  📊
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Topic Clusters</h3>
                <p className="text-sm text-gray-600">Strategic content clusters</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  📝
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Content Briefs</h3>
                <p className="text-sm text-gray-600">AI-generated briefs</p>
              </div>
            </div>
          </div>

          {/* Main Content Analysis Component */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <AIPoweredContentAnalysis
              onGenerateBrief={(brief) => {
                console.log('Content brief generated:', brief);
                // Handle brief generation
              }}
              onOptimizeContent={(optimizations) => {
                console.log('Content optimizations:', optimizations);
                // Handle content optimization
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}