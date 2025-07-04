'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIPoweredContentAnalysis from '@/components/AIPoweredContentAnalysis';
import { Brain, FileText, Target, TrendingUp, Search, Lightbulb } from 'lucide-react';

export default function AIContentPage() {
  const { data: session, status } = useSession();
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [session, status]);

  const handleStartAnalysis = () => {
    if (targetUrl.trim()) {
      setIsAnalyzing(true);
      setShowAnalysis(true);
      // Simulate analysis loading
      setTimeout(() => setIsAnalyzing(false), 3000);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user?.id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Content Analysis
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Leverage AI to analyze content gaps, optimize your content strategy, 
            and discover high-impact opportunities.
          </p>
        </div>

        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Content Analysis</TabsTrigger>
            <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            {!showAnalysis ? (
              <Card className="p-8">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-6">
                    <div className="bg-purple-100 dark:bg-purple-900/20 p-4 rounded-full">
                      <Brain className="w-12 h-12 text-purple-600" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    AI-Powered Content Analysis
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                    Analyze your content against competitors, discover gaps, and get 
                    AI-powered recommendations for content optimization.
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Website URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Competitor URLs (optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="competitor1.com, competitor2.com"
                      onChange={(e) => setCompetitorUrls(e.target.value.split(',').map(url => url.trim()))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Keywords (optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="keyword1, keyword2, keyword3"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <Button 
                    onClick={handleStartAnalysis}
                    disabled={!targetUrl.trim() || isAnalyzing}
                    className="w-full py-3"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Analyzing Content...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5 mr-2" />
                        Start AI Analysis
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Content Analysis for: {targetUrl}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        AI-powered insights and recommendations
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAnalysis(false);
                        setTargetUrl('');
                        setCompetitorUrls([]);
                        setKeywords('');
                      }}
                    >
                      New Analysis
                    </Button>
                  </div>
                </div>
                
                <AIPoweredContentAnalysis 
                  targetUrl={targetUrl}
                  competitorUrls={competitorUrls}
                  keywords={keywords.split(',').map(k => k.trim()).filter(k => k)}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="gaps" className="space-y-6">
            <Card className="p-8">
              <div className="text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Content Gap Analysis
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Discover content opportunities by analyzing gaps between you and your competitors.
                </p>
                <Button onClick={() => setShowAnalysis(true)}>
                  <Target className="w-4 h-4 mr-2" />
                  Start Gap Analysis
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6">
            <Card className="p-8">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Content Optimization
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get AI-powered recommendations to optimize your existing content for better performance.
                </p>
                <Button onClick={() => setShowAnalysis(true)}>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Get Optimization Tips
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feature Overview Cards */}
        {!showAnalysis && (
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Content Insights
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Get AI-powered analysis of your content performance, readability, 
                and optimization opportunities.
              </p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Gap Discovery
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Identify content gaps and untapped opportunities by comparing 
                your content with competitors.
              </p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Performance Optimization
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Receive actionable recommendations to improve content performance 
                and search engine rankings.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}