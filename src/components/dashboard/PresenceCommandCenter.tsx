'use client';

import React, { useState } from 'react';
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
  ArrowDownRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  // Mock data - replace with real API calls
  const gmbHealth = {
    score: 87,
    issues: [
      { type: 'warning', message: 'Business hours not set for holidays' },
      { type: 'success', message: 'All NAP fields complete and verified' }
    ]
  };

  const reviews = [
    { id: 1, author: 'Sarah M.', rating: 5, text: 'Excellent service! Highly recommend.', replied: false, date: '2 days ago' },
    { id: 2, author: 'John D.', rating: 4, text: 'Good experience overall.', replied: true, date: '1 week ago' }
  ];

  const socialStats = {
    facebook: { followers: 1234, engagement: 5.2, locked: false },
    instagram: { followers: 892, engagement: 7.8, locked: false },
    x: { followers: 567, engagement: 3.4, locked: false },
    linkedin: { followers: 0, engagement: 0, locked: true }
  };

  const keywordRankings = [
    { keyword: 'best plumber ipswich', position: 3, volume: 480, difficulty: 'Medium', change: 2 },
    { keyword: 'emergency plumber near me', position: 5, volume: 1200, difficulty: 'High', change: -1 },
    { keyword: 'plumbing services', position: 8, volume: 3600, difficulty: 'High', change: 0 }
  ];

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
          value={`${gmbHealth.score}%`}
          change={5}
          icon={<Globe className="w-5 h-5 text-blue-600" />}
        />
        <MetricCard
          title="Average Rating"
          value="4.8"
          change={2}
          icon={<Star className="w-5 h-5 text-yellow-600" />}
        />
        <MetricCard
          title="Unread Reviews"
          value="3"
          icon={<MessageSquare className="w-5 h-5 text-purple-600" />}
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
              <Badge variant="secondary">3 new</Badge>
            </div>
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
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{review.text}</p>
                  {!review.replied && (
                    <Button size="sm" variant="outline">Reply</Button>
                  )}
                </div>
              ))}
            </div>
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
