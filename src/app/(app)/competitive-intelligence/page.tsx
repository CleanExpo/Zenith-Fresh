'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CompetitiveIntelligenceDashboard from '@/components/competitive/CompetitiveIntelligenceDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, Globe, Search, AlertTriangle } from 'lucide-react';

export default function CompetitiveIntelligencePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [targetDomain, setTargetDomain] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [teamId, setTeamId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    // Set default team ID (demo team or user's primary team)
    if (session?.user?.id) {
      setTeamId(session.user.id);
    }
  }, [session, status, router]);

  const handleDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDomain.trim()) return;

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}\.)*[a-zA-Z]{2,}$/;
    if (!domainRegex.test(targetDomain.trim())) {
      setError('Please enter a valid domain name (e.g., example.com)');
      return;
    }

    setError(null);
    setSelectedDomain(targetDomain.trim());
  };

  const handleStartNewAnalysis = () => {
    setSelectedDomain(null);
    setTargetDomain('');
    setError(null);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (selectedDomain && teamId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8" />
              Competitive Intelligence
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive competitive analysis for {selectedDomain}
            </p>
          </div>
          <Button variant="outline" onClick={handleStartNewAnalysis}>
            <Search className="h-4 w-4 mr-2" />
            Analyze New Domain
          </Button>
        </div>
        
        <CompetitiveIntelligenceDashboard 
          targetDomain={selectedDomain} 
          teamId={teamId}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Target className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold">Competitive Intelligence Platform</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover your competitors, analyze their strategies, and uncover opportunities 
          to outperform them in search rankings, content, and market positioning.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Start Competitive Analysis
          </CardTitle>
          <CardDescription>
            Enter a domain to analyze its competitive landscape and discover growth opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDomainSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter domain (e.g., example.com)"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                className="w-full"
                disabled={isAnalyzing}
              />
            </div>

            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={!targetDomain.trim() || isAnalyzing}
            >
              <Target className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Start Competitive Analysis'}
            </Button>
          </form>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Search className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-medium">Competitor Discovery</p>
                <p className="text-xs text-muted-foreground">Find direct and indirect competitors</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Target className="h-4 w-4 text-green-500" />
              <div>
                <p className="font-medium">Gap Analysis</p>
                <p className="text-xs text-muted-foreground">Keywords, content, and backlink gaps</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Globe className="h-4 w-4 text-purple-500" />
              <div>
                <p className="font-medium">Market Intelligence</p>
                <p className="text-xs text-muted-foreground">Strategic insights and opportunities</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <Search className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">SERP Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Analyze search engine results to identify top competitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Keyword Gaps</h3>
            <p className="text-sm text-muted-foreground">
              Discover high-value keywords your competitors rank for
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Globe className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Backlink Intelligence</h3>
            <p className="text-sm text-muted-foreground">
              Find link building opportunities from competitor analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Content Gaps</h3>
            <p className="text-sm text-muted-foreground">
              Identify content opportunities and topics to create
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}