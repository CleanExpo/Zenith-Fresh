'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  EyeIcon, 
  UserIcon, 
  GlobeAltIcon, 
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  ClockIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

interface UserSession {
  id: string;
  userId?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: {
    country: string;
    city: string;
    region: string;
  };
  startTime: number;
  lastActivity: number;
  pageViews: number;
  currentPage: string;
  referrer?: string;
  duration: number;
  status: 'active' | 'idle' | 'disconnected';
}

interface ActivityMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number; uniqueUsers: number }>;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  trafficSources: Array<{ source: string; users: number; percentage: number }>;
}

interface PageView {
  page: string;
  timestamp: number;
  duration: number;
  exitPage: boolean;
}

// Simple activity chart component
function ActivityChart({ data, height = 200 }: { data: any[]; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    // Prepare data
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = width / data.length;

    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * canvasHeight * 0.8;
      const x = index * barWidth;
      const y = canvasHeight - barHeight - 20;

      // Bar
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

      // Label
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, canvasHeight - 5);
      
      // Value
      ctx.fillStyle = '#1F2937';
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
    });

  }, [data]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={height}
      className="w-full border rounded"
    />
  );
}

export function UserActivityTracker() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1h');

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoading(true);
        
        // Generate mock user activity data
        const mockSessions = generateMockSessions();
        const mockMetrics = calculateMetrics(mockSessions);
        
        setSessions(mockSessions);
        setMetrics(mockMetrics);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch user activity:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivityData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const generateMockSessions = (): UserSession[] => {
    const sessions: UserSession[] = [];
    const now = Date.now();
    
    // Generate 20-50 active sessions
    const sessionCount = Math.floor(Math.random() * 30) + 20;
    
    const pages = [
      '/dashboard', '/monitoring', '/analytics', '/tools/website-analyzer',
      '/tools/ai-analysis', '/team', '/settings', '/billing', '/', '/auth/signin'
    ];
    
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const countries = ['US', 'GB', 'CA', 'DE', 'FR', 'AU', 'JP', 'BR'];
    const cities = ['New York', 'London', 'Toronto', 'Berlin', 'Paris', 'Sydney', 'Tokyo', 'São Paulo'];
    
    for (let i = 0; i < sessionCount; i++) {
      const startTime = now - Math.random() * 3600000; // Random start in last hour
      const lastActivity = startTime + Math.random() * (now - startTime);
      const duration = lastActivity - startTime;
      
      const isActive = now - lastActivity < 300000; // Active if activity in last 5 minutes
      const isIdle = now - lastActivity < 900000 && !isActive; // Idle if activity in last 15 minutes
      
      sessions.push({
        id: `session-${i}`,
        userId: Math.random() > 0.3 ? `user-${Math.floor(Math.random() * 100)}` : undefined,
        sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
        ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: `${browsers[Math.floor(Math.random() * browsers.length)]}/99.0`,
        device: Math.random() > 0.7 ? 'mobile' : Math.random() > 0.8 ? 'tablet' : 'desktop',
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        location: {
          country: countries[Math.floor(Math.random() * countries.length)],
          city: cities[Math.floor(Math.random() * cities.length)],
          region: 'Unknown'
        },
        startTime,
        lastActivity,
        pageViews: Math.floor(Math.random() * 10) + 1,
        currentPage: pages[Math.floor(Math.random() * pages.length)],
        referrer: Math.random() > 0.5 ? 'https://google.com' : undefined,
        duration,
        status: isActive ? 'active' : isIdle ? 'idle' : 'disconnected'
      });
    }
    
    return sessions.sort((a, b) => b.lastActivity - a.lastActivity);
  };

  const calculateMetrics = (sessions: UserSession[]): ActivityMetrics => {
    const totalUsers = sessions.length;
    const activeUsers = sessions.filter(s => s.status === 'active').length;
    const newUsers = sessions.filter(s => !s.userId).length;
    const returningUsers = totalUsers - newUsers;
    
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const averageSessionDuration = totalDuration / totalUsers / 1000; // Convert to seconds
    
    const bounceRate = sessions.filter(s => s.pageViews === 1).length / totalUsers * 100;
    
    // Top pages
    const pageViews: { [key: string]: { views: number; users: Set<string> } } = {};
    sessions.forEach(session => {
      if (!pageViews[session.currentPage]) {
        pageViews[session.currentPage] = { views: 0, users: new Set() };
      }
      pageViews[session.currentPage].views += session.pageViews;
      pageViews[session.currentPage].users.add(session.sessionId);
    });
    
    const topPages = Object.entries(pageViews)
      .map(([page, data]) => ({
        page,
        views: data.views,
        uniqueUsers: data.users.size
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
    
    // Device breakdown
    const deviceBreakdown = {
      desktop: sessions.filter(s => s.device === 'desktop').length,
      mobile: sessions.filter(s => s.device === 'mobile').length,
      tablet: sessions.filter(s => s.device === 'tablet').length
    };
    
    // Traffic sources
    const sources: { [key: string]: number } = {};
    sessions.forEach(session => {
      const source = session.referrer ? 'Referral' : 'Direct';
      sources[source] = (sources[source] || 0) + 1;
    });
    
    const trafficSources = Object.entries(sources)
      .map(([source, users]) => ({
        source,
        users,
        percentage: (users / totalUsers) * 100
      }))
      .sort((a, b) => b.users - a.users);
    
    return {
      totalUsers,
      activeUsers,
      newUsers,
      returningUsers,
      averageSessionDuration,
      bounceRate,
      topPages,
      deviceBreakdown,
      trafficSources
    };
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile':
        return <DevicePhoneMobileIcon className="h-4 w-4" />;
      case 'tablet':
        return <DevicePhoneMobileIcon className="h-4 w-4" />;
      default:
        return <ComputerDesktopIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'idle':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <EyeIcon className="h-6 w-6 text-red-500" />
          <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading User Activity</h3>
        </div>
        <p className="mt-2 text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">User Activity</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        >
          <option value="1h">1 Hour</option>
          <option value="24h">24 Hours</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
        </select>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.totalUsers}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.activeUsers}</div>
            <div className="text-sm text-green-500">Active Now</div>
          </div>
          <div className="bg-purple-50 rounded-lg border border-purple-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{metrics.newUsers}</div>
            <div className="text-sm text-purple-500">New Users</div>
          </div>
          <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{metrics.returningUsers}</div>
            <div className="text-sm text-indigo-500">Returning</div>
          </div>
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(metrics.averageSessionDuration)}s</div>
            <div className="text-sm text-orange-500">Avg Session</div>
          </div>
          <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{Math.round(metrics.bounceRate)}%</div>
            <div className="text-sm text-red-500">Bounce Rate</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sessions */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Active Sessions</h4>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading sessions...</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sessions.slice(0, 10).map((session) => (
                  <div key={session.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {session.userId ? `User ${session.userId}` : 'Anonymous'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 space-y-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <GlobeAltIcon className="h-3 w-3" />
                            <span>{session.currentPage}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPinIcon className="h-3 w-3" />
                            <span>{session.location.city}, {session.location.country}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-3 w-3" />
                            <span>{formatDuration(session.duration)}</span>
                          </div>
                          <div>Pages: {session.pageViews}</div>
                          <div>{session.browser}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="space-y-6">
          {/* Top Pages */}
          {metrics && (
            <div className="bg-white rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Top Pages</h4>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {metrics.topPages.map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{page.page}</div>
                        <div className="text-xs text-gray-500">{page.uniqueUsers} unique users</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">{page.views} views</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Device Breakdown */}
          {metrics && (
            <div className="bg-white rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Device Breakdown</h4>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ComputerDesktopIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Desktop</span>
                    </div>
                    <span className="text-sm font-semibold">{metrics.deviceBreakdown.desktop}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DevicePhoneMobileIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Mobile</span>
                    </div>
                    <span className="text-sm font-semibold">{metrics.deviceBreakdown.mobile}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DevicePhoneMobileIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Tablet</span>
                    </div>
                    <span className="text-sm font-semibold">{metrics.deviceBreakdown.tablet}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}