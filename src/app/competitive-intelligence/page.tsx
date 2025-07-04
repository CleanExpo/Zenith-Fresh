'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CompetitiveIntelligenceDashboard from '@/components/competitive/CompetitiveIntelligenceDashboard';
import { Target, Search, Globe, TrendingUp } from 'lucide-react';

export default function CompetitiveIntelligencePage() {
  const { data: session, status } = useSession();
  const [targetDomain, setTargetDomain] = useState<string>('');
  const [inputDomain, setInputDomain] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
    
    // Set default team ID using user ID as team context
    if (session?.user?.id) {
      setTeamId(session.user.id);
    }
  }, [session, status]);

  const handleAnalyze = () => {
    if (inputDomain.trim()) {
      setTargetDomain(inputDomain.trim());
      setIsAnalyzing(true);
      // The analysis will start automatically when targetDomain changes
      setTimeout(() => setIsAnalyzing(false), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
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
            <Target className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Competitive Intelligence
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze your competitors and discover market opportunities with AI-powered insights.
          </p>
        </div>
        
        {/* Domain Input Section */}
        {!targetDomain && (
          <Card className="p-8 mb-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full">
                  <Search className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Start Competitive Analysis
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Enter a domain to analyze its competitive landscape, market position, 
                and identify key competitors in your industry.
              </p>
              
              <div className="max-w-lg mx-auto">
                <div className="flex gap-4">
                  <Input
                    type="url"
                    placeholder="Enter domain (e.g., example.com)"
                    value={inputDomain}
                    onChange={(e) => setInputDomain(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAnalyze}
                    disabled={!inputDomain.trim() || isAnalyzing}
                    className="px-8"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Market Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Competitor Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>Opportunity Discovery</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Competitive Intelligence Dashboard */}
        {targetDomain && (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Analysis for: {targetDomain}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Competitive intelligence and market positioning insights
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setTargetDomain('');
                    setInputDomain('');
                  }}
                >
                  New Analysis
                </Button>
              </div>
            </div>
            
            <CompetitiveIntelligenceDashboard 
              targetDomain={targetDomain}
              teamId={teamId}
            />
          </>
        )}

        {/* Feature Overview Cards */}
        {!targetDomain && (
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Competitor Discovery
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Automatically identify and analyze your top competitors based on keywords, 
                industry, and market overlap.
              </p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Market Analysis
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Get insights into market trends, positioning, and opportunities 
                to stay ahead of the competition.
              </p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Strategic Insights
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Receive actionable recommendations and strategic insights 
                to improve your competitive advantage.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}