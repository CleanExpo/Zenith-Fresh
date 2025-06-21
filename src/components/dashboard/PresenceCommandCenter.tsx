'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Globe, 
  Star, 
  MessageSquare, 
  Calendar,
  TrendingUp, 
  MapPin,
  Share2,
  BarChart3,
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  Settings,
  ExternalLink,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Enhanced interfaces
interface ApiError {
  message: string;
  code?: string;
  retryable?: boolean;
}

interface GmbData {
  reviews: any[];
  summary: {
    averageRating: number;
    totalReviews: number;
    unreplied: number;
    recentRating: number;
  };
  businessInfo: any;
  health: {
    score: number;
    issues: Array<{
      type: 'error' | 'warning' | 'success';
      message: string;
      actionable?: boolean;
    }>;
  };
}

interface SocialData {
  facebook: { followers: number; engagement: number; locked: boolean; lastUpdated?: string };
  instagram: { followers: number; engagement: number; locked: boolean; lastUpdated?: string };
  x: { followers: number; engagement: number; locked: boolean; lastUpdated?: string };
  linkedin: { followers: number; engagement: number; locked: boolean; lastUpdated?: string };
}

interface KeywordData {
  keyword: string;
  position: number;
  volume: number;
  difficulty: 'Low' | 'Medium' | 'High';
  change: number;
  url?: string;
}

interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  lastUpdated: Date | null;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  locked?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, locked = false }) => {
  return (
    <Card className={`p-6 ${locked ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          {icon}
        </div>
        {locked && <Lock className="w-4 h-4 text-gray-400" />}
      </div>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-2xl font-bold mt-2">{locked ? '---' : value}</p>
      {change !== undefined && !locked && (
        <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </Card>
  );
};

export default function PresenceCommandCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Enhanced state management with proper typing
  const [gmbState, setGmbState] = useState<DataState<GmbData>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [socialState, setSocialState] = useState<DataState<SocialData>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [keywordState, setKeywordState] = useState<DataState<KeywordData[]>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  // Enhanced API call with retry logic
  const makeApiCall = useCallback(async <T>(
    url: string,
    options?: RequestInit
  ): Promise<T> => {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication errors
        if (lastError.message.includes('401') || lastError.message.includes('403')) {
          throw lastError;
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
        );
      }
    }
    
    throw lastError!;
  }, []);

  // Fetch GMB data with enhanced error handling
  const fetchGmbData = useCallback(async () => {
    setGmbState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [reviewsData, businessData, healthData] = await Promise.allSettled([
        makeApiCall<any>('/api/presence/gmb/reviews'),
        makeApiCall<any>('/api/presence/gmb/business'),
        makeApiCall<any>('/api/presence/gmb/health')
      ]);

      // Process results and handle partial failures
      const gmbData: GmbData = {
        reviews: reviewsData.status === 'fulfilled' ? reviewsData.value.reviews || [] : [],
        summary: reviewsData.status === 'fulfilled' ? reviewsData.value.summary || {
          averageRating: 0,
          totalReviews: 0,
          unreplied: 0,
          recentRating: 0
        } : {
          averageRating: 0,
          totalReviews: 0,
          unreplied: 0,
          recentRating: 0
        },
        businessInfo: businessData.status === 'fulfilled' ? businessData.value : null,
        health: healthData.status === 'fulfilled' ? healthData.value : {
          score: 0,
          issues: [{
            type: 'error' as const,
            message: 'Unable to check GMB health. Please verify your connection.',
            actionable: true
          }]
        }
      };

      setGmbState({
        data: gmbData,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('GMB Data Fetch Error:', error);
      setGmbState({
        data: null,
        loading: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch GMB data',
          retryable: true
        },
        lastUpdated: null
      });
    }
  }, [makeApiCall]);

  // Fetch social media data
  const fetchSocialData = useCallback(async () => {
    setSocialState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const socialData = await makeApiCall<SocialData>('/api/presence/social/stats');
      setSocialState({
        data: socialData,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Social Data Fetch Error:', error);
      // Fallback to partial data
      setSocialState({
        data: {
          facebook: { followers: 0, engagement: 0, locked: true },
          instagram: { followers: 0, engagement: 0, locked: true },
          x: { followers: 0, engagement: 0, locked: true },
          linkedin: { followers: 0, engagement: 0, locked: true }
        },
        loading: false,
        error: {
          message: 'Social media connections not configured',
          retryable: false
        },
        lastUpdated: null
      });
    }
  }, [makeApiCall]);

  // Fetch keyword ranking data
  const fetchKeywordData = useCallback(async () => {
    setKeywordState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const keywordData = await makeApiCall<KeywordData[]>('/api/presence/keywords/rankings');
      setKeywordState({
        data: keywordData,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Keyword Data Fetch Error:', error);
      // Fallback to mock data for demo
      setKeywordState({
        data: [
          { keyword: 'best plumber ipswich', position: 3, volume: 480, difficulty: 'Medium', change: 2 },
          { keyword: 'emergency plumber near me', position: 5, volume: 1200, difficulty: 'High', change: -1 },
          { keyword: 'plumbing services', position: 8, volume: 3600, difficulty: 'High', change: 0 }
        ],
        loading: false,
        error: {
          message: 'Using demo keyword data. Connect DataForSEO for live rankings.',
          retryable: false
        },
        lastUpdated: new Date()
      });
    }
  }, [makeApiCall]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchGmbData(),
      fetchSocialData(),
      fetchKeywordData()
    ]);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  }, [fetchGmbData, fetchSocialData, fetchKeywordData]);

  // Initial data load
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  // Extract data for display
  const gmbData = gmbState.data;
  const socialData = socialState.data;
  const keywordData = keywordState.data || [];
  const isLoading = gmbState.loading || socialState.loading || keywordState.loading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Presence Command Center</h1>
          <p className="text-gray-600 mt-1">Monitor and optimize your online presence in real-time</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
          Generate Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="GMB Health Score"
          value={gmbData?.health?.score ? `${gmbData.health.score}%` : "---"}
          change={5}
          icon={<Globe className="w-5 h-5 text-blue-600" />}
          locked={!gmbData?.health}
        />
        <MetricCard
          title="Average Rating"
          value={gmbData?.summary?.averageRating?.toFixed(1) || "---"}
          change={2}
          icon={<Star className="w-5 h-5 text-yellow-600" />}
          locked={!gmbData?.summary}
        />
        <MetricCard
          title="Unread Reviews"
          value={gmbData?.summary?.unreplied || 0}
          icon={<MessageSquare className="w-5 h-5 text-purple-600" />}
          locked={!gmbData?.summary}
        />
        <MetricCard
          title="Social Reach"
          value="2.6K"
          change={12}
          icon={<Share2 className="w-5 h-5 text-green-600" />}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="seo">SEO & Rankings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GMB Health Check */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Google Business Profile Health</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 relative">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                      <circle 
                        cx="48" 
                        cy="48" 
                        r="36" 
                        stroke="#3b82f6" 
                        strokeWidth="8" 
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - gmbHealth.score / 100)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{gmbHealth.score}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Overall Health</p>
                    <p className="text-2xl font-bold text-green-600">Excellent</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {gmbHealth.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    {issue.type === 'warning' ? (
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    )}
                    <p className="text-sm">{issue.message}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Social Posts
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Respond to Reviews
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Optimize Keywords
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Lock className="w-4 h-4 mr-2" />
                  AI Content Generator (Pro)
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Reviews</h3>
              <Badge variant="secondary">{reviewSummary?.unreplied || 0} need reply</Badge>
            </div>
            {isLoadingReviews ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading reviews...</span>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{review.author}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{review.text}</p>
                    {!review.replied && (
                      <Button size="sm" variant="outline">Reply</Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No reviews found</p>
                <p className="text-sm mt-1">Connect your Google Business Profile to see reviews</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(socialStats).map(([platform, stats]) => (
              <Card key={platform} className={`p-6 ${stats.locked ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-sm font-medium capitalize">{platform}</h4>
                  {stats.locked && <Lock className="w-4 h-4 text-gray-400" />}
                </div>
                <p className="text-2xl font-bold mb-1">
                  {stats.locked ? '---' : stats.followers.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">followers</p>
                {!stats.locked && (
                  <p className="text-sm text-green-600 mt-2">
                    {stats.engagement}% engagement
                  </p>
                )}
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Unified Social Publisher</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-yellow-600" />
                <p className="text-sm">
                  <span className="font-medium">Upgrade to Business</span> to unlock cross-platform posting
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* SEO & Rankings Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Keyword Rankings</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b">
                    <th className="pb-2">Keyword</th>
                    <th className="pb-2">Position</th>
                    <th className="pb-2">Volume</th>
                    <th className="pb-2">Difficulty</th>
                    <th className="pb-2">Change</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {keywordRankings.map((kw, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3">{kw.keyword}</td>
                      <td className="py-3">
                        <Badge variant={kw.position <= 3 ? 'default' : 'secondary'}>
                          #{kw.position}
                        </Badge>
                      </td>
                      <td className="py-3">{kw.volume.toLocaleString()}</td>
                      <td className="py-3">
                        <Badge 
                          variant={kw.difficulty === 'High' ? 'destructive' : kw.difficulty === 'Medium' ? 'secondary' : 'default'}
                        >
                          {kw.difficulty}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {kw.change !== 0 && (
                          <span className={`flex items-center gap-1 ${kw.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {kw.change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {Math.abs(kw.change)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Local Rank Grid</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-600" />
                <p className="text-sm">
                  <span className="font-medium">Pro Feature:</span> See your GMB ranking across your service area
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
