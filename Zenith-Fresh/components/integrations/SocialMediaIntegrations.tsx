/**
 * Social Media Integrations Component
 * Manages Buffer, Hootsuite, and other social media management platforms
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Share2,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  MessageSquare,
  Heart,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  Image,
  Video,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Settings,
  Link,
  Unlink,
  Download,
  Upload,
  Edit,
  Trash2,
  Send,
  Eye,
  BarChart3,
  Target,
  Globe,
  ThumbsUp,
  Repeat,
  ExternalLink,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';
import { SocialPost, SocialAccount } from '@/types/integrations';

interface SocialProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  features: string[];
  supported: boolean;
  authType: 'oauth2' | 'api_key';
  color: string;
  platforms?: string[];
}

const socialProviders: SocialProvider[] = [
  {
    id: 'buffer',
    name: 'Buffer',
    logo: '📱',
    description: 'Social media scheduling and analytics',
    features: ['Post Scheduling', 'Analytics', 'Team Collaboration', 'Content Calendar'],
    supported: true,
    authType: 'oauth2',
    color: 'bg-blue-500',
    platforms: ['twitter', 'facebook', 'instagram', 'linkedin']
  },
  {
    id: 'hootsuite',
    name: 'Hootsuite',
    logo: '🦉',
    description: 'Social media management platform',
    features: ['Publishing', 'Monitoring', 'Analytics', 'Team Management'],
    supported: true,
    authType: 'oauth2',
    color: 'bg-orange-500',
    platforms: ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube']
  },
  {
    id: 'sprout-social',
    name: 'Sprout Social',
    logo: '🌱',
    description: 'Social media management and optimization',
    features: ['Publishing', 'Engagement', 'Analytics', 'Social Listening'],
    supported: true,
    authType: 'api_key',
    color: 'bg-green-500',
    platforms: ['twitter', 'facebook', 'instagram', 'linkedin']
  },
  {
    id: 'later',
    name: 'Later',
    logo: '📅',
    description: 'Visual social media scheduler',
    features: ['Visual Planning', 'Auto Publishing', 'Analytics', 'User-Generated Content'],
    supported: false,
    authType: 'oauth2',
    color: 'bg-purple-500',
    platforms: ['instagram', 'facebook', 'twitter', 'pinterest']
  },
  {
    id: 'socialbee',
    name: 'SocialBee',
    logo: '🐝',
    description: 'Social media management tool',
    features: ['Content Categorization', 'RSS Feeds', 'Team Collaboration', 'Analytics'],
    supported: false,
    authType: 'api_key',
    color: 'bg-yellow-500',
    platforms: ['twitter', 'facebook', 'instagram', 'linkedin']
  }
];

// Mock data
const mockPosts: SocialPost[] = [
  {
    id: '1',
    platform: 'twitter',
    content: 'Excited to announce our new product launch! 🚀 Check out the amazing features that will transform your workflow. #ProductLaunch #Innovation',
    status: 'published',
    publishedAt: new Date('2024-06-25T10:00:00'),
    metrics: {
      likes: 245,
      shares: 67,
      comments: 23,
      impressions: 3200,
      engagement: 10.5
    }
  },
  {
    id: '2',
    platform: 'linkedin',
    content: 'Join us for an exclusive webinar on digital transformation strategies. Learn from industry experts and network with professionals.',
    status: 'scheduled',
    scheduledAt: new Date('2024-06-26T14:00:00'),
    metrics: {
      likes: 0,
      shares: 0,
      comments: 0,
      impressions: 0,
      engagement: 0
    }
  },
  {
    id: '3',
    platform: 'facebook',
    content: 'Behind the scenes look at our team working on the next big update. We\'re passionate about delivering the best experience for our users! 💪',
    mediaUrls: ['https://example.com/image1.jpg'],
    status: 'draft',
    metrics: {
      likes: 0,
      shares: 0,
      comments: 0,
      impressions: 0,
      engagement: 0
    }
  }
];

const mockAccounts: SocialAccount[] = [
  {
    id: '1',
    platform: 'twitter',
    username: '@zenithplatform',
    displayName: 'Zenith Platform',
    verified: true,
    followers: 12456,
    following: 890,
    profileImage: 'https://example.com/profile.jpg',
    connected: true
  },
  {
    id: '2',
    platform: 'linkedin',
    username: 'zenith-platform',
    displayName: 'Zenith Platform',
    verified: false,
    followers: 3456,
    following: 567,
    profileImage: 'https://example.com/profile.jpg',
    connected: true
  },
  {
    id: '3',
    platform: 'facebook',
    username: 'zenithplatform',
    displayName: 'Zenith Platform',
    verified: false,
    followers: 8923,
    following: 234,
    profileImage: 'https://example.com/profile.jpg',
    connected: false
  }
];

export default function SocialMediaIntegrations() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [activeConnections, setActiveConnections] = useState<string[]>(['buffer', 'hootsuite']);
  const [configForm, setConfigForm] = useState({
    provider: '',
    apiKey: '',
    enableAutoPosting: true,
    defaultSchedule: 'optimal',
    trackMentions: true
  });
  const [postForm, setPostForm] = useState({
    content: '',
    platforms: [] as string[],
    scheduleType: 'now',
    scheduleTime: '',
    mediaFiles: [] as File[]
  });

  // Platform icons mapping
  const platformIcons = {
    twitter: Twitter,
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube
  };

  // Handle connection
  const handleConnect = useCallback(async (providerId: string) => {
    const provider = socialProviders.find(p => p.id === providerId);
    if (provider?.authType === 'oauth2') {
      // Simulate OAuth flow
      window.open(`/api/integrations/oauth/${providerId}`, '_blank', 'width=600,height=700');
    } else {
      setSelectedProvider(providerId);
      setShowAddDialog(true);
    }
  }, []);

  // Handle disconnection
  const handleDisconnect = useCallback(async (providerId: string) => {
    if (confirm(`Are you sure you want to disconnect ${providerId}?`)) {
      setActiveConnections(prev => prev.filter(id => id !== providerId));
    }
  }, []);

  // Handle sync
  const handleSync = useCallback(async (providerId: string) => {
    setSyncInProgress(true);
    setTimeout(() => {
      setSyncInProgress(false);
    }, 3000);
  }, []);

  // Save configuration
  const handleSaveConfig = useCallback(() => {
    if (configForm.provider) {
      setActiveConnections(prev => [...prev, configForm.provider]);
      setShowAddDialog(false);
      setConfigForm({
        provider: '',
        apiKey: '',
        enableAutoPosting: true,
        defaultSchedule: 'optimal',
        trackMentions: true
      });
    }
  }, [configForm]);

  // Handle post creation
  const handleCreatePost = useCallback(() => {
    // In production, this would send the post to the selected social media platforms
    console.log('Creating post:', postForm);
    setShowPostDialog(false);
    setPostForm({
      content: '',
      platforms: [],
      scheduleType: 'now',
      scheduleTime: '',
      mediaFiles: []
    });
  }, [postForm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Social Media Integrations</h2>
          <p className="text-gray-600">Connect and manage your social media management platforms</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowPostDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Post
          </Button>
          <Button variant="outline" onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Platform
          </Button>
        </div>
      </div>

      {/* Social Media Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {socialProviders.map((provider) => {
          const isConnected = activeConnections.includes(provider.id);
          
          return (
            <Card key={provider.id} className={`relative ${!provider.supported ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${provider.color} flex items-center justify-center text-2xl`}>
                      {provider.logo}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  {isConnected && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {provider.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  {provider.platforms && (
                    <div className="flex gap-2">
                      {provider.platforms.map((platform) => {
                        const Icon = platformIcons[platform as keyof typeof platformIcons];
                        return Icon ? (
                          <div key={platform} className="w-6 h-6 text-gray-600">
                            <Icon className="w-full h-full" />
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                  
                  {provider.supported ? (
                    <div className="flex gap-2">
                      {!isConnected ? (
                        <Button 
                          onClick={() => handleConnect(provider.id)}
                          className="flex-1"
                        >
                          <Link className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => handleSync(provider.id)}
                            disabled={syncInProgress}
                            className="flex-1"
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
                            Sync
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleDisconnect(provider.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      Coming Soon
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connected Social Media Overview */}
      {activeConnections.length > 0 && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Followers</p>
                      <p className="text-2xl font-bold">24,835</p>
                      <p className="text-xs text-green-600 mt-1">+5.2% this month</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Posts Published</p>
                      <p className="text-2xl font-bold">156</p>
                      <p className="text-xs text-green-600 mt-1">+12 this week</p>
                    </div>
                    <Send className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                      <p className="text-2xl font-bold">8.4%</p>
                      <p className="text-xs text-green-600 mt-1">+1.2% vs last month</p>
                    </div>
                    <Heart className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reach</p>
                      <p className="text-2xl font-bold">145K</p>
                      <p className="text-xs text-green-600 mt-1">+8.9% this month</p>
                    </div>
                    <Eye className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Twitter className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Twitter</p>
                          <p className="text-sm text-gray-600">12,456 followers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">8.2%</p>
                        <p className="text-xs text-gray-600">engagement</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Linkedin className="h-5 w-5 text-blue-700" />
                        <div>
                          <p className="font-medium">LinkedIn</p>
                          <p className="text-sm text-gray-600">3,456 followers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">12.5%</p>
                        <p className="text-xs text-gray-600">engagement</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Facebook className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Facebook</p>
                          <p className="text-sm text-gray-600">8,923 followers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-400">-</p>
                        <p className="text-xs text-gray-600">not connected</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <Twitter className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium">New post published</p>
                        <p className="text-sm text-gray-600">Product launch announcement • 2 hours ago</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Published</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <Linkedin className="h-5 w-5 text-blue-700" />
                      <div className="flex-1">
                        <p className="font-medium">Post scheduled</p>
                        <p className="text-sm text-gray-600">Webinar promotion • Tomorrow 2:00 PM</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <Heart className="h-5 w-5 text-red-500" />
                      <div className="flex-1">
                        <p className="font-medium">High engagement alert</p>
                        <p className="text-sm text-gray-600">Twitter post reached 100+ likes • 4 hours ago</p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">Alert</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Social Media Posts</CardTitle>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setShowPostDialog(true)} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Post
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPosts.map((post) => {
                    const PlatformIcon = platformIcons[post.platform as keyof typeof platformIcons];
                    
                    return (
                      <div key={post.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {PlatformIcon && <PlatformIcon className="h-5 w-5" />}
                            <div className="flex-1">
                              <p className="font-medium capitalize">{post.platform}</p>
                              <Badge className={
                                post.status === 'published' ? 'bg-green-100 text-green-800' :
                                post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {post.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{post.content}</p>
                        
                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                          <div className="flex gap-2 mb-3">
                            {post.mediaUrls.map((url, index) => (
                              <div key={index} className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                <Image className="h-8 w-8 text-gray-400" />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <div className="flex gap-4">
                            {post.status === 'published' ? (
                              <>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  {post.metrics?.likes}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Repeat className="h-4 w-4" />
                                  {post.metrics?.shares}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  {post.metrics?.comments}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  {post.metrics?.impressions}
                                </span>
                              </>
                            ) : post.status === 'scheduled' ? (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Scheduled for {post.scheduledAt?.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-500">Draft</span>
                            )}
                          </div>
                          {post.publishedAt && (
                            <span>{post.publishedAt.toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Connected Accounts</CardTitle>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Connect Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAccounts.map((account) => {
                    const PlatformIcon = platformIcons[account.platform as keyof typeof platformIcons];
                    
                    return (
                      <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {PlatformIcon && <PlatformIcon className="h-6 w-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{account.displayName}</p>
                              {account.verified && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{account.username}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <span>{account.followers.toLocaleString()} followers</span>
                              <span>{account.following.toLocaleString()} following</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={
                            account.connected 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }>
                            {account.connected ? 'Connected' : 'Disconnected'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          {account.connected && (
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Likes</span>
                      <span className="font-semibold">2,456</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Shares</span>
                      <span className="font-semibold">567</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Comments</span>
                      <span className="font-semibold">189</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Click-through Rate</span>
                      <span className="font-semibold">3.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audience Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>New Followers (30d)</span>
                      <span className="font-semibold text-green-600">+1,234</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unfollows (30d)</span>
                      <span className="font-semibold text-red-600">-89</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Growth</span>
                      <span className="font-semibold text-green-600">+1,145</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Growth Rate</span>
                      <span className="font-semibold">4.8%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Twitter className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Product Launch Announcement</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Likes</p>
                        <p className="font-semibold">245</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Shares</p>
                        <p className="font-semibold">67</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Comments</p>
                        <p className="font-semibold">23</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Engagement</p>
                        <p className="font-semibold">10.5%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Content calendar view will be implemented here</p>
                  <p className="text-sm">Shows scheduled posts across all platforms</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Integration Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Default Posting Schedule</Label>
                    <Select defaultValue="optimal">
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="optimal">Optimal Times</SelectItem>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="custom">Custom Schedule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-cross post</Label>
                      <p className="text-sm text-gray-600">Automatically post to multiple platforms</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Track Mentions</Label>
                      <p className="text-sm text-gray-600">Monitor brand mentions across platforms</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Engagement Notifications</Label>
                      <p className="text-sm text-gray-600">Get notified about high engagement posts</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full">Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Add Integration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Social Media Integration</DialogTitle>
            <DialogDescription>
              Enter your social media platform credentials to establish connection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Social Media Platform</Label>
              <Select 
                value={configForm.provider} 
                onValueChange={(value) => setConfigForm(prev => ({ ...prev, provider: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {socialProviders.filter(p => p.supported && p.authType === 'api_key').map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {configForm.provider === 'sprout-social' && (
              <div>
                <Label>API Key</Label>
                <Input 
                  type="password" 
                  placeholder="Your Sprout Social API key"
                  value={configForm.apiKey}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="mt-2"
                />
              </div>
            )}

            <div>
              <Label>Default Schedule</Label>
              <Select 
                value={configForm.defaultSchedule} 
                onValueChange={(value) => setConfigForm(prev => ({ ...prev, defaultSchedule: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="optimal">Optimal Times</SelectItem>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable Auto-posting</Label>
              <Switch 
                checked={configForm.enableAutoPosting}
                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, enableAutoPosting: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig}>
              Connect Platform
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Social Media Post</DialogTitle>
            <DialogDescription>
              Create and schedule a post for your connected social media platforms
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Post Content</Label>
              <Textarea 
                placeholder="What's happening?"
                value={postForm.content}
                onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                className="mt-2 min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">{postForm.content.length}/280 characters</p>
            </div>

            <div>
              <Label>Platforms</Label>
              <div className="flex gap-2 mt-2">
                {Object.entries(platformIcons).map(([platform, Icon]) => (
                  <Button
                    key={platform}
                    type="button"
                    variant={postForm.platforms.includes(platform) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setPostForm(prev => ({
                        ...prev,
                        platforms: prev.platforms.includes(platform)
                          ? prev.platforms.filter(p => p !== platform)
                          : [...prev.platforms, platform]
                      }));
                    }}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {platform}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Schedule</Label>
              <Select 
                value={postForm.scheduleType} 
                onValueChange={(value) => setPostForm(prev => ({ ...prev, scheduleType: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Post Now</SelectItem>
                  <SelectItem value="optimal">Optimal Time</SelectItem>
                  <SelectItem value="custom">Custom Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {postForm.scheduleType === 'custom' && (
              <div>
                <Label>Schedule Time</Label>
                <Input 
                  type="datetime-local"
                  value={postForm.scheduleTime}
                  onChange={(e) => setPostForm(prev => ({ ...prev, scheduleTime: e.target.value }))}
                  className="mt-2"
                />
              </div>
            )}

            <div>
              <Label>Media (Optional)</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload images or videos</p>
                <Input type="file" multiple accept="image/*,video/*" className="hidden" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePost}>
              {postForm.scheduleType === 'now' ? 'Post Now' : 'Schedule Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}