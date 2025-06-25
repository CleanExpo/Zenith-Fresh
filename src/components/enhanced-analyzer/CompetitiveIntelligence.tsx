/**
 * Competitive Intelligence Component
 * Advanced competitive analysis with AI-powered insights
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Target,
  Eye,
  Globe,
  Search,
  Users,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
  Filter,
  Download
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CompetitorData {
  url: string;
  name: string;
  overallScore: number;
  metrics: {
    performance: number;
    seo: number;
    ux: number;
    content: number;
    accessibility: number;
  };
  strengths: string[];
  weaknesses: string[];
  opportunityGaps: string[];
  marketShare: number;
  trafficEstimate: number;
  keywordCount: number;
  backlinks: number;
}

interface BenchmarkData {
  category: string;
  userScore: number;
  industryAverage: number;
  topPerformer: number;
  competitorScores: { name: string; score: number }[];
  trend: 'up' | 'down' | 'stable';
  insight: string;
}

interface CompetitiveIntelligenceProps {
  userUrl: string;
  competitors?: CompetitorData[];
  benchmarks?: BenchmarkData[];
  marketPosition?: string;
  opportunities?: string[];
}

const CompetitiveIntelligence = ({
  userUrl,
  competitors = [],
  benchmarks = [],
  marketPosition = 'Strong position with growth opportunities',
  opportunities = []
}: CompetitiveIntelligenceProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  // Mock data if none provided
  const mockCompetitors: CompetitorData[] = competitors.length > 0 ? competitors : [
    {
      url: 'competitor1.com',
      name: 'Competitor A',
      overallScore: 82,
      metrics: {
        performance: 79,
        seo: 85,
        ux: 81,
        content: 83,
        accessibility: 76
      },
      strengths: [
        'Strong social media presence',
        'Excellent mobile experience',
        'Comprehensive content library',
        'Fast loading times'
      ],
      weaknesses: [
        'Poor accessibility scores',
        'Limited technical documentation',
        'Weak local SEO',
        'No video content'
      ],
      opportunityGaps: [
        'Missing interactive tools',
        'No live chat support',
        'Limited language options',
        'Weak community features'
      ],
      marketShare: 23.5,
      trafficEstimate: 2400000,
      keywordCount: 15420,
      backlinks: 8900
    },
    {
      url: 'competitor2.com',
      name: 'Competitor B',
      overallScore: 76,
      metrics: {
        performance: 71,
        seo: 79,
        ux: 78,
        content: 77,
        accessibility: 73
      },
      strengths: [
        'Good content marketing',
        'Strong brand recognition',
        'Effective email campaigns',
        'Quality backlink profile'
      ],
      weaknesses: [
        'Slow page load times',
        'Complex navigation',
        'Poor mobile optimization',
        'Limited technical features'
      ],
      opportunityGaps: [
        'No AI-powered features',
        'Missing automation tools',
        'Limited integrations',
        'Weak developer resources'
      ],
      marketShare: 18.2,
      trafficEstimate: 1800000,
      keywordCount: 12100,
      backlinks: 6500
    },
    {
      url: 'competitor3.com',
      name: 'Competitor C',
      overallScore: 88,
      metrics: {
        performance: 90,
        seo: 87,
        ux: 89,
        content: 86,
        accessibility: 85
      },
      strengths: [
        'Exceptional performance',
        'Outstanding user experience',
        'Innovative features',
        'Strong technical SEO'
      ],
      weaknesses: [
        'Higher pricing',
        'Complex onboarding',
        'Limited free tier',
        'Steep learning curve'
      ],
      opportunityGaps: [
        'Expensive for SMBs',
        'Over-engineered for simple use cases',
        'Limited beginner resources',
        'Complex pricing structure'
      ],
      marketShare: 31.8,
      trafficEstimate: 3200000,
      keywordCount: 22800,
      backlinks: 15200
    }
  ];

  const mockBenchmarks: BenchmarkData[] = benchmarks.length > 0 ? benchmarks : [
    {
      category: 'Performance',
      userScore: 78,
      industryAverage: 72,
      topPerformer: 90,
      competitorScores: [
        { name: 'Competitor A', score: 79 },
        { name: 'Competitor B', score: 71 },
        { name: 'Competitor C', score: 90 }
      ],
      trend: 'up',
      insight: 'Above average but room for improvement to match top performers'
    },
    {
      category: 'SEO',
      userScore: 81,
      industryAverage: 75,
      topPerformer: 87,
      competitorScores: [
        { name: 'Competitor A', score: 85 },
        { name: 'Competitor B', score: 79 },
        { name: 'Competitor C', score: 87 }
      ],
      trend: 'up',
      insight: 'Strong SEO performance, close to industry leaders'
    },
    {
      category: 'User Experience',
      userScore: 74,
      industryAverage: 79,
      topPerformer: 89,
      competitorScores: [
        { name: 'Competitor A', score: 81 },
        { name: 'Competitor B', score: 78 },
        { name: 'Competitor C', score: 89 }
      ],
      trend: 'down',
      insight: 'Below industry average - priority area for improvement'
    },
    {
      category: 'Content Quality',
      userScore: 79,
      industryAverage: 73,
      topPerformer: 86,
      competitorScores: [
        { name: 'Competitor A', score: 83 },
        { name: 'Competitor B', score: 77 },
        { name: 'Competitor C', score: 86 }
      ],
      trend: 'stable',
      insight: 'Above average content quality with growth potential'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-400" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getScoreColor = (score: number, average?: number) => {
    if (average) {
      if (score > average + 5) return 'text-green-400';
      if (score < average - 5) return 'text-red-400';
      return 'text-yellow-400';
    }
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Market Position Overview */}
      <Card className="bg-white/5 border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            Competitive Intelligence
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-white/20 text-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="border-white/20 text-gray-300">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Market Position</h4>
            <p className="text-gray-300 mb-4">{marketPosition}</p>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Competitive Strength</div>
              <div className="flex items-center gap-3">
                <Progress value={76} className="flex-1" />
                <span className="text-lg font-bold text-blue-400">76%</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Key Metrics vs Competition</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-400 mb-1">Market Rank</div>
                <div className="text-xl font-bold text-green-400">#2</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-400 mb-1">Growth Rate</div>
                <div className="text-xl font-bold text-blue-400">+12%</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-400 mb-1">Traffic Share</div>
                <div className="text-xl font-bold text-purple-400">26.5%</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-400 mb-1">Feature Gap</div>
                <div className="text-xl font-bold text-yellow-400">-3</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Competitive Landscape */}
          <div className="grid md:grid-cols-3 gap-4">
            {mockCompetitors.map((competitor, index) => (
              <Card 
                key={competitor.url} 
                className={`bg-white/5 border-white/10 p-4 cursor-pointer transition-all hover:bg-white/10 ${
                  selectedCompetitor === competitor.url ? 'ring-2 ring-purple-400' : ''
                }`}
                onClick={() => setSelectedCompetitor(competitor.url)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{competitor.name}</h4>
                    <p className="text-xs text-gray-400">{competitor.url}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getScoreColor(competitor.overallScore)}`}>
                      {competitor.overallScore}
                    </div>
                    <div className="text-xs text-gray-400">Overall Score</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Market Share</span>
                    <span className="text-white">{competitor.marketShare}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Traffic</span>
                    <span className="text-white">{formatNumber(competitor.trafficEstimate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Keywords</span>
                    <span className="text-white">{formatNumber(competitor.keywordCount)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Selected Competitor Details */}
          {selectedCompetitor && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {(() => {
                const competitor = mockCompetitors.find(c => c.url === selectedCompetitor);
                if (!competitor) return null;

                return (
                  <>
                    <Card className="bg-white/5 border-white/10 p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">
                        {competitor.name} - Detailed Analysis
                      </h4>
                      
                      <div className="grid md:grid-cols-5 gap-4 mb-6">
                        {Object.entries(competitor.metrics).map(([metric, score]) => (
                          <div key={metric} className="text-center">
                            <div className="text-sm text-gray-400 mb-1 capitalize">{metric}</div>
                            <div className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</div>
                            <Progress value={score} className="h-1 mt-1" />
                          </div>
                        ))}
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Strengths
                          </h5>
                          <ul className="space-y-2">
                            {competitor.strengths.map((strength, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Weaknesses
                          </h5>
                          <ul className="space-y-2">
                            {competitor.weaknesses.map((weakness, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-400" />
                            Opportunity Gaps
                          </h5>
                          <ul className="space-y-2">
                            {competitor.opportunityGaps.map((gap, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                                {gap}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  </>
                );
              })()}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6 mt-6">
          {mockBenchmarks.map((benchmark, index) => (
            <Card key={index} className="bg-white/5 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  {getTrendIcon(benchmark.trend)}
                  {benchmark.category}
                </h4>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(benchmark.userScore, benchmark.industryAverage)}`}>
                    {benchmark.userScore}
                  </div>
                  <div className="text-xs text-gray-400">Your Score</div>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-4">{benchmark.insight}</p>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Your Score</div>
                  <div className={`text-xl font-bold ${getScoreColor(benchmark.userScore, benchmark.industryAverage)}`}>
                    {benchmark.userScore}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Industry Average</div>
                  <div className="text-xl font-bold text-gray-300">
                    {benchmark.industryAverage}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Top Performer</div>
                  <div className="text-xl font-bold text-green-400">
                    {benchmark.topPerformer}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Gap to Top</div>
                  <div className="text-xl font-bold text-purple-400">
                    -{benchmark.topPerformer - benchmark.userScore}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Your Position</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-white/10 rounded-full h-3 relative">
                      <div 
                        className="bg-blue-400 h-3 rounded-full"
                        style={{ width: `${(benchmark.userScore / benchmark.topPerformer) * 100}%` }}
                      />
                      <div 
                        className="absolute top-0 bg-yellow-400 h-3 w-1 rounded-full"
                        style={{ left: `${(benchmark.industryAverage / benchmark.topPerformer) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">Top</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  {benchmark.competitorScores.map((comp, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-400 mb-1">{comp.name}</div>
                      <div className={`text-sm font-bold ${getScoreColor(comp.score)}`}>
                        {comp.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6 mt-6">
          <div className="space-y-4">
            {mockCompetitors.map((competitor, index) => (
              <Card key={competitor.url} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {competitor.name.charAt(competitor.name.length - 1)}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{competitor.name}</h4>
                      <p className="text-sm text-gray-400">{competitor.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" className="border-white/20 text-gray-300">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Site
                    </Button>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(competitor.overallScore)}`}>
                        {competitor.overallScore}
                      </div>
                      <div className="text-xs text-gray-400">Overall Score</div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-5 gap-4">
                  {Object.entries(competitor.metrics).map(([metric, score]) => (
                    <div key={metric} className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400 mb-1 capitalize">{metric}</div>
                      <div className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</div>
                      <Progress value={score} className="h-1 mt-2" />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10 p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Market Opportunities
              </h4>
              <div className="space-y-3">
                {[
                  'AI-powered features gap in 67% of competitors',
                  'Mobile optimization advantage opportunity',
                  'Untapped international markets (EU, APAC)',
                  'Voice search optimization potential',
                  'Video content marketing gap'
                ].map((opportunity, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{opportunity}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Competitive Advantages
              </h4>
              <div className="space-y-3">
                {[
                  'Superior page load speeds vs 73% of competitors',
                  'Better accessibility scores than industry average',
                  'More comprehensive documentation',
                  'Stronger developer community',
                  'Advanced analytics and reporting'
                ].map((advantage, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Award className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{advantage}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="bg-white/5 border-white/10 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Strategic Recommendations</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">Short Term (1-3 months)</h5>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Improve mobile UX to match Competitor C</li>
                  <li>• Implement schema markup for rich snippets</li>
                  <li>• Add video content to product pages</li>
                  <li>• Optimize Core Web Vitals</li>
                </ul>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">Medium Term (3-6 months)</h5>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Launch AI-powered features</li>
                  <li>• Expand content marketing strategy</li>
                  <li>• Improve accessibility scores</li>
                  <li>• Build strategic partnerships</li>
                </ul>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">Long Term (6+ months)</h5>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• International market expansion</li>
                  <li>• Advanced analytics platform</li>
                  <li>• Voice search optimization</li>
                  <li>• Industry thought leadership</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitiveIntelligence;