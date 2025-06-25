'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Eye, 
  Ban,
  Key,
  Activity,
  Globe,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  blockedAttempts: number;
  activeProtections: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ddosProtection: {
    active: boolean;
    mitigations: number;
    protectionLevel: string;
  };
  rateLimit: {
    totalRequests: number;
    blockedRequests: number;
    averageResponse: number;
  };
  apiSecurity: {
    totalKeys: number;
    activeKeys: number;
    suspiciousActivity: number;
  };
}

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceIp: string;
  userAgent?: string;
  userId?: string;
  apiKeyId?: string;
  blocked: boolean;
  resolved: boolean;
  createdAt: string;
  details?: any;
}

interface ThreatAnalysis {
  topThreats: Array<{ type: string; count: number; trend: number }>;
  topAttackers: Array<{ ip: string; attempts: number; blocked: boolean }>;
  geographicDistribution: Array<{ country: string; count: number; risk: string }>;
  timelineData: Array<{ time: string; events: number; threats: number }>;
}

const SecurityDashboard: React.FC = () => {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [threats, setThreats] = useState<ThreatAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    severity: 'ALL',
    type: 'ALL',
    timeRange: '24h',
  });
  const [realTimeMode, setRealTimeMode] = useState(false);

  useEffect(() => {
    loadSecurityData();
    
    // Set up real-time updates if enabled
    let interval: NodeJS.Timeout;
    if (realTimeMode) {
      interval = setInterval(loadSecurityData, 5000); // Update every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filter, realTimeMode]);

  const loadSecurityData = async () => {
    try {
      const [statsRes, eventsRes, threatsRes] = await Promise.all([
        fetch('/api/security/stats'),
        fetch(`/api/security/events?${new URLSearchParams(filter)}`),
        fetch('/api/security/threats'),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      
      if (eventsRes.ok) {
        setEvents(await eventsRes.json());
      }
      
      if (threatsRes.ok) {
        setThreats(await threatsRes.json());
      }
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportEvents = async () => {
    try {
      const response = await fetch('/api/security/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filter),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-events-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting events:', error);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'HIGH': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'MEDIUM': return <Eye className="w-4 h-4 text-yellow-500" />;
      case 'LOW': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Security Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time security monitoring and threat analysis
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setRealTimeMode(!realTimeMode)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  realTimeMode 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Activity className="w-4 h-4" />
                Real-time
              </button>
              <button
                onClick={handleExportEvents}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={loadSecurityData}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2 hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Threat Level</p>
                <div className={`px-3 py-1 rounded-full text-sm font-medium mt-2 inline-block ${
                  getThreatLevelColor(stats?.threatLevel || 'LOW')
                }`}>
                  {stats?.threatLevel || 'LOW'}
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Security Events</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.totalEvents.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  {stats?.criticalEvents || 0} critical
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Blocked Attempts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.blockedAttempts.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {stats?.rateLimit.blockedRequests || 0} rate limited
                </p>
              </div>
              <Ban className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Protections</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.activeProtections || 0}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  DDoS: {stats?.ddosProtection.active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Protection Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              DDoS Protection
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  stats?.ddosProtection.active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {stats?.ddosProtection.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Mitigations</span>
                <span className="text-sm font-medium">{stats?.ddosProtection.mitigations || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Protection Level</span>
                <span className="text-sm font-medium">{stats?.ddosProtection.protectionLevel || 'Normal'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Rate Limiting
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Requests</span>
                <span className="text-sm font-medium">
                  {stats?.rateLimit.totalRequests.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Blocked</span>
                <span className="text-sm font-medium text-red-600">
                  {stats?.rateLimit.blockedRequests.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Response</span>
                <span className="text-sm font-medium">{stats?.rateLimit.averageResponse || 0}ms</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-500" />
              API Security
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Keys</span>
                <span className="text-sm font-medium">{stats?.apiSecurity.totalKeys || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Keys</span>
                <span className="text-sm font-medium text-green-600">
                  {stats?.apiSecurity.activeKeys || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Suspicious Activity</span>
                <span className="text-sm font-medium text-orange-600">
                  {stats?.apiSecurity.suspiciousActivity || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Threat Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Threats</h3>
            <div className="space-y-3">
              {threats?.topThreats?.map((threat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{threat.type}</p>
                    <p className="text-sm text-gray-600">{threat.count} attempts</p>
                  </div>
                  <div className={`text-sm font-medium ${
                    threat.trend > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {threat.trend > 0 ? '↑' : '↓'} {Math.abs(threat.trend)}%
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No threat data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Attackers</h3>
            <div className="space-y-3">
              {threats?.topAttackers?.map((attacker, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900 font-mono">{attacker.ip}</p>
                    <p className="text-sm text-gray-600">{attacker.attempts} attempts</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    attacker.blocked 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {attacker.blocked ? 'Blocked' : 'Monitoring'}
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No attacker data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={filter.severity}
              onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="RATE_LIMIT_EXCEEDED">Rate Limit</option>
              <option value="SUSPICIOUS_ACTIVITY">Suspicious Activity</option>
              <option value="SQL_INJECTION_ATTEMPT">SQL Injection</option>
              <option value="XSS_ATTEMPT">XSS Attempt</option>
              <option value="DDOS_DETECTED">DDoS Attack</option>
            </select>

            <select
              value={filter.timeRange}
              onChange={(e) => setFilter(prev => ({ ...prev, timeRange: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Security Events Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Recent Security Events</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(event.severity)}
                        <div>
                          <p className="font-medium text-gray-900">{event.type}</p>
                          {event.details?.reason && (
                            <p className="text-sm text-gray-500">{event.details.reason}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-mono text-sm text-gray-900">{event.sourceIp}</p>
                        {event.userAgent && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {event.userAgent}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getThreatLevelColor(event.severity)
                      }`}>
                        {event.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {event.blocked && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                            Blocked
                          </span>
                        )}
                        {event.resolved && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            Resolved
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.createdAt).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {events.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No security events found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;